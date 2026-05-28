from dataclasses import dataclass, field
from typing import Protocol
from uuid import uuid4


@dataclass(frozen=True)
class SummaryMemory:
    conversation_id: str
    memory_type: str
    summary: str
    payload: dict[str, object]
    id: str = field(default_factory=lambda: f"memory_{uuid4().hex}")
    source_event_ids: list[str] = field(default_factory=list)


class SummaryMemoryRepository(Protocol):
    def save(self, memory: SummaryMemory) -> SummaryMemory: ...

    def list_for_conversation(self, conversation_id: str) -> list[SummaryMemory]: ...


class InMemorySummaryMemoryRepository:
    def __init__(self) -> None:
        self._memories_by_conversation: dict[str, list[SummaryMemory]] = {}

    def save(self, memory: SummaryMemory) -> SummaryMemory:
        memories = self._memories_by_conversation.setdefault(
            memory.conversation_id,
            [],
        )
        for index, existing in enumerate(memories):
            if existing.id == memory.id:
                memories[index] = memory
                return memory
        memories.append(memory)
        return memory

    def list_for_conversation(self, conversation_id: str) -> list[SummaryMemory]:
        return list(self._memories_by_conversation.get(conversation_id, []))
