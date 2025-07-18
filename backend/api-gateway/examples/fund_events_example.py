"""
Fund Events System Example

This example demonstrates how to use the fund events system to:
1. Create capital call notices
2. Process distributions 
3. Calculate management fees
4. Automatically calculate investor-specific amounts based on ownership
5. Handle event approvals and notifications
"""

import asyncio
from datetime import datetime, date, timedelta
from decimal import Decimal
from typing import List, Dict, Any

from src.models.fund_events import (
    CapitalCallEvent, DistributionEvent, ManagementFeeEvent,
    EventType, EventStatus, CalculationMethod
)
from src.services.event_processor import EventProcessingService
from src.models.investor import Investor


async def demonstrate_fund_events():
    """Complete demonstration of the fund events system"""
    
    print("🎯 FUND EVENTS SYSTEM DEMONSTRATION")
    print("="*60)
    
    # Initialize the event processor
    processor = EventProcessingService()
    
    # Set up mock investor data
    await setup_mock_investors(processor)
    
    # Demonstrate different types of fund events
    await demo_capital_call_event(processor)
    await demo_distribution_event(processor)
    await demo_management_fee_event(processor)
    await demo_event_workflow(processor)
    
    print("\n✅ Fund events demonstration completed!")


async def setup_mock_investors(processor: EventProcessingService):
    """Set up mock investor data for demonstrations"""
    
    print("\n📋 Setting up mock investors...")
    
    investors = [
        {
            "investor_id": "inv_001",
            "name": "Pension Fund Alpha",
            "type": "institutional",
            "commitment": Decimal('25000000.00'),  # $25M commitment
            "paid_in": Decimal('15000000.00'),     # $15M paid in
            "ownership": 25.0  # 25% ownership
        },
        {
            "investor_id": "inv_002", 
            "name": "University Endowment",
            "type": "institutional",
            "commitment": Decimal('40000000.00'),  # $40M commitment
            "paid_in": Decimal('24000000.00'),     # $24M paid in
            "ownership": 40.0  # 40% ownership
        },
        {
            "investor_id": "inv_003",
            "name": "Family Office Beta",
            "type": "individual",
            "commitment": Decimal('15000000.00'),  # $15M commitment
            "paid_in": Decimal('9000000.00'),      # $9M paid in
            "ownership": 15.0  # 15% ownership
        },
        {
            "investor_id": "inv_004",
            "name": "Sovereign Wealth Fund",
            "type": "institutional", 
            "commitment": Decimal('20000000.00'),  # $20M commitment
            "paid_in": Decimal('12000000.00'),     # $12M paid in
            "ownership": 20.0  # 20% ownership
        }
    ]
    
    for inv in investors:
        print(f"   • {inv['name']}: ${inv['commitment']:,.0f} committed, {inv['ownership']}% ownership")
    
    print(f"   📊 Total Fund Size: ${sum(inv['commitment'] for inv in investors):,.0f}")


