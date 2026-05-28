import psycopg
from agent_runtime.clarifications.types import (
    PendingClarification,
    PendingClarificationStatus,
)
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb

from backend.app.services.database import DatabaseSettings, ensure_conversation


class PostgresPendingClarificationRepository:
    def __init__(self, settings: DatabaseSettings) -> None:
        self._settings = settings

    def save(self, pending: PendingClarification) -> None:
        with self._connect() as connection:
            with connection.transaction():
                ensure_conversation(
                    connection,
                    self._settings,
                    pending.conversation_id,
                )
                connection.execute(
                    """
                    insert into pending_clarifications (
                      id,
                      conversation_id,
                      domain,
                      action_type,
                      question,
                      missing_fields,
                      partial_payload,
                      quick_replies,
                      status,
                      created_at,
                      expires_at,
                      resolved_at
                    )
                    values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    on conflict (id) do update set
                      question = excluded.question,
                      missing_fields = excluded.missing_fields,
                      partial_payload = excluded.partial_payload,
                      quick_replies = excluded.quick_replies,
                      status = excluded.status,
                      expires_at = excluded.expires_at,
                      resolved_at = excluded.resolved_at
                    """,
                    (
                        pending.id,
                        pending.conversation_id,
                        pending.domain,
                        pending.action_type,
                        pending.question,
                        Jsonb(pending.missing_fields),
                        Jsonb(pending.partial_payload),
                        Jsonb(pending.quick_replies),
                        pending.status,
                        pending.created_at,
                        pending.expires_at,
                        pending.resolved_at,
                    ),
                )

    def latest_open(
        self,
        conversation_id: str,
        now: object,
    ) -> PendingClarification | None:
        with self._connect() as connection:
            row = connection.execute(
                """
                select id, conversation_id, domain, action_type, question,
                  missing_fields, partial_payload, quick_replies, status,
                  created_at, expires_at, resolved_at
                from pending_clarifications
                where conversation_id = %s
                  and status = 'open'
                  and expires_at > %s
                order by created_at desc, id desc
                limit 1
                """,
                (conversation_id, now),
            ).fetchone()
        if row is None:
            return None
        return self._pending_from_row(row)

    def mark_resolved(self, pending_id: str, resolved_at: object) -> None:
        self._mark_closed(
            pending_id=pending_id,
            closed_at=resolved_at,
            status="resolved",
        )

    def mark_abandoned(self, pending_id: str, abandoned_at: object) -> None:
        self._mark_closed(
            pending_id=pending_id,
            closed_at=abandoned_at,
            status="abandoned",
        )

    def _mark_closed(
        self,
        *,
        pending_id: str,
        closed_at: object,
        status: str,
    ) -> None:
        with self._connect() as connection:
            connection.execute(
                """
                update pending_clarifications
                set status = %s, resolved_at = %s
                where id = %s
                """,
                (status, closed_at, pending_id),
            )

    def list_for_conversation(self, conversation_id: str) -> list[PendingClarification]:
        with self._connect() as connection:
            rows = connection.execute(
                """
                select id, conversation_id, domain, action_type, question,
                  missing_fields, partial_payload, quick_replies, status,
                  created_at, expires_at, resolved_at
                from pending_clarifications
                where conversation_id = %s
                order by created_at, id
                """,
                (conversation_id,),
            ).fetchall()
        return [self._pending_from_row(row) for row in rows]

    def _pending_from_row(self, row: dict[str, object]) -> PendingClarification:
        return PendingClarification(
            id=str(row["id"]),
            conversation_id=str(row["conversation_id"]),
            domain=str(row["domain"]),
            action_type=str(row["action_type"]),
            question=str(row["question"]),
            missing_fields=self._text_list(row["missing_fields"]),
            partial_payload=self._object_dict(row["partial_payload"]),
            quick_replies=self._text_list(row["quick_replies"]),
            status=self._status(row["status"]),
            created_at=row["created_at"],  # type: ignore[arg-type]
            expires_at=row["expires_at"],  # type: ignore[arg-type]
            resolved_at=row["resolved_at"],  # type: ignore[arg-type]
        )

    def _connect(self) -> psycopg.Connection[dict[str, object]]:
        return psycopg.connect(self._settings.url, row_factory=dict_row)

    def _text_list(self, value: object) -> list[str]:
        if not isinstance(value, list):
            return []
        return [str(item) for item in value]

    def _object_dict(self, value: object) -> dict[str, object]:
        if not isinstance(value, dict):
            return {}
        return dict(value)

    def _status(self, value: object) -> PendingClarificationStatus:
        if value in ("open", "resolved", "abandoned"):
            return value
        return "open"
