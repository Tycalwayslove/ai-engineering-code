from dataclasses import dataclass, field
from typing import Protocol
from uuid import uuid4


@dataclass(frozen=True)
class AgentEvent:
    conversation_id: str
    event_type: str
    payload: dict[str, object]
    id: str = field(default_factory=lambda: f"event_{uuid4().hex}")
    turn_id: str | None = None
    plan_id: str | None = None


class EventLogRepository(Protocol):
    def append(self, event: AgentEvent) -> AgentEvent: ...

    def list_for_conversation(self, conversation_id: str) -> list[AgentEvent]: ...


class InMemoryEventLogRepository:
    def __init__(self) -> None:
        self._events_by_conversation: dict[str, list[AgentEvent]] = {}

    def append(self, event: AgentEvent) -> AgentEvent:
        self._events_by_conversation.setdefault(event.conversation_id, []).append(event)
        return event

    def list_for_conversation(self, conversation_id: str) -> list[AgentEvent]:
        return list(self._events_by_conversation.get(conversation_id, []))
