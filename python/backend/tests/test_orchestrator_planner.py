import pytest
from agent_runtime.parsers.rule_parser import RuleParser
from backend.app.domains.calendar.repository import InMemoryCalendarEventRepository
from backend.app.domains.calendar.service import CalendarDomainService
from backend.app.services.execution_store import ExecutionPlanRecord, InMemoryExecutionStore
from orchestrator.executor import ExecutionCoordinator
from orchestrator.planner import ExecutionPlanner


def test_rule_parser_extracts_calendar_create_action() -> None:
    parser = RuleParser()

    result = parser.parse(
        text="明天下午三点开会",
        now="2026-05-21T09:00:00+08:00",
        timezone="Asia/Shanghai",
    )

    assert result.intent_count == 1
    assert result.actions[0]["domain"] == "calendar"
    assert result.actions[0]["action_type"] == "calendar.create_event"
    assert result.actions[0]["payload"]["title"] == "开会"
    assert result.actions[0]["payload"]["start_at"] == "2026-05-22T15:00:00+08:00"
    assert result.actions[0]["payload"]["end_at"] == "2026-05-22T16:00:00+08:00"


def test_rule_parser_extracts_multi_intent_calendar_and_expense() -> None:
    parser = RuleParser()

    result = parser.parse(
        text="明天下午三点开会，顺便把昨天打车票报销",
        now="2026-05-21T09:00:00+08:00",
        timezone="Asia/Shanghai",
    )

    assert result.intent_count == 2
    assert [action["domain"] for action in result.actions] == ["calendar", "expense"]
    assert result.actions[1]["action_type"] == "expense.create_reimbursement_draft"
    assert result.actions[1]["missing_fields"] == ["amount"]


def test_planner_returns_confirmation_required_for_calendar_write() -> None:
    store = InMemoryExecutionStore()
    planner = ExecutionPlanner(store=store)

    response = planner.submit_turn(
        conversation_id="conversation_001",
        text="明天下午三点开会",
        now="2026-05-21T09:00:00+08:00",
        timezone="Asia/Shanghai",
    )

    assert response["kind"] == "confirmation_required"
    plan = response["plan"]
    confirmation = plan["confirmation"]
    assert confirmation is not None
    assert plan["status"] == "awaiting_confirmation"
    assert plan["actions"][0]["actionType"] == "calendar.create_event"
    assert confirmation["confirmToken"].startswith("confirm_")


def test_planner_returns_clarification_for_missing_expense_amount() -> None:
    store = InMemoryExecutionStore()
    planner = ExecutionPlanner(store=store)

    response = planner.submit_turn(
        conversation_id="conversation_001",
        text="把昨天打车票报销",
        now="2026-05-21T09:00:00+08:00",
        timezone="Asia/Shanghai",
    )

    assert response == {
        "kind": "clarification_request",
        "conversationId": "conversation_001",
        "question": "打车票报销需要补充金额。",
        "missingFields": ["amount"],
    }


def test_executor_confirms_and_executes_calendar_action() -> None:
    store = InMemoryExecutionStore()
    calendar_service = CalendarDomainService(InMemoryCalendarEventRepository())
    planner = ExecutionPlanner(store=store)
    coordinator = ExecutionCoordinator(store=store, calendar_service=calendar_service)

    planning_response = planner.submit_turn(
        conversation_id="conversation_001",
        text="明天下午三点开会",
        now="2026-05-21T09:00:00+08:00",
        timezone="Asia/Shanghai",
    )
    plan = planning_response["plan"]
    confirmation = plan["confirmation"]
    assert confirmation is not None

    result = coordinator.confirm_plan(
        plan_id=plan["id"],
        confirm_token=confirmation["confirmToken"],
    )

    assert result["kind"] == "execution_result"
    assert result["plan"]["status"] == "succeeded"
    assert calendar_service.list_events()[0]["title"] == "开会"


def test_executor_rejects_partial_action_confirmation() -> None:
    store = InMemoryExecutionStore()
    calendar_service = CalendarDomainService(InMemoryCalendarEventRepository())
    coordinator = ExecutionCoordinator(store=store, calendar_service=calendar_service)
    plan: ExecutionPlanRecord = {
        "id": "plan_multi",
        "conversationId": "conversation_001",
        "status": "awaiting_confirmation",
        "riskLevel": "medium",
        "summary": "确认后执行计划",
        "decisionTraceId": "test-trace",
        "actions": [
            {
                "id": "action_001",
                "planId": "plan_multi",
                "domain": "calendar",
                "actionType": "calendar.create_event",
                "status": "awaiting_confirmation",
                "riskLevel": "medium",
                "summary": "创建日程：开会",
                "payload": {
                    "title": "开会",
                    "start_at": "2026-05-22T15:00:00+08:00",
                    "end_at": "2026-05-22T16:00:00+08:00",
                    "timezone": "Asia/Shanghai",
                },
            },
            {
                "id": "action_002",
                "planId": "plan_multi",
                "domain": "calendar",
                "actionType": "calendar.create_event",
                "status": "awaiting_confirmation",
                "riskLevel": "medium",
                "summary": "创建日程：复盘",
                "payload": {
                    "title": "复盘",
                    "start_at": "2026-05-22T16:00:00+08:00",
                    "end_at": "2026-05-22T17:00:00+08:00",
                    "timezone": "Asia/Shanghai",
                },
            },
        ],
        "confirmation": {
            "id": "confirmation_multi",
            "planId": "plan_multi",
            "status": "pending",
            "requiredActionIds": ["action_001", "action_002"],
            "title": "请确认执行计划",
            "description": "确认后我会执行这些动作。",
            "confirmToken": "confirm_multi",
        },
    }
    store.save_plan(plan)

    with pytest.raises(ValueError, match="partial action confirmation is not supported"):
        coordinator.confirm_plan(
            plan_id="plan_multi",
            confirm_token="confirm_multi",
            action_ids=["action_001"],
        )

    assert store.get_plan("plan_multi")["status"] == "awaiting_confirmation"
    assert calendar_service.list_events() == []
