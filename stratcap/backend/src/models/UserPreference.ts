import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../db/database';

export interface UserPreferenceAttributes {
  id: string;
  userId: string;
  category: 'ui' | 'notification' | 'reporting' | 'workflow' | 'security' | 'display' | 'general';
  preferenceKey: string;
  preferenceValue: string;
  dataType: 'string' | 'number' | 'boolean' | 'json' | 'array';
  description?: string;
  isPublic: boolean;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserPreferenceCreationAttributes extends Optional<UserPreferenceAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class UserPreference extends Model<UserPreferenceAttributes, UserPreferenceCreationAttributes> implements UserPreferenceAttributes {
  public id!: string;
  public userId!: string;
  public category!: 'ui' | 'notification' | 'reporting' | 'workflow' | 'security' | 'display' | 'general';
  public preferenceKey!: string;
  public preferenceValue!: string;
  public dataType!: 'string' | 'number' | 'boolean' | 'json' | 'array';
  public description?: string;
  public isPublic!: boolean;
  public metadata?: Record<string, any>;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public user?: any;

  /**
   * Get the parsed value based on data type
   */
  public getParsedValue(): any {
    try {
      switch (this.dataType) {
        case 'boolean':
          return this.preferenceValue.toLowerCase() === 'true';
        case 'number':
          return parseFloat(this.preferenceValue);
        case 'json':
          return JSON.parse(this.preferenceValue);
        case 'array':
          return JSON.parse(this.preferenceValue);
        case 'string':
        default:
          return this.preferenceValue;
      }
    } catch (error) {
      console.warn(`Failed to parse preference value for ${this.preferenceKey}:`, error);
      return this.preferenceValue;
    }
  }

  /**
   * Set value with automatic type conversion
   */
  public setParsedValue(value: any): void {
    switch (this.dataType) {
      case 'boolean':
        this.preferenceValue = Boolean(value).toString();
        break;
      case 'number':
        this.preferenceValue = Number(value).toString();
        break;
      case 'json':
      case 'array':
        this.preferenceValue = JSON.stringify(value);
        break;
      case 'string':
      default:
        this.preferenceValue = String(value);
        break;
    }
  }
}

UserPreference.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    category: {
      type: DataTypes.ENUM('ui', 'notification', 'reporting', 'workflow', 'security', 'display', 'general'),
      allowNull: false,
    },
    preferenceKey: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    preferenceValue: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    dataType: {
      type: DataTypes.ENUM('string', 'number', 'boolean', 'json', 'array'),
      allowNull: false,
      defaultValue: 'string',
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
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'UserPreferences',
    timestamps: true,
    indexes: [
      {
        fields: ['userId', 'preferenceKey'],
        unique: true,
      },
      {
        fields: ['userId'],
      },
      {
        fields: ['category'],
      },
      {
        fields: ['isPublic'],
      },
    ],
  }
);

export default UserPreference;