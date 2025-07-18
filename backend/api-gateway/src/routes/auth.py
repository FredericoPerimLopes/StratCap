"""
Authentication endpoints
"""

from datetime import datetime, timedelta
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from jose import jwt, JWTError

from src.config.settings import settings
from src.utils.logger import logger
from src.models.auth import (
    User, Role, LoginCredentials, AuthResponse, 
    PasswordResetRequest, PasswordReset, PasswordChange, 
    EmailVerification
)

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    organization: str


class RefreshTokenRequest(BaseModel):
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


@router.post("/login", response_model=AuthResponse)
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
    
    mock_user = User(
        user_id=user_data["user_id"],
        email=user_data["email"],
        full_name="Admin User",
        is_active=True,
        is_verified=True,
        tenant_id=user_data["tenant_id"],
        roles=[Role(
            role_id="role-1",
            role_name="Fund Manager",
            description="Fund management role",
            permissions=user_data["permissions"]
        )],
        permissions=user_data["permissions"],
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    return AuthResponse(
        user=mock_user,
        token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.JWT_EXPIRATION_MINUTES * 60
    )


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


@router.post("/refresh", response_model=AuthResponse)
async def refresh_token(token_data: RefreshTokenRequest):
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
        new_refresh_token = create_refresh_token({"user_id": user_data["user_id"]})
        
        mock_user = User(
            user_id=user_data["user_id"],
            email=user_data["email"],
            full_name="Admin User",
            is_active=True,
            is_verified=True,
            tenant_id=user_data["tenant_id"],
            roles=[Role(
                role_id="role-1",
                role_name="Fund Manager",
                description="Fund management role",
                permissions=user_data["permissions"]
            )],
            permissions=user_data["permissions"],
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        return AuthResponse(
            user=mock_user,
            token=access_token,
            refresh_token=new_refresh_token,
            expires_in=settings.JWT_EXPIRATION_MINUTES * 60
        )
        
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


@router.get("/me", response_model=User)
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
        
        return User(
            user_id=payload.get("user_id"),
            email=payload.get("email"),
            full_name="Admin User",
            is_active=True,
            is_verified=True,
            tenant_id=payload.get("tenant_id"),
            roles=[Role(
                role_id="role-1",
                role_name="Fund Manager",
                description="Fund management role",
                permissions=payload.get("permissions", [])
            )],
            permissions=payload.get("permissions", []),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )


@router.post("/forgot-password")
async def forgot_password(request: PasswordResetRequest):
    """
    Send password reset email
    """
    logger.info(f"Password reset requested for: {request.email}")
    return {"message": "Password reset email sent"}


@router.post("/reset-password")
async def reset_password(request: PasswordReset):
    """
    Reset password with token
    """
    logger.info("Password reset completed")
    return {"message": "Password reset successfully"}


@router.post("/change-password")
async def change_password(request: PasswordChange, token: str = Depends(oauth2_scheme)):
    """
    Change user password
    """
    logger.info("Password changed successfully")
    return {"message": "Password changed successfully"}


@router.post("/verify-email")
async def verify_email(request: EmailVerification):
    """
    Verify email with token
    """
    logger.info("Email verified successfully")
    return {"message": "Email verified successfully"}


@router.post("/resend-verification")
async def resend_verification_email(token: str = Depends(oauth2_scheme)):
    """
    Resend email verification
    """
    logger.info("Verification email resent")
    return {"message": "Verification email sent"}