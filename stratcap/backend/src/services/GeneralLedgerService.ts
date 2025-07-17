import { Transaction, Op, QueryTypes } from 'sequelize';
import { Decimal } from 'decimal.js';
import sequelize from '../db/database';
import { GLAccount } from '../models/GLAccount';
import { JournalEntry, JournalEntryLineItem } from '../models/JournalEntry';
import { GLAccountMapping } from '../models/GLAccountMapping';

export interface JournalEntryRequest {
  entryDate: Date;
  description: string;
  reference?: string;
  sourceType: 'manual' | 'automated' | 'import' | 'closing' | 'adjustment';
  sourceId?: string;
  fundId?: string;
  lineItems: JournalEntryLineItemRequest[];
  metadata?: Record<string, any>;
}

export interface JournalEntryLineItemRequest {
  glAccountId: string;
  debitAmount?: string | number | Decimal;
  creditAmount?: string | number | Decimal;
  description?: string;
  reference?: string;
  fundId?: string;
  investorId?: string;
  investmentId?: string;
  metadata?: Record<string, any>;
}

export interface AutoJournalEntryRequest {
  sourceSystem: string;
  sourceType: string;
  sourceSubType?: string;
  sourceId: string;
  sourceData: Record<string, any>;
  entryDate: Date;
  description: string;
  reference?: string;
  fundId?: string;
  metadata?: Record<string, any>;
}

export interface GLAccountRequest {
  accountNumber: string;
  accountName: string;
  accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  category: string;
  subCategory?: string;
  parentAccountId?: string;
  requiresSubAccount?: boolean;
  allowsDirectPosting?: boolean;
  description?: string;
  metadata?: Record<string, any>;
}

export interface TrialBalanceOptions {
  asOfDate: Date;
  fundId?: string;
  includeInactive?: boolean;
  accountType?: string;
  category?: string;
}

export interface TrialBalanceAccount {
  accountId: string;
  accountNumber: string;
  accountName: string;
  accountType: string;
  category: string;
  normalBalance: 'debit' | 'credit';
  debitBalance: string;
  creditBalance: string;
  netBalance: string;
}

export interface GLAccountBalance {
  accountId: string;
  accountNumber: string;
  accountName: string;
  debitTotal: string;
  creditTotal: string;
  balance: string;
  balanceType: 'debit' | 'credit';
}

export class GeneralLedgerService {
  
  /**
   * Create a new GL account
   */
  async createGLAccount(request: GLAccountRequest, _createdBy: string, transaction?: Transaction): Promise<GLAccount> {
    // Validate account number uniqueness
    const existingAccount = await GLAccount.findOne({
      where: { accountNumber: request.accountNumber },
      transaction,
    });

    if (existingAccount) {
      throw new Error(`Account number ${request.accountNumber} already exists`);
    }

    // Validate parent account if specified
    if (request.parentAccountId) {
      const parentAccount = await GLAccount.findByPk(request.parentAccountId, { transaction });
      if (!parentAccount) {
        throw new Error('Parent account not found');
      }
      if (!parentAccount.isActive) {
        throw new Error('Parent account is not active');
      }
    }

    // Determine normal balance based on account type
    const normalBalance = this.getNormalBalance(request.accountType);

    const glAccount = await GLAccount.create({
      accountNumber: request.accountNumber,
      accountName: request.accountName,
      accountType: request.accountType,
      category: request.category as any,
      subCategory: request.subCategory,
      parentAccountId: request.parentAccountId,
      isActive: true,
      requiresSubAccount: request.requiresSubAccount || false,
      allowsDirectPosting: request.allowsDirectPosting !== false,
      normalBalance,
      description: request.description,
      metadata: request.metadata,
    }, { transaction });

    return glAccount;
  }

