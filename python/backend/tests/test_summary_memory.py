import importlib.util
import sys
from os import environ
from pathlib import Path
from typing import Any
from uuid import uuid4

import pytest
from agent_runtime.memory.ports import EmptyMemorySearchPort
from agent_runtime.memory.summary_memory import (
    InMemorySummaryMemoryRepository,
    SummaryMemory,
)
from backend.app.bootstrap import create_runtime
from backend.app.infrastructure.domain_context_providers import SummaryMemoryProvider
from backend.app.infrastructure.postgres.context_providers import (
    PostgresSummaryMemoryProvider,
)
from backend.app.infrastructure.postgres.summary_memory_repository import (
    PostgresSummaryMemoryRepository,
)
from backend.app.services.database import DatabaseSettings
from backend.app.services.direct_action_audit import DirectActionAuditService
from backend.app.services.execution_store import InMemoryExecutionStore


def _psycopg() -> Any:
    return pytest.importorskip("psycopg")


def _settings() -> DatabaseSettings:
    return DatabaseSettings(
        url=environ.get(
            "DATABASE_URL",
            "postgresql://ai_code:ai_code@127.0.0.1:5432/ai_code",
        ),
        default_user_id="test_user",
    )


def _require_postgres(settings: DatabaseSettings) -> None:
    psycopg = _psycopg()
    try:
        with psycopg.connect(settings.url) as connection:
            connection.execute("select 1")
    except psycopg.OperationalError as exc:
        pytest.skip(f"Postgres is not available for integration test: {exc}")


def _ensure_summary_memory_table(settings: DatabaseSettings) -> None:
    psycopg = _psycopg()
    with psycopg.connect(settings.url) as connection:
        connection.execute(
            """
            create table if not exists summary_memories (
              id text primary key,
              conversation_id text not null references conversations(id) on delete cascade,
              memory_type text not null,
              summary text not null,
              payload jsonb not null default '{}'::jsonb,
              source_event_ids text[] not null default array[]::text[],
              created_at timestamptz not null default now()
            )
            """
        )


def _load_db_migrate_module() -> Any:
    script_path = Path(__file__).resolve().parents[3] / "scripts" / "db_migrate.py"
    spec = importlib.util.spec_from_file_location("db_migrate", script_path)
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules["db_migrate"] = module
    spec.loader.exec_module(module)
    return module


def _run_migrations(settings: DatabaseSettings) -> None:
    db_migrate = _load_db_migrate_module()
    migrations_dir = Path(__file__).resolve().parents[3] / "infra/db/migrations"
    db_migrate.run_migrations(
        database_url=settings.url,
        migrations_dir=migrations_dir,
    )


def _cleanup_conversation(settings: DatabaseSettings, conversation_id: str) -> None:
    with _psycopg().connect(settings.url) as connection:
        connection.execute(
            """
            delete from reminders
            where source_action_id in (
              select domain_actions.id
              from domain_actions
              join execution_plans on execution_plans.id = domain_actions.plan_id
              where execution_plans.conversation_id = %s
            )
            """,
            (conversation_id,),
        )
        connection.execute(
            """
            delete from expense_records
            where source_action_id in (
              select domain_actions.id
              from domain_actions
              join execution_plans on execution_plans.id = domain_actions.plan_id
              where execution_plans.conversation_id = %s
            )
            """,
            (conversation_id,),
        )
        connection.execute(
            """
            delete from calendar_events
            where source_action_id in (
              select domain_actions.id
              from domain_actions
              join execution_plans on execution_plans.id = domain_actions.plan_id
              where execution_plans.conversation_id = %s
            )
            """,
            (conversation_id,),
        )
        connection.execute(
            "delete from conversations where id = %s",
            (conversation_id,),
        )


def test_empty_memory_search_returns_no_results() -> None:
    search = EmptyMemorySearchPort()

    assert search.search(
        "明天上午安排",
        filters={"conversation_id": "conversation_001"},
    ) == []


def test_summary_memory_carries_type_and_payload() -> None:
    memory = SummaryMemory(
        conversation_id="conversation_001",
        memory_type="preference",
        summary="用户偏好提前 30 分钟提醒",
        payload={"leadMinutes": 30},
        source_event_ids=["event_001"],
    )

    assert memory.memory_type == "preference"
    assert memory.payload == {"leadMinutes": 30}
    assert memory.source_event_ids == ["event_001"]


def test_summary_memory_provider_returns_conversation_summaries() -> None:
    repository = InMemorySummaryMemoryRepository()
    repository.save(
        SummaryMemory(
            conversation_id="conversation_001",
            memory_type="domain_fact",
            summary="创建提醒：带电脑；状态 scheduled",
            payload={"domain": "reminder"},
        )
    )
    repository.save(
        SummaryMemory(
            conversation_id="conversation_other",
            memory_type="domain_fact",
            summary="创建提醒：喝水；状态 scheduled",
            payload={"domain": "reminder"},
        )
    )
    repository.save(
        SummaryMemory(
            conversation_id="conversation_001",
            memory_type="preference",
            summary="用户偏好提前 30 分钟提醒",
            payload={"leadMinutes": 30},
        )
    )

    summaries = SummaryMemoryProvider(repository).get("conversation_001", "")

    assert summaries == ["创建提醒：带电脑；状态 scheduled"]


