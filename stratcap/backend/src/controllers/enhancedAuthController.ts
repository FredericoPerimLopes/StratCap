import { Request, Response } from 'express';
import { Transaction } from 'sequelize';
import { EnhancedAuthService, LoginRequest, PasswordResetRequest } from '../services/EnhancedAuthService';
import sequelize from '../db/database';
import { AppError } from '../middleware/errorHandler';

export class EnhancedAuthController {
  private authService: EnhancedAuthService;

  constructor() {
    this.authService = new EnhancedAuthService();
  }

  /**
   * Enhanced login with MFA and device tracking
   */
  login = async (req: Request, res: Response): Promise<void> => {
    const transaction: Transaction = await sequelize.transaction();
    
    try {
      const loginRequest: LoginRequest = {
        email: req.body.email,
        password: req.body.password,
        mfaToken: req.body.mfaToken,
        rememberMe: req.body.rememberMe || false,
        deviceInfo: {
          userAgent: req.headers['user-agent'] || 'unknown',
          ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
          deviceName: req.body.deviceName,
        },
      };

      const result = await this.authService.login(loginRequest, transaction);
      
      await transaction.commit();

      // Set refresh token as HTTP-only cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
          expiresIn: result.expiresIn,
          requiresMFA: result.requiresMFA,
          sessionId: result.session?.id,
        },
        message: result.requiresMFA ? 'MFA token required' : 'Login successful',
      });
    } catch (error) {
      await transaction.rollback();
      
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  };

  /**
   * Setup MFA for user
   */
  setupMFA = async (req: Request, res: Response): Promise<void> => {
    const transaction: Transaction = await sequelize.transaction();
    
    try {
      const userId = req.user.id;
      const mfaSetup = await this.authService.setupMFA(userId, transaction);
      
      await transaction.commit();
      
      res.json({
        success: true,
        data: mfaSetup,
        message: 'MFA setup initiated. Please scan the QR code and verify with a token.',
      });
    } catch (error) {
      await transaction.rollback();
      
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  };

  /**
   * Enable MFA after verification
   */
  enableMFA = async (req: Request, res: Response): Promise<void> => {
    const transaction: Transaction = await sequelize.transaction();
    
    try {
      const userId = req.user.id;
      const { token } = req.body;

      if (!token) {
        throw new AppError('MFA token is required', 400);
      }

      await this.authService.enableMFA(userId, token, transaction);
      
      await transaction.commit();
      
      res.json({
        success: true,
        message: 'MFA has been successfully enabled for your account',
      });
    } catch (error) {
      await transaction.rollback();
      
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  };

  /**
   * Disable MFA
   */
  disableMFA = async (req: Request, res: Response): Promise<void> => {
    const transaction: Transaction = await sequelize.transaction();
    
    try {
      const userId = req.user.id;
      const { password } = req.body;

      if (!password) {
        throw new AppError('Password is required to disable MFA', 400);
      }

      await this.authService.disableMFA(userId, password, transaction);
      
      await transaction.commit();
      
      res.json({
        success: true,
        message: 'MFA has been successfully disabled for your account',
      });
    } catch (error) {
      await transaction.rollback();
      
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  };

  /**
   * Request password reset
   */
  requestPasswordReset = async (req: Request, res: Response): Promise<void> => {
    const transaction: Transaction = await sequelize.transaction();
    
    try {
      const resetRequest: PasswordResetRequest = {
        email: req.body.email,
        resetUrl: req.body.resetUrl,
      };

      const result = await this.authService.requestPasswordReset(resetRequest, transaction);
      
      await transaction.commit();
      
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      await transaction.rollback();
      
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  };

  /**
   * Reset password with token
   */
  resetPassword = async (req: Request, res: Response): Promise<void> => {
    const transaction: Transaction = await sequelize.transaction();
    
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        throw new AppError('Token and new password are required', 400);
      }

      await this.authService.resetPassword(token, password, transaction);
      
      await transaction.commit();
      
      res.json({
        success: true,
        message: 'Password has been successfully reset',
      });
    } catch (error) {
      await transaction.rollback();
      
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  };

  /**
   * Change password (authenticated user)
   */
  changePassword = async (req: Request, res: Response): Promise<void> => {
    const transaction: Transaction = await sequelize.transaction();
    
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        throw new AppError('Current password and new password are required', 400);
      }

      await this.authService.changePassword(userId, currentPassword, newPassword, transaction);
      
      await transaction.commit();
      
      res.json({
        success: true,
        message: 'Password has been successfully changed',
      });
    } catch (error) {
      await transaction.rollback();
      
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  };

  /**
   * Refresh access token
   */
  refreshToken = async (req: Request, res: Response): Promise<void> => {
    const transaction: Transaction = await sequelize.transaction();
    
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        throw new AppError('Refresh token is required', 401);
      }

      const result = await this.authService.refreshToken(refreshToken, transaction);
      
      await transaction.commit();
      
      res.json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
          expiresIn: result.expiresIn,
        },
      });
    } catch (error) {
      await transaction.rollback();
      
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  };

  /**
   * Logout from current session
   */
  logout = async (req: Request, res: Response): Promise<void> => {
    const transaction: Transaction = await sequelize.transaction();
    
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

      if (refreshToken) {
        await this.authService.logout(refreshToken, transaction);
      }
      
      await transaction.commit();

      // Clear refresh token cookie
      res.clearCookie('refreshToken');
      
      res.json({
        success: true,
        message: 'Successfully logged out',
      });
    } catch (error) {
      await transaction.rollback();
      
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };

  /**
   * Logout from all devices
   */
  logoutAll = async (req: Request, res: Response): Promise<void> => {
    const transaction: Transaction = await sequelize.transaction();
    
    try {
      const userId = req.user.id;
      await this.authService.logoutAll(userId, transaction);
      
      await transaction.commit();

      // Clear refresh token cookie
      res.clearCookie('refreshToken');
      
      res.json({
        success: true,
        message: 'Successfully logged out from all devices',
      });
    } catch (error) {
      await transaction.rollback();
      
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };

  /**
   * Get user sessions
   */
  getSessions = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      const currentSessionToken = req.cookies.refreshToken;
      
      const sessions = await this.authService.getUserSessions(userId, currentSessionToken);
      
      res.json({
        success: true,
        data: sessions,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };

  /**
   * Revoke specific session
   */
  revokeSession = async (req: Request, res: Response): Promise<void> => {
    const transaction: Transaction = await sequelize.transaction();
    
    try {
      const userId = req.user.id;
      const sessionId = req.params.sessionId;

      if (!sessionId) {
        throw new AppError('Session ID is required', 400);
      }

      await this.authService.revokeSession(sessionId, userId, transaction);
      
      await transaction.commit();
      
      res.json({
        success: true,
        message: 'Session has been revoked',
      });
    } catch (error) {
      await transaction.rollback();
      
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  };

  /**
   * Get security settings
   */
  getSecuritySettings = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      const settings = await this.authService.getSecuritySettings(userId);
      
      res.json({
        success: true,
        data: settings,
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  };

  /**
   * Validate current session
   */
  validateSession = async (req: Request, res: Response): Promise<void> => {
    try {
      res.json({
        success: true,
        data: {
          user: req.user,
          isAuthenticated: true,
        },
        message: 'Session is valid',
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Invalid session',
      });
    }
  };
}