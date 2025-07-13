import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../db/database';

export interface GLAccountAttributes {
  id: string;
  accountNumber: string;
  accountName: string;
  accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  category: 'current_assets' | 'non_current_assets' | 'current_liabilities' | 'non_current_liabilities' | 'equity' | 'operating_revenue' | 'non_operating_revenue' | 'operating_expenses' | 'non_operating_expenses';
  subCategory?: string;
  parentAccountId?: string;
  isActive: boolean;
  requiresSubAccount: boolean;
  allowsDirectPosting: boolean;
  normalBalance: 'debit' | 'credit';
  description?: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

interface GLAccountCreationAttributes extends Optional<GLAccountAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class GLAccount extends Model<GLAccountAttributes, GLAccountCreationAttributes> implements GLAccountAttributes {
  public id!: string;
  public accountNumber!: string;
  public accountName!: string;
  public accountType!: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  public category!: 'current_assets' | 'non_current_assets' | 'current_liabilities' | 'non_current_liabilities' | 'equity' | 'operating_revenue' | 'non_operating_revenue' | 'operating_expenses' | 'non_operating_expenses';
  public subCategory?: string;
  public parentAccountId?: string;
  public isActive!: boolean;
  public requiresSubAccount!: boolean;
  public allowsDirectPosting!: boolean;
  public normalBalance!: 'debit' | 'credit';
  public description?: string;
  public metadata?: Record<string, any>;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public children?: GLAccount[];
  public parent?: GLAccount;

  /**
   * Get the full account path (including parent accounts)
   */
  public getAccountPath(): string {
    if (this.parent) {
      return `${this.parent.getAccountPath()} > ${this.accountName}`;
    }
    return this.accountName;
  }

  /**
   * Check if account can accept direct journal entries
   */
  public canPostDirectly(): boolean {
    return this.isActive && this.allowsDirectPosting && !this.requiresSubAccount;
  }

  /**
   * Get account balance type based on normal balance and account type
   */
  public getBalanceType(amount: number): 'debit' | 'credit' {
    if (amount >= 0) {
      return this.normalBalance;
    }
    return this.normalBalance === 'debit' ? 'credit' : 'debit';
  }
}

GLAccount.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    accountNumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
      },
    },
    accountName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    accountType: {
      type: DataTypes.ENUM('asset', 'liability', 'equity', 'revenue', 'expense'),
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM(
        'current_assets',
        'non_current_assets',
        'current_liabilities',
        'non_current_liabilities',
        'equity',
        'operating_revenue',
        'non_operating_revenue',
        'operating_expenses',
        'non_operating_expenses'
      ),
      allowNull: false,
    },
    subCategory: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    parentAccountId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'GLAccounts',
        key: 'id',
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    requiresSubAccount: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    allowsDirectPosting: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    normalBalance: {
      type: DataTypes.ENUM('debit', 'credit'),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'GLAccounts',
    timestamps: true,
    indexes: [
      {
        fields: ['accountNumber'],
        unique: true,
      },
      {
        fields: ['accountType'],
      },
      {
        fields: ['category'],
      },
      {
        fields: ['parentAccountId'],
      },
      {
        fields: ['isActive'],
      },
    ],
  }
);

// Self-referencing association for parent-child relationships
GLAccount.belongsTo(GLAccount, { as: 'parent', foreignKey: 'parentAccountId' });
GLAccount.hasMany(GLAccount, { as: 'children', foreignKey: 'parentAccountId' });

export default GLAccount;