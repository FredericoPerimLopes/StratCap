"""
Investor management endpoints
"""

from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, status, Depends, Query
import httpx

from src.config.settings import settings
from src.middleware.auth import JWTBearer
from src.utils.logger import logger
from src.models.investor import (
    Investor, InvestorCommitment, InvestorStatement, InvestorDocument,
    CreateInvestorRequest, UpdateInvestorRequest, CreateCommitmentRequest,
    InvestorType, Status, CommitmentStatus, Address, InvestorTransaction,
    TransactionType, TransactionStatus, DeleteInvestorResponse
)

router = APIRouter(dependencies=[Depends(JWTBearer())])


@router.get("/", response_model=List[Investor])
async def list_investors(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    investor_type: Optional[InvestorType] = None,
    kyc_status: Optional[Status] = None,
    aml_status: Optional[Status] = None
):
    """
    List all investors with optional filtering
    """
    # Mock response
    return [
        Investor(
            investor_id="inv-123",
            investor_name="TechCorp Pension Fund",
            investor_type=InvestorType.PENSION_FUND,
            email="contact@techcorp-pension.com",
            phone="+1-555-123-4567",
            address=Address(
                street_address="123 Finance St",
                city="New York",
                state="NY",
                postal_code="10001",
                country="USA"
            ),
            tax_id="12-3456789",
            kyc_status=Status.APPROVED,
            aml_status=Status.APPROVED,
            accredited_investor=True,
            qualified_purchaser=True,
            is_active=True,
            created_at=datetime(2023, 1, 15),
            updated_at=datetime.utcnow()
        ),
        Investor(
            investor_id="inv-456",
            investor_name="Smith Family Office",
            investor_type=InvestorType.FAMILY_OFFICE,
            email="investments@smithfamily.com",
            phone="+1-555-987-6543",
            address=Address(
                street_address="456 Wealth Ave",
                city="Greenwich",
                state="CT",
                postal_code="06830",
                country="USA"
            ),
            tax_id="98-7654321",
            kyc_status=Status.APPROVED,
            aml_status=Status.PENDING,
            accredited_investor=True,
            qualified_purchaser=True,
            is_active=True,
            created_at=datetime(2023, 2, 1),
            updated_at=datetime.utcnow()
        )
    ]


@router.post("/", response_model=Investor)
async def create_investor(investor: CreateInvestorRequest):
    """
    Create a new investor
    """
    logger.info(f"Creating new investor: {investor.investor_name}")
    
    # Mock response
    return Investor(
        investor_id="inv-789",
        investor_name=investor.investor_name,
        investor_type=investor.investor_type,
        email=investor.email,
        phone=investor.phone,
        address=investor.address,
        tax_id=investor.tax_id,
        kyc_status=Status.PENDING,
        aml_status=Status.PENDING,
        accredited_investor=investor.accredited_investor,
        qualified_purchaser=investor.qualified_purchaser,
        is_active=True,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )


@router.get("/{investor_id}", response_model=Investor)
async def get_investor(investor_id: str):
    """
    Get investor details by ID
    """
    # Mock response
    if investor_id == "inv-001":
        return Investor(
            investor_id="inv-001",
            investor_name="Acme Pension Fund",
            investor_type=InvestorType.INSTITUTIONAL,
            email="admin@acmepension.com",
            phone="+1-555-0100",
            address=Address(
                street_address="123 Main St",
                city="New York",
                state="NY",
                postal_code="10001",
                country="USA"
            ),
            tax_id="12-3456789",
            kyc_status=Status.APPROVED,
            aml_status=Status.APPROVED,
            accredited_investor=True,
            qualified_purchaser=True,
            is_active=True,
            created_at=datetime(2023, 1, 10),
            updated_at=datetime.utcnow()
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Investor not found"
        )


