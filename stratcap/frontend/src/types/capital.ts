import Decimal from 'decimal.js';

export type CapitalActivityType = 
  | 'capital_call'
  | 'distribution' 
  | 'commitment'
  | 'recallable_distribution'
  | 'management_fee'
  | 'expense_reimbursement';

export type CapitalCallStatus = 
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'sent'
  | 'funded'
  | 'partially_funded'
  | 'overdue'
  | 'cancelled';

export type DistributionType = 
  | 'return_of_capital'
  | 'capital_gains'
  | 'dividend'
  | 'interest'
  | 'fee_offset'
  | 'other';

export interface CapitalActivity {
  id: string;
  fundId: string;
  type: CapitalActivityType;
  status: CapitalCallStatus;
  noticeDate: Date;
  dueDate: Date;
  settlementDate?: Date;
  totalAmount: Decimal;
  purpose: string;
  description?: string;
  documents?: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: Date;
}

export interface CapitalCall extends CapitalActivity {
  type: 'capital_call';
  callNumber: number;
  managementFeeAmount: Decimal;
  investmentAmount: Decimal;
  expensesAmount: Decimal;
  interestRate?: number;
  gracePeriodDays: number;
  instructions: WireInstructions;
  investorAllocations: CapitalCallAllocation[];
}

export interface Distribution extends CapitalActivity {
  type: 'distribution';
  distributionNumber: number;
  distributionType: DistributionType;
  isRecallable: boolean;
  recallPeriodDays?: number;
  taxWithholding: Decimal;
  netAmount: Decimal;
  sourceInvestments?: string[];
  investorAllocations: DistributionAllocation[];
}

export interface CapitalCallAllocation {
  id: string;
  capitalCallId: string;
  investorId: string;
  commitmentAmount: Decimal;
  allocationAmount: Decimal;
  managementFeeAmount: Decimal;
  expensesAmount: Decimal;
  totalAmount: Decimal;
  fundedAmount: Decimal;
  outstandingAmount: Decimal;
  fundingDate?: Date;
  status: 'pending' | 'funded' | 'partially_funded' | 'overdue' | 'defaulted';
  wireFees: Decimal;
  notes?: string;
}

export interface DistributionAllocation {
  id: string;
  distributionId: string;
  investorId: string;
  proRataShare: Decimal;
  grossAmount: Decimal;
  taxWithholding: Decimal;
  netAmount: Decimal;
  distributionType: DistributionType;
  paidDate?: Date;
  status: 'pending' | 'paid' | 'recalled' | 'cancelled';
  recallAmount?: Decimal;
  notes?: string;
}

export interface WireInstructions {
  bankName: string;
  accountName: string;
  accountNumber: string;
  routingNumber: string;
  swiftCode?: string;
  correspondentBank?: string;
  intermediaryBank?: string;
  furtherInstructions?: string;
}

export interface CapitalAccount {
  investorId: string;
  fundId: string;
  commitment: Decimal;
  calledAmount: Decimal;
  fundedAmount: Decimal;
  distributedAmount: Decimal;
  currentBalance: Decimal;
  unfundedCommitment: Decimal;
  managementFeesPaid: Decimal;
  expensesPaid: Decimal;
  ownership: Decimal; // percentage
  lastActivityDate?: Date;
}

export interface InvestorStatement {
  id: string;
  investorId: string;
  fundId: string;
  periodEndDate: Date;
  statementDate: Date;
  beginningBalance: Decimal;
  capitalCalls: Decimal;
  distributions: Decimal;
  managementFees: Decimal;
  expenses: Decimal;
  endingBalance: Decimal;
  marketValue: Decimal;
  unrealizedGains: Decimal;
  realizedGains: Decimal;
  irr: Decimal;
  multiple: Decimal;
  activities: CapitalActivity[];
}

export interface WaterfallCalculation {
  fundId: string;
  calculationDate: Date;
  totalDistributable: Decimal;
  returnOfCapital: Decimal;
  preferredReturn: Decimal;
  catchUp: Decimal;
  carriedInterest: Decimal;
  lpDistribution: Decimal;
  gpDistribution: Decimal;
  tierBreakdown: WaterfallTier[];
}

export interface WaterfallTier {
  tierNumber: number;
  tierName: string;
  threshold: Decimal;
  lpPercentage: Decimal;
  gpPercentage: Decimal;
  amount: Decimal;
  cumulativeAmount: Decimal;
}