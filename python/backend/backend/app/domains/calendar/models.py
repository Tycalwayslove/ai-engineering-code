from typing import Literal, TypedDict

CalendarEventStatus = Literal["scheduled", "canceled"]


class CalendarEvent(TypedDict):
    id: str
    title: str
    startAt: str
    endAt: str
    timezone: str
    status: CalendarEventStatus
    sourceActionId: str


class CalendarEventUpdate(TypedDict, total=False):
    title: str
    startAt: str
    endAt: str
    timezone: str
