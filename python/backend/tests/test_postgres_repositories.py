from datetime import UTC, date, datetime
from decimal import Decimal
from os import environ
from typing import Any, cast
from uuid import uuid4

import pytest
from backend.app.domains.calendar.postgres_repository import PostgresCalendarEventRepository
from backend.app.domains.expense.postgres_repository import PostgresExpenseRecordRepository
from backend.app.domains.reminder.postgres_repository import PostgresReminderRepository
from backend.app.infrastructure.postgres.context_providers import (
    PostgresCalendarSummaryProvider,
    PostgresExpenseSummaryProvider,
    PostgresReminderSummaryProvider,
)
from backend.app.infrastructure.postgres.summary_memory_repository import (
    PostgresSummaryMemoryRepository,
)
from backend.app.services.conversation_turn_store import PostgresConversationTurnStore
from backend.app.services.database import DatabaseSettings
from backend.app.services.direct_action_audit import DirectActionAuditService
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


def test_calendar_postgres_row_uses_event_timezone_for_iso_output() -> None:
    repository = PostgresCalendarEventRepository(settings=_settings())

    event = repository._event_from_row(
        {
            "id": "calendar_event_timezone",
            "title": "开会",
            "start_at": datetime(2026, 5, 22, 2, 0, tzinfo=UTC),
            "end_at": datetime(2026, 5, 22, 3, 0, tzinfo=UTC),
            "timezone": "Asia/Shanghai",
            "status": "scheduled",
            "source_action_id": "action_timezone",
        },
    )

    assert event["startAt"] == "2026-05-22T10:00:00+08:00"
    assert event["endAt"] == "2026-05-22T11:00:00+08:00"


def test_reminder_postgres_row_uses_reminder_timezone_for_iso_output() -> None:
    repository = PostgresReminderRepository(settings=_settings())

    reminder = repository._reminder_from_row(
        {
            "id": "reminder_timezone",
            "title": "带电脑",
            "due_at": datetime(2026, 5, 22, 1, 0, tzinfo=UTC),
            "timezone": "Asia/Shanghai",
            "status": "scheduled",
            "source_action_id": "action_timezone",
        },
    )

    assert reminder["dueAt"] == "2026-05-22T09:00:00+08:00"


