from datetime import datetime
from uuid import uuid4

from backend.app.domains.calendar.models import CalendarEvent, CalendarEventUpdate
from backend.app.domains.calendar.repository import CalendarEventRepository


class CalendarDomainService:
    def __init__(self, repository: CalendarEventRepository) -> None:
        self._repository = repository

    def create_event(self, action_id: str, payload: dict[str, object]) -> CalendarEvent:
        title = self._require_string(payload, "title")
        start_at, parsed_start_at = self._require_datetime(payload, "start_at")
        end_at, parsed_end_at = self._require_datetime(payload, "end_at")
        timezone = self._require_string(payload, "timezone")
        self._require_end_after_start(parsed_start_at, parsed_end_at)

        return self._repository.create_event(
            {
                "id": f"calendar_event_{uuid4().hex}",
                "title": title,
                "startAt": start_at,
                "endAt": end_at,
                "timezone": timezone,
                "status": "scheduled",
                "sourceActionId": action_id,
            }
        )

    def list_events(
        self, source_action_ids: set[str] | None = None
    ) -> list[CalendarEvent]:
        return self._repository.list_events(source_action_ids=source_action_ids)

    def get_event(self, event_id: str) -> CalendarEvent:
        return self._repository.get_event(event_id)

    def cancel_event(self, event_id: str) -> CalendarEvent:
        return self._repository.update_event_status(event_id, "canceled")

    def update_event(
        self, event_id: str, payload: dict[str, object]
    ) -> CalendarEvent:
        existing = self._repository.get_event(event_id)
        updates: CalendarEventUpdate = {}
        next_start_at = existing["startAt"]
        next_end_at = existing["endAt"]
        if "title" in payload and payload["title"] is not None:
            updates["title"] = self._require_string(payload, "title")
        if "startAt" in payload and payload["startAt"] is not None:
            start_at, _parsed_start_at = self._require_datetime(payload, "startAt")
            updates["startAt"] = start_at
            next_start_at = start_at
        if "endAt" in payload and payload["endAt"] is not None:
            end_at, _parsed_end_at = self._require_datetime(payload, "endAt")
            updates["endAt"] = end_at
            next_end_at = end_at
        if "timezone" in payload and payload["timezone"] is not None:
            updates["timezone"] = self._require_string(payload, "timezone")
        parsed_next_start_at = self._parse_datetime(next_start_at, "startAt")
        parsed_next_end_at = self._parse_datetime(next_end_at, "endAt")
        self._require_end_after_start(parsed_next_start_at, parsed_next_end_at)
        return self._repository.update_event(event_id, updates)

    def _require_string(self, payload: dict[str, object], key: str) -> str:
        value = payload.get(key)
        if not isinstance(value, str) or value.strip() == "":
            raise ValueError(f"{key} is required")
        return value

    def _require_datetime(
        self, payload: dict[str, object], key: str
    ) -> tuple[str, datetime]:
        value = self._require_string(payload, key)
        return value, self._parse_datetime(value, key)

    def _parse_datetime(self, value: str, key: str) -> datetime:
        try:
            parsed = datetime.fromisoformat(value)
        except ValueError as exc:
            raise ValueError(f"{key} must be an ISO datetime") from exc
        if parsed.tzinfo is None:
            raise ValueError(f"{key} must include a timezone")
        return parsed

    def _require_end_after_start(self, start_at: datetime, end_at: datetime) -> None:
        if end_at <= start_at:
            raise ValueError("endAt must be after startAt")
