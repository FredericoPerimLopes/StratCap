"""
Unit tests for authentication endpoints
"""

import pytest
from fastapi.testclient import TestClient


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
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert "expires_in" in data


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
    token = login_response.json()["access_token"]
    
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
    token = login_response.json()["access_token"]
    
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