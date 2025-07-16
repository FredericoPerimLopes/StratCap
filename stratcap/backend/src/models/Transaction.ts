import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db/database';

interface TransactionAttributes {
  id: number;
  fundId: number;
  commitmentId: number;
  capitalActivityId?: number;
  transactionDate: Date;
  effectiveDate: Date;
  transactionType: 'capital_call' | 'distribution' | 'fee' | 'expense' | 'equalization' | 'transfer' | 'adjustment';
  transactionCode: string;
  description: string;
  amount: string;
  currency: string;
  baseAmount?: string;
  exchangeRate?: string;
  direction: 'debit' | 'credit';
  category?: string;
  subCategory?: string;
  glAccountCode?: string;
  isReversed: boolean;
  reversalOfId?: number;
  batchId?: string;
  referenceNumber?: string;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TransactionCreationAttributes extends Optional<TransactionAttributes, 'id' | 'currency' | 'direction' | 'isReversed' | 'createdAt' | 'updatedAt'> {}

class Transaction extends Model<TransactionAttributes, TransactionCreationAttributes> implements TransactionAttributes {
  public id!: number;
  public fundId!: number;
  public commitmentId!: number;
  public capitalActivityId?: number;
  public transactionDate!: Date;
  public effectiveDate!: Date;
  public transactionType!: 'capital_call' | 'distribution' | 'fee' | 'expense' | 'equalization' | 'transfer' | 'adjustment';
  public transactionCode!: string;
  public description!: string;
  public amount!: string;
  public currency!: string;
  public baseAmount?: string;
  public exchangeRate?: string;
  public direction!: 'debit' | 'credit';
  public category?: string;
  public subCategory?: string;
  public glAccountCode?: string;
  public isReversed!: boolean;
  public reversalOfId?: number;
  public batchId?: string;
  public referenceNumber?: string;
  public notes?: string;
  public metadata?: Record<string, any>;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Association properties
  public readonly fund?: any;
  public readonly commitment?: any;
  public readonly capitalActivity?: any;
  public readonly originalTransaction?: any;

  // Associations
  static associate(models: any) {
    Transaction.belongsTo(models.Fund, {
      foreignKey: 'fundId',
      as: 'fund',
    });
    Transaction.belongsTo(models.Commitment, {
      foreignKey: 'commitmentId',
      as: 'commitment',
    });
    Transaction.belongsTo(models.CapitalActivity, {
      foreignKey: 'capitalActivityId',
      as: 'capitalActivity',
    });
    Transaction.belongsTo(models.Transaction, {
      foreignKey: 'reversalOfId',
      as: 'originalTransaction',
    });
  }
}

Transaction.init(
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
    commitmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'commitments',
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
    transactionDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    effectiveDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    transactionType: {
      type: DataTypes.ENUM('capital_call', 'distribution', 'fee', 'expense', 'equalization', 'transfer', 'adjustment'),
      allowNull: false,
    },
    transactionCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false,
      get() {
        const value = this.getDataValue('amount');
        return value ? value.toString() : '0';
      },
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'USD',
    },
    baseAmount: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: true,
      get() {
        const value = this.getDataValue('baseAmount');
        return value ? value.toString() : null;
      },
    },
    exchangeRate: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: true,
      get() {
        const value = this.getDataValue('exchangeRate');
        return value ? value.toString() : null;
      },
    },
    direction: {
      type: DataTypes.ENUM('debit', 'credit'),
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    subCategory: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    glAccountCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isReversed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    reversalOfId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'transactions',
        key: 'id',
      },
    },
    batchId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    referenceNumber: {
      type: DataTypes.STRING,
      allowNull: true,
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
    modelName: 'Transaction',
    tableName: 'transactions',
    indexes: [
      {
        fields: ['fund_id'],
      },
      {
        fields: ['commitment_id'],
      },
      {
        fields: ['capital_activity_id'],
      },
      {
        fields: ['transaction_date'],
      },
      {
        fields: ['transaction_type'],
      },
      {
        fields: ['batch_id'],
      },
    ],
  }
);

export default Transaction;