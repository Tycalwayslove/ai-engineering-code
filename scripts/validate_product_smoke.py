from __future__ import annotations

import os
import sys
from argparse import ArgumentParser
from collections.abc import Iterator, Sequence
from contextlib import contextmanager
from pathlib import Path
from uuid import uuid4

from fastapi.testclient import TestClient
from httpx import Client, ConnectError, ConnectTimeout, NetworkError, Response, TimeoutException

ROOT_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT_DIR))
for relative_path in (
    "python/backend",
    "python/agent-runtime",
    "python/orchestrator",
):
    sys.path.insert(0, str(ROOT_DIR / relative_path))

os.environ.setdefault("AI_CODE_LOAD_ENV_LOCAL", "0")
os.environ.setdefault("AI_PLANNER_MODE", "rule")


CLIENT_CONTEXT = {
    "now": "2026-05-21T09:00:00+08:00",
    "timezone": "Asia/Shanghai",
}


def assert_status(response: Response, expected_status: int = 200) -> None:
    status_code = response.status_code
    if status_code != expected_status:
        body = response.text
        raise AssertionError(f"expected {expected_status}, got {status_code}: {body}")


SMOKE_API_BASE_URL = "http://127.0.0.1:8000"
SMOKE_TIMEOUT_SECONDS = 10.0
LOCAL_POSTGRES_DATABASE_URL = "postgresql://ai_code:ai_code@127.0.0.1:5432/ai_code"


def configure_in_memory_smoke_environment() -> None:
    os.environ["AI_CODE_LOAD_ENV_LOCAL"] = "0"
    os.environ["AI_PLANNER_MODE"] = "rule"
    os.environ["DATABASE_URL"] = ""


def configure_postgres_smoke_environment(database_url: str) -> None:
    os.environ["AI_CODE_LOAD_ENV_LOCAL"] = "0"
    os.environ["AI_PLANNER_MODE"] = "rule"
    os.environ["DATABASE_URL"] = database_url


def assert_postgres_available(database_url: str) -> None:
    try:
        import psycopg

        with psycopg.connect(database_url) as connection:
            connection.execute("select 1")
    except Exception as exc:
        raise RuntimeError(
            (
                "无法连接本地 Postgres，不能运行 Postgres 产品级 smoke。\n"
                f"- 当前 DATABASE_URL: {database_url}\n"
                "- 请先启动 `docker compose up -d postgres`，"
                "或设置 `DATABASE_URL=postgresql://...` 后重试。"
            ),
        ) from exc


def run_postgres_migrations(database_url: str) -> None:
    from scripts.db_migrate import MIGRATIONS_DIR, run_migrations

    run_migrations(
        database_url=database_url,
        migrations_dir=ROOT_DIR / MIGRATIONS_DIR,
    )


@contextmanager
def build_smoke_client(*, live: bool) -> Iterator[Client | TestClient]:
    if live:
        base_url = os.environ.get("AI_CODE_API_BASE_URL", SMOKE_API_BASE_URL)
        timeout = float(
            os.environ.get(
                "AI_CODE_PRODUCT_SMOKE_TIMEOUT_SECONDS",
                str(SMOKE_TIMEOUT_SECONDS),
            ),
        )
        with Client(base_url=base_url, timeout=timeout) as client:
            yield client
        return

    from backend.app.main import app

    with TestClient(app) as client:
        yield client


def submit_turn(
    client: Client | TestClient,
    *,
    conversation_id: str,
    display_input: str | None = None,
    text: str,
    now: str = "2026-05-21T09:00:00+08:00",
) -> dict[str, object]:
    body: dict[str, object] = {
        "clientContext": {
            **CLIENT_CONTEXT,
            "now": now,
        },
        "conversationId": conversation_id,
        "input": text,
    }
    if display_input is not None:
        body["displayInput"] = display_input
    response = client.post(
        "/agent/turns",
        json=body,
    )
    assert_status(response)
    return dict(response.json())


def confirm_response(
    client: Client | TestClient,
    response: dict[str, object],
) -> dict[str, object]:
    assert response["kind"] == "confirmation_required"
    plan = response["plan"]
    assert isinstance(plan, dict)
    confirmation = plan["confirmation"]
    assert isinstance(confirmation, dict)
    confirm = client.post(
        f"/execution-plans/{plan['id']}/confirm",
        json={"confirmToken": confirmation["confirmToken"]},
    )
    assert_status(confirm)
    body = dict(confirm.json())
    assert body["kind"] == "execution_result"
    assert body["plan"]["status"] == "succeeded"
    confirmation_after = body["plan"].get("confirmation")
    assert confirmation_after is None or confirmation_after["status"] == "confirmed"
    actions_after = body["plan"].get("actions", [])
    assert all(action["status"] == "succeeded" for action in actions_after)
    return body


def confirm_plan_with_token(
    client: Client | TestClient,
    *,
    plan_id: str,
    confirm_token: str,
) -> dict[str, object]:
    confirm = client.post(
        f"/execution-plans/{plan_id}/confirm",
        json={"confirmToken": confirm_token},
    )
    assert_status(confirm)
    body = dict(confirm.json())
    assert body["kind"] == "execution_result"
    assert body["plan"]["status"] == "succeeded"
    confirmation_after = body["plan"].get("confirmation")
    assert confirmation_after is None or confirmation_after["status"] == "confirmed"
    actions_after = body["plan"].get("actions", [])
    assert all(action["status"] == "succeeded" for action in actions_after)
    return body


