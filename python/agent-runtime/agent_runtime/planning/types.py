from dataclasses import dataclass, field
from typing import Literal

PlannerMode = Literal["llm_first", "rule", "llm_mock", "llm"]
PlanningResponseType = Literal["chat", "clarification", "plan_candidate", "mixed"]
PlanningResultKind = Literal["plan_candidate", "clarification", "assistant_message"]


@dataclass(frozen=True)
class PlanningInput:
    conversation_id: str
    text: str
    now: str
    timezone: str


@dataclass(frozen=True)
class ProposedAction:
    domain: str
    action_type: str
    summary: str
    payload: dict[str, object]
    risk_level: str = "medium"
    missing_fields: list[str] = field(default_factory=list)


@dataclass(frozen=True)
class PlanCandidate:
    goal: str
    proposed_actions: list[ProposedAction]
    missing_information: list[str]
    assumptions: list[str]
    risk_notes: list[str]


@dataclass(frozen=True)
class ClarificationRequest:
    question: str
    missing_fields: list[str]
    intent_id: str | None = None
    domain: str | None = None
    action_type: str | None = None
    quick_replies: list[str] = field(default_factory=list)
    partial_payload: dict[str, object] = field(default_factory=dict)


@dataclass(frozen=True)
class PlanningResult:
    kind: PlanningResultKind
    trace_id: str
    candidate: PlanCandidate | None = None
    clarification: ClarificationRequest | None = None
    message: str | None = None
    structured_elements: list[dict[str, object]] = field(default_factory=list)
    planner_mode: str | None = None
    fallback_reason: str | None = None
    reasoning_summary: list[str] = field(default_factory=list)
    llm_call: dict[str, object] | None = None
