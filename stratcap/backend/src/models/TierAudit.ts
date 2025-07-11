import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db/database';
import { Decimal } from 'decimal.js';

interface TierAuditAttributes {
  id: number;
  waterfallCalculationId: number;
  waterfallTierId: number;
  stepNumber: number;
  stepName: string;
  stepType: 'calculation' | 'allocation' | 'validation' | 'adjustment';
  inputAmount: string;
  outputAmount: string;
  formula: string;
  description: string;
  calculations: Record<string, any>;
  intermediateResults: Record<string, any>;
  allocationBreakdown: Record<string, any>;
  validationResults: Record<string, any>;
  isValidationPassed: boolean;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TierAuditCreationAttributes extends Optional<TierAuditAttributes, 'id' | 'isValidationPassed' | 'createdAt' | 'updatedAt'> {}

class TierAudit extends Model<TierAuditAttributes, TierAuditCreationAttributes> implements TierAuditAttributes {
  public id!: number;
  public waterfallCalculationId!: number;
  public waterfallTierId!: number;
  public stepNumber!: number;
  public stepName!: string;
  public stepType!: 'calculation' | 'allocation' | 'validation' | 'adjustment';
  public inputAmount!: string;
  public outputAmount!: string;
  public formula!: string;
  public description!: string;
  public calculations!: Record<string, any>;
  public intermediateResults!: Record<string, any>;
  public allocationBreakdown!: Record<string, any>;
  public validationResults!: Record<string, any>;
  public isValidationPassed!: boolean;
  public notes?: string;
  public metadata?: Record<string, any>;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Virtual getters for Decimal values
  get inputAmountDecimal(): Decimal {
    return new Decimal(this.inputAmount);
  }

  get outputAmountDecimal(): Decimal {
    return new Decimal(this.outputAmount);
  }

  // Helper methods
  getDifference(): Decimal {
    return this.outputAmountDecimal.minus(this.inputAmountDecimal);
  }

  getPercentageChange(): Decimal {
    if (this.inputAmountDecimal.isZero()) {
      return new Decimal(0);
    }
    return this.getDifference().div(this.inputAmountDecimal).mul(100);
  }

  addIntermediateResult(key: string, value: any): void {
    this.intermediateResults = {
      ...this.intermediateResults,
      [key]: value,
    };
  }

  addValidationResult(check: string, passed: boolean, details?: any): void {
    this.validationResults = {
      ...this.validationResults,
      [check]: {
        passed,
        details: details || null,
        timestamp: new Date().toISOString(),
      },
    };
  }

  // Associations
  static associate(models: any) {
    TierAudit.belongsTo(models.WaterfallCalculation, {
      foreignKey: 'waterfallCalculationId',
      as: 'waterfallCalculation',
    });
    TierAudit.belongsTo(models.WaterfallTier, {
      foreignKey: 'waterfallTierId',
      as: 'waterfallTier',
    });
  }
}

TierAudit.init(
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
    waterfallTierId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'waterfall_tiers',
        key: 'id',
      },
    },
    stepNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    stepName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    stepType: {
      type: DataTypes.ENUM('calculation', 'allocation', 'validation', 'adjustment'),
      allowNull: false,
    },
    inputAmount: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false,
      get() {
        const value = this.getDataValue('inputAmount');
        return value ? value.toString() : '0';
      },
    },
    outputAmount: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false,
      get() {
        const value = this.getDataValue('outputAmount');
        return value ? value.toString() : '0';
      },
    },
    formula: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    calculations: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        inputs: {},
        operations: [],
        outputs: {},
      },
    },
    intermediateResults: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    allocationBreakdown: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        lpAllocation: '0',
        gpAllocation: '0',
        investorBreakdown: {},
      },
    },
    validationResults: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    isValidationPassed: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    notes: {
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
    modelName: 'TierAudit',
    tableName: 'tier_audits',
    indexes: [
      {
        fields: ['waterfall_calculation_id'],
      },
      {
        fields: ['waterfall_tier_id'],
      },
      {
        fields: ['step_number'],
      },
      {
        fields: ['step_type'],
      },
      {
        unique: true,
        fields: ['waterfall_tier_id', 'step_number'],
      },
    ],
  }
);

export default TierAudit;