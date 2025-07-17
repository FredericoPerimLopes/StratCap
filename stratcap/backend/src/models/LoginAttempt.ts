import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../db/database';

export interface LoginAttemptAttributes {
  id: string;
  email: string;
  ipAddress: string;
  userAgent?: string;
  success: boolean;
  failureReason?: string;
  country?: string;
  city?: string;
  deviceFingerprint?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LoginAttemptCreationAttributes extends Omit<LoginAttemptAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class LoginAttempt extends Model<LoginAttemptAttributes, LoginAttemptCreationAttributes> implements LoginAttemptAttributes {
  public id!: string;
  public email!: string;
  public ipAddress!: string;
  public userAgent?: string;
  public success!: boolean;
  public failureReason?: string;
  public country?: string;
  public city?: string;
  public deviceFingerprint?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance methods
  public getAttemptSummary(): {
    email: string;
    location: string;
    device: string;
    timestamp: Date;
    success: boolean;
    reason?: string;
  } {
    const location = this.country && this.city 
      ? `${this.city}, ${this.country}` 
      : this.ipAddress;

    const device = this.userAgent 
      ? this.extractDeviceInfo(this.userAgent)
      : 'Unknown Device';

    return {
      email: this.email,
      location,
      device,
      timestamp: this.createdAt,
      success: this.success,
      reason: this.failureReason,
    };
  }

  private extractDeviceInfo(userAgent: string): string {
    const ua = userAgent.toLowerCase();
    
    let browser = 'Unknown Browser';
    if (ua.includes('chrome')) browser = 'Chrome';
    else if (ua.includes('firefox')) browser = 'Firefox';
    else if (ua.includes('safari')) browser = 'Safari';
    else if (ua.includes('edge')) browser = 'Edge';

    let os = 'Unknown OS';
    if (ua.includes('windows')) os = 'Windows';
    else if (ua.includes('mac os')) os = 'macOS';
    else if (ua.includes('linux')) os = 'Linux';
    else if (ua.includes('android')) os = 'Android';
    else if (ua.includes('ios')) os = 'iOS';

    return `${browser} on ${os}`;
  }

  // Static methods for analytics
  public static async getFailedAttemptsInWindow(
    email: string, 
    windowMinutes: number
  ): Promise<number> {
    const windowStart = new Date(Date.now() - (windowMinutes * 60 * 1000));
    
    return await LoginAttempt.count({
      where: {
        email,
        success: false,
        createdAt: { $gte: windowStart },
      },
    });
  }

  public static async getRecentAttemptsForIP(
    ipAddress: string, 
    windowMinutes: number = 60
  ): Promise<LoginAttempt[]> {
    const windowStart = new Date(Date.now() - (windowMinutes * 60 * 1000));
    
    return await LoginAttempt.findAll({
      where: {
        ipAddress,
        createdAt: { $gte: windowStart },
      },
      order: [['createdAt', 'DESC']],
    });
  }

  public static async getSuspiciousPatterns(): Promise<{
    multipleFailedEmails: Array<{ email: string; attempts: number }>;
    multipleFailedIPs: Array<{ ipAddress: string; attempts: number }>;
    unusualLocations: Array<{ email: string; country: string; attempts: number }>;
  }> {
    const last24Hours = new Date(Date.now() - (24 * 60 * 60 * 1000));

    // Multiple failed attempts per email
    const multipleFailedEmails = await LoginAttempt.findAll({
      attributes: [
        'email',
        [sequelize.fn('COUNT', sequelize.col('id')), 'attempts'],
      ],
      where: {
        success: false,
        createdAt: { $gte: last24Hours },
      },
      group: ['email'],
      having: sequelize.where(sequelize.fn('COUNT', sequelize.col('id')), '>', 5),
      raw: true,
    }) as any[];

    // Multiple failed attempts per IP
    const multipleFailedIPs = await LoginAttempt.findAll({
      attributes: [
        'ipAddress',
        [sequelize.fn('COUNT', sequelize.col('id')), 'attempts'],
      ],
      where: {
        success: false,
        createdAt: { $gte: last24Hours },
      },
      group: ['ipAddress'],
      having: sequelize.where(sequelize.fn('COUNT', sequelize.col('id')), '>', 10),
      raw: true,
    }) as any[];

    // Unusual locations (countries with few attempts but suspicious patterns)
    const unusualLocations = await LoginAttempt.findAll({
      attributes: [
        'email',
        'country',
        [sequelize.fn('COUNT', sequelize.col('id')), 'attempts'],
      ],
      where: {
        createdAt: { $gte: last24Hours },
        country: { $ne: null },
      },
      group: ['email', 'country'],
      having: sequelize.where(sequelize.fn('COUNT', sequelize.col('id')), '>', 3),
      raw: true,
    }) as any[];

    return {
      multipleFailedEmails,
      multipleFailedIPs,
      unusualLocations,
    };
  }
}

export default LoginAttempt;

export function initLoginAttempt(sequelize: Sequelize): typeof LoginAttempt {
  LoginAttempt.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      ipAddress: {
        type: DataTypes.INET,
        allowNull: false,
      },
      userAgent: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      success: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      failureReason: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      country: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      city: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      deviceFingerprint: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'LoginAttempt',
      tableName: 'LoginAttempts',
      timestamps: true,
      indexes: [
        {
          fields: ['email'],
        },
        {
          fields: ['ipAddress'],
        },
        {
          fields: ['success'],
        },
        {
          fields: ['createdAt'],
        },
        {
          fields: ['email', 'success', 'createdAt'],
        },
        {
          fields: ['ipAddress', 'createdAt'],
        },
      ],
    }
  );

  return LoginAttempt;
}