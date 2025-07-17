import { Op } from 'sequelize';
import { 
  Fund,
  Commitment,
  Transaction,
  InvestorEntity,
  CapitalActivity,
  FeeCalculation,
  InvestorClass
} from '../models';
import PerformanceAnalyticsService from './PerformanceAnalyticsService';

interface InvestorStatement {
  investor: {
    id: string;
    name: string;
    legalName: string;
    type: string;
    taxId: string;
    address: any;
  };
  fund: {
    id: string;
    name: string;
    code: string;
    vintage: number;
    fundFamily: string;
  };
  statementPeriod: {
    startDate: Date;
    endDate: Date;
    quarterEnding: Date;
  };
  capitalAccount: CapitalAccountSummary;
  activitySummary: ActivitySummary;
  performanceMetrics: PerformanceMetrics;
  cashFlowSummary: CashFlowSummary;
  feesSummary: FeesSummary;
  taxInformation: TaxInformation;
  investmentDetails: InvestmentDetails;
  disclosures: string[];
  attachments: StatementAttachment[];
}

interface CapitalAccountSummary {
  beginningBalance: number;
  capitalCalls: number;
  distributions: number;
  managementFees: number;
  otherCharges: number;
  endingBalance: number;
  unfundedCommitment: number;
  ownershipPercentage: number;
}

interface ActivitySummary {
  transactions: Array<{
    date: Date;
    type: string;
    description: string;
    amount: number;
    balance: number;
  }>;
  capitalCalls: Array<{
    date: Date;
    notice: string;
    requestedAmount: number;
    actualAmount: number;
    purpose: string;
  }>;
  distributions: Array<{
    date: Date;
    type: 'return_of_capital' | 'capital_gains' | 'income';
    grossAmount: number;
    taxes: number;
    netAmount: number;
    source: string;
  }>;
}

interface PerformanceMetrics {
  irr: number;
  moic: number;
  tvpi: number;
  dpi: number;
  rvpi: number;
  calledPercentage: number;
  distributedPercentage: number;
  sinceInception: {
    irr: number;
    moic: number;
    netCashFlow: number;
  };
  yearToDate: {
    capitalCalled: number;
    distributed: number;
    netCashFlow: number;
  };
}

interface CashFlowSummary {
  quarterlyActivity: Array<{
    quarter: string;
    capitalCalls: number;
    distributions: number;
    netCashFlow: number;
  }>;
  cumulativeHistory: Array<{
    date: Date;
    cumulativeCalled: number;
    cumulativeDistributed: number;
    netInvested: number;
  }>;
}

interface FeesSummary {
  managementFees: Array<{
    period: string;
    rate: number;
    basis: number;
    amount: number;
    paid: boolean;
  }>;
  carriedInterest: {
    accrued: number;
    paid: number;
    outstanding: number;
    rate: number;
  };
  otherFees: Array<{
    type: string;
    description: string;
    amount: number;
    date: Date;
  }>;
  totalFeesToDate: number;
}

interface TaxInformation {
  taxYear: number;
  k1Preview: {
    ordinaryIncome: number;
    capitalGains: {
      shortTerm: number;
      longTerm: number;
    };
    section1256Contracts: number;
    otherItems: Array<{
      description: string;
      amount: number;
      code: string;
    }>;
  };
  estimatedTaxes: {
    federal: number;
    state: number;
    total: number;
  };
  costBasis: number;
  unrealizedGains: number;
}

interface InvestmentDetails {
  commitmentDate: Date;
  originalCommitment: number;
  totalCalled: number;
  totalDistributed: number;
  currentNAV: number;
  investorClass: string;
  preferredReturnRate: number;
  carriedInterestRate: number;
  keyTerms: Array<{
    term: string;
    value: string;
  }>;
}

interface StatementAttachment {
  type: 'capital_call_notice' | 'distribution_notice' | 'tax_document' | 'audit_report';
  filename: string;
  description: string;
  date: Date;
  url?: string;
}