  /**
   * Create a manual journal entry
   */
  async createJournalEntry(request: JournalEntryRequest, createdBy: string, transaction?: Transaction): Promise<JournalEntry> {
    const t = transaction || await sequelize.transaction();

    try {
      // Validate line items
      await this.validateJournalEntryLineItems(request.lineItems, t);

      // Calculate totals
      const { totalDebit, totalCredit } = this.calculateJournalEntryTotals(request.lineItems);

      // Check if balanced
      if (!totalDebit.equals(totalCredit)) {
        throw new Error(`Journal entry is not balanced. Debits: ${totalDebit.toString()}, Credits: ${totalCredit.toString()}`);
      }

      // Generate entry number
      const entryNumber = JournalEntry.generateEntryNumber(request.entryDate);

      // Create journal entry
      const journalEntry = await JournalEntry.create({
        entryNumber,
        entryDate: request.entryDate,
        description: request.description,
        reference: request.reference,
        sourceType: request.sourceType,
        sourceId: request.sourceId,
        status: 'draft',
        totalDebitAmount: totalDebit.toString(),
        totalCreditAmount: totalCredit.toString(),
        fundId: request.fundId,
        createdBy,
        metadata: request.metadata,
      }, { transaction: t });

      // Create line items
      for (let i = 0; i < request.lineItems.length; i++) {
        const lineItem = request.lineItems[i];
        await JournalEntryLineItem.create({
          journalEntryId: journalEntry.id,
          lineNumber: i + 1,
          glAccountId: lineItem.glAccountId,
          debitAmount: lineItem.debitAmount?.toString() || '0',
          creditAmount: lineItem.creditAmount?.toString() || '0',
          description: lineItem.description,
          reference: lineItem.reference,
          fundId: lineItem.fundId,
          investorId: lineItem.investorId,
          investmentId: lineItem.investmentId,
          metadata: lineItem.metadata,
        }, { transaction: t });
      }

      if (!transaction) {
        await t.commit();
      }

      // Return with line items
      return await this.getJournalEntryById(journalEntry.id);
    } catch (error) {
      if (!transaction) {
        await t.rollback();
      }
      throw error;
    }
  }

  /**
   * Create automated journal entry from system transaction
   */
  async createAutomatedJournalEntry(request: AutoJournalEntryRequest, transaction?: Transaction): Promise<JournalEntry> {
    const t = transaction || await sequelize.transaction();

    try {
      // Find applicable mappings
      const mappings = await this.findApplicableMappings(
        request.sourceSystem,
        request.sourceType,
        request.sourceSubType,
        request.sourceData,
        request.fundId,
        t
      );

      if (mappings.length === 0) {
        throw new Error(`No GL account mappings found for ${request.sourceSystem}:${request.sourceType}`);
      }

      // Generate line items from mappings
      const lineItems = await this.generateLineItemsFromMappings(mappings, request.sourceData);

      // Create journal entry
      const journalEntryRequest: JournalEntryRequest = {
        entryDate: request.entryDate,
        description: request.description,
        reference: request.reference,
        sourceType: 'automated',
        sourceId: request.sourceId,
        fundId: request.fundId,
        lineItems,
        metadata: {
          ...request.metadata,
          sourceSystem: request.sourceSystem,
          sourceType: request.sourceType,
          sourceSubType: request.sourceSubType,
          autoGenerated: true,
        },
      };

      const journalEntry = await this.createJournalEntry(journalEntryRequest, 'system', t);

      // Auto-post if configured
      if (this.shouldAutoPost(request.sourceSystem, request.sourceType)) {
        await this.postJournalEntry(journalEntry.id, 'system', t);
      }

      if (!transaction) {
        await t.commit();
      }

      return journalEntry;
    } catch (error) {
      if (!transaction) {
        await t.rollback();
      }
      throw error;
    }
  }

  /**
   * Post a journal entry
   */
  async postJournalEntry(journalEntryId: string, postedBy: string, transaction?: Transaction): Promise<JournalEntry> {
    const t = transaction || await sequelize.transaction();

    try {
      const journalEntry = await JournalEntry.findByPk(journalEntryId, {
        include: [{ model: JournalEntryLineItem, as: 'lineItems' }],
        transaction: t,
      });

      if (!journalEntry) {
        throw new Error('Journal entry not found');
      }

      if (!journalEntry.canPost()) {
        throw new Error('Journal entry cannot be posted');
      }

      // Update status
      await journalEntry.update({
        status: 'posted',
        postedBy,
        postedAt: new Date(),
      }, { transaction: t });

      if (!transaction) {
        await t.commit();
      }

      return await this.getJournalEntryById(journalEntryId);
    } catch (error) {
      if (!transaction) {
        await t.rollback();
      }
      throw error;
    }
  }

