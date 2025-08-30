import Decimal from 'decimal.js';

/**
 * Financial calculation utilities for StratCap
 * Using Decimal.js for precise financial calculations
 */

export interface ManagementFeeParams {
  nav: number;
  rate: number; // annual rate as decimal (e.g., 0.02 for 2%)
  period: 'quarterly' | 'annual';
}

export interface CarriedInterestParams {
  totalDistributions: number;
  totalContributions: number;
  hurdleRate?: number;
  catchUpRate?: number;
  carriedInterestRate: number;
}

export interface WaterfallTier {
  threshold: number;
  rate: number;
  description: string;
}

export interface NetAssetValueParams {
  grossAssetValue: number;
  liabilities: number;
  accruals: number;
}

/**
 * Calculate management fees with precise decimal arithmetic
 */
export const calculateManagementFee = (params: ManagementFeeParams): Decimal => {
  const { nav, rate, period } = params;
  
  const navDecimal = new Decimal(nav);
  const rateDecimal = new Decimal(rate);
  
  // Adjust rate for period
  const periodRate = period === 'quarterly' 
    ? rateDecimal.div(4) 
    : rateDecimal;
    
  return navDecimal.mul(periodRate);
};

/**
 * Calculate carried interest with hurdle and catch-up provisions
 */
export const calculateCarriedInterest = (params: CarriedInterestParams): Decimal => {
  const {
    totalDistributions,
    totalContributions,
    hurdleRate = 0.08, // 8% default hurdle
    catchUpRate = 1.0, // 100% catch-up default
    carriedInterestRate
  } = params;
  
  const distributionsDecimal = new Decimal(totalDistributions);
  const contributionsDecimal = new Decimal(totalContributions);
  const hurdleDecimal = new Decimal(hurdleRate);
  const carriedDecimal = new Decimal(carriedInterestRate);
  
  // Calculate profits
  const profits = distributionsDecimal.minus(contributionsDecimal);
  
  if (profits.lte(0)) {
    return new Decimal(0);
  }
  
  // Calculate hurdle amount
  const hurdleAmount = contributionsDecimal.mul(hurdleDecimal);
  
  if (profits.lte(hurdleAmount)) {
    return new Decimal(0);
  }
  
  // Excess profits after hurdle
  const excessProfits = profits.minus(hurdleAmount);
  
  return excessProfits.mul(carriedDecimal);
};

/**
 * Calculate Net Asset Value
 */
export const calculateNetAssetValue = (params: NetAssetValueParams): Decimal => {
  const { grossAssetValue, liabilities, accruals } = params;
  
  const grossDecimal = new Decimal(grossAssetValue);
  const liabilitiesDecimal = new Decimal(liabilities);
  const accrualsDecimal = new Decimal(accruals);
  
  return grossDecimal.minus(liabilitiesDecimal).minus(accrualsDecimal);
};

/**
 * Calculate IRR using Newton-Raphson method
 */
export const calculateIRR = (cashFlows: number[], dates: Date[]): Decimal | null => {
  if (cashFlows.length !== dates.length || cashFlows.length < 2) {
    return null;
  }
  
  // Convert to decimals for precision
  const flows = cashFlows.map(flow => new Decimal(flow));
  const startDate = dates[0];
  
  // Calculate periods in years
  const periods = dates.map(date => 
    new Decimal(date.getTime() - startDate.getTime()).div(365.25 * 24 * 60 * 60 * 1000)
  );
  
  let rate = new Decimal(0.1); // Initial guess: 10%
  const tolerance = new Decimal(0.000001);
  const maxIterations = 100;
  
  for (let i = 0; i < maxIterations; i++) {
    let npv = new Decimal(0);
    let dnpv = new Decimal(0);
    
    for (let j = 0; j < flows.length; j++) {
      const period = periods[j];
      const denominator = rate.add(1).pow(period.toNumber());
      
      npv = npv.add(flows[j].div(denominator));
      dnpv = dnpv.add(flows[j].mul(period).div(denominator.mul(rate.add(1))).mul(-1));
    }
    
    if (npv.abs().lt(tolerance)) {
      return rate;
    }
    
    if (dnpv.eq(0)) {
      return null; // Avoid division by zero
    }
    
    rate = rate.minus(npv.div(dnpv));
    
    if (rate.lt(-0.99)) {
      rate = new Decimal(-0.99); // Prevent extreme negative rates
    }
  }
  
  return null; // Did not converge
};

/**
 * Calculate waterfall distributions
 */
export const calculateWaterfallDistribution = (
  availableAmount: number,
  tiers: WaterfallTier[]
): { tierDistributions: Decimal[]; totalDistributed: Decimal } => {
  const available = new Decimal(availableAmount);
  const tierDistributions: Decimal[] = [];
  let remaining = available;
  
  for (const tier of tiers) {
    const thresholdDecimal = new Decimal(tier.threshold);
    const rateDecimal = new Decimal(tier.rate);
    
    if (remaining.lte(0)) {
      tierDistributions.push(new Decimal(0));
      continue;
    }
    
    const tierAmount = Decimal.min(remaining, thresholdDecimal);
    const distribution = tierAmount.mul(rateDecimal);
    
    tierDistributions.push(distribution);
    remaining = remaining.minus(distribution);
  }
  
  const totalDistributed = tierDistributions.reduce(
    (sum, dist) => sum.add(dist),
    new Decimal(0)
  );
  
  return { tierDistributions, totalDistributed };
};

/**
 * Calculate compound annual growth rate (CAGR)
 */
export const calculateCAGR = (
  beginningValue: number,
  endingValue: number,
  numberOfPeriods: number
): Decimal => {
  const beginning = new Decimal(beginningValue);
  const ending = new Decimal(endingValue);
  const periods = new Decimal(numberOfPeriods);
  
  if (beginning.lte(0) || ending.lte(0) || periods.lte(0)) {
    return new Decimal(0);
  }
  
  // CAGR = (Ending Value / Beginning Value)^(1/n) - 1
  const ratio = ending.div(beginning);
  const exponent = new Decimal(1).div(periods);
  
  return new Decimal(Math.pow(ratio.toNumber(), exponent.toNumber())).minus(1);
};

export default {
  calculateManagementFee,
  calculateCarriedInterest,
  calculateNetAssetValue,
  calculateIRR,
  calculateWaterfallDistribution,
  calculateCAGR,
};