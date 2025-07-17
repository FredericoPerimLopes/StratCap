import { GeneralLedgerService, JournalEntryRequest, GLAccountRequest, TrialBalanceOptions } from '../services/GeneralLedgerService';
import { GLAccount } from '../models/GLAccount';
import { JournalEntry } from '../models/JournalEntry';
import { Decimal } from 'decimal.js';

describe('GeneralLedgerService', () => {
  let generalLedgerService: GeneralLedgerService;

  beforeEach(() => {
    generalLedgerService = new GeneralLedgerService();
  });

  describe('GL Account Management', () => {
    test('should create a new GL account', async () => {
      const request: GLAccountRequest = {
        accountNumber: '1000',
        accountName: 'Cash and Cash Equivalents',
        accountType: 'asset',
        category: 'current_assets',
        subCategory: 'liquid_assets',
        requiresSubAccount: false,
        allowsDirectPosting: true,
        description: 'Primary cash account for fund operations',
        metadata: {
          bankAccount: true,
          reconciliationRequired: true,
        },
      };

      const glAccount = await generalLedgerService.createGLAccount(request, 'test-user');

      expect(glAccount).toBeDefined();
      expect(glAccount.accountNumber).toBe(request.accountNumber);
      expect(glAccount.accountName).toBe(request.accountName);
      expect(glAccount.accountType).toBe(request.accountType);
      expect(glAccount.category).toBe(request.category);
      expect(glAccount.normalBalance).toBe('debit'); // Assets have debit normal balance
      expect(glAccount.isActive).toBe(true);
      expect(glAccount.canPostDirectly()).toBe(true);
    });

    test('should reject duplicate account numbers', async () => {
      const request: GLAccountRequest = {
        accountNumber: '1000',
        accountName: 'Test Account',
        accountType: 'asset',
        category: 'current_assets',
      };

      // Create first account
      await generalLedgerService.createGLAccount(request, 'test-user');

      // Try to create duplicate
      await expect(
        generalLedgerService.createGLAccount(request, 'test-user')
      ).rejects.toThrow('Account number 1000 already exists');
    });

    test('should set correct normal balance for different account types', async () => {
      const testCases = [
        { accountType: 'asset', expectedNormalBalance: 'debit' },
        { accountType: 'expense', expectedNormalBalance: 'debit' },
        { accountType: 'liability', expectedNormalBalance: 'credit' },
        { accountType: 'equity', expectedNormalBalance: 'credit' },
        { accountType: 'revenue', expectedNormalBalance: 'credit' },
      ];

      for (const testCase of testCases) {
        const request: GLAccountRequest = {
          accountNumber: `${Math.random().toString(36).substr(2, 9)}`,
          accountName: `Test ${testCase.accountType} Account`,
          accountType: testCase.accountType as any,
          category: 'current_assets',
        };

        const glAccount = await generalLedgerService.createGLAccount(request, 'test-user');
        expect(glAccount.normalBalance).toBe(testCase.expectedNormalBalance);
      }
    });
  });

  describe('Journal Entry Management', () => {
    let cashAccount: GLAccount;
    let expenseAccount: GLAccount;

    beforeEach(async () => {
      // Create test accounts
      cashAccount = await generalLedgerService.createGLAccount({
        accountNumber: '1000',
        accountName: 'Cash',
        accountType: 'asset',
        category: 'current_assets',
      }, 'test-user');

      expenseAccount = await generalLedgerService.createGLAccount({
        accountNumber: '5000',
        accountName: 'Operating Expenses',
        accountType: 'expense',
        category: 'operating_expenses',
      }, 'test-user');
    });

    test('should create a balanced journal entry', async () => {
      const request: JournalEntryRequest = {
        entryDate: new Date(),
        description: 'Payment for office supplies',
        reference: 'INV-001',
        sourceType: 'manual',
        lineItems: [
          {
            glAccountId: expenseAccount.id,
            debitAmount: '500.00',
            creditAmount: '0.00',
            description: 'Office supplies expense',
          },
          {
            glAccountId: cashAccount.id,
            debitAmount: '0.00',
            creditAmount: '500.00',
            description: 'Cash payment',
          },
        ],
      };

      const journalEntry = await generalLedgerService.createJournalEntry(request, 'test-user');

      expect(journalEntry).toBeDefined();
      expect(journalEntry.entryNumber).toBeDefined();
      expect(journalEntry.status).toBe('draft');
      expect(journalEntry.isBalanced()).toBe(true);
      expect(journalEntry.getTotalDebitAmountDecimal().toString()).toBe('500');
      expect(journalEntry.getTotalCreditAmountDecimal().toString()).toBe('500');
      expect(journalEntry.lineItems).toBeDefined();
      expect(journalEntry.lineItems!.length).toBe(2);
    });

    test('should reject unbalanced journal entry', async () => {
      const request: JournalEntryRequest = {
        entryDate: new Date(),
        description: 'Unbalanced entry',
        sourceType: 'manual',
        lineItems: [
          {
            glAccountId: expenseAccount.id,
            debitAmount: '500.00',
            creditAmount: '0.00',
          },
          {
            glAccountId: cashAccount.id,
            debitAmount: '0.00',
            creditAmount: '300.00', // Unbalanced!
          },
        ],
      };

      await expect(
        generalLedgerService.createJournalEntry(request, 'test-user')
      ).rejects.toThrow('Journal entry is not balanced');
    });

    test('should reject line items with both debit and credit amounts', async () => {
      const request: JournalEntryRequest = {
        entryDate: new Date(),
        description: 'Invalid line item',
        sourceType: 'manual',
        lineItems: [
          {
            glAccountId: expenseAccount.id,
            debitAmount: '500.00',
            creditAmount: '100.00', // Both debit and credit!
          },
          {
            glAccountId: cashAccount.id,
            debitAmount: '0.00',
            creditAmount: '500.00',
          },
        ],
      };

      await expect(
        generalLedgerService.createJournalEntry(request, 'test-user')
      ).rejects.toThrow('Line item cannot have both debit and credit amounts');
    });

    test('should post a journal entry', async () => {
      // Create a journal entry first
      const request: JournalEntryRequest = {
        entryDate: new Date(),
        description: 'Test posting',
        sourceType: 'manual',
        lineItems: [
          {
            glAccountId: expenseAccount.id,
            debitAmount: '1000.00',
            creditAmount: '0.00',
          },
          {
            glAccountId: cashAccount.id,
            debitAmount: '0.00',
            creditAmount: '1000.00',
          },
        ],
      };

      const journalEntry = await generalLedgerService.createJournalEntry(request, 'test-user');
      expect(journalEntry.status).toBe('draft');

      // Post the entry
      const postedEntry = await generalLedgerService.postJournalEntry(journalEntry.id, 'test-user');

      expect(postedEntry.status).toBe('posted');
      expect(postedEntry.postedBy).toBe('test-user');
      expect(postedEntry.postedAt).toBeDefined();
      expect(postedEntry.canPost()).toBe(false);
      expect(postedEntry.canReverse()).toBe(true);
    });

    test('should reverse a posted journal entry', async () => {
      // Create and post a journal entry
      const request: JournalEntryRequest = {
        entryDate: new Date(),
        description: 'Entry to be reversed',
        sourceType: 'manual',
        lineItems: [
          {
            glAccountId: expenseAccount.id,
            debitAmount: '750.00',
            creditAmount: '0.00',
          },
          {
            glAccountId: cashAccount.id,
            debitAmount: '0.00',
            creditAmount: '750.00',
          },
        ],
      };

      const originalEntry = await generalLedgerService.createJournalEntry(request, 'test-user');
      await generalLedgerService.postJournalEntry(originalEntry.id, 'test-user');

      // Reverse the entry
      const reversalReason = 'Incorrect amount recorded';
      const reversalEntry = await generalLedgerService.reverseJournalEntry(
        originalEntry.id,
        reversalReason,
        'test-user'
      );

      expect(reversalEntry).toBeDefined();
      expect(reversalEntry.status).toBe('posted');
      expect(reversalEntry.description).toContain('Reversal of');
      expect(reversalEntry.lineItems).toBeDefined();
      expect(reversalEntry.lineItems!.length).toBe(2);

      // Check that amounts are reversed
      const originalDebitLine = originalEntry.lineItems!.find(line => 
        line.getDebitAmountDecimal().greaterThan(0)
      );
      const reversalCreditLine = reversalEntry.lineItems!.find(line => 
        line.glAccountId === originalDebitLine!.glAccountId && line.getCreditAmountDecimal().greaterThan(0)
      );

      expect(reversalCreditLine).toBeDefined();
      expect(reversalCreditLine!.getCreditAmountDecimal().toString()).toBe('750');
    });
  });

  describe('Trial Balance and Reporting', () => {
    let accounts: GLAccount[];
    let journalEntries: JournalEntry[];

    beforeEach(async () => {
      // Create test chart of accounts
      accounts = [];
      const accountConfigs = [
        { number: '1000', name: 'Cash', type: 'asset', category: 'current_assets' },
        { number: '1200', name: 'Accounts Receivable', type: 'asset', category: 'current_assets' },
        { number: '2000', name: 'Accounts Payable', type: 'liability', category: 'current_liabilities' },
        { number: '3000', name: 'Capital', type: 'equity', category: 'equity' },
        { number: '4000', name: 'Revenue', type: 'revenue', category: 'operating_revenue' },
        { number: '5000', name: 'Expenses', type: 'expense', category: 'operating_expenses' },
      ];

      for (const config of accountConfigs) {
        const account = await generalLedgerService.createGLAccount({
          accountNumber: config.number,
          accountName: config.name,
          accountType: config.type as any,
          category: config.category as any,
        }, 'test-user');
        accounts.push(account);
      }

      // Create some journal entries for testing
      journalEntries = [];

      // Entry 1: Initial capital investment
      const entry1 = await generalLedgerService.createJournalEntry({
        entryDate: new Date(),
        description: 'Initial capital investment',
        sourceType: 'manual',
        lineItems: [
          {
            glAccountId: accounts.find(a => a.accountNumber === '1000')!.id, // Cash
            debitAmount: '100000.00',
            creditAmount: '0.00',
          },
          {
            glAccountId: accounts.find(a => a.accountNumber === '3000')!.id, // Capital
            debitAmount: '0.00',
            creditAmount: '100000.00',
          },
        ],
      }, 'test-user');
      await generalLedgerService.postJournalEntry(entry1.id, 'test-user');
      journalEntries.push(entry1);

      // Entry 2: Revenue transaction
      const entry2 = await generalLedgerService.createJournalEntry({
        entryDate: new Date(),
        description: 'Service revenue',
        sourceType: 'manual',
        lineItems: [
          {
            glAccountId: accounts.find(a => a.accountNumber === '1200')!.id, // A/R
            debitAmount: '25000.00',
            creditAmount: '0.00',
          },
          {
            glAccountId: accounts.find(a => a.accountNumber === '4000')!.id, // Revenue
            debitAmount: '0.00',
            creditAmount: '25000.00',
          },
        ],
      }, 'test-user');
      await generalLedgerService.postJournalEntry(entry2.id, 'test-user');
      journalEntries.push(entry2);

      // Entry 3: Expense transaction
      const entry3 = await generalLedgerService.createJournalEntry({
        entryDate: new Date(),
        description: 'Operating expenses',
        sourceType: 'manual',
        lineItems: [
          {
            glAccountId: accounts.find(a => a.accountNumber === '5000')!.id, // Expenses
            debitAmount: '15000.00',
            creditAmount: '0.00',
          },
          {
            glAccountId: accounts.find(a => a.accountNumber === '2000')!.id, // A/P
            debitAmount: '0.00',
            creditAmount: '15000.00',
          },
        ],
      }, 'test-user');
      await generalLedgerService.postJournalEntry(entry3.id, 'test-user');
      journalEntries.push(entry3);
    });

    test('should generate trial balance', async () => {
      const options: TrialBalanceOptions = {
        asOfDate: new Date(),
        includeInactive: false,
      };

      const trialBalance = await generalLedgerService.getTrialBalance(options);

      expect(trialBalance).toBeDefined();
      expect(trialBalance.length).toBeGreaterThan(0);

      // Check that we have the expected accounts
      const cashAccount = trialBalance.find(account => account.accountNumber === '1000');
      expect(cashAccount).toBeDefined();
      expect(cashAccount!.accountName).toBe('Cash');
      expect(cashAccount!.debitBalance).toBe('100000'); // Initial capital investment

      const capitalAccount = trialBalance.find(account => account.accountNumber === '3000');
      expect(capitalAccount).toBeDefined();
      expect(capitalAccount!.creditBalance).toBe('100000');

      const revenueAccount = trialBalance.find(account => account.accountNumber === '4000');
      expect(revenueAccount).toBeDefined();
      expect(revenueAccount!.creditBalance).toBe('25000');

      const expenseAccount = trialBalance.find(account => account.accountNumber === '5000');
      expect(expenseAccount).toBeDefined();
      expect(expenseAccount!.debitBalance).toBe('15000');

      // Verify trial balance is balanced
      const totalDebits = trialBalance.reduce((sum, account) => 
        sum + parseFloat(account.debitBalance || '0'), 0
      );
      const totalCredits = trialBalance.reduce((sum, account) => 
        sum + parseFloat(account.creditBalance || '0'), 0
      );

      expect(totalDebits).toBe(totalCredits);
    });

    test('should get account balance for specific account', async () => {
      const cashAccount = accounts.find(a => a.accountNumber === '1000')!;
      const asOfDate = new Date();

      const balance = await generalLedgerService.getAccountBalance(cashAccount.id, asOfDate);

      expect(balance).toBeDefined();
      expect(balance.accountId).toBe(cashAccount.id);
      expect(balance.accountNumber).toBe('1000');
      expect(balance.accountName).toBe('Cash');
      expect(balance.debitTotal).toBe('100000');
      expect(balance.creditTotal).toBe('0');
      expect(balance.balance).toBe('100000');
      expect(balance.balanceType).toBe('debit');
    });

    test('should filter trial balance by account type', async () => {
      const options: TrialBalanceOptions = {
        asOfDate: new Date(),
        accountType: 'asset',
        includeInactive: false,
      };

      const trialBalance = await generalLedgerService.getTrialBalance(options);

      expect(trialBalance).toBeDefined();
      // Should only include asset accounts
      expect(trialBalance.every(account => account.accountType === 'asset')).toBe(true);
      
      const accountNumbers = trialBalance.map(account => account.accountNumber);
      expect(accountNumbers).toContain('1000'); // Cash
      expect(accountNumbers).toContain('1200'); // A/R
      expect(accountNumbers).not.toContain('3000'); // Capital (equity)
    });
  });

  describe('Account Balance Calculations', () => {
    test('should handle Decimal precision correctly', () => {
      const amount1 = new Decimal('1000.12345');
      const amount2 = new Decimal('500.67890');
      const sum = amount1.plus(amount2);

      expect(sum.toString()).toBe('1500.80235');
      expect(sum.toFixed(2)).toBe('1500.80');
    });

    test('should calculate net amounts correctly for line items', () => {
      // Mock line item with debit amount
      const debitLineItem = {
        getDebitAmountDecimal: () => new Decimal('1000'),
        getCreditAmountDecimal: () => new Decimal('0'),
        getNetAmountDecimal: function() {
          return this.getDebitAmountDecimal().minus(this.getCreditAmountDecimal());
        }
      };

      expect(debitLineItem.getNetAmountDecimal().toString()).toBe('1000');

      // Mock line item with credit amount
      const creditLineItem = {
        getDebitAmountDecimal: () => new Decimal('0'),
        getCreditAmountDecimal: () => new Decimal('500'),
        getNetAmountDecimal: function() {
          return this.getDebitAmountDecimal().minus(this.getCreditAmountDecimal());
        }
      };

      expect(creditLineItem.getNetAmountDecimal().toString()).toBe('-500');
    });
  });

  describe('Account Hierarchy and Validation', () => {
    test('should create parent-child account relationships', async () => {
      // Create parent account
      const parentAccount = await generalLedgerService.createGLAccount({
        accountNumber: '1000',
        accountName: 'Current Assets',
        accountType: 'asset',
        category: 'current_assets',
        requiresSubAccount: true,
        allowsDirectPosting: false,
      }, 'test-user');

      // Create child account
      const childAccount = await generalLedgerService.createGLAccount({
        accountNumber: '1100',
        accountName: 'Cash',
        accountType: 'asset',
        category: 'current_assets',
        parentAccountId: parentAccount.id,
      }, 'test-user');

      expect(childAccount.parentAccountId).toBe(parentAccount.id);
      expect(parentAccount.canPostDirectly()).toBe(false);
      expect(childAccount.canPostDirectly()).toBe(true);
    });

    test('should validate that parent account exists', async () => {
      const invalidParentId = 'non-existent-id';

      await expect(
        generalLedgerService.createGLAccount({
          accountNumber: '1100',
          accountName: 'Cash',
          accountType: 'asset',
          category: 'current_assets',
          parentAccountId: invalidParentId,
        }, 'test-user')
      ).rejects.toThrow('Parent account not found');
    });

    test('should prevent posting to accounts that require sub-accounts', async () => {
      const parentAccount = await generalLedgerService.createGLAccount({
        accountNumber: '1000',
        accountName: 'Current Assets',
        accountType: 'asset',
        category: 'current_assets',
        requiresSubAccount: true,
        allowsDirectPosting: false,
      }, 'test-user');

      const request: JournalEntryRequest = {
        entryDate: new Date(),
        description: 'Invalid posting to parent account',
        sourceType: 'manual',
        lineItems: [
          {
            glAccountId: parentAccount.id,
            debitAmount: '1000.00',
            creditAmount: '0.00',
          },
        ],
      };

      await expect(
        generalLedgerService.createJournalEntry(request, 'test-user')
      ).rejects.toThrow('does not allow direct posting');
    });
  });

  describe('Journal Entry Number Generation', () => {
    test('should generate unique entry numbers', () => {
      const date = new Date('2024-01-15');
      const entryNumber1 = JournalEntry.generateEntryNumber(date);
      const entryNumber2 = JournalEntry.generateEntryNumber(date);

      expect(entryNumber1).toMatch(/^JE202401-\d{6}$/);
      expect(entryNumber2).toMatch(/^JE202401-\d{6}$/);
      expect(entryNumber1).not.toBe(entryNumber2);
    });

    test('should include year and month in entry number', () => {
      const date = new Date('2023-12-25');
      const entryNumber = JournalEntry.generateEntryNumber(date);

      expect(entryNumber).toContain('JE202312');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle empty line items array', async () => {
      const request: JournalEntryRequest = {
        entryDate: new Date(),
        description: 'Empty entry',
        sourceType: 'manual',
        lineItems: [],
      };

      await expect(
        generalLedgerService.createJournalEntry(request, 'test-user')
      ).rejects.toThrow(); // Should fail validation
    });

    test('should handle negative amounts', async () => {
      const cashAccount = await generalLedgerService.createGLAccount({
        accountNumber: '1000',
        accountName: 'Cash',
        accountType: 'asset',
        category: 'current_assets',
      }, 'test-user');

      const request: JournalEntryRequest = {
        entryDate: new Date(),
        description: 'Negative amount test',
        sourceType: 'manual',
        lineItems: [
          {
            glAccountId: cashAccount.id,
            debitAmount: '-500.00', // Negative amount
            creditAmount: '0.00',
          },
        ],
      };

      await expect(
        generalLedgerService.createJournalEntry(request, 'test-user')
      ).rejects.toThrow('Debit and credit amounts must be non-negative');
    });

    test('should handle zero amounts correctly', async () => {
      const cashAccount = await generalLedgerService.createGLAccount({
        accountNumber: '1000',
        accountName: 'Cash',
        accountType: 'asset',
        category: 'current_assets',
      }, 'test-user');

      const request: JournalEntryRequest = {
        entryDate: new Date(),
        description: 'Zero amount test',
        sourceType: 'manual',
        lineItems: [
          {
            glAccountId: cashAccount.id,
            debitAmount: '0.00',
            creditAmount: '0.00',
          },
        ],
      };

      await expect(
        generalLedgerService.createJournalEntry(request, 'test-user')
      ).rejects.toThrow('Line item must have either debit or credit amount');
    });
  });
});