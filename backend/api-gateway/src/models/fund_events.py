from datetime import datetime, date
from typing import List, Dict, Optional, Any, Union
from pydantic import BaseModel, Field, validator
from enum import Enum
from decimal import Decimal
from uuid import UUID


class EventType(str, Enum):
    CAPITAL_CALL = "capital_call"
    DISTRIBUTION = "distribution"
    MANAGEMENT_FEE = "management_fee"
    EXPENSE_ALLOCATION = "expense_allocation"
    PERFORMANCE_FEE = "performance_fee"
    SPECIAL_DISTRIBUTION = "special_distribution"


class EventStatus(str, Enum):
    DRAFT = "draft"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    PROCESSING = "processing"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    FAILED = "failed"


class CalculationMethod(str, Enum):
    PRO_RATA = "pro_rata"  # Based on ownership percentage
    FLAT_AMOUNT = "flat_amount"  # Fixed amount per investor
    TIERED = "tiered"  # Different rates for different tiers
    CUSTOM = "custom"  # Custom calculation logic


class FundEvent(BaseModel):
    """Base model for all fund events"""
    event_id: str
    fund_id: str
    event_type: EventType
    event_date: date
    effective_date: date
    record_date: date  # Date for determining eligible investors
    
    # Event details
    event_name: str
    description: Optional[str] = None
    total_amount: Decimal = Field(gt=0)
    
    # Calculation settings
    calculation_method: CalculationMethod = CalculationMethod.PRO_RATA
    calculation_basis: str = "commitment"  # "commitment", "paid_in", "nav"
    
    # Status and workflow
    status: EventStatus = EventStatus.DRAFT
    created_by: str
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    
    # Metadata
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    @validator('effective_date')
    def validate_effective_date(cls, v, values):
        if 'event_date' in values and v < values['event_date']:
            raise ValueError('Effective date cannot be before event date')
        return v


class CapitalCallEvent(FundEvent):
    """Capital call event with specific fields"""
    event_type: EventType = EventType.CAPITAL_CALL
    call_number: int
    due_date: date
    call_purpose: str
    
    # Breakdown of call amount
    investment_amount: Decimal = Field(default=0, ge=0)
    management_fee_amount: Decimal = Field(default=0, ge=0)
    expense_amount: Decimal = Field(default=0, ge=0)
    organizational_expense_amount: Decimal = Field(default=0, ge=0)
    
    # Call settings
    call_percentage: Optional[Decimal] = Field(None, ge=0, le=100)
    minimum_call_amount: Optional[Decimal] = Field(None, gt=0)
    allow_partial_funding: bool = True
    
    @validator('total_amount')
    def validate_total_amount(cls, v, values):
        components = [
            values.get('investment_amount', 0),
            values.get('management_fee_amount', 0),
            values.get('expense_amount', 0),
            values.get('organizational_expense_amount', 0)
        ]
        if sum(components) != v:
            raise ValueError('Total amount must equal sum of component amounts')
        return v


class DistributionEvent(FundEvent):
    """Distribution event with specific fields"""
    event_type: EventType = EventType.DISTRIBUTION
    distribution_number: int
    payment_date: date
    
    # Distribution classification
    distribution_type: str = "return_of_capital"  # "income", "capital_gain", "return_of_capital"
    source_description: str
    
    # Tax implications
    tax_year: int
    withholding_required: bool = False
    default_withholding_rate: Decimal = Field(default=0, ge=0, le=1)
    
    # Distribution calculations
    gross_distribution: Decimal = Field(gt=0)
    management_fee_offset: Decimal = Field(default=0, ge=0)
    expense_offset: Decimal = Field(default=0, ge=0)
    
    @validator('payment_date')
    def validate_payment_date(cls, v, values):
        if 'effective_date' in values and v < values['effective_date']:
            raise ValueError('Payment date cannot be before effective date')
        return v


class ManagementFeeEvent(FundEvent):
    """Management fee calculation event"""
    event_type: EventType = EventType.MANAGEMENT_FEE
    fee_period_start: date
    fee_period_end: date
    
    # Fee calculation
    fee_rate: Decimal = Field(gt=0, le=1)  # Annual rate
    fee_basis: str = "commitment"  # "commitment", "invested_capital", "nav"
    calculation_frequency: str = "quarterly"  # "monthly", "quarterly", "annually"
    
    # Proration settings
    prorate_for_period: bool = True
    days_in_period: int
    
    # Payment terms
    payment_method: str = "offset"  # "offset", "direct_payment", "capital_call"
    payment_due_date: Optional[date] = None


