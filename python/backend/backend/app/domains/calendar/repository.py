from backend.app.domains.calendar.models import CalendarEvent


class InMemoryCalendarEventRepository:
    def __init__(self) -> None:
        self._events_by_action_id: dict[str, CalendarEvent] = {}

    def create_event(self, event: CalendarEvent) -> CalendarEvent:
        existing = self._events_by_action_id.get(event["sourceActionId"])
        if existing is not None:
            return existing

        self._events_by_action_id[event["sourceActionId"]] = event
        return event

    def list_events(self) -> list[CalendarEvent]:
        return list(self._events_by_action_id.values())
