"""
Example: Complex Fund Structure Setup and Investor Allocation

This example demonstrates how to:
1. Create a main fund with parallel and feeder structures
2. Set up investor eligibility rules
3. Allocate investors across the fund structure
4. Handle different investor types and jurisdictions
"""

import asyncio
from datetime import datetime
from typing import List, Dict, Any

from src.models import (
    FundStructure, FundStructureType, InvestorEligibility,
    AllocationStrategy, AllocationRequest, AllocationEngine,
    Investor, CreateFundStructureRequest
)


async def create_fund_structure_example():
    """Example of creating a complex fund structure"""
    
    # Initialize allocation engine
    engine = AllocationEngine()
    
    # 1. Create Main Fund (for US Qualified Purchasers)
    main_fund = FundStructure(
        fund_id="SGF-I-MAIN",
        fund_name="Strategic Growth Fund I",
        fund_type="private_equity",
        structure_type=FundStructureType.MAIN,
        fund_status="active",
        inception_date=datetime(2024, 1, 1),
        target_size=500_000_000,  # $500M
        min_commitment=5_000_000,  # $5M minimum
        max_commitment=50_000_000,  # $50M maximum
        max_investors=99,  # Regulatory limit
        eligible_investor_types=[
            InvestorEligibility.QUALIFIED_PURCHASER,
            InvestorEligibility.INSTITUTIONAL,
            InvestorEligibility.US_TAXABLE
        ],
        restricted_jurisdictions=["IRN", "PRK", "CUB"],  # Sanctioned countries
        management_fee_rate=0.02,  # 2%
        carry_rate=0.20,  # 20%
        allocation_strategy=AllocationStrategy.PRO_RATA,
        description="Main fund for qualified US investors",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    engine.add_fund(main_fund)
    print(f"✅ Created Main Fund: {main_fund.fund_name}")
    
    # 2. Create Parallel Fund (for US Tax-Exempt investors)
    parallel_fund = FundStructure(
        fund_id="SGF-I-PARALLEL",
        fund_name="Strategic Growth Fund I - Parallel",
        fund_type="private_equity",
        structure_type=FundStructureType.PARALLEL,
        fund_status="active",
        parent_fund_id="SGF-I-MAIN",
        inception_date=datetime(2024, 1, 1),
        target_size=200_000_000,  # $200M
        min_commitment=1_000_000,  # $1M minimum (lower for institutions)
        max_commitment=25_000_000,  # $25M maximum
        eligible_investor_types=[
            InvestorEligibility.US_TAX_EXEMPT,
            InvestorEligibility.ERISA_PLAN,
            InvestorEligibility.INSTITUTIONAL
        ],
        restricted_jurisdictions=["IRN", "PRK", "CUB"],
        management_fee_rate=0.02,  # Same as main
        carry_rate=0.20,  # Same as main
        allocation_strategy=AllocationStrategy.PRO_RATA,
        fee_sharing_arrangement={
            "main_fund_share": 0.6,
            "parallel_fund_share": 0.4
        },
        description="Parallel fund for US tax-exempt investors",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    engine.add_fund(parallel_fund)
    print(f"✅ Created Parallel Fund: {parallel_fund.fund_name}")
    
    # 3. Create Offshore Feeder Fund (for Non-US investors)
    feeder_fund = FundStructure(
        fund_id="SGF-I-FEEDER",
        fund_name="Strategic Growth Fund I - Cayman Feeder",
        fund_type="private_equity",
        structure_type=FundStructureType.FEEDER,
        fund_status="active",
        parent_fund_id="SGF-I-MAIN",
        master_fund_id="SGF-I-MAIN",
        inception_date=datetime(2024, 2, 1),
        target_size=150_000_000,  # $150M
        min_commitment=250_000,  # $250K minimum (accessible to smaller investors)
        max_commitment=10_000_000,  # $10M maximum
        eligible_investor_types=[
            InvestorEligibility.NON_US,
            InvestorEligibility.INSTITUTIONAL,
            InvestorEligibility.ACCREDITED_INVESTOR
        ],
        restricted_jurisdictions=["USA", "IRN", "PRK", "CUB"],  # Including USA
        management_fee_rate=0.025,  # 2.5% (higher due to additional costs)
        carry_rate=0.20,  # 20%
        allocation_strategy=AllocationStrategy.FIRST_COME_FIRST_SERVED,
        description="Offshore feeder for non-US investors",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    engine.add_fund(feeder_fund)
    print(f"✅ Created Feeder Fund: {feeder_fund.fund_name}")
    
    # 4. Create Blocker Fund (for tax-sensitive investors)
    blocker_fund = FundStructure(
        fund_id="SGF-I-BLOCKER",
        fund_name="Strategic Growth Fund I - Blocker",
        fund_type="private_equity",
        structure_type=FundStructureType.BLOCKER,
        fund_status="active",
        parent_fund_id="SGF-I-FEEDER",
        inception_date=datetime(2024, 2, 1),
        target_size=50_000_000,  # $50M
        min_commitment=1_000_000,  # $1M minimum
        eligible_investor_types=[
            InvestorEligibility.NON_US,
            InvestorEligibility.US_TAX_EXEMPT
        ],
        restricted_jurisdictions=["IRN", "PRK", "CUB"],
        management_fee_rate=0.03,  # 3% (higher due to corporate structure)
        carry_rate=0.20,  # 20%
        allocation_strategy=AllocationStrategy.PRO_RATA,
        description="Blocker corporation for UBTI-sensitive investors",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    engine.add_fund(blocker_fund)
    print(f"✅ Created Blocker Fund: {blocker_fund.fund_name}")
    
    return engine


async def demonstrate_investor_allocation(engine: AllocationEngine):
    """Demonstrate investor allocation across fund structures"""
    
    print("\n" + "="*60)
    print("INVESTOR ALLOCATION EXAMPLES")
    print("="*60)
    
    # Example 1: US Qualified Purchaser
    print("\n1️⃣ US Qualified Purchaser - High Net Worth Individual")
    investor1 = Investor(
        investor_id="INV-001",
        investor_name="John Smith Family Trust",
        investor_type="individual",
        jurisdiction="USA",
        kyc_status="approved"
    )
    engine.add_investor(investor1)
    
    request1 = AllocationRequest(
        investor_id="INV-001",
        fund_id="SGF-I-MAIN",
        requested_amount=25_000_000,  # $25M
        investor_type=InvestorEligibility.QUALIFIED_PURCHASER,
        jurisdiction="USA",
        preference_order=["SGF-I-MAIN"],
        accepts_side_letter=True,
        tax_transparent_required=True
    )
    
    result1 = engine.allocate_investor(request1)
    print(f"   Status: {result1.allocation_status}")
    print(f"   Allocated: ${result1.total_allocated:,.0f}")
    for alloc in result1.allocations:
        print(f"   - {alloc['fund_name']}: ${alloc['allocated_amount']:,.0f} ({alloc['percentage']:.1f}%)")
    
    # Example 2: US Pension Fund (ERISA)
    print("\n2️⃣ US Pension Fund - ERISA Plan")
    investor2 = Investor(
        investor_id="INV-002",
        investor_name="State Teachers Retirement System",
        investor_type="institutional",
        jurisdiction="USA",
        kyc_status="approved"
    )
    engine.add_investor(investor2)
    
    request2 = AllocationRequest(
        investor_id="INV-002",
        fund_id="SGF-I-PARALLEL",
        requested_amount=50_000_000,  # $50M
        investor_type=InvestorEligibility.ERISA_PLAN,
        jurisdiction="USA",
        preference_order=["SGF-I-PARALLEL", "SGF-I-MAIN"],
        erisa_percentage=15.0,  # This investor represents 15% ERISA
        tax_transparent_required=False
    )
    
    result2 = engine.allocate_investor(request2)
    print(f"   Status: {result2.allocation_status}")
    print(f"   Allocated: ${result2.total_allocated:,.0f}")
    for alloc in result2.allocations:
        print(f"   - {alloc['fund_name']}: ${alloc['allocated_amount']:,.0f} ({alloc['percentage']:.1f}%)")
    
    # Example 3: European Institutional Investor
    print("\n3️⃣ European Institution - Non-US")
    investor3 = Investor(
        investor_id="INV-003",
        investor_name="European Investment Bank",
        investor_type="institutional",
        jurisdiction="DEU",  # Germany
        kyc_status="approved"
    )
    engine.add_investor(investor3)
    
    request3 = AllocationRequest(
        investor_id="INV-003",
        fund_id="SGF-I-FEEDER",
        requested_amount=15_000_000,  # $15M
        investor_type=InvestorEligibility.NON_US,
        jurisdiction="DEU",
        preference_order=["SGF-I-FEEDER", "SGF-I-BLOCKER"]
    )
    
    result3 = engine.allocate_investor(request3)
    print(f"   Status: {result3.allocation_status}")
    print(f"   Allocated: ${result3.total_allocated:,.0f}")
    for alloc in result3.allocations:
        print(f"   - {alloc['fund_name']}: ${alloc['allocated_amount']:,.0f} ({alloc['percentage']:.1f}%)")
    
    # Example 4: Small Non-US Investor (Below Minimum)
    print("\n4️⃣ Small Non-US Investor - Below Minimum")
    investor4 = Investor(
        investor_id="INV-004",
        investor_name="Small Family Office",
        investor_type="individual",
        jurisdiction="CHE",  # Switzerland
        kyc_status="approved"
    )
    engine.add_investor(investor4)
    
    request4 = AllocationRequest(
        investor_id="INV-004",
        fund_id="SGF-I-FEEDER",
        requested_amount=100_000,  # $100K (below minimum)
        investor_type=InvestorEligibility.ACCREDITED_INVESTOR,
        jurisdiction="CHE"
    )
    
    result4 = engine.allocate_investor(request4)
    print(f"   Status: {result4.allocation_status}")
    if result4.rejection_reasons:
        print(f"   Rejection Reasons: {', '.join(result4.rejection_reasons)}")
    if result4.alternative_funds:
        print(f"   Alternatives suggested: {len(result4.alternative_funds)}")
        for alt in result4.alternative_funds:
            print(f"   - {alt['suggestion']}")
    
    # Example 5: Restricted Jurisdiction
    print("\n5️⃣ Restricted Jurisdiction - Cannot Invest")
    investor5 = Investor(
        investor_id="INV-005",
        investor_name="International Holdings",
        investor_type="institutional",
        jurisdiction="IRN",  # Iran (restricted)
        kyc_status="approved"
    )
    engine.add_investor(investor5)
    
    request5 = AllocationRequest(
        investor_id="INV-005",
        fund_id="SGF-I-MAIN",
        requested_amount=10_000_000,
        investor_type=InvestorEligibility.INSTITUTIONAL,
        jurisdiction="IRN"
    )
    
    result5 = engine.allocate_investor(request5)
    print(f"   Status: {result5.allocation_status}")
    if result5.rejection_reasons:
        print(f"   Rejection Reasons: {', '.join(result5.rejection_reasons)}")


async def show_fund_summary(engine: AllocationEngine):
    """Show summary of fund allocations"""
    
    print("\n" + "="*60)
    print("FUND ALLOCATION SUMMARY")
    print("="*60)
    
    report = engine.generate_allocation_report()
    
    for fund_detail in report['fund_details']:
        print(f"\n{fund_detail['fund_name']} ({fund_detail['structure_type'].upper()})")
        print(f"   Target Size: ${fund_detail['target_size']:,.0f}")
        print(f"   Committed: ${fund_detail['committed_capital']:,.0f}")
        print(f"   Subscription: {fund_detail['subscription_rate']:.1f}%")
        print(f"   Available: ${fund_detail['available_capacity']:,.0f}")
        print(f"   Investors: {fund_detail['investor_count']}")
        if fund_detail['max_investors']:
            print(f"   Max Investors: {fund_detail['max_investors']}")


async def main():
    """Run the complete example"""
    
    print("COMPLEX FUND STRUCTURE EXAMPLE")
    print("="*60)
    
    # Create fund structure
    engine = await create_fund_structure_example()
    
    # Demonstrate investor allocation
    await demonstrate_investor_allocation(engine)
    
    # Show summary
    await show_fund_summary(engine)
    
    print("\n✅ Example completed successfully!")


if __name__ == "__main__":
    asyncio.run(main())