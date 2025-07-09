"""
Investor management endpoints (proxy to Fund Management Service)
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, status, Depends, Query
from pydantic import BaseModel, EmailStr, Field

from src.config.settings import settings
from src.middleware.auth import JWTBearer
from src.utils.logger import logger

router = APIRouter(dependencies=[Depends(JWTBearer())])


class InvestorCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    investor_type: str = Field(..., pattern="^(individual|institutional|fund_of_funds)$")
    email: EmailStr
    phone: Optional[str] = None
    tax_id: Optional[str] = None
    jurisdiction: Optional[str] = None
    address: Optional[Dict[str, str]] = None


class InvestorUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=200)
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    jurisdiction: Optional[str] = None
    address: Optional[Dict[str, str]] = None
    kyc_status: Optional[str] = None


@router.get("/", response_model=List[Dict[str, Any]])
async def list_investors(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    investor_type: Optional[str] = None,
    kyc_status: Optional[str] = None
):
    """
    List all investors with optional filtering
    """
    # Mock response
    return [
        {
            "investor_id": "inv-001",
            "name": "Acme Pension Fund",
            "investor_type": "institutional",
            "email": "admin@acmepension.com",
            "jurisdiction": "US",
            "kyc_status": "approved",
            "total_commitments": 150000000,
            "funds_invested": 3
        },
        {
            "investor_id": "inv-002",
            "name": "John Smith Family Trust",
            "investor_type": "individual",
            "email": "john.smith@email.com",
            "jurisdiction": "US",
            "kyc_status": "approved",
            "total_commitments": 25000000,
            "funds_invested": 2
        }
    ]


@router.post("/", response_model=Dict[str, Any])
async def create_investor(investor: InvestorCreate):
    """
    Create a new investor
    """
    logger.info(f"Creating new investor: {investor.name}")
    
    # Mock response
    return {
        "investor_id": "inv-003",
        "name": investor.name,
        "investor_type": investor.investor_type,
        "email": investor.email,
        "kyc_status": "pending",
        "created_at": "2024-01-15T10:30:00Z"
    }


@router.get("/{investor_id}", response_model=Dict[str, Any])
async def get_investor(investor_id: str):
    """
    Get investor details by ID
    """
    # Mock response
    if investor_id == "inv-001":
        return {
            "investor_id": "inv-001",
            "name": "Acme Pension Fund",
            "investor_type": "institutional",
            "email": "admin@acmepension.com",
            "phone": "+1-555-0100",
            "tax_id": "12-3456789",
            "jurisdiction": "US",
            "address": {
                "street": "123 Main St",
                "city": "New York",
                "state": "NY",
                "zip": "10001",
                "country": "USA"
            },
            "kyc_status": "approved",
            "kyc_date": "2023-01-10",
            "commitments": [
                {
                    "fund_id": "fund-123",
                    "fund_name": "Growth Fund I",
                    "commitment_amount": 50000000,
                    "commitment_date": "2023-01-15",
                    "called_amount": 25000000,
                    "distributed_amount": 10000000
                }
            ],
            "total_commitments": 150000000,
            "total_called": 75000000,
            "total_distributed": 30000000
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Investor not found"
        )


@router.put("/{investor_id}", response_model=Dict[str, Any])
async def update_investor(investor_id: str, investor_update: InvestorUpdate):
    """
    Update investor details
    """
    logger.info(f"Updating investor: {investor_id}")
    
    # Mock response
    return {
        "investor_id": investor_id,
        "name": investor_update.name or "Acme Pension Fund",
        "kyc_status": investor_update.kyc_status or "approved",
        "updated_at": "2024-01-15T11:30:00Z"
    }


@router.delete("/{investor_id}")
async def delete_investor(investor_id: str):
    """
    Delete an investor (soft delete)
    """
    logger.info(f"Deleting investor: {investor_id}")
    
    return {"message": f"Investor {investor_id} deleted successfully"}


@router.get("/{investor_id}/commitments", response_model=List[Dict[str, Any]])
async def get_investor_commitments(investor_id: str):
    """
    Get all commitments for an investor
    """
    # Mock response
    return [
        {
            "commitment_id": "comm-001",
            "fund_id": "fund-123",
            "fund_name": "Growth Fund I",
            "commitment_amount": 50000000,
            "commitment_date": "2023-01-15",
            "called_amount": 25000000,
            "called_percentage": 0.5,
            "distributed_amount": 10000000,
            "remaining_commitment": 25000000,
            "status": "active"
        },
        {
            "commitment_id": "comm-002",
            "fund_id": "fund-456",
            "fund_name": "Tech Ventures II",
            "commitment_amount": 25000000,
            "commitment_date": "2024-01-01",
            "called_amount": 0,
            "called_percentage": 0,
            "distributed_amount": 0,
            "remaining_commitment": 25000000,
            "status": "active"
        }
    ]


@router.get("/{investor_id}/transactions", response_model=List[Dict[str, Any]])
async def get_investor_transactions(
    investor_id: str,
    fund_id: Optional[str] = None,
    transaction_type: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """
    Get transaction history for an investor
    """
    # Mock response
    return [
        {
            "transaction_id": "txn-001",
            "date": "2023-03-15",
            "fund_id": "fund-123",
            "fund_name": "Growth Fund I",
            "type": "capital_call",
            "amount": 5000000,
            "description": "Capital Call #1",
            "status": "paid"
        },
        {
            "transaction_id": "txn-002",
            "date": "2023-09-20",
            "fund_id": "fund-123",
            "fund_name": "Growth Fund I",
            "type": "capital_call",
            "amount": 7500000,
            "description": "Capital Call #2",
            "status": "paid"
        },
        {
            "transaction_id": "txn-003",
            "date": "2024-01-10",
            "fund_id": "fund-123",
            "fund_name": "Growth Fund I",
            "type": "distribution",
            "amount": 3000000,
            "description": "Distribution #1",
            "status": "paid"
        }
    ]


@router.post("/{investor_id}/documents", response_model=Dict[str, Any])
async def upload_investor_document(
    investor_id: str,
    document_type: str = Query(..., pattern="^(kyc|tax|legal|other)$"),
    description: Optional[str] = None
):
    """
    Upload a document for an investor
    """
    logger.info(f"Uploading document for investor: {investor_id}")
    
    # Mock response
    return {
        "document_id": "doc-001",
        "investor_id": investor_id,
        "document_type": document_type,
        "description": description,
        "upload_date": "2024-01-15T10:30:00Z",
        "status": "uploaded"
    }