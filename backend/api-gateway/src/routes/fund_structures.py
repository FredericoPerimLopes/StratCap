from fastapi import APIRouter, Depends, HTTPException, Query, Path
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from ..models import (
    FundStructure, FundStructureType, CreateFundStructureRequest, 
    UpdateFundStructureRequest, FundStructureTree, FundRelationship,
    AllocationRequest, AllocationResult, AllocationEngine
)
from ..middleware.auth import get_current_user
from ..utils.logger import get_logger

router = APIRouter(prefix="/api/fund-structures", tags=["fund-structures"])
logger = get_logger(__name__)

# Initialize allocation engine (in production, this would be a service)
allocation_engine = AllocationEngine()


@router.post("/", response_model=FundStructure)
async def create_fund_structure(
    request: CreateFundStructureRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create a new fund structure with hierarchical support"""
    try:
        # Create fund structure
        fund_structure = FundStructure(
            fund_id=str(UUID.uuid4()),
            fund_name=request.fund_name,
            fund_type=request.fund_type,
            structure_type=request.structure_type,
            fund_status="setup",
            parent_fund_id=request.parent_fund_id,
            inception_date=request.inception_date,
            target_size=request.target_size,
            min_commitment=request.min_commitment,
            max_commitment=request.max_commitment,
            max_investors=request.max_investors,
            eligible_investor_types=request.eligible_investor_types,
            restricted_jurisdictions=request.restricted_jurisdictions,
            management_fee_rate=request.management_fee_rate,
            carry_rate=request.carry_rate,
            allocation_strategy=request.allocation_strategy,
            allocation_rules=request.allocation_rules,
            description=request.description,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        # Add to allocation engine
        allocation_engine.add_fund(fund_structure)
        
        logger.info(f"Created fund structure: {fund_structure.fund_id}")
        return fund_structure
        
    except Exception as e:
        logger.error(f"Error creating fund structure: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=List[FundStructure])
async def list_fund_structures(
    structure_type: Optional[FundStructureType] = None,
    parent_fund_id: Optional[str] = None,
    include_children: bool = False,
    current_user: dict = Depends(get_current_user)
):
    """List fund structures with optional filtering"""
    try:
        # Mock data for demonstration
        structures = []
        
        # Main fund
        main_fund = FundStructure(
            fund_id="fund_001",
            fund_name="Strategic Growth Fund I",
            fund_type="private_equity",
            structure_type=FundStructureType.MAIN,
            fund_status="active",
            parent_fund_id=None,
            inception_date=datetime(2024, 1, 1),
            target_size=500000000,
            min_commitment=5000000,
            max_commitment=50000000,
            max_investors=99,
            eligible_investor_types=["qualified_purchaser", "institutional"],
            restricted_jurisdictions=["IRN", "PRK"],
            management_fee_rate=0.02,
            carry_rate=0.20,
            committed_capital=350000000,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        structures.append(main_fund)
        
        # Parallel fund
        parallel_fund = FundStructure(
            fund_id="fund_002",
            fund_name="Strategic Growth Fund I - Parallel",
            fund_type="private_equity",
            structure_type=FundStructureType.PARALLEL,
            fund_status="active",
            parent_fund_id="fund_001",
            inception_date=datetime(2024, 1, 1),
            target_size=200000000,
            min_commitment=1000000,
            max_commitment=25000000,
            max_investors=None,
            eligible_investor_types=["us_tax_exempt", "erisa_plan"],
            restricted_jurisdictions=["IRN", "PRK"],
            management_fee_rate=0.02,
            carry_rate=0.20,
            committed_capital=150000000,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        structures.append(parallel_fund)
        
        # Feeder fund
        feeder_fund = FundStructure(
            fund_id="fund_003",
            fund_name="Strategic Growth Fund I - Offshore Feeder",
            fund_type="private_equity",
            structure_type=FundStructureType.FEEDER,
            fund_status="active",
            parent_fund_id="fund_001",
            master_fund_id="fund_001",
            inception_date=datetime(2024, 2, 1),
            target_size=100000000,
            min_commitment=250000,
            max_commitment=10000000,
            max_investors=None,
            eligible_investor_types=["non_us", "institutional"],
            restricted_jurisdictions=["USA", "IRN", "PRK"],
            management_fee_rate=0.025,  # Higher fee for feeder
            carry_rate=0.20,
            committed_capital=75000000,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        structures.append(feeder_fund)
        
        # Apply filters
        if structure_type:
            structures = [s for s in structures if s.structure_type == structure_type]
        
        if parent_fund_id:
            structures = [s for s in structures if s.parent_fund_id == parent_fund_id]
        
        return structures
        
    except Exception as e:
        logger.error(f"Error listing fund structures: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{fund_id}", response_model=FundStructure)
async def get_fund_structure(
    fund_id: str = Path(..., description="Fund structure ID"),
    current_user: dict = Depends(get_current_user)
):
    """Get detailed fund structure information"""
    try:
        # Mock retrieval
        fund_structure = FundStructure(
            fund_id=fund_id,
            fund_name="Strategic Growth Fund I",
            fund_type="private_equity",
            structure_type=FundStructureType.MAIN,
            fund_status="active",
            parent_fund_id=None,
            inception_date=datetime(2024, 1, 1),
            target_size=500000000,
            min_commitment=5000000,
            max_commitment=50000000,
            max_investors=99,
            eligible_investor_types=["qualified_purchaser", "institutional"],
            restricted_jurisdictions=["IRN", "PRK"],
            management_fee_rate=0.02,
            carry_rate=0.20,
            committed_capital=350000000,
            child_funds=["fund_002", "fund_003"],
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        return fund_structure
        
    except Exception as e:
        logger.error(f"Error getting fund structure: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{fund_id}/hierarchy", response_model=FundStructureTree)
async def get_fund_hierarchy(
    fund_id: str = Path(..., description="Fund structure ID"),
    current_user: dict = Depends(get_current_user)
):
    """Get complete fund hierarchy tree"""
    try:
        # Mock hierarchy
        root_fund = FundStructure(
            fund_id=fund_id,
            fund_name="Strategic Growth Fund I",
            fund_type="private_equity",
            structure_type=FundStructureType.MAIN,
            fund_status="active",
            parent_fund_id=None,
            inception_date=datetime(2024, 1, 1),
            target_size=500000000,
            min_commitment=5000000,
            committed_capital=350000000,
            management_fee_rate=0.02,
            carry_rate=0.20,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        relationships = [
            FundRelationship(
                relationship_id="rel_001",
                parent_fund_id=fund_id,
                child_fund_id="fund_002",
                relationship_type="parallel",
                allocation_percentage=40,
                created_at=datetime.utcnow()
            ),
            FundRelationship(
                relationship_id="rel_002",
                parent_fund_id=fund_id,
                child_fund_id="fund_003",
                relationship_type="master-feeder",
                allocation_percentage=20,
                created_at=datetime.utcnow()
            )
        ]
        
        tree = FundStructureTree(
            root_fund=root_fund,
            relationships=relationships,
            total_target_size=800000000,  # Sum of all funds
            total_committed=575000000,
            total_investors=150
        )
        
        return tree
        
    except Exception as e:
        logger.error(f"Error getting fund hierarchy: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/allocate", response_model=AllocationResult)
async def allocate_investor(
    request: AllocationRequest,
    current_user: dict = Depends(get_current_user)
):
    """Allocate investor across fund structures using the allocation engine"""
    try:
        # Ensure funds are loaded in the engine
        # In production, this would load from database
        _load_mock_funds_to_engine()
        
        # Perform allocation
        result = allocation_engine.allocate_investor(request)
        
        logger.info(f"Allocation result for investor {request.investor_id}: {result.allocation_status}")
        return result
        
    except Exception as e:
        logger.error(f"Error allocating investor: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{fund_id}", response_model=FundStructure)
async def update_fund_structure(
    fund_id: str,
    request: UpdateFundStructureRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update fund structure configuration"""
    try:
        # Mock update
        fund_structure = FundStructure(
            fund_id=fund_id,
            fund_name="Strategic Growth Fund I",
            fund_type="private_equity",
            structure_type=request.structure_type or FundStructureType.MAIN,
            fund_status="active",
            parent_fund_id=request.parent_fund_id,
            inception_date=datetime(2024, 1, 1),
            target_size=500000000,
            min_commitment=request.min_commitment or 5000000,
            max_commitment=request.max_commitment,
            max_investors=request.max_investors,
            eligible_investor_types=request.eligible_investor_types or ["qualified_purchaser"],
            restricted_jurisdictions=request.restricted_jurisdictions or [],
            management_fee_rate=0.02,
            carry_rate=0.20,
            allocation_strategy=request.allocation_strategy or "pro_rata",
            allocation_rules=request.allocation_rules,
            committed_capital=350000000,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        logger.info(f"Updated fund structure: {fund_id}")
        return fund_structure
        
    except Exception as e:
        logger.error(f"Error updating fund structure: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{fund_id}/relationships", response_model=FundRelationship)
async def create_fund_relationship(
    fund_id: str,
    child_fund_id: str = Query(..., description="Child fund ID"),
    relationship_type: str = Query(..., description="Relationship type"),
    allocation_percentage: Optional[float] = Query(None, ge=0, le=100),
    current_user: dict = Depends(get_current_user)
):
    """Create relationship between funds"""
    try:
        relationship = FundRelationship(
            relationship_id=str(UUID.uuid4()),
            parent_fund_id=fund_id,
            child_fund_id=child_fund_id,
            relationship_type=relationship_type,
            allocation_percentage=allocation_percentage,
            created_at=datetime.utcnow()
        )
        
        logger.info(f"Created fund relationship: {relationship.relationship_id}")
        return relationship
        
    except Exception as e:
        logger.error(f"Error creating fund relationship: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{fund_id}/capacity")
async def get_fund_capacity(
    fund_id: str = Path(..., description="Fund structure ID"),
    current_user: dict = Depends(get_current_user)
):
    """Get fund capacity and subscription information"""
    try:
        capacity = {
            "fund_id": fund_id,
            "fund_name": "Strategic Growth Fund I",
            "target_size": 500000000,
            "committed_capital": 350000000,
            "available_capacity": 150000000,
            "subscription_percentage": 70.0,
            "max_investors": 99,
            "current_investors": 45,
            "available_investor_slots": 54,
            "can_accept_new_investors": True,
            "estimated_final_close": "2024-12-31"
        }
        
        return capacity
        
    except Exception as e:
        logger.error(f"Error getting fund capacity: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


def _load_mock_funds_to_engine():
    """Load mock funds to allocation engine for testing"""
    # Clear existing funds
    allocation_engine.funds.clear()
    
    # Add main fund
    main_fund = FundStructure(
        fund_id="fund_001",
        fund_name="Strategic Growth Fund I",
        fund_type="private_equity",
        structure_type=FundStructureType.MAIN,
        fund_status="active",
        inception_date=datetime(2024, 1, 1),
        target_size=500000000,
        min_commitment=5000000,
        max_commitment=50000000,
        max_investors=99,
        eligible_investor_types=["qualified_purchaser", "institutional"],
        restricted_jurisdictions=["IRN", "PRK"],
        management_fee_rate=0.02,
        carry_rate=0.20,
        committed_capital=350000000,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    allocation_engine.add_fund(main_fund)
    
    # Add parallel fund
    parallel_fund = FundStructure(
        fund_id="fund_002",
        fund_name="Strategic Growth Fund I - Parallel",
        fund_type="private_equity",
        structure_type=FundStructureType.PARALLEL,
        fund_status="active",
        parent_fund_id="fund_001",
        inception_date=datetime(2024, 1, 1),
        target_size=200000000,
        min_commitment=1000000,
        max_commitment=25000000,
        eligible_investor_types=["us_tax_exempt", "erisa_plan"],
        restricted_jurisdictions=["IRN", "PRK"],
        management_fee_rate=0.02,
        carry_rate=0.20,
        committed_capital=150000000,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    allocation_engine.add_fund(parallel_fund)
    
    # Add feeder fund
    feeder_fund = FundStructure(
        fund_id="fund_003",
        fund_name="Strategic Growth Fund I - Offshore Feeder",
        fund_type="private_equity",
        structure_type=FundStructureType.FEEDER,
        fund_status="active",
        parent_fund_id="fund_001",
        inception_date=datetime(2024, 2, 1),
        target_size=100000000,
        min_commitment=250000,
        max_commitment=10000000,
        eligible_investor_types=["non_us", "institutional"],
        restricted_jurisdictions=["USA", "IRN", "PRK"],
        management_fee_rate=0.025,
        carry_rate=0.20,
        committed_capital=75000000,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    allocation_engine.add_fund(feeder_fund)