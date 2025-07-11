import { Request, Response } from 'express';
import { Decimal } from 'decimal.js';
import FeeController from '../src/controllers/FeeController';
import FeeService from '../src/services/FeeService';
import ManagementFeeService from '../src/services/ManagementFeeService';
import CarriedInterestFeeService from '../src/services/CarriedInterestFeeService';
import FeeOffsetService from '../src/services/FeeOffsetService';
import FeeCalculation from '../src/models/FeeCalculation';
import FeeCharge from '../src/models/FeeCharge';
import Fund from '../src/models/Fund';

// Mock models and services
jest.mock('../src/models/FeeCalculation');
jest.mock('../src/models/FeeCharge');
jest.mock('../src/models/Fund');
jest.mock('../src/services/FeeService');
jest.mock('../src/services/ManagementFeeService');
jest.mock('../src/services/CarriedInterestFeeService');
jest.mock('../src/services/FeeOffsetService');

const MockedFeeCalculation = FeeCalculation as jest.MockedClass<typeof FeeCalculation>;
const MockedFeeCharge = FeeCharge as jest.MockedClass<typeof FeeCharge>;
const MockedFund = Fund as jest.MockedClass<typeof Fund>;
const MockedFeeService = FeeService as jest.MockedClass<typeof FeeService>;
const MockedManagementFeeService = ManagementFeeService as jest.MockedClass<typeof ManagementFeeService>;

