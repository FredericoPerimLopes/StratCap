import bcrypt from 'bcrypt';
import crypto from 'crypto';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { User } from '../models';
import { AppError } from '../middleware/errorHandler';
import { generateToken, generateRefreshToken } from '../middleware/auth';
import logger from '../utils/logger';

interface LoginResult {
  user: User;
  token: string;
  refreshToken: string;
}

interface MFASetupResult {
  secret: string;
  qrCode: string;
}

export class AuthService {
  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: string;
  }): Promise<User> {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ where: { email: data.email } });
      if (existingUser) {
        throw new AppError('User with this email already exists', 400);
      }

      // Create new user
      const user = await User.create({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role as any || 'viewer',
      });

      // Remove password from response
      user.password = undefined as any;

      logger.info(`New user registered: ${user.email}`);
      return user;
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  async login(email: string, password: string, mfaToken?: string): Promise<LoginResult> {
    try {
      // Find user with password
      const user = await User.findOne({
        where: { email },
      });

      if (!user || !(await user.validatePassword(password))) {
        throw new AppError('Invalid email or password', 401);
      }

      if (!user.isActive) {
        throw new AppError('Your account has been deactivated', 401);
      }

      // Check MFA if enabled
      if (user.mfaEnabled) {
        if (!mfaToken) {
          throw new AppError('MFA token required', 401);
        }

        const verified = speakeasy.totp.verify({
          secret: user.mfaSecret!,
          encoding: 'base32',
          token: mfaToken,
          window: 2,
        });

        if (!verified) {
          throw new AppError('Invalid MFA token', 401);
        }
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate tokens
      const token = generateToken(user);
      const refreshToken = generateRefreshToken(user);

      // Remove sensitive data
      user.password = undefined as any;
      user.mfaSecret = undefined;

      logger.info(`User logged in: ${user.email}`);
      return { user, token, refreshToken };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  async refreshToken(refreshToken: string): Promise<LoginResult> {
    try {
      const jwt = require('jsonwebtoken');
      const config = require('../config/config').config;

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as {
        id: number;
        type: string;
      };

      if (decoded.type !== 'refresh') {
        throw new AppError('Invalid token type', 401);
      }

      // Find user
      const user = await User.findByPk(decoded.id);
      if (!user || !user.isActive) {
        throw new AppError('User not found or inactive', 401);
      }

      // Generate new tokens
      const token = generateToken(user);
      const newRefreshToken = generateRefreshToken(user);

      // Remove sensitive data
      user.password = undefined as any;
      user.mfaSecret = undefined;

      return { user, token, refreshToken: newRefreshToken };
    } catch (error) {
      logger.error('Token refresh error:', error);
      throw new AppError('Invalid refresh token', 401);
    }
  }

  async setupMFA(userId: number): Promise<MFASetupResult> {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Generate secret
      const secret = speakeasy.generateSecret({
        name: `StratCap (${user.email})`,
      });

      // Save secret to user
      user.mfaSecret = secret.base32;
      await user.save();

      // Generate QR code
      const qrCode = await qrcode.toDataURL(secret.otpauth_url!);

      return {
        secret: secret.base32,
        qrCode,
      };
    } catch (error) {
      logger.error('MFA setup error:', error);
      throw error;
    }
  }

  async verifyMFA(userId: number, token: string): Promise<boolean> {
    try {
      const user = await User.findByPk(userId);
      if (!user || !user.mfaSecret) {
        throw new AppError('MFA not set up for this user', 400);
      }

      const verified = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: 'base32',
        token,
        window: 2,
      });

      if (verified) {
        user.mfaEnabled = true;
        await user.save();
        return true;
      }

      return false;
    } catch (error) {
      logger.error('MFA verification error:', error);
      throw error;
    }
  }

  async disableMFA(userId: number): Promise<void> {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      user.mfaEnabled = false;
      user.mfaSecret = undefined;
      await user.save();

      logger.info(`MFA disabled for user: ${user.email}`);
    } catch (error) {
      logger.error('MFA disable error:', error);
      throw error;
    }
  }

  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Validate current password
      if (!(await bcrypt.compare(currentPassword, user.password))) {
        throw new AppError('Current password is incorrect', 401);
      }

      // Update password
      user.password = newPassword;
      await user.save();

      logger.info(`Password changed for user: ${user.email}`);
    } catch (error) {
      logger.error('Password change error:', error);
      throw error;
    }
  }

  async requestPasswordReset(email: string): Promise<string> {
    try {
      const user = await User.findOne({ where: { email } });
      if (!user) {
        // Don't reveal if user exists
        return 'If an account exists with this email, a password reset link has been sent.';
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

      // Save token and expiry
      user.passwordResetToken = hashedToken;
      user.passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour
      await user.save();

      logger.info(`Password reset requested for: ${user.email}`);
      
      // In production, send email with reset link
      // For now, return the token (in production, this would be sent via email)
      return resetToken;
    } catch (error) {
      logger.error('Password reset request error:', error);
      throw error;
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      // Hash the token
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      // Find user with valid token
      const user = await User.findOne({
        where: {
          passwordResetToken: hashedToken,
        },
      });

      if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
        throw new AppError('Invalid or expired reset token', 400);
      }

      // Update password
      user.password = newPassword;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      logger.info(`Password reset completed for: ${user.email}`);
    } catch (error) {
      logger.error('Password reset error:', error);
      throw error;
    }
  }
}

export default new AuthService();