class InvestorEventCalculation(BaseModel):
    """Calculated amounts for individual investors"""
    calculation_id: str
    event_id: str
    investor_id: str
    commitment_id: str
    
    # Ownership basis
    ownership_percentage: Decimal = Field(ge=0, le=100)
    calculation_basis_amount: Decimal = Field(ge=0)  # The amount used for calculation
    
    # Calculated amounts
    gross_amount: Decimal = Field(ge=0)
    management_fee_offset: Decimal = Field(default=0, ge=0)
    expense_offset: Decimal = Field(default=0, ge=0)
    withholding_amount: Decimal = Field(default=0, ge=0)
    net_amount: Decimal = Field(ge=0)
    
    # Breakdown (for capital calls)
    investment_portion: Optional[Decimal] = Field(None, ge=0)
    management_fee_portion: Optional[Decimal] = Field(None, ge=0)
    expense_portion: Optional[Decimal] = Field(None, ge=0)
    
    # Status
    calculation_status: str = "calculated"  # "calculated", "validated", "approved"
    override_reason: Optional[str] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)


class EventProcessingResult(BaseModel):
    """Result of event processing"""
    event_id: str
    processing_id: str
    
    # Summary
    total_investors_processed: int
    total_gross_amount: Decimal
    total_net_amount: Decimal
    total_withholding: Decimal
    
    # Individual calculations
    investor_calculations: List[InvestorEventCalculation]
    
    # Validation results
    validation_errors: List[str] = []
    validation_warnings: List[str] = []
    
    # Status
    processing_status: str = "completed"  # "completed", "partial", "failed"
    processed_at: datetime = Field(default_factory=datetime.utcnow)


