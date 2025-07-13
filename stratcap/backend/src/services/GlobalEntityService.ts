import { Op, QueryTypes, Transaction } from 'sequelize';
import { Fund } from '../models/Fund';
import { FundFamily } from '../models/FundFamily';
import { InvestorEntity } from '../models/InvestorEntity';
import { Commitment } from '../models/Commitment';
import { Investment } from '../models/Investment';
import { CapitalActivity } from '../models/CapitalActivity';
import { Transaction as TransactionModel } from '../models/Transaction';
import { Decimal } from 'decimal.js';
import sequelize from '../db/database';

export interface GlobalInvestorSummary {
  investorId: string;
  investorName: string;
  investorType: string;
  totalCommitments: Decimal;
  totalContributions: Decimal;
  totalDistributions: Decimal;
  currentNAV: Decimal;
  totalValue: Decimal;
  multipleOfMoney: Decimal;
  irr: Decimal;
  fundCount: number;
  funds: Array<{
    fundId: string;
    fundName: string;
    vintage: number;
    commitment: Decimal;
    contributions: Decimal;
    distributions: Decimal;
    nav: Decimal;
    totalValue: Decimal;
    multiple: Decimal;
  }>;
  firstInvestmentDate: Date;
  lastActivity: Date;
  geography: string;
  sector?: string;
  riskProfile: string;
  status: 'active' | 'inactive' | 'prospective';
}

export interface GlobalFundSummary {
  fundId: string;
  fundName: string;
  fundFamilyName: string;
  vintage: number;
  type: string;
  targetSize: Decimal;
  totalCommitments: Decimal;
  totalContributions: Decimal;
  totalDistributions: Decimal;
  nav: Decimal;
  totalValue: Decimal;
  multipleOfMoney: Decimal;
  irr: Decimal;
  investorCount: number;
  investmentCount: number;
  status: string;
  investmentPeriod: {
    start: Date;
    end?: Date;
    remaining: number; // days
  };
  topInvestors: Array<{
    investorName: string;
    commitment: Decimal;
    percentage: Decimal;
  }>;
  geography: string[];
  sectors: string[];
}

export interface GlobalInvestmentSummary {
  investmentId: string;
  portfolioCompany: string;
  sector: string;
  geography: string;
  totalInvested: Decimal;
  currentValue: Decimal;
  totalRealized: Decimal;
  totalValue: Decimal;
  multipleOfMoney: Decimal;
  irr: Decimal;
  investmentDate: Date;
  status: 'active' | 'realized' | 'written_off';
  funds: Array<{
    fundId: string;
    fundName: string;
    invested: Decimal;
    currentValue: Decimal;
    percentage: Decimal;
  }>;
  rounds: Array<{
    date: Date;
    amount: Decimal;
    type: string;
    leadFund?: string;
  }>;
  lastValuation: {
    date: Date;
    amount: Decimal;
    method: string;
  };
}

export interface GlobalEntityMetrics {
  totalFunds: number;
  totalInvestors: number;
  totalInvestments: number;
  totalCommitments: Decimal;
  totalContributions: Decimal;
  totalDistributions: Decimal;
  totalNAV: Decimal;
  overallMultiple: Decimal;
  overallIRR: Decimal;
  avgFundSize: Decimal;
  avgCommitmentSize: Decimal;
  geographyBreakdown: Record<string, {
    count: number;
    percentage: Decimal;
    totalValue: Decimal;
  }>;
  sectorBreakdown: Record<string, {
    count: number;
    percentage: Decimal;
    totalValue: Decimal;
  }>;
  vintageBreakdown: Record<number, {
    fundCount: number;
    totalSize: Decimal;
    totalCommitments: Decimal;
  }>;
}

