import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db/database';

interface InvestorTransferAttributes {
  id: number;
  fundId: number;
  transferorId: number; // Original investor entity
  transfereeId?: number; // New investor entity (created during transfer)
  commitmentId: number;
  transferType: 'full' | 'partial';
  transferAmount?: string; // For partial transfers
  transferPercentage?: string; // For partial transfers
  transferDate: Date;
  effectiveDate: Date;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'completed' | 'rejected' | 'cancelled';
  currentStep: 'initiation' | 'transferee_details' | 'documentation' | 'review' | 'completion';
  
  // Transfer details
  transferReason?: string;
  pricePerUnit?: string;
  totalConsideration?: string;
  
  // Transferee information
  transfereeDetails?: Record<string, any>;
  kycDocuments?: Record<string, any>;
  amlDocuments?: Record<string, any>;
  
  // Legal documents
  transferAgreement?: Record<string, any>;
  consentDocuments?: Record<string, any>;
  otherDocuments?: Record<string, any>;
  
  // Workflow tracking
  submittedBy?: number;
  submittedAt?: Date;
  reviewedBy?: number;
  reviewedAt?: Date;
  approvedBy?: number;
  approvedAt?: Date;
  completedAt?: Date;
  rejectionReason?: string;
  
  // Notifications
  notificationsSent?: Record<string, any>;
  
  notes?: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

interface InvestorTransferCreationAttributes extends Optional<InvestorTransferAttributes, 'id' | 'status' | 'currentStep' | 'createdAt' | 'updatedAt'> {}

class InvestorTransfer extends Model<InvestorTransferAttributes, InvestorTransferCreationAttributes> implements InvestorTransferAttributes {
  public id!: number;
  public fundId!: number;
  public transferorId!: number;
  public transfereeId?: number;
  public commitmentId!: number;
  public transferType!: 'full' | 'partial';
  public transferAmount?: string;
  public transferPercentage?: string;
  public transferDate!: Date;
  public effectiveDate!: Date;
  public status!: 'draft' | 'submitted' | 'under_review' | 'approved' | 'completed' | 'rejected' | 'cancelled';
  public currentStep!: 'initiation' | 'transferee_details' | 'documentation' | 'review' | 'completion';
  
  public transferReason?: string;
  public pricePerUnit?: string;
  public totalConsideration?: string;
  
  public transfereeDetails?: Record<string, any>;
  public kycDocuments?: Record<string, any>;
  public amlDocuments?: Record<string, any>;
  
  public transferAgreement?: Record<string, any>;
  public consentDocuments?: Record<string, any>;
  public otherDocuments?: Record<string, any>;
  
  public submittedBy?: number;
  public submittedAt?: Date;
  public reviewedBy?: number;
  public reviewedAt?: Date;
  public approvedBy?: number;
  public approvedAt?: Date;
  public completedAt?: Date;
  public rejectionReason?: string;
  
  public notificationsSent?: Record<string, any>;
  
  public notes?: string;
  public metadata?: Record<string, any>;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  static associate(models: any) {
    InvestorTransfer.belongsTo(models.Fund, {
      foreignKey: 'fundId',
      as: 'fund',
    });
    InvestorTransfer.belongsTo(models.InvestorEntity, {
      foreignKey: 'transferorId',
      as: 'transferor',
    });
    InvestorTransfer.belongsTo(models.InvestorEntity, {
      foreignKey: 'transfereeId',
      as: 'transferee',
    });
    InvestorTransfer.belongsTo(models.Commitment, {
      foreignKey: 'commitmentId',
      as: 'commitment',
    });
    InvestorTransfer.belongsTo(models.User, {
      foreignKey: 'submittedBy',
      as: 'submitter',
    });
    InvestorTransfer.belongsTo(models.User, {
      foreignKey: 'reviewedBy',
      as: 'reviewer',
    });
    InvestorTransfer.belongsTo(models.User, {
      foreignKey: 'approvedBy',
      as: 'approver',
    });
  }
}

InvestorTransfer.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    fundId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'funds',
        key: 'id',
      },
    },
    transferorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'investor_entities',
        key: 'id',
      },
    },
    transfereeId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'investor_entities',
        key: 'id',
      },
    },
    commitmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'commitments',
        key: 'id',
      },
    },
    transferType: {
      type: DataTypes.ENUM('full', 'partial'),
      allowNull: false,
    },
    transferAmount: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: true,
      get() {
        const value = this.getDataValue('transferAmount');
        return value ? value.toString() : null;
      },
    },
    transferPercentage: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: true,
      get() {
        const value = this.getDataValue('transferPercentage');
        return value ? value.toString() : null;
      },
    },
    transferDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    effectiveDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('draft', 'submitted', 'under_review', 'approved', 'completed', 'rejected', 'cancelled'),
      defaultValue: 'draft',
    },
    currentStep: {
      type: DataTypes.ENUM('initiation', 'transferee_details', 'documentation', 'review', 'completion'),
      defaultValue: 'initiation',
    },
    transferReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    pricePerUnit: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: true,
      get() {
        const value = this.getDataValue('pricePerUnit');
        return value ? value.toString() : null;
      },
    },
    totalConsideration: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: true,
      get() {
        const value = this.getDataValue('totalConsideration');
        return value ? value.toString() : null;
      },
    },
    transfereeDetails: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    kycDocuments: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    amlDocuments: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    transferAgreement: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    consentDocuments: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    otherDocuments: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    submittedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    reviewedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    approvedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    notificationsSent: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
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
    modelName: 'InvestorTransfer',
    tableName: 'investor_transfers',
    indexes: [
      {
        fields: ['fund_id'],
      },
      {
        fields: ['transferor_id'],
      },
      {
        fields: ['transferee_id'],
      },
      {
        fields: ['commitment_id'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['current_step'],
      },
    ],
  }
);

export default InvestorTransfer;
export { InvestorTransfer };