interface CapitalAccountStatement {
  investor: any;
  fund: any;
  asOfDate: Date;
  openingBalance: number;
  activity: Array<{
    date: Date;
    description: string;
    debit: number;
    credit: number;
    balance: number;
  }>;
  closingBalance: number;
  reconciliation: {
    beginningCapital: number;
    additionalContributions: number;
    allocatedIncome: number;
    allocatedExpenses: number;
    distributions: number;
    endingCapital: number;
  };
}

export class InvestorStatementService {

  /**
   * Generate comprehensive investor statement for a specific period
   */
  async generateInvestorStatement(
    investorId: string,
    fundId: string,
    startDate: Date,
    endDate: Date,
    includeAttachments: boolean = true
  ): Promise<InvestorStatement> {
    // Get investor and fund information
    const investor = await InvestorEntity.findByPk(investorId);
    const fund = await Fund.findByPk(fundId, {
      include: [{ model: Fund, as: 'fundFamily' }]
    });

    if (!investor || !fund) {
      throw new Error('Investor or Fund not found');
    }

    // Get commitment information
    const commitment = await Commitment.findOne({
      where: { investorEntityId: investorId, fundId, status: 'active' },
      include: [{ model: InvestorClass, as: 'investorClass' }]
    });

    if (!commitment) {
      throw new Error('No active commitment found for investor in this fund');
    }

    // Get transactions for the period
    const transactions = await Transaction.findAll({
      where: {
        commitmentId: commitment.id,
        transactionDate: { [Op.between]: [startDate, endDate] }
      },
      order: [['transactionDate', 'asc']]
    });

    // Get all historical transactions for cumulative calculations
    const allTransactions = await Transaction.findAll({
      where: {
        commitmentId: commitment.id,
        transactionDate: { [Op.lte]: endDate }
      },
      order: [['transactionDate', 'asc']]
    });

    // Build statement components
    const capitalAccount = await this.buildCapitalAccountSummary(
      commitment,
      allTransactions,
      startDate,
      endDate
    );

    const activitySummary = await this.buildActivitySummary(
      commitment,
      transactions,
      startDate,
      endDate
    );

    const performanceMetrics = await this.buildPerformanceMetrics(
      investorId,
      fundId,
      endDate
    );

    const cashFlowSummary = await this.buildCashFlowSummary(
      commitment,
      allTransactions,
      endDate
    );

    const feesSummary = await this.buildFeesSummary(
      commitment,
      startDate,
      endDate
    );

    const taxInformation = await this.buildTaxInformation(
      commitment,
      endDate.getFullYear()
    );

    const investmentDetails = this.buildInvestmentDetails(commitment);

    const disclosures = this.getStandardDisclosures();

    let attachments: StatementAttachment[] = [];
    if (includeAttachments) {
      attachments = await this.gatherStatementAttachments(
        investorId,
        fundId,
        startDate,
        endDate
      );
    }

    return {
      investor: {
        id: investor.id.toString(),
        name: investor.name,
        legalName: investor.legalName,
        type: investor.type || 'Unknown',
        taxId: investor.taxId || 'Unknown',
        address: investor.address
      },
      fund: {
        id: fund.id.toString(),
        name: fund.name,
        code: fund.code,
        vintage: fund.vintage,
        fundFamily: fund.fundFamily?.name || ''
      },
      statementPeriod: {
        startDate,
        endDate,
        quarterEnding: this.getQuarterEnd(endDate)
      },
      capitalAccount,
      activitySummary,
      performanceMetrics,
      cashFlowSummary,
      feesSummary,
      taxInformation,
      investmentDetails,
      disclosures,
      attachments
    };
  }

