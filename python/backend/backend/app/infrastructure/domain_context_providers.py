from datetime import datetime

from agent_runtime.memory.summary_memory import SummaryMemoryRepository

from backend.app.domains.calendar.repository import CalendarEventRepository
from backend.app.domains.expense.repository import ExpenseRecordRepository
from backend.app.domains.reminder.repository import ReminderRepository
from backend.app.services.execution_store import ExecutionStore


class SummaryMemoryProvider:
    def __init__(
        self,
        repository: SummaryMemoryRepository,
        limit: int = 8,
    ) -> None:
        self._repository = repository
        self._limit = limit

    def get(self, conversation_id: str, current_input: str) -> list[str]:
        del current_input
        if conversation_id == "":
            return []
        memories = self._repository.list_for_conversation(conversation_id)
        domain_fact_memories = [
            memory for memory in memories if memory.memory_type == "domain_fact"
        ]
        return [memory.summary for memory in domain_fact_memories[-self._limit :]]


class CalendarSummaryProvider:
    def __init__(
        self,
        repository: CalendarEventRepository,
        execution_store: ExecutionStore,
        limit: int = 8,
    ) -> None:
        self._repository = repository
        self._execution_store = execution_store
        self._limit = limit

    def get(self, conversation_id: str, current_input: str) -> list[str]:
        del current_input
        source_action_ids = self._source_action_ids(conversation_id)
        if source_action_ids is not None and len(source_action_ids) == 0:
            return []
        events = self._repository.list_events(source_action_ids=source_action_ids)
        return [
            (
                f"id={event['id']}; source_action_id={event['sourceActionId']}; "
                f"title={event['title']}; start_at={event['startAt']}; "
                f"end_at={event['endAt']}; timezone={event['timezone']}; "
                f"status={event['status']}"
            )
            for event in events[-self._limit :]
        ]

    def _source_action_ids(self, conversation_id: str) -> set[str] | None:
        if conversation_id == "":
            return None
        return set(self._execution_store.list_action_ids_for_conversation(conversation_id))


class ExpenseSummaryProvider:
    def __init__(
        self,
        repository: ExpenseRecordRepository,
        execution_store: ExecutionStore,
        limit: int = 8,
    ) -> None:
        self._repository = repository
        self._execution_store = execution_store
        self._limit = limit

    def get(self, conversation_id: str, current_input: str) -> list[str]:
        del current_input
        source_action_ids = self._source_action_ids(conversation_id)
        if source_action_ids is not None and len(source_action_ids) == 0:
            return []
        records = self._repository.list_records(source_action_ids=source_action_ids)
        return [
            (
                f"id={record['id']}; source_action_id={record['sourceActionId']}; "
                f"title={record['title']}; amount={record['amount']}; "
                f"currency={record['currency']}; occurred_on={record['occurredOn']}; "
                f"status={record['status']}"
            )
            for record in records[-self._limit :]
        ]

    def _source_action_ids(self, conversation_id: str) -> set[str] | None:
        if conversation_id == "":
            return None
        return set(self._execution_store.list_action_ids_for_conversation(conversation_id))


class ReminderSummaryProvider:
    def __init__(
        self,
        repository: ReminderRepository,
        execution_store: ExecutionStore,
        limit: int = 8,
    ) -> None:
        self._repository = repository
        self._execution_store = execution_store
        self._limit = limit

    def get(self, conversation_id: str, current_input: str) -> list[str]:
        del current_input
        source_action_ids = self._source_action_ids(conversation_id)
        if source_action_ids is not None and len(source_action_ids) == 0:
            return []
        reminders = self._repository.list_reminders(source_action_ids=source_action_ids)
        return [
            (
                f"id={reminder['id']}; source_action_id={reminder['sourceActionId']}; "
                f"title={reminder['title']}; due_at={reminder['dueAt']}; "
                f"status={reminder['status']}"
            )
            for reminder in reminders[-self._limit :]
        ]

    def _source_action_ids(self, conversation_id: str) -> set[str] | None:
        if conversation_id == "":
            return None
        return set(self._execution_store.list_action_ids_for_conversation(conversation_id))


def parse_summary(summary: str) -> dict[str, str]:
    pairs: dict[str, str] = {}
    for part in summary.split("; "):
        key, separator, value = part.partition("=")
        if separator:
            pairs[key.strip()] = value.strip()
    return pairs


def iso_duration_minutes(start_at: str, end_at: str) -> int:
    start = datetime.fromisoformat(start_at)
    end = datetime.fromisoformat(end_at)
    return max(1, int((end - start).total_seconds() // 60))
