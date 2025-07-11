import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db/database';
import { Decimal } from 'decimal.js';

interface WaterfallCalculationAttributes {
  id: number;
  fundId: number;
  capitalActivityId?: number;
  calculationType: 'distribution' | 'hypothetical' | 'irr_analysis';
  calculationDate: Date;
  totalDistribution: string;
  totalDistributed: string;
  returnOfCapital: string;
  capitalGains: string;
  preferredReturnAccrued: string;
  preferredReturnPaid: string;
  catchUpAmount: string;
  carriedInterestAmount: string;
  cumulativeDistributions: string;
  cumulativeReturned: string;
  remainingCapital: string;
  grossIRR?: string;
  netIRR?: string;
  multiple?: string;
  status: 'draft' | 'calculated' | 'approved' | 'distributed';
  tierResults: Record<string, any>;
  allocationResults: Record<string, any>;
  auditTrail: Record<string, any>;
  calculationInputs: Record<string, any>;
  metadata?: Record<string, any>;
  createdBy: number;
  approvedBy?: number;
  approvedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface WaterfallCalculationCreationAttributes extends Optional<WaterfallCalculationAttributes, 'id' | 'status' | 'createdAt' | 'updatedAt'> {}

class WaterfallCalculation extends Model<WaterfallCalculationAttributes, WaterfallCalculationCreationAttributes> implements WaterfallCalculationAttributes {
  public id!: number;
  public fundId!: number;
  public capitalActivityId?: number;
  public calculationType!: 'distribution' | 'hypothetical' | 'irr_analysis';
  public calculationDate!: Date;
  public totalDistribution!: string;
  public totalDistributed!: string;
  public returnOfCapital!: string;
  public capitalGains!: string;
  public preferredReturnAccrued!: string;
  public preferredReturnPaid!: string;
  public catchUpAmount!: string;
  public carriedInterestAmount!: string;
  public cumulativeDistributions!: string;
  public cumulativeReturned!: string;
  public remainingCapital!: string;
  public grossIRR?: string;
  public netIRR?: string;
  public multiple?: string;
  public status!: 'draft' | 'calculated' | 'approved' | 'distributed';
  public tierResults!: Record<string, any>;
  public allocationResults!: Record<string, any>;
  public auditTrail!: Record<string, any>;
  public calculationInputs!: Record<string, any>;
  public metadata?: Record<string, any>;
  public createdBy!: number;
  public approvedBy?: number;
  public approvedAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Virtual getters for Decimal values
  get totalDistributionDecimal(): Decimal {
    return new Decimal(this.totalDistribution);
  }

  get totalDistributedDecimal(): Decimal {
    return new Decimal(this.totalDistributed);
  }

  get returnOfCapitalDecimal(): Decimal {
    return new Decimal(this.returnOfCapital);
  }

  get capitalGainsDecimal(): Decimal {
    return new Decimal(this.capitalGains);
  }

  get preferredReturnAccruedDecimal(): Decimal {
    return new Decimal(this.preferredReturnAccrued);
  }

  get preferredReturnPaidDecimal(): Decimal {
    return new Decimal(this.preferredReturnPaid);
  }

  get catchUpAmountDecimal(): Decimal {
    return new Decimal(this.catchUpAmount);
  }

  get carriedInterestAmountDecimal(): Decimal {
    return new Decimal(this.carriedInterestAmount);
  }

  get cumulativeDistributionsDecimal(): Decimal {
    return new Decimal(this.cumulativeDistributions);
  }

  get cumulativeReturnedDecimal(): Decimal {
    return new Decimal(this.cumulativeReturned);
  }

  get remainingCapitalDecimal(): Decimal {
    return new Decimal(this.remainingCapital);
  }

  // Helper methods
  getGrossIRRDecimal(): Decimal | null {
    return this.grossIRR ? new Decimal(this.grossIRR) : null;
  }

  getNetIRRDecimal(): Decimal | null {
    return this.netIRR ? new Decimal(this.netIRR) : null;
  }

  getMultipleDecimal(): Decimal | null {
    return this.multiple ? new Decimal(this.multiple) : null;
  }

