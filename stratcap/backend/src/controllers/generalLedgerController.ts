import { Request, Response } from 'express';
import { Transaction } from 'sequelize';
import { GeneralLedgerService, JournalEntryRequest, AutoJournalEntryRequest, GLAccountRequest, TrialBalanceOptions } from '../services/GeneralLedgerService';
import sequelize from '../db/database';

export class GeneralLedgerController {
  private generalLedgerService: GeneralLedgerService;

  constructor() {
    this.generalLedgerService = new GeneralLedgerService();
  }

  /**
   * Create a new GL account
   */
  createGLAccount = async (req: Request, res: Response): Promise<void> => {
    const transaction: Transaction = await sequelize.transaction();
    
    try {
      const request: GLAccountRequest = {
        accountNumber: req.body.accountNumber,
        accountName: req.body.accountName,
        accountType: req.body.accountType,
        category: req.body.category,
        subCategory: req.body.subCategory,
        parentAccountId: req.body.parentAccountId,
        requiresSubAccount: req.body.requiresSubAccount,
        allowsDirectPosting: req.body.allowsDirectPosting,
        description: req.body.description,
        metadata: req.body.metadata,
      };

      const glAccount = await this.generalLedgerService.createGLAccount(
        request,
        req.user?.id || '',
        transaction
      );
      
      await transaction.commit();
      
      res.status(201).json({
        success: true,
        data: glAccount,
        message: 'GL account created successfully',
      });
    } catch (error) {
      await transaction.rollback();
      const message = error instanceof Error ? error.message : 'An error occurred';
      res.status(400).json({
        success: false,
        message,
      });
    }
  };

  /**
   * Create a manual journal entry
   */
  createJournalEntry = async (req: Request, res: Response): Promise<void> => {
    const transaction: Transaction = await sequelize.transaction();
    
    try {
      const request: JournalEntryRequest = {
        entryDate: new Date(req.body.entryDate),
        description: req.body.description,
        reference: req.body.reference,
        sourceType: req.body.sourceType || 'manual',
        sourceId: req.body.sourceId,
        fundId: req.body.fundId,
        lineItems: req.body.lineItems,
        metadata: req.body.metadata,
      };

      const journalEntry = await this.generalLedgerService.createJournalEntry(
        request,
        req.user?.id || '',
        transaction
      );
      
      await transaction.commit();
      
      res.status(201).json({
        success: true,
        data: journalEntry,
        message: 'Journal entry created successfully',
      });
    } catch (error) {
      await transaction.rollback();
      const message = error instanceof Error ? error.message : 'An error occurred';
      res.status(400).json({
        success: false,
        message,
      });
    }
  };

  /**
   * Create automated journal entry
   */
  createAutomatedJournalEntry = async (req: Request, res: Response): Promise<void> => {
    const transaction: Transaction = await sequelize.transaction();
    
    try {
      const request: AutoJournalEntryRequest = {
        sourceSystem: req.body.sourceSystem,
        sourceType: req.body.sourceType,
        sourceSubType: req.body.sourceSubType,
        sourceId: req.body.sourceId,
        sourceData: req.body.sourceData,
        entryDate: new Date(req.body.entryDate),
        description: req.body.description,
        reference: req.body.reference,
        fundId: req.body.fundId,
        metadata: req.body.metadata,
      };

      const journalEntry = await this.generalLedgerService.createAutomatedJournalEntry(
        request,
        transaction
      );
      
      await transaction.commit();
      
      res.status(201).json({
        success: true,
        data: journalEntry,
        message: 'Automated journal entry created successfully',
      });
    } catch (error) {
      await transaction.rollback();
      const message = error instanceof Error ? error.message : 'An error occurred';
      res.status(400).json({
        success: false,
        message,
      });
    }
  };

  /**
   * Post a journal entry
   */
  postJournalEntry = async (req: Request, res: Response): Promise<void> => {
    const transaction: Transaction = await sequelize.transaction();
    
    try {
      const journalEntryId = req.params.id;

      const journalEntry = await this.generalLedgerService.postJournalEntry(
        journalEntryId,
        req.user?.id || '',
        transaction
      );
      
      await transaction.commit();
      
      res.json({
        success: true,
        data: journalEntry,
        message: 'Journal entry posted successfully',
      });
    } catch (error) {
      await transaction.rollback();
      const message = error instanceof Error ? error.message : 'An error occurred';
      res.status(400).json({
        success: false,
        message,
      });
    }
  };

