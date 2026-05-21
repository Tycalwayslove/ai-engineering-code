from typing import Literal, TypedDict


class CalendarEvent(TypedDict):
    id: str
    title: str
    startAt: str
    endAt: str
    timezone: str
    status: Literal["scheduled", "canceled"]
    sourceActionId: str
