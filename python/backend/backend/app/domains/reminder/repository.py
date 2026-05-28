from typing import Protocol

from backend.app.domains.reminder.models import Reminder, ReminderStatus, ReminderUpdate


class ReminderRepository(Protocol):
    def create_reminder(self, reminder: Reminder) -> Reminder: ...

    def list_reminders(
        self, source_action_ids: set[str] | None = None
    ) -> list[Reminder]: ...

    def get_reminder(self, reminder_id: str) -> Reminder: ...

    def update_reminder_status(
        self,
        reminder_id: str,
        status: ReminderStatus,
    ) -> Reminder: ...

    def update_reminder(
        self,
        reminder_id: str,
        updates: ReminderUpdate,
    ) -> Reminder: ...


class InMemoryReminderRepository:
    def __init__(self) -> None:
        self._reminders_by_action_id: dict[str, Reminder] = {}

    def create_reminder(self, reminder: Reminder) -> Reminder:
        existing = self._reminders_by_action_id.get(reminder["sourceActionId"])
        if existing is not None:
            return existing

        self._reminders_by_action_id[reminder["sourceActionId"]] = reminder
        return reminder

    def list_reminders(
        self, source_action_ids: set[str] | None = None
    ) -> list[Reminder]:
        reminders = list(self._reminders_by_action_id.values())
        if source_action_ids is None:
            return reminders
        return [
            reminder
            for reminder in reminders
            if reminder["sourceActionId"] in source_action_ids
        ]

    def get_reminder(self, reminder_id: str) -> Reminder:
        for reminder in self._reminders_by_action_id.values():
            if reminder["id"] == reminder_id:
                return reminder
        raise KeyError(f"reminder not found: {reminder_id}")

    def update_reminder_status(
        self,
        reminder_id: str,
        status: ReminderStatus,
    ) -> Reminder:
        for action_id, reminder in self._reminders_by_action_id.items():
            if reminder["id"] == reminder_id:
                if reminder["status"] != "scheduled" or status not in (
                    "done",
                    "canceled",
                ):
                    raise ValueError("reminder status cannot transition")
                updated: Reminder = {
                    "dueAt": reminder["dueAt"],
                    "id": reminder["id"],
                    "sourceActionId": reminder["sourceActionId"],
                    "status": status,
                    "title": reminder["title"],
                }
                self._reminders_by_action_id[action_id] = updated
                return updated

        raise KeyError(f"reminder not found: {reminder_id}")

    def update_reminder(
        self,
        reminder_id: str,
        updates: ReminderUpdate,
    ) -> Reminder:
        for action_id, reminder in self._reminders_by_action_id.items():
            if reminder["id"] == reminder_id:
                if reminder["status"] != "scheduled":
                    raise ValueError("reminder is not editable")
                updated: Reminder = {
                    **reminder,
                    **updates,
                }
                self._reminders_by_action_id[action_id] = updated
                return updated

        raise KeyError(f"reminder not found: {reminder_id}")