  /**
   * Generate capital account statement with detailed transaction history
   */
  async generateCapitalAccountStatement(
    investorId: string,
    fundId: string,
    asOfDate: Date
  ): Promise<CapitalAccountStatement> {
    const investor = await InvestorEntity.findByPk(investorId);
    const fund = await Fund.findByPk(fundId);
    const commitment = await Commitment.findOne({
      where: { investorEntityId: investorId, fundId, status: 'active' }
    });

    if (!investor || !fund || !commitment) {
      throw new Error('Required entities not found');
    }

    const transactions = await Transaction.findAll({
      where: {
        commitmentId: commitment.id,
        transactionDate: { [Op.lte]: asOfDate }
      },
      order: [['transactionDate', 'asc']]
    });

    let runningBalance = 0;
    const activity = transactions.map(transaction => {
      const amount = parseFloat(transaction.amount);
      let debit = 0;
      let credit = 0;

      switch (transaction.transactionType) {
        case 'capital_call':
          debit = amount;
          runningBalance += amount;
          break;
        case 'distribution':
          credit = amount;
          runningBalance -= amount;
          break;
        case 'fee':
          debit = amount;
          runningBalance += amount;
          break;
      }

      return {
        date: transaction.transactionDate,
        description: this.getTransactionDescription(transaction),
        debit,
        credit,
        balance: runningBalance
      };
    });

    // Calculate reconciliation components
    const reconciliation = this.calculateCapitalReconciliation(transactions, commitment);

    return {
      investor,
      fund,
      asOfDate,
      openingBalance: 0, // Would be calculated based on previous period
      activity,
      closingBalance: runningBalance,
      reconciliation
    };
  }

  /**
   * Generate quarterly statements for all investors in a fund
   */
  async generateQuarterlyStatements(
    fundId: string,
    quarterEndDate: Date,
    options: {
      includeAttachments?: boolean;
      emailDelivery?: boolean;
      customTemplate?: string;
    } = {}
  ): Promise<Array<{
    investor: any;
    statement: InvestorStatement;
    deliveryStatus: 'pending' | 'sent' | 'failed';
  }>> {
    const quarterStartDate = this.getQuarterStart(quarterEndDate);
    
    const commitments = await Commitment.findAll({
      where: { fundId, status: 'active' },
      include: [
        { model: InvestorEntity, as: 'investorEntity' }
      ]
    });

    const results = [];

    for (const commitment of commitments) {
      try {
        const statement = await this.generateInvestorStatement(
          commitment.investorEntityId.toString(),
          fundId.toString(),
          quarterStartDate,
          quarterEndDate,
          options.includeAttachments
        );

        let deliveryStatus: 'pending' | 'sent' | 'failed' = 'pending';
        
        if (options.emailDelivery) {
          deliveryStatus = await this.deliverStatement(
            commitment.investorEntity,
            statement,
            options.customTemplate
          );
        }

        results.push({
          investor: commitment.investorEntity,
          statement,
          deliveryStatus
        });

      } catch (error) {
        console.error(`Failed to generate statement for investor ${commitment.investorEntityId}:`, error);
        results.push({
          investor: commitment.investorEntity,
          statement: null as any,
          deliveryStatus: 'failed' as 'pending' | 'sent' | 'failed'
        });
      }
    }

    return results;
  }

  /**
   * Generate annual tax package for investor
   */
  async generateAnnualTaxPackage(
    investorId: string,
    fundId: string,
    taxYear: number
  ): Promise<{
    k1Statement: any;
    capitalAccountStatement: CapitalAccountStatement;
    transactionHistory: any[];
    taxSummary: TaxInformation;
    supportingDocuments: StatementAttachment[];
  }> {
    const yearStart = new Date(taxYear, 0, 1);
    const yearEnd = new Date(taxYear, 11, 31);

    const statement = await this.generateInvestorStatement(
      investorId,
      fundId,
      yearStart,
      yearEnd,
      true
    );

    const capitalAccountStatement = await this.generateCapitalAccountStatement(
      investorId,
      fundId,
      yearEnd
    );

    const transactionHistory = await this.getAnnualTransactionHistory(
      investorId,
      fundId,
      taxYear
    );

    const k1Statement = await this.generateK1Statement(
      investorId,
      fundId,
      taxYear
    );

    const supportingDocuments = await this.gatherTaxSupportingDocuments(
      investorId,
      fundId,
      taxYear
    );

    return {
      k1Statement,
      capitalAccountStatement,
      transactionHistory,
      taxSummary: statement.taxInformation,
      supportingDocuments
    };
  }

