from typing import Literal, TypedDict

ReminderStatus = Literal["scheduled", "done", "canceled"]


class Reminder(TypedDict):
    id: str
    title: str
    dueAt: str
    status: ReminderStatus
    sourceActionId: str


class ReminderUpdate(TypedDict, total=False):
    title: str
    dueAt: str
