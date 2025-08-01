import { DataTypes, Model, Optional, Op } from 'sequelize';
import sequelize from '../db/database';

export interface NotificationQueueAttributes {
  id: number;
  type: 'email' | 'sms' | 'push' | 'in_app' | 'webhook';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled';
  recipientId: number;
  recipientType: 'user' | 'investor' | 'group';
  subject?: string;
  message: string;
  templateId?: string;
  templateData?: Record<string, any>;
  channel: {
    email?: string;
    phone?: string;
    deviceToken?: string;
    webhookUrl?: string;
  };
  metadata?: Record<string, any>;
  entityType?: string;
  entityId?: number;
  scheduledAt?: Date;
  sentAt?: Date;
  failedAt?: Date;
  failureReason?: string;
  retryCount: number;
  maxRetries: number;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationQueueCreationAttributes extends Optional<NotificationQueueAttributes, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'retryCount' | 'maxRetries'> {}

class NotificationQueue extends Model<NotificationQueueAttributes, NotificationQueueCreationAttributes> implements NotificationQueueAttributes {
  public id!: number;
  public type!: 'email' | 'sms' | 'push' | 'in_app' | 'webhook';
  public priority!: 'low' | 'medium' | 'high' | 'urgent';
  public status!: 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled';
  public recipientId!: number;
  public recipientType!: 'user' | 'investor' | 'group';
  public subject?: string;
  public message!: string;
  public templateId?: string;
  public templateData?: Record<string, any>;
  public channel!: {
    email?: string;
    phone?: string;
    deviceToken?: string;
    webhookUrl?: string;
  };
  public metadata?: Record<string, any>;
  public entityType?: string;
  public entityId?: number;
  public scheduledAt?: Date;
  public sentAt?: Date;
  public failedAt?: Date;
  public failureReason?: string;
  public retryCount!: number;
  public maxRetries!: number;
  public createdBy!: number;
  public createdAt!: Date;
  public updatedAt!: Date;

  // Instance methods
  public async markAsSent(): Promise<void> {
    this.status = 'sent';
    this.sentAt = new Date();
    await this.save();
  }

  public async markAsFailed(reason: string): Promise<void> {
    this.status = 'failed';
    this.failedAt = new Date();
    this.failureReason = reason;
    this.retryCount += 1;
    await this.save();
  }

  public async markAsProcessing(): Promise<void> {
    this.status = 'processing';
    await this.save();
  }

  public canRetry(): boolean {
    return this.retryCount < this.maxRetries && this.status === 'failed';
  }

  public async scheduleRetry(delayMinutes: number = 5): Promise<void> {
    if (this.canRetry()) {
      this.status = 'pending';
      this.scheduledAt = new Date(Date.now() + delayMinutes * 60 * 1000);
      await this.save();
    }
  }

  // Static methods
  public static async getPendingNotifications(limit: number = 100): Promise<NotificationQueue[]> {
    return this.findAll({
      where: {
        status: 'pending',
        scheduledAt: {
          [Op.or]: [
            { [Op.is]: null },
            { [Op.lte]: new Date() }
          ]
        } as any
      },
      order: [
        ['priority', 'DESC'],
        ['createdAt', 'ASC']
      ],
      limit
    });
  }

  public static async getFailedNotifications(retryable: boolean = true): Promise<NotificationQueue[]> {
    const whereClause: any = {
      status: 'failed'
    };

    if (retryable) {
      whereClause[Op.and] = sequelize.literal('retry_count < max_retries');
    }

    return this.findAll({
      where: whereClause,
      order: [['failedAt', 'ASC']]
    });
  }

