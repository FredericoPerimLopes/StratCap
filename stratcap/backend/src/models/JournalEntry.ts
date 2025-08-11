import { Model, DataTypes, Optional } from 'sequelize';
import { Decimal } from 'decimal.js';
import sequelize from '../db/database';
import { GLAccount } from './GLAccount';

export interface JournalEntryAttributes {
  id: number;
  entryNumber: string;
  entryDate: Date;
  description: string;
  reference?: string;
  sourceType: 'manual' | 'automated' | 'import' | 'closing' | 'adjustment';
  sourceId?: string;
  status: 'draft' | 'posted' | 'reversed';
  reversalId?: number;
  totalDebitAmount: string; // Stored as string for Decimal precision
  totalCreditAmount: string;
  fundId?: number;
  createdBy: number;
  postedBy?: number;
  postedAt?: Date;
  reversedBy?: number;
  reversedAt?: Date;
  reversalReason?: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

interface JournalEntryCreationAttributes extends Optional<JournalEntryAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class JournalEntry extends Model<JournalEntryAttributes, JournalEntryCreationAttributes> implements JournalEntryAttributes {
  public id!: number;
  public entryNumber!: string;
  public entryDate!: Date;
  public description!: string;
  public reference?: string;
  public sourceType!: 'manual' | 'automated' | 'import' | 'closing' | 'adjustment';
  public sourceId?: string;
  public status!: 'draft' | 'posted' | 'reversed';
  public reversalId?: number;
  public totalDebitAmount!: string;
  public totalCreditAmount!: string;
  public fundId?: number;
  public createdBy!: number;
  public postedBy?: number;
  public postedAt?: Date;
  public reversedBy?: number;
  public reversedAt?: Date;
  public reversalReason?: string;
  public metadata?: Record<string, any>;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public lineItems?: JournalEntryLineItem[];
  public fund?: any; // Would be Fund model
  public reversalEntry?: JournalEntry;
  public originalEntry?: JournalEntry;

  /**
   * Get total debit amount as Decimal
   */
  public getTotalDebitAmountDecimal(): Decimal {
    return new Decimal(this.totalDebitAmount || '0');
  }

  /**
   * Get total credit amount as Decimal
   */
  public getTotalCreditAmountDecimal(): Decimal {
    return new Decimal(this.totalCreditAmount || '0');
  }

  /**
   * Check if the journal entry is balanced
   */
  public isBalanced(): boolean {
    const debitTotal = this.getTotalDebitAmountDecimal();
    const creditTotal = this.getTotalCreditAmountDecimal();
    return debitTotal.equals(creditTotal);
  }

  /**
   * Check if entry can be posted
   */
  public canPost(): boolean {
    return this.status === 'draft' && this.isBalanced();
  }

  /**
   * Check if entry can be reversed
   */
  public canReverse(): boolean {
    return this.status === 'posted' && !this.reversalId;
  }

  /**
   * Generate entry number
   */
  public static generateEntryNumber(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    return `JE${year}${month}-${timestamp}`;
  }
}

export interface JournalEntryLineItemAttributes {
  id: number;
  journalEntryId: number;
  lineNumber: number;
  glAccountId: number;
  debitAmount: string;
  creditAmount: string;
  description?: string;
  reference?: string;
  fundId?: number;
  investorId?: number;
  investmentId?: number;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

interface JournalEntryLineItemCreationAttributes extends Optional<JournalEntryLineItemAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class JournalEntryLineItem extends Model<JournalEntryLineItemAttributes, JournalEntryLineItemCreationAttributes> implements JournalEntryLineItemAttributes {
  public id!: number;
  public journalEntryId!: number;
  public lineNumber!: number;
  public glAccountId!: number;
  public debitAmount!: string;
  public creditAmount!: string;
  public description?: string;
  public reference?: string;
  public fundId?: number;
  public investorId?: number;
  public investmentId?: number;
  public metadata?: Record<string, any>;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public journalEntry?: JournalEntry;
  public glAccount?: GLAccount;
  public fund?: any;
  public investor?: any;
  public investment?: any;

  /**
   * Get debit amount as Decimal
   */
  public getDebitAmountDecimal(): Decimal {
    return new Decimal(this.debitAmount || '0');
  }

  /**
   * Get credit amount as Decimal
   */
  public getCreditAmountDecimal(): Decimal {
    return new Decimal(this.creditAmount || '0');
  }

