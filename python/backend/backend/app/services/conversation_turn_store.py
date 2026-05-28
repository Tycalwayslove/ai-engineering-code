from datetime import datetime
from typing import Literal, Protocol, TypedDict
from uuid import uuid4

import psycopg
from psycopg.types.json import Jsonb

from backend.app.services.database import DatabaseSettings, ensure_conversation

ConversationTurnRole = Literal["assistant", "system", "user"]


class ConversationTurn(TypedDict, total=False):
    id: str
    conversationId: str
    role: ConversationTurnRole
    inputText: str
    rawContent: dict[str, object]
    responseSummary: str
    structuredResponse: dict[str, object]
    createdAt: str


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

    def list_for_conversation(
        self,
        conversation_id: str,
        limit: int = 50,
    ) -> list[ConversationTurn]: ...


class InMemoryConversationTurnStore:
    def __init__(self) -> None:
        self._turns: list[ConversationTurn] = []

    def record_user_turn(
        self,
        conversation_id: str,
        input_text: str,
        raw_content: dict[str, object],
    ) -> None:
        self._turns.append(
            {
                "conversationId": conversation_id,
                "createdAt": _now_isoformat(),
                "id": f"turn_{uuid4().hex}",
                "inputText": input_text,
                "rawContent": raw_content,
                "role": "user",
            },
        )

    def record_assistant_turn(
        self,
        conversation_id: str,
        response_summary: str,
        structured_response: dict[str, object],
    ) -> None:
        self._turns.append(
            {
                "conversationId": conversation_id,
                "createdAt": _now_isoformat(),
                "id": f"turn_{uuid4().hex}",
                "responseSummary": response_summary,
                "role": "assistant",
                "structuredResponse": structured_response,
            },
        )

    def list_for_conversation(
        self,
        conversation_id: str,
        limit: int = 50,
    ) -> list[ConversationTurn]:
        matches = [
            turn for turn in self._turns if turn["conversationId"] == conversation_id
        ]
        return matches[-limit:]


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

    def list_for_conversation(
        self,
        conversation_id: str,
        limit: int = 50,
    ) -> list[ConversationTurn]:
        with psycopg.connect(self._settings.url) as connection:
            rows = connection.execute(
                """
                select
                  id,
                  conversation_id,
                  role,
                  input_text,
                  response_summary,
                  raw_content,
                  structured_response,
                  created_at
                from conversation_turns
                where conversation_id = %s
                order by created_at asc, id asc
                limit %s
                """,
                (conversation_id, limit),
            ).fetchall()
        return [self._turn_from_row(row) for row in rows]

    def _turn_from_row(self, row: tuple[object, ...]) -> ConversationTurn:
        created_at = row[7]
        if not isinstance(created_at, datetime):
            raise TypeError("conversation turn created_at must be a datetime")

        role = str(row[2])
        if role not in ("assistant", "system", "user"):
            raise ValueError(f"unsupported conversation turn role: {role}")

        turn: ConversationTurn = {
            "conversationId": str(row[1]),
            "createdAt": created_at.isoformat(),
            "id": str(row[0]),
            "role": role,  # type: ignore[typeddict-item]
        }
        input_text = row[3]
        if input_text is not None:
            turn["inputText"] = str(input_text)
        response_summary = row[4]
        if response_summary is not None:
            turn["responseSummary"] = str(response_summary)
        raw_content = row[5]
        if isinstance(raw_content, dict):
            turn["rawContent"] = raw_content
        structured_response = row[6]
        if isinstance(structured_response, dict):
            turn["structuredResponse"] = structured_response
        return turn


def _now_isoformat() -> str:
    return datetime.now().astimezone().isoformat()
