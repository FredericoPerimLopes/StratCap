import { Router } from 'express';
import fundFamilyController from '../controllers/fundFamilyController';
import { protect, authorize } from '../middleware/auth';
import { validate, validateParams, schemas } from '../middleware/validation';

const router = Router();

// All routes require authentication
router.use(protect);

// Fund family routes
router.post(
  '/',
  authorize('admin', 'manager'),
  validate(schemas.createFundFamily),
  fundFamilyController.create
);

router.get('/', fundFamilyController.getAll);

router.get(
  '/:id',
  validateParams(schemas.id),
  fundFamilyController.getById
);

router.get(
  '/:id/summary',
  validateParams(schemas.id),
  fundFamilyController.getSummary
);

router.patch(
  '/:id',
  authorize('admin', 'manager'),
  validateParams(schemas.id),
  fundFamilyController.update
);

router.delete(
  '/:id',
  authorize('admin'),
  validateParams(schemas.id),
  fundFamilyController.delete
);

// User management for fund family
router.post(
  '/:id/users',
  authorize('admin', 'manager'),
  validateParams(schemas.id),
  fundFamilyController.addUser
);

router.delete(
  '/:id/users/:userId',
  authorize('admin', 'manager'),
  fundFamilyController.removeUser
);

export default router;