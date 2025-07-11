"""
Reporting endpoints (proxy to Reporting Service)
"""

from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from src.middleware.auth import JWTBearer
from src.utils.logger import logger

router = APIRouter(dependencies=[Depends(JWTBearer())])


class ReportRequest(BaseModel):
    report_type: str
    fund_id: Optional[str] = None
    investor_id: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    format: str = "pdf"


@router.get("/", response_model=List[Dict[str, Any]])
async def list_available_reports():
    """
    List all available report types
    """
    return [
        {
            "report_type": "investor_statement",
            "description": "Investor quarterly statements",
            "parameters": ["fund_id", "investor_id", "quarter"]
        },
        {
            "report_type": "fund_performance",
            "description": "Fund performance report",
            "parameters": ["fund_id", "start_date", "end_date"]
        }
    ]


@router.post("/generate", response_model=Dict[str, Any])
async def generate_report(request: ReportRequest):
    """
    Generate a report
    """
    logger.info(f"Generating {request.report_type} report")
    
    # Mock response
    return {
        "report_id": "rpt-001",
        "report_type": request.report_type,
        "status": "generating",
        "estimated_completion": "2024-01-15T10:35:00Z"
    }


@router.get("/{report_id}/status", response_model=Dict[str, Any])
async def get_report_status(report_id: str):
    """
    Get report generation status
    """
    # Mock response
    return {
        "report_id": report_id,
        "status": "completed",
        "download_url": f"/api/reports/{report_id}/download",
        "generated_at": "2024-01-15T10:35:00Z"
    }