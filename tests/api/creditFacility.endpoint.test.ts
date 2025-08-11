import request from 'supertest';
import app from '../../stratcap/backend/src/app';
import { sequelize } from '../../stratcap/backend/src/models';
import { createTestUser, createTestFund, createTestFundFamily } from '../helpers/testData';

describe('Credit Facility API Endpoints', () => {
  let authToken: string;
  let testFundId: number;
  let testFacilityId: number;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    
    const testUser = await createTestUser();
    const authResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'TestPassword123!'
      });
    authToken = authResponse.body.data.token;

    const fundFamily = await createTestFundFamily();
    const fund = await createTestFund(fundFamily.id);
    testFundId = fund.id;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Credit Facility Management', () => {
    describe('POST /api/credit-facilities', () => {
      it('should create a new credit facility', async () => {
        const facilityData = {
          name: 'Test Credit Line',
          facilityType: 'revolving_credit',
          totalCommitment: '50000000.00',
          currency: 'USD',
          interestRate: '5.5',
          maturityDate: '2025-12-31',
          lenderName: 'Test Bank',
          fundId: testFundId,
          covenants: {
            maxLeverageRatio: 3.0,
            minCoverageRatio: 1.5
          }
        };

        const response = await request(app)
          .post('/api/credit-facilities')
          .set('Authorization', `Bearer ${authToken}`)
          .send(facilityData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe(facilityData.name);
        expect(response.body.data.totalCommitment).toBe(facilityData.totalCommitment);
        testFacilityId = response.body.data.id;
      });

      it('should validate required fields', async () => {
        const response = await request(app)
          .post('/api/credit-facilities')
          .set('Authorization', `Bearer ${authToken}`)
          .send({})
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('validation');
      });

      it('should validate interest rate constraints', async () => {
        const response = await request(app)
          .post('/api/credit-facilities')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'Invalid Rate Facility',
            facilityType: 'term_loan',
            totalCommitment: '10000000',
            interestRate: '-1.5', // Invalid negative rate
            fundId: testFundId
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });

    describe('GET /api/credit-facilities', () => {
      it('should return paginated credit facilities', async () => {
        const response = await request(app)
          .get('/api/credit-facilities')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
        expect(response.body.pagination).toBeDefined();
      });

      it('should filter by facility type', async () => {
        const response = await request(app)
          .get('/api/credit-facilities?facilityType=revolving_credit')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        response.body.data.forEach((facility: any) => {
          expect(facility.facilityType).toBe('revolving_credit');
        });
      });
    });

    describe('GET /api/credit-facilities/:id', () => {
      it('should return specific credit facility', async () => {
        const response = await request(app)
          .get(`/api/credit-facilities/${testFacilityId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(testFacilityId);
      });

      it('should return 404 for non-existent facility', async () => {
        const response = await request(app)
          .get('/api/credit-facilities/99999')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);

        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('Drawdown Operations', () => {
    let testDrawdownId: number;

    describe('POST /api/credit-facilities/:id/drawdowns', () => {
      it('should create a new drawdown request', async () => {
        const drawdownData = {
          amount: '5000000.00',
          requestedDate: new Date().toISOString(),
          purpose: 'Working capital for portfolio company',
          maturityDate: '2025-06-30'
        };

        const response = await request(app)
          .post(`/api/credit-facilities/${testFacilityId}/drawdowns`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(drawdownData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.amount).toBe(drawdownData.amount);
        expect(response.body.data.status).toBe('pending');
        testDrawdownId = response.body.data.id;
      });

      it('should validate drawdown amount against available credit', async () => {
        const response = await request(app)
          .post(`/api/credit-facilities/${testFacilityId}/drawdowns`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            amount: '60000000.00', // Exceeds facility commitment
            requestedDate: new Date().toISOString(),
            purpose: 'Large drawdown'
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('exceeds available');
      });
    });

    describe('POST /api/credit-facilities/drawdowns/:id/approve', () => {
      it('should approve a drawdown request', async () => {
        const response = await request(app)
          .post(`/api/credit-facilities/drawdowns/${testDrawdownId}/approve`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBe('approved');
      });
    });

    describe('POST /api/credit-facilities/drawdowns/:id/execute', () => {
      it('should execute an approved drawdown', async () => {
        const response = await request(app)
          .post(`/api/credit-facilities/drawdowns/${testDrawdownId}/execute`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBe('executed');
        expect(response.body.data.executionDate).toBeDefined();
      });
    });
  });

  describe('Outstanding Balance Tracking', () => {
    describe('GET /api/credit-facilities/:id/balance', () => {
      it('should return current outstanding balance', async () => {
        const response = await request(app)
          .get(`/api/credit-facilities/${testFacilityId}/balance`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.outstandingPrincipal).toBeDefined();
        expect(response.body.data.outstandingInterest).toBeDefined();
        expect(response.body.data.totalOutstanding).toBeDefined();
        expect(response.body.data.availableCredit).toBeDefined();
      });

      it('should return balance as of specific date', async () => {
        const asOfDate = '2024-06-30';
        const response = await request(app)
          .get(`/api/credit-facilities/${testFacilityId}/balance?asOfDate=${asOfDate}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.asOfDate).toBe(asOfDate);
      });
    });
  });

  describe('Interest Calculations', () => {
    describe('POST /api/credit-facilities/:id/interest/calculate', () => {
      it('should calculate interest for a period', async () => {
        const calculationData = {
          startDate: '2024-01-01',
          endDate: '2024-03-31',
          principalAmount: '5000000.00'
        };

        const response = await request(app)
          .post(`/api/credit-facilities/${testFacilityId}/interest/calculate`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(calculationData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.interestAmount).toBeDefined();
        expect(response.body.data.dailyRate).toBeDefined();
        expect(response.body.data.numberOfDays).toBeDefined();
        expect(parseFloat(response.body.data.interestAmount)).toBeGreaterThan(0);
      });

      it('should handle compound interest calculations', async () => {
        const response = await request(app)
          .post(`/api/credit-facilities/${testFacilityId}/interest/calculate`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            startDate: '2024-01-01',
            endDate: '2024-12-31',
            compoundingFrequency: 'monthly'
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.compoundedInterest).toBeDefined();
      });
    });
  });

  describe('Paydown Operations', () => {
    describe('POST /api/credit-facilities/:id/paydowns', () => {
      it('should create a principal paydown', async () => {
        const paydownData = {
          amount: '1000000.00',
          paydownDate: new Date().toISOString(),
          paydownType: 'principal'
        };

        const response = await request(app)
          .post(`/api/credit-facilities/${testFacilityId}/paydowns`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(paydownData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.paydownType).toBe('principal');
        expect(response.body.data.amount).toBe(paydownData.amount);
      });

      it('should create an interest paydown', async () => {
        const paydownData = {
          amount: '50000.00',
          paydownDate: new Date().toISOString(),
          paydownType: 'interest'
        };

        const response = await request(app)
          .post(`/api/credit-facilities/${testFacilityId}/paydowns`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(paydownData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.paydownType).toBe('interest');
      });

      it('should validate paydown amount against outstanding balance', async () => {
        const response = await request(app)
          .post(`/api/credit-facilities/${testFacilityId}/paydowns`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            amount: '100000000.00', // Exceeds outstanding
            paydownDate: new Date().toISOString(),
            paydownType: 'principal'
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('exceeds outstanding');
      });
    });
  });

  describe('Utilization Reporting', () => {
    describe('GET /api/credit-facilities/:id/utilization', () => {
      it('should return utilization report', async () => {
        const response = await request(app)
          .get(`/api/credit-facilities/${testFacilityId}/utilization`)
          .set('Authorization', `Bearer ${authToken}`)
          .query({
            startDate: '2024-01-01',
            endDate: '2024-12-31'
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.utilizationHistory).toBeInstanceOf(Array);
        expect(response.body.data.averageUtilization).toBeDefined();
        expect(response.body.data.peakUtilization).toBeDefined();
      });
    });
  });

  describe('Covenant Monitoring', () => {
    describe('GET /api/credit-facilities/:id/covenants', () => {
      it('should return facility covenants', async () => {
        const response = await request(app)
          .get(`/api/credit-facilities/${testFacilityId}/covenants`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
      });
    });

    describe('POST /api/credit-facilities/:id/covenants/check', () => {
      it('should check covenant compliance', async () => {
        const response = await request(app)
          .post(`/api/credit-facilities/${testFacilityId}/covenants/check`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            asOfDate: new Date().toISOString()
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.complianceStatus).toBeDefined();
        expect(response.body.data.covenantResults).toBeInstanceOf(Array);
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle unauthorized access', async () => {
      const response = await request(app)
        .get('/api/credit-facilities')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should handle malformed request data', async () => {
      const response = await request(app)
        .post('/api/credit-facilities')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '', // Empty name
          totalCommitment: 'not-a-number', // Invalid number
          interestRate: null // Null rate
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle concurrent drawdown requests', async () => {
      const drawdownData = {
        amount: '25000000.00', // Half of remaining credit
        requestedDate: new Date().toISOString(),
        purpose: 'Concurrent test'
      };

      // Create two concurrent drawdown requests
      const [response1, response2] = await Promise.all([
        request(app)
          .post(`/api/credit-facilities/${testFacilityId}/drawdowns`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(drawdownData),
        request(app)
          .post(`/api/credit-facilities/${testFacilityId}/drawdowns`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(drawdownData)
      ]);

      // At least one should succeed, one may fail due to credit constraints
      const successCount = [response1, response2].filter(r => r.status === 201).length;
      expect(successCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Data Consistency', () => {
    it('should maintain balance consistency after operations', async () => {
      // Get initial balance
      const initialBalance = await request(app)
        .get(`/api/credit-facilities/${testFacilityId}/balance`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const initialOutstanding = parseFloat(initialBalance.body.data.outstandingPrincipal);

      // Create and execute a drawdown
      const drawdownResponse = await request(app)
        .post(`/api/credit-facilities/${testFacilityId}/drawdowns`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: '1000000.00',
          requestedDate: new Date().toISOString(),
          purpose: 'Balance consistency test'
        })
        .expect(201);

      await request(app)
        .post(`/api/credit-facilities/drawdowns/${drawdownResponse.body.data.id}/approve`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      await request(app)
        .post(`/api/credit-facilities/drawdowns/${drawdownResponse.body.data.id}/execute`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify balance updated correctly
      const finalBalance = await request(app)
        .get(`/api/credit-facilities/${testFacilityId}/balance`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const finalOutstanding = parseFloat(finalBalance.body.data.outstandingPrincipal);
      expect(finalOutstanding).toBe(initialOutstanding + 1000000);
    });
  });
});