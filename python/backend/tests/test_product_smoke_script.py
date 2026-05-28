from __future__ import annotations

import importlib.util
import sys
from collections.abc import Iterator
from contextlib import contextmanager
from pathlib import Path
from types import ModuleType

import httpx
import pytest
from httpx import Response

ROOT_DIR = Path(__file__).resolve().parents[3]
SCRIPT_PATH = ROOT_DIR / "scripts" / "validate_product_smoke.py"

spec = importlib.util.spec_from_file_location("validate_product_smoke", SCRIPT_PATH)
assert spec is not None
assert spec.loader is not None
validate_product_smoke = importlib.util.module_from_spec(spec)
assert isinstance(validate_product_smoke, ModuleType)
sys.modules[spec.name] = validate_product_smoke
spec.loader.exec_module(validate_product_smoke)


def test_live_mode_uses_configured_api_base_url(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("AI_CODE_API_BASE_URL", "http://127.0.0.1:8010")

    with validate_product_smoke.build_smoke_client(live=True) as client:
        assert isinstance(client, httpx.Client)
        assert str(client.base_url) == "http://127.0.0.1:8010"


def test_cli_live_mode_runs_against_live_client(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    calls: list[tuple[object, bool]] = []

    class FakeClient:
        def __enter__(self) -> FakeClient:
            return self

        def __exit__(self, *args: object) -> None:
            return None

    @contextmanager
    def fake_build_smoke_client(*, live: bool) -> Iterator[FakeClient]:
        assert live is True
        yield FakeClient()

    def fake_run_product_smoke(client: object, *, live: bool) -> None:
        calls.append((client, live))

    monkeypatch.setattr(
        validate_product_smoke,
        "build_smoke_client",
        fake_build_smoke_client,
    )
    monkeypatch.setattr(
        validate_product_smoke,
        "run_product_smoke",
        fake_run_product_smoke,
    )

    validate_product_smoke.main(["--live"])

    assert len(calls) == 1
    assert calls[0][1] is True


def test_cli_default_mode_forces_in_memory_runtime(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    calls: list[tuple[object, bool]] = []

    class FakeClient:
        pass

    @contextmanager
    def fake_build_smoke_client(*, live: bool) -> Iterator[FakeClient]:
        assert live is False
        assert validate_product_smoke.os.environ["AI_CODE_LOAD_ENV_LOCAL"] == "0"
        assert validate_product_smoke.os.environ["AI_PLANNER_MODE"] == "rule"
        assert validate_product_smoke.os.environ["DATABASE_URL"] == ""
        yield FakeClient()

    def fake_run_product_smoke(client: object, *, live: bool) -> None:
        calls.append((client, live))

    monkeypatch.setenv(
        "DATABASE_URL",
        "postgresql://ai_code:wrong-password@127.0.0.1:5432/ai_code",
    )
    monkeypatch.setattr(
        validate_product_smoke,
        "build_smoke_client",
        fake_build_smoke_client,
    )
    monkeypatch.setattr(
        validate_product_smoke,
        "run_product_smoke",
        fake_run_product_smoke,
    )

    validate_product_smoke.main([])

    assert len(calls) == 1
    assert calls[0][1] is False


def test_cli_postgres_mode_migrates_database_before_smoke(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    calls: list[tuple[str, object]] = []

    class FakeClient:
        pass

    @contextmanager
    def fake_build_smoke_client(*, live: bool) -> Iterator[FakeClient]:
        assert live is False
        assert validate_product_smoke.os.environ["AI_CODE_LOAD_ENV_LOCAL"] == "0"
        assert validate_product_smoke.os.environ["AI_PLANNER_MODE"] == "rule"
        assert (
            validate_product_smoke.os.environ["DATABASE_URL"]
            == "postgresql://ai_code:ai_code@127.0.0.1:5432/ai_code"
        )
        yield FakeClient()

    def fake_assert_postgres_available(database_url: str) -> None:
        calls.append(("check", database_url))

    def fake_run_postgres_migrations(database_url: str) -> None:
        calls.append(("migrate", database_url))

    def fake_run_product_smoke(client: object, *, live: bool) -> None:
        calls.append(("smoke", live))

    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.setattr(
        validate_product_smoke,
        "assert_postgres_available",
        fake_assert_postgres_available,
    )
    monkeypatch.setattr(
        validate_product_smoke,
        "run_postgres_migrations",
        fake_run_postgres_migrations,
    )
    monkeypatch.setattr(
        validate_product_smoke,
        "build_smoke_client",
        fake_build_smoke_client,
    )
    monkeypatch.setattr(
        validate_product_smoke,
        "run_product_smoke",
        fake_run_product_smoke,
    )

    validate_product_smoke.main(["--postgres"])

    assert calls == [
        ("check", "postgresql://ai_code:ai_code@127.0.0.1:5432/ai_code"),
        ("migrate", "postgresql://ai_code:ai_code@127.0.0.1:5432/ai_code"),
        ("smoke", False),
    ]


def test_cli_live_mode_reports_clear_error_when_api_is_unreachable(
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    class FakeClient:
        def get(self, path: str) -> Response:
            raise httpx.ConnectError("connection refused")

    @contextmanager
    def fake_build_smoke_client(*, live: bool) -> Iterator[FakeClient]:
        assert live is True
        yield FakeClient()

    monkeypatch.setenv("AI_CODE_API_BASE_URL", "http://127.0.0.1:65535")
    monkeypatch.setattr(
        validate_product_smoke,
        "build_smoke_client",
        fake_build_smoke_client,
    )

    with pytest.raises(SystemExit) as exc_info:
        validate_product_smoke.main(["--live"])

    assert exc_info.value.code == 1
    error_output = capsys.readouterr().err
    assert "无法连接运行中的后端 API" in error_output
    assert "http://127.0.0.1:65535" in error_output
    assert "pnpm dev:api" in error_output
    assert "pnpm dev:full" in error_output


def test_attachment_smoke_covers_upload_intake_and_list() -> None:
    calls: list[tuple[str, str, object]] = []

    class FakeClient:
        def post(self, path: str, *, json: dict[str, object]) -> Response:
            calls.append(("POST", path, json))
            if path == "/attachments/upload":
                return Response(
                    200,
                    json={
                        "attachmentId": json["attachmentId"],
                        "contentSha256": "sample_sha256",
                        "contentStatus": "content_received",
                        "conversationId": json["conversationId"],
                        "createdAt": "2026-05-21T09:00:00+08:00",
                        "id": "attachment_upload_001",
                        "kind": json["attachmentKind"],
                        "name": json["attachmentName"],
                        "sizeBytes": 21,
                        "source": json["source"],
                        "status": "received",
                        "text": "出租金额 88.5 元",
                        "type": json["attachmentType"],
                    },
                )
            if path == "/attachments/intake":
                return Response(
                    200,
                    json={
                        "attachmentId": json["attachmentId"],
                        "conversationId": json["conversationId"],
                        "createdAt": "2026-05-21T09:00:00+08:00",
                        "id": "attachment_intake_001",
                        "kind": json["attachmentKind"],
                        "name": json["attachmentName"],
                        "sizeBytes": json["attachmentSizeBytes"],
                        "source": json["source"],
                        "status": "received",
                        "text": json["text"],
                        "type": json["attachmentType"],
                    },
                )
            raise AssertionError(f"unexpected POST {path}")

        def get(
            self,
            path: str,
            *,
            params: dict[str, object],
        ) -> Response:
            calls.append(("GET", path, params))
            assert path == "/attachments"
            assert params["conversationId"] == "conversation_product_smoke_attachment"
            return Response(
                200,
                json=[
                    {
                        "attachmentId": "native_attachment_smoke_upload",
                        "contentSha256": "sample_sha256",
                        "contentStatus": "content_received",
                        "conversationId": params["conversationId"],
                        "createdAt": "2026-05-21T09:00:00+08:00",
                        "id": "attachment_upload_001",
                        "kind": "file",
                        "name": "receipt.txt",
                        "sizeBytes": 21,
                        "source": "h5.product-smoke.attachment.upload",
                        "status": "received",
                        "text": "出租金额 88.5 元",
                        "type": "text/plain",
                    },
                    {
                        "attachmentId": "native_attachment_smoke_intake",
                        "conversationId": params["conversationId"],
                        "createdAt": "2026-05-21T09:00:00+08:00",
                        "id": "attachment_intake_001",
                        "kind": "image",
                        "name": "receipt.jpg",
                        "sizeBytes": 245678,
                        "source": "native.product-smoke.attachment.photo",
                        "status": "received",
                        "text": "已选择附件：receipt.jpg（image，245678 bytes）。",
                        "type": "public.jpeg",
                    },
                ],
            )

    validate_product_smoke.validate_attachment_smoke(
        FakeClient(),
        conversation_id="conversation_product_smoke_attachment",
    )

    assert ("POST", "/attachments/upload") == calls[0][:2]
    assert ("POST", "/attachments/intake") == calls[1][:2]
    assert ("GET", "/attachments") == calls[2][:2]


def test_find_required_item_matches_field_without_order_dependency() -> None:
    found = validate_product_smoke.find_required_item(
        [
            {"id": "reminder_old", "title": "带水杯"},
            {"id": "reminder_new", "title": "带雨伞"},
        ],
        "reminder",
        title="带雨伞",
    )

    assert found["id"] == "reminder_new"


def test_pending_confirmation_recovery_smoke_confirms_with_recovered_token() -> None:
    calls: list[tuple[str, str, object]] = []

    class FakeClient:
        def __init__(self) -> None:
            self.confirmed = False

        def post(
            self,
            path: str,
            *,
            json: dict[str, object],
        ) -> Response:
            calls.append(("POST", path, json))
            if path == "/agent/turns":
                return Response(
                    200,
                    json={
                        "kind": "confirmation_required",
                        "message": "确认后我会为你创建提醒。",
                        "plan": {
                            "id": "plan_recovery_001",
                            "conversationId": json["conversationId"],
                            "status": "awaiting_confirmation",
                            "riskLevel": "low",
                            "summary": "明天上午九点提醒我带雨伞",
                            "decisionTraceId": "trace_recovery_001",
                            "actions": [
                                {
                                    "id": "action_recovery_001",
                                    "planId": "plan_recovery_001",
                                    "domain": "reminder",
                                    "actionType": "reminder.create_reminder",
                                    "status": "pending",
                                    "riskLevel": "low",
                                    "summary": "提醒我带雨伞",
                                    "payload": {
                                        "title": "带雨伞",
                                        "due_at": "2026-05-22T09:00:00+08:00",
                                        "timezone": "Asia/Shanghai",
                                    },
                                },
                            ],
                            "confirmation": {
                                "id": "confirmation_recovery_001",
                                "planId": "plan_recovery_001",
                                "status": "pending",
                                "requiredActionIds": ["action_recovery_001"],
                                "title": "确认提醒",
                                "description": "明天上午九点提醒我带雨伞",
                                "confirmToken": "confirm_original_token",
                            },
                        },
                    },
                )
            if path == "/execution-plans/plan_recovery_001/confirm":
                assert json["confirmToken"] == "confirm_recovered_token"
                self.confirmed = True
                return Response(
                    200,
                    json={
                        "kind": "execution_result",
                        "plan": {
                            "id": "plan_recovery_001",
                            "confirmation": {
                                "id": "confirmation_recovery_001",
                                "planId": "plan_recovery_001",
                                "status": "confirmed",
                                "requiredActionIds": ["action_recovery_001"],
                                "title": "确认提醒",
                                "description": "明天上午九点提醒我带雨伞",
                                "confirmToken": "redacted",
                            },
                            "actions": [
                                {
                                    "id": "action_recovery_001",
                                    "planId": "plan_recovery_001",
                                    "domain": "reminder",
                                    "actionType": "reminder.create_reminder",
                                    "status": "succeeded",
                                    "riskLevel": "low",
                                    "summary": "提醒我带雨伞",
                                    "payload": {
                                        "title": "带雨伞",
                                        "due_at": "2026-05-22T09:00:00+08:00",
                                        "timezone": "Asia/Shanghai",
                                    },
                                    "result": {"reminderId": "reminder_recovery_001"},
                                },
                            ],
                            "status": "succeeded",
                        },
                    },
                )
            raise AssertionError(f"unexpected POST {path}")

        def get(self, path: str) -> Response:
            calls.append(("GET", path, None))
            assert path == (
                "/agent/conversations/"
                "conversation_product_smoke_pending_recovery/pending-confirmations"
            )
            if self.confirmed:
                return Response(
                    200,
                    json={
                        "conversationId": "conversation_product_smoke_pending_recovery",
                        "plans": [],
                    },
                )
            return Response(
                200,
                json={
                    "conversationId": "conversation_product_smoke_pending_recovery",
                    "plans": [
                        {
                            "id": "plan_recovery_001",
                            "conversationId": "conversation_product_smoke_pending_recovery",
                            "status": "awaiting_confirmation",
                            "riskLevel": "low",
                            "summary": "明天上午九点提醒我带雨伞",
                            "decisionTraceId": "trace_recovery_001",
                            "actions": [],
                            "confirmation": {
                                "id": "confirmation_recovery_001",
                                "planId": "plan_recovery_001",
                                "status": "pending",
                                "requiredActionIds": ["action_recovery_001"],
                                "title": "确认提醒",
                                "description": "明天上午九点提醒我带雨伞",
                                "confirmToken": "confirm_recovered_token",
                            },
                        },
                    ],
                },
            )

    validate_product_smoke.validate_pending_confirmation_recovery_smoke(
        FakeClient(),
        conversation_id="conversation_product_smoke_pending_recovery",
    )

    assert ("POST", "/agent/turns") == calls[0][:2]
    assert (
        "GET",
        "/agent/conversations/"
        "conversation_product_smoke_pending_recovery/pending-confirmations",
    ) == calls[1][:2]
    assert ("POST", "/execution-plans/plan_recovery_001/confirm") == calls[2][:2]
    assert (
        "GET",
        "/agent/conversations/"
        "conversation_product_smoke_pending_recovery/pending-confirmations",
    ) == calls[3][:2]


def test_conversation_history_recovery_smoke_requires_redacted_tokens() -> None:
    calls: list[tuple[str, str, object]] = []

    class FakeClient:
        def get(
            self,
            path: str,
            *,
            params: dict[str, object],
        ) -> Response:
            calls.append(("GET", path, params))
            assert path == (
                "/agent/conversations/"
                "conversation_product_smoke_history/turns"
            )
            assert params["limit"] == 50
            return Response(
                200,
                json={
                    "conversationId": "conversation_product_smoke_history",
                    "turns": [
                        {
                            "id": "turn_user_001",
                            "role": "user",
                            "summary": "明天上午我要去开会",
                            "inputText": "明天上午我要去开会",
                            "rawContent": {
                                "clientContext": {
                                    "now": "2026-05-21T09:00:00+08:00",
                                },
                            },
                            "createdAt": "2026-05-21T09:00:00+08:00",
                        },
                        {
                            "id": "turn_assistant_001",
                            "role": "assistant",
                            "summary": "明天上午几点？",
                            "structuredResponse": {
                                "kind": "clarification_request",
                                "question": "明天上午几点？",
                            },
                            "createdAt": "2026-05-21T09:00:01+08:00",
                        },
                        {
                            "id": "turn_user_002",
                            "role": "user",
                            "summary": "十点",
                            "inputText": "十点",
                            "createdAt": "2026-05-21T09:01:00+08:00",
                        },
                        {
                            "id": "turn_assistant_002",
                            "role": "assistant",
                            "summary": "确认创建日程",
                            "structuredResponse": {
                                "kind": "confirmation_required",
                                "plan": {
                                    "id": "plan_history_001",
                                    "confirmation": {
                                        "confirmToken": "redacted",
                                    },
                                },
                            },
                            "createdAt": "2026-05-21T09:01:01+08:00",
                        },
                        {
                            "id": "turn_user_003",
                            "role": "user",
                            "summary": "明天我有什么安排？",
                            "inputText": "明天我有什么安排？",
                            "createdAt": "2026-05-21T09:02:00+08:00",
                        },
                        {
                            "id": "turn_assistant_003",
                            "role": "assistant",
                            "summary": "明天有产品评审会。",
                            "structuredResponse": {
                                "kind": "assistant_message",
                                "message": "明天有产品评审会。",
                            },
                            "createdAt": "2026-05-21T09:02:00+08:00",
                        },
                    ],
                },
            )

    validate_product_smoke.validate_conversation_history_recovery_smoke(
        FakeClient(),
        conversation_id="conversation_product_smoke_history",
    )

    assert (
        "GET",
        "/agent/conversations/conversation_product_smoke_history/turns",
    ) == calls[0][:2]


def test_natural_language_management_smoke_covers_three_domains() -> None:
    calls: list[tuple[str, str, object]] = []
    agent_inputs: list[str] = []

    class FakeClient:
        def __init__(self) -> None:
            self.events: list[dict[str, object]] = []
            self.expenses: list[dict[str, object]] = []
            self.reminders: list[dict[str, object]] = []

        def post(
            self,
            path: str,
            *,
            json: dict[str, object] | None = None,
        ) -> Response:
            calls.append(("POST", path, json))
            if path == "/agent/turns":
                assert json is not None
                text = json["input"]
                assert isinstance(text, str)
                agent_inputs.append(text)
                if text == "明天上午九点提醒我带水杯":
                    return self._plan_response(
                        plan_id="plan_create_reminder",
                        action_type="reminder.create_reminder",
                        payload={
                            "title": "带水杯",
                            "due_at": "2026-05-22T09:00:00+08:00",
                            "timezone": "Asia/Shanghai",
                        },
                    )
                if text == "把刚才的提醒改到明天上午十点":
                    reminder = self._latest_reminder("scheduled")
                    return self._plan_response(
                        plan_id="plan_update_reminder",
                        action_type="reminder.update_reminder",
                        payload={
                            "target_id": reminder["id"],
                            "target_kind": "reminder",
                            "expected_status": "scheduled",
                            "patch": {"dueAt": "2026-05-22T10:00:00+08:00"},
                            "resolution_reason": "matched_recent_conversation_reminder",
                        },
                    )
                if text == "完成刚才的提醒":
                    reminder = self._latest_reminder("scheduled")
                    return self._plan_response(
                        plan_id="plan_complete_reminder",
                        action_type="reminder.complete_reminder",
                        payload={
                            "target_id": reminder["id"],
                            "target_kind": "reminder",
                            "expected_status": "scheduled",
                            "resolution_reason": "matched_recent_conversation_reminder",
                        },
                    )
                if text == "明天上午九点提醒我带雨伞":
                    return self._plan_response(
                        plan_id="plan_create_cancel_reminder",
                        action_type="reminder.create_reminder",
                        payload={
                            "title": "带雨伞",
                            "due_at": "2026-05-22T09:00:00+08:00",
                            "timezone": "Asia/Shanghai",
                        },
                    )
                if text == "取消刚才的提醒":
                    reminder = self._latest_reminder("scheduled")
                    return self._plan_response(
                        plan_id="plan_cancel_reminder",
                        action_type="reminder.cancel_reminder",
                        payload={
                            "target_id": reminder["id"],
                            "target_kind": "reminder",
                            "expected_status": "scheduled",
                            "resolution_reason": "matched_recent_conversation_reminder",
                        },
                    )
                if text == "把昨天 58 元打车票报销":
                    return self._plan_response(
                        plan_id="plan_create_expense",
                        action_type="expense.create_reimbursement_draft",
                        payload={
                            "title": "打车票报销",
                            "amount": 58,
                            "currency": "CNY",
                            "occurred_on": "2026-05-20",
                        },
                    )
                if text == "把刚才的费用改成 88 元":
                    expense = self._latest_expense("draft")
                    return self._plan_response(
                        plan_id="plan_update_expense",
                        action_type="expense.update_reimbursement",
                        payload={
                            "target_id": expense["id"],
                            "target_kind": "expense",
                            "expected_status": "draft",
                            "patch": {"amount": 88},
                            "resolution_reason": "matched_recent_conversation_expense",
                        },
                    )
                if text == "提交刚才的费用":
                    expense = self._latest_expense("draft")
                    return self._plan_response(
                        plan_id="plan_submit_expense",
                        action_type="expense.submit_reimbursement",
                        payload={
                            "target_id": expense["id"],
                            "target_kind": "expense",
                            "expected_status": "draft",
                            "resolution_reason": "matched_recent_conversation_expense",
                        },
                    )
                if text == "把昨天 66 元打车票报销":
                    return self._plan_response(
                        plan_id="plan_create_cancel_expense",
                        action_type="expense.create_reimbursement_draft",
                        payload={
                            "title": "打车票报销",
                            "amount": 66,
                            "currency": "CNY",
                            "occurred_on": "2026-05-20",
                        },
                    )
                if text == "取消刚才的费用":
                    expense = self._latest_expense("draft")
                    return self._plan_response(
                        plan_id="plan_cancel_expense",
                        action_type="expense.cancel_reimbursement",
                        payload={
                            "target_id": expense["id"],
                            "target_kind": "expense",
                            "expected_status": "draft",
                            "resolution_reason": "matched_recent_conversation_expense",
                        },
                    )
                if text == "明天下午三点开会":
                    return self._plan_response(
                        plan_id="plan_create_event",
                        action_type="calendar.create_event",
                        payload={
                            "title": "开会",
                            "start_at": "2026-05-22T15:00:00+08:00",
                            "end_at": "2026-05-22T16:00:00+08:00",
                            "timezone": "Asia/Shanghai",
                        },
                    )
                if text == "把明天的会议改到十点":
                    event = self._latest_event("scheduled")
                    return self._plan_response(
                        plan_id="plan_update_event",
                        action_type="calendar.update_event",
                        payload={
                            "target_id": event["id"],
                            "target_kind": "calendar_event",
                            "expected_status": "scheduled",
                            "patch": {
                                "startAt": "2026-05-22T10:00:00+08:00",
                                "endAt": "2026-05-22T11:00:00+08:00",
                            },
                            "resolution_reason": "matched_conversation_calendar_event",
                        },
                    )
                if text == "明天下午四点开会":
                    return self._plan_response(
                        plan_id="plan_create_cancel_event",
                        action_type="calendar.create_event",
                        payload={
                            "title": "开会",
                            "start_at": "2026-05-22T16:00:00+08:00",
                            "end_at": "2026-05-22T17:00:00+08:00",
                            "timezone": "Asia/Shanghai",
                        },
                    )
                if text == "取消刚才的会议":
                    event = self._latest_event("scheduled")
                    return self._plan_response(
                        plan_id="plan_cancel_event",
                        action_type="calendar.cancel_event",
                        payload={
                            "target_id": event["id"],
                            "target_kind": "calendar_event",
                            "expected_status": "scheduled",
                            "resolution_reason": "matched_conversation_calendar_event",
                        },
                    )
                raise AssertionError(f"unexpected input {text}")

            if path == "/execution-plans/plan_create_reminder/confirm":
                self.reminders.append({
                    "id": "reminder_management_001",
                    "status": "scheduled",
                    "title": "带水杯",
                    "dueAt": "2026-05-22T09:00:00+08:00",
                })
                return self._execution_result("plan_create_reminder")
            if path == "/execution-plans/plan_update_reminder/confirm":
                self._latest_reminder("scheduled")["dueAt"] = (
                    "2026-05-22T10:00:00+08:00"
                )
                return self._execution_result("plan_update_reminder")
            if path == "/execution-plans/plan_complete_reminder/confirm":
                self._latest_reminder("scheduled")["status"] = "done"
                return self._execution_result("plan_complete_reminder")
            if path == "/execution-plans/plan_create_cancel_reminder/confirm":
                self.reminders.append({
                    "id": "reminder_management_002",
                    "status": "scheduled",
                    "title": "带雨伞",
                    "dueAt": "2026-05-22T09:00:00+08:00",
                })
                return self._execution_result("plan_create_cancel_reminder")
            if path == "/execution-plans/plan_cancel_reminder/confirm":
                self._latest_reminder("scheduled")["status"] = "canceled"
                return self._execution_result("plan_cancel_reminder")
            if path == "/execution-plans/plan_create_expense/confirm":
                self.expenses.append(
                    {
                        "id": "expense_management_001",
                        "status": "draft",
                        "title": "打车票报销",
                        "amount": 58,
                    }
                )
                return self._execution_result("plan_create_expense")
            if path == "/execution-plans/plan_update_expense/confirm":
                self._latest_expense("draft")["amount"] = 88
                return self._execution_result("plan_update_expense")
            if path == "/execution-plans/plan_submit_expense/confirm":
                self._latest_expense("draft")["status"] = "submitted"
                return self._execution_result("plan_submit_expense")
            if path == "/execution-plans/plan_create_cancel_expense/confirm":
                self.expenses.append(
                    {
                        "id": "expense_management_002",
                        "status": "draft",
                        "title": "打车票报销",
                        "amount": 66,
                    }
                )
                return self._execution_result("plan_create_cancel_expense")
            if path == "/execution-plans/plan_cancel_expense/confirm":
                self._latest_expense("draft")["status"] = "canceled"
                return self._execution_result("plan_cancel_expense")
            if path == "/execution-plans/plan_create_event/confirm":
                self.events.append(
                    {
                        "id": "calendar_event_management_001",
                        "status": "scheduled",
                        "title": "开会",
                        "startAt": "2026-05-22T15:00:00+08:00",
                        "endAt": "2026-05-22T16:00:00+08:00",
                    }
                )
                return self._execution_result("plan_create_event")
            if path == "/execution-plans/plan_update_event/confirm":
                event = self._latest_event("scheduled")
                event["startAt"] = "2026-05-22T10:00:00+08:00"
                event["endAt"] = "2026-05-22T11:00:00+08:00"
                return self._execution_result("plan_update_event")
            if path == "/execution-plans/plan_create_cancel_event/confirm":
                self.events.append(
                    {
                        "id": "calendar_event_management_002",
                        "status": "scheduled",
                        "title": "开会",
                        "startAt": "2026-05-22T16:00:00+08:00",
                        "endAt": "2026-05-22T17:00:00+08:00",
                    }
                )
                return self._execution_result("plan_create_cancel_event")
            if path == "/execution-plans/plan_cancel_event/confirm":
                self._latest_event("scheduled")["status"] = "canceled"
                return self._execution_result("plan_cancel_event")
            raise AssertionError(f"unexpected POST {path}")

        def get(
            self,
            path: str,
            *,
            params: dict[str, object],
        ) -> Response:
            calls.append(("GET", path, params))
            assert params["conversationId"] == "conversation_product_smoke_management"
            if path == "/reminders":
                assert self.reminders
                return Response(200, json=self.reminders)
            if path == "/expenses":
                assert self.expenses
                return Response(200, json=self.expenses)
            if path == "/calendar/events":
                assert self.events
                return Response(200, json=self.events)
            if path == "/execution-ledger":
                return Response(
                    200,
                    json=[
                        {"eventType": "action_executed", "id": f"ledger_{index}"}
                        for index in range(14)
                    ],
                )
            raise AssertionError(f"unexpected GET {path}")

        def _plan_response(
            self,
            *,
            plan_id: str,
            action_type: str,
            payload: dict[str, object],
        ) -> Response:
            return Response(
                200,
                json={
                    "kind": "confirmation_required",
                    "plan": {
                        "id": plan_id,
                        "conversationId": "conversation_product_smoke_management",
                        "status": "awaiting_confirmation",
                        "riskLevel": "medium",
                        "summary": "确认自然语言管理动作",
                        "decisionTraceId": f"trace_{plan_id}",
                        "actions": [
                            {
                                "id": f"action_{plan_id}",
                                "planId": plan_id,
                                "domain": action_type.split(".", 1)[0],
                                "actionType": action_type,
                                "status": "awaiting_confirmation",
                                "riskLevel": "medium",
                                "summary": "自然语言管理动作",
                                "payload": payload,
                            },
                        ],
                        "confirmation": {
                            "id": f"confirmation_{plan_id}",
                            "planId": plan_id,
                            "status": "pending",
                            "requiredActionIds": [f"action_{plan_id}"],
                            "title": "确认自然语言管理动作",
                            "description": "确认自然语言管理动作",
                            "confirmToken": f"confirm_{plan_id}",
                        },
                    },
                },
            )

        def _execution_result(self, plan_id: str) -> Response:
            return Response(
                200,
                json={
                    "kind": "execution_result",
                    "plan": {
                        "id": plan_id,
                        "status": "succeeded",
                        "confirmation": {"status": "confirmed"},
                        "actions": [
                            {
                                "id": f"action_{plan_id}",
                                "status": "succeeded",
                                "result": {},
                            },
                        ],
                    },
                },
            )

        def _latest_reminder(self, status: str) -> dict[str, object]:
            for reminder in reversed(self.reminders):
                if reminder["status"] == status:
                    return reminder
            raise AssertionError(f"missing {status} reminder")

        def _latest_expense(self, status: str) -> dict[str, object]:
            for expense in reversed(self.expenses):
                if expense["status"] == status:
                    return expense
            raise AssertionError(f"missing {status} expense")

        def _latest_event(self, status: str) -> dict[str, object]:
            for event in reversed(self.events):
                if event["status"] == status:
                    return event
            raise AssertionError(f"missing {status} event")

    validate_product_smoke.validate_natural_language_management_smoke(
        FakeClient(),
        conversation_id="conversation_product_smoke_management",
    )

    assert agent_inputs == [
        "明天上午九点提醒我带水杯",
        "把刚才的提醒改到明天上午十点",
        "完成刚才的提醒",
        "明天上午九点提醒我带雨伞",
        "取消刚才的提醒",
        "把昨天 58 元打车票报销",
        "把刚才的费用改成 88 元",
        "提交刚才的费用",
        "把昨天 66 元打车票报销",
        "取消刚才的费用",
        "明天下午三点开会",
        "把明天的会议改到十点",
        "明天下午四点开会",
        "取消刚才的会议",
    ]
    confirm_paths = [
        path
        for method, path, _ in calls
        if method == "POST" and path.startswith("/execution-plans/")
    ]
    assert confirm_paths == [
        "/execution-plans/plan_create_reminder/confirm",
        "/execution-plans/plan_update_reminder/confirm",
        "/execution-plans/plan_complete_reminder/confirm",
        "/execution-plans/plan_create_cancel_reminder/confirm",
        "/execution-plans/plan_cancel_reminder/confirm",
        "/execution-plans/plan_create_expense/confirm",
        "/execution-plans/plan_update_expense/confirm",
        "/execution-plans/plan_submit_expense/confirm",
        "/execution-plans/plan_create_cancel_expense/confirm",
        "/execution-plans/plan_cancel_expense/confirm",
        "/execution-plans/plan_create_event/confirm",
        "/execution-plans/plan_update_event/confirm",
        "/execution-plans/plan_create_cancel_event/confirm",
        "/execution-plans/plan_cancel_event/confirm",
    ]
    assert calls[-1][:2] == ("GET", "/execution-ledger")