export interface EntitySearchFilters {
  entityType?: 'investor' | 'fund' | 'investment';
  geography?: string[];
  sector?: string[];
  vintage?: number[];
  minCommitment?: string;
  maxCommitment?: string;
  status?: string[];
  investorType?: string[];
  fundType?: string[];
  searchTerm?: string;
  sortBy?: 'name' | 'commitment' | 'value' | 'irr' | 'multiple' | 'date';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface RelationshipMap {
  investors: Array<{
    investorId: string;
    investorName: string;
    funds: string[];
    totalCommitment: Decimal;
    firstInvestment: Date;
    relationshipStrength: 'strong' | 'medium' | 'weak';
  }>;
  funds: Array<{
    fundId: string;
    fundName: string;
    vintage: number;
    sharedInvestors: Array<{
      investorId: string;
      investorName: string;
      overlapFunds: string[];
    }>;
  }>;
  crossInvestments: Array<{
    investorId: string;
    investorName: string;
    fundInvestments: Array<{
      fundId: string;
      fundName: string;
      commitment: Decimal;
      contributions: Decimal;
    }>;
  }>;
}

export class GlobalEntityService {

  /**
   * Get comprehensive global investor summary
   */
  async getGlobalInvestorSummary(investorId: string): Promise<GlobalInvestorSummary> {
    const investor = await InvestorEntity.findByPk(investorId);
    if (!investor) {
      throw new Error(`Investor with ID ${investorId} not found`);
    }

    // Get all commitments for this investor across all funds
    const commitments = await Commitment.findAll({
      where: { investorId },
      include: [
        {
          model: Fund,
          as: 'fund',
          include: [
            { model: FundFamily, as: 'fundFamily' }
          ]
        }
      ]
    });

    let totalCommitments = new Decimal(0);
    let totalContributions = new Decimal(0);
    let totalDistributions = new Decimal(0);
    let currentNAV = new Decimal(0);
    let firstInvestmentDate: Date | null = null;
    let lastActivity: Date | null = null;

    const fundDetails: any[] = [];

    for (const commitment of commitments) {
      const commitmentAmount = new Decimal(commitment.commitmentAmount);
      const contributedAmount = new Decimal(commitment.contributedAmount || '0');
      const distributedAmount = new Decimal(commitment.distributedAmount || '0');
      const navAmount = new Decimal(commitment.currentNav || '0');

      totalCommitments = totalCommitments.plus(commitmentAmount);
      totalContributions = totalContributions.plus(contributedAmount);
      totalDistributions = totalDistributions.plus(distributedAmount);
      currentNAV = currentNAV.plus(navAmount);

      // Calculate fund-level metrics
      const totalValue = navAmount.plus(distributedAmount);
      const multiple = contributedAmount.isZero() ? new Decimal(0) : totalValue.dividedBy(contributedAmount);

      fundDetails.push({
        fundId: commitment.fund.id,
        fundName: commitment.fund.name,
        vintage: commitment.fund.vintage,
        commitment: commitmentAmount,
        contributions: contributedAmount,
        distributions: distributedAmount,
        nav: navAmount,
        totalValue,
        multiple,
      });

      // Track dates
      if (!firstInvestmentDate || commitment.createdAt < firstInvestmentDate) {
        firstInvestmentDate = commitment.createdAt;
      }
      if (!lastActivity || commitment.updatedAt > lastActivity) {
        lastActivity = commitment.updatedAt;
      }
    }

    // Calculate overall metrics
    const totalValue = currentNAV.plus(totalDistributions);
    const multipleOfMoney = totalContributions.isZero() ? new Decimal(0) : totalValue.dividedBy(totalContributions);
    const irr = await this.calculateInvestorIRR(investorId);

    return {
      investorId: investor.id,
      investorName: investor.name,
      investorType: investor.entityType,
      totalCommitments,
      totalContributions,
      totalDistributions,
      currentNAV,
      totalValue,
      multipleOfMoney,
      irr,
      fundCount: commitments.length,
      funds: fundDetails,
      firstInvestmentDate: firstInvestmentDate!,
      lastActivity: lastActivity!,
      geography: investor.geography || 'Unknown',
      sector: investor.sector,
      riskProfile: investor.riskProfile || 'Medium',
      status: investor.status as any,
    };
  }

