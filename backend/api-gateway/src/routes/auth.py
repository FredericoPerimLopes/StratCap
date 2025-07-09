"""
Authentication endpoints
"""

from datetime import datetime, timedelta
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from jose import jwt

from src.config.settings import settings
from src.utils.logger import logger

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    organization: str


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class RefreshToken(BaseModel):
    refresh_token: str


def create_access_token(data: dict) -> str:
    """
    Create JWT access token
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.JWT_EXPIRATION_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    """
    Create JWT refresh token
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.JWT_REFRESH_EXPIRATION_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt


@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    User login endpoint
    """
    # TODO: Implement actual user authentication
    # This is a placeholder implementation
    
    # Mock user authentication
    if form_data.username != "admin@stratcap.com" or form_data.password != "admin123":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create tokens
    user_data = {
        "user_id": "user-123",
        "email": form_data.username,
        "roles": ["fund_manager"],
        "permissions": ["fund:read", "fund:write", "report:generate"],
        "tenant_id": "tenant-456"
    }
    
    access_token = create_access_token(user_data)
    refresh_token = create_refresh_token({"user_id": user_data["user_id"]})
    
    logger.info(f"User logged in: {form_data.username}")
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": settings.JWT_EXPIRATION_MINUTES * 60
    }


@router.post("/register", response_model=Dict[str, Any])
async def register(user: UserRegister):
    """
    User registration endpoint
    """
    # TODO: Implement actual user registration
    # This is a placeholder implementation
    
    logger.info(f"New user registration: {user.email}")
    
    return {
        "message": "User registered successfully",
        "user_id": "user-789",
        "email": user.email
    }


@router.post("/refresh", response_model=Token)
async def refresh_token(token_data: RefreshToken):
    """
    Refresh access token using refresh token
    """
    try:
        # Decode refresh token
        payload = jwt.decode(
            token_data.refresh_token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )
        
        # Verify token type
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type"
            )
        
        # TODO: Fetch actual user data from database
        user_data = {
            "user_id": payload.get("user_id"),
            "email": "admin@stratcap.com",
            "roles": ["fund_manager"],
            "permissions": ["fund:read", "fund:write", "report:generate"],
            "tenant_id": "tenant-456"
        }
        
        # Create new tokens
        access_token = create_access_token(user_data)
        refresh_token = create_refresh_token({"user_id": user_data["user_id"]})
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": settings.JWT_EXPIRATION_MINUTES * 60
        }
        
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )


@router.post("/logout")
async def logout(token: str = Depends(oauth2_scheme)):
    """
    User logout endpoint
    """
    # TODO: Implement token blacklisting
    logger.info("User logged out")
    
    return {"message": "Logged out successfully"}


@router.get("/me")
async def get_current_user(token: str = Depends(oauth2_scheme)):
    """
    Get current user information
    """
    try:
        # Decode token
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )
        
        return {
            "user_id": payload.get("user_id"),
            "email": payload.get("email"),
            "roles": payload.get("roles", []),
            "permissions": payload.get("permissions", []),
            "tenant_id": payload.get("tenant_id")
        }
        
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )