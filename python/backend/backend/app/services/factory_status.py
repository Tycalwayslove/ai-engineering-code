from typing import Literal, TypedDict

CapabilityStatus = Literal["ready", "planned"]
FactoryStatusValue = Literal["ready", "degraded"]


class FactoryCapability(TypedDict):
    id: str
    label: str
    status: CapabilityStatus


class FactoryStatus(TypedDict):
    name: str
    status: FactoryStatusValue
    version: str
    capabilities: list[FactoryCapability]


def get_factory_status() -> FactoryStatus:
    return {
        "name": "AI Code Factory",
        "status": "ready",
        "version": "0.1.0",
        "capabilities": [
            {
                "id": "contracts",
                "label": "Contract-first API",
                "status": "ready",
            },
            {
                "id": "backend",
                "label": "FastAPI gateway",
                "status": "ready",
            },
            {
                "id": "sdk",
                "label": "TypeScript SDK",
                "status": "ready",
            },
            {
                "id": "web-surfaces",
                "label": "H5 and Admin surfaces",
                "status": "ready",
            },
        ],
    }