def latest(items: list[dict[str, object]], label: str) -> dict[str, object]:
    if not items:
        raise AssertionError(f"expected at least one {label}")
    return items[-1]


def find_required_item(
    items: list[dict[str, object]],
    label: str,
    **matches: object,
) -> dict[str, object]:
    for item in items:
        if all(item.get(key) == value for key, value in matches.items()):
            return item
    raise AssertionError(f"expected {label} matching {matches}")


def get_json(
    client: Client | TestClient,
    path: str,
    *,
    conversation_id: str,
) -> list[dict[str, object]]:
    response = client.get(path, params={"conversationId": conversation_id})
    assert_status(response)
    return list(response.json())


def validate_attachment_smoke(
    client: Client | TestClient,
    *,
    conversation_id: str,
) -> None:
    upload_response = client.post(
        "/attachments/upload",
        json={
            "attachmentId": "native_attachment_smoke_upload",
            "attachmentKind": "file",
            "attachmentName": "receipt.txt",
            "attachmentType": "text/plain",
            "base64Content": "5Ye656ef6YeR6aKdIDg4LjUg5YWD",
            "conversationId": conversation_id,
            "source": "h5.product-smoke.attachment.upload",
        },
    )
    assert_status(upload_response)
    upload = upload_response.json()
    assert upload["attachmentId"] == "native_attachment_smoke_upload"
    assert upload["conversationId"] == conversation_id
    assert upload["contentStatus"] == "content_received"
    assert upload["contentSha256"]
    assert upload["text"] == "出租金额 88.5 元"

    intake_response = client.post(
        "/attachments/intake",
        json={
            "attachmentId": "native_attachment_smoke_intake",
            "attachmentKind": "image",
            "attachmentName": "receipt.jpg",
            "attachmentSizeBytes": 245678,
            "attachmentType": "public.jpeg",
            "conversationId": conversation_id,
            "source": "native.product-smoke.attachment.photo",
            "text": "已选择附件：receipt.jpg（image，245678 bytes）。",
        },
    )
    assert_status(intake_response)
    intake = intake_response.json()
    assert intake["attachmentId"] == "native_attachment_smoke_intake"
    assert intake["conversationId"] == conversation_id
    assert intake["kind"] == "image"
    assert intake["name"] == "receipt.jpg"
    assert intake["status"] == "received"

    attachments = get_json(client, "/attachments", conversation_id=conversation_id)
    attachment_names = {str(attachment["name"]) for attachment in attachments}
    assert {"receipt.txt", "receipt.jpg"}.issubset(attachment_names)
    assert any(
        attachment.get("contentStatus") == "content_received"
        and attachment.get("contentSha256")
        and attachment.get("text") == "出租金额 88.5 元"
        for attachment in attachments
    )


def validate_pending_confirmation_recovery_smoke(
    client: Client | TestClient,
    *,
    conversation_id: str,
) -> None:
    reminder_plan = submit_turn(
        client,
        conversation_id=conversation_id,
        text="明天上午九点提醒我带雨伞",
    )
    assert reminder_plan["kind"] == "confirmation_required"
    original_plan = reminder_plan["plan"]
    assert isinstance(original_plan, dict)
    original_confirmation = original_plan["confirmation"]
    assert isinstance(original_confirmation, dict)
    original_token = str(original_confirmation["confirmToken"])

    pending_path = f"/agent/conversations/{conversation_id}/pending-confirmations"
    pending_response = client.get(pending_path)
    assert_status(pending_response)
    pending = pending_response.json()
    assert pending["conversationId"] == conversation_id
    plans = pending["plans"]
    assert len(plans) == 1
    recovered_plan = plans[0]
    assert recovered_plan["id"] == original_plan["id"]
    assert recovered_plan["status"] == "awaiting_confirmation"
    recovered_confirmation = recovered_plan["confirmation"]
    assert recovered_confirmation["status"] == "pending"
    recovered_token = recovered_confirmation["confirmToken"]
    assert recovered_token
    assert recovered_token != "redacted"
    assert str(recovered_token).startswith("confirm_")
    assert recovered_token != original_token

    recovered_confirmation_result = confirm_plan_with_token(
        client,
        plan_id=str(recovered_plan["id"]),
        confirm_token=str(recovered_token),
    )
    assert recovered_confirmation_result["plan"]["id"] == recovered_plan["id"]

    pending_after_confirm_response = client.get(pending_path)
    assert_status(pending_after_confirm_response)
    pending_after_confirm = pending_after_confirm_response.json()
    assert pending_after_confirm["conversationId"] == conversation_id
    assert pending_after_confirm["plans"] == []


def _confirm_tokens_in(value: object) -> list[str]:
    if isinstance(value, dict):
        tokens: list[str] = []
        for key, item in value.items():
            if key == "confirmToken" and isinstance(item, str):
                tokens.append(item)
            tokens.extend(_confirm_tokens_in(item))
        return tokens
    if isinstance(value, list):
        tokens = []
        for item in value:
            tokens.extend(_confirm_tokens_in(item))
        return tokens
    return []


