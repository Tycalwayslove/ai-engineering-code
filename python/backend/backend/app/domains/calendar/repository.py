from typing import Protocol

from backend.app.domains.calendar.models import (
    CalendarEvent,
    CalendarEventStatus,
    CalendarEventUpdate,
)


class CalendarEventRepository(Protocol):
    def create_event(self, event: CalendarEvent) -> CalendarEvent: ...

    def list_events(
        self, source_action_ids: set[str] | None = None
    ) -> list[CalendarEvent]: ...

    def get_event(self, event_id: str) -> CalendarEvent: ...

    def update_event_status(
        self, event_id: str, status: CalendarEventStatus
    ) -> CalendarEvent: ...

    def update_event(
        self, event_id: str, updates: CalendarEventUpdate
    ) -> CalendarEvent: ...


class InMemoryCalendarEventRepository:
    def __init__(self) -> None:
        self._events_by_action_id: dict[str, CalendarEvent] = {}

    def create_event(self, event: CalendarEvent) -> CalendarEvent:
        existing = self._events_by_action_id.get(event["sourceActionId"])
        if existing is not None:
            return existing

        self._events_by_action_id[event["sourceActionId"]] = event
        return event

    def list_events(
        self, source_action_ids: set[str] | None = None
    ) -> list[CalendarEvent]:
        events = list(self._events_by_action_id.values())
        if source_action_ids is None:
            return events
        return [
            event for event in events if event["sourceActionId"] in source_action_ids
        ]

    def get_event(self, event_id: str) -> CalendarEvent:
        for event in self._events_by_action_id.values():
            if event["id"] == event_id:
                return event
        raise KeyError(event_id)

    def update_event_status(
        self, event_id: str, status: CalendarEventStatus
    ) -> CalendarEvent:
        for source_action_id, event in self._events_by_action_id.items():
            if event["id"] == event_id:
                if event["status"] != "scheduled" or status != "canceled":
                    raise ValueError("calendar event status cannot transition")
                updated: CalendarEvent = {**event, "status": status}
                self._events_by_action_id[source_action_id] = updated
                return updated
        raise KeyError(event_id)

    def update_event(
        self, event_id: str, updates: CalendarEventUpdate
    ) -> CalendarEvent:
        for source_action_id, event in self._events_by_action_id.items():
            if event["id"] == event_id:
                if event["status"] != "scheduled":
                    raise ValueError("calendar event is not editable")
                updated: CalendarEvent = {**event, **updates}
                self._events_by_action_id[source_action_id] = updated
                return updated
        raise KeyError(event_id)
