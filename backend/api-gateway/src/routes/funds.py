"""
Fund management endpoints (proxy to Fund Management Service)
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, status, Depends, Query, Request
from pydantic import BaseModel, Field
import httpx

from src.config.settings import settings
from src.middleware.auth import JWTBearer
from src.utils.logger import logger
from src.models.fund import (
    Fund, FundPerformance, CapitalCall, Distribution,
    CreateFundRequest, UpdateFundRequest, FundType, FundStatus
)

router = APIRouter(dependencies=[Depends(JWTBearer())])


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


@router.get("/")
async def list_funds(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    fund_type: Optional[FundType] = None,
    status: Optional[FundStatus] = None
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
    
    # Mock response
    funds = [
        Fund(
            fund_id="fund-123",
            fund_name="Growth Fund I",
            fund_type=FundType.PRIVATE_EQUITY,
            fund_status=FundStatus.ACTIVE,
            inception_date=datetime(2023, 1, 15),
            target_size=500000000,
            committed_capital=450000000,
            called_capital=225000000,
            paid_in_capital=220000000,
            nav=480000000,
            irr=0.185,
            moic=1.75,
            management_fee_rate=0.02,
            carry_rate=0.2,
            description="Growth equity fund focused on technology companies",
            created_at=datetime(2023, 1, 1),
            updated_at=datetime.utcnow()
        ),
        Fund(
            fund_id="fund-456",
            fund_name="Tech Ventures II",
            fund_type=FundType.VENTURE_CAPITAL,
            fund_status=FundStatus.ACTIVE,
            inception_date=datetime(2024, 1, 1),
            target_size=250000000,
            committed_capital=200000000,
            called_capital=80000000,
            paid_in_capital=78000000,
            nav=95000000,
            irr=0.22,
            moic=1.18,
            management_fee_rate=0.025,
            carry_rate=0.2,
            description="Early-stage venture capital fund",
            created_at=datetime(2024, 1, 1),
            updated_at=datetime.utcnow()
        )
    ]
    
    return {
        "funds": funds,
        "total": len(funds),
        "page": skip // limit + 1 if limit > 0 else 1,
        "size": limit
    }


@router.post("/", response_model=Fund, status_code=201)
async def create_fund(fund: CreateFundRequest):
    """
    Create a new fund
    """
    logger.info(f"Creating new fund: {fund.fund_name}")
    
    # Mock response
    return Fund(
        fund_id="fund-789",
        fund_name=fund.fund_name,
        fund_type=fund.fund_type,
        fund_status=FundStatus.SETUP,
        inception_date=fund.inception_date,
        target_size=fund.target_size,
        committed_capital=0,
        called_capital=0,
        paid_in_capital=0,
        nav=0,
        irr=0,
        moic=0,
        management_fee_rate=fund.management_fee_rate,
        carry_rate=fund.carry_rate,
        description=fund.description,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )


@router.get("/{fund_id}", response_model=Fund)
async def get_fund(fund_id: str):
    """
    Get fund details by ID
    """
    # Mock response
    if fund_id == "fund-123":
        return Fund(
            fund_id="fund-123",
            fund_name="Growth Fund I",
            fund_type=FundType.PRIVATE_EQUITY,
            fund_status=FundStatus.ACTIVE,
            inception_date=datetime(2023, 1, 15),
            target_size=500000000,
            committed_capital=450000000,
            called_capital=225000000,
            paid_in_capital=220000000,
            nav=480000000,
            irr=0.185,
            moic=1.75,
            management_fee_rate=0.02,
            carry_rate=0.2,
            description="Growth equity fund focused on technology companies",
            created_at=datetime(2023, 1, 1),
            updated_at=datetime.utcnow()
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fund not found"
        )


@router.put("/{fund_id}", response_model=Fund)
async def update_fund(fund_id: str, fund_update: UpdateFundRequest):
    """
    Update fund details
    """
    logger.info(f"Updating fund: {fund_id}")
    
    # Mock response - in real implementation, fetch existing fund and update
    return Fund(
        fund_id=fund_id,
        fund_name=fund_update.fund_name or "Growth Fund I",
        fund_type=fund_update.fund_type or FundType.PRIVATE_EQUITY,
        fund_status=FundStatus.ACTIVE,
        inception_date=fund_update.inception_date or datetime(2023, 1, 15),
        target_size=fund_update.target_size or 500000000,
        committed_capital=450000000,
        called_capital=225000000,
        paid_in_capital=220000000,
        nav=480000000,
        irr=0.185,
        moic=1.75,
        management_fee_rate=fund_update.management_fee_rate or 0.02,
        carry_rate=fund_update.carry_rate or 0.2,
        description=fund_update.description,
        created_at=datetime(2023, 1, 1),
        updated_at=datetime.utcnow()
    )


@router.delete("/{fund_id}")
async def delete_fund(fund_id: str, request: Request = None):
    """
    Delete a fund (soft delete)
    """
    # Check permissions - only admin can delete funds
    user_roles = getattr(request.state, "roles", []) if request else []
    if "admin" not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to delete fund"
        )
    
    # TODO: Replace with actual service call
    # return await proxy_request("DELETE", f"/funds/{fund_id}")
    
    logger.info(f"Deleting fund: {fund_id}")
    
    return {"message": "Fund deleted successfully"}


@router.get("/{fund_id}/performance", response_model=FundPerformance)
async def get_fund_performance(fund_id: str):
    """
    Get fund performance metrics
    """
    # Mock response
    return FundPerformance(
        fund_id=fund_id,
        as_of_date=datetime.utcnow(),
        nav=480000000,
        irr=0.185,
        moic=1.75,
        tvpi=1.75,
        dpi=0.44,
        rvpi=1.31,
        called_capital=225000000,
        distributed_capital=100000000,
        remaining_value=380000000
    )


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


@router.post("/{fund_id}/capital-calls", response_model=CapitalCall)
async def create_capital_call(fund_id: str, capital_call_data: dict):
    """
    Create a capital call for a fund
    """
    logger.info(f"Creating capital call for fund: {fund_id}")
    
    # Mock response
    return CapitalCall(
        capital_call_id="cc-123",
        fund_id=fund_id,
        call_number=1,
        call_amount=capital_call_data.get("call_amount", 10000000),
        call_date=datetime.fromisoformat(capital_call_data.get("call_date", "2024-02-01")),
        due_date=datetime.fromisoformat(capital_call_data.get("due_date", "2024-02-15")),
        purpose=capital_call_data.get("purpose", "Investment deployment"),
        status="ISSUED",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )


@router.get("/{fund_id}/capital-calls", response_model=List[CapitalCall])
async def get_fund_capital_calls(fund_id: str):
    """
    Get all capital calls for a fund
    """
    # Mock response
    return [
        CapitalCall(
            capital_call_id="cc-123",
            fund_id=fund_id,
            call_number=1,
            call_amount=10000000,
            call_date=datetime(2024, 2, 1),
            due_date=datetime(2024, 2, 15),
            purpose="Initial investment deployment",
            status="PAID",
            created_at=datetime(2024, 1, 15),
            updated_at=datetime(2024, 2, 16)
        )
    ]


@router.post("/{fund_id}/distributions", response_model=Distribution)
async def create_distribution(fund_id: str, distribution_data: dict):
    """
    Create a distribution for a fund
    """
    logger.info(f"Creating distribution for fund: {fund_id}")
    
    # Mock response
    return Distribution(
        distribution_id="dist-123",
        fund_id=fund_id,
        distribution_number=1,
        total_amount=distribution_data.get("distribution_amount", 5000000),
        distribution_date=datetime.fromisoformat(distribution_data.get("distribution_date", "2024-03-01")),
        distribution_type="RETURN_OF_CAPITAL",
        source="REALIZED_GAINS",
        status="PAID",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )


@router.get("/{fund_id}/distributions", response_model=List[Distribution])
async def get_fund_distributions(fund_id: str):
    """
    Get all distributions for a fund
    """
    # Mock response
    return [
        Distribution(
            distribution_id="dist-123",
            fund_id=fund_id,
            distribution_number=1,
            total_amount=5000000,
            distribution_date=datetime(2024, 3, 1),
            distribution_type="RETURN_OF_CAPITAL",
            source="REALIZED_GAINS",
            status="PAID",
            created_at=datetime(2024, 2, 15),
            updated_at=datetime(2024, 3, 2)
        )
    ]


@router.post("/{fund_id}/commitments")
async def create_commitment(fund_id: str, commitment_data: dict):
    """
    Create an investor commitment to a fund
    """
    logger.info(f"Creating commitment for fund: {fund_id}")
    
    # Mock response
    return {
        "commitment_id": "commit-123",
        "fund_id": fund_id,
        "investor_id": commitment_data.get("investor_id"),
        "commitment_amount": commitment_data.get("commitment_amount"),
        "commitment_date": commitment_data.get("commitment_date"),
        "status": "ACTIVE",
        "message": "Commitment created successfully"
    }


@router.post("/{fund_id}/contributions")
async def create_contribution(fund_id: str, contribution_data: dict):
    """
    Record a capital contribution from an investor
    """
    logger.info(f"Recording contribution for fund: {fund_id}")
    
    # Mock response
    return {
        "contribution_id": "contrib-123",
        "fund_id": fund_id,
        "investor_id": contribution_data.get("investor_id"),
        "capital_call_id": contribution_data.get("capital_call_id"),
        "amount": contribution_data.get("amount"),
        "contribution_date": contribution_data.get("contribution_date"),
        "status": "RECEIVED",
        "message": "Contribution recorded successfully"
    }