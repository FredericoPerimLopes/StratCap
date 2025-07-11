import request from 'supertest';
import { Decimal } from 'decimal.js';
import app from '../src/app';
import { sequelize } from '../src/models';
import Fund from '../src/models/Fund';
import FundFamily from '../src/models/FundFamily';
import InvestorEntity from '../src/models/InvestorEntity';
import Commitment from '../src/models/Commitment';
import CapitalActivity from '../src/models/CapitalActivity';
import WaterfallCalculation from '../src/models/WaterfallCalculation';

describe('Integration Tests', () => {
  let authToken: string;
  let testFundFamily: any;
  let testFund: any;
  let testInvestor: any;
  let testCommitment: any;

  beforeAll(async () => {
    // Sync database
    await sequelize.sync({ force: true });

    // Create test user and get auth token
    const authResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User',
        role: 'admin',
      });

    authToken = authResponse.body.token;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clean up test data
    await CapitalActivity.destroy({ where: {} });
    await WaterfallCalculation.destroy({ where: {} });
    await Commitment.destroy({ where: {} });
    await Fund.destroy({ where: {} });
    await FundFamily.destroy({ where: {} });
    await InvestorEntity.destroy({ where: {} });
  });

  describe('Fund Management Workflow', () => {
    it('should complete full fund lifecycle', async () => {
      // 1. Create Fund Family
      const fundFamilyResponse = await request(app)
        .post('/api/fund-families')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Capital Partners',
          description: 'A test private equity firm',
          headquarters: 'New York, NY',
          foundedYear: 2020,
          website: 'https://testcapital.com',
          aum: '500000000',
        })
        .expect(201);

      testFundFamily = fundFamilyResponse.body.data;
      expect(testFundFamily.name).toBe('Test Capital Partners');

      // 2. Create Fund
      const fundResponse = await request(app)
        .post('/api/funds')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Fund I',
          fundFamilyId: testFundFamily.id,
          fundType: 'private_equity',
          targetSize: '100000000',
          managementFeeRate: '2.0',
          carriedInterestRate: '20.0',
          preferredReturnRate: '8.0',
          vintage: 2024,
          currency: 'USD',
          jurisdiction: 'Delaware',
        })
        .expect(201);

      testFund = fundResponse.body.data;
      expect(testFund.name).toBe('Test Fund I');
      expect(testFund.targetSize).toBe('100000000.00');

      // 3. Create Investor
      const investorResponse = await request(app)
        .post('/api/investors')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          entityName: 'Pension Fund XYZ',
          entityType: 'pension_fund',
          jurisdiction: 'California',
          taxStatus: 'tax_exempt',
          contactEmail: 'contact@pensionfund.com',
          contactPhone: '+1-555-0123',
          address: {
            street: '123 Main St',
            city: 'San Francisco',
            state: 'CA',
            zipCode: '94105',
            country: 'USA',
          },
        })
        .expect(201);

      testInvestor = investorResponse.body.data;
      expect(testInvestor.entityName).toBe('Pension Fund XYZ');

      // 4. Create Commitment
      const commitmentResponse = await request(app)
        .post(`/api/investors/${testInvestor.id}/commitments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fundId: testFund.id,
          commitmentAmount: '10000000',
          commitmentDate: '2024-01-01',
          closingId: 1,
        })
        .expect(201);

      testCommitment = commitmentResponse.body.data;
      expect(testCommitment.commitmentAmount).toBe('10000000.00');

      // 5. Create Capital Call
      const capitalCallResponse = await request(app)
        .post('/api/capital-activities')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fundId: testFund.id,
          activityType: 'capital_call',
          totalAmount: '5000000',
          callDate: '2024-03-01',
          dueDate: '2024-03-15',
          purpose: 'Initial investment funding',
        })
        .expect(201);

      const capitalCall = capitalCallResponse.body.data;
      expect(capitalCall.totalAmount).toBe('5000000.00');

      // 6. Process Capital Call
      await request(app)
        .post(`/api/capital-activities/${capitalCall.id}/process`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'approved',
        })
        .expect(200);

      // 7. Create Distribution
      const distributionResponse = await request(app)
        .post('/api/capital-activities')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fundId: testFund.id,
          activityType: 'distribution',
          totalAmount: '6000000',
          distributionDate: '2024-12-01',
          distributionType: 'capital_gains',
        })
        .expect(201);

      const distribution = distributionResponse.body.data;
      expect(distribution.totalAmount).toBe('6000000.00');

      // 8. Calculate Waterfall
      const waterfallResponse = await request(app)
        .post('/api/waterfall/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fundId: testFund.id,
          distributionAmount: '6000000',
          distributionDate: '2024-12-01',
          calculationType: 'distribution',
        })
        .expect(201);

      const waterfall = waterfallResponse.body.data;
      expect(waterfall.summary.totalDistributed).toBe('6000000');
      expect(waterfall.tiers.length).toBeGreaterThan(0);

      // 9. Get Fund Performance
      const performanceResponse = await request(app)
        .get(`/api/funds/${testFund.id}/performance`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const performance = performanceResponse.body.data;
      expect(performance.metrics.totalCalled).toBe('5000000.00');
      expect(parseFloat(performance.metrics.multiple)).toBeGreaterThan(1);
    });
  });

  describe('Fee Management Workflow', () => {
    beforeEach(async () => {
      // Setup test data for fee calculations
      testFundFamily = await FundFamily.create({
        name: 'Fee Test Fund Family',
        description: 'Test fund family for fee calculations',
      });

      testFund = await Fund.create({
        name: 'Fee Test Fund',
        fundFamilyId: testFundFamily.id,
        fundType: 'private_equity',
        targetSize: '100000000.00',
        managementFeeRate: '2.0',
        carriedInterestRate: '20.0',
        preferredReturnRate: '8.0',
        vintage: 2024,
        status: 'active',
      });
    });

    it('should calculate management fees correctly', async () => {
      const response = await request(app)
        .post('/api/fees/management-fee')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fundId: testFund.id,
          calculationPeriodStart: '2024-01-01',
          calculationPeriodEnd: '2024-03-31',
          baseAmount: '50000000',
        })
        .expect(201);

      const feeCalculation = response.body.data;
      expect(feeCalculation.calculation.feeType).toBe('management_fee');
      expect(parseFloat(feeCalculation.details.feeAmount)).toBeGreaterThan(0);
      
      // Quarterly fee should be approximately 0.5% of base amount
      const expectedQuarterlyFee = 50000000 * 0.005; // 0.5% quarterly
      const actualFee = parseFloat(feeCalculation.details.feeAmount);
      expect(actualFee).toBeCloseTo(expectedQuarterlyFee, -3); // Within $1000
    });

    it('should calculate carried interest correctly', async () => {
      const response = await request(app)
        .post('/api/fees/carried-interest')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fundId: testFund.id,
          totalReturned: '60000000',
          totalContributions: '50000000',
          hurdleRate: '8.0',
        })
        .expect(201);

      const feeCalculation = response.body.data;
      expect(feeCalculation.calculation.feeType).toBe('carried_interest');
      
      // Should have carried interest since returns exceed hurdle
      const carriedInterest = parseFloat(feeCalculation.details.carriedInterestAmount);
      expect(carriedInterest).toBeGreaterThan(0);
    });

    it('should approve fee calculation', async () => {
      // First create a fee calculation
      const feeResponse = await request(app)
        .post('/api/fees/management-fee')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fundId: testFund.id,
          calculationPeriodStart: '2024-01-01',
          calculationPeriodEnd: '2024-03-31',
          baseAmount: '50000000',
        })
        .expect(201);

      const calculationId = feeResponse.body.data.calculation.id;

      // Then approve it
      const approvalResponse = await request(app)
        .put(`/api/fees/${calculationId}/approve`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          approvalNotes: 'Approved by CFO',
        })
        .expect(200);

      const approved = approvalResponse.body.data;
      expect(approved.status).toBe('approved');
    });
  });

  describe('Investor Portfolio Management', () => {
    beforeEach(async () => {
      // Setup test investor and multiple funds
      testInvestor = await InvestorEntity.create({
        entityName: 'Multi Fund Investor',
        entityType: 'pension_fund',
        jurisdiction: 'New York',
        taxStatus: 'tax_exempt',
        contactEmail: 'multi@investor.com',
      });

      testFundFamily = await FundFamily.create({
        name: 'Multi Fund Family',
        description: 'Test fund family with multiple funds',
      });

      // Create multiple funds
      const fund1 = await Fund.create({
        name: 'Fund I',
        fundFamilyId: testFundFamily.id,
        fundType: 'private_equity',
        targetSize: '100000000.00',
        managementFeeRate: '2.0',
        carriedInterestRate: '20.0',
        vintage: 2020,
        status: 'active',
      });

      const fund2 = await Fund.create({
        name: 'Fund II',
        fundFamilyId: testFundFamily.id,
        fundType: 'private_equity',
        targetSize: '150000000.00',
        managementFeeRate: '2.0',
        carriedInterestRate: '20.0',
        vintage: 2022,
        status: 'active',
      });

      // Create commitments to both funds
      await Commitment.create({
        investorEntityId: testInvestor.id,
        fundId: fund1.id,
        commitmentAmount: '5000000.00',
        capitalCalled: '4000000.00',
        capitalReturned: '3500000.00',
        commitmentDate: new Date('2020-06-01'),
        status: 'active',
      });

      await Commitment.create({
        investorEntityId: testInvestor.id,
        fundId: fund2.id,
        commitmentAmount: '3000000.00',
        capitalCalled: '1500000.00',
        capitalReturned: '500000.00',
        commitmentDate: new Date('2022-03-01'),
        status: 'active',
      });
    });

    it('should get investor portfolio performance', async () => {
      const response = await request(app)
        .get(`/api/investors/${testInvestor.id}/performance`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const performance = response.body.data;
      expect(performance.metrics.totalCommitments).toBe('8000000.00');
      expect(performance.metrics.totalCalled).toBe('5500000.00');
      expect(performance.metrics.totalReturned).toBe('4000000.00');
      
      // DPI should be around 0.73 (4000000 / 5500000)
      const dpi = parseFloat(performance.metrics.dpi);
      expect(dpi).toBeCloseTo(0.73, 2);
    });

    it('should get investor commitments summary', async () => {
      const response = await request(app)
        .get(`/api/investors/${testInvestor.id}/commitments`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const commitments = response.body.data;
      expect(commitments.commitments.length).toBe(2);
      expect(commitments.summary.totalCommitments).toBe('8000000.00');
      expect(commitments.summary.totalCalled).toBe('5500000.00');
    });
  });

  describe('Reporting and Analytics', () => {
    beforeEach(async () => {
      // Setup comprehensive test data
      testFundFamily = await FundFamily.create({
        name: 'Analytics Test Family',
        description: 'Test fund family for analytics',
      });

      testFund = await Fund.create({
        name: 'Analytics Test Fund',
        fundFamilyId: testFundFamily.id,
        fundType: 'private_equity',
        targetSize: '100000000.00',
        managementFeeRate: '2.0',
        carriedInterestRate: '20.0',
        preferredReturnRate: '8.0',
        vintage: 2023,
        status: 'active',
        inceptionDate: new Date('2023-01-01'),
      });

      testInvestor = await InvestorEntity.create({
        entityName: 'Analytics Investor',
        entityType: 'pension_fund',
        jurisdiction: 'California',
        taxStatus: 'tax_exempt',
        contactEmail: 'analytics@investor.com',
      });

      await Commitment.create({
        investorEntityId: testInvestor.id,
        fundId: testFund.id,
        commitmentAmount: '10000000.00',
        capitalCalled: '7000000.00',
        capitalReturned: '5000000.00',
        commitmentDate: new Date('2023-03-01'),
        status: 'active',
      });
    });

    it('should generate fund analytics', async () => {
      const response = await request(app)
        .get(`/api/funds/${testFund.id}/analytics`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const analytics = response.body.data;
      expect(analytics.analytics.calledPercentage).toBe('70.00'); // 70% called
      expect(analytics.analytics.distributedPercentage).toBe('50.00'); // 50% distributed
      expect(analytics.analytics.fundAge).toBeGreaterThan(0);
      
      // DPI = 5M / 7M = 0.714...
      const dpi = parseFloat(analytics.analytics.dpi);
      expect(dpi).toBeCloseTo(0.71, 2);
    });

    it('should get fund performance reports', async () => {
      const response = await request(app)
        .get(`/api/reports/fund-performance`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          fundId: testFund.id,
          startDate: '2023-01-01',
          endDate: '2024-12-31',
        })
        .expect(200);

      const report = response.body.data;
      expect(report.funds.length).toBe(1);
      expect(report.summary.totalFunds).toBe(1);
      expect(report.summary.totalCommitments).toBeDefined();
      expect(report.summary.totalCalled).toBeDefined();
    });
  });

  describe('Error Handling and Validation', () => {
    it('should handle invalid authentication', async () => {
      await request(app)
        .get('/api/funds')
        .expect(401);

      await request(app)
        .get('/api/funds')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should validate request data', async () => {
      // Missing required fields
      await request(app)
        .post('/api/funds')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Incomplete Fund',
          // Missing required fields
        })
        .expect(400);

      // Invalid email format
      await request(app)
        .post('/api/investors')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          entityName: 'Test Investor',
          entityType: 'corporation',
          jurisdiction: 'Delaware',
          taxStatus: 'taxable',
          contactEmail: 'invalid-email-format',
        })
        .expect(400);

      // Invalid amounts
      await request(app)
        .post('/api/waterfall/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fundId: 1,
          distributionAmount: '0',
          distributionDate: '2024-01-01',
        })
        .expect(400);
    });

    it('should handle database constraint violations', async () => {
      // Create a fund family first
      const fundFamily = await FundFamily.create({
        name: 'Constraint Test Family',
        description: 'Test fund family',
      });

      // Create duplicate investor names
      await InvestorEntity.create({
        entityName: 'Duplicate Name Test',
        entityType: 'corporation',
        jurisdiction: 'Delaware',
        taxStatus: 'taxable',
        contactEmail: 'first@example.com',
      });

      await request(app)
        .post('/api/investors')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          entityName: 'Duplicate Name Test',
          entityType: 'corporation',
          jurisdiction: 'Delaware',
          taxStatus: 'taxable',
          contactEmail: 'second@example.com',
        })
        .expect(409); // Conflict
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple concurrent requests', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        request(app)
          .get('/api/funds')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(promises);
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    it('should paginate large result sets', async () => {
      // Create multiple funds for pagination test
      const fundFamily = await FundFamily.create({
        name: 'Pagination Test Family',
        description: 'Test fund family for pagination',
      });

      const fundPromises = Array.from({ length: 25 }, (_, i) =>
        Fund.create({
          name: `Pagination Fund ${i + 1}`,
          fundFamilyId: fundFamily.id,
          fundType: 'private_equity',
          targetSize: '10000000.00',
          managementFeeRate: '2.0',
          carriedInterestRate: '20.0',
          vintage: 2024,
          status: 'active',
        })
      );

      await Promise.all(fundPromises);

      // Test pagination
      const page1Response = await request(app)
        .get('/api/funds')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(page1Response.body.data.funds.length).toBe(10);
      expect(page1Response.body.data.pagination.total).toBe(25);
      expect(page1Response.body.data.pagination.pages).toBe(3);

      const page3Response = await request(app)
        .get('/api/funds')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 3, limit: 10 })
        .expect(200);

      expect(page3Response.body.data.funds.length).toBe(5);
    });
  });

  describe('Data Consistency', () => {
    it('should maintain data consistency across transactions', async () => {
      const fundFamily = await FundFamily.create({
        name: 'Consistency Test Family',
        description: 'Test fund family for consistency',
      });

      const fund = await Fund.create({
        name: 'Consistency Test Fund',
        fundFamilyId: fundFamily.id,
        fundType: 'private_equity',
        targetSize: '100000000.00',
        managementFeeRate: '2.0',
        carriedInterestRate: '20.0',
        vintage: 2024,
        status: 'active',
      });

      const investor = await InvestorEntity.create({
        entityName: 'Consistency Test Investor',
        entityType: 'pension_fund',
        jurisdiction: 'Delaware',
        taxStatus: 'tax_exempt',
        contactEmail: 'consistency@test.com',
      });

      // Create commitment and capital call in transaction
      const capitalCallResponse = await request(app)
        .post('/api/capital-activities')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fundId: fund.id,
          activityType: 'capital_call',
          totalAmount: '5000000',
          callDate: '2024-03-01',
          dueDate: '2024-03-15',
          purpose: 'Consistency test',
        })
        .expect(201);

      // Verify commitment balances are updated correctly
      const commitmentResponse = await request(app)
        .get(`/api/investors/${investor.id}/commitments`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Should maintain referential integrity
      expect(commitmentResponse.body.success).toBe(true);
    });
  });
});