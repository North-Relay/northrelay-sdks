"""Test NorthRelay client initialization and basic functionality"""

import pytest
from northrelay import NorthRelay, AuthenticationError, ValidationError
from northrelay.types import SendEmailRequest


def test_client_requires_api_key():
    """Client should raise ValueError if API key is missing"""
    with pytest.raises(ValueError, match="API key is required"):
        NorthRelay(api_key="")


def test_client_validates_api_key_format():
    """Client should validate API key format"""
    with pytest.raises(ValueError, match="Invalid API key format"):
        NorthRelay(api_key="invalid_key")
    
    # Valid formats should not raise
    NorthRelay(api_key="nr_live_test123")
    NorthRelay(api_key="nr_test_test123")


def test_client_initialization():
    """Client should initialize with valid API key"""
    client = NorthRelay(
        api_key="nr_live_test123",
        base_url="https://test.example.com",
        timeout=10.0,
        max_retries=5,
    )
    
    assert client is not None
    assert client.emails is not None


def test_send_email_request_validation():
    """SendEmailRequest should validate email addresses"""
    # Valid request
    request = SendEmailRequest(
        from_={"email": "noreply@example.com", "name": "Test"},
        to=[{"email": "user@example.com"}],
        content={"subject": "Test", "html": "<p>Test</p>"},
    )
    
    assert request.from_.email == "noreply@example.com"
    assert len(request.to) == 1
    
    # Invalid email should raise validation error
    with pytest.raises(Exception):  # Pydantic ValidationError
        SendEmailRequest(
            from_={"email": "invalid-email", "name": "Test"},
            to=[{"email": "user@example.com"}],
            content={"subject": "Test", "html": "<p>Test</p>"},
        )


def test_send_email_request_aliases():
    """SendEmailRequest should handle field aliases correctly"""
    request = SendEmailRequest(
        from_={"email": "noreply@example.com"},
        to=[{"email": "user@example.com"}],
        content={"subject": "Test", "html": "<p>Test</p>"},
        reply_to={"email": "support@example.com"},
        theme_id="theme_123",
    )
    
    # Export with aliases for API
    data = request.model_dump(by_alias=True, exclude_none=True)
    
    assert "from" in data
    assert "replyTo" in data
    assert "themeId" in data
    assert data["from"]["email"] == "noreply@example.com"


@pytest.mark.asyncio
async def test_client_context_manager():
    """Client should work as async context manager"""
    async with NorthRelay(api_key="nr_live_test123") as client:
        assert client is not None
        assert client.emails is not None
    
    # Client should be closed after exit
    # (Can't easily test without mocking, but structure is validated)
