import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db/database';

interface FundFamilyAttributes {
  id: number;
  name: string;
  code: string;
  description?: string;
  managementCompany: string;
  primaryCurrency: string;
  fiscalYearEnd: string; // MM-DD format
  status: 'active' | 'inactive' | 'archived';
  settings?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

interface FundFamilyCreationAttributes extends Optional<FundFamilyAttributes, 'id' | 'status' | 'createdAt' | 'updatedAt'> {}

class FundFamily extends Model<FundFamilyAttributes, FundFamilyCreationAttributes> implements FundFamilyAttributes {
  public id!: number;
  public name!: string;
  public code!: string;
  public description?: string;
  public managementCompany!: string;
  public primaryCurrency!: string;
  public fiscalYearEnd!: string;
  public status!: 'active' | 'inactive' | 'archived';
  public settings?: Record<string, any>;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  static associate(models: any) {
    FundFamily.hasMany(models.Fund, {
      foreignKey: 'fundFamilyId',
      as: 'funds',
    });
    FundFamily.belongsToMany(models.User, {
      through: 'UserFundFamilies',
      as: 'users',
    });
  }
}

FundFamily.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    managementCompany: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    primaryCurrency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'USD',
    },
    fiscalYearEnd: {
      type: DataTypes.STRING(5), // MM-DD format
      allowNull: false,
      defaultValue: '12-31',
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'archived'),
      defaultValue: 'active',
    },
    settings: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
  },
  {
    sequelize,
    modelName: 'FundFamily',
    tableName: 'fund_families',
  }
);

export default FundFamily;