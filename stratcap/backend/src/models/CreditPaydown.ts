import { Model, DataTypes, Sequelize, Association } from 'sequelize';
import { CreditFacility } from './CreditFacility';
import { User } from './User';
import { Decimal } from 'decimal.js';

export interface CreditPaydownAttributes {
  id: string;
  facilityId: string;
  initiatedBy: string;
  processedBy?: string;
  paydownAmount: string; // Decimal as string
  principalAmount: string; // Portion going to principal
  interestAmount: string; // Portion going to interest
  feesAmount: string; // Portion going to fees
  paymentDate: Date;
  initiatedDate: Date;
  processedDate?: Date;
  paydownType: 'scheduled' | 'voluntary' | 'mandatory' | 'prepayment';
  paymentMethod: 'wire' | 'ach' | 'check' | 'internal_transfer';
  paymentReference?: string; // Bank reference or confirmation number
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  failureReason?: string;
  reversalReference?: string; // If payment needs to be reversed
  purpose?: string; // Reason for paydown
  prepaymentPenalty?: string; // Any prepayment penalty applied
  outstandingAfterPaydown?: string; // Outstanding balance after this paydown
  availableAfterPaydown?: string; // Available amount after this paydown
  allocations: any; // JSON object for payment allocations breakdown
  accountingEntries: any; // JSON object for GL postings
  documents: string[]; // Array of related document IDs
  approvals: any; // JSON object for required approvals
  notifications: any; // JSON object for notification settings
  metadata: any; // Additional metadata
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreditPaydownCreationAttributes extends Omit<CreditPaydownAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class CreditPaydown extends Model<CreditPaydownAttributes, CreditPaydownCreationAttributes> implements CreditPaydownAttributes {
  public id!: string;
  public facilityId!: string;
  public initiatedBy!: string;
  public processedBy?: string;
  public paydownAmount!: string;
  public principalAmount!: string;
  public interestAmount!: string;
  public feesAmount!: string;
  public paymentDate!: Date;
  public initiatedDate!: Date;
  public processedDate?: Date;
  public paydownType!: 'scheduled' | 'voluntary' | 'mandatory' | 'prepayment';
  public paymentMethod!: 'wire' | 'ach' | 'check' | 'internal_transfer';
  public paymentReference?: string;
  public status!: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  public failureReason?: string;
  public reversalReference?: string;
  public purpose?: string;
  public prepaymentPenalty?: string;
  public outstandingAfterPaydown?: string;
  public availableAfterPaydown?: string;
  public allocations!: any;
  public accountingEntries!: any;
  public documents!: string[];
  public approvals!: any;
  public notifications!: any;
  public metadata!: any;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public static associations: {
    facility: Association<CreditPaydown, CreditFacility>;
    initiatedByUser: Association<CreditPaydown, User>;
    processedByUser: Association<CreditPaydown, User>;
  };

  // Helper methods for Decimal operations
  public getPaydownAmountDecimal(): Decimal {
    return new Decimal(this.paydownAmount);
  }

  public getPrincipalAmountDecimal(): Decimal {
    return new Decimal(this.principalAmount);
  }

  public getInterestAmountDecimal(): Decimal {
    return new Decimal(this.interestAmount);
  }

  public getFeesAmountDecimal(): Decimal {
    return new Decimal(this.feesAmount);
  }

  public getPrepaymentPenaltyDecimal(): Decimal {
    return this.prepaymentPenalty ? new Decimal(this.prepaymentPenalty) : new Decimal(0);
  }

  public getOutstandingAfterPaydownDecimal(): Decimal {
    return this.outstandingAfterPaydown ? new Decimal(this.outstandingAfterPaydown) : new Decimal(0);
  }

  public getAvailableAfterPaydownDecimal(): Decimal {
    return this.availableAfterPaydown ? new Decimal(this.availableAfterPaydown) : new Decimal(0);
  }

  // Business logic methods
  public canProcess(): boolean {
    return this.status === 'pending' && this.hasRequiredApprovals();
  }

  public canCancel(): boolean {
    return ['pending'].includes(this.status);
  }

  public canReverse(): boolean {
    return this.status === 'completed' && this.isReversible();
  }

  public isReversible(): boolean {
    // Check if paydown can be reversed based on timing and facility status
    const today = new Date();
    const daysSinceProcessed = this.processedDate 
      ? Math.floor((today.getTime() - this.processedDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    
    // Generally allow reversals within 5 business days
    return daysSinceProcessed <= 5;
  }

  public hasRequiredApprovals(): boolean {
    const approvals = this.approvals || {};
    const requiredApprovals = approvals.required || [];
    const completedApprovals = approvals.completed || [];
    
    return requiredApprovals.every((approval: string) => 
      completedApprovals.includes(approval)
    );
  }

  public validatePaymentAllocation(): boolean {
    const principal = this.getPrincipalAmountDecimal();
    const interest = this.getInterestAmountDecimal();
    const fees = this.getFeesAmountDecimal();
    const total = principal.plus(interest).plus(fees);
    
    return total.equals(this.getPaydownAmountDecimal());
  }

  public isOverdue(): boolean {
    if (this.status !== 'pending') {
      return false;
    }

    const today = new Date();
    const scheduledDate = this.paymentDate;
    
    return today > scheduledDate;
  }

  public getDaysOverdue(): number {
    if (!this.isOverdue()) {
      return 0;
    }

    const today = new Date();
    return Math.floor((today.getTime() - this.paymentDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  public calculateNewFacilityBalances(currentOutstanding: Decimal, _currentAvailable: Decimal, totalCommitment: Decimal) {
    const principalReduction = this.getPrincipalAmountDecimal();
    const newOutstanding = currentOutstanding.minus(principalReduction);
    const newAvailable = totalCommitment.minus(newOutstanding);

    return {
      outstanding: newOutstanding,
      available: newAvailable,
    };
  }

  public generateAccountingEntries(facilityData: any) {
    const principal = this.getPrincipalAmountDecimal();
    const interest = this.getInterestAmountDecimal();
    const fees = this.getFeesAmountDecimal();

    return {
      entries: [
        {
          account: 'Cash',
          debit: this.getPaydownAmountDecimal(),
          credit: new Decimal(0),
          description: `Credit facility paydown - ${this.paymentReference}`,
        },
        {
          account: 'Credit Facility Payable',
          debit: new Decimal(0),
          credit: principal,
          description: `Principal paydown - Facility ${facilityData.facilityName}`,
        },
        {
          account: 'Interest Expense',
          debit: new Decimal(0),
          credit: interest,
          description: `Interest payment - Facility ${facilityData.facilityName}`,
        },
        {
          account: 'Fee Expense',
          debit: new Decimal(0),
          credit: fees,
          description: `Fee payment - Facility ${facilityData.facilityName}`,
        },
      ],
    };
  }

  public getPaymentSummary() {
    return {
      totalPayment: this.getPaydownAmountDecimal(),
      breakdown: {
        principal: this.getPrincipalAmountDecimal(),
        interest: this.getInterestAmountDecimal(),
        fees: this.getFeesAmountDecimal(),
        penalty: this.getPrepaymentPenaltyDecimal(),
      },
      newBalances: {
        outstanding: this.getOutstandingAfterPaydownDecimal(),
        available: this.getAvailableAfterPaydownDecimal(),
      },
    };
  }
}

export default CreditPaydown;

export function initCreditPaydown(sequelize: Sequelize): typeof CreditPaydown {
  CreditPaydown.init(
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
      initiatedBy: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
      },
      processedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id',
        },
      },
      paydownAmount: {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: false,
        get() {
          const value = this.getDataValue('paydownAmount');
          return value ? value.toString() : '0';
        },
      },
      principalAmount: {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: false,
        get() {
          const value = this.getDataValue('principalAmount');
          return value ? value.toString() : '0';
        },
      },
      interestAmount: {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: false,
        get() {
          const value = this.getDataValue('interestAmount');
          return value ? value.toString() : '0';
        },
      },
      feesAmount: {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: false,
        get() {
          const value = this.getDataValue('feesAmount');
          return value ? value.toString() : '0';
        },
      },
      paymentDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      initiatedDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      processedDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      paydownType: {
        type: DataTypes.ENUM('scheduled', 'voluntary', 'mandatory', 'prepayment'),
        allowNull: false,
      },
      paymentMethod: {
        type: DataTypes.ENUM('wire', 'ach', 'check', 'internal_transfer'),
        allowNull: false,
      },
      paymentReference: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
      },
      failureReason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      reversalReference: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      purpose: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      prepaymentPenalty: {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: true,
        get() {
          const value = this.getDataValue('prepaymentPenalty');
          return value ? value.toString() : null;
        },
      },
      outstandingAfterPaydown: {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: true,
        get() {
          const value = this.getDataValue('outstandingAfterPaydown');
          return value ? value.toString() : null;
        },
      },
      availableAfterPaydown: {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: true,
        get() {
          const value = this.getDataValue('availableAfterPaydown');
          return value ? value.toString() : null;
        },
      },
      allocations: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      accountingEntries: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      documents: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: [],
      },
      approvals: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      notifications: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
      },
    },
    {
      sequelize,
      modelName: 'CreditPaydown',
      tableName: 'CreditPaydowns',
      timestamps: true,
      indexes: [
        {
          fields: ['facilityId'],
        },
        {
          fields: ['status'],
        },
        {
          fields: ['paydownType'],
        },
        {
          fields: ['paymentDate'],
        },
        {
          fields: ['initiatedBy'],
        },
      ],
    }
  );

  return CreditPaydown;
}