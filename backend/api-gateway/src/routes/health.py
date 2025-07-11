"""
Health check endpoints
"""

from datetime import datetime
from typing import Dict, Any
from fastapi import APIRouter, status
import psutil
import aioredis

from src.config.settings import settings
from src.utils.logger import logger

router = APIRouter()


@router.get("/", response_model=Dict[str, Any])
async def health_check():
    """
    Basic health check endpoint
    """
    return {
        "status": "healthy",
        "service": "api-gateway",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }


@router.get("/live", response_model=Dict[str, Any])
async def liveness_check():
    """
    Kubernetes liveness probe endpoint
    """
    return {
        "status": "alive",
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/ready", response_model=Dict[str, Any])
async def readiness_check():
    """
    Kubernetes readiness probe endpoint
    Checks if service is ready to handle requests
    """
    try:
        # Check database connection
        # TODO: Implement actual database check
        db_healthy = True
        
        # Check Redis connection
        # TODO: Implement actual Redis check
        redis_healthy = True
        
        # Check if all dependencies are healthy
        if db_healthy and redis_healthy:
            return {
                "status": "ready",
                "timestamp": datetime.utcnow().isoformat(),
                "checks": {
                    "database": "healthy",
                    "redis": "healthy"
                }
            }
        else:
            return {
                "status": "not ready",
                "timestamp": datetime.utcnow().isoformat(),
                "checks": {
                    "database": "healthy" if db_healthy else "unhealthy",
                    "redis": "healthy" if redis_healthy else "unhealthy"
                }
            }
    except Exception as e:
        logger.error(f"Readiness check failed: {str(e)}")
        return {
            "status": "not ready",
            "timestamp": datetime.utcnow().isoformat(),
            "error": str(e)
        }


@router.get("/detailed", response_model=Dict[str, Any])
async def detailed_health_check():
    """
    Detailed health check with system metrics
    """
    try:
        # Get system metrics
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        # Get process info
        process = psutil.Process()
        process_info = {
            "pid": process.pid,
            "cpu_percent": process.cpu_percent(interval=1),
            "memory_mb": process.memory_info().rss / 1024 / 1024,
            "threads": process.num_threads()
        }
        
        return {
            "status": "healthy",
            "service": "api-gateway",
            "timestamp": datetime.utcnow().isoformat(),
            "version": "1.0.0",
            "environment": settings.ENVIRONMENT,
            "system": {
                "cpu_percent": cpu_percent,
                "memory": {
                    "total_mb": memory.total / 1024 / 1024,
                    "available_mb": memory.available / 1024 / 1024,
                    "percent": memory.percent
                },
                "disk": {
                    "total_gb": disk.total / 1024 / 1024 / 1024,
                    "free_gb": disk.free / 1024 / 1024 / 1024,
                    "percent": disk.percent
                }
            },
            "process": process_info,
            "dependencies": {
                "database": "healthy",  # TODO: Implement actual check
                "redis": "healthy",     # TODO: Implement actual check
                "services": {
                    "user_management": "healthy",     # TODO: Implement actual check
                    "fund_management": "healthy",     # TODO: Implement actual check
                    "calculation_engine": "healthy",  # TODO: Implement actual check
                    "workflow_engine": "healthy",     # TODO: Implement actual check
                    "reporting": "healthy",           # TODO: Implement actual check
                    "notification": "healthy"         # TODO: Implement actual check
                }
            }
        }
    except Exception as e:
        logger.error(f"Detailed health check failed: {str(e)}")
        return {
            "status": "error",
            "timestamp": datetime.utcnow().isoformat(),
            "error": str(e)
        }