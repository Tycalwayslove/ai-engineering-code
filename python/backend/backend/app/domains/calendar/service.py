from uuid import uuid4

from backend.app.domains.calendar.models import CalendarEvent
from backend.app.domains.calendar.repository import CalendarEventRepository


class CalendarDomainService:
    def __init__(self, repository: CalendarEventRepository) -> None:
        self._repository = repository

    def create_event(self, action_id: str, payload: dict[str, object]) -> CalendarEvent:
        title = self._require_string(payload, "title")
        start_at = self._require_string(payload, "start_at")
        end_at = self._require_string(payload, "end_at")
        timezone = self._require_string(payload, "timezone")

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

    def list_events(self) -> list[CalendarEvent]:
        return self._repository.list_events()

    def _require_string(self, payload: dict[str, object], key: str) -> str:
        value = payload.get(key)
        if not isinstance(value, str) or value.strip() == "":
            raise ValueError(f"{key} is required")
        return value