def validate_conversation_history_recovery_smoke(
    client: Client | TestClient,
    *,
    conversation_id: str,
) -> None:
    history_response = client.get(
        f"/agent/conversations/{conversation_id}/turns",
        params={"limit": 50},
    )
    assert_status(history_response)
    history = history_response.json()
    assert history["conversationId"] == conversation_id
    turns = history["turns"]
    assert len(turns) >= 6

    user_inputs = [
        turn.get("inputText")
        for turn in turns
        if turn.get("role") == "user" and isinstance(turn.get("inputText"), str)
    ]
    assert "明天上午我要去开会" in user_inputs
    assert "十点" in user_inputs
    assert "明天我有什么安排？" in user_inputs

    structured_responses = [
        turn.get("structuredResponse")
        for turn in turns
        if turn.get("role") == "assistant"
        and isinstance(turn.get("structuredResponse"), dict)
    ]
    response_kinds = {
        response["kind"]
        for response in structured_responses
        if isinstance(response.get("kind"), str)
    }
    assert {"clarification_request", "confirmation_required", "assistant_message"}.issubset(
        response_kinds,
    )

    confirm_tokens = _confirm_tokens_in(structured_responses)
    assert confirm_tokens
    assert all(token == "redacted" for token in confirm_tokens)


def validate_natural_language_management_smoke(
    client: Client | TestClient,
    *,
    conversation_id: str,
) -> None:
    create_plan = submit_turn(
        client,
        conversation_id=conversation_id,
        text="明天上午九点提醒我带水杯",
    )
    create_action = create_plan["plan"]["actions"][0]
    assert create_action["actionType"] == "reminder.create_reminder"
    confirm_response(client, create_plan)

    reminder = latest(
        get_json(client, "/reminders", conversation_id=conversation_id),
        "management reminder",
    )
    assert reminder["title"] == "带水杯"
    assert reminder["status"] == "scheduled"
    assert reminder["dueAt"] == "2026-05-22T09:00:00+08:00"

    update_plan = submit_turn(
        client,
        conversation_id=conversation_id,
        text="把刚才的提醒改到明天上午十点",
        now="2026-05-21T09:05:00+08:00",
    )
    update_action = update_plan["plan"]["actions"][0]
    assert update_action["actionType"] == "reminder.update_reminder"
    assert update_action["payload"]["target_id"] == reminder["id"]
    assert update_action["payload"]["expected_status"] == "scheduled"
    assert update_action["payload"]["patch"]["dueAt"] == "2026-05-22T10:00:00+08:00"
    confirm_response(client, update_plan)

    reminders_after_update = {
        item["id"]: item
        for item in get_json(client, "/reminders", conversation_id=conversation_id)
    }
    updated_reminder = reminders_after_update[reminder["id"]]
    assert updated_reminder["status"] == "scheduled"
    assert updated_reminder["dueAt"] == "2026-05-22T10:00:00+08:00"

    complete_plan = submit_turn(
        client,
        conversation_id=conversation_id,
        text="完成刚才的提醒",
        now="2026-05-21T09:06:00+08:00",
    )
    complete_action = complete_plan["plan"]["actions"][0]
    assert complete_action["actionType"] == "reminder.complete_reminder"
    assert complete_action["payload"]["target_id"] == reminder["id"]
    assert complete_action["payload"]["expected_status"] == "scheduled"
    confirm_response(client, complete_plan)

    reminders_after_complete = {
        item["id"]: item
        for item in get_json(client, "/reminders", conversation_id=conversation_id)
    }
    assert reminders_after_complete[reminder["id"]]["status"] == "done"

    cancel_reminder_plan = submit_turn(
        client,
        conversation_id=conversation_id,
        text="明天上午九点提醒我带雨伞",
        now="2026-05-21T09:07:00+08:00",
    )
    cancel_reminder_create_action = cancel_reminder_plan["plan"]["actions"][0]
    assert cancel_reminder_create_action["actionType"] == "reminder.create_reminder"
    assert cancel_reminder_create_action["payload"]["due_at"] == (
        "2026-05-22T09:00:00+08:00"
    )
    confirm_response(client, cancel_reminder_plan)

    cancel_target_reminder = find_required_item(
        get_json(client, "/reminders", conversation_id=conversation_id),
        "management cancel reminder",
        title="带雨伞",
    )
    assert cancel_target_reminder["title"] == "带雨伞"
    assert cancel_target_reminder["status"] == "scheduled"

    cancel_plan = submit_turn(
        client,
        conversation_id=conversation_id,
        text="取消刚才的提醒",
        now="2026-05-21T09:08:00+08:00",
    )
    cancel_action = cancel_plan["plan"]["actions"][0]
    assert cancel_action["actionType"] == "reminder.cancel_reminder"
    assert cancel_action["payload"]["target_id"] == cancel_target_reminder["id"]
    assert cancel_action["payload"]["expected_status"] == "scheduled"
    confirm_response(client, cancel_plan)

    reminders_after_cancel = {
        item["id"]: item
        for item in get_json(client, "/reminders", conversation_id=conversation_id)
    }
    assert reminders_after_cancel[cancel_target_reminder["id"]]["status"] == "canceled"

    expense_plan = submit_turn(
        client,
        conversation_id=conversation_id,
        text="把昨天 58 元打车票报销",
    )
    expense_action = expense_plan["plan"]["actions"][0]
    assert expense_action["actionType"] == "expense.create_reimbursement_draft"
    assert expense_action["payload"]["amount"] == 58
    confirm_response(client, expense_plan)

    expense = latest(
        get_json(client, "/expenses", conversation_id=conversation_id),
        "management expense",
    )
    assert expense["status"] == "draft"
    assert expense["amount"] == 58

    update_expense_plan = submit_turn(
        client,
        conversation_id=conversation_id,
        text="把刚才的费用改成 88 元",
        now="2026-05-21T09:09:00+08:00",
    )
    update_expense_action = update_expense_plan["plan"]["actions"][0]
    assert update_expense_action["actionType"] == "expense.update_reimbursement"
    assert update_expense_action["payload"]["target_id"] == expense["id"]
    assert update_expense_action["payload"]["expected_status"] == "draft"
    assert update_expense_action["payload"]["patch"]["amount"] == 88
    confirm_response(client, update_expense_plan)

    expenses_after_update = {
        item["id"]: item
        for item in get_json(client, "/expenses", conversation_id=conversation_id)
    }
    assert expenses_after_update[expense["id"]]["status"] == "draft"
    assert expenses_after_update[expense["id"]]["amount"] == 88

    submit_expense_plan = submit_turn(
        client,
        conversation_id=conversation_id,
        text="提交刚才的费用",
        now="2026-05-21T09:10:00+08:00",
    )
    submit_expense_action = submit_expense_plan["plan"]["actions"][0]
    assert submit_expense_action["actionType"] == "expense.submit_reimbursement"
    assert submit_expense_action["payload"]["target_id"] == expense["id"]
    assert submit_expense_action["payload"]["expected_status"] == "draft"
    confirm_response(client, submit_expense_plan)

    expenses_after_submit = {
        item["id"]: item
        for item in get_json(client, "/expenses", conversation_id=conversation_id)
    }
    assert expenses_after_submit[expense["id"]]["status"] == "submitted"

    cancel_expense_plan = submit_turn(
        client,
        conversation_id=conversation_id,
        text="把昨天 66 元打车票报销",
        now="2026-05-21T09:11:00+08:00",
    )
    cancel_expense_create_action = cancel_expense_plan["plan"]["actions"][0]
    assert cancel_expense_create_action["actionType"] == (
        "expense.create_reimbursement_draft"
    )
    assert cancel_expense_create_action["payload"]["amount"] == 66
    confirm_response(client, cancel_expense_plan)

    cancel_target_expense = latest(
        get_json(client, "/expenses", conversation_id=conversation_id),
        "management cancel expense",
    )
    assert cancel_target_expense["status"] == "draft"
    assert cancel_target_expense["amount"] == 66

    cancel_expense_management_plan = submit_turn(
        client,
        conversation_id=conversation_id,
        text="取消刚才的费用",
        now="2026-05-21T09:12:00+08:00",
    )
    cancel_expense_action = cancel_expense_management_plan["plan"]["actions"][0]
    assert cancel_expense_action["actionType"] == "expense.cancel_reimbursement"
    assert cancel_expense_action["payload"]["target_id"] == cancel_target_expense["id"]
    assert cancel_expense_action["payload"]["expected_status"] == "draft"
    confirm_response(client, cancel_expense_management_plan)

    expenses_after_cancel = {
        item["id"]: item
        for item in get_json(client, "/expenses", conversation_id=conversation_id)
    }
    assert expenses_after_cancel[cancel_target_expense["id"]]["status"] == "canceled"

    event_plan = submit_turn(
        client,
        conversation_id=conversation_id,
        text="明天下午三点开会",
    )
    event_action = event_plan["plan"]["actions"][0]
    assert event_action["actionType"] == "calendar.create_event"
    assert event_action["payload"]["start_at"] == "2026-05-22T15:00:00+08:00"
    confirm_response(client, event_plan)

    event = latest(
        get_json(client, "/calendar/events", conversation_id=conversation_id),
        "management calendar event",
    )
    assert event["status"] == "scheduled"
    assert event["startAt"] == "2026-05-22T15:00:00+08:00"

    update_event_plan = submit_turn(
        client,
        conversation_id=conversation_id,
        text="把明天的会议改到十点",
        now="2026-05-21T09:13:00+08:00",
    )
    update_event_action = update_event_plan["plan"]["actions"][0]
    assert update_event_action["actionType"] == "calendar.update_event"
    assert update_event_action["payload"]["target_id"] == event["id"]
    assert update_event_action["payload"]["expected_status"] == "scheduled"
    assert update_event_action["payload"]["patch"]["startAt"] == (
        "2026-05-22T10:00:00+08:00"
    )
    assert update_event_action["payload"]["patch"]["endAt"] == (
        "2026-05-22T11:00:00+08:00"
    )
    confirm_response(client, update_event_plan)

    events_after_update = {
        item["id"]: item
        for item in get_json(client, "/calendar/events", conversation_id=conversation_id)
    }
    assert events_after_update[event["id"]]["status"] == "scheduled"
    assert events_after_update[event["id"]]["startAt"] == "2026-05-22T10:00:00+08:00"

    cancel_event_create_plan = submit_turn(
        client,
        conversation_id=conversation_id,
        text="明天下午四点开会",
        now="2026-05-21T09:14:00+08:00",
    )
    cancel_event_create_action = cancel_event_create_plan["plan"]["actions"][0]
    assert cancel_event_create_action["actionType"] == "calendar.create_event"
    assert cancel_event_create_action["payload"]["start_at"] == (
        "2026-05-22T16:00:00+08:00"
    )
    confirm_response(client, cancel_event_create_plan)

    cancel_target_event = latest(
        get_json(client, "/calendar/events", conversation_id=conversation_id),
        "management cancel calendar event",
    )
    assert cancel_target_event["status"] == "scheduled"
    assert cancel_target_event["startAt"] == "2026-05-22T16:00:00+08:00"

    cancel_event_plan = submit_turn(
        client,
        conversation_id=conversation_id,
        text="取消刚才的会议",
        now="2026-05-21T09:15:00+08:00",
    )
    cancel_event_action = cancel_event_plan["plan"]["actions"][0]
    assert cancel_event_action["actionType"] == "calendar.cancel_event"
    assert cancel_event_action["payload"]["target_id"] == cancel_target_event["id"]
    assert cancel_event_action["payload"]["expected_status"] == "scheduled"
    confirm_response(client, cancel_event_plan)

    events_after_cancel = {
        item["id"]: item
        for item in get_json(client, "/calendar/events", conversation_id=conversation_id)
    }
    assert events_after_cancel[cancel_target_event["id"]]["status"] == "canceled"

    ledger = get_json(client, "/execution-ledger", conversation_id=conversation_id)
    event_types = [item["eventType"] for item in ledger]
    assert event_types.count("action_executed") >= 14


