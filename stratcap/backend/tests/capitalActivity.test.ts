import { Request, Response } from 'express';
import { Decimal } from 'decimal.js';
import CapitalActivityController from '../src/controllers/CapitalActivityController';
import CapitalCallService from '../src/services/CapitalCallService';
import DistributionService from '../src/services/DistributionService';
import CapitalActivity from '../src/models/CapitalActivity';
import Fund from '../src/models/Fund';
import Commitment from '../src/models/Commitment';

// Mock models and services
jest.mock('../src/models/CapitalActivity');
jest.mock('../src/models/Fund');
jest.mock('../src/models/Commitment');
jest.mock('../src/services/CapitalCallService');
jest.mock('../src/services/DistributionService');

const MockedCapitalActivity = CapitalActivity as jest.MockedClass<typeof CapitalActivity>;
const MockedFund = Fund as jest.MockedClass<typeof Fund>;
const MockedCommitment = Commitment as jest.MockedClass<typeof Commitment>;
const MockedCapitalCallService = CapitalCallService as jest.MockedClass<typeof CapitalCallService>;
const MockedDistributionService = DistributionService as jest.MockedClass<typeof DistributionService>;

describe('CapitalActivityController', () => {
  let controller: CapitalActivityController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    controller = new CapitalActivityController();
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    
    mockRequest = {
      body: {},
      params: {},
      query: {},
      user: { id: 1 },
    };

    mockResponse = {
      json: mockJson,
      status: mockStatus,
    };

    // Setup default mocks
    MockedFund.findByPk.mockResolvedValue({
      id: 1,
      name: 'Test Fund',
      status: 'active',
    });

    MockedCommitment.findAll.mockResolvedValue([
      {
        id: 1,
        fundId: 1,
        investorEntityId: 1,
        commitmentAmount: '500000.00',
        capitalCalled: '200000.00',
        capitalUncalled: '300000.00',
      },
    ]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createCapitalCall', () => {
    it('should create capital call successfully', async () => {
      const mockCapitalCall = {
        id: 1,
        fundId: 1,
        activityType: 'capital_call',
        totalAmount: '100000.00',
        status: 'draft',
      };

      MockedCapitalActivity.create.mockResolvedValue(mockCapitalCall);
      
      mockRequest.body = {
        fundId: 1,
        activityType: 'capital_call',
        totalAmount: '100000',
        callDate: '2024-01-01',
        dueDate: '2024-01-15',
        purpose: 'Investment funding',
      };

      await controller.createCapitalCall(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockCapitalCall,
        })
      );
    });

    it('should return 400 for missing required fields', async () => {
      mockRequest.body = {
        fundId: 1,
        // Missing required fields
      };

      await controller.createCapitalCall(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Missing required fields: activityType, totalAmount, callDate, dueDate',
      });
    });

    it('should return 404 for non-existent fund', async () => {
      MockedFund.findByPk.mockResolvedValue(null);
      
      mockRequest.body = {
        fundId: 999,
        activityType: 'capital_call',
        totalAmount: '100000',
        callDate: '2024-01-01',
        dueDate: '2024-01-15',
      };

      await controller.createCapitalCall(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Fund with ID 999 not found',
      });
    });

    it('should return 400 for invalid amount', async () => {
      mockRequest.body = {
        fundId: 1,
        activityType: 'capital_call',
        totalAmount: '0',
        callDate: '2024-01-01',
        dueDate: '2024-01-15',
      };

      await controller.createCapitalCall(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Total amount must be greater than 0',
      });
    });
  });

  describe('createDistribution', () => {
    it('should create distribution successfully', async () => {
      const mockDistribution = {
        id: 1,
        fundId: 1,
        activityType: 'distribution',
        totalAmount: '50000.00',
        status: 'draft',
      };

      MockedCapitalActivity.create.mockResolvedValue(mockDistribution);
      
      mockRequest.body = {
        fundId: 1,
        activityType: 'distribution',
        totalAmount: '50000',
        distributionDate: '2024-01-01',
        distributionType: 'return_of_capital',
      };

      await controller.createDistribution(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockDistribution,
        })
      );
    });

    it('should return 400 for invalid distribution type', async () => {
      mockRequest.body = {
        fundId: 1,
        activityType: 'distribution',
        totalAmount: '50000',
        distributionDate: '2024-01-01',
        distributionType: 'invalid_type',
      };

      await controller.createDistribution(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Invalid distribution type. Must be one of: return_of_capital, capital_gains, preferred_return, carried_interest',
      });
    });
  });

  describe('getCapitalActivities', () => {
    it('should return paginated capital activities', async () => {
      const mockActivities = [
        {
          id: 1,
          fundId: 1,
          activityType: 'capital_call',
          totalAmount: '100000.00',
          status: 'completed',
        },
        {
          id: 2,
          fundId: 1,
          activityType: 'distribution',
          totalAmount: '50000.00',
          status: 'completed',
        },
      ];

      MockedCapitalActivity.findAndCountAll.mockResolvedValue({
        rows: mockActivities,
        count: 2,
      });

      mockRequest.params = { fundId: '1' };
      mockRequest.query = { page: '1', limit: '10' };

      await controller.getCapitalActivities(mockRequest as Request, mockResponse as Response);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          activities: mockActivities,
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            pages: 1,
          },
        },
      });
    });

    it('should filter activities by type', async () => {
      const mockActivities = [
        {
          id: 1,
          fundId: 1,
          activityType: 'capital_call',
          totalAmount: '100000.00',
          status: 'completed',
        },
      ];

      MockedCapitalActivity.findAndCountAll.mockResolvedValue({
        rows: mockActivities,
        count: 1,
      });

      mockRequest.params = { fundId: '1' };
      mockRequest.query = { activityType: 'capital_call' };

      await controller.getCapitalActivities(mockRequest as Request, mockResponse as Response);

      expect(MockedCapitalActivity.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            fundId: 1,
            activityType: 'capital_call',
          }),
        })
      );
    });
  });

  describe('updateCapitalActivityStatus', () => {
    it('should update activity status successfully', async () => {
      const mockActivity = {
        id: 1,
        status: 'draft',
        update: jest.fn().mockResolvedValue({
          id: 1,
          status: 'approved',
        }),
      };

      MockedCapitalActivity.findByPk.mockResolvedValue(mockActivity);
      
      mockRequest.params = { id: '1' };
      mockRequest.body = { status: 'approved' };

      await controller.updateCapitalActivityStatus(mockRequest as Request, mockResponse as Response);

      expect(mockActivity.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'approved',
        })
      );
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Capital activity status updated successfully',
        })
      );
    });

    it('should return 404 for non-existent activity', async () => {
      MockedCapitalActivity.findByPk.mockResolvedValue(null);
      
      mockRequest.params = { id: '999' };
      mockRequest.body = { status: 'approved' };

      await controller.updateCapitalActivityStatus(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Capital activity with ID 999 not found',
      });
    });

    it('should return 400 for invalid status', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = { status: 'invalid_status' };

      await controller.updateCapitalActivityStatus(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Invalid status. Must be one of: draft, approved, executed, completed, cancelled',
      });
    });
  });

  describe('processCapitalCall', () => {
    it('should process capital call successfully', async () => {
      const mockActivity = {
        id: 1,
        fundId: 1,
        activityType: 'capital_call',
        status: 'approved',
        totalAmount: '100000.00',
      };

      const mockProcessResult = {
        success: true,
        totalCalled: new Decimal('100000'),
        allocations: [
          {
            investorId: 1,
            amount: new Decimal('50000'),
            percentage: new Decimal('50'),
          },
        ],
      };

      MockedCapitalActivity.findByPk.mockResolvedValue(mockActivity);
      MockedCapitalCallService.prototype.processCapitalCall = jest.fn().mockResolvedValue(mockProcessResult);
      
      mockRequest.params = { id: '1' };

      await controller.processCapitalCall(mockRequest as Request, mockResponse as Response);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            totalCalled: '100000',
            allocations: expect.any(Array),
          }),
        })
      );
    });

    it('should return 400 for activity not in approved status', async () => {
      const mockActivity = {
        id: 1,
        status: 'draft',
      };

      MockedCapitalActivity.findByPk.mockResolvedValue(mockActivity);
      
      mockRequest.params = { id: '1' };

      await controller.processCapitalCall(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Only approved capital calls can be processed',
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      MockedCapitalActivity.create.mockRejectedValue(new Error('Database error'));
      
      mockRequest.body = {
        fundId: 1,
        activityType: 'capital_call',
        totalAmount: '100000',
        callDate: '2024-01-01',
        dueDate: '2024-01-15',
      };

      await controller.createCapitalCall(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Internal server error',
          details: 'Database error',
        })
      );
    });
  });
});

