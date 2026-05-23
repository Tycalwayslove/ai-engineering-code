from datetime import datetime
from uuid import uuid4

import psycopg
from psycopg.rows import dict_row

from backend.app.domains.calendar.models import CalendarEvent
from backend.app.domains.calendar.service import CalendarDomainService
from backend.app.services.database import DatabaseSettings


class PostgresCalendarEventRepository:
    def __init__(self, settings: DatabaseSettings) -> None:
        self._settings = settings

    def create_event(self, event: CalendarEvent) -> CalendarEvent:
        event_id = event.get("id") or f"calendar_event_{uuid4().hex}"
        with self._connect() as connection:
            row = connection.execute(
                """
                insert into calendar_events (
                  id,
                  title,
                  start_at,
                  end_at,
                  timezone,
                  status,
                  source_action_id
                )
                values (%s, %s, %s, %s, %s, %s, %s)
                on conflict (source_action_id) do update set
                  source_action_id = excluded.source_action_id
                returning id, title, start_at, end_at, timezone, status, source_action_id
                """,
                (
                    event_id,
                    event["title"],
                    event["startAt"],
                    event["endAt"],
                    event["timezone"],
                    event["status"],
                    event["sourceActionId"],
                ),
            ).fetchone()
        if row is None:
            raise RuntimeError("failed to create calendar event")
        return self._event_from_row(row)

    def list_events(self) -> list[CalendarEvent]:
        with self._connect() as connection:
            rows = connection.execute(
                """
                select id, title, start_at, end_at, timezone, status, source_action_id
                from calendar_events
                order by start_at, id
                """
            ).fetchall()
        return [self._event_from_row(row) for row in rows]

    def to_domain_service(self) -> CalendarDomainService:
        return CalendarDomainService(self)

    def _connect(self) -> psycopg.Connection[dict[str, object]]:
        return psycopg.connect(self._settings.url, row_factory=dict_row)

    def _event_from_row(self, row: dict[str, object]) -> CalendarEvent:
        start_at = row["start_at"]
        end_at = row["end_at"]
        if not isinstance(start_at, datetime) or not isinstance(end_at, datetime):
            raise TypeError("calendar event timestamps must be datetimes")
        return {
            "id": str(row["id"]),
            "title": str(row["title"]),
            "startAt": start_at.isoformat(),
            "endAt": end_at.isoformat(),
            "timezone": str(row["timezone"]),
            "status": row["status"],  # type: ignore[typeddict-item]
            "sourceActionId": str(row["source_action_id"]),
        }
