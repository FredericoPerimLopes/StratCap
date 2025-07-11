import sequelize from '../db/database';
import User from './User';
import FundFamily from './FundFamily';
import Fund from './Fund';
import InvestorEntity from './InvestorEntity';
import InvestorClass from './InvestorClass';
import Commitment from './Commitment';
import CapitalActivity from './CapitalActivity';
import CapitalAllocation from './CapitalAllocation';
import DistributionAllocation from './DistributionAllocation';
import NotificationTemplate from './NotificationTemplate';
import Transaction from './Transaction';
import Investment from './Investment';
import Closing from './Closing';
import FeeCalculation from './FeeCalculation';
import FeeCharge from './FeeCharge';
import FeeOffset from './FeeOffset';
import FeeWaiver from './FeeWaiver';
import FeeBasis from './FeeBasis';
import WaterfallCalculation from './WaterfallCalculation';
import WaterfallTier from './WaterfallTier';
import DistributionEvent from './DistributionEvent';
import TierAudit from './TierAudit';
import InvestorTransfer from './InvestorTransfer';

const models = {
  User,
  FundFamily,
  Fund,
  InvestorEntity,
  InvestorClass,
  Commitment,
  CapitalActivity,
  CapitalAllocation,
  DistributionAllocation,
  NotificationTemplate,
  Transaction,
  Investment,
  Closing,
  FeeCalculation,
  FeeCharge,
  FeeOffset,
  FeeWaiver,
  FeeBasis,
  WaterfallCalculation,
  WaterfallTier,
  DistributionEvent,
  TierAudit,
  InvestorTransfer,
};

// Initialize associations
Object.values(models).forEach((model: any) => {
  if (model.associate) {
    model.associate(models);
  }
});

export {
  sequelize,
  User,
  FundFamily,
  Fund,
  InvestorEntity,
  InvestorClass,
  Commitment,
  CapitalActivity,
  Transaction,
  Investment,
  Closing,
  FeeCalculation,
  FeeCharge,
  FeeOffset,
  FeeWaiver,
  FeeBasis,
  WaterfallCalculation,
  WaterfallTier,
  DistributionEvent,
  TierAudit,
  InvestorTransfer,
};

export default models;