describe('CapitalCallService', () => {
  let service: CapitalCallService;

  beforeEach(() => {
    service = new CapitalCallService();
  });

  describe('processCapitalCall', () => {
    it('should calculate call allocations correctly', async () => {
      const mockCommitments = [
        {
          id: 1,
          investorEntityId: 1,
          commitmentAmount: '500000.00',
          capitalCalled: '200000.00',
          capitalUncalled: '300000.00',
        },
        {
          id: 2,
          investorEntityId: 2,
          commitmentAmount: '300000.00',
          capitalCalled: '120000.00',
          capitalUncalled: '180000.00',
        },
      ];

      MockedCommitment.findAll.mockResolvedValue(mockCommitments);

      const result = await service.processCapitalCall(1, new Decimal('160000'));

      expect(result.success).toBe(true);
      expect(result.totalCalled.toString()).toBe('160000');
      expect(result.allocations).toHaveLength(2);
      
      // First investor should get 100000 (62.5% of total)
      expect(result.allocations[0].amount.toString()).toBe('100000');
      
      // Second investor should get 60000 (37.5% of total)
      expect(result.allocations[1].amount.toString()).toBe('60000');
    });

    it('should handle insufficient uncalled capital', async () => {
      const mockCommitments = [
        {
          id: 1,
          investorEntityId: 1,
          commitmentAmount: '100000.00',
          capitalCalled: '80000.00',
          capitalUncalled: '20000.00',
        },
      ];

      MockedCommitment.findAll.mockResolvedValue(mockCommitments);

      await expect(service.processCapitalCall(1, new Decimal('50000')))
        .rejects.toThrow('Insufficient uncalled capital available');
    });

    it('should validate pro-rata allocation calculations', async () => {
      const mockCommitments = [
        {
          id: 1,
          investorEntityId: 1,
          commitmentAmount: '600000.00',
          capitalCalled: '0.00',
          capitalUncalled: '600000.00',
        },
        {
          id: 2,
          investorEntityId: 2,
          commitmentAmount: '400000.00',
          capitalCalled: '0.00',
          capitalUncalled: '400000.00',
        },
      ];

      MockedCommitment.findAll.mockResolvedValue(mockCommitments);

      const result = await service.processCapitalCall(1, new Decimal('500000'));

      // Verify pro-rata allocation: 60% to first investor, 40% to second
      expect(result.allocations[0].amount.toString()).toBe('300000');
      expect(result.allocations[1].amount.toString()).toBe('200000');
      expect(result.allocations[0].percentage.toString()).toBe('60');
      expect(result.allocations[1].percentage.toString()).toBe('40');
    });
  });
});

