from datetime import datetime
from uuid import uuid4

from backend.app.domains.reminder.models import Reminder, ReminderUpdate
from backend.app.domains.reminder.repository import ReminderRepository


class ReminderDomainService:
    def __init__(self, repository: ReminderRepository) -> None:
        self._repository = repository

    def create_reminder(
        self,
        action_id: str,
        payload: dict[str, object],
    ) -> Reminder:
        title = self._require_string(payload, "title")
        due_at = self._require_datetime(payload, "due_at")

        return self._repository.create_reminder(
            {
                "id": f"reminder_{uuid4().hex}",
                "title": title,
                "dueAt": due_at,
                "status": "scheduled",
                "sourceActionId": action_id,
            }
        )

    def list_reminders(
        self, source_action_ids: set[str] | None = None
    ) -> list[Reminder]:
        return self._repository.list_reminders(source_action_ids=source_action_ids)

    def get_reminder(self, reminder_id: str) -> Reminder:
        return self._repository.get_reminder(reminder_id)

    def complete_reminder(self, reminder_id: str) -> Reminder:
        return self._repository.update_reminder_status(reminder_id, "done")

    def cancel_reminder(self, reminder_id: str) -> Reminder:
        return self._repository.update_reminder_status(reminder_id, "canceled")

    def update_reminder(
        self, reminder_id: str, payload: dict[str, object]
    ) -> Reminder:
        updates: ReminderUpdate = {}
        if "title" in payload and payload["title"] is not None:
            updates["title"] = self._require_string(payload, "title")
        if "dueAt" in payload and payload["dueAt"] is not None:
            updates["dueAt"] = self._require_datetime(payload, "dueAt")
        return self._repository.update_reminder(reminder_id, updates)

    def _require_string(self, payload: dict[str, object], key: str) -> str:
        value = payload.get(key)
        if not isinstance(value, str) or value.strip() == "":
            raise ValueError(f"{key} is required")
        return value

    def _require_datetime(self, payload: dict[str, object], key: str) -> str:
        value = self._require_string(payload, key)
        try:
            parsed = datetime.fromisoformat(value)
        except ValueError as exc:
            raise ValueError(f"{key} must be an ISO datetime") from exc
        if parsed.tzinfo is None:
            raise ValueError(f"{key} must include a timezone")
        return value
