import { Model, DataTypes, Sequelize, Association } from 'sequelize';
import { Fund } from './Fund';
import { Decimal } from 'decimal.js';

export interface CreditFacilityAttributes {
  id: string;
  fundId: string;
  facilityName: string;
  lender: string;
  facilityType: 'revolving' | 'term_loan' | 'bridge' | 'subscription_line';
  totalCommitment: string; // Decimal as string
  outstandingBalance: string; // Decimal as string
  availableAmount: string; // Decimal as string
  interestRate: string; // Decimal as string (annual percentage)
  rateType: 'fixed' | 'floating';
  benchmarkRate?: string; // For floating rates (e.g., LIBOR, SOFR)
  margin?: string; // Spread over benchmark for floating rates
  commitmentFeeRate?: string; // Fee on unused commitment
  utilizationFeeRate?: string; // Fee on utilized amount
  maturityDate: Date;
  effectiveDate: Date;
  terminationDate?: Date;
  facilityStatus: 'active' | 'terminated' | 'matured' | 'suspended';
  borrowingBaseRequired: boolean;
  borrowingBaseLimit?: string; // Maximum based on borrowing base
  covenants: any; // JSON object for financial covenants
  securityInterest: any; // JSON object for collateral details
  guarantors: string[]; // Array of guarantor entity IDs
  keyTerms: any; // JSON object for other key terms
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreditFacilityCreationAttributes extends Omit<CreditFacilityAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class CreditFacility extends Model<CreditFacilityAttributes, CreditFacilityCreationAttributes> implements CreditFacilityAttributes {
  public id!: string;
  public fundId!: string;
  public facilityName!: string;
  public lender!: string;
  public facilityType!: 'revolving' | 'term_loan' | 'bridge' | 'subscription_line';
  public totalCommitment!: string;
  public outstandingBalance!: string;
  public availableAmount!: string;
  public interestRate!: string;
  public rateType!: 'fixed' | 'floating';
  public benchmarkRate?: string;
  public margin?: string;
  public commitmentFeeRate?: string;
  public utilizationFeeRate?: string;
  public maturityDate!: Date;
  public effectiveDate!: Date;
  public terminationDate?: Date;
  public facilityStatus!: 'active' | 'terminated' | 'matured' | 'suspended';
  public borrowingBaseRequired!: boolean;
  public borrowingBaseLimit?: string;
  public covenants!: any;
  public securityInterest!: any;
  public guarantors!: string[];
  public keyTerms!: any;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public static associations: {
    fund: Association<CreditFacility, Fund>;
  };

  // Helper methods for Decimal operations
  public getTotalCommitmentDecimal(): Decimal {
    return new Decimal(this.totalCommitment);
  }

  public getOutstandingBalanceDecimal(): Decimal {
    return new Decimal(this.outstandingBalance);
  }

  public getAvailableAmountDecimal(): Decimal {
    return new Decimal(this.availableAmount);
  }

  public getInterestRateDecimal(): Decimal {
    return new Decimal(this.interestRate);
  }

  public getCommitmentFeeRateDecimal(): Decimal {
    return this.commitmentFeeRate ? new Decimal(this.commitmentFeeRate) : new Decimal(0);
  }

  public getUtilizationFeeRateDecimal(): Decimal {
    return this.utilizationFeeRate ? new Decimal(this.utilizationFeeRate) : new Decimal(0);
  }

  public getBorrowingBaseLimitDecimal(): Decimal {
    return this.borrowingBaseLimit ? new Decimal(this.borrowingBaseLimit) : new Decimal(0);
  }

  // Business logic methods
  public canDrawdown(requestedAmount: Decimal): boolean {
    const available = this.getAvailableAmountDecimal();
    const borrowingBaseLimit = this.getBorrowingBaseLimitDecimal();
    
    if (this.facilityStatus !== 'active') {
      return false;
    }

    if (requestedAmount.greaterThan(available)) {
      return false;
    }

    if (this.borrowingBaseRequired && borrowingBaseLimit.greaterThan(0)) {
      const newOutstanding = this.getOutstandingBalanceDecimal().plus(requestedAmount);
      return newOutstanding.lessThanOrEqualTo(borrowingBaseLimit);
    }

    return true;
  }

  public canPaydown(paymentAmount: Decimal): boolean {
    return this.facilityStatus === 'active' && 
           paymentAmount.lessThanOrEqualTo(this.getOutstandingBalanceDecimal());
  }

  public calculateDailyInterest(_date: Date = new Date()): Decimal {
    const principal = this.getOutstandingBalanceDecimal();
    const annualRate = this.getInterestRateDecimal().dividedBy(100);
    const dailyRate = annualRate.dividedBy(365);
    
    return principal.times(dailyRate);
  }

  public calculateCommitmentFee(_date: Date = new Date()): Decimal {
    if (!this.commitmentFeeRate) {
      return new Decimal(0);
    }

    const unusedCommitment = this.getTotalCommitmentDecimal().minus(this.getOutstandingBalanceDecimal());
    const annualRate = this.getCommitmentFeeRateDecimal().dividedBy(100);
    const dailyRate = annualRate.dividedBy(365);
    
    return unusedCommitment.times(dailyRate);
  }

  public isNearMaturity(daysThreshold: number = 30): boolean {
    const today = new Date();
    const daysToMaturity = Math.ceil((this.maturityDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysToMaturity <= daysThreshold && daysToMaturity > 0;
  }

  public isOverdue(): boolean {
    const today = new Date();
    return this.maturityDate < today && this.facilityStatus === 'active';
  }
}

export default CreditFacility;

export function initCreditFacility(sequelize: Sequelize): typeof CreditFacility {
  CreditFacility.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      fundId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Funds',
          key: 'id',
        },
      },
      facilityName: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      lender: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      facilityType: {
        type: DataTypes.ENUM('revolving', 'term_loan', 'bridge', 'subscription_line'),
        allowNull: false,
      },
      totalCommitment: {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: false,
        get() {
          const value = this.getDataValue('totalCommitment');
          return value ? value.toString() : '0';
        },
      },
      outstandingBalance: {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: false,
        defaultValue: '0.00',
        get() {
          const value = this.getDataValue('outstandingBalance');
          return value ? value.toString() : '0';
        },
      },
      availableAmount: {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: false,
        get() {
          const value = this.getDataValue('availableAmount');
          return value ? value.toString() : '0';
        },
      },
      interestRate: {
        type: DataTypes.DECIMAL(8, 4),
        allowNull: false,
        get() {
          const value = this.getDataValue('interestRate');
          return value ? value.toString() : '0';
        },
      },
      rateType: {
        type: DataTypes.ENUM('fixed', 'floating'),
        allowNull: false,
      },
      benchmarkRate: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      margin: {
        type: DataTypes.DECIMAL(8, 4),
        allowNull: true,
        get() {
          const value = this.getDataValue('margin');
          return value ? value.toString() : null;
        },
      },
      commitmentFeeRate: {
        type: DataTypes.DECIMAL(8, 4),
        allowNull: true,
        get() {
          const value = this.getDataValue('commitmentFeeRate');
          return value ? value.toString() : null;
        },
      },
      utilizationFeeRate: {
        type: DataTypes.DECIMAL(8, 4),
        allowNull: true,
        get() {
          const value = this.getDataValue('utilizationFeeRate');
          return value ? value.toString() : null;
        },
      },
      maturityDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      effectiveDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      terminationDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      facilityStatus: {
        type: DataTypes.ENUM('active', 'terminated', 'matured', 'suspended'),
        allowNull: false,
        defaultValue: 'active',
      },
      borrowingBaseRequired: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      borrowingBaseLimit: {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: true,
        get() {
          const value = this.getDataValue('borrowingBaseLimit');
          return value ? value.toString() : null;
        },
      },
      covenants: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      securityInterest: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      guarantors: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: [],
      },
      keyTerms: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
      },
    },
    {
      sequelize,
      modelName: 'CreditFacility',
      tableName: 'CreditFacilities',
      timestamps: true,
      indexes: [
        {
          fields: ['fundId'],
        },
        {
          fields: ['facilityStatus'],
        },
        {
          fields: ['maturityDate'],
        },
        {
          fields: ['lender'],
        },
      ],
    }
  );

  return CreditFacility;
}