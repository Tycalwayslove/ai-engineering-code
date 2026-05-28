from backend.app.domains.attachment.models import AttachmentIntake
from backend.app.domains.attachment.repository import AttachmentIntakeRepository


class AttachmentSummaryProvider:
    def __init__(
        self,
        repository: AttachmentIntakeRepository,
        limit: int = 3,
    ) -> None:
        self._repository = repository
        self._limit = limit

    def get(self, conversation_id: str, current_input: str) -> list[str]:
        del current_input
        if conversation_id == "":
            return []
        return [
            self._summary(attachment)
            for attachment in self._repository.list_for_conversation(
                conversation_id,
                limit=self._limit,
            )
        ]

    def _summary(self, attachment: AttachmentIntake) -> str:
        parts = [
            f"attachment_id={attachment['id']}",
            f"native_attachment_id={attachment['attachmentId']}",
            f"name={attachment['name']}",
            f"kind={attachment['kind']}",
            f"status={attachment['status']}",
        ]
        if "type" in attachment:
            parts.append(f"type={attachment['type']}")
        if "sizeBytes" in attachment:
            parts.append(f"size_bytes={attachment['sizeBytes']}")
        if "source" in attachment:
            parts.append(f"source={attachment['source']}")
        if "text" in attachment:
            parts.append(f"text={self._summary_text(attachment['text'])}")
        return "; ".join(parts)

    def _summary_text(self, text: str) -> str:
        return " ".join(text.replace(";", " ").split())[:300]
