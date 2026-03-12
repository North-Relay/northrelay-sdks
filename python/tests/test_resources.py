"""Tests for SDK resource methods"""

import pytest
from northrelay.types import EmailContent, SendEmailRequest, CreateBrandThemeRequest, UpdateBrandThemeRequest


def test_email_content_subject_optional_with_template_id():
    """EmailContent should allow omitting subject when templateId is provided"""
    content = EmailContent(template_id="tpl_abc123")
    dumped = content.model_dump(by_alias=True, exclude_none=True)
    assert "subject" not in dumped
    assert dumped["templateId"] == "tpl_abc123"


def test_email_content_subject_required_without_template():
    """EmailContent should still work with subject when no templateId"""
    content = EmailContent(subject="Hello", html="<p>Hi</p>")
    dumped = content.model_dump(by_alias=True, exclude_none=True)
    assert dumped["subject"] == "Hello"


def test_send_template_payload_omits_subject():
    """send_template should not send subject='' in the payload"""
    request = SendEmailRequest(
        from_={"email": "noreply@example.com"},
        to=[{"email": "user@example.com"}],
        content={"template_id": "tpl_abc123"},
        variables={"name": "John"},
    )
    payload = request.model_dump(by_alias=True, exclude_none=True)
    assert "subject" not in payload["content"]
    assert payload["content"]["templateId"] == "tpl_abc123"


def test_send_template_payload_with_subject_override():
    """send_template should include subject when explicitly provided"""
    request = SendEmailRequest(
        from_={"email": "noreply@example.com"},
        to=[{"email": "user@example.com"}],
        content={"subject": "Custom Subject", "template_id": "tpl_abc123"},
    )
    payload = request.model_dump(by_alias=True, exclude_none=True)
    assert payload["content"]["subject"] == "Custom Subject"


def test_update_brand_theme_request_all_optional():
    """UpdateBrandThemeRequest should have all optional fields"""
    req = UpdateBrandThemeRequest(name="Updated Name")
    dumped = req.model_dump(by_alias=True, exclude_none=True)
    assert dumped == {"name": "Updated Name"}


def test_update_brand_theme_request_empty():
    """UpdateBrandThemeRequest should allow empty update"""
    req = UpdateBrandThemeRequest()
    dumped = req.model_dump(by_alias=True, exclude_none=True)
    assert dumped == {}


def test_contacts_bulk_delete_uses_correct_field_name():
    """bulk_delete should send contactIds (not ids) matching the API schema"""
    import inspect
    from northrelay.resources.contacts import ContactsResource
    source = inspect.getsource(ContactsResource.bulk_delete)
    assert "contactIds" in source, "bulk_delete must send 'contactIds' field"
    assert "_http.delete" in source, "bulk_delete must use DELETE method"
    assert "/api/v1/contacts/bulk" in source, "bulk_delete must target /api/v1/contacts/bulk"


def test_contacts_update_list_uses_patch():
    """update_list should use PATCH, not POST"""
    import inspect
    from northrelay.resources.contacts import ContactsResource
    source = inspect.getsource(ContactsResource.update_list)
    assert "_http.patch(" in source, "update_list must use PATCH method"
