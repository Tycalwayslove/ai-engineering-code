from typing import Protocol

from backend.app.domains.expense.models import (
    ExpenseRecord,
    ExpenseRecordUpdate,
    ExpenseStatus,
)


class ExpenseRecordRepository(Protocol):
    def create_record(self, record: ExpenseRecord) -> ExpenseRecord: ...

    def list_records(
        self, source_action_ids: set[str] | None = None
    ) -> list[ExpenseRecord]: ...

    def get_record(self, record_id: str) -> ExpenseRecord: ...

    def update_record_status(
        self,
        record_id: str,
        status: ExpenseStatus,
    ) -> ExpenseRecord: ...

    def update_record(
        self,
        record_id: str,
        updates: ExpenseRecordUpdate,
    ) -> ExpenseRecord: ...


class InMemoryExpenseRecordRepository:
    def __init__(self) -> None:
        self._records_by_action_id: dict[str, ExpenseRecord] = {}

    def create_record(self, record: ExpenseRecord) -> ExpenseRecord:
        existing = self._records_by_action_id.get(record["sourceActionId"])
        if existing is not None:
            return existing

        self._records_by_action_id[record["sourceActionId"]] = record
        return record

    def list_records(
        self, source_action_ids: set[str] | None = None
    ) -> list[ExpenseRecord]:
        records = list(self._records_by_action_id.values())
        if source_action_ids is None:
            return records
        return [
            record
            for record in records
            if record["sourceActionId"] in source_action_ids
        ]

    def get_record(self, record_id: str) -> ExpenseRecord:
        for record in self._records_by_action_id.values():
            if record["id"] == record_id:
                return record
        raise KeyError(record_id)

    def update_record_status(
        self,
        record_id: str,
        status: ExpenseStatus,
    ) -> ExpenseRecord:
        for action_id, record in self._records_by_action_id.items():
            if record["id"] == record_id:
                if record["status"] != "draft" or status not in (
                    "submitted",
                    "canceled",
                ):
                    raise ValueError("expense status cannot transition")
                updated: ExpenseRecord = {
                    **record,
                    "status": status,
                }
                self._records_by_action_id[action_id] = updated
                return updated
        raise KeyError(record_id)

    def update_record(
        self,
        record_id: str,
        updates: ExpenseRecordUpdate,
    ) -> ExpenseRecord:
        for action_id, record in self._records_by_action_id.items():
            if record["id"] == record_id:
                if record["status"] != "draft":
                    raise ValueError("expense is not editable")
                updated: ExpenseRecord = {
                    **record,
                    **updates,
                }
                self._records_by_action_id[action_id] = updated
                return updated
        raise KeyError(record_id)
