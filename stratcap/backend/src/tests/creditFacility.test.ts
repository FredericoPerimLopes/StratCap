import request from 'supertest';
import { app } from '../app';
import { CreditFacility } from '../models/CreditFacility';
import { CreditDrawdown } from '../models/CreditDrawdown';
import { CreditPaydown } from '../models/CreditPaydown';
import { BorrowingBase } from '../models/BorrowingBase';
import { User } from '../models/User';
import { Fund } from '../models/Fund';
import { generateTestToken } from '../utils/testHelpers';
import { Decimal } from 'decimal.js';

describe('Credit Facility Management API', () => {
  let authToken: string;
  let testUser: User;
  let testFund: Fund;
  let testFacility: CreditFacility;

  beforeAll(async () => {
    // Create test user
    testUser = await User.create({
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'fund_manager',
      status: 'active',
    });

    // Create test fund
    testFund = await Fund.create({
      fundFamilyId: 1,
      name: 'Test Fund',
      code: 'TF001',
      type: 'master',
      vintage: 2024,
      targetSize: '100000000',
      managementFeeRate: '2.0',
      carriedInterestRate: '20.0',
      preferredReturnRate: '8.0',
      currency: 'USD',
      status: 'investing',
    });

    authToken = generateTestToken(testUser.id, testUser.role);
  });

  beforeEach(async () => {
    // Clean up any existing test data
    await CreditFacility.destroy({ where: {} });
    await CreditDrawdown.destroy({ where: {} });
    await CreditPaydown.destroy({ where: {} });
    await BorrowingBase.destroy({ where: {} });
  });

  afterAll(async () => {
    await User.destroy({ where: { id: testUser.id } });
    await Fund.destroy({ where: { id: testFund.id } });
  });

  describe('POST /api/credit-facilities', () => {
    it('should create a new credit facility', async () => {
      const facilityData = {
        fundId: testFund.id,
        facilityName: 'Test Credit Facility',
        lender: 'Test Bank',
        facilityType: 'revolving',
        totalCommitment: '50000000',
        interestRate: '5.5',
        rateType: 'floating',
        benchmarkRate: 'SOFR',
        margin: '2.0',
        commitmentFeeRate: '0.5',
        maturityDate: '2026-12-31',
        effectiveDate: '2024-01-01',
        borrowingBaseRequired: false,
      };

      const response = await request(app)
        .post('/api/credit-facilities')
        .set('Authorization', `Bearer ${authToken}`)
        .send(facilityData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.facilityName).toBe(facilityData.facilityName);
      expect(response.body.data.lender).toBe(facilityData.lender);
      expect(response.body.data.facilityStatus).toBe('active');

      testFacility = response.body.data;
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/credit-facilities')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });
  });

  describe('GET /api/credit-facilities/:id', () => {
    beforeEach(async () => {
      testFacility = await CreditFacility.create({
        fundId: testFund.id,
        facilityName: 'Test Facility',
        lender: 'Test Bank',
        facilityType: 'revolving',
        totalCommitment: '50000000',
        outstandingBalance: '0',
        availableAmount: '50000000',
        interestRate: '5.5',
        rateType: 'floating',
        maturityDate: new Date('2026-12-31'),
        effectiveDate: new Date('2024-01-01'),
        facilityStatus: 'active',
        borrowingBaseRequired: false,
        covenants: {},
        securityInterest: {},
        guarantors: [],
        keyTerms: {},
      });
    });

    it('should get facility by ID', async () => {
      const response = await request(app)
        .get(`/api/credit-facilities/${testFacility.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testFacility.id);
      expect(response.body.data.facilityName).toBe(testFacility.facilityName);
    });

    it('should return 404 for non-existent facility', async () => {
      const response = await request(app)
        .get('/api/credit-facilities/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/credit-facilities/drawdowns', () => {
    beforeEach(async () => {
      testFacility = await CreditFacility.create({
        fundId: testFund.id,
        facilityName: 'Test Facility',
        lender: 'Test Bank',
        facilityType: 'revolving',
        totalCommitment: '50000000',
        outstandingBalance: '0',
        availableAmount: '50000000',
        interestRate: '5.5',
        rateType: 'floating',
        maturityDate: new Date('2026-12-31'),
        effectiveDate: new Date('2024-01-01'),
        facilityStatus: 'active',
        borrowingBaseRequired: false,
        covenants: {},
        securityInterest: {},
        guarantors: [],
        keyTerms: {},
      });
    });

    it('should create a drawdown request', async () => {
      const drawdownData = {
        facilityId: testFacility.id,
        drawdownAmount: '10000000',
        purpose: 'Working capital requirements',
        priority: 'medium',
      };

      const response = await request(app)
        .post('/api/credit-facilities/drawdowns')
        .set('Authorization', `Bearer ${authToken}`)
        .send(drawdownData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.facilityId).toBe(testFacility.id);
      expect(response.body.data.drawdownAmount).toBe(drawdownData.drawdownAmount);
      expect(response.body.data.status).toBe('pending');
    });

    it('should validate drawdown amount does not exceed facility capacity', async () => {
      const drawdownData = {
        facilityId: testFacility.id,
        drawdownAmount: '60000000', // Exceeds facility capacity
        purpose: 'Working capital requirements',
        priority: 'medium',
      };

      const response = await request(app)
        .post('/api/credit-facilities/drawdowns')
        .set('Authorization', `Bearer ${authToken}`)
        .send(drawdownData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('exceeds available');
    });
  });

  describe('POST /api/credit-facilities/paydowns', () => {
    let testDrawdown: CreditDrawdown;

    beforeEach(async () => {
      testFacility = await CreditFacility.create({
        fundId: testFund.id,
        facilityName: 'Test Facility',
        lender: 'Test Bank',
        facilityType: 'revolving',
        totalCommitment: '50000000',
        outstandingBalance: '10000000',
        availableAmount: '40000000',
        interestRate: '5.5',
        rateType: 'floating',
        maturityDate: new Date('2026-12-31'),
        effectiveDate: new Date('2024-01-01'),
        facilityStatus: 'active',
        borrowingBaseRequired: false,
        covenants: {},
        securityInterest: {},
        guarantors: [],
        keyTerms: {},
      });
    });

    it('should create a paydown request', async () => {
      const paydownData = {
        facilityId: testFacility.id,
        paydownAmount: '5000000',
        paymentDate: '2024-08-01',
        paydownType: 'voluntary',
        paymentMethod: 'wire',
        purpose: 'Early repayment',
      };

      const response = await request(app)
        .post('/api/credit-facilities/paydowns')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paydownData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.facilityId).toBe(testFacility.id);
      expect(response.body.data.paydownAmount).toBe(paydownData.paydownAmount);
      expect(response.body.data.status).toBe('pending');
    });

    it('should validate paydown amount', async () => {
      const paydownData = {
        facilityId: testFacility.id,
        paydownAmount: '0', // Invalid amount
        paymentDate: '2024-08-01',
        paydownType: 'voluntary',
        paymentMethod: 'wire',
      };

      const response = await request(app)
        .post('/api/credit-facilities/paydowns')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paydownData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('greater than zero');
    });
  });

  describe('GET /api/credit-facilities/:id/utilization', () => {
    beforeEach(async () => {
      testFacility = await CreditFacility.create({
        fundId: testFund.id,
        facilityName: 'Test Facility',
        lender: 'Test Bank',
        facilityType: 'revolving',
        totalCommitment: '50000000',
        outstandingBalance: '20000000',
        availableAmount: '30000000',
        interestRate: '5.5',
        rateType: 'floating',
        maturityDate: new Date('2026-12-31'),
        effectiveDate: new Date('2024-01-01'),
        facilityStatus: 'active',
        borrowingBaseRequired: false,
        covenants: {},
        securityInterest: {},
        guarantors: [],
        keyTerms: {},
      });
    });

    it('should get facility utilization summary', async () => {
      const response = await request(app)
        .get(`/api/credit-facilities/${testFacility.id}/utilization`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.facilityId).toBe(testFacility.id);
      expect(response.body.data.totalCommitment).toBeDefined();
      expect(response.body.data.outstandingBalance).toBeDefined();
      expect(response.body.data.utilizationPercentage).toBeDefined();
    });
  });

  describe('GET /api/credit-facilities/:id/fees/calculate', () => {
    beforeEach(async () => {
      testFacility = await CreditFacility.create({
        fundId: testFund.id,
        facilityName: 'Test Facility',
        lender: 'Test Bank',
        facilityType: 'revolving',
        totalCommitment: '50000000',
        outstandingBalance: '20000000',
        availableAmount: '30000000',
        interestRate: '5.5',
        rateType: 'floating',
        commitmentFeeRate: '0.5',
        maturityDate: new Date('2026-12-31'),
        effectiveDate: new Date('2024-01-01'),
        facilityStatus: 'active',
        borrowingBaseRequired: false,
        covenants: {},
        securityInterest: {},
        guarantors: [],
        keyTerms: {},
      });
    });

    it('should calculate fees for a period', async () => {
      const periodStart = '2024-07-01';
      const periodEnd = '2024-07-31';

      const response = await request(app)
        .get(`/api/credit-facilities/${testFacility.id}/fees/calculate`)
        .query({ periodStart, periodEnd })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.facilityId).toBe(testFacility.id);
      expect(response.body.data.fees.interestFee).toBeDefined();
      expect(response.body.data.fees.commitmentFee).toBeDefined();
      expect(response.body.data.totalFees).toBeDefined();
    });
  });

  describe('POST /api/credit-facilities/borrowing-base', () => {
    beforeEach(async () => {
      testFacility = await CreditFacility.create({
        fundId: testFund.id,
        facilityName: 'Test Facility',
        lender: 'Test Bank',
        facilityType: 'revolving',
        totalCommitment: '50000000',
        outstandingBalance: '0',
        availableAmount: '50000000',
        interestRate: '5.5',
        rateType: 'floating',
        maturityDate: new Date('2026-12-31'),
        effectiveDate: new Date('2024-01-01'),
        facilityStatus: 'active',
        borrowingBaseRequired: true,
        covenants: {},
        securityInterest: {},
        guarantors: [],
        keyTerms: {},
      });
    });

    it('should create a borrowing base calculation', async () => {
      const borrowingBaseData = {
        facilityId: testFacility.id,
        reportingDate: '2024-07-31',
        eligibleAssets: '40000000',
        ineligibleAssets: '5000000',
        advanceRate: '85',
        assetDetails: {
          totalAssets: '45000000',
          breakdown: {
            loans: '35000000',
            bonds: '10000000',
          },
        },
      };

      const response = await request(app)
        .post('/api/credit-facilities/borrowing-base')
        .set('Authorization', `Bearer ${authToken}`)
        .send(borrowingBaseData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.facilityId).toBe(testFacility.id);
      expect(response.body.data.status).toBe('draft');
    });

    it('should require borrowing base for facilities that need it', async () => {
      // Update facility to not require borrowing base
      await testFacility.update({ borrowingBaseRequired: false });

      const borrowingBaseData = {
        facilityId: testFacility.id,
        reportingDate: '2024-07-31',
        eligibleAssets: '40000000',
        ineligibleAssets: '5000000',
        advanceRate: '85',
        assetDetails: {},
      };

      const response = await request(app)
        .post('/api/credit-facilities/borrowing-base')
        .set('Authorization', `Bearer ${authToken}`)
        .send(borrowingBaseData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('does not require borrowing base');
    });
  });

  describe('PUT /api/credit-facilities/:id', () => {
    beforeEach(async () => {
      testFacility = await CreditFacility.create({
        fundId: testFund.id,
        facilityName: 'Test Facility',
        lender: 'Test Bank',
        facilityType: 'revolving',
        totalCommitment: '50000000',
        outstandingBalance: '0',
        availableAmount: '50000000',
        interestRate: '5.5',
        rateType: 'floating',
        maturityDate: new Date('2026-12-31'),
        effectiveDate: new Date('2024-01-01'),
        facilityStatus: 'active',
        borrowingBaseRequired: false,
        covenants: {},
        securityInterest: {},
        guarantors: [],
        keyTerms: {},
      });
    });

    it('should update facility details', async () => {
      const updates = {
        facilityName: 'Updated Facility Name',
        interestRate: '6.0',
        totalCommitment: '60000000',
      };

      const response = await request(app)
        .put(`/api/credit-facilities/${testFacility.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.facilityName).toBe(updates.facilityName);
      expect(response.body.data.interestRate).toBe(updates.interestRate);
    });
  });

  describe('GET /api/credit-facilities/fund/:fundId/metrics', () => {
    beforeEach(async () => {
      // Create multiple facilities for comprehensive metrics
      await CreditFacility.bulkCreate([
        {
          fundId: testFund.id,
          facilityName: 'Facility 1',
          lender: 'Bank 1',
          facilityType: 'revolving',
          totalCommitment: '30000000',
          outstandingBalance: '10000000',
          availableAmount: '20000000',
          interestRate: '5.5',
          rateType: 'floating',
          maturityDate: new Date('2026-12-31'),
          effectiveDate: new Date('2024-01-01'),
          facilityStatus: 'active',
          borrowingBaseRequired: false,
          covenants: {},
          securityInterest: {},
          guarantors: [],
          keyTerms: {},
        },
        {
          fundId: testFund.id,
          facilityName: 'Facility 2',
          lender: 'Bank 2',
          facilityType: 'term_loan',
          totalCommitment: '20000000',
          outstandingBalance: '15000000',
          availableAmount: '5000000',
          interestRate: '6.0',
          rateType: 'fixed',
          maturityDate: new Date('2025-12-31'),
          effectiveDate: new Date('2024-01-01'),
          facilityStatus: 'active',
          borrowingBaseRequired: false,
          covenants: {},
          securityInterest: {},
          guarantors: [],
          keyTerms: {},
        },
      ]);
    });

    it('should get comprehensive credit metrics for a fund', async () => {
      const response = await request(app)
        .get(`/api/credit-facilities/fund/${testFund.id}/metrics`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalFacilities).toBe(2);
      expect(response.body.data.facilitiesByStatus).toBeDefined();
      expect(response.body.data.facilitiesByType).toBeDefined();
      expect(response.body.data.totalCommitment).toBeDefined();
      expect(response.body.data.totalOutstanding).toBeDefined();
      expect(response.body.data.averageUtilization).toBeDefined();
    });
  });
});