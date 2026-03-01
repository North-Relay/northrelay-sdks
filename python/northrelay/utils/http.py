"""HTTP client with retry and rate limiting"""

import httpx
from typing import Any, Optional, TypeVar, cast
from datetime import datetime

from northrelay.exceptions import (
    AuthenticationError,
    ScopeError,
    ValidationError,
    QuotaExceededError,
    RateLimitError,
    NotFoundError,
    ServerError,
    NetworkError,
)
from northrelay.types import RateLimitInfo

T = TypeVar("T")


class HttpClient:
    """HTTP client for NorthRelay API with authentication and error handling"""

    def __init__(
        self,
        base_url: str,
        api_key: str,
        timeout: float = 30.0,
    ):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.client = httpx.AsyncClient(
            base_url=self.base_url,
            timeout=timeout,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "User-Agent": "northrelay-python/1.1.0",
            },
        )
        self._rate_limit_info: Optional[RateLimitInfo] = None

    def get_rate_limit_info(self) -> Optional[RateLimitInfo]:
        """Get current rate limit information from last response"""
        return self._rate_limit_info

    def _update_rate_limit(self, response: httpx.Response) -> None:
        """Extract rate limit info from response headers"""
        headers = response.headers
        
        limit = headers.get("x-ratelimit-limit")
        remaining = headers.get("x-ratelimit-remaining")
        reset = headers.get("x-ratelimit-reset")

        if limit or remaining or reset:
            self._rate_limit_info = RateLimitInfo(
                limit=int(limit) if limit else None,
                remaining=int(remaining) if remaining else None,
                reset=datetime.fromtimestamp(int(reset)) if reset else None,
            )

    def _handle_error_response(self, response: httpx.Response) -> None:
        """Convert HTTP error responses to exceptions"""
        status_code = response.status_code
        
        try:
            error_data = response.json()
            error_message = error_data.get("message", error_data.get("error", response.text))
        except Exception:
            error_message = response.text or f"HTTP {status_code} error"

        # 401 - Authentication error
        if status_code == 401:
            raise AuthenticationError(error_message)

        # 403 - Scope / permission error
        if status_code == 403:
            raise ScopeError(error_message)

        # 400 - Validation error
        if status_code == 400:
            errors = error_data.get("errors") if isinstance(error_data, dict) else None
            raise ValidationError(error_message, errors=errors)

        # 404 - Not found
        if status_code == 404:
            raise NotFoundError(error_message)

        # 429 - Rate limit or quota
        if status_code == 429:
            retry_after = response.headers.get("retry-after")
            
            # Check if it's quota exceeded vs rate limit
            if "quota" in error_message.lower():
                raise QuotaExceededError(error_message)
            
            raise RateLimitError(
                error_message,
                retry_after=int(retry_after) if retry_after else None,
            )

        # 5xx - Server errors
        if 500 <= status_code < 600:
            raise ServerError(error_message, status_code=status_code)

        # Other errors
        response.raise_for_status()

    async def request(
        self,
        method: str,
        path: str,
        **kwargs: Any,
    ) -> httpx.Response:
        """Make HTTP request with error handling"""
        try:
            response = await self.client.request(method, path, **kwargs)
            self._update_rate_limit(response)
            
            if not response.is_success:
                self._handle_error_response(response)
            
            return response
            
        except httpx.RequestError as e:
            raise NetworkError(f"Network error: {e}", cause=e)

    async def get(self, path: str, **kwargs: Any) -> dict[str, Any]:
        """GET request"""
        response = await self.request("GET", path, **kwargs)
        return response.json()

    async def post(self, path: str, json: Any = None, **kwargs: Any) -> dict[str, Any]:
        """POST request"""
        response = await self.request("POST", path, json=json, **kwargs)
        return response.json()

    async def patch(self, path: str, json: Any = None, **kwargs: Any) -> dict[str, Any]:
        """PATCH request"""
        response = await self.request("PATCH", path, json=json, **kwargs)
        return response.json()

    async def put(self, path: str, json: Any = None, **kwargs: Any) -> dict[str, Any]:
        """PUT request"""
        response = await self.request("PUT", path, json=json, **kwargs)
        return response.json()

    async def delete(self, path: str, **kwargs: Any) -> dict[str, Any]:
        """DELETE request"""
        response = await self.request("DELETE", path, **kwargs)
        return response.json() if response.content else {}

    async def close(self) -> None:
        """Close HTTP client"""
        await self.client.aclose()

    async def __aenter__(self) -> "HttpClient":
        return self

    async def __aexit__(self, *args: Any) -> None:
        await self.close()
