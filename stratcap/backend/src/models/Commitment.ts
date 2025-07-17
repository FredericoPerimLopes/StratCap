import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db/database';

interface CommitmentAttributes {
  id: number;
  fundId: number;
  investorEntityId: number;
  investorClassId: number;
  commitmentAmount: string;
  commitmentDate: Date;
  closingId?: number;
  status: 'pending' | 'active' | 'suspended' | 'terminated';
  sideLetterTerms?: Record<string, any>;
  feeOverrides?: Record<string, any>;
  capitalCalled: string;
  capitalReturned: string;
  unfundedCommitment: string;
  preferredReturn: string;
  carriedInterest: string;
  lastUpdated?: Date;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CommitmentCreationAttributes extends Optional<CommitmentAttributes, 'id' | 'status' | 'capitalCalled' | 'capitalReturned' | 'unfundedCommitment' | 'preferredReturn' | 'carriedInterest' | 'createdAt' | 'updatedAt'> {}

class Commitment extends Model<CommitmentAttributes, CommitmentCreationAttributes> implements CommitmentAttributes {
  public id!: number;
  public fundId!: number;
  public investorEntityId!: number;
  public investorClassId!: number;
  public commitmentAmount!: string;
  public commitmentDate!: Date;
  public closingId?: number;
  public status!: 'pending' | 'active' | 'suspended' | 'terminated';
  public sideLetterTerms?: Record<string, any>;
  public feeOverrides?: Record<string, any>;
  public capitalCalled!: string;
  public capitalReturned!: string;
  public unfundedCommitment!: string;
  public preferredReturn!: string;
  public carriedInterest!: string;
  public lastUpdated?: Date;
  public notes?: string;
  public metadata?: Record<string, any>;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Association properties
  public readonly fund?: any;
  public readonly investorEntity?: any;
  public readonly investorClass?: any;
  public readonly closing?: any;
  public readonly transactions?: any[];

  // Associations
  static associate(models: any) {
    Commitment.belongsTo(models.Fund, {
      foreignKey: 'fundId',
      as: 'fund',
    });
    Commitment.belongsTo(models.InvestorEntity, {
      foreignKey: 'investorEntityId',
      as: 'investorEntity',
    });
    Commitment.belongsTo(models.InvestorClass, {
      foreignKey: 'investorClassId',
      as: 'investorClass',
    });
    Commitment.belongsTo(models.Closing, {
      foreignKey: 'closingId',
      as: 'closing',
    });
    Commitment.hasMany(models.Transaction, {
      foreignKey: 'commitmentId',
      as: 'transactions',
    });
  }
}

Commitment.init(
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
    commitmentAmount: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false,
      get() {
        const value = this.getDataValue('commitmentAmount');
        return value ? value.toString() : '0';
      },
    },
    commitmentDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    closingId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'closings',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('pending', 'active', 'suspended', 'terminated'),
      defaultValue: 'active',
    },
    sideLetterTerms: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    feeOverrides: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    capitalCalled: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0,
      get() {
        const value = this.getDataValue('capitalCalled');
        return value ? value.toString() : '0';
      },
    },
    capitalReturned: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0,
      get() {
        const value = this.getDataValue('capitalReturned');
        return value ? value.toString() : '0';
      },
    },
    unfundedCommitment: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0,
      get() {
        const value = this.getDataValue('unfundedCommitment');
        return value ? value.toString() : '0';
      },
    },
    preferredReturn: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0,
      get() {
        const value = this.getDataValue('preferredReturn');
        return value ? value.toString() : '0';
      },
    },
    carriedInterest: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0,
      get() {
        const value = this.getDataValue('carriedInterest');
        return value ? value.toString() : '0';
      },
    },
    lastUpdated: {
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
    modelName: 'Commitment',
    tableName: 'commitments',
    indexes: [
      {
        fields: ['fund_id'],
      },
      {
        fields: ['investor_entity_id'],
      },
      {
        fields: ['investor_class_id'],
      },
      {
        fields: ['status'],
      },
    ],
  }
);

export default Commitment;
export { Commitment };