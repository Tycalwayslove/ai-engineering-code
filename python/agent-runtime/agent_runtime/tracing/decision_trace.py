from dataclasses import dataclass
from typing import Protocol
from uuid import uuid4


@dataclass(frozen=True)
class DecisionTrace:
    id: str
    planner_mode: str
    context_sections_used: list[str]
    tools_considered: list[str]
    tools_selected: list[str]
    missing_information: list[str]
    policy_decisions: list[str]
    confirmation_reason: str | None
    fallback_reason: str | None
    reasoning_summary: list[str]
    llm_call: dict[str, object] | None = None


class DecisionTraceFactory:
    def create(
        self,
        planner_mode: str,
        tools_selected: list[str],
        missing_information: list[str] | None = None,
        fallback_reason: str | None = None,
    ) -> DecisionTrace:
        return DecisionTrace(
            id=f"trace_{uuid4().hex}",
            planner_mode=planner_mode,
            context_sections_used=[],
            tools_considered=tools_selected,
            tools_selected=tools_selected,
            missing_information=missing_information or [],
            policy_decisions=[],
            confirmation_reason="写入动作需要用户确认。" if tools_selected else None,
            fallback_reason=fallback_reason,
            reasoning_summary=[],
            llm_call=None,
        )


class DecisionTraceRepository(Protocol):
    def save(self, conversation_id: str, trace: DecisionTrace) -> DecisionTrace: ...

    def get(self, trace_id: str) -> DecisionTrace | None: ...


class InMemoryDecisionTraceRepository:
    def __init__(self) -> None:
        self._traces_by_id: dict[str, DecisionTrace] = {}

    def save(self, conversation_id: str, trace: DecisionTrace) -> DecisionTrace:
        self._traces_by_id[trace.id] = trace
        return trace

    def get(self, trace_id: str) -> DecisionTrace | None:
        return self._traces_by_id.get(trace_id)