  /**
   * Get comprehensive global fund summary
   */
  async getGlobalFundSummary(fundId: string): Promise<GlobalFundSummary> {
    const fund = await Fund.findByPk(fundId, {
      include: [
        { model: FundFamily, as: 'fundFamily' }
      ]
    });

    if (!fund) {
      throw new Error(`Fund with ID ${fundId} not found`);
    }

    // Get all commitments for this fund
    const commitments = await Commitment.findAll({
      where: { fundId },
      include: [
        { model: InvestorEntity, as: 'investor' }
      ]
    });

    // Get all investments for this fund
    const investments = await Investment.findAll({
      where: { fundId }
    });

    // Calculate fund metrics
    let totalCommitments = new Decimal(0);
    let totalContributions = new Decimal(0);
    let totalDistributions = new Decimal(0);
    let nav = new Decimal(0);

    const topInvestors: any[] = [];
    const geographies = new Set<string>();
    const sectors = new Set<string>();

    for (const commitment of commitments) {
      const commitmentAmount = new Decimal(commitment.commitmentAmount);
      const contributedAmount = new Decimal(commitment.contributedAmount || '0');
      const distributedAmount = new Decimal(commitment.distributedAmount || '0');
      const navAmount = new Decimal(commitment.currentNav || '0');

      totalCommitments = totalCommitments.plus(commitmentAmount);
      totalContributions = totalContributions.plus(contributedAmount);
      totalDistributions = totalDistributions.plus(distributedAmount);
      nav = nav.plus(navAmount);

      topInvestors.push({
        investorName: commitment.investor.name,
        commitment: commitmentAmount,
        percentage: new Decimal(0), // Will calculate after total is known
      });

      if (commitment.investor.geography) {
        geographies.add(commitment.investor.geography);
      }
      if (commitment.investor.sector) {
        sectors.add(commitment.investor.sector);
      }
    }

    // Calculate percentages for top investors
    topInvestors.forEach(investor => {
      investor.percentage = totalCommitments.isZero() 
        ? new Decimal(0) 
        : investor.commitment.dividedBy(totalCommitments).times(100);
    });

    // Sort and get top 10 investors
    topInvestors.sort((a, b) => b.commitment.comparedTo(a.commitment));
    const top10Investors = topInvestors.slice(0, 10);

    // Calculate fund performance metrics
    const totalValue = nav.plus(totalDistributions);
    const multipleOfMoney = totalContributions.isZero() ? new Decimal(0) : totalValue.dividedBy(totalContributions);
    const irr = await this.calculateFundIRR(fundId);

    // Calculate investment period remaining
    const today = new Date();
    let remainingDays = 0;
    if (fund.investmentPeriodEnd && fund.investmentPeriodEnd > today) {
      remainingDays = Math.ceil((fund.investmentPeriodEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    }

    return {
      fundId: fund.id,
      fundName: fund.name,
      fundFamilyName: fund.fundFamily?.name || 'Unknown',
      vintage: fund.vintage,
      type: fund.type,
      targetSize: new Decimal(fund.targetSize),
      totalCommitments,
      totalContributions,
      totalDistributions,
      nav,
      totalValue,
      multipleOfMoney,
      irr,
      investorCount: commitments.length,
      investmentCount: investments.length,
      status: fund.status,
      investmentPeriod: {
        start: fund.createdAt,
        end: fund.investmentPeriodEnd,
        remaining: remainingDays,
      },
      topInvestors: top10Investors,
      geography: Array.from(geographies),
      sectors: Array.from(sectors),
    };
  }

  /**
   * Get comprehensive global investment summary
   */
  async getGlobalInvestmentSummary(investmentId: string): Promise<GlobalInvestmentSummary> {
    const investment = await Investment.findByPk(investmentId, {
      include: [
        {
          model: Fund,
          as: 'fund',
          include: [{ model: FundFamily, as: 'fundFamily' }]
        }
      ]
    });

    if (!investment) {
      throw new Error(`Investment with ID ${investmentId} not found`);
    }

    // Get all transactions for this investment across all funds
    const transactions = await TransactionModel.findAll({
      where: { investmentId },
      include: [
        { model: Fund, as: 'fund' }
      ],
      order: [['transactionDate', 'ASC']]
    });

    // Calculate investment metrics
    let totalInvested = new Decimal(0);
    let totalRealized = new Decimal(0);
    const fundBreakdown = new Map<string, any>();
    const rounds: any[] = [];

    for (const transaction of transactions) {
      const amount = new Decimal(transaction.amount);

      if (transaction.transactionType === 'investment') {
        totalInvested = totalInvested.plus(amount);
        
        // Track fund breakdown
        const fundId = transaction.fundId;
        if (!fundBreakdown.has(fundId)) {
          fundBreakdown.set(fundId, {
            fundId,
            fundName: transaction.fund.name,
            invested: new Decimal(0),
            currentValue: new Decimal(0),
            percentage: new Decimal(0),
          });
        }
        const fundData = fundBreakdown.get(fundId);
        fundData.invested = fundData.invested.plus(amount);

        // Track investment rounds
        rounds.push({
          date: transaction.transactionDate,
          amount,
          type: transaction.metadata?.roundType || 'Unknown',
          leadFund: transaction.fund.name,
        });
      } else if (transaction.transactionType === 'distribution') {
        totalRealized = totalRealized.plus(amount);
      }
    }

    // Get current valuation
    const currentValue = new Decimal(investment.currentValue || '0');
    const totalValue = currentValue.plus(totalRealized);
    const multipleOfMoney = totalInvested.isZero() ? new Decimal(0) : totalValue.dividedBy(totalInvested);
    const irr = await this.calculateInvestmentIRR(investmentId);

    // Update fund breakdown with current values and percentages
    const fundArray: any[] = [];
    for (const [fundId, fundData] of fundBreakdown) {
      fundData.currentValue = totalInvested.isZero() 
        ? new Decimal(0) 
        : currentValue.times(fundData.invested.dividedBy(totalInvested));
      
      fundData.percentage = totalInvested.isZero() 
        ? new Decimal(0) 
        : fundData.invested.dividedBy(totalInvested).times(100);
      
      fundArray.push(fundData);
    }

    return {
      investmentId: investment.id,
      portfolioCompany: investment.portfolioCompany,
      sector: investment.sector,
      geography: investment.geography,
      totalInvested,
      currentValue,
      totalRealized,
      totalValue,
      multipleOfMoney,
      irr,
      investmentDate: investment.investmentDate,
      status: investment.status as any,
      funds: fundArray,
      rounds,
      lastValuation: {
        date: investment.updatedAt,
        amount: currentValue,
        method: investment.valuationMethod || 'Unknown',
      },
    };
  }

  /**
   * Get global entity metrics across all funds
   */
  async getGlobalEntityMetrics(): Promise<GlobalEntityMetrics> {
    // Get basic counts
    const [fundCount, investorCount, investmentCount] = await Promise.all([
      Fund.count(),
      InvestorEntity.count(),
      Investment.count(),
    ]);

    // Get aggregate financial metrics
    const commitmentQuery = `
      SELECT 
        SUM(CAST(commitment_amount AS DECIMAL)) as total_commitments,
        SUM(CAST(contributed_amount AS DECIMAL)) as total_contributions,
        SUM(CAST(distributed_amount AS DECIMAL)) as total_distributions,
        SUM(CAST(current_nav AS DECIMAL)) as total_nav,
        AVG(CAST(commitment_amount AS DECIMAL)) as avg_commitment
      FROM "Commitments"
      WHERE commitment_amount IS NOT NULL
    `;

    const [commitmentMetrics] = await sequelize.query(commitmentQuery, {
      type: QueryTypes.SELECT,
    }) as any[];

    const totalCommitments = new Decimal(commitmentMetrics.total_commitments || 0);
    const totalContributions = new Decimal(commitmentMetrics.total_contributions || 0);
    const totalDistributions = new Decimal(commitmentMetrics.total_distributions || 0);
    const totalNAV = new Decimal(commitmentMetrics.total_nav || 0);
    const avgCommitmentSize = new Decimal(commitmentMetrics.avg_commitment || 0);

    // Calculate overall performance
    const overallMultiple = totalContributions.isZero() 
      ? new Decimal(0) 
      : totalNAV.plus(totalDistributions).dividedBy(totalContributions);

    // Get fund size metrics
    const fundSizeQuery = `
      SELECT AVG(CAST(target_size AS DECIMAL)) as avg_fund_size
      FROM "Funds"
      WHERE target_size IS NOT NULL
    `;

    const [fundSizeMetrics] = await sequelize.query(fundSizeQuery, {
      type: QueryTypes.SELECT,
    }) as any[];

    const avgFundSize = new Decimal(fundSizeMetrics.avg_fund_size || 0);

    // Get geography breakdown
    const geographyQuery = `
      SELECT 
        geography,
        COUNT(*) as count,
        SUM(CAST(commitment_amount AS DECIMAL)) as total_value
      FROM "InvestorEntities" ie
      LEFT JOIN "Commitments" c ON ie.id = c.investor_id
      WHERE ie.geography IS NOT NULL
      GROUP BY geography
      ORDER BY total_value DESC
    `;

    const geographyData = await sequelize.query(geographyQuery, {
      type: QueryTypes.SELECT,
    }) as any[];

    const geographyBreakdown: Record<string, any> = {};
    const totalInvestors = geographyData.reduce((sum, item) => sum + parseInt(item.count), 0);

    for (const item of geographyData) {
      geographyBreakdown[item.geography] = {
        count: parseInt(item.count),
        percentage: new Decimal(item.count).dividedBy(totalInvestors).times(100),
        totalValue: new Decimal(item.total_value || 0),
      };
    }

    // Get sector breakdown
    const sectorQuery = `
      SELECT 
        sector,
        COUNT(*) as count,
        SUM(CAST(current_value AS DECIMAL)) as total_value
      FROM "Investments"
      WHERE sector IS NOT NULL
      GROUP BY sector
      ORDER BY total_value DESC
    `;

    const sectorData = await sequelize.query(sectorQuery, {
      type: QueryTypes.SELECT,
    }) as any[];

    const sectorBreakdown: Record<string, any> = {};
    const totalInvestments = sectorData.reduce((sum, item) => sum + parseInt(item.count), 0);

    for (const item of sectorData) {
      sectorBreakdown[item.sector] = {
        count: parseInt(item.count),
        percentage: new Decimal(item.count).dividedBy(totalInvestments).times(100),
        totalValue: new Decimal(item.total_value || 0),
      };
    }

    // Get vintage breakdown
    const vintageQuery = `
      SELECT 
        vintage,
        COUNT(*) as fund_count,
        SUM(CAST(target_size AS DECIMAL)) as total_size,
        SUM(commitment_totals.total_commitments) as total_commitments
      FROM "Funds" f
      LEFT JOIN (
        SELECT 
          fund_id,
          SUM(CAST(commitment_amount AS DECIMAL)) as total_commitments
        FROM "Commitments"
        GROUP BY fund_id
      ) commitment_totals ON f.id = commitment_totals.fund_id
      GROUP BY vintage
      ORDER BY vintage DESC
    `;

    const vintageData = await sequelize.query(vintageQuery, {
      type: QueryTypes.SELECT,
    }) as any[];

    const vintageBreakdown: Record<number, any> = {};
    for (const item of vintageData) {
      vintageBreakdown[item.vintage] = {
        fundCount: parseInt(item.fund_count),
        totalSize: new Decimal(item.total_size || 0),
        totalCommitments: new Decimal(item.total_commitments || 0),
      };
    }

    // Calculate overall IRR (simplified)
    const overallIRR = new Decimal(15); // Placeholder - would need complex cash flow analysis

    return {
      totalFunds: fundCount,
      totalInvestors: investorCount,
      totalInvestments: investmentCount,
      totalCommitments,
      totalContributions,
      totalDistributions,
      totalNAV,
      overallMultiple,
      overallIRR,
      avgFundSize,
      avgCommitmentSize,
      geographyBreakdown,
      sectorBreakdown,
      vintageBreakdown,
    };
  }

  /**
   * Search entities with advanced filters
   */
  async searchEntities(filters: EntitySearchFilters): Promise<{
    investors?: GlobalInvestorSummary[];
    funds?: GlobalFundSummary[];
    investments?: GlobalInvestmentSummary[];
    totalCount: number;
    hasMore: boolean;
  }> {
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const results: any = {
      totalCount: 0,
      hasMore: false,
    };

    if (!filters.entityType || filters.entityType === 'investor') {
      const investorResults = await this.searchInvestors(filters, limit, offset);
      results.investors = investorResults.investors;
      results.totalCount += investorResults.totalCount;
    }

    if (!filters.entityType || filters.entityType === 'fund') {
      const fundResults = await this.searchFunds(filters, limit, offset);
      results.funds = fundResults.funds;
      results.totalCount += fundResults.totalCount;
    }

    if (!filters.entityType || filters.entityType === 'investment') {
      const investmentResults = await this.searchInvestments(filters, limit, offset);
      results.investments = investmentResults.investments;
      results.totalCount += investmentResults.totalCount;
    }

    results.hasMore = results.totalCount > offset + limit;

    return results;
  }

  /**
   * Get relationship map between investors and funds
   */
  async getRelationshipMap(): Promise<RelationshipMap> {
    // Get investor-fund relationships
    const investorQuery = `
      SELECT 
        ie.id as investor_id,
        ie.name as investor_name,
        array_agg(f.id) as fund_ids,
        array_agg(f.name) as fund_names,
        SUM(CAST(c.commitment_amount AS DECIMAL)) as total_commitment,
        MIN(c.created_at) as first_investment
      FROM "InvestorEntities" ie
      JOIN "Commitments" c ON ie.id = c.investor_id
      JOIN "Funds" f ON c.fund_id = f.id
      GROUP BY ie.id, ie.name
      ORDER BY total_commitment DESC
    `;

    const investorData = await sequelize.query(investorQuery, {
      type: QueryTypes.SELECT,
    }) as any[];

    const investors = investorData.map(item => ({
      investorId: item.investor_id,
      investorName: item.investor_name,
      funds: item.fund_ids,
      totalCommitment: new Decimal(item.total_commitment),
      firstInvestment: item.first_investment,
      relationshipStrength: this.calculateRelationshipStrength(item.fund_ids.length, new Decimal(item.total_commitment)),
    }));

    // Get fund-investor overlaps
    const fundQuery = `
      SELECT 
        f.id as fund_id,
        f.name as fund_name,
        f.vintage,
        array_agg(ie.id) as investor_ids,
        array_agg(ie.name) as investor_names
      FROM "Funds" f
      JOIN "Commitments" c ON f.id = c.fund_id
      JOIN "InvestorEntities" ie ON c.investor_id = ie.id
      GROUP BY f.id, f.name, f.vintage
      ORDER BY f.vintage DESC
    `;

    const fundData = await sequelize.query(fundQuery, {
      type: QueryTypes.SELECT,
    }) as any[];

    const funds = fundData.map(item => {
      const sharedInvestors = item.investor_ids.map((investorId: string, index: number) => {
        // Find other funds this investor is in
        const otherFunds = fundData
          .filter(fund => fund.fund_id !== item.fund_id && fund.investor_ids.includes(investorId))
          .map(fund => fund.fund_id);

        return {
          investorId,
          investorName: item.investor_names[index],
          overlapFunds: otherFunds,
        };
      });

      return {
        fundId: item.fund_id,
        fundName: item.fund_name,
        vintage: item.vintage,
        sharedInvestors: sharedInvestors.filter(investor => investor.overlapFunds.length > 0),
      };
    });

    // Get cross-investment details
    const crossInvestments = investors.map(investor => ({
      investorId: investor.investorId,
      investorName: investor.investorName,
      fundInvestments: investor.funds.map((fundId: string) => {
        const fundInfo = fundData.find(f => f.fund_id === fundId);
        return {
          fundId,
          fundName: fundInfo?.fund_name || 'Unknown',
          commitment: new Decimal(0), // Would need to fetch actual commitment
          contributions: new Decimal(0), // Would need to fetch actual contributions
        };
      }),
    }));

    return {
      investors,
      funds,
      crossInvestments,
    };
  }

  /**
   * Private helper methods
   */

  private async searchInvestors(filters: EntitySearchFilters, limit: number, offset: number): Promise<{
    investors: GlobalInvestorSummary[];
    totalCount: number;
  }> {
    const whereClause: any = {};

    if (filters.geography) {
      whereClause.geography = { [Op.in]: filters.geography };
    }
    if (filters.investorType) {
      whereClause.entityType = { [Op.in]: filters.investorType };
    }
    if (filters.status) {
      whereClause.status = { [Op.in]: filters.status };
    }
    if (filters.searchTerm) {
      whereClause.name = { [Op.iLike]: `%${filters.searchTerm}%` };
    }

    const { rows: investors, count } = await InvestorEntity.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['name', filters.sortOrder || 'asc']],
    });