  /**
   * Build capital account summary
   */
  private async buildCapitalAccountSummary(
    commitment: any,
    allTransactions: any[],
    startDate: Date,
    endDate: Date
  ): Promise<CapitalAccountSummary> {
    // Get beginning balance (transactions before start date)
    const priorTransactions = allTransactions.filter(t => 
      t.transactionDate < startDate
    );

    const periodTransactions = allTransactions.filter(t => 
      t.transactionDate >= startDate && t.transactionDate <= endDate
    );

    const beginningBalance = this.calculateBalanceFromTransactions(priorTransactions);
    
    const periodSummary = periodTransactions.reduce((acc, transaction) => {
      const amount = parseFloat(transaction.amount);
      
      switch (transaction.transactionType) {
        case 'capital_call':
          acc.capitalCalls += amount;
          break;
        case 'distribution':
          acc.distributions += amount;
          break;
        case 'fee':
          if (transaction.feeType === 'management') {
            acc.managementFees += amount;
          } else {
            acc.otherCharges += amount;
          }
          break;
      }
      
      return acc;
    }, {
      capitalCalls: 0,
      distributions: 0,
      managementFees: 0,
      otherCharges: 0
    });

    const endingBalance = beginningBalance + 
      periodSummary.capitalCalls - 
      periodSummary.distributions - 
      periodSummary.managementFees - 
      periodSummary.otherCharges;

    const totalCalled = allTransactions
      .filter(t => t.transactionType === 'capital_call')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const unfundedCommitment = Math.max(0, 
      parseFloat(commitment.commitmentAmount) - totalCalled
    );

    // Calculate ownership percentage (simplified)
    const ownershipPercentage = 0.05; // Would be calculated based on fund structure

    return {
      beginningBalance,
      ...periodSummary,
      endingBalance,
      unfundedCommitment,
      ownershipPercentage
    };
  }

  /**
   * Build activity summary
   */
  private async buildActivitySummary(
    commitment: any,
    transactions: any[],
    startDate: Date,
    endDate: Date
  ): Promise<ActivitySummary> {
    let runningBalance = 0;

    const transactionList = transactions.map(transaction => {
      const amount = parseFloat(transaction.amount);
      
      if (transaction.transactionType === 'capital_call') {
        runningBalance += amount;
      } else if (transaction.transactionType === 'distribution') {
        runningBalance -= amount;
      }

      return {
        date: transaction.transactionDate,
        type: transaction.transactionType,
        description: this.getTransactionDescription(transaction),
        amount,
        balance: runningBalance
      };
    });

    // Get capital calls
    const capitalCalls = await CapitalActivity.findAll({
      where: {
        fundId: commitment.fundId,
        eventDate: { [Op.between]: [startDate, endDate] },
        eventType: 'capital_call'
      }
    });

    const capitalCallsList = capitalCalls.map(call => ({
      date: call.eventDate,
      notice: call.metadata?.noticeId || 'N/A',
      requestedAmount: parseFloat(call.totalAmount),
      actualAmount: parseFloat(call.totalAmount), // Simplified
      purpose: call.description || 'Investment purposes'
    }));

    // Get distributions
    const distributions = transactions
      .filter(t => t.transactionType === 'distribution')
      .map(dist => ({
        date: dist.transactionDate,
        type: 'return_of_capital' as const, // Simplified
        grossAmount: parseFloat(dist.amount),
        taxes: 0, // Would be calculated
        netAmount: parseFloat(dist.amount),
        source: 'Portfolio realization'
      }));

    return {
      transactions: transactionList,
      capitalCalls: capitalCallsList,
      distributions
    };
  }

  /**
   * Build performance metrics
   */
  private async buildPerformanceMetrics(
    investorId: string,
    fundId: string,
    asOfDate: Date
  ): Promise<PerformanceMetrics> {
    const metrics = await PerformanceAnalyticsService.calculateInvestorPerformance(
      investorId,
      fundId,
      asOfDate
    );

    // Calculate year-to-date metrics
    const yearStart = new Date(asOfDate.getFullYear(), 0, 1);
    const ytdMetrics = await this.calculateYTDMetrics(investorId, fundId, yearStart, asOfDate);

    return {
      ...metrics,
      sinceInception: {
        irr: metrics.irr,
        moic: metrics.moic,
        netCashFlow: 0 // Would be calculated
      },
      yearToDate: ytdMetrics
    };
  }

