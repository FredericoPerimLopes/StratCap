from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, validator
from enum import Enum
from .fund import FundType, FundStatus


class FundStructureType(str, Enum):
    MAIN = "main"
    PARALLEL = "parallel"
    FEEDER = "feeder"
    MASTER = "master"
    BLOCKER = "blocker"
    AGGREGATOR = "aggregator"


class InvestorEligibility(str, Enum):
    US_TAXABLE = "us_taxable"
    US_TAX_EXEMPT = "us_tax_exempt"
    NON_US = "non_us"
    QUALIFIED_PURCHASER = "qualified_purchaser"
    ACCREDITED_INVESTOR = "accredited_investor"
    INSTITUTIONAL = "institutional"
    ERISA_PLAN = "erisa_plan"


class AllocationStrategy(str, Enum):
    PRO_RATA = "pro_rata"
    FIRST_COME_FIRST_SERVED = "first_come_first_served"
    TIERED = "tiered"
    CUSTOM = "custom"


class FundStructure(BaseModel):
    """Enhanced fund model with hierarchical structure support"""
    fund_id: str
    fund_name: str
    fund_type: FundType
    structure_type: FundStructureType
    fund_status: FundStatus
    parent_fund_id: Optional[str] = None
    master_fund_id: Optional[str] = None
    
    # Fund details
    inception_date: datetime
    target_size: float
    min_commitment: float = Field(default=1000000.0, gt=0)
    max_commitment: Optional[float] = None
    
    # Investor constraints
    max_investors: Optional[int] = None
    eligible_investor_types: List[InvestorEligibility] = []
    restricted_jurisdictions: List[str] = []
    
    # Fee structure
    management_fee_rate: float
    carry_rate: float
    fee_sharing_arrangement: Optional[Dict[str, Any]] = None
    
    # Capital tracking
    committed_capital: float = 0
    called_capital: float = 0
    paid_in_capital: float = 0
    nav: float = 0
    
    # Hierarchical relationships
    child_funds: List[str] = []
    sibling_funds: List[str] = []
    
    # Allocation rules
    allocation_strategy: AllocationStrategy = AllocationStrategy.PRO_RATA
    allocation_rules: Optional[Dict[str, Any]] = None
    
    # Metadata
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    version: int = 1
    
    @validator('max_commitment')
    def validate_max_commitment(cls, v, values):
        if v and 'min_commitment' in values and v < values['min_commitment']:
            raise ValueError('max_commitment must be greater than min_commitment')
        return v
    
    @validator('parent_fund_id')
    def validate_hierarchy(cls, v, values):
        if v and 'fund_id' in values and v == values['fund_id']:
            raise ValueError('Fund cannot be its own parent')
        return v


class FundRelationship(BaseModel):
    """Defines relationships between funds"""
    relationship_id: str
    parent_fund_id: str
    child_fund_id: str
    relationship_type: str  # 'parent-child', 'master-feeder', 'parallel'
    allocation_percentage: Optional[float] = None
    fee_sharing_percentage: Optional[float] = None
    cross_investment_allowed: bool = False
    created_at: datetime
    
    @validator('allocation_percentage')
    def validate_percentage(cls, v):
        if v is not None and (v < 0 or v > 100):
            raise ValueError('Percentage must be between 0 and 100')
        return v


class InvestorAllocation(BaseModel):
    """Tracks investor allocation across fund structures"""
    allocation_id: str
    investor_id: str
    fund_id: str
    commitment_amount: float
    allocated_amount: float = 0
    allocation_date: datetime
    allocation_status: str  # 'pending', 'confirmed', 'rejected'
    rejection_reason: Optional[str] = None
    
    # Eligibility checks
    eligibility_verified: bool = False
    verification_date: Optional[datetime] = None
    verified_by: Optional[str] = None
    
    # Special terms
    side_letter_applicable: bool = False
    special_fee_terms: Optional[Dict[str, Any]] = None
    
    @validator('allocated_amount')
    def validate_allocation(cls, v, values):
        if 'commitment_amount' in values and v > values['commitment_amount']:
            raise ValueError('Allocated amount cannot exceed commitment amount')
        return v


class AllocationRequest(BaseModel):
    """Request for allocating an investor to a fund structure"""
    investor_id: str
    fund_id: str
    requested_amount: float = Field(gt=0)
    investor_type: InvestorEligibility
    jurisdiction: str
    preference_order: List[str] = []  # Preferred fund IDs in order
    
    # Additional criteria
    accepts_side_letter: bool = True
    tax_transparent_required: bool = False
    erisa_percentage: Optional[float] = None


class AllocationResult(BaseModel):
    """Result of investor allocation across fund structures"""
    request_id: str
    investor_id: str
    total_requested: float
    total_allocated: float
    allocation_status: str  # 'full', 'partial', 'rejected'
    
    # Individual fund allocations
    allocations: List[Dict[str, Any]] = []
    # Format: [{'fund_id': str, 'fund_name': str, 'allocated_amount': float, 'percentage': float}]
    
    # Rejection details if applicable
    rejection_reasons: List[str] = []
    
    # Suggested alternatives
    alternative_funds: List[Dict[str, Any]] = []
    
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class FundStructureTree(BaseModel):
    """Hierarchical representation of fund structures"""
    root_fund: FundStructure
    relationships: List[FundRelationship]
    total_target_size: float
    total_committed: float
    total_investors: int
    
    def get_fund_hierarchy(self) -> Dict[str, Any]:
        """Returns hierarchical structure as nested dictionary"""
        hierarchy = {
            'fund_id': self.root_fund.fund_id,
            'fund_name': self.root_fund.fund_name,
            'structure_type': self.root_fund.structure_type,
            'target_size': self.root_fund.target_size,
            'committed_capital': self.root_fund.committed_capital,
            'children': []
        }
        
        # Build children recursively
        for rel in self.relationships:
            if rel.parent_fund_id == self.root_fund.fund_id:
                # Add child fund details
                hierarchy['children'].append({
                    'fund_id': rel.child_fund_id,
                    'relationship_type': rel.relationship_type,
                    'allocation_percentage': rel.allocation_percentage
                })
        
        return hierarchy


class CreateFundStructureRequest(BaseModel):
    """Request to create a new fund with structure"""
    fund_name: str = Field(..., min_length=2, max_length=100)
    fund_type: FundType
    structure_type: FundStructureType
    parent_fund_id: Optional[str] = None
    
    inception_date: datetime
    target_size: float = Field(..., gt=0)
    min_commitment: float = Field(default=1000000.0, gt=0)
    max_commitment: Optional[float] = None
    
    max_investors: Optional[int] = None
    eligible_investor_types: List[InvestorEligibility]
    restricted_jurisdictions: List[str] = []
    
    management_fee_rate: float = Field(..., ge=0, le=1)
    carry_rate: float = Field(..., ge=0, le=1)
    
    allocation_strategy: AllocationStrategy = AllocationStrategy.PRO_RATA
    allocation_rules: Optional[Dict[str, Any]] = None
    
    description: Optional[str] = None


class UpdateFundStructureRequest(BaseModel):
    """Request to update fund structure"""
    fund_id: str
    structure_type: Optional[FundStructureType] = None
    parent_fund_id: Optional[str] = None
    
    min_commitment: Optional[float] = Field(None, gt=0)
    max_commitment: Optional[float] = None
    max_investors: Optional[int] = None
    
    eligible_investor_types: Optional[List[InvestorEligibility]] = None
    restricted_jurisdictions: Optional[List[str]] = None
    
    allocation_strategy: Optional[AllocationStrategy] = None
    allocation_rules: Optional[Dict[str, Any]] = None