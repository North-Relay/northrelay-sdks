"""Retry logic with exponential backoff and retry_after support"""

import asyncio
from typing import Any, Callable, TypeVar

from northrelay.exceptions import RateLimitError, ServerError, NetworkError

T = TypeVar("T")


def is_retryable_error(exception: BaseException) -> bool:
    """Check if an exception should trigger a retry"""
    if isinstance(exception, (NetworkError, ServerError)):
        return True
    if isinstance(exception, RateLimitError):
        return hasattr(exception, "retry_after") and exception.retry_after is not None
    return False


def _get_delay(
    exception: BaseException,
    attempt: int,
    initial_delay: float,
    max_delay: float,
    exponential_base: float,
) -> float:
    """Calculate wait duration — use retry_after for rate limits, exponential backoff otherwise"""
    if isinstance(exception, RateLimitError) and exception.retry_after is not None:
        return min(float(exception.retry_after), max_delay)
    return min(initial_delay * (exponential_base ** attempt), max_delay)


async def with_retry(
    func: Callable[[], T],
    max_attempts: int = 3,
    initial_delay: float = 1.0,
    max_delay: float = 10.0,
    exponential_base: float = 2.0,
) -> T:
    """
    Execute a function with retry logic.

    For RateLimitError with retry_after, waits the server-specified duration.
    For other retryable errors, uses exponential backoff.

    Args:
        func: Async function to execute
        max_attempts: Maximum number of attempts (default: 3)
        initial_delay: Initial delay in seconds for exponential backoff (default: 1.0)
        max_delay: Maximum delay in seconds (default: 10.0)
        exponential_base: Base for exponential backoff (default: 2.0)

    Returns:
        Result of the function

    Raises:
        Last exception if all retries fail
    """
    last_exception: BaseException | None = None

    for attempt in range(max_attempts):
        try:
            return await func()
        except BaseException as exc:
            last_exception = exc
            if not is_retryable_error(exc) or attempt >= max_attempts - 1:
                raise
            delay = _get_delay(exc, attempt, initial_delay, max_delay, exponential_base)
            await asyncio.sleep(delay)

    raise last_exception  # type: ignore[misc]


class RetryConfig:
    """Retry configuration"""

    def __init__(
        self,
        max_attempts: int = 3,
        initial_delay: float = 1.0,
        max_delay: float = 10.0,
        exponential_base: float = 2.0,
    ):
        self.max_attempts = max_attempts
        self.initial_delay = initial_delay
        self.max_delay = max_delay
        self.exponential_base = exponential_base

    def to_dict(self) -> dict[str, Any]:
        return {
            "max_attempts": self.max_attempts,
            "initial_delay": self.initial_delay,
            "max_delay": self.max_delay,
            "exponential_base": self.exponential_base,
        }


# Default retry configuration
DEFAULT_RETRY_CONFIG = RetryConfig(
    max_attempts=3,
    initial_delay=1.0,
    max_delay=10.0,
    exponential_base=2.0,
)
