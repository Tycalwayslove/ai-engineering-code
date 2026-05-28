from dataclasses import dataclass, field


@dataclass(frozen=True)
class ActionExecutionResult:
    status: str
    output: dict[str, object] = field(default_factory=dict)
    error: str | None = None