describe('FeeController', () => {
  let controller: FeeController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    controller = new FeeController();
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
      managementFeeRate: '2.0',
      carriedInterestRate: '20.0',
      status: 'active',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateManagementFee', () => {
    it('should calculate management fee successfully', async () => {
      const mockFeeCalculation = {
        id: 1,
        fundId: 1,
        feeType: 'management_fee',
        calculationPeriodStart: new Date('2024-01-01'),
        calculationPeriodEnd: new Date('2024-03-31'),
        feeRate: '2.0',
        baseAmount: '1000000.00',
        calculatedAmount: '5000.00',
        status: 'calculated',
      };

      MockedFeeCalculation.create.mockResolvedValue(mockFeeCalculation);
      MockedManagementFeeService.prototype.calculateQuarterlyFee = jest.fn().mockResolvedValue({
        feeAmount: new Decimal('5000'),
        baseAmount: new Decimal('1000000'),
        dailyRate: new Decimal('0.0547945'),
        daysInPeriod: 91,
        calculations: {
          annualRate: new Decimal('2.0'),
          quarterlyRate: new Decimal('0.5'),
          dailyRate: new Decimal('0.0547945'),
        },
      });
      
      mockRequest.body = {
        fundId: 1,
        calculationPeriodStart: '2024-01-01',
        calculationPeriodEnd: '2024-03-31',
        baseAmount: '1000000',
      };

      await controller.calculateManagementFee(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            calculation: mockFeeCalculation,
            details: expect.objectContaining({
              feeAmount: '5000',
              baseAmount: '1000000',
            }),
          }),
        })
      );
    });

    it('should return 400 for missing required fields', async () => {
      mockRequest.body = {
        fundId: 1,
        // Missing required fields
      };

      await controller.calculateManagementFee(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Missing required fields: calculationPeriodStart, calculationPeriodEnd, baseAmount',
      });
    });

    it('should return 404 for non-existent fund', async () => {
      MockedFund.findByPk.mockResolvedValue(null);
      
      mockRequest.body = {
        fundId: 999,
        calculationPeriodStart: '2024-01-01',
        calculationPeriodEnd: '2024-03-31',
        baseAmount: '1000000',
      };

      await controller.calculateManagementFee(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Fund with ID 999 not found',
      });
    });

    it('should return 400 for invalid base amount', async () => {
      mockRequest.body = {
        fundId: 1,
        calculationPeriodStart: '2024-01-01',
        calculationPeriodEnd: '2024-03-31',
        baseAmount: '0',
      };

      await controller.calculateManagementFee(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Base amount must be greater than 0',
      });
    });
  });

  describe('calculateCarriedInterestFee', () => {
    it('should calculate carried interest fee successfully', async () => {
      const mockFeeCalculation = {
        id: 1,
        fundId: 1,
        feeType: 'carried_interest',
        calculationDate: new Date('2024-01-01'),
        feeRate: '20.0',
        baseAmount: '500000.00',
        calculatedAmount: '100000.00',
        status: 'calculated',
      };

      MockedFeeCalculation.create.mockResolvedValue(mockFeeCalculation);
      MockedCarriedInterestFeeService.prototype.calculateCarriedInterest = jest.fn().mockResolvedValue({
        carriedInterestAmount: new Decimal('100000'),
        totalReturned: new Decimal('1500000'),
        totalContributions: new Decimal('1000000'),
        hurdleExcess: new Decimal('500000'),
        calculations: {
          totalProfit: new Decimal('500000'),
          hurdleRate: new Decimal('8.0'),
          carriedInterestRate: new Decimal('20.0'),
        },
      });
      
      mockRequest.body = {
        fundId: 1,
        totalReturned: '1500000',
        totalContributions: '1000000',
        hurdleRate: '8.0',
      };

      await controller.calculateCarriedInterestFee(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            calculation: mockFeeCalculation,
            details: expect.objectContaining({
              carriedInterestAmount: '100000',
              totalReturned: '1500000',
            }),
          }),
        })
      );
    });

    it('should handle case with no carried interest earned', async () => {
      MockedCarriedInterestFeeService.prototype.calculateCarriedInterest = jest.fn().mockResolvedValue({
        carriedInterestAmount: new Decimal('0'),
        totalReturned: new Decimal('800000'),
        totalContributions: new Decimal('1000000'),
        hurdleExcess: new Decimal('0'),
        calculations: {
          totalProfit: new Decimal('0'),
          hurdleRate: new Decimal('8.0'),
          carriedInterestRate: new Decimal('20.0'),
        },
      });
      
      mockRequest.body = {
        fundId: 1,
        totalReturned: '800000',
        totalContributions: '1000000',
        hurdleRate: '8.0',
      };

      await controller.calculateCarriedInterestFee(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            details: expect.objectContaining({
              carriedInterestAmount: '0',
            }),
          }),
        })
      );
    });
  });

  describe('getFeeCalculations', () => {
    it('should return paginated fee calculations', async () => {
      const mockCalculations = [
        {
          id: 1,
          fundId: 1,
          feeType: 'management_fee',
          calculatedAmount: '5000.00',
          status: 'calculated',
        },
        {
          id: 2,
          fundId: 1,
          feeType: 'carried_interest',
          calculatedAmount: '25000.00',
          status: 'calculated',
        },
      ];

      MockedFeeCalculation.findAndCountAll.mockResolvedValue({
        rows: mockCalculations,
        count: 2,
      });

      mockRequest.params = { fundId: '1' };
      mockRequest.query = { page: '1', limit: '10' };

      await controller.getFeeCalculations(mockRequest as Request, mockResponse as Response);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          calculations: mockCalculations,
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            pages: 1,
          },
        },
      });
    });

    it('should filter calculations by fee type', async () => {
      const mockCalculations = [
        {
          id: 1,
          fundId: 1,
          feeType: 'management_fee',
          calculatedAmount: '5000.00',
          status: 'calculated',
        },
      ];

      MockedFeeCalculation.findAndCountAll.mockResolvedValue({
        rows: mockCalculations,
        count: 1,
      });

      mockRequest.params = { fundId: '1' };
      mockRequest.query = { feeType: 'management_fee' };

      await controller.getFeeCalculations(mockRequest as Request, mockResponse as Response);

      expect(MockedFeeCalculation.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            fundId: 1,
            feeType: 'management_fee',
          }),
        })
      );
    });
  });

  describe('approveFeeCalculation', () => {
    it('should approve fee calculation successfully', async () => {
      const mockCalculation = {
        id: 1,
        status: 'calculated',
        update: jest.fn().mockResolvedValue({
          id: 1,
          status: 'approved',
        }),
      };

      MockedFeeCalculation.findByPk.mockResolvedValue(mockCalculation);
      
      mockRequest.params = { id: '1' };
      mockRequest.body = { approvalNotes: 'Approved by CFO' };

      await controller.approveFeeCalculation(mockRequest as Request, mockResponse as Response);

      expect(mockCalculation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'approved',
          approvedBy: 1,
          approvalNotes: 'Approved by CFO',
        })
      );
    });

    it('should return 400 for calculation not in calculated status', async () => {
      const mockCalculation = {
        id: 1,
        status: 'draft',
      };

      MockedFeeCalculation.findByPk.mockResolvedValue(mockCalculation);
      
      mockRequest.params = { id: '1' };

      await controller.approveFeeCalculation(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Only calculated fee calculations can be approved',
      });
    });
  });

  describe('createFeeOffset', () => {
    it('should create fee offset successfully', async () => {
      const mockOffset = {
        id: 1,
        feeCalculationId: 1,
        offsetType: 'expense_offset',
        offsetAmount: '1000.00',
        description: 'Legal fees offset',
        status: 'active',
      };

      MockedFeeOffsetService.prototype.createFeeOffset = jest.fn().mockResolvedValue(mockOffset);
      
      mockRequest.body = {
        feeCalculationId: 1,
        offsetType: 'expense_offset',
        offsetAmount: '1000',
        description: 'Legal fees offset',
      };

      await controller.createFeeOffset(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockOffset,
        })
      );
    });

    it('should return 400 for invalid offset type', async () => {
      mockRequest.body = {
        feeCalculationId: 1,
        offsetType: 'invalid_type',
        offsetAmount: '1000',
      };

      await controller.createFeeOffset(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Invalid offset type. Must be one of: expense_offset, rebate, adjustment',
      });
    });
  });
});