async def demo_capital_call_event(processor: EventProcessingService):
    """Demonstrate capital call event processing"""
    
    print("\n" + "="*60)
    print("💰 CAPITAL CALL EVENT DEMONSTRATION")
    print("="*60)
    
    # Create a capital call event
    print("\n1️⃣ Creating Capital Call Event...")
    
    capital_call_data = {
        "fund_id": "fund_001",
        "event_type": EventType.CAPITAL_CALL,
        "event_name": "Capital Call #3",
        "event_date": date.today(),
        "effective_date": date.today() + timedelta(days=1),
        "record_date": date.today(),
        "total_amount": Decimal('10000000.00'),  # $10M total call
        "call_number": 3,
        "due_date": date.today() + timedelta(days=30),
        "call_purpose": "Investment in Portfolio Company XYZ",
        
        # Breakdown of the call
        "investment_amount": Decimal('8000000.00'),      # $8M for investment
        "management_fee_amount": Decimal('1500000.00'),  # $1.5M for management fees
        "expense_amount": Decimal('500000.00'),          # $500K for expenses
        "organizational_expense_amount": Decimal('0.00'),
        
        "call_percentage": Decimal('10.0'),  # 10% of commitments
        "minimum_call_amount": Decimal('50000.00'),  # $50K minimum
        "allow_partial_funding": True
    }
    
    event = await processor.create_event(capital_call_data, "admin_001")
    print(f"   ✅ Created: {event.event_name}")
    print(f"   📅 Due Date: {event.due_date}")
    print(f"   💵 Total Amount: ${event.total_amount:,.0f}")
    print(f"   🎯 Purpose: {event.call_purpose}")
    
    # Process the event to calculate investor amounts
    print("\n2️⃣ Processing Capital Call...")
    
    result = await processor.process_event(event, auto_approve=False, send_notifications=False)
    
    print(f"   📊 Processing Status: {result.processing_status}")
    print(f"   👥 Investors Processed: {result.total_investors_processed}")
    print(f"   💰 Total Called: ${result.total_gross_amount:,.0f}")
    
    print("\n   📋 Individual Investor Calculations:")
    for calc in result.investor_calculations:
        print(f"   • Investor {calc.investor_id}:")
        print(f"     - Ownership: {calc.ownership_percentage:.1f}%")
        print(f"     - Total Call: ${calc.gross_amount:,.0f}")
        print(f"     - Investment: ${calc.investment_portion:,.0f}")
        print(f"     - Mgmt Fee: ${calc.management_fee_portion:,.0f}")
        print(f"     - Expenses: ${calc.expense_portion:,.0f}")
    
    # Show approval workflow
    print("\n3️⃣ Approving Capital Call...")
    await processor.approve_event(event.event_id, "manager_001", "Approved for portfolio investment")
    print("   ✅ Capital call approved and ready for funding")


async def demo_distribution_event(processor: EventProcessingService):
    """Demonstrate distribution event processing"""
    
    print("\n" + "="*60)
    print("💸 DISTRIBUTION EVENT DEMONSTRATION")
    print("="*60)
    
    # Create a distribution event
    print("\n1️⃣ Creating Distribution Event...")
    
    distribution_data = {
        "fund_id": "fund_001",
        "event_type": EventType.DISTRIBUTION,
        "event_name": "Q2 2024 Distribution",
        "event_date": date.today(),
        "effective_date": date.today(),
        "record_date": date.today() - timedelta(days=5),  # Record date 5 days ago
        "total_amount": Decimal('7500000.00'),  # Net amount after offsets
        
        "distribution_number": 2,
        "payment_date": date.today() + timedelta(days=10),
        "distribution_type": "return_of_capital",
        "source_description": "Exit from Portfolio Company ABC",
        "tax_year": 2024,
        "withholding_required": True,
        "default_withholding_rate": Decimal('0.30'),  # 30% default withholding
        
        # Distribution amounts
        "gross_distribution": Decimal('8500000.00'),  # $8.5M gross
        "management_fee_offset": Decimal('750000.00'), # $750K fee offset
        "expense_offset": Decimal('250000.00')         # $250K expense offset
    }
    
    event = await processor.create_event(distribution_data, "admin_001")
    print(f"   ✅ Created: {event.event_name}")
    print(f"   💰 Gross Distribution: ${event.gross_distribution:,.0f}")
    print(f"   💳 Net Distribution: ${event.total_amount:,.0f}")
    print(f"   📅 Payment Date: {event.payment_date}")
    print(f"   🏢 Source: {event.source_description}")
    
    # Process the distribution
    print("\n2️⃣ Processing Distribution...")
    
    result = await processor.process_event(event, auto_approve=True, send_notifications=False)
    
    print(f"   📊 Processing Status: {result.processing_status}")
    print(f"   👥 Investors Processed: {result.total_investors_processed}")
    print(f"   💰 Total Distributed: ${result.total_net_amount:,.0f}")
    print(f"   🏛️ Total Withholding: ${result.total_withholding:,.0f}")
    
    print("\n   📋 Individual Investor Distributions:")
    for calc in result.investor_calculations:
        print(f"   • Investor {calc.investor_id}:")
        print(f"     - Ownership: {calc.ownership_percentage:.1f}%")
        print(f"     - Gross: ${calc.gross_amount:,.0f}")
        print(f"     - Mgmt Fee Offset: ${calc.management_fee_offset:,.0f}")
        print(f"     - Expense Offset: ${calc.expense_offset:,.0f}")
        print(f"     - Withholding: ${calc.withholding_amount:,.0f}")
        print(f"     - Net Payment: ${calc.net_amount:,.0f}")


