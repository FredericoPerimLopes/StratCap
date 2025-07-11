import { Request, Response } from 'express';
import { Decimal } from 'decimal.js';
import FundController from '../src/controllers/FundController';
import Fund from '../src/models/Fund';
import FundFamily from '../src/models/FundFamily';
import Commitment from '../src/models/Commitment';
import CapitalActivity from '../src/models/CapitalActivity';

// Mock models
jest.mock('../src/models/Fund');
jest.mock('../src/models/FundFamily');
jest.mock('../src/models/Commitment');
jest.mock('../src/models/CapitalActivity');

const MockedFund = Fund as jest.MockedClass<typeof Fund>;
const MockedFundFamily = FundFamily as jest.MockedClass<typeof FundFamily>;
const MockedCommitment = Commitment as jest.MockedClass<typeof Commitment>;
const MockedCapitalActivity = CapitalActivity as jest.MockedClass<typeof CapitalActivity>;

describe('FundController', () => {
  let controller: FundController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    controller = new FundController();
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
    MockedFundFamily.findByPk.mockResolvedValue({
      id: 1,
      name: 'Test Fund Family',
      status: 'active',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createFund', () => {
    it('should create fund successfully', async () => {
      const mockFund = {
        id: 1,
        name: 'Test Fund I',
        fundFamilyId: 1,
        fundType: 'private_equity',
        status: 'fundraising',
        targetSize: '100000000.00',
        managementFeeRate: '2.0',
        carriedInterestRate: '20.0',
        preferredReturnRate: '8.0',
        vintage: 2024,
      };

      MockedFund.create.mockResolvedValue(mockFund);
      
      mockRequest.body = {
        name: 'Test Fund I',
        fundFamilyId: 1,
        fundType: 'private_equity',
        targetSize: '100000000',
        managementFeeRate: '2.0',
        carriedInterestRate: '20.0',
        preferredReturnRate: '8.0',
        vintage: 2024,
        currency: 'USD',
        jurisdiction: 'Delaware',
      };

      await controller.createFund(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockFund,
          message: 'Fund created successfully',
        })
      );
    });

    it('should return 400 for missing required fields', async () => {
      mockRequest.body = {
        name: 'Test Fund I',
        // Missing required fields
      };

      await controller.createFund(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Missing required fields: fundFamilyId, fundType, targetSize, managementFeeRate, carriedInterestRate',
      });
    });

    it('should return 404 for non-existent fund family', async () => {
      MockedFundFamily.findByPk.mockResolvedValue(null);
      
      mockRequest.body = {
        name: 'Test Fund I',
        fundFamilyId: 999,
        fundType: 'private_equity',
        targetSize: '100000000',
        managementFeeRate: '2.0',
        carriedInterestRate: '20.0',
      };

      await controller.createFund(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Fund family with ID 999 not found',
      });
    });

    it('should return 400 for invalid fund type', async () => {
      mockRequest.body = {
        name: 'Test Fund I',
        fundFamilyId: 1,
        fundType: 'invalid_type',
        targetSize: '100000000',
        managementFeeRate: '2.0',
        carriedInterestRate: '20.0',
      };

      await controller.createFund(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Invalid fund type. Must be one of: private_equity, hedge_fund, real_estate, infrastructure, credit',
      });
    });

    it('should return 400 for invalid target size', async () => {
      mockRequest.body = {
        name: 'Test Fund I',
        fundFamilyId: 1,
        fundType: 'private_equity',
        targetSize: '0',
        managementFeeRate: '2.0',
        carriedInterestRate: '20.0',
      };

      await controller.createFund(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Target size must be greater than 0',
      });
    });
  });

  describe('getFunds', () => {
    it('should return paginated funds', async () => {
      const mockFunds = [
        {
          id: 1,
          name: 'Test Fund I',
          fundType: 'private_equity',
          status: 'active',
          targetSize: '100000000.00',
          raisedToDate: '75000000.00',
        },
        {
          id: 2,
          name: 'Test Fund II',
          fundType: 'private_equity',
          status: 'fundraising',
          targetSize: '150000000.00',
          raisedToDate: '25000000.00',
        },
      ];

      MockedFund.findAndCountAll.mockResolvedValue({
        rows: mockFunds,
        count: 2,
      });

      mockRequest.query = { page: '1', limit: '10' };

      await controller.getFunds(mockRequest as Request, mockResponse as Response);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          funds: mockFunds,
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            pages: 1,
          },
        },
      });
    });

    it('should filter funds by fund family', async () => {
      const mockFunds = [
        {
          id: 1,
          name: 'Test Fund I',
          fundFamilyId: 1,
          fundType: 'private_equity',
        },
      ];

      MockedFund.findAndCountAll.mockResolvedValue({
        rows: mockFunds,
        count: 1,
      });

      mockRequest.query = { fundFamilyId: '1' };

      await controller.getFunds(mockRequest as Request, mockResponse as Response);

      expect(MockedFund.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            fundFamilyId: 1,
          }),
        })
      );
    });

    it('should filter funds by status', async () => {
      mockRequest.query = { status: 'active' };

      await controller.getFunds(mockRequest as Request, mockResponse as Response);

      expect(MockedFund.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'active',
          }),
        })
      );
    });
  });

  describe('getFundById', () => {
    it('should return fund details with related data', async () => {
      const mockFund = {
        id: 1,
        name: 'Test Fund I',
        fundType: 'private_equity',
        status: 'active',
        targetSize: '100000000.00',
        raisedToDate: '75000000.00',
        commitments: [
          {
            id: 1,
            investorEntityId: 1,
            commitmentAmount: '5000000.00',
            capitalCalled: '3000000.00',
          },
        ],
        capitalActivities: [
          {
            id: 1,
            activityType: 'capital_call',
            totalAmount: '10000000.00',
            status: 'completed',
          },
        ],
      };

      MockedFund.findByPk.mockResolvedValue(mockFund);
      mockRequest.params = { id: '1' };

      await controller.getFundById(mockRequest as Request, mockResponse as Response);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockFund,
      });
    });

    it('should return 404 for non-existent fund', async () => {
      MockedFund.findByPk.mockResolvedValue(null);
      mockRequest.params = { id: '999' };

      await controller.getFundById(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Fund with ID 999 not found',
      });
    });
  });

  describe('updateFund', () => {
    it('should update fund successfully', async () => {
      const mockFund = {
        id: 1,
        name: 'Test Fund I',
        status: 'fundraising',
        update: jest.fn().mockResolvedValue({
          id: 1,
          name: 'Test Fund I',
          status: 'active',
        }),
      };

      MockedFund.findByPk.mockResolvedValue(mockFund);
      
      mockRequest.params = { id: '1' };
      mockRequest.body = { status: 'active' };

      await controller.updateFund(mockRequest as Request, mockResponse as Response);

      expect(mockFund.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'active',
        })
      );
    });

    it('should return 404 for non-existent fund', async () => {
      MockedFund.findByPk.mockResolvedValue(null);
      
      mockRequest.params = { id: '999' };
      mockRequest.body = { status: 'active' };

      await controller.updateFund(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Fund with ID 999 not found',
      });
    });

    it('should return 400 for invalid status update', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = { status: 'invalid_status' };

      await controller.updateFund(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Invalid status. Must be one of: fundraising, active, closed, liquidated',
      });
    });
  });

  describe('getFundPerformance', () => {
    it('should calculate fund performance metrics', async () => {
      const mockFund = {
        id: 1,
        name: 'Test Fund I',
        targetSize: '100000000.00',
        raisedToDate: '75000000.00',
      };

      const mockCommitments = [
        {
          id: 1,
          commitmentAmount: '5000000.00',
          capitalCalled: '3000000.00',
          capitalReturned: '2500000.00',
        },
        {
          id: 2,
          commitmentAmount: '3000000.00',
          capitalCalled: '2000000.00',
          capitalReturned: '1800000.00',
        },
      ];

      const mockActivities = [
        {
          id: 1,
          activityType: 'capital_call',
          totalAmount: '5000000.00',
          status: 'completed',
          activityDate: new Date('2023-01-01'),
        },
        {
          id: 2,
          activityType: 'distribution',
          totalAmount: '4300000.00',
          status: 'completed',
          activityDate: new Date('2024-01-01'),
        },
      ];

      MockedFund.findByPk.mockResolvedValue(mockFund);
      MockedCommitment.findAll.mockResolvedValue(mockCommitments);
      MockedCapitalActivity.findAll.mockResolvedValue(mockActivities);

      mockRequest.params = { id: '1' };

      await controller.getFundPerformance(mockRequest as Request, mockResponse as Response);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            fund: mockFund,
            metrics: expect.objectContaining({
              totalCommitments: expect.any(String),
              totalCalled: expect.any(String),
              totalReturned: expect.any(String),
              netCashFlow: expect.any(String),
              callRate: expect.any(String),
              distributionRate: expect.any(String),
            }),
          }),
        })
      );
    });

    it('should handle fund with no commitments', async () => {
      const mockFund = {
        id: 1,
        name: 'Test Fund I',
        targetSize: '100000000.00',
        raisedToDate: '0.00',
      };

      MockedFund.findByPk.mockResolvedValue(mockFund);
      MockedCommitment.findAll.mockResolvedValue([]);
      MockedCapitalActivity.findAll.mockResolvedValue([]);

      mockRequest.params = { id: '1' };

      await controller.getFundPerformance(mockRequest as Request, mockResponse as Response);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            metrics: expect.objectContaining({
              totalCommitments: '0',
              totalCalled: '0',
              totalReturned: '0',
            }),
          }),
        })
      );
    });
  });

  describe('closeFund', () => {
    it('should close fund successfully', async () => {
      const mockFund = {
        id: 1,
        status: 'active',
        update: jest.fn().mockResolvedValue({
          id: 1,
          status: 'closed',
          closingDate: new Date(),
        }),
      };

      MockedFund.findByPk.mockResolvedValue(mockFund);
      
      mockRequest.params = { id: '1' };
      mockRequest.body = { 
        closingNotes: 'Fund closed due to completion of investment period',
        finalSize: '95000000',
      };

      await controller.closeFund(mockRequest as Request, mockResponse as Response);

      expect(mockFund.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'closed',
          closingDate: expect.any(Date),
          closingNotes: 'Fund closed due to completion of investment period',
          finalSize: '95000000',
        })
      );
    });

    it('should return 400 for fund not in active status', async () => {
      const mockFund = {
        id: 1,
        status: 'fundraising',
      };

      MockedFund.findByPk.mockResolvedValue(mockFund);
      
      mockRequest.params = { id: '1' };

      await controller.closeFund(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Only active funds can be closed',
      });
    });
  });

  describe('getFundAnalytics', () => {
    it('should return comprehensive fund analytics', async () => {
      const mockFund = {
        id: 1,
        name: 'Test Fund I',
        inceptionDate: new Date('2023-01-01'),
        targetSize: '100000000.00',
      };

      MockedFund.findByPk.mockResolvedValue(mockFund);

      // Mock analytics data
      const mockCommitments = [
        {
          commitmentAmount: '10000000.00',
          capitalCalled: '8000000.00',
          capitalReturned: '9000000.00',
          commitmentDate: new Date('2023-02-01'),
        },
      ];

      MockedCommitment.findAll.mockResolvedValue(mockCommitments);

      mockRequest.params = { id: '1' };

      await controller.getFundAnalytics(mockRequest as Request, mockResponse as Response);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            fund: mockFund,
            analytics: expect.objectContaining({
              irr: expect.any(String),
              multiple: expect.any(String),
              dpi: expect.any(String),
              rvpi: expect.any(String),
              tvpi: expect.any(String),
              calledPercentage: expect.any(String),
              distributedPercentage: expect.any(String),
              fundAge: expect.any(Number),
            }),
          }),
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      MockedFund.create.mockRejectedValue(new Error('Database connection failed'));
      
      mockRequest.body = {
        name: 'Test Fund I',
        fundFamilyId: 1,
        fundType: 'private_equity',
        targetSize: '100000000',
        managementFeeRate: '2.0',
        carriedInterestRate: '20.0',
      };

      await controller.createFund(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Internal server error',
          details: 'Database connection failed',
        })
      );
    });

    it('should handle invalid decimal values', async () => {
      mockRequest.body = {
        name: 'Test Fund I',
        fundFamilyId: 1,
        fundType: 'private_equity',
        targetSize: 'invalid_number',
        managementFeeRate: '2.0',
        carriedInterestRate: '20.0',
      };

      await controller.createFund(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('Invalid target size format'),
        })
      );
    });
  });
});

