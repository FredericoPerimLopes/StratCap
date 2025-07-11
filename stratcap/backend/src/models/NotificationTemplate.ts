import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db/database';

interface NotificationTemplateAttributes {
  id: number;
  name: string;
  type: 'capital_call' | 'distribution' | 'notice' | 'reminder' | 'confirmation';
  subject: string;
  bodyTemplate: string;
  variables: Record<string, any>;
  defaultRecipients?: Record<string, any>;
  settings?: Record<string, any>;
  isActive: boolean;
  createdBy: number;
  lastModifiedBy?: number;
  version: number;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

interface NotificationTemplateCreationAttributes extends Optional<NotificationTemplateAttributes, 'id' | 'isActive' | 'version' | 'createdAt' | 'updatedAt'> {}

class NotificationTemplate extends Model<NotificationTemplateAttributes, NotificationTemplateCreationAttributes> implements NotificationTemplateAttributes {
  public id!: number;
  public name!: string;
  public type!: 'capital_call' | 'distribution' | 'notice' | 'reminder' | 'confirmation';
  public subject!: string;
  public bodyTemplate!: string;
  public variables!: Record<string, any>;
  public defaultRecipients?: Record<string, any>;
  public settings?: Record<string, any>;
  public isActive!: boolean;
  public createdBy!: number;
  public lastModifiedBy?: number;
  public version!: number;
  public notes?: string;
  public metadata?: Record<string, any>;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  static associate(models: any) {
    NotificationTemplate.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator',
    });
    NotificationTemplate.belongsTo(models.User, {
      foreignKey: 'lastModifiedBy',
      as: 'lastModifier',
    });
  }
}

NotificationTemplate.init(
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
    type: {
      type: DataTypes.ENUM('capital_call', 'distribution', 'notice', 'reminder', 'confirmation'),
      allowNull: false,
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    bodyTemplate: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    variables: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    defaultRecipients: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    settings: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    lastModifiedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    version: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
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
    modelName: 'NotificationTemplate',
    tableName: 'notification_templates',
    indexes: [
      {
        fields: ['type'],
      },
      {
        fields: ['is_active'],
      },
      {
        unique: true,
        fields: ['name', 'version'],
      },
    ],
  }
);

export default NotificationTemplate;