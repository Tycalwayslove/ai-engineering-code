from datetime import datetime

import psycopg
from psycopg.rows import dict_row

from backend.app.domains.attachment.models import AttachmentIntake
from backend.app.domains.attachment.service import AttachmentIntakeService
from backend.app.services.database import DatabaseSettings, ensure_conversation


class PostgresAttachmentIntakeRepository:
    def __init__(self, settings: DatabaseSettings) -> None:
        self._settings = settings

    def create_intake(self, attachment: AttachmentIntake) -> AttachmentIntake:
        with self._connect() as connection:
            with connection.transaction():
                conversation_id = attachment.get("conversationId")
                if conversation_id is not None:
                    ensure_conversation(connection, self._settings, conversation_id)
                row = connection.execute(
                    """
                    insert into attachment_intakes (
                      id,
                      conversation_id,
                      native_attachment_id,
                      kind,
                      name,
                      type,
                      size_bytes,
                      source,
                      text,
                      content_sha256,
                      content_status,
                      status,
                      created_at
                    )
                    values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    returning
                      id,
                      conversation_id,
                      native_attachment_id,
                      kind,
                      name,
                      type,
                      size_bytes,
                      source,
                      text,
                      content_sha256,
                      content_status,
                      status,
                      created_at
                    """,
                    (
                        attachment["id"],
                        conversation_id,
                        attachment["attachmentId"],
                        attachment["kind"],
                        attachment["name"],
                        attachment.get("type"),
                        attachment.get("sizeBytes"),
                        attachment.get("source"),
                        attachment.get("text"),
                        attachment.get("contentSha256"),
                        attachment.get("contentStatus"),
                        attachment["status"],
                        attachment["createdAt"],
                    ),
                ).fetchone()
        if row is None:
            raise RuntimeError("failed to create attachment intake")
        return self._attachment_from_row(row)

    def list_for_conversation(
        self,
        conversation_id: str,
        limit: int = 10,
    ) -> list[AttachmentIntake]:
        with self._connect() as connection:
            rows = connection.execute(
                """
                select
                  id,
                  conversation_id,
                  native_attachment_id,
                  kind,
                  name,
                  type,
                  size_bytes,
                  source,
                  text,
                  content_sha256,
                  content_status,
                  status,
                  created_at
                from attachment_intakes
                where conversation_id = %s
                order by created_at desc, id desc
                limit %s
                """,
                (conversation_id, limit),
            ).fetchall()
        return [self._attachment_from_row(row) for row in reversed(rows)]

    def to_domain_service(self) -> AttachmentIntakeService:
        return AttachmentIntakeService(self)

    def _connect(self) -> psycopg.Connection[dict[str, object]]:
        return psycopg.connect(self._settings.url, row_factory=dict_row)

    def _attachment_from_row(self, row: dict[str, object]) -> AttachmentIntake:
        created_at = row["created_at"]
        if not isinstance(created_at, datetime):
            raise TypeError("attachment created_at must be a datetime")

        attachment: AttachmentIntake = {
            "attachmentId": str(row["native_attachment_id"]),
            "createdAt": created_at.isoformat(),
            "id": str(row["id"]),
            "kind": str(row["kind"]),
            "name": str(row["name"]),
            "status": "received",
        }
        conversation_id = row.get("conversation_id")
        if conversation_id is not None:
            attachment["conversationId"] = str(conversation_id)
        size_bytes = row.get("size_bytes")
        if isinstance(size_bytes, int):
            attachment["sizeBytes"] = size_bytes
        source = row.get("source")
        if source is not None:
            attachment["source"] = str(source)
        text = row.get("text")
        if text is not None:
            attachment["text"] = str(text)
        content_sha256 = row.get("content_sha256")
        if content_sha256 is not None:
            attachment["contentSha256"] = str(content_sha256)
        content_status = row.get("content_status")
        if content_status is not None:
            attachment["contentStatus"] = "content_received"
        attachment_type = row.get("type")
        if attachment_type is not None:
            attachment["type"] = str(attachment_type)
        return attachment
