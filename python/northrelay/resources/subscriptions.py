"""Subscriptions resource - opt-in, opt-out and preferences for one address.

A *list* is a contact list (``/contacts/lists``). A *topic* is a suppression
group (``/suppression-groups``): subscribing to a topic removes an opt-out.
Unsubscribing from ``all`` marks the contact UNSUBSCRIBED and adds an
account-level suppression; bounce, complaint and manual suppressions are never
lifted by ``subscribe``.

Writes are not retried automatically (``resend_confirmation`` sends an email).
"""

from __future__ import annotations

from typing import Any, Literal, Optional, Union
from urllib.parse import quote

from northrelay.types import (
    Consent,
    ResendConfirmationResult,
    SubscribeRequest,
    SubscribeResult,
    SubscriptionStatus,
    UnsubscribeResult,
)
from northrelay.utils.http import HttpClient
from northrelay.utils.retry import RetryConfig, with_retry

ConsentInput = Optional[Union[Consent, dict[str, Any]]]


def _email_path(email: str, suffix: str = "") -> str:
    return "/api/v1/subscriptions/" + quote(email.strip(), safe="") + suffix


def _consent(consent: ConsentInput) -> dict[str, Any] | None:
    if consent is None:
        return None
    model = consent if isinstance(consent, Consent) else Consent.model_validate(consent)
    return model.model_dump(by_alias=True, exclude_none=True)


