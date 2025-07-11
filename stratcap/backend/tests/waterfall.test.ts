import { Decimal } from 'decimal.js';
import WaterfallCalculationService from '../src/services/WaterfallCalculationService';
import WaterfallController from '../src/controllers/WaterfallController';
import Fund from '../src/models/Fund';
import Commitment from '../src/models/Commitment';
import WaterfallCalculation from '../src/models/WaterfallCalculation';
import { Request, Response } from 'express';

// Mock database models
jest.mock('../src/models/Fund');
jest.mock('../src/models/Commitment');
jest.mock('../src/models/WaterfallCalculation');
jest.mock('../src/models/WaterfallTier');
jest.mock('../src/models/DistributionEvent');

const MockedFund = Fund as jest.MockedClass<typeof Fund>;
const MockedCommitment = Commitment as jest.MockedClass<typeof Commitment>;
const MockedWaterfallCalculation = WaterfallCalculation as jest.MockedClass<typeof WaterfallCalculation>;

describe('WaterfallCalculationService', () => {
  let service: WaterfallCalculationService;
  let mockFund: any;
  let mockCommitments: any[];

  beforeEach(() => {
    service = new WaterfallCalculationService();
    
    // Setup mock data
    mockFund = {
      id: 1,
      name: 'Test Fund',
      preferredReturnRate: '8.0',
      carriedInterestRate: '20.0',
      managementFeeRate: '2.0',
      totalCommitments: '1000000.00',
    };

    mockCommitments = [
      {
        id: 1,
        fundId: 1,
        investorEntityId: 1,
        commitmentAmount: '500000.00',
        capitalCalled: '300000.00',
        capitalUncalled: '200000.00',
        commitmentDate: new Date('2023-01-01'),
        investorEntity: { id: 1, entityName: 'Investor A' },
      },
      {
        id: 2,
        fundId: 1,
        investorEntityId: 2,
        commitmentAmount: '500000.00',
        capitalCalled: '400000.00',
        capitalUncalled: '100000.00',
        commitmentDate: new Date('2023-01-15'),
        investorEntity: { id: 2, entityName: 'Investor B' },
      },
    ];

    // Setup mocks
    MockedFund.findByPk.mockResolvedValue(mockFund);
    MockedCommitment.findAll.mockResolvedValue(mockCommitments);
    MockedWaterfallCalculation.create.mockImplementation((data) => ({
      id: 1,
      ...data,
      update: jest.fn(),
    }));
    MockedWaterfallCalculation.findAll.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateWaterfall', () => {
    it('should calculate basic waterfall distribution correctly', async () => {
      const inputs = {
        fundId: 1,
        distributionAmount: new Decimal('100000'),
        distributionDate: new Date('2024-01-01'),
        calculationType: 'distribution' as const,
        userId: 1,
      };

      const result = await service.calculateWaterfall(inputs);

      expect(result).toBeDefined();
      expect(result.calculation).toBeDefined();
      expect(result.tiers).toBeDefined();
      expect(result.distributions).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.summary.totalDistributed.toString()).toBe('100000');
    });

    it('should handle fund not found error', async () => {
      MockedFund.findByPk.mockResolvedValue(null);

      const inputs = {
        fundId: 999,
        distributionAmount: new Decimal('100000'),
        distributionDate: new Date('2024-01-01'),
        calculationType: 'distribution' as const,
        userId: 1,
      };

      await expect(service.calculateWaterfall(inputs)).rejects.toThrow('Fund with ID 999 not found');
    });

    it('should calculate preferred return tier correctly', async () => {
      const inputs = {
        fundId: 1,
        distributionAmount: new Decimal('50000'),
        distributionDate: new Date('2024-01-01'),
        calculationType: 'distribution' as const,
        userId: 1,
      };

      const result = await service.calculateWaterfall(inputs);

      expect(result.tiers.length).toBeGreaterThan(0);
      expect(result.summary.preferredReturnPaid.gte(0)).toBe(true);
    });

    it('should handle large distribution amounts', async () => {
      const inputs = {
        fundId: 1,
        distributionAmount: new Decimal('2000000'),
        distributionDate: new Date('2024-01-01'),
        calculationType: 'distribution' as const,
        userId: 1,
      };

      const result = await service.calculateWaterfall(inputs);

      expect(result.summary.totalDistributed.toString()).toBe('2000000');
      expect(result.summary.carriedInterestAmount.gt(0)).toBe(true);
    });

    it('should validate calculation results', async () => {
      const inputs = {
        fundId: 1,
        distributionAmount: new Decimal('100000'),
        distributionDate: new Date('2024-01-01'),
        calculationType: 'distribution' as const,
        userId: 1,
      };

      const result = await service.calculateWaterfall(inputs);
      const validation = service.validateCalculation(result);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  describe('createHypotheticalScenario', () => {
    it('should create multiple scenario calculations', async () => {
      const scenarios = [
        { distributionAmount: new Decimal('50000'), date: new Date('2024-01-01') },
        { distributionAmount: new Decimal('100000'), date: new Date('2024-06-01') },
        { distributionAmount: new Decimal('200000'), date: new Date('2024-12-01') },
      ];

      const results = await service.createHypotheticalScenario(1, scenarios, 1);

      expect(results).toHaveLength(3);
      expect(results[0].summary.totalDistributed.toString()).toBe('50000');
      expect(results[1].summary.totalDistributed.toString()).toBe('100000');
      expect(results[2].summary.totalDistributed.toString()).toBe('200000');
    });
  });

  describe('validateCalculation', () => {
    it('should detect tier allocation errors', async () => {
      const mockResult = {
        calculation: {} as any,
        tiers: [
          {
            tierName: 'Test Tier',
            distributedAmountDecimal: new Decimal('50000'),
            lpAllocationDecimal: new Decimal('90'),
            gpAllocationDecimal: new Decimal('5'), // Should be 10 to sum to 100
          },
        ] as any,
        distributions: [
          { distributionAmountDecimal: new Decimal('50000') },
        ] as any,
        auditTrail: [] as any,
        summary: {
          totalDistributed: new Decimal('50000'),
        } as any,
      };

      const validation = service.validateCalculation(mockResult);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Tier Test Tier allocations do not sum to 100%');
    });
  });
});

describe('WaterfallController', () => {
  let controller: WaterfallController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    controller = new WaterfallController();
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

    // Setup mocks
    MockedFund.findByPk.mockResolvedValue({
      id: 1,
      name: 'Test Fund',
      preferredReturnRate: '8.0',
      carriedInterestRate: '20.0',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateWaterfall', () => {
    it('should return 400 for missing required fields', async () => {
      mockRequest.body = {
        fundId: 1,
        // Missing distributionAmount and distributionDate
      };

      await controller.calculateWaterfall(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Missing required fields: fundId, distributionAmount, distributionDate',
      });
    });

    it('should return 404 for non-existent fund', async () => {
      MockedFund.findByPk.mockResolvedValue(null);
      
      mockRequest.body = {
        fundId: 999,
        distributionAmount: '100000',
        distributionDate: '2024-01-01',
      };

      await controller.calculateWaterfall(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Fund with ID 999 not found',
      });
    });

    it('should return 400 for invalid distribution amount', async () => {
      mockRequest.body = {
        fundId: 1,
        distributionAmount: '0',
        distributionDate: '2024-01-01',
      };

      await controller.calculateWaterfall(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Distribution amount must be greater than 0',
      });
    });

    it('should successfully calculate waterfall', async () => {
      mockRequest.body = {
        fundId: 1,
        distributionAmount: '100000',
        distributionDate: '2024-01-01',
      };

      await controller.calculateWaterfall(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            calculation: expect.any(Object),
            tiers: expect.any(Array),
            distributions: expect.any(Array),
            summary: expect.any(Object),
          }),
        })
      );
    });
  });

  describe('getWaterfallCalculation', () => {
    it('should return 404 for non-existent calculation', async () => {
      MockedWaterfallCalculation.findByPk.mockResolvedValue(null);
      
      mockRequest.params = { id: '999' };

      await controller.getWaterfallCalculation(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Waterfall calculation with ID 999 not found',
      });
    });

    it('should return calculation details', async () => {
      const mockCalculation = {
        id: 1,
        fundId: 1,
        totalDistribution: '100000',
        status: 'calculated',
      };
      
      MockedWaterfallCalculation.findByPk.mockResolvedValue(mockCalculation);
      mockRequest.params = { id: '1' };

      await controller.getWaterfallCalculation(mockRequest as Request, mockResponse as Response);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockCalculation,
      });
    });
  });

  describe('createHypotheticalScenarios', () => {
    it('should return 400 for missing required fields', async () => {
      mockRequest.body = {
        fundId: 1,
        // Missing scenarios
      };

      await controller.createHypotheticalScenarios(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Missing required fields: fundId, scenarios (array)',
      });
    });

    it('should return 400 for invalid scenario format', async () => {
      mockRequest.body = {
        fundId: 1,
        scenarios: [
          { distributionAmount: '100000' }, // Missing date
        ],
      };

      await controller.createHypotheticalScenarios(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Each scenario must have distributionAmount and date',
      });
    });

    it('should successfully create hypothetical scenarios', async () => {
      mockRequest.body = {
        fundId: 1,
        scenarios: [
          { distributionAmount: '50000', date: '2024-01-01' },
          { distributionAmount: '100000', date: '2024-06-01' },
        ],
      };

      await controller.createHypotheticalScenarios(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            scenarioResults: expect.any(Array),
            scenarioCount: 2,
          }),
        })
      );
    });
  });

  describe('approveCalculation', () => {
    it('should return 404 for non-existent calculation', async () => {
      MockedWaterfallCalculation.findByPk.mockResolvedValue(null);
      
      mockRequest.params = { calculationId: '999' };
      mockRequest.body = { approvalNotes: 'Approved' };

      await controller.approveCalculation(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Waterfall calculation with ID 999 not found',
      });
    });

    it('should return 400 for calculation not in calculated status', async () => {
      const mockCalculation = {
        id: 1,
        status: 'draft',
        update: jest.fn(),
      };
      
      MockedWaterfallCalculation.findByPk.mockResolvedValue(mockCalculation);
      mockRequest.params = { calculationId: '1' };
      mockRequest.body = { approvalNotes: 'Approved' };

      await controller.approveCalculation(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Only calculated waterfall calculations can be approved',
      });
    });
  });
});

