from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from backend.app.domains.calendar.models import CalendarEvent
from backend.app.runtime import calendar_service, direct_action_auditor, execution_store

router = APIRouter(prefix="/calendar")


class CalendarEventUpdateRequest(BaseModel):
    title: str | None = None
    startAt: str | None = None
    endAt: str | None = None
    timezone: str | None = None


@router.get("/events")
def get_events(
    conversation_id: str | None = Query(default=None, alias="conversationId"),
) -> list[CalendarEvent]:
    source_action_ids = _source_action_ids_for_conversation(conversation_id)
    return calendar_service.list_events(source_action_ids=source_action_ids)


@router.patch("/events/{event_id}")
def update_event(
    event_id: str,
    request: CalendarEventUpdateRequest,
    conversation_id: str | None = Query(default=None, alias="conversationId"),
) -> CalendarEvent:
    try:
        existing = calendar_service.get_event(event_id)
        direct_action_auditor.require_source_action_in_conversation(
            conversation_id=conversation_id,
            source_action_id=existing["sourceActionId"],
        )
        event = calendar_service.update_event(
            event_id,
            request.model_dump(exclude_unset=True),
        )
        patch = request.model_dump(exclude_unset=True)
        direct_action_auditor.record_success(
            conversation_id=conversation_id,
            domain="calendar",
            action_type="calendar.update_event",
            summary=f"更新日程：{event['title']}",
            payload={"target_id": event_id, "patch": patch},
            result={"calendarEvent": event},
        )
        return event
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="calendar event not found") from exc


@router.post("/events/{event_id}/cancel")
def cancel_event(
    event_id: str,
    conversation_id: str | None = Query(default=None, alias="conversationId"),
) -> CalendarEvent:
    try:
        existing = calendar_service.get_event(event_id)
        direct_action_auditor.require_source_action_in_conversation(
            conversation_id=conversation_id,
            source_action_id=existing["sourceActionId"],
        )
        event = calendar_service.cancel_event(event_id)
        direct_action_auditor.record_success(
            conversation_id=conversation_id,
            domain="calendar",
            action_type="calendar.cancel_event",
            summary=f"取消日程：{event['title']}",
            payload={"target_id": event_id},
            result={"calendarEvent": event},
        )
        return event
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="calendar event not found") from exc


def _source_action_ids_for_conversation(
    conversation_id: str | None,
) -> set[str] | None:
    if conversation_id is None:
        return None
    return set(execution_store.list_action_ids_for_conversation(conversation_id))
