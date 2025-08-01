import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config/config';
import { User } from '../models';
import UserSession from '../models/UserSession';
import LoginAttempt from '../models/LoginAttempt';
import { AppError } from './errorHandler';
import logger from '../utils/logger';

export interface AuthRequest extends Request {
  user?: User;
  userId?: string;
  sessionId?: string;
  deviceFingerprint?: string;
}

interface TokenPayload {
  id: number;
  email: string;
  role: string;
  sessionId: string;
  deviceFingerprint: string;
  iat: number;
  exp: number;
}

interface RefreshTokenPayload {
  id: number;
  sessionId: string;
  type: 'refresh';
  iat: number;
  exp: number;
}

// Token blacklist for immediate revocation
const tokenBlacklist = new Set<string>();

/**
 * Generate device fingerprint from request
 */
function generateDeviceFingerprint(req: Request): string {
  const components = [
    req.ip,
    req.get('User-Agent') || '',
    req.get('Accept-Language') || '',
    req.get('Accept-Encoding') || '',
  ];
  
  return crypto
    .createHash('sha256')
    .update(components.join('|'))
    .digest('hex')
    .substring(0, 16);
}

/**
 * Generate secure access token
 */
export const generateToken = async (user: User, req: Request): Promise<{ token: string; sessionId: string }> => {
  const deviceFingerprint = generateDeviceFingerprint(req);
  
  // Create new session
  const session = await UserSession.create({
    userId: user.id,
    sessionToken: crypto.randomBytes(32).toString('hex'),
    deviceInfo: { fingerprint: deviceFingerprint },
    ipAddress: req.ip || 'unknown',
    userAgent: req.get('User-Agent') || '',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    isActive: true,
    lastActivity: new Date(),
  });

  const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
    id: user.id,
    email: user.email,
    role: user.role,
    sessionId: session.id.toString(),
    deviceFingerprint,
  };

  const token = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
    issuer: 'stratcap-api',
    audience: 'stratcap-app',
  } as jwt.SignOptions);

  return { token, sessionId: session.id.toString() };
};

/**
 * Generate secure refresh token
 */
export const generateRefreshToken = (userId: number, sessionId: string): string => {
  const payload: Omit<RefreshTokenPayload, 'iat' | 'exp'> = {
    id: userId,
    sessionId,
    type: 'refresh',
  };

  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
    issuer: 'stratcap-api',
    audience: 'stratcap-app',
  } as jwt.SignOptions);
};

/**
 * Validate and extract token from request
 */
function extractToken(req: Request): string | null {
  // Check Authorization header
  if (req.headers.authorization?.startsWith('Bearer ')) {
    return req.headers.authorization.split(' ')[1];
  }

  // Check cookies (for web app)
  if (req.cookies?.accessToken) {
    return req.cookies.accessToken;
  }

  return null;
}

/**
 * Check if token is blacklisted
 */
function isTokenBlacklisted(token: string): boolean {
  return tokenBlacklist.has(token);
}

/**
 * Add token to blacklist
 */
export function blacklistToken(token: string): void {
  tokenBlacklist.add(token);
  
  // Clean up expired tokens periodically
  if (tokenBlacklist.size > 10000) {
    setTimeout(() => {
      // In production, this would be handled by Redis with TTL
      tokenBlacklist.clear();
    }, 1000);
  }
}

/**
 * Log authentication attempt
 */
async function logAuthAttempt(
  email: string,
  success: boolean,
  req: Request,
  reason?: string
): Promise<void> {
  try {
    await LoginAttempt.create({
      email,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || '',
      success,
      failureReason: reason,
      deviceFingerprint: generateDeviceFingerprint(req),
    });
  } catch (error) {
    logger.error('Failed to log auth attempt:', error);
  }
}

/**
 * Check for suspicious login patterns
 */
async function checkSuspiciousActivity(email: string, req: Request): Promise<void> {
  const recentAttempts = await LoginAttempt.count({
    where: {
      email,
      createdAt: {
        [req.app.get('sequelize').Op.gte]: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes
      },
      success: false,
    },
  });

  if (recentAttempts >= 5) {
    await logAuthAttempt(email, false, req, 'Account locked due to suspicious activity');
    throw new AppError('Account temporarily locked due to suspicious activity', 423);
  }

  // Check for distributed attacks (same IP, different emails)
  const ipAttempts = await LoginAttempt.count({
    where: {
      ipAddress: req.ip,
      createdAt: {
        [req.app.get('sequelize').Op.gte]: new Date(Date.now() - 15 * 60 * 1000),
      },
      success: false,
    },
  });

  if (ipAttempts >= 10) {
    throw new AppError('Too many failed attempts from this IP address', 429);
  }
}

/**
 * Enhanced authentication middleware
 */