@router.put("/{investor_id}", response_model=Investor)
async def update_investor(investor_id: str, investor_update: UpdateInvestorRequest):
    """
    Update investor details
    """
    logger.info(f"Updating investor: {investor_id}")
    
    # Mock response - in real implementation, this would fetch and update the investor
    return Investor(
        investor_id=investor_id,
        investor_name=investor_update.investor_name or "Acme Pension Fund",
        investor_type=investor_update.investor_type or InvestorType.INSTITUTIONAL,
        email=investor_update.email or "admin@acmepension.com",
        phone=investor_update.phone or "+1-555-0100",
        address=investor_update.address or Address(
            street_address="123 Main St",
            city="New York",
            state="NY",
            postal_code="10001",
            country="USA"
        ),
        tax_id=investor_update.tax_id or "12-3456789",
        kyc_status=Status.APPROVED,
        aml_status=Status.APPROVED,
        accredited_investor=investor_update.accredited_investor or True,
        qualified_purchaser=investor_update.qualified_purchaser or True,
        is_active=True,
        created_at=datetime(2023, 1, 10),
        updated_at=datetime.utcnow()
    )


@router.delete("/{investor_id}", response_model=DeleteInvestorResponse)
async def delete_investor(investor_id: str):
    """
    Delete an investor (soft delete)
    """
    logger.info(f"Deleting investor: {investor_id}")
    
    return DeleteInvestorResponse(
        message=f"Investor {investor_id} deleted successfully",
        investor_id=investor_id,
        deleted_at=datetime.utcnow()
    )


@router.get("/{investor_id}/commitments", response_model=List[InvestorCommitment])
async def get_investor_commitments(investor_id: str):
    """
    Get all commitments for an investor
    """
    # Mock response
    return [
        InvestorCommitment(
            commitment_id="comm-001",
            investor_id=investor_id,
            fund_id="fund-123",
            commitment_amount=50000000,
            commitment_date=datetime(2023, 1, 15),
            commitment_percentage=0.5,
            called_amount=25000000,
            uncalled_amount=25000000,
            distributed_amount=10000000,
            current_value=40000000,
            status=CommitmentStatus.ACTIVE
        ),
        InvestorCommitment(
            commitment_id="comm-002",
            investor_id=investor_id,
            fund_id="fund-456",
            commitment_amount=25000000,
            commitment_date=datetime(2024, 1, 1),
            commitment_percentage=0.25,
            called_amount=0,
            uncalled_amount=25000000,
            distributed_amount=0,
            current_value=25000000,
            status=CommitmentStatus.ACTIVE
        )
    ]


@router.get("/{investor_id}/transactions", response_model=List[InvestorTransaction])
async def get_investor_transactions(
    investor_id: str,
    fund_id: Optional[str] = None,
    transaction_type: Optional[TransactionType] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """
    Get transaction history for an investor
    """
    # Mock response
    return [
        InvestorTransaction(
            transaction_id="txn-001",
            investor_id=investor_id,
            fund_id="fund-123",
            transaction_type=TransactionType.CAPITAL_CALL,
            amount=5000000,
            transaction_date=datetime(2023, 3, 15),
            description="Capital Call #1",
            status=TransactionStatus.PAID,
            due_date=datetime(2023, 3, 1),
            paid_date=datetime(2023, 3, 15)
        ),
        InvestorTransaction(
            transaction_id="txn-002",
            investor_id=investor_id,
            fund_id="fund-123",
            transaction_type=TransactionType.CAPITAL_CALL,
            amount=7500000,
            transaction_date=datetime(2023, 9, 20),
            description="Capital Call #2",
            status=TransactionStatus.PAID,
            due_date=datetime(2023, 9, 5),
            paid_date=datetime(2023, 9, 20)
        ),
        InvestorTransaction(
            transaction_id="txn-003",
            investor_id=investor_id,
            fund_id="fund-123",
            transaction_type=TransactionType.DISTRIBUTION,
            amount=3000000,
            transaction_date=datetime(2024, 1, 10),
            description="Distribution #1",
            status=TransactionStatus.PAID,
            paid_date=datetime(2024, 1, 10)
        )
    ]


@router.post("/{investor_id}/documents", response_model=InvestorDocument)
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
    return InvestorDocument(
        document_id="doc-001",
        investor_id=investor_id,
        document_type=document_type,
        document_name=f"{document_type}_document_{investor_id}",
        file_path=f"/uploads/{investor_id}/{document_type}/doc-001.pdf",
        upload_date=datetime.utcnow(),
        uploaded_by="system",
        status=Status.APPROVED
    )