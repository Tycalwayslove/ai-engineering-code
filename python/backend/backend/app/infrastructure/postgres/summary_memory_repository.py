import psycopg
from agent_runtime.memory.summary_memory import SummaryMemory
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb

from backend.app.services.database import DatabaseSettings, ensure_conversation


class PostgresSummaryMemoryRepository:
    def __init__(self, settings: DatabaseSettings) -> None:
        self._settings = settings

    def save(self, memory: SummaryMemory) -> SummaryMemory:
        try:
            with self._connect() as connection:
                with connection.transaction():
                    ensure_conversation(connection, self._settings, memory.conversation_id)
                    connection.execute(
                        """
                        insert into summary_memories (
                          id,
                          conversation_id,
                          memory_type,
                          summary,
                          payload,
                          source_event_ids
                        )
                        values (%s, %s, %s, %s, %s, %s)
                        on conflict (id) do update set
                          memory_type = excluded.memory_type,
                          summary = excluded.summary,
                          payload = excluded.payload,
                          source_event_ids = excluded.source_event_ids
                        """,
                        (
                            memory.id,
                            memory.conversation_id,
                            memory.memory_type,
                            memory.summary,
                            Jsonb(memory.payload),
                            memory.source_event_ids,
                        ),
                    )
        except psycopg.errors.UndefinedTable:
            return memory
        return memory

    def list_for_conversation(self, conversation_id: str) -> list[SummaryMemory]:
        try:
            with self._connect() as connection:
                rows = connection.execute(
                    """
                    select id, conversation_id, memory_type, summary, payload, source_event_ids
                    from summary_memories
                    where conversation_id = %s
                    order by created_at, id
                    """,
                    (conversation_id,),
                ).fetchall()
        except psycopg.errors.UndefinedTable:
            return []
        return [
            SummaryMemory(
                id=str(row["id"]),
                conversation_id=str(row["conversation_id"]),
                memory_type=str(row["memory_type"]),
                summary=str(row["summary"]),
                payload=dict(row["payload"]) if isinstance(row["payload"], dict) else {},
                source_event_ids=self._text_list(row["source_event_ids"]),
            )
            for row in rows
        ]

    def search(
        self,
        query: str,
        filters: dict[str, object] | None = None,
    ) -> list[SummaryMemory]:
        conversation_id = None if filters is None else filters.get("conversation_id")
        if conversation_id is None:
            return []

        memories = self.list_for_conversation(str(conversation_id))
        return [memory for memory in memories if query in memory.summary]

    def _connect(self) -> psycopg.Connection[dict[str, object]]:
        return psycopg.connect(self._settings.url, row_factory=dict_row)

    def _text_list(self, value: object) -> list[str]:
        if not isinstance(value, list):
            return []
        return [str(item) for item in value]
