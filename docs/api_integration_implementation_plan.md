# API Integration Implementation Plan

## Overview
This document provides detailed implementation plans to fix the identified backend-frontend API integration issues in StratCap.

## Critical Priority Implementations

### 1. Create Missing Commitment Routes

**File**: `/stratcap/backend/src/routes/commitment.ts`

```typescript
import { Router } from 'express';
import commitmentController from '../controllers/CommitmentController';
import { protect } from '../middleware/auth';
import { validate, validateParams, validateQuery, schemas } from '../middleware/validation';
import Joi from 'joi';

const router = Router();

// All routes require authentication
router.use(protect);

// Validation schemas
const commitmentSchemas = {
  createCommitment: Joi.object({
    fundId: Joi.number().integer().positive().required(),
    investorId: Joi.number().integer().positive().required(),
    commitmentAmount: Joi.string().required(),
    currency: Joi.string().length(3).default('USD'),
    commitmentDate: Joi.date().required(),
    effectiveDate: Joi.date(),
    expirationDate: Joi.date(),
    status: Joi.string().valid('pending', 'active', 'suspended', 'terminated').default('pending'),
    investmentClass: Joi.string(),
    managementFeeRate: Joi.string(),
    carriedInterestRate: Joi.string(),
    preferredReturnRate: Joi.string(),
    commitment_type: Joi.string().valid('primary', 'secondary', 'co_investment').default('primary'),
    notes: Joi.string()
  })
};

// CRUD operations
router.post('/', validate(commitmentSchemas.createCommitment), commitmentController.createCommitment);
router.get('/', validateQuery(schemas.pagination), commitmentController.getCommitments);
router.get('/:id', validateParams(schemas.id), commitmentController.getCommitmentById);
router.patch('/:id', validateParams(schemas.id), commitmentController.updateCommitment);
router.delete('/:id', validateParams(schemas.id), commitmentController.deleteCommitment);

export default router;
```

**File**: `/stratcap/backend/src/controllers/CommitmentController.ts`

```typescript
import { Request, Response } from 'express';
import { Commitment } from '../models/Commitment';
import { apiResponse, handleError } from '../utils/apiHelpers';

class CommitmentController {
  async createCommitment(req: Request, res: Response): Promise<void> {
    try {
      const commitment = await Commitment.create(req.body);
      res.status(201).json(apiResponse(commitment, 'Commitment created successfully'));
    } catch (error) {
      handleError(res, error, 'Failed to create commitment');
    }
  }

  async getCommitments(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 20, fundId, investorId } = req.query;
      
      const where: any = {};
      if (fundId) where.fundId = fundId;
      if (investorId) where.investorId = investorId;

      const commitments = await Commitment.findAndCountAll({
        where,
        limit: Number(limit),
        offset: (Number(page) - 1) * Number(limit),
        include: ['fund', 'investor']
      });

      const pagination = {
        total: commitments.count,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(commitments.count / Number(limit))
      };

      res.json(apiResponse(commitments.rows, 'Commitments retrieved successfully', pagination));
    } catch (error) {
      handleError(res, error, 'Failed to retrieve commitments');
    }
  }

  async getCommitmentById(req: Request, res: Response): Promise<void> {
    try {
      const commitment = await Commitment.findByPk(req.params.id, {
        include: ['fund', 'investor', 'transactions']
      });

      if (!commitment) {
        res.status(404).json(apiResponse(null, 'Commitment not found'));
        return;
      }

      res.json(apiResponse(commitment, 'Commitment retrieved successfully'));
    } catch (error) {
      handleError(res, error, 'Failed to retrieve commitment');
    }
  }

  async updateCommitment(req: Request, res: Response): Promise<void> {
    try {
      const [updatedRows] = await Commitment.update(req.body, {
        where: { id: req.params.id }
      });

      if (updatedRows === 0) {
        res.status(404).json(apiResponse(null, 'Commitment not found'));
        return;
      }

      const commitment = await Commitment.findByPk(req.params.id);
      res.json(apiResponse(commitment, 'Commitment updated successfully'));
    } catch (error) {
      handleError(res, error, 'Failed to update commitment');
    }
  }

  async deleteCommitment(req: Request, res: Response): Promise<void> {
    try {
      const deletedRows = await Commitment.destroy({
        where: { id: req.params.id }
      });

      if (deletedRows === 0) {
        res.status(404).json(apiResponse(null, 'Commitment not found'));
        return;
      }

      res.json(apiResponse(null, 'Commitment deleted successfully'));
    } catch (error) {
      handleError(res, error, 'Failed to delete commitment');
    }
  }
}

export default new CommitmentController();
```