  /**
   * Reverse a journal entry
   */
  reverseJournalEntry = async (req: Request, res: Response): Promise<void> => {
    const transaction: Transaction = await sequelize.transaction();
    
    try {
      const journalEntryId = req.params.id;
      const { reversalReason } = req.body;

      const reversalEntry = await this.generalLedgerService.reverseJournalEntry(
        journalEntryId,
        reversalReason,
        req.user?.id || '',
        transaction
      );
      
      await transaction.commit();
      
      res.json({
        success: true,
        data: reversalEntry,
        message: 'Journal entry reversed successfully',
      });
    } catch (error) {
      await transaction.rollback();
      const message = error instanceof Error ? error.message : 'An error occurred';
      res.status(400).json({
        success: false,
        message,
      });
    }
  };

  /**
   * Get journal entry by ID
   */
  getJournalEntry = async (req: Request, res: Response): Promise<void> => {
    try {
      const journalEntryId = req.params.id;
      const journalEntry = await this.generalLedgerService.getJournalEntryById(journalEntryId);
      
      res.json({
        success: true,
        data: journalEntry,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      res.status(404).json({
        success: false,
        message,
      });
    }
  };

  /**
   * Get trial balance
   */
  getTrialBalance = async (req: Request, res: Response): Promise<void> => {
    try {
      const options: TrialBalanceOptions = {
        asOfDate: new Date(req.query.asOfDate as string),
        fundId: req.query.fundId as string,
        includeInactive: req.query.includeInactive === 'true',
        accountType: req.query.accountType as string,
        category: req.query.category as string,
      };

      const trialBalance = await this.generalLedgerService.getTrialBalance(options);
      
      res.json({
        success: true,
        data: {
          asOfDate: options.asOfDate,
          accounts: trialBalance,
          totalDebits: trialBalance.reduce((sum, account) => 
            sum + parseFloat(account.debitBalance), 0
          ).toString(),
          totalCredits: trialBalance.reduce((sum, account) => 
            sum + parseFloat(account.creditBalance), 0
          ).toString(),
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      res.status(400).json({
        success: false,
        message,
      });
    }
  };

  /**
   * Get account balance
   */
  getAccountBalance = async (req: Request, res: Response): Promise<void> => {
    try {
      const accountId = req.params.accountId;
      const asOfDate = new Date(req.query.asOfDate as string || new Date());
      const fundId = req.query.fundId as string;

      const balance = await this.generalLedgerService.getAccountBalance(
        accountId,
        asOfDate,
        fundId
      );
      
      res.json({
        success: true,
        data: balance,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      res.status(400).json({
        success: false,
        message,
      });
    }
  };

  /**
   * Get chart of accounts
   */
  getChartOfAccounts = async (req: Request, res: Response): Promise<void> => {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const accountType = req.query.accountType as string;
      
      // This would use the GLAccount model directly
      const { GLAccount } = await import('../models/GLAccount');
      
      const whereClause: any = {};
      if (!includeInactive) {
        whereClause.isActive = true;
      }
      if (accountType) {
        whereClause.accountType = accountType;
      }

      const accounts = await GLAccount.findAll({
        where: whereClause,
        include: [
          { model: GLAccount, as: 'parent' },
          { model: GLAccount, as: 'children' },
        ],
        order: [['accountNumber', 'ASC']],
      });
      
      res.json({
        success: true,
        data: accounts,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      res.status(400).json({
        success: false,
        message,
      });
    }
  };

  /**
   * Get account activity (journal entry line items for an account)
   */
  getAccountActivity = async (req: Request, res: Response): Promise<void> => {
    try {
      const accountId = req.params.accountId;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : null;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : null;
      const fundId = req.query.fundId as string;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const { JournalEntryLineItem } = await import('../models/JournalEntry');
      const { JournalEntry } = await import('../models/JournalEntry');
      const { GLAccount } = await import('../models/GLAccount');

      const whereClause: any = {
        glAccountId: accountId,
      };

      if (fundId) {
        whereClause.fundId = fundId;
      }

      const journalEntryWhere: any = {};
      if (startDate) {
        journalEntryWhere.entryDate = { ...journalEntryWhere.entryDate, [require('sequelize').Op.gte]: startDate };
      }
      if (endDate) {
        journalEntryWhere.entryDate = { ...journalEntryWhere.entryDate, [require('sequelize').Op.lte]: endDate };
      }

      const lineItems = await JournalEntryLineItem.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: JournalEntry,
            as: 'journalEntry',
            where: journalEntryWhere,
            required: true,
          },
          {
            model: GLAccount,
            as: 'glAccount',
          },
        ],
        order: [['journalEntry', 'entryDate', 'DESC'], ['journalEntry', 'entryNumber', 'DESC']],
        limit,
        offset,
      });
      
      res.json({
        success: true,
        data: {
          lineItems: lineItems.rows,
          totalCount: lineItems.count,
          limit,
          offset,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      res.status(400).json({
        success: false,
        message,
      });
    }
  };

  /**
   * Get GL dashboard metrics
   */
  getDashboardMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      const fundId = req.query.fundId as string;
      const asOfDate = new Date(req.query.asOfDate as string || new Date());

      // Get trial balance for calculations
      const trialBalance = await this.generalLedgerService.getTrialBalance({
        asOfDate,
        fundId,
        includeInactive: false,
      });

      // Calculate key metrics
      const assets = trialBalance
        .filter(account => account.accountType === 'asset')
        .reduce((sum, account) => sum + parseFloat(account.debitBalance || '0'), 0);

      const liabilities = trialBalance
        .filter(account => account.accountType === 'liability')
        .reduce((sum, account) => sum + parseFloat(account.creditBalance || '0'), 0);

      const equity = trialBalance
        .filter(account => account.accountType === 'equity')
        .reduce((sum, account) => sum + parseFloat(account.creditBalance || '0'), 0);

      const revenue = trialBalance
        .filter(account => account.accountType === 'revenue')
        .reduce((sum, account) => sum + parseFloat(account.creditBalance || '0'), 0);

      const expenses = trialBalance
        .filter(account => account.accountType === 'expense')
        .reduce((sum, account) => sum + parseFloat(account.debitBalance || '0'), 0);

      const netIncome = revenue - expenses;

      // Get recent activity counts
      const { JournalEntry } = await import('../models/JournalEntry');
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const recentEntryCount = await JournalEntry.count({
        where: {
          createdAt: {
            [require('sequelize').Op.gte]: thirtyDaysAgo,
          },
          ...(fundId && { fundId }),
        },
      });

      const pendingEntryCount = await JournalEntry.count({
        where: {
          status: 'draft',
          ...(fundId && { fundId }),
        },
      });

      res.json({
        success: true,
        data: {
          balanceSheet: {
            totalAssets: assets.toString(),
            totalLiabilities: liabilities.toString(),
            totalEquity: equity.toString(),
            balanceCheck: (assets - liabilities - equity).toString(),
          },
          incomeStatement: {
            totalRevenue: revenue.toString(),
            totalExpenses: expenses.toString(),
            netIncome: netIncome.toString(),
          },
          activity: {
            recentEntries: recentEntryCount,
            pendingEntries: pendingEntryCount,
          },
          asOfDate,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      res.status(400).json({
        success: false,
        message,
      });
    }
  };

  /**
   * Validate journal entry
   */
  validateJournalEntry = async (req: Request, res: Response): Promise<void> => {
    try {
      const { lineItems } = req.body;

      if (!lineItems || !Array.isArray(lineItems)) {
        res.status(400).json({
          success: false,
          message: 'Line items are required',
        });
        return;
      }

      const errors: string[] = [];
      const warnings: string[] = [];

      // Basic validation
      if (lineItems.length < 2) {
        errors.push('At least two line items are required');
      }

      let totalDebits = 0;
      let totalCredits = 0;

      for (let i = 0; i < lineItems.length; i++) {
        const lineItem = lineItems[i];
        const debitAmount = parseFloat(lineItem.debitAmount || '0');
        const creditAmount = parseFloat(lineItem.creditAmount || '0');

        if (debitAmount < 0 || creditAmount < 0) {
          errors.push(`Line item ${i + 1}: Amounts cannot be negative`);
        }

        if (debitAmount === 0 && creditAmount === 0) {
          errors.push(`Line item ${i + 1}: Must have either debit or credit amount`);
        }

        if (debitAmount > 0 && creditAmount > 0) {
          errors.push(`Line item ${i + 1}: Cannot have both debit and credit amounts`);
        }

        totalDebits += debitAmount;
        totalCredits += creditAmount;
      }

      // Check if balanced
      const difference = Math.abs(totalDebits - totalCredits);
      if (difference > 0.01) { // Allow for small rounding differences
        errors.push(`Entry is not balanced. Debits: ${totalDebits}, Credits: ${totalCredits}, Difference: ${difference}`);
      }

      // Check for potential issues
      if (totalDebits > 1000000) {
        warnings.push('Large transaction amount - please verify');
      }

      const isValid = errors.length === 0;

      res.json({
        success: true,
        data: {
          isValid,
          errors,
          warnings,
          totals: {
            debits: totalDebits.toString(),
            credits: totalCredits.toString(),
            difference: difference.toString(),
          },
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      res.status(400).json({
        success: false,
        message,
      });
    }
  };
}