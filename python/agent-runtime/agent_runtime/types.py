from typing import Literal, TypedDict

RiskLevel = Literal["low", "medium", "high"]
DomainName = Literal["calendar", "expense", "reminder"]


class ParsedAction(TypedDict):
    domain: DomainName
    action_type: str
    risk_level: RiskLevel
    summary: str
    payload: dict[str, object]
    missing_fields: list[str]


class ParseResult:
    def __init__(self, actions: list[ParsedAction], trace_id: str) -> None:
        self.actions = actions
        self.trace_id = trace_id

    @property
    def intent_count(self) -> int:
        return len(self.actions)
