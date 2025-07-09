"""
Fund management endpoints (proxy to Fund Management Service)
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, status, Depends, Query
from pydantic import BaseModel, Field
import httpx

from src.config.settings import settings
from src.middleware.auth import JWTBearer
from src.utils.logger import logger

router = APIRouter(dependencies=[Depends(JWTBearer())])


class FundCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    fund_type: str = Field(..., pattern="^(private_equity|hedge_fund|venture_capital|real_estate)$")
    target_size: float = Field(..., gt=0)
    base_currency: str = Field(default="USD", pattern="^[A-Z]{3}$")
    inception_date: str
    management_fee_rate: float = Field(default=0.02, ge=0, le=0.1)
    carried_interest_rate: float = Field(default=0.2, ge=0, le=0.5)
    hurdle_rate: float = Field(default=0.08, ge=0, le=0.3)


class FundUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    fund_status: Optional[str] = None
    target_size: Optional[float] = Field(None, gt=0)
    management_fee_rate: Optional[float] = Field(None, ge=0, le=0.1)
    carried_interest_rate: Optional[float] = Field(None, ge=0, le=0.5)
    hurdle_rate: Optional[float] = Field(None, ge=0, le=0.3)


async def proxy_request(
    method: str,
    endpoint: str,
    json_data: dict = None,
    params: dict = None
) -> dict:
    """
    Proxy request to Fund Management Service
    """
    url = f"{settings.FUND_MANAGEMENT_URL}{endpoint}"
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.request(
                method=method,
                url=url,
                json=json_data,
                params=params,
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"Fund service error: {e.response.status_code} - {e.response.text}")
            raise HTTPException(
                status_code=e.response.status_code,
                detail=e.response.json().get("detail", "Fund service error")
            )
        except httpx.RequestError as e:
            logger.error(f"Fund service connection error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Fund service unavailable"
            )


@router.get("/", response_model=List[Dict[str, Any]])
async def list_funds(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    fund_type: Optional[str] = None,
    status: Optional[str] = None
):
    """
    List all funds with optional filtering
    """
    params = {
        "skip": skip,
        "limit": limit
    }
    if fund_type:
        params["fund_type"] = fund_type
    if status:
        params["status"] = status
    
    # TODO: Replace with actual service call
    # return await proxy_request("GET", "/funds", params=params)
    
    # Mock response
    return [
        {
            "fund_id": "fund-123",
            "name": "Growth Fund I",
            "fund_type": "private_equity",
            "target_size": 500000000,
            "committed_capital": 450000000,
            "fund_status": "active",
            "inception_date": "2023-01-15",
            "base_currency": "USD"
        },
        {
            "fund_id": "fund-456",
            "name": "Tech Ventures II",
            "fund_type": "venture_capital",
            "target_size": 250000000,
            "committed_capital": 200000000,
            "fund_status": "fundraising",
            "inception_date": "2024-01-01",
            "base_currency": "USD"
        }
    ]


@router.post("/", response_model=Dict[str, Any])
async def create_fund(fund: FundCreate):
    """
    Create a new fund
    """
    # TODO: Replace with actual service call
    # return await proxy_request("POST", "/funds", json_data=fund.dict())
    
    logger.info(f"Creating new fund: {fund.name}")
    
    # Mock response
    return {
        "fund_id": "fund-789",
        "name": fund.name,
        "fund_type": fund.fund_type,
        "target_size": fund.target_size,
        "base_currency": fund.base_currency,
        "fund_status": "fundraising",
        "created_at": "2024-01-15T10:30:00Z"
    }


@router.get("/{fund_id}", response_model=Dict[str, Any])
async def get_fund(fund_id: str):
    """
    Get fund details by ID
    """
    # TODO: Replace with actual service call
    # return await proxy_request("GET", f"/funds/{fund_id}")
    
    # Mock response
    if fund_id == "fund-123":
        return {
            "fund_id": "fund-123",
            "name": "Growth Fund I",
            "fund_type": "private_equity",
            "target_size": 500000000,
            "committed_capital": 450000000,
            "called_capital": 225000000,
            "distributed_capital": 100000000,
            "fund_status": "active",
            "inception_date": "2023-01-15",
            "base_currency": "USD",
            "management_fee_rate": 0.02,
            "carried_interest_rate": 0.2,
            "hurdle_rate": 0.08,
            "investors_count": 25,
            "investments_count": 12
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fund not found"
        )


@router.put("/{fund_id}", response_model=Dict[str, Any])
async def update_fund(fund_id: str, fund_update: FundUpdate):
    """
    Update fund details
    """
    # TODO: Replace with actual service call
    # return await proxy_request("PUT", f"/funds/{fund_id}", json_data=fund_update.dict(exclude_unset=True))
    
    logger.info(f"Updating fund: {fund_id}")
    
    # Mock response
    return {
        "fund_id": fund_id,
        "name": fund_update.name or "Growth Fund I",
        "fund_status": fund_update.fund_status or "active",
        "updated_at": "2024-01-15T11:30:00Z"
    }


@router.delete("/{fund_id}")
async def delete_fund(fund_id: str):
    """
    Delete a fund (soft delete)
    """
    # TODO: Replace with actual service call
    # return await proxy_request("DELETE", f"/funds/{fund_id}")
    
    logger.info(f"Deleting fund: {fund_id}")
    
    return {"message": f"Fund {fund_id} deleted successfully"}


@router.get("/{fund_id}/performance", response_model=Dict[str, Any])
async def get_fund_performance(fund_id: str):
    """
    Get fund performance metrics
    """
    # TODO: Replace with actual service call
    # return await proxy_request("GET", f"/funds/{fund_id}/performance")
    
    # Mock response
    return {
        "fund_id": fund_id,
        "metrics": {
            "irr": 0.185,  # 18.5%
            "moic": 1.75,
            "dpi": 0.44,
            "rvpi": 1.31,
            "tvpi": 1.75,
            "paid_in_percentage": 0.5,
            "distributed_percentage": 0.22
        },
        "as_of_date": "2024-01-15",
        "currency": "USD"
    }


@router.get("/{fund_id}/cash-flows", response_model=List[Dict[str, Any]])
async def get_fund_cash_flows(
    fund_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """
    Get fund cash flow history
    """
    params = {}
    if start_date:
        params["start_date"] = start_date
    if end_date:
        params["end_date"] = end_date
    
    # TODO: Replace with actual service call
    # return await proxy_request("GET", f"/funds/{fund_id}/cash-flows", params=params)
    
    # Mock response
    return [
        {
            "date": "2023-03-15",
            "type": "capital_call",
            "amount": -50000000,
            "description": "Capital Call #1",
            "running_balance": 50000000
        },
        {
            "date": "2023-09-20",
            "type": "capital_call",
            "amount": -75000000,
            "description": "Capital Call #2",
            "running_balance": 125000000
        },
        {
            "date": "2024-01-10",
            "type": "distribution",
            "amount": 30000000,
            "description": "Distribution #1",
            "running_balance": 95000000
        }
    ]