describe('DistributionService', () => {
  let service: DistributionService;

  beforeEach(() => {
    service = new DistributionService();
  });

  describe('processDistribution', () => {
    it('should calculate distribution allocations correctly', async () => {
      const mockCommitments = [
        {
          id: 1,
          investorEntityId: 1,
          commitmentAmount: '500000.00',
          capitalCalled: '500000.00',
          ownershipPercentage: '62.5',
        },
        {
          id: 2,
          investorEntityId: 2,
          commitmentAmount: '300000.00',
          capitalCalled: '300000.00',
          ownershipPercentage: '37.5',
        },
      ];

      MockedCommitment.findAll.mockResolvedValue(mockCommitments);

      const result = await service.processDistribution(
        1,
        new Decimal('80000'),
        'return_of_capital'
      );

      expect(result.success).toBe(true);
      expect(result.totalDistributed.toString()).toBe('80000');
      expect(result.allocations).toHaveLength(2);
      
      // First investor should get 50000 (62.5% of total)
      expect(result.allocations[0].amount.toString()).toBe('50000');
      
      // Second investor should get 30000 (37.5% of total)
      expect(result.allocations[1].amount.toString()).toBe('30000');
    });

    it('should handle different distribution types', async () => {
      const distributionTypes = [
        'return_of_capital',
        'capital_gains',
        'preferred_return',
        'carried_interest',
      ];

      for (const type of distributionTypes) {
        const result = await service.processDistribution(
          1,
          new Decimal('100000'),
          type
        );

        expect(result.distributionType).toBe(type);
        expect(result.success).toBe(true);
      }
    });
  });
});