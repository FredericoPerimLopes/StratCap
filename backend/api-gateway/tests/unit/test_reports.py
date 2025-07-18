"""
Unit tests for reporting endpoints
"""

import pytest
from datetime import datetime, date
from fastapi.testclient import TestClient


def test_generate_fund_performance_report(client: TestClient, auth_headers):
    """Test generating fund performance report."""
    report_data = {
        "fund_id": "test-fund-123",
        "report_type": "PERFORMANCE",
        "start_date": "2023-01-01",
        "end_date": "2023-12-31",
        "format": "PDF"
    }
    
    response = client.post(
        "/api/reports/generate",
        json=report_data,
        headers=auth_headers
    )
    assert response.status_code == 202
    
    data = response.json()
    assert "report_id" in data
    assert data["status"] == "PROCESSING"
    assert data["message"] == "Report generation started"


def test_generate_investor_statement(client: TestClient, auth_headers):
    """Test generating investor statement."""
    report_data = {
        "investor_id": "test-investor-123",
        "fund_id": "test-fund-123",
        "report_type": "INVESTOR_STATEMENT",
        "quarter": "Q4",
        "year": 2023,
        "format": "PDF"
    }
    
    response = client.post(
        "/api/reports/generate",
        json=report_data,
        headers=auth_headers
    )
    assert response.status_code == 202
    
    data = response.json()
    assert "report_id" in data
    assert data["status"] == "PROCESSING"


def test_generate_capital_call_notice(client: TestClient, auth_headers):
    """Test generating capital call notice."""
    report_data = {
        "fund_id": "test-fund-123",
        "report_type": "CAPITAL_CALL",
        "call_amount": 5000000,
        "due_date": "2024-02-15",
        "format": "PDF"
    }
    
    response = client.post(
        "/api/reports/generate",
        json=report_data,
        headers=auth_headers
    )
    assert response.status_code == 202
    
    data = response.json()
    assert "report_id" in data
    assert data["status"] == "PROCESSING"


def test_generate_distribution_notice(client: TestClient, auth_headers):
    """Test generating distribution notice."""
    report_data = {
        "fund_id": "test-fund-123",
        "report_type": "DISTRIBUTION",
        "distribution_amount": 3000000,
        "distribution_date": "2024-03-01",
        "format": "PDF"
    }
    
    response = client.post(
        "/api/reports/generate",
        json=report_data,
        headers=auth_headers
    )
    assert response.status_code == 202
    
    data = response.json()
    assert "report_id" in data
    assert data["status"] == "PROCESSING"


def test_get_reports(client: TestClient, auth_headers):
    """Test getting all reports."""
    response = client.get("/api/reports", headers=auth_headers)
    assert response.status_code == 200
    
    data = response.json()
    assert "reports" in data
    assert "total" in data
    assert "page" in data
    assert "size" in data
    assert isinstance(data["reports"], list)


def test_get_report_by_id(client: TestClient, auth_headers):
    """Test getting a specific report."""
    # First generate a report
    report_data = {
        "fund_id": "test-fund-123",
        "report_type": "PERFORMANCE",
        "start_date": "2023-01-01",
        "end_date": "2023-12-31",
        "format": "PDF"
    }
    
    create_response = client.post(
        "/api/reports/generate",
        json=report_data,
        headers=auth_headers
    )
    report_id = create_response.json()["report_id"]
    
    # Then retrieve it
    response = client.get(f"/api/reports/{report_id}", headers=auth_headers)
    assert response.status_code == 200
    
    data = response.json()
    assert data["report_id"] == report_id
    assert data["report_type"] == report_data["report_type"]


def test_get_report_not_found(client: TestClient, auth_headers):
    """Test getting a non-existent report."""
    response = client.get("/api/reports/non-existent-id", headers=auth_headers)
    assert response.status_code == 404


def test_download_report(client: TestClient, auth_headers):
    """Test downloading a completed report."""
    # First generate a report
    report_data = {
        "fund_id": "test-fund-123",
        "report_type": "PERFORMANCE",
        "start_date": "2023-01-01",
        "end_date": "2023-12-31",
        "format": "PDF"
    }
    
    create_response = client.post(
        "/api/reports/generate",
        json=report_data,
        headers=auth_headers
    )
    report_id = create_response.json()["report_id"]
    
    # Try to download it
    response = client.get(f"/api/reports/{report_id}/download", headers=auth_headers)
    # Report might not be ready yet, so we check for appropriate response
    assert response.status_code in [200, 202, 404]


def test_delete_report(client: TestClient, admin_auth_headers):
    """Test report deletion."""
    # First generate a report
    report_data = {
        "fund_id": "test-fund-123",
        "report_type": "PERFORMANCE",
        "start_date": "2023-01-01",
        "end_date": "2023-12-31",
        "format": "PDF"
    }
    
    create_response = client.post(
        "/api/reports/generate",
        json=report_data,
        headers=admin_auth_headers
    )
    report_id = create_response.json()["report_id"]
    
    # Then delete it
    response = client.delete(f"/api/reports/{report_id}", headers=admin_auth_headers)
    assert response.status_code == 200
    assert response.json()["message"] == "Report deleted successfully"