### 2. Add Missing Investor Endpoints

**File**: `/stratcap/backend/src/routes/investor.ts` (Add to existing file)

```typescript
// Add this route after existing routes
router.get('/fund/:fundId', 
  validateParams(schemas.id.rename('id', 'fundId')), 
  investorController.getInvestorsByFund
);
```

**File**: `/stratcap/backend/src/controllers/InvestorController.ts` (Add method)

```typescript
// Add this method to existing InvestorController class
async getInvestorsByFund(req: Request, res: Response): Promise<void> {
  try {
    const { fundId } = req.params;
    
    const investors = await InvestorEntity.findAll({
      include: [{
        model: Commitment,
        where: { fundId },
        include: ['fund']
      }]
    });

    res.json(apiResponse(investors, 'Investors retrieved successfully'));
  } catch (error) {
    handleError(res, error, 'Failed to retrieve investors by fund');
  }
}
```

### 3. Fix Capital Activity HTTP Methods

**File**: `/stratcap/backend/src/routes/capitalActivity.ts` (Modify existing routes)

```typescript
// Change these routes from PUT to POST
router.post(
  '/capital-activities/:id/approve',
  [param('id').isInt({ min: 1 }).withMessage('Valid capital activity ID is required')],
  capitalActivityController.approveCapitalActivity.bind(capitalActivityController)
);

router.post(
  '/capital-activities/:id/complete',
  [param('id').isInt({ min: 1 }).withMessage('Valid capital activity ID is required')],
  capitalActivityController.completeCapitalActivity.bind(capitalActivityController)
);

// Add missing template endpoints
router.get(
  '/capital-activities/capital-calls/template/:fundId',
  [param('fundId').isInt({ min: 1 }).withMessage('Valid fund ID is required')],
  capitalActivityController.getCapitalCallTemplate.bind(capitalActivityController)
);

router.get(
  '/capital-activities/distributions/template/:fundId',
  [param('fundId').isInt({ min: 1 }).withMessage('Valid fund ID is required')],
  capitalActivityController.getDistributionTemplate.bind(capitalActivityController)
);

router.post(
  '/capital-activities/capital-calls/allocations',
  [
    body('fundId').isInt({ min: 1 }).withMessage('Valid fund ID is required'),
    body('amount').isDecimal().withMessage('Valid amount is required')
  ],
  capitalActivityController.calculateAllocations.bind(capitalActivityController)
);

router.post(
  '/capital-activities/:id/notifications',
  [
    param('id').isInt({ min: 1 }).withMessage('Valid capital activity ID is required'),
    body('recipients').isArray().withMessage('Recipients array is required'),
    body('template').isString().withMessage('Template is required')
  ],
  capitalActivityController.sendNotifications.bind(capitalActivityController)
);
```

### 4. Add Missing Controller Methods

**File**: `/stratcap/backend/src/controllers/CapitalActivityController.ts` (Add methods)

