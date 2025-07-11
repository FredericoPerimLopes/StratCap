import { performance } from 'perf_hooks';
import { Decimal } from 'decimal.js';
import WaterfallCalculationService from '../src/services/WaterfallCalculationService';
import ManagementFeeService from '../src/services/ManagementFeeService';
import Fund from '../src/models/Fund';
import Commitment from '../src/models/Commitment';
import InvestorEntity from '../src/models/InvestorEntity';

// Mock database models for performance testing
jest.mock('../src/models/Fund');
jest.mock('../src/models/Commitment');
jest.mock('../src/models/InvestorEntity');
jest.mock('../src/models/WaterfallCalculation');
jest.mock('../src/models/WaterfallTier');
jest.mock('../src/models/DistributionEvent');

const MockedFund = Fund as jest.MockedClass<typeof Fund>;
const MockedCommitment = Commitment as jest.MockedClass<typeof Commitment>;
const MockedInvestorEntity = InvestorEntity as jest.MockedClass<typeof InvestorEntity>;

describe('Performance Tests', () => {
  let waterfallService: WaterfallCalculationService;
  let feeService: ManagementFeeService;

  beforeEach(() => {
    waterfallService = new WaterfallCalculationService();
    feeService = new ManagementFeeService();

    // Setup mock data for performance tests
    MockedFund.findByPk.mockResolvedValue({
      id: 1,
      name: 'Performance Test Fund',
      preferredReturnRate: '8.0',
      carriedInterestRate: '20.0',
      managementFeeRate: '2.0',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Waterfall Calculation Performance', () => {
    it('should calculate waterfall for 100 investors within 2 seconds', async () => {
      // Generate 100 mock commitments
      const mockCommitments = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        fundId: 1,
        investorEntityId: i + 1,
        commitmentAmount: `${Math.floor(Math.random() * 5000000) + 1000000}.00`,
        capitalCalled: `${Math.floor(Math.random() * 3000000) + 500000}.00`,
        capitalUncalled: `${Math.floor(Math.random() * 2000000) + 500000}.00`,
        commitmentDate: new Date('2023-01-01'),
        investorEntity: { id: i + 1, entityName: `Investor ${i + 1}` },
      }));

      MockedCommitment.findAll.mockResolvedValue(mockCommitments);

      const startTime = performance.now();

      const inputs = {
        fundId: 1,
        distributionAmount: new Decimal('50000000'),
        distributionDate: new Date('2024-01-01'),
        calculationType: 'distribution' as const,
        userId: 1,
      };

      const result = await waterfallService.calculateWaterfall(inputs);

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(result).toBeDefined();
      expect(result.summary.totalDistributed.toString()).toBe('50000000');
      expect(executionTime).toBeLessThan(2000); // Less than 2 seconds

      console.log(`Waterfall calculation for 100 investors took: ${executionTime.toFixed(2)}ms`);
    });

    it('should calculate waterfall for 500 investors within 5 seconds', async () => {
      // Generate 500 mock commitments
      const mockCommitments = Array.from({ length: 500 }, (_, i) => ({
        id: i + 1,
        fundId: 1,
        investorEntityId: i + 1,
        commitmentAmount: `${Math.floor(Math.random() * 2000000) + 500000}.00`,
        capitalCalled: `${Math.floor(Math.random() * 1000000) + 250000}.00`,
        capitalUncalled: `${Math.floor(Math.random() * 1000000) + 250000}.00`,
        commitmentDate: new Date('2023-01-01'),
        investorEntity: { id: i + 1, entityName: `Investor ${i + 1}` },
      }));

      MockedCommitment.findAll.mockResolvedValue(mockCommitments);

      const startTime = performance.now();

      const inputs = {
        fundId: 1,
        distributionAmount: new Decimal('100000000'),
        distributionDate: new Date('2024-01-01'),
        calculationType: 'distribution' as const,
        userId: 1,
      };

      const result = await waterfallService.calculateWaterfall(inputs);

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(result).toBeDefined();
      expect(executionTime).toBeLessThan(5000); // Less than 5 seconds

      console.log(`Waterfall calculation for 500 investors took: ${executionTime.toFixed(2)}ms`);
    });

    it('should handle concurrent waterfall calculations efficiently', async () => {
      const mockCommitments = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        fundId: 1,
        investorEntityId: i + 1,
        commitmentAmount: '1000000.00',
        capitalCalled: '600000.00',
        capitalUncalled: '400000.00',
        commitmentDate: new Date('2023-01-01'),
        investorEntity: { id: i + 1, entityName: `Investor ${i + 1}` },
      }));

      MockedCommitment.findAll.mockResolvedValue(mockCommitments);

      const startTime = performance.now();

      // Run 10 concurrent calculations
      const promises = Array.from({ length: 10 }, (_, i) => {
        const inputs = {
          fundId: 1,
          distributionAmount: new Decimal(`${(i + 1) * 1000000}`),
          distributionDate: new Date('2024-01-01'),
          calculationType: 'distribution' as const,
          userId: 1,
        };
        return waterfallService.calculateWaterfall(inputs);
      });

      const results = await Promise.all(promises);

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(results).toHaveLength(10);
      results.forEach((result, i) => {
        expect(result.summary.totalDistributed.toString()).toBe(`${(i + 1) * 1000000}`);
      });

      // Should complete within 3 seconds for 10 concurrent calculations
      expect(executionTime).toBeLessThan(3000);

      console.log(`10 concurrent waterfall calculations took: ${executionTime.toFixed(2)}ms`);
    });
  });

  describe('Fee Calculation Performance', () => {
    it('should calculate management fees quickly', async () => {
      const startTime = performance.now();

      const result = await feeService.calculateQuarterlyFee(
        new Decimal('100000000'), // $100M base
        new Decimal('2.0'),       // 2% annual rate
        new Date('2024-01-01'),   // Start date
        new Date('2024-03-31')    // End date
      );

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(result.feeAmount.gt(0)).toBe(true);
      expect(executionTime).toBeLessThan(100); // Should be very fast (< 100ms)

      console.log(`Management fee calculation took: ${executionTime.toFixed(2)}ms`);
    });

    it('should handle batch fee calculations efficiently', async () => {
      const startTime = performance.now();

      // Calculate fees for 100 different periods/amounts
      const promises = Array.from({ length: 100 }, (_, i) => {
        return feeService.calculateQuarterlyFee(
          new Decimal(`${(i + 1) * 1000000}`), // Varying base amounts
          new Decimal('2.0'),
          new Date('2024-01-01'),
          new Date('2024-03-31')
        );
      });

      const results = await Promise.all(promises);

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(results).toHaveLength(100);
      results.forEach(result => {
        expect(result.feeAmount.gt(0)).toBe(true);
      });

      expect(executionTime).toBeLessThan(500); // Should complete quickly

      console.log(`100 fee calculations took: ${executionTime.toFixed(2)}ms`);
    });
  });

  describe('Memory Usage Tests', () => {
    it('should not cause memory leaks with large datasets', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Perform multiple large calculations
      for (let i = 0; i < 10; i++) {
        const mockCommitments = Array.from({ length: 200 }, (_, j) => ({
          id: j + 1,
          fundId: 1,
          investorEntityId: j + 1,
          commitmentAmount: '1000000.00',
          capitalCalled: '600000.00',
          capitalUncalled: '400000.00',
          commitmentDate: new Date('2023-01-01'),
          investorEntity: { id: j + 1, entityName: `Investor ${j + 1}` },
        }));

        MockedCommitment.findAll.mockResolvedValue(mockCommitments);

        const inputs = {
          fundId: 1,
          distributionAmount: new Decimal('20000000'),
          distributionDate: new Date('2024-01-01'),
          calculationType: 'distribution' as const,
          userId: 1,
        };

        await waterfallService.calculateWaterfall(inputs);

        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);

      console.log(`Memory increase after 10 large calculations: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
    });
  });

  describe('Decimal Precision Performance', () => {
    it('should handle high-precision calculations efficiently', async () => {
      const startTime = performance.now();

      // Perform calculations with high precision
      for (let i = 0; i < 1000; i++) {
        const amount = new Decimal('123456789.123456789');
        const rate = new Decimal('2.123456789');
        
        const calculation = amount.mul(rate).div(100);
        expect(calculation.toFixed(9)).toBeDefined();
      }

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(200); // Should be fast

      console.log(`1000 high-precision calculations took: ${executionTime.toFixed(2)}ms`);
    });

    it('should maintain precision in complex calculations', async () => {
      const baseAmount = new Decimal('999999999.999999999');
      const rate = new Decimal('1.999999999');
      
      const startTime = performance.now();

      // Complex calculation chain
      let result = baseAmount;
      for (let i = 0; i < 100; i++) {
        result = result.mul(rate).div(100).plus(baseAmount).minus(new Decimal('1000'));
      }

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(result.decimalPlaces()).toBeLessThanOrEqual(9);
      expect(executionTime).toBeLessThan(50);

      console.log(`Complex precision calculation took: ${executionTime.toFixed(2)}ms`);
    });
  });

  describe('Database Query Simulation Performance', () => {
    it('should handle large result sets efficiently', async () => {
      // Simulate large database result set
      const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
        id: i + 1,
        amount: new Decimal(`${Math.random() * 1000000}`),
        date: new Date(),
        processed: false,
      }));

      const startTime = performance.now();

      // Simulate processing large dataset
      const processed = largeDataset.map(item => ({
        ...item,
        processedAmount: item.amount.mul(1.05), // 5% increase
        processed: true,
      }));

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(processed).toHaveLength(10000);
      expect(executionTime).toBeLessThan(500); // Should process quickly

      console.log(`Processing 10,000 records took: ${executionTime.toFixed(2)}ms`);
    });

    it('should handle pagination efficiently', async () => {
      const totalRecords = 100000;
      const pageSize = 100;
      const totalPages = Math.ceil(totalRecords / pageSize);

      const startTime = performance.now();

      // Simulate paginated processing
      for (let page = 1; page <= totalPages; page++) {
        const startIndex = (page - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize, totalRecords);
        
        // Simulate page processing
        const pageData = Array.from(
          { length: endIndex - startIndex }, 
          (_, i) => ({
            id: startIndex + i + 1,
            value: Math.random() * 1000,
          })
        );

        // Process page
        pageData.forEach(item => {
          item.value = item.value * 1.1;
        });
      }

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(2000); // Should complete within 2 seconds

      console.log(`Paginated processing of 100,000 records took: ${executionTime.toFixed(2)}ms`);
    });
  });

  describe('Stress Tests', () => {
    it('should handle extreme investor counts', async () => {
      // Test with 1000 investors
      const extremeCommitments = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        fundId: 1,
        investorEntityId: i + 1,
        commitmentAmount: '500000.00',
        capitalCalled: '300000.00',
        capitalUncalled: '200000.00',
        commitmentDate: new Date('2023-01-01'),
        investorEntity: { id: i + 1, entityName: `Investor ${i + 1}` },
      }));

      MockedCommitment.findAll.mockResolvedValue(extremeCommitments);

      const startTime = performance.now();

      const inputs = {
        fundId: 1,
        distributionAmount: new Decimal('200000000'),
        distributionDate: new Date('2024-01-01'),
        calculationType: 'distribution' as const,
        userId: 1,
      };

      const result = await waterfallService.calculateWaterfall(inputs);

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(result).toBeDefined();
      expect(executionTime).toBeLessThan(10000); // Should complete within 10 seconds

      console.log(`Extreme test with 1000 investors took: ${executionTime.toFixed(2)}ms`);
    });

    it('should handle very large distribution amounts', async () => {
      const mockCommitments = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        fundId: 1,
        investorEntityId: i + 1,
        commitmentAmount: '10000000.00',
        capitalCalled: '6000000.00',
        capitalUncalled: '4000000.00',
        commitmentDate: new Date('2023-01-01'),
        investorEntity: { id: i + 1, entityName: `Investor ${i + 1}` },
      }));

      MockedCommitment.findAll.mockResolvedValue(mockCommitments);

      const startTime = performance.now();

      // Test with $10 billion distribution
      const inputs = {
        fundId: 1,
        distributionAmount: new Decimal('10000000000'),
        distributionDate: new Date('2024-01-01'),
        calculationType: 'distribution' as const,
        userId: 1,
      };

      const result = await waterfallService.calculateWaterfall(inputs);

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(result).toBeDefined();
      expect(result.summary.totalDistributed.toString()).toBe('10000000000');
      expect(executionTime).toBeLessThan(3000);

      console.log(`Large amount calculation ($10B) took: ${executionTime.toFixed(2)}ms`);
    });
  });

  describe('Performance Regression Tests', () => {
    it('should maintain performance across multiple runs', async () => {
      const mockCommitments = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        fundId: 1,
        investorEntityId: i + 1,
        commitmentAmount: '1000000.00',
        capitalCalled: '600000.00',
        capitalUncalled: '400000.00',
        commitmentDate: new Date('2023-01-01'),
        investorEntity: { id: i + 1, entityName: `Investor ${i + 1}` },
      }));

      MockedCommitment.findAll.mockResolvedValue(mockCommitments);

      const times: number[] = [];

      // Run the same calculation 10 times
      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();

        const inputs = {
          fundId: 1,
          distributionAmount: new Decimal('25000000'),
          distributionDate: new Date('2024-01-01'),
          calculationType: 'distribution' as const,
          userId: 1,
        };

        await waterfallService.calculateWaterfall(inputs);

        const endTime = performance.now();
        times.push(endTime - startTime);
      }

      // Calculate statistics
      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);

      expect(maxTime).toBeLessThan(avgTime * 2); // Max shouldn't be more than 2x average
      expect(avgTime).toBeLessThan(2000); // Average should be under 2 seconds

      console.log(`Performance stats - Avg: ${avgTime.toFixed(2)}ms, Min: ${minTime.toFixed(2)}ms, Max: ${maxTime.toFixed(2)}ms`);
    });
  });
});