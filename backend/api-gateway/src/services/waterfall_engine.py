"""
Advanced Waterfall Calculation Engine

Sophisticated waterfall calculation system for complex distribution scenarios
including preferred returns, catch-up provisions, and multiple carry tiers.
"""

from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, date
from decimal import Decimal, ROUND_HALF_UP
from dataclasses import dataclass, field
from enum import Enum
import json

from ..utils.logger import get_logger

logger = get_logger(__name__)


class WaterfallTier(str, Enum):
    RETURN_OF_CAPITAL = "return_of_capital"
    PREFERRED_RETURN = "preferred_return"
    CATCH_UP = "catch_up"
    PROMOTED_CARRY = "promoted_carry"
    REMAINING_PROCEEDS = "remaining_proceeds"


class DistributionType(str, Enum):
    CAPITAL_GAIN = "capital_gain"
    INCOME = "income"
    RETURN_OF_CAPITAL = "return_of_capital"
    MIXED = "mixed"


@dataclass
class WaterfallTierDefinition:
    """Definition of a waterfall tier"""
    tier_id: str
    tier_type: WaterfallTier
    name: str
    description: str
    
    # Calculation parameters
    hurdle_rate: Optional[Decimal] = None  # For preferred return
    catch_up_rate: Optional[Decimal] = None  # For catch-up
    carry_rate: Optional[Decimal] = None  # For carry tiers
    
    # Distribution split
    lp_percentage: Decimal = Decimal('100')  # LP share (default 100%)
    gp_percentage: Decimal = Decimal('0')    # GP share (default 0%)
    
    # Conditions
    applies_to_fund_types: List[str] = field(default_factory=list)
    minimum_threshold: Optional[Decimal] = None
    maximum_amount: Optional[Decimal] = None
    
    # Timing
    effective_date: Optional[date] = None
    expiration_date: Optional[date] = None


@dataclass
class InvestorPosition:
    """Investor position for waterfall calculations"""
    investor_id: str
    investor_name: str
    
    # Capital contributions
    total_contributions: Decimal
    unreturned_contributions: Decimal
    
    # Preferred return tracking
    preferred_return_shortfall: Decimal = Decimal('0')
    cumulative_preferred_return: Decimal = Decimal('0')
    
    # Distribution history
    prior_distributions: Decimal = Decimal('0')
    prior_carry_distributions: Decimal = Decimal('0')
    
    # Ownership
    ownership_percentage: Decimal
    
    # Special terms
    side_letter_provisions: Dict[str, Any] = field(default_factory=dict)


@dataclass
class WaterfallCalculationInput:
    """Input data for waterfall calculation"""
    fund_id: str
    calculation_date: date
    total_distribution_amount: Decimal
    distribution_type: DistributionType
    
    # Fund information
    fund_inception_date: date
    fund_committed_capital: Decimal
    fund_called_capital: Decimal
    fund_prior_distributions: Decimal
    
    # Waterfall structure
    waterfall_tiers: List[WaterfallTierDefinition]
    
    # Investor positions
    investor_positions: List[InvestorPosition]
    
    # Additional context
    portfolio_values: Dict[str, Decimal] = field(default_factory=dict)
    fund_expenses: Decimal = Decimal('0')
    management_fee_offset: Decimal = Decimal('0')


@dataclass
class TierDistribution:
    """Distribution calculation for a single tier"""
    tier_id: str
    tier_name: str
    tier_type: WaterfallTier
    
    # Amounts
    available_amount: Decimal
    distributed_amount: Decimal
    remaining_amount: Decimal
    
    # LP/GP split
    lp_amount: Decimal
    gp_amount: Decimal
    
    # Per-investor distributions
    investor_distributions: Dict[str, Decimal] = field(default_factory=dict)
    
    # Calculation details
    calculation_notes: List[str] = field(default_factory=list)