def test_direct_action_auditor_writes_domain_fact_summary_memory() -> None:
    execution_store = InMemoryExecutionStore()
    memory_repository = InMemorySummaryMemoryRepository()
    auditor = DirectActionAuditService(
        execution_store=execution_store,
        summary_memory_repository=memory_repository,
    )

    auditor.record_success(
        conversation_id="conversation_direct_action_memory",
        domain="reminder",
        action_type="reminder.complete_reminder",
        summary="完成提醒：带电脑",
        payload={"target_id": "reminder_001"},
        result={
            "reminder": {
                "id": "reminder_001",
                "sourceActionId": "action_create_reminder",
                "status": "done",
                "title": "带电脑",
            }
        },
    )

    memories = memory_repository.list_for_conversation(
        "conversation_direct_action_memory"
    )
    assert [memory.summary for memory in memories] == ["完成提醒：带电脑；状态 done"]
    assert memories[0].memory_type == "domain_fact"
    assert memories[0].payload["actionType"] == "reminder.complete_reminder"
    assert memories[0].payload["factId"] == "reminder_001"
    assert memories[0].payload["factStatus"] == "done"
    assert memories[0].source_event_ids == ["ledger_1"]


def test_in_memory_runtime_writes_summary_memory_into_next_context(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("AI_PLANNER_MODE", "rule")
    runtime = create_runtime(settings=None)

    planning_response = runtime.submit_turn_use_case.execute(
        conversation_id="conversation_runtime_memory",
        input_text="明天上午九点提醒我带电脑",
        display_input=None,
        now="2026-05-21T09:00:00+08:00",
        timezone="Asia/Shanghai",
        client_context={
            "now": "2026-05-21T09:00:00+08:00",
            "timezone": "Asia/Shanghai",
        },
    )
    plan = planning_response["plan"]
    confirmation = plan["confirmation"]
    assert confirmation is not None

    runtime.confirm_plan_use_case.execute(
        plan_id=plan["id"],
        confirm_token=confirmation["confirmToken"],
    )

    memories = runtime.summary_memory_repository.list_for_conversation(
        "conversation_runtime_memory",
    )
    assert [memory.summary for memory in memories] == [
        "创建提醒：带电脑；状态 scheduled",
    ]
    context = runtime.execution_planner._assemble_context(
        conversation_id="conversation_runtime_memory",
        text="今天有什么要注意的？",
        now="2026-05-21T09:01:00+08:00",
        timezone="Asia/Shanghai",
    )
    assert context.relevant_history == ["创建提醒：带电脑；状态 scheduled"]


def test_postgres_runtime_writes_summary_memory_into_next_context(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    settings = _settings()
    _require_postgres(settings)
    _run_migrations(settings)
    monkeypatch.setenv("AI_PLANNER_MODE", "rule")
    conversation_id = f"conversation_{uuid4().hex}"
    runtime = create_runtime(settings=settings)

    try:
        planning_response = runtime.submit_turn_use_case.execute(
            conversation_id=conversation_id,
            input_text="明天上午九点提醒我带电脑",
            display_input=None,
            now="2026-05-21T09:00:00+08:00",
            timezone="Asia/Shanghai",
            client_context={
                "now": "2026-05-21T09:00:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        )
        plan = planning_response["plan"]
        confirmation = plan["confirmation"]
        assert confirmation is not None

        runtime.confirm_plan_use_case.execute(
            plan_id=plan["id"],
            confirm_token=confirmation["confirmToken"],
        )

        memories = runtime.summary_memory_repository.list_for_conversation(
            conversation_id,
        )
        assert [memory.summary for memory in memories] == [
            "创建提醒：带电脑；状态 scheduled",
        ]
        assert memories[0].payload["factTitle"] == "带电脑"
        assert memories[0].payload["factStatus"] == "scheduled"

        context = runtime.execution_planner._assemble_context(
            conversation_id=conversation_id,
            text="今天有什么要注意的？",
            now="2026-05-21T09:01:00+08:00",
            timezone="Asia/Shanghai",
        )
        assert context.relevant_history == ["创建提醒：带电脑；状态 scheduled"]
    finally:
        _cleanup_conversation(settings, conversation_id)


def test_postgres_summary_memory_repository_round_trips_memory() -> None:
    settings = _settings()
    _require_postgres(settings)
    _ensure_summary_memory_table(settings)
    conversation_id = f"conversation_{uuid4().hex}"
    repository = PostgresSummaryMemoryRepository(settings=settings)
    memory = SummaryMemory(
        conversation_id=conversation_id,
        memory_type="domain_fact",
        summary="用户明天上午九点需要带电脑",
        payload={"domain": "reminder"},
        source_event_ids=["event_001"],
    )

    repository.save(memory)

    assert repository.list_for_conversation(conversation_id) == [memory]
    assert repository.search("带电脑", {"conversation_id": conversation_id}) == [memory]

    with _psycopg().connect(settings.url) as connection:
        connection.execute("delete from conversations where id = %s", (conversation_id,))


def test_postgres_summary_memory_provider_filters_domain_facts() -> None:
    settings = _settings()
    _require_postgres(settings)
    _ensure_summary_memory_table(settings)
    conversation_id = f"conversation_{uuid4().hex}"
    repository = PostgresSummaryMemoryRepository(settings=settings)
    repository.save(
        SummaryMemory(
            conversation_id=conversation_id,
            memory_type="preference",
            summary="用户偏好提前 30 分钟提醒",
            payload={"leadMinutes": 30},
        )
    )
    repository.save(
        SummaryMemory(
            conversation_id=conversation_id,
            memory_type="domain_fact",
            summary="创建提醒：带电脑；状态 scheduled",
            payload={"domain": "reminder"},
        )
    )

    summaries = PostgresSummaryMemoryProvider(settings=settings).get(conversation_id, "")

    assert summaries == ["创建提醒：带电脑；状态 scheduled"]

    with _psycopg().connect(settings.url) as connection:
        connection.execute("delete from conversations where id = %s", (conversation_id,))
