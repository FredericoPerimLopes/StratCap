import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db/database';
import { Decimal } from 'decimal.js';

interface FundAttributes {
  id: number;
  fundFamilyId: number;
  name: string;
  code: string;
  type: 'master' | 'feeder' | 'parallel' | 'subsidiary';
  vintage: number;
  targetSize: string; // Using string for Decimal
  hardCap?: string;
  managementFeeRate: string;
  carriedInterestRate: string;
  preferredReturnRate: string;
  investmentPeriodEnd?: Date;
  termEnd?: Date;
  extensionPeriods?: number;
  extensionLength?: number; // in months
  currency: string;
  status: 'fundraising' | 'investing' | 'harvesting' | 'closed';
  settings?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

interface FundCreationAttributes extends Optional<FundAttributes, 'id' | 'status' | 'createdAt' | 'updatedAt'> {}

class Fund extends Model<FundAttributes, FundCreationAttributes> implements FundAttributes {
  public id!: number;
  public fundFamilyId!: number;
  public name!: string;
  public code!: string;
  public type!: 'master' | 'feeder' | 'parallel' | 'subsidiary';
  public vintage!: number;
  public targetSize!: string;
  public hardCap?: string;
  public managementFeeRate!: string;
  public carriedInterestRate!: string;
  public preferredReturnRate!: string;
  public investmentPeriodEnd?: Date;
  public termEnd?: Date;
  public extensionPeriods?: number;
  public extensionLength?: number;
  public currency!: string;
  public status!: 'fundraising' | 'investing' | 'harvesting' | 'closed';
  public settings?: Record<string, any>;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Association properties
  public readonly fundFamily?: any;
  public readonly commitments?: any[];
  public readonly investments?: any[];
  public readonly capitalActivities?: any[];

  // Virtual getters for Decimal values
  get targetSizeDecimal(): Decimal {
    return new Decimal(this.targetSize);
  }

  get hardCapDecimal(): Decimal | null {
    return this.hardCap ? new Decimal(this.hardCap) : null;
  }

  // Associations
  static associate(models: any) {
    Fund.belongsTo(models.FundFamily, {
      foreignKey: 'fundFamilyId',
      as: 'fundFamily',
    });
    Fund.hasMany(models.Commitment, {
      foreignKey: 'fundId',
      as: 'commitments',
    });
    Fund.hasMany(models.Investment, {
      foreignKey: 'fundId',
      as: 'investments',
    });
    Fund.hasMany(models.CapitalActivity, {
      foreignKey: 'fundId',
      as: 'capitalActivities',
    });
    Fund.hasMany(models.InvestorClass, {
      foreignKey: 'fundId',
      as: 'investorClasses',
    });
  }
}

Fund.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    fundFamilyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'fund_families',
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
    type: {
      type: DataTypes.ENUM('master', 'feeder', 'parallel', 'subsidiary'),
      allowNull: false,
    },
    vintage: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    targetSize: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false,
      get() {
        const value = this.getDataValue('targetSize');
        return value ? value.toString() : '0';
      },
    },
    hardCap: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: true,
      get() {
        const value = this.getDataValue('hardCap');
        return value ? value.toString() : null;
      },
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
    investmentPeriodEnd: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    termEnd: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    extensionPeriods: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    extensionLength: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 12, // months
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'USD',
    },
    status: {
      type: DataTypes.ENUM('fundraising', 'investing', 'harvesting', 'closed'),
      defaultValue: 'fundraising',
    },
    settings: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
  },
  {
    sequelize,
    modelName: 'Fund',
    tableName: 'funds',
    indexes: [
      {
        unique: true,
        fields: ['fund_family_id', 'code'],
      },
    ],
  }
);

export default Fund;
export { Fund };