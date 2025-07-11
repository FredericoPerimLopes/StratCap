"""
Workflow endpoints (proxy to Workflow Engine Service)
"""

from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from src.middleware.auth import JWTBearer
from src.utils.logger import logger

router = APIRouter(dependencies=[Depends(JWTBearer())])


class CapitalCallRequest(BaseModel):
    fund_id: str
    call_amount: float = Field(..., gt=0)
    call_purpose: str
    due_date: str


class DistributionRequest(BaseModel):
    fund_id: str
    distribution_amount: float = Field(..., gt=0)
    distribution_type: str
    distribution_date: str


@router.post("/capital-calls", response_model=Dict[str, Any])
async def initiate_capital_call(request: CapitalCallRequest):
    """
    Initiate a capital call workflow
    """
    logger.info(f"Initiating capital call for fund {request.fund_id}")
    
    # Mock response
    return {
        "workflow_id": "wf-001",
        "workflow_type": "capital_call",
        "fund_id": request.fund_id,
        "status": "initiated",
        "call_amount": request.call_amount,
        "created_at": "2024-01-15T10:30:00Z"
    }


@router.post("/distributions", response_model=Dict[str, Any])
async def initiate_distribution(request: DistributionRequest):
    """
    Initiate a distribution workflow
    """
    logger.info(f"Initiating distribution for fund {request.fund_id}")
    
    # Mock response
    return {
        "workflow_id": "wf-002",
        "workflow_type": "distribution",
        "fund_id": request.fund_id,
        "status": "initiated",
        "distribution_amount": request.distribution_amount,
        "created_at": "2024-01-15T10:30:00Z"
    }


@router.get("/{workflow_id}", response_model=Dict[str, Any])
async def get_workflow_status(workflow_id: str):
    """
    Get workflow status and details
    """
    # Mock response
    return {
        "workflow_id": workflow_id,
        "workflow_type": "capital_call",
        "status": "in_progress",
        "current_step": "investor_notifications",
        "steps_completed": 2,
        "total_steps": 5,
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-15T10:32:00Z"
    }


@router.put("/{workflow_id}/approve", response_model=Dict[str, Any])
async def approve_workflow(workflow_id: str):
    """
    Approve a workflow step
    """
    logger.info(f"Approving workflow {workflow_id}")
    
    return {
        "workflow_id": workflow_id,
        "status": "approved",
        "approved_at": "2024-01-15T10:35:00Z"
    }