import { DataTypes, Model, Optional, Op } from 'sequelize';
import sequelize from '../db/database';

export interface SystemConfigurationAttributes {
  id: number;
  category: 'general' | 'security' | 'notification' | 'integration' | 'reporting' | 'compliance' | 'performance';
  key: string;
  value: any;
  dataType: 'string' | 'number' | 'boolean' | 'json' | 'array';
  description?: string;
  isPublic: boolean;
  isRequired: boolean;
  defaultValue?: any;
  validationRules?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: string[];
    required?: boolean;
  };
  environment: 'development' | 'staging' | 'production' | 'all';
  lastModifiedBy: number;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SystemConfigurationCreationAttributes extends Optional<SystemConfigurationAttributes, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'isPublic' | 'isRequired'> {}

class SystemConfiguration extends Model<SystemConfigurationAttributes, SystemConfigurationCreationAttributes> implements SystemConfigurationAttributes {
  public id!: number;
  public category!: 'general' | 'security' | 'notification' | 'integration' | 'reporting' | 'compliance' | 'performance';
  public key!: string;
  public value!: any;
  public dataType!: 'string' | 'number' | 'boolean' | 'json' | 'array';
  public description?: string;
  public isPublic!: boolean;
  public isRequired!: boolean;
  public defaultValue?: any;
  public validationRules?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: string[];
    required?: boolean;
  };
  public environment!: 'development' | 'staging' | 'production' | 'all';
  public lastModifiedBy!: number;
  public version!: number;
  public createdAt!: Date;
  public updatedAt!: Date;

  // Instance methods
  public getTypedValue(): any {
    switch (this.dataType) {
      case 'number':
        return typeof this.value === 'string' ? parseFloat(this.value) : this.value;
      case 'boolean':
        return typeof this.value === 'string' ? this.value === 'true' : Boolean(this.value);
      case 'json':
        return typeof this.value === 'string' ? JSON.parse(this.value) : this.value;
      case 'array':
        return Array.isArray(this.value) ? this.value : [this.value];
      default:
        return String(this.value);
    }
  }

  public validateValue(newValue: any): { valid: boolean; error?: string } {
    if (!this.validationRules) {
      return { valid: true };
    }

    const rules = this.validationRules;

    // Required check
    if (rules.required && (newValue === null || newValue === undefined || newValue === '')) {
      return { valid: false, error: 'Value is required' };
    }

    // Type-specific validations
    switch (this.dataType) {
      case 'number':
        const numValue = typeof newValue === 'string' ? parseFloat(newValue) : newValue;
        if (isNaN(numValue)) {
          return { valid: false, error: 'Value must be a number' };
        }
        if (rules.min !== undefined && numValue < rules.min) {
          return { valid: false, error: `Value must be at least ${rules.min}` };
        }
        if (rules.max !== undefined && numValue > rules.max) {
          return { valid: false, error: `Value must be at most ${rules.max}` };
        }
        break;

      case 'string':
        const strValue = String(newValue);
        if (rules.pattern && !new RegExp(rules.pattern).test(strValue)) {
          return { valid: false, error: 'Value does not match required pattern' };
        }
        if (rules.enum && !rules.enum.includes(strValue)) {
          return { valid: false, error: `Value must be one of: ${rules.enum.join(', ')}` };
        }
        if (rules.min !== undefined && strValue.length < rules.min) {
          return { valid: false, error: `Value must be at least ${rules.min} characters` };
        }
        if (rules.max !== undefined && strValue.length > rules.max) {
          return { valid: false, error: `Value must be at most ${rules.max} characters` };
        }
        break;

      case 'json':
        try {
          if (typeof newValue === 'string') {
            JSON.parse(newValue);
          }
        } catch (error) {
          return { valid: false, error: 'Value must be valid JSON' };
        }
        break;

      case 'array':
        if (!Array.isArray(newValue) && typeof newValue !== 'string') {
          return { valid: false, error: 'Value must be an array' };
        }
        break;
    }

    return { valid: true };
  }

  // Static methods
  public static async getByKey(key: string, environment?: string): Promise<SystemConfiguration | null> {
    const currentEnv = environment || process.env.NODE_ENV || 'development';
    
    return this.findOne({
      where: {
        key,
        environment: {
          [Op.in]: [currentEnv, 'all']
        }
      },
      order: [
        // Prefer environment-specific over 'all'
        [sequelize.literal(`CASE WHEN environment = '${currentEnv}' THEN 0 ELSE 1 END`), 'ASC']
      ]
    });
  }

  public static async getByCategory(category: string, environment?: string): Promise<SystemConfiguration[]> {
    const currentEnv = environment || process.env.NODE_ENV || 'development';
    
    return this.findAll({
      where: {
        category,
        environment: {
          [Op.in]: [currentEnv, 'all']
        }
      },
      order: [['key', 'ASC']]
    });
  }

  public static async getPublicConfig(environment?: string): Promise<Record<string, any>> {
    const currentEnv = environment || process.env.NODE_ENV || 'development';
    
    const configs = await this.findAll({
      where: {
        isPublic: true,
        environment: {
          [Op.in]: [currentEnv, 'all']
        }
      }
    });

    const result: Record<string, any> = {};
    for (const config of configs) {
      result[config.key] = config.getTypedValue();
    }

    return result;
  }

  public static async setValue(
    key: string,
    value: any,
    modifiedBy: number,
    environment: string = 'all'
  ): Promise<SystemConfiguration> {
    const existingConfig = await this.findOne({
      where: { key, environment }
    });

    if (existingConfig) {
      // Validate the new value
      const validation = existingConfig.validateValue(value);
      if (!validation.valid) {
        throw new Error(`Invalid value: ${validation.error}`);
      }

      existingConfig.value = value;
      existingConfig.lastModifiedBy = modifiedBy;
      existingConfig.version += 1;
      await existingConfig.save();
      return existingConfig;
    } else {
      throw new Error(`Configuration key '${key}' not found`);
    }
  }

  public static async initializeDefaults(): Promise<void> {
    const defaultConfigs = [
      // General settings
      {
        category: 'general',
        key: 'app.name',
        value: 'StratCap',
        dataType: 'string',
        description: 'Application name',
        isPublic: true,
        isRequired: true,
        environment: 'all'
      },
      {
        category: 'general',
        key: 'app.timezone',
        value: 'UTC',
        dataType: 'string',
        description: 'Default application timezone',
        isPublic: true,
        isRequired: true,
        environment: 'all'
      },
      
      // Security settings
      {
        category: 'security',
        key: 'jwt.expiration',
        value: '24h',
        dataType: 'string',
        description: 'JWT token expiration time',
        isPublic: false,
        isRequired: true,
        environment: 'all'
      },
      {
        category: 'security',
        key: 'password.minLength',
        value: 8,
        dataType: 'number',
        description: 'Minimum password length',
        isPublic: true,
        isRequired: true,
        validationRules: { min: 6, max: 128 },
        environment: 'all'
      },
      {
        category: 'security',
        key: 'session.timeout',
        value: 1800,
        dataType: 'number',
        description: 'Session timeout in seconds',
        isPublic: false,
        isRequired: true,
        validationRules: { min: 300, max: 86400 },
        environment: 'all'
      },

      // Notification settings
      {
        category: 'notification',
        key: 'email.enabled',
        value: true,
        dataType: 'boolean',
        description: 'Enable email notifications',
        isPublic: false,
        isRequired: true,
        environment: 'all'
      },
      {
        category: 'notification',
        key: 'notification.batchSize',
        value: 100,
        dataType: 'number',
        description: 'Notification processing batch size',
        isPublic: false,
        isRequired: true,
        validationRules: { min: 10, max: 1000 },
        environment: 'all'
      },

      // Performance settings
      {
        category: 'performance',
        key: 'cache.ttl',
        value: 3600,
        dataType: 'number',
        description: 'Default cache TTL in seconds',
        isPublic: false,
        isRequired: true,
        validationRules: { min: 60, max: 86400 },
        environment: 'all'
      },
      {
        category: 'performance',
        key: 'pagination.defaultLimit',
        value: 25,
        dataType: 'number',
        description: 'Default pagination limit',
        isPublic: true,
        isRequired: true,
        validationRules: { min: 10, max: 1000 },
        environment: 'all'
      },

      // Compliance settings
      {
        category: 'compliance',
        key: 'audit.retentionDays',
        value: 2555, // 7 years
        dataType: 'number',
        description: 'Audit log retention in days',
        isPublic: false,
        isRequired: true,
        validationRules: { min: 365, max: 3650 },
        environment: 'all'
      }
    ];

    for (const config of defaultConfigs) {
      const existing = await this.findOne({
        where: {
          key: config.key,
          environment: config.environment
        }
      });

      if (!existing) {
        await this.create({
          ...config,
          lastModifiedBy: 1, // System user
          version: 1
        } as any);
      }
    }
  }

  // Associations
  public static associate(models: any) {
    SystemConfiguration.belongsTo(models.User, {
      foreignKey: 'lastModifiedBy',
      as: 'modifier'
    });
  }
}

