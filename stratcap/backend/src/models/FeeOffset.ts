import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db/database';
import { Decimal } from 'decimal.js';

interface FeeOffsetAttributes {
  id: number;
  feeCalculationId: number;
  offsetType: 'transaction_fee' | 'monitoring_fee' | 'consulting_fee' | 'expense_reimbursement' | 'other';
  offsetAmount: string; // Using string for Decimal
  offsetDate: Date;
  description: string;
  sourceReference?: string; // Reference to the transaction or expense that creates the offset
  isApproved: boolean;
  approvedBy?: number; // User ID
  approvedAt?: Date;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

interface FeeOffsetCreationAttributes extends Optional<FeeOffsetAttributes, 'id' | 'isApproved' | 'createdAt' | 'updatedAt'> {}

class FeeOffset extends Model<FeeOffsetAttributes, FeeOffsetCreationAttributes> implements FeeOffsetAttributes {
  public id!: number;
  public feeCalculationId!: number;
  public offsetType!: 'transaction_fee' | 'monitoring_fee' | 'consulting_fee' | 'expense_reimbursement' | 'other';
  public offsetAmount!: string;
  public offsetDate!: Date;
  public description!: string;
  public sourceReference?: string;
  public isApproved!: boolean;
  public approvedBy?: number;
  public approvedAt?: Date;
  public metadata?: Record<string, any>;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Virtual getters for Decimal values
  get offsetAmountDecimal(): Decimal {
    return new Decimal(this.offsetAmount);
  }

  // Associations
  static associate(models: any) {
    FeeOffset.belongsTo(models.FeeCalculation, {
      foreignKey: 'feeCalculationId',
      as: 'feeCalculation',
    });
    FeeOffset.belongsTo(models.User, {
      foreignKey: 'approvedBy',
      as: 'approver',
    });
  }

  // Methods
  public approve(userId: number): void {
    this.isApproved = true;
    this.approvedBy = userId;
    this.approvedAt = new Date();
  }

  public reject(): void {
    this.isApproved = false;
    this.approvedBy = undefined;
    this.approvedAt = undefined;
  }
}

FeeOffset.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    feeCalculationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'fee_calculations',
        key: 'id',
      },
    },
    offsetType: {
      type: DataTypes.ENUM('transaction_fee', 'monitoring_fee', 'consulting_fee', 'expense_reimbursement', 'other'),
      allowNull: false,
    },
    offsetAmount: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false,
      get() {
        const value = this.getDataValue('offsetAmount');
        return value ? value.toString() : '0';
      },
    },
    offsetDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    sourceReference: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isApproved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
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
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
  },
  {
    sequelize,
    modelName: 'FeeOffset',
    tableName: 'fee_offsets',
    indexes: [
      {
        fields: ['fee_calculation_id'],
      },
      {
        fields: ['offset_type'],
      },
      {
        fields: ['offset_date'],
      },
      {
        fields: ['is_approved'],
      },
    ],
  }
);

export default FeeOffset;
export { FeeOffset };