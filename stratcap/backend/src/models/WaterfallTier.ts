import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db/database';
import { Decimal } from 'decimal.js';

interface WaterfallTierAttributes {
  id: number;
  waterfallCalculationId: number;
  tierLevel: number;
  tierName: string;
  tierType: 'preferred_return' | 'catch_up' | 'carried_interest' | 'promote' | 'distribution';
  priority: number;
  lpAllocation: string; // Percentage as decimal
  gpAllocation: string; // Percentage as decimal
  thresholdAmount?: string;
  targetAmount?: string;
  actualAmount: string;
  distributedAmount: string;
  remainingAmount: string;
  isFullyAllocated: boolean;
  allocationMethod: 'pro_rata' | 'waterfall' | 'priority' | 'hybrid';
  calculations: Record<string, any>;
  investorAllocations: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

interface WaterfallTierCreationAttributes extends Optional<WaterfallTierAttributes, 'id' | 'isFullyAllocated' | 'createdAt' | 'updatedAt'> {}

class WaterfallTier extends Model<WaterfallTierAttributes, WaterfallTierCreationAttributes> implements WaterfallTierAttributes {
  public id!: number;
  public waterfallCalculationId!: number;
  public tierLevel!: number;
  public tierName!: string;
  public tierType!: 'preferred_return' | 'catch_up' | 'carried_interest' | 'promote' | 'distribution';
  public priority!: number;
  public lpAllocation!: string;
  public gpAllocation!: string;
  public thresholdAmount?: string;
  public targetAmount?: string;
  public actualAmount!: string;
  public distributedAmount!: string;
  public remainingAmount!: string;
  public isFullyAllocated!: boolean;
  public allocationMethod!: 'pro_rata' | 'waterfall' | 'priority' | 'hybrid';
  public calculations!: Record<string, any>;
  public investorAllocations!: Record<string, any>;
  public metadata?: Record<string, any>;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Virtual getters for Decimal values
  get lpAllocationDecimal(): Decimal {
    return new Decimal(this.lpAllocation);
  }

  get gpAllocationDecimal(): Decimal {
    return new Decimal(this.gpAllocation);
  }

  get thresholdAmountDecimal(): Decimal | null {
    return this.thresholdAmount ? new Decimal(this.thresholdAmount) : null;
  }

  get targetAmountDecimal(): Decimal | null {
    return this.targetAmount ? new Decimal(this.targetAmount) : null;
  }

  get actualAmountDecimal(): Decimal {
    return new Decimal(this.actualAmount);
  }

  get distributedAmountDecimal(): Decimal {
    return new Decimal(this.distributedAmount);
  }

  get remainingAmountDecimal(): Decimal {
    return new Decimal(this.remainingAmount);
  }

  // Helper methods
  getAllocationPercentage(party: 'lp' | 'gp'): Decimal {
    return party === 'lp' ? this.lpAllocationDecimal : this.gpAllocationDecimal;
  }

  getTotalAllocation(): Decimal {
    return this.lpAllocationDecimal.plus(this.gpAllocationDecimal);
  }

  isThresholdMet(amount: Decimal): boolean {
    if (!this.thresholdAmount) return true;
    return amount.gte(this.thresholdAmountDecimal!);
  }

  calculateAllocation(amount: Decimal, party: 'lp' | 'gp'): Decimal {
    const percentage = this.getAllocationPercentage(party);
    return amount.mul(percentage).div(100);
  }

  // Associations
  static associate(models: any) {
    WaterfallTier.belongsTo(models.WaterfallCalculation, {
      foreignKey: 'waterfallCalculationId',
      as: 'waterfallCalculation',
    });
    WaterfallTier.hasMany(models.TierAudit, {
      foreignKey: 'waterfallTierId',
      as: 'audits',
    });
  }
}

WaterfallTier.init(
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
    tierLevel: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    tierName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    tierType: {
      type: DataTypes.ENUM('preferred_return', 'catch_up', 'carried_interest', 'promote', 'distribution'),
      allowNull: false,
    },
    priority: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    lpAllocation: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
      get() {
        const value = this.getDataValue('lpAllocation');
        return value ? value.toString() : '0';
      },
    },
    gpAllocation: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
      get() {
        const value = this.getDataValue('gpAllocation');
        return value ? value.toString() : '0';
      },
    },
    thresholdAmount: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: true,
      get() {
        const value = this.getDataValue('thresholdAmount');
        return value ? value.toString() : null;
      },
    },
    targetAmount: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: true,
      get() {
        const value = this.getDataValue('targetAmount');
        return value ? value.toString() : null;
      },
    },
    actualAmount: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false,
      get() {
        const value = this.getDataValue('actualAmount');
        return value ? value.toString() : '0';
      },
    },
    distributedAmount: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false,
      get() {
        const value = this.getDataValue('distributedAmount');
        return value ? value.toString() : '0';
      },
    },
    remainingAmount: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false,
      get() {
        const value = this.getDataValue('remainingAmount');
        return value ? value.toString() : '0';
      },
    },
    isFullyAllocated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    allocationMethod: {
      type: DataTypes.ENUM('pro_rata', 'waterfall', 'priority', 'hybrid'),
      allowNull: false,
      defaultValue: 'waterfall',
    },
    calculations: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        steps: [],
        formulas: {},
        intermediateResults: {},
      },
    },
    investorAllocations: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
  },
  {
    sequelize,
    modelName: 'WaterfallTier',
    tableName: 'waterfall_tiers',
    indexes: [
      {
        fields: ['waterfall_calculation_id'],
      },
      {
        fields: ['tier_level'],
      },
      {
        fields: ['tier_type'],
      },
      {
        fields: ['priority'],
      },
      {
        unique: true,
        fields: ['waterfall_calculation_id', 'tier_level'],
      },
    ],
  }
);

export default WaterfallTier;