def test_delete_report_insufficient_permissions(client: TestClient, auth_headers):
    """Test report deletion with insufficient permissions."""
    response = client.delete("/api/reports/some-report-id", headers=auth_headers)
    assert response.status_code == 403


def test_get_fund_reports(client: TestClient, auth_headers):
    """Test getting reports for a specific fund."""
    fund_id = "test-fund-123"
    
    response = client.get(f"/api/reports/fund/{fund_id}", headers=auth_headers)
    assert response.status_code == 200
    
    data = response.json()
    assert "reports" in data
    assert isinstance(data["reports"], list)


def test_get_investor_reports(client: TestClient, auth_headers):
    """Test getting reports for a specific investor."""
    investor_id = "test-investor-123"
    
    response = client.get(f"/api/reports/investor/{investor_id}", headers=auth_headers)
    assert response.status_code == 200
    
    data = response.json()
    assert "reports" in data
    assert isinstance(data["reports"], list)


def test_generate_regulatory_report(client: TestClient, auth_headers):
    """Test generating regulatory report."""
    report_data = {
        "fund_id": "test-fund-123",
        "report_type": "REGULATORY",
        "regulatory_type": "SEC_FORM_D",
        "reporting_period": "2023-Q4",
        "format": "PDF"
    }
    
    response = client.post(
        "/api/reports/generate",
        json=report_data,
        headers=auth_headers
    )
    assert response.status_code == 202
    
    data = response.json()
    assert "report_id" in data
    assert data["status"] == "PROCESSING"


def test_schedule_recurring_report(client: TestClient, auth_headers):
    """Test scheduling a recurring report."""
    schedule_data = {
        "fund_id": "test-fund-123",
        "report_type": "PERFORMANCE",
        "frequency": "QUARTERLY",
        "format": "PDF",
        "recipients": ["admin@stratcap.com", "investor@test.com"]
    }
    
    response = client.post(
        "/api/reports/schedule",
        json=schedule_data,
        headers=auth_headers
    )
    assert response.status_code == 201
    
    data = response.json()
    assert "schedule_id" in data
    assert data["frequency"] == schedule_data["frequency"]
    assert data["message"] == "Report scheduled successfully"


def test_get_scheduled_reports(client: TestClient, auth_headers):
    """Test getting scheduled reports."""
    response = client.get("/api/reports/scheduled", headers=auth_headers)
    assert response.status_code == 200
    
    data = response.json()
    assert "schedules" in data
    assert isinstance(data["schedules"], list)


def test_report_validation_errors(client: TestClient, auth_headers):
    """Test report generation with validation errors."""
    # Missing required fields
    invalid_data = {
        "report_type": "PERFORMANCE"
        # Missing fund_id, dates, etc.
    }
    
    response = client.post(
        "/api/reports/generate",
        json=invalid_data,
        headers=auth_headers
    )
    assert response.status_code == 422
    
    # Invalid report type
    invalid_type_data = {
        "fund_id": "test-fund-123",
        "report_type": "INVALID_TYPE",
        "start_date": "2023-01-01",
        "end_date": "2023-12-31",
        "format": "PDF"
    }
    
    response = client.post(
        "/api/reports/generate",
        json=invalid_type_data,
        headers=auth_headers
    )
    assert response.status_code == 422
    
    # Invalid date range
    invalid_date_data = {
        "fund_id": "test-fund-123",
        "report_type": "PERFORMANCE",
        "start_date": "2023-12-31",
        "end_date": "2023-01-01",  # End date before start date
        "format": "PDF"
    }
    
    response = client.post(
        "/api/reports/generate",
        json=invalid_date_data,
        headers=auth_headers
    )
    assert response.status_code == 422


def test_bulk_report_generation(client: TestClient, auth_headers):
    """Test bulk report generation."""
    bulk_data = {
        "report_type": "INVESTOR_STATEMENT",
        "fund_id": "test-fund-123",
        "quarter": "Q4",
        "year": 2023,
        "format": "PDF",
        "investor_ids": ["inv-1", "inv-2", "inv-3"]
    }
    
    response = client.post(
        "/api/reports/bulk-generate",
        json=bulk_data,
        headers=auth_headers
    )
    assert response.status_code == 202
    
    data = response.json()
    assert "batch_id" in data
    assert data["status"] == "PROCESSING"
    assert data["message"] == "Bulk report generation started"


def test_unauthorized_access(client: TestClient):
    """Test accessing report endpoints without authentication."""
    response = client.get("/api/reports")
    assert response.status_code == 401
    
    response = client.post("/api/reports/generate", json={"report_type": "PERFORMANCE"})
    assert response.status_code == 401