from datetime import datetime
from uuid import uuid4
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

import psycopg
from psycopg.rows import dict_row

from backend.app.domains.reminder.models import Reminder, ReminderStatus, ReminderUpdate
from backend.app.domains.reminder.service import ReminderDomainService
from backend.app.services.database import DatabaseSettings


class PostgresReminderRepository:
    def __init__(self, settings: DatabaseSettings) -> None:
        self._settings = settings

    def create_reminder(self, reminder: Reminder) -> Reminder:
        reminder_id = reminder.get("id") or f"reminder_{uuid4().hex}"
        with self._connect() as connection:
            row = connection.execute(
                """
                insert into reminders (
                  id,
                  title,
                  due_at,
                  timezone,
                  status,
                  source_action_id
                )
                values (%s, %s, %s, %s, %s, %s)
                on conflict (source_action_id) do update set
                  source_action_id = excluded.source_action_id
                returning id, title, due_at, timezone, status, source_action_id
                """,
                (
                    reminder_id,
                    reminder["title"],
                    reminder["dueAt"],
                    self._timezone_from_due_at(reminder["dueAt"]),
                    reminder["status"],
                    reminder["sourceActionId"],
                ),
            ).fetchone()
        if row is None:
            raise RuntimeError("failed to create reminder")
        return self._reminder_from_row(row)

    def list_reminders(
        self, source_action_ids: set[str] | None = None
    ) -> list[Reminder]:
        if source_action_ids is not None and len(source_action_ids) == 0:
            return []

        source_filter = ""
        params: tuple[object, ...] = ()
        if source_action_ids is not None:
            source_filter = "where source_action_id = any(%s)"
            params = (list(source_action_ids),)

        with self._connect() as connection:
            rows = connection.execute(
                f"""
                select id, title, due_at, timezone, status, source_action_id
                from reminders
                {source_filter}
                order by due_at, id
                """,
                params,
            ).fetchall()
        return [self._reminder_from_row(row) for row in rows]

    def get_reminder(self, reminder_id: str) -> Reminder:
        with self._connect() as connection:
            row = connection.execute(
                """
                select id, title, due_at, timezone, status, source_action_id
                from reminders
                where id = %s
                """,
                (reminder_id,),
            ).fetchone()
        if row is None:
            raise KeyError(f"reminder not found: {reminder_id}")
        return self._reminder_from_row(row)

    def update_reminder_status(
        self,
        reminder_id: str,
        status: ReminderStatus,
    ) -> Reminder:
        with self._connect() as connection:
            row = connection.execute(
                """
                update reminders
                set status = %s
                where id = %s and status = 'scheduled' and %s in ('done', 'canceled')
                returning id, title, due_at, timezone, status, source_action_id
                """,
                (status, reminder_id, status),
            ).fetchone()
            if row is None:
                self._raise_status_error(connection, reminder_id)
        if row is None:
            raise KeyError(f"reminder not found: {reminder_id}")
        return self._reminder_from_row(row)

    def update_reminder(
        self,
        reminder_id: str,
        updates: ReminderUpdate,
    ) -> Reminder:
        due_at = updates.get("dueAt")
        timezone = self._timezone_from_due_at(due_at) if due_at is not None else None
        with self._connect() as connection:
            row = connection.execute(
                """
                update reminders
                set
                  title = coalesce(%s, title),
                  due_at = coalesce(%s, due_at),
                  timezone = coalesce(%s, timezone)
                where id = %s and status = 'scheduled'
                returning id, title, due_at, timezone, status, source_action_id
                """,
                (
                    updates.get("title"),
                    due_at,
                    timezone,
                    reminder_id,
                ),
            ).fetchone()
            if row is None:
                self._raise_update_error(connection, reminder_id)
        if row is None:
            raise KeyError(f"reminder not found: {reminder_id}")
        return self._reminder_from_row(row)

    def to_domain_service(self) -> ReminderDomainService:
        return ReminderDomainService(self)

    def _connect(self) -> psycopg.Connection[dict[str, object]]:
        return psycopg.connect(self._settings.url, row_factory=dict_row)

    def _raise_update_error(
        self, connection: psycopg.Connection[dict[str, object]], reminder_id: str
    ) -> None:
        row = connection.execute(
            "select status from reminders where id = %s",
            (reminder_id,),
        ).fetchone()
        if row is None:
            raise KeyError(f"reminder not found: {reminder_id}")
        raise ValueError("reminder is not editable")

    def _raise_status_error(
        self, connection: psycopg.Connection[dict[str, object]], reminder_id: str
    ) -> None:
        row = connection.execute(
            "select status from reminders where id = %s",
            (reminder_id,),
        ).fetchone()
        if row is None:
            raise KeyError(f"reminder not found: {reminder_id}")
        raise ValueError("reminder status cannot transition")

    def _reminder_from_row(self, row: dict[str, object]) -> Reminder:
        due_at = row["due_at"]
        if not isinstance(due_at, datetime):
            raise TypeError("reminder due_at must be a datetime")
        due_at = self._in_reminder_timezone(due_at, str(row.get("timezone", "UTC")))
        return {
            "id": str(row["id"]),
            "title": str(row["title"]),
            "dueAt": due_at.isoformat(),
            "status": row["status"],  # type: ignore[typeddict-item]
            "sourceActionId": str(row["source_action_id"]),
        }

    def _timezone_from_due_at(self, due_at: str) -> str:
        return "Asia/Shanghai" if due_at.endswith("+08:00") else "UTC"

    def _in_reminder_timezone(self, value: datetime, timezone: str) -> datetime:
        try:
            return value.astimezone(ZoneInfo(timezone))
        except ZoneInfoNotFoundError:
            return value