  public static async createEmailNotification(
    recipientId: number,
    recipientType: 'user' | 'investor' | 'group',
    email: string,
    subject: string,
    message: string,
    createdBy: number,
    options: {
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      templateId?: string;
      templateData?: Record<string, any>;
      entityType?: string;
      entityId?: number;
      scheduledAt?: Date;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<NotificationQueue> {
    return this.create({
      type: 'email',
      priority: options.priority || 'medium',
      recipientId,
      recipientType,
      subject,
      message,
      templateId: options.templateId,
      templateData: options.templateData,
      channel: { email },
      entityType: options.entityType,
      entityId: options.entityId,
      scheduledAt: options.scheduledAt,
      metadata: options.metadata,
      createdBy
    });
  }

  public static async createSMSNotification(
    recipientId: number,
    recipientType: 'user' | 'investor' | 'group',
    phone: string,
    message: string,
    createdBy: number,
    options: {
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      entityType?: string;
      entityId?: number;
      scheduledAt?: Date;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<NotificationQueue> {
    return this.create({
      type: 'sms',
      priority: options.priority || 'medium',
      recipientId,
      recipientType,
      message,
      channel: { phone },
      entityType: options.entityType,
      entityId: options.entityId,
      scheduledAt: options.scheduledAt,
      metadata: options.metadata,
      createdBy
    });
  }

  public static async createWebhookNotification(
    recipientId: number,
    webhookUrl: string,
    message: string,
    createdBy: number,
    options: {
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      entityType?: string;
      entityId?: number;
      scheduledAt?: Date;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<NotificationQueue> {
    return this.create({
      type: 'webhook',
      priority: options.priority || 'medium',
      recipientId,
      recipientType: 'user',
      message,
      channel: { webhookUrl },
      entityType: options.entityType,
      entityId: options.entityId,
      scheduledAt: options.scheduledAt,
      metadata: options.metadata,
      createdBy
    });
  }

  public static async getNotificationStats(
    startDate: Date,
    endDate: Date
  ): Promise<{
    total: number;
    sent: number;
    failed: number;
    pending: number;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
  }> {
    const stats = await this.findAll({
      where: {
        createdAt: {
          [Op.between]: [startDate, endDate]
        }
      },
      attributes: [
        'status',
        'type',
        'priority',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status', 'type', 'priority'],
      raw: true
    });

    const result = {
      total: 0,
      sent: 0,
      failed: 0,
      pending: 0,
      byType: {} as Record<string, number>,
      byPriority: {} as Record<string, number>
    };

    for (const stat of stats as any[]) {
      const count = parseInt(stat.count);
      result.total += count;

      // Status counts
      if (stat.status === 'sent') result.sent += count;
      else if (stat.status === 'failed') result.failed += count;
      else if (stat.status === 'pending') result.pending += count;

      // Type counts
      result.byType[stat.type] = (result.byType[stat.type] || 0) + count;

      // Priority counts
      result.byPriority[stat.priority] = (result.byPriority[stat.priority] || 0) + count;
    }

    return result;
  }

  // Associations
  public static associate(models: any) {
    NotificationQueue.belongsTo(models.User, {
      foreignKey: 'recipientId',
      as: 'recipient',
      constraints: false
    });

    NotificationQueue.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });

    NotificationQueue.belongsTo(models.InvestorEntity, {
      foreignKey: 'recipientId',
      as: 'investorRecipient',
      constraints: false
    });
  }
}

NotificationQueue.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    type: {
      type: DataTypes.ENUM('email', 'sms', 'push', 'in_app', 'webhook'),
      allowNull: false,
      validate: {
        isIn: [['email', 'sms', 'push', 'in_app', 'webhook']],
      },
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      allowNull: false,
      defaultValue: 'medium',
      validate: {
        isIn: [['low', 'medium', 'high', 'urgent']],
      },
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'sent', 'failed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
      validate: {
        isIn: [['pending', 'processing', 'sent', 'failed', 'cancelled']],
      },
    },
    recipientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    recipientType: {
      type: DataTypes.ENUM('user', 'investor', 'group'),
      allowNull: false,
      validate: {
        isIn: [['user', 'investor', 'group']],
      },
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [0, 255],
      },
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    templateId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    templateData: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    channel: {
      type: DataTypes.JSONB,
      allowNull: false,
      validate: {
        isValidChannel(value: any) {
          if (!value || typeof value !== 'object') {
            throw new Error('Channel must be an object');
          }
          
          const hasValidChannel = value.email || value.phone || value.deviceToken || value.webhookUrl;
          if (!hasValidChannel) {
            throw new Error('Channel must have at least one valid contact method');
          }
        }
      }
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    entityType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    entityId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    scheduledAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    sentAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    failedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    failureReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    retryCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    maxRetries: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3,
      validate: {
        min: 0,
        max: 10,
      },
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
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
    modelName: 'NotificationQueue',
    tableName: 'NotificationQueue',
    timestamps: true,
    indexes: [
      {
        fields: ['status'],
      },
      {
        fields: ['priority'],
      },
      {
        fields: ['type'],
      },
      {
        fields: ['recipientId', 'recipientType'],
      },
      {
        fields: ['scheduledAt'],
      },
      {
        fields: ['createdAt'],
      },
      {
        fields: ['entityType', 'entityId'],
      },
      {
        fields: ['status', 'scheduledAt'],
      },
      {
        fields: ['status', 'priority', 'createdAt'],
      },
    ],
  }
);

export default NotificationQueue;