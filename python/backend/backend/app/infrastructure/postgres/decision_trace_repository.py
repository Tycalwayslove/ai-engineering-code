import psycopg
from agent_runtime.tracing.decision_trace import DecisionTrace
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb

from backend.app.services.database import DatabaseSettings, ensure_conversation


class PostgresDecisionTraceRepository:
    def __init__(self, settings: DatabaseSettings) -> None:
        self._settings = settings

    def save(self, conversation_id: str, trace: DecisionTrace) -> DecisionTrace:
        try:
            with self._connect() as connection:
                with connection.transaction():
                    ensure_conversation(connection, self._settings, conversation_id)
                    connection.execute(
                        """
                        insert into decision_traces (
                          id,
                          conversation_id,
                          planner_mode,
                          context_sections_used,
                          tools_considered,
                          tools_selected,
                          missing_information,
                          policy_decisions,
                          confirmation_reason,
                          fallback_reason,
                          reasoning_summary,
                          llm_call
                        )
                        values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        on conflict (id) do update set
                          context_sections_used = excluded.context_sections_used,
                          tools_considered = excluded.tools_considered,
                          tools_selected = excluded.tools_selected,
                          missing_information = excluded.missing_information,
                          policy_decisions = excluded.policy_decisions,
                          confirmation_reason = excluded.confirmation_reason,
                          fallback_reason = excluded.fallback_reason,
                          reasoning_summary = excluded.reasoning_summary,
                          llm_call = excluded.llm_call
                        """,
                        (
                            trace.id,
                            conversation_id,
                            trace.planner_mode,
                            Jsonb(trace.context_sections_used),
                            Jsonb(trace.tools_considered),
                            Jsonb(trace.tools_selected),
                            Jsonb(trace.missing_information),
                            Jsonb(trace.policy_decisions),
                            trace.confirmation_reason,
                            trace.fallback_reason,
                            Jsonb(trace.reasoning_summary),
                            Jsonb(trace.llm_call) if trace.llm_call is not None else None,
                        ),
                    )
        except psycopg.errors.UndefinedTable:
            return trace
        return trace

    def get(self, trace_id: str) -> DecisionTrace | None:
        try:
            with self._connect() as connection:
                row = connection.execute(
                    """
                    select id, planner_mode, context_sections_used, tools_considered,
                      tools_selected, missing_information, policy_decisions,
                      confirmation_reason, fallback_reason, reasoning_summary, llm_call
                    from decision_traces
                    where id = %s
                    """,
                    (trace_id,),
                ).fetchone()
        except psycopg.errors.UndefinedTable:
            return None
        if row is None:
            return None

        return DecisionTrace(
            id=str(row["id"]),
            planner_mode=str(row["planner_mode"]),
            context_sections_used=self._text_list(row["context_sections_used"]),
            tools_considered=self._text_list(row["tools_considered"]),
            tools_selected=self._text_list(row["tools_selected"]),
            missing_information=self._text_list(row["missing_information"]),
            policy_decisions=self._text_list(row["policy_decisions"]),
            confirmation_reason=self._optional_text(row["confirmation_reason"]),
            fallback_reason=self._optional_text(row["fallback_reason"]),
            reasoning_summary=self._text_list(row["reasoning_summary"]),
            llm_call=self._optional_dict(row["llm_call"]),
        )

    def _connect(self) -> psycopg.Connection[dict[str, object]]:
        return psycopg.connect(self._settings.url, row_factory=dict_row)

    def _text_list(self, value: object) -> list[str]:
        if not isinstance(value, list):
            return []
        return [str(item) for item in value]

    def _optional_text(self, value: object) -> str | None:
        if value is None:
            return None
        return str(value)

    def _optional_dict(self, value: object) -> dict[str, object] | None:
        if not isinstance(value, dict):
            return None
        return dict(value)
