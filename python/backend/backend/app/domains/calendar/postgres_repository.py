from datetime import datetime
from uuid import uuid4
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

import psycopg
from psycopg.rows import dict_row

from backend.app.domains.calendar.models import (
    CalendarEvent,
    CalendarEventStatus,
    CalendarEventUpdate,
)
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

    def list_events(
        self, source_action_ids: set[str] | None = None
    ) -> list[CalendarEvent]:
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
                select id, title, start_at, end_at, timezone, status, source_action_id
                from calendar_events
                {source_filter}
                order by start_at, id
                """,
                params,
            ).fetchall()
        return [self._event_from_row(row) for row in rows]

    def get_event(self, event_id: str) -> CalendarEvent:
        with self._connect() as connection:
            row = connection.execute(
                """
                select id, title, start_at, end_at, timezone, status, source_action_id
                from calendar_events
                where id = %s
                """,
                (event_id,),
            ).fetchone()
        if row is None:
            raise KeyError(event_id)
        return self._event_from_row(row)

    def update_event_status(
        self, event_id: str, status: CalendarEventStatus
    ) -> CalendarEvent:
        with self._connect() as connection:
            row = connection.execute(
                """
                update calendar_events
                set status = %s
                where id = %s and status = 'scheduled' and %s = 'canceled'
                returning id, title, start_at, end_at, timezone, status, source_action_id
                """,
                (status, event_id, status),
            ).fetchone()
            if row is None:
                self._raise_status_error(connection, event_id)
        if row is None:
            raise KeyError(event_id)
        return self._event_from_row(row)

    def update_event(
        self, event_id: str, updates: CalendarEventUpdate
    ) -> CalendarEvent:
        with self._connect() as connection:
            row = connection.execute(
                """
                update calendar_events
                set
                  title = coalesce(%s, title),
                  start_at = coalesce(%s, start_at),
                  end_at = coalesce(%s, end_at),
                  timezone = coalesce(%s, timezone)
                where id = %s and status = 'scheduled'
                returning id, title, start_at, end_at, timezone, status, source_action_id
                """,
                (
                    updates.get("title"),
                    updates.get("startAt"),
                    updates.get("endAt"),
                    updates.get("timezone"),
                    event_id,
                ),
            ).fetchone()
            if row is None:
                self._raise_update_error(connection, event_id)
        if row is None:
            raise KeyError(event_id)
        return self._event_from_row(row)

    def to_domain_service(self) -> CalendarDomainService:
        return CalendarDomainService(self)

    def _connect(self) -> psycopg.Connection[dict[str, object]]:
        return psycopg.connect(self._settings.url, row_factory=dict_row)

    def _raise_update_error(
        self, connection: psycopg.Connection[dict[str, object]], event_id: str
    ) -> None:
        row = connection.execute(
            "select status from calendar_events where id = %s",
            (event_id,),
        ).fetchone()
        if row is None:
            raise KeyError(event_id)
        raise ValueError("calendar event is not editable")

    def _raise_status_error(
        self, connection: psycopg.Connection[dict[str, object]], event_id: str
    ) -> None:
        row = connection.execute(
            "select status from calendar_events where id = %s",
            (event_id,),
        ).fetchone()
        if row is None:
            raise KeyError(event_id)
        raise ValueError("calendar event status cannot transition")

    def _event_from_row(self, row: dict[str, object]) -> CalendarEvent:
        start_at = row["start_at"]
        end_at = row["end_at"]
        if not isinstance(start_at, datetime) or not isinstance(end_at, datetime):
            raise TypeError("calendar event timestamps must be datetimes")
        timezone = str(row["timezone"])
        start_at = self._in_event_timezone(start_at, timezone)
        end_at = self._in_event_timezone(end_at, timezone)
        return {
            "id": str(row["id"]),
            "title": str(row["title"]),
            "startAt": start_at.isoformat(),
            "endAt": end_at.isoformat(),
            "timezone": timezone,
            "status": row["status"],  # type: ignore[typeddict-item]
            "sourceActionId": str(row["source_action_id"]),
        }

    def _in_event_timezone(self, value: datetime, timezone: str) -> datetime:
        try:
            return value.astimezone(ZoneInfo(timezone))
        except ZoneInfoNotFoundError:
            return value
