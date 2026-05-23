from typing import Protocol
from uuid import uuid4

import psycopg
from psycopg.types.json import Jsonb

from backend.app.services.database import DatabaseSettings, ensure_conversation


class ConversationTurnStore(Protocol):
    def record_user_turn(
        self,
        conversation_id: str,
        input_text: str,
        raw_content: dict[str, object],
    ) -> None: ...

    def record_assistant_turn(
        self,
        conversation_id: str,
        response_summary: str,
        structured_response: dict[str, object],
    ) -> None: ...


class InMemoryConversationTurnStore:
    def record_user_turn(
        self,
        conversation_id: str,
        input_text: str,
        raw_content: dict[str, object],
    ) -> None:
        return None

    def record_assistant_turn(
        self,
        conversation_id: str,
        response_summary: str,
        structured_response: dict[str, object],
    ) -> None:
        return None


class PostgresConversationTurnStore:
    def __init__(self, settings: DatabaseSettings) -> None:
        self._settings = settings

    def record_user_turn(
        self,
        conversation_id: str,
        input_text: str,
        raw_content: dict[str, object],
    ) -> None:
        self._record_turn(
            conversation_id=conversation_id,
            role="user",
            input_text=input_text,
            raw_content=raw_content,
            response_summary=None,
            structured_response=None,
        )

    def record_assistant_turn(
        self,
        conversation_id: str,
        response_summary: str,
        structured_response: dict[str, object],
    ) -> None:
        self._record_turn(
            conversation_id=conversation_id,
            role="assistant",
            input_text=None,
            raw_content=None,
            response_summary=response_summary,
            structured_response=structured_response,
        )

    def _record_turn(
        self,
        conversation_id: str,
        role: str,
        input_text: str | None,
        raw_content: dict[str, object] | None,
        response_summary: str | None,
        structured_response: dict[str, object] | None,
    ) -> None:
        with psycopg.connect(self._settings.url) as connection:
            with connection.transaction():
                ensure_conversation(connection, self._settings, conversation_id)
                connection.execute(
                    """
                    insert into conversation_turns (
                      id,
                      conversation_id,
                      role,
                      input_text,
                      response_summary,
                      raw_content,
                      structured_response
                    )
                    values (%s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        f"turn_{uuid4().hex}",
                        conversation_id,
                        role,
                        input_text,
                        response_summary,
                        Jsonb(raw_content) if raw_content is not None else None,
                        Jsonb(structured_response)
                        if structured_response is not None
                        else None,
                    ),
                )