  /**
   * Build cash flow summary
   */
  private async buildCashFlowSummary(
    _commitment: any,
    allTransactions: any[],
    _endDate: Date
  ): Promise<CashFlowSummary> {
    // Group transactions by quarter
    const quarterlyMap = new Map();
    
    allTransactions.forEach(transaction => {
      const quarter = this.getQuarterKey(transaction.transactionDate);
      if (!quarterlyMap.has(quarter)) {
        quarterlyMap.set(quarter, { capitalCalls: 0, distributions: 0 });
      }
      
      const amount = parseFloat(transaction.amount);
      const quarterData = quarterlyMap.get(quarter);
      
      if (transaction.transactionType === 'capital_call') {
        quarterData.capitalCalls += amount;
      } else if (transaction.transactionType === 'distribution') {
        quarterData.distributions += amount;
      }
    });

    const quarterlyActivity = Array.from(quarterlyMap.entries()).map(([quarter, data]) => ({
      quarter,
      capitalCalls: data.capitalCalls,
      distributions: data.distributions,
      netCashFlow: data.distributions - data.capitalCalls
    }));

    // Build cumulative history
    let cumulativeCalled = 0;
    let cumulativeDistributed = 0;

    const cumulativeHistory = allTransactions.map(transaction => {
      const amount = parseFloat(transaction.amount);
      
      if (transaction.transactionType === 'capital_call') {
        cumulativeCalled += amount;
      } else if (transaction.transactionType === 'distribution') {
        cumulativeDistributed += amount;
      }

      return {
        date: transaction.transactionDate,
        cumulativeCalled,
        cumulativeDistributed,
        netInvested: cumulativeCalled - cumulativeDistributed
      };
    });

    return {
      quarterlyActivity,
      cumulativeHistory
    };
  }

  /**
   * Build fees summary
   */
  private async buildFeesSummary(
    commitment: any,
    startDate: Date,
    endDate: Date
  ): Promise<FeesSummary> {
    const feeCalculations = await FeeCalculation.findAll({
      where: {
        fundId: commitment.fundId,
        calculationDate: { [Op.between]: [startDate, endDate] }
      }
    });

    const managementFees = feeCalculations
      .filter(fee => fee.feeType === 'management')
      .map(fee => ({
        period: this.getQuarterKey(fee.calculationDate),
        rate: parseFloat(fee.feeRate),
        basis: parseFloat(fee.basisAmount),
        amount: parseFloat(fee.netFeeAmount),
        paid: fee.status === 'paid'
      }));

    // Get carried interest information
    const carriedInterest = {
      accrued: 0,
      paid: 0,
      outstanding: 0,
      rate: 0.20 // Default 20%
    };

    const otherFees: any[] = []; // Would be populated from other fee types

    const totalFeesToDate = feeCalculations.reduce((sum, fee) => 
      sum + parseFloat(fee.netFeeAmount), 0
    );

    return {
      managementFees,
      carriedInterest,
      otherFees,
      totalFeesToDate
    };
  }

  /**
   * Build tax information
   */
  private async buildTaxInformation(
    _commitment: any,
    taxYear: number
  ): Promise<TaxInformation> {
    // This would integrate with tax calculation services
    // For now, returning simplified structure
    
    return {
      taxYear,
      k1Preview: {
        ordinaryIncome: 0,
        capitalGains: {
          shortTerm: 0,
          longTerm: 0
        },
        section1256Contracts: 0,
        otherItems: []
      },
      estimatedTaxes: {
        federal: 0,
        state: 0,
        total: 0
      },
      costBasis: 0,
      unrealizedGains: 0
    };
  }

