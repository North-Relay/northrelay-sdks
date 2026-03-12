"""Resource module"""
from __future__ import annotations

"""Templates resource - Template management"""

from typing import Any, Optional
from northrelay.utils.http import HttpClient
from northrelay.utils.retry import with_retry, RetryConfig
from northrelay.types import (
    Template,
    CreateTemplateRequest,
    UpdateTemplateRequest,
    PaginatedResponse,
    AddBlockRequest,
    UpdateBlockRequest,
    TestSendRequest,
    ImportTemplateRequest,
)


class TemplatesResource:
    """Template management"""

    def __init__(self, http: HttpClient, retry_config: RetryConfig):
        self._http = http
        self._retry_config = retry_config

    async def list(
        self,
        *,
        page: int = 1,
        limit: int = 20,
        search: Optional[str] = None,
        active_only: bool = False,
    ) -> PaginatedResponse:
        """
        List all templates

        Args:
            page: Page number (default: 1)
            limit: Items per page (default: 20)
            search: Search query for template name
            active_only: Only return active templates

        Returns:
            PaginatedResponse with templates

        Example:
            >>> templates = await client.templates.list(search="welcome", limit=10)
            >>> for template in templates.data:
            ...     print(template.name)
        """
        params = {"page": page, "limit": limit}
        if search:
            params["search"] = search
        if active_only:
            params["activeOnly"] = "true"

        async def _list() -> dict[str, Any]:
            return await self._http.get("/api/v1/templates", params=params)

        response = await with_retry(
            _list,
            max_attempts=self._retry_config.max_attempts,
            initial_delay=self._retry_config.initial_delay,
        )
        return PaginatedResponse.from_api_response(response, model_class=Template)

    async def get(self, id: str) -> Template:
        """
        Get a template by ID

        Args:
            id: Template ID

        Returns:
            Template details

        Example:
            >>> template = await client.templates.get("tpl_abc123")
            >>> print(template.subject)
        """
        async def _get() -> dict[str, Any]:
            result = await self._http.get(f"/api/v1/templates/{id}")
            return result["data"]

        response = await with_retry(_get)
        return Template(**response)

    async def create(self, request: CreateTemplateRequest) -> Template:
        """
        Create a new template

        Args:
            request: Template creation request

        Returns:
            Created template

        Example:
            >>> template = await client.templates.create(
            ...     CreateTemplateRequest(
            ...         name="Welcome Email",
            ...         subject="Welcome {{name}}!",
            ...         html="<h1>Hello {{name}}</h1>",
            ...         text="Hello {{name}}!",
            ...     )
            ... )
        """
        async def _create() -> dict[str, Any]:
            payload = request.model_dump(by_alias=True, exclude_none=True)
            result = await self._http.post("/api/v1/templates", json=payload)
            return result["data"]

        response = await with_retry(
            _create,
            max_attempts=self._retry_config.max_attempts,
            initial_delay=self._retry_config.initial_delay,
        )
        return Template(**response)

    async def update(self, id: str, request: UpdateTemplateRequest) -> Template:
        """
        Update a template

        Args:
            id: Template ID
            request: Template update request

        Returns:
            Updated template

        Example:
            >>> template = await client.templates.update(
            ...     "tpl_abc123",
            ...     UpdateTemplateRequest(subject="New Subject"),
            ... )
        """
        async def _update() -> dict[str, Any]:
            payload = request.model_dump(by_alias=True, exclude_none=True)
            result = await self._http.patch(f"/api/v1/templates/{id}", json=payload)
            return result["data"]

        response = await with_retry(_update)
        return Template(**response)

    async def delete(self, id: str) -> dict[str, Any]:
        """
        Delete a template

        Args:
            id: Template ID

        Returns:
            Deletion confirmation

        Example:
            >>> await client.templates.delete("tpl_abc123")
        """
        async def _delete() -> dict[str, Any]:
            return await self._http.delete(f"/api/v1/templates/{id}")

        return await with_retry(_delete)

    async def preview(
        self, id: str, variables: dict[str, str]
    ) -> dict[str, Any]:
        """
        Preview a template with variables

        Args:
            id: Template ID
            variables: Template variables

        Returns:
            Rendered template preview (subject, html, text)

        Example:
            >>> preview = await client.templates.preview(
            ...     "tpl_abc123",
            ...     {"name": "John", "code": "123456"},
            ... )
            >>> print(preview["data"]["html"])
        """
        async def _preview() -> dict[str, Any]:
            return await self._http.post(
                f"/api/v1/templates/{id}/preview",
                json={"variables": variables},
            )

        return await with_retry(_preview)

    async def extract_variables(self, content: str) -> list[str]:
        """
        Extract variables from template content

        Args:
            content: Template HTML or text content

        Returns:
            List of variable names found in content

        Example:
            >>> variables = await client.templates.extract_variables(
            ...     "Hello {{name}}, your code is {{code}}"
            ... )
            >>> print(variables)  # ["name", "code"]
        """
        async def _extract() -> dict[str, Any]:
            return await self._http.post(
                "/api/v1/templates/extract-variables",
                json={"content": content},
            )

        response = await with_retry(_extract)
        return response["data"]["variables"]

    # ===== Block Operations =====

    async def get_blocks(self, id: str) -> dict[str, Any]:
        """
        Get all blocks for a template

        Args:
            id: Template ID

        Returns:
            Block data for the template
        """
        async def _inner() -> dict[str, Any]:
            return await self._http.get(f"/api/v1/templates/{id}/blocks")

        return await with_retry(_inner)

    async def add_block(self, id: str, request: AddBlockRequest) -> dict[str, Any]:
        """
        Add a block to a template

        Args:
            id: Template ID
            request: Block creation request

        Returns:
            Created block data
        """
        async def _inner() -> dict[str, Any]:
            payload = request.model_dump(by_alias=True, exclude_none=True)
            return await self._http.post(f"/api/v1/templates/{id}/blocks", json=payload)

        return await with_retry(_inner)

    async def update_block(
        self, id: str, block_id: str, request: UpdateBlockRequest
    ) -> dict[str, Any]:
        """
        Update a block in a template

        Args:
            id: Template ID
            block_id: Block ID
            request: Block update request

        Returns:
            Updated block data
        """
        async def _inner() -> dict[str, Any]:
            payload = request.model_dump(by_alias=True, exclude_none=True)
            return await self._http.patch(
                f"/api/v1/templates/{id}/blocks/{block_id}", json=payload
            )

        return await with_retry(_inner)

    async def delete_block(self, id: str, block_id: str) -> dict[str, Any]:
        """
        Delete a block from a template

        Args:
            id: Template ID
            block_id: Block ID

        Returns:
            Deletion confirmation
        """
        async def _inner() -> dict[str, Any]:
            return await self._http.delete(f"/api/v1/templates/{id}/blocks/{block_id}")

        return await with_retry(_inner)

    async def duplicate_block(self, id: str, block_id: str) -> dict[str, Any]:
        """
        Duplicate a block in a template

        Args:
            id: Template ID
            block_id: Block ID to duplicate

        Returns:
            Duplicated block data
        """
        async def _inner() -> dict[str, Any]:
            return await self._http.post(
                f"/api/v1/templates/{id}/blocks/{block_id}/duplicate", json={}
            )

        return await with_retry(_inner)

    async def reorder_blocks(self, id: str, block_ids: list[str]) -> dict[str, Any]:
        """
        Reorder blocks in a template

        Args:
            id: Template ID
            block_ids: Ordered list of block IDs

        Returns:
            Reorder confirmation
        """
        async def _inner() -> dict[str, Any]:
            return await self._http.post(
                f"/api/v1/templates/{id}/blocks/reorder",
                json={"blockIds": block_ids},
            )

        return await with_retry(_inner)

    # ===== Version Operations =====

    async def list_versions(
        self, id: str, *, page: int = 1, limit: int = 20
    ) -> dict[str, Any]:
        """
        List versions of a template

        Args:
            id: Template ID
            page: Page number (default: 1)
            limit: Items per page (default: 20)

        Returns:
            Paginated list of template versions
        """
        async def _inner() -> dict[str, Any]:
            return await self._http.get(
                f"/api/v1/templates/{id}/versions",
                params={"page": page, "limit": limit},
            )

        return await with_retry(_inner)

    async def restore_version(self, id: str, version_id: str) -> dict[str, Any]:
        """
        Restore a template to a specific version

        Args:
            id: Template ID
            version_id: Version ID to restore

        Returns:
            Restored template data
        """
        async def _inner() -> dict[str, Any]:
            return await self._http.post(
                f"/api/v1/templates/{id}/versions/{version_id}/restore", json={}
            )

        return await with_retry(_inner)

    # ===== Test & Utility Operations =====

    async def test_send(self, id: str, request: TestSendRequest) -> dict[str, Any]:
        """
        Send a test email using a template

        Args:
            id: Template ID
            request: Test send request with recipient and variables

        Returns:
            Test send confirmation
        """
        async def _inner() -> dict[str, Any]:
            payload = request.model_dump(by_alias=True, exclude_none=True)
            return await self._http.post(
                f"/api/v1/templates/{id}/test-send", json=payload
            )

        return await with_retry(_inner)

    async def import_templates(
        self, templates: ImportTemplateRequest | list[ImportTemplateRequest]
    ) -> dict[str, Any]:
        """
        Import one or more templates

        Args:
            templates: Single template or list of templates to import

        Returns:
            Import result with created template data
        """
        async def _inner() -> dict[str, Any]:
            if isinstance(templates, list):
                payload = [
                    t.model_dump(by_alias=True, exclude_none=True) for t in templates
                ]
            else:
                payload = templates.model_dump(by_alias=True, exclude_none=True)
            return await self._http.post(
                "/api/v1/templates/import", json=payload
            )

        return await with_retry(_inner)

    async def export_templates(
        self, id: Optional[str] = None
    ) -> dict[str, Any]:
        """
        Export templates

        Args:
            id: Optional template ID to export a single template.
                If omitted, exports all templates.

        Returns:
            Exported template data
        """
        async def _inner() -> dict[str, Any]:
            params = {}
            if id is not None:
                params["id"] = id
            return await self._http.get("/api/v1/templates/export", params=params)

        return await with_retry(_inner)

    async def compile_mjml(
        self, mjml: str, *, minify: bool = False
    ) -> dict[str, Any]:
        """
        Compile MJML markup to HTML

        Args:
            mjml: MJML markup string
            minify: Whether to minify the output HTML

        Returns:
            Compiled HTML output
        """
        async def _inner() -> dict[str, Any]:
            return await self._http.post(
                "/api/v1/templates/compile-mjml",
                json={"mjml": mjml, "minify": minify},
            )

        return await with_retry(_inner)
