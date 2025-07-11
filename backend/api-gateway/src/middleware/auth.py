"""
Authentication middleware for JWT token validation
"""

import time
from typing import Optional
from fastapi import Request, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from starlette.middleware.base import BaseHTTPMiddleware

from src.config.settings import settings
from src.utils.logger import logger


class JWTBearer(HTTPBearer):
    """
    JWT Bearer token dependency
    """
    
    def __init__(self, auto_error: bool = True):
        super().__init__(auto_error=auto_error)
    
    async def __call__(self, request: Request) -> Optional[str]:
        credentials: HTTPAuthorizationCredentials = await super().__call__(request)
        
        if credentials:
            if not credentials.scheme == "Bearer":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Invalid authentication scheme."
                )
            
            if not self.verify_jwt(credentials.credentials):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Invalid token or expired token."
                )
            
            return credentials.credentials
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid authorization code."
            )
    
    def verify_jwt(self, token: str) -> bool:
        """
        Verify JWT token
        """
        try:
            payload = jwt.decode(
                token,
                settings.JWT_SECRET,
                algorithms=[settings.JWT_ALGORITHM]
            )
            
            # Check token expiration
            if payload.get("exp") < time.time():
                return False
            
            return True
        except JWTError:
            return False


def decode_token(token: str) -> dict:
    """
    Decode JWT token and return payload
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError as e:
        logger.error(f"JWT decode error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )


class AuthMiddleware(BaseHTTPMiddleware):
    """
    Authentication middleware for protected routes
    """
    
    # Public endpoints that don't require authentication
    PUBLIC_PATHS = [
        "/",
        "/api/health",
        "/api/auth/login",
        "/api/auth/register",
        "/api/auth/refresh",
        "/api/docs",
        "/api/redoc",
        "/api/openapi.json",
        "/metrics"
    ]
    
    async def dispatch(self, request: Request, call_next):
        """
        Process request and validate authentication
        """
        # Skip authentication for public endpoints
        if any(request.url.path.startswith(path) for path in self.PUBLIC_PATHS):
            response = await call_next(request)
            return response
        
        # Extract token from Authorization header
        auth_header = request.headers.get("Authorization")
        
        if not auth_header or not auth_header.startswith("Bearer "):
            return HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing authentication token"
            )
        
        token = auth_header.split(" ")[1]
        
        try:
            # Decode and validate token
            payload = decode_token(token)
            
            # Add user information to request state
            request.state.user_id = payload.get("user_id")
            request.state.email = payload.get("email")
            request.state.roles = payload.get("roles", [])
            request.state.permissions = payload.get("permissions", [])
            request.state.tenant_id = payload.get("tenant_id")
            
            # Process request
            response = await call_next(request)
            
            return response
            
        except HTTPException as e:
            return HTTPException(
                status_code=e.status_code,
                detail=e.detail
            )
        except Exception as e:
            logger.error(f"Authentication error: {str(e)}")
            return HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal server error"
            )