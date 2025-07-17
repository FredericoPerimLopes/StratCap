import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db/database';
import { Decimal } from 'decimal.js';

interface FeeWaiverAttributes {
  id: number;
  feeCalculationId: number;
  investorEntityId?: number; // If null, applies to all investors
  waiverType: 'full' | 'partial' | 'percentage';
  waiverAmount?: string; // For partial waivers
  waiverPercentage?: string; // For percentage waivers
  effectiveDate: Date;
  expirationDate?: Date;
  reason: string;
  isApproved: boolean;
  approvedBy?: number; // User ID
  approvedAt?: Date;
  isActive: boolean;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

interface FeeWaiverCreationAttributes extends Optional<FeeWaiverAttributes, 'id' | 'isApproved' | 'isActive' | 'createdAt' | 'updatedAt'> {}

class FeeWaiver extends Model<FeeWaiverAttributes, FeeWaiverCreationAttributes> implements FeeWaiverAttributes {
  public id!: number;
  public feeCalculationId!: number;
  public investorEntityId?: number;
  public waiverType!: 'full' | 'partial' | 'percentage';
  public waiverAmount?: string;
  public waiverPercentage?: string;
  public effectiveDate!: Date;
  public expirationDate?: Date;
  public reason!: string;
  public isApproved!: boolean;
  public approvedBy?: number;
  public approvedAt?: Date;
  public isActive!: boolean;
  public metadata?: Record<string, any>;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Virtual getters for Decimal values
  get waiverAmountDecimal(): Decimal | null {
    return this.waiverAmount ? new Decimal(this.waiverAmount) : null;
  }

  get waiverPercentageDecimal(): Decimal | null {
    return this.waiverPercentage ? new Decimal(this.waiverPercentage) : null;
  }

  // Associations
  static associate(models: any) {
    FeeWaiver.belongsTo(models.FeeCalculation, {
      foreignKey: 'feeCalculationId',
      as: 'feeCalculation',
    });
    FeeWaiver.belongsTo(models.InvestorEntity, {
      foreignKey: 'investorEntityId',
      as: 'investor',
    });
    FeeWaiver.belongsTo(models.User, {
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

  public calculateWaiverAmount(grossAmount: string): Decimal {
    const grossDecimal = new Decimal(grossAmount);

    switch (this.waiverType) {
      case 'full':
        return grossDecimal;
      case 'partial':
        return this.waiverAmountDecimal || new Decimal(0);
      case 'percentage':
        const percentage = this.waiverPercentageDecimal || new Decimal(0);
        return grossDecimal.times(percentage);
      default:
        return new Decimal(0);
    }
  }

  public isValidForDate(date: Date): boolean {
    const effectiveDate = new Date(this.effectiveDate);
    const expirationDate = this.expirationDate ? new Date(this.expirationDate) : null;
    
    return this.isActive && 
           this.isApproved && 
           date >= effectiveDate && 
           (!expirationDate || date <= expirationDate);
  }
}

FeeWaiver.init(
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
    investorEntityId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'investor_entities',
        key: 'id',
      },
    },
    waiverType: {
      type: DataTypes.ENUM('full', 'partial', 'percentage'),
      allowNull: false,
    },
    waiverAmount: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: true,
      get() {
        const value = this.getDataValue('waiverAmount');
        return value ? value.toString() : null;
      },
    },
    waiverPercentage: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: true,
      get() {
        const value = this.getDataValue('waiverPercentage');
        return value ? value.toString() : null;
      },
    },
    effectiveDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    expirationDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
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
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
  },
  {
    sequelize,
    modelName: 'FeeWaiver',
    tableName: 'fee_waivers',
    indexes: [
      {
        fields: ['fee_calculation_id'],
      },
      {
        fields: ['investor_entity_id'],
      },
      {
        fields: ['effective_date', 'expiration_date'],
      },
      {
        fields: ['is_approved', 'is_active'],
      },
    ],
  }
);

export default FeeWaiver;
export { FeeWaiver };