@dataclass
class WaterfallCalculationResult:
    """Complete waterfall calculation result"""
    calculation_id: str
    fund_id: str
    calculation_date: date
    total_distribution: Decimal
    
    # Tier-by-tier breakdown
    tier_distributions: List[TierDistribution]
    
    # Summary by recipient
    lp_total: Decimal
    gp_total: Decimal
    investor_summaries: Dict[str, Dict[str, Decimal]]
    
    # Post-distribution state
    updated_investor_positions: List[InvestorPosition]
    
    # Validation and quality
    validation_passed: bool = True
    validation_errors: List[str] = field(default_factory=list)
    validation_warnings: List[str] = field(default_factory=list)
    
    # Metadata
    calculated_by: str = "system"
    calculated_at: datetime = field(default_factory=datetime.utcnow)


class WaterfallCalculationEngine:
    """
    Advanced waterfall calculation engine supporting complex distribution structures.
    
    Handles multiple waterfall tiers, preferred returns, catch-up provisions,
    promoted carry, and side letter provisions.
    """
    
    def __init__(self):
        self.calculation_history: List[WaterfallCalculationResult] = []
        self.standard_tiers = self._create_standard_waterfall_tiers()
    
    async def calculate_waterfall(
        self, 
        calculation_input: WaterfallCalculationInput
    ) -> WaterfallCalculationResult:
        """
        Calculate distribution waterfall for a fund
        
        Args:
            calculation_input: Complete input data for calculation
            
        Returns:
            WaterfallCalculationResult with detailed breakdown
        """
        
        calculation_id = f"waterfall_{datetime.utcnow().timestamp()}"
        
        logger.info(f"Starting waterfall calculation: {calculation_id}")
        
        # Validate input
        validation_result = self._validate_input(calculation_input)
        if validation_result["errors"]:
            return WaterfallCalculationResult(
                calculation_id=calculation_id,
                fund_id=calculation_input.fund_id,
                calculation_date=calculation_input.calculation_date,
                total_distribution=calculation_input.total_distribution_amount,
                tier_distributions=[],
                lp_total=Decimal('0'),
                gp_total=Decimal('0'),
                investor_summaries={},
                updated_investor_positions=calculation_input.investor_positions,
                validation_passed=False,
                validation_errors=validation_result["errors"],
                validation_warnings=validation_result["warnings"]
            )
        
        # Initialize calculation state
        remaining_amount = calculation_input.total_distribution_amount
        tier_distributions = []
        updated_positions = [pos.__dict__.copy() for pos in calculation_input.investor_positions]
        
        # Process each waterfall tier in order
        for tier_def in calculation_input.waterfall_tiers:
            if remaining_amount <= 0:
                break
            
            tier_result = await self._calculate_tier_distribution(
                tier_def, remaining_amount, calculation_input, updated_positions
            )
            
            tier_distributions.append(tier_result)
            remaining_amount -= tier_result.distributed_amount
            
            # Update investor positions based on tier distribution
            self._update_positions_for_tier(updated_positions, tier_result, tier_def)
        
        # Calculate summary totals
        lp_total = sum(tier.lp_amount for tier in tier_distributions)
        gp_total = sum(tier.gp_amount for tier in tier_distributions)
        
        # Create investor summaries
        investor_summaries = self._create_investor_summaries(
            tier_distributions, calculation_input.investor_positions
        )
        
        # Convert updated positions back to objects
        final_positions = [
            InvestorPosition(**pos_data) for pos_data in updated_positions
        ]
        
        result = WaterfallCalculationResult(
            calculation_id=calculation_id,
            fund_id=calculation_input.fund_id,
            calculation_date=calculation_input.calculation_date,
            total_distribution=calculation_input.total_distribution_amount,
            tier_distributions=tier_distributions,
            lp_total=lp_total,
            gp_total=gp_total,
            investor_summaries=investor_summaries,
            updated_investor_positions=final_positions,
            validation_warnings=validation_result["warnings"]
        )
        
        # Store calculation result
        self.calculation_history.append(result)
        
        logger.info(f"Waterfall calculation completed: {calculation_id}")
        
        return result
    
    async def _calculate_tier_distribution(
        self,
        tier_def: WaterfallTierDefinition,
        available_amount: Decimal,
        calculation_input: WaterfallCalculationInput,
        updated_positions: List[Dict[str, Any]]
    ) -> TierDistribution:
        """Calculate distribution for a single waterfall tier"""
        
        tier_result = TierDistribution(
            tier_id=tier_def.tier_id,
            tier_name=tier_def.name,
            tier_type=tier_def.tier_type,
            available_amount=available_amount,
            distributed_amount=Decimal('0'),
            remaining_amount=available_amount,
            lp_amount=Decimal('0'),
            gp_amount=Decimal('0')
        )
        
        if tier_def.tier_type == WaterfallTier.RETURN_OF_CAPITAL:
            await self._calculate_return_of_capital(tier_result, calculation_input, updated_positions)
        
        elif tier_def.tier_type == WaterfallTier.PREFERRED_RETURN:
            await self._calculate_preferred_return(tier_result, tier_def, calculation_input, updated_positions)
        
        elif tier_def.tier_type == WaterfallTier.CATCH_UP:
            await self._calculate_catch_up(tier_result, tier_def, calculation_input, updated_positions)
        
        elif tier_def.tier_type == WaterfallTier.PROMOTED_CARRY:
            await self._calculate_promoted_carry(tier_result, tier_def, calculation_input, updated_positions)
        
        elif tier_def.tier_type == WaterfallTier.REMAINING_PROCEEDS:
            await self._calculate_remaining_proceeds(tier_result, tier_def, calculation_input, updated_positions)
        
        return tier_result
    
    async def _calculate_return_of_capital(
        self,
        tier_result: TierDistribution,
        calculation_input: WaterfallCalculationInput,
        updated_positions: List[Dict[str, Any]]
    ):
        """Calculate return of capital tier"""
        
        # Calculate total unreturned capital
        total_unreturned = sum(
            Decimal(str(pos['unreturned_contributions'])) for pos in updated_positions
        )
        
        if total_unreturned <= 0:
            tier_result.calculation_notes.append("No unreturned capital remaining")
            return
        
        # Distribute pro-rata based on unreturned capital
        distribution_amount = min(tier_result.available_amount, total_unreturned)
        
        for pos in updated_positions:
            unreturned = Decimal(str(pos['unreturned_contributions']))
            if unreturned > 0 and total_unreturned > 0:
                investor_share = (unreturned / total_unreturned) * distribution_amount
                tier_result.investor_distributions[pos['investor_id']] = investor_share
                
                # Update position
                pos['unreturned_contributions'] = str(unreturned - investor_share)
                pos['prior_distributions'] = str(Decimal(str(pos['prior_distributions'])) + investor_share)
        
        tier_result.distributed_amount = distribution_amount
        tier_result.lp_amount = distribution_amount
        tier_result.remaining_amount = tier_result.available_amount - distribution_amount
        
        tier_result.calculation_notes.append(
            f"Returned ${distribution_amount:,.2f} of capital to LPs"
        )
    
    async def _calculate_preferred_return(
        self,
        tier_result: TierDistribution,
        tier_def: WaterfallTierDefinition,
        calculation_input: WaterfallCalculationInput,
        updated_positions: List[Dict[str, Any]]
    ):
        """Calculate preferred return tier"""
        
        if not tier_def.hurdle_rate:
            tier_result.calculation_notes.append("No hurdle rate defined for preferred return")
            return
        
        # Calculate preferred return shortfall for each investor
        total_shortfall = Decimal('0')
        
        for pos in updated_positions:
            # Calculate time-weighted preferred return
            # Simplified calculation - would need actual contribution dates for precision
            capital_base = Decimal(str(pos['total_contributions']))
            annual_preferred = capital_base * tier_def.hurdle_rate
            
            # Calculate preferred return for the period
            years_since_inception = (
                calculation_input.calculation_date - calculation_input.fund_inception_date
            ).days / 365.25
            
            cumulative_preferred = annual_preferred * Decimal(str(years_since_inception))
            prior_preferred_paid = Decimal(str(pos.get('cumulative_preferred_return', 0)))
            
            shortfall = max(Decimal('0'), cumulative_preferred - prior_preferred_paid)
            pos['preferred_return_shortfall'] = str(shortfall)
            total_shortfall += shortfall
        
        if total_shortfall <= 0:
            tier_result.calculation_notes.append("No preferred return shortfall")
            return
        
        # Distribute available amount to cover shortfall
        distribution_amount = min(tier_result.available_amount, total_shortfall)
        
        for pos in updated_positions:
            shortfall = Decimal(str(pos['preferred_return_shortfall']))
            if shortfall > 0 and total_shortfall > 0:
                investor_share = (shortfall / total_shortfall) * distribution_amount
                tier_result.investor_distributions[pos['investor_id']] = investor_share
                
                # Update position
                pos['cumulative_preferred_return'] = str(
                    Decimal(str(pos['cumulative_preferred_return'])) + investor_share
                )
                pos['prior_distributions'] = str(
                    Decimal(str(pos['prior_distributions'])) + investor_share
                )
        
        tier_result.distributed_amount = distribution_amount
        tier_result.lp_amount = distribution_amount
        tier_result.remaining_amount = tier_result.available_amount - distribution_amount
        
        tier_result.calculation_notes.append(
            f"Paid ${distribution_amount:,.2f} preferred return at {tier_def.hurdle_rate:.1%} hurdle"
        )
    
    async def _calculate_catch_up(
        self,
        tier_result: TierDistribution,
        tier_def: WaterfallTierDefinition,
        calculation_input: WaterfallCalculationInput,
        updated_positions: List[Dict[str, Any]]
    ):
        """Calculate catch-up tier (GP gets distributions until reaching target carry)"""
        
        if not tier_def.catch_up_rate:
            tier_result.calculation_notes.append("No catch-up rate defined")
            return
        
        # Calculate total distributions to LPs so far
        total_lp_distributions = sum(
            Decimal(str(pos['prior_distributions'])) for pos in updated_positions
        )
        
        # Calculate what GP should have received if carry applied from beginning
        target_gp_carry = total_lp_distributions * (tier_def.catch_up_rate / (1 - tier_def.catch_up_rate))
        
        # Calculate how much GP has received
        total_gp_received = sum(
            Decimal(str(pos.get('prior_carry_distributions', 0))) for pos in updated_positions
        )
        
        # Calculate catch-up amount needed
        catch_up_needed = max(Decimal('0'), target_gp_carry - total_gp_received)
        
        if catch_up_needed <= 0:
            tier_result.calculation_notes.append("No catch-up needed")
            return
        
        # GP gets 100% of distributions in catch-up tier
        distribution_amount = min(tier_result.available_amount, catch_up_needed)
        
        tier_result.distributed_amount = distribution_amount
        tier_result.gp_amount = distribution_amount
        tier_result.remaining_amount = tier_result.available_amount - distribution_amount
        
        tier_result.calculation_notes.append(
            f"GP catch-up of ${distribution_amount:,.2f} towards {tier_def.catch_up_rate:.1%} carry"
        )
    
    async def _calculate_promoted_carry(
        self,
        tier_result: TierDistribution,
        tier_def: WaterfallTierDefinition,
        calculation_input: WaterfallCalculationInput,
        updated_positions: List[Dict[str, Any]]
    ):
        """Calculate promoted carry tier"""
        
        if not tier_def.carry_rate:
            tier_result.calculation_notes.append("No carry rate defined")
            return
        
        # Split remaining proceeds according to carry rate
        lp_percentage = 1 - tier_def.carry_rate
        gp_percentage = tier_def.carry_rate
        
        distribution_amount = tier_result.available_amount
        lp_amount = distribution_amount * lp_percentage
        gp_amount = distribution_amount * gp_percentage
        
        # Distribute LP portion pro-rata among investors
        total_ownership = sum(
            Decimal(str(pos['ownership_percentage'])) for pos in updated_positions
        )
        
        if total_ownership > 0:
            for pos in updated_positions:
                ownership_pct = Decimal(str(pos['ownership_percentage'])) / 100
                investor_share = lp_amount * (ownership_pct / (total_ownership / 100))
                tier_result.investor_distributions[pos['investor_id']] = investor_share
                
                # Update position
                pos['prior_distributions'] = str(
                    Decimal(str(pos['prior_distributions'])) + investor_share
                )
        
        tier_result.distributed_amount = distribution_amount
        tier_result.lp_amount = lp_amount
        tier_result.gp_amount = gp_amount
        tier_result.remaining_amount = Decimal('0')
        
        tier_result.calculation_notes.append(
            f"Promoted carry: LPs ${lp_amount:,.2f} ({lp_percentage:.1%}), GP ${gp_amount:,.2f} ({gp_percentage:.1%})"
        )
    
    async def _calculate_remaining_proceeds(
        self,
        tier_result: TierDistribution,
        tier_def: WaterfallTierDefinition,
        calculation_input: WaterfallCalculationInput,
        updated_positions: List[Dict[str, Any]]
    ):
        """Calculate remaining proceeds distribution"""
        
        # Use tier definition percentages or default to 80/20 split
        lp_percentage = tier_def.lp_percentage / 100
        gp_percentage = tier_def.gp_percentage / 100
        
        distribution_amount = tier_result.available_amount
        lp_amount = distribution_amount * lp_percentage
        gp_amount = distribution_amount * gp_percentage
        
        # Distribute LP portion pro-rata among investors
        total_ownership = sum(
            Decimal(str(pos['ownership_percentage'])) for pos in updated_positions
        )
        
        if total_ownership > 0:
            for pos in updated_positions:
                ownership_pct = Decimal(str(pos['ownership_percentage'])) / 100
                investor_share = lp_amount * (ownership_pct / (total_ownership / 100))
                tier_result.investor_distributions[pos['investor_id']] = investor_share
                
                # Update position
                pos['prior_distributions'] = str(
                    Decimal(str(pos['prior_distributions'])) + investor_share
                )
        
        tier_result.distributed_amount = distribution_amount
        tier_result.lp_amount = lp_amount
        tier_result.gp_amount = gp_amount
        tier_result.remaining_amount = Decimal('0')
        
        tier_result.calculation_notes.append(
            f"Remaining proceeds: LPs ${lp_amount:,.2f} ({lp_percentage:.1%}), GP ${gp_amount:,.2f} ({gp_percentage:.1%})"
        )
    
    def _update_positions_for_tier(
        self,
        updated_positions: List[Dict[str, Any]],
        tier_result: TierDistribution,
        tier_def: WaterfallTierDefinition
    ):
        """Update investor positions based on tier distribution"""
        
        # Additional position updates beyond what's done in tier calculations
        for investor_id, amount in tier_result.investor_distributions.items():
            pos = next((p for p in updated_positions if p['investor_id'] == investor_id), None)
            if pos:
                # Track carry distributions separately
                if tier_def.tier_type in [WaterfallTier.CATCH_UP, WaterfallTier.PROMOTED_CARRY]:
                    pos['prior_carry_distributions'] = str(
                        Decimal(str(pos.get('prior_carry_distributions', 0))) + amount
                    )
    
    def _create_investor_summaries(
        self,
        tier_distributions: List[TierDistribution],
        original_positions: List[InvestorPosition]
    ) -> Dict[str, Dict[str, Decimal]]:
        """Create summary of distributions by investor"""
        
        summaries = {}
        
        for position in original_positions:
            investor_id = position.investor_id
            
            summary = {
                "total_distribution": Decimal('0'),
                "return_of_capital": Decimal('0'),
                "preferred_return": Decimal('0'),
                "carry_distributions": Decimal('0'),
                "other_distributions": Decimal('0')
            }
            
            for tier in tier_distributions:
                amount = tier.investor_distributions.get(investor_id, Decimal('0'))
                summary["total_distribution"] += amount
                
                # Categorize by tier type
                if tier.tier_type == WaterfallTier.RETURN_OF_CAPITAL:
                    summary["return_of_capital"] += amount
                elif tier.tier_type == WaterfallTier.PREFERRED_RETURN:
                    summary["preferred_return"] += amount
                elif tier.tier_type in [WaterfallTier.CATCH_UP, WaterfallTier.PROMOTED_CARRY]:
                    summary["carry_distributions"] += amount
                else:
                    summary["other_distributions"] += amount
            
            summaries[investor_id] = summary
        
        return summaries
    
    def _validate_input(self, calculation_input: WaterfallCalculationInput) -> Dict[str, List[str]]:
        """Validate calculation input"""
        
        errors = []
        warnings = []
        
        # Validate basic data
        if calculation_input.total_distribution_amount <= 0:
            errors.append("Distribution amount must be positive")
        
        if not calculation_input.waterfall_tiers:
            errors.append("No waterfall tiers defined")
        
        if not calculation_input.investor_positions:
            errors.append("No investor positions provided")
        
        # Validate investor positions
        total_ownership = sum(pos.ownership_percentage for pos in calculation_input.investor_positions)
        if abs(total_ownership - 100) > Decimal('0.01'):  # Allow small rounding differences
            warnings.append(f"Total ownership is {total_ownership}%, not 100%")
        
        # Validate waterfall structure
        tier_types = [tier.tier_type for tier in calculation_input.waterfall_tiers]
        if WaterfallTier.RETURN_OF_CAPITAL not in tier_types:
            warnings.append("No return of capital tier defined")
        
        return {"errors": errors, "warnings": warnings}
    
    def _create_standard_waterfall_tiers(self) -> List[WaterfallTierDefinition]:
        """Create standard waterfall tier definitions"""
        
        return [
            WaterfallTierDefinition(
                tier_id="return_of_capital",
                tier_type=WaterfallTier.RETURN_OF_CAPITAL,
                name="Return of Capital",
                description="Return contributed capital to LPs",
                lp_percentage=Decimal('100'),
                gp_percentage=Decimal('0')
            ),
            WaterfallTierDefinition(
                tier_id="preferred_return",
                tier_type=WaterfallTier.PREFERRED_RETURN,
                name="Preferred Return",
                description="8% preferred return to LPs",
                hurdle_rate=Decimal('0.08'),
                lp_percentage=Decimal('100'),
                gp_percentage=Decimal('0')
            ),
            WaterfallTierDefinition(
                tier_id="catch_up",
                tier_type=WaterfallTier.CATCH_UP,
                name="GP Catch-Up",
                description="GP catch-up to 20% of total distributions",
                catch_up_rate=Decimal('0.20'),
                lp_percentage=Decimal('0'),
                gp_percentage=Decimal('100')
            ),
            WaterfallTierDefinition(
                tier_id="promoted_carry",
                tier_type=WaterfallTier.PROMOTED_CARRY,
                name="Promoted Carry",
                description="80/20 split of remaining proceeds",
                carry_rate=Decimal('0.20'),
                lp_percentage=Decimal('80'),
                gp_percentage=Decimal('20')
            )
        ]


# Singleton instance
waterfall_engine = WaterfallCalculationEngine()