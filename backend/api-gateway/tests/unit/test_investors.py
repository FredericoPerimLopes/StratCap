"""
Unit tests for investor management endpoints
"""

import pytest
from datetime import datetime
from fastapi.testclient import TestClient


def test_create_investor(client: TestClient, auth_headers):
    """Test investor creation."""
    investor_data = {
        "investor_name": "Test Pension Fund",
        "investor_type": "PENSION_FUND",
        "email": "test@testpension.com",
        "phone": "+1-555-0123",
        "address": {
            "street": "123 Main St",
            "city": "New York",
            "state": "NY",
            "zip_code": "10001",
            "country": "USA"
        },
        "accredited_investor": True,
        "qualified_purchaser": True
    }
    
    response = client.post(
        "/api/investors",
        json=investor_data,
        headers=auth_headers
    )
    assert response.status_code == 201
    
    data = response.json()
    assert data["investor_name"] == investor_data["investor_name"]
    assert data["investor_type"] == investor_data["investor_type"]
    assert data["email"] == investor_data["email"]
    assert "investor_id" in data
    assert data["is_active"] is True


def test_get_investors(client: TestClient, auth_headers):
    """Test getting all investors."""
    response = client.get("/api/investors", headers=auth_headers)
    assert response.status_code == 200
    
    data = response.json()
    assert "investors" in data
    assert "total" in data
    assert "page" in data
    assert "size" in data
    assert isinstance(data["investors"], list)


def test_get_investor_by_id(client: TestClient, auth_headers):
    """Test getting a specific investor."""
    # First create an investor
    investor_data = {
        "investor_name": "Test Individual Investor",
        "investor_type": "INDIVIDUAL",
        "email": "individual@test.com",
        "phone": "+1-555-0456",
        "accredited_investor": True,
        "qualified_purchaser": False
    }
    
    create_response = client.post(
        "/api/investors",
        json=investor_data,
        headers=auth_headers
    )
    investor_id = create_response.json()["investor_id"]
    
    # Then retrieve it
    response = client.get(f"/api/investors/{investor_id}", headers=auth_headers)
    assert response.status_code == 200
    
    data = response.json()
    assert data["investor_id"] == investor_id
    assert data["investor_name"] == investor_data["investor_name"]


def test_get_investor_not_found(client: TestClient, auth_headers):
    """Test getting a non-existent investor."""
    response = client.get("/api/investors/non-existent-id", headers=auth_headers)
    assert response.status_code == 404


def test_update_investor(client: TestClient, auth_headers):
    """Test investor update."""
    # First create an investor
    investor_data = {
        "investor_name": "Test Corporation",
        "investor_type": "CORPORATION",
        "email": "corp@test.com",
        "phone": "+1-555-0789",
        "accredited_investor": True,
        "qualified_purchaser": True
    }
    
    create_response = client.post(
        "/api/investors",
        json=investor_data,
        headers=auth_headers
    )
    investor_id = create_response.json()["investor_id"]
    
    # Then update it
    update_data = {
        "investor_name": "Updated Corporation Name",
        "email": "updated@test.com",
        "phone": "+1-555-9999"
    }
    
    response = client.put(
        f"/api/investors/{investor_id}",
        json=update_data,
        headers=auth_headers
    )
    assert response.status_code == 200
    
    data = response.json()
    assert data["investor_name"] == update_data["investor_name"]
    assert data["email"] == update_data["email"]
    assert data["phone"] == update_data["phone"]


def test_update_investor_not_found(client: TestClient, auth_headers):
    """Test updating a non-existent investor."""
    update_data = {"investor_name": "Updated Name"}
    
    response = client.put(
        "/api/investors/non-existent-id",
        json=update_data,
        headers=auth_headers
    )
    assert response.status_code == 404


def test_delete_investor(client: TestClient, admin_auth_headers):
    """Test investor deletion."""
    # First create an investor
    investor_data = {
        "investor_name": "Test Foundation",
        "investor_type": "FOUNDATION",
        "email": "foundation@test.com",
        "accredited_investor": True,
        "qualified_purchaser": True
    }
    
    create_response = client.post(
        "/api/investors",
        json=investor_data,
        headers=admin_auth_headers
    )
    investor_id = create_response.json()["investor_id"]
    
    # Then delete it
    response = client.delete(f"/api/investors/{investor_id}", headers=admin_auth_headers)
    assert response.status_code == 200
    assert response.json()["message"] == "Investor deleted successfully"
    
    # Verify it's deleted
    get_response = client.get(f"/api/investors/{investor_id}", headers=admin_auth_headers)
    assert get_response.status_code == 404


