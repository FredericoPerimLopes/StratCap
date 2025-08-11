import { test, expect } from '@playwright/test';
import axios from 'axios';
import { testDataFactory } from '../helpers/testDataFactory';

const API_BASE_URL = process.env.API_URL || 'http://localhost:8000/api';
const CONCURRENT_USERS = parseInt(process.env.CONCURRENT_USERS || '10');
const TEST_DURATION = parseInt(process.env.TEST_DURATION || '30') * 1000; // Convert to milliseconds

/**
 * Performance and Load Testing Suite
 * 
 * This suite tests the system's performance under various load conditions
 * to ensure it can handle production-level traffic and data volumes.
 */
describe('Performance and Load Testing', () => {
  let authToken: string;
  let testData: any;

  test.beforeAll(async () => {
    // Setup authentication
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@stratcap.com',
      password: 'TestPassword123!'
    });
    authToken = loginResponse.data.data.token;

    // Create test data for performance testing
    testData = testDataFactory.generateBatchData({
      fundFamilies: 50,
      funds: 150,
      investors: 500,
      documents: 1000
    });

    console.log('Performance test data generated:', {
      fundFamilies: testData.fundFamilies.length,
      funds: testData.funds.length,
      investors: testData.investors.length,
      documents: testData.documents.length
    });
  });

  test.describe('API Endpoint Load Testing', () => {
    test('should handle concurrent fund list requests', async () => {
      const startTime = Date.now();
      const requests = Array.from({ length: CONCURRENT_USERS }, () =>
        axios.get(`${API_BASE_URL}/funds`, {
          headers: { Authorization: `Bearer ${authToken}` },
          timeout: 5000
        })
      );

      const responses = await Promise.allSettled(requests);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Analyze results
      const successful = responses.filter(r => r.status === 'fulfilled').length;
      const failed = responses.filter(r => r.status === 'rejected').length;
      const successRate = (successful / CONCURRENT_USERS) * 100;
      const averageResponseTime = duration / CONCURRENT_USERS;

      console.log(`Concurrent Fund List Performance:`, {
        concurrentUsers: CONCURRENT_USERS,
        successful,
        failed,
        successRate: `${successRate}%`,
        totalDuration: `${duration}ms`,
        averageResponseTime: `${averageResponseTime}ms`
      });

      // Performance assertions
      expect(successRate).toBeGreaterThan(95); // 95% success rate minimum
      expect(averageResponseTime).toBeLessThan(1000); // Under 1 second average
    });

    test('should handle concurrent investor creation', async () => {
      const concurrentCreations = Math.min(CONCURRENT_USERS, 20); // Limit for write operations
      const startTime = Date.now();
      
      const requests = Array.from({ length: concurrentCreations }, (_, i) =>
        axios.post(`${API_BASE_URL}/investors`, testData.investors[i], {
          headers: { Authorization: `Bearer ${authToken}` },
          timeout: 10000
        })
      );

      const responses = await Promise.allSettled(requests);
      const endTime = Date.now();
      const duration = endTime - startTime;

      const successful = responses.filter(r => r.status === 'fulfilled').length;
      const failed = responses.filter(r => r.status === 'rejected').length;
      const successRate = (successful / concurrentCreations) * 100;

      console.log(`Concurrent Investor Creation Performance:`, {
        concurrentCreations,
        successful,
        failed,
        successRate: `${successRate}%`,
        totalDuration: `${duration}ms`
      });

      expect(successRate).toBeGreaterThan(90); // 90% success rate for writes
      expect(duration).toBeLessThan(concurrentCreations * 2000); // Under 2s per creation
    });

    test('should maintain performance under sustained load', async () => {
      const loadTestDuration = Math.min(TEST_DURATION, 60000); // Max 1 minute for CI
      const requestInterval = 100; // Request every 100ms
      const expectedRequests = Math.floor(loadTestDuration / requestInterval);
      
      let successCount = 0;
      let errorCount = 0;
      const responseTimes: number[] = [];
      
      const endTime = Date.now() + loadTestDuration;
      const requestPromises: Promise<void>[] = [];

      while (Date.now() < endTime) {
        const requestStart = Date.now();
        
        const requestPromise = axios.get(`${API_BASE_URL}/funds`, {
          headers: { Authorization: `Bearer ${authToken}` },
          timeout: 5000,
          params: { limit: 10 } // Small page size
        })
        .then(() => {
          successCount++;
          responseTimes.push(Date.now() - requestStart);
        })
        .catch(() => {
          errorCount++;
        });

        requestPromises.push(requestPromise);
        
        // Control request rate
        await new Promise(resolve => setTimeout(resolve, requestInterval));
      }

      // Wait for all requests to complete
      await Promise.allSettled(requestPromises);

      const totalRequests = successCount + errorCount;
      const successRate = (successCount / totalRequests) * 100;
      const averageResponseTime = responseTimes.length > 0 
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
        : 0;
      const p95ResponseTime = responseTimes.length > 0
        ? responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.95)]
        : 0;

      console.log(`Sustained Load Test Results:`, {
        duration: `${loadTestDuration}ms`,
        totalRequests,
        successCount,
        errorCount,
        successRate: `${successRate.toFixed(2)}%`,
        averageResponseTime: `${averageResponseTime.toFixed(2)}ms`,
        p95ResponseTime: `${p95ResponseTime}ms`
      });

      // Performance requirements
      expect(successRate).toBeGreaterThan(95);
      expect(averageResponseTime).toBeLessThan(500);
      expect(p95ResponseTime).toBeLessThan(1000);
    });
  });

  test.describe('Database Performance Testing', () => {
    test('should handle large result sets efficiently', async () => {
      // Test pagination performance with large datasets
      const pageSize = 100;
      const totalPages = 10;
      const responseTimes: number[] = [];

      for (let page = 1; page <= totalPages; page++) {
        const startTime = Date.now();
        
        const response = await axios.get(`${API_BASE_URL}/investors`, {
          headers: { Authorization: `Bearer ${authToken}` },
          params: { page, limit: pageSize },
          timeout: 10000
        });

        const responseTime = Date.now() - startTime;
        responseTimes.push(responseTime);

        expect(response.data.success).toBe(true);
        expect(response.data.data.length).toBeLessThanOrEqual(pageSize);
      }

      const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);

      console.log(`Pagination Performance:`, {
        pageSize,
        totalPages,
        averageResponseTime: `${averageResponseTime.toFixed(2)}ms`,
        maxResponseTime: `${maxResponseTime}ms`
      });

      expect(averageResponseTime).toBeLessThan(2000); // 2 second average
      expect(maxResponseTime).toBeLessThan(5000); // 5 second maximum
    });

    test('should handle complex queries efficiently', async () => {
      // Test performance of complex financial calculations
      const fundId = 1; // Assuming test fund exists
      const complexQueries = [
        () => axios.get(`${API_BASE_URL}/funds/${fundId}/performance`, {
          headers: { Authorization: `Bearer ${authToken}` }
        }),
        () => axios.get(`${API_BASE_URL}/funds/${fundId}/analytics`, {
          headers: { Authorization: `Bearer ${authToken}` }
        }),
        () => axios.post(`${API_BASE_URL}/waterfall/calculate`, {
          fundId,
          totalProceedsAmount: 50000000,
          asOfDate: new Date().toISOString()
        }, {
          headers: { Authorization: `Bearer ${authToken}` }
        })
      ];

      for (const queryFn of complexQueries) {
        const startTime = Date.now();
        
        try {
          const response = await queryFn();
          const responseTime = Date.now() - startTime;
          
          console.log(`Complex query completed in ${responseTime}ms`);
          expect(response.data.success).toBe(true);
          expect(responseTime).toBeLessThan(10000); // 10 second maximum for complex queries
        } catch (error) {
          console.error('Complex query failed:', error);
          throw error;
        }
      }
    });
  });

  test.describe('File Upload Performance', () => {
    test('should handle concurrent file uploads', async () => {
      const fileCount = Math.min(CONCURRENT_USERS / 2, 10); // Limit concurrent uploads
      const testFileSize = 1024 * 1024; // 1MB test files
      
      const uploadPromises = Array.from({ length: fileCount }, (_, i) => {
        const formData = new FormData();
        const testFile = new Blob(['x'.repeat(testFileSize)], { type: 'application/pdf' });
        formData.append('file', testFile, `performance-test-${i}.pdf`);
        formData.append('name', `Performance Test Document ${i}`);
        formData.append('category', 'other');

        const startTime = Date.now();
        return axios.post(`${API_BASE_URL}/documents/upload`, formData, {
          headers: { 
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'multipart/form-data'
          },
          timeout: 30000
        }).then(response => {
          return {
            success: true,
            responseTime: Date.now() - startTime,
            documentId: response.data.data.id
          };
        }).catch(error => {
          return {
            success: false,
            responseTime: Date.now() - startTime,
            error: error.message
          };
        });
      });

      const results = await Promise.all(uploadPromises);
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      const successRate = (successful / fileCount) * 100;
      const avgUploadTime = results
        .filter(r => r.success)
        .reduce((acc, r) => acc + r.responseTime, 0) / successful || 0;

      console.log(`Concurrent Upload Performance:`, {
        fileCount,
        fileSize: `${testFileSize / 1024 / 1024}MB`,
        successful,
        failed,
        successRate: `${successRate}%`,
        avgUploadTime: `${avgUploadTime.toFixed(2)}ms`
      });

      expect(successRate).toBeGreaterThan(80); // 80% success rate for uploads
      expect(avgUploadTime).toBeLessThan(15000); // Under 15 seconds for 1MB files
    });
  });

  test.describe('Memory and Resource Usage', () => {
    test('should not have memory leaks during extended operations', async () => {
      // This test would be more effective with actual memory monitoring
      // For now, we'll test sustained operations without timeouts
      
      const operationCount = 100;
      let completedOperations = 0;
      const errors: string[] = [];

      for (let i = 0; i < operationCount; i++) {
        try {
          // Perform various operations to stress test memory usage
          const operations = [
            () => axios.get(`${API_BASE_URL}/funds`, { headers: { Authorization: `Bearer ${authToken}` } }),
            () => axios.get(`${API_BASE_URL}/investors`, { headers: { Authorization: `Bearer ${authToken}` } }),
            () => axios.get(`${API_BASE_URL}/transactions`, { headers: { Authorization: `Bearer ${authToken}` } })
          ];

          const randomOperation = operations[Math.floor(Math.random() * operations.length)];
          await randomOperation();
          completedOperations++;

          // Small delay to prevent overwhelming the server
          if (i % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (error) {
          errors.push(`Operation ${i}: ${error}`);
        }
      }

      const successRate = (completedOperations / operationCount) * 100;
      
      console.log(`Memory Stress Test:`, {
        operationCount,
        completedOperations,
        errors: errors.length,
        successRate: `${successRate}%`
      });

      expect(successRate).toBeGreaterThan(95);
      expect(errors.length).toBeLessThan(operationCount * 0.05); // Less than 5% errors
    });
  });

  test.describe('Response Time Benchmarks', () => {
    test('should meet response time requirements for critical endpoints', async () => {
      const criticalEndpoints = [
        { name: 'Fund List', url: '/funds', maxTime: 500 },
        { name: 'Fund Detail', url: '/funds/1', maxTime: 1000 },
        { name: 'Investor List', url: '/investors', maxTime: 500 },
        { name: 'Dashboard Data', url: '/reports/dashboard', maxTime: 2000 },
        { name: 'User Profile', url: '/auth/profile', maxTime: 300 }
      ];

      for (const endpoint of criticalEndpoints) {
        const measurements: number[] = [];
        const testCount = 10;

        // Take multiple measurements for accuracy
        for (let i = 0; i < testCount; i++) {
          const startTime = Date.now();
          
          try {
            await axios.get(`${API_BASE_URL}${endpoint.url}`, {
              headers: { Authorization: `Bearer ${authToken}` },
              timeout: 10000
            });
            
            measurements.push(Date.now() - startTime);
          } catch (error) {
            console.error(`Failed to measure ${endpoint.name}:`, error);
            measurements.push(endpoint.maxTime + 1000); // Penalty for failures
          }

          // Small delay between measurements
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        const avgTime = measurements.reduce((a, b) => a + b, 0) / measurements.length;
        const maxTime = Math.max(...measurements);
        const minTime = Math.min(...measurements);

        console.log(`${endpoint.name} Performance:`, {
          avgTime: `${avgTime.toFixed(2)}ms`,
          maxTime: `${maxTime}ms`,
          minTime: `${minTime}ms`,
          target: `${endpoint.maxTime}ms`
        });

        expect(avgTime).toBeLessThan(endpoint.maxTime);
      }
    });
  });

  test.afterAll(async () => {
    console.log('Performance testing completed');
    // Any cleanup operations
  });
});