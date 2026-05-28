from datetime import date
from uuid import uuid4

from backend.app.domains.expense.models import ExpenseRecord, ExpenseRecordUpdate
from backend.app.domains.expense.repository import ExpenseRecordRepository


class ExpenseDomainService:
    def __init__(self, repository: ExpenseRecordRepository) -> None:
        self._repository = repository

    def create_reimbursement_draft(
        self,
        action_id: str,
        payload: dict[str, object],
    ) -> ExpenseRecord:
        title = self._require_string(payload, "title")
        amount = self._require_amount(payload, "amount")
        currency = self._require_string(payload, "currency")
        occurred_on = self._require_date(payload, "occurred_on")

        return self._repository.create_record(
            {
                "id": f"expense_record_{uuid4().hex}",
                "title": title,
                "amount": amount,
                "currency": currency,
                "occurredOn": occurred_on,
                "status": "draft",
                "sourceActionId": action_id,
            }
        )

    def list_records(
        self, source_action_ids: set[str] | None = None
    ) -> list[ExpenseRecord]:
        return self._repository.list_records(source_action_ids=source_action_ids)

    def get_record(self, record_id: str) -> ExpenseRecord:
        return self._repository.get_record(record_id)

    def submit_record(self, record_id: str) -> ExpenseRecord:
        return self._repository.update_record_status(record_id, "submitted")

    def cancel_record(self, record_id: str) -> ExpenseRecord:
        return self._repository.update_record_status(record_id, "canceled")

    def update_record(
        self, record_id: str, payload: dict[str, object]
    ) -> ExpenseRecord:
        updates: ExpenseRecordUpdate = {}
        if "title" in payload and payload["title"] is not None:
            updates["title"] = self._require_string(payload, "title")
        if "amount" in payload and payload["amount"] is not None:
            updates["amount"] = self._require_amount(payload, "amount")
        if "currency" in payload and payload["currency"] is not None:
            updates["currency"] = self._require_string(payload, "currency")
        if "occurredOn" in payload and payload["occurredOn"] is not None:
            updates["occurredOn"] = self._require_date(payload, "occurredOn")
        return self._repository.update_record(record_id, updates)

    def _require_string(self, payload: dict[str, object], key: str) -> str:
        value = payload.get(key)
        if not isinstance(value, str) or value.strip() == "":
            raise ValueError(f"{key} is required")
        return value

    def _require_amount(self, payload: dict[str, object], key: str) -> float:
        value = payload.get(key)
        if isinstance(value, bool) or not isinstance(value, int | float):
            raise ValueError(f"{key} is required")
        amount = float(value)
        if amount < 0:
            raise ValueError(f"{key} must be non-negative")
        return amount

    def _require_date(self, payload: dict[str, object], key: str) -> str:
        value = self._require_string(payload, key)
        try:
            date.fromisoformat(value)
        except ValueError as exc:
            raise ValueError(f"{key} must be an ISO date") from exc
        return value
