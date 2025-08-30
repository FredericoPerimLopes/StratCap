// Main Module
export { default as CapitalActivityModule } from './CapitalActivityModule';

// Capital Calls
export { default as CapitalCallDashboard } from './calls/CapitalCallDashboard';
export { default as CapitalCallCreation } from './calls/CapitalCallCreation';
export { default as CapitalCallAllocation } from './calls/CapitalCallAllocation';
export { default as CapitalCallReview } from './calls/CapitalCallReview';

// Distributions
export { default as DistributionDashboard } from './distributions/DistributionDashboard';

// Waterfall
export { default as WaterfallCalculation } from './waterfall/WaterfallCalculation';

// Equalization
export { default as EqualizationDashboard } from './equalization/EqualizationDashboard';

// Hooks
export { useCapitalActivity, useWizardState } from '../../hooks/capital-activity/useCapitalActivity';

// Types
export type {
  Fund,
  Investor,
  CapitalCall,
  CapitalCallAllocation,
  Distribution,
  DistributionAllocation,
  WaterfallStructure,
  WaterfallCalculation,
  WaterfallTierResult,
  Equalization,
  EqualizationAdjustment,
  AuditTrail
} from '../../types/capital-activity';

// Utilities
export {
  calculateProportionalAllocation,
  calculateAmericanWaterfall,
  calculateEuropeanWaterfall,
  formatCurrency,
  formatPercentage,
  validateCalculationInputs
} from '../../utils/financial/calculations';