async def demo_management_fee_event(processor: EventProcessingService):
    """Demonstrate management fee calculation"""
    
    print("\n" + "="*60)
    print("💼 MANAGEMENT FEE EVENT DEMONSTRATION")
    print("="*60)
    
    # Create a management fee event
    print("\n1️⃣ Creating Management Fee Event...")
    
    today = date.today()
    quarter_start = date(today.year, ((today.month - 1) // 3) * 3 + 1, 1)
    if quarter_start.month == 1:
        quarter_end = date(quarter_start.year, 3, 31)
    elif quarter_start.month == 4:
        quarter_end = date(quarter_start.year, 6, 30)
    elif quarter_start.month == 7:
        quarter_end = date(quarter_start.year, 9, 30)
    else:
        quarter_end = date(quarter_start.year, 12, 31)
    
    days_in_quarter = (quarter_end - quarter_start).days + 1
    
    mgmt_fee_data = {
        "fund_id": "fund_001",
        "event_type": EventType.MANAGEMENT_FEE,
        "event_name": f"Q2 2024 Management Fee",
        "event_date": quarter_end,
        "effective_date": quarter_end,
        "record_date": quarter_end,
        "total_amount": Decimal('500000.00'),  # Will be recalculated
        
        "fee_period_start": quarter_start,
        "fee_period_end": quarter_end,
        "fee_rate": Decimal('0.02'),  # 2% annual
        "fee_basis": "commitment",
        "calculation_frequency": "quarterly",
        "prorate_for_period": True,
        "days_in_period": days_in_quarter,
        "payment_method": "offset"  # Offset against future distributions
    }
    
    event = await processor.create_event(mgmt_fee_data, "admin_001")
    print(f"   ✅ Created: {event.event_name}")
    print(f"   📅 Period: {event.fee_period_start} to {event.fee_period_end}")
    print(f"   📊 Annual Rate: {event.fee_rate * 100:.1f}%")
    print(f"   🗓️ Days in Period: {event.days_in_period}")
    print(f"   💳 Payment Method: {event.payment_method}")
    
    # Process the management fee
    print("\n2️⃣ Calculating Management Fees...")
    
    result = await processor.process_event(event, auto_approve=True, send_notifications=False)
    
    print(f"   📊 Processing Status: {result.processing_status}")
    print(f"   👥 Investors Processed: {result.total_investors_processed}")
    print(f"   💰 Total Fees: ${result.total_gross_amount:,.0f}")
    
    print("\n   📋 Individual Investor Fees:")
    for calc in result.investor_calculations:
        print(f"   • Investor {calc.investor_id}:")
        print(f"     - Commitment Base: ${calc.calculation_basis_amount:,.0f}")
        print(f"     - Ownership: {calc.ownership_percentage:.1f}%")
        print(f"     - Quarterly Fee: ${calc.gross_amount:,.0f}")
        
        # Calculate annual fee for reference
        annual_fee = calc.gross_amount * 4  # Approximate
        print(f"     - Annual Fee (est): ${annual_fee:,.0f}")


async def demo_event_workflow(processor: EventProcessingService):
    """Demonstrate complete event workflow including approvals and history"""
    
    print("\n" + "="*60)
    print("🔄 EVENT WORKFLOW DEMONSTRATION")
    print("="*60)
    
    # Create an event
    print("\n1️⃣ Creating Event in Draft Status...")
    
    event_data = {
        "fund_id": "fund_001",
        "event_type": EventType.CAPITAL_CALL,
        "event_name": "Capital Call #4 - Bridge Financing",
        "event_date": date.today() + timedelta(days=7),
        "effective_date": date.today() + timedelta(days=10),
        "record_date": date.today(),
        "total_amount": Decimal('5000000.00'),
        "call_number": 4,
        "due_date": date.today() + timedelta(days=40),
        "call_purpose": "Bridge financing for new acquisition",
        "investment_amount": Decimal('4500000.00'),
        "management_fee_amount": Decimal('400000.00'),
        "expense_amount": Decimal('100000.00'),
        "organizational_expense_amount": Decimal('0.00')
    }
    
    event = await processor.create_event(event_data, "analyst_001")
    print(f"   ✅ Event created: {event.event_id}")
    print(f"   📊 Status: {event.status}")
    print(f"   👤 Created by: {event.created_by}")
    
    # Show event history
    print("\n2️⃣ Checking Event History...")
    history = await processor.get_event_history(event.event_id)
    
    for entry in history[-3:]:  # Show last 3 entries
        print(f"   📝 {entry['timestamp'].strftime('%Y-%m-%d %H:%M')} - {entry['action']} by {entry['user_id']}")
    
    # Process event
    print("\n3️⃣ Processing Event...")
    result = await processor.process_event(event, auto_approve=False, send_notifications=False)
    print(f"   ⚙️ Processing completed: {result.processing_status}")
    
    # Approve event
    print("\n4️⃣ Approving Event...")
    await processor.approve_event(event.event_id, "manager_002", "Approved for bridge financing")
    print("   ✅ Event approved")
    
    # Show updated history
    print("\n5️⃣ Updated Event History...")
    history = await processor.get_event_history(event.event_id)
    
    for entry in history[-5:]:  # Show last 5 entries
        print(f"   📝 {entry['timestamp'].strftime('%Y-%m-%d %H:%M')} - {entry['action']} by {entry['user_id']}")
        if entry.get('metadata'):
            for key, value in entry['metadata'].items():
                print(f"      └─ {key}: {value}")
    
    # Demonstrate cancellation
    print("\n6️⃣ Demonstrating Event Cancellation...")
    
    # Create another event to cancel
    cancel_event_data = event_data.copy()
    cancel_event_data["event_name"] = "Capital Call #5 - To Be Cancelled"
    cancel_event_data["call_number"] = 5
    
    cancel_event = await processor.create_event(cancel_event_data, "analyst_001")
    print(f"   📝 Created event to cancel: {cancel_event.event_id}")
    
    # Cancel the event
    await processor.cancel_event(
        cancel_event.event_id, 
        "manager_002", 
        "Market conditions unfavorable"
    )
    print("   ❌ Event cancelled")
    
    # Show investor summary
    print("\n7️⃣ Investor Event Summary...")
    summary = await processor.get_investor_event_summary("inv_001", "fund_001")
    
    print(f"   👤 Investor: {summary['investor_id']}")
    print(f"   📊 Summary:")
    print(f"      • Capital Calls: {summary['summary']['total_capital_calls']}")
    print(f"      • Called Amount: ${summary['summary']['total_called_amount']:,.0f}")
    print(f"      • Distributions: {summary['summary']['total_distributions']}")
    print(f"      • Distributed: ${summary['summary']['total_distributed_amount']:,.0f}")
    print(f"      • Management Fees: {summary['summary']['total_management_fees']}")
    print(f"      • Fee Amount: ${summary['summary']['total_fee_amount']:,.0f}")
    print(f"      • Net Investment: ${summary['summary']['net_investment']:,.0f}")


async def main():
    """Run the complete fund events demonstration"""
    await demonstrate_fund_events()


if __name__ == "__main__":
    asyncio.run(main())