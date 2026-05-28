import json
from datetime import datetime

import psycopg
from agent_runtime.tools.catalog import BuiltInToolCatalog
from psycopg.rows import dict_row

from backend.app.services.database import DatabaseSettings


class PostgresRecentConversationProvider:
    def __init__(self, settings: DatabaseSettings, limit: int = 8) -> None:
        self._settings = settings
        self._limit = limit

    def get(self, conversation_id: str, current_input: str) -> list[str]:
        with self._connect() as connection:
            rows = connection.execute(
                """
                select role, input_text, response_summary
                from conversation_turns
                where conversation_id = %s
                order by created_at desc, id desc
                limit %s
                """,
                (conversation_id, self._limit),
            ).fetchall()

        return [self._turn_summary(row) for row in reversed(rows)]

    def _turn_summary(self, row: dict[str, object]) -> str:
        role = str(row["role"])
        content = row["input_text"] if row["input_text"] is not None else row["response_summary"]
        return f"{role}: {content}"

    def _connect(self) -> psycopg.Connection[dict[str, object]]:
        return psycopg.connect(self._settings.url, row_factory=dict_row)


class PostgresPendingPlanProvider:
    def __init__(self, settings: DatabaseSettings, limit: int = 5) -> None:
        self._settings = settings
        self._limit = limit

    def get(self, conversation_id: str, current_input: str) -> list[str]:
        with self._connect() as connection:
            rows = connection.execute(
                """
                select id, summary, risk_level
                from execution_plans
                where conversation_id = %s and status = 'awaiting_confirmation'
                order by created_at desc, id desc
                limit %s
                """,
                (conversation_id, self._limit),
            ).fetchall()

        return [
            f"{row['id']}: {row['summary']} ({row['risk_level']})"
            for row in reversed(rows)
        ]

    def _connect(self) -> psycopg.Connection[dict[str, object]]:
        return psycopg.connect(self._settings.url, row_factory=dict_row)


class PostgresPendingClarificationProvider:
    def __init__(self, settings: DatabaseSettings, limit: int = 3) -> None:
        self._settings = settings
        self._limit = limit

    def get(self, conversation_id: str, current_input: str) -> list[str]:
        del current_input
        with self._connect() as connection:
            try:
                rows = connection.execute(
                    """
                    select id, action_type, question, missing_fields, partial_payload
                    from pending_clarifications
                    where conversation_id = %s
                      and status = 'open'
                      and expires_at > now()
                    order by created_at desc, id desc
                    limit %s
                    """,
                    (conversation_id, self._limit),
                ).fetchall()
            except psycopg.errors.UndefinedTable:
                return []

        return [self._summary(row) for row in reversed(rows)]

    def _summary(self, row: dict[str, object]) -> str:
        partial_payload = row["partial_payload"] if isinstance(row["partial_payload"], dict) else {}
        missing_fields = row["missing_fields"] if isinstance(row["missing_fields"], list) else []
        return (
            f"pending_id={row['id']}; action={row['action_type']}; "
            f"question={row['question']}; missing_fields={missing_fields}; "
            "partial_payload="
            f"{json.dumps(partial_payload, ensure_ascii=False, sort_keys=True)}"
        )

    def _connect(self) -> psycopg.Connection[dict[str, object]]:
        return psycopg.connect(self._settings.url, row_factory=dict_row)


class PostgresCalendarSummaryProvider:
    def __init__(self, settings: DatabaseSettings, limit: int = 8) -> None:
        self._settings = settings
        self._limit = limit

    def get(self, conversation_id: str, current_input: str) -> list[str]:
        del current_input
        with self._connect() as connection:
            rows = connection.execute(
                """
                select calendar_events.id, calendar_events.title,
                  calendar_events.start_at, calendar_events.end_at,
                  calendar_events.timezone, calendar_events.status,
                  calendar_events.source_action_id
                from calendar_events
                join domain_actions
                  on domain_actions.id = calendar_events.source_action_id
                join execution_plans
                  on execution_plans.id = domain_actions.plan_id
                where execution_plans.conversation_id = %s
                order by calendar_events.start_at desc, calendar_events.id desc
                limit %s
                """,
                (conversation_id, self._limit),
            ).fetchall()

        return [
            (
                f"id={row['id']}; source_action_id={row['source_action_id']}; "
                f"title={row['title']}; start_at={self._iso(row['start_at'])}; "
                f"end_at={self._iso(row['end_at'])}; timezone={row['timezone']}; "
                f"status={row['status']}"
            )
            for row in reversed(rows)
        ]

    def _connect(self) -> psycopg.Connection[dict[str, object]]:
        return psycopg.connect(self._settings.url, row_factory=dict_row)

    def _iso(self, value: object) -> str:
        if isinstance(value, datetime):
            return value.isoformat()
        return str(value)


