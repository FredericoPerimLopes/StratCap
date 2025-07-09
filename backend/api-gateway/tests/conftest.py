"""
Test configuration and fixtures
"""

import asyncio
import pytest
from fastapi.testclient import TestClient
from httpx import AsyncClient

from src.main import app


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def client():
    """Create a test client for the FastAPI app."""
    with TestClient(app) as c:
        yield c


@pytest.fixture
async def async_client():
    """Create an async test client for the FastAPI app."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def auth_headers():
    """Create authentication headers for testing."""
    # This would normally create a valid JWT token
    return {"Authorization": "Bearer test-token"}


@pytest.fixture
def mock_user():
    """Mock user data for testing."""
    return {
        "user_id": "test-user-123",
        "email": "test@stratcap.com",
        "roles": ["fund_manager"],
        "permissions": ["fund:read", "fund:write"],
        "tenant_id": "test-tenant-456"
    }