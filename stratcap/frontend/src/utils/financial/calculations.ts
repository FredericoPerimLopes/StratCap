import { Decimal } from 'decimal.js';
import { Investor, WaterfallTier, WaterfallTierResult } from '../../types/capital-activity';

// Configure Decimal.js for financial precision
Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

/**
 * Calculate proportional allocations based on commitments
 */
export const calculateProportionalAllocation = (
  investors: Investor[],
  totalAmount: Decimal
): { investorId: string; amount: Decimal; percentage: Decimal }[] => {
  const totalCommitment = investors.reduce(
    (sum, investor) => sum.plus(investor.commitment),
    new Decimal(0)
  );

  return investors.map(investor => {
    const percentage = investor.commitment.dividedBy(totalCommitment);
    const amount = totalAmount.times(percentage);
    
    return {
      investorId: investor.id,
      amount: amount.toDecimalPlaces(2),
      percentage: percentage.times(100).toDecimalPlaces(4)
    };
  });
};

/**
 * Calculate equalization adjustments for new investors
 */
export const calculateEqualizationAdjustment = (
  newInvestor: Investor,
  existingInvestors: Investor[],
  fundNavPerShare: Decimal
): Decimal => {
  const avgNavPerShare = existingInvestors.reduce(
    (sum, investor) => sum.plus(
      investor.paid_capital.minus(investor.distributions)
        .dividedBy(investor.commitment)
    ),
    new Decimal(0)
  ).dividedBy(existingInvestors.length);

  const equalizationAmount = newInvestor.commitment
    .times(fundNavPerShare.minus(avgNavPerShare));

  return equalizationAmount.toDecimalPlaces(2);
};

/**
 * Calculate IRR (Internal Rate of Return)
 */