  /**
   * Reverse a journal entry
   */
  async reverseJournalEntry(
    journalEntryId: string,
    reversalReason: string,
    reversedBy: string,
    transaction?: Transaction
  ): Promise<JournalEntry> {
    const t = transaction || await sequelize.transaction();

    try {
      const originalEntry = await JournalEntry.findByPk(journalEntryId, {
        include: [{ model: JournalEntryLineItem, as: 'lineItems' }],
        transaction: t,
      });

      if (!originalEntry) {
        throw new Error('Original journal entry not found');
      }

      if (!originalEntry.canReverse()) {
        throw new Error('Journal entry cannot be reversed');
      }

      // Create reversal entry with opposite amounts
      const reversalLineItems: JournalEntryLineItemRequest[] = originalEntry.lineItems!.map(lineItem => ({
        glAccountId: lineItem.glAccountId,
        debitAmount: lineItem.creditAmount, // Swap debit and credit
        creditAmount: lineItem.debitAmount,
        description: `Reversal: ${lineItem.description || originalEntry.description}`,
        reference: lineItem.reference,
        fundId: lineItem.fundId,
        investorId: lineItem.investorId,
        investmentId: lineItem.investmentId,
        metadata: {
          ...lineItem.metadata,
          reversalOf: lineItem.id,
        },
      }));

      const reversalRequest: JournalEntryRequest = {
        entryDate: new Date(),
        description: `Reversal of ${originalEntry.entryNumber}: ${reversalReason}`,
        reference: originalEntry.reference,
        sourceType: 'adjustment',
        sourceId: originalEntry.sourceId,
        fundId: originalEntry.fundId,
        lineItems: reversalLineItems,
        metadata: {
          ...originalEntry.metadata,
          reversalOf: originalEntry.id,
          reversalReason,
        },
      };

      const reversalEntry = await this.createJournalEntry(reversalRequest, reversedBy, t);

      // Auto-post the reversal entry
      await this.postJournalEntry(reversalEntry.id, reversedBy, t);

      // Update original entry
      await originalEntry.update({
        status: 'reversed',
        reversalId: reversalEntry.id,
        reversedBy,
        reversedAt: new Date(),
        reversalReason,
      }, { transaction: t });

      if (!transaction) {
        await t.commit();
      }

      return reversalEntry;
    } catch (error) {
      if (!transaction) {
        await t.rollback();
      }
      throw error;
    }
  }

  /**
   * Get trial balance
   */
  async getTrialBalance(options: TrialBalanceOptions): Promise<TrialBalanceAccount[]> {
    const whereClause: any = {
      isActive: true,
    };

    if (!options.includeInactive) {
      whereClause.isActive = true;
    }

    if (options.accountType) {
      whereClause.accountType = options.accountType;
    }

    if (options.category) {
      whereClause.category = options.category;
    }

    // Build complex query to calculate balances
    const query = `
      WITH account_balances AS (
        SELECT 
          gl.id as account_id,
          gl."accountNumber" as account_number,
          gl."accountName" as account_name,
          gl."accountType" as account_type,
          gl.category,
          gl."normalBalance" as normal_balance,
          COALESCE(SUM(
            CASE WHEN je.status = 'posted' AND je."entryDate" <= :asOfDate 
            THEN CAST(jel."debitAmount" AS DECIMAL(20,4))
            ELSE 0 END
          ), 0) as total_debits,
          COALESCE(SUM(
            CASE WHEN je.status = 'posted' AND je."entryDate" <= :asOfDate 
            THEN CAST(jel."creditAmount" AS DECIMAL(20,4))
            ELSE 0 END
          ), 0) as total_credits
        FROM "GLAccounts" gl
        LEFT JOIN "JournalEntryLineItems" jel ON gl.id = jel."glAccountId"
        LEFT JOIN "JournalEntries" je ON jel."journalEntryId" = je.id
        WHERE gl."isActive" = true
        ${options.fundId ? 'AND (jel."fundId" = :fundId OR jel."fundId" IS NULL)' : ''}
        GROUP BY gl.id, gl."accountNumber", gl."accountName", gl."accountType", gl.category, gl."normalBalance"
      )
      SELECT 
        account_id,
        account_number,
        account_name,
        account_type,
        category,
        normal_balance,
        total_debits,
        total_credits,
        (total_debits - total_credits) as net_balance,
        CASE 
          WHEN normal_balance = 'debit' THEN total_debits
          ELSE total_credits
        END as balance_amount,
        CASE 
          WHEN (total_debits - total_credits) >= 0 THEN 'debit'
          ELSE 'credit'
        END as balance_type
      FROM account_balances
      WHERE total_debits > 0 OR total_credits > 0
      ORDER BY account_number
    `;

    const results = await sequelize.query(query, {
      type: QueryTypes.SELECT,
      replacements: {
        asOfDate: options.asOfDate,
        fundId: options.fundId,
      },
    }) as any[];

    return results.map(row => ({
      accountId: row.account_id,
      accountNumber: row.account_number,
      accountName: row.account_name,
      accountType: row.account_type,
      category: row.category,
      normalBalance: row.normal_balance,
      debitBalance: row.normal_balance === 'debit' && parseFloat(row.net_balance) >= 0 
        ? Math.abs(parseFloat(row.net_balance)).toString() 
        : '0',
      creditBalance: row.normal_balance === 'credit' && parseFloat(row.net_balance) <= 0 
        ? Math.abs(parseFloat(row.net_balance)).toString() 
        : '0',
      netBalance: row.net_balance,
    }));
  }

