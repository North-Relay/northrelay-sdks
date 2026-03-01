"""Custom exceptions for NorthRelay SDK"""

from typing import Any, Optional


class NorthRelayError(Exception):
    """Base exception for all NorthRelay SDK errors"""

    def __init__(self, message: str, status_code: Optional[int] = None, **kwargs: Any):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.details = kwargs


class AuthenticationError(NorthRelayError):
    """Invalid API key or authentication failure (401)"""

    def __init__(self, message: str = "Invalid API key", **kwargs: Any):
        super().__init__(message, status_code=401, **kwargs)


class ScopeError(NorthRelayError):
    """Insufficient permissions / scope error (403)"""

    def __init__(self, message: str = "Insufficient permissions", **kwargs: Any):
        super().__init__(message, status_code=403, **kwargs)


class ValidationError(NorthRelayError):
    """Request validation error (400)"""

    def __init__(self, message: str, errors: Optional[list[dict[str, Any]]] = None, **kwargs: Any):
        super().__init__(message, status_code=400, **kwargs)
        self.errors = errors or []


class QuotaExceededError(NorthRelayError):
    """Email quota exceeded (429 with quota reason)"""

    def __init__(
        self,
        message: str = "Email quota exceeded",
        quota_limit: Optional[int] = None,
        quota_used: Optional[int] = None,
        **kwargs: Any,
    ):
        super().__init__(message, status_code=429, **kwargs)
        self.quota_limit = quota_limit
        self.quota_used = quota_used


class RateLimitError(NorthRelayError):
    """Rate limit exceeded (429)"""

    def __init__(
        self,
        message: str = "Rate limit exceeded",
        retry_after: Optional[int] = None,
        **kwargs: Any,
    ):
        super().__init__(message, status_code=429, **kwargs)
        self.retry_after = retry_after  # seconds


class NotFoundError(NorthRelayError):
    """Resource not found (404)"""

    def __init__(self, message: str = "Resource not found", **kwargs: Any):
        super().__init__(message, status_code=404, **kwargs)


class ServerError(NorthRelayError):
    """Server error (5xx)"""

    def __init__(self, message: str = "Server error", status_code: int = 500, **kwargs: Any):
        super().__init__(message, status_code=status_code, **kwargs)


class NetworkError(NorthRelayError):
    """Network / connection error"""

    def __init__(self, message: str = "Network error", cause: Optional[Exception] = None):
        super().__init__(message, status_code=None)
        self.cause = cause
