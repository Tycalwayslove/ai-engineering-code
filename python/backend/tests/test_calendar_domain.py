import pytest
from backend.app.domains.calendar.repository import InMemoryCalendarEventRepository
from backend.app.domains.calendar.service import CalendarDomainService


def test_calendar_service_creates_event_with_source_action() -> None:
    repository = InMemoryCalendarEventRepository()
    service = CalendarDomainService(repository)

    event = service.create_event(
        action_id="action_001",
        payload={
            "title": "开会",
            "start_at": "2026-05-22T15:00:00+08:00",
            "end_at": "2026-05-22T16:00:00+08:00",
            "timezone": "Asia/Shanghai",
        },
    )

    assert event["title"] == "开会"
    assert event["sourceActionId"] == "action_001"
    assert repository.list_events() == [event]


def test_calendar_service_is_idempotent_by_action_id() -> None:
    repository = InMemoryCalendarEventRepository()
    service = CalendarDomainService(repository)

    first = service.create_event(
        action_id="action_001",
        payload={
            "title": "开会",
            "start_at": "2026-05-22T15:00:00+08:00",
            "end_at": "2026-05-22T16:00:00+08:00",
            "timezone": "Asia/Shanghai",
        },
    )
    second = service.create_event(
        action_id="action_001",
        payload={
            "title": "开会",
            "start_at": "2026-05-22T15:00:00+08:00",
            "end_at": "2026-05-22T16:00:00+08:00",
            "timezone": "Asia/Shanghai",
        },
    )

    assert first == second
    assert len(repository.list_events()) == 1


def test_calendar_service_rejects_missing_title() -> None:
    repository = InMemoryCalendarEventRepository()
    service = CalendarDomainService(repository)

    with pytest.raises(ValueError, match="title is required"):
        service.create_event(
            action_id="action_001",
            payload={
                "start_at": "2026-05-22T15:00:00+08:00",
                "end_at": "2026-05-22T16:00:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        )
