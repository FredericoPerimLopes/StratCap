import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db/database';

interface ClosingAttributes {
  id: number;
  fundId: number;
  closingNumber: number;
  closingDate: Date;
  closingType: 'initial' | 'subsequent' | 'final';
  status: 'draft' | 'pending' | 'completed' | 'cancelled';
  totalCommitments: string;
  newCommitments: string;
  equalizationInterestRate?: string;
  equalizationStartDate?: Date;
  equalizationEndDate?: Date;
  capitalEqualization?: Record<string, any>;
  nonCapitalEqualization?: Record<string, any>;
  feeTrueUp?: Record<string, any>;
  documents?: Record<string, any>;
  approvedBy?: number;
  approvedAt?: Date;
  completedAt?: Date;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ClosingCreationAttributes extends Optional<ClosingAttributes, 'id' | 'status' | 'totalCommitments' | 'newCommitments' | 'createdAt' | 'updatedAt'> {}

class Closing extends Model<ClosingAttributes, ClosingCreationAttributes> implements ClosingAttributes {
  public id!: number;
  public fundId!: number;
  public closingNumber!: number;
  public closingDate!: Date;
  public closingType!: 'initial' | 'subsequent' | 'final';
  public status!: 'draft' | 'pending' | 'completed' | 'cancelled';
  public totalCommitments!: string;
  public newCommitments!: string;
  public equalizationInterestRate?: string;
  public equalizationStartDate?: Date;
  public equalizationEndDate?: Date;
  public capitalEqualization?: Record<string, any>;
  public nonCapitalEqualization?: Record<string, any>;
  public feeTrueUp?: Record<string, any>;
  public documents?: Record<string, any>;
  public approvedBy?: number;
  public approvedAt?: Date;
  public completedAt?: Date;
  public notes?: string;
  public metadata?: Record<string, any>;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  static associate(models: any) {
    Closing.belongsTo(models.Fund, {
      foreignKey: 'fundId',
      as: 'fund',
    });
    Closing.belongsTo(models.User, {
      foreignKey: 'approvedBy',
      as: 'approver',
    });
    Closing.hasMany(models.Commitment, {
      foreignKey: 'closingId',
      as: 'commitments',
    });
  }
}

Closing.init(
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
    closingNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    closingDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    closingType: {
      type: DataTypes.ENUM('initial', 'subsequent', 'final'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('draft', 'pending', 'completed', 'cancelled'),
      defaultValue: 'draft',
    },
    totalCommitments: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0,
      get() {
        const value = this.getDataValue('totalCommitments');
        return value ? value.toString() : '0';
      },
    },
    newCommitments: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0,
      get() {
        const value = this.getDataValue('newCommitments');
        return value ? value.toString() : '0';
      },
    },
    equalizationInterestRate: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: true,
      get() {
        const value = this.getDataValue('equalizationInterestRate');
        return value ? value.toString() : null;
      },
    },
    equalizationStartDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    equalizationEndDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    capitalEqualization: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    nonCapitalEqualization: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    feeTrueUp: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    documents: {
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
    modelName: 'Closing',
    tableName: 'closings',
    indexes: [
      {
        fields: ['fund_id'],
      },
      {
        unique: true,
        fields: ['fund_id', 'closing_number'],
      },
      {
        fields: ['status'],
      },
    ],
  }
);

export default Closing;
export { Closing };