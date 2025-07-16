import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db/database';
import { Decimal } from 'decimal.js';

interface FeeCalculationAttributes {
  id: number;
  fundId: number;
  periodStartDate: Date;
  periodEndDate: Date;
  calculationDate: Date;
  feeType: 'management' | 'carried_interest' | 'other';
  basis: 'nav' | 'commitments' | 'invested_capital' | 'distributions';
  basisAmount: string; // Using string for Decimal
  feeRate: string;
  grossFeeAmount: string;
  netFeeAmount: string; // After offsets and waivers
  status: 'calculated' | 'posted' | 'paid' | 'reversed';
  isAccrual: boolean;
  description?: string;
  calculationMethod?: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

interface FeeCalculationCreationAttributes extends Optional<FeeCalculationAttributes, 'id' | 'status' | 'isAccrual' | 'createdAt' | 'updatedAt'> {}

class FeeCalculation extends Model<FeeCalculationAttributes, FeeCalculationCreationAttributes> implements FeeCalculationAttributes {
  public id!: number;
  public fundId!: number;
  public periodStartDate!: Date;
  public periodEndDate!: Date;
  public calculationDate!: Date;
  public feeType!: 'management' | 'carried_interest' | 'other';
  public basis!: 'nav' | 'commitments' | 'invested_capital' | 'distributions';
  public basisAmount!: string;
  public feeRate!: string;
  public grossFeeAmount!: string;
  public netFeeAmount!: string;
  public status!: 'calculated' | 'posted' | 'paid' | 'reversed';
  public isAccrual!: boolean;
  public description?: string;
  public calculationMethod?: string;
  public metadata?: Record<string, any>;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Association properties
  public readonly offsets?: any[];
  public readonly waivers?: any[];

  // Virtual getters for Decimal values
  get basisAmountDecimal(): Decimal {
    return new Decimal(this.basisAmount);
  }

  get feeRateDecimal(): Decimal {
    return new Decimal(this.feeRate);
  }

  get grossFeeAmountDecimal(): Decimal {
    return new Decimal(this.grossFeeAmount);
  }

  get netFeeAmountDecimal(): Decimal {
    return new Decimal(this.netFeeAmount);
  }

  // Associations
  static associate(models: any) {
    FeeCalculation.belongsTo(models.Fund, {
      foreignKey: 'fundId',
      as: 'fund',
    });
    FeeCalculation.hasMany(models.FeeCharge, {
      foreignKey: 'feeCalculationId',
      as: 'charges',
    });
    FeeCalculation.hasMany(models.FeeOffset, {
      foreignKey: 'feeCalculationId',
      as: 'offsets',
    });
    FeeCalculation.hasMany(models.FeeWaiver, {
      foreignKey: 'feeCalculationId',
      as: 'waivers',
    });
  }
}

FeeCalculation.init(
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
    periodStartDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    periodEndDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    calculationDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    feeType: {
      type: DataTypes.ENUM('management', 'carried_interest', 'other'),
      allowNull: false,
    },
    basis: {
      type: DataTypes.ENUM('nav', 'commitments', 'invested_capital', 'distributions'),
      allowNull: false,
    },
    basisAmount: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false,
      get() {
        const value = this.getDataValue('basisAmount');
        return value ? value.toString() : '0';
      },
    },
    feeRate: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
      get() {
        const value = this.getDataValue('feeRate');
        return value ? value.toString() : '0';
      },
    },
    grossFeeAmount: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false,
      get() {
        const value = this.getDataValue('grossFeeAmount');
        return value ? value.toString() : '0';
      },
    },
    netFeeAmount: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false,
      get() {
        const value = this.getDataValue('netFeeAmount');
        return value ? value.toString() : '0';
      },
    },
    status: {
      type: DataTypes.ENUM('calculated', 'posted', 'paid', 'reversed'),
      defaultValue: 'calculated',
    },
    isAccrual: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    calculationMethod: {
      type: DataTypes.STRING,
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
    modelName: 'FeeCalculation',
    tableName: 'fee_calculations',
    indexes: [
      {
        fields: ['fund_id', 'period_start_date', 'period_end_date', 'fee_type'],
      },
      {
        fields: ['calculation_date'],
      },
      {
        fields: ['status'],
      },
    ],
  }
);

export default FeeCalculation;