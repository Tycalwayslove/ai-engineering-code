from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from backend.app.domains.reminder.models import Reminder
from backend.app.runtime import direct_action_auditor, execution_store, reminder_service

router = APIRouter(prefix="/reminders")


class ReminderUpdateRequest(BaseModel):
    title: str | None = None
    dueAt: str | None = None


@router.get("")
def get_reminders(
    conversation_id: str | None = Query(default=None, alias="conversationId"),
) -> list[Reminder]:
    source_action_ids = _source_action_ids_for_conversation(conversation_id)
    return reminder_service.list_reminders(source_action_ids=source_action_ids)


@router.patch("/{reminder_id}")
def update_reminder(
    reminder_id: str,
    request: ReminderUpdateRequest,
    conversation_id: str | None = Query(default=None, alias="conversationId"),
) -> Reminder:
    try:
        existing = reminder_service.get_reminder(reminder_id)
        direct_action_auditor.require_source_action_in_conversation(
            conversation_id=conversation_id,
            source_action_id=existing["sourceActionId"],
        )
        patch = request.model_dump(exclude_unset=True)
        reminder = reminder_service.update_reminder(
            reminder_id,
            patch,
        )
        direct_action_auditor.record_success(
            conversation_id=conversation_id,
            domain="reminder",
            action_type="reminder.update_reminder",
            summary=f"更新提醒：{reminder['title']}",
            payload={"target_id": reminder_id, "patch": patch},
            result={"reminder": reminder},
        )
        return reminder
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/{reminder_id}/complete")
def complete_reminder(
    reminder_id: str,
    conversation_id: str | None = Query(default=None, alias="conversationId"),
) -> Reminder:
    try:
        existing = reminder_service.get_reminder(reminder_id)
        direct_action_auditor.require_source_action_in_conversation(
            conversation_id=conversation_id,
            source_action_id=existing["sourceActionId"],
        )
        reminder = reminder_service.complete_reminder(reminder_id)
        direct_action_auditor.record_success(
            conversation_id=conversation_id,
            domain="reminder",
            action_type="reminder.complete_reminder",
            summary=f"完成提醒：{reminder['title']}",
            payload={"target_id": reminder_id},
            result={"reminder": reminder},
        )
        return reminder
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/{reminder_id}/cancel")
def cancel_reminder(
    reminder_id: str,
    conversation_id: str | None = Query(default=None, alias="conversationId"),
) -> Reminder:
    try:
        existing = reminder_service.get_reminder(reminder_id)
        direct_action_auditor.require_source_action_in_conversation(
            conversation_id=conversation_id,
            source_action_id=existing["sourceActionId"],
        )
        reminder = reminder_service.cancel_reminder(reminder_id)
        direct_action_auditor.record_success(
            conversation_id=conversation_id,
            domain="reminder",
            action_type="reminder.cancel_reminder",
            summary=f"取消提醒：{reminder['title']}",
            payload={"target_id": reminder_id},
            result={"reminder": reminder},
        )
        return reminder
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


def _source_action_ids_for_conversation(
    conversation_id: str | None,
) -> set[str] | None:
    if conversation_id is None:
        return None
    return set(execution_store.list_action_ids_for_conversation(conversation_id))
