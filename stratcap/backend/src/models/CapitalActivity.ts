import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db/database';

interface CapitalActivityAttributes {
  id: number;
  fundId: number;
  eventType: 'capital_call' | 'distribution' | 'equalization' | 'reallocation';
  eventNumber: string;
  eventDate: Date;
  dueDate?: Date;
  description: string;
  status: 'draft' | 'pending' | 'approved' | 'completed' | 'cancelled';
  totalAmount: string;
  baseAmount?: string;
  feeAmount?: string;
  expenseAmount?: string;
  currency: string;
  purpose?: string;
  notices?: Record<string, any>;
  calculations?: Record<string, any>;
  approvedBy?: number;
  approvedAt?: Date;
  completedAt?: Date;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CapitalActivityCreationAttributes extends Optional<CapitalActivityAttributes, 'id' | 'status' | 'currency' | 'createdAt' | 'updatedAt'> {}

class CapitalActivity extends Model<CapitalActivityAttributes, CapitalActivityCreationAttributes> implements CapitalActivityAttributes {
  public id!: number;
  public fundId!: number;
  public eventType!: 'capital_call' | 'distribution' | 'equalization' | 'reallocation';
  public eventNumber!: string;
  public eventDate!: Date;
  public dueDate?: Date;
  public description!: string;
  public status!: 'draft' | 'pending' | 'approved' | 'completed' | 'cancelled';
  public totalAmount!: string;
  public baseAmount?: string;
  public feeAmount?: string;
  public expenseAmount?: string;
  public currency!: string;
  public purpose?: string;
  public notices?: Record<string, any>;
  public calculations?: Record<string, any>;
  public approvedBy?: number;
  public approvedAt?: Date;
  public completedAt?: Date;
  public notes?: string;
  public metadata?: Record<string, any>;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Association properties
  public readonly fund?: any;
  public readonly approver?: any;
  public readonly transactions?: any[];
  public readonly capitalAllocations?: any[];
  public readonly distributionAllocations?: any[];

  // Associations
  static associate(models: any) {
    CapitalActivity.belongsTo(models.Fund, {
      foreignKey: 'fundId',
      as: 'fund',
    });
    CapitalActivity.belongsTo(models.User, {
      foreignKey: 'approvedBy',
      as: 'approver',
    });
    CapitalActivity.hasMany(models.Transaction, {
      foreignKey: 'capitalActivityId',
      as: 'transactions',
    });
    CapitalActivity.hasMany(models.CapitalAllocation, {
      foreignKey: 'capitalActivityId',
      as: 'capitalAllocations',
    });
    CapitalActivity.hasMany(models.DistributionAllocation, {
      foreignKey: 'capitalActivityId',
      as: 'distributionAllocations',
    });
  }
}

CapitalActivity.init(
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
    eventType: {
      type: DataTypes.ENUM('capital_call', 'distribution', 'equalization', 'reallocation'),
      allowNull: false,
    },
    eventNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    eventDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('draft', 'pending', 'approved', 'completed', 'cancelled'),
      defaultValue: 'draft',
    },
    totalAmount: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false,
      get() {
        const value = this.getDataValue('totalAmount');
        return value ? value.toString() : '0';
      },
    },
    baseAmount: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: true,
      get() {
        const value = this.getDataValue('baseAmount');
        return value ? value.toString() : null;
      },
    },
    feeAmount: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: true,
      get() {
        const value = this.getDataValue('feeAmount');
        return value ? value.toString() : null;
      },
    },
    expenseAmount: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: true,
      get() {
        const value = this.getDataValue('expenseAmount');
        return value ? value.toString() : null;
      },
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'USD',
    },
    purpose: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    notices: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    calculations: {
      type: DataTypes.JSONB,
      allowNull: true,
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
    completedAt: {
      type: DataTypes.DATE,
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
    modelName: 'CapitalActivity',
    tableName: 'capital_activities',
    indexes: [
      {
        fields: ['fund_id'],
      },
      {
        fields: ['event_type'],
      },
      {
        fields: ['status'],
      },
      {
        unique: true,
        fields: ['fund_id', 'event_number'],
      },
    ],
  }
);

export default CapitalActivity;