import Decimal from 'decimal.js';
import {
  calculateManagementFee,
  calculateCarriedInterest,
  calculateNetAssetValue,
  calculateIRR,
  calculateTVPI,
  calculateDPI,
  calculateWaterfallDistribution,
  calculateCapitalCall,
  validateFinancialAmount,
  formatCurrency,
  formatPercentage
} from '../../utils/financial-calculations';

// Configure Decimal.js for financial precision
Decimal.set({
  precision: 28,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -7,
  toExpPos: 21,
  maxE: 9e15,
  minE: -9e15,
  modulo: Decimal.ROUND_DOWN,
  crypto: false
});

describe('Financial Calculations', () => {
  describe('Management Fee Calculation', () => {
    it('calculates management fee correctly', () => {
      const result = calculateManagementFee({
        commitedCapital: new Decimal(100000000), // $100M
        feeRate: new Decimal(2.0), // 2%
        period: 'annual'
      });

      expect(result.toString()).toBe('2000000'); // $2M
    });

    it('handles quarterly management fees', () => {
      const result = calculateManagementFee({
        commitedCapital: new Decimal(100000000),
        feeRate: new Decimal(2.0),
        period: 'quarterly'
      });

      expect(result.toString()).toBe('500000'); // $500K per quarter
    });

    it('calculates fees on invested capital after investment period', () => {
      const result = calculateManagementFee({
        commitedCapital: new Decimal(100000000),
        investedCapital: new Decimal(80000000), // $80M invested
        feeRate: new Decimal(2.0),
        period: 'annual',
        useInvestedCapitalBase: true
      });

      expect(result.toString()).toBe('1600000'); // $1.6M on invested capital
    });

    it('handles fee rate changes over time', () => {
      const result = calculateManagementFee({
        commitedCapital: new Decimal(100000000),
        feeRate: new Decimal(1.5), // Reduced to 1.5% after year 5
        period: 'annual'
      });

      expect(result.toString()).toBe('1500000'); // $1.5M
    });

    it('throws error for invalid inputs', () => {
      expect(() => {
        calculateManagementFee({
          commitedCapital: new Decimal(-100000000), // Negative amount
          feeRate: new Decimal(2.0),
          period: 'annual'
        });
      }).toThrow('Committed capital must be positive');

      expect(() => {
        calculateManagementFee({
          commitedCapital: new Decimal(100000000),
          feeRate: new Decimal(-2.0), // Negative rate
          period: 'annual'
        });
      }).toThrow('Fee rate must be positive');
    });
  });

  describe('Carried Interest Calculation', () => {
    it('calculates carried interest after hurdle is met', () => {
      const result = calculateCarriedInterest({
        totalDistributions: new Decimal(150000000), // $150M distributed
        totalContributions: new Decimal(100000000),  // $100M contributed
        hurdleRate: new Decimal(8.0), // 8% hurdle
        carriedInterestRate: new Decimal(20.0), // 20% carry
        managementFeesReturned: new Decimal(10000000) // $10M fees
      });

      // Hurdle: $100M * 1.08 = $108M + $10M fees = $118M
      // Excess: $150M - $118M = $32M
      // Carry: $32M * 20% = $6.4M
      expect(result.carriedInterest.toString()).toBe('6400000');
      expect(result.lpDistribution.toString()).toBe('143600000');
      expect(result.gpDistribution.toString()).toBe('6400000');
    });

    it('handles European waterfall (deal-by-deal carry)', () => {
      const deals = [
        {
          invested: new Decimal(20000000),
          realized: new Decimal(30000000),
          hurdleRate: new Decimal(8.0),
          carriedInterestRate: new Decimal(20.0)
        },
        {
          invested: new Decimal(30000000),
          realized: new Decimal(25000000), // Loss
          hurdleRate: new Decimal(8.0),
          carriedInterestRate: new Decimal(20.0)
        }
      ];

      const result = calculateCarriedInterest({
        deals,
        waterfallType: 'european'
      });

      // Deal 1: $30M - $20M * 1.08 = $8.4M excess, carry = $1.68M
      // Deal 2: No carry on loss
      // Total carry: $1.68M
      expect(result.carriedInterest.toString()).toBe('1680000');
    });

    it('handles American waterfall (whole fund carry)', () => {
      const result = calculateCarriedInterest({
        totalDistributions: new Decimal(120000000),
        totalContributions: new Decimal(100000000),
        hurdleRate: new Decimal(8.0),
        carriedInterestRate: new Decimal(20.0),
        waterfallType: 'american'
      });

      // Hurdle: $100M * 1.08 = $108M
      // Excess: $120M - $108M = $12M
      // Carry: $12M * 20% = $2.4M
      expect(result.carriedInterest.toString()).toBe('2400000');
    });

    it('includes catch-up provision', () => {
      const result = calculateCarriedInterest({
        totalDistributions: new Decimal(140000000),
        totalContributions: new Decimal(100000000),
        hurdleRate: new Decimal(8.0),
        carriedInterestRate: new Decimal(20.0),
        includeCatchUp: true
      });

      // After hurdle, GP gets catch-up to achieve 20% on all returns
      // Then 80/20 split thereafter
      expect(result.carriedInterest.toString()).toBe('8000000'); // 20% of $40M gain
    });
  });

  describe('NAV Calculation', () => {
    it('calculates net asset value correctly', () => {
      const investments = [
        { cost: new Decimal(10000000), currentValue: new Decimal(15000000) },
        { cost: new Decimal(20000000), currentValue: new Decimal(18000000) },
        { cost: new Decimal(15000000), currentValue: new Decimal(20000000) }
      ];

      const result = calculateNetAssetValue({
        investments,
        cash: new Decimal(5000000),
        reserves: new Decimal(2000000),
        expenses: new Decimal(500000)
      });

      // Total value: $15M + $18M + $20M + $5M - $2M - $0.5M = $55.5M
      expect(result.totalNAV.toString()).toBe('55500000');
      expect(result.totalCost.toString()).toBe('45000000');
      expect(result.unrealizedGain.toString()).toBe('8000000');
    });

    it('handles foreign exchange adjustments', () => {
      const investments = [
        { 
          cost: new Decimal(10000000), 
          currentValue: new Decimal(12000000),
          currency: 'USD'
        },
        { 
          cost: new Decimal(8000000), // €8M
          currentValue: new Decimal(9000000), // €9M
          currency: 'EUR',
          exchangeRate: new Decimal(1.1) // EUR/USD
        }
      ];

      const result = calculateNetAssetValue({
        investments,
        baseCurrency: 'USD'
      });

      // EUR investment in USD: €9M * 1.1 = $9.9M
      // Total: $12M + $9.9M = $21.9M
      expect(result.totalNAV.toString()).toBe('21900000');
    });
  });

  describe('IRR Calculation', () => {
    it('calculates IRR for simple cash flows', () => {
      const cashFlows = [
        { date: new Date('2020-01-01'), amount: new Decimal(-10000000) }, // Investment
        { date: new Date('2023-01-01'), amount: new Decimal(15000000) }   // Exit
      ];

      const result = calculateIRR(cashFlows);

      // 3-year investment with 50% total return ≈ 14.47% IRR
      expect(result.toString()).toBe('14.47');
    });

    it('calculates IRR with multiple cash flows', () => {
      const cashFlows = [
        { date: new Date('2020-01-01'), amount: new Decimal(-10000000) },
        { date: new Date('2021-01-01'), amount: new Decimal(-5000000) },
        { date: new Date('2022-01-01'), amount: new Decimal(3000000) },
        { date: new Date('2023-01-01'), amount: new Decimal(15000000) }
      ];

      const result = calculateIRR(cashFlows);

      expect(parseFloat(result.toString())).toBeGreaterThan(15);
      expect(parseFloat(result.toString())).toBeLessThan(25);
    });

    it('handles negative IRR for loss-making investments', () => {
      const cashFlows = [
        { date: new Date('2020-01-01'), amount: new Decimal(-10000000) },
        { date: new Date('2023-01-01'), amount: new Decimal(5000000) } // 50% loss
      ];

      const result = calculateIRR(cashFlows);

      expect(parseFloat(result.toString())).toBeLessThan(0);
    });

    it('throws error for invalid cash flow patterns', () => {
      const invalidCashFlows = [
        { date: new Date('2020-01-01'), amount: new Decimal(10000000) }, // All positive
        { date: new Date('2023-01-01'), amount: new Decimal(15000000) }
      ];

      expect(() => {
        calculateIRR(invalidCashFlows);
      }).toThrow('Invalid cash flow pattern');
    });
  });

  describe('Multiple Calculation (TVPI)', () => {
    it('calculates TVPI correctly', () => {
      const result = calculateTVPI({
        totalValue: new Decimal(150000000), // $150M current value
        totalInvested: new Decimal(100000000) // $100M invested
      });

      expect(result.toString()).toBe('1.50'); // 1.5x multiple
    });

    it('handles unrealized value in TVPI', () => {
      const result = calculateTVPI({
        distributions: new Decimal(50000000),
        unrealizedValue: new Decimal(80000000),
        totalInvested: new Decimal(100000000)
      });

      // Total value: $50M + $80M = $130M
      // TVPI: $130M / $100M = 1.3x
      expect(result.toString()).toBe('1.30');
    });
  });

  describe('DPI Calculation', () => {
    it('calculates DPI correctly', () => {
      const result = calculateDPI({
        totalDistributions: new Decimal(75000000),
        totalInvested: new Decimal(100000000)
      });

      expect(result.toString()).toBe('0.75'); // 0.75x DPI
    });

    it('excludes management fee distributions from DPI', () => {
      const result = calculateDPI({
        totalDistributions: new Decimal(80000000),
        managementFeeDistributions: new Decimal(5000000),
        totalInvested: new Decimal(100000000)
      });

      // Net distributions: $80M - $5M = $75M
      expect(result.toString()).toBe('0.75');
    });
  });

  describe('Waterfall Distribution', () => {
    it('calculates distribution waterfall correctly', () => {
      const result = calculateWaterfallDistribution({
        availableForDistribution: new Decimal(50000000),
        totalContributions: new Decimal(100000000),
        distributionsToDate: new Decimal(30000000),
        hurdleRate: new Decimal(8.0),
        carriedInterestRate: new Decimal(20.0),
        managementFeesOutstanding: new Decimal(2000000)
      });

      expect(result.tiers).toHaveLength(4); // Management fees, return of capital, hurdle, carry
      expect(result.totalDistributed.toString()).toBe('50000000');
      expect(result.lpShare.plus(result.gpShare)).toEqual(result.totalDistributed);
    });

    it('handles preferred returns correctly', () => {
      const result = calculateWaterfallDistribution({
        availableForDistribution: new Decimal(120000000),
        totalContributions: new Decimal(100000000),
        hurdleRate: new Decimal(8.0),
        carriedInterestRate: new Decimal(20.0),
        preferredReturn: new Decimal(8.0) // 8% preferred return to LPs
      });

      const hurdleTier = result.tiers.find(tier => tier.name === 'Preferred Return');
      expect(hurdleTier).toBeDefined();
      expect(hurdleTier?.lpShare.toString()).toBe('8000000'); // 8% of $100M
    });
  });

  describe('Capital Call Calculation', () => {
    it('calculates capital call amounts correctly', () => {
      const commitments = [
        { investorId: '1', amount: new Decimal(10000000), calledToDate: new Decimal(3000000) },
        { investorId: '2', amount: new Decimal(5000000), calledToDate: new Decimal(2000000) },
        { investorId: '3', amount: new Decimal(15000000), calledToDate: new Decimal(8000000) }
      ];

      const result = calculateCapitalCall({
        commitments,
        callAmount: new Decimal(6000000), // $6M call
        callPercentage: new Decimal(20) // 20% of uncalled commitments
      });

      expect(result.totalCallAmount.toString()).toBe('6000000');
      expect(result.calls).toHaveLength(3);
      
      // Check proportional allocation
      const investor1Call = result.calls.find(call => call.investorId === '1');
      expect(investor1Call?.amount.toString()).toBe('2000000'); // 20% of $10M uncalled = $1.4M, but capped by total call
    });

    it('handles partial funding scenarios', () => {
      const commitments = [
        { investorId: '1', amount: new Decimal(10000000), calledToDate: new Decimal(10000000) }, // Fully called
        { investorId: '2', amount: new Decimal(5000000), calledToDate: new Decimal(0) } // Not called
      ];

      const result = calculateCapitalCall({
        commitments,
        callAmount: new Decimal(3000000)
      });

      // Only investor 2 should be called since investor 1 is fully called
      expect(result.calls).toHaveLength(1);
      expect(result.calls[0].investorId).toBe('2');
      expect(result.calls[0].amount.toString()).toBe('3000000');
    });

    it('handles defaulted commitments', () => {
      const commitments = [
        { 
          investorId: '1', 
          amount: new Decimal(10000000), 
          calledToDate: new Decimal(5000000),
          defaulted: true 
        },
        { 
          investorId: '2', 
          amount: new Decimal(5000000), 
          calledToDate: new Decimal(2000000) 
        }
      ];

      const result = calculateCapitalCall({
        commitments,
        callAmount: new Decimal(2000000),
        excludeDefaulted: true
      });

      // Only non-defaulted investors should be included
      expect(result.calls).toHaveLength(1);
      expect(result.calls[0].investorId).toBe('2');
    });
  });

  describe('Financial Validation', () => {
    it('validates financial amounts correctly', () => {
      expect(validateFinancialAmount('1000000')).toBe(true);
      expect(validateFinancialAmount('1,000,000.50')).toBe(true);
      expect(validateFinancialAmount('$1,000,000.50')).toBe(true);
      
      expect(validateFinancialAmount('abc')).toBe(false);
      expect(validateFinancialAmount('-1000000')).toBe(false);
      expect(validateFinancialAmount('')).toBe(false);
      expect(validateFinancialAmount('1000000.123')).toBe(false); // More than 2 decimal places
    });

    it('validates percentage values', () => {
      expect(validateFinancialAmount('2.5', 'percentage')).toBe(true);
      expect(validateFinancialAmount('25%', 'percentage')).toBe(true);
      
      expect(validateFinancialAmount('150', 'percentage')).toBe(false); // > 100%
      expect(validateFinancialAmount('-5', 'percentage')).toBe(false);
    });
  });

  describe('Formatting Functions', () => {
    it('formats currency correctly', () => {
      expect(formatCurrency(1000000)).toBe('$1,000,000.00');
      expect(formatCurrency(1000000.50)).toBe('$1,000,000.50');
      expect(formatCurrency(0)).toBe('$0.00');
      
      // Different currencies
      expect(formatCurrency(1000000, 'EUR')).toBe('€1,000,000.00');
      expect(formatCurrency(1000000, 'GBP')).toBe('£1,000,000.00');
    });

    it('formats percentages correctly', () => {
      expect(formatPercentage(0.025)).toBe('2.50%');
      expect(formatPercentage(0.2)).toBe('20.00%');
      expect(formatPercentage(1.5)).toBe('150.00%');
      
      // Basis points
      expect(formatPercentage(0.025, 'bps')).toBe('250 bps');
    });

    it('handles edge cases in formatting', () => {
      expect(formatCurrency(Number.MAX_SAFE_INTEGER)).toBeDefined();
      expect(formatCurrency(0.001)).toBe('$0.00'); // Rounds to cents
      expect(formatPercentage(0.00001)).toBe('0.00%'); // Very small percentages
    });
  });

  describe('Precision and Rounding', () => {
    it('maintains precision in calculations', () => {
      const a = new Decimal('0.1');
      const b = new Decimal('0.2');
      const result = a.plus(b);
      
      expect(result.toString()).toBe('0.3'); // No floating point errors
    });

    it('rounds to appropriate decimal places', () => {
      const amount = new Decimal('1000000.6789');
      const rounded = amount.toDecimalPlaces(2);
      
      expect(rounded.toString()).toBe('1000000.68');
    });

    it('handles very large numbers correctly', () => {
      const largeAmount = new Decimal('999999999999999.99');
      const fee = calculateManagementFee({
        commitedCapital: largeAmount,
        feeRate: new Decimal(2.0),
        period: 'annual'
      });
      
      expect(fee.toString()).toBe('19999999999999.9998');
    });
  });

  describe('Error Handling', () => {
    it('throws appropriate errors for invalid inputs', () => {
      expect(() => {
        calculateManagementFee({
          commitedCapital: new Decimal('invalid'),
          feeRate: new Decimal(2.0),
          period: 'annual'
        });
      }).toThrow();

      expect(() => {
        calculateIRR([]);
      }).toThrow('Cash flows array cannot be empty');
    });

    it('handles division by zero gracefully', () => {
      expect(() => {
        calculateTVPI({
          totalValue: new Decimal(100000000),
          totalInvested: new Decimal(0)
        });
      }).toThrow('Total invested cannot be zero');
    });

    it('validates date ranges in IRR calculations', () => {
      const invalidCashFlows = [
        { date: new Date('2023-01-01'), amount: new Decimal(-10000000) },
        { date: new Date('2022-01-01'), amount: new Decimal(15000000) } // Earlier date
      ];

      expect(() => {
        calculateIRR(invalidCashFlows);
      }).toThrow('Cash flows must be in chronological order');
    });
  });
});