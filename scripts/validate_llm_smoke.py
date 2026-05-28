from __future__ import annotations

import os
import sys
from argparse import ArgumentParser
from dataclasses import dataclass
from pathlib import Path
from uuid import uuid4

from fastapi.testclient import TestClient

ROOT_DIR = Path(__file__).resolve().parents[1]
for relative_path in (
    "python/backend",
    "python/agent-runtime",
    "python/orchestrator",
):
    sys.path.insert(0, str(ROOT_DIR / relative_path))

from backend.app.env import load_env_local  # noqa: E402

CLIENT_CONTEXT = {
    "locale": "zh-CN",
    "now": "2026-05-21T09:00:00+08:00",
    "timezone": "Asia/Shanghai",
}


@dataclass(frozen=True)
class LlmSmokeConfig:
    provider: str
    key_env: str


def configure_llm_smoke_environment(provider: str | None = None) -> LlmSmokeConfig:
    load_env_local()
    selected_provider = _select_provider(provider)
    key_env = _key_env_for_provider(selected_provider)
    if not os.environ.get(key_env):
        raise RuntimeError(
            "validate:llm-smoke 需要配置 DEEPSEEK_API_KEY 或 OPENAI_API_KEY。"
            f"当前 provider={selected_provider}，缺少 {key_env}。"
        )

    os.environ["AI_PLANNER_MODE"] = "llm_first"
    os.environ["AI_PLANNER_PROVIDER"] = selected_provider
    if os.environ.get("AI_CODE_LLM_SMOKE_USE_DATABASE", "0").lower() not in (
        "1",
        "true",
        "yes",
    ):
        os.environ["DATABASE_URL"] = ""
        os.environ["AI_CODE_LOAD_ENV_LOCAL"] = "0"

    return LlmSmokeConfig(provider=selected_provider, key_env=key_env)


def _select_provider(provider: str | None) -> str:
    configured_provider = provider or os.environ.get("AI_PLANNER_PROVIDER")
    if configured_provider:
        return configured_provider.strip().lower()
    if os.environ.get("DEEPSEEK_API_KEY"):
        return "deepseek"
    if os.environ.get("OPENAI_API_KEY"):
        return "openai"
    return "deepseek"


def _key_env_for_provider(provider: str) -> str:
    if provider == "deepseek":
        return "DEEPSEEK_API_KEY"
    if provider == "openai":
        return "OPENAI_API_KEY"
    raise RuntimeError(
        "validate:llm-smoke 当前只支持 AI_PLANNER_PROVIDER=deepseek 或 openai，"
        f"收到 {provider}。"
    )


def build_client() -> TestClient:
    from backend.app.main import app

    return TestClient(app)


def assert_status(response, expected_status: int = 200) -> None:
    if response.status_code != expected_status:
        raise AssertionError(
            f"expected {expected_status}, got {response.status_code}: {response.text}",
        )


def submit_turn(
    client: TestClient,
    *,
    conversation_id: str,
    text: str,
    now: str = "2026-05-21T09:00:00+08:00",
):
    response = client.post(
        "/agent/turns",
        json={
            "clientContext": {
                **CLIENT_CONTEXT,
                "now": now,
            },
            "conversationId": conversation_id,
            "input": text,
        },
    )
    assert_status(response)
    return response.json()


def confirm_response(client: TestClient, response) -> None:
    assert response["kind"] == "confirmation_required"
    plan = response["plan"]
    confirmation = plan["confirmation"]
    confirm = client.post(
        f"/execution-plans/{plan['id']}/confirm",
        json={"confirmToken": confirmation["confirmToken"]},
    )
    assert_status(confirm)
    body = confirm.json()
    assert body["kind"] == "execution_result"
    assert body["plan"]["status"] == "succeeded"


def latest_debug_trace(client: TestClient, conversation_id: str):
    response = client.get(f"/agent/conversations/{conversation_id}/debug")
    assert_status(response)
    traces = response.json()["decisionTraces"]
    if not traces:
        raise AssertionError("expected at least one decision trace")
    return traces[-1]


