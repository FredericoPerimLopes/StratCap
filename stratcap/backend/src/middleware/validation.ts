import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AppError } from './errorHandler';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
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
  return (req: Request, _res: Response, next: NextFunction): void => {
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
  return (req: Request, _res: Response, next: NextFunction): void => {
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

  // Update schemas
  updateFund: Joi.object({
    name: Joi.string(),
    code: Joi.string(),
    type: Joi.string().valid('master', 'feeder', 'parallel', 'subsidiary'),
    vintage: Joi.number().integer().min(1900).max(2100),
    targetSize: Joi.string(),
    hardCap: Joi.string(),
    managementFeeRate: Joi.string(),
    carriedInterestRate: Joi.string(),
    preferredReturnRate: Joi.string(),
    investmentPeriodEnd: Joi.date(),
    termEnd: Joi.date(),
    extensionPeriods: Joi.number().integer().min(0),
    extensionLength: Joi.number().integer().min(0),
    currency: Joi.string().length(3),
    status: Joi.string().valid('fundraising', 'investing', 'harvesting', 'closed'),
    settings: Joi.object(),
  }),

  updateInvestor: Joi.object({
    name: Joi.string(),
    legalName: Joi.string(),
    type: Joi.string().valid('individual', 'institution', 'fund', 'trust', 'other'),
    entityType: Joi.string(),
    taxId: Joi.string(),
    registrationNumber: Joi.string(),
    domicile: Joi.string().length(2),
    taxResidence: Joi.string().length(2),
    accreditedInvestor: Joi.boolean(),
    qualifiedPurchaser: Joi.boolean(),
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

  updateCommitment: Joi.object({
    commitmentAmount: Joi.string(),
    commitmentDate: Joi.date(),
    closingId: Joi.number().integer().positive(),
    status: Joi.string().valid('pending', 'active', 'suspended', 'terminated'),
    sideLetterTerms: Joi.object(),
    feeOverrides: Joi.object(),
    notes: Joi.string(),
    metadata: Joi.object(),
  }),

  // Status update schemas
  updateStatus: Joi.object({
    status: Joi.string().required(),
    reason: Joi.string()
  }),

  updateKycStatus: Joi.object({
    kycStatus: Joi.string().valid('pending', 'approved', 'rejected', 'expired').required(),
    kycDate: Joi.date()
  }),

  updateAmlStatus: Joi.object({
    amlStatus: Joi.string().valid('pending', 'approved', 'rejected', 'expired').required(),
    amlDate: Joi.date()
  }),

  // Waterfall calculation schemas
  waterfallCalculation: Joi.object({
    fundId: Joi.number().integer().positive().required(),
    distributionAmount: Joi.string().pattern(/^\d+(\.\d{1,10})?$/).required(),
    distributionDate: Joi.date().iso().required(),
    calculationType: Joi.string().valid('distribution', 'hypothetical', 'irr_analysis').default('distribution'),
    capitalActivityId: Joi.number().integer().positive().optional(),
    customTiers: Joi.array().items(Joi.object({
      level: Joi.number().integer().positive().required(),
      name: Joi.string().required(),
      type: Joi.string().valid('preferred_return', 'catch_up', 'carried_interest', 'promote', 'distribution').required(),
      lpAllocation: Joi.string().pattern(/^\d+(\.\d{1,4})?$/).required(),
      gpAllocation: Joi.string().pattern(/^\d+(\.\d{1,4})?$/).required(),
      threshold: Joi.string().pattern(/^\d+(\.\d{1,10})?$/).optional(),
      target: Joi.string().pattern(/^\d+(\.\d{1,10})?$/).optional(),
    })).optional(),
  }),

  hypotheticalScenarios: Joi.object({
    fundId: Joi.number().integer().positive().required(),
    scenarios: Joi.array().items(Joi.object({
      distributionAmount: Joi.string().pattern(/^\d+(\.\d{1,10})?$/).required(),
      date: Joi.date().iso().required(),
    })).min(1).max(10).required(),
  }),

  preferredReturnCalculation: Joi.object({
    capitalBase: Joi.string().pattern(/^\d+(\.\d{1,10})?$/).required(),
    annualRate: Joi.string().pattern(/^\d+(\.\d{1,4})?$/).required(),
    daysSinceContribution: Joi.number().integer().min(0).required(),
    previousPreferredPaid: Joi.string().pattern(/^\d+(\.\d{1,10})?$/).default('0'),
    availableAmount: Joi.string().pattern(/^\d+(\.\d{1,10})?$/).required(),
  }),

  carriedInterestCalculation: Joi.object({
    distributionAmount: Joi.string().pattern(/^\d+(\.\d{1,10})?$/).required(),
    carriedInterestRate: Joi.string().pattern(/^\d+(\.\d{1,4})?$/).required(),
    totalReturned: Joi.string().pattern(/^\d+(\.\d{1,10})?$/).required(),
    totalContributions: Joi.string().pattern(/^\d+(\.\d{1,10})?$/).required(),
    hurdleRate: Joi.string().pattern(/^\d+(\.\d{1,4})?$/).optional(),
    previousCarriedPaid: Joi.string().pattern(/^\d+(\.\d{1,10})?$/).optional(),
  }),

  distributionEventStatusUpdate: Joi.object({
    status: Joi.string().valid('pending', 'processed', 'paid', 'failed').required(),
    paymentDate: Joi.date().iso().optional(),
    paymentReference: Joi.string().optional(),
    notes: Joi.string().optional(),
  }),

  calculationApproval: Joi.object({
    approvalNotes: Joi.string().optional(),
  }),
};

// Waterfall-specific validation functions
export const validateWaterfallCalculation = validate(schemas.waterfallCalculation);
export const validateHypotheticalScenarios = validate(schemas.hypotheticalScenarios);
export const validatePreferredReturnCalculation = validate(schemas.preferredReturnCalculation);
export const validateCarriedInterestCalculation = validate(schemas.carriedInterestCalculation);
export const validateDistributionEventStatusUpdate = validate(schemas.distributionEventStatusUpdate);
export const validateCalculationApproval = validate(schemas.calculationApproval);