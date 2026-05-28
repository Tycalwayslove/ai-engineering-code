from typing import Any, cast

from backend.app.main import app
from backend.app.routes.agent import _response_for_storage, _response_summary
from fastapi.testclient import TestClient
from orchestrator.types import AgentTurnResponse


def test_agent_turn_returns_confirmation_required() -> None:
    client = TestClient(app)

    response = client.post(
        "/agent/turns",
        json={
            "conversationId": "conversation_001",
            "input": "明天下午三点开会",
            "clientContext": {
                "now": "2026-05-21T09:00:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["kind"] == "confirmation_required"
    assert body["conversationId"] == "conversation_001"
    assert body["plan"]["actions"][0]["actionType"] == "calendar.create_event"
    assert "result" not in body["plan"]["actions"][0]


def test_agent_turn_interprets_utc_now_in_client_timezone() -> None:
    client = TestClient(app)

    response = client.post(
        "/agent/turns",
        json={
            "conversationId": "conversation_utc_now_timezone",
            "input": "明天上午十点提醒我带电脑",
            "clientContext": {
                "now": "2026-05-28T07:13:00.000Z",
                "timezone": "Asia/Shanghai",
            },
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["kind"] == "confirmation_required"
    action = body["plan"]["actions"][0]
    assert action["actionType"] == "reminder.create_reminder"
    assert action["payload"]["due_at"] == "2026-05-29T10:00:00+08:00"
    assert action["payload"]["timezone"] == "Asia/Shanghai"


def test_agent_debug_returns_events_and_decision_traces() -> None:
    client = TestClient(app)
    conversation_id = "conversation_debug_001"

    turn_response = client.post(
        "/agent/turns",
        json={
            "conversationId": conversation_id,
            "input": "明天下午三点开会",
            "clientContext": {
                "now": "2026-05-21T09:00:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    )
    assert turn_response.status_code == 200

    response = client.get(f"/agent/conversations/{conversation_id}/debug")

    assert response.status_code == 200
    body = response.json()
    assert body["conversationId"] == conversation_id
    assert [event["eventType"] for event in body["events"]] == [
        "planning_started",
        "execution_plan_created",
    ]
    trace = body["decisionTraces"][0]
    assert trace["plannerMode"] in ("rule", "llm_first")
    assert trace["toolsSelected"] == ["calendar.create_event"]
    assert "current_input" in trace["contextSectionsUsed"]


def test_agent_debug_returns_pending_clarifications() -> None:
    client = TestClient(app)
    conversation_id = "conversation_debug_pending_001"

    turn_response = client.post(
        "/agent/turns",
        json={
            "conversationId": conversation_id,
            "input": "明天上午我要去开会",
            "clientContext": {
                "now": "2026-05-21T09:00:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    )
    assert turn_response.status_code == 200

    response = client.get(f"/agent/conversations/{conversation_id}/debug")

    assert response.status_code == 200
    body = response.json()
    pending = body["pendingClarifications"][0]
    assert pending["status"] == "open"
    assert pending["actionType"] == "calendar.create_event"
    assert pending["question"] == "明天上午几点开始开会？"
    assert pending["missingFields"] == ["start_at"]
    assert pending["quickReplies"] == ["明天上午9点", "明天上午10点", "我再说具体时间"]
    assert pending["quickReplyOptions"] == [
        {"label": "明天上午9点", "value": "明天上午9点"},
        {"label": "明天上午10点", "value": "明天上午10点"},
        {"label": "我再说具体时间", "value": "我再说具体时间"},
    ]
    trace = body["decisionTraces"][0]
    assert trace["plannerMode"] in ("rule", "llm_first")
    assert trace["toolsSelected"] == []
    assert trace["missingInformation"] == ["start_at"]
    assert trace["confirmationReason"] is None


def test_agent_debug_returns_decision_trace_for_chat_response() -> None:
    client = TestClient(app)
    conversation_id = "conversation_debug_chat_001"

    turn_response = client.post(
        "/agent/turns",
        json={
            "conversationId": conversation_id,
            "input": "你好",
            "clientContext": {
                "now": "2026-05-21T09:00:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    )
    assert turn_response.status_code == 200
    assert turn_response.json()["kind"] == "assistant_message"

    response = client.get(f"/agent/conversations/{conversation_id}/debug")

    assert response.status_code == 200
    body = response.json()
    assert [event["eventType"] for event in body["events"]] == [
        "planning_started",
        "planning_no_action",
    ]
    trace = body["decisionTraces"][0]
    assert trace["plannerMode"] in ("rule", "llm_first")
    assert trace["toolsSelected"] == []
    assert trace["missingInformation"] == []
    assert trace["confirmationReason"] is None


def test_agent_debug_trace_exposes_llm_call_observation() -> None:
    from agent_runtime.tracing.decision_trace import DecisionTrace
    from backend.app.routes.agent import _debug_trace_from_trace

    debug_trace = _debug_trace_from_trace(
        DecisionTrace(
            id="trace_llm_call",
            planner_mode="llm_first",
            context_sections_used=["current_input"],
            tools_considered=[],
            tools_selected=[],
            missing_information=[],
            policy_decisions=[],
            confirmation_reason=None,
            fallback_reason=None,
            reasoning_summary=[],
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
        ),
    ).model_dump(by_alias=True)

    assert debug_trace["llmCall"] == {
        "provider": "DeepSeekLlmProvider",
        "model": "deepseek-v4-flash",
        "mode": "llm",
        "status": "completed",
        "durationMs": 321,
        "promptChars": 1000,
        "responseChars": 120,
        "promptSha256": "abc123",
    }


def test_agent_conversation_turns_return_recorded_user_and_assistant_messages() -> None:
    client = TestClient(app)
    conversation_id = "conversation_turn_history_001"

    turn_response = client.post(
        "/agent/turns",
        json={
            "conversationId": conversation_id,
            "input": "明天下午三点开会",
            "clientContext": {
                "now": "2026-05-21T09:00:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    )
    assert turn_response.status_code == 200

    response = client.get(f"/agent/conversations/{conversation_id}/turns")

    assert response.status_code == 200
    body = response.json()
    assert body["conversationId"] == conversation_id
    assert [turn["role"] for turn in body["turns"]] == ["user", "assistant"]
    assert body["turns"][0]["inputText"] == "明天下午三点开会"
    assert body["turns"][0]["summary"] == "明天下午三点开会"

    assistant_turn = body["turns"][1]
    assert assistant_turn["summary"] == "创建日程：开会"
    assert assistant_turn["structuredResponse"]["kind"] == "confirmation_required"
    confirmation = assistant_turn["structuredResponse"]["plan"]["confirmation"]
    assert confirmation["confirmToken"] == "redacted"


def test_agent_pending_confirmations_issue_recovery_token_for_conversation() -> None:
    client = TestClient(app)
    conversation_id = "conversation_pending_confirmation_recovery_001"

    turn_response = client.post(
        "/agent/turns",
        json={
            "conversationId": conversation_id,
            "input": "明天下午三点开会",
            "clientContext": {
                "now": "2026-05-21T09:00:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    )
    assert turn_response.status_code == 200
    turn_body = turn_response.json()
    original_token = turn_body["plan"]["confirmation"]["confirmToken"]

    pending_response = client.get(
        f"/agent/conversations/{conversation_id}/pending-confirmations",
    )

    assert pending_response.status_code == 200
    pending_body = pending_response.json()
    assert pending_body["conversationId"] == conversation_id
    assert len(pending_body["plans"]) == 1
    pending_plan = pending_body["plans"][0]
    assert pending_plan["id"] == turn_body["plan"]["id"]
    assert pending_plan["status"] == "awaiting_confirmation"
    recovery_token = pending_plan["confirmation"]["confirmToken"]
    assert recovery_token.startswith("confirm_")
    assert recovery_token != "redacted"
    assert recovery_token != original_token

    confirm_response = client.post(
        f"/execution-plans/{pending_plan['id']}/confirm",
        json={"confirmToken": recovery_token},
    )
    assert confirm_response.status_code == 200
    assert confirm_response.json()["plan"]["status"] == "succeeded"

    empty_response = client.get(
        f"/agent/conversations/{conversation_id}/pending-confirmations",
    )
    assert empty_response.status_code == 200
    assert empty_response.json()["plans"] == []


def test_agent_turn_recognizes_lunch_as_calendar_event() -> None:
    client = TestClient(app)

    response = client.post(
        "/agent/turns",
        json={
            "conversationId": "conversation_lunch_001",
            "input": "明天中午我要去跟老婆吃午饭",
            "clientContext": {
                "now": "2026-05-21T09:00:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    )

    assert response.status_code == 200
    body = response.json()
    action = body["plan"]["actions"][0]
    assert body["kind"] == "confirmation_required"
    assert action["actionType"] == "calendar.create_event"
    assert action["summary"] == "创建日程：跟老婆吃午饭"
    assert action["payload"]["title"] == "跟老婆吃午饭"
    assert action["payload"]["start_at"] == "2026-05-22T12:00:00+08:00"
    assert action["payload"]["end_at"] == "2026-05-22T13:00:00+08:00"


def test_agent_turn_storage_redacts_confirm_token() -> None:
    client = TestClient(app)
    response = client.post(
        "/agent/turns",
        json={
            "conversationId": "conversation_storage_redaction",
            "input": "明天下午三点开会",
            "clientContext": {
                "now": "2026-05-21T09:00:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    )

    body = response.json()
    stored = _response_for_storage(body)
    stored_plan = stored["plan"]
    assert isinstance(stored_plan, dict)
    stored_confirmation = stored_plan["confirmation"]
    assert isinstance(stored_confirmation, dict)

    assert body["plan"]["confirmation"]["confirmToken"].startswith("confirm_")
    assert stored_confirmation["confirmToken"] == "redacted"


def test_agent_turn_stores_assistant_message_summary() -> None:
    client = TestClient(app)
    response = client.post(
        "/agent/turns",
        json={
            "conversationId": "conversation_assistant_message",
            "input": "你好",
            "clientContext": {
                "now": "2026-05-21T09:00:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    )

    body = response.json()
    stored = _response_for_storage(body)

    assert body["kind"] == "assistant_message"
    assert stored["message"] == body["message"]
    assert _response_summary(body) == body["message"]


def test_agent_turn_summary_prefers_mixed_confirmation_message() -> None:
    response = {
        "kind": "confirmation_required",
        "conversationId": "conversation_mixed_summary",
        "message": "当然可以，我先把会议列出来，确认后写入日程。",
        "plan": {
            "id": "plan_mixed_summary",
            "conversationId": "conversation_mixed_summary",
            "status": "awaiting_confirmation",
            "riskLevel": "medium",
            "summary": "创建日程：开会",
            "decisionTraceId": "trace_mixed_summary",
            "actions": [],
            "confirmation": None,
        },
    }

    assert (
        _response_summary(cast(AgentTurnResponse, response))
        == "当然可以，我先把会议列出来，确认后写入日程。"
    )


def test_agent_turn_clarifies_missing_calendar_time() -> None:
    client = TestClient(app)

    response = client.post(
        "/agent/turns",
        json={
            "conversationId": "conversation_missing_calendar_time",
            "input": "明天上午我要去开会",
            "clientContext": {
                "now": "2026-05-21T09:00:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["kind"] == "clarification_request"
    assert body["question"] == "明天上午几点开始开会？"
    assert body["missingFields"] == ["start_at"]
    assert body["quickReplies"] == ["明天上午9点", "明天上午10点", "我再说具体时间"]
    assert body["clarificationId"].startswith("pending_")


def test_agent_turn_resolves_pending_calendar_time() -> None:
    client = TestClient(app)
    first = client.post(
        "/agent/turns",
        json={
            "conversationId": "conversation_resolve_calendar_time",
            "input": "明天上午我要去开会",
            "clientContext": {
                "now": "2026-05-21T09:00:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    ).json()
    assert first["kind"] == "clarification_request"

    second = client.post(
        "/agent/turns",
        json={
            "conversationId": "conversation_resolve_calendar_time",
            "input": "十点",
            "clientContext": {
                "now": "2026-05-21T09:01:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    ).json()

    assert second["kind"] == "confirmation_required"
    action = second["plan"]["actions"][0]
    assert action["actionType"] == "calendar.create_event"
    assert action["payload"]["title"] == "开会"
    assert action["payload"]["start_at"] == "2026-05-22T10:00:00+08:00"
    assert action["payload"]["end_at"] == "2026-05-22T11:00:00+08:00"


def test_pending_calendar_time_does_not_capture_new_reminder_intent() -> None:
    client = TestClient(app)
    first = client.post(
        "/agent/turns",
        json={
            "conversationId": "conversation_pending_new_intent",
            "input": "明天上午我要去开会",
            "clientContext": {
                "now": "2026-05-21T09:00:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    ).json()
    assert first["kind"] == "clarification_request"

    second = client.post(
        "/agent/turns",
        json={
            "conversationId": "conversation_pending_new_intent",
            "input": "十点提醒我喝水",
            "clientContext": {
                "now": "2026-05-21T09:01:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    ).json()

    assert second["kind"] == "confirmation_required"
    action = second["plan"]["actions"][0]
    assert action["actionType"] == "reminder.create_reminder"
    assert action["payload"]["title"] == "喝水"
    debug = client.get("/agent/conversations/conversation_pending_new_intent/debug").json()
    latest_trace = debug["decisionTraces"][-1]
    assert "pending_clarifications" in latest_trace["contextSectionsUsed"]


def test_pending_calendar_time_is_abandoned_after_new_reminder_intent() -> None:
    client = TestClient(app)
    conversation_id = "conversation_pending_abandoned_after_new_intent"
    first = client.post(
        "/agent/turns",
        json={
            "conversationId": conversation_id,
            "input": "明天上午我要去开会",
            "clientContext": {
                "now": "2026-05-21T09:00:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    ).json()
    assert first["kind"] == "clarification_request"

    second = client.post(
        "/agent/turns",
        json={
            "conversationId": conversation_id,
            "input": "十点提醒我喝水",
            "clientContext": {
                "now": "2026-05-21T09:01:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    ).json()
    assert second["kind"] == "confirmation_required"
    assert second["plan"]["actions"][0]["actionType"] == "reminder.create_reminder"

    third = client.post(
        "/agent/turns",
        json={
            "conversationId": conversation_id,
            "input": "十点",
            "clientContext": {
                "now": "2026-05-21T09:02:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    ).json()

    assert third["kind"] == "assistant_message"
    debug = client.get(f"/agent/conversations/{conversation_id}/debug").json()
    pending_statuses = {
        pending["actionType"]: pending["status"]
        for pending in debug["pendingClarifications"]
    }
    assert pending_statuses["calendar.create_event"] == "abandoned"


def test_agent_turn_resolves_pending_afternoon_calendar_time() -> None:
    client = TestClient(app)
    first = client.post(
        "/agent/turns",
        json={
            "conversationId": "conversation_resolve_afternoon_calendar_time",
            "input": "明天下午我要去开会",
            "clientContext": {
                "now": "2026-05-21T09:00:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    ).json()

    assert first["kind"] == "clarification_request"
    assert first["quickReplies"] == ["明天下午3点", "明天下午4点", "我再说具体时间"]

    second = client.post(
        "/agent/turns",
        json={
            "conversationId": "conversation_resolve_afternoon_calendar_time",
            "input": "三点",
            "clientContext": {
                "now": "2026-05-21T09:01:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    ).json()

    assert second["kind"] == "confirmation_required"
    action = second["plan"]["actions"][0]
    assert action["actionType"] == "calendar.create_event"
    assert action["payload"]["start_at"] == "2026-05-22T15:00:00+08:00"


def test_confirmation_executes_calendar_event_and_writes_ledger() -> None:
    client = TestClient(app)

    plan_response = client.post(
        "/agent/turns",
        json={
            "conversationId": "conversation_002",
            "input": "明天下午三点开会",
            "clientContext": {
                "now": "2026-05-21T09:00:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    ).json()
    plan = plan_response["plan"]

    confirm_response = client.post(
        f"/execution-plans/{plan['id']}/confirm",
        json={"confirmToken": plan["confirmation"]["confirmToken"]},
    )

    assert confirm_response.status_code == 200
    assert confirm_response.json()["kind"] == "execution_result"

    events_response = client.get("/calendar/events")
    assert events_response.status_code == 200
    assert events_response.json()[-1]["title"] == "开会"

    ledger_response = client.get("/execution-ledger")
    assert ledger_response.status_code == 200
    ledger = ledger_response.json()
    assert any(item["eventType"] == "action_executed" for item in ledger)
    assert all(
        "actionId" in item
        for item in ledger
        if item["eventType"] in {"action_executed", "action_failed"}
    )
    assert all(
        "actionId" not in item
        for item in ledger
        if item["eventType"] in {"plan_created", "confirmation_created"}
    )


def _direct_action_plans(
    client: TestClient,
    conversation_id: str,
) -> list[Any]:
    ledger = client.get(
        "/execution-ledger",
        params={"conversationId": conversation_id},
    ).json()
    direct_events = [
        item for item in ledger if item["eventType"] == "direct_action_executed"
    ]
    plans: list[Any] = []
    for event in direct_events:
        plan = client.get(f"/execution-plans/{event['planId']}").json()
        assert plan["status"] == "succeeded"
        assert plan["id"].startswith("direct_plan_")
        assert plan["actions"][0]["id"] == event["actionId"]
        assert plan["actions"][0]["status"] == "succeeded"
        plans.append(plan)
    return plans


def _latest_direct_action_plan(
    client: TestClient,
    conversation_id: str,
) -> Any:
    plans = _direct_action_plans(client, conversation_id)
    assert plans
    return plans[-1]


def test_direct_reminder_action_writes_scoped_execution_ledger() -> None:
    client = TestClient(app)
    conversation_id = "conversation_direct_reminder_action_ledger"
    _submit_and_confirm_turn(
        client,
        conversation_id=conversation_id,
        text="明天上午九点提醒我带电脑",
    )
    reminder = client.get(
        "/reminders",
        params={"conversationId": conversation_id},
    ).json()[-1]

    complete_response = client.post(
        f"/reminders/{reminder['id']}/complete",
        params={"conversationId": conversation_id},
    )

    assert complete_response.status_code == 200
    assert complete_response.json()["status"] == "done"
    ledger = client.get(
        "/execution-ledger",
        params={"conversationId": conversation_id},
    ).json()
    direct_events = [
        item for item in ledger if item["eventType"] == "direct_action_executed"
    ]
    assert len(direct_events) == 1
    assert direct_events[0]["status"] == "succeeded"
    assert "actionId" in direct_events[0]
    assert direct_events[0]["message"] == "Direct UI action executed."
    direct_plan = client.get(f"/execution-plans/{direct_events[0]['planId']}").json()
    assert direct_plan["id"].startswith("direct_plan_")
    assert direct_plan["actions"][0]["id"] == direct_events[0]["actionId"]
    assert direct_plan["actions"][0]["actionType"] == "reminder.complete_reminder"


def test_direct_calendar_action_writes_scoped_execution_ledger() -> None:
    client = TestClient(app)
    conversation_id = "conversation_direct_calendar_action_ledger"
    _submit_and_confirm_turn(
        client,
        conversation_id=conversation_id,
        text="明天下午三点开会",
    )
    event = client.get(
        "/calendar/events",
        params={"conversationId": conversation_id},
    ).json()[-1]

    cancel_response = client.post(
        f"/calendar/events/{event['id']}/cancel",
        params={"conversationId": conversation_id},
    )

    assert cancel_response.status_code == 200
    assert cancel_response.json()["status"] == "canceled"
    direct_plan = _latest_direct_action_plan(client, conversation_id)
    assert direct_plan["actions"][0]["actionType"] == "calendar.cancel_event"
    assert direct_plan["actions"][0]["result"]["calendarEvent"]["id"] == event["id"]


def test_direct_actions_require_conversation_id_for_audit_scope() -> None:
    client = TestClient(app)
    conversation_id = "conversation_direct_action_requires_scope"
    _submit_and_confirm_turn(
        client,
        conversation_id=conversation_id,
        text="明天下午三点开会，顺便把昨天 58 元打车票报销，再提醒我带电脑",
    )
    event = client.get(
        "/calendar/events",
        params={"conversationId": conversation_id},
    ).json()[-1]
    expense = client.get(
        "/expenses",
        params={"conversationId": conversation_id},
    ).json()[-1]
    reminder = client.get(
        "/reminders",
        params={"conversationId": conversation_id},
    ).json()[-1]

    calendar_response = client.post(f"/calendar/events/{event['id']}/cancel")
    expense_response = client.post(f"/expenses/{expense['id']}/submit")
    reminder_response = client.post(f"/reminders/{reminder['id']}/complete")

    assert calendar_response.status_code == 400
    assert expense_response.status_code == 400
    assert reminder_response.status_code == 400
    assert "conversationId is required" in calendar_response.json()["detail"]
    assert "conversationId is required" in expense_response.json()["detail"]
    assert "conversationId is required" in reminder_response.json()["detail"]


def test_direct_expense_actions_write_scoped_execution_ledger() -> None:
    client = TestClient(app)
    conversation_id = "conversation_direct_expense_actions_ledger"
    _submit_and_confirm_turn(
        client,
        conversation_id=conversation_id,
        text="把昨天 58 元打车票报销",
    )
    _submit_and_confirm_turn(
        client,
        conversation_id=conversation_id,
        text="把昨天 99 元餐费报销",
    )
    expenses = client.get(
        "/expenses",
        params={"conversationId": conversation_id},
    ).json()
    first_expense, second_expense = expenses[-2], expenses[-1]

    submit_response = client.post(
        f"/expenses/{first_expense['id']}/submit",
        params={"conversationId": conversation_id},
    )
    cancel_response = client.post(
        f"/expenses/{second_expense['id']}/cancel",
        params={"conversationId": conversation_id},
    )

    assert submit_response.status_code == 200
    assert submit_response.json()["status"] == "submitted"
    assert cancel_response.status_code == 200
    assert cancel_response.json()["status"] == "canceled"
    direct_plans = _direct_action_plans(client, conversation_id)
    assert [plan["actions"][0]["actionType"] for plan in direct_plans] == [
        "expense.submit_reimbursement",
        "expense.cancel_reimbursement",
    ]
    assert direct_plans[0]["actions"][0]["result"]["expenseRecord"]["id"] == first_expense["id"]
    assert direct_plans[1]["actions"][0]["result"]["expenseRecord"]["id"] == second_expense["id"]


def test_direct_edit_actions_write_scoped_execution_ledger() -> None:
    client = TestClient(app)
    conversation_id = "conversation_direct_edit_actions_ledger"
    _submit_and_confirm_turn(
        client,
        conversation_id=conversation_id,
        text="明天下午三点开会，顺便把昨天 58 元打车票报销，再提醒我带电脑",
    )
    event = client.get(
        "/calendar/events",
        params={"conversationId": conversation_id},
    ).json()[-1]
    expense = client.get(
        "/expenses",
        params={"conversationId": conversation_id},
    ).json()[-1]
    reminder = client.get(
        "/reminders",
        params={"conversationId": conversation_id},
    ).json()[-1]

    calendar_response = client.patch(
        f"/calendar/events/{event['id']}",
        params={"conversationId": conversation_id},
        json={"title": "业务规划会"},
    )
    expense_response = client.patch(
        f"/expenses/{expense['id']}",
        params={"conversationId": conversation_id},
        json={"amount": 88.5},
    )
    reminder_response = client.patch(
        f"/reminders/{reminder['id']}",
        params={"conversationId": conversation_id},
        json={"title": "带电脑和工牌"},
    )

    assert calendar_response.status_code == 200
    assert expense_response.status_code == 200
    assert reminder_response.status_code == 200
    direct_plans = _direct_action_plans(client, conversation_id)
    assert [plan["actions"][0]["actionType"] for plan in direct_plans] == [
        "calendar.update_event",
        "expense.update_reimbursement",
        "reminder.update_reminder",
    ]
    assert direct_plans[0]["actions"][0]["payload"]["patch"] == {
        "title": "业务规划会",
    }
    assert direct_plans[1]["actions"][0]["payload"]["patch"] == {"amount": 88.5}
    assert direct_plans[2]["actions"][0]["payload"]["patch"] == {
        "title": "带电脑和工牌",
    }


def test_direct_action_rejects_target_from_another_conversation() -> None:
    client = TestClient(app)
    owner_conversation_id = "conversation_direct_action_owner"
    other_conversation_id = "conversation_direct_action_other"
    _submit_and_confirm_turn(
        client,
        conversation_id=owner_conversation_id,
        text="明天上午九点提醒我带电脑",
    )
    reminder = client.get(
        "/reminders",
        params={"conversationId": owner_conversation_id},
    ).json()[-1]

    complete_response = client.post(
        f"/reminders/{reminder['id']}/complete",
        params={"conversationId": other_conversation_id},
    )

    assert complete_response.status_code == 404
    reminders_by_id = {
        item["id"]: item
        for item in client.get(
            "/reminders",
            params={"conversationId": owner_conversation_id},
        ).json()
    }
    assert reminders_by_id[reminder["id"]]["status"] == "scheduled"
    other_ledger = client.get(
        "/execution-ledger",
        params={"conversationId": other_conversation_id},
    ).json()
    assert [
        item for item in other_ledger if item["eventType"] == "direct_action_executed"
    ] == []


def test_calendar_event_cancel_endpoint_cancels_scheduled_event() -> None:
    client = TestClient(app)
    conversation_id = "conversation_calendar_cancel_status"

    plan_response = client.post(
        "/agent/turns",
        json={
            "conversationId": conversation_id,
            "input": "明天下午三点开会",
            "clientContext": {
                "now": "2026-05-21T09:00:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    ).json()
    plan = plan_response["plan"]
    client.post(
        f"/execution-plans/{plan['id']}/confirm",
        json={"confirmToken": plan["confirmation"]["confirmToken"]},
    )
    event_to_cancel = client.get(
        "/calendar/events",
        params={"conversationId": conversation_id},
    ).json()[-1]

    cancel_response = client.post(
        f"/calendar/events/{event_to_cancel['id']}/cancel",
        params={"conversationId": conversation_id},
    )

    assert cancel_response.status_code == 200
    canceled = cancel_response.json()
    assert canceled["id"] == event_to_cancel["id"]
    assert canceled["status"] == "canceled"
    events_by_id = {event["id"]: event for event in client.get("/calendar/events").json()}
    assert events_by_id[event_to_cancel["id"]]["status"] == "canceled"


def test_calendar_event_cancel_rejects_canceled_event() -> None:
    client = TestClient(app)
    conversation_id = "conversation_calendar_cancel_terminal"

    plan_response = client.post(
        "/agent/turns",
        json={
            "conversationId": conversation_id,
            "input": "明天下午三点开会",
            "clientContext": {
                "now": "2026-05-21T09:00:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    ).json()
    plan = plan_response["plan"]
    client.post(
        f"/execution-plans/{plan['id']}/confirm",
        json={"confirmToken": plan["confirmation"]["confirmToken"]},
    )
    event_to_cancel = client.get(
        "/calendar/events",
        params={"conversationId": conversation_id},
    ).json()[-1]
    first_response = client.post(
        f"/calendar/events/{event_to_cancel['id']}/cancel",
        params={"conversationId": conversation_id},
    )

    second_response = client.post(
        f"/calendar/events/{event_to_cancel['id']}/cancel",
        params={"conversationId": conversation_id},
    )

    assert first_response.status_code == 200
    assert second_response.status_code == 400
    events_by_id = {event["id"]: event for event in client.get("/calendar/events").json()}
    assert events_by_id[event_to_cancel["id"]]["status"] == "canceled"


def test_calendar_event_cancel_returns_not_found_for_missing_event() -> None:
    client = TestClient(app)

    response = client.post("/calendar/events/missing_calendar_event/cancel")

    assert response.status_code == 404


def test_calendar_event_update_endpoint_updates_editable_fields() -> None:
    client = TestClient(app)
    conversation_id = "conversation_calendar_update"

    plan_response = client.post(
        "/agent/turns",
        json={
            "conversationId": conversation_id,
            "input": "明天下午三点开会",
            "clientContext": {
                "now": "2026-05-21T09:00:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    ).json()
    plan = plan_response["plan"]
    client.post(
        f"/execution-plans/{plan['id']}/confirm",
        json={"confirmToken": plan["confirmation"]["confirmToken"]},
    )
    event_to_update = client.get(
        "/calendar/events",
        params={"conversationId": conversation_id},
    ).json()[-1]

    update_response = client.patch(
        f"/calendar/events/{event_to_update['id']}",
        params={"conversationId": conversation_id},
        json={
            "title": "业务规划会",
            "startAt": "2026-05-22T16:00:00+08:00",
            "endAt": "2026-05-22T17:30:00+08:00",
            "timezone": "Asia/Shanghai",
        },
    )

    assert update_response.status_code == 200
    updated = update_response.json()
    assert updated["id"] == event_to_update["id"]
    assert updated["title"] == "业务规划会"
    assert updated["startAt"] == "2026-05-22T16:00:00+08:00"
    assert updated["endAt"] == "2026-05-22T17:30:00+08:00"
    assert updated["timezone"] == "Asia/Shanghai"
    assert updated["status"] == "scheduled"
    assert updated["sourceActionId"] == event_to_update["sourceActionId"]


def test_calendar_event_update_rejects_invalid_time_range() -> None:
    client = TestClient(app)

    plan_response = client.post(
        "/agent/turns",
        json={
            "conversationId": "conversation_calendar_update_invalid_range",
            "input": "明天下午三点开会",
            "clientContext": {
                "now": "2026-05-21T09:00:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    ).json()
    plan = plan_response["plan"]
    client.post(
        f"/execution-plans/{plan['id']}/confirm",
        json={"confirmToken": plan["confirmation"]["confirmToken"]},
    )
    event_to_update = client.get("/calendar/events").json()[-1]

    update_response = client.patch(
        f"/calendar/events/{event_to_update['id']}",
        json={
            "startAt": "2026-05-22T18:00:00+08:00",
            "endAt": "2026-05-22T17:00:00+08:00",
        },
    )

    assert update_response.status_code == 400
    events_by_id = {event["id"]: event for event in client.get("/calendar/events").json()}
    assert events_by_id[event_to_update["id"]]["startAt"] == event_to_update["startAt"]
    assert events_by_id[event_to_update["id"]]["endAt"] == event_to_update["endAt"]


def test_calendar_event_update_rejects_partial_invalid_time_range() -> None:
    client = TestClient(app)

    plan_response = client.post(
        "/agent/turns",
        json={
            "conversationId": "conversation_calendar_update_partial_invalid_range",
            "input": "明天下午三点开会",
            "clientContext": {
                "now": "2026-05-21T09:00:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    ).json()
    plan = plan_response["plan"]
    client.post(
        f"/execution-plans/{plan['id']}/confirm",
        json={"confirmToken": plan["confirmation"]["confirmToken"]},
    )
    event_to_update = client.get("/calendar/events").json()[-1]

    start_response = client.patch(
        f"/calendar/events/{event_to_update['id']}",
        json={"startAt": "2026-05-22T17:00:00+08:00"},
    )
    end_response = client.patch(
        f"/calendar/events/{event_to_update['id']}",
        json={"endAt": "2026-05-22T14:00:00+08:00"},
    )

    assert start_response.status_code == 400
    assert end_response.status_code == 400
    events_by_id = {event["id"]: event for event in client.get("/calendar/events").json()}
    assert events_by_id[event_to_update["id"]]["startAt"] == event_to_update["startAt"]
    assert events_by_id[event_to_update["id"]]["endAt"] == event_to_update["endAt"]


def test_calendar_event_update_rejects_canceled_event() -> None:
    client = TestClient(app)

    plan_response = client.post(
        "/agent/turns",
        json={
            "conversationId": "conversation_calendar_update_canceled",
            "input": "明天下午三点开会",
            "clientContext": {
                "now": "2026-05-21T09:00:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    ).json()
    plan = plan_response["plan"]
    client.post(
        f"/execution-plans/{plan['id']}/confirm",
        json={"confirmToken": plan["confirmation"]["confirmToken"]},
    )
    event_to_update = client.get("/calendar/events").json()[-1]
    client.post(f"/calendar/events/{event_to_update['id']}/cancel")

    update_response = client.patch(
        f"/calendar/events/{event_to_update['id']}",
        json={"title": "不应该被修改"},
    )

    assert update_response.status_code == 400
    events_by_id = {event["id"]: event for event in client.get("/calendar/events").json()}
    assert events_by_id[event_to_update["id"]]["title"] == event_to_update["title"]


def test_confirmation_executes_expense_draft_and_lists_expenses() -> None:
    client = TestClient(app)

    plan_response = client.post(
        "/agent/turns",
        json={
            "conversationId": "conversation_expense_001",
            "input": "把昨天 58 元打车票报销",
            "clientContext": {
                "now": "2026-05-21T09:00:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    ).json()
    plan = plan_response["plan"]

    confirm_response = client.post(
        f"/execution-plans/{plan['id']}/confirm",
        json={"confirmToken": plan["confirmation"]["confirmToken"]},
    )

    assert confirm_response.status_code == 200
    assert confirm_response.json()["kind"] == "execution_result"

    expenses_response = client.get("/expenses")
    assert expenses_response.status_code == 200
    expense = expenses_response.json()[-1]
    assert expense["title"] == "打车票报销"
    assert expense["amount"] == 58
    assert expense["currency"] == "CNY"
    assert expense["occurredOn"] == "2026-05-20"
    assert expense["status"] == "draft"
    assert expense["sourceActionId"] == plan["actions"][0]["id"]


def test_expense_status_endpoints_submit_and_cancel_expense_drafts() -> None:
    client = TestClient(app)
    submit_conversation_id = "conversation_expense_submit_status"
    cancel_conversation_id = "conversation_expense_cancel_status"

    submit_plan_response = client.post(
        "/agent/turns",
        json={
            "conversationId": submit_conversation_id,
            "input": "把昨天 58 元打车票报销",
            "clientContext": {
                "now": "2026-05-21T09:00:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    ).json()
    submit_plan = submit_plan_response["plan"]
    client.post(
        f"/execution-plans/{submit_plan['id']}/confirm",
        json={"confirmToken": submit_plan["confirmation"]["confirmToken"]},
    )
    expense_to_submit = client.get(
        "/expenses",
        params={"conversationId": submit_conversation_id},
    ).json()[-1]

    submit_response = client.post(
        f"/expenses/{expense_to_submit['id']}/submit",
        params={"conversationId": submit_conversation_id},
    )

    assert submit_response.status_code == 200
    submitted = submit_response.json()
    assert submitted["id"] == expense_to_submit["id"]
    assert submitted["status"] == "submitted"

    cancel_plan_response = client.post(
        "/agent/turns",
        json={
            "conversationId": cancel_conversation_id,
            "input": "把昨天 100 元打车票报销",
            "clientContext": {
                "now": "2026-05-21T09:00:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    ).json()
    cancel_plan = cancel_plan_response["plan"]
    client.post(
        f"/execution-plans/{cancel_plan['id']}/confirm",
        json={"confirmToken": cancel_plan["confirmation"]["confirmToken"]},
    )
    expense_to_cancel = client.get(
        "/expenses",
        params={"conversationId": cancel_conversation_id},
    ).json()[-1]

    cancel_response = client.post(
        f"/expenses/{expense_to_cancel['id']}/cancel",
        params={"conversationId": cancel_conversation_id},
    )

    assert cancel_response.status_code == 200
    canceled = cancel_response.json()
    assert canceled["id"] == expense_to_cancel["id"]
    assert canceled["status"] == "canceled"
    expenses = client.get("/expenses").json()
    assert expenses[-2]["status"] == "submitted"
    assert expenses[-1]["status"] == "canceled"


def test_expense_status_endpoints_reject_terminal_expenses() -> None:
    client = TestClient(app)
    submit_conversation_id = "conversation_expense_submit_terminal"
    cancel_conversation_id = "conversation_expense_cancel_terminal"

    submit_plan_response = client.post(
        "/agent/turns",
        json={
            "conversationId": submit_conversation_id,
            "input": "把昨天 58 元打车票报销",
            "clientContext": {
                "now": "2026-05-21T09:00:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    ).json()
    submit_plan = submit_plan_response["plan"]
    client.post(
        f"/execution-plans/{submit_plan['id']}/confirm",
        json={"confirmToken": submit_plan["confirmation"]["confirmToken"]},
    )
    submitted_expense = client.get(
        "/expenses",
        params={"conversationId": submit_conversation_id},
    ).json()[-1]
    submit_response = client.post(
        f"/expenses/{submitted_expense['id']}/submit",
        params={"conversationId": submit_conversation_id},
    )

    cancel_submitted_response = client.post(
        f"/expenses/{submitted_expense['id']}/cancel",
        params={"conversationId": submit_conversation_id},
    )

    cancel_plan_response = client.post(
        "/agent/turns",
        json={
            "conversationId": cancel_conversation_id,
            "input": "把昨天 100 元打车票报销",
            "clientContext": {
                "now": "2026-05-21T09:00:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    ).json()
    cancel_plan = cancel_plan_response["plan"]
    client.post(
        f"/execution-plans/{cancel_plan['id']}/confirm",
        json={"confirmToken": cancel_plan["confirmation"]["confirmToken"]},
    )
    canceled_expense = client.get(
        "/expenses",
        params={"conversationId": cancel_conversation_id},
    ).json()[-1]
    cancel_response = client.post(
        f"/expenses/{canceled_expense['id']}/cancel",
        params={"conversationId": cancel_conversation_id},
    )

    submit_canceled_response = client.post(
        f"/expenses/{canceled_expense['id']}/submit",
        params={"conversationId": cancel_conversation_id},
    )

    assert submit_response.status_code == 200
    assert cancel_submitted_response.status_code == 400
    assert cancel_response.status_code == 200
    assert submit_canceled_response.status_code == 400
    expenses_by_id = {expense["id"]: expense for expense in client.get("/expenses").json()}
    assert expenses_by_id[submitted_expense["id"]]["status"] == "submitted"
    assert expenses_by_id[canceled_expense["id"]]["status"] == "canceled"


def test_expense_status_endpoints_return_not_found_for_missing_expense() -> None:
    client = TestClient(app)

    submit_response = client.post("/expenses/missing_expense/submit")
    cancel_response = client.post("/expenses/missing_expense/cancel")

    assert submit_response.status_code == 404
    assert cancel_response.status_code == 404


def test_expense_update_endpoint_updates_editable_fields() -> None:
    client = TestClient(app)
    conversation_id = "conversation_expense_update"

    plan_response = client.post(
        "/agent/turns",
        json={
            "conversationId": conversation_id,
            "input": "把昨天 58 元打车票报销",
            "clientContext": {
                "now": "2026-05-21T09:00:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    ).json()
    plan = plan_response["plan"]
    client.post(
        f"/execution-plans/{plan['id']}/confirm",
        json={"confirmToken": plan["confirmation"]["confirmToken"]},
    )
    expense_to_update = client.get(
        "/expenses",
        params={"conversationId": conversation_id},
    ).json()[-1]

    update_response = client.patch(
        f"/expenses/{expense_to_update['id']}",
        params={"conversationId": conversation_id},
        json={
            "title": "客户午餐报销",
            "amount": 88.5,
            "currency": "CNY",
            "occurredOn": "2026-05-21",
        },
    )

    assert update_response.status_code == 200
    updated = update_response.json()
    assert updated["id"] == expense_to_update["id"]
    assert updated["title"] == "客户午餐报销"
    assert updated["amount"] == 88.5
    assert updated["currency"] == "CNY"
    assert updated["occurredOn"] == "2026-05-21"
    assert updated["status"] == "draft"
    assert updated["sourceActionId"] == expense_to_update["sourceActionId"]


def test_expense_update_rejects_negative_amount() -> None:
    client = TestClient(app)

    plan_response = client.post(
        "/agent/turns",
        json={
            "conversationId": "conversation_expense_update_negative_amount",
            "input": "把昨天 58 元打车票报销",
            "clientContext": {
                "now": "2026-05-21T09:00:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    ).json()
    plan = plan_response["plan"]
    client.post(
        f"/execution-plans/{plan['id']}/confirm",
        json={"confirmToken": plan["confirmation"]["confirmToken"]},
    )
    expense_to_update = client.get("/expenses").json()[-1]

    update_response = client.patch(
        f"/expenses/{expense_to_update['id']}",
        json={"amount": -1},
    )

    assert update_response.status_code == 400
    expenses_by_id = {
        expense["id"]: expense for expense in client.get("/expenses").json()
    }
    assert expenses_by_id[expense_to_update["id"]]["amount"] == expense_to_update["amount"]


def test_expense_update_rejects_non_numeric_amount() -> None:
    client = TestClient(app)

    plan_response = client.post(
        "/agent/turns",
        json={
            "conversationId": "conversation_expense_update_non_numeric_amount",
            "input": "把昨天 58 元打车票报销",
            "clientContext": {
                "now": "2026-05-21T09:00:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    ).json()
    plan = plan_response["plan"]
    client.post(
        f"/execution-plans/{plan['id']}/confirm",
        json={"confirmToken": plan["confirmation"]["confirmToken"]},
    )
    expense_to_update = client.get("/expenses").json()[-1]

    bool_response = client.patch(
        f"/expenses/{expense_to_update['id']}",
        json={"amount": True},
    )
    string_response = client.patch(
        f"/expenses/{expense_to_update['id']}",
        json={"amount": "88.5"},
    )

    assert bool_response.status_code == 400
    assert string_response.status_code == 400
    expenses_by_id = {
        expense["id"]: expense for expense in client.get("/expenses").json()
    }
    assert expenses_by_id[expense_to_update["id"]]["amount"] == expense_to_update["amount"]


def test_expense_update_rejects_submitted_expense() -> None:
    client = TestClient(app)

    plan_response = client.post(
        "/agent/turns",
        json={
            "conversationId": "conversation_expense_update_submitted",
            "input": "把昨天 58 元打车票报销",
            "clientContext": {
                "now": "2026-05-21T09:00:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    ).json()
    plan = plan_response["plan"]
    client.post(
        f"/execution-plans/{plan['id']}/confirm",
        json={"confirmToken": plan["confirmation"]["confirmToken"]},
    )
    expense_to_update = client.get("/expenses").json()[-1]
    client.post(f"/expenses/{expense_to_update['id']}/submit")

    update_response = client.patch(
        f"/expenses/{expense_to_update['id']}",
        json={"title": "不应该被修改"},
    )

    assert update_response.status_code == 400
    expenses_by_id = {
        expense["id"]: expense for expense in client.get("/expenses").json()
    }
    assert expenses_by_id[expense_to_update["id"]]["title"] == expense_to_update["title"]


def test_confirmation_executes_reminder_and_lists_reminders() -> None:
    client = TestClient(app)

    plan_response = client.post(
        "/agent/turns",
        json={
            "conversationId": "conversation_reminder_001",
            "input": "明天上午九点提醒我带电脑",
            "clientContext": {
                "now": "2026-05-21T09:00:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    ).json()
    plan = plan_response["plan"]

    confirm_response = client.post(
        f"/execution-plans/{plan['id']}/confirm",
        json={"confirmToken": plan["confirmation"]["confirmToken"]},
    )

    assert confirm_response.status_code == 200
    assert confirm_response.json()["kind"] == "execution_result"

    reminders_response = client.get("/reminders")
    assert reminders_response.status_code == 200
    reminder = reminders_response.json()[-1]
    assert reminder["title"] == "带电脑"
    assert reminder["dueAt"] == "2026-05-22T09:00:00+08:00"
    assert reminder["status"] == "scheduled"
    assert reminder["sourceActionId"] == plan["actions"][0]["id"]


def test_confirmation_executes_relative_minute_reminder() -> None:
    client = TestClient(app)

    plan_response = client.post(
        "/agent/turns",
        json={
            "conversationId": "conversation_relative_minute_reminder_001",
            "input": "2分钟后提醒我喝水",
            "clientContext": {
                "now": "2026-05-21T09:00:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    ).json()
    plan = plan_response["plan"]

    assert plan_response["kind"] == "confirmation_required"
    assert plan["actions"][0]["actionType"] == "reminder.create_reminder"
    assert plan["actions"][0]["payload"]["title"] == "喝水"
    assert plan["actions"][0]["payload"]["due_at"] == "2026-05-21T09:02:00+08:00"

    confirm_response = client.post(
        f"/execution-plans/{plan['id']}/confirm",
        json={"confirmToken": plan["confirmation"]["confirmToken"]},
    )

    assert confirm_response.status_code == 200
    reminders_response = client.get(
        "/reminders",
        params={"conversationId": "conversation_relative_minute_reminder_001"},
    )
    assert reminders_response.status_code == 200
    reminder = reminders_response.json()[-1]
    assert reminder["title"] == "喝水"
    assert reminder["dueAt"] == "2026-05-21T09:02:00+08:00"


def test_reminder_status_endpoints_complete_and_cancel_reminders() -> None:
    client = TestClient(app)

    def create_reminder(conversation_id: str, text: str) -> dict[str, object]:
        plan_response = client.post(
            "/agent/turns",
            json={
                "conversationId": conversation_id,
                "input": text,
                "clientContext": {
                    "now": "2026-05-21T09:00:00+08:00",
                    "timezone": "Asia/Shanghai",
                },
            },
        ).json()
        plan = plan_response["plan"]
        confirm_response = client.post(
            f"/execution-plans/{plan['id']}/confirm",
            json={"confirmToken": plan["confirmation"]["confirmToken"]},
        )
        assert confirm_response.status_code == 200
        reminder = client.get(
            "/reminders",
            params={"conversationId": conversation_id},
        ).json()[-1]
        return cast(dict[str, object], reminder)

    completed = create_reminder(
        "conversation_reminder_complete_001",
        "明天上午九点提醒我带电脑",
    )
    canceled = create_reminder(
        "conversation_reminder_cancel_001",
        "明天上午十点提醒我喝水",
    )

    complete_response = client.post(
        f"/reminders/{completed['id']}/complete",
        params={"conversationId": "conversation_reminder_complete_001"},
    )
    cancel_response = client.post(
        f"/reminders/{canceled['id']}/cancel",
        params={"conversationId": "conversation_reminder_cancel_001"},
    )

    assert complete_response.status_code == 200
    assert complete_response.json()["status"] == "done"
    assert cancel_response.status_code == 200
    assert cancel_response.json()["status"] == "canceled"

    reminders_by_id = {
        reminder["id"]: reminder for reminder in client.get("/reminders").json()
    }
    assert reminders_by_id[completed["id"]]["status"] == "done"
    assert reminders_by_id[canceled["id"]]["status"] == "canceled"


def test_reminder_status_endpoints_reject_terminal_reminders() -> None:
    client = TestClient(app)

    def create_reminder(conversation_id: str, text: str) -> dict[str, object]:
        plan_response = client.post(
            "/agent/turns",
            json={
                "conversationId": conversation_id,
                "input": text,
                "clientContext": {
                    "now": "2026-05-21T09:00:00+08:00",
                    "timezone": "Asia/Shanghai",
                },
            },
        ).json()
        plan = plan_response["plan"]
        confirm_response = client.post(
            f"/execution-plans/{plan['id']}/confirm",
            json={"confirmToken": plan["confirmation"]["confirmToken"]},
        )
        assert confirm_response.status_code == 200
        reminder = client.get(
            "/reminders",
            params={"conversationId": conversation_id},
        ).json()[-1]
        return cast(dict[str, object], reminder)

    completed = create_reminder(
        "conversation_reminder_complete_terminal",
        "明天上午九点提醒我带电脑",
    )
    canceled = create_reminder(
        "conversation_reminder_cancel_terminal",
        "明天上午十点提醒我喝水",
    )
    complete_response = client.post(
        f"/reminders/{completed['id']}/complete",
        params={"conversationId": "conversation_reminder_complete_terminal"},
    )
    cancel_done_response = client.post(
        f"/reminders/{completed['id']}/cancel",
        params={"conversationId": "conversation_reminder_complete_terminal"},
    )
    cancel_response = client.post(
        f"/reminders/{canceled['id']}/cancel",
        params={"conversationId": "conversation_reminder_cancel_terminal"},
    )
    complete_canceled_response = client.post(
        f"/reminders/{canceled['id']}/complete",
        params={"conversationId": "conversation_reminder_cancel_terminal"},
    )

    assert complete_response.status_code == 200
    assert cancel_done_response.status_code == 400
    assert cancel_response.status_code == 200
    assert complete_canceled_response.status_code == 400
    reminders_by_id = {
        reminder["id"]: reminder for reminder in client.get("/reminders").json()
    }
    assert reminders_by_id[completed["id"]]["status"] == "done"
    assert reminders_by_id[canceled["id"]]["status"] == "canceled"


def test_reminder_status_endpoints_return_not_found_for_missing_reminder() -> None:
    client = TestClient(app)

    complete_response = client.post("/reminders/missing_reminder/complete")
    cancel_response = client.post("/reminders/missing_reminder/cancel")

    assert complete_response.status_code == 404
    assert cancel_response.status_code == 404


def test_reminder_update_endpoint_updates_editable_fields() -> None:
    client = TestClient(app)
    conversation_id = "conversation_reminder_update"

    plan_response = client.post(
        "/agent/turns",
        json={
            "conversationId": conversation_id,
            "input": "明天上午九点提醒我带电脑",
            "clientContext": {
                "now": "2026-05-21T09:00:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    ).json()
    plan = plan_response["plan"]
    client.post(
        f"/execution-plans/{plan['id']}/confirm",
        json={"confirmToken": plan["confirmation"]["confirmToken"]},
    )
    reminder_to_update = client.get(
        "/reminders",
        params={"conversationId": conversation_id},
    ).json()[-1]

    update_response = client.patch(
        f"/reminders/{reminder_to_update['id']}",
        params={"conversationId": conversation_id},
        json={
            "title": "带电脑和工牌",
            "dueAt": "2026-05-22T10:00:00+08:00",
        },
    )

    assert update_response.status_code == 200
    updated = update_response.json()
    assert updated["id"] == reminder_to_update["id"]
    assert updated["title"] == "带电脑和工牌"
    assert updated["dueAt"] == "2026-05-22T10:00:00+08:00"
    assert updated["status"] == "scheduled"
    assert updated["sourceActionId"] == reminder_to_update["sourceActionId"]


def test_reminder_update_rejects_invalid_due_at() -> None:
    client = TestClient(app)

    plan_response = client.post(
        "/agent/turns",
        json={
            "conversationId": "conversation_reminder_update_invalid_due_at",
            "input": "明天上午九点提醒我带电脑",
            "clientContext": {
                "now": "2026-05-21T09:00:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    ).json()
    plan = plan_response["plan"]
    client.post(
        f"/execution-plans/{plan['id']}/confirm",
        json={"confirmToken": plan["confirmation"]["confirmToken"]},
    )
    reminder_to_update = client.get("/reminders").json()[-1]

    update_response = client.patch(
        f"/reminders/{reminder_to_update['id']}",
        json={"dueAt": "明天上午九点"},
    )

    assert update_response.status_code == 400
    reminders_by_id = {
        reminder["id"]: reminder for reminder in client.get("/reminders").json()
    }
    assert reminders_by_id[reminder_to_update["id"]]["dueAt"] == reminder_to_update["dueAt"]


def test_reminder_update_rejects_done_reminder() -> None:
    client = TestClient(app)

    plan_response = client.post(
        "/agent/turns",
        json={
            "conversationId": "conversation_reminder_update_done",
            "input": "明天上午九点提醒我带电脑",
            "clientContext": {
                "now": "2026-05-21T09:00:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    ).json()
    plan = plan_response["plan"]
    client.post(
        f"/execution-plans/{plan['id']}/confirm",
        json={"confirmToken": plan["confirmation"]["confirmToken"]},
    )
    reminder_to_update = client.get("/reminders").json()[-1]
    client.post(f"/reminders/{reminder_to_update['id']}/complete")

    update_response = client.patch(
        f"/reminders/{reminder_to_update['id']}",
        json={"title": "不应该被修改"},
    )

    assert update_response.status_code == 400
    reminders_by_id = {
        reminder["id"]: reminder for reminder in client.get("/reminders").json()
    }
    assert reminders_by_id[reminder_to_update["id"]]["title"] == reminder_to_update["title"]


def test_confirmation_executes_multi_action_plan() -> None:
    client = TestClient(app)

    plan_response = client.post(
        "/agent/turns",
        json={
            "conversationId": "conversation_multi_action_001",
            "input": "明天下午三点开会，顺便把昨天 58 元打车票报销，再提醒我带电脑",
            "clientContext": {
                "now": "2026-05-21T09:00:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    ).json()
    plan = plan_response["plan"]

    confirm_response = client.post(
        f"/execution-plans/{plan['id']}/confirm",
        json={"confirmToken": plan["confirmation"]["confirmToken"]},
    )

    assert confirm_response.status_code == 200
    assert confirm_response.json()["plan"]["status"] == "succeeded"

    action_ids = [action["id"] for action in plan["actions"]]
    calendar_event = client.get("/calendar/events").json()[-1]
    expense_record = client.get("/expenses").json()[-1]
    reminder = client.get("/reminders").json()[-1]
    ledger = client.get("/execution-ledger").json()

    assert calendar_event["sourceActionId"] == action_ids[0]
    assert expense_record["sourceActionId"] == action_ids[1]
    assert reminder["sourceActionId"] == action_ids[2]
    assert [
        item["actionId"]
        for item in ledger
        if item["eventType"] == "action_executed"
        and item.get("actionId") in action_ids
    ] == action_ids


def test_domain_lists_can_be_scoped_to_conversation() -> None:
    client = TestClient(app)
    conversation_id = "conversation_scoped_domain_lists"
    other_conversation_id = "conversation_scoped_domain_lists_other"

    plan_response = client.post(
        "/agent/turns",
        json={
            "conversationId": conversation_id,
            "input": "明天下午三点开会，顺便把昨天 58 元打车票报销，再提醒我带电脑",
            "clientContext": {
                "now": "2026-05-21T09:00:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    ).json()
    plan = plan_response["plan"]

    confirm_response = client.post(
        f"/execution-plans/{plan['id']}/confirm",
        json={"confirmToken": plan["confirmation"]["confirmToken"]},
    )

    assert confirm_response.status_code == 200
    action_ids = [action["id"] for action in plan["actions"]]

    other_plan_response = client.post(
        "/agent/turns",
        json={
            "conversationId": other_conversation_id,
            "input": "后天下午三点开会，顺便把昨天 99 元餐费报销，再提醒我带资料",
            "clientContext": {
                "now": "2026-05-21T09:00:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    ).json()
    other_plan = other_plan_response["plan"]
    other_confirm_response = client.post(
        f"/execution-plans/{other_plan['id']}/confirm",
        json={"confirmToken": other_plan["confirmation"]["confirmToken"]},
    )
    assert other_confirm_response.status_code == 200

    calendar_events = client.get(
        "/calendar/events",
        params={"conversationId": conversation_id},
    ).json()
    expenses = client.get(
        "/expenses",
        params={"conversationId": conversation_id},
    ).json()
    reminders = client.get(
        "/reminders",
        params={"conversationId": conversation_id},
    ).json()
    ledger = client.get(
        "/execution-ledger",
        params={"conversationId": conversation_id},
    ).json()

    assert [event["sourceActionId"] for event in calendar_events] == [action_ids[0]]
    assert [expense["sourceActionId"] for expense in expenses] == [action_ids[1]]
    assert [reminder["sourceActionId"] for reminder in reminders] == [action_ids[2]]
    assert [
        item["actionId"]
        for item in ledger
        if item["eventType"] == "action_executed"
    ] == action_ids
    assert {item["planId"] for item in ledger} == {plan["id"]}


def _submit_and_confirm_turn(
    client: TestClient,
    *,
    conversation_id: str,
    text: str,
    now: str = "2026-05-21T09:00:00+08:00",
) -> dict[str, object]:
    plan_response = client.post(
        "/agent/turns",
        json={
            "conversationId": conversation_id,
            "input": text,
            "clientContext": {
                "now": now,
                "timezone": "Asia/Shanghai",
            },
        },
    ).json()
    plan = plan_response["plan"]
    confirm_response = client.post(
        f"/execution-plans/{plan['id']}/confirm",
        json={"confirmToken": plan["confirmation"]["confirmToken"]},
    )
    assert confirm_response.status_code == 200
    return cast(dict[str, object], confirm_response.json())


def test_agent_turn_can_cancel_recent_reminder_by_conversation_context() -> None:
    client = TestClient(app)
    conversation_id = "conversation_manage_recent_reminder"

    create_response = client.post(
        "/agent/turns",
        json={
            "conversationId": conversation_id,
            "input": "明天上午九点提醒我带电脑",
            "clientContext": {
                "now": "2026-05-21T09:00:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    ).json()
    create_plan = create_response["plan"]
    client.post(
        f"/execution-plans/{create_plan['id']}/confirm",
        json={"confirmToken": create_plan["confirmation"]["confirmToken"]},
    )
    reminder = client.get(
        "/reminders",
        params={"conversationId": conversation_id},
    ).json()[-1]

    cancel_response = client.post(
        "/agent/turns",
        json={
            "conversationId": conversation_id,
            "input": "取消刚才的提醒",
            "clientContext": {
                "now": "2026-05-21T09:05:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    )

    assert cancel_response.status_code == 200
    cancel_body = cancel_response.json()
    assert cancel_body["kind"] == "confirmation_required"
    cancel_action = cancel_body["plan"]["actions"][0]
    assert cancel_action["actionType"] == "reminder.cancel_reminder"
    assert cancel_action["payload"]["target_id"] == reminder["id"]

    confirm_response = client.post(
        f"/execution-plans/{cancel_body['plan']['id']}/confirm",
        json={"confirmToken": cancel_body["plan"]["confirmation"]["confirmToken"]},
    )

    assert confirm_response.status_code == 200
    reminders_by_id = {
        item["id"]: item
        for item in client.get(
            "/reminders",
            params={"conversationId": conversation_id},
        ).json()
    }
    assert reminders_by_id[reminder["id"]]["status"] == "canceled"


def test_agent_turn_clarifies_ambiguous_existing_reminder_target() -> None:
    client = TestClient(app)
    conversation_id = "conversation_manage_ambiguous_reminder"

    _submit_and_confirm_turn(
        client,
        conversation_id=conversation_id,
        text="明天上午九点提醒我带电脑",
    )
    _submit_and_confirm_turn(
        client,
        conversation_id=conversation_id,
        text="明天上午十点提醒我带水杯",
    )
    ledger_before = client.get(
        "/execution-ledger",
        params={"conversationId": conversation_id},
    ).json()

    cancel_response = client.post(
        "/agent/turns",
        json={
            "conversationId": conversation_id,
            "input": "取消提醒",
            "clientContext": {
                "now": "2026-05-21T09:05:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    )

    assert cancel_response.status_code == 200
    cancel_body = cancel_response.json()
    assert cancel_body["kind"] == "clarification_request"
    assert cancel_body["missingFields"] == ["target_id"]
    assert "哪一个提醒" in cancel_body["question"]
    assert "plan" not in cancel_body
    pending_response = client.get(
        f"/agent/conversations/{conversation_id}/pending-confirmations",
    )
    assert pending_response.status_code == 200
    assert pending_response.json()["plans"] == []
    ledger_after = client.get(
        "/execution-ledger",
        params={"conversationId": conversation_id},
    ).json()
    assert ledger_after == ledger_before


def test_agent_turn_clarifies_ambiguous_existing_expense_target() -> None:
    client = TestClient(app)
    conversation_id = "conversation_manage_ambiguous_expense"

    _submit_and_confirm_turn(
        client,
        conversation_id=conversation_id,
        text="把昨天 58 元打车票报销",
    )
    _submit_and_confirm_turn(
        client,
        conversation_id=conversation_id,
        text="把今天 88 元午餐报销",
    )
    ledger_before = client.get(
        "/execution-ledger",
        params={"conversationId": conversation_id},
    ).json()

    submit_response = client.post(
        "/agent/turns",
        json={
            "conversationId": conversation_id,
            "input": "提交费用",
            "clientContext": {
                "now": "2026-05-21T09:05:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    )

    assert submit_response.status_code == 200
    submit_body = submit_response.json()
    assert submit_body["kind"] == "clarification_request"
    assert submit_body["missingFields"] == ["target_id"]
    assert "哪一笔费用" in submit_body["question"]
    assert "plan" not in submit_body
    pending_response = client.get(
        f"/agent/conversations/{conversation_id}/pending-confirmations",
    )
    assert pending_response.status_code == 200
    assert pending_response.json()["plans"] == []
    ledger_after = client.get(
        "/execution-ledger",
        params={"conversationId": conversation_id},
    ).json()
    assert ledger_after == ledger_before


def test_agent_turn_resolves_ambiguous_expense_target_selection() -> None:
    client = TestClient(app)
    conversation_id = "conversation_resolve_ambiguous_expense"

    _submit_and_confirm_turn(
        client,
        conversation_id=conversation_id,
        text="把昨天 58 元打车票报销",
    )
    _submit_and_confirm_turn(
        client,
        conversation_id=conversation_id,
        text="把今天 88 元午餐报销",
    )
    expenses = client.get(
        "/expenses",
        params={"conversationId": conversation_id},
    ).json()
    target_expense = expenses[-1]

    ambiguity_response = client.post(
        "/agent/turns",
        json={
            "conversationId": conversation_id,
            "input": "提交费用",
            "clientContext": {
                "now": "2026-05-21T09:05:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    ).json()
    assert ambiguity_response["kind"] == "clarification_request"

    selection_response = client.post(
        "/agent/turns",
        json={
            "conversationId": conversation_id,
            "input": ambiguity_response["quickReplies"][-1],
            "clientContext": {
                "now": "2026-05-21T09:06:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    )

    assert selection_response.status_code == 200
    selection_body = selection_response.json()
    assert selection_body["kind"] == "confirmation_required"
    action = selection_body["plan"]["actions"][0]
    assert action["actionType"] == "expense.submit_reimbursement"
    assert action["payload"]["target_id"] == target_expense["id"]
    assert action["payload"]["expected_status"] == "draft"


def test_agent_turn_target_selection_uses_displayed_quick_reply_order() -> None:
    client = TestClient(app)
    conversation_id = "conversation_resolve_displayed_reminder_target"

    _submit_and_confirm_turn(
        client,
        conversation_id=conversation_id,
        text="明天上午九点提醒我带电脑",
    )
    _submit_and_confirm_turn(
        client,
        conversation_id=conversation_id,
        text="明天上午十点提醒我带水杯",
    )
    _submit_and_confirm_turn(
        client,
        conversation_id=conversation_id,
        text="明天上午十一点提醒我带雨伞",
    )
    _submit_and_confirm_turn(
        client,
        conversation_id=conversation_id,
        text="明天下午三点提醒我带文件",
    )
    reminders = client.get(
        "/reminders",
        params={"conversationId": conversation_id},
    ).json()
    displayed_first_target = reminders[-3]

    ambiguity_response = client.post(
        "/agent/turns",
        json={
            "conversationId": conversation_id,
            "input": "完成提醒",
            "clientContext": {
                "now": "2026-05-21T09:05:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    ).json()
    assert ambiguity_response["kind"] == "clarification_request"
    assert len(ambiguity_response["quickReplies"]) == 3
    assert displayed_first_target["title"] in ambiguity_response["quickReplies"][0]

    selection_response = client.post(
        "/agent/turns",
        json={
            "conversationId": conversation_id,
            "input": ambiguity_response["quickReplies"][0],
            "clientContext": {
                "now": "2026-05-21T09:06:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    )

    assert selection_response.status_code == 200
    selection_body = selection_response.json()
    assert selection_body["kind"] == "confirmation_required"
    action = selection_body["plan"]["actions"][0]
    assert action["actionType"] == "reminder.complete_reminder"
    assert action["payload"]["target_id"] == displayed_first_target["id"]


def test_agent_turn_target_selection_exposes_stable_quick_reply_values() -> None:
    client = TestClient(app)
    conversation_id = "conversation_resolve_duplicate_reminder_labels"

    _submit_and_confirm_turn(
        client,
        conversation_id=conversation_id,
        text="明天上午九点提醒我带电脑",
    )
    _submit_and_confirm_turn(
        client,
        conversation_id=conversation_id,
        text="明天上午九点提醒我带电脑",
    )
    reminders = client.get(
        "/reminders",
        params={"conversationId": conversation_id},
    ).json()
    target_reminder = reminders[-1]

    ambiguity_response = client.post(
        "/agent/turns",
        json={
            "conversationId": conversation_id,
            "input": "完成提醒",
            "clientContext": {
                "now": "2026-05-21T09:05:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    ).json()
    assert ambiguity_response["kind"] == "clarification_request"
    assert ambiguity_response["quickReplies"][0] == ambiguity_response["quickReplies"][1]
    assert ambiguity_response["quickReplyOptions"] == [
        {
            "label": ambiguity_response["quickReplies"][0],
            "value": reminders[0]["id"],
        },
        {
            "label": ambiguity_response["quickReplies"][1],
            "value": target_reminder["id"],
        },
    ]

    selection_response = client.post(
        "/agent/turns",
        json={
            "conversationId": conversation_id,
            "input": ambiguity_response["quickReplyOptions"][1]["value"],
            "clientContext": {
                "now": "2026-05-21T09:06:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    )

    assert selection_response.status_code == 200
    selection_body = selection_response.json()
    assert selection_body["kind"] == "confirmation_required"
    action = selection_body["plan"]["actions"][0]
    assert action["actionType"] == "reminder.complete_reminder"
    assert action["payload"]["target_id"] == target_reminder["id"]


def test_agent_turn_history_records_display_input_for_structured_quick_reply() -> None:
    client = TestClient(app)
    conversation_id = "conversation_structured_quick_reply_display_input"

    _submit_and_confirm_turn(
        client,
        conversation_id=conversation_id,
        text="明天上午九点提醒我带电脑",
    )
    _submit_and_confirm_turn(
        client,
        conversation_id=conversation_id,
        text="明天上午九点提醒我带电脑",
    )
    reminders = client.get(
        "/reminders",
        params={"conversationId": conversation_id},
    ).json()

    ambiguity_response = client.post(
        "/agent/turns",
        json={
            "conversationId": conversation_id,
            "input": "完成提醒",
            "clientContext": {
                "now": "2026-05-21T09:05:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    ).json()
    selected_option = ambiguity_response["quickReplyOptions"][1]
    assert selected_option == {
        "label": ambiguity_response["quickReplies"][1],
        "value": reminders[-1]["id"],
    }

    selection_response = client.post(
        "/agent/turns",
        json={
            "conversationId": conversation_id,
            "displayInput": selected_option["label"],
            "input": selected_option["value"],
            "clientContext": {
                "now": "2026-05-21T09:06:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    )

    assert selection_response.status_code == 200
    assert selection_response.json()["kind"] == "confirmation_required"

    history_response = client.get(f"/agent/conversations/{conversation_id}/turns")
    assert history_response.status_code == 200
    user_turns = [
        turn for turn in history_response.json()["turns"] if turn["role"] == "user"
    ]
    selection_turn = user_turns[-1]
    assert selection_turn["inputText"] == selected_option["label"]
    assert selection_turn["summary"] == selected_option["label"]
    assert selection_turn["rawContent"]["submittedInput"] == selected_option["value"]
    assert selection_turn["rawContent"]["displayInput"] == selected_option["label"]


def test_agent_turn_resolves_ambiguous_reminder_update_target_selection() -> None:
    client = TestClient(app)
    conversation_id = "conversation_resolve_ambiguous_reminder_update"

    _submit_and_confirm_turn(
        client,
        conversation_id=conversation_id,
        text="明天上午九点提醒我带电脑",
    )
    _submit_and_confirm_turn(
        client,
        conversation_id=conversation_id,
        text="明天上午十点提醒我带水杯",
    )
    reminders = client.get(
        "/reminders",
        params={"conversationId": conversation_id},
    ).json()
    target_reminder = reminders[-1]

    ambiguity_response = client.post(
        "/agent/turns",
        json={
            "conversationId": conversation_id,
            "input": "把提醒改到明天上午十一点",
            "clientContext": {
                "now": "2026-05-21T09:05:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    ).json()
    assert ambiguity_response["kind"] == "clarification_request"

    selection_response = client.post(
        "/agent/turns",
        json={
            "conversationId": conversation_id,
            "input": ambiguity_response["quickReplies"][-1],
            "clientContext": {
                "now": "2026-05-21T09:06:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    )

    assert selection_response.status_code == 200
    selection_body = selection_response.json()
    assert selection_body["kind"] == "confirmation_required"
    action = selection_body["plan"]["actions"][0]
    assert action["actionType"] == "reminder.update_reminder"
    assert action["payload"]["target_id"] == target_reminder["id"]
    assert action["payload"]["expected_status"] == "scheduled"
    assert action["payload"]["patch"]["dueAt"] == "2026-05-22T11:00:00+08:00"


def test_agent_turn_clarifies_ambiguous_existing_calendar_target() -> None:
    client = TestClient(app)
    conversation_id = "conversation_manage_ambiguous_calendar"

    _submit_and_confirm_turn(
        client,
        conversation_id=conversation_id,
        text="明天下午三点开会",
    )
    _submit_and_confirm_turn(
        client,
        conversation_id=conversation_id,
        text="明天下午五点开会",
    )
    ledger_before = client.get(
        "/execution-ledger",
        params={"conversationId": conversation_id},
    ).json()

    cancel_response = client.post(
        "/agent/turns",
        json={
            "conversationId": conversation_id,
            "input": "取消明天的会议",
            "clientContext": {
                "now": "2026-05-21T09:05:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    )

    assert cancel_response.status_code == 200
    cancel_body = cancel_response.json()
    assert cancel_body["kind"] == "clarification_request"
    assert cancel_body["missingFields"] == ["target_id"]
    assert "哪一个日程" in cancel_body["question"]
    assert "plan" not in cancel_body
    pending_response = client.get(
        f"/agent/conversations/{conversation_id}/pending-confirmations",
    )
    assert pending_response.status_code == 200
    assert pending_response.json()["plans"] == []
    ledger_after = client.get(
        "/execution-ledger",
        params={"conversationId": conversation_id},
    ).json()
    assert ledger_after == ledger_before


def test_agent_turn_resolves_ambiguous_calendar_target_selection() -> None:
    client = TestClient(app)
    conversation_id = "conversation_resolve_ambiguous_calendar"

    _submit_and_confirm_turn(
        client,
        conversation_id=conversation_id,
        text="明天下午三点开会",
    )
    _submit_and_confirm_turn(
        client,
        conversation_id=conversation_id,
        text="明天下午五点开会",
    )
    events = client.get(
        "/calendar/events",
        params={"conversationId": conversation_id},
    ).json()
    target_event = events[-1]

    ambiguity_response = client.post(
        "/agent/turns",
        json={
            "conversationId": conversation_id,
            "input": "取消明天的会议",
            "clientContext": {
                "now": "2026-05-21T09:05:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    ).json()
    assert ambiguity_response["kind"] == "clarification_request"

    selection_response = client.post(
        "/agent/turns",
        json={
            "conversationId": conversation_id,
            "input": ambiguity_response["quickReplies"][-1],
            "clientContext": {
                "now": "2026-05-21T09:06:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    )

    assert selection_response.status_code == 200
    selection_body = selection_response.json()
    assert selection_body["kind"] == "confirmation_required"
    action = selection_body["plan"]["actions"][0]
    assert action["actionType"] == "calendar.cancel_event"
    assert action["payload"]["target_id"] == target_event["id"]
    assert action["payload"]["expected_status"] == "scheduled"


def test_agent_turn_resolves_ambiguous_expense_update_target_selection() -> None:
    client = TestClient(app)
    conversation_id = "conversation_resolve_ambiguous_expense_update"

    _submit_and_confirm_turn(
        client,
        conversation_id=conversation_id,
        text="把昨天 58 元打车票报销",
    )
    _submit_and_confirm_turn(
        client,
        conversation_id=conversation_id,
        text="把今天 88 元午餐报销",
    )
    expenses = client.get(
        "/expenses",
        params={"conversationId": conversation_id},
    ).json()
    target_expense = expenses[-1]

    ambiguity_response = client.post(
        "/agent/turns",
        json={
            "conversationId": conversation_id,
            "input": "把费用改成 99 元",
            "clientContext": {
                "now": "2026-05-21T09:05:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    ).json()
    assert ambiguity_response["kind"] == "clarification_request"

    selection_response = client.post(
        "/agent/turns",
        json={
            "conversationId": conversation_id,
            "input": ambiguity_response["quickReplies"][-1],
            "clientContext": {
                "now": "2026-05-21T09:06:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    )

    assert selection_response.status_code == 200
    selection_body = selection_response.json()
    assert selection_body["kind"] == "confirmation_required"
    action = selection_body["plan"]["actions"][0]
    assert action["actionType"] == "expense.update_reimbursement"
    assert action["payload"]["target_id"] == target_expense["id"]
    assert action["payload"]["expected_status"] == "draft"
    assert action["payload"]["patch"]["amount"] == 99


def test_agent_turn_resolves_ambiguous_calendar_update_target_selection() -> None:
    client = TestClient(app)
    conversation_id = "conversation_resolve_ambiguous_calendar_update"

    _submit_and_confirm_turn(
        client,
        conversation_id=conversation_id,
        text="明天下午三点开会",
    )
    _submit_and_confirm_turn(
        client,
        conversation_id=conversation_id,
        text="明天下午五点开会",
    )
    events = client.get(
        "/calendar/events",
        params={"conversationId": conversation_id},
    ).json()
    target_event = events[-1]

    ambiguity_response = client.post(
        "/agent/turns",
        json={
            "conversationId": conversation_id,
            "input": "把明天的会议改到十点",
            "clientContext": {
                "now": "2026-05-21T09:05:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    ).json()
    assert ambiguity_response["kind"] == "clarification_request"

    selection_response = client.post(
        "/agent/turns",
        json={
            "conversationId": conversation_id,
            "input": ambiguity_response["quickReplies"][-1],
            "clientContext": {
                "now": "2026-05-21T09:06:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    )

    assert selection_response.status_code == 200
    selection_body = selection_response.json()
    assert selection_body["kind"] == "confirmation_required"
    action = selection_body["plan"]["actions"][0]
    assert action["actionType"] == "calendar.update_event"
    assert action["payload"]["target_id"] == target_event["id"]
    assert action["payload"]["expected_status"] == "scheduled"
    assert action["payload"]["patch"]["startAt"] == "2026-05-22T10:00:00+08:00"
    assert action["payload"]["patch"]["endAt"] == "2026-05-22T11:00:00+08:00"


def test_agent_turn_can_submit_recent_expense_by_conversation_context() -> None:
    client = TestClient(app)
    conversation_id = "conversation_manage_recent_expense"

    create_response = client.post(
        "/agent/turns",
        json={
            "conversationId": conversation_id,
            "input": "把昨天 58 元打车票报销",
            "clientContext": {
                "now": "2026-05-21T09:00:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    ).json()
    create_plan = create_response["plan"]
    client.post(
        f"/execution-plans/{create_plan['id']}/confirm",
        json={"confirmToken": create_plan["confirmation"]["confirmToken"]},
    )
    expense = client.get(
        "/expenses",
        params={"conversationId": conversation_id},
    ).json()[-1]

    submit_response = client.post(
        "/agent/turns",
        json={
            "conversationId": conversation_id,
            "input": "提交刚才的费用",
            "clientContext": {
                "now": "2026-05-21T09:05:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    )

    assert submit_response.status_code == 200
    submit_body = submit_response.json()
    assert submit_body["kind"] == "confirmation_required"
    submit_action = submit_body["plan"]["actions"][0]
    assert submit_action["actionType"] == "expense.submit_reimbursement"
    assert submit_action["payload"]["target_id"] == expense["id"]

    confirm_response = client.post(
        f"/execution-plans/{submit_body['plan']['id']}/confirm",
        json={"confirmToken": submit_body["plan"]["confirmation"]["confirmToken"]},
    )

    assert confirm_response.status_code == 200
    expenses_by_id = {
        item["id"]: item
        for item in client.get(
            "/expenses",
            params={"conversationId": conversation_id},
        ).json()
    }
    assert expenses_by_id[expense["id"]]["status"] == "submitted"


def test_agent_turn_can_update_tomorrow_calendar_event_by_context() -> None:
    client = TestClient(app)
    conversation_id = "conversation_manage_calendar_update"

    create_response = client.post(
        "/agent/turns",
        json={
            "conversationId": conversation_id,
            "input": "明天下午三点开会",
            "clientContext": {
                "now": "2026-05-21T09:00:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    ).json()
    create_plan = create_response["plan"]
    client.post(
        f"/execution-plans/{create_plan['id']}/confirm",
        json={"confirmToken": create_plan["confirmation"]["confirmToken"]},
    )
    event = client.get(
        "/calendar/events",
        params={"conversationId": conversation_id},
    ).json()[-1]

    update_response = client.post(
        "/agent/turns",
        json={
            "conversationId": conversation_id,
            "input": "把明天的会议改到十点",
            "clientContext": {
                "now": "2026-05-21T09:05:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    )

    assert update_response.status_code == 200
    update_body = update_response.json()
    assert update_body["kind"] == "confirmation_required"
    update_action = update_body["plan"]["actions"][0]
    assert update_action["actionType"] == "calendar.update_event"
    assert update_action["payload"]["target_id"] == event["id"]
    assert update_action["payload"]["patch"]["startAt"] == "2026-05-22T10:00:00+08:00"

    confirm_response = client.post(
        f"/execution-plans/{update_body['plan']['id']}/confirm",
        json={"confirmToken": update_body["plan"]["confirmation"]["confirmToken"]},
    )

    assert confirm_response.status_code == 200
    events_by_id = {
        item["id"]: item
        for item in client.get(
            "/calendar/events",
            params={"conversationId": conversation_id},
        ).json()
    }
    assert events_by_id[event["id"]]["startAt"] == "2026-05-22T10:00:00+08:00"
    assert events_by_id[event["id"]]["endAt"] == "2026-05-22T11:00:00+08:00"


def test_agent_turn_can_complete_recent_reminder_by_conversation_context() -> None:
    client = TestClient(app)
    conversation_id = "conversation_manage_recent_reminder_complete"
    _submit_and_confirm_turn(
        client,
        conversation_id=conversation_id,
        text="明天上午九点提醒我带电脑",
    )
    reminder = client.get(
        "/reminders",
        params={"conversationId": conversation_id},
    ).json()[-1]

    complete_response = client.post(
        "/agent/turns",
        json={
            "conversationId": conversation_id,
            "input": "完成刚才的提醒",
            "clientContext": {
                "now": "2026-05-21T09:05:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    )

    assert complete_response.status_code == 200
    complete_body = complete_response.json()
    assert complete_body["kind"] == "confirmation_required"
    action = complete_body["plan"]["actions"][0]
    assert action["actionType"] == "reminder.complete_reminder"
    assert action["payload"]["target_id"] == reminder["id"]

    client.post(
        f"/execution-plans/{complete_body['plan']['id']}/confirm",
        json={"confirmToken": complete_body["plan"]["confirmation"]["confirmToken"]},
    )
    reminders_by_id = {
        item["id"]: item
        for item in client.get(
            "/reminders",
            params={"conversationId": conversation_id},
        ).json()
    }
    assert reminders_by_id[reminder["id"]]["status"] == "done"


def test_agent_turn_can_update_recent_reminder_by_conversation_context() -> None:
    client = TestClient(app)
    conversation_id = "conversation_manage_recent_reminder_update"
    _submit_and_confirm_turn(
        client,
        conversation_id=conversation_id,
        text="明天上午九点提醒我带电脑",
    )
    reminder = client.get(
        "/reminders",
        params={"conversationId": conversation_id},
    ).json()[-1]

    update_response = client.post(
        "/agent/turns",
        json={
            "conversationId": conversation_id,
            "input": "把刚才的提醒改到明天上午十点",
            "clientContext": {
                "now": "2026-05-21T09:05:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    )

    assert update_response.status_code == 200
    update_body = update_response.json()
    assert update_body["kind"] == "confirmation_required"
    action = update_body["plan"]["actions"][0]
    assert action["actionType"] == "reminder.update_reminder"
    assert action["payload"]["target_id"] == reminder["id"]
    assert action["payload"]["patch"]["dueAt"] == "2026-05-22T10:00:00+08:00"

    client.post(
        f"/execution-plans/{update_body['plan']['id']}/confirm",
        json={"confirmToken": update_body["plan"]["confirmation"]["confirmToken"]},
    )
    reminders_by_id = {
        item["id"]: item
        for item in client.get(
            "/reminders",
            params={"conversationId": conversation_id},
        ).json()
    }
    assert reminders_by_id[reminder["id"]]["dueAt"] == "2026-05-22T10:00:00+08:00"


def test_agent_turn_can_cancel_recent_expense_by_conversation_context() -> None:
    client = TestClient(app)
    conversation_id = "conversation_manage_recent_expense_cancel"
    _submit_and_confirm_turn(
        client,
        conversation_id=conversation_id,
        text="把昨天 58 元打车票报销",
    )
    expense = client.get(
        "/expenses",
        params={"conversationId": conversation_id},
    ).json()[-1]

    cancel_response = client.post(
        "/agent/turns",
        json={
            "conversationId": conversation_id,
            "input": "取消刚才的费用",
            "clientContext": {
                "now": "2026-05-21T09:05:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    )

    assert cancel_response.status_code == 200
    cancel_body = cancel_response.json()
    assert cancel_body["kind"] == "confirmation_required"
    action = cancel_body["plan"]["actions"][0]
    assert action["actionType"] == "expense.cancel_reimbursement"
    assert action["payload"]["target_id"] == expense["id"]

    client.post(
        f"/execution-plans/{cancel_body['plan']['id']}/confirm",
        json={"confirmToken": cancel_body["plan"]["confirmation"]["confirmToken"]},
    )
    expenses_by_id = {
        item["id"]: item
        for item in client.get(
            "/expenses",
            params={"conversationId": conversation_id},
        ).json()
    }
    assert expenses_by_id[expense["id"]]["status"] == "canceled"


def test_agent_turn_can_update_recent_expense_by_conversation_context() -> None:
    client = TestClient(app)
    conversation_id = "conversation_manage_recent_expense_update"
    _submit_and_confirm_turn(
        client,
        conversation_id=conversation_id,
        text="把昨天 58 元打车票报销",
    )
    expense = client.get(
        "/expenses",
        params={"conversationId": conversation_id},
    ).json()[-1]

    update_response = client.post(
        "/agent/turns",
        json={
            "conversationId": conversation_id,
            "input": "把刚才的费用改成 88 元",
            "clientContext": {
                "now": "2026-05-21T09:05:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    )

    assert update_response.status_code == 200
    update_body = update_response.json()
    assert update_body["kind"] == "confirmation_required"
    action = update_body["plan"]["actions"][0]
    assert action["actionType"] == "expense.update_reimbursement"
    assert action["payload"]["target_id"] == expense["id"]
    assert action["payload"]["patch"]["amount"] == 88

    client.post(
        f"/execution-plans/{update_body['plan']['id']}/confirm",
        json={"confirmToken": update_body["plan"]["confirmation"]["confirmToken"]},
    )
    expenses_by_id = {
        item["id"]: item
        for item in client.get(
            "/expenses",
            params={"conversationId": conversation_id},
        ).json()
    }
    assert expenses_by_id[expense["id"]]["amount"] == 88


def test_agent_turn_can_cancel_tomorrow_calendar_event_by_context() -> None:
    client = TestClient(app)
    conversation_id = "conversation_manage_calendar_cancel"
    _submit_and_confirm_turn(
        client,
        conversation_id=conversation_id,
        text="明天下午三点开会",
    )
    event = client.get(
        "/calendar/events",
        params={"conversationId": conversation_id},
    ).json()[-1]

    cancel_response = client.post(
        "/agent/turns",
        json={
            "conversationId": conversation_id,
            "input": "取消明天的会议",
            "clientContext": {
                "now": "2026-05-21T09:05:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    )

    assert cancel_response.status_code == 200
    cancel_body = cancel_response.json()
    assert cancel_body["kind"] == "confirmation_required"
    action = cancel_body["plan"]["actions"][0]
    assert action["actionType"] == "calendar.cancel_event"
    assert action["payload"]["target_id"] == event["id"]

    client.post(
        f"/execution-plans/{cancel_body['plan']['id']}/confirm",
        json={"confirmToken": cancel_body["plan"]["confirmation"]["confirmToken"]},
    )
    events_by_id = {
        item["id"]: item
        for item in client.get(
            "/calendar/events",
            params={"conversationId": conversation_id},
        ).json()
    }
    assert events_by_id[event["id"]]["status"] == "canceled"


def test_agent_turn_can_query_tomorrow_schedule_from_conversation_context() -> None:
    client = TestClient(app)
    conversation_id = "conversation_query_tomorrow_schedule"

    _submit_and_confirm_turn(
        client,
        conversation_id=conversation_id,
        text="明天下午三点开会",
    )
    _submit_and_confirm_turn(
        client,
        conversation_id=conversation_id,
        text="明天上午九点提醒我带电脑",
    )
    _submit_and_confirm_turn(
        client,
        conversation_id=conversation_id,
        text="把昨天 58 元打车票报销",
    )
    ledger_before_query = client.get(
        "/execution-ledger",
        params={"conversationId": conversation_id},
    ).json()

    query_response = client.post(
        "/agent/turns",
        json={
            "conversationId": conversation_id,
            "input": "明天我有什么安排？",
            "clientContext": {
                "now": "2026-05-21T09:05:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    )

    assert query_response.status_code == 200
    body = query_response.json()
    assert body["kind"] == "assistant_message"
    assert "开会" in body["message"]
    assert "带电脑" in body["message"]
    assert "打车票" not in body["message"]
    assert body["structuredElements"][0]["kind"] == "summary-list"
    assert body["structuredElements"][0]["title"] == "明天的安排"
    labels = [
        item["label"]
        for item in body["structuredElements"][0]["items"]
    ]
    assert labels == ["带电脑", "开会"]
    pending_response = client.get(
        f"/agent/conversations/{conversation_id}/pending-confirmations",
    )
    assert pending_response.status_code == 200
    assert pending_response.json()["plans"] == []
    ledger_after_query = client.get(
        "/execution-ledger",
        params={"conversationId": conversation_id},
    ).json()
    assert ledger_after_query == ledger_before_query


def test_agent_turn_can_query_expenses_from_conversation_context() -> None:
    client = TestClient(app)
    conversation_id = "conversation_query_expenses"

    _submit_and_confirm_turn(
        client,
        conversation_id=conversation_id,
        text="把昨天 58 元打车票报销",
    )

    query_response = client.post(
        "/agent/turns",
        json={
            "conversationId": conversation_id,
            "input": "我有哪些费用？",
            "clientContext": {
                "now": "2026-05-21T09:05:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    )

    assert query_response.status_code == 200
    body = query_response.json()
    assert body["kind"] == "assistant_message"
    assert "打车票" in body["message"]
    assert "58" in body["message"]
    assert body["structuredElements"][0]["kind"] == "summary-list"
    assert body["structuredElements"][0]["title"] == "当前会话里的费用"
    assert "打车票" in body["structuredElements"][0]["items"][0]["label"]


def test_agent_turn_query_reminders_only_filters_out_calendar_events() -> None:
    client = TestClient(app)
    conversation_id = "conversation_query_reminders_only"

    _submit_and_confirm_turn(
        client,
        conversation_id=conversation_id,
        text="明天下午三点开会",
    )
    _submit_and_confirm_turn(
        client,
        conversation_id=conversation_id,
        text="明天上午九点提醒我带电脑",
    )

    query_response = client.post(
        "/agent/turns",
        json={
            "conversationId": conversation_id,
            "input": "明天有什么提醒？",
            "clientContext": {
                "now": "2026-05-21T09:05:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    )

    body = query_response.json()
    assert body["kind"] == "assistant_message"
    assert "带电脑" in body["message"]
    assert "开会" not in body["message"]
    assert body["structuredElements"][0]["title"] == "明天的提醒"


def test_agent_turn_query_calendar_only_filters_out_reminders() -> None:
    client = TestClient(app)
    conversation_id = "conversation_query_calendar_only"

    _submit_and_confirm_turn(
        client,
        conversation_id=conversation_id,
        text="明天下午三点开会",
    )
    _submit_and_confirm_turn(
        client,
        conversation_id=conversation_id,
        text="明天上午九点提醒我带电脑",
    )

    query_response = client.post(
        "/agent/turns",
        json={
            "conversationId": conversation_id,
            "input": "明天有什么日程？",
            "clientContext": {
                "now": "2026-05-21T09:05:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    )

    body = query_response.json()
    assert body["kind"] == "assistant_message"
    assert "开会" in body["message"]
    assert "带电脑" not in body["message"]
    assert body["structuredElements"][0]["title"] == "明天的日程"


def test_agent_turn_query_expenses_filters_by_relative_date() -> None:
    client = TestClient(app)
    conversation_id = "conversation_query_expenses_by_date"

    _submit_and_confirm_turn(
        client,
        conversation_id=conversation_id,
        text="把昨天 58 元打车票报销",
    )
    _submit_and_confirm_turn(
        client,
        conversation_id=conversation_id,
        text="把今天 99 元午餐报销",
    )

    query_response = client.post(
        "/agent/turns",
        json={
            "conversationId": conversation_id,
            "input": "昨天有哪些费用？",
            "clientContext": {
                "now": "2026-05-21T09:05:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    )

    body = query_response.json()
    assert body["kind"] == "assistant_message"
    assert "打车票" in body["message"]
    assert "午餐" not in body["message"]


def test_confirming_succeeded_plan_again_is_idempotent() -> None:
    client = TestClient(app)

    plan_response = client.post(
        "/agent/turns",
        json={
            "conversationId": "conversation_repeat_confirm",
            "input": "明天下午三点开会",
            "clientContext": {
                "now": "2026-05-21T09:00:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    ).json()
    plan = plan_response["plan"]
    request = {"confirmToken": plan["confirmation"]["confirmToken"]}

    first_response = client.post(f"/execution-plans/{plan['id']}/confirm", json=request)
    second_response = client.post(f"/execution-plans/{plan['id']}/confirm", json=request)

    assert first_response.status_code == 200
    assert second_response.status_code == 200
    assert second_response.json()["plan"]["status"] == "succeeded"


def test_agent_turn_returns_clarification_for_expense_amount() -> None:
    client = TestClient(app)

    response = client.post(
        "/agent/turns",
        json={
            "conversationId": "conversation_003",
            "input": "把昨天打车票报销",
            "clientContext": {
                "now": "2026-05-21T09:00:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["kind"] == "clarification_request"
    assert body["conversationId"] == "conversation_003"
    assert body["question"] == "打车票报销需要补充金额。"
    assert body["missingFields"] == ["amount"]
    assert body["quickReplies"] == ["58 元", "100 元", "我再说具体金额"]
    assert body["clarificationId"].startswith("pending_")


def test_agent_turn_resolves_pending_expense_amount() -> None:
    client = TestClient(app)
    first = client.post(
        "/agent/turns",
        json={
            "conversationId": "conversation_resolve_expense_amount",
            "input": "把昨天打车票报销",
            "clientContext": {
                "now": "2026-05-21T09:00:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    ).json()
    assert first["kind"] == "clarification_request"

    second = client.post(
        "/agent/turns",
        json={
            "conversationId": "conversation_resolve_expense_amount",
            "input": "58 元",
            "clientContext": {
                "now": "2026-05-21T09:01:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    ).json()

    assert second["kind"] == "confirmation_required"
    action = second["plan"]["actions"][0]
    assert action["actionType"] == "expense.create_reimbursement_draft"
    assert action["payload"]["title"] == "打车票报销"
    assert action["payload"]["amount"] == 58
    assert action["payload"]["occurred_on"] == "2026-05-20"


def test_agent_turn_clarifies_attachment_receipt_amount_then_resolves() -> None:
    client = TestClient(app)
    conversation_id = "conversation_attachment_receipt_expense"

    attachment = client.post(
        "/attachments/intake",
        json={
            "attachmentId": "native_attachment_receipt_001",
            "attachmentKind": "image",
            "attachmentName": "receipt.jpg",
            "attachmentSizeBytes": 245678,
            "attachmentType": "public.jpeg",
            "conversationId": conversation_id,
            "source": "native.composer.attachment.photo",
            "text": "已选择附件：receipt.jpg（image，245678 bytes）。",
        },
    ).json()

    first = client.post(
        "/agent/turns",
        json={
            "conversationId": conversation_id,
            "input": "把 receipt.jpg 作为费用票据处理",
            "clientContext": {
                "now": "2026-05-21T09:00:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    ).json()

    assert first["kind"] == "clarification_request"
    assert first["missingFields"] == ["amount"]
    assert first["question"] == "receipt.jpg 报销需要补充金额。"
    assert first["quickReplies"] == ["58 元", "100 元", "我再说具体金额"]

    second = client.post(
        "/agent/turns",
        json={
            "conversationId": conversation_id,
            "input": "58 元",
            "clientContext": {
                "now": "2026-05-21T09:01:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    ).json()

    assert second["kind"] == "confirmation_required"
    action = second["plan"]["actions"][0]
    assert action["actionType"] == "expense.create_reimbursement_draft"
    assert action["payload"]["title"] == "receipt.jpg 报销"
    assert action["payload"]["amount"] == 58
    assert action["payload"]["currency"] == "CNY"
    assert action["payload"]["attachment_id"] == attachment["id"]
    debug = client.get(f"/agent/conversations/{conversation_id}/debug").json()
    latest_trace = debug["decisionTraces"][-1]
    assert "attachment_summary" in latest_trace["contextSectionsUsed"]


def test_agent_turn_creates_attachment_receipt_expense_when_text_has_amount() -> None:
    client = TestClient(app)
    conversation_id = "conversation_attachment_receipt_text_amount"

    attachment = client.post(
        "/attachments/intake",
        json={
            "attachmentId": "native_attachment_receipt_text_amount_001",
            "attachmentKind": "image",
            "attachmentName": "receipt-with-text.jpg",
            "attachmentSizeBytes": 245678,
            "attachmentType": "public.jpeg",
            "conversationId": conversation_id,
            "source": "native.composer.attachment.photo",
            "text": "出租车发票 合计 88.5 元 日期 2026-05-20",
        },
    ).json()

    response = client.post(
        "/agent/turns",
        json={
            "conversationId": conversation_id,
            "input": "把 receipt-with-text.jpg 作为费用票据处理",
            "clientContext": {
                "now": "2026-05-21T09:00:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["kind"] == "confirmation_required"
    action = body["plan"]["actions"][0]
    assert action["actionType"] == "expense.create_reimbursement_draft"
    assert action["payload"]["title"] == "receipt-with-text.jpg 报销"
    assert action["payload"]["amount"] == 88.5
    assert action["payload"]["currency"] == "CNY"
    assert action["payload"]["occurred_on"] == "2026-05-20"
    assert action["payload"]["attachment_id"] == attachment["id"]
    assert action["payload"]["attachment_name"] == "receipt-with-text.jpg"


def test_agent_turn_uses_today_for_attachment_receipt_expense_without_date() -> None:
    client = TestClient(app)
    conversation_id = "conversation_attachment_receipt_text_amount_without_date"

    client.post(
        "/attachments/intake",
        json={
            "attachmentId": "native_attachment_receipt_text_amount_002",
            "attachmentKind": "image",
            "attachmentName": "receipt-without-date.jpg",
            "attachmentSizeBytes": 245678,
            "attachmentType": "public.jpeg",
            "conversationId": conversation_id,
            "source": "native.composer.attachment.photo",
            "text": "出租车发票 合计 88.5 元",
        },
    )

    response = client.post(
        "/agent/turns",
        json={
            "conversationId": conversation_id,
            "input": "把 receipt-without-date.jpg 作为费用票据处理",
            "clientContext": {
                "now": "2026-05-21T09:00:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["kind"] == "confirmation_required"
    action = body["plan"]["actions"][0]
    assert action["payload"]["occurred_on"] == "2026-05-21"


def test_agent_turn_clarifies_attachment_calendar_material_then_resolves() -> None:
    client = TestClient(app)
    conversation_id = "conversation_attachment_calendar_material"
    attachment = client.post(
        "/attachments/intake",
        json={
            "attachmentId": "native_attachment_material_001",
            "attachmentKind": "file",
            "attachmentName": "agenda.pdf",
            "attachmentSizeBytes": 245678,
            "attachmentType": "com.adobe.pdf",
            "conversationId": conversation_id,
            "source": "native.composer.attachment.file",
            "text": "已选择附件：agenda.pdf（file，245678 bytes）。",
        },
    ).json()

    first = client.post(
        "/agent/turns",
        json={
            "conversationId": conversation_id,
            "input": "把 agenda.pdf 作为日程材料处理",
            "clientContext": {
                "now": "2026-05-21T09:00:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    ).json()

    assert first["kind"] == "clarification_request"
    assert first["missingFields"] == ["start_at"]
    assert first["question"] == "agenda.pdf 要关联到哪个时间的日程？"
    assert first["quickReplies"] == ["明天上午9点", "明天上午10点", "我再说具体时间"]

    second = client.post(
        "/agent/turns",
        json={
            "conversationId": conversation_id,
            "input": "明天上午10点",
            "clientContext": {
                "now": "2026-05-21T09:01:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    ).json()

    assert second["kind"] == "confirmation_required"
    action = second["plan"]["actions"][0]
    assert action["actionType"] == "calendar.create_event"
    assert action["payload"]["title"] == "agenda.pdf 相关日程"
    assert action["payload"]["start_at"] == "2026-05-22T10:00:00+08:00"
    assert action["payload"]["end_at"] == "2026-05-22T11:00:00+08:00"
    assert action["payload"]["attachment_id"] == attachment["id"]
    assert action["payload"]["attachment_name"] == "agenda.pdf"


def test_reject_execution_plan_returns_rejected_plan() -> None:
    client = TestClient(app)

    plan_response = client.post(
        "/agent/turns",
        json={
            "conversationId": "conversation_004",
            "input": "明天下午三点开会",
            "clientContext": {
                "now": "2026-05-21T09:00:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    ).json()
    plan = plan_response["plan"]

    reject_response = client.post(f"/execution-plans/{plan['id']}/reject")

    assert reject_response.status_code == 200
    body = reject_response.json()
    assert body["id"] == plan["id"]
    assert body["status"] == "rejected"
    assert "kind" not in body


def test_confirm_rejects_unknown_action_ids() -> None:
    client = TestClient(app)

    plan_response = client.post(
        "/agent/turns",
        json={
            "conversationId": "conversation_005",
            "input": "明天下午三点开会",
            "clientContext": {
                "now": "2026-05-21T09:00:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    ).json()
    plan = plan_response["plan"]

    response = client.post(
        f"/execution-plans/{plan['id']}/confirm",
        json={
            "confirmToken": plan["confirmation"]["confirmToken"],
            "actionIds": ["action_missing"],
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "unknown action ids: action_missing"


def test_reject_executed_plan_fails() -> None:
    client = TestClient(app)

    plan_response = client.post(
        "/agent/turns",
        json={
            "conversationId": "conversation_006",
            "input": "明天下午三点开会",
            "clientContext": {
                "now": "2026-05-21T09:00:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    ).json()
    plan = plan_response["plan"]
    client.post(
        f"/execution-plans/{plan['id']}/confirm",
        json={"confirmToken": plan["confirmation"]["confirmToken"]},
    )

    response = client.post(f"/execution-plans/{plan['id']}/reject")

    assert response.status_code == 400
    assert response.json()["detail"] == "only awaiting confirmation plans can be rejected"


def test_unknown_execution_plan_returns_404() -> None:
    client = TestClient(app)

    get_response = client.get("/execution-plans/plan_missing")
    confirm_response = client.post(
        "/execution-plans/plan_missing/confirm",
        json={"confirmToken": "confirm_missing"},
    )
    reject_response = client.post("/execution-plans/plan_missing/reject")

    assert get_response.status_code == 404
    assert get_response.json()["detail"] == "execution plan not found: plan_missing"
    assert confirm_response.status_code == 404
    assert confirm_response.json()["detail"] == "execution plan not found: plan_missing"
    assert reject_response.status_code == 404
    assert reject_response.json()["detail"] == "execution plan not found: plan_missing"
