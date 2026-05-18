from typing import Literal, TypedDict

CapabilityStatus = Literal["ready", "planned"]


class FactoryCapability(TypedDict):
    id: str
    label: str
    source: str
    status: CapabilityStatus
    summary: str


FACTORY_CAPABILITIES: list[FactoryCapability] = [
    {
        "id": "contracts",
        "label": "Contract-first API",
        "source": "contracts/openapi/api-gateway.yaml",
        "status": "ready",
        "summary": "HTTP API shape is declared before runtime consumers use it.",
    },
    {
        "id": "backend",
        "label": "FastAPI gateway",
        "source": "python/backend",
        "status": "ready",
        "summary": "Centralized Python entrypoint exposes factory capabilities.",
    },
    {
        "id": "sdk",
        "label": "TypeScript SDK",
        "source": "packages/sdk",
        "status": "ready",
        "summary": "Frontend apps use one typed API access layer.",
    },
    {
        "id": "admin-surface",
        "label": "Admin status panel",
        "source": "apps/admin",
        "status": "ready",
        "summary": "Operators can inspect the software factory foundation.",
    },
    {
        "id": "ai-factory",
        "label": "AI factory workspace",
        "source": "ai-factory",
        "status": "ready",
        "summary": "Specs, workflows, prompts, memory, and playbooks are first-class assets.",
    },
    {
        "id": "contract-validation",
        "label": "Contract validation",
        "source": "scripts/validate-contracts.mjs",
        "status": "planned",
        "summary": "Lightweight consistency checks guard the first cross-runtime slice.",
    },
]


NEXT_FACTORY_ACTIONS = [
    "Run the spec-to-implementation-plan workflow on a real feature.",
    "Promote stable factory context into durable memory.",
    "Decide when OpenAPI semantic validation is worth adding.",
]