    const investorSummaries = await Promise.all(
      investors.map(investor => this.getGlobalInvestorSummary(investor.id))
    );

    return {
      investors: investorSummaries,
      totalCount: count,
    };
  }

  private async searchFunds(filters: EntitySearchFilters, limit: number, offset: number): Promise<{
    funds: GlobalFundSummary[];
    totalCount: number;
  }> {
    const whereClause: any = {};

    if (filters.vintage) {
      whereClause.vintage = { [Op.in]: filters.vintage };
    }
    if (filters.fundType) {
      whereClause.type = { [Op.in]: filters.fundType };
    }
    if (filters.status) {
      whereClause.status = { [Op.in]: filters.status };
    }
    if (filters.searchTerm) {
      whereClause.name = { [Op.iLike]: `%${filters.searchTerm}%` };
    }

    const { rows: funds, count } = await Fund.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['vintage', 'desc']],
    });

    const fundSummaries = await Promise.all(
      funds.map(fund => this.getGlobalFundSummary(fund.id))
    );

    return {
      funds: fundSummaries,
      totalCount: count,
    };
  }

  private async searchInvestments(filters: EntitySearchFilters, limit: number, offset: number): Promise<{
    investments: GlobalInvestmentSummary[];
    totalCount: number;
  }> {
    const whereClause: any = {};

    if (filters.geography) {
      whereClause.geography = { [Op.in]: filters.geography };
    }
    if (filters.sector) {
      whereClause.sector = { [Op.in]: filters.sector };
    }
    if (filters.status) {
      whereClause.status = { [Op.in]: filters.status };
    }
    if (filters.searchTerm) {
      whereClause.portfolioCompany = { [Op.iLike]: `%${filters.searchTerm}%` };
    }

    const { rows: investments, count } = await Investment.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['investmentDate', 'desc']],
    });

    const investmentSummaries = await Promise.all(
      investments.map(investment => this.getGlobalInvestmentSummary(investment.id))
    );

    return {
      investments: investmentSummaries,
      totalCount: count,
    };
  }

  private calculateRelationshipStrength(fundCount: number, totalCommitment: Decimal): 'strong' | 'medium' | 'weak' {
    if (fundCount >= 3 && totalCommitment.greaterThan(new Decimal(50000000))) {
      return 'strong';
    } else if (fundCount >= 2 || totalCommitment.greaterThan(new Decimal(10000000))) {
      return 'medium';
    } else {
      return 'weak';
    }
  }

  private async calculateInvestorIRR(investorId: string): Promise<Decimal> {
    // Simplified IRR calculation - in practice would need complex cash flow analysis
    return new Decimal(12.5);
  }

  private async calculateFundIRR(fundId: string): Promise<Decimal> {
    // Simplified IRR calculation - in practice would need complex cash flow analysis
    return new Decimal(15.3);
  }

  private async calculateInvestmentIRR(investmentId: string): Promise<Decimal> {
    // Simplified IRR calculation - in practice would need complex cash flow analysis
    return new Decimal(25.7);
  }
}