import bcrypt from 'bcrypt';
import crypto from 'crypto';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { UserSession } from '../models/UserSession';
import { PasswordResetToken } from '../models/PasswordResetToken';
import { LoginAttempt } from '../models/LoginAttempt';
import NotificationService from './NotificationService';
import { Transaction } from 'sequelize';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';

export interface LoginRequest {
  email: string;
  password: string;
  mfaToken?: string;
  rememberMe?: boolean;
  deviceInfo?: {
    userAgent: string;
    ipAddress: string;
    deviceName?: string;
  };
}

export interface LoginResult {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  requiresMFA: boolean;
  session: UserSession;
}

export interface MFASetupResult {
  secret: string;
  qrCode: string;
  backupCodes: string[];
  setupUrl: string;
}

export interface PasswordResetRequest {
  email: string;
  resetUrl?: string;
}

export interface PasswordResetResult {
  success: boolean;
  message: string;
  expiresAt?: Date;
}

export interface SessionInfo {
  id: string;
  userId: number;
  deviceInfo: any;
  ipAddress: string;
  lastActivity: Date;
  expiresAt: Date;
  isActive: boolean;
  isCurrent: boolean;
}

export interface SecuritySettings {
  mfaEnabled: boolean;
  backupCodesRemaining: number;
  activeSessions: number;
  lastPasswordChange: Date;
  accountLocked: boolean;
  failedLoginAttempts: number;
}

export class EnhancedAuthService {
  private notificationService: NotificationService;
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  private readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret';
  private readonly ACCESS_TOKEN_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES || '15m';
  private readonly REFRESH_TOKEN_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES || '7d';
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes

  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * Enhanced login with MFA, device tracking, and security measures
   */
  async login(request: LoginRequest, transaction?: Transaction): Promise<LoginResult> {
    const { email, password, mfaToken, rememberMe, deviceInfo } = request;

    // Check for existing lockout
    await this.checkAccountLockout(email);

    // Find user
    const user = await User.findOne({ where: { email, isActive: true } });
    if (!user) {
      await this.recordFailedLogin(email, deviceInfo?.ipAddress);
      throw new AppError('Invalid credentials', 401);
    }

    // Validate password
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      await this.recordFailedLogin(email, deviceInfo?.ipAddress);
      throw new AppError('Invalid credentials', 401);
    }

    // Check if MFA is required
    if (user.mfaEnabled && !mfaToken) {
      return {
        user,
        accessToken: '',
        refreshToken: '',
        expiresIn: 0,
        requiresMFA: true,
        session: null as any,
      };
    }

    // Validate MFA if provided
    if (user.mfaEnabled && mfaToken) {
      const isValidMFA = await this.validateMFA(user, mfaToken);
      if (!isValidMFA) {
        await this.recordFailedLogin(email, deviceInfo?.ipAddress);
        throw new AppError('Invalid MFA token', 401);
      }
    }

    // Clear failed login attempts on successful login
    await this.clearFailedLoginAttempts(email);

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Create session
    const sessionDuration = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // 30 days or 1 day
    const expiresAt = new Date(Date.now() + sessionDuration);

    const session = await UserSession.create({
      userId: user.id,
      sessionToken: refreshToken,
      deviceInfo: deviceInfo || {},
      ipAddress: deviceInfo?.ipAddress || 'unknown',
      userAgent: deviceInfo?.userAgent || 'unknown',
      expiresAt,
      isActive: true,
      lastActivity: new Date(),
    }, { transaction });

    // Update user last login
    await user.update({ lastLogin: new Date() }, { transaction });

    // Send login notification
    await this.notificationService.sendNotification({
      type: 'login_success',
      title: 'Successful Login',
      message: `Login from ${deviceInfo?.deviceName || 'Unknown Device'}`,
      recipients: [user.id.toString()],
      metadata: {
        userId: user.id,
        ipAddress: deviceInfo?.ipAddress,
        userAgent: deviceInfo?.userAgent,
      },
    });

