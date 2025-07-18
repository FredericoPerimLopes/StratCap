from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from enum import Enum


class FundType(str, Enum):
    PRIVATE_EQUITY = "private_equity"
    VENTURE_CAPITAL = "venture_capital"
    HEDGE_FUND = "hedge_fund"
    REAL_ESTATE = "real_estate"


class FundStatus(str, Enum):
    SETUP = "setup"
    ACTIVE = "active"
    CLOSED = "closed"
    LIQUIDATED = "liquidated"


class Fund(BaseModel):
    fund_id: str
    fund_name: str
    fund_type: FundType
    fund_status: FundStatus
    inception_date: datetime
    target_size: float
    committed_capital: float
    called_capital: float
    paid_in_capital: float
    nav: float
    irr: float
    moic: float
    management_fee_rate: float
    carry_rate: float
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class FundPerformance(BaseModel):
    fund_id: str
    as_of_date: datetime
    nav: float
    irr: float
    moic: float
    tvpi: float
    dpi: float
    rvpi: float
    called_capital: float
    distributed_capital: float
    remaining_value: float


class InvestorCapitalCall(BaseModel):
    investor_id: str
    call_amount: float
    paid_amount: float
    payment_date: Optional[datetime] = None
    status: str


class CapitalCall(BaseModel):
    call_id: str
    fund_id: str
    call_date: datetime
    due_date: datetime
    total_amount: float
    call_percentage: float
    status: str
    investor_calls: List[InvestorCapitalCall] = []


class InvestorDistribution(BaseModel):
    investor_id: str
    distribution_amount: float
    tax_withholding: float
    net_amount: float
    payment_date: Optional[datetime] = None
    status: str


class Distribution(BaseModel):
    distribution_id: str
    fund_id: str
    distribution_date: datetime
    total_amount: float
    distribution_type: str
    status: str
    investor_distributions: List[InvestorDistribution] = []


class CreateFundRequest(BaseModel):
    fund_name: str = Field(..., min_length=2, max_length=100)
    fund_type: FundType
    inception_date: datetime
    target_size: float = Field(..., gt=0)
    management_fee_rate: float = Field(..., ge=0, le=1)
    carry_rate: float = Field(..., ge=0, le=1)
    description: Optional[str] = None


class UpdateFundRequest(BaseModel):
    fund_id: str
    fund_name: Optional[str] = Field(None, min_length=2, max_length=100)
    fund_type: Optional[FundType] = None
    inception_date: Optional[datetime] = None
    target_size: Optional[float] = Field(None, gt=0)
    management_fee_rate: Optional[float] = Field(None, ge=0, le=1)
    carry_rate: Optional[float] = Field(None, ge=0, le=1)
    description: Optional[str] = None