describe('ManagementFeeService', () => {
  let service: ManagementFeeService;

  beforeEach(() => {
    service = new ManagementFeeService();
  });

  describe('calculateQuarterlyFee', () => {
    it('should calculate quarterly management fee correctly', async () => {
      const result = await service.calculateQuarterlyFee(
        new Decimal('1000000'), // baseAmount
        new Decimal('2.0'),     // annualRate
        new Date('2024-01-01'), // startDate
        new Date('2024-03-31')  // endDate
      );

      expect(result.feeAmount.toString()).toBe('5000'); // 2% annual on $1M for quarter
      expect(result.baseAmount.toString()).toBe('1000000');
      expect(result.daysInPeriod).toBe(91); // Q1 2024 has 91 days
      expect(result.calculations.quarterlyRate.toString()).toBe('0.5');
    });

    it('should handle leap year calculations', async () => {
      const result = await service.calculateQuarterlyFee(
        new Decimal('1000000'),
        new Decimal('2.0'),
        new Date('2024-01-01'), // 2024 is a leap year
        new Date('2024-12-31')
      );

      // Should account for 366 days in leap year
      expect(result.daysInPeriod).toBe(366);
      expect(result.feeAmount.toString()).toBe('20000'); // Full year fee
    });

    it('should calculate partial period correctly', async () => {
      const result = await service.calculateQuarterlyFee(
        new Decimal('1000000'),
        new Decimal('2.0'),
        new Date('2024-01-15'), // Mid-month start
        new Date('2024-02-14')  // 30-day period
      );

      expect(result.daysInPeriod).toBe(31); // Jan 15 to Feb 14 inclusive
      const expectedFee = new Decimal('1000000').mul('2.0').div(100).mul(31).div(366); // Leap year
      expect(result.feeAmount.toString()).toBe(expectedFee.toFixed(2));
    });

    it('should handle zero fee rate', async () => {
      const result = await service.calculateQuarterlyFee(
        new Decimal('1000000'),
        new Decimal('0'),
        new Date('2024-01-01'),
        new Date('2024-03-31')
      );

      expect(result.feeAmount.toString()).toBe('0');
      expect(result.calculations.quarterlyRate.toString()).toBe('0');
    });
  });

  describe('calculateAnnualFee', () => {
    it('should calculate annual management fee correctly', async () => {
      const result = await service.calculateAnnualFee(
        new Decimal('1000000'),
        new Decimal('2.0'),
        2024
      );

      expect(result.feeAmount.toString()).toBe('20000'); // 2% of $1M
      expect(result.baseAmount.toString()).toBe('1000000');
      expect(result.daysInPeriod).toBe(366); // 2024 is leap year
    });

    it('should handle non-leap year', async () => {
      const result = await service.calculateAnnualFee(
        new Decimal('1000000'),
        new Decimal('2.0'),
        2023
      );

      expect(result.daysInPeriod).toBe(365); // 2023 is not leap year
    });
  });
});