export const calculateIRR = (
  cashFlows: { date: Date; amount: Decimal }[],
  guess: number = 0.1
): Decimal => {
  // Simplified IRR calculation using Newton-Raphson method
  const sortedFlows = [...cashFlows].sort((a, b) => a.date.getTime() - b.date.getTime());
  const startDate = sortedFlows[0].date;
  
  let rate = new Decimal(guess);
  const tolerance = new Decimal(0.0001);
  const maxIterations = 100;
  
  for (let i = 0; i < maxIterations; i++) {
    let npv = new Decimal(0);
    let dnpv = new Decimal(0);
    
    sortedFlows.forEach((flow, index) => {
      const years = new Decimal(
        (flow.date.getTime() - startDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      );
      const discountFactor = rate.plus(1).pow(years);
      
      npv = npv.plus(flow.amount.dividedBy(discountFactor));
      dnpv = dnpv.minus(
        flow.amount.times(years).dividedBy(discountFactor.times(rate.plus(1)))
      );
    });
    
    if (npv.abs().lt(tolerance)) {
      return rate.times(100).toDecimalPlaces(2);
    }
    
    if (dnpv.eq(0)) break;
    rate = rate.minus(npv.dividedBy(dnpv));
  }
  
  return rate.times(100).toDecimalPlaces(2);
};

/**
 * Calculate investment multiple (DPI, RVPI, TVPI)
 */
export const calculateInvestmentMultiples = (
  totalContributions: Decimal,
  totalDistributions: Decimal,
  currentNAV: Decimal
) => {
  const dpi = totalContributions.gt(0) 
    ? totalDistributions.dividedBy(totalContributions)
    : new Decimal(0);
    
  const rvpi = totalContributions.gt(0)
    ? currentNAV.dividedBy(totalContributions)
    : new Decimal(0);
    
  const tvpi = dpi.plus(rvpi);
  
  return {
    dpi: dpi.toDecimalPlaces(2),
    rvpi: rvpi.toDecimalPlaces(2),
    tvpi: tvpi.toDecimalPlaces(2)
  };
};

/**
 * Calculate waterfall distribution using American-style waterfall
 */
export const calculateAmericanWaterfall = (
  totalDistribution: Decimal,
  totalContributions: Decimal,
  previousDistributions: Decimal,
  preferredReturn: Decimal,
  carryPercentage: Decimal,
  catchUpPercentage: Decimal = new Decimal(100)
): WaterfallTierResult[] => {
  const tiers: WaterfallTierResult[] = [];
  let remainingAmount = totalDistribution;
  let cumulativeDistributions = previousDistributions.plus(totalDistribution);
  
  // Tier 1: Return of Capital
  const unpaidCapital = totalContributions.minus(previousDistributions);
  const tier1Amount = Decimal.min(remainingAmount, unpaidCapital);
  
  if (tier1Amount.gt(0)) {
    tiers.push({
      tier_id: 'tier-1',
      tier_number: 1,
      tier_description: 'Return of Capital',
      amount_allocated: tier1Amount,
      lp_share: tier1Amount,
      gp_share: new Decimal(0),
      cumulative_amount: tier1Amount,
      remaining_amount: remainingAmount.minus(tier1Amount)
    });
    remainingAmount = remainingAmount.minus(tier1Amount);
  }
  
  // Tier 2: Preferred Return
  const preferredReturnOwed = totalContributions.times(preferredReturn.dividedBy(100))
    .minus(Decimal.max(0, cumulativeDistributions.minus(totalContributions)));
  const tier2Amount = Decimal.min(remainingAmount, Decimal.max(0, preferredReturnOwed));
  
  if (tier2Amount.gt(0)) {
    tiers.push({
      tier_id: 'tier-2',
      tier_number: 2,
      tier_description: `Preferred Return (${preferredReturn}%)`,
      amount_allocated: tier2Amount,
      lp_share: tier2Amount,
      gp_share: new Decimal(0),
      cumulative_amount: tiers.reduce((sum, t) => sum.plus(t.amount_allocated), new Decimal(0)).plus(tier2Amount),
      remaining_amount: remainingAmount.minus(tier2Amount)
    });
    remainingAmount = remainingAmount.minus(tier2Amount);
  }
  
  // Tier 3: Catch-up
  const carryOwed = tiers.reduce((sum, t) => sum.plus(t.gp_share), new Decimal(0));
  const targetCarry = tiers.reduce((sum, t) => sum.plus(t.amount_allocated), new Decimal(0))
    .times(carryPercentage.dividedBy(100));
  const catchUpAmount = Decimal.min(remainingAmount, Decimal.max(0, targetCarry.minus(carryOwed)));
  
  if (catchUpAmount.gt(0)) {
    tiers.push({
      tier_id: 'tier-3',
      tier_number: 3,
      tier_description: `GP Catch-up (${catchUpPercentage}%)`,
      amount_allocated: catchUpAmount,
      lp_share: new Decimal(0),
      gp_share: catchUpAmount,
      cumulative_amount: tiers.reduce((sum, t) => sum.plus(t.amount_allocated), new Decimal(0)).plus(catchUpAmount),
      remaining_amount: remainingAmount.minus(catchUpAmount)
    });
    remainingAmount = remainingAmount.minus(catchUpAmount);
  }
  
  // Tier 4: Remaining carried interest split
  if (remainingAmount.gt(0)) {
    const lpShare = remainingAmount.times(new Decimal(100).minus(carryPercentage).dividedBy(100));
    const gpShare = remainingAmount.times(carryPercentage.dividedBy(100));
    
    tiers.push({
      tier_id: 'tier-4',
      tier_number: 4,
      tier_description: `Remaining Split (LP: ${100 - carryPercentage.toNumber()}%, GP: ${carryPercentage}%)`,
      amount_allocated: remainingAmount,
      lp_share: lpShare,
      gp_share: gpShare,
      cumulative_amount: tiers.reduce((sum, t) => sum.plus(t.amount_allocated), new Decimal(0)).plus(remainingAmount),
      remaining_amount: new Decimal(0)
    });
  }
  
  return tiers;
};

/**
 * Calculate European-style waterfall (deal-by-deal carry)
 */
export const calculateEuropeanWaterfall = (
  totalDistribution: Decimal,
  investmentBasis: Decimal,
  preferredReturn: Decimal,
  carryPercentage: Decimal
): WaterfallTierResult[] => {
  const tiers: WaterfallTierResult[] = [];
  let remainingAmount = totalDistribution;
  
  // Tier 1: Return of capital for this investment
  const tier1Amount = Decimal.min(remainingAmount, investmentBasis);
  
  if (tier1Amount.gt(0)) {
    tiers.push({
      tier_id: 'tier-1',
      tier_number: 1,
      tier_description: 'Return of Investment',
      amount_allocated: tier1Amount,
      lp_share: tier1Amount,
      gp_share: new Decimal(0),
      cumulative_amount: tier1Amount,
      remaining_amount: remainingAmount.minus(tier1Amount)
    });
    remainingAmount = remainingAmount.minus(tier1Amount);
  }
  
  // Tier 2: Preferred return on this investment
  const preferredReturnAmount = investmentBasis.times(preferredReturn.dividedBy(100));
  const tier2Amount = Decimal.min(remainingAmount, preferredReturnAmount);
  
  if (tier2Amount.gt(0)) {
    tiers.push({
      tier_id: 'tier-2',
      tier_number: 2,
      tier_description: `Preferred Return (${preferredReturn}%)`,
      amount_allocated: tier2Amount,
      lp_share: tier2Amount,
      gp_share: new Decimal(0),
      cumulative_amount: tiers.reduce((sum, t) => sum.plus(t.amount_allocated), new Decimal(0)).plus(tier2Amount),
      remaining_amount: remainingAmount.minus(tier2Amount)
    });
    remainingAmount = remainingAmount.minus(tier2Amount);
  }
  
  // Tier 3: Split remaining gains
  if (remainingAmount.gt(0)) {
    const lpShare = remainingAmount.times(new Decimal(100).minus(carryPercentage).dividedBy(100));
    const gpShare = remainingAmount.times(carryPercentage.dividedBy(100));
    
    tiers.push({
      tier_id: 'tier-3',
      tier_number: 3,
      tier_description: `Gain Split (LP: ${100 - carryPercentage.toNumber()}%, GP: ${carryPercentage}%)`,
      amount_allocated: remainingAmount,
      lp_share: lpShare,
      gp_share: gpShare,
      cumulative_amount: tiers.reduce((sum, t) => sum.plus(t.amount_allocated), new Decimal(0)).plus(remainingAmount),
      remaining_amount: new Decimal(0)
    });
  }
  
  return tiers;
};

/**
 * Format currency for display
 */
export const formatCurrency = (
  amount: Decimal | number | string,
  currency: string = 'USD',
  locale: string = 'en-US'
): string => {
  const decimalAmount = new Decimal(amount);
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  return formatter.format(decimalAmount.toNumber());
};

/**
 * Format percentage for display
 */
export const formatPercentage = (
  percentage: Decimal | number | string,
  decimalPlaces: number = 2
): string => {
  const decimalPercentage = new Decimal(percentage);
  return `${decimalPercentage.toFixed(decimalPlaces)}%`;
};

/**
 * Validate calculation inputs
 */
export const validateCalculationInputs = (
  inputs: Record<string, any>
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Check for required numeric fields
  const requiredFields = ['totalAmount', 'totalContributions'];
  requiredFields.forEach(field => {
    if (!inputs[field] || new Decimal(inputs[field]).lte(0)) {
      errors.push(`${field} must be a positive number`);
    }
  });
  
  // Check percentage fields
  const percentageFields = ['preferredReturn', 'carryPercentage'];
  percentageFields.forEach(field => {
    if (inputs[field] && (new Decimal(inputs[field]).lt(0) || new Decimal(inputs[field]).gt(100))) {
      errors.push(`${field} must be between 0 and 100`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
