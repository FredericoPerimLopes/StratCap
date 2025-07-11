import request from 'supertest';
import app from '../src/app';
import { sequelize } from '../src/models';
import { createTestUser, createTestFundFamily, createTestFund, createTestInvestor } from './helpers/testData';

describe('API Integration Tests', () => {
  let authToken: string;
  let testUserId: number;
  let testFundFamilyId: number;
  let testFundId: number;
  let testInvestorId: number;

  beforeAll(async () => {
    // Sync database
    await sequelize.sync({ force: true });
    
    // Create test user and get auth token
    const testUser = await createTestUser();
    testUserId = testUser.id;
    
    const authResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'TestPassword123!'
      });
    
    authToken = authResponse.body.data.token;
    
    // Create test data
    const fundFamily = await createTestFundFamily();
    testFundFamilyId = fundFamily.id;
    
    const fund = await createTestFund(testFundFamilyId);
    testFundId = fund.id;
    
    const investor = await createTestInvestor();
    testInvestorId = investor.id;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Fund Endpoints', () => {
    describe('POST /api/funds', () => {
      it('should create a new fund', async () => {
        const fundData = {
          fundFamilyId: testFundFamilyId,
          name: 'Test Fund 2',
          code: 'TF2',
          type: 'master',
          vintage: 2024,
          targetSize: '100000000',
          managementFeeRate: '0.02',
          carriedInterestRate: '0.20',
          preferredReturnRate: '0.08'
        };

        const response = await request(app)
          .post('/api/funds')
          .set('Authorization', `Bearer ${authToken}`)
          .send(fundData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe(fundData.name);
        expect(response.body.data.code).toBe(fundData.code);
      });

      it('should validate required fields', async () => {
        const response = await request(app)
          .post('/api/funds')
          .set('Authorization', `Bearer ${authToken}`)
          .send({})
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });

    describe('GET /api/funds', () => {
      it('should return paginated funds', async () => {
        const response = await request(app)
          .get('/api/funds')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.funds).toBeInstanceOf(Array);
        expect(response.body.data.pagination).toBeDefined();
      });

      it('should filter funds by status', async () => {
        const response = await request(app)
          .get('/api/funds?status=fundraising')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });

    describe('GET /api/funds/:id', () => {
      it('should return fund by id', async () => {
        const response = await request(app)
          .get(`/api/funds/${testFundId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(testFundId);
      });

      it('should return 404 for non-existent fund', async () => {
        const response = await request(app)
          .get('/api/funds/99999')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);

        expect(response.body.success).toBe(false);
      });
    });

    describe('GET /api/funds/:id/metrics', () => {
      it('should return fund metrics', async () => {
        const response = await request(app)
          .get(`/api/funds/${testFundId}/metrics`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('totalCommitments');
        expect(response.body.data).toHaveProperty('callRate');
      });
    });
  });

  describe('Investor Endpoints', () => {
    describe('POST /api/investors', () => {
      it('should create a new investor', async () => {
        const investorData = {
          name: 'Test Investor 2',
          legalName: 'Test Investor 2 LLC',
          type: 'institution',
          domicile: 'US'
        };

        const response = await request(app)
          .post('/api/investors')
          .set('Authorization', `Bearer ${authToken}`)
          .send(investorData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe(investorData.name);
      });
    });

    describe('GET /api/investors', () => {
      it('should return paginated investors', async () => {
        const response = await request(app)
          .get('/api/investors')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.investors).toBeInstanceOf(Array);
      });
    });

    describe('GET /api/investors/:id/portfolio', () => {
      it('should return investor portfolio', async () => {
        const response = await request(app)
          .get(`/api/investors/${testInvestorId}/portfolio`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('portfolioMetrics');
      });
    });

    describe('PATCH /api/investors/:id/kyc-status', () => {
      it('should update KYC status', async () => {
        const response = await request(app)
          .patch(`/api/investors/${testInvestorId}/kyc-status`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ kycStatus: 'approved' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.kycStatus).toBe('approved');
      });
    });
  });

  describe('Commitment Endpoints', () => {
    let testCommitmentId: number;

    describe('POST /api/commitments', () => {
      it('should create a new commitment', async () => {
        // First create an investor class
        const investorClass = await request(app)
          .post('/api/fund-families/investor-classes')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            fundId: testFundId,
            name: 'Class A',
            classType: 'regular'
          });

        const commitmentData = {
          fundId: testFundId,
          investorEntityId: testInvestorId,
          investorClassId: investorClass.body.data.id,
          commitmentAmount: '1000000',
          commitmentDate: new Date().toISOString()
        };

        const response = await request(app)
          .post('/api/commitments')
          .set('Authorization', `Bearer ${authToken}`)
          .send(commitmentData)
          .expect(201);

        expect(response.body.success).toBe(true);
        testCommitmentId = response.body.data.id;
      });
    });

    describe('GET /api/commitments/:id/summary', () => {
      it('should return commitment summary', async () => {
        const response = await request(app)
          .get(`/api/commitments/${testCommitmentId}/summary`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('financial');
      });
    });
  });

  describe('Transaction Endpoints', () => {
    let testTransactionId: number;

    describe('POST /api/transactions', () => {
      it('should create a new transaction', async () => {
        // First need a commitment - using the one created above
        const commitments = await request(app)
          .get('/api/commitments')
          .set('Authorization', `Bearer ${authToken}`);

        const commitment = commitments.body.data.commitments[0];

        const transactionData = {
          fundId: testFundId,
          commitmentId: commitment.id,
          transactionDate: new Date().toISOString(),
          transactionType: 'capital_call',
          transactionCode: 'CC001',
          description: 'Test capital call',
          amount: '100000',
          direction: 'debit'
        };

        const response = await request(app)
          .post('/api/transactions')
          .set('Authorization', `Bearer ${authToken}`)
          .send(transactionData)
          .expect(201);

        expect(response.body.success).toBe(true);
        testTransactionId = response.body.data.id;
      });
    });

    describe('GET /api/transactions/summary', () => {
      it('should return transaction summary', async () => {
        const response = await request(app)
          .get('/api/transactions/summary')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('summary');
      });
    });

    describe('POST /api/transactions/:id/reverse', () => {
      it('should reverse a transaction', async () => {
        const response = await request(app)
          .post(`/api/transactions/${testTransactionId}/reverse`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ reason: 'Test reversal' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('reversalTransaction');
      });
    });
  });

  describe('Report Endpoints', () => {
    describe('GET /api/reports/dashboard', () => {
      it('should return dashboard metrics', async () => {
        const response = await request(app)
          .get('/api/reports/dashboard')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('fundMetrics');
        expect(response.body.data).toHaveProperty('investorMetrics');
      });
    });

    describe('GET /api/reports/fund/:fundId/performance', () => {
      it('should return fund performance report', async () => {
        const response = await request(app)
          .get(`/api/reports/fund/${testFundId}/performance`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('fundMetrics');
        expect(response.body.data).toHaveProperty('investorPerformance');
      });
    });

    describe('GET /api/reports/investor/:investorId/portfolio', () => {
      it('should return investor portfolio report', async () => {
        const response = await request(app)
          .get(`/api/reports/investor/${testInvestorId}/portfolio`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('overallMetrics');
      });
    });
  });

  describe('Authentication', () => {
    it('should reject requests without auth token', async () => {
      const response = await request(app)
        .get('/api/funds')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject requests with invalid auth token', async () => {
      const response = await request(app)
        .get('/api/funds')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors', async () => {
      const response = await request(app)
        .post('/api/funds')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: '' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });

    it('should handle not found errors', async () => {
      const response = await request(app)
        .get('/api/funds/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});