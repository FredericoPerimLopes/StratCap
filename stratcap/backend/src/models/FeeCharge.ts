import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db/database';
import { Decimal } from 'decimal.js';

interface FeeChargeAttributes {
  id: number;
  feeCalculationId: number;
  investorEntityId: number;
  commitmentId?: number;
  chargeDate: Date;
  dueDate?: Date;
  feeType: 'management' | 'carried_interest' | 'other';
  chargeAmount: string; // Using string for Decimal
  paidAmount: string;
  remainingAmount: string;
  status: 'pending' | 'invoiced' | 'paid' | 'overdue' | 'written_off';
  invoiceNumber?: string;
  paymentReference?: string;
  description?: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

interface FeeChargeCreationAttributes extends Optional<FeeChargeAttributes, 'id' | 'status' | 'paidAmount' | 'remainingAmount' | 'createdAt' | 'updatedAt'> {}

class FeeCharge extends Model<FeeChargeAttributes, FeeChargeCreationAttributes> implements FeeChargeAttributes {
  public id!: number;
  public feeCalculationId!: number;
  public investorEntityId!: number;
  public commitmentId?: number;
  public chargeDate!: Date;
  public dueDate?: Date;
  public feeType!: 'management' | 'carried_interest' | 'other';
  public chargeAmount!: string;
  public paidAmount!: string;
  public remainingAmount!: string;
  public status!: 'pending' | 'invoiced' | 'paid' | 'overdue' | 'written_off';
  public invoiceNumber?: string;
  public paymentReference?: string;
  public description?: string;
  public metadata?: Record<string, any>;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Virtual getters for Decimal values
  get chargeAmountDecimal(): Decimal {
    return new Decimal(this.chargeAmount);
  }

  get paidAmountDecimal(): Decimal {
    return new Decimal(this.paidAmount);
  }

  get remainingAmountDecimal(): Decimal {
    return new Decimal(this.remainingAmount);
  }

  // Associations
  static associate(models: any) {
    FeeCharge.belongsTo(models.FeeCalculation, {
      foreignKey: 'feeCalculationId',
      as: 'feeCalculation',
    });
    FeeCharge.belongsTo(models.InvestorEntity, {
      foreignKey: 'investorEntityId',
      as: 'investor',
    });
    FeeCharge.belongsTo(models.Commitment, {
      foreignKey: 'commitmentId',
      as: 'commitment',
    });
  }

  // Methods
  public updatePaidAmount(amount: string): void {
    const paidDecimal = this.paidAmountDecimal.plus(amount);
    const remainingDecimal = this.chargeAmountDecimal.minus(paidDecimal);
    
    this.paidAmount = paidDecimal.toString();
    this.remainingAmount = remainingDecimal.toString();
    
    if (remainingDecimal.isZero()) {
      this.status = 'paid';
    }
  }

  public isOverdue(): boolean {
    return this.dueDate ? new Date() > this.dueDate && this.status !== 'paid' : false;
  }
}

FeeCharge.init(
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
      allowNull: false,
      references: {
        model: 'investor_entities',
        key: 'id',
      },
    },
    commitmentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'commitments',
        key: 'id',
      },
    },
    chargeDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    feeType: {
      type: DataTypes.ENUM('management', 'carried_interest', 'other'),
      allowNull: false,
    },
    chargeAmount: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false,
      get() {
        const value = this.getDataValue('chargeAmount');
        return value ? value.toString() : '0';
      },
    },
    paidAmount: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false,
      defaultValue: 0,
      get() {
        const value = this.getDataValue('paidAmount');
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
    status: {
      type: DataTypes.ENUM('pending', 'invoiced', 'paid', 'overdue', 'written_off'),
      defaultValue: 'pending',
    },
    invoiceNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    paymentReference: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
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
    modelName: 'FeeCharge',
    tableName: 'fee_charges',
    hooks: {
      beforeCreate: (charge: FeeCharge) => {
        if (!charge.remainingAmount) {
          charge.remainingAmount = charge.chargeAmount;
        }
      },
    },
    indexes: [
      {
        fields: ['fee_calculation_id'],
      },
      {
        fields: ['investor_entity_id'],
      },
      {
        fields: ['charge_date'],
      },
      {
        fields: ['due_date'],
      },
      {
        fields: ['status'],
      },
    ],
  }
);

export default FeeCharge;
export { FeeCharge };