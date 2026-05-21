from fastapi import APIRouter

from backend.app.domains.calendar.models import CalendarEvent
from backend.app.runtime import calendar_service

router = APIRouter(prefix="/calendar")


@router.get("/events")
def get_events() -> list[CalendarEvent]:
    return calendar_service.list_events()