SystemConfiguration.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    category: {
      type: DataTypes.ENUM('general', 'security', 'notification', 'integration', 'reporting', 'compliance', 'performance'),
      allowNull: false,
      validate: {
        isIn: [['general', 'security', 'notification', 'integration', 'reporting', 'compliance', 'performance']],
      },
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255],
      },
    },
    value: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    dataType: {
      type: DataTypes.ENUM('string', 'number', 'boolean', 'json', 'array'),
      allowNull: false,
      validate: {
        isIn: [['string', 'number', 'boolean', 'json', 'array']],
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isRequired: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    defaultValue: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    validationRules: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    environment: {
      type: DataTypes.ENUM('development', 'staging', 'production', 'all'),
      allowNull: false,
      defaultValue: 'all',
      validate: {
        isIn: [['development', 'staging', 'production', 'all']],
      },
    },
    lastModifiedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
      },
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'SystemConfiguration',
    tableName: 'SystemConfigurations',
    timestamps: true,
    indexes: [
      {
        fields: ['key', 'environment'],
        unique: true,
      },
      {
        fields: ['category'],
      },
      {
        fields: ['isPublic'],
      },
      {
        fields: ['environment'],
      },
      {
        fields: ['lastModifiedBy'],
      },
    ],
    hooks: {
      beforeUpdate: (config: SystemConfiguration) => {
        config.version += 1;
      },
    },
  }
);

export default SystemConfiguration;