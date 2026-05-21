from backend.app.main import app
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
    assert any(item["eventType"] == "action_executed" for item in ledger_response.json())


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
