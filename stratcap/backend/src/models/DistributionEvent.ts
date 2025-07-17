import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db/database';
import { Decimal } from 'decimal.js';

interface DistributionEventAttributes {
  id: number;
  waterfallCalculationId: number;
  investorEntityId: number;
  commitmentId: number;
  eventType: 'return_of_capital' | 'preferred_return' | 'catch_up' | 'carried_interest' | 'capital_gains';
  distributionAmount: string;
  percentageOfTotal: string;
  cumulativeAmount: string;
  allocationBasis: 'commitment' | 'contributed_capital' | 'pro_rata' | 'custom';
  allocationPercentage: string;
  taxClassification: 'return_of_capital' | 'capital_gains' | 'ordinary_income' | 'mixed';
  withholdingAmount?: string;
  netDistribution: string;
  paymentStatus: 'pending' | 'processed' | 'paid' | 'failed';
  paymentDate?: Date;
  paymentReference?: string;
  processingNotes?: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

interface DistributionEventCreationAttributes extends Optional<DistributionEventAttributes, 'id' | 'paymentStatus' | 'createdAt' | 'updatedAt'> {}

class DistributionEvent extends Model<DistributionEventAttributes, DistributionEventCreationAttributes> implements DistributionEventAttributes {
  public id!: number;
  public waterfallCalculationId!: number;
  public investorEntityId!: number;
  public commitmentId!: number;
  public eventType!: 'return_of_capital' | 'preferred_return' | 'catch_up' | 'carried_interest' | 'capital_gains';
  public distributionAmount!: string;
  public percentageOfTotal!: string;
  public cumulativeAmount!: string;
  public allocationBasis!: 'commitment' | 'contributed_capital' | 'pro_rata' | 'custom';
  public allocationPercentage!: string;
  public taxClassification!: 'return_of_capital' | 'capital_gains' | 'ordinary_income' | 'mixed';
  public withholdingAmount?: string;
  public netDistribution!: string;
  public paymentStatus!: 'pending' | 'processed' | 'paid' | 'failed';
  public paymentDate?: Date;
  public paymentReference?: string;
  public processingNotes?: string;
  public metadata?: Record<string, any>;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Virtual getters for Decimal values
  get distributionAmountDecimal(): Decimal {
    return new Decimal(this.distributionAmount);
  }

  get percentageOfTotalDecimal(): Decimal {
    return new Decimal(this.percentageOfTotal);
  }

  get cumulativeAmountDecimal(): Decimal {
    return new Decimal(this.cumulativeAmount);
  }

  get allocationPercentageDecimal(): Decimal {
    return new Decimal(this.allocationPercentage);
  }

  get withholdingAmountDecimal(): Decimal | null {
    return this.withholdingAmount ? new Decimal(this.withholdingAmount) : null;
  }

  get netDistributionDecimal(): Decimal {
    return new Decimal(this.netDistribution);
  }

  // Helper methods
  calculateNetDistribution(): Decimal {
    const gross = this.distributionAmountDecimal;
    const withholding = this.withholdingAmountDecimal || new Decimal(0);
    return gross.minus(withholding);
  }

  isReturnOfCapital(): boolean {
    return this.eventType === 'return_of_capital' || this.taxClassification === 'return_of_capital';
  }

  isCapitalGains(): boolean {
    return this.eventType === 'capital_gains' || this.taxClassification === 'capital_gains';
  }

  isCarriedInterest(): boolean {
    return this.eventType === 'carried_interest';
  }

  getEffectivePaymentDate(): Date | null {
    return this.paymentDate || null;
  }

  // Associations
  static associate(models: any) {
    DistributionEvent.belongsTo(models.WaterfallCalculation, {
      foreignKey: 'waterfallCalculationId',
      as: 'waterfallCalculation',
    });
    DistributionEvent.belongsTo(models.InvestorEntity, {
      foreignKey: 'investorEntityId',
      as: 'investor',
    });
    DistributionEvent.belongsTo(models.Commitment, {
      foreignKey: 'commitmentId',
      as: 'commitment',
    });
  }
}

DistributionEvent.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    waterfallCalculationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'waterfall_calculations',
        key: 'id',
      },
    },
    investorEntityId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'investor_entities',
        key: 'id',
      },
    },
    commitmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'commitments',
        key: 'id',
      },
    },
    eventType: {
      type: DataTypes.ENUM('return_of_capital', 'preferred_return', 'catch_up', 'carried_interest', 'capital_gains'),
      allowNull: false,
    },
    distributionAmount: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false,
      get() {
        const value = this.getDataValue('distributionAmount');
        return value ? value.toString() : '0';
      },
    },
    percentageOfTotal: {
      type: DataTypes.DECIMAL(8, 6),
      allowNull: false,
      get() {
        const value = this.getDataValue('percentageOfTotal');
        return value ? value.toString() : '0';
      },
    },
    cumulativeAmount: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false,
      get() {
        const value = this.getDataValue('cumulativeAmount');
        return value ? value.toString() : '0';
      },
    },
    allocationBasis: {
      type: DataTypes.ENUM('commitment', 'contributed_capital', 'pro_rata', 'custom'),
      allowNull: false,
    },
    allocationPercentage: {
      type: DataTypes.DECIMAL(8, 6),
      allowNull: false,
      get() {
        const value = this.getDataValue('allocationPercentage');
        return value ? value.toString() : '0';
      },
    },
    taxClassification: {
      type: DataTypes.ENUM('return_of_capital', 'capital_gains', 'ordinary_income', 'mixed'),
      allowNull: false,
    },
    withholdingAmount: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: true,
      get() {
        const value = this.getDataValue('withholdingAmount');
        return value ? value.toString() : null;
      },
    },
    netDistribution: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false,
      get() {
        const value = this.getDataValue('netDistribution');
        return value ? value.toString() : '0';
      },
    },
    paymentStatus: {
      type: DataTypes.ENUM('pending', 'processed', 'paid', 'failed'),
      defaultValue: 'pending',
    },
    paymentDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    paymentReference: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    processingNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
  },
  {
    sequelize,
    modelName: 'DistributionEvent',
    tableName: 'distribution_events',
    indexes: [
      {
        fields: ['waterfall_calculation_id'],
      },
      {
        fields: ['investor_entity_id'],
      },
      {
        fields: ['commitment_id'],
      },
      {
        fields: ['event_type'],
      },
      {
        fields: ['payment_status'],
      },
      {
        fields: ['payment_date'],
      },
    ],
  }
);

export default DistributionEvent;
export { DistributionEvent };