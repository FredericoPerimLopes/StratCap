import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AppError } from './errorHandler';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(', ');
      return next(new AppError(errorMessage, 400));
    }

    next();
  };
};

export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.params, {
      abortEarly: false,
    });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(', ');
      return next(new AppError(errorMessage, 400));
    }

    next();
  };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.query, {
      abortEarly: false,
    });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(', ');
      return next(new AppError(errorMessage, 400));
    }

    next();
  };
};

// Common validation schemas
export const schemas = {
  // Auth schemas
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    role: Joi.string().valid('admin', 'manager', 'analyst', 'viewer'),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).required(),
  }),

  resetPassword: Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(8).required(),
  }),

  // Common schemas
  id: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),

  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string(),
    order: Joi.string().valid('asc', 'desc').default('asc'),
  }),

  // Fund schemas
  createFundFamily: Joi.object({
    name: Joi.string().required(),
    code: Joi.string().required(),
    description: Joi.string(),
    managementCompany: Joi.string().required(),
    primaryCurrency: Joi.string().length(3).default('USD'),
    fiscalYearEnd: Joi.string().pattern(/^\d{2}-\d{2}$/).default('12-31'),
    settings: Joi.object(),
  }),

  createFund: Joi.object({
    fundFamilyId: Joi.number().integer().positive().required(),
    name: Joi.string().required(),
    code: Joi.string().required(),
    type: Joi.string().valid('master', 'feeder', 'parallel', 'subsidiary').required(),
    vintage: Joi.number().integer().min(1900).max(2100).required(),
    targetSize: Joi.string().required(),
    hardCap: Joi.string(),
    managementFeeRate: Joi.string().required(),
    carriedInterestRate: Joi.string().required(),
    preferredReturnRate: Joi.string().required(),
    investmentPeriodEnd: Joi.date(),
    termEnd: Joi.date(),
    extensionPeriods: Joi.number().integer().min(0),
    extensionLength: Joi.number().integer().min(0),
    currency: Joi.string().length(3).default('USD'),
    settings: Joi.object(),
  }),

  // Investor schemas
  createInvestor: Joi.object({
    name: Joi.string().required(),
    legalName: Joi.string().required(),
    type: Joi.string().valid('individual', 'institution', 'fund', 'trust', 'other').required(),
    entityType: Joi.string(),
    taxId: Joi.string(),
    registrationNumber: Joi.string(),
    domicile: Joi.string().length(2).required(),
    taxResidence: Joi.string().length(2),
    accreditedInvestor: Joi.boolean().default(false),
    qualifiedPurchaser: Joi.boolean().default(false),
    address: Joi.string(),
    city: Joi.string(),
    state: Joi.string(),
    postalCode: Joi.string(),
    country: Joi.string(),
    primaryContact: Joi.string(),
    primaryEmail: Joi.string().email(),
    primaryPhone: Joi.string(),
    notes: Joi.string(),
    metadata: Joi.object(),
  }),

  // Commitment schemas
  createCommitment: Joi.object({
    fundId: Joi.number().integer().positive().required(),
    investorEntityId: Joi.number().integer().positive().required(),
    investorClassId: Joi.number().integer().positive().required(),
    commitmentAmount: Joi.string().required(),
    commitmentDate: Joi.date().required(),
    closingId: Joi.number().integer().positive(),
    sideLetterTerms: Joi.object(),
    feeOverrides: Joi.object(),
    notes: Joi.string(),
    metadata: Joi.object(),
  }),

  // Capital Activity schemas
  createCapitalActivity: Joi.object({
    fundId: Joi.number().integer().positive().required(),
    eventType: Joi.string().valid('capital_call', 'distribution', 'equalization', 'reallocation').required(),
    eventNumber: Joi.string().required(),
    eventDate: Joi.date().required(),
    dueDate: Joi.date(),
    description: Joi.string().required(),
    totalAmount: Joi.string().required(),
    baseAmount: Joi.string(),
    feeAmount: Joi.string(),
    expenseAmount: Joi.string(),
    currency: Joi.string().length(3).default('USD'),
    purpose: Joi.string(),
    notices: Joi.object(),
    calculations: Joi.object(),
    notes: Joi.string(),
    metadata: Joi.object(),
  }),
};