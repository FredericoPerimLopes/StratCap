"""
Unit tests for health endpoints
"""

import pytest
from fastapi.testclient import TestClient


def test_health_check(client: TestClient):
    """Test basic health check endpoint."""
    response = client.get("/api/health/")
    assert response.status_code == 200
    
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "api-gateway"
    assert "timestamp" in data
    assert "version" in data


def test_liveness_check(client: TestClient):
    """Test liveness probe endpoint."""
    response = client.get("/api/health/live")
    assert response.status_code == 200
    
    data = response.json()
    assert data["status"] == "alive"
    assert "timestamp" in data


def test_readiness_check(client: TestClient):
    """Test readiness probe endpoint."""
    response = client.get("/api/health/ready")
    assert response.status_code == 200
    
    data = response.json()
    assert "status" in data
    assert "timestamp" in data
    assert "checks" in data


def test_detailed_health_check(client: TestClient):
    """Test detailed health check endpoint."""
    response = client.get("/api/health/detailed")
    assert response.status_code == 200
    
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "api-gateway"
    assert "system" in data
    assert "process" in data
    assert "dependencies" in data