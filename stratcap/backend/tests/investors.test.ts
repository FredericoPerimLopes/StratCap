import { Request, Response } from 'express';
import { Decimal } from 'decimal.js';
import InvestorController from '../src/controllers/InvestorController';
import InvestorEntity from '../src/models/InvestorEntity';
import Commitment from '../src/models/Commitment';
import DistributionEvent from '../src/models/DistributionEvent';
import Fund from '../src/models/Fund';

// Mock models
jest.mock('../src/models/InvestorEntity');
jest.mock('../src/models/Commitment');
jest.mock('../src/models/DistributionEvent');
jest.mock('../src/models/Fund');

const MockedInvestorEntity = InvestorEntity as jest.MockedClass<typeof InvestorEntity>;
const MockedCommitment = Commitment as jest.MockedClass<typeof Commitment>;
const MockedDistributionEvent = DistributionEvent as jest.MockedClass<typeof DistributionEvent>;
const MockedFund = Fund as jest.MockedClass<typeof Fund>;

describe('InvestorController', () => {
  let controller: InvestorController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    controller = new InvestorController();
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createInvestor', () => {
    it('should create investor successfully', async () => {
      const mockInvestor = {
        id: 1,
        entityName: 'Test Pension Fund',
        entityType: 'pension_fund',
        jurisdiction: 'California',
        taxStatus: 'tax_exempt',
        contactEmail: 'contact@testpension.com',
        status: 'active',
      };

      MockedInvestorEntity.create.mockResolvedValue(mockInvestor);
      
      mockRequest.body = {
        entityName: 'Test Pension Fund',
        entityType: 'pension_fund',
        jurisdiction: 'California',
        taxStatus: 'tax_exempt',
        contactEmail: 'contact@testpension.com',
        contactPhone: '+1-555-0123',
        address: {
          street: '123 Main St',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94105',
          country: 'USA',
        },
      };

      await controller.createInvestor(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockInvestor,
          message: 'Investor created successfully',
        })
      );
    });

    it('should return 400 for missing required fields', async () => {
      mockRequest.body = {
        entityName: 'Test Investor',
        // Missing required fields
      };

      await controller.createInvestor(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Missing required fields: entityType, jurisdiction, taxStatus, contactEmail',
      });
    });

    it('should return 400 for invalid entity type', async () => {
      mockRequest.body = {
        entityName: 'Test Investor',
        entityType: 'invalid_type',
        jurisdiction: 'Delaware',
        taxStatus: 'tax_exempt',
        contactEmail: 'test@example.com',
      };

      await controller.createInvestor(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Invalid entity type. Must be one of: individual, corporation, partnership, pension_fund, insurance_company, sovereign_wealth, family_office, endowment, foundation',
      });
    });

    it('should return 400 for invalid email format', async () => {
      mockRequest.body = {
        entityName: 'Test Investor',
        entityType: 'corporation',
        jurisdiction: 'Delaware',
        taxStatus: 'taxable',
        contactEmail: 'invalid-email',
      };

      await controller.createInvestor(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Invalid email format',
      });
    });

    it('should return 409 for duplicate investor name', async () => {
      MockedInvestorEntity.findOne.mockResolvedValue({
        id: 1,
        entityName: 'Existing Investor',
      });
      
      mockRequest.body = {
        entityName: 'Existing Investor',
        entityType: 'corporation',
        jurisdiction: 'Delaware',
        taxStatus: 'taxable',
        contactEmail: 'test@example.com',
      };

      await controller.createInvestor(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(409);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Investor with name "Existing Investor" already exists',
      });
    });
  });

  describe('getInvestors', () => {
    it('should return paginated investors', async () => {
      const mockInvestors = [
        {
          id: 1,
          entityName: 'Test Pension Fund',
          entityType: 'pension_fund',
          status: 'active',
          totalCommitments: '5000000.00',
          totalCalled: '3000000.00',
        },
        {
          id: 2,
          entityName: 'Investment Corp',
          entityType: 'corporation',
          status: 'active',
          totalCommitments: '3000000.00',
          totalCalled: '2000000.00',
        },
      ];

      MockedInvestorEntity.findAndCountAll.mockResolvedValue({
        rows: mockInvestors,
        count: 2,
      });

      mockRequest.query = { page: '1', limit: '10' };

      await controller.getInvestors(mockRequest as Request, mockResponse as Response);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          investors: mockInvestors,
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            pages: 1,
          },
        },
      });
    });

    it('should filter investors by entity type', async () => {
      mockRequest.query = { entityType: 'pension_fund' };

      await controller.getInvestors(mockRequest as Request, mockResponse as Response);

      expect(MockedInvestorEntity.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            entityType: 'pension_fund',
          }),
        })
      );
    });

    it('should search investors by name', async () => {
      mockRequest.query = { search: 'pension' };

      await controller.getInvestors(mockRequest as Request, mockResponse as Response);

      expect(MockedInvestorEntity.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            entityName: expect.objectContaining({
              [Symbol.for('ilike')]: '%pension%',
            }),
          }),
        })
      );
    });
  });

  describe('getInvestorById', () => {
    it('should return investor details with commitments', async () => {
      const mockInvestor = {
        id: 1,
        entityName: 'Test Pension Fund',
        entityType: 'pension_fund',
        status: 'active',
        commitments: [
          {
            id: 1,
            fundId: 1,
            commitmentAmount: '5000000.00',
            capitalCalled: '3000000.00',
            capitalReturned: '2500000.00',
            fund: {
              id: 1,
              name: 'Test Fund I',
            },
          },
        ],
        distributionEvents: [
          {
            id: 1,
            distributionAmount: '500000.00',
            eventType: 'return_of_capital',
            paymentDate: new Date('2024-01-01'),
          },
        ],
      };

      MockedInvestorEntity.findByPk.mockResolvedValue(mockInvestor);
      mockRequest.params = { id: '1' };

      await controller.getInvestorById(mockRequest as Request, mockResponse as Response);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockInvestor,
      });
    });

    it('should return 404 for non-existent investor', async () => {
      MockedInvestorEntity.findByPk.mockResolvedValue(null);
      mockRequest.params = { id: '999' };

      await controller.getInvestorById(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Investor with ID 999 not found',
      });
    });
  });

  describe('updateInvestor', () => {
    it('should update investor successfully', async () => {
      const mockInvestor = {
        id: 1,
        entityName: 'Test Pension Fund',
        status: 'active',
        update: jest.fn().mockResolvedValue({
          id: 1,
          entityName: 'Updated Pension Fund',
          status: 'active',
        }),
      };

      MockedInvestorEntity.findByPk.mockResolvedValue(mockInvestor);
      
      mockRequest.params = { id: '1' };
      mockRequest.body = { 
        entityName: 'Updated Pension Fund',
        contactEmail: 'updated@example.com',
      };

      await controller.updateInvestor(mockRequest as Request, mockResponse as Response);

      expect(mockInvestor.update).toHaveBeenCalledWith(
        expect.objectContaining({
          entityName: 'Updated Pension Fund',
          contactEmail: 'updated@example.com',
        })
      );
    });

    it('should return 404 for non-existent investor', async () => {
      MockedInvestorEntity.findByPk.mockResolvedValue(null);
      
      mockRequest.params = { id: '999' };
      mockRequest.body = { entityName: 'Updated Name' };

      await controller.updateInvestor(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Investor with ID 999 not found',
      });
    });

    it('should return 400 for invalid status update', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = { status: 'invalid_status' };

      await controller.updateInvestor(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Invalid status. Must be one of: active, inactive, suspended',
      });
    });
  });

  describe('getInvestorPerformance', () => {
    it('should calculate investor performance metrics', async () => {
      const mockInvestor = {
        id: 1,
        entityName: 'Test Pension Fund',
      };

      const mockCommitments = [
        {
          id: 1,
          fundId: 1,
          commitmentAmount: '5000000.00',
          capitalCalled: '3000000.00',
          capitalReturned: '2800000.00',
          fund: {
            id: 1,
            name: 'Test Fund I',
            vintage: 2020,
          },
        },
        {
          id: 2,
          fundId: 2,
          commitmentAmount: '3000000.00',
          capitalCalled: '2000000.00',
          capitalReturned: '1900000.00',
          fund: {
            id: 2,
            name: 'Test Fund II',
            vintage: 2022,
          },
        },
      ];

      const mockDistributions = [
        {
          id: 1,
          distributionAmount: '1500000.00',
          eventType: 'return_of_capital',
          paymentDate: new Date('2023-06-01'),
        },
        {
          id: 2,
          distributionAmount: '1300000.00',
          eventType: 'capital_gains',
          paymentDate: new Date('2024-01-01'),
        },
      ];

      MockedInvestorEntity.findByPk.mockResolvedValue(mockInvestor);
      MockedCommitment.findAll.mockResolvedValue(mockCommitments);
      MockedDistributionEvent.findAll.mockResolvedValue(mockDistributions);

      mockRequest.params = { id: '1' };

      await controller.getInvestorPerformance(mockRequest as Request, mockResponse as Response);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            investor: mockInvestor,
            metrics: expect.objectContaining({
              totalCommitments: expect.any(String),
              totalCalled: expect.any(String),
              totalReturned: expect.any(String),
              netCashFlow: expect.any(String),
              multiple: expect.any(String),
              dpi: expect.any(String),
              tvpi: expect.any(String),
            }),
          }),
        })
      );
    });

    it('should handle investor with no commitments', async () => {
      const mockInvestor = {
        id: 1,
        entityName: 'Test Investor',
      };

      MockedInvestorEntity.findByPk.mockResolvedValue(mockInvestor);
      MockedCommitment.findAll.mockResolvedValue([]);
      MockedDistributionEvent.findAll.mockResolvedValue([]);

      mockRequest.params = { id: '1' };

      await controller.getInvestorPerformance(mockRequest as Request, mockResponse as Response);

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

  describe('getInvestorCommitments', () => {
    it('should return investor commitments by fund', async () => {
      const mockCommitments = [
        {
          id: 1,
          fundId: 1,
          commitmentAmount: '5000000.00',
          capitalCalled: '3000000.00',
          capitalUncalled: '2000000.00',
          fund: {
            id: 1,
            name: 'Test Fund I',
            vintage: 2020,
          },
        },
        {
          id: 2,
          fundId: 2,
          commitmentAmount: '3000000.00',
          capitalCalled: '1500000.00',
          capitalUncalled: '1500000.00',
          fund: {
            id: 2,
            name: 'Test Fund II',
            vintage: 2022,
          },
        },
      ];

      MockedCommitment.findAll.mockResolvedValue(mockCommitments);
      mockRequest.params = { id: '1' };

      await controller.getInvestorCommitments(mockRequest as Request, mockResponse as Response);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          commitments: mockCommitments,
          summary: {
            totalCommitments: '8000000.00',
            totalCalled: '4500000.00',
            totalUncalled: '3500000.00',
            averageCallRate: '56.25',
          },
        },
      });
    });

    it('should filter commitments by fund', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.query = { fundId: '1' };

      await controller.getInvestorCommitments(mockRequest as Request, mockResponse as Response);

      expect(MockedCommitment.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            investorEntityId: 1,
            fundId: 1,
          }),
        })
      );
    });
  });

  describe('getInvestorDistributions', () => {
    it('should return investor distributions', async () => {
      const mockDistributions = [
        {
          id: 1,
          distributionAmount: '1000000.00',
          eventType: 'return_of_capital',
          paymentDate: new Date('2023-12-01'),
          paymentStatus: 'paid',
          waterfallCalculation: {
            id: 1,
            fund: {
              id: 1,
              name: 'Test Fund I',
            },
          },
        },
        {
          id: 2,
          distributionAmount: '500000.00',
          eventType: 'capital_gains',
          paymentDate: new Date('2024-01-01'),
          paymentStatus: 'paid',
          waterfallCalculation: {
            id: 2,
            fund: {
              id: 1,
              name: 'Test Fund I',
            },
          },
        },
      ];

      MockedDistributionEvent.findAndCountAll.mockResolvedValue({
        rows: mockDistributions,
        count: 2,
      });

      mockRequest.params = { id: '1' };
      mockRequest.query = { page: '1', limit: '10' };

      await controller.getInvestorDistributions(mockRequest as Request, mockResponse as Response);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          distributions: mockDistributions,
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            pages: 1,
          },
          summary: {
            totalDistributions: '1500000.00',
            returnOfCapital: '1000000.00',
            capitalGains: '500000.00',
            preferredReturn: '0.00',
            carriedInterest: '0.00',
          },
        },
      });
    });

    it('should filter distributions by event type', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.query = { eventType: 'capital_gains' };

      await controller.getInvestorDistributions(mockRequest as Request, mockResponse as Response);

      expect(MockedDistributionEvent.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            investorEntityId: 1,
            eventType: 'capital_gains',
          }),
        })
      );
    });
  });

  describe('createCommitment', () => {
    it('should create commitment successfully', async () => {
      const mockCommitment = {
        id: 1,
        investorEntityId: 1,
        fundId: 1,
        commitmentAmount: '5000000.00',
        capitalCalled: '0.00',
        capitalUncalled: '5000000.00',
        commitmentDate: new Date('2024-01-01'),
        status: 'active',
      };

      MockedInvestorEntity.findByPk.mockResolvedValue({ id: 1, entityName: 'Test Investor' });
      MockedFund.findByPk.mockResolvedValue({ id: 1, name: 'Test Fund', status: 'fundraising' });
      MockedCommitment.create.mockResolvedValue(mockCommitment);
      
      mockRequest.params = { id: '1' };
      mockRequest.body = {
        fundId: 1,
        commitmentAmount: '5000000',
        commitmentDate: '2024-01-01',
        closingId: 1,
      };

      await controller.createCommitment(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockCommitment,
        })
      );
    });

    it('should return 404 for non-existent fund', async () => {
      MockedInvestorEntity.findByPk.mockResolvedValue({ id: 1, entityName: 'Test Investor' });
      MockedFund.findByPk.mockResolvedValue(null);
      
      mockRequest.params = { id: '1' };
      mockRequest.body = {
        fundId: 999,
        commitmentAmount: '5000000',
        commitmentDate: '2024-01-01',
      };

      await controller.createCommitment(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Fund with ID 999 not found',
      });
    });

    it('should return 400 for fund not accepting new commitments', async () => {
      MockedInvestorEntity.findByPk.mockResolvedValue({ id: 1, entityName: 'Test Investor' });
      MockedFund.findByPk.mockResolvedValue({ id: 1, name: 'Test Fund', status: 'closed' });
      
      mockRequest.params = { id: '1' };
      mockRequest.body = {
        fundId: 1,
        commitmentAmount: '5000000',
        commitmentDate: '2024-01-01',
      };

      await controller.createCommitment(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Fund is not accepting new commitments (status: closed)',
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      MockedInvestorEntity.create.mockRejectedValue(new Error('Database connection failed'));
      
      mockRequest.body = {
        entityName: 'Test Investor',
        entityType: 'corporation',
        jurisdiction: 'Delaware',
        taxStatus: 'taxable',
        contactEmail: 'test@example.com',
      };

      await controller.createInvestor(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Internal server error',
          details: 'Database connection failed',
        })
      );
    });
  });
});

