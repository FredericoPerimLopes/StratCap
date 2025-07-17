import { Model, DataTypes, Sequelize, Association } from 'sequelize';
import { User } from './User';

export interface PasswordResetTokenAttributes {
  id: string;
  userId: string;
  token: string; // Hashed token
  expiresAt: Date;
  used: boolean;
  usedAt?: Date;
  ipAddress?: string;
  userAgent?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PasswordResetTokenCreationAttributes extends Omit<PasswordResetTokenAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class PasswordResetToken extends Model<PasswordResetTokenAttributes, PasswordResetTokenCreationAttributes> implements PasswordResetTokenAttributes {
  public id!: string;
  public userId!: string;
  public token!: string;
  public expiresAt!: Date;
  public used!: boolean;
  public usedAt?: Date;
  public ipAddress?: string;
  public userAgent?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public user?: User;
  public static associations: {
    user: Association<PasswordResetToken, User>;
  };

  // Instance methods
  public isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  public isValid(): boolean {
    return !this.used && !this.isExpired();
  }

  public getMinutesUntilExpiry(): number {
    if (this.isExpired()) {
      return 0;
    }
    
    const now = new Date();
    const diffMs = this.expiresAt.getTime() - now.getTime();
    return Math.floor(diffMs / (1000 * 60));
  }

  public markAsUsed(ipAddress?: string, userAgent?: string): void {
    this.used = true;
    this.usedAt = new Date();
    if (ipAddress) this.ipAddress = ipAddress;
    if (userAgent) this.userAgent = userAgent;
  }
}

export default PasswordResetToken;

export function initPasswordResetToken(sequelize: Sequelize): typeof PasswordResetToken {
  PasswordResetToken.init(
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
      token: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      used: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      usedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      ipAddress: {
        type: DataTypes.INET,
        allowNull: true,
      },
      userAgent: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'PasswordResetToken',
      tableName: 'PasswordResetTokens',
      timestamps: true,
      indexes: [
        {
          fields: ['userId'],
        },
        {
          fields: ['token'],
          unique: true,
        },
        {
          fields: ['used'],
        },
        {
          fields: ['expiresAt'],
        },
        {
          fields: ['createdAt'],
        },
      ],
    }
  );

  return PasswordResetToken;
}