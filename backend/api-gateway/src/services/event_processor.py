from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, date
from decimal import Decimal
import asyncio
from dataclasses import dataclass

from ..models.fund_events import (
    FundEvent, EventType, EventStatus, CapitalCallEvent, DistributionEvent,
    ManagementFeeEvent, InvestorEventCalculation, EventProcessingResult,
    EventCalculationEngine
)
from ..models.investor import Investor
from ..utils.logger import get_logger

logger = get_logger(__name__)


@dataclass
class EventValidationRule:
    """Validation rule for events"""
    name: str
    condition: callable
    error_message: str
    warning_only: bool = False


class EventProcessingService:
    """
    Service for processing fund events and calculating investor amounts.
    Handles the complete workflow from event creation to investor notifications.
    """
    
    def __init__(self):
        self.calculation_engine = EventCalculationEngine()
        self.validation_rules = self._initialize_validation_rules()
        self.event_history: List[Dict[str, Any]] = []
    
    async def create_event(
        self, 
        event_data: Dict[str, Any], 
        created_by: str
    ) -> FundEvent:
        """
        Create a new fund event
        
        Args:
            event_data: Event data dictionary
            created_by: User ID who created the event
            
        Returns:
            Created FundEvent instance
        """
        try:
            # Determine event type and create appropriate model
            event_type = EventType(event_data['event_type'])
            
            if event_type == EventType.CAPITAL_CALL:
                event = CapitalCallEvent(
                    event_id=f"call_{datetime.utcnow().timestamp()}",
                    created_by=created_by,
                    **event_data
                )
            elif event_type == EventType.DISTRIBUTION:
                event = DistributionEvent(
                    event_id=f"dist_{datetime.utcnow().timestamp()}",
                    created_by=created_by,
                    **event_data
                )
            elif event_type == EventType.MANAGEMENT_FEE:
                event = ManagementFeeEvent(
                    event_id=f"mgmt_{datetime.utcnow().timestamp()}",
                    created_by=created_by,
                    **event_data
                )
            else:
                event = FundEvent(
                    event_id=f"event_{datetime.utcnow().timestamp()}",
                    created_by=created_by,
                    **event_data
                )
            
            # Validate event
            validation_result = await self._validate_event(event)
            if validation_result['critical_errors']:
                raise ValueError(f"Event validation failed: {validation_result['critical_errors']}")
            
            # Log event creation
            self._log_event_action(event.event_id, "created", created_by)
            
            logger.info(f"Created event {event.event_id} of type {event.event_type}")
            return event
            
        except Exception as e:
            logger.error(f"Error creating event: {str(e)}")
            raise
    
    async def process_event(
        self, 
        event: FundEvent, 
        auto_approve: bool = False,
        send_notifications: bool = True
    ) -> EventProcessingResult:
        """
        Process a fund event and calculate investor amounts
        
        Args:
            event: The fund event to process
            auto_approve: Whether to automatically approve the event
            send_notifications: Whether to send notifications to investors
            
        Returns:
            EventProcessingResult with calculations
        """
        try:
            # Update event status
            event.status = EventStatus.PROCESSING
            self._log_event_action(event.event_id, "processing_started", event.created_by)
            
            # Get investor commitments for the fund
            investor_commitments = await self._get_investor_commitments(event.fund_id)
            
            if not investor_commitments:
                raise ValueError(f"No investor commitments found for fund {event.fund_id}")
            
            # Calculate investor amounts
            processing_result = self.calculation_engine.calculate_event(
                event, investor_commitments
            )
            
            # Validate processing result
            if processing_result.validation_errors:
                event.status = EventStatus.FAILED
                self._log_event_action(
                    event.event_id, 
                    "processing_failed", 
                    event.created_by,
                    {"errors": processing_result.validation_errors}
                )
                raise ValueError(f"Event processing failed: {processing_result.validation_errors}")
            
            # Auto-approve if requested
            if auto_approve:
                await self._approve_event(event, event.created_by)
            else:
                event.status = EventStatus.PENDING_APPROVAL
            
            # Send notifications if requested
            if send_notifications:
                await self._send_investor_notifications(event, processing_result)
            
            # Update event status
            if event.status != EventStatus.APPROVED:
                event.status = EventStatus.COMPLETED
            
            self._log_event_action(event.event_id, "processing_completed", event.created_by)
            
            logger.info(f"Successfully processed event {event.event_id}")
            return processing_result
            
        except Exception as e:
            event.status = EventStatus.FAILED
            self._log_event_action(
                event.event_id, 
                "processing_failed", 
                event.created_by,
                {"error": str(e)}
            )
            logger.error(f"Error processing event {event.event_id}: {str(e)}")
            raise
    
    async def approve_event(
        self, 
        event_id: str, 
        approved_by: str,
        approval_notes: Optional[str] = None
    ) -> bool:
        """
        Approve a fund event
        
        Args:
            event_id: Event ID to approve
            approved_by: User ID who approved the event
            approval_notes: Optional approval notes
            
        Returns:
            True if approved successfully
        """
        try:
            # In a real implementation, this would fetch the event from database
            # For now, we'll simulate approval
            
            self._log_event_action(
                event_id, 
                "approved", 
                approved_by,
                {"notes": approval_notes}
            )
            
            logger.info(f"Event {event_id} approved by {approved_by}")
            return True
            
        except Exception as e:
            logger.error(f"Error approving event {event_id}: {str(e)}")
            raise
    
    async def cancel_event(
        self, 
        event_id: str, 
        cancelled_by: str,
        cancellation_reason: str
    ) -> bool:
        """
        Cancel a fund event
        
        Args:
            event_id: Event ID to cancel
            cancelled_by: User ID who cancelled the event
            cancellation_reason: Reason for cancellation
            
        Returns:
            True if cancelled successfully
        """
        try:
            self._log_event_action(
                event_id, 
                "cancelled", 
                cancelled_by,
                {"reason": cancellation_reason}
            )
            
            logger.info(f"Event {event_id} cancelled by {cancelled_by}")
            return True
            
        except Exception as e:
            logger.error(f"Error cancelling event {event_id}: {str(e)}")
            raise
    
    async def reverse_event(
        self, 
        event_id: str, 
        reversed_by: str,
        reversal_reason: str
    ) -> Dict[str, Any]:
        """
        Reverse a completed fund event
        
        Args:
            event_id: Event ID to reverse
            reversed_by: User ID who reversed the event
            reversal_reason: Reason for reversal
            
        Returns:
            Reversal result information
        """
        try:
            # Create reversal entry
            reversal_data = {
                "original_event_id": event_id,
                "reversed_by": reversed_by,
                "reversal_reason": reversal_reason,
                "reversed_at": datetime.utcnow(),
                "reversal_id": f"rev_{datetime.utcnow().timestamp()}"
            }
            
            self._log_event_action(
                event_id, 
                "reversed", 
                reversed_by,
                reversal_data
            )
            
            logger.info(f"Event {event_id} reversed by {reversed_by}")
            return reversal_data
            
        except Exception as e:
            logger.error(f"Error reversing event {event_id}: {str(e)}")
            raise
    
    async def get_event_history(self, event_id: str) -> List[Dict[str, Any]]:
        """Get complete history of an event"""
        return [
            entry for entry in self.event_history 
            if entry.get('event_id') == event_id
        ]
    
    async def get_investor_event_summary(
        self, 
        investor_id: str, 
        fund_id: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> Dict[str, Any]:
        """
        Get summary of all events for an investor
        
        Args:
            investor_id: Investor ID
            fund_id: Optional fund ID filter
            start_date: Optional start date filter
            end_date: Optional end date filter
            
        Returns:
            Summary of investor events
        """
        # This would typically query the database
        # For now, return a mock summary
        return {
            "investor_id": investor_id,
            "fund_id": fund_id,
            "summary": {
                "total_capital_calls": 5,
                "total_called_amount": Decimal('2500000.00'),
                "total_distributions": 3,
                "total_distributed_amount": Decimal('1200000.00'),
                "total_management_fees": 8,
                "total_fee_amount": Decimal('150000.00'),
                "net_investment": Decimal('1450000.00')
            },
            "events": [
                {
                    "event_id": "call_001",
                    "event_type": "capital_call",
                    "event_date": "2024-01-15",
                    "amount": Decimal('500000.00'),
                    "status": "completed"
                },
                {
                    "event_id": "dist_001",
                    "event_type": "distribution",
                    "event_date": "2024-06-15",
                    "amount": Decimal('200000.00'),
                    "status": "completed"
                }
            ]
        }
    
    async def _validate_event(self, event: FundEvent) -> Dict[str, List[str]]:
        """Validate event before processing"""
        errors = []
        warnings = []
        critical_errors = []
        
        # Apply validation rules
        for rule in self.validation_rules:
            try:
                if not rule.condition(event):
                    if rule.warning_only:
                        warnings.append(rule.error_message)
                    else:
                        errors.append(rule.error_message)
                        if "critical" in rule.name.lower():
                            critical_errors.append(rule.error_message)
            except Exception as e:
                errors.append(f"Validation rule {rule.name} failed: {str(e)}")
        
        return {
            "errors": errors,
            "warnings": warnings,
            "critical_errors": critical_errors
        }
    
    async def _get_investor_commitments(self, fund_id: str) -> List[Dict[str, Any]]:
        """Get investor commitments for a fund"""
        # Mock data - in real implementation, this would query the database
        return [
            {
                "investor_id": "inv_001",
                "commitment_id": "comm_001",
                "commitment_amount": 10000000.00,
                "paid_in_amount": 6000000.00,
                "nav_amount": 8500000.00,
                "commitment_date": date(2024, 1, 1),
                "status": "active",
                "withholding_rate": 0.3
            },
            {
                "investor_id": "inv_002",
                "commitment_id": "comm_002",
                "commitment_amount": 25000000.00,
                "paid_in_amount": 15000000.00,
                "nav_amount": 21000000.00,
                "commitment_date": date(2024, 1, 1),
                "status": "active",
                "withholding_rate": 0.0
            },
            {
                "investor_id": "inv_003",
                "commitment_id": "comm_003",
                "commitment_amount": 5000000.00,
                "paid_in_amount": 3000000.00,
                "nav_amount": 4200000.00,
                "commitment_date": date(2024, 2, 1),
                "status": "active",
                "withholding_rate": 0.15
            }
        ]
    
    async def _approve_event(self, event: FundEvent, approved_by: str) -> None:
        """Approve an event"""
        event.status = EventStatus.APPROVED
        event.approved_by = approved_by
        event.approved_at = datetime.utcnow()
        
        self._log_event_action(event.event_id, "approved", approved_by)
    
    async def _send_investor_notifications(
        self, 
        event: FundEvent, 
        processing_result: EventProcessingResult
    ) -> None:
        """Send notifications to investors about the event"""
        # This would integrate with notification service
        # For now, just log the notification
        
        for calc in processing_result.investor_calculations:
            notification_data = {
                "investor_id": calc.investor_id,
                "event_type": event.event_type,
                "event_name": event.event_name,
                "amount": calc.net_amount,
                "due_date": getattr(event, 'due_date', None) or getattr(event, 'payment_date', None),
                "event_date": event.event_date
            }
            
            logger.info(f"Notification sent to investor {calc.investor_id}: {notification_data}")
    
    def _log_event_action(
        self, 
        event_id: str, 
        action: str, 
        user_id: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """Log an event action for audit trail"""
        log_entry = {
            "event_id": event_id,
            "action": action,
            "user_id": user_id,
            "timestamp": datetime.utcnow(),
            "metadata": metadata or {}
        }
        
        self.event_history.append(log_entry)
        logger.info(f"Event action logged: {action} for event {event_id} by {user_id}")
    
    def _initialize_validation_rules(self) -> List[EventValidationRule]:
        """Initialize validation rules for events"""
        return [
            EventValidationRule(
                name="future_effective_date",
                condition=lambda event: event.effective_date >= date.today(),
                error_message="Effective date must be in the future",
                warning_only=True
            ),
            EventValidationRule(
                name="positive_amount",
                condition=lambda event: event.total_amount > 0,
                error_message="Total amount must be positive"
            ),
            EventValidationRule(
                name="critical_record_date",
                condition=lambda event: event.record_date <= date.today(),
                error_message="Record date cannot be in the future"
            ),
            EventValidationRule(
                name="valid_fund_id",
                condition=lambda event: event.fund_id is not None and len(event.fund_id) > 0,
                error_message="Fund ID is required"
            ),
            EventValidationRule(
                name="capital_call_components",
                condition=lambda event: (
                    event.event_type != EventType.CAPITAL_CALL or
                    (hasattr(event, 'investment_amount') and 
                     hasattr(event, 'management_fee_amount') and
                     hasattr(event, 'expense_amount'))
                ),
                error_message="Capital call must have component amounts"
            ),
            EventValidationRule(
                name="distribution_payment_date",
                condition=lambda event: (
                    event.event_type != EventType.DISTRIBUTION or
                    (hasattr(event, 'payment_date') and 
                     event.payment_date >= event.effective_date)
                ),
                error_message="Distribution payment date must be after effective date"
            ),
            EventValidationRule(
                name="management_fee_period",
                condition=lambda event: (
                    event.event_type != EventType.MANAGEMENT_FEE or
                    (hasattr(event, 'fee_period_start') and 
                     hasattr(event, 'fee_period_end') and
                     event.fee_period_end > event.fee_period_start)
                ),
                error_message="Management fee period end must be after start"
            )
        ]


# Singleton instance
event_processor = EventProcessingService()