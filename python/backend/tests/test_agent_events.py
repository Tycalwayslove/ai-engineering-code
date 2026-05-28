from os import environ
from uuid import uuid4

import pytest
from agent_runtime.memory.event_log import AgentEvent
from agent_runtime.tracing.decision_trace import DecisionTrace
from backend.app.infrastructure.postgres.decision_trace_repository import (
    PostgresDecisionTraceRepository,
)
from backend.app.infrastructure.postgres.event_log_repository import (
    PostgresEventLogRepository,
)
from backend.app.services.database import DatabaseSettings

psycopg = pytest.importorskip("psycopg")


def _settings() -> DatabaseSettings:
    return DatabaseSettings(
        url=environ.get(
            "DATABASE_URL",
            "postgresql://ai_code:ai_code@127.0.0.1:5432/ai_code",
        ),
        default_user_id="test_user",
    )


def _require_postgres(settings: DatabaseSettings) -> None:
    try:
        with psycopg.connect(settings.url) as connection:
            connection.execute("select 1")
    except psycopg.OperationalError as exc:
        pytest.skip(f"Postgres is not available for integration test: {exc}")


def _ensure_runtime_tables(settings: DatabaseSettings) -> None:
    with psycopg.connect(settings.url) as connection:
        connection.execute(
            """
            create table if not exists agent_events (
              id text primary key,
              conversation_id text not null references conversations(id) on delete cascade,
              turn_id text references conversation_turns(id) on delete set null,
              plan_id text references execution_plans(id) on delete set null,
              event_type text not null,
              payload jsonb not null default '{}'::jsonb,
              created_at timestamptz not null default now()
            )
            """
        )
        connection.execute(
            """
            create table if not exists decision_traces (
              id text primary key,
              conversation_id text not null references conversations(id) on delete cascade,
              planner_mode text not null,
              context_sections_used jsonb not null default '[]'::jsonb,
              tools_considered jsonb not null default '[]'::jsonb,
              tools_selected jsonb not null default '[]'::jsonb,
              missing_information jsonb not null default '[]'::jsonb,
              policy_decisions jsonb not null default '[]'::jsonb,
              confirmation_reason text,
              fallback_reason text,
              reasoning_summary jsonb not null default '[]'::jsonb,
              llm_call jsonb,
              created_at timestamptz not null default now()
            )
            """
        )
        connection.execute(
            """
            alter table decision_traces
              add column if not exists llm_call jsonb
            """
        )


def test_agent_event_log_persists_events_to_postgres() -> None:
    settings = _settings()
    _require_postgres(settings)
    _ensure_runtime_tables(settings)
    conversation_id = f"conversation_{uuid4().hex}"
    repository = PostgresEventLogRepository(settings=settings)

    event = repository.append(
        AgentEvent(
            conversation_id=conversation_id,
            event_type="planning_started",
            payload={"text": "明天上午九点提醒我带电脑"},
        )
    )

    events = repository.list_for_conversation(conversation_id)

    assert events == [event]
    assert events[0].payload == {"text": "明天上午九点提醒我带电脑"}

    with psycopg.connect(settings.url) as connection:
        connection.execute("delete from conversations where id = %s", (conversation_id,))


def test_decision_trace_repository_round_trips_trace() -> None:
    settings = _settings()
    _require_postgres(settings)
    _ensure_runtime_tables(settings)
    conversation_id = f"conversation_{uuid4().hex}"
    repository = PostgresDecisionTraceRepository(settings=settings)
    trace = DecisionTrace(
        id=f"trace_{uuid4().hex}",
        planner_mode="rule",
        context_sections_used=["current_input", "tool_catalog"],
        tools_considered=["reminder.create_reminder"],
        tools_selected=["reminder.create_reminder"],
        missing_information=[],
        policy_decisions=["confirmation_required"],
        confirmation_reason="写入动作需要用户确认。",
        fallback_reason=None,
        reasoning_summary=["识别到提醒动作。"],
        llm_call={
            "provider": "DeepSeekLlmProvider",
            "model": "deepseek-v4-flash",
            "mode": "llm",
            "status": "completed",
            "durationMs": 321,
            "promptChars": 1000,
            "responseChars": 120,
            "promptSha256": "abc123",
        },
    )

    repository.save(conversation_id=conversation_id, trace=trace)

    assert repository.get(trace.id) == trace

    with psycopg.connect(settings.url) as connection:
        connection.execute("delete from conversations where id = %s", (conversation_id,))
