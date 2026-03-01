"""Resources package"""

from northrelay.resources.emails import EmailsResource
from northrelay.resources.templates import TemplatesResource
from northrelay.resources.domains import DomainsResource
from northrelay.resources.webhooks import WebhooksResource
from northrelay.resources.campaigns import CampaignsResource
from northrelay.resources.contacts import ContactsResource
from northrelay.resources.brand_theme import BrandThemeResource
from northrelay.resources.api_keys import ApiKeysResource
from northrelay.resources.events import EventsResource
from northrelay.resources.infrastructure import (
    AnalyticsResource,
    MetricsResource,
    SuppressionsResource,
    SuppressionGroupsResource,
    SubusersResource,
    IpPoolsResource,
    IpsResource,
    IdentityResource,
    InboundResource,
    AdminResource,
    KeysResource,
)

__all__ = [
    "EmailsResource",
    "TemplatesResource",
    "DomainsResource",
    "WebhooksResource",
    "CampaignsResource",
    "ContactsResource",
    "BrandThemeResource",
    "ApiKeysResource",
    "EventsResource",
    "AnalyticsResource",
    "MetricsResource",
    "SuppressionsResource",
    "SuppressionGroupsResource",
    "SubusersResource",
    "IpPoolsResource",
    "IpsResource",
    "IdentityResource",
    "InboundResource",
    "AdminResource",
    "KeysResource",
]