```typescript
// Add these methods to existing CapitalActivityController class

async getCapitalCallTemplate(req: Request, res: Response): Promise<void> {
  try {
    const { fundId } = req.params;
    
    // Get fund details
    const fund = await Fund.findByPk(fundId, {
      include: ['commitments', 'investorClasses']
    });

    if (!fund) {
      res.status(404).json(apiResponse(null, 'Fund not found'));
      return;
    }

    const template = {
      fundId: fund.id,
      fundName: fund.name,
      eventNumber: this.generateEventNumber(fund, 'capital_call'),
      defaultAllocationMethod: 'pro_rata',
      availableClasses: fund.investorClasses,
      totalCommitments: fund.commitments?.reduce((sum, c) => sum + Number(c.commitmentAmount), 0) || 0,
      suggestedCallPercentage: 0.25 // 25% default
    };

    res.json(apiResponse(template, 'Capital call template generated successfully'));
  } catch (error) {
    handleError(res, error, 'Failed to generate capital call template');
  }
}

async getDistributionTemplate(req: Request, res: Response): Promise<void> {
  try {
    const { fundId } = req.params;
    
    const fund = await Fund.findByPk(fundId, {
      include: ['commitments', 'waterfallStructure']
    });

    if (!fund) {
      res.status(404).json(apiResponse(null, 'Fund not found'));
      return;
    }

    const template = {
      fundId: fund.id,
      fundName: fund.name,
      eventNumber: this.generateEventNumber(fund, 'distribution'),
      defaultDistributionBreakdown: {
        returnOfCapital: 0,
        gain: 0,
        carriedInterest: 0,
        managementFees: 0,
        otherFees: 0,
        expenses: 0
      },
      waterfallTiers: fund.waterfallStructure?.tiers || [],
      totalInvestedCapital: this.calculateTotalInvestedCapital(fund)
    };

    res.json(apiResponse(template, 'Distribution template generated successfully'));
  } catch (error) {
    handleError(res, error, 'Failed to generate distribution template');
  }
}

async calculateAllocations(req: Request, res: Response): Promise<void> {
  try {
    const { fundId, amount } = req.body;
    
    const commitments = await Commitment.findAll({
      where: { fundId },
      include: ['investor']
    });

    const totalCommitments = commitments.reduce((sum, c) => sum + Number(c.commitmentAmount), 0);
    
    const allocations = commitments.map(commitment => ({
      commitmentId: commitment.id,
      investorId: commitment.investorId,
      investorName: commitment.investor?.name,
      commitmentAmount: Number(commitment.commitmentAmount),
      allocationPercentage: Number(commitment.commitmentAmount) / totalCommitments,
      allocatedAmount: (Number(commitment.commitmentAmount) / totalCommitments) * Number(amount)
    }));

    res.json(apiResponse(allocations, 'Allocations calculated successfully'));
  } catch (error) {
    handleError(res, error, 'Failed to calculate allocations');
  }
}

async sendNotifications(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { recipients, template, customMessage } = req.body;

    const capitalActivity = await CapitalActivity.findByPk(id);
    if (!capitalActivity) {
      res.status(404).json(apiResponse(null, 'Capital activity not found'));
      return;
    }

    // Send notifications (implement notification service)
    const notificationResults = await this.notificationService.send({
      activityId: id,
      recipients,
      template,
      customMessage,
      activity: capitalActivity
    });

    res.json(apiResponse(notificationResults, 'Notifications sent successfully'));
  } catch (error) {
    handleError(res, error, 'Failed to send notifications');
  }
}

async completeCapitalActivity(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const [updatedRows] = await CapitalActivity.update(
      { 
        status: 'completed',
        completedAt: new Date(),
        completedBy: req.user?.id
      },
      { where: { id } }
    );

    if (updatedRows === 0) {
      res.status(404).json(apiResponse(null, 'Capital activity not found'));
      return;
    }

    const activity = await CapitalActivity.findByPk(id);
    res.json(apiResponse(activity, 'Capital activity completed successfully'));
  } catch (error) {
    handleError(res, error, 'Failed to complete capital activity');
  }
}

private generateEventNumber(fund: any, type: string): string {
  const year = new Date().getFullYear();
  const prefix = type === 'capital_call' ? 'CC' : 'DIST';
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${year}-${random}`;
}

private calculateTotalInvestedCapital(fund: any): number {
  // Calculate based on previous capital calls
  // This would need to query CapitalActivity records
  return 0; // Placeholder
}
```

## High Priority Implementations

### 5. Update App.ts Route Mounting

**File**: `/stratcap/backend/src/app.ts` (Add commitment routes)

```typescript
// Add this import
import commitmentRoutes from './routes/commitment';

