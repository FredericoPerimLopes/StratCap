import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../db/database';
import { GLAccount } from './GLAccount';

export interface GLAccountMappingAttributes {
  id: number;
  sourceSystem: string;
  sourceType: 'capital_activity' | 'fee' | 'expense' | 'investment' | 'distribution' | 'commitment' | 'credit_facility' | 'custom';
  sourceSubType?: string;
  glAccountId: number;
  debitAccountId?: number;
  creditAccountId?: number;
  fundId?: number;
  priority: number;
  isActive: boolean;
  conditions?: Record<string, any>;
  description?: string;
  createdBy: number;
  lastModifiedBy?: number;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

interface GLAccountMappingCreationAttributes extends Optional<GLAccountMappingAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class GLAccountMapping extends Model<GLAccountMappingAttributes, GLAccountMappingCreationAttributes> implements GLAccountMappingAttributes {
  public id!: number;
  public sourceSystem!: string;
  public sourceType!: 'capital_activity' | 'fee' | 'expense' | 'investment' | 'distribution' | 'commitment' | 'credit_facility' | 'custom';
  public sourceSubType?: string;
  public glAccountId!: number;
  public debitAccountId?: number;
  public creditAccountId?: number;
  public fundId?: number;
  public priority!: number;
  public isActive!: boolean;
  public conditions?: Record<string, any>;
  public description?: string;
  public createdBy!: number;
  public lastModifiedBy?: number;
  public metadata?: Record<string, any>;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public glAccount?: GLAccount;
  public debitAccount?: GLAccount;
  public creditAccount?: GLAccount;
  public fund?: any;

  /**
   * Check if mapping conditions are met
   */
  public matchesConditions(data: Record<string, any>): boolean {
    if (!this.conditions) {
      return true;
    }

    for (const [key, expectedValue] of Object.entries(this.conditions)) {
      const actualValue = data[key];
      
      if (typeof expectedValue === 'object' && expectedValue !== null) {
        // Handle complex conditions like ranges, arrays, etc.
        if (expectedValue.operator) {
          switch (expectedValue.operator) {
            case 'equals':
              if (actualValue !== expectedValue.value) return false;
              break;
            case 'not_equals':
              if (actualValue === expectedValue.value) return false;
              break;
            case 'greater_than':
              if (actualValue <= expectedValue.value) return false;
              break;
            case 'less_than':
              if (actualValue >= expectedValue.value) return false;
              break;
            case 'in':
              if (!expectedValue.values.includes(actualValue)) return false;
              break;
            case 'not_in':
              if (expectedValue.values.includes(actualValue)) return false;
              break;
            case 'contains':
              if (!actualValue?.includes(expectedValue.value)) return false;
              break;
            default:
              return false;
          }
        } else if (Array.isArray(expectedValue)) {
          if (!expectedValue.includes(actualValue)) return false;
        }
      } else {
        // Simple equality check
        if (actualValue !== expectedValue) return false;
      }
    }

    return true;
  }

  /**
   * Get the appropriate GL account based on transaction type
   */
  public getGLAccountId(transactionSide: 'debit' | 'credit'): number {
    if (transactionSide === 'debit' && this.debitAccountId) {
      return this.debitAccountId;
    }
    if (transactionSide === 'credit' && this.creditAccountId) {
      return this.creditAccountId;
    }
    return this.glAccountId;
  }
}

GLAccountMapping.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    sourceSystem: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    sourceType: {
      type: DataTypes.ENUM(
        'capital_activity',
        'fee',
        'expense',
        'investment',
        'distribution',
        'commitment',
        'credit_facility',
        'custom'
      ),
      allowNull: false,
    },
    sourceSubType: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    glAccountId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'GLAccounts',
        key: 'id',
      },
    },
    debitAccountId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'GLAccounts',
        key: 'id',
      },
    },
    creditAccountId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'GLAccounts',
        key: 'id',
      },
    },
    fundId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Funds',
        key: 'id',
      },
    },
    priority: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100,
      validate: {
        min: 1,
        max: 999,
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    conditions: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    lastModifiedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'GLAccountMappings',
    timestamps: true,
    indexes: [
      {
        fields: ['source_system', 'source_type'],
      },
      {
        fields: ['source_type', 'source_sub_type'],
      },
      {
        fields: ['gl_account_id'],
      },
      {
        fields: ['fund_id'],
      },
      {
        fields: ['priority'],
      },
      {
        fields: ['is_active'],
      },
      {
        fields: ['source_system', 'source_type', 'priority'],
      },
    ],
  }
);

// Associations
GLAccountMapping.belongsTo(GLAccount, { foreignKey: 'glAccountId', as: 'glAccount' });
GLAccountMapping.belongsTo(GLAccount, { foreignKey: 'debitAccountId', as: 'debitAccount' });
GLAccountMapping.belongsTo(GLAccount, { foreignKey: 'creditAccountId', as: 'creditAccount' });

GLAccount.hasMany(GLAccountMapping, { foreignKey: 'glAccountId', as: 'mappings' });

export default GLAccountMapping;