    const result: LoginResult = {
      user: this.sanitizeUser(user),
      accessToken,
      refreshToken,
      expiresIn: parseInt(this.ACCESS_TOKEN_EXPIRES.replace('m', '')) * 60,
      requiresMFA: false,
      session,
    };

    return result;
  }

  /**
   * Setup MFA for a user
   */
  async setupMFA(userId: number, transaction?: Transaction): Promise<MFASetupResult> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.mfaEnabled) {
      throw new AppError('MFA is already enabled for this user', 400);
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `StratCap (${user.email})`,
      issuer: 'StratCap Platform',
      length: 32,
    });

    // Generate QR code
    const qrCode = await qrcode.toDataURL(secret.otpauth_url!);

    // Generate backup codes
    const backupCodes = this.generateBackupCodes();

    // Store secret (temporarily, until user confirms)
    await user.update({
      mfaSecret: secret.base32,
      mfaBackupCodes: JSON.stringify(backupCodes.map(code => bcrypt.hashSync(code, 10))),
    }, { transaction });

    return {
      secret: secret.base32,
      qrCode,
      backupCodes,
      setupUrl: secret.otpauth_url!,
    };
  }

  /**
   * Verify and enable MFA
   */
  async enableMFA(userId: number, token: string, transaction?: Transaction): Promise<void> {
    const user = await User.findByPk(userId);
    if (!user || !user.mfaSecret) {
      throw new AppError('MFA setup not found', 400);
    }

    // Verify the token
    const isValid = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token,
      window: 2,
    });

    if (!isValid) {
      throw new AppError('Invalid MFA token', 400);
    }

    // Enable MFA
    await user.update({ mfaEnabled: true }, { transaction });

    // Send confirmation notification
    await this.notificationService.sendNotification({
      type: 'mfa_enabled',
      title: 'MFA Enabled',
      message: 'Multi-factor authentication has been enabled for your account',
      recipients: [user.id.toString()],
      metadata: { userId: user.id },
    });

    logger.info(`MFA enabled for user: ${user.email}`);
  }

  /**
   * Disable MFA
   */
  async disableMFA(userId: number, password: string, transaction?: Transaction): Promise<void> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Verify password
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      throw new AppError('Invalid password', 401);
    }

    // Disable MFA
    await user.update({
      mfaEnabled: false,
      mfaSecret: undefined,
      mfaBackupCodes: undefined,
    }, { transaction });

    // Send notification
    await this.notificationService.sendNotification({
      type: 'mfa_disabled',
      title: 'MFA Disabled',
      message: 'Multi-factor authentication has been disabled for your account',
      recipients: [user.id.toString()],
      metadata: { userId: user.id },
    });

    logger.info(`MFA disabled for user: ${user.email}`);
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(request: PasswordResetRequest, transaction?: Transaction): Promise<PasswordResetResult> {
    const { email, resetUrl } = request;

    const user = await User.findOne({ where: { email, isActive: true } });
    if (!user) {
      // Don't reveal if email exists
      return {
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      };
    }

    // Check if there's already a recent reset request
    const existingToken = await PasswordResetToken.findOne({
      where: {
        userId: user.id,
        used: false,
        expiresAt: { $gt: new Date() },
      },
    });

    if (existingToken) {
      // Don't allow too frequent requests
      const timeSinceLastRequest = Date.now() - existingToken.createdAt.getTime();
      if (timeSinceLastRequest < 5 * 60 * 1000) { // 5 minutes
        throw new AppError('Password reset already requested. Please check your email.', 429);
      }
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store reset token
    await PasswordResetToken.create({
      userId: user.id,
      token: hashedToken,
      expiresAt,
      used: false,
    }, { transaction });

    // Send reset email
    const resetLink = `${resetUrl || process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    await this.notificationService.sendNotification({
      type: 'password_reset',
      title: 'Password Reset Request',
      message: `Password reset requested for your account. Reset link: ${resetLink}`,
      recipients: [user.id.toString()],
      metadata: {
        userId: user.id,
        resetToken: resetToken, // Include in metadata for email template
        resetLink,
        expiresAt: expiresAt.toISOString(),
      },
    });

    logger.info(`Password reset requested for user: ${user.email}`);

    return {
      success: true,
      message: 'Password reset link has been sent to your email.',
      expiresAt,
    };
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string, transaction?: Transaction): Promise<void> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const resetToken = await PasswordResetToken.findOne({
      where: {
        token: hashedToken,
        used: false,
        expiresAt: { $gt: new Date() },
      },
      include: [{ model: User, as: 'user' }],
    });

    if (!resetToken) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    const user = resetToken.user;
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await user.update({ 
      password: hashedPassword,
      passwordChangedAt: new Date(),
    }, { transaction });

    // Mark token as used
    await resetToken.update({ used: true }, { transaction });

    // Invalidate all sessions for security
    await UserSession.update(
      { isActive: false },
      { where: { userId: user.id }, transaction }
    );

    // Send confirmation
    await this.notificationService.sendNotification({
      type: 'password_changed',
      title: 'Password Changed',
      message: 'Your password has been successfully changed',
      recipients: [user.id.toString()],
      metadata: { userId: user.id },
    });

    logger.info(`Password reset completed for user: ${user.email}`);
  }

  /**
   * Change password (when user is logged in)
   */
  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
    transaction?: Transaction
  ): Promise<void> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Verify current password
    const isValidPassword = await user.validatePassword(currentPassword);
    if (!isValidPassword) {
      throw new AppError('Current password is incorrect', 401);
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await user.update({ 
      password: hashedPassword,
      passwordChangedAt: new Date(),
    }, { transaction });

    // Send notification
    await this.notificationService.sendNotification({
      type: 'password_changed',
      title: 'Password Changed',
      message: 'Your password has been successfully changed',
      recipients: [user.id.toString()],
      metadata: { userId: user.id },
    });

    logger.info(`Password changed for user: ${user.email}`);
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string, transaction?: Transaction): Promise<Omit<LoginResult, 'requiresMFA'>> {
    const session = await UserSession.findOne({
      where: {
        sessionToken: refreshToken,
        isActive: true,
        expiresAt: { $gt: new Date() },
      },
      include: [{ model: User, as: 'user' }],
    });

    if (!session || !session.user || !session.user.isActive) {
      throw new AppError('Invalid refresh token', 401);
    }

    // Update session activity
    await session.update({ lastActivity: new Date() }, { transaction });

    // Generate new access token
    const accessToken = this.generateAccessToken(session.user);

    return {
      user: this.sanitizeUser(session.user),
      accessToken,
      refreshToken,
      expiresIn: parseInt(this.ACCESS_TOKEN_EXPIRES.replace('m', '')) * 60,
      session,
    };
  }

  /**
   * Logout and invalidate session
   */
  async logout(sessionToken: string, transaction?: Transaction): Promise<void> {
    await UserSession.update(
      { isActive: false },
      { where: { sessionToken }, transaction }
    );
  }

  /**
   * Logout from all devices
   */
  async logoutAll(userId: number, transaction?: Transaction): Promise<void> {
    await UserSession.update(
      { isActive: false },
      { where: { userId }, transaction }
    );
  }

  /**
   * Get user sessions
   */
  async getUserSessions(userId: number, currentSessionToken?: string): Promise<SessionInfo[]> {
    const sessions = await UserSession.findAll({
      where: {
        userId,
        isActive: true,
        expiresAt: { $gt: new Date() },
      },
      order: [['lastActivity', 'DESC']],
    });

    return sessions.map(session => ({
      id: session.id,
      userId: session.userId,
      deviceInfo: session.deviceInfo,
      ipAddress: session.ipAddress,
      lastActivity: session.lastActivity,
      expiresAt: session.expiresAt,
      isActive: session.isActive,
      isCurrent: session.sessionToken === currentSessionToken,
    }));
  }

  /**
   * Revoke specific session
   */
  async revokeSession(sessionId: string, userId: number, transaction?: Transaction): Promise<void> {
    await UserSession.update(
      { isActive: false },
      { 
        where: { 
          id: sessionId,
          userId,
        }, 
        transaction 
      }
    );
  }

  /**
   * Get security settings for user
   */
  async getSecuritySettings(userId: number): Promise<SecuritySettings> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const activeSessions = await UserSession.count({
      where: {
        userId,
        isActive: true,
        expiresAt: { $gt: new Date() },
      },
    });

    const recentFailedAttempts = await LoginAttempt.count({
      where: {
        email: user.email,
        success: false,
        createdAt: { $gt: new Date(Date.now() - this.LOCKOUT_DURATION) },
      },
    });

    let backupCodesRemaining = 0;
    if (user.mfaBackupCodes) {
      const backupCodes = JSON.parse(user.mfaBackupCodes);
      backupCodesRemaining = backupCodes.length;
    }

    return {
      mfaEnabled: user.mfaEnabled,
      backupCodesRemaining,
      activeSessions,
      lastPasswordChange: user.passwordChangedAt || user.createdAt,
      accountLocked: recentFailedAttempts >= this.MAX_LOGIN_ATTEMPTS,
      failedLoginAttempts: recentFailedAttempts,
    };
  }

  /**
   * Validate MFA token
   */
  private async validateMFA(user: User, token: string): Promise<boolean> {
    if (!user.mfaSecret) {
      return false;
    }

    // First try TOTP token
    const isValidTOTP = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token,
      window: 2,
    });

    if (isValidTOTP) {
      return true;
    }

    // If TOTP fails, try backup codes
    if (user.mfaBackupCodes) {
      const backupCodes = JSON.parse(user.mfaBackupCodes);
      for (let i = 0; i < backupCodes.length; i++) {
        const isValidBackup = await bcrypt.compare(token, backupCodes[i]);
        if (isValidBackup) {
          // Remove used backup code
          backupCodes.splice(i, 1);
          await user.update({ mfaBackupCodes: JSON.stringify(backupCodes) });
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Generate backup codes
   */
  private generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }

  /**
   * Generate access token
   */
  private generateAccessToken(user: User): string {
    return jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      this.JWT_SECRET,
      { expiresIn: this.ACCESS_TOKEN_EXPIRES } as jwt.SignOptions
    );
  }

  /**
   * Generate refresh token
   */
  private generateRefreshToken(user: User): string {
    return jwt.sign(
      { userId: user.id },
      this.JWT_REFRESH_SECRET,
      { expiresIn: this.REFRESH_TOKEN_EXPIRES } as jwt.SignOptions
    );
  }

  /**
   * Record failed login attempt
   */
  private async recordFailedLogin(email: string, ipAddress?: string): Promise<void> {
    await LoginAttempt.create({
      email,
      ipAddress: ipAddress || 'unknown',
      success: false,
    });
  }

  /**
   * Clear failed login attempts
   */
  private async clearFailedLoginAttempts(email: string): Promise<void> {
    await LoginAttempt.destroy({
      where: { email, success: false },
    });
  }

  /**
   * Check account lockout
   */
  private async checkAccountLockout(email: string): Promise<void> {
    const recentFailedAttempts = await LoginAttempt.count({
      where: {
        email,
        success: false,
        createdAt: { $gt: new Date(Date.now() - this.LOCKOUT_DURATION) },
      },
    });

    if (recentFailedAttempts >= this.MAX_LOGIN_ATTEMPTS) {
      throw new AppError('Account temporarily locked due to too many failed login attempts', 423);
    }
  }

  /**
   * Sanitize user data for response
   */
  private sanitizeUser(user: User): User {
    const userObj = user.toJSON();
    delete (userObj as any).password;
    delete (userObj as any).mfaSecret;
    delete (userObj as any).mfaBackupCodes;
    return userObj as User;
  }
}