import { DataTypes, Model, Optional, Op, QueryTypes } from 'sequelize';
import sequelize from '../db/database';

export interface AuditLogAttributes {
  id: number;
  entityType: string;
  entityId: number;
  action: 'create' | 'update' | 'delete' | 'approve' | 'reject' | 'view' | 'export' | 'login' | 'logout' | 'access_denied';
  userId: number;
  userAgent?: string;
  ipAddress?: string;
  sessionId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  changes?: string[];
  metadata?: Record<string, any>;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  complianceRelevant: boolean;
  description?: string;
  timestamp: Date;
  createdAt: Date;
}

export interface AuditLogCreationAttributes extends Optional<AuditLogAttributes, 'id' | 'createdAt' | 'riskLevel' | 'complianceRelevant'> {}

class AuditLog extends Model<AuditLogAttributes, AuditLogCreationAttributes> implements AuditLogAttributes {
  public id!: number;
  public entityType!: string;
  public entityId!: number;
  public action!: 'create' | 'update' | 'delete' | 'approve' | 'reject' | 'view' | 'export' | 'login' | 'logout' | 'access_denied';
  public userId!: number;
  public userAgent?: string;
  public ipAddress?: string;
  public sessionId?: string;
  public oldValues?: Record<string, any>;
  public newValues?: Record<string, any>;
  public changes?: string[];
  public metadata?: Record<string, any>;
  public riskLevel!: 'low' | 'medium' | 'high' | 'critical';
  public complianceRelevant!: boolean;
  public description?: string;
  public timestamp!: Date;
  public createdAt!: Date;

  // Static methods for audit trail queries
  public static async getEntityAuditTrail(entityType: string, entityId: number, limit: number = 100): Promise<AuditLog[]> {
    return this.findAll({
      where: {
        entityType,
        entityId
      },
      order: [['timestamp', 'DESC']],
      limit,
      include: [{
        model: sequelize.models.User,
        as: 'user',
        attributes: ['id', 'email', 'firstName', 'lastName']
      }]
    });
  }

  public static async getUserActivityLog(userId: number, limit: number = 100): Promise<AuditLog[]> {
    return this.findAll({
      where: { userId },
      order: [['timestamp', 'DESC']],
      limit
    });
  }

  public static async getComplianceAuditLog(
    startDate: Date, 
    endDate: Date, 
    riskLevel?: string[]
  ): Promise<AuditLog[]> {
    const whereClause: any = {
      complianceRelevant: true,
      timestamp: {
        [Op.between]: [startDate, endDate]
      }
    };

    if (riskLevel && riskLevel.length > 0) {
      whereClause.riskLevel = {
        [Op.in]: riskLevel
      };
    }

    return this.findAll({
      where: whereClause,
      order: [['timestamp', 'DESC']],
      include: [{
        model: sequelize.models.User,
        as: 'user',
        attributes: ['id', 'email', 'firstName', 'lastName']
      }]
    });
  }

  public static async getSuspiciousActivity(threshold: Date = new Date(Date.now() - 24 * 60 * 60 * 1000)): Promise<any[]> {
    // Find users with unusual activity patterns
    const suspiciousPatterns = await sequelize.query(`
      SELECT 
        user_id,
        COUNT(*) as total_actions,
        COUNT(DISTINCT ip_address) as unique_ips,
        COUNT(CASE WHEN action = 'access_denied' THEN 1 END) as failed_access,
        COUNT(CASE WHEN risk_level = 'critical' THEN 1 END) as critical_actions,
        MIN(timestamp) as first_action,
        MAX(timestamp) as last_action
      FROM "AuditLogs"
      WHERE timestamp >= :threshold
      GROUP BY user_id
      HAVING 
        COUNT(*) > 100 OR 
        COUNT(DISTINCT ip_address) > 5 OR
        COUNT(CASE WHEN action = 'access_denied' THEN 1 END) > 10 OR
        COUNT(CASE WHEN risk_level = 'critical' THEN 1 END) > 5
      ORDER BY total_actions DESC
    `, {
      replacements: { threshold },
      type: QueryTypes.SELECT
    });

    return suspiciousPatterns;
  }

  public static async createAuditEntry(
    entityType: string,
    entityId: number,
    action: string,
    userId: number,
    options: {
      userAgent?: string;
      ipAddress?: string;
      sessionId?: string;
      oldValues?: Record<string, any>;
      newValues?: Record<string, any>;
      metadata?: Record<string, any>;
      description?: string;
    } = {}
  ): Promise<AuditLog> {
    // Determine risk level based on action and entity type
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let complianceRelevant = false;

    // High-risk actions
    if (['delete', 'approve', 'reject'].includes(action)) {
      riskLevel = 'high';
      complianceRelevant = true;
    }

    // Critical actions
    if (action === 'delete' && ['fund', 'investor', 'transaction'].includes(entityType)) {
      riskLevel = 'critical';
      complianceRelevant = true;
    }

    // Compliance-relevant entity types
    if (['fund', 'investor', 'commitment', 'transaction', 'fee'].includes(entityType)) {
      complianceRelevant = true;
    }

    // Access denied is always high risk
    if (action === 'access_denied') {
      riskLevel = 'high';
      complianceRelevant = true;
    }

    // Calculate changes if old and new values provided
    let changes: string[] = [];
    if (options.oldValues && options.newValues) {
      changes = Object.keys(options.newValues).filter(key => 
        JSON.stringify(options.oldValues![key]) !== JSON.stringify(options.newValues![key])
      );
    }

    return this.create({
      entityType,
      entityId,
      action: action as any,
      userId,
      userAgent: options.userAgent,
      ipAddress: options.ipAddress,
      sessionId: options.sessionId,
      oldValues: options.oldValues,
      newValues: options.newValues,
      changes,
      metadata: options.metadata,
      riskLevel,
      complianceRelevant,
      description: options.description,
      timestamp: new Date()
    });
  }

  // Associations
  public static associate(models: any) {
    AuditLog.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  }
}

AuditLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    entityType: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 100],
      },
    },
    entityId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    action: {
      type: DataTypes.ENUM('create', 'update', 'delete', 'approve', 'reject', 'view', 'export', 'login', 'logout', 'access_denied'),
      allowNull: false,
      validate: {
        isIn: [['create', 'update', 'delete', 'approve', 'reject', 'view', 'export', 'login', 'logout', 'access_denied']],
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ipAddress: {
      type: DataTypes.INET,
      allowNull: true,
    },
    sessionId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    oldValues: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    newValues: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    changes: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: [],
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    riskLevel: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      allowNull: false,
      defaultValue: 'low',
      validate: {
        isIn: [['low', 'medium', 'high', 'critical']],
      },
    },
    complianceRelevant: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'AuditLog',
    tableName: 'AuditLogs',
    timestamps: false, // We handle our own timestamp
    indexes: [
      {
        fields: ['entity_type', 'entity_id'],
      },
      {
        fields: ['user_id'],
      },
      {
        fields: ['action'],
      },
      {
        fields: ['timestamp'],
      },
      {
        fields: ['risk_level'],
      },
      {
        fields: ['compliance_relevant'],
      },
      {
        fields: ['ip_address'],
      },
      {
        fields: ['session_id'],
      },
    ],
  }
);

export default AuditLog;