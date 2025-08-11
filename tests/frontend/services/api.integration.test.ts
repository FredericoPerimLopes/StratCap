import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { store } from '../../../stratcap/frontend/src/store/store';
import { 
  authAPI, 
  fundAPI, 
  investorAPI, 
  creditFacilityAPI,
  documentAPI 
} from '../../../stratcap/frontend/src/services/api';

// Mock axios for controlled testing
const mockAxios = new MockAdapter(axios);

describe('API Services Integration Tests', () => {
  beforeEach(() => {
    mockAxios.reset();
    localStorage.clear();
  });

  afterEach(() => {
    mockAxios.reset();
  });

  describe('Authentication API Integration', () => {
    describe('authAPI.login', () => {
      it('should handle successful login', async () => {
        const loginData = { email: 'test@example.com', password: 'password123' };
        const mockResponse = {
          success: true,
          data: {
            user: { id: 1, email: 'test@example.com', firstName: 'John', lastName: 'Doe' },
            token: 'jwt-token',
            refreshToken: 'refresh-token'
          }
        };

        mockAxios.onPost('/auth/login').reply(200, mockResponse);

        const response = await authAPI.login(loginData);

        expect(response.status).toBe(200);
        expect(response.data).toEqual(mockResponse);
      });

      it('should handle login failure', async () => {
        const loginData = { email: 'test@example.com', password: 'wrong-password' };
        const mockError = {
          success: false,
          message: 'Invalid credentials'
        };

        mockAxios.onPost('/auth/login').reply(401, mockError);

        try {
          await authAPI.login(loginData);
        } catch (error: any) {
          expect(error.response.status).toBe(401);
          expect(error.response.data.message).toBe('Invalid credentials');
        }
      });

      it('should handle MFA login', async () => {
        const loginData = { 
          email: 'test@example.com', 
          password: 'password123',
          mfaToken: '123456'
        };
        const mockResponse = {
          success: true,
          data: {
            user: { id: 1, email: 'test@example.com', mfaEnabled: true },
            token: 'jwt-token',
            refreshToken: 'refresh-token'
          }
        };

        mockAxios.onPost('/auth/login').reply(200, mockResponse);

        const response = await authAPI.login(loginData);

        expect(response.data.data.user.mfaEnabled).toBe(true);
      });
    });

    describe('Token Refresh Handling', () => {
      it('should refresh token automatically on 401', async () => {
        localStorage.setItem('token', 'expired-token');
        localStorage.setItem('refreshToken', 'valid-refresh-token');

        // First request fails with 401
        mockAxios.onGet('/funds').replyOnce(401);
        
        // Token refresh succeeds
        mockAxios.onPost('/auth/refresh-token').reply(200, {
          success: true,
          data: {
            token: 'new-token',
            refreshToken: 'new-refresh-token'
          }
        });

        // Retry with new token succeeds
        mockAxios.onGet('/funds').reply(200, {
          success: true,
          data: []
        });

        const response = await fundAPI.getAll();

        expect(response.status).toBe(200);
      });

      it('should redirect to login on refresh failure', async () => {
        const originalLocation = window.location;
        delete (window as any).location;
        window.location = { ...originalLocation, href: '' };

        localStorage.setItem('token', 'expired-token');
        localStorage.setItem('refreshToken', 'expired-refresh-token');

        mockAxios.onGet('/funds').replyOnce(401);
        mockAxios.onPost('/auth/refresh-token').reply(401);

        try {
          await fundAPI.getAll();
        } catch (error) {
          expect(window.location.href).toBe('/login');
        }

        window.location = originalLocation;
      });
    });
  });

  describe('Fund API Integration', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'valid-token');
    });

    describe('fundAPI.getAll', () => {
      it('should fetch funds with pagination', async () => {
        const mockResponse = {
          success: true,
          data: [
            { id: 1, name: 'Fund I', targetSize: '100000000.00' },
            { id: 2, name: 'Fund II', targetSize: '200000000.00' }
          ],
          pagination: {
            total: 25,
            page: 1,
            limit: 10,
            pages: 3
          }
        };

        mockAxios.onGet('/funds').reply(200, mockResponse);

        const response = await fundAPI.getAll({ page: 1, limit: 10 });

        expect(response.data.data).toHaveLength(2);
        expect(response.data.pagination.total).toBe(25);
      });

      it('should handle query parameters correctly', async () => {
        mockAxios.onGet('/funds').reply(config => {
          const { params } = config;
          expect(params.search).toBe('Growth Fund');
          expect(params.fundFamilyId).toBe(1);
          return [200, { success: true, data: [] }];
        });

        await fundAPI.getAll({ search: 'Growth Fund', fundFamilyId: 1 });
      });
    });

    describe('fundAPI.create', () => {
      it('should create new fund', async () => {
        const fundData = {
          name: 'New Fund',
          fundFamilyId: 1,
          targetSize: '50000000.00',
          managementFeeRate: '2.0'
        };

        const mockResponse = {
          success: true,
          data: { id: 3, ...fundData }
        };

        mockAxios.onPost('/funds').reply(201, mockResponse);

        const response = await fundAPI.create(fundData);

        expect(response.status).toBe(201);
        expect(response.data.data.name).toBe(fundData.name);
      });
    });
  });

  describe('Investor API Integration', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'valid-token');
    });

    describe('investorAPI.getAll', () => {
      it('should fetch investors with filters', async () => {
        const mockResponse = {
          success: true,
          data: [
            { id: 1, entityName: 'Pension Fund A', entityType: 'pension_fund' },
            { id: 2, entityName: 'Insurance Co B', entityType: 'insurance' }
          ]
        };

        mockAxios.onGet('/investors').reply(200, mockResponse);

        const response = await investorAPI.getAll({ type: 'pension_fund' });

        expect(response.data.data).toHaveLength(2);
      });
    });
  });

  describe('Credit Facility API Integration', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'valid-token');
    });

    describe('creditFacilityAPI.create', () => {
      it('should create credit facility', async () => {
        const facilityData = {
          name: 'Test Credit Line',
          facilityType: 'revolving_credit',
          totalCommitment: '50000000.00',
          interestRate: '5.5'
        };

        const mockResponse = {
          success: true,
          data: { id: 1, ...facilityData }
        };

        mockAxios.onPost('/credit-facilities').reply(201, mockResponse);

        const response = await creditFacilityAPI.create(facilityData);

        expect(response.status).toBe(201);
        expect(response.data.data.name).toBe(facilityData.name);
      });
    });

    describe('creditFacilityAPI.createDrawdown', () => {
      it('should create drawdown request', async () => {
        const drawdownData = {
          amount: 5000000,
          requestedDate: '2024-03-01',
          purpose: 'Working capital'
        };

        const mockResponse = {
          success: true,
          data: { id: 1, status: 'pending', ...drawdownData }
        };

        mockAxios.onPost('/credit-facilities/1/drawdowns').reply(201, mockResponse);

        const response = await creditFacilityAPI.createDrawdown(1, drawdownData);

        expect(response.data.data.status).toBe('pending');
      });
    });

    describe('creditFacilityAPI.getOutstandingBalance', () => {
      it('should get facility balance', async () => {
        const mockResponse = {
          success: true,
          data: {
            outstandingPrincipal: '10000000.00',
            outstandingInterest: '50000.00',
            totalOutstanding: '10050000.00',
            availableCredit: '40000000.00'
          }
        };

        mockAxios.onGet('/credit-facilities/1/balance').reply(200, mockResponse);

        const response = await creditFacilityAPI.getOutstandingBalance(1);

        expect(response.data.data.totalOutstanding).toBe('10050000.00');
      });
    });
  });

  describe('Document API Integration', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'valid-token');
    });

    describe('documentAPI.upload', () => {
      it('should upload document file', async () => {
        const formData = new FormData();
        const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
        formData.append('file', file);
        formData.append('name', 'Test Document');

        const mockResponse = {
          success: true,
          data: {
            id: 1,
            name: 'Test Document',
            fileName: 'test.pdf',
            fileSize: 1024
          }
        };

        mockAxios.onPost('/documents/upload').reply(201, mockResponse);

        const response = await documentAPI.upload(formData);

        expect(response.status).toBe(201);
        expect(response.data.data.name).toBe('Test Document');
      });
    });

    describe('documentAPI.search', () => {
      it('should search documents', async () => {
        const mockResponse = {
          success: true,
          data: [
            { id: 1, name: 'Contract A.pdf', category: 'legal' },
            { id: 2, name: 'Invoice B.pdf', category: 'financial' }
          ]
        };

        mockAxios.onGet('/documents/search').reply(200, mockResponse);

        const response = await documentAPI.search('contract', {
          category: 'legal'
        });

        expect(response.data.data).toHaveLength(2);
      });
    });
  });

  describe('Error Handling Integration', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'valid-token');
    });

    it('should handle network errors gracefully', async () => {
      mockAxios.onGet('/funds').networkError();

      try {
        await fundAPI.getAll();
      } catch (error: any) {
        expect(error.message).toContain('Network Error');
      }
    });

    it('should handle timeout errors', async () => {
      mockAxios.onGet('/funds').timeout();

      try {
        await fundAPI.getAll();
      } catch (error: any) {
        expect(error.code).toBe('ECONNABORTED');
      }
    });

    it('should handle server errors', async () => {
      mockAxios.onGet('/funds').reply(500, {
        success: false,
        message: 'Internal server error'
      });

      try {
        await fundAPI.getAll();
      } catch (error: any) {
        expect(error.response.status).toBe(500);
      }
    });
  });

  describe('Request Configuration', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'valid-token');
    });

    it('should include authentication headers', async () => {
      mockAxios.onGet('/funds').reply(config => {
        expect(config.headers.Authorization).toBe('Bearer valid-token');
        return [200, { success: true, data: [] }];
      });

      await fundAPI.getAll();
    });

    it('should include correct content-type for JSON requests', async () => {
      mockAxios.onPost('/funds').reply(config => {
        expect(config.headers['Content-Type']).toBe('application/json');
        return [201, { success: true, data: {} }];
      });

      await fundAPI.create({ name: 'Test Fund' });
    });

    it('should handle multipart form data', async () => {
      const formData = new FormData();
      formData.append('file', new File(['test'], 'test.pdf'));

      mockAxios.onPost('/documents/upload').reply(config => {
        expect(config.headers['Content-Type']).toBe('multipart/form-data');
        return [201, { success: true, data: {} }];
      });

      await documentAPI.upload(formData);
    });
  });

  describe('Response Data Transformation', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'valid-token');
    });

    it('should handle paginated responses', async () => {
      const mockResponse = {
        success: true,
        data: Array.from({ length: 10 }, (_, i) => ({ id: i + 1, name: `Fund ${i + 1}` })),
        pagination: {
          total: 100,
          page: 2,
          limit: 10,
          pages: 10
        }
      };

      mockAxios.onGet('/funds').reply(200, mockResponse);

      const response = await fundAPI.getAll({ page: 2, limit: 10 });

      expect(response.data.data).toHaveLength(10);
      expect(response.data.pagination.page).toBe(2);
      expect(response.data.pagination.total).toBe(100);
    });

    it('should handle blob responses for downloads', async () => {
      const mockBlob = new Blob(['file content'], { type: 'application/pdf' });
      mockAxios.onGet('/documents/1/download').reply(200, mockBlob, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="document.pdf"'
      });

      const response = await documentAPI.download(1);

      expect(response.data).toBeInstanceOf(Blob);
      expect(response.headers['content-type']).toBe('application/pdf');
    });
  });

  describe('Concurrent Request Handling', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'valid-token');
    });

    it('should handle multiple concurrent requests', async () => {
      const mockResponses = Array.from({ length: 5 }, (_, i) => ({
        success: true,
        data: { id: i + 1, name: `Fund ${i + 1}` }
      }));

      mockResponses.forEach((response, i) => {
        mockAxios.onGet(`/funds/${i + 1}`).reply(200, response);
      });

      const requests = mockResponses.map((_, i) => fundAPI.getById(i + 1));
      const responses = await Promise.all(requests);

      responses.forEach((response, i) => {
        expect(response.data.data.id).toBe(i + 1);
      });
    });

    it('should handle partial failures in concurrent requests', async () => {
      mockAxios.onGet('/funds/1').reply(200, { success: true, data: { id: 1 } });
      mockAxios.onGet('/funds/2').reply(404, { success: false, message: 'Not found' });
      mockAxios.onGet('/funds/3').reply(200, { success: true, data: { id: 3 } });

      const requests = [
        fundAPI.getById(1),
        fundAPI.getById(2).catch(err => err),
        fundAPI.getById(3)
      ];

      const results = await Promise.all(requests);

      expect(results[0].data.data.id).toBe(1);
      expect(results[1].response.status).toBe(404);
      expect(results[2].data.data.id).toBe(3);
    });
  });
});