  /**
   * Get account balance for a specific account
   */
  async getAccountBalance(accountId: string, asOfDate: Date, fundId?: string): Promise<GLAccountBalance> {
    const query = `
      SELECT 
        gl.id as account_id,
        gl."accountNumber" as account_number,
        gl."accountName" as account_name,
        COALESCE(SUM(
          CASE WHEN je.status = 'posted' AND je."entryDate" <= :asOfDate 
          THEN CAST(jel."debitAmount" AS DECIMAL(20,4))
          ELSE 0 END
        ), 0) as total_debits,
        COALESCE(SUM(
          CASE WHEN je.status = 'posted' AND je."entryDate" <= :asOfDate 
          THEN CAST(jel."creditAmount" AS DECIMAL(20,4))
          ELSE 0 END
        ), 0) as total_credits
      FROM "GLAccounts" gl
      LEFT JOIN "JournalEntryLineItems" jel ON gl.id = jel."glAccountId"
      LEFT JOIN "JournalEntries" je ON jel."journalEntryId" = je.id
      WHERE gl.id = :accountId
      ${fundId ? 'AND (jel."fundId" = :fundId OR jel."fundId" IS NULL)' : ''}
      GROUP BY gl.id, gl."accountNumber", gl."accountName"
    `;

    const results = await sequelize.query(query, {
      type: QueryTypes.SELECT,
      replacements: {
        accountId,
        asOfDate,
        fundId,
      },
    }) as any[];

    if (results.length === 0) {
      throw new Error('GL account not found');
    }

    const row = results[0];
    const debitTotal = new Decimal(row.total_debits || '0');
    const creditTotal = new Decimal(row.total_credits || '0');
    const balance = debitTotal.minus(creditTotal);

    return {
      accountId: row.account_id,
      accountNumber: row.account_number,
      accountName: row.account_name,
      debitTotal: debitTotal.toString(),
      creditTotal: creditTotal.toString(),
      balance: balance.abs().toString(),
      balanceType: balance.greaterThanOrEqualTo(0) ? 'debit' : 'credit',
    };
  }

  /**
   * Get journal entry by ID
   */
  async getJournalEntryById(journalEntryId: string): Promise<JournalEntry> {
    const journalEntry = await JournalEntry.findByPk(journalEntryId, {
      include: [
        {
          model: JournalEntryLineItem,
          as: 'lineItems',
          include: [{ model: GLAccount, as: 'glAccount' }],
        },
      ],
    });

    if (!journalEntry) {
      throw new Error('Journal entry not found');
    }

    return journalEntry;
  }

  /**
   * Private helper methods
   */

  private getNormalBalance(accountType: string): 'debit' | 'credit' {
    switch (accountType) {
      case 'asset':
      case 'expense':
        return 'debit';
      case 'liability':
      case 'equity':
      case 'revenue':
        return 'credit';
      default:
        throw new Error(`Unknown account type: ${accountType}`);
    }
  }

  private async validateJournalEntryLineItems(lineItems: JournalEntryLineItemRequest[], transaction: Transaction): Promise<void> {
    for (const lineItem of lineItems) {
      // Validate GL account exists and can accept postings
      const glAccount = await GLAccount.findByPk(lineItem.glAccountId, { transaction });
      if (!glAccount) {
        throw new Error(`GL account ${lineItem.glAccountId} not found`);
      }
      if (!glAccount.canPostDirectly()) {
        throw new Error(`GL account ${glAccount.accountName} does not allow direct posting`);
      }

      // Validate amounts
      const debitAmount = new Decimal(lineItem.debitAmount || '0');
      const creditAmount = new Decimal(lineItem.creditAmount || '0');

      if (debitAmount.lessThan(0) || creditAmount.lessThan(0)) {
        throw new Error('Debit and credit amounts must be non-negative');
      }

      if (debitAmount.equals(0) && creditAmount.equals(0)) {
        throw new Error('Line item must have either debit or credit amount');
      }

      if (debitAmount.greaterThan(0) && creditAmount.greaterThan(0)) {
        throw new Error('Line item cannot have both debit and credit amounts');
      }
    }
  }