// Add this route mounting
app.use('/api/commitments', commitmentRoutes);
```

### 6. Standardize Authentication Middleware

**File**: `/stratcap/backend/src/routes/waterfall.ts` (Update imports)

```typescript
// Change from:
import { authenticateToken } from '../middleware/auth';

// To:
import { protect } from '../middleware/auth';

// Change all route usage from:
router.use(authenticateToken);

// To:
router.use(protect);
```

**File**: `/stratcap/backend/src/routes/investorTransfer.ts` (Update imports)

```typescript
// Change from:
import { auth } from '../middleware/auth';

// To:
import { protect } from '../middleware/auth';

// Update all route usage accordingly
```

## Medium Priority Implementations

### 7. Fix Parameter Structure Mismatches

**File**: Frontend API calls need to match backend expectations. Update the frontend `api.ts`:

```typescript
// Update capitalActivityAPI.getAll to match backend parameters
export const capitalActivityAPI = {
  getAll: (params?: { page?: number; limit?: number; eventType?: string; status?: string; fundId?: number }) =>
    api.get<APIResponse<any[]>>('/capital-activities', { params }),
    
  // Add the fund-specific endpoint that the frontend expects
  getByFund: (fundId: number, params?: { eventType?: string; status?: string }) =>
    api.get<APIResponse<any[]>>(`/funds/${fundId}/capital-activities`, { params }),
};
```

### 8. Add Missing Report Endpoints

**File**: `/stratcap/backend/src/routes/report.ts` (Add missing endpoints)

```typescript
// Add these routes
router.get('/fund/:fundId/cash-flows', 
  validateParams(schemas.id.rename('id', 'fundId')), 
  reportController.getCashFlowReport
);

router.get('/fund/:fundId/irr-analysis', 
  validateParams(schemas.id.rename('id', 'fundId')), 
  reportController.getIRRAnalysis  
);

router.get('/investor-statements', 
  validateQuery(reportSchemas.investorStatementQuery),
  reportController.generateInvestorStatements
);
```

## Testing Implementation

### 9. Integration Tests

**File**: `/stratcap/backend/tests/integration/api-integration.test.ts`

```typescript
import request from 'supertest';
import app from '../../src/app';

describe('API Integration Tests', () => {
  describe('Commitment Endpoints', () => {
    it('should create a commitment', async () => {
      const response = await request(app)
        .post('/api/commitments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fundId: 1,
          investorId: 1,
          commitmentAmount: '1000000',
          commitmentDate: '2023-01-01'
        });
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should get commitments with pagination', async () => {
      const response = await request(app)
        .get('/api/commitments?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.pagination).toBeDefined();
    });
  });

  describe('Capital Activity Templates', () => {
    it('should generate capital call template', async () => {
      const response = await request(app)
        .get('/api/capital-activities/capital-calls/template/1')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.data.eventNumber).toBeDefined();
    });
  });
});
```

## Deployment Steps

### 10. Deployment Checklist

1. **Database Migrations**: Run any required database migrations for new models
2. **Environment Variables**: Ensure all required environment variables are set
3. **Route Registration**: Verify all new routes are properly registered in app.ts
4. **Authentication**: Test authentication middleware on all routes
5. **Frontend Updates**: Update frontend API calls to match new backend endpoints
6. **Error Handling**: Verify proper error responses across all endpoints

### 11. Rollback Plan

1. **Route Toggles**: Implement feature flags for new routes
2. **Backward Compatibility**: Maintain old endpoints temporarily during transition
3. **Database Rollback**: Have migration rollback scripts ready
4. **Frontend Fallbacks**: Implement fallback logic in frontend for API failures

## Success Metrics

- **100% Test Coverage**: All new endpoints covered by integration tests
- **Zero 404 Errors**: All frontend API calls successfully reach backend
- **Response Time**: All API endpoints respond within 200ms average
- **Error Rate**: Less than 0.1% error rate for all endpoints

---
*Implementation Plan by Coder Agent - StratCap Hive Mind Collective*