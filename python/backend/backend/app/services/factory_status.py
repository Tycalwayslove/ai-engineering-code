from typing import Literal, TypedDict

from backend.app.services.factory_capabilities import (
    FACTORY_CAPABILITIES,
    NEXT_FACTORY_ACTIONS,
    FactoryCapability,
)

FactoryStatusValue = Literal["ready", "degraded"]


class FactoryStatus(TypedDict):
    name: str
    status: FactoryStatusValue
    version: str
    capabilities: list[FactoryCapability]
    nextActions: list[str]


def get_factory_status() -> FactoryStatus:
    return {
        "name": "AI Code Factory",
        "status": "ready",
        "version": "0.1.0",
        "capabilities": FACTORY_CAPABILITIES,
        "nextActions": NEXT_FACTORY_ACTIONS,
    }