describe('Performance Tests', () => {
  let service: WaterfallCalculationService;

  beforeEach(() => {
    service = new WaterfallCalculationService();
    
    // Setup mock for large dataset
    const largeMockCommitments = Array.from({ length: 1000 }, (_, i) => ({
      id: i + 1,
      fundId: 1,
      investorEntityId: i + 1,
      commitmentAmount: '10000.00',
      capitalCalled: '6000.00',
      capitalUncalled: '4000.00',
      commitmentDate: new Date('2023-01-01'),
      investorEntity: { id: i + 1, entityName: `Investor ${i + 1}` },
    }));

    MockedCommitment.findAll.mockResolvedValue(largeMockCommitments);
  });

  it('should calculate waterfall for large investor base within acceptable time', async () => {
    const startTime = Date.now();
    
    const inputs = {
      fundId: 1,
      distributionAmount: new Decimal('5000000'),
      distributionDate: new Date('2024-01-01'),
      calculationType: 'distribution' as const,
      userId: 1,
    };

    const result = await service.calculateWaterfall(inputs);
    
    const endTime = Date.now();
    const executionTime = endTime - startTime;

    expect(result).toBeDefined();
    expect(executionTime).toBeLessThan(5000); // Should complete within 5 seconds
  });

  it('should handle concurrent calculation requests', async () => {
    const promises = Array.from({ length: 10 }, (_, i) => {
      const inputs = {
        fundId: 1,
        distributionAmount: new Decimal('100000'),
        distributionDate: new Date('2024-01-01'),
        calculationType: 'distribution' as const,
        userId: 1,
      };
      return service.calculateWaterfall(inputs);
    });

    const results = await Promise.all(promises);

    expect(results).toHaveLength(10);
    results.forEach(result => {
      expect(result.summary.totalDistributed.toString()).toBe('100000');
    });
  });
});