describe('CarriedInterestFeeService', () => {
  let service: CarriedInterestFeeService;

  beforeEach(() => {
    service = new CarriedInterestFeeService();
  });

  describe('calculateCarriedInterest', () => {
    it('should calculate carried interest correctly when hurdle is met', async () => {
      const result = await service.calculateCarriedInterest(
        new Decimal('1500000'), // totalReturned
        new Decimal('1000000'), // totalContributions
        new Decimal('8.0'),     // hurdleRate
        new Decimal('20.0')     // carriedInterestRate
      );

      // Profit = 1,500,000 - 1,000,000 = 500,000
      // Hurdle = 1,000,000 * 8% = 80,000
      // Excess = 500,000 - 80,000 = 420,000
      // Carried Interest = 420,000 * 20% = 84,000
      expect(result.carriedInterestAmount.toString()).toBe('84000');
      expect(result.hurdleExcess.toString()).toBe('420000');
    });

    it('should return zero carried interest when hurdle not met', async () => {
      const result = await service.calculateCarriedInterest(
        new Decimal('1050000'), // totalReturned
        new Decimal('1000000'), // totalContributions
        new Decimal('8.0'),     // hurdleRate
        new Decimal('20.0')     // carriedInterestRate
      );

      // Profit = 50,000
      // Hurdle = 80,000
      // Since profit < hurdle, no carried interest
      expect(result.carriedInterestAmount.toString()).toBe('0');
      expect(result.hurdleExcess.toString()).toBe('0');
    });

    it('should handle zero hurdle rate', async () => {
      const result = await service.calculateCarriedInterest(
        new Decimal('1200000'), // totalReturned
        new Decimal('1000000'), // totalContributions
        new Decimal('0'),       // hurdleRate
        new Decimal('20.0')     // carriedInterestRate
      );

      // No hurdle, so carried interest on full profit
      // Profit = 200,000
      // Carried Interest = 200,000 * 20% = 40,000
      expect(result.carriedInterestAmount.toString()).toBe('40000');
    });

    it('should handle loss scenario', async () => {
      const result = await service.calculateCarriedInterest(
        new Decimal('800000'),  // totalReturned
        new Decimal('1000000'), // totalContributions
        new Decimal('8.0'),     // hurdleRate
        new Decimal('20.0')     // carriedInterestRate
      );

      // Loss scenario - no carried interest
      expect(result.carriedInterestAmount.toString()).toBe('0');
    });
  });
});

describe('FeeOffsetService', () => {
  let service: FeeOffsetService;

  beforeEach(() => {
    service = new FeeOffsetService();
  });

  describe('createFeeOffset', () => {
    it('should create expense offset correctly', async () => {
      const result = await service.createFeeOffset(
        1, // feeCalculationId
        'expense_offset',
        new Decimal('5000'),
        'Legal fees for fund formation'
      );

      expect(result.offsetType).toBe('expense_offset');
      expect(result.offsetAmount.toString()).toBe('5000');
      expect(result.description).toBe('Legal fees for fund formation');
    });

    it('should validate offset amount is positive', async () => {
      await expect(service.createFeeOffset(
        1,
        'expense_offset',
        new Decimal('-1000'),
        'Invalid negative offset'
      )).rejects.toThrow('Offset amount must be positive');
    });

    it('should apply offset to fee calculation', async () => {
      const mockFeeCalculation = {
        id: 1,
        calculatedAmount: '10000.00',
        update: jest.fn(),
      };

      MockedFeeCalculation.findByPk.mockResolvedValue(mockFeeCalculation);

      await service.applyOffsetToCalculation(1, new Decimal('2000'));

      expect(mockFeeCalculation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          calculatedAmount: '8000.00', // 10000 - 2000
        })
      );
    });
  });
});

describe('Integration Tests', () => {
  it('should handle complete fee calculation workflow', async () => {
    const controller = new FeeController();
    
    // Mock complete workflow
    const mockFund = {
      id: 1,
      managementFeeRate: '2.0',
      carriedInterestRate: '20.0',
    };
    
    MockedFund.findByPk.mockResolvedValue(mockFund);
    
    const mockRequest = {
      body: {
        fundId: 1,
        calculationPeriodStart: '2024-01-01',
        calculationPeriodEnd: '2024-03-31',
        baseAmount: '1000000',
      },
      user: { id: 1 },
    } as Request;

    const mockResponse = {
      status: jest.fn().mockReturnValue({
        json: jest.fn(),
      }),
    } as unknown as Response;

    // This should complete without errors
    await controller.calculateManagementFee(mockRequest, mockResponse);
    
    expect(mockResponse.status).toHaveBeenCalledWith(201);
  });
});

describe('Error Handling and Edge Cases', () => {
  let service: ManagementFeeService;

  beforeEach(() => {
    service = new ManagementFeeService();
  });

  it('should handle invalid date ranges', async () => {
    await expect(service.calculateQuarterlyFee(
      new Decimal('1000000'),
      new Decimal('2.0'),
      new Date('2024-03-31'), // End before start
      new Date('2024-01-01')
    )).rejects.toThrow('End date must be after start date');
  });

  it('should handle very large amounts with precision', async () => {
    const result = await service.calculateQuarterlyFee(
      new Decimal('999999999999.99'), // Very large amount
      new Decimal('2.5'),
      new Date('2024-01-01'),
      new Date('2024-03-31')
    );

    expect(result.feeAmount.toString()).toMatch(/^\d+\.\d{2}$/); // Should maintain 2 decimal precision
  });

  it('should handle very small fee rates', async () => {
    const result = await service.calculateQuarterlyFee(
      new Decimal('1000000'),
      new Decimal('0.001'), // 0.001% annual rate
      new Date('2024-01-01'),
      new Date('2024-03-31')
    );

    expect(result.feeAmount.gt(0)).toBe(true); // Should still calculate non-zero fee
  });
});