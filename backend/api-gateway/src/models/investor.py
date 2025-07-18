from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field
from enum import Enum


class InvestorType(str, Enum):
    INSTITUTIONAL = "institutional"
    INDIVIDUAL = "individual"
    FAMILY_OFFICE = "family_office"
    PENSION_FUND = "pension_fund"
    ENDOWMENT = "endowment"
    SOVEREIGN_WEALTH = "sovereign_wealth"
    INSURANCE = "insurance"


class Status(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class CommitmentStatus(str, Enum):
    ACTIVE = "active"
    FULFILLED = "fulfilled"
    WITHDRAWN = "withdrawn"


class TransactionType(str, Enum):
    CAPITAL_CALL = "capital_call"
    DISTRIBUTION = "distribution"
    MANAGEMENT_FEE = "management_fee"
    PERFORMANCE_FEE = "performance_fee"
    OTHER = "other"


class TransactionStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"


class Address(BaseModel):
    street_address: str
    city: str
    state: str
    postal_code: str
    country: str


class Investor(BaseModel):
    investor_id: str
    investor_name: str
    investor_type: InvestorType
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[Address] = None
    tax_id: Optional[str] = None
    kyc_status: Status
    aml_status: Status
    accredited_investor: bool
    qualified_purchaser: bool
    is_active: bool = True
    created_at: datetime
    updated_at: datetime


class InvestorCommitment(BaseModel):
    commitment_id: str
    investor_id: str
    fund_id: str
    commitment_amount: float
    commitment_date: datetime
    commitment_percentage: float
    called_amount: float
    uncalled_amount: float
    distributed_amount: float
    current_value: float
    status: CommitmentStatus


class InvestorStatement(BaseModel):
    statement_id: str
    investor_id: str
    fund_id: str
    statement_date: datetime
    period_start: datetime
    period_end: datetime
    beginning_balance: float
    capital_calls: float
    distributions: float
    management_fees: float
    performance_fees: float
    other_fees: float
    unrealized_gains: float
    realized_gains: float
    ending_balance: float
    irr: float
    moic: float


class InvestorDocument(BaseModel):
    document_id: str
    investor_id: str
    document_type: str
    document_name: str
    file_path: str
    upload_date: datetime
    uploaded_by: str
    status: Status


class CreateInvestorRequest(BaseModel):
    investor_name: str = Field(..., min_length=2, max_length=100)
    investor_type: InvestorType
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[Address] = None
    tax_id: Optional[str] = None
    accredited_investor: bool
    qualified_purchaser: bool


class UpdateInvestorRequest(BaseModel):
    investor_id: str
    investor_name: Optional[str] = Field(None, min_length=2, max_length=100)
    investor_type: Optional[InvestorType] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[Address] = None
    tax_id: Optional[str] = None
    accredited_investor: Optional[bool] = None
    qualified_purchaser: Optional[bool] = None


class CreateCommitmentRequest(BaseModel):
    investor_id: str
    fund_id: str
    commitment_amount: float = Field(..., gt=0)
    commitment_date: datetime


class InvestorTransaction(BaseModel):
    transaction_id: str
    investor_id: str
    fund_id: str
    transaction_type: TransactionType
    amount: float
    transaction_date: datetime
    description: Optional[str] = None
    status: TransactionStatus
    due_date: Optional[datetime] = None
    paid_date: Optional[datetime] = None


class DeleteInvestorResponse(BaseModel):
    message: str
    investor_id: str
    deleted_at: datetime