from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr


class Role(BaseModel):
    role_id: str
    role_name: str
    description: str
    permissions: List[str]


class User(BaseModel):
    user_id: str
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    is_active: bool = True
    is_verified: bool = False
    tenant_id: Optional[str] = None
    roles: List[Role] = []
    permissions: List[str] = []
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None


class LoginCredentials(BaseModel):
    email: EmailStr
    password: str
    remember_me: Optional[bool] = False


class AuthResponse(BaseModel):
    user: User
    token: str
    refresh_token: str
    expires_in: int


class TokenPayload(BaseModel):
    user_id: str
    email: str
    roles: List[str]
    permissions: List[str]
    tenant_id: Optional[str] = None
    exp: int
    iat: int


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordReset(BaseModel):
    token: str
    password: str


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


class EmailVerification(BaseModel):
    token: str