from fastapi import APIRouter, Depends, HTTPException, Query, Path, BackgroundTasks
from typing import List, Optional
from datetime import date, datetime
from decimal import Decimal

from ..models.fund_events import (
    FundEvent, EventType, EventStatus, CapitalCallEvent, DistributionEvent,
    ManagementFeeEvent, CreateEventRequest, ProcessEventRequest, 
    EventApprovalRequest, EventProcessingResult, InvestorEventCalculation
)
from ..services.event_processor import event_processor
from ..middleware.auth import get_current_user
from ..utils.logger import get_logger

router = APIRouter(prefix="/api/fund-events", tags=["fund-events"])
logger = get_logger(__name__)


@router.post("/capital-calls", response_model=CapitalCallEvent)
async def create_capital_call(
    fund_id: str,
    call_number: int,
    event_date: date,
    effective_date: date,
    record_date: date,
    due_date: date,
    call_purpose: str,
    total_amount: Decimal,
    investment_amount: Decimal = 0,
    management_fee_amount: Decimal = 0,
    expense_amount: Decimal = 0,
    organizational_expense_amount: Decimal = 0,
    call_percentage: Optional[Decimal] = None,
    minimum_call_amount: Optional[Decimal] = None,
    allow_partial_funding: bool = True,
    current_user: dict = Depends(get_current_user)
):
    """Create a new capital call event"""
    try:
        event_data = {
            "fund_id": fund_id,
            "event_type": EventType.CAPITAL_CALL,
            "event_name": f"Capital Call #{call_number}",
            "event_date": event_date,
            "effective_date": effective_date,
            "record_date": record_date,
            "total_amount": total_amount,
            "call_number": call_number,
            "due_date": due_date,
            "call_purpose": call_purpose,
            "investment_amount": investment_amount,
            "management_fee_amount": management_fee_amount,
            "expense_amount": expense_amount,
            "organizational_expense_amount": organizational_expense_amount,
            "call_percentage": call_percentage,
            "minimum_call_amount": minimum_call_amount,
            "allow_partial_funding": allow_partial_funding
        }
        
        event = await event_processor.create_event(event_data, current_user["user_id"])
        
        logger.info(f"Capital call created: {event.event_id}")
        return event
        
    except Exception as e:
        logger.error(f"Error creating capital call: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/distributions", response_model=DistributionEvent)
async def create_distribution(
    fund_id: str,
    distribution_number: int,
    event_date: date,
    effective_date: date,
    record_date: date,
    payment_date: date,
    gross_distribution: Decimal,
    distribution_type: str = "return_of_capital",
    source_description: str = "",
    tax_year: int = datetime.now().year,
    withholding_required: bool = False,
    default_withholding_rate: Decimal = 0,
    management_fee_offset: Decimal = 0,
    expense_offset: Decimal = 0,
    current_user: dict = Depends(get_current_user)
):
    """Create a new distribution event"""
    try:
        total_amount = gross_distribution - management_fee_offset - expense_offset
        
        event_data = {
            "fund_id": fund_id,
            "event_type": EventType.DISTRIBUTION,
            "event_name": f"Distribution #{distribution_number}",
            "event_date": event_date,
            "effective_date": effective_date,
            "record_date": record_date,
            "total_amount": total_amount,
            "distribution_number": distribution_number,
            "payment_date": payment_date,
            "distribution_type": distribution_type,
            "source_description": source_description,
            "tax_year": tax_year,
            "withholding_required": withholding_required,
            "default_withholding_rate": default_withholding_rate,
            "gross_distribution": gross_distribution,
            "management_fee_offset": management_fee_offset,
            "expense_offset": expense_offset
        }
        
        event = await event_processor.create_event(event_data, current_user["user_id"])
        
        logger.info(f"Distribution created: {event.event_id}")
        return event
        
    except Exception as e:
        logger.error(f"Error creating distribution: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/management-fees", response_model=ManagementFeeEvent)
