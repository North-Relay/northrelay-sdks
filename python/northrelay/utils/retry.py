"""Retry logic with exponential backoff using tenacity"""

from typing import Any, Callable, TypeVar
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
    RetryCallState,
)

from northrelay.exceptions import RateLimitError, ServerError, NetworkError

T = TypeVar("T")


def is_retryable_error(exception: BaseException) -> bool:
    """Check if an exception should trigger a retry"""
    if isinstance(exception, (NetworkError, ServerError)):
        return True
    
    if isinstance(exception, RateLimitError):
        # Only retry rate limits if retry_after is provided
        return hasattr(exception, "retry_after") and exception.retry_after is not None
    
    return False


def create_retry_decorator(
    max_attempts: int = 3,
    initial_delay: float = 1.0,
    max_delay: float = 10.0,
    exponential_base: float = 2.0,
) -> Any:
    """
    Create a retry decorator with exponential backoff
    
    Args:
        max_attempts: Maximum number of retry attempts
        initial_delay: Initial delay in seconds
        max_delay: Maximum delay in seconds
        exponential_base: Base for exponential backoff
    
    Returns:
        Tenacity retry decorator
    """
    return retry(
        stop=stop_after_attempt(max_attempts),
        wait=wait_exponential(
            multiplier=initial_delay,
            max=max_delay,
            exp_base=exponential_base,
        ),
        retry=retry_if_exception_type((NetworkError, ServerError, RateLimitError)),
        reraise=True,
    )


async def with_retry(
    func: Callable[[], T],
    max_attempts: int = 3,
    initial_delay: float = 1.0,
    max_delay: float = 10.0,
    exponential_base: float = 2.0,
) -> T:
    """
    Execute a function with retry logic
    
    Args:
        func: Async function to execute
        max_attempts: Maximum number of retry attempts (default: 3)
        initial_delay: Initial delay in seconds (default: 1.0)
        max_delay: Maximum delay in seconds (default: 10.0)
        exponential_base: Base for exponential backoff (default: 2.0)
    
    Returns:
        Result of the function
    
    Raises:
        Last exception if all retries fail
    
    Example:
        >>> async def send_email():
        ...     return await client.post("/emails/send", data)
        >>> result = await with_retry(send_email, max_attempts=3)
    """
    retry_decorator = create_retry_decorator(
        max_attempts=max_attempts,
        initial_delay=initial_delay,
        max_delay=max_delay,
        exponential_base=exponential_base,
    )
    
    return await retry_decorator(func)()


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
