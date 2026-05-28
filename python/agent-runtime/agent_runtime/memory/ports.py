from typing import Protocol

from agent_runtime.memory.summary_memory import SummaryMemory


class MemorySearchPort(Protocol):
    def search(
        self,
        query: str,
        filters: dict[str, object] | None = None,
    ) -> list[SummaryMemory]: ...


class EmptyMemorySearchPort:
    def search(
        self,
        query: str,
        filters: dict[str, object] | None = None,
    ) -> list[SummaryMemory]:
        return []
