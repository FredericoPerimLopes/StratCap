import { Router } from 'express';
import { EnhancedAuthController } from '../controllers/enhancedAuthController';
import { protect } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimiter';

const router = Router();
const authController = new EnhancedAuthController();

// Rate limiting for sensitive endpoints
const strictRateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many attempts, please try again later',
});

const moderateRateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: 'Too many attempts, please try again later',
});

// Public routes (no authentication required)
router.post('/login', strictRateLimit, authController.login);
router.post('/refresh-token', moderateRateLimit, authController.refreshToken);
router.post('/request-password-reset', strictRateLimit, authController.requestPasswordReset);
router.post('/reset-password', strictRateLimit, authController.resetPassword);

// Protected routes (authentication required)
router.use(protect);

// Session management
router.post('/logout', authController.logout);
router.post('/logout-all', authController.logoutAll);
router.get('/sessions', authController.getSessions);
router.delete('/sessions/:sessionId', authController.revokeSession);
router.get('/validate-session', authController.validateSession);

// Password management
router.post('/change-password', strictRateLimit, authController.changePassword);

// MFA management
router.post('/mfa/setup', authController.setupMFA);
router.post('/mfa/enable', authController.enableMFA);
router.post('/mfa/disable', strictRateLimit, authController.disableMFA);

// Security settings
router.get('/security', authController.getSecuritySettings);

export default router;