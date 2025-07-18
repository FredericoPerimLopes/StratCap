"""
Rate limiting middleware to prevent API abuse
"""

import time
from typing import Dict, Tuple
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
import redis.asyncio as redis

from src.config.settings import settings
from src.utils.logger import logger


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting middleware using Redis for distributed rate limiting
    """
    
    def __init__(self, app):
        super().__init__(app)
        self.redis_client = None
        self.rate_limits = {
            "default": {"requests": settings.RATE_LIMIT_DEFAULT, "window": settings.RATE_LIMIT_WINDOW},
            "auth": {"requests": 5, "window": 60},
            "calculation": {"requests": 10, "window": 60},
            "report": {"requests": 5, "window": 300},
            "admin": {"requests": 1000, "window": 60}
        }
    
    async def get_redis_client(self):
        """
        Get or create Redis client
        """
        if not self.redis_client:
            self.redis_client = await redis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True
            )
        return self.redis_client
    
    def get_client_id(self, request: Request) -> str:
        """
        Get client identifier for rate limiting
        """
        # Use user ID if authenticated, otherwise use IP address
        if hasattr(request.state, "user_id") and request.state.user_id:
            return f"user:{request.state.user_id}"
        
        # Get client IP address
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return f"ip:{forwarded.split(',')[0].strip()}"
        
        return f"ip:{request.client.host if request.client else 'unknown'}"
    
    def get_endpoint_type(self, path: str, user_roles: list = None) -> str:
        """
        Determine rate limit type based on endpoint and user role
        """
        if user_roles and "admin" in user_roles:
            return "admin"
        elif "/auth/" in path:
            return "auth"
        elif "/calculations/" in path:
            return "calculation"
        elif "/reports/" in path:
            return "report"
        else:
            return "default"
    
    async def check_rate_limit(self, client_id: str, endpoint_type: str) -> Tuple[bool, int]:
        """
        Check if client has exceeded rate limit
        """
        redis_client = await self.get_redis_client()
        
        limit_config = self.rate_limits.get(endpoint_type, self.rate_limits["default"])
        window = limit_config["window"]
        max_requests = limit_config["requests"]
        
        # Create sliding window key
        current_time = time.time()
        window_start = current_time - window
        
        key = f"rate_limit:{client_id}:{endpoint_type}"
        
        # Use Redis pipeline for atomic operations
        pipe = redis_client.pipeline()
        
        # Remove old entries
        pipe.zremrangebyscore(key, 0, window_start)
        
        # Count current requests
        pipe.zcard(key)
        
        # Add current request
        pipe.zadd(key, {str(current_time): current_time})
        
        # Set expiration
        pipe.expire(key, window)
        
        results = await pipe.execute()
        request_count = results[1]
        
        # Check if limit exceeded
        if request_count >= max_requests:
            remaining = 0
            allowed = False
        else:
            remaining = max_requests - request_count - 1
            allowed = True
        
        return allowed, remaining
    
    async def dispatch(self, request: Request, call_next):
        """
        Process request with rate limiting
        """
        # Skip rate limiting for health checks and metrics
        if request.url.path in ["/api/health", "/metrics"]:
            response = await call_next(request)
            return response
        
        try:
            # Get client identifier
            client_id = self.get_client_id(request)
            
            # Get user roles if available
            user_roles = getattr(request.state, "roles", [])
            
            # Determine endpoint type
            endpoint_type = self.get_endpoint_type(request.url.path, user_roles)
            
            # Check rate limit
            allowed, remaining = await self.check_rate_limit(client_id, endpoint_type)
            
            if not allowed:
                logger.warning(f"Rate limit exceeded for {client_id} on {endpoint_type}")
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Rate limit exceeded. Please try again later.",
                    headers={
                        "Retry-After": str(self.rate_limits[endpoint_type]["window"]),
                        "X-RateLimit-Limit": str(self.rate_limits[endpoint_type]["requests"]),
                        "X-RateLimit-Remaining": "0",
                        "X-RateLimit-Reset": str(int(time.time()) + self.rate_limits[endpoint_type]["window"])
                    }
                )
            
            # Process request
            response = await call_next(request)
            
            # Add rate limit headers
            response.headers["X-RateLimit-Limit"] = str(self.rate_limits[endpoint_type]["requests"])
            response.headers["X-RateLimit-Remaining"] = str(remaining)
            response.headers["X-RateLimit-Reset"] = str(int(time.time()) + self.rate_limits[endpoint_type]["window"])
            
            return response
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Rate limiting error: {str(e)}")
            # If rate limiting fails, allow the request but log the error
            response = await call_next(request)
            return response