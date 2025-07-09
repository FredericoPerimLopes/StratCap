"""
Calculation endpoints (proxy to Calculation Engine Service)
"""

from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from src.middleware.auth import JWTBearer
from src.utils.logger import logger

router = APIRouter(dependencies=[Depends(JWTBearer())])


class WaterfallRequest(BaseModel):
    fund_id: str
    distribution_amount: float = Field(..., gt=0)
    calculation_date: str


@router.post("/waterfall", response_model=Dict[str, Any])
async def calculate_waterfall(request: WaterfallRequest):
    """
    Calculate waterfall distribution
    """
    logger.info(f"Calculating waterfall for fund {request.fund_id}")
    
    # Mock response
    return {
        "fund_id": request.fund_id,
        "distribution_amount": request.distribution_amount,
        "calculation_date": request.calculation_date,
        "waterfall_results": {
            "preferred_return": 5000000,
            "capital_return": 10000000,
            "catch_up": 1000000,
            "carried_interest": 4000000,
            "remaining_to_lps": 15000000
        },
        "investor_allocations": [
            {
                "investor_id": "inv-001",
                "investor_name": "Acme Pension Fund",
                "allocation": 12500000
            }
        ]
    }


@router.post("/fees", response_model=Dict[str, Any])
async def calculate_fees(fund_id: str, calculation_date: str):
    """
    Calculate management and performance fees
    """
    logger.info(f"Calculating fees for fund {fund_id}")
    
    # Mock response
    return {
        "fund_id": fund_id,
        "calculation_date": calculation_date,
        "management_fee": 2000000,
        "performance_fee": 5000000,
        "total_fees": 7000000
    }


@router.get("/history/{fund_id}", response_model=List[Dict[str, Any]])
async def get_calculation_history(fund_id: str):
    """
    Get calculation history for a fund
    """
    # Mock response
    return [
        {
            "calculation_id": "calc-001",
            "calculation_type": "waterfall",
            "calculation_date": "2024-01-10",
            "status": "completed",
            "total_amount": 35000000
        }
    ]