describe('Investor Analytics', () => {
  it('should calculate investor portfolio diversification', () => {
    const commitments = [
      { fundId: 1, commitmentAmount: '5000000', fund: { fundType: 'private_equity' } },
      { fundId: 2, commitmentAmount: '3000000', fund: { fundType: 'real_estate' } },
      { fundId: 3, commitmentAmount: '2000000', fund: { fundType: 'infrastructure' } },
    ];

    const totalCommitments = commitments.reduce((sum, c) => 
      sum + parseFloat(c.commitmentAmount), 0
    );

    const diversification = commitments.reduce((acc, c) => {
      const percentage = (parseFloat(c.commitmentAmount) / totalCommitments) * 100;
      acc[c.fund.fundType] = percentage;
      return acc;
    }, {} as Record<string, number>);

    expect(diversification.private_equity).toBeCloseTo(50); // 50%
    expect(diversification.real_estate).toBeCloseTo(30); // 30%
    expect(diversification.infrastructure).toBeCloseTo(20); // 20%
  });

  it('should calculate investor cash flow timing', () => {
    const events = [
      { date: new Date('2023-01-01'), amount: -1000000, type: 'capital_call' },
      { date: new Date('2023-06-01'), amount: -2000000, type: 'capital_call' },
      { date: new Date('2024-01-01'), amount: 1500000, type: 'distribution' },
      { date: new Date('2024-06-01'), amount: 800000, type: 'distribution' },
    ];

    const totalCalled = events
      .filter(e => e.type === 'capital_call')
      .reduce((sum, e) => sum + Math.abs(e.amount), 0);

    const totalDistributed = events
      .filter(e => e.type === 'distribution')
      .reduce((sum, e) => sum + e.amount, 0);

    const netCashFlow = totalDistributed - totalCalled;

    expect(totalCalled).toBe(3000000);
    expect(totalDistributed).toBe(2300000);
    expect(netCashFlow).toBe(-700000); // Still negative (capital not fully returned)
  });

  it('should calculate investor vintage year performance', () => {
    const commitmentsByVintage = [
      { vintage: 2020, commitmentAmount: '5000000', capitalReturned: '6000000' },
      { vintage: 2021, commitmentAmount: '3000000', capitalReturned: '2500000' },
      { vintage: 2022, commitmentAmount: '2000000', capitalReturned: '1000000' },
    ];

    const vintagePerformance = commitmentsByVintage.map(v => ({
      vintage: v.vintage,
      multiple: parseFloat(v.capitalReturned) / parseFloat(v.commitmentAmount),
    }));

    expect(vintagePerformance[0].multiple).toBeCloseTo(1.2); // 2020: 1.2x
    expect(vintagePerformance[1].multiple).toBeCloseTo(0.83); // 2021: 0.83x
    expect(vintagePerformance[2].multiple).toBeCloseTo(0.5); // 2022: 0.5x
  });
});