import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db/database';

interface CapitalAllocationAttributes {
  id: number;
  capitalActivityId: number;
  commitmentId: number;
  fundId: number;
  investorEntityId: number;
  investorClassId: number;
  allocationAmount: string;
  percentageOfCommitment: string;
  percentageOfTotal: string;
  allocationDate: Date;
  dueDate?: Date;
  status: 'pending' | 'notified' | 'paid' | 'defaulted' | 'waived';
  paidAmount?: string;
  paidDate?: Date;
  fees?: Record<string, any>;
  expenses?: Record<string, any>;
  calculations?: Record<string, any>;
  notificationsSent?: Record<string, any>;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CapitalAllocationCreationAttributes extends Optional<CapitalAllocationAttributes, 'id' | 'status' | 'createdAt' | 'updatedAt'> {}

class CapitalAllocation extends Model<CapitalAllocationAttributes, CapitalAllocationCreationAttributes> implements CapitalAllocationAttributes {
  public id!: number;
  public capitalActivityId!: number;
  public commitmentId!: number;
  public fundId!: number;
  public investorEntityId!: number;
  public investorClassId!: number;
  public allocationAmount!: string;
  public percentageOfCommitment!: string;
  public percentageOfTotal!: string;
  public allocationDate!: Date;
  public dueDate?: Date;
  public status!: 'pending' | 'notified' | 'paid' | 'defaulted' | 'waived';
  public paidAmount?: string;
  public paidDate?: Date;
  public fees?: Record<string, any>;
  public expenses?: Record<string, any>;
  public calculations?: Record<string, any>;
  public notificationsSent?: Record<string, any>;
  public notes?: string;
  public metadata?: Record<string, any>;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  static associate(models: any) {
    CapitalAllocation.belongsTo(models.CapitalActivity, {
      foreignKey: 'capitalActivityId',
      as: 'capitalActivity',
    });
    CapitalAllocation.belongsTo(models.Commitment, {
      foreignKey: 'commitmentId',
      as: 'commitment',
    });
    CapitalAllocation.belongsTo(models.Fund, {
      foreignKey: 'fundId',
      as: 'fund',
    });
    CapitalAllocation.belongsTo(models.InvestorEntity, {
      foreignKey: 'investorEntityId',
      as: 'investorEntity',
    });
    CapitalAllocation.belongsTo(models.InvestorClass, {
      foreignKey: 'investorClassId',
      as: 'investorClass',
    });
  }
}

CapitalAllocation.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    capitalActivityId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'capital_activities',
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
    fundId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'funds',
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
    investorClassId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'investor_classes',
        key: 'id',
      },
    },
    allocationAmount: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false,
      get() {
        const value = this.getDataValue('allocationAmount');
        return value ? value.toString() : '0';
      },
    },
    percentageOfCommitment: {
      type: DataTypes.DECIMAL(8, 6),
      allowNull: false,
      get() {
        const value = this.getDataValue('percentageOfCommitment');
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
    allocationDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'notified', 'paid', 'defaulted', 'waived'),
      defaultValue: 'pending',
    },
    paidAmount: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: true,
      get() {
        const value = this.getDataValue('paidAmount');
        return value ? value.toString() : null;
      },
    },
    paidDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    fees: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    expenses: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    calculations: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    notificationsSent: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
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
    modelName: 'CapitalAllocation',
    tableName: 'capital_allocations',
    indexes: [
      {
        fields: ['capital_activity_id'],
      },
      {
        fields: ['commitment_id'],
      },
      {
        fields: ['fund_id'],
      },
      {
        fields: ['investor_entity_id'],
      },
      {
        fields: ['status'],
      },
      {
        unique: true,
        fields: ['capital_activity_id', 'commitment_id'],
      },
    ],
  }
);

export default CapitalAllocation;