  // Associations
  static associate(models: any) {
    WaterfallCalculation.belongsTo(models.Fund, {
      foreignKey: 'fundId',
      as: 'fund',
    });
    WaterfallCalculation.belongsTo(models.CapitalActivity, {
      foreignKey: 'capitalActivityId',
      as: 'capitalActivity',
    });
    WaterfallCalculation.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator',
    });
    WaterfallCalculation.belongsTo(models.User, {
      foreignKey: 'approvedBy',
      as: 'approver',
    });
    WaterfallCalculation.hasMany(models.WaterfallTier, {
      foreignKey: 'waterfallCalculationId',
      as: 'tiers',
    });
    WaterfallCalculation.hasMany(models.DistributionEvent, {
      foreignKey: 'waterfallCalculationId',
      as: 'distributionEvents',
    });
    WaterfallCalculation.hasMany(models.TierAudit, {
      foreignKey: 'waterfallCalculationId',
      as: 'tierAudits',
    });
  }
}

WaterfallCalculation.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    fundId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'funds',
        key: 'id',
      },
    },
    capitalActivityId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'capital_activities',
        key: 'id',
      },
    },
    calculationType: {
      type: DataTypes.ENUM('distribution', 'hypothetical', 'irr_analysis'),
      allowNull: false,
    },
    calculationDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    totalDistribution: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false,
      get() {
        const value = this.getDataValue('totalDistribution');
        return value ? value.toString() : '0';
      },
    },
    totalDistributed: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false,
      get() {
        const value = this.getDataValue('totalDistributed');
        return value ? value.toString() : '0';
      },
    },
    returnOfCapital: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false,
      get() {
        const value = this.getDataValue('returnOfCapital');
        return value ? value.toString() : '0';
      },
    },
    capitalGains: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false,
      get() {
        const value = this.getDataValue('capitalGains');
        return value ? value.toString() : '0';
      },
    },
    preferredReturnAccrued: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false,
      get() {
        const value = this.getDataValue('preferredReturnAccrued');
        return value ? value.toString() : '0';
      },
    },
    preferredReturnPaid: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false,
      get() {
        const value = this.getDataValue('preferredReturnPaid');
        return value ? value.toString() : '0';
      },
    },
    catchUpAmount: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false,
      get() {
        const value = this.getDataValue('catchUpAmount');
        return value ? value.toString() : '0';
      },
    },
    carriedInterestAmount: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false,
      get() {
        const value = this.getDataValue('carriedInterestAmount');
        return value ? value.toString() : '0';
      },
    },
    cumulativeDistributions: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false,
      get() {
        const value = this.getDataValue('cumulativeDistributions');
        return value ? value.toString() : '0';
      },
    },
    cumulativeReturned: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false,
      get() {
        const value = this.getDataValue('cumulativeReturned');
        return value ? value.toString() : '0';
      },
    },
    remainingCapital: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false,
      get() {
        const value = this.getDataValue('remainingCapital');
        return value ? value.toString() : '0';
      },
    },
    grossIRR: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: true,
      get() {
        const value = this.getDataValue('grossIRR');
        return value ? value.toString() : null;
      },
    },
    netIRR: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: true,
      get() {
        const value = this.getDataValue('netIRR');
        return value ? value.toString() : null;
      },
    },
    multiple: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true,
      get() {
        const value = this.getDataValue('multiple');
        return value ? value.toString() : null;
      },
    },
    status: {
      type: DataTypes.ENUM('draft', 'calculated', 'approved', 'distributed'),
      defaultValue: 'draft',
    },
    tierResults: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    allocationResults: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    auditTrail: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        calculations: [],
        decisions: [],
        allocations: [],
        timestamp: new Date().toISOString(),
      },
    },
    calculationInputs: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    approvedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'WaterfallCalculation',
    tableName: 'waterfall_calculations',
    indexes: [
      {
        fields: ['fund_id'],
      },
      {
        fields: ['capital_activity_id'],
      },
      {
        fields: ['calculation_type'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['calculation_date'],
      },
    ],
  }
);

export default WaterfallCalculation;