describe('Edge Cases and Error Handling', () => {
  let service: WaterfallCalculationService;

  beforeEach(() => {
    service = new WaterfallCalculationService();
  });

  it('should handle zero distribution amount', async () => {
    const inputs = {
      fundId: 1,
      distributionAmount: new Decimal('0'),
      distributionDate: new Date('2024-01-01'),
      calculationType: 'distribution' as const,
      userId: 1,
    };

    const result = await service.calculateWaterfall(inputs);

    expect(result.summary.totalDistributed.toString()).toBe('0');
    expect(result.tiers).toHaveLength(0);
  });

  it('should handle very small distribution amounts', async () => {
    const inputs = {
      fundId: 1,
      distributionAmount: new Decimal('0.01'),
      distributionDate: new Date('2024-01-01'),
      calculationType: 'distribution' as const,
      userId: 1,
    };

    const result = await service.calculateWaterfall(inputs);

    expect(result.summary.totalDistributed.toString()).toBe('0.01');
  });

  it('should handle database connection errors gracefully', async () => {
    MockedFund.findByPk.mockRejectedValue(new Error('Database connection failed'));

    const inputs = {
      fundId: 1,
      distributionAmount: new Decimal('100000'),
      distributionDate: new Date('2024-01-01'),
      calculationType: 'distribution' as const,
      userId: 1,
    };

    await expect(service.calculateWaterfall(inputs)).rejects.toThrow('Waterfall calculation failed: Database connection failed');
  });

  it('should handle invalid date inputs', async () => {
    const inputs = {
      fundId: 1,
      distributionAmount: new Decimal('100000'),
      distributionDate: new Date('invalid-date'),
      calculationType: 'distribution' as const,
      userId: 1,
    };

    await expect(service.calculateWaterfall(inputs)).rejects.toThrow();
  });

  it('should validate decimal precision for calculations', async () => {
    const inputs = {
      fundId: 1,
      distributionAmount: new Decimal('100000.123456789'),
      distributionDate: new Date('2024-01-01'),
      calculationType: 'distribution' as const,
      userId: 1,
    };

    const result = await service.calculateWaterfall(inputs);

    // Should maintain decimal precision
    expect(result.summary.totalDistributed.toString()).toBe('100000.123456789');
  });
});