import base64
import binascii
import hashlib
from collections.abc import Mapping
from datetime import UTC, datetime
from uuid import uuid4

from backend.app.domains.attachment.models import (
    AttachmentIntake,
    AttachmentIntakeRequest,
    AttachmentUploadRequest,
)
from backend.app.domains.attachment.repository import AttachmentIntakeRepository


class AttachmentIntakeService:
    _MAX_UPLOAD_BYTES = 5 * 1024 * 1024

    def __init__(self, repository: AttachmentIntakeRepository) -> None:
        self._repository = repository

    def create_intake(self, request: AttachmentIntakeRequest) -> AttachmentIntake:
        return self._repository.create_intake(self._build_intake(request))

    def _build_intake(self, request: AttachmentIntakeRequest) -> AttachmentIntake:
        attachment: AttachmentIntake = {
            "attachmentId": self._require_string(request, "attachmentId"),
            "createdAt": datetime.now(UTC).isoformat(),
            "id": f"attachment_{uuid4().hex}",
            "kind": self._require_string(request, "attachmentKind"),
            "name": self._require_string(request, "attachmentName"),
            "status": "received",
        }
        attachment_type = request.get("attachmentType")
        if isinstance(attachment_type, str) and attachment_type.strip() != "":
            attachment["type"] = attachment_type.strip()
        conversation_id = request.get("conversationId")
        if isinstance(conversation_id, str) and conversation_id.strip() != "":
            attachment["conversationId"] = conversation_id.strip()
        source = request.get("source")
        if isinstance(source, str) and source.strip() != "":
            attachment["source"] = source.strip()
        text = request.get("text")
        if isinstance(text, str) and text.strip() != "":
            attachment["text"] = text.strip()

        size_bytes = request.get("attachmentSizeBytes")
        if isinstance(size_bytes, int) and size_bytes >= 0:
            attachment["sizeBytes"] = size_bytes

        return attachment

    def upload_attachment(self, request: AttachmentUploadRequest) -> AttachmentIntake:
        content = self._decode_content(request)
        attachment_type = request.get("attachmentType")
        text = self._attachment_text(request.get("text"), content, attachment_type)

        intake_request: AttachmentIntakeRequest = {
            "attachmentId": self._require_string(request, "attachmentId"),
            "attachmentKind": self._require_string(request, "attachmentKind"),
            "attachmentName": self._require_string(request, "attachmentName"),
            "attachmentSizeBytes": len(content),
            "source": self._source_or_default(request),
        }
        if isinstance(attachment_type, str) and attachment_type.strip() != "":
            intake_request["attachmentType"] = attachment_type.strip()
        conversation_id = request.get("conversationId")
        if isinstance(conversation_id, str) and conversation_id.strip() != "":
            intake_request["conversationId"] = conversation_id.strip()
        if isinstance(text, str) and text.strip() != "":
            intake_request["text"] = text.strip()

        attachment = self._build_intake(intake_request)
        attachment["contentSha256"] = hashlib.sha256(content).hexdigest()
        attachment["contentStatus"] = "content_received"
        return self._repository.create_intake(attachment)

    def list_for_conversation(
        self,
        conversation_id: str,
        limit: int = 10,
    ) -> list[AttachmentIntake]:
        if conversation_id.strip() == "":
            raise ValueError("conversationId is required")
        safe_limit = max(1, min(limit, 50))
        return self._repository.list_for_conversation(
            conversation_id.strip(),
            safe_limit,
        )

    def _require_string(self, payload: Mapping[str, object], key: str) -> str:
        value = payload.get(key)
        if not isinstance(value, str) or value.strip() == "":
            raise ValueError(f"{key} is required")
        return value.strip()

    def _decode_content(self, request: AttachmentUploadRequest) -> bytes:
        value = self._require_string(request, "base64Content")
        try:
            content = base64.b64decode(value, validate=True)
        except (binascii.Error, ValueError) as exc:
            raise ValueError("base64Content must be valid base64") from exc
        if len(content) == 0:
            raise ValueError("base64Content must not be empty")
        if len(content) > self._MAX_UPLOAD_BYTES:
            raise ValueError("base64Content exceeds 5MB limit")
        return content

    def _extract_text(self, content: bytes, attachment_type: object) -> str:
        if not isinstance(attachment_type, str):
            return ""
        normalized_type = attachment_type.strip().lower()
        if not (
            normalized_type.startswith("text/")
            or normalized_type in {"application/json", "text"}
        ):
            return ""
        try:
            return content.decode("utf-8").strip()
        except UnicodeDecodeError:
            return ""

    def _attachment_text(
        self,
        supplied_text: object,
        content: bytes,
        attachment_type: object,
    ) -> str:
        extracted_text = self._extract_text(content, attachment_type)
        if not isinstance(supplied_text, str) or supplied_text.strip() == "":
            return extracted_text

        text = supplied_text.strip()
        if extracted_text == "" or extracted_text in text:
            return text
        return f"{text}\n识别文本：{extracted_text}"

    def _source_or_default(self, request: AttachmentUploadRequest) -> str:
        source = request.get("source")
        if isinstance(source, str) and source.strip() != "":
            return source.strip()
        return "h5.composer.attachment.upload"
