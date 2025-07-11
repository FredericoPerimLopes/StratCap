import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db/database';

interface InvestorEntityAttributes {
  id: number;
  name: string;
  legalName: string;
  type: 'individual' | 'institution' | 'fund' | 'trust' | 'other';
  entityType?: string; // More specific type (e.g., 'pension fund', 'endowment')
  taxId?: string;
  registrationNumber?: string;
  domicile: string; // Country code
  taxResidence?: string;
  accreditedInvestor: boolean;
  qualifiedPurchaser: boolean;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  primaryContact?: string;
  primaryEmail?: string;
  primaryPhone?: string;
  kycStatus: 'pending' | 'approved' | 'rejected' | 'expired';
  kycDate?: Date;
  amlStatus: 'pending' | 'approved' | 'rejected' | 'expired';
  amlDate?: Date;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

interface InvestorEntityCreationAttributes extends Optional<InvestorEntityAttributes, 'id' | 'accreditedInvestor' | 'qualifiedPurchaser' | 'kycStatus' | 'amlStatus' | 'createdAt' | 'updatedAt'> {}

class InvestorEntity extends Model<InvestorEntityAttributes, InvestorEntityCreationAttributes> implements InvestorEntityAttributes {
  public id!: number;
  public name!: string;
  public legalName!: string;
  public type!: 'individual' | 'institution' | 'fund' | 'trust' | 'other';
  public entityType?: string;
  public taxId?: string;
  public registrationNumber?: string;
  public domicile!: string;
  public taxResidence?: string;
  public accreditedInvestor!: boolean;
  public qualifiedPurchaser!: boolean;
  public address?: string;
  public city?: string;
  public state?: string;
  public postalCode?: string;
  public country?: string;
  public primaryContact?: string;
  public primaryEmail?: string;
  public primaryPhone?: string;
  public kycStatus!: 'pending' | 'approved' | 'rejected' | 'expired';
  public kycDate?: Date;
  public amlStatus!: 'pending' | 'approved' | 'rejected' | 'expired';
  public amlDate?: Date;
  public notes?: string;
  public metadata?: Record<string, any>;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  static associate(models: any) {
    InvestorEntity.hasMany(models.Commitment, {
      foreignKey: 'investorEntityId',
      as: 'commitments',
    });
  }
}

InvestorEntity.init(
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
    legalName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('individual', 'institution', 'fund', 'trust', 'other'),
      allowNull: false,
    },
    entityType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    taxId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    registrationNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    domicile: {
      type: DataTypes.STRING(2), // Country code
      allowNull: false,
    },
    taxResidence: {
      type: DataTypes.STRING(2),
      allowNull: true,
    },
    accreditedInvestor: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    qualifiedPurchaser: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    postalCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    primaryContact: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    primaryEmail: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    primaryPhone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    kycStatus: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'expired'),
      defaultValue: 'pending',
    },
    kycDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    amlStatus: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'expired'),
      defaultValue: 'pending',
    },
    amlDate: {
      type: DataTypes.DATE,
      allowNull: true,
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
    modelName: 'InvestorEntity',
    tableName: 'investor_entities',
    indexes: [
      {
        fields: ['name'],
      },
      {
        fields: ['tax_id'],
      },
    ],
  }
);

export default InvestorEntity;