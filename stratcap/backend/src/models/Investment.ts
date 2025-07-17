import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db/database';

interface InvestmentAttributes {
  id: number;
  fundId: number;
  name: string;
  code: string;
  investmentType: 'equity' | 'debt' | 'hybrid' | 'other';
  sector?: string;
  subSector?: string;
  geography?: string;
  investmentDate: Date;
  initialCost: string;
  currentValue: string;
  realizedValue: string;
  unrealizedValue: string;
  totalValue: string;
  multiple: string;
  irr?: string;
  status: 'active' | 'partially_exited' | 'fully_exited' | 'written_off';
  exitDate?: Date;
  holdingPeriod?: number; // in months
  description?: string;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

interface InvestmentCreationAttributes extends Optional<InvestmentAttributes, 'id' | 'currentValue' | 'realizedValue' | 'unrealizedValue' | 'totalValue' | 'multiple' | 'status' | 'createdAt' | 'updatedAt'> {}

class Investment extends Model<InvestmentAttributes, InvestmentCreationAttributes> implements InvestmentAttributes {
  public id!: number;
  public fundId!: number;
  public name!: string;
  public code!: string;
  public investmentType!: 'equity' | 'debt' | 'hybrid' | 'other';
  public sector?: string;
  public subSector?: string;
  public geography?: string;
  public investmentDate!: Date;
  public initialCost!: string;
  public currentValue!: string;
  public realizedValue!: string;
  public unrealizedValue!: string;
  public totalValue!: string;
  public multiple!: string;
  public irr?: string;
  public status!: 'active' | 'partially_exited' | 'fully_exited' | 'written_off';
  public exitDate?: Date;
  public holdingPeriod?: number;
  public description?: string;
  public notes?: string;
  public metadata?: Record<string, any>;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  static associate(models: any) {
    Investment.belongsTo(models.Fund, {
      foreignKey: 'fundId',
      as: 'fund',
    });
  }
}

Investment.init(
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
    investmentType: {
      type: DataTypes.ENUM('equity', 'debt', 'hybrid', 'other'),
      allowNull: false,
    },
    sector: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    subSector: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    geography: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    investmentDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    initialCost: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false,
      get() {
        const value = this.getDataValue('initialCost');
        return value ? value.toString() : '0';
      },
    },
    currentValue: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0,
      get() {
        const value = this.getDataValue('currentValue');
        return value ? value.toString() : '0';
      },
    },
    realizedValue: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0,
      get() {
        const value = this.getDataValue('realizedValue');
        return value ? value.toString() : '0';
      },
    },
    unrealizedValue: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0,
      get() {
        const value = this.getDataValue('unrealizedValue');
        return value ? value.toString() : '0';
      },
    },
    totalValue: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0,
      get() {
        const value = this.getDataValue('totalValue');
        return value ? value.toString() : '0';
      },
    },
    multiple: {
      type: DataTypes.DECIMAL(10, 4),
      defaultValue: 0,
      get() {
        const value = this.getDataValue('multiple');
        return value ? value.toString() : '0';
      },
    },
    irr: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true,
      get() {
        const value = this.getDataValue('irr');
        return value ? value.toString() : null;
      },
    },
    status: {
      type: DataTypes.ENUM('active', 'partially_exited', 'fully_exited', 'written_off'),
      defaultValue: 'active',
    },
    exitDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    holdingPeriod: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
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
    modelName: 'Investment',
    tableName: 'investments',
    indexes: [
      {
        fields: ['fund_id'],
      },
      {
        unique: true,
        fields: ['fund_id', 'code'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['sector'],
      },
    ],
  }
);

export default Investment;
export { Investment };