class EventCalculationEngine:
    """Engine for calculating investor-specific amounts from fund events"""
    
    def __init__(self):
        self.calculations: Dict[str, InvestorEventCalculation] = {}
    
    def calculate_event(
        self, 
        event: FundEvent, 
        investor_commitments: List[Dict[str, Any]]
    ) -> EventProcessingResult:
        """
        Calculate investor-specific amounts for a fund event
        
        Args:
            event: The fund event to process
            investor_commitments: List of investor commitment data
            
        Returns:
            EventProcessingResult with calculated amounts
        """
        processing_id = f"proc_{datetime.utcnow().timestamp()}"
        calculations = []
        validation_errors = []
        validation_warnings = []
        
        # Get calculation basis amounts
        basis_amounts = self._get_calculation_basis_amounts(
            event, investor_commitments
        )
        
        # Calculate total basis for percentage calculations
        total_basis = sum(basis_amounts.values())
        
        if total_basis == 0:
            validation_errors.append("No eligible investors found for calculation")
            return EventProcessingResult(
                event_id=event.event_id,
                processing_id=processing_id,
                total_investors_processed=0,
                total_gross_amount=Decimal('0'),
                total_net_amount=Decimal('0'),
                total_withholding=Decimal('0'),
                investor_calculations=[],
                validation_errors=validation_errors,
                processing_status="failed"
            )
        
        # Calculate for each investor
        for commitment in investor_commitments:
            investor_id = commitment['investor_id']
            commitment_id = commitment['commitment_id']
            
            # Skip if no basis amount
            if investor_id not in basis_amounts:
                continue
            
            basis_amount = basis_amounts[investor_id]
            ownership_percentage = (basis_amount / total_basis) * 100
            
            # Calculate based on event type
            if event.event_type == EventType.CAPITAL_CALL:
                calc = self._calculate_capital_call(
                    event, commitment, basis_amount, ownership_percentage
                )
            elif event.event_type == EventType.DISTRIBUTION:
                calc = self._calculate_distribution(
                    event, commitment, basis_amount, ownership_percentage
                )
            elif event.event_type == EventType.MANAGEMENT_FEE:
                calc = self._calculate_management_fee(
                    event, commitment, basis_amount, ownership_percentage
                )
            else:
                calc = self._calculate_generic_event(
                    event, commitment, basis_amount, ownership_percentage
                )
            
            # Validate calculation
            validation_result = self._validate_calculation(calc, event)
            if validation_result['errors']:
                validation_errors.extend(validation_result['errors'])
            if validation_result['warnings']:
                validation_warnings.extend(validation_result['warnings'])
            
            calculations.append(calc)
            self.calculations[calc.calculation_id] = calc
        
        # Create summary
        total_gross = sum(calc.gross_amount for calc in calculations)
        total_net = sum(calc.net_amount for calc in calculations)
        total_withholding = sum(calc.withholding_amount for calc in calculations)
        
        return EventProcessingResult(
            event_id=event.event_id,
            processing_id=processing_id,
            total_investors_processed=len(calculations),
            total_gross_amount=total_gross,
            total_net_amount=total_net,
            total_withholding=total_withholding,
            investor_calculations=calculations,
            validation_errors=validation_errors,
            validation_warnings=validation_warnings,
            processing_status="completed" if not validation_errors else "partial"
        )
    
    def _get_calculation_basis_amounts(
        self, 
        event: FundEvent, 
        investor_commitments: List[Dict[str, Any]]
    ) -> Dict[str, Decimal]:
        """Get the basis amounts for calculation (commitment, paid-in, etc.)"""
        basis_amounts = {}
        
        for commitment in investor_commitments:
            investor_id = commitment['investor_id']
            
            # Check if investor is eligible as of record date
            if not self._is_investor_eligible(commitment, event.record_date):
                continue
            
            # Get basis amount
            if event.calculation_basis == "commitment":
                basis_amounts[investor_id] = Decimal(str(commitment['commitment_amount']))
            elif event.calculation_basis == "paid_in":
                basis_amounts[investor_id] = Decimal(str(commitment.get('paid_in_amount', 0)))
            elif event.calculation_basis == "nav":
                basis_amounts[investor_id] = Decimal(str(commitment.get('nav_amount', 0)))
            else:
                basis_amounts[investor_id] = Decimal(str(commitment['commitment_amount']))
        
        return basis_amounts
    
    def _calculate_capital_call(
        self,
        event: CapitalCallEvent,
        commitment: Dict[str, Any],
        basis_amount: Decimal,
        ownership_percentage: Decimal
    ) -> InvestorEventCalculation:
        """Calculate capital call amounts for an investor"""
        
        # Calculate pro-rata share
        if event.calculation_method == CalculationMethod.PRO_RATA:
            gross_amount = (event.total_amount * ownership_percentage) / 100
        else:
            gross_amount = event.total_amount / len([commitment])  # Simplified
        
        # Break down into components
        investment_portion = (event.investment_amount * ownership_percentage) / 100
        mgmt_fee_portion = (event.management_fee_amount * ownership_percentage) / 100
        expense_portion = (event.expense_amount * ownership_percentage) / 100
        
        # Apply minimum call amount if specified
        if event.minimum_call_amount and gross_amount < event.minimum_call_amount:
            if not event.allow_partial_funding:
                gross_amount = Decimal('0')
                investment_portion = Decimal('0')
                mgmt_fee_portion = Decimal('0')
                expense_portion = Decimal('0')
        
        return InvestorEventCalculation(
            calculation_id=f"calc_{datetime.utcnow().timestamp()}_{commitment['investor_id']}",
            event_id=event.event_id,
            investor_id=commitment['investor_id'],
            commitment_id=commitment['commitment_id'],
            ownership_percentage=ownership_percentage,
            calculation_basis_amount=basis_amount,
            gross_amount=gross_amount,
            net_amount=gross_amount,  # No offsets for capital calls
            investment_portion=investment_portion,
            management_fee_portion=mgmt_fee_portion,
            expense_portion=expense_portion
        )
    
    def _calculate_distribution(
        self,
        event: DistributionEvent,
        commitment: Dict[str, Any],
        basis_amount: Decimal,
        ownership_percentage: Decimal
    ) -> InvestorEventCalculation:
        """Calculate distribution amounts for an investor"""
        
        # Calculate pro-rata share
        gross_amount = (event.gross_distribution * ownership_percentage) / 100
        
        # Apply offsets
        mgmt_fee_offset = (event.management_fee_offset * ownership_percentage) / 100
        expense_offset = (event.expense_offset * ownership_percentage) / 100
        
        # Calculate withholding
        withholding_amount = Decimal('0')
        if event.withholding_required:
            withholding_rate = commitment.get('withholding_rate', event.default_withholding_rate)
            withholding_amount = gross_amount * withholding_rate
        
        # Calculate net amount
        net_amount = gross_amount - mgmt_fee_offset - expense_offset - withholding_amount
        net_amount = max(net_amount, Decimal('0'))  # Ensure non-negative
        
        return InvestorEventCalculation(
            calculation_id=f"calc_{datetime.utcnow().timestamp()}_{commitment['investor_id']}",
            event_id=event.event_id,
            investor_id=commitment['investor_id'],
            commitment_id=commitment['commitment_id'],
            ownership_percentage=ownership_percentage,
            calculation_basis_amount=basis_amount,
            gross_amount=gross_amount,
            management_fee_offset=mgmt_fee_offset,
            expense_offset=expense_offset,
            withholding_amount=withholding_amount,
            net_amount=net_amount
        )
    
    def _calculate_management_fee(
        self,
        event: ManagementFeeEvent,
        commitment: Dict[str, Any],
        basis_amount: Decimal,
        ownership_percentage: Decimal
    ) -> InvestorEventCalculation:
        """Calculate management fee for an investor"""
        
        # Calculate annual fee
        annual_fee = basis_amount * event.fee_rate
        
        # Prorate for period if needed
        if event.prorate_for_period:
            period_factor = Decimal(str(event.days_in_period)) / Decimal('365')
            gross_amount = annual_fee * period_factor
        else:
            gross_amount = annual_fee
        
        return InvestorEventCalculation(
            calculation_id=f"calc_{datetime.utcnow().timestamp()}_{commitment['investor_id']}",
            event_id=event.event_id,
            investor_id=commitment['investor_id'],
            commitment_id=commitment['commitment_id'],
            ownership_percentage=ownership_percentage,
            calculation_basis_amount=basis_amount,
            gross_amount=gross_amount,
            net_amount=gross_amount
        )
    
    def _calculate_generic_event(
        self,
        event: FundEvent,
        commitment: Dict[str, Any],
        basis_amount: Decimal,
        ownership_percentage: Decimal
    ) -> InvestorEventCalculation:
        """Calculate generic event amounts"""
        
        gross_amount = (event.total_amount * ownership_percentage) / 100
        
        return InvestorEventCalculation(
            calculation_id=f"calc_{datetime.utcnow().timestamp()}_{commitment['investor_id']}",
            event_id=event.event_id,
            investor_id=commitment['investor_id'],
            commitment_id=commitment['commitment_id'],
            ownership_percentage=ownership_percentage,
            calculation_basis_amount=basis_amount,
            gross_amount=gross_amount,
            net_amount=gross_amount
        )
    
    def _is_investor_eligible(self, commitment: Dict[str, Any], record_date: date) -> bool:
        """Check if investor is eligible for the event as of record date"""
        
        # Check if commitment was active on record date
        commitment_date = commitment.get('commitment_date')
        if commitment_date and commitment_date > record_date:
            return False
        
        # Check if commitment is still active
        if commitment.get('status') != 'active':
            return False
        
        return True
    
    def _validate_calculation(
        self, 
        calculation: InvestorEventCalculation, 
        event: FundEvent
    ) -> Dict[str, List[str]]:
        """Validate calculation results"""
        errors = []
        warnings = []
        
        # Check for negative amounts
        if calculation.net_amount < 0:
            errors.append(f"Negative net amount for investor {calculation.investor_id}")
        
        # Check for zero ownership but non-zero amounts
        if calculation.ownership_percentage == 0 and calculation.gross_amount > 0:
            warnings.append(f"Zero ownership but non-zero amount for investor {calculation.investor_id}")
        
        # Check for very small amounts (potential rounding issues)
        if 0 < calculation.gross_amount < Decimal('0.01'):
            warnings.append(f"Very small amount for investor {calculation.investor_id}")
        
        return {"errors": errors, "warnings": warnings}


# Request/Response models
class CreateEventRequest(BaseModel):
    """Request to create a new fund event"""
    fund_id: str
    event_type: EventType
    event_name: str
    event_date: date
    effective_date: date
    record_date: date
    total_amount: Decimal = Field(gt=0)
    description: Optional[str] = None
    calculation_method: CalculationMethod = CalculationMethod.PRO_RATA
    calculation_basis: str = "commitment"
    metadata: Optional[Dict[str, Any]] = None


class ProcessEventRequest(BaseModel):
    """Request to process an event and calculate investor amounts"""
    event_id: str
    auto_approve: bool = False
    send_notifications: bool = True
    notification_template: Optional[str] = None


class EventApprovalRequest(BaseModel):
    """Request to approve an event"""
    event_id: str
    approval_notes: Optional[str] = None