  private calculateJournalEntryTotals(lineItems: JournalEntryLineItemRequest[]): { totalDebit: Decimal; totalCredit: Decimal } {
    let totalDebit = new Decimal(0);
    let totalCredit = new Decimal(0);

    for (const lineItem of lineItems) {
      totalDebit = totalDebit.plus(lineItem.debitAmount || '0');
      totalCredit = totalCredit.plus(lineItem.creditAmount || '0');
    }

    return { totalDebit, totalCredit };
  }

  private async findApplicableMappings(
    sourceSystem: string,
    sourceType: string,
    sourceSubType: string | undefined,
    sourceData: Record<string, any>,
    fundId: string | undefined,
    transaction: Transaction
  ): Promise<GLAccountMapping[]> {
    const whereClause: any = {
      sourceSystem,
      sourceType,
      isActive: true,
    };

    if (sourceSubType) {
      whereClause.sourceSubType = sourceSubType;
    }

    if (fundId) {
      whereClause[Op.or] = [
        { fundId },
        { fundId: null },
      ];
    }

    const mappings = await GLAccountMapping.findAll({
      where: whereClause,
      include: [
        { model: GLAccount, as: 'glAccount' },
        { model: GLAccount, as: 'debitAccount' },
        { model: GLAccount, as: 'creditAccount' },
      ],
      order: [['priority', 'ASC']],
      transaction,
    });

    // Filter by conditions
    return mappings.filter(mapping => mapping.matchesConditions(sourceData));
  }

  private async generateLineItemsFromMappings(
    mappings: GLAccountMapping[],
    sourceData: Record<string, any>
  ): Promise<JournalEntryLineItemRequest[]> {
    const lineItems: JournalEntryLineItemRequest[] = [];

    for (const mapping of mappings) {
      // Extract amount from source data
      const amount = this.extractAmountFromSourceData(sourceData, mapping);
      
      if (amount.greaterThan(0)) {
        // Create debit line item
        if (mapping.debitAccountId) {
          lineItems.push({
            glAccountId: mapping.debitAccountId,
            debitAmount: amount.toString(),
            creditAmount: '0',
            description: mapping.description || 'Automated entry',
            metadata: { mappingId: mapping.id },
          });
        }

        // Create credit line item
        if (mapping.creditAccountId) {
          lineItems.push({
            glAccountId: mapping.creditAccountId,
            debitAmount: '0',
            creditAmount: amount.toString(),
            description: mapping.description || 'Automated entry',
            metadata: { mappingId: mapping.id },
          });
        }

        // If only one account specified, determine side based on account type
        if (!mapping.debitAccountId && !mapping.creditAccountId) {
          const side = this.determineTransactionSide(mapping.glAccount!, sourceData);
          lineItems.push({
            glAccountId: mapping.glAccountId,
            debitAmount: side === 'debit' ? amount.toString() : '0',
            creditAmount: side === 'credit' ? amount.toString() : '0',
            description: mapping.description || 'Automated entry',
            metadata: { mappingId: mapping.id },
          });
        }
      }
    }

    return lineItems;
  }

  private extractAmountFromSourceData(sourceData: Record<string, any>, mapping: GLAccountMapping): Decimal {
    // This would be more sophisticated in practice, extracting amounts based on mapping configuration
    const amountField = mapping.metadata?.amountField || 'amount';
    return new Decimal(sourceData[amountField] || '0');
  }

  private determineTransactionSide(glAccount: GLAccount, sourceData: Record<string, any>): 'debit' | 'credit' {
    // Determine based on account type and transaction nature
    // This is a simplified implementation
    const transactionType = sourceData.transactionType || 'normal';
    
    if (transactionType === 'normal') {
      return glAccount.normalBalance;
    } else {
      return glAccount.normalBalance === 'debit' ? 'credit' : 'debit';
    }
  }

  private shouldAutoPost(_sourceSystem: string, sourceType: string): boolean {
    // Configuration would determine which automated entries should be auto-posted
    const autoPostTypes = ['capital_activity', 'fee', 'distribution'];
    return autoPostTypes.includes(sourceType);
  }
}