class PostgresReminderSummaryProvider:
    def __init__(self, settings: DatabaseSettings, limit: int = 8) -> None:
        self._settings = settings
        self._limit = limit

    def get(self, conversation_id: str, current_input: str) -> list[str]:
        del current_input
        with self._connect() as connection:
            rows = connection.execute(
                """
                select reminders.id, reminders.title, reminders.due_at,
                  reminders.status, reminders.source_action_id
                from reminders
                join domain_actions on domain_actions.id = reminders.source_action_id
                join execution_plans on execution_plans.id = domain_actions.plan_id
                where execution_plans.conversation_id = %s
                order by reminders.due_at desc, reminders.id desc
                limit %s
                """,
                (conversation_id, self._limit),
            ).fetchall()

        return [
            (
                f"id={row['id']}; source_action_id={row['source_action_id']}; "
                f"title={row['title']}; due_at={self._iso(row['due_at'])}; "
                f"status={row['status']}"
            )
            for row in reversed(rows)
        ]

    def _connect(self) -> psycopg.Connection[dict[str, object]]:
        return psycopg.connect(self._settings.url, row_factory=dict_row)

    def _iso(self, value: object) -> str:
        if isinstance(value, datetime):
            return value.isoformat()
        return str(value)


class PostgresExpenseSummaryProvider:
    def __init__(self, settings: DatabaseSettings, limit: int = 8) -> None:
        self._settings = settings
        self._limit = limit

    def get(self, conversation_id: str, current_input: str) -> list[str]:
        del current_input
        with self._connect() as connection:
            rows = connection.execute(
                """
                select expense_records.id, expense_records.title,
                  expense_records.amount, expense_records.currency,
                  expense_records.occurred_on, expense_records.status,
                  expense_records.source_action_id
                from expense_records
                join domain_actions
                  on domain_actions.id = expense_records.source_action_id
                join execution_plans
                  on execution_plans.id = domain_actions.plan_id
                where execution_plans.conversation_id = %s
                order by expense_records.created_at desc, expense_records.id desc
                limit %s
                """,
                (conversation_id, self._limit),
            ).fetchall()

        return [
            (
                f"id={row['id']}; source_action_id={row['source_action_id']}; "
                f"title={row['title']}; amount={row['amount']}; "
                f"currency={row['currency']}; occurred_on={row['occurred_on']}; "
                f"status={row['status']}"
            )
            for row in reversed(rows)
        ]

    def _connect(self) -> psycopg.Connection[dict[str, object]]:
        return psycopg.connect(self._settings.url, row_factory=dict_row)


class EmptyPreferenceProvider:
    def get(self, conversation_id: str, current_input: str) -> list[str]:
        return []


class PostgresSummaryMemoryProvider:
    def __init__(self, settings: DatabaseSettings, limit: int = 8) -> None:
        self._settings = settings
        self._limit = limit

    def get(self, conversation_id: str, current_input: str) -> list[str]:
        with self._connect() as connection:
            try:
                rows = connection.execute(
                    """
                    select summary
                    from summary_memories
                    where conversation_id = %s
                      and memory_type = 'domain_fact'
                    order by created_at desc, id desc
                    limit %s
                    """,
                    (conversation_id, self._limit),
                ).fetchall()
            except psycopg.errors.UndefinedTable:
                return []

        return [str(row["summary"]) for row in reversed(rows)]

    def _connect(self) -> psycopg.Connection[dict[str, object]]:
        return psycopg.connect(self._settings.url, row_factory=dict_row)


class BuiltInToolCatalogProvider:
    def __init__(self, catalog: BuiltInToolCatalog | None = None) -> None:
        self._catalog = catalog or BuiltInToolCatalog()

    def get(self, conversation_id: str, current_input: str) -> list[str]:
        del conversation_id, current_input
        return [
            json.dumps(
                {
                    "action_type": tool.action_type,
                    "domain": tool.domain,
                    "description": tool.description,
                    "required": tool.input_schema.get("required", []),
                    "properties": tool.input_schema.get("properties", {}),
                    "confirmation_required": tool.confirmation_required,
                    "risk_level": tool.risk_level,
                },
                ensure_ascii=False,
            )
            for tool in self._catalog.list_tools()
        ]
