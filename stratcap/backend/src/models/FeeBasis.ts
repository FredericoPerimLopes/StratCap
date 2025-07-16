import { DataTypes, Model, Optional, Op } from 'sequelize';
import sequelize from '../db/database';
import { Decimal } from 'decimal.js';

interface FeeBasisAttributes {
  id: number;
  fundId: number;
  asOfDate: Date;
  basisType: 'nav' | 'commitments' | 'invested_capital' | 'distributions';
  totalBasisAmount: string; // Using string for Decimal
  adjustedBasisAmount: string; // After adjustments for fee calculations
  currency: string;
  isSnapshot: boolean; // True for historical snapshots
  adjustments?: Record<string, any>; // Track basis adjustments
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

interface FeeBasisCreationAttributes extends Optional<FeeBasisAttributes, 'id' | 'adjustedBasisAmount' | 'isSnapshot' | 'createdAt' | 'updatedAt'> {}

class FeeBasis extends Model<FeeBasisAttributes, FeeBasisCreationAttributes> implements FeeBasisAttributes {
  public id!: number;
  public fundId!: number;
  public asOfDate!: Date;
  public basisType!: 'nav' | 'commitments' | 'invested_capital' | 'distributions';
  public totalBasisAmount!: string;
  public adjustedBasisAmount!: string;
  public currency!: string;
  public isSnapshot!: boolean;
  public adjustments?: Record<string, any>;
  public metadata?: Record<string, any>;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Virtual getters for Decimal values
  get totalBasisAmountDecimal(): Decimal {
    return new Decimal(this.totalBasisAmount);
  }

  get adjustedBasisAmountDecimal(): Decimal {
    return new Decimal(this.adjustedBasisAmount);
  }

  // Associations
  static associate(models: any) {
    FeeBasis.belongsTo(models.Fund, {
      foreignKey: 'fundId',
      as: 'fund',
    });
  }

  // Methods
  public addAdjustment(adjustmentType: string, amount: string, description: string): void {
    if (!this.adjustments) {
      this.adjustments = {};
    }

    if (!this.adjustments[adjustmentType]) {
      this.adjustments[adjustmentType] = [];
    }

    this.adjustments[adjustmentType].push({
      amount,
      description,
      timestamp: new Date().toISOString(),
    });

    // Recalculate adjusted basis amount
    this.recalculateAdjustedBasis();
  }

  private recalculateAdjustedBasis(): void {
    let adjustedAmount = this.totalBasisAmountDecimal;

    if (this.adjustments) {
      Object.keys(this.adjustments).forEach(adjustmentType => {
        this.adjustments![adjustmentType].forEach((adjustment: any) => {
          const adjustmentAmount = new Decimal(adjustment.amount);
          
          // Positive adjustments increase basis, negative decrease
          if (adjustmentType === 'increase') {
            adjustedAmount = adjustedAmount.plus(adjustmentAmount);
          } else if (adjustmentType === 'decrease') {
            adjustedAmount = adjustedAmount.minus(adjustmentAmount);
          }
        });
      });
    }

    this.adjustedBasisAmount = adjustedAmount.toString();
  }

  public static async getLatestBasis(
    fundId: number, 
    basisType: 'nav' | 'commitments' | 'invested_capital' | 'distributions',
    asOfDate?: Date
  ): Promise<FeeBasis | null> {
    const whereClause: any = {
      fundId,
      basisType,
    };

    if (asOfDate) {
      whereClause.asOfDate = {
        [Op.lte]: asOfDate,
      };
    }

    return await FeeBasis.findOne({
      where: whereClause,
      order: [['as_of_date', 'DESC']],
    });
  }

  public static async createSnapshot(
    fundId: number,
    asOfDate: Date,
    basisData: { [key: string]: string },
    currency: string = 'USD'
  ): Promise<FeeBasis[]> {
    const snapshots: FeeBasis[] = [];

    const basisTypes: Array<'nav' | 'commitments' | 'invested_capital' | 'distributions'> = 
      ['nav', 'commitments', 'invested_capital', 'distributions'];

    for (const basisType of basisTypes) {
      if (basisData[basisType]) {
        const snapshot = await FeeBasis.create({
          fundId,
          asOfDate,
          basisType,
          totalBasisAmount: basisData[basisType],
          adjustedBasisAmount: basisData[basisType],
          currency,
          isSnapshot: true,
        });
        snapshots.push(snapshot);
      }
    }

    return snapshots;
  }
}

FeeBasis.init(
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
    asOfDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    basisType: {
      type: DataTypes.ENUM('nav', 'commitments', 'invested_capital', 'distributions'),
      allowNull: false,
    },
    totalBasisAmount: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false,
      get() {
        const value = this.getDataValue('totalBasisAmount');
        return value ? value.toString() : '0';
      },
    },
    adjustedBasisAmount: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false,
      get() {
        const value = this.getDataValue('adjustedBasisAmount');
        return value ? value.toString() : '0';
      },
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'USD',
    },
    isSnapshot: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    adjustments: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
  },
  {
    sequelize,
    modelName: 'FeeBasis',
    tableName: 'fee_basis',
    hooks: {
      beforeCreate: (basis: FeeBasis) => {
        if (!basis.adjustedBasisAmount) {
          basis.adjustedBasisAmount = basis.totalBasisAmount;
        }
      },
    },
    indexes: [
      {
        unique: true,
        fields: ['fund_id', 'basis_type', 'as_of_date'],
      },
      {
        fields: ['as_of_date'],
      },
      {
        fields: ['is_snapshot'],
      },
    ],
  }
);

export default FeeBasis;