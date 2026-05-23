from os import environ
from uuid import uuid4

import pytest
from backend.app.domains.calendar.postgres_repository import PostgresCalendarEventRepository
from backend.app.services.conversation_turn_store import PostgresConversationTurnStore
from backend.app.services.database import DatabaseSettings
from backend.app.services.postgres_execution_store import PostgresExecutionStore
from orchestrator.executor import ExecutionCoordinator
from orchestrator.planner import ExecutionPlanner

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


def _cleanup_conversation(conversation_id: str) -> None:
    with psycopg.connect(_settings().url) as connection:
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


def test_agent_execution_flow_persists_to_postgres() -> None:
    settings = _settings()
    _require_postgres(settings)
    conversation_id = f"conversation_{uuid4().hex}"
    _cleanup_conversation(conversation_id)
    store = PostgresExecutionStore(settings=settings)
    turn_store = PostgresConversationTurnStore(settings=settings)
    calendar_repository = PostgresCalendarEventRepository(settings=settings)
    planner = ExecutionPlanner(store=store)
    coordinator = ExecutionCoordinator(
        store=store,
        calendar_service=calendar_repository.to_domain_service(),
    )

    planning_response = planner.submit_turn(
        conversation_id=conversation_id,
        text="明天下午三点开会",
        now="2026-05-23T09:00:00+08:00",
        timezone="Asia/Shanghai",
    )
    assert planning_response["kind"] == "confirmation_required"
    plan = planning_response["plan"]
    confirmation = plan["confirmation"]
    assert confirmation is not None

    result = coordinator.confirm_plan(
        plan_id=plan["id"],
        confirm_token=confirmation["confirmToken"],
    )

    assert result["kind"] == "execution_result"
    assert result["plan"]["status"] == "succeeded"
    turn_store.record_user_turn(
        conversation_id=conversation_id,
        input_text="明天下午三点开会",
        raw_content={"clientContext": {"timezone": "Asia/Shanghai"}},
    )
    turn_store.record_assistant_turn(
        conversation_id=conversation_id,
        response_summary=result["plan"]["summary"],
        structured_response=dict(result),
    )

    with psycopg.connect(settings.url) as connection:
        persisted_plan = connection.execute(
            "select status from execution_plans where id = %s",
            (plan["id"],),
        ).fetchone()
        persisted_actions = connection.execute(
            "select status from domain_actions where plan_id = %s",
            (plan["id"],),
        ).fetchall()
        persisted_ledger = connection.execute(
            "select event_type from execution_ledger where plan_id = %s order by created_at",
            (plan["id"],),
        ).fetchall()
        persisted_events = connection.execute(
            """
            select title, source_action_id
            from calendar_events
            where source_action_id in (
              select id from domain_actions where plan_id = %s
            )
            """,
            (plan["id"],),
        ).fetchall()
        persisted_turns = connection.execute(
            """
            select role, count(*)
            from conversation_turns
            where conversation_id = %s
            group by role
            order by role
            """,
            (conversation_id,),
        ).fetchall()

    assert persisted_plan == ("succeeded",)
    assert persisted_actions == [("succeeded",)]
    assert [row[0] for row in persisted_ledger] == [
        "plan_created",
        "confirmation_created",
        "action_executed",
    ]
    assert persisted_events == [("开会", plan["actions"][0]["id"])]
    assert persisted_turns == [("assistant", 1), ("user", 1)]

    _cleanup_conversation(conversation_id)
