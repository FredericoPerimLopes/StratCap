"""
Workflow Automation Engine - Inspired by Maybern's Approach

This module implements sophisticated workflow automation for fund management,
transforming manual processes into strategic, automated workflows.
"""

from typing import Dict, List, Any, Optional, Callable
from datetime import datetime, date, timedelta
from enum import Enum
from dataclasses import dataclass, field
from decimal import Decimal
import asyncio
import json

from ..models.fund_events import FundEvent, EventType, EventStatus
from ..models.fund_structure import FundStructure
from ..utils.logger import get_logger

logger = get_logger(__name__)


class WorkflowType(str, Enum):
    CAPITAL_CALL = "capital_call"
    DISTRIBUTION = "distribution"
    WATERFALL_CALCULATION = "waterfall_calculation"
    SUBSEQUENT_CLOSE = "subsequent_close"
    QUARTERLY_REPORTING = "quarterly_reporting"
    ANNUAL_AUDIT = "annual_audit"
    COMPLIANCE_CHECK = "compliance_check"
    PERFORMANCE_CALCULATION = "performance_calculation"


class WorkflowStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class TriggerType(str, Enum):
    SCHEDULED = "scheduled"
    EVENT_BASED = "event_based"
    MANUAL = "manual"
    CONDITIONAL = "conditional"


@dataclass
class WorkflowStep:
    """Individual step in a workflow"""
    step_id: str
    name: str
    description: str
    action: str  # Function or service to execute
    parameters: Dict[str, Any] = field(default_factory=dict)
    dependencies: List[str] = field(default_factory=list)
    timeout_minutes: int = 30
    retry_count: int = 3
    critical: bool = False  # If true, workflow fails if this step fails
    
    # Execution tracking
    status: str = "pending"
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    result: Optional[Dict[str, Any]] = None


@dataclass
class WorkflowTemplate:
    """Template for creating automated workflows"""
    template_id: str
    name: str
    description: str
    workflow_type: WorkflowType
    trigger_type: TriggerType
    
    # Workflow definition
    steps: List[WorkflowStep]
    
    # Configuration
    parallel_execution: bool = False
    auto_approve: bool = False
    notification_settings: Dict[str, Any] = field(default_factory=dict)
    
    # Metadata
    created_by: str = ""
    created_at: datetime = field(default_factory=datetime.utcnow)
    version: str = "1.0"


@dataclass
class WorkflowInstance:
    """Running instance of a workflow"""
    instance_id: str
    template_id: str
    name: str
    workflow_type: WorkflowType
    
    # Context
    fund_id: Optional[str] = None
    event_id: Optional[str] = None
    context_data: Dict[str, Any] = field(default_factory=dict)
    
    # Execution
    status: WorkflowStatus = WorkflowStatus.DRAFT
    current_step: Optional[str] = None
    steps: List[WorkflowStep] = field(default_factory=list)
    
    # Tracking
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    triggered_by: str = ""
    
    # Results
    results: Dict[str, Any] = field(default_factory=dict)
    error_log: List[str] = field(default_factory=list)