def validate_ambiguous_management_smoke(
    client: Client | TestClient,
    *,
    conversation_id: str,
) -> None:
    first_reminder_plan = submit_turn(
        client,
        conversation_id=conversation_id,
        text="明天上午九点提醒我带电脑",
    )
    confirm_response(client, first_reminder_plan)
    second_reminder_plan = submit_turn(
        client,
        conversation_id=conversation_id,
        text="明天上午十点提醒我带水杯",
    )
    confirm_response(client, second_reminder_plan)
    target_reminder = latest(
        get_json(client, "/reminders", conversation_id=conversation_id),
        "ambiguous management reminder",
    )

    reminder_update_ambiguity = submit_turn(
        client,
        conversation_id=conversation_id,
        text="把提醒改到明天上午十一点",
        now="2026-05-21T09:19:00+08:00",
    )
    assert reminder_update_ambiguity["kind"] == "clarification_request"
    assert reminder_update_ambiguity["missingFields"] == ["target_id"]
    assert "哪一个提醒" in str(reminder_update_ambiguity["question"])
    selected_reminder_plan = submit_turn(
        client,
        conversation_id=conversation_id,
        text=str(reminder_update_ambiguity["quickReplies"][-1]),
        now="2026-05-21T09:19:30+08:00",
    )
    selected_reminder_action = selected_reminder_plan["plan"]["actions"][0]
    assert selected_reminder_action["actionType"] == "reminder.update_reminder"
    assert selected_reminder_action["payload"]["target_id"] == target_reminder["id"]
    assert selected_reminder_action["payload"]["patch"]["dueAt"] == (
        "2026-05-22T11:00:00+08:00"
    )
    confirm_response(client, selected_reminder_plan)

    first_expense_plan = submit_turn(
        client,
        conversation_id=conversation_id,
        text="把昨天 58 元打车票报销",
    )
    confirm_response(client, first_expense_plan)
    second_expense_plan = submit_turn(
        client,
        conversation_id=conversation_id,
        text="把今天 88 元午餐报销",
    )
    confirm_response(client, second_expense_plan)
    target_expense = latest(
        get_json(client, "/expenses", conversation_id=conversation_id),
        "ambiguous management expense",
    )

    expense_update_ambiguity = submit_turn(
        client,
        conversation_id=conversation_id,
        text="把费用改成 99 元",
        now="2026-05-21T09:19:40+08:00",
    )
    assert expense_update_ambiguity["kind"] == "clarification_request"
    assert expense_update_ambiguity["missingFields"] == ["target_id"]
    assert "哪一笔费用" in str(expense_update_ambiguity["question"])
    selected_expense_update_plan = submit_turn(
        client,
        conversation_id=conversation_id,
        text=str(expense_update_ambiguity["quickReplies"][-1]),
        now="2026-05-21T09:19:50+08:00",
    )
    selected_expense_update_action = selected_expense_update_plan["plan"]["actions"][0]
    assert selected_expense_update_action["actionType"] == "expense.update_reimbursement"
    assert selected_expense_update_action["payload"]["target_id"] == target_expense["id"]
    assert selected_expense_update_action["payload"]["patch"]["amount"] == 99
    confirm_response(client, selected_expense_update_plan)

    expense_ambiguity = submit_turn(
        client,
        conversation_id=conversation_id,
        text="提交费用",
        now="2026-05-21T09:20:00+08:00",
    )
    assert expense_ambiguity["kind"] == "clarification_request"
    assert expense_ambiguity["missingFields"] == ["target_id"]
    assert "哪一笔费用" in str(expense_ambiguity["question"])
    pending_after_expense_ambiguity = client.get(
        f"/agent/conversations/{conversation_id}/pending-confirmations",
    )
    assert_status(pending_after_expense_ambiguity)
    assert (
        pending_after_expense_ambiguity.json()["plans"]
        == []
    )
    selected_expense_plan = submit_turn(
        client,
        conversation_id=conversation_id,
        text=str(expense_ambiguity["quickReplies"][-1]),
        now="2026-05-21T09:20:30+08:00",
    )
    selected_expense_action = selected_expense_plan["plan"]["actions"][0]
    assert selected_expense_action["actionType"] == "expense.submit_reimbursement"
    assert selected_expense_action["payload"]["target_id"] == target_expense["id"]
    assert selected_expense_action["payload"]["expected_status"] == "draft"
    confirm_response(client, selected_expense_plan)

    first_event_plan = submit_turn(
        client,
        conversation_id=conversation_id,
        text="明天下午三点开会",
    )
    confirm_response(client, first_event_plan)
    second_event_plan = submit_turn(
        client,
        conversation_id=conversation_id,
        text="明天下午五点开会",
    )
    confirm_response(client, second_event_plan)
    target_event = latest(
        get_json(client, "/calendar/events", conversation_id=conversation_id),
        "ambiguous management calendar event",
    )

    calendar_update_ambiguity = submit_turn(
        client,
        conversation_id=conversation_id,
        text="把明天的会议改到十点",
        now="2026-05-21T09:20:40+08:00",
    )
    assert calendar_update_ambiguity["kind"] == "clarification_request"
    assert calendar_update_ambiguity["missingFields"] == ["target_id"]
    assert "哪一个日程" in str(calendar_update_ambiguity["question"])
    selected_calendar_update_plan = submit_turn(
        client,
        conversation_id=conversation_id,
        text=str(calendar_update_ambiguity["quickReplies"][-1]),
        now="2026-05-21T09:20:50+08:00",
    )
    selected_calendar_update_action = selected_calendar_update_plan["plan"]["actions"][0]
    assert selected_calendar_update_action["actionType"] == "calendar.update_event"
    assert selected_calendar_update_action["payload"]["target_id"] == target_event["id"]
    assert selected_calendar_update_action["payload"]["patch"]["startAt"] == (
        "2026-05-22T10:00:00+08:00"
    )
    assert selected_calendar_update_action["payload"]["patch"]["endAt"] == (
        "2026-05-22T11:00:00+08:00"
    )
    confirm_response(client, selected_calendar_update_plan)

    calendar_ambiguity = submit_turn(
        client,
        conversation_id=conversation_id,
        text="取消明天的会议",
        now="2026-05-21T09:21:00+08:00",
    )
    assert calendar_ambiguity["kind"] == "clarification_request"
    assert calendar_ambiguity["missingFields"] == ["target_id"]
    assert "哪一个日程" in str(calendar_ambiguity["question"])
    pending_after_calendar_ambiguity = client.get(
        f"/agent/conversations/{conversation_id}/pending-confirmations",
    )
    assert_status(pending_after_calendar_ambiguity)
    assert (
        pending_after_calendar_ambiguity.json()["plans"]
        == []
    )
    selected_calendar_target_id = calendar_ambiguity["quickReplyOptions"][-1]["value"]
    selected_calendar_plan = submit_turn(
        client,
        conversation_id=conversation_id,
        text=str(calendar_ambiguity["quickReplies"][-1]),
        now="2026-05-21T09:21:30+08:00",
    )
    selected_calendar_action = selected_calendar_plan["plan"]["actions"][0]
    assert selected_calendar_action["actionType"] == "calendar.cancel_event"
    assert selected_calendar_action["payload"]["target_id"] == selected_calendar_target_id
    assert selected_calendar_action["payload"]["expected_status"] == "scheduled"
    confirm_response(client, selected_calendar_plan)


