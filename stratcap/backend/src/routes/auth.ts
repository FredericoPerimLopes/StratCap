import { Router } from 'express';
import authController from '../controllers/authController';
import { protect } from '../middleware/auth';
import { validate, schemas } from '../middleware/validation';

const router = Router();

// Public routes
router.post('/register', validate(schemas.register), authController.register);
router.post('/login', validate(schemas.login), authController.login);
router.post('/logout', authController.logout);
router.post('/refresh-token', authController.refreshToken);
router.post('/password/forgot', authController.requestPasswordReset);
router.post('/password/reset', validate(schemas.resetPassword), authController.resetPassword);

// Protected routes
router.use(protect); // All routes below require authentication

router.get('/profile', authController.getProfile);
router.patch('/profile', authController.updateProfile);
router.post('/password/change', validate(schemas.changePassword), authController.changePassword);

// MFA routes
router.post('/mfa/setup', authController.setupMFA);
router.post('/mfa/verify', authController.verifyMFA);
router.post('/mfa/disable', authController.disableMFA);

export default router;