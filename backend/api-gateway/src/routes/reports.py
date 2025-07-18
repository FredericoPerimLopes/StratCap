"""
Reporting endpoints
"""

from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query, HTTPException, status
from fastapi.responses import StreamingResponse
import httpx

from src.middleware.auth import JWTBearer
from src.utils.logger import logger
from src.models.report import (
    Report, ReportTemplate, DashboardMetrics, PerformanceMetrics,
    CreateReportRequest, ReportSchedule, ActivityItem, QuarterlyReturn,
    ReportType, ReportStatus, Frequency, ActivityType
)

router = APIRouter(dependencies=[Depends(JWTBearer())])


@router.get("/dashboard/metrics", response_model=DashboardMetrics)
async def get_dashboard_metrics():
    """
    Get dashboard metrics
    """
    # Mock response
    return DashboardMetrics(
        total_funds=4,
        total_investors=145,
        total_aum=1320000000,
        total_committed=1200000000,
        total_called=680000000,
        total_distributed=285000000,
        avg_fund_performance=0.186,
        pending_capital_calls=3,
        pending_distributions=2,
        recent_activity=[
            ActivityItem(
                activity_id="act-1",
                activity_type=ActivityType.CAPITAL_CALL,
                description="Capital Call #3 - Growth Fund I",
                timestamp=datetime.utcnow(),
                fund_id="fund-123",
                amount=25000000,
                status="pending"
            ),
            ActivityItem(
                activity_id="act-2",
                activity_type=ActivityType.DISTRIBUTION,
                description="Distribution - Value Fund II",
                timestamp=datetime.utcnow(),
                fund_id="fund-456",
                amount=18000000,
                status="completed"
            )
        ]
    )


@router.get("/dashboard/performance", response_model=List[PerformanceMetrics])
async def get_performance_metrics(fund_id: Optional[str] = None):
    """
    Get performance metrics
    """
    # Mock response
    return [
        PerformanceMetrics(
            fund_id="fund-123",
            fund_name="Growth Fund I",
            as_of_date=datetime.utcnow(),
            nav=480000000,
            irr=0.185,
            moic=1.75,
            tvpi=1.75,
            dpi=0.44,
            rvpi=1.31,
            called_capital=225000000,
            distributed_capital=100000000,
            remaining_value=380000000,
            quarterly_returns=[
                QuarterlyReturn(
                    quarter="Q1",
                    year=2024,
                    return_percentage=4.2,
                    nav=480000000,
                    capital_calls=10000000,
                    distributions=5000000
                )
            ]
        )
    ]


@router.get("/", response_model=List[Report])
async def list_reports(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    report_type: Optional[ReportType] = None,
    status: Optional[ReportStatus] = None
):
    """
    List all reports
    """
    # Mock response
    return [
        Report(
            report_id="rpt-123",
            report_name="Q4 2024 Fund Performance Report",
            report_type=ReportType.FUND_PERFORMANCE,
            description="Quarterly performance report for all funds",
            fund_id="fund-123",
            period_start=datetime(2024, 10, 1),
            period_end=datetime(2024, 12, 31),
            status=ReportStatus.COMPLETED,
            created_by="user-123",
            created_at=datetime.utcnow(),
            completed_at=datetime.utcnow(),
            file_path="/reports/fund_performance_q4_2024.pdf",
            parameters={}
        )
    ]


@router.post("/", response_model=Report)
async def create_report(report: CreateReportRequest):
    """
    Create a new report
    """
    logger.info(f"Creating report: {report.report_name}")
    
    # Mock response
    return Report(
        report_id="rpt-456",
        report_name=report.report_name,
        report_type=report.report_type,
        description=report.description,
        fund_id=report.fund_id,
        investor_id=report.investor_id,
        period_start=report.period_start,
        period_end=report.period_end,
        status=ReportStatus.PENDING,
        created_by="user-123",
        created_at=datetime.utcnow(),
        parameters=report.parameters
    )


@router.get("/{report_id}", response_model=Report)
async def get_report(report_id: str):
    """
    Get report details by ID
    """
    # Mock response
    if report_id == "rpt-123":
        return Report(
            report_id="rpt-123",
            report_name="Q4 2024 Fund Performance Report",
            report_type=ReportType.FUND_PERFORMANCE,
            description="Quarterly performance report for all funds",
            fund_id="fund-123",
            period_start=datetime(2024, 10, 1),
            period_end=datetime(2024, 12, 31),
            status=ReportStatus.COMPLETED,
            created_by="user-123",
            created_at=datetime.utcnow(),
            completed_at=datetime.utcnow(),
            file_path="/reports/fund_performance_q4_2024.pdf",
            parameters={}
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )


@router.put("/{report_id}", response_model=Report)
async def update_report(report_id: str, updates: dict):
    """
    Update report details
    """
    logger.info(f"Updating report: {report_id}")
    
    # Mock response
    return Report(
        report_id=report_id,
        report_name=updates.get("report_name", "Updated Report"),
        report_type=ReportType.FUND_PERFORMANCE,
        status=ReportStatus.COMPLETED,
        created_by="user-123",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        parameters={}
    )


@router.delete("/{report_id}")
async def delete_report(report_id: str):
    """
    Delete a report
    """
    logger.info(f"Deleting report: {report_id}")
    return {"message": f"Report {report_id} deleted successfully"}


@router.post("/{report_id}/generate", response_model=Report)
async def generate_report(report_id: str):
    """
    Generate/regenerate a report
    """
    logger.info(f"Generating report: {report_id}")
    
    # Mock response
    return Report(
        report_id=report_id,
        report_name="Generated Report",
        report_type=ReportType.FUND_PERFORMANCE,
        status=ReportStatus.PROCESSING,
        created_by="user-123",
        created_at=datetime.utcnow(),
        parameters={}
    )


@router.get("/{report_id}/download")
async def download_report(report_id: str):
    """
    Download a completed report
    """
    # Mock response - in real implementation, stream file content
    return {"download_url": f"/files/reports/{report_id}.pdf"}


@router.get("/report-templates", response_model=List[ReportTemplate])
async def get_report_templates():
    """
    Get all report templates
    """
    # Mock response
    return [
        ReportTemplate(
            template_id="tmpl-1",
            template_name="Fund Performance Template",
            report_type=ReportType.FUND_PERFORMANCE,
            description="Standard fund performance report template",
            default_parameters={},
            is_system=True,
            created_by="system",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
    ]


@router.get("/analytics/funds")
async def get_fund_analytics(fund_id: Optional[str] = None):
    """
    Get fund analytics
    """
    # Mock response
    return {
        "total_funds": 4,
        "total_aum": 1320000000,
        "average_irr": 0.186,
        "top_performing_fund": "fund-123"
    }


@router.get("/analytics/investors")
async def get_investor_analytics(investor_id: Optional[str] = None):
    """
    Get investor analytics
    """
    # Mock response
    return {
        "total_investors": 145,
        "total_commitments": 1200000000,
        "average_commitment": 8275862,
        "top_investor": "inv-123"
    }