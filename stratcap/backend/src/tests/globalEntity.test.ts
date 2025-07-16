import request from 'supertest';
import app from '../app';
import User from '../models/User';
import Fund from '../models/Fund';
import FundFamily from '../models/FundFamily';
import InvestorEntity from '../models/InvestorEntity';
import Commitment from '../models/Commitment';
import Investment from '../models/Investment';
import { generateTestToken } from '../utils/testHelpers';
import { Decimal } from 'decimal.js';

describe('Global Entity Management API', () => {
  let authToken: string;
  let testUser: User;
  let testFundFamily: FundFamily;
  let testFund1: Fund;
  let testFund2: Fund;
  let testInvestor1: InvestorEntity;
  let testInvestor2: InvestorEntity;
  let testInvestment1: Investment;

  beforeAll(async () => {
    // Create test user
    testUser = await User.create({
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'fund_manager',
      status: 'active',
    });

    authToken = generateTestToken(testUser.id, testUser.role);

    // Create test fund family
    testFundFamily = await FundFamily.create({
      name: 'Test Fund Family',
      description: 'Test fund family for global entity tests',
    });

    // Create test funds
    testFund1 = await Fund.create({
      fundFamilyId: testFundFamily.id,
      name: 'Test Fund I',
      code: 'TF1',
      type: 'master',
      vintage: 2020,
      targetSize: '100000000',
      managementFeeRate: '2.0',
      carriedInterestRate: '20.0',
      preferredReturnRate: '8.0',
      currency: 'USD',
      status: 'investing',
    });

    testFund2 = await Fund.create({
      fundFamilyId: testFundFamily.id,
      name: 'Test Fund II',
      code: 'TF2',
      type: 'master',
      vintage: 2022,
      targetSize: '150000000',
      managementFeeRate: '2.0',
      carriedInterestRate: '20.0',
      preferredReturnRate: '8.0',
      currency: 'USD',
      status: 'investing',
    });

    // Create test investors
    testInvestor1 = await InvestorEntity.create({
      name: 'Pension Fund Alpha',
      entityType: 'pension_fund',
      geography: 'North America',
      sector: 'Public Pension',
      riskProfile: 'Conservative',
      status: 'active',
    });

    testInvestor2 = await InvestorEntity.create({
      name: 'Sovereign Wealth Beta',
      entityType: 'sovereign_wealth',
      geography: 'Europe',
      sector: 'Sovereign',
      riskProfile: 'Aggressive',
      status: 'active',
    });

    // Create test commitments
    await Commitment.create({
      fundId: testFund1.id,
      investorId: testInvestor1.id,
      commitmentAmount: '25000000',
      contributedAmount: '15000000',
      distributedAmount: '5000000',
      currentNav: '18000000',
      status: 'active',
    });

    await Commitment.create({
      fundId: testFund1.id,
      investorId: testInvestor2.id,
      commitmentAmount: '50000000',
      contributedAmount: '30000000',
      distributedAmount: '8000000',
      currentNav: '35000000',
      status: 'active',
    });

    await Commitment.create({
      fundId: testFund2.id,
      investorId: testInvestor1.id,
      commitmentAmount: '30000000',
      contributedAmount: '10000000',
      distributedAmount: '0',
      currentNav: '12000000',
      status: 'active',
    });

    // Create test investment
    testInvestment1 = await Investment.create({
      fundId: testFund1.id,
      portfolioCompany: 'TechCorp Inc',
      sector: 'Technology',
      geography: 'North America',
      investmentDate: new Date('2021-06-01'),
      currentValue: '25000000',
      totalInvested: '15000000',
      status: 'active',
      valuationMethod: 'Market Multiple',
    });
  });

  afterAll(async () => {
    // Clean up test data
    await Commitment.destroy({ where: {} });
    await Investment.destroy({ where: {} });
    await InvestorEntity.destroy({ where: {} });
    await Fund.destroy({ where: {} });
    await FundFamily.destroy({ where: {} });
    await User.destroy({ where: { id: testUser.id } });
  });

  describe('GET /api/global-entities/metrics', () => {
    it('should get global entity metrics', async () => {
      const response = await request(app)
        .get('/api/global-entities/metrics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalFunds');
      expect(response.body.data).toHaveProperty('totalInvestors');
      expect(response.body.data).toHaveProperty('totalInvestments');
      expect(response.body.data).toHaveProperty('totalCommitments');
      expect(response.body.data).toHaveProperty('overallMultiple');
      expect(response.body.data).toHaveProperty('geographyBreakdown');
      expect(response.body.data).toHaveProperty('vintageBreakdown');
    });
  });

  describe('GET /api/global-entities/investors/:investorId/summary', () => {
    it('should get investor summary', async () => {
      const response = await request(app)
        .get(`/api/global-entities/investors/${testInvestor1.id}/summary`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.investorId).toBe(testInvestor1.id);
      expect(response.body.data.investorName).toBe(testInvestor1.name);
      expect(response.body.data.fundCount).toBe(2); // Invested in both funds
      expect(response.body.data.funds).toHaveLength(2);
      expect(response.body.data).toHaveProperty('totalCommitments');
      expect(response.body.data).toHaveProperty('totalValue');
      expect(response.body.data).toHaveProperty('multipleOfMoney');
    });

    it('should return 404 for non-existent investor', async () => {
      const response = await request(app)
        .get('/api/global-entities/investors/non-existent-id/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/global-entities/funds/:fundId/summary', () => {
    it('should get fund summary', async () => {
      const response = await request(app)
        .get(`/api/global-entities/funds/${testFund1.id}/summary`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.fundId).toBe(testFund1.id);
      expect(response.body.data.fundName).toBe(testFund1.name);
      expect(response.body.data.vintage).toBe(testFund1.vintage);
      expect(response.body.data.investorCount).toBe(2); // Two investors
      expect(response.body.data.topInvestors).toHaveLength(2);
      expect(response.body.data).toHaveProperty('totalCommitments');
      expect(response.body.data).toHaveProperty('multipleOfMoney');
    });
  });

  describe('GET /api/global-entities/investments/:investmentId/summary', () => {
    it('should get investment summary', async () => {
      const response = await request(app)
        .get(`/api/global-entities/investments/${testInvestment1.id}/summary`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.investmentId).toBe(testInvestment1.id);
      expect(response.body.data.portfolioCompany).toBe(testInvestment1.portfolioCompany);
      expect(response.body.data.sector).toBe(testInvestment1.sector);
      expect(response.body.data).toHaveProperty('totalInvested');
      expect(response.body.data).toHaveProperty('currentValue');
      expect(response.body.data).toHaveProperty('multipleOfMoney');
    });
  });

  describe('GET /api/global-entities/search', () => {
    it('should search for investors', async () => {
      const response = await request(app)
        .get('/api/global-entities/search')
        .query({
          entityType: 'investor',
          geography: 'North America',
          limit: 10,
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('investors');
      expect(response.body.data.totalCount).toBeGreaterThan(0);
      expect(response.body.pagination).toHaveProperty('limit');
      expect(response.body.pagination).toHaveProperty('offset');
    });

    it('should search for funds', async () => {
      const response = await request(app)
        .get('/api/global-entities/search')
        .query({
          entityType: 'fund',
          vintage: 2020,
          limit: 10,
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('funds');
      expect(response.body.data.totalCount).toBeGreaterThan(0);
    });

    it('should search with text query', async () => {
      const response = await request(app)
        .get('/api/global-entities/search')
        .query({
          searchTerm: 'Pension',
          limit: 10,
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalCount).toBeGreaterThan(0);
    });
  });

  describe('GET /api/global-entities/investors/:investorId/portfolio', () => {
    it('should get investor portfolio', async () => {
      const response = await request(app)
        .get(`/api/global-entities/investors/${testInvestor1.id}/portfolio`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.investorId).toBe(testInvestor1.id);
      expect(response.body.data.funds).toHaveLength(2);
      expect(response.body.data).toHaveProperty('totalCommitments');
      expect(response.body.data).toHaveProperty('multipleOfMoney');
    });

    it('should get detailed investor portfolio', async () => {
      const response = await request(app)
        .get(`/api/global-entities/investors/${testInvestor1.id}/portfolio`)
        .query({ includeDetail: 'true' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.funds[0]).toHaveProperty('contributions');
      expect(response.body.data.funds[0]).toHaveProperty('distributions');
    });
  });

  describe('GET /api/global-entities/funds/:fundId/investor-base', () => {
    it('should get fund investor base', async () => {
      const response = await request(app)
        .get(`/api/global-entities/funds/${testFund1.id}/investor-base`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.fundId).toBe(testFund1.id);
      expect(response.body.data.investorCount).toBe(2);
      expect(response.body.data.topInvestors).toHaveLength(2);
      expect(response.body.data).toHaveProperty('geographyDistribution');
    });
  });

  describe('GET /api/global-entities/relationship-map', () => {
    it('should get relationship map', async () => {
      const response = await request(app)
        .get('/api/global-entities/relationship-map')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('investors');
      expect(response.body.data).toHaveProperty('funds');
      expect(response.body.data).toHaveProperty('crossInvestments');
      expect(response.body.data.investors.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/global-entities/analytics/cross-fund', () => {
    it('should get cross-fund analytics', async () => {
      const response = await request(app)
        .get('/api/global-entities/analytics/cross-fund')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('overview');
      expect(response.body.data).toHaveProperty('investorLoyalty');
      expect(response.body.data).toHaveProperty('fundOverlaps');
      expect(response.body.data.overview).toHaveProperty('totalFunds');
      expect(response.body.data.overview).toHaveProperty('averageInvestorsPerFund');
    });
  });

  describe('GET /api/global-entities/performance-comparison', () => {
    it('should compare fund performance', async () => {
      const response = await request(app)
        .get('/api/global-entities/performance-comparison')
        .query({
          entityType: 'fund',
          entityIds: [testFund1.id, testFund2.id],
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.entityType).toBe('fund');
      expect(response.body.data.comparisons).toHaveLength(2);
      expect(response.body.data.summary).toHaveProperty('avgMultiple');
      expect(response.body.data.summary).toHaveProperty('topPerformer');
    });

    it('should compare investor performance', async () => {
      const response = await request(app)
        .get('/api/global-entities/performance-comparison')
        .query({
          entityType: 'investor',
          entityIds: [testInvestor1.id, testInvestor2.id],
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.entityType).toBe('investor');
      expect(response.body.data.comparisons).toHaveLength(2);
    });

    it('should require entityType and entityIds', async () => {
      const response = await request(app)
        .get('/api/global-entities/performance-comparison')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });
  });

  describe('Authorization tests', () => {
    it('should require authentication for all endpoints', async () => {
      const response = await request(app)
        .get('/api/global-entities/metrics')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should allow viewer access to summary endpoints', async () => {
      const viewerToken = generateTestToken('viewer-id', 'viewer');
      
      const response = await request(app)
        .get('/api/global-entities/metrics')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should handle invalid investor ID gracefully', async () => {
      const response = await request(app)
        .get('/api/global-entities/investors/invalid-uuid/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should handle search with invalid parameters', async () => {
      const response = await request(app)
        .get('/api/global-entities/search')
        .query({
          limit: 'invalid',
          offset: 'invalid',
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});