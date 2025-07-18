"""
Unit tests for fund management endpoints
"""

import pytest
from datetime import datetime
from fastapi.testclient import TestClient
from src.models.fund import FundType, FundStatus


def test_create_fund(client: TestClient, auth_headers):
    """Test fund creation."""
    fund_data = {
        "fund_name": "Test Growth Fund",
        "fund_type": "private_equity",
        "inception_date": "2024-01-01T00:00:00",
        "target_size": 100000000,
        "management_fee_rate": 0.02,
        "carry_rate": 0.2,
        "description": "Test fund for unit tests"
    }
    
    response = client.post(
        "/api/funds",
        json=fund_data,
        headers=auth_headers
    )
    assert response.status_code == 201
    
    data = response.json()
    assert data["fund_name"] == fund_data["fund_name"]
    assert data["fund_type"] == fund_data["fund_type"]
    assert data["target_size"] == fund_data["target_size"]
    assert "fund_id" in data
    assert data["fund_status"] == "setup"


def test_get_funds(client: TestClient, auth_headers):
    """Test getting all funds."""
    response = client.get("/api/funds", headers=auth_headers)
    assert response.status_code == 200
    
    data = response.json()
    assert "funds" in data
    assert "total" in data
    assert "page" in data
    assert "size" in data
    assert isinstance(data["funds"], list)


def test_get_fund_by_id(client: TestClient, auth_headers):
    """Test getting a specific fund."""
    # First create a fund
    fund_data = {
        "fund_name": "Test Fund for Retrieval",
        "fund_type": "PRIVATE_EQUITY",
        "target_size": 50000000,
        "management_fee_rate": 0.02,
        "carry_rate": 0.2
    }
    
    create_response = client.post(
        "/api/funds",
        json=fund_data,
        headers=auth_headers
    )
    fund_id = create_response.json()["fund_id"]
    
    # Then retrieve it
    response = client.get(f"/api/funds/{fund_id}", headers=auth_headers)
    assert response.status_code == 200
    
    data = response.json()
    assert data["fund_id"] == fund_id
    assert data["fund_name"] == fund_data["fund_name"]


def test_get_fund_not_found(client: TestClient, auth_headers):
    """Test getting a non-existent fund."""
    response = client.get("/api/funds/non-existent-id", headers=auth_headers)
    assert response.status_code == 404


def test_update_fund(client: TestClient, auth_headers):
    """Test fund update."""
    # First create a fund
    fund_data = {
        "fund_name": "Test Fund for Update",
        "fund_type": "PRIVATE_EQUITY",
        "target_size": 75000000,
        "management_fee_rate": 0.02,
        "carry_rate": 0.2
    }
    
    create_response = client.post(
        "/api/funds",
        json=fund_data,
        headers=auth_headers
    )
    fund_id = create_response.json()["fund_id"]
    
    # Then update it
    update_data = {
        "fund_name": "Updated Fund Name",
        "target_size": 80000000,
        "description": "Updated description"
    }
    
    response = client.put(
        f"/api/funds/{fund_id}",
        json=update_data,
        headers=auth_headers
    )
    assert response.status_code == 200
    
    data = response.json()
    assert data["fund_name"] == update_data["fund_name"]
    assert data["target_size"] == update_data["target_size"]
    assert data["description"] == update_data["description"]


def test_update_fund_not_found(client: TestClient, auth_headers):
    """Test updating a non-existent fund."""
    update_data = {"fund_name": "Updated Name"}
    
    response = client.put(
        "/api/funds/non-existent-id",
        json=update_data,
        headers=auth_headers
    )
    assert response.status_code == 404


def test_delete_fund(client: TestClient, admin_auth_headers):
    """Test fund deletion."""
    # First create a fund
    fund_data = {
        "fund_name": "Test Fund for Deletion",
        "fund_type": "PRIVATE_EQUITY",
        "target_size": 60000000,
        "management_fee_rate": 0.02,
        "carry_rate": 0.2
    }
    
    create_response = client.post(
        "/api/funds",
        json=fund_data,
        headers=admin_auth_headers
    )
    fund_id = create_response.json()["fund_id"]
    
    # Then delete it
    response = client.delete(f"/api/funds/{fund_id}", headers=admin_auth_headers)
    assert response.status_code == 200
    assert response.json()["message"] == "Fund deleted successfully"
    
    # Verify it's deleted
    get_response = client.get(f"/api/funds/{fund_id}", headers=admin_auth_headers)
    assert get_response.status_code == 404


def test_delete_fund_not_found(client: TestClient, admin_auth_headers):
    """Test deleting a non-existent fund."""
    response = client.delete("/api/funds/non-existent-id", headers=admin_auth_headers)
    assert response.status_code == 404


def test_delete_fund_insufficient_permissions(client: TestClient, auth_headers):
    """Test fund deletion with insufficient permissions."""
    response = client.delete("/api/funds/some-fund-id", headers=auth_headers)
    assert response.status_code == 403


def test_get_fund_performance(client: TestClient, auth_headers):
    """Test getting fund performance metrics."""
    # First create a fund
    fund_data = {
        "fund_name": "Performance Test Fund",
        "fund_type": "PRIVATE_EQUITY",
        "target_size": 90000000,
        "management_fee_rate": 0.02,
        "carry_rate": 0.2
    }
    
    create_response = client.post(
        "/api/funds",
        json=fund_data,
        headers=auth_headers
    )
    fund_id = create_response.json()["fund_id"]
    
    # Get performance metrics
    response = client.get(f"/api/funds/{fund_id}/performance", headers=auth_headers)
    assert response.status_code == 200
    
    data = response.json()
    assert "irr" in data
    assert "moic" in data
    assert "nav" in data
    assert "committed_capital" in data
    assert "called_capital" in data
    assert "paid_in_capital" in data


def test_fund_validation_errors(client: TestClient, auth_headers):
    """Test fund creation with validation errors."""
    # Missing required fields
    invalid_data = {
        "fund_name": "Test Fund"
        # Missing fund_type, target_size, etc.
    }
    
    response = client.post(
        "/api/funds",
        json=invalid_data,
        headers=auth_headers
    )
    assert response.status_code == 422
    
    # Invalid fund type
    invalid_type_data = {
        "fund_name": "Test Fund",
        "fund_type": "INVALID_TYPE",
        "target_size": 100000000,
        "management_fee_rate": 0.02,
        "carry_rate": 0.2
    }
    
    response = client.post(
        "/api/funds",
        json=invalid_type_data,
        headers=auth_headers
    )
    assert response.status_code == 422


def test_unauthorized_access(client: TestClient):
    """Test accessing fund endpoints without authentication."""
    response = client.get("/api/funds")
    assert response.status_code == 401
    
    response = client.post("/api/funds", json={"fund_name": "Test"})
    assert response.status_code == 401