export type FundStrategy = 
  | 'buyout'
  | 'growth' 
  | 'venture'
  | 'distressed'
  | 'real_estate'
  | 'infrastructure'
  | 'credit'
  | 'other';

export type FundStatus =
  | 'fundraising'
  | 'active'
  | 'investing'
  | 'harvesting'
  | 'liquidating'
  | 'closed';

export interface Fund {
  id: string;
  name: string;
  strategy: FundStrategy;
  vintage: number;
  status: FundStatus;
  targetSize: number;
  committedCapital: number;
  calledCapital: number;
  distributedCapital: number;
  remainingValue: number;
  totalValue: number;
  netIrr: number;
  grossIrr: number;
  multiple: number;
  managementFee: number;
  carriedInterest: number;
  fundTerm: number;
  investmentPeriod: number;
  firstClosingDate: Date | null;
  finalClosingDate: Date | null;
  description?: string;
  isBlindPool?: boolean;
  geography?: string;
  sector?: string;
  minimumInvestment?: number;
  investorCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FundSummary {
  id: string;
  name: string;
  strategy: FundStrategy;
  vintage: number;
  status: FundStatus;
  targetSize: number;
  committedCapital: number;
  netIrr: number;
  multiple: number;
  investorCount: number;
}

export interface FundPerformance {
  fundId: string;
  asOfDate: Date;
  netIrr: number;
  grossIrr: number;
  multiple: number;
  totalValue: number;
  calledCapital: number;
  distributedCapital: number;
  remainingValue: number;
  dpi: number; // Distributions to Paid-in capital
  rvpi: number; // Residual Value to Paid-in capital
  tvpi: number; // Total Value to Paid-in capital
}

export interface FundMetrics {
  aum: number; // Assets Under Management
  totalCommitments: number;
  totalCalled: number;
  totalDistributed: number;
  averageIrr: number;
  averageMultiple: number;
  fundsByStrategy: Record<FundStrategy, number>;
  fundsByStatus: Record<FundStatus, number>;
  fundsByVintage: Record<number, number>;
}