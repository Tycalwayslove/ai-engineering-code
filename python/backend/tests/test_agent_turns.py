from backend.app.main import app
from backend.app.routes.agent import _response_for_storage, _response_summary
from fastapi.testclient import TestClient


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
    assert response.json() == {
        "kind": "clarification_request",
        "conversationId": "conversation_003",
        "question": "打车票报销需要补充金额。",
        "missingFields": ["amount"],
    }


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