def assert_llm_first_without_fallback(trace, scenario: str) -> None:
    assert trace["plannerMode"] == "llm_first", scenario
    assert trace.get("fallbackReason") in (None, ""), scenario


def run_llm_smoke(client: TestClient, *, provider: str) -> None:
    conversation_id = f"conversation_llm_smoke_{provider}_{uuid4().hex}"

    health = client.get("/health")
    assert_status(health)
    assert health.json()["status"] == "ok"

    chat = submit_turn(
        client,
        conversation_id=conversation_id,
        text="今天有点累，只想随便聊聊",
    )
    assert chat["kind"] == "assistant_message"
    assert_llm_first_without_fallback(
        latest_debug_trace(client, conversation_id),
        "chat should use the real LLM provider",
    )

    clarification = submit_turn(
        client,
        conversation_id=conversation_id,
        text="明天上午我要去开会",
        now="2026-05-21T09:01:00+08:00",
    )
    assert clarification["kind"] == "clarification_request"
    assert "start_at" in clarification["missingFields"]
    assert_llm_first_without_fallback(
        latest_debug_trace(client, conversation_id),
        "clarification should use the real LLM provider",
    )

    mixed = submit_turn(
        client,
        conversation_id=conversation_id,
        text="我有点紧张，顺便帮我安排明天下午三点开会",
        now="2026-05-21T09:02:00+08:00",
    )
    assert mixed["kind"] == "confirmation_required"
    assert mixed.get("message")
    mixed_action = mixed["plan"]["actions"][0]
    assert mixed_action["actionType"] == "calendar.create_event"
    assert mixed_action["payload"]["start_at"] == "2026-05-22T15:00:00+08:00"
    assert_llm_first_without_fallback(
        latest_debug_trace(client, conversation_id),
        "mixed should use the real LLM provider",
    )
    confirm_response(client, mixed)

    query = submit_turn(
        client,
        conversation_id=conversation_id,
        text="明天我有什么安排？",
        now="2026-05-21T09:03:00+08:00",
    )
    assert query["kind"] == "assistant_message"
    structured_elements = query.get("structuredElements")
    assert isinstance(structured_elements, list)
    assert structured_elements, "read-only query should return structured elements"
    assert_llm_first_without_fallback(
        latest_debug_trace(client, conversation_id),
        "read-only query should use the real LLM provider",
    )

    first_reminder = submit_turn(
        client,
        conversation_id=conversation_id,
        text="明天上午九点提醒我带电脑",
        now="2026-05-21T09:04:00+08:00",
    )
    assert first_reminder["kind"] == "confirmation_required"
    confirm_response(client, first_reminder)

    second_reminder = submit_turn(
        client,
        conversation_id=conversation_id,
        text="明天上午十点提醒我带水杯",
        now="2026-05-21T09:05:00+08:00",
    )
    assert second_reminder["kind"] == "confirmation_required"
    confirm_response(client, second_reminder)

    ambiguity = submit_turn(
        client,
        conversation_id=conversation_id,
        text="完成提醒",
        now="2026-05-21T09:06:00+08:00",
    )
    assert ambiguity["kind"] == "clarification_request"
    assert ambiguity["missingFields"] == ["target_id"]
    safety_trace = latest_debug_trace(client, conversation_id)
    assert safety_trace["plannerMode"] == "llm_first"
    assert safety_trace["fallbackReason"] == "rule_safety_clarification: target_id"

    print(f"LLM smoke validation passed with provider={provider}.")


def main(argv: list[str] | None = None) -> None:
    parser = ArgumentParser(description="Validate real LLM planner smoke paths.")
    parser.add_argument(
        "--provider",
        choices=("deepseek", "openai"),
        help="Override AI_PLANNER_PROVIDER for this smoke run.",
    )
    args = parser.parse_args(argv)

    try:
        config = configure_llm_smoke_environment(args.provider)
        client = build_client()
        try:
            run_llm_smoke(client, provider=config.provider)
        finally:
            close = getattr(client, "close", None)
            if callable(close):
                close()
    except RuntimeError as exc:
        print(str(exc), file=sys.stderr)
        raise SystemExit(1) from exc


if __name__ == "__main__":
    main()
