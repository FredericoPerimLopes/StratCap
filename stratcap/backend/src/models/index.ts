import sequelize from '../db/database';
import User from './User';
import FundFamily from './FundFamily';
import Fund from './Fund';
import InvestorEntity from './InvestorEntity';
import InvestorClass from './InvestorClass';
import Commitment from './Commitment';
import CapitalActivity from './CapitalActivity';
import Transaction from './Transaction';
import Investment from './Investment';
import Closing from './Closing';

const models = {
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
};

export default models;