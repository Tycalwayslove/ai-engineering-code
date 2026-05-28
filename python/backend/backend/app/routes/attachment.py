from fastapi import APIRouter, HTTPException, Query

from backend.app.domains.attachment.models import (
    AttachmentIntake,
    AttachmentIntakeRequest,
    AttachmentUploadRequest,
)
from backend.app.runtime import attachment_service

router = APIRouter(prefix="/attachments")


@router.post("/intake")
def intake_attachment(request: AttachmentIntakeRequest) -> AttachmentIntake:
    try:
        return attachment_service.create_intake(request)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.post("/upload")
def upload_attachment(request: AttachmentUploadRequest) -> AttachmentIntake:
    try:
        return attachment_service.upload_attachment(request)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("")
def list_attachments(
    conversation_id: str = Query(alias="conversationId"),
    limit: int = 10,
) -> list[AttachmentIntake]:
    try:
        return attachment_service.list_for_conversation(conversation_id, limit)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
