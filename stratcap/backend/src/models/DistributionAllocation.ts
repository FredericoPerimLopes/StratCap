import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db/database';

interface DistributionAllocationAttributes {
  id: number;
  capitalActivityId: number;
  commitmentId: number;
  fundId: number;
  investorEntityId: number;
  investorClassId: number;
  totalDistribution: string;
  returnOfCapital: string;
  gain: string;
  carriedInterest: string;
  managementFees: string;
  otherFees: string;
  expenses: string;
  taxWithholding?: string;
  netDistribution: string;
  percentageOfTotal: string;
  distributionDate: Date;
  paymentDate?: Date;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  waterfallTier?: number;
  waterfallCalculations?: Record<string, any>;
  taxAllocations?: Record<string, any>;
  notificationsSent?: Record<string, any>;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

interface DistributionAllocationCreationAttributes extends Optional<DistributionAllocationAttributes, 'id' | 'status' | 'createdAt' | 'updatedAt'> {}

class DistributionAllocation extends Model<DistributionAllocationAttributes, DistributionAllocationCreationAttributes> implements DistributionAllocationAttributes {
  public id!: number;
  public capitalActivityId!: number;
  public commitmentId!: number;
  public fundId!: number;
  public investorEntityId!: number;
  public investorClassId!: number;
  public totalDistribution!: string;
  public returnOfCapital!: string;
  public gain!: string;
  public carriedInterest!: string;
  public managementFees!: string;
  public otherFees!: string;
  public expenses!: string;
  public taxWithholding?: string;
  public netDistribution!: string;
  public percentageOfTotal!: string;
  public distributionDate!: Date;
  public paymentDate?: Date;
  public status!: 'pending' | 'approved' | 'paid' | 'cancelled';
  public waterfallTier?: number;
  public waterfallCalculations?: Record<string, any>;
  public taxAllocations?: Record<string, any>;
  public notificationsSent?: Record<string, any>;
  public notes?: string;
  public metadata?: Record<string, any>;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  static associate(models: any) {
    DistributionAllocation.belongsTo(models.CapitalActivity, {
      foreignKey: 'capitalActivityId',
      as: 'capitalActivity',
    });
    DistributionAllocation.belongsTo(models.Commitment, {
      foreignKey: 'commitmentId',
      as: 'commitment',
    });
    DistributionAllocation.belongsTo(models.Fund, {
      foreignKey: 'fundId',
      as: 'fund',
    });
    DistributionAllocation.belongsTo(models.InvestorEntity, {
      foreignKey: 'investorEntityId',
      as: 'investorEntity',
    });
    DistributionAllocation.belongsTo(models.InvestorClass, {
      foreignKey: 'investorClassId',
      as: 'investorClass',
    });
  }
}

DistributionAllocation.init(
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
    totalDistribution: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false,
      get() {
        const value = this.getDataValue('totalDistribution');
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
    gain: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false,
      get() {
        const value = this.getDataValue('gain');
        return value ? value.toString() : '0';
      },
    },
    carriedInterest: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false,
      get() {
        const value = this.getDataValue('carriedInterest');
        return value ? value.toString() : '0';
      },
    },
    managementFees: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false,
      get() {
        const value = this.getDataValue('managementFees');
        return value ? value.toString() : '0';
      },
    },
    otherFees: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false,
      get() {
        const value = this.getDataValue('otherFees');
        return value ? value.toString() : '0';
      },
    },
    expenses: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false,
      get() {
        const value = this.getDataValue('expenses');
        return value ? value.toString() : '0';
      },
    },
    taxWithholding: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: true,
      get() {
        const value = this.getDataValue('taxWithholding');
        return value ? value.toString() : null;
      },
    },
    netDistribution: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false,
      get() {
        const value = this.getDataValue('netDistribution');
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
    distributionDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    paymentDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'paid', 'cancelled'),
      defaultValue: 'pending',
    },
    waterfallTier: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    waterfallCalculations: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    taxAllocations: {
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
    modelName: 'DistributionAllocation',
    tableName: 'distribution_allocations',
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

export default DistributionAllocation;