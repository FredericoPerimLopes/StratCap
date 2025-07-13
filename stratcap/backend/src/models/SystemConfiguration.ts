import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../db/database';

export interface SystemConfigurationAttributes {
  id: string;
  module: string;
  configKey: string;
  configValue: string;
  dataType: 'string' | 'number' | 'boolean' | 'json' | 'array';
  category: 'system' | 'feature' | 'integration' | 'security' | 'ui' | 'workflow';
  description?: string;
  isEncrypted: boolean;
  isRequired: boolean;
  isReadOnly: boolean;
  validationRules?: Record<string, any>;
  defaultValue?: string;
  environmentOverride?: boolean;
  lastModifiedBy: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

interface SystemConfigurationCreationAttributes extends Optional<SystemConfigurationAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class SystemConfiguration extends Model<SystemConfigurationAttributes, SystemConfigurationCreationAttributes> implements SystemConfigurationAttributes {
  public id!: string;
  public module!: string;
  public configKey!: string;
  public configValue!: string;
  public dataType!: 'string' | 'number' | 'boolean' | 'json' | 'array';
  public category!: 'system' | 'feature' | 'integration' | 'security' | 'ui' | 'workflow';
  public description?: string;
  public isEncrypted!: boolean;
  public isRequired!: boolean;
  public isReadOnly!: boolean;
  public validationRules?: Record<string, any>;
  public defaultValue?: string;
  public environmentOverride?: boolean;
  public lastModifiedBy!: string;
  public metadata?: Record<string, any>;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  /**
   * Get the parsed value based on data type
   */
  public getParsedValue(): any {
    try {
      switch (this.dataType) {
        case 'boolean':
          return this.configValue.toLowerCase() === 'true';
        case 'number':
          return parseFloat(this.configValue);
        case 'json':
          return JSON.parse(this.configValue);
        case 'array':
          return JSON.parse(this.configValue);
        case 'string':
        default:
          return this.configValue;
      }
    } catch (error) {
      console.warn(`Failed to parse config value for ${this.configKey}:`, error);
      return this.configValue;
    }
  }

  /**
   * Set value with automatic type conversion
   */
  public setParsedValue(value: any): void {
    switch (this.dataType) {
      case 'boolean':
        this.configValue = Boolean(value).toString();
        break;
      case 'number':
        this.configValue = Number(value).toString();
        break;
      case 'json':
      case 'array':
        this.configValue = JSON.stringify(value);
        break;
      case 'string':
      default:
        this.configValue = String(value);
        break;
    }
  }

  /**
   * Validate the configuration value
   */
  public validateValue(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check if required
    if (this.isRequired && (!this.configValue || this.configValue.trim() === '')) {
      errors.push('Configuration value is required');
    }

    // Type-specific validation
    try {
      switch (this.dataType) {
        case 'boolean':
          if (this.configValue && !['true', 'false'].includes(this.configValue.toLowerCase())) {
            errors.push('Boolean value must be "true" or "false"');
          }
          break;
        case 'number':
          if (this.configValue && isNaN(parseFloat(this.configValue))) {
            errors.push('Value must be a valid number');
          }
          break;
        case 'json':
        case 'array':
          if (this.configValue) {
            JSON.parse(this.configValue);
          }
          break;
      }
    } catch (error) {
      errors.push(`Invalid ${this.dataType} format`);
    }

    // Custom validation rules
    if (this.validationRules && this.configValue) {
      const value = this.getParsedValue();

      if (this.validationRules.min !== undefined && typeof value === 'number' && value < this.validationRules.min) {
        errors.push(`Value must be at least ${this.validationRules.min}`);
      }

      if (this.validationRules.max !== undefined && typeof value === 'number' && value > this.validationRules.max) {
        errors.push(`Value must be at most ${this.validationRules.max}`);
      }

      if (this.validationRules.minLength !== undefined && typeof value === 'string' && value.length < this.validationRules.minLength) {
        errors.push(`Value must be at least ${this.validationRules.minLength} characters`);
      }

      if (this.validationRules.maxLength !== undefined && typeof value === 'string' && value.length > this.validationRules.maxLength) {
        errors.push(`Value must be at most ${this.validationRules.maxLength} characters`);
      }

      if (this.validationRules.pattern && typeof value === 'string' && !new RegExp(this.validationRules.pattern).test(value)) {
        errors.push('Value does not match required pattern');
      }

      if (this.validationRules.allowedValues && !this.validationRules.allowedValues.includes(value)) {
        errors.push(`Value must be one of: ${this.validationRules.allowedValues.join(', ')}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get the effective value (considering environment overrides)
   */
  public getEffectiveValue(): any {
    if (this.environmentOverride) {
      const envKey = `${this.module.toUpperCase()}_${this.configKey.toUpperCase()}`.replace(/[^A-Z0-9_]/g, '_');
      const envValue = process.env[envKey];
      if (envValue !== undefined) {
        // Create a temporary instance to parse the environment value
        const tempConfig = { ...this, configValue: envValue };
        return tempConfig.getParsedValue();
      }
    }
    return this.getParsedValue();
  }
}

SystemConfiguration.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    module: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    configKey: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    configValue: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    dataType: {
      type: DataTypes.ENUM('string', 'number', 'boolean', 'json', 'array'),
      allowNull: false,
      defaultValue: 'string',
    },
    category: {
      type: DataTypes.ENUM('system', 'feature', 'integration', 'security', 'ui', 'workflow'),
      allowNull: false,
      defaultValue: 'system',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isEncrypted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isRequired: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isReadOnly: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    validationRules: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    defaultValue: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    environmentOverride: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    lastModifiedBy: {
      type: DataTypes.UUID,
      allowNull: false,
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
    tableName: 'SystemConfigurations',
    timestamps: true,
    indexes: [
      {
        fields: ['module', 'configKey'],
        unique: true,
      },
      {
        fields: ['module'],
      },
      {
        fields: ['category'],
      },
      {
        fields: ['isRequired'],
      },
      {
        fields: ['isReadOnly'],
      },
    ],
  }
);

export default SystemConfiguration;