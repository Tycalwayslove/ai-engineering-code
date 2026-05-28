from dataclasses import dataclass, field


@dataclass(frozen=True)
class PolicyDecision:
    requires_confirmation: bool
    required_action_indexes: list[int]
    risk_level: str
    clarification_question: str | None = None
    missing_fields: list[str] = field(default_factory=list)
    policy_notes: list[str] = field(default_factory=list)
