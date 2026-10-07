"""Signup forms resource - hosted/embeddable forms that feed a contact list.

Methods return the ``data`` object of the API response as a dict. Writes are
not retried automatically.
"""

from __future__ import annotations

import builtins
from typing import Any
from urllib.parse import quote

from northrelay.utils.http import HttpClient
from northrelay.utils.retry import RetryConfig, with_retry


def _data(result: dict[str, Any]) -> dict[str, Any]:
    data = result.get("data", result)
    return data if isinstance(data, dict) else {"value": data}


def _path(form_id: str, suffix: str = "") -> str:
    return "/api/v1/forms/" + quote(form_id, safe="") + suffix


_UPDATE_FIELDS = {
    "name": "name",
    "status": "status",
    "require_confirmation": "requireConfirmation",
    "turnstile_enabled": "turnstileEnabled",
    "send_welcome_email": "sendWelcomeEmail",
    "confirmation_template_id": "confirmationTemplateId",
    "welcome_template_id": "welcomeTemplateId",
    "headline": "headline",
    "subheadline": "subheadline",
    "submit_button_label": "submitButtonLabel",
    "success_message": "successMessage",
    "success_redirect_url": "successRedirectUrl",
    "allowed_origins": "allowedOrigins",
    "powered_by_disabled": "poweredByDisabled",
}


class FormsResource:
    """Signup forms (scopes contacts:read / contacts:write)"""

    def __init__(self, http: HttpClient, retry_config: RetryConfig):
        self._http = http
        self._retry_config = retry_config

    async def list(self, *, limit: int = 50, offset: int = 0) -> dict[str, Any]:
        """List active forms: ``{forms, total, limit, offset}``"""
        params = {"limit": limit, "offset": offset}
        result = await with_retry(lambda: self._http.get("/api/v1/forms", params=params))
        return _data(result)

    async def get(self, form_id: str) -> dict[str, Any]:
        """Get a form with its fields and list: ``{form}``"""
        result = await with_retry(lambda: self._http.get(_path(form_id)))
        return _data(result)

    async def create(self, *, list_id: str, name: str, slug: str) -> dict[str, Any]:
        """Create a DRAFT form with an email field.

        Publish it with ``update(form_id, status="PUBLISHED")``.
        """
        result = await self._http.post(
            "/api/v1/forms", json={"listId": list_id, "name": name, "slug": slug}
        )
        return _data(result)

    async def update(self, form_id: str, **fields: Any) -> dict[str, Any]:
        """Update a form.

        Keyword arguments: name, status (DRAFT, PUBLISHED, ARCHIVED),
        require_confirmation (double opt-in), turnstile_enabled,
        send_welcome_email, confirmation_template_id (must use
        ``{{confirm_url}}``), welcome_template_id, headline, subheadline,
        submit_button_label, success_message, success_redirect_url,
        allowed_origins, powered_by_disabled. Pass ``None`` to clear a
        nullable field.
        """
        unknown = set(fields) - set(_UPDATE_FIELDS)
        if unknown:
            raise TypeError(f"Unknown form field(s): {', '.join(sorted(unknown))}")
        payload = {_UPDATE_FIELDS[k]: v for k, v in fields.items()}
        result = await self._http.patch(_path(form_id), json=payload)
        return _data(result)

    async def set_fields(
        self, form_id: str, fields: builtins.list[dict[str, Any]]
    ) -> dict[str, Any]:
        """Replace the form's fields (``PUT /forms/{id}/fields``).

        Each field: ``fieldKey``, ``label``, ``type`` (TEXT, EMAIL, NUMBER,
        SELECT, RADIO, CHECKBOX, DATE, TEXTAREA, HIDDEN), optional
        ``required``, ``helpText``, ``placeholder``, ``validationRules``,
        ``defaultValue``, ``bindsToContact`` (EMAIL, FIRST_NAME, LAST_NAME,
        PHONE). One EMAIL field bound to EMAIL is required.
        """
        result = await self._http.put(_path(form_id, "/fields"), json={"fields": fields})
        return _data(result)

    async def delete(self, form_id: str) -> dict[str, Any]:
        """Archive a form"""
        result = await self._http.delete(_path(form_id))
        return _data(result)

    async def submit(self, form_id: str, values: dict[str, Any]) -> dict[str, Any]:
        """Submit a PUBLISHED form server-side (public endpoint, keyed by ``fieldKey``).

        Returns ``{ok, requiresConfirmation}``. Prefer
        ``client.subscriptions.subscribe`` from your backend: it records
        consent evidence and does not depend on the form's CAPTCHA settings.
        """
        result = await self._http.post(_path(form_id, "/submit"), json=values)
        return _data(result)