  /**
   * Get net amount (debit - credit)
   */
  public getNetAmountDecimal(): Decimal {
    return this.getDebitAmountDecimal().minus(this.getCreditAmountDecimal());
  }

  /**
   * Check if line item is a debit entry
   */
  public isDebit(): boolean {
    return this.getDebitAmountDecimal().greaterThan(0);
  }

  /**
   * Check if line item is a credit entry
   */
  public isCredit(): boolean {
    return this.getCreditAmountDecimal().greaterThan(0);
  }
}

JournalEntry.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    entryNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    entryDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    reference: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    sourceType: {
      type: DataTypes.ENUM('manual', 'automated', 'import', 'closing', 'adjustment'),
      allowNull: false,
    },
    sourceId: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('draft', 'posted', 'reversed'),
      allowNull: false,
      defaultValue: 'draft',
    },
    reversalId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'JournalEntries',
        key: 'id',
      },
    },
    totalDebitAmount: {
      type: DataTypes.DECIMAL(20, 4),
      allowNull: false,
      defaultValue: '0.0000',
      get() {
        return this.getDataValue('totalDebitAmount')?.toString() || '0';
      },
      set(value: string | number | Decimal) {
        this.setDataValue('totalDebitAmount', new Decimal(value).toString());
      },
    },
    totalCreditAmount: {
      type: DataTypes.DECIMAL(20, 4),
      allowNull: false,
      defaultValue: '0.0000',
      get() {
        return this.getDataValue('totalCreditAmount')?.toString() || '0';
      },
      set(value: string | number | Decimal) {
        this.setDataValue('totalCreditAmount', new Decimal(value).toString());
      },
    },
    fundId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Funds',
        key: 'id',
      },
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    postedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    postedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    reversedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    reversedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    reversalReason: {
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
    tableName: 'JournalEntries',
    timestamps: true,
    indexes: [
      {
        fields: ['entry_number'],
        unique: true,
      },
      {
        fields: ['entry_date'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['source_type'],
      },
      {
        fields: ['fund_id'],
      },
      {
        fields: ['created_by'],
      },
    ],
  }
);

JournalEntryLineItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    journalEntryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'JournalEntries',
        key: 'id',
      },
    },
    lineNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    glAccountId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'GLAccounts',
        key: 'id',
      },
    },
    debitAmount: {
      type: DataTypes.DECIMAL(20, 4),
      allowNull: false,
      defaultValue: '0.0000',
      get() {
        return this.getDataValue('debitAmount')?.toString() || '0';
      },
      set(value: string | number | Decimal) {
        this.setDataValue('debitAmount', new Decimal(value).toString());
      },
    },
    creditAmount: {
      type: DataTypes.DECIMAL(20, 4),
      allowNull: false,
      defaultValue: '0.0000',
      get() {
        return this.getDataValue('creditAmount')?.toString() || '0';
      },
      set(value: string | number | Decimal) {
        this.setDataValue('creditAmount', new Decimal(value).toString());
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    reference: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    fundId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Funds',
        key: 'id',
      },
    },
    investorId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'InvestorEntities',
        key: 'id',
      },
    },
    investmentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Investments',
        key: 'id',
      },
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'JournalEntryLineItems',
    timestamps: true,
    indexes: [
      {
        fields: ['journal_entry_id', 'line_number'],
        unique: true,
      },
      {
        fields: ['gl_account_id'],
      },
      {
        fields: ['fund_id'],
      },
      {
        fields: ['investor_id'],
      },
      {
        fields: ['investment_id'],
      },
    ],
  }
);

// Associations
JournalEntry.hasMany(JournalEntryLineItem, { foreignKey: 'journalEntryId', as: 'lineItems' });
JournalEntryLineItem.belongsTo(JournalEntry, { foreignKey: 'journalEntryId', as: 'journalEntry' });

JournalEntryLineItem.belongsTo(GLAccount, { foreignKey: 'glAccountId', as: 'glAccount' });
GLAccount.hasMany(JournalEntryLineItem, { foreignKey: 'glAccountId', as: 'lineItems' });

// Self-referencing association for reversals
JournalEntry.belongsTo(JournalEntry, { as: 'originalEntry', foreignKey: 'reversalId' });
JournalEntry.hasOne(JournalEntry, { as: 'reversalEntry', foreignKey: 'reversalId' });

export default { JournalEntry, JournalEntryLineItem };