def validate_displayed_target_selection_smoke(
    client: Client | TestClient,
    *,
    conversation_id: str,
) -> None:
    for text in (
        "明天上午九点提醒我带电脑",
        "明天上午十点提醒我带水杯",
        "明天上午十一点提醒我带雨伞",
        "明天下午三点提醒我带文件",
    ):
        reminder_plan = submit_turn(
            client,
            conversation_id=conversation_id,
            text=text,
        )
        confirm_response(client, reminder_plan)

    reminders = get_json(client, "/reminders", conversation_id=conversation_id)
    displayed_first_target = reminders[-3]

    ambiguity = submit_turn(
        client,
        conversation_id=conversation_id,
        text="完成提醒",
        now="2026-05-21T09:22:00+08:00",
    )
    assert ambiguity["kind"] == "clarification_request"
    assert len(ambiguity["quickReplies"]) == 3
    assert displayed_first_target["title"] in str(ambiguity["quickReplies"][0])

    selected_plan = submit_turn(
        client,
        conversation_id=conversation_id,
        text=str(ambiguity["quickReplies"][0]),
        now="2026-05-21T09:22:30+08:00",
    )
    selected_action = selected_plan["plan"]["actions"][0]
    assert selected_action["actionType"] == "reminder.complete_reminder"
    assert selected_action["payload"]["target_id"] == displayed_first_target["id"]
    assert selected_action["payload"]["expected_status"] == "scheduled"
    confirm_response(client, selected_plan)

    reminders_after_complete = {
        item["id"]: item
        for item in get_json(client, "/reminders", conversation_id=conversation_id)
    }
    assert reminders_after_complete[displayed_first_target["id"]]["status"] == "done"

    duplicate_conversation_id = f"{conversation_id}_duplicate_labels"
    for text in (
        "明天上午九点提醒我带电脑",
        "明天上午九点提醒我带电脑",
    ):
        reminder_plan = submit_turn(
            client,
            conversation_id=duplicate_conversation_id,
            text=text,
        )
        confirm_response(client, reminder_plan)

    duplicate_reminders = get_json(
        client,
        "/reminders",
        conversation_id=duplicate_conversation_id,
    )
    duplicate_target = duplicate_reminders[-1]
    duplicate_ambiguity = submit_turn(
        client,
        conversation_id=duplicate_conversation_id,
        text="完成提醒",
        now="2026-05-21T09:23:00+08:00",
    )
    assert duplicate_ambiguity["kind"] == "clarification_request"
    assert duplicate_ambiguity["quickReplies"][0] == (
        duplicate_ambiguity["quickReplies"][1]
    )
    quick_reply_options = duplicate_ambiguity["quickReplyOptions"]
    assert quick_reply_options[1]["value"] == duplicate_target["id"]

    duplicate_selected_plan = submit_turn(
        client,
        conversation_id=duplicate_conversation_id,
        display_input=str(quick_reply_options[1]["label"]),
        text=str(quick_reply_options[1]["value"]),
        now="2026-05-21T09:23:30+08:00",
    )
    duplicate_selected_action = duplicate_selected_plan["plan"]["actions"][0]
    assert duplicate_selected_action["actionType"] == "reminder.complete_reminder"
    assert duplicate_selected_action["payload"]["target_id"] == duplicate_target["id"]
    duplicate_turns_response = client.get(
        f"/agent/conversations/{duplicate_conversation_id}/turns",
    )
    assert_status(duplicate_turns_response)
    duplicate_turns = duplicate_turns_response.json()
    duplicate_user_turns = [
        turn for turn in duplicate_turns["turns"] if turn["role"] == "user"
    ]
    duplicate_selection_turn = duplicate_user_turns[-1]
    assert duplicate_selection_turn["inputText"] == quick_reply_options[1]["label"]
    assert (
        duplicate_selection_turn["rawContent"]["submittedInput"]
        == quick_reply_options[1]["value"]
    )
    confirm_response(client, duplicate_selected_plan)