export const protect = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);

    if (!token) {
      throw new AppError('Access token is required', 401);
    }

    // Check if token is blacklisted
    if (isTokenBlacklisted(token)) {
      throw new AppError('Token has been revoked', 401);
    }

    // Verify and decode token
    const decoded = jwt.verify(token, config.jwt.secret, {
      issuer: 'stratcap-api',
      audience: 'stratcap-app',
    }) as TokenPayload;

    // Validate session
    const session = await UserSession.findOne({
      where: {
        id: decoded.sessionId,
        isActive: true,
      },
      include: [{ model: User, as: 'user' }],
    });

    if (!session) {
      throw new AppError('Session not found or expired', 401);
    }

    // Validate device fingerprint
    const currentFingerprint = generateDeviceFingerprint(req);
    if (decoded.deviceFingerprint !== currentFingerprint) {
      // Log suspicious activity
      logger.warn('Device fingerprint mismatch', {
        userId: decoded.id,
        sessionId: decoded.sessionId,
        expected: decoded.deviceFingerprint,
        actual: currentFingerprint,
        ip: req.ip,
      });

      // In strict mode, reject the request
      if (process.env.STRICT_DEVICE_VALIDATION === 'true') {
        throw new AppError('Device validation failed', 401);
      }
    }

    const user = session.user;
    if (!user) {
      throw new AppError('User not found', 401);
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AppError('Account has been deactivated', 401);
    }

    // Check password change timestamp
    if (user.passwordChangedAt && decoded.iat * 1000 < user.passwordChangedAt.getTime()) {
      throw new AppError('Password was changed after token was issued', 401);
    }

    // Update session activity
    await session.update({
      lastActivity: new Date(),
      ipAddress: req.ip,
    });

    // Set request properties
    req.user = user;
    req.userId = user.id.toString();
    req.sessionId = session.id.toString();
    req.deviceFingerprint = currentFingerprint;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token', 401));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AppError('Token has expired', 401));
    } else {
      next(error);
    }
  }
};

/**
 * Enhanced authorization middleware with granular permissions
 */
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!roles.includes(req.user.role)) {
      // Log unauthorized access attempt
      logger.warn('Unauthorized access attempt', {
        userId: req.user.id,
        role: req.user.role,
        requiredRoles: roles,
        endpoint: req.originalUrl,
        method: req.method,
        ip: req.ip,
      });

      return next(new AppError('Insufficient permissions', 403));
    }

    next();
  };
};

/**
 * Refresh token validation and new token generation
 */
export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      throw new AppError('Refresh token is required', 400);
    }

    // Verify refresh token
    const decoded = jwt.verify(token, config.jwt.refreshSecret, {
      issuer: 'stratcap-api',
      audience: 'stratcap-app',
    }) as RefreshTokenPayload;

    // Validate session
    const session = await UserSession.findOne({
      where: {
        id: decoded.sessionId,
        isActive: true,
      },
      include: [{ model: User, as: 'user' }],
    });

    if (!session || !session.user) {
      throw new AppError('Invalid refresh token', 401);
    }

    // Generate new tokens
    const { token: accessToken, sessionId } = await generateToken(session.user, req);
    const newRefreshToken = generateRefreshToken(session.user.id, sessionId);

    // Deactivate old session
    await session.update({ isActive: false });

    res.status(200).json({
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken,
        user: {
          id: session.user.id,
          email: session.user.email,
          role: session.user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout and session cleanup
 */
export const logout = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);

    if (token && req.sessionId) {
      // Blacklist the current token
      blacklistToken(token);

      // Deactivate session
      await UserSession.update(
        { isActive: false },
        { where: { id: req.sessionId } }
      );
    }

    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout from all devices
 */
export const logoutAll = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    // Deactivate all user sessions
    await UserSession.update(
      { isActive: false },
      { where: { userId: req.user.id, isActive: true } }
    );

    res.status(200).json({
      success: true,
      message: 'Logged out from all devices',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication (for public endpoints that can be enhanced if authenticated)
 */
export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);

    if (token && !isTokenBlacklisted(token)) {
      const decoded = jwt.verify(token, config.jwt.secret, {
        issuer: 'stratcap-api',
        audience: 'stratcap-app',
      }) as TokenPayload;

      const session = await UserSession.findOne({
        where: {
          id: decoded.sessionId,
          isActive: true,
        },
        include: [{ model: User, as: 'user' }],
      });

      if (session && session.user && session.user.isActive) {
        req.user = session.user;
        req.userId = session.user.id.toString();
        req.sessionId = session.id.toString();
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// Export additional utilities
export { logAuthAttempt, checkSuspiciousActivity };

// Backward compatibility aliases
export const auth = protect;
export const authenticateToken = protect;