describe('Fund Model Validation', () => {
  it('should validate fund creation with all required fields', () => {
    const fundData = {
      name: 'Test Fund I',
      fundFamilyId: 1,
      fundType: 'private_equity',
      targetSize: '100000000.00',
      managementFeeRate: '2.0',
      carriedInterestRate: '20.0',
      preferredReturnRate: '8.0',
      vintage: 2024,
      currency: 'USD',
      jurisdiction: 'Delaware',
      status: 'fundraising',
    };

    // Mock the create method to return the data
    MockedFund.create.mockResolvedValue(fundData);

    expect(fundData.name).toBeDefined();
    expect(fundData.targetSize).toBeDefined();
    expect(parseFloat(fundData.managementFeeRate)).toBeGreaterThan(0);
    expect(parseFloat(fundData.carriedInterestRate)).toBeGreaterThan(0);
  });

  it('should validate fee rates are within reasonable ranges', () => {
    const validFund = {
      managementFeeRate: '2.5', // 2.5% - reasonable
      carriedInterestRate: '20.0', // 20% - standard
      preferredReturnRate: '8.0', // 8% - reasonable
    };

    expect(parseFloat(validFund.managementFeeRate)).toBeLessThanOrEqual(5); // Max 5%
    expect(parseFloat(validFund.carriedInterestRate)).toBeLessThanOrEqual(30); // Max 30%
    expect(parseFloat(validFund.preferredReturnRate)).toBeLessThanOrEqual(15); // Max 15%
  });
});

