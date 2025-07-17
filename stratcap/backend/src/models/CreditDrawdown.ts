import { Model, DataTypes, Sequelize, Association } from 'sequelize';
import { CreditFacility } from './CreditFacility';
import { User } from './User';
import { Decimal } from 'decimal.js';

export interface CreditDrawdownAttributes {
  id: string;
  facilityId: string;
  requestedBy: string;
  approvedBy?: string;
  drawdownAmount: string; // Decimal as string
  requestDate: Date;
  approvalDate?: Date;
  fundingDate?: Date;
  purpose: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'approved' | 'rejected' | 'funded' | 'cancelled';
  approvalNotes?: string;
  rejectionReason?: string;
  fundingReference?: string; // Bank reference or wire confirmation
  interestStartDate?: Date;
  maturityDate?: Date; // For term portions
  interestRate?: string; // If different from facility rate
  fees: any; // JSON object for associated fees
  documents: string[]; // Array of document IDs
  complianceChecks: any; // JSON object for compliance validations
  borrowingBaseAtDrawdown?: string; // Borrowing base value at time of drawdown
  utilizationAfterDrawdown?: string; // Facility utilization after this drawdown
  relatedTransactions: string[]; // Related transaction IDs
  metadata: any; // Additional metadata
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreditDrawdownCreationAttributes extends Omit<CreditDrawdownAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class CreditDrawdown extends Model<CreditDrawdownAttributes, CreditDrawdownCreationAttributes> implements CreditDrawdownAttributes {
  public id!: string;
  public facilityId!: string;
  public requestedBy!: string;
  public approvedBy?: string;
  public drawdownAmount!: string;
  public requestDate!: Date;
  public approvalDate?: Date;
  public fundingDate?: Date;
  public purpose!: string;
  public priority!: 'low' | 'medium' | 'high' | 'urgent';
  public status!: 'pending' | 'approved' | 'rejected' | 'funded' | 'cancelled';
  public approvalNotes?: string;
  public rejectionReason?: string;
  public fundingReference?: string;
  public interestStartDate?: Date;
  public maturityDate?: Date;
  public interestRate?: string;
  public fees!: any;
  public documents!: string[];
  public complianceChecks!: any;
  public borrowingBaseAtDrawdown?: string;
  public utilizationAfterDrawdown?: string;
  public relatedTransactions!: string[];
  public metadata!: any;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public static associations: {
    facility: Association<CreditDrawdown, CreditFacility>;
    requestedByUser: Association<CreditDrawdown, User>;
    approvedByUser: Association<CreditDrawdown, User>;
  };

  // Helper methods for Decimal operations
  public getDrawdownAmountDecimal(): Decimal {
    return new Decimal(this.drawdownAmount);
  }

  public getInterestRateDecimal(): Decimal {
    return this.interestRate ? new Decimal(this.interestRate) : new Decimal(0);
  }

  public getBorrowingBaseAtDrawdownDecimal(): Decimal {
    return this.borrowingBaseAtDrawdown ? new Decimal(this.borrowingBaseAtDrawdown) : new Decimal(0);
  }

  public getUtilizationAfterDrawdownDecimal(): Decimal {
    return this.utilizationAfterDrawdown ? new Decimal(this.utilizationAfterDrawdown) : new Decimal(0);
  }

  // Business logic methods
  public canApprove(): boolean {
    return this.status === 'pending';
  }

  public canReject(): boolean {
    return this.status === 'pending';
  }

  public canFund(): boolean {
    return this.status === 'approved';
  }

  public canCancel(): boolean {
    return ['pending', 'approved'].includes(this.status);
  }

  public isOverdue(): boolean {
    if (this.status !== 'pending') {
      return false;
    }

    const today = new Date();
    const daysSinceRequest = Math.floor((today.getTime() - this.requestDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Define overdue thresholds based on priority
    const overdueThresholds: Record<string, number> = {
      urgent: 1,
      high: 2,
      medium: 3,
      low: 5,
    };

    return daysSinceRequest > overdueThresholds[this.priority];
  }

  public getDaysToFunding(): number | null {
    if (this.status !== 'approved' || !this.approvalDate) {
      return null;
    }

    // Standard funding timeline based on priority
    const fundingTimelines: Record<string, number> = {
      urgent: 1,
      high: 1,
      medium: 2,
      low: 3,
    };

    const fundingTimeline = fundingTimelines[this.priority];
    const targetFundingDate = new Date(this.approvalDate);
    targetFundingDate.setDate(targetFundingDate.getDate() + fundingTimeline);

    const today = new Date();
    return Math.ceil((targetFundingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  public calculateExpectedFees(): { commitment: Decimal; utilization: Decimal; arrangement: Decimal } {
    const fees = this.fees || {};

    return {
      commitment: fees.commitmentFee ? new Decimal(fees.commitmentFee) : new Decimal(0),
      utilization: fees.utilizationFee ? new Decimal(fees.utilizationFee) : new Decimal(0),
      arrangement: fees.arrangementFee ? new Decimal(fees.arrangementFee) : new Decimal(0),
    };
  }

  public hasRequiredDocuments(): boolean {
    const requiredDocs = this.complianceChecks?.requiredDocuments || [];
    return requiredDocs.every((docType: string) => 
      this.documents.some(doc => doc.includes(docType))
    );
  }

  public passesComplianceChecks(): boolean {
    const checks = this.complianceChecks || {};
    return Object.values(checks).every(check => check === true);
  }
}

export default CreditDrawdown;

export function initCreditDrawdown(sequelize: Sequelize): typeof CreditDrawdown {
  CreditDrawdown.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      facilityId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'CreditFacilities',
          key: 'id',
        },
      },
      requestedBy: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
      },
      approvedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id',
        },
      },
      drawdownAmount: {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: false,
        get() {
          const value = this.getDataValue('drawdownAmount');
          return value ? value.toString() : '0';
        },
      },
      requestDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      approvalDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      fundingDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      purpose: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      priority: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
        allowNull: false,
        defaultValue: 'medium',
      },
      status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected', 'funded', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
      },
      approvalNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      rejectionReason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      fundingReference: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      interestStartDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      maturityDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      interestRate: {
        type: DataTypes.DECIMAL(8, 4),
        allowNull: true,
        get() {
          const value = this.getDataValue('interestRate');
          return value ? value.toString() : null;
        },
      },
      fees: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      documents: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: [],
      },
      complianceChecks: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      borrowingBaseAtDrawdown: {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: true,
        get() {
          const value = this.getDataValue('borrowingBaseAtDrawdown');
          return value ? value.toString() : null;
        },
      },
      utilizationAfterDrawdown: {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: true,
        get() {
          const value = this.getDataValue('utilizationAfterDrawdown');
          return value ? value.toString() : null;
        },
      },
      relatedTransactions: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: [],
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
      },
    },
    {
      sequelize,
      modelName: 'CreditDrawdown',
      tableName: 'CreditDrawdowns',
      timestamps: true,
      indexes: [
        {
          fields: ['facilityId'],
        },
        {
          fields: ['status'],
        },
        {
          fields: ['priority'],
        },
        {
          fields: ['requestDate'],
        },
        {
          fields: ['requestedBy'],
        },
      ],
    }
  );

  return CreditDrawdown;
}