class SubscriptionsResource:
    """Subscribe, unsubscribe and manage preferences by email address"""

    def __init__(self, http: HttpClient, retry_config: RetryConfig):
        self._http = http
        self._retry_config = retry_config

    async def subscribe(
        self,
        email: str,
        *,
        first_name: str | None = None,
        last_name: str | None = None,
        phone: str | None = None,
        list_ids: list[str] | None = None,
        topic_ids: list[str] | None = None,
        tags: list[str] | None = None,
        custom_fields: dict[str, str] | None = None,
        metadata: dict[str, Any] | None = None,
        double_opt_in: bool | None = None,
        confirmation_template_id: str | None = None,
        redirect_url: str | None = None,
        resubscribe: bool | None = None,
        consent: ConsentInput = None,
    ) -> SubscribeResult:
        """Subscribe an address to lists and topics (``POST /api/v1/subscriptions``).

        Creates or updates the contact, adds it to ``list_ids``, removes any
        opt-out for ``topic_ids`` and stores consent evidence. With
        ``double_opt_in=True`` the contact stays PENDING until the recipient
        clicks the confirmation link; ``redirect_url`` (https) is where they
        land afterwards.

        Raises:
            NorthRelayError: 409 with ``details["code"]`` RECIPIENT_UNSUBSCRIBED
                (pass ``resubscribe=True`` only with fresh consent),
                RECIPIENT_SUPPRESSED (bounce/complaint/manual, cannot be
                overridden) or CONTACT_BLOCKED (complained/cleaned contact)
            NotFoundError: LIST_NOT_FOUND / TOPIC_NOT_FOUND
            ScopeError: FREE_TIER_CONTACT_LIMIT
        """
        request = SubscribeRequest.model_validate(
            {
                "email": email,
                "first_name": first_name,
                "last_name": last_name,
                "phone": phone,
                "list_ids": list_ids,
                "topic_ids": topic_ids,
                "tags": tags,
                "custom_fields": custom_fields,
                "metadata": metadata,
                "double_opt_in": double_opt_in,
                "confirmation_template_id": confirmation_template_id,
                "redirect_url": redirect_url,
                "resubscribe": resubscribe,
                "consent": consent,
            }
        )
        return await self.subscribe_request(request)

    async def subscribe_request(self, request: SubscribeRequest) -> SubscribeResult:
        """Same as ``subscribe`` with a prepared ``SubscribeRequest``"""
        payload = request.model_dump(by_alias=True, exclude_none=True)
        result = await self._http.post("/api/v1/subscriptions", json=payload)
        return SubscribeResult(**result["data"])

    async def unsubscribe(
        self,
        email: str,
        *,
        scope: Literal["all", "list", "topic"] = "all",
        list_id: str | None = None,
        topic_id: str | None = None,
        reason: str | None = None,
    ) -> UnsubscribeResult:
        """Opt an address out (``POST /api/v1/subscriptions/unsubscribe``).

        - ``scope="all"``: contact UNSUBSCRIBED + account suppression
        - ``scope="list"``: leaves ``list_id`` (membership kept as history)
        - ``scope="topic"``: opts out of ``topic_id`` and every list tagged with it

        ``changed`` is false when the address was already opted out.
        """
        if scope == "list" and not list_id:
            raise ValueError('list_id is required when scope is "list"')
        if scope == "topic" and not topic_id:
            raise ValueError('topic_id is required when scope is "topic"')
        payload: dict[str, Any] = {"email": email, "scope": scope}
        if list_id is not None:
            payload["listId"] = list_id
        if topic_id is not None:
            payload["topicId"] = topic_id
        if reason is not None:
            payload["reason"] = reason
        result = await self._http.post("/api/v1/subscriptions/unsubscribe", json=payload)
        return UnsubscribeResult(**result["data"])

    async def get(self, email: str) -> SubscriptionStatus:
        """Full subscription status of an address (``GET /api/v1/subscriptions/{email}``).

        Returns the contact (status, consent evidence), any account-level
        suppression, a pending double opt-in, every list membership and every
        topic with a ``subscribed`` flag: enough to render a preference page.
        """
        cfg = self._retry_config
        result = await with_retry(
            lambda: self._http.get(_email_path(email)),
            max_attempts=cfg.max_attempts,
            initial_delay=cfg.initial_delay,
            max_delay=cfg.max_delay,
            exponential_base=cfg.exponential_base,
        )
        return SubscriptionStatus(**result["data"])

    async def update_preferences(
        self,
        email: str,
        *,
        topics: dict[str, bool] | None = None,
        lists: dict[str, bool] | None = None,
        unsubscribe_all: bool | None = None,
        resubscribe: bool | None = None,
        consent: ConsentInput = None,
    ) -> SubscriptionStatus:
        """Update preferences (``PATCH /api/v1/subscriptions/{email}``).

        Args:
            topics: ``{topic_id: subscribed}``
            lists: ``{list_id: subscribed}``
            unsubscribe_all: Opt out of everything (other keys are ignored)
            resubscribe: Required to rejoin a list after a global unsubscribe
            consent: Evidence for the re-subscription

        Returns the updated status (same shape as ``get``).
        """
        if topics is None and lists is None and not unsubscribe_all:
            raise ValueError("Provide topics, lists or unsubscribe_all=True")
        payload: dict[str, Any] = {}
        if topics is not None:
            payload["topics"] = topics
        if lists is not None:
            payload["lists"] = lists
        if unsubscribe_all is not None:
            payload["unsubscribeAll"] = unsubscribe_all
        if resubscribe is not None:
            payload["resubscribe"] = resubscribe
        consent_payload = _consent(consent)
        if consent_payload is not None:
            payload["consent"] = consent_payload
        result = await self._http.patch(_email_path(email), json=payload)
        return SubscriptionStatus(**result["data"])

    async def resend_confirmation(self, email: str) -> ResendConfirmationResult:
        """Re-send the double opt-in email for a PENDING address subscribed via the API.

        Extends the link's expiry by 7 days. Raises ``NorthRelayError`` 409
        NO_PENDING_CONFIRMATION when nothing is pending, ``NotFoundError``
        CONTACT_NOT_FOUND when the address is not a contact.
        """
        result = await self._http.post(_email_path(email, "/resend-confirmation"))
        return ResendConfirmationResult(**result["data"])
