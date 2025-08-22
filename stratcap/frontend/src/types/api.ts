// Comprehensive type definitions aligned with backend schemas

export interface APIResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// Fund interfaces
export interface Fund {
  id: number;
  fundFamilyId: number;
  name: string;
  code: string;
  type: 'master' | 'feeder' | 'parallel' | 'subsidiary';
  vintage: number;
  targetSize: string;
  hardCap?: string;
  managementFeeRate: string;
  carriedInterestRate: string;
  preferredReturnRate: string;
  investmentPeriodEnd?: Date | string;
  termEnd?: Date | string;
  extensionPeriods?: number;
  extensionLength?: number;
  currency: string;
  status: 'fundraising' | 'investing' | 'harvesting' | 'closed';
  settings?: Record<string, any>;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

// Investor interfaces
export interface InvestorEntity {
  id: number;
  name: string;
  legalName: string;
  type: 'individual' | 'institution' | 'fund' | 'trust' | 'other';
  entityType?: string;
  taxId?: string;
  registrationNumber?: string;
  domicile: string;
  taxResidence?: string;
  accreditedInvestor: boolean;
  qualifiedPurchaser: boolean;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  primaryContact?: string;
  primaryEmail?: string;
  primaryPhone?: string;
  kycStatus: 'pending' | 'approved' | 'rejected' | 'expired';
  kycDate?: Date | string;
  amlStatus: 'pending' | 'approved' | 'rejected' | 'expired';
  amlDate?: Date | string;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

// Commitment interfaces
export interface Commitment {
  id: number;
  fundId: number;
  investorEntityId: number;
  investorClassId: number;
  commitmentAmount: string;
  commitmentDate: Date | string;
  closingId?: number;
  status: 'pending' | 'active' | 'suspended' | 'terminated';
  sideLetterTerms?: Record<string, any>;
  feeOverrides?: Record<string, any>;
  capitalCalled: string;
  capitalReturned: string;
  unfundedCommitment: string;
  preferredReturn: string;
  carriedInterest: string;
  lastUpdated?: Date | string;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

// Capital Activity interfaces
export interface CapitalActivity {
  id: number;
  fundId: number;
  eventType: 'capital_call' | 'distribution' | 'equalization' | 'reallocation';
  eventNumber: string;
  eventDate: Date | string;
  dueDate?: Date | string;
  description: string;
  status: 'draft' | 'pending' | 'approved' | 'completed' | 'cancelled';
  totalAmount: string;
  baseAmount?: string;
  feeAmount?: string;
  expenseAmount?: string;
  currency: string;
  purpose?: string;
  notices?: Record<string, any>;
  calculations?: Record<string, any>;
  approvedBy?: number;
  approvedAt?: Date | string;
  completedAt?: Date | string;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

// Transaction interfaces
export interface Transaction {
  id: number;
  fundId: number;
  commitmentId: number;
  capitalActivityId?: number;
  transactionDate: Date | string;
  effectiveDate: Date | string;
  transactionType: 'capital_call' | 'distribution' | 'fee' | 'expense' | 'equalization' | 'transfer' | 'adjustment';
  transactionCode: string;
  description: string;
  amount: string;
  currency: string;
  baseAmount?: string;
  exchangeRate?: string;
  direction: 'debit' | 'credit';
  category?: string;
  subCategory?: string;
  glAccountCode?: string;
  isReversed: boolean;
  reversalOfId?: number;
  batchId?: string;
  referenceNumber?: string;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

// Form data interfaces
export interface FundFormData extends Omit<Fund, 'id' | 'createdAt' | 'updatedAt'> {}

export interface InvestorFormData extends Omit<InvestorEntity, 'id' | 'createdAt' | 'updatedAt'> {}

export interface CommitmentFormData extends Omit<Commitment, 'id' | 'capitalCalled' | 'capitalReturned' | 'unfundedCommitment' | 'preferredReturn' | 'carriedInterest' | 'lastUpdated' | 'createdAt' | 'updatedAt'> {}

export interface CapitalActivityFormData extends Omit<CapitalActivity, 'id' | 'status' | 'approvedBy' | 'approvedAt' | 'completedAt' | 'createdAt' | 'updatedAt'> {}

export interface TransactionFormData extends Omit<Transaction, 'id' | 'isReversed' | 'createdAt' | 'updatedAt'> {}

// Utility types for handling decimal fields consistently
export type DecimalString = string;
export type CurrencyCode = string;
export type CountryCode = string;

// Common status enums
export type FundStatus = 'fundraising' | 'investing' | 'harvesting' | 'closed';
export type CommitmentStatus = 'pending' | 'active' | 'suspended' | 'terminated';
export type ActivityStatus = 'draft' | 'pending' | 'approved' | 'completed' | 'cancelled';
export type ComplianceStatus = 'pending' | 'approved' | 'rejected' | 'expired';
export type InvestorType = 'individual' | 'institution' | 'fund' | 'trust' | 'other';
export type FundType = 'master' | 'feeder' | 'parallel' | 'subsidiary';
export type TransactionType = 'capital_call' | 'distribution' | 'fee' | 'expense' | 'equalization' | 'transfer' | 'adjustment';
export type EventType = 'capital_call' | 'distribution' | 'equalization' | 'reallocation';
export type TransactionDirection = 'debit' | 'credit';