def test_agent_execution_flow_persists_to_postgres() -> None:
    settings = _settings()
    _require_postgres(settings)
    conversation_id = f"conversation_{uuid4().hex}"
    _cleanup_conversation(conversation_id)
    store = PostgresExecutionStore(settings=settings)
    turn_store = PostgresConversationTurnStore(settings=settings)
    calendar_repository = PostgresCalendarEventRepository(settings=settings)
    expense_repository = PostgresExpenseRecordRepository(settings=settings)
    reminder_repository = PostgresReminderRepository(settings=settings)
    planner = ExecutionPlanner(store=store)
    coordinator = ExecutionCoordinator(
        store=store,
        calendar_service=calendar_repository.to_domain_service(),
        expense_service=expense_repository.to_domain_service(),
        reminder_service=reminder_repository.to_domain_service(),
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
    repeated_result = coordinator.confirm_plan(
        plan_id=plan["id"],
        confirm_token=confirmation["confirmToken"],
    )

    assert result["kind"] == "execution_result"
    assert result["plan"]["status"] == "succeeded"
    assert repeated_result["kind"] == "execution_result"
    assert repeated_result["plan"]["status"] == "succeeded"
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
    recorded_turns = turn_store.list_for_conversation(conversation_id)
    conversation_action_ids = store.list_action_ids_for_conversation(conversation_id)
    scoped_ledger = store.list_ledger(conversation_id=conversation_id)
    scoped_events = calendar_repository.list_events(
        source_action_ids=set(conversation_action_ids)
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
    assert [turn["role"] for turn in recorded_turns] == ["user", "assistant"]
    assert recorded_turns[0]["inputText"] == "明天下午三点开会"
    assert recorded_turns[1]["responseSummary"] == result["plan"]["summary"]
    assert recorded_turns[1]["structuredResponse"]["kind"] == "execution_result"
    assert conversation_action_ids == [plan["actions"][0]["id"]]
    assert [item["eventType"] for item in scoped_ledger] == [
        "plan_created",
        "confirmation_created",
        "action_executed",
    ]
    assert [event["sourceActionId"] for event in scoped_events] == [
        plan["actions"][0]["id"]
    ]

    _cleanup_conversation(conversation_id)


def test_pending_confirmation_recovery_token_persists_to_postgres() -> None:
    settings = _settings()
    _require_postgres(settings)
    conversation_id = f"conversation_{uuid4().hex}"
    _cleanup_conversation(conversation_id)
    store = PostgresExecutionStore(settings=settings)
    planner = ExecutionPlanner(store=store)
    coordinator = ExecutionCoordinator(
        store=store,
        calendar_service=PostgresCalendarEventRepository(settings=settings).to_domain_service(),
        expense_service=PostgresExpenseRecordRepository(settings=settings).to_domain_service(),
        reminder_service=PostgresReminderRepository(settings=settings).to_domain_service(),
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

    pending_plans = store.list_pending_plans_for_conversation(conversation_id)

    assert len(pending_plans) == 1
    pending_confirmation = pending_plans[0]["confirmation"]
    assert pending_confirmation is not None
    recovery_token = pending_confirmation["confirmToken"]
    assert recovery_token.startswith("confirm_")
    assert recovery_token != confirmation["confirmToken"]

    result = coordinator.confirm_plan(
        plan_id=plan["id"],
        confirm_token=recovery_token,
    )

    assert result["kind"] == "execution_result"
    assert result["plan"]["status"] == "succeeded"
    assert store.list_pending_plans_for_conversation(conversation_id) == []

    _cleanup_conversation(conversation_id)


def test_direct_action_audit_persists_to_postgres_runtime() -> None:
    settings = _settings()
    _require_postgres(settings)
    conversation_id = f"conversation_{uuid4().hex}"
    _cleanup_conversation(conversation_id)
    store = PostgresExecutionStore(settings=settings)
    memory_repository = PostgresSummaryMemoryRepository(settings=settings)
    auditor = DirectActionAuditService(
        execution_store=store,
        summary_memory_repository=memory_repository,
    )

    auditor.record_success(
        conversation_id=conversation_id,
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

    ledger = store.list_ledger(conversation_id=conversation_id)
    direct_event = ledger[-1]
    plan = store.get_plan(direct_event["planId"])
    memories = memory_repository.list_for_conversation(conversation_id)
    with psycopg.connect(settings.url) as connection:
        persisted_event = connection.execute(
            """
            select event_type, status
            from execution_ledger
            where plan_id = %s
            """,
            (plan["id"],),
        ).fetchone()
        persisted_memory = connection.execute(
            """
            select memory_type, summary
            from summary_memories
            where conversation_id = %s
            """,
            (conversation_id,),
        ).fetchone()

    assert direct_event["eventType"] == "direct_action_executed"
    assert direct_event["status"] == "succeeded"
    assert direct_event["actionId"] == plan["actions"][0]["id"]
    assert plan["id"].startswith("direct_plan_")
    assert plan["status"] == "succeeded"
    assert plan["confirmation"] is None
    assert plan["actions"][0]["actionType"] == "reminder.complete_reminder"
    action_result = cast(dict[str, Any], plan["actions"][0]["result"])
    assert action_result["reminder"]["status"] == "done"
    assert [memory.summary for memory in memories] == [
        "完成提醒：带电脑；状态 done"
    ]
    assert memories[0].payload["factId"] == "reminder_001"
    assert memories[0].source_event_ids == [direct_event["id"]]
    assert persisted_event == ("direct_action_executed", "succeeded")
    assert persisted_memory == ("domain_fact", "完成提醒：带电脑；状态 done")

    _cleanup_conversation(conversation_id)


def test_expense_execution_flow_persists_to_postgres() -> None:
    settings = _settings()
    _require_postgres(settings)
    conversation_id = f"conversation_{uuid4().hex}"
    _cleanup_conversation(conversation_id)
    store = PostgresExecutionStore(settings=settings)
    expense_repository = PostgresExpenseRecordRepository(settings=settings)
    planner = ExecutionPlanner(store=store)
    coordinator = ExecutionCoordinator(
        store=store,
        calendar_service=PostgresCalendarEventRepository(settings=settings).to_domain_service(),
        expense_service=expense_repository.to_domain_service(),
        reminder_service=PostgresReminderRepository(settings=settings).to_domain_service(),
    )

    planning_response = planner.submit_turn(
        conversation_id=conversation_id,
        text="把昨天 58 元打车票报销",
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
    repeated_result = coordinator.confirm_plan(
        plan_id=plan["id"],
        confirm_token=confirmation["confirmToken"],
    )

    assert result["kind"] == "execution_result"
    assert result["plan"]["status"] == "succeeded"
    assert repeated_result["plan"]["status"] == "succeeded"

    with psycopg.connect(settings.url) as connection:
        persisted_records = connection.execute(
            """
            select title, amount, currency, occurred_on, status, source_action_id
            from expense_records
            where source_action_id in (
              select id from domain_actions where plan_id = %s
            )
            """,
            (plan["id"],),
        ).fetchall()

    assert persisted_records == [
        (
            "打车票报销",
            Decimal("58.00"),
            "CNY",
            date(2026, 5, 22),
            "draft",
            plan["actions"][0]["id"],
        )
    ]
    assert expense_repository.list_records()[-1]["sourceActionId"] == plan["actions"][0]["id"]
    assert [
        record["sourceActionId"]
        for record in expense_repository.list_records(
            source_action_ids={plan["actions"][0]["id"]}
        )
    ] == [plan["actions"][0]["id"]]

    _cleanup_conversation(conversation_id)


def test_reminder_execution_flow_persists_to_postgres() -> None:
    settings = _settings()
    _require_postgres(settings)
    conversation_id = f"conversation_{uuid4().hex}"
    _cleanup_conversation(conversation_id)
    store = PostgresExecutionStore(settings=settings)
    reminder_repository = PostgresReminderRepository(settings=settings)
    planner = ExecutionPlanner(store=store)
    coordinator = ExecutionCoordinator(
        store=store,
        calendar_service=PostgresCalendarEventRepository(settings=settings).to_domain_service(),
        expense_service=PostgresExpenseRecordRepository(settings=settings).to_domain_service(),
        reminder_service=reminder_repository.to_domain_service(),
    )

    planning_response = planner.submit_turn(
        conversation_id=conversation_id,
        text="明天上午九点提醒我带电脑",
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
    repeated_result = coordinator.confirm_plan(
        plan_id=plan["id"],
        confirm_token=confirmation["confirmToken"],
    )

    assert result["kind"] == "execution_result"
    assert result["plan"]["status"] == "succeeded"
    assert repeated_result["plan"]["status"] == "succeeded"

    with psycopg.connect(settings.url) as connection:
        persisted_reminders = connection.execute(
            """
            select title, due_at, timezone, status, source_action_id
            from reminders
            where source_action_id in (
              select id from domain_actions where plan_id = %s
            )
            """,
            (plan["id"],),
        ).fetchall()

    assert len(persisted_reminders) == 1
    persisted = persisted_reminders[0]
    assert persisted[0] == "带电脑"
    assert persisted[1].isoformat() == "2026-05-24T01:00:00+00:00"
    assert persisted[2] == "Asia/Shanghai"
    assert persisted[3] == "scheduled"
    assert persisted[4] == plan["actions"][0]["id"]
    assert any(
        reminder["sourceActionId"] == plan["actions"][0]["id"]
        for reminder in reminder_repository.list_reminders()
    )
    assert [
        reminder["sourceActionId"]
        for reminder in reminder_repository.list_reminders(
            source_action_ids={plan["actions"][0]["id"]}
        )
    ] == [plan["actions"][0]["id"]]

    _cleanup_conversation(conversation_id)


def test_postgres_domain_context_providers_are_scoped_to_conversation() -> None:
    settings = _settings()
    _require_postgres(settings)
    conversation_id = f"conversation_{uuid4().hex}"
    other_conversation_id = f"conversation_{uuid4().hex}"
    _cleanup_conversation(conversation_id)
    _cleanup_conversation(other_conversation_id)
    store = PostgresExecutionStore(settings=settings)
    coordinator = ExecutionCoordinator(
        store=store,
        calendar_service=PostgresCalendarEventRepository(settings=settings).to_domain_service(),
        expense_service=PostgresExpenseRecordRepository(settings=settings).to_domain_service(),
        reminder_service=PostgresReminderRepository(settings=settings).to_domain_service(),
    )
    planner = ExecutionPlanner(store=store)

    target_plan_response = planner.submit_turn(
        conversation_id=conversation_id,
        text="明天下午三点安排一个目标会，顺便把昨天 58 元打车票报销，再提醒我带电脑",
        now="2026-05-23T09:00:00+08:00",
        timezone="Asia/Shanghai",
    )
    other_plan_response = planner.submit_turn(
        conversation_id=other_conversation_id,
        text="后天下午三点安排一个干扰会，顺便把昨天 99 元打车票报销，再提醒我带资料",
        now="2026-05-23T09:00:00+08:00",
        timezone="Asia/Shanghai",
    )
    for response in (target_plan_response, other_plan_response):
        plan = response["plan"]
        confirmation = plan["confirmation"]
        assert confirmation is not None
        coordinator.confirm_plan(
            plan_id=plan["id"],
            confirm_token=confirmation["confirmToken"],
        )

    calendar_summary = PostgresCalendarSummaryProvider(settings).get(
        conversation_id,
        "看看当前事项",
    )
    expense_summary = PostgresExpenseSummaryProvider(settings).get(
        conversation_id,
        "看看当前事项",
    )
    reminder_summary = PostgresReminderSummaryProvider(settings).get(
        conversation_id,
        "看看当前事项",
    )

    assert any("目标会" in item for item in calendar_summary)
    assert not any("干扰会" in item for item in calendar_summary)
    assert any("amount=58" in item for item in expense_summary)
    assert not any("amount=99" in item for item in expense_summary)
    assert any("带电脑" in item for item in reminder_summary)
    assert not any("带资料" in item for item in reminder_summary)

    _cleanup_conversation(conversation_id)
    _cleanup_conversation(other_conversation_id)


def test_postgres_repositories_reject_terminal_item_updates() -> None:
    settings = _settings()
    _require_postgres(settings)
    calendar_repository = PostgresCalendarEventRepository(settings=settings)
    expense_repository = PostgresExpenseRecordRepository(settings=settings)
    reminder_repository = PostgresReminderRepository(settings=settings)
    suffix = uuid4().hex
    conversation_ids = [
        f"conversation_calendar_terminal_{suffix}",
        f"conversation_expense_terminal_{suffix}",
        f"conversation_reminder_terminal_{suffix}",
    ]
    store = PostgresExecutionStore(settings=settings)
    planner = ExecutionPlanner(store=store)
    coordinator = ExecutionCoordinator(
        store=store,
        calendar_service=calendar_repository.to_domain_service(),
        expense_service=expense_repository.to_domain_service(),
        reminder_service=reminder_repository.to_domain_service(),
    )

    try:
        calendar_plan_response = planner.submit_turn(
            conversation_id=conversation_ids[0],
            text="明天下午三点开会",
            now="2026-05-23T09:00:00+08:00",
            timezone="Asia/Shanghai",
        )
        expense_plan_response = planner.submit_turn(
            conversation_id=conversation_ids[1],
            text="把昨天 58 元打车票报销",
            now="2026-05-23T09:00:00+08:00",
            timezone="Asia/Shanghai",
        )
        reminder_plan_response = planner.submit_turn(
            conversation_id=conversation_ids[2],
            text="明天上午九点提醒我带电脑",
            now="2026-05-23T09:00:00+08:00",
            timezone="Asia/Shanghai",
        )
        calendar_plan = calendar_plan_response["plan"]
        expense_plan = expense_plan_response["plan"]
        reminder_plan = reminder_plan_response["plan"]

        calendar_confirmation = calendar_plan["confirmation"]
        expense_confirmation = expense_plan["confirmation"]
        reminder_confirmation = reminder_plan["confirmation"]
        assert calendar_confirmation is not None
        assert expense_confirmation is not None
        assert reminder_confirmation is not None
        coordinator.confirm_plan(
            calendar_plan["id"],
            calendar_confirmation["confirmToken"],
        )
        coordinator.confirm_plan(
            expense_plan["id"],
            expense_confirmation["confirmToken"],
        )
        coordinator.confirm_plan(
            reminder_plan["id"],
            reminder_confirmation["confirmToken"],
        )

        with psycopg.connect(settings.url) as connection:
            event_id = connection.execute(
                "select id from calendar_events where source_action_id = %s",
                (calendar_plan["actions"][0]["id"],),
            ).fetchone()[0]
            expense_id = connection.execute(
                "select id from expense_records where source_action_id = %s",
                (expense_plan["actions"][0]["id"],),
            ).fetchone()[0]
            reminder_id = connection.execute(
                "select id from reminders where source_action_id = %s",
                (reminder_plan["actions"][0]["id"],),
            ).fetchone()[0]

        calendar_repository.update_event_status(event_id, "canceled")
        expense_repository.update_record_status(expense_id, "submitted")
        reminder_repository.update_reminder_status(reminder_id, "done")

        with pytest.raises(ValueError):
            calendar_repository.update_event_status(event_id, "canceled")
        with pytest.raises(ValueError):
            expense_repository.update_record_status(expense_id, "canceled")
        with pytest.raises(ValueError):
            reminder_repository.update_reminder_status(reminder_id, "canceled")

        with pytest.raises(ValueError):
            calendar_repository.update_event(event_id, {"title": "不应该被修改"})
        with pytest.raises(ValueError):
            expense_repository.update_record(expense_id, {"title": "不应该被修改"})
        with pytest.raises(ValueError):
            reminder_repository.update_reminder(reminder_id, {"title": "不应该被修改"})

        with pytest.raises(KeyError):
            calendar_repository.update_event(f"missing_{suffix}", {"title": "missing"})
        with pytest.raises(KeyError):
            expense_repository.update_record(f"missing_{suffix}", {"title": "missing"})
        with pytest.raises(KeyError):
            reminder_repository.update_reminder(f"missing_{suffix}", {"title": "missing"})
    finally:
        for conversation_id in conversation_ids:
            _cleanup_conversation(conversation_id)