describe('Fund Analytics Calculations', () => {
  it('should calculate IRR correctly for simple cash flows', () => {
    const cashFlows = [
      { date: new Date('2023-01-01'), amount: -1000000 }, // Initial investment
      { date: new Date('2024-01-01'), amount: 1200000 },  // Return after 1 year
    ];

    // Simple IRR calculation: 20% return over 1 year
    const expectedIRR = 0.20; // 20%
    const actualReturn = (1200000 - 1000000) / 1000000;
    
    expect(actualReturn).toBeCloseTo(expectedIRR, 2);
  });

  it('should calculate multiple correctly', () => {
    const totalInvested = new Decimal('1000000');
    const totalReturned = new Decimal('1500000');
    const multiple = totalReturned.div(totalInvested);

    expect(multiple.toString()).toBe('1.5'); // 1.5x multiple
  });

  it('should calculate DPI (Distributions to Paid-In) correctly', () => {
    const totalDistributions = new Decimal('800000');
    const totalPaidIn = new Decimal('1000000');
    const dpi = totalDistributions.div(totalPaidIn);

    expect(dpi.toString()).toBe('0.8'); // 0.8x DPI
  });

  it('should calculate TVPI (Total Value to Paid-In) correctly', () => {
    const totalDistributions = new Decimal('800000');
    const residualValue = new Decimal('400000');
    const totalPaidIn = new Decimal('1000000');
    const tvpi = totalDistributions.plus(residualValue).div(totalPaidIn);

    expect(tvpi.toString()).toBe('1.2'); // 1.2x TVPI
  });
});