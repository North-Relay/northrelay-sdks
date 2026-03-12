"""Tests for SDK type definitions"""

import pytest
from northrelay.types import PaginatedResponse, Template


def test_paginated_response_deserializes_model_objects():
    """from_api_response should return typed model objects when model_class is given"""
    raw_api_response = {
        "success": True,
        "data": {
            "templates": [
                {
                    "id": "tpl_1",
                    "name": "Welcome",
                    "subject": "Welcome!",
                    "variables": ["name"],
                    "createdAt": "2026-01-01T00:00:00Z",
                    "updatedAt": "2026-01-01T00:00:00Z",
                },
                {
                    "id": "tpl_2",
                    "name": "Reset",
                    "subject": "Reset Password",
                    "variables": [],
                    "createdAt": "2026-01-02T00:00:00Z",
                    "updatedAt": "2026-01-02T00:00:00Z",
                },
            ]
        },
        "meta": {"page": 1, "limit": 20, "total_count": 2, "has_more": False},
    }

    result = PaginatedResponse.from_api_response(raw_api_response, model_class=Template)
    assert len(result.data) == 2
    assert isinstance(result.data[0], Template)
    assert result.data[0].name == "Welcome"
    assert result.data[0].id == "tpl_1"
    assert result.total == 2
    assert result.has_more is False


def test_paginated_response_without_model_returns_dicts():
    """from_api_response should return raw dicts when model_class is not given"""
    raw = {
        "data": {"items": [{"id": "1"}, {"id": "2"}]},
        "meta": {"page": 1, "limit": 20, "total_count": 2, "has_more": False},
    }
    result = PaginatedResponse.from_api_response(raw)
    assert len(result.data) == 2
    assert isinstance(result.data[0], dict)


from northrelay.types import ButtonStyle, CreateBrandThemeRequest


def test_button_style_enum_values():
    """ButtonStyle enum should have filled, outline, ghost"""
    assert ButtonStyle.FILLED == "filled"
    assert ButtonStyle.OUTLINE == "outline"
    assert ButtonStyle.GHOST == "ghost"


def test_create_theme_accepts_button_style_enum():
    """CreateBrandThemeRequest should accept ButtonStyle enum"""
    req = CreateBrandThemeRequest(name="Test", button_style=ButtonStyle.OUTLINE)
    dumped = req.model_dump(by_alias=True, exclude_none=True)
    assert dumped["buttonStyle"] == "outline"


def test_create_theme_accepts_button_style_string():
    """CreateBrandThemeRequest should also accept valid string values"""
    req = CreateBrandThemeRequest(name="Test", button_style="filled")
    dumped = req.model_dump(by_alias=True, exclude_none=True)
    assert dumped["buttonStyle"] == "filled"