async def create_management_fee(
    fund_id: str,
    fee_period_start: date,
    fee_period_end: date,
    event_date: date,
    effective_date: date,
    record_date: date,
    fee_rate: Decimal,
    fee_basis: str = "commitment",
    calculation_frequency: str = "quarterly",
    payment_method: str = "offset",
    payment_due_date: Optional[date] = None,
    prorate_for_period: bool = True,
    current_user: dict = Depends(get_current_user)
):
    """Create a new management fee event"""
    try:
        # Calculate days in period
        days_in_period = (fee_period_end - fee_period_start).days + 1
        
        # This would typically calculate based on fund NAV or commitments
        # For now, using a placeholder amount
        total_amount = Decimal('100000.00')  # Placeholder
        
        event_data = {
            "fund_id": fund_id,
            "event_type": EventType.MANAGEMENT_FEE,
            "event_name": f"Management Fee - {fee_period_start} to {fee_period_end}",
            "event_date": event_date,
            "effective_date": effective_date,
            "record_date": record_date,
            "total_amount": total_amount,
            "fee_period_start": fee_period_start,
            "fee_period_end": fee_period_end,
            "fee_rate": fee_rate,
            "fee_basis": fee_basis,
            "calculation_frequency": calculation_frequency,
            "prorate_for_period": prorate_for_period,
            "days_in_period": days_in_period,
            "payment_method": payment_method,
            "payment_due_date": payment_due_date
        }
        
        event = await event_processor.create_event(event_data, current_user["user_id"])
        
        logger.info(f"Management fee created: {event.event_id}")
        return event
        
    except Exception as e:
        logger.error(f"Error creating management fee: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{event_id}/process", response_model=EventProcessingResult)
async def process_event(
    event_id: str = Path(..., description="Event ID to process"),
    auto_approve: bool = Query(False, description="Auto-approve the event"),
    send_notifications: bool = Query(True, description="Send investor notifications"),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    current_user: dict = Depends(get_current_user)
):
    """Process an event and calculate investor amounts"""
    try:
        # Mock event retrieval - in real implementation, get from database
        mock_event = CapitalCallEvent(
            event_id=event_id,
            fund_id="fund_001",
            event_type=EventType.CAPITAL_CALL,
            event_name="Capital Call #1",
            event_date=date.today(),
            effective_date=date.today(),
            record_date=date.today(),
            total_amount=Decimal('5000000.00'),
            call_number=1,
            due_date=date(2024, 8, 15),
            call_purpose="Investment in Portfolio Company A",
            investment_amount=Decimal('4000000.00'),
            management_fee_amount=Decimal('800000.00'),
            expense_amount=Decimal('200000.00'),
            created_by=current_user["user_id"]
        )
        
        # Process the event
        if send_notifications:
            # Use background task for processing to avoid timeout
            background_tasks.add_task(
                event_processor.process_event,
                mock_event,
                auto_approve,
                send_notifications
            )
            
            # Return immediate response
            return EventProcessingResult(
                event_id=event_id,
                processing_id=f"proc_{datetime.utcnow().timestamp()}",
                total_investors_processed=0,
                total_gross_amount=Decimal('0'),
                total_net_amount=Decimal('0'),
                total_withholding=Decimal('0'),
                investor_calculations=[],
                processing_status="processing"
            )
        else:
            result = await event_processor.process_event(
                mock_event, auto_approve, send_notifications
            )
            
            logger.info(f"Event {event_id} processed successfully")
            return result
        
    except Exception as e:
        logger.error(f"Error processing event {event_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{event_id}/approve")
async def approve_event(
    event_id: str = Path(..., description="Event ID to approve"),
    approval_notes: Optional[str] = Query(None, description="Approval notes"),
    current_user: dict = Depends(get_current_user)
):
    """Approve a fund event"""
    try:
        success = await event_processor.approve_event(
            event_id, current_user["user_id"], approval_notes
        )
        
        if success:
            return {"message": f"Event {event_id} approved successfully"}
        else:
            raise HTTPException(status_code=400, detail="Failed to approve event")
        
    except Exception as e:
        logger.error(f"Error approving event {event_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{event_id}/cancel")
async def cancel_event(
    event_id: str = Path(..., description="Event ID to cancel"),
    cancellation_reason: str = Query(..., description="Reason for cancellation"),
    current_user: dict = Depends(get_current_user)
):
    """Cancel a fund event"""
    try:
        success = await event_processor.cancel_event(
            event_id, current_user["user_id"], cancellation_reason
        )
        
        if success:
            return {"message": f"Event {event_id} cancelled successfully"}
        else:
            raise HTTPException(status_code=400, detail="Failed to cancel event")
        
    except Exception as e:
        logger.error(f"Error cancelling event {event_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{event_id}/reverse")
async def reverse_event(
    event_id: str = Path(..., description="Event ID to reverse"),
    reversal_reason: str = Query(..., description="Reason for reversal"),
    current_user: dict = Depends(get_current_user)
):
    """Reverse a completed fund event"""
    try:
        reversal_data = await event_processor.reverse_event(
            event_id, current_user["user_id"], reversal_reason
        )
        
        return {
            "message": f"Event {event_id} reversed successfully",
            "reversal_id": reversal_data["reversal_id"],
            "reversal_data": reversal_data
        }
        
    except Exception as e:
        logger.error(f"Error reversing event {event_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{event_id}/history")