def run_product_smoke(client: Client | TestClient, *, live: bool) -> None:
    conversation_prefix = (
        "conversation_product_live_smoke" if live else "conversation_product_smoke"
    )
    conversation_id = f"{conversation_prefix}_{uuid4().hex}"

    health = client.get("/health")
    assert_status(health)
    assert health.json()["status"] == "ok"

    clarification = submit_turn(
        client,
        conversation_id=conversation_id,
        text="明天上午我要去开会",
    )
    assert clarification["kind"] == "clarification_request"
    assert "几点" in str(clarification["question"])

    calendar_plan = submit_turn(
        client,
        conversation_id=conversation_id,
        text="十点",
        now="2026-05-21T09:01:00+08:00",
    )
    calendar_action = calendar_plan["plan"]["actions"][0]
    assert calendar_action["actionType"] == "calendar.create_event"
    assert calendar_action["payload"]["start_at"] == "2026-05-22T10:00:00+08:00"
    confirm_response(client, calendar_plan)

    event = latest(
        get_json(client, "/calendar/events", conversation_id=conversation_id),
        "calendar event",
    )
    assert event["title"] == "开会"
    assert event["startAt"] == "2026-05-22T10:00:00+08:00"

    updated_event_response = client.patch(
        f"/calendar/events/{event['id']}",
        params={"conversationId": conversation_id},
        json={
            "endAt": "2026-05-22T11:30:00+08:00",
            "startAt": "2026-05-22T10:30:00+08:00",
            "timezone": "Asia/Shanghai",
            "title": "产品评审会",
        },
    )
    assert_status(updated_event_response)
    updated_event = updated_event_response.json()
    assert updated_event["title"] == "产品评审会"
    assert updated_event["startAt"] == "2026-05-22T10:30:00+08:00"

    expense_plan = submit_turn(
        client,
        conversation_id=conversation_id,
        text="把昨天 58 元打车票报销",
    )
    expense_action = expense_plan["plan"]["actions"][0]
    assert expense_action["actionType"] == "expense.create_reimbursement_draft"
    assert expense_action["payload"]["amount"] == 58
    confirm_response(client, expense_plan)

    expense = latest(
        get_json(client, "/expenses", conversation_id=conversation_id),
        "expense",
    )
    assert expense["status"] == "draft"
    submit_expense = client.post(
        f"/expenses/{expense['id']}/submit",
        params={"conversationId": conversation_id},
    )
    assert_status(submit_expense)
    assert submit_expense.json()["status"] == "submitted"

    reminder_plan = submit_turn(
        client,
        conversation_id=conversation_id,
        text="明天上午九点提醒我带电脑",
    )
    reminder_action = reminder_plan["plan"]["actions"][0]
    assert reminder_action["actionType"] == "reminder.create_reminder"
    assert reminder_action["payload"]["due_at"] == "2026-05-22T09:00:00+08:00"
    confirm_response(client, reminder_plan)

    reminder = latest(
        get_json(client, "/reminders", conversation_id=conversation_id),
        "reminder",
    )
    assert reminder["status"] == "scheduled"
    complete_reminder = client.post(
        f"/reminders/{reminder['id']}/complete",
        params={"conversationId": conversation_id},
    )
    assert_status(complete_reminder)
    assert complete_reminder.json()["status"] == "done"

    query_response = submit_turn(
        client,
        conversation_id=conversation_id,
        text="明天我有什么安排？",
    )
    assert query_response["kind"] == "assistant_message"
    structured_elements = query_response.get("structuredElements")
    assert isinstance(structured_elements, list)
    assert any(
        "产品评审会" in str(item)
        for element in structured_elements
        for item in element.get("items", [])
    )

    ledger = get_json(client, "/execution-ledger", conversation_id=conversation_id)
    event_types = [item["eventType"] for item in ledger]
    assert event_types.count("action_executed") >= 3
    assert event_types.count("direct_action_executed") >= 3

    debug_response = client.get(f"/agent/conversations/{conversation_id}/debug")
    assert_status(debug_response)
    debug = debug_response.json()
    assert debug["conversationId"] == conversation_id
    assert len(debug["decisionTraces"]) >= 4

    pending_response = client.get(
        f"/agent/conversations/{conversation_id}/pending-confirmations",
    )
    assert_status(pending_response)
    assert pending_response.json()["plans"] == []

    validate_conversation_history_recovery_smoke(
        client,
        conversation_id=conversation_id,
    )
    validate_natural_language_management_smoke(
        client,
        conversation_id=f"{conversation_id}_management",
    )
    validate_ambiguous_management_smoke(
        client,
        conversation_id=f"{conversation_id}_ambiguity",
    )
    validate_displayed_target_selection_smoke(
        client,
        conversation_id=f"{conversation_id}_displayed_target_selection",
    )

    validate_attachment_smoke(
        client,
        conversation_id=f"{conversation_id}_attachments",
    )
    validate_pending_confirmation_recovery_smoke(
        client,
        conversation_id=f"{conversation_id}_pending_recovery",
    )

    print("Live product smoke validation passed." if live else "Product smoke validation passed.")


