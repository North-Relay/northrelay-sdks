"""Tests for retry logic"""

import time
import pytest

from northrelay.exceptions import RateLimitError, ServerError
from northrelay.utils.retry import with_retry


@pytest.mark.asyncio
async def test_retry_uses_retry_after_for_rate_limit():
    """Retry should wait retry_after seconds, not exponential backoff"""
    call_times: list[float] = []
    call_count = 0

    async def flaky():
        nonlocal call_count
        call_times.append(time.monotonic())
        call_count += 1
        if call_count == 1:
            raise RateLimitError("Rate limited", retry_after=1)
        return {"success": True}

    result = await with_retry(flaky, max_attempts=3, initial_delay=10.0)
    assert result == {"success": True}
    assert call_count == 2
    # The wait should be ~1 second (retry_after), not ~10 seconds (initial_delay)
    elapsed = call_times[1] - call_times[0]
    assert elapsed < 3.0, f"Expected ~1s wait (retry_after), got {elapsed:.1f}s"


@pytest.mark.asyncio
async def test_retry_exponential_backoff_for_server_error():
    """Server errors should use exponential backoff as before"""
    call_count = 0

    async def flaky():
        nonlocal call_count
        call_count += 1
        if call_count < 3:
            raise ServerError("Server error")
        return {"success": True}

    result = await with_retry(flaky, max_attempts=3, initial_delay=0.1, max_delay=1.0)
    assert result == {"success": True}
    assert call_count == 3
