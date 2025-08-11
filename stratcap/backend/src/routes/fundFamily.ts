import { Router } from 'express';
import fundFamilyController from '../controllers/fundFamilyController';
import { validate, validateParams, schemas } from '../middleware/validation';

const router = Router();

// Fund family routes
router.post(
  '/',
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
  validateParams(schemas.id),
  fundFamilyController.update
);

router.delete(
  '/:id',
  validateParams(schemas.id),
  fundFamilyController.delete
);

// User management for fund family
router.post(
  '/:id/users',
  validateParams(schemas.id),
  fundFamilyController.addUser
);

router.delete(
  '/:id/users/:userId',
  fundFamilyController.removeUser
);

export default router;