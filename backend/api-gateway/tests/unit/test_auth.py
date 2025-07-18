"""
Unit tests for authentication endpoints
"""

import pytest
from datetime import datetime
from fastapi.testclient import TestClient
from jose import jwt
from src.config.settings import settings


def test_login_success(client: TestClient):
    """Test successful login."""
    response = client.post(
        "/api/auth/login",
        data={
            "username": "admin@stratcap.com",
            "password": "admin123"
        }
    )
    assert response.status_code == 200
    
    data = response.json()
    assert "user" in data
    assert "token" in data
    assert "refresh_token" in data
    assert "expires_in" in data
    
    user = data["user"]
    assert user["email"] == "admin@stratcap.com"
    assert user["is_active"] is True
    assert len(user["roles"]) > 0
    assert len(user["permissions"]) > 0


def test_login_invalid_credentials(client: TestClient):
    """Test login with invalid credentials."""
    response = client.post(
        "/api/auth/login",
        data={
            "username": "invalid@example.com",
            "password": "wrongpassword"
        }
    )
    assert response.status_code == 401
    assert "Incorrect email or password" in response.json()["detail"]


def test_login_missing_data(client: TestClient):
    """Test login with missing data."""
    response = client.post("/api/auth/login", data={})
    assert response.status_code == 422  # Unprocessable Entity


def test_register_user(client: TestClient):
    """Test user registration."""
    response = client.post(
        "/api/auth/register",
        json={
            "email": "newuser@stratcap.com",
            "password": "securepassword123",
            "full_name": "New User",
            "organization": "Test Org"
        }
    )
    assert response.status_code == 200
    
    data = response.json()
    assert data["message"] == "User registered successfully"
    assert "user_id" in data
    assert data["email"] == "newuser@stratcap.com"


def test_refresh_token_invalid(client: TestClient):
    """Test refresh token with invalid token."""
    response = client.post(
        "/api/auth/refresh",
        json={"refresh_token": "invalid-token"}
    )
    assert response.status_code == 401


def test_logout(client: TestClient):
    """Test user logout."""
    # First login to get a token
    login_response = client.post(
        "/api/auth/login",
        data={
            "username": "admin@stratcap.com",
            "password": "admin123"
        }
    )
    token = login_response.json()["token"]
    
    # Then logout
    response = client.post(
        "/api/auth/logout",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Logged out successfully"


def test_get_current_user(client: TestClient):
    """Test getting current user information."""
    # First login to get a token
    login_response = client.post(
        "/api/auth/login",
        data={
            "username": "admin@stratcap.com",
            "password": "admin123"
        }
    )
    token = login_response.json()["token"]
    
    # Then get user info
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    
    data = response.json()
    assert "user_id" in data
    assert "email" in data
    assert "roles" in data
    assert "permissions" in data


def test_forgot_password(client: TestClient):
    """Test forgot password functionality."""
    response = client.post(
        "/api/auth/forgot-password",
        json={"email": "admin@stratcap.com"}
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Password reset email sent"


def test_reset_password(client: TestClient):
    """Test password reset functionality."""
    response = client.post(
        "/api/auth/reset-password",
        json={
            "token": "valid-reset-token",
            "password": "newpassword123"
        }
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Password reset successfully"


def test_verify_email(client: TestClient):
    """Test email verification functionality."""
    response = client.post(
        "/api/auth/verify-email",
        json={"token": "valid-verification-token"}
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Email verified successfully"


def test_refresh_token_valid(client: TestClient):
    """Test refresh token with valid token."""
    # First login to get refresh token
    login_response = client.post(
        "/api/auth/login",
        data={
            "username": "admin@stratcap.com",
            "password": "admin123"
        }
    )
    refresh_token = login_response.json()["refresh_token"]
    
    # Use refresh token to get new access token
    response = client.post(
        "/api/auth/refresh",
        json={"refresh_token": refresh_token}
    )
    assert response.status_code == 200
    
    data = response.json()
    assert "token" in data
    assert "refresh_token" in data
    assert "expires_in" in data