  /**
   * Build investment details
   */
  private buildInvestmentDetails(commitment: any): InvestmentDetails {
    return {
      commitmentDate: commitment.commitmentDate,
      originalCommitment: parseFloat(commitment.commitmentAmount),
      totalCalled: 0, // Would be calculated
      totalDistributed: 0, // Would be calculated
      currentNAV: 0, // Would be calculated
      investorClass: commitment.investorClass?.name || 'General',
      preferredReturnRate: 0.08, // 8% default
      carriedInterestRate: 0.20, // 20% default
      keyTerms: [
        { term: 'Fund Term', value: '10 years + 2 year extension' },
        { term: 'Management Fee', value: '2% on committed capital' },
        { term: 'Carried Interest', value: '20% above 8% preferred return' }
      ]
    };
  }

  // Helper methods

  private calculateBalanceFromTransactions(transactions: any[]): number {
    return transactions.reduce((balance, transaction) => {
      const amount = parseFloat(transaction.amount);
      
      if (transaction.transactionType === 'capital_call') {
        balance += amount;
      } else if (transaction.transactionType === 'distribution') {
        balance -= amount;
      }
      
      return balance;
    }, 0);
  }

  private getTransactionDescription(transaction: any): string {
    const typeMap = {
      capital_call: 'Capital Call',
      distribution: 'Distribution',
      fee: 'Management Fee',
      carried_interest: 'Carried Interest'
    };
    
    return typeMap[transaction.transactionType as keyof typeof typeMap] || transaction.transactionType;
  }

  private calculateCapitalReconciliation(_transactions: any[], _commitment: any): any {
    // Simplified reconciliation calculation
    return {
      beginningCapital: 0,
      additionalContributions: 0,
      allocatedIncome: 0,
      allocatedExpenses: 0,
      distributions: 0,
      endingCapital: 0
    };
  }

  private getQuarterEnd(date: Date): Date {
    const quarter = Math.floor(date.getMonth() / 3);
    const quarterEndMonth = (quarter + 1) * 3 - 1;
    return new Date(date.getFullYear(), quarterEndMonth, 31);
  }

  private getQuarterStart(quarterEnd: Date): Date {
    const quarter = Math.floor(quarterEnd.getMonth() / 3);
    const quarterStartMonth = quarter * 3;
    return new Date(quarterEnd.getFullYear(), quarterStartMonth, 1);
  }

  private getQuarterKey(date: Date): string {
    const quarter = Math.floor(date.getMonth() / 3) + 1;
    return `Q${quarter} ${date.getFullYear()}`;
  }

  private async calculateYTDMetrics(
    _investorId: string,
    _fundId: string,
    _yearStart: Date,
    _asOfDate: Date
  ): Promise<any> {
    // Simplified YTD calculation
    return {
      capitalCalled: 0,
      distributed: 0,
      netCashFlow: 0
    };
  }

  private getStandardDisclosures(): string[] {
    return [
      'This statement is for informational purposes only and does not constitute an offer to sell or solicitation of an offer to buy any security.',
      'Past performance is not indicative of future results.',
      'All amounts are subject to final audit adjustments.',
      'Please retain this statement for your tax records.'
    ];
  }

  private async gatherStatementAttachments(
    _investorId: string,
    _fundId: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<StatementAttachment[]> {
    // Would gather actual attachments from document storage
    return [];
  }

  private async deliverStatement(
    _investor: any,
    _statement: InvestorStatement,
    _customTemplate?: string
  ): Promise<'sent' | 'failed'> {
    // Would integrate with email delivery service
    return 'sent';
  }

  private async getAnnualTransactionHistory(
    _investorId: string,
    _fundId: string,
    _taxYear: number
  ): Promise<any[]> {
    // Would return detailed transaction history for tax purposes
    return [];
  }

  private async generateK1Statement(
    _investorId: string,
    _fundId: string,
    _taxYear: number
  ): Promise<any> {
    // Would generate actual K-1 tax document
    return {};
  }

  private async gatherTaxSupportingDocuments(
    _investorId: string,
    _fundId: string,
    _taxYear: number
  ): Promise<StatementAttachment[]> {
    // Would gather tax-related supporting documents
    return [];
  }
}

export default new InvestorStatementService();