import psycopg
from agent_runtime.memory.event_log import AgentEvent
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb

from backend.app.services.database import DatabaseSettings, ensure_conversation


class PostgresEventLogRepository:
    def __init__(self, settings: DatabaseSettings) -> None:
        self._settings = settings

    def append(self, event: AgentEvent) -> AgentEvent:
        try:
            with self._connect() as connection:
                with connection.transaction():
                    ensure_conversation(connection, self._settings, event.conversation_id)
                    connection.execute(
                        """
                        insert into agent_events (
                          id,
                          conversation_id,
                          turn_id,
                          plan_id,
                          event_type,
                          payload
                        )
                        values (%s, %s, %s, %s, %s, %s)
                        on conflict (id) do update set payload = excluded.payload
                        """,
                        (
                            event.id,
                            event.conversation_id,
                            event.turn_id,
                            event.plan_id,
                            event.event_type,
                            Jsonb(event.payload),
                        ),
                    )
        except psycopg.errors.UndefinedTable:
            return event
        return event

    def list_for_conversation(self, conversation_id: str) -> list[AgentEvent]:
        try:
            with self._connect() as connection:
                rows = connection.execute(
                    """
                    select id, conversation_id, turn_id, plan_id, event_type, payload
                    from agent_events
                    where conversation_id = %s
                    order by created_at, id
                    """,
                    (conversation_id,),
                ).fetchall()
        except psycopg.errors.UndefinedTable:
            return []
        return [
            AgentEvent(
                id=str(row["id"]),
                conversation_id=str(row["conversation_id"]),
                turn_id=self._optional_text(row["turn_id"]),
                plan_id=self._optional_text(row["plan_id"]),
                event_type=str(row["event_type"]),
                payload=dict(row["payload"]) if isinstance(row["payload"], dict) else {},
            )
            for row in rows
        ]

    def _connect(self) -> psycopg.Connection[dict[str, object]]:
        return psycopg.connect(self._settings.url, row_factory=dict_row)

    def _optional_text(self, value: object) -> str | None:
        if value is None:
            return None
        return str(value)
