import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db/database';
import { encryptedField, hashForSearch } from '../utils/encryption';

/**
 * Enhanced InvestorEntity model with field-level encryption for sensitive data
 */

interface InvestorEntityAttributes {
  id: number;
  name: string;
  legalName: string;
  type: 'individual' | 'institution' | 'fund' | 'trust' | 'other';
  entityType?: string;
  taxId?: string; // Encrypted
  taxIdHash?: string; // For searching
  registrationNumber?: string; // Encrypted
  registrationNumberHash?: string; // For searching
  domicile: string;
  taxResidence?: string;
  accreditedInvestor: boolean;
  qualifiedPurchaser: boolean;
  address?: string; // Encrypted
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  primaryContact?: string;
  primaryEmail?: string;
  primaryPhone?: string; // Encrypted
  bankAccountNumber?: string; // Encrypted
  bankAccountNumberHash?: string; // For searching
  bankRoutingNumber?: string; // Encrypted
  bankName?: string;
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

class InvestorEntitySecure extends Model<InvestorEntityAttributes, InvestorEntityCreationAttributes> implements InvestorEntityAttributes {
  public id!: number;
  public name!: string;
  public legalName!: string;
  public type!: 'individual' | 'institution' | 'fund' | 'trust' | 'other';
  public entityType?: string;
  public taxId?: string;
  public taxIdHash?: string;
  public registrationNumber?: string;
  public registrationNumberHash?: string;
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
  public bankAccountNumber?: string;
  public bankAccountNumberHash?: string;
  public bankRoutingNumber?: string;
  public bankName?: string;
  public kycStatus!: 'pending' | 'approved' | 'rejected' | 'expired';
  public kycDate?: Date;
  public amlStatus!: 'pending' | 'approved' | 'rejected' | 'expired';
  public amlDate?: Date;
  public notes?: string;
  public metadata?: Record<string, any>;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Helper method to search by encrypted field
  static async findByTaxId(taxId: string): Promise<InvestorEntitySecure | null> {
    const hash = hashForSearch(taxId);
    return this.findOne({ where: { taxIdHash: hash } });
  }

  static async findByBankAccount(accountNumber: string): Promise<InvestorEntitySecure | null> {
    const hash = hashForSearch(accountNumber);
    return this.findOne({ where: { bankAccountNumberHash: hash } });
  }
}

InvestorEntitySecure.init(
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
    // Encrypted tax ID with searchable hash
    taxId: encryptedField('taxId'),
    taxIdHash: {
      type: DataTypes.STRING(64),
      allowNull: true,
      unique: true,
    },
    // Encrypted registration number with searchable hash
    registrationNumber: encryptedField('registrationNumber'),
    registrationNumberHash: {
      type: DataTypes.STRING(64),
      allowNull: true,
      unique: true,
    },
    domicile: {
      type: DataTypes.STRING(2),
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
    // Encrypted address
    address: encryptedField('address'),
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
    // Encrypted phone number
    primaryPhone: encryptedField('primaryPhone'),
    // Encrypted banking information
    bankAccountNumber: encryptedField('bankAccountNumber'),
    bankAccountNumberHash: {
      type: DataTypes.STRING(64),
      allowNull: true,
      unique: true,
    },
    bankRoutingNumber: encryptedField('bankRoutingNumber'),
    bankName: {
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
    },
  },
  {
    sequelize,
    modelName: 'InvestorEntitySecure',
    tableName: 'InvestorEntities',
    timestamps: true,
    hooks: {
      // Generate search hashes before validation
      beforeValidate: (investor: InvestorEntitySecure) => {
        if (investor.taxId) {
          investor.taxIdHash = hashForSearch(investor.taxId);
        }
        if (investor.registrationNumber) {
          investor.registrationNumberHash = hashForSearch(investor.registrationNumber);
        }
        if (investor.bankAccountNumber) {
          investor.bankAccountNumberHash = hashForSearch(investor.bankAccountNumber);
        }
      },
      // Log sensitive data access
      afterFind: async (investors: InvestorEntitySecure | InvestorEntitySecure[] | null) => {
        if (!investors) return;
        
        const logAccess = (investor: InvestorEntitySecure) => {
          if (investor.taxId || investor.bankAccountNumber) {
            console.log(`Sensitive data accessed for investor ${investor.id} at ${new Date().toISOString()}`);
            // In production, this would log to secure audit system
          }
        };

        if (Array.isArray(investors)) {
          investors.forEach(logAccess);
        } else {
          logAccess(investors);
        }
      },
    },
  }
);

export default InvestorEntitySecure;