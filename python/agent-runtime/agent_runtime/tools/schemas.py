from dataclasses import dataclass
from typing import Literal

RiskLevel = Literal["low", "medium", "high"]


@dataclass(frozen=True)
class ToolSchema:
    name: str
    action_type: str
    domain: str
    description: str
    input_schema: dict[str, object]
    output_schema: dict[str, object]
    risk_level: RiskLevel
    confirmation_required: bool
    handler_key: str
