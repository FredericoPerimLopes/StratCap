import { Model, DataTypes, Sequelize, Association } from 'sequelize';
import { CreditFacility } from './CreditFacility';
import { User } from './User';
import { Decimal } from 'decimal.js';

export interface BorrowingBaseAttributes {
  id: string;
  facilityId: string;
  calculatedBy: string;
  approvedBy?: string;
  reportingDate: Date;
  calculationDate: Date;
  approvalDate?: Date;
  totalBorrowingBase: string; // Decimal as string
  eligibleAssets: string; // Total value of eligible assets
  ineligibleAssets: string; // Total value of ineligible assets
  advanceRate: string; // Percentage applied to eligible assets
  concentrationLimits: any; // JSON object for various concentration limits
  eligibilityTests: any; // JSON object for eligibility test results
  concentrationTests: any; // JSON object for concentration test results
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'expired';
  version: number; // Version number for tracking changes
  previousVersion?: string; // Reference to previous version
  nextReviewDate?: Date;
  assetDetails: any; // JSON object with detailed asset breakdown
  exceptions: any; // JSON object for any exceptions or adjustments
  complianceChecks: any; // JSON object for compliance validations
  certifications: any; // JSON object for required certifications
  documents: string[]; // Array of supporting document IDs
  auditTrail: any; // JSON object for audit trail
  notifications: any; // JSON object for notification settings
  metadata: any; // Additional metadata
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BorrowingBaseCreationAttributes extends Omit<BorrowingBaseAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class BorrowingBase extends Model<BorrowingBaseAttributes, BorrowingBaseCreationAttributes> implements BorrowingBaseAttributes {
  public id!: string;
  public facilityId!: string;
  public calculatedBy!: string;
  public approvedBy?: string;
  public reportingDate!: Date;
  public calculationDate!: Date;
  public approvalDate?: Date;
  public totalBorrowingBase!: string;
  public eligibleAssets!: string;
  public ineligibleAssets!: string;
  public advanceRate!: string;
  public concentrationLimits!: any;
  public eligibilityTests!: any;
  public concentrationTests!: any;
  public status!: 'draft' | 'submitted' | 'approved' | 'rejected' | 'expired';
  public version!: number;
  public previousVersion?: string;
  public nextReviewDate?: Date;
  public assetDetails!: any;
  public exceptions!: any;
  public complianceChecks!: any;
  public certifications!: any;
  public documents!: string[];
  public auditTrail!: any;
  public notifications!: any;
  public metadata!: any;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public static associations: {
    facility: Association<BorrowingBase, CreditFacility>;
    calculatedByUser: Association<BorrowingBase, User>;
    approvedByUser: Association<BorrowingBase, User>;
  };

  // Helper methods for Decimal operations
  public getTotalBorrowingBaseDecimal(): Decimal {
    return new Decimal(this.totalBorrowingBase);
  }

  public getEligibleAssetsDecimal(): Decimal {
    return new Decimal(this.eligibleAssets);
  }

  public getIneligibleAssetsDecimal(): Decimal {
    return new Decimal(this.ineligibleAssets);
  }

  public getAdvanceRateDecimal(): Decimal {
    return new Decimal(this.advanceRate);
  }

  // Business logic methods
  public canApprove(): boolean {
    return this.status === 'submitted' && this.passesAllTests();
  }

  public canReject(): boolean {
    return this.status === 'submitted';
  }

  public canSubmit(): boolean {
    return this.status === 'draft' && this.isComplete();
  }

  public isComplete(): boolean {
    return this.hasRequiredAssetDetails() && 
           this.hasPassedEligibilityTests() && 
           this.hasRequiredCertifications();
  }

  public passesAllTests(): boolean {
    return this.passesEligibilityTests() && this.passesConcentrationTests();
  }

  public passesEligibilityTests(): boolean {
    const tests = this.eligibilityTests || {};
    return Object.values(tests).every(test => test === true);
  }

  public passesConcentrationTests(): boolean {
    const tests = this.concentrationTests || {};
    return Object.values(tests).every((test: any) => test.status === 'passed');
  }

  public hasRequiredAssetDetails(): boolean {
    const assets = this.assetDetails || {};
    return assets.totalAssets && assets.breakdown && assets.valuationDate;
  }

  public hasPassedEligibilityTests(): boolean {
    const tests = this.eligibilityTests || {};
    const requiredTests = ['credit_quality', 'asset_type', 'maturity', 'geographic'];
    return requiredTests.every(test => tests[test] === true);
  }

  public hasRequiredCertifications(): boolean {
    const certs = this.certifications || {};
    return certs.portfolioManager && certs.compliance && certs.riskManagement;
  }

  public isExpired(): boolean {
    if (!this.nextReviewDate) {
      return false;
    }
    
    const today = new Date();
    return today > this.nextReviewDate;
  }

  public getDaysUntilExpiry(): number | null {
    if (!this.nextReviewDate) {
      return null;
    }

    const today = new Date();
    const daysUntil = Math.ceil((this.nextReviewDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil > 0 ? daysUntil : 0;
  }

  public calculateUtilizationPercentage(currentOutstanding: Decimal): Decimal {
    const borrowingBase = this.getTotalBorrowingBaseDecimal();
    if (borrowingBase.isZero()) {
      return new Decimal(0);
    }
    
    return currentOutstanding.dividedBy(borrowingBase).times(100);
  }

  public getAvailableCapacity(currentOutstanding: Decimal): Decimal {
    const borrowingBase = this.getTotalBorrowingBaseDecimal();
    return borrowingBase.minus(currentOutstanding);
  }

  public validateConcentrationLimits(): { passed: boolean; violations: any[] } {
    const limits = this.concentrationLimits || {};
    const assets = this.assetDetails || {};
    const violations = [];

    // Check industry concentration
    if (limits.industryLimit && assets.byIndustry) {
      for (const [industry, value] of Object.entries(assets.byIndustry)) {
        const percentage = new Decimal(value as string).dividedBy(this.getEligibleAssetsDecimal()).times(100);
        if (percentage.greaterThan(new Decimal(limits.industryLimit))) {
          violations.push({
            type: 'industry_concentration',
            industry,
            actual: percentage.toFixed(2),
            limit: limits.industryLimit,
          });
        }
      }
    }

    // Check geographic concentration
    if (limits.geographicLimit && assets.byGeography) {
      for (const [region, value] of Object.entries(assets.byGeography)) {
        const percentage = new Decimal(value as string).dividedBy(this.getEligibleAssetsDecimal()).times(100);
        if (percentage.greaterThan(new Decimal(limits.geographicLimit))) {
          violations.push({
            type: 'geographic_concentration',
            region,
            actual: percentage.toFixed(2),
            limit: limits.geographicLimit,
          });
        }
      }
    }

    // Check single obligor limit
    if (limits.singleObligorLimit && assets.byObligor) {
      for (const [obligor, value] of Object.entries(assets.byObligor)) {
        const percentage = new Decimal(value as string).dividedBy(this.getEligibleAssetsDecimal()).times(100);
        if (percentage.greaterThan(new Decimal(limits.singleObligorLimit))) {
          violations.push({
            type: 'single_obligor_concentration',
            obligor,
            actual: percentage.toFixed(2),
            limit: limits.singleObligorLimit,
          });
        }
      }
    }

    return {
      passed: violations.length === 0,
      violations,
    };
  }

  public generateSummaryReport() {
    const utilizationTests = this.validateConcentrationLimits();
    
    return {
      reportingDate: this.reportingDate,
      calculationDate: this.calculationDate,
      version: this.version,
      status: this.status,
      borrowingBase: {
        total: this.getTotalBorrowingBaseDecimal(),
        eligible: this.getEligibleAssetsDecimal(),
        ineligible: this.getIneligibleAssetsDecimal(),
        advanceRate: this.getAdvanceRateDecimal(),
      },
      tests: {
        eligibility: this.passesEligibilityTests(),
        concentration: this.passesConcentrationTests(),
        violations: utilizationTests.violations,
      },
      compliance: {
        complete: this.isComplete(),
        canApprove: this.canApprove(),
        expired: this.isExpired(),
        daysUntilExpiry: this.getDaysUntilExpiry(),
      },
    };
  }
}

export function initBorrowingBase(sequelize: Sequelize): typeof BorrowingBase {
  BorrowingBase.init(
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
      calculatedBy: {
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
      reportingDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      calculationDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      approvalDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      totalBorrowingBase: {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: false,
        get() {
          const value = this.getDataValue('totalBorrowingBase');
          return value ? value.toString() : '0';
        },
      },
      eligibleAssets: {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: false,
        get() {
          const value = this.getDataValue('eligibleAssets');
          return value ? value.toString() : '0';
        },
      },
      ineligibleAssets: {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: false,
        get() {
          const value = this.getDataValue('ineligibleAssets');
          return value ? value.toString() : '0';
        },
      },
      advanceRate: {
        type: DataTypes.DECIMAL(8, 4),
        allowNull: false,
        get() {
          const value = this.getDataValue('advanceRate');
          return value ? value.toString() : '0';
        },
      },
      concentrationLimits: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      eligibilityTests: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      concentrationTests: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      status: {
        type: DataTypes.ENUM('draft', 'submitted', 'approved', 'rejected', 'expired'),
        allowNull: false,
        defaultValue: 'draft',
      },
      version: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      previousVersion: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'BorrowingBases',
          key: 'id',
        },
      },
      nextReviewDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      assetDetails: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      exceptions: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      complianceChecks: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      certifications: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      documents: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: [],
      },
      auditTrail: {
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
      modelName: 'BorrowingBase',
      tableName: 'BorrowingBases',
      timestamps: true,
      indexes: [
        {
          fields: ['facilityId'],
        },
        {
          fields: ['status'],
        },
        {
          fields: ['reportingDate'],
        },
        {
          fields: ['version'],
        },
        {
          fields: ['nextReviewDate'],
        },
      ],
    }
  );

  return BorrowingBase;
}