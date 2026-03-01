"""Resource module"""
from __future__ import annotations

"""Emails resource - Email sending, scheduling, and validation"""

from typing import Any, Optional
from datetime import datetime

from northrelay.utils.http import HttpClient
from northrelay.utils.retry import with_retry, RetryConfig
from northrelay.types import (
    EmailAddress,
    SendEmailRequest,
    SendEmailResponse,
)


class EmailsResource:
    """Email sending and management"""

    def __init__(self, http: HttpClient, retry_config: RetryConfig):
        self._http = http
        self._retry_config = retry_config

    async def send(self, request: SendEmailRequest) -> SendEmailResponse:
        """
        Send a transactional email

        Args:
            request: Email send request with from, to, content, etc.

        Returns:
            SendEmailResponse with message_id and quota info

        Raises:
            AuthenticationError: Invalid API key
            ValidationError: Invalid request data
            QuotaExceededError: Email quota exceeded
            RateLimitError: Rate limit exceeded
            ServerError: Server error (5xx)
            NetworkError: Network/connection error

        Example:
            >>> client = NorthRelay(api_key="nr_live_...")
            >>> response = await client.emails.send(
            ...     SendEmailRequest(
            ...         from_={"email": "noreply@example.com", "name": "Example"},
            ...         to=[{"email": "user@example.com"}],
            ...         content={
            ...             "subject": "Welcome!",
            ...             "html": "<h1>Welcome to our service!</h1>",
            ...             "text": "Welcome to our service!",
            ...         },
            ...     )
            ... )
            >>> print(response.message_id)
        """
        async def _send() -> dict[str, Any]:
            # Convert Pydantic model to dict with aliases
            payload = request.model_dump(by_alias=True, exclude_none=True)
            return await self._http.post("/api/v1/emails/send", json=payload)

        response_data = await with_retry(
            _send,
            max_attempts=self._retry_config.max_attempts,
            initial_delay=self._retry_config.initial_delay,
            max_delay=self._retry_config.max_delay,
            exponential_base=self._retry_config.exponential_base,
        )

        return SendEmailResponse(**response_data)

    async def send_template(
        self,
        template_id: str,
        to: list[EmailAddress],
        variables: dict[str, Any],
        *,
        from_: Optional[EmailAddress] = None,
        cc: Optional[list[EmailAddress]] = None,
        bcc: Optional[list[EmailAddress]] = None,
        reply_to: Optional[EmailAddress] = None,
        theme_id: Optional[str] = None,
        tags: Optional[dict[str, str]] = None,
    ) -> SendEmailResponse:
        """
        Send email using a template

        Args:
            template_id: Template ID
            to: List of recipients
            variables: Template variable substitutions
            from_: Sender (optional, uses default if not provided)
            cc: CC recipients (optional)
            bcc: BCC recipients (optional)
            reply_to: Reply-to address (optional)
            theme_id: Brand theme ID (optional)
            tags: Custom tags (optional)

        Returns:
            SendEmailResponse with message_id

        Example:
            >>> await client.emails.send_template(
            ...     template_id="tpl_abc123",
            ...     to=[{"email": "user@example.com", "name": "John"}],
            ...     variables={"name": "John", "verification_code": "123456"},
            ...     from_={"email": "noreply@example.com", "name": "Example"},
            ... )
        """
        request = SendEmailRequest(
            from_=from_ or EmailAddress(email="noreply@example.com"),
            to=to,
            cc=cc,
            bcc=bcc,
            reply_to=reply_to,
            content={"subject": "", "template_id": template_id},  # Subject from template
            variables=variables,
            theme_id=theme_id,
            tags=tags,
        )

        return await self.send(request)

    async def schedule(
        self,
        request: SendEmailRequest,
        scheduled_for: datetime,
    ) -> dict[str, Any]:
        """
        Schedule an email for future delivery

        Args:
            request: Email send request
            scheduled_for: ISO 8601 timestamp for scheduled delivery

        Returns:
            Scheduled email details with schedule_id

        Example:
            >>> from datetime import datetime, timedelta
            >>> future_time = datetime.now() + timedelta(hours=2)
            >>> await client.emails.schedule(request, scheduled_for=future_time)
        """
        request.scheduled_for = scheduled_for

        async def _schedule() -> dict[str, Any]:
            payload = request.model_dump(by_alias=True, exclude_none=True)
            return await self._http.post("/api/v1/emails/schedule", json=payload)

        return await with_retry(
            _schedule,
            max_attempts=self._retry_config.max_attempts,
            initial_delay=self._retry_config.initial_delay,
        )

    async def send_batch(
        self,
        emails: list[SendEmailRequest],
    ) -> dict[str, Any]:
        """
        Send multiple emails in a batch

        Args:
            emails: List of email send requests

        Returns:
            Batch result with batch_id, accepted_count, rejected_count

        Example:
            >>> emails = [
            ...     SendEmailRequest(...),
            ...     SendEmailRequest(...),
            ... ]
            >>> result = await client.emails.send_batch(emails)
            >>> print(f"Sent {result['accepted_count']} of {len(emails)}")
        """
        async def _send_batch() -> dict[str, Any]:
            payload = {
                "emails": [
                    email.model_dump(by_alias=True, exclude_none=True)
                    for email in emails
                ]
            }
            return await self._http.post("/api/v1/emails/batch", json=payload)

        return await with_retry(
            _send_batch,
            max_attempts=self._retry_config.max_attempts,
            initial_delay=self._retry_config.initial_delay,
        )

    async def validate(self, email: str) -> dict[str, Any]:
        """
        Validate an email address

        Args:
            email: Email address to validate

        Returns:
            Validation result with valid, reason, score

        Example:
            >>> result = await client.emails.validate("user@example.com")
            >>> if result["valid"]:
            ...     print("Email is valid")
        """
        async def _validate() -> dict[str, Any]:
            return await self._http.post(
                "/api/v1/emails/validate",
                json={"email": email},
            )

        return await with_retry(_validate)
