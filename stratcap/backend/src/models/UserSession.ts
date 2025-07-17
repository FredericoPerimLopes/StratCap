import { Model, DataTypes, Sequelize, Association } from 'sequelize';
import { User } from './User';

export interface UserSessionAttributes {
  id: string;
  userId: number;
  sessionToken: string;
  deviceInfo: any; // JSON object with device information
  ipAddress: string;
  userAgent: string;
  expiresAt: Date;
  isActive: boolean;
  lastActivity: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserSessionCreationAttributes extends Omit<UserSessionAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class UserSession extends Model<UserSessionAttributes, UserSessionCreationAttributes> implements UserSessionAttributes {
  public id!: string;
  public userId!: number;
  public sessionToken!: string;
  public deviceInfo!: any;
  public ipAddress!: string;
  public userAgent!: string;
  public expiresAt!: Date;
  public isActive!: boolean;
  public lastActivity!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public user?: User;
  public static associations: {
    user: Association<UserSession, User>;
  };

  // Instance methods
  public isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  public isValidSession(): boolean {
    return this.isActive && !this.isExpired();
  }

  public getDeviceName(): string {
    if (this.deviceInfo?.deviceName) {
      return this.deviceInfo.deviceName;
    }
    
    // Try to extract device info from user agent
    const ua = this.userAgent.toLowerCase();
    if (ua.includes('mobile')) {
      return 'Mobile Device';
    } else if (ua.includes('tablet')) {
      return 'Tablet';
    } else {
      return 'Desktop';
    }
  }

  public getBrowserName(): string {
    const ua = this.userAgent.toLowerCase();
    
    if (ua.includes('chrome')) return 'Chrome';
    if (ua.includes('firefox')) return 'Firefox';
    if (ua.includes('safari')) return 'Safari';
    if (ua.includes('edge')) return 'Edge';
    if (ua.includes('opera')) return 'Opera';
    
    return 'Unknown Browser';
  }

  public getOperatingSystem(): string {
    const ua = this.userAgent.toLowerCase();
    
    if (ua.includes('windows')) return 'Windows';
    if (ua.includes('mac os')) return 'macOS';
    if (ua.includes('linux')) return 'Linux';
    if (ua.includes('android')) return 'Android';
    if (ua.includes('ios')) return 'iOS';
    
    return 'Unknown OS';
  }

  public getSessionSummary(): {
    deviceName: string;
    browser: string;
    os: string;
    location: string;
    lastActive: Date;
    isActive: boolean;
  } {
    return {
      deviceName: this.getDeviceName(),
      browser: this.getBrowserName(),
      os: this.getOperatingSystem(),
      location: this.deviceInfo?.location || this.ipAddress,
      lastActive: this.lastActivity,
      isActive: this.isActive,
    };
  }
}

export default UserSession;

export function initUserSession(sequelize: Sequelize): typeof UserSession {
  UserSession.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
      },
      sessionToken: {
        type: DataTypes.STRING(512),
        allowNull: false,
        unique: true,
      },
      deviceInfo: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      ipAddress: {
        type: DataTypes.INET,
        allowNull: false,
      },
      userAgent: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      lastActivity: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'UserSession',
      tableName: 'UserSessions',
      timestamps: true,
      indexes: [
        {
          fields: ['userId'],
        },
        {
          fields: ['sessionToken'],
          unique: true,
        },
        {
          fields: ['isActive'],
        },
        {
          fields: ['expiresAt'],
        },
        {
          fields: ['lastActivity'],
        },
        {
          fields: ['ipAddress'],
        },
      ],
    }
  );

  return UserSession;
}