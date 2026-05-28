from typing import Protocol

from backend.app.domains.attachment.models import AttachmentIntake


class AttachmentIntakeRepository(Protocol):
    def create_intake(self, attachment: AttachmentIntake) -> AttachmentIntake: ...

    def list_for_conversation(
        self,
        conversation_id: str,
        limit: int = 10,
    ) -> list[AttachmentIntake]: ...


class InMemoryAttachmentIntakeRepository:
    def __init__(self) -> None:
        self._attachments_by_id: dict[str, AttachmentIntake] = {}

    def create_intake(self, attachment: AttachmentIntake) -> AttachmentIntake:
        self._attachments_by_id[attachment["id"]] = attachment.copy()
        return attachment

    def list_for_conversation(
        self,
        conversation_id: str,
        limit: int = 10,
    ) -> list[AttachmentIntake]:
        matches = [
            attachment
            for attachment in self._attachments_by_id.values()
            if attachment.get("conversationId") == conversation_id
        ]
        return sorted(
            matches,
            key=lambda attachment: (
                str(attachment.get("createdAt", "")),
                str(attachment.get("id", "")),
            ),
        )[-limit:]
