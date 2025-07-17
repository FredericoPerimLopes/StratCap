import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db/database';

interface InvestorClassAttributes {
  id: number;
  fundId: number;
  name: string;
  code: string;
  description?: string;
  managementFeeRate: string;
  carriedInterestRate: string;
  preferredReturnRate: string;
  catchUpRate?: string;
  feeSchedule?: Record<string, any>;
  waterfallStructure?: Record<string, any>;
  minCommitment?: string;
  maxCommitment?: string;
  isDefault: boolean;
  priority: number;
  settings?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

interface InvestorClassCreationAttributes extends Optional<InvestorClassAttributes, 'id' | 'isDefault' | 'priority' | 'createdAt' | 'updatedAt'> {}

class InvestorClass extends Model<InvestorClassAttributes, InvestorClassCreationAttributes> implements InvestorClassAttributes {
  public id!: number;
  public fundId!: number;
  public name!: string;
  public code!: string;
  public description?: string;
  public managementFeeRate!: string;
  public carriedInterestRate!: string;
  public preferredReturnRate!: string;
  public catchUpRate?: string;
  public feeSchedule?: Record<string, any>;
  public waterfallStructure?: Record<string, any>;
  public minCommitment?: string;
  public maxCommitment?: string;
  public isDefault!: boolean;
  public priority!: number;
  public settings?: Record<string, any>;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  static associate(models: any) {
    InvestorClass.belongsTo(models.Fund, {
      foreignKey: 'fundId',
      as: 'fund',
    });
    InvestorClass.hasMany(models.Commitment, {
      foreignKey: 'investorClassId',
      as: 'commitments',
    });
  }
}

InvestorClass.init(
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
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    managementFeeRate: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
      get() {
        const value = this.getDataValue('managementFeeRate');
        return value ? value.toString() : '0';
      },
    },
    carriedInterestRate: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
      get() {
        const value = this.getDataValue('carriedInterestRate');
        return value ? value.toString() : '0';
      },
    },
    preferredReturnRate: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
      get() {
        const value = this.getDataValue('preferredReturnRate');
        return value ? value.toString() : '0';
      },
    },
    catchUpRate: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: true,
      get() {
        const value = this.getDataValue('catchUpRate');
        return value ? value.toString() : null;
      },
    },
    feeSchedule: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    waterfallStructure: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    minCommitment: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: true,
      get() {
        const value = this.getDataValue('minCommitment');
        return value ? value.toString() : null;
      },
    },
    maxCommitment: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: true,
      get() {
        const value = this.getDataValue('maxCommitment');
        return value ? value.toString() : null;
      },
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    priority: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    settings: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
  },
  {
    sequelize,
    modelName: 'InvestorClass',
    tableName: 'investor_classes',
    indexes: [
      {
        unique: true,
        fields: ['fund_id', 'code'],
      },
    ],
  }
);

export default InvestorClass;
export { InvestorClass };