class WorkflowAutomationEngine:
    """
    Advanced workflow automation engine for fund management processes.
    
    Inspired by Maybern's approach of transforming manual fund administration
    into strategic, automated workflows.
    """
    
    def __init__(self):
        self.templates: Dict[str, WorkflowTemplate] = {}
        self.running_instances: Dict[str, WorkflowInstance] = {}
        self.completed_instances: List[WorkflowInstance] = []
        self.action_registry: Dict[str, Callable] = {}
        
        # Initialize built-in actions
        self._register_built_in_actions()
        
        # Load standard templates
        self._load_standard_templates()
    
    def register_action(self, action_name: str, action_func: Callable):
        """Register a custom action for workflow steps"""
        self.action_registry[action_name] = action_func
        logger.info(f"Registered workflow action: {action_name}")
    
    def create_template(self, template: WorkflowTemplate) -> str:
        """Create a new workflow template"""
        self.templates[template.template_id] = template
        logger.info(f"Created workflow template: {template.name}")
        return template.template_id
    
    async def start_workflow(
        self, 
        template_id: str, 
        context_data: Dict[str, Any],
        triggered_by: str = "system"
    ) -> str:
        """Start a new workflow instance"""
        
        if template_id not in self.templates:
            raise ValueError(f"Template not found: {template_id}")
        
        template = self.templates[template_id]
        
        # Create workflow instance
        instance = WorkflowInstance(
            instance_id=f"wf_{datetime.utcnow().timestamp()}",
            template_id=template_id,
            name=f"{template.name} - {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}",
            workflow_type=template.workflow_type,
            fund_id=context_data.get("fund_id"),
            event_id=context_data.get("event_id"),
            context_data=context_data,
            steps=[WorkflowStep(**step.__dict__) for step in template.steps],
            triggered_by=triggered_by,
            started_at=datetime.utcnow(),
            status=WorkflowStatus.ACTIVE
        )
        
        self.running_instances[instance.instance_id] = instance
        
        # Start execution
        asyncio.create_task(self._execute_workflow(instance))
        
        logger.info(f"Started workflow: {instance.name} ({instance.instance_id})")
        return instance.instance_id
    
    async def _execute_workflow(self, instance: WorkflowInstance):
        """Execute a workflow instance"""
        try:
            template = self.templates[instance.template_id]
            
            if template.parallel_execution:
                await self._execute_parallel(instance)
            else:
                await self._execute_sequential(instance)
            
            # Mark as completed
            instance.status = WorkflowStatus.COMPLETED
            instance.completed_at = datetime.utcnow()
            
            # Move to completed instances
            self.completed_instances.append(instance)
            del self.running_instances[instance.instance_id]
            
            logger.info(f"Workflow completed: {instance.name}")
            
        except Exception as e:
            instance.status = WorkflowStatus.FAILED
            instance.error_log.append(f"Workflow execution failed: {str(e)}")
            logger.error(f"Workflow failed: {instance.name} - {str(e)}")
    
    async def _execute_sequential(self, instance: WorkflowInstance):
        """Execute workflow steps sequentially"""
        for step in instance.steps:
            if await self._can_execute_step(step, instance):
                await self._execute_step(step, instance)
                
                if step.status == "failed" and step.critical:
                    raise Exception(f"Critical step failed: {step.name}")
    
    async def _execute_parallel(self, instance: WorkflowInstance):
        """Execute workflow steps in parallel where possible"""
        pending_steps = [step for step in instance.steps if step.status == "pending"]
        
        while pending_steps:
            # Find steps that can be executed (dependencies met)
            executable_steps = [
                step for step in pending_steps 
                if await self._can_execute_step(step, instance)
            ]
            
            if not executable_steps:
                # Check if we're deadlocked
                if all(step.status == "pending" for step in pending_steps):
                    raise Exception("Workflow deadlock: No executable steps remaining")
                break
            
            # Execute steps in parallel
            tasks = [
                self._execute_step(step, instance) 
                for step in executable_steps
            ]
            
            await asyncio.gather(*tasks, return_exceptions=True)
            
            # Update pending steps
            pending_steps = [step for step in pending_steps if step.status == "pending"]
            
            # Check for critical failures
            failed_critical = [
                step for step in executable_steps 
                if step.status == "failed" and step.critical
            ]
            
            if failed_critical:
                raise Exception(f"Critical steps failed: {[s.name for s in failed_critical]}")
    
    async def _can_execute_step(self, step: WorkflowStep, instance: WorkflowInstance) -> bool:
        """Check if a step can be executed (dependencies met)"""
        if step.status != "pending":
            return False
        
        # Check dependencies
        for dep_id in step.dependencies:
            dep_step = next((s for s in instance.steps if s.step_id == dep_id), None)
            if not dep_step or dep_step.status != "completed":
                return False
        
        return True
    
    async def _execute_step(self, step: WorkflowStep, instance: WorkflowInstance):
        """Execute a single workflow step"""
        step.status = "running"
        step.started_at = datetime.utcnow()
        instance.current_step = step.step_id
        
        try:
            # Get action function
            if step.action not in self.action_registry:
                raise ValueError(f"Unknown action: {step.action}")
            
            action_func = self.action_registry[step.action]
            
            # Prepare parameters
            params = {
                **step.parameters,
                "instance": instance,
                "context": instance.context_data
            }
            
            # Execute with timeout
            result = await asyncio.wait_for(
                action_func(**params),
                timeout=step.timeout_minutes * 60
            )
            
            step.result = result
            step.status = "completed"
            step.completed_at = datetime.utcnow()
            
            logger.info(f"Step completed: {step.name}")
            
        except asyncio.TimeoutError:
            step.status = "failed"
            step.error_message = f"Step timed out after {step.timeout_minutes} minutes"
            logger.error(f"Step timeout: {step.name}")
            
        except Exception as e:
            step.status = "failed"
            step.error_message = str(e)
            logger.error(f"Step failed: {step.name} - {str(e)}")
            
            # Retry if configured
            if step.retry_count > 0:
                step.retry_count -= 1
                step.status = "pending"
                logger.info(f"Retrying step: {step.name} ({step.retry_count} retries left)")
    
    def _register_built_in_actions(self):
        """Register built-in workflow actions"""
        self.action_registry.update({
            "validate_fund_data": self._validate_fund_data,
            "calculate_capital_call": self._calculate_capital_call,
            "generate_notices": self._generate_notices,
            "send_notifications": self._send_notifications,
            "calculate_waterfall": self._calculate_waterfall,
            "generate_reports": self._generate_reports,
            "validate_calculations": self._validate_calculations,
            "create_audit_trail": self._create_audit_trail,
            "subsequent_close_setup": self._subsequent_close_setup,
            "compliance_check": self._compliance_check,
            "performance_calculation": self._performance_calculation
        })
    
    def _load_standard_templates(self):
        """Load standard workflow templates"""
        
        # Capital Call Workflow
        capital_call_template = WorkflowTemplate(
            template_id="capital_call_standard",
            name="Standard Capital Call Process",
            description="Automated capital call workflow with validation and notifications",
            workflow_type=WorkflowType.CAPITAL_CALL,
            trigger_type=TriggerType.MANUAL,
            steps=[
                WorkflowStep(
                    step_id="validate_data",
                    name="Validate Fund Data",
                    description="Validate fund and investor data before processing",
                    action="validate_fund_data",
                    critical=True
                ),
                WorkflowStep(
                    step_id="calculate_amounts",
                    name="Calculate Capital Call Amounts",
                    description="Calculate investor-specific capital call amounts",
                    action="calculate_capital_call",
                    dependencies=["validate_data"],
                    critical=True
                ),
                WorkflowStep(
                    step_id="validate_calculations",
                    name="Validate Calculations",
                    description="Validate calculated amounts and totals",
                    action="validate_calculations",
                    dependencies=["calculate_amounts"],
                    critical=True
                ),
                WorkflowStep(
                    step_id="generate_notices",
                    name="Generate Capital Call Notices",
                    description="Generate individual investor notices",
                    action="generate_notices",
                    dependencies=["validate_calculations"]
                ),
                WorkflowStep(
                    step_id="send_notifications",
                    name="Send Investor Notifications",
                    description="Send notices to investors via configured channels",
                    action="send_notifications",
                    dependencies=["generate_notices"]
                ),
                WorkflowStep(
                    step_id="create_audit_trail",
                    name="Create Audit Trail",
                    description="Create comprehensive audit trail for the capital call",
                    action="create_audit_trail",
                    dependencies=["send_notifications"]
                )
            ]
        )
        
        # Waterfall Calculation Workflow
        waterfall_template = WorkflowTemplate(
            template_id="waterfall_calculation",
            name="Distribution Waterfall Calculation",
            description="Automated waterfall calculation for distributions",
            workflow_type=WorkflowType.WATERFALL_CALCULATION,
            trigger_type=TriggerType.EVENT_BASED,
            steps=[
                WorkflowStep(
                    step_id="validate_distribution_data",
                    name="Validate Distribution Data",
                    description="Validate fund performance and distribution data",
                    action="validate_fund_data",
                    critical=True
                ),
                WorkflowStep(
                    step_id="calculate_waterfall",
                    name="Calculate Distribution Waterfall",
                    description="Calculate waterfall distribution amounts",
                    action="calculate_waterfall",
                    dependencies=["validate_distribution_data"],
                    critical=True
                ),
                WorkflowStep(
                    step_id="generate_distribution_reports",
                    name="Generate Distribution Reports",
                    description="Generate detailed distribution reports",
                    action="generate_reports",
                    dependencies=["calculate_waterfall"]
                )
            ]
        )
        
        # Quarterly Reporting Workflow
        quarterly_template = WorkflowTemplate(
            template_id="quarterly_reporting",
            name="Quarterly Reporting Process",
            description="Automated quarterly reporting workflow",
            workflow_type=WorkflowType.QUARTERLY_REPORTING,
            trigger_type=TriggerType.SCHEDULED,
            parallel_execution=True,
            steps=[
                WorkflowStep(
                    step_id="performance_calc",
                    name="Calculate Performance Metrics",
                    description="Calculate quarterly performance metrics",
                    action="performance_calculation"
                ),
                WorkflowStep(
                    step_id="compliance_check",
                    name="Compliance Validation",
                    description="Validate regulatory compliance",
                    action="compliance_check"
                ),
                WorkflowStep(
                    step_id="generate_quarterly_reports",
                    name="Generate Quarterly Reports",
                    description="Generate all quarterly reports",
                    action="generate_reports",
                    dependencies=["performance_calc", "compliance_check"]
                )
            ]
        )
        
        # Store templates
        self.templates.update({
            capital_call_template.template_id: capital_call_template,
            waterfall_template.template_id: waterfall_template,
            quarterly_template.template_id: quarterly_template
        })
        
        logger.info("Loaded standard workflow templates")
    
    # Built-in action implementations
    async def _validate_fund_data(self, instance: WorkflowInstance, context: Dict[str, Any], **kwargs):
        """Validate fund data before processing"""
        fund_id = context.get("fund_id")
        if not fund_id:
            raise ValueError("Fund ID required for validation")
        
        # Mock validation - in real implementation, check database
        await asyncio.sleep(1)  # Simulate validation time
        
        return {"validation_status": "passed", "fund_id": fund_id}
    
    async def _calculate_capital_call(self, instance: WorkflowInstance, context: Dict[str, Any], **kwargs):
        """Calculate capital call amounts"""
        event_id = context.get("event_id")
        if not event_id:
            raise ValueError("Event ID required for calculation")
        
        # Mock calculation - use actual event processor in real implementation
        await asyncio.sleep(2)  # Simulate calculation time
        
        return {
            "total_amount": Decimal("5000000.00"),
            "investor_count": 3,
            "calculations_generated": True
        }
    
    async def _generate_notices(self, instance: WorkflowInstance, context: Dict[str, Any], **kwargs):
        """Generate investor notices"""
        await asyncio.sleep(1)  # Simulate generation time
        
        return {
            "notices_generated": 3,
            "format": "PDF",
            "generated_at": datetime.utcnow()
        }
    
    async def _send_notifications(self, instance: WorkflowInstance, context: Dict[str, Any], **kwargs):
        """Send notifications to investors"""
        await asyncio.sleep(1)  # Simulate sending time
        
        return {
            "notifications_sent": 3,
            "channels": ["email", "portal"],
            "sent_at": datetime.utcnow()
        }
    
    async def _calculate_waterfall(self, instance: WorkflowInstance, context: Dict[str, Any], **kwargs):
        """Calculate distribution waterfall"""
        await asyncio.sleep(3)  # Simulate complex calculation
        
        return {
            "waterfall_calculated": True,
            "total_distribution": Decimal("2000000.00"),
            "carry_amount": Decimal("200000.00")
        }
    
    async def _generate_reports(self, instance: WorkflowInstance, context: Dict[str, Any], **kwargs):
        """Generate reports"""
        await asyncio.sleep(2)  # Simulate report generation
        
        return {
            "reports_generated": ["performance", "positions", "cashflow"],
            "format": "PDF",
            "generated_at": datetime.utcnow()
        }
    
    async def _validate_calculations(self, instance: WorkflowInstance, context: Dict[str, Any], **kwargs):
        """Validate calculations"""
        await asyncio.sleep(1)  # Simulate validation
        
        return {"validation_passed": True, "total_validated": True}
    
    async def _create_audit_trail(self, instance: WorkflowInstance, context: Dict[str, Any], **kwargs):
        """Create audit trail"""
        await asyncio.sleep(0.5)  # Simulate audit trail creation
        
        return {"audit_trail_created": True, "entries": 5}
    
    async def _subsequent_close_setup(self, instance: WorkflowInstance, context: Dict[str, Any], **kwargs):
        """Setup subsequent close"""
        await asyncio.sleep(2)  # Simulate setup
        
        return {"subsequent_close_setup": True}
    
    async def _compliance_check(self, instance: WorkflowInstance, context: Dict[str, Any], **kwargs):
        """Perform compliance checks"""
        await asyncio.sleep(1)  # Simulate compliance checking
        
        return {"compliance_status": "passed", "checks_performed": 8}
    
    async def _performance_calculation(self, instance: WorkflowInstance, context: Dict[str, Any], **kwargs):
        """Calculate performance metrics"""
        await asyncio.sleep(2)  # Simulate performance calculation
        
        return {
            "irr": Decimal("15.5"),
            "moic": Decimal("1.8"),
            "dpi": Decimal("0.6"),
            "rvpi": Decimal("1.2")
        }
    
    def get_workflow_status(self, instance_id: str) -> Dict[str, Any]:
        """Get current status of a workflow instance"""
        if instance_id in self.running_instances:
            instance = self.running_instances[instance_id]
        else:
            instance = next(
                (i for i in self.completed_instances if i.instance_id == instance_id),
                None
            )
        
        if not instance:
            raise ValueError(f"Workflow instance not found: {instance_id}")
        
        return {
            "instance_id": instance.instance_id,
            "name": instance.name,
            "status": instance.status,
            "current_step": instance.current_step,
            "started_at": instance.started_at,
            "completed_at": instance.completed_at,
            "steps": [
                {
                    "step_id": step.step_id,
                    "name": step.name,
                    "status": step.status,
                    "started_at": step.started_at,
                    "completed_at": step.completed_at,
                    "error_message": step.error_message
                }
                for step in instance.steps
            ],
            "results": instance.results,
            "error_log": instance.error_log
        }


# Singleton instance
workflow_engine = WorkflowAutomationEngine()