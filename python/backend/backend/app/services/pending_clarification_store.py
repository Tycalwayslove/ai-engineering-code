import json
from datetime import datetime
from typing import Protocol

from agent_runtime.clarifications.types import (
    PendingClarification,
    PendingClarificationStatus,
)


class PendingClarificationStore(Protocol):
    def save(self, pending: PendingClarification) -> None: ...

    def latest_open(
        self,
        conversation_id: str,
        now: datetime,
    ) -> PendingClarification | None: ...

    def mark_resolved(self, pending_id: str, resolved_at: datetime) -> None: ...

    def mark_abandoned(self, pending_id: str, abandoned_at: datetime) -> None: ...

    def list_for_conversation(self, conversation_id: str) -> list[PendingClarification]: ...


class InMemoryPendingClarificationStore:
    def __init__(self) -> None:
        self._items: list[PendingClarification] = []

    def save(self, pending: PendingClarification) -> None:
        self._items = [item for item in self._items if item.id != pending.id]
        self._items.append(pending)

    def latest_open(
        self,
        conversation_id: str,
        now: datetime,
    ) -> PendingClarification | None:
        matches = [
            item
            for item in self._items
            if item.conversation_id == conversation_id
            and item.status == "open"
            and item.expires_at > now
        ]
        return max(matches, key=lambda item: item.created_at) if matches else None

    def mark_resolved(self, pending_id: str, resolved_at: datetime) -> None:
        self._mark_closed(
            pending_id=pending_id,
            closed_at=resolved_at,
            status="resolved",
        )

    def mark_abandoned(self, pending_id: str, abandoned_at: datetime) -> None:
        self._mark_closed(
            pending_id=pending_id,
            closed_at=abandoned_at,
            status="abandoned",
        )

    def _mark_closed(
        self,
        *,
        pending_id: str,
        closed_at: datetime,
        status: PendingClarificationStatus,
    ) -> None:
        self._items = [
            PendingClarification(
                id=item.id,
                conversation_id=item.conversation_id,
                domain=item.domain,
                action_type=item.action_type,
                question=item.question,
                missing_fields=item.missing_fields,
                partial_payload=item.partial_payload,
                quick_replies=item.quick_replies,
                status=status,
                created_at=item.created_at,
                expires_at=item.expires_at,
                resolved_at=closed_at,
            )
            if item.id == pending_id
            else item
            for item in self._items
        ]

    def list_for_conversation(self, conversation_id: str) -> list[PendingClarification]:
        return sorted(
            [item for item in self._items if item.conversation_id == conversation_id],
            key=lambda item: (item.created_at, item.id),
        )


class PendingClarificationSummaryProvider:
    def __init__(self, store: PendingClarificationStore, limit: int = 3) -> None:
        self._store = store
        self._limit = limit

    def get(self, conversation_id: str, current_input: str) -> list[str]:
        del current_input
        pending_items = [
            item
            for item in self._store.list_for_conversation(conversation_id)
            if item.status == "open"
        ]
        return [
            self._summary(item)
            for item in pending_items[-self._limit :]
        ]

    def _summary(self, pending: PendingClarification) -> str:
        return (
            f"pending_id={pending.id}; action={pending.action_type}; "
            f"question={pending.question}; missing_fields={pending.missing_fields}; "
            "partial_payload="
            f"{json.dumps(pending.partial_payload, ensure_ascii=False, sort_keys=True)}"
        )