def main(argv: Sequence[str] | None = None) -> None:
    parser = ArgumentParser(description="Validate the AI time agent product smoke path.")
    parser.add_argument(
        "--live",
        action="store_true",
        help=(
            "Run against an already running API service. "
            "Set AI_CODE_API_BASE_URL to override the default http://127.0.0.1:8000."
        ),
    )
    parser.add_argument(
        "--postgres",
        action="store_true",
        help=(
            "Run in-process smoke against local Postgres after applying migrations. "
            "Defaults to DATABASE_URL or local ai_code."
        ),
    )
    args = parser.parse_args(argv)

    try:
        if args.live and args.postgres:
            raise RuntimeError("`--live` 和 `--postgres` 不能同时使用。")
        if args.postgres:
            database_url = os.environ.get("DATABASE_URL", LOCAL_POSTGRES_DATABASE_URL)
            configure_postgres_smoke_environment(database_url)
            assert_postgres_available(database_url)
            run_postgres_migrations(database_url)
        elif not args.live:
            configure_in_memory_smoke_environment()

        with build_smoke_client(live=args.live) as client:
            run_product_smoke(client, live=args.live)
    except (ConnectError, ConnectTimeout, NetworkError, TimeoutException) as exc:
        if not args.live:
            raise
        base_url = os.environ.get("AI_CODE_API_BASE_URL", SMOKE_API_BASE_URL)
        print(
            (
                "无法连接运行中的后端 API。\n"
                f"- 当前 base URL: {base_url}\n"
                "- 请先启动 `pnpm dev:api` 或 `pnpm dev:full`。\n"
                "- 如果后端运行在其他地址，请设置 "
                "`AI_CODE_API_BASE_URL=http://<host>:<port>` 后重试。\n"
                f"- 原始错误: {exc}"
            ),
            file=sys.stderr,
        )
        raise SystemExit(1) from exc
    except RuntimeError as exc:
        print(str(exc), file=sys.stderr)
        raise SystemExit(1) from exc


if __name__ == "__main__":
    main()
