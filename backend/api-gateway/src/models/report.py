from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum


class ReportType(str, Enum):
    FUND_PERFORMANCE = "fund_performance"
    INVESTOR_STATEMENT = "investor_statement"
    CAPITAL_CALL = "capital_call"
    DISTRIBUTION = "distribution"
    TAX_REPORT = "tax_report"
    COMPLIANCE = "compliance"
    CUSTOM = "custom"


class ReportStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class Frequency(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    ANNUALLY = "annually"


class ActivityType(str, Enum):
    CAPITAL_CALL = "capital_call"
    DISTRIBUTION = "distribution"
    NEW_INVESTOR = "new_investor"
    FUND_CREATION = "fund_creation"
    REPORT_GENERATED = "report_generated"


class ReportFilters(BaseModel):
    fund_ids: Optional[List[str]] = None
    investor_ids: Optional[List[str]] = None
    date_range: Optional[Dict[str, str]] = None
    status: Optional[List[str]] = None
    minimum_amount: Optional[float] = None
    maximum_amount: Optional[float] = None


class ReportParameters(BaseModel):
    include_charts: Optional[bool] = True
    currency: Optional[str] = "USD"
    date_format: Optional[str] = "YYYY-MM-DD"
    grouping: Optional[str] = None
    filters: Optional[ReportFilters] = None


class Report(BaseModel):
    report_id: str
    report_name: str
    report_type: ReportType
    description: Optional[str] = None
    fund_id: Optional[str] = None
    investor_id: Optional[str] = None
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None
    status: ReportStatus
    created_by: str
    created_at: datetime
    completed_at: Optional[datetime] = None
    file_path: Optional[str] = None
    parameters: ReportParameters


class ReportTemplate(BaseModel):
    template_id: str
    template_name: str
    report_type: ReportType
    description: Optional[str] = None
    default_parameters: ReportParameters
    is_system: bool = False
    created_by: str
    created_at: datetime
    updated_at: datetime


class ActivityItem(BaseModel):
    activity_id: str
    activity_type: ActivityType
    description: str
    timestamp: datetime
    fund_id: Optional[str] = None
    investor_id: Optional[str] = None
    amount: Optional[float] = None
    status: Optional[str] = None


class DashboardMetrics(BaseModel):
    total_funds: int
    total_investors: int
    total_aum: float
    total_committed: float
    total_called: float
    total_distributed: float
    avg_fund_performance: float
    pending_capital_calls: int
    pending_distributions: int
    recent_activity: List[ActivityItem] = []


class QuarterlyReturn(BaseModel):
    quarter: str
    year: int
    return_percentage: float
    nav: float
    capital_calls: float
    distributions: float


class BenchmarkComparison(BaseModel):
    benchmark_name: str
    benchmark_return: float
    fund_return: float
    outperformance: float
    tracking_error: float
    sharpe_ratio: float


class PerformanceMetrics(BaseModel):
    fund_id: str
    fund_name: str
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
    quarterly_returns: List[QuarterlyReturn] = []
    benchmark_comparison: Optional[BenchmarkComparison] = None


class CreateReportRequest(BaseModel):
    report_name: str = Field(..., min_length=2, max_length=100)
    report_type: ReportType
    description: Optional[str] = None
    fund_id: Optional[str] = None
    investor_id: Optional[str] = None
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None
    parameters: ReportParameters


class ReportSchedule(BaseModel):
    schedule_id: str
    report_template_id: str
    schedule_name: str
    frequency: Frequency
    next_run: datetime
    is_active: bool = True
    recipients: List[str] = []
    created_at: datetime
    updated_at: datetime