def test_delete_investor_insufficient_permissions(client: TestClient, auth_headers):
    """Test investor deletion with insufficient permissions."""
    response = client.delete("/api/investors/some-investor-id", headers=auth_headers)
    assert response.status_code == 403


def test_get_investor_commitments(client: TestClient, auth_headers):
    """Test getting investor commitments."""
    # First create an investor
    investor_data = {
        "investor_name": "Commitment Test Investor",
        "investor_type": "PENSION_FUND",
        "email": "commitments@test.com",
        "accredited_investor": True,
        "qualified_purchaser": True
    }
    
    create_response = client.post(
        "/api/investors",
        json=investor_data,
        headers=auth_headers
    )
    investor_id = create_response.json()["investor_id"]
    
    # Get commitments
    response = client.get(f"/api/investors/{investor_id}/commitments", headers=auth_headers)
    assert response.status_code == 200
    
    data = response.json()
    assert "commitments" in data
    assert isinstance(data["commitments"], list)


def test_update_kyc_status(client: TestClient, auth_headers):
    """Test updating investor KYC status."""
    # First create an investor
    investor_data = {
        "investor_name": "KYC Test Investor",
        "investor_type": "INDIVIDUAL",
        "email": "kyc@test.com",
        "accredited_investor": True,
        "qualified_purchaser": False
    }
    
    create_response = client.post(
        "/api/investors",
        json=investor_data,
        headers=auth_headers
    )
    investor_id = create_response.json()["investor_id"]
    
    # Update KYC status
    kyc_data = {"kyc_status": "APPROVED"}
    
    response = client.patch(
        f"/api/investors/{investor_id}/kyc",
        json=kyc_data,
        headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()["kyc_status"] == "APPROVED"


def test_update_aml_status(client: TestClient, auth_headers):
    """Test updating investor AML status."""
    # First create an investor
    investor_data = {
        "investor_name": "AML Test Investor",
        "investor_type": "CORPORATION",
        "email": "aml@test.com",
        "accredited_investor": True,
        "qualified_purchaser": True
    }
    
    create_response = client.post(
        "/api/investors",
        json=investor_data,
        headers=auth_headers
    )
    investor_id = create_response.json()["investor_id"]
    
    # Update AML status
    aml_data = {"aml_status": "APPROVED"}
    
    response = client.patch(
        f"/api/investors/{investor_id}/aml",
        json=aml_data,
        headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()["aml_status"] == "APPROVED"


def test_investor_validation_errors(client: TestClient, auth_headers):
    """Test investor creation with validation errors."""
    # Missing required fields
    invalid_data = {
        "investor_name": "Test Investor"
        # Missing investor_type, email, etc.
    }
    
    response = client.post(
        "/api/investors",
        json=invalid_data,
        headers=auth_headers
    )
    assert response.status_code == 422
    
    # Invalid investor type
    invalid_type_data = {
        "investor_name": "Test Investor",
        "investor_type": "INVALID_TYPE",
        "email": "invalid@test.com"
    }
    
    response = client.post(
        "/api/investors",
        json=invalid_type_data,
        headers=auth_headers
    )
    assert response.status_code == 422
    
    # Invalid email format
    invalid_email_data = {
        "investor_name": "Test Investor",
        "investor_type": "INDIVIDUAL",
        "email": "invalid-email-format"
    }
    
    response = client.post(
        "/api/investors",
        json=invalid_email_data,
        headers=auth_headers
    )
    assert response.status_code == 422


def test_search_investors(client: TestClient, auth_headers):
    """Test searching investors."""
    # Search by name
    response = client.get(
        "/api/investors/search?name=Test",
        headers=auth_headers
    )
    assert response.status_code == 200
    
    data = response.json()
    assert "investors" in data
    assert isinstance(data["investors"], list)
    
    # Search by type
    response = client.get(
        "/api/investors/search?type=PENSION_FUND",
        headers=auth_headers
    )
    assert response.status_code == 200


def test_unauthorized_access(client: TestClient):
    """Test accessing investor endpoints without authentication."""
    response = client.get("/api/investors")
    assert response.status_code == 401
    
    response = client.post("/api/investors", json={"investor_name": "Test"})
    assert response.status_code == 401