from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
from dataclasses import dataclass
from enum import Enum

from .fund_structure import (
    FundStructure, FundStructureType, InvestorEligibility,
    AllocationStrategy, AllocationRequest, AllocationResult,
    InvestorAllocation
)
from .investor import Investor


class AllocationError(Exception):
    """Custom exception for allocation errors"""
    pass


@dataclass
class AllocationConstraint:
    """Defines constraints for allocation"""
    constraint_type: str  # 'min_amount', 'max_amount', 'investor_limit', etc.
    value: Any
    fund_id: Optional[str] = None
    applies_to: Optional[List[InvestorEligibility]] = None


@dataclass
class AllocationScore:
    """Scoring for fund-investor matching"""
    fund_id: str
    score: float
    factors: Dict[str, float]  # Individual scoring factors
    eligible: bool
    rejection_reasons: List[str] = None


class AllocationEngine:
    """
    Sophisticated engine for allocating investors across complex fund structures.
    Handles hierarchical funds, eligibility rules, and capacity constraints.
    """
    
    def __init__(self):
        self.funds: Dict[str, FundStructure] = {}
        self.investors: Dict[str, Investor] = {}
        self.allocations: List[InvestorAllocation] = []
        self.constraints: List[AllocationConstraint] = []
    
    def add_fund(self, fund: FundStructure) -> None:
        """Add a fund to the allocation engine"""
        self.funds[fund.fund_id] = fund
    
    def add_investor(self, investor: Investor) -> None:
        """Add an investor to the allocation engine"""
        self.investors[investor.investor_id] = investor
    
    def add_constraint(self, constraint: AllocationConstraint) -> None:
        """Add an allocation constraint"""
        self.constraints.append(constraint)
    
    def allocate_investor(self, request: AllocationRequest) -> AllocationResult:
        """
        Main allocation method that processes investor requests
        and allocates across appropriate fund structures
        """
        # Validate investor exists
        if request.investor_id not in self.investors:
            raise AllocationError(f"Investor {request.investor_id} not found")
        
        investor = self.investors[request.investor_id]
        
        # Score all funds for this investor
        fund_scores = self._score_funds_for_investor(investor, request)
        
        # Filter eligible funds
        eligible_funds = [fs for fs in fund_scores if fs.eligible]
        
        if not eligible_funds:
            return self._create_rejection_result(request, fund_scores)
        
        # Sort by score and preference
        sorted_funds = self._sort_funds_by_preference(eligible_funds, request.preference_order)
        
        # Perform allocation
        allocations = self._allocate_to_funds(request, sorted_funds)
        
        # Create and return result
        return self._create_allocation_result(request, allocations, fund_scores)
    
    def _score_funds_for_investor(
        self, 
        investor: Investor, 
        request: AllocationRequest
    ) -> List[AllocationScore]:
        """Score each fund based on investor eligibility and preferences"""
        scores = []
        
        for fund_id, fund in self.funds.items():
            score = AllocationScore(
                fund_id=fund_id,
                score=0.0,
                factors={},
                eligible=True,
                rejection_reasons=[]
            )
            
            # Check eligibility
            eligibility_check = self._check_eligibility(investor, fund, request)
            if not eligibility_check[0]:
                score.eligible = False
                score.rejection_reasons = eligibility_check[1]
                scores.append(score)
                continue
            
            # Calculate scoring factors
            factors = self._calculate_scoring_factors(investor, fund, request)
            score.factors = factors
            score.score = sum(factors.values())
            
            scores.append(score)
        
        return scores
    
    def _check_eligibility(
        self, 
        investor: Investor, 
        fund: FundStructure, 
        request: AllocationRequest
    ) -> Tuple[bool, List[str]]:
        """Check if investor is eligible for a fund"""
        rejection_reasons = []
        
        # Check investor type eligibility
        if (fund.eligible_investor_types and 
            request.investor_type not in fund.eligible_investor_types):
            rejection_reasons.append(
                f"Investor type {request.investor_type} not eligible for fund"
            )
        
        # Check jurisdiction restrictions
        if request.jurisdiction in fund.restricted_jurisdictions:
            rejection_reasons.append(
                f"Jurisdiction {request.jurisdiction} is restricted"
            )
        
        # Check minimum commitment
        if request.requested_amount < fund.min_commitment:
            rejection_reasons.append(
                f"Requested amount below minimum commitment of {fund.min_commitment}"
            )
        
        # Check maximum commitment
        if fund.max_commitment and request.requested_amount > fund.max_commitment:
            rejection_reasons.append(
                f"Requested amount exceeds maximum commitment of {fund.max_commitment}"
            )
        
        # Check fund capacity
        available_capacity = fund.target_size - fund.committed_capital
        if available_capacity <= 0:
            rejection_reasons.append("Fund is fully subscribed")
        
        # Check investor limit
        if fund.max_investors:
            current_investors = self._count_fund_investors(fund.fund_id)
            if current_investors >= fund.max_investors:
                rejection_reasons.append(
                    f"Fund has reached maximum investor limit of {fund.max_investors}"
                )
        
        # Check ERISA limits for US funds
        if request.erisa_percentage and fund.structure_type == FundStructureType.MAIN:
            if self._check_erisa_limit_exceeded(fund, request.erisa_percentage):
                rejection_reasons.append("Would exceed 25% ERISA limit")
        
        # Check tax transparency requirements
        if request.tax_transparent_required:
            if fund.structure_type not in [FundStructureType.MAIN, FundStructureType.PARALLEL]:
                rejection_reasons.append("Fund structure is not tax transparent")
        
        return len(rejection_reasons) == 0, rejection_reasons
    
    def _calculate_scoring_factors(
        self, 
        investor: Investor, 
        fund: FundStructure, 
        request: AllocationRequest
    ) -> Dict[str, float]:
        """Calculate scoring factors for fund-investor match"""
        factors = {}
        
        # Structure type preference
        structure_scores = {
            FundStructureType.MAIN: 1.0,
            FundStructureType.PARALLEL: 0.9,
            FundStructureType.FEEDER: 0.8,
            FundStructureType.MASTER: 0.7,
            FundStructureType.BLOCKER: 0.6,
            FundStructureType.AGGREGATOR: 0.5
        }
        factors['structure_preference'] = structure_scores.get(fund.structure_type, 0.5)
        
        # Capacity availability (higher score for funds with more room)
        available_capacity = fund.target_size - fund.committed_capital
        capacity_ratio = available_capacity / fund.target_size if fund.target_size > 0 else 0
        factors['capacity_score'] = capacity_ratio * 0.5
        
        # Investor type match
        if request.investor_type in fund.eligible_investor_types:
            factors['investor_type_match'] = 0.3
        else:
            factors['investor_type_match'] = 0.0
        
        # Fee advantage (lower fees = higher score)
        fee_score = 1.0 - (fund.management_fee_rate + fund.carry_rate)
        factors['fee_advantage'] = fee_score * 0.2
        
        # Existing investor advantage (if investor already in sibling funds)
        if self._investor_in_related_funds(investor.investor_id, fund):
            factors['relationship_bonus'] = 0.2
        else:
            factors['relationship_bonus'] = 0.0
        
        return factors
    
    def _sort_funds_by_preference(
        self, 
        eligible_funds: List[AllocationScore], 
        preference_order: List[str]
    ) -> List[AllocationScore]:
        """Sort funds by score and investor preferences"""
        # Create preference index
        preference_index = {fund_id: i for i, fund_id in enumerate(preference_order)}
        
        def sort_key(score: AllocationScore):
            # First by preference (if specified), then by score
            pref_value = preference_index.get(score.fund_id, len(preference_order))
            return (pref_value, -score.score)
        
        return sorted(eligible_funds, key=sort_key)
    
    def _allocate_to_funds(
        self, 
        request: AllocationRequest, 
        sorted_funds: List[AllocationScore]
    ) -> List[Dict[str, Any]]:
        """Perform actual allocation across funds"""
        allocations = []
        remaining_amount = request.requested_amount
        
        for fund_score in sorted_funds:
            if remaining_amount <= 0:
                break
            
            fund = self.funds[fund_score.fund_id]
            
            # Calculate allocation amount
            available_capacity = fund.target_size - fund.committed_capital
            allocation_amount = min(remaining_amount, available_capacity)
            
            # Apply fund-specific constraints
            if fund.max_commitment:
                allocation_amount = min(allocation_amount, fund.max_commitment)
            
            # Apply allocation strategy
            if fund.allocation_strategy == AllocationStrategy.PRO_RATA:
                # Pro-rata might reduce allocation if oversubscribed
                allocation_amount = self._apply_pro_rata(fund, allocation_amount)
            
            if allocation_amount > 0:
                allocations.append({
                    'fund_id': fund.fund_id,
                    'fund_name': fund.fund_name,
                    'structure_type': fund.structure_type,
                    'allocated_amount': allocation_amount,
                    'percentage': (allocation_amount / request.requested_amount) * 100
                })
                
                remaining_amount -= allocation_amount
                
                # Update fund committed capital (in real implementation, this would be a transaction)
                fund.committed_capital += allocation_amount
        
        return allocations
    
    def _apply_pro_rata(self, fund: FundStructure, requested_amount: float) -> float:
        """Apply pro-rata allocation if fund is oversubscribed"""
        total_demand = self._calculate_total_demand(fund.fund_id)
        available_capacity = fund.target_size - fund.committed_capital
        
        if total_demand > available_capacity:
            # Pro-rata reduction
            ratio = available_capacity / total_demand
            return requested_amount * ratio
        
        return requested_amount
    
    def _create_allocation_result(
        self, 
        request: AllocationRequest, 
        allocations: List[Dict[str, Any]], 
        all_scores: List[AllocationScore]
    ) -> AllocationResult:
        """Create the final allocation result"""
        total_allocated = sum(a['allocated_amount'] for a in allocations)
        
        status = 'full' if total_allocated >= request.requested_amount else 'partial'
        if total_allocated == 0:
            status = 'rejected'
        
        # Find alternative funds if not fully allocated
        alternatives = []
        if status in ['partial', 'rejected']:
            alternatives = self._find_alternative_funds(request, all_scores)
        
        return AllocationResult(
            request_id=f"req_{datetime.utcnow().timestamp()}",
            investor_id=request.investor_id,
            total_requested=request.requested_amount,
            total_allocated=total_allocated,
            allocation_status=status,
            allocations=allocations,
            rejection_reasons=[],
            alternative_funds=alternatives
        )
    
    def _create_rejection_result(
        self, 
        request: AllocationRequest, 
        all_scores: List[AllocationScore]
    ) -> AllocationResult:
        """Create rejection result with reasons"""
        # Compile all rejection reasons
        all_reasons = []
        for score in all_scores:
            if score.rejection_reasons:
                all_reasons.extend(score.rejection_reasons)
        
        # Remove duplicates
        unique_reasons = list(set(all_reasons))
        
        return AllocationResult(
            request_id=f"req_{datetime.utcnow().timestamp()}",
            investor_id=request.investor_id,
            total_requested=request.requested_amount,
            total_allocated=0,
            allocation_status='rejected',
            allocations=[],
            rejection_reasons=unique_reasons,
            alternative_funds=self._find_alternative_funds(request, all_scores)
        )
    
    def _find_alternative_funds(
        self, 
        request: AllocationRequest, 
        all_scores: List[AllocationScore]
    ) -> List[Dict[str, Any]]:
        """Find alternative funds that might work with modifications"""
        alternatives = []
        
        for score in all_scores:
            if not score.eligible:
                fund = self.funds[score.fund_id]
                
                # Check if only minimum commitment is the issue
                if any("minimum commitment" in reason for reason in score.rejection_reasons):
                    alternatives.append({
                        'fund_id': fund.fund_id,
                        'fund_name': fund.fund_name,
                        'suggestion': f"Increase commitment to {fund.min_commitment}",
                        'min_commitment': fund.min_commitment
                    })
        
        return alternatives[:3]  # Return top 3 alternatives
    
    def _count_fund_investors(self, fund_id: str) -> int:
        """Count current investors in a fund"""
        return len([a for a in self.allocations if a.fund_id == fund_id])
    
    def _check_erisa_limit_exceeded(
        self, 
        fund: FundStructure, 
        new_erisa_percentage: float
    ) -> bool:
        """Check if adding investor would exceed 25% ERISA limit"""
        # This would need actual implementation with database
        current_erisa_percentage = 0.0  # Placeholder
        return (current_erisa_percentage + new_erisa_percentage) > 25.0
    
    def _investor_in_related_funds(self, investor_id: str, fund: FundStructure) -> bool:
        """Check if investor is in related funds"""
        related_fund_ids = fund.sibling_funds + fund.child_funds
        if fund.parent_fund_id:
            related_fund_ids.append(fund.parent_fund_id)
        
        for allocation in self.allocations:
            if (allocation.investor_id == investor_id and 
                allocation.fund_id in related_fund_ids):
                return True
        
        return False
    
    def _calculate_total_demand(self, fund_id: str) -> float:
        """Calculate total demand for a fund (for pro-rata calculations)"""
        # In real implementation, this would sum all pending allocations
        return 0.0  # Placeholder
    
    def generate_allocation_report(self, fund_id: Optional[str] = None) -> Dict[str, Any]:
        """Generate comprehensive allocation report"""
        report = {
            'timestamp': datetime.utcnow(),
            'total_funds': len(self.funds),
            'total_investors': len(self.investors),
            'total_allocations': len(self.allocations),
            'fund_details': []
        }
        
        funds_to_report = [self.funds[fund_id]] if fund_id else self.funds.values()
        
        for fund in funds_to_report:
            fund_allocations = [a for a in self.allocations if a.fund_id == fund.fund_id]
            
            fund_detail = {
                'fund_id': fund.fund_id,
                'fund_name': fund.fund_name,
                'structure_type': fund.structure_type,
                'target_size': fund.target_size,
                'committed_capital': fund.committed_capital,
                'subscription_rate': (fund.committed_capital / fund.target_size * 100) 
                                   if fund.target_size > 0 else 0,
                'investor_count': len(fund_allocations),
                'max_investors': fund.max_investors,
                'available_capacity': fund.target_size - fund.committed_capital
            }
            
            report['fund_details'].append(fund_detail)
        
        return report