async def get_event_history(
    event_id: str = Path(..., description="Event ID"),
    current_user: dict = Depends(get_current_user)
):
    """Get complete history of an event"""
    try:
        history = await event_processor.get_event_history(event_id)
        return {"event_id": event_id, "history": history}
        
    except Exception as e:
        logger.error(f"Error getting event history for {event_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/funds/{fund_id}")
async def list_fund_events(
    fund_id: str = Path(..., description="Fund ID"),
    event_type: Optional[EventType] = Query(None, description="Filter by event type"),
    status: Optional[EventStatus] = Query(None, description="Filter by status"),
    start_date: Optional[date] = Query(None, description="Start date filter"),
    end_date: Optional[date] = Query(None, description="End date filter"),
    current_user: dict = Depends(get_current_user)
):
    """List all events for a fund"""
    try:
        # Mock event list - in real implementation, query database
        events = [
            {
                "event_id": "call_001",
                "event_type": "capital_call",
                "event_name": "Capital Call #1",
                "event_date": "2024-07-01",
                "effective_date": "2024-07-01",
                "total_amount": "5000000.00",
                "status": "completed",
                "created_by": "user_001"
            },
            {
                "event_id": "dist_001",
                "event_type": "distribution",
                "event_name": "Distribution #1",
                "event_date": "2024-06-15",
                "effective_date": "2024-06-15",
                "total_amount": "2000000.00",
                "status": "completed",
                "created_by": "user_001"
            },
            {
                "event_id": "mgmt_001",
                "event_type": "management_fee",
                "event_name": "Q2 2024 Management Fee",
                "event_date": "2024-06-30",
                "effective_date": "2024-06-30",
                "total_amount": "750000.00",
                "status": "pending_approval",
                "created_by": "user_002"
            }
        ]
        
        # Apply filters
        if event_type:
            events = [e for e in events if e["event_type"] == event_type]
        
        if status:
            events = [e for e in events if e["status"] == status]
        
        return {"fund_id": fund_id, "events": events}
        
    except Exception as e:
        logger.error(f"Error listing events for fund {fund_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/investors/{investor_id}/summary")
async def get_investor_event_summary(
    investor_id: str = Path(..., description="Investor ID"),
    fund_id: Optional[str] = Query(None, description="Fund ID filter"),
    start_date: Optional[date] = Query(None, description="Start date filter"),
    end_date: Optional[date] = Query(None, description="End date filter"),
    current_user: dict = Depends(get_current_user)
):
    """Get summary of all events for an investor"""
    try:
        summary = await event_processor.get_investor_event_summary(
            investor_id, fund_id, start_date, end_date
        )
        
        return summary
        
    except Exception as e:
        logger.error(f"Error getting investor summary for {investor_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{event_id}/calculations")
async def get_event_calculations(
    event_id: str = Path(..., description="Event ID"),
    investor_id: Optional[str] = Query(None, description="Filter by investor ID"),
    current_user: dict = Depends(get_current_user)
):
    """Get calculated amounts for an event"""
    try:
        # Mock calculation data
        calculations = [
            {
                "calculation_id": "calc_001",
                "investor_id": "inv_001",
                "ownership_percentage": 25.0,
                "gross_amount": "1250000.00",
                "net_amount": "1250000.00",
                "investment_portion": "1000000.00",
                "management_fee_portion": "200000.00",
                "expense_portion": "50000.00"
            },
            {
                "calculation_id": "calc_002",
                "investor_id": "inv_002",
                "ownership_percentage": 62.5,
                "gross_amount": "3125000.00",
                "net_amount": "3125000.00",
                "investment_portion": "2500000.00",
                "management_fee_portion": "500000.00",
                "expense_portion": "125000.00"
            },
            {
                "calculation_id": "calc_003",
                "investor_id": "inv_003",
                "ownership_percentage": 12.5,
                "gross_amount": "625000.00",
                "net_amount": "625000.00",
                "investment_portion": "500000.00",
                "management_fee_portion": "100000.00",
                "expense_portion": "25000.00"
            }
        ]
        
        # Apply investor filter
        if investor_id:
            calculations = [c for c in calculations if c["investor_id"] == investor_id]
        
        return {
            "event_id": event_id,
            "calculations": calculations,
            "summary": {
                "total_investors": len(calculations),
                "total_gross_amount": sum(Decimal(c["gross_amount"]) for c in calculations),
                "total_net_amount": sum(Decimal(c["net_amount"]) for c in calculations)
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting calculations for event {event_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))