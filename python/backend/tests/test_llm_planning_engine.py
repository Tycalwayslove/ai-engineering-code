import json
import logging
from typing import cast

import pytest
from agent_runtime.context.types import ContextPack
from agent_runtime.planning.llm import (
    DeepSeekLlmProvider,
    LlmFirstPlanningEngine,
    LlmPlanningEngine,
    MockLlmProvider,
    OpenAILlmProvider,
)
from agent_runtime.planning.rule_based import RuleBasedPlanningEngine
from agent_runtime.planning.types import PlanningInput


class StaticProvider:
    model = "static-test-model"

    def __init__(self, payload: dict[str, object]) -> None:
        self._payload = payload

    def complete(self, prompt: str) -> str:
        return json.dumps(self._payload, ensure_ascii=False)


class RawProvider:
    model = "raw-test-model"

    def __init__(self, output: str) -> None:
        self._output = output

    def complete(self, prompt: str) -> str:
        del prompt
        return self._output


def test_mock_llm_planning_engine_returns_reminder_candidate() -> None:
    engine = LlmPlanningEngine(provider=MockLlmProvider(), mode="llm_mock")

    result = engine.plan(
        PlanningInput(
            conversation_id="conversation_001",
            text="明天上午九点提醒我带电脑",
            now="2026-05-21T09:00:00+08:00",
            timezone="Asia/Shanghai",
        ),
        ContextPack(tool_catalog=["reminder.create_reminder"]),
    )

    assert result.kind == "plan_candidate"
    assert result.candidate is not None
    assert result.candidate.proposed_actions[0].action_type == "reminder.create_reminder"
    assert result.candidate.proposed_actions[0].payload["title"] == "带电脑"


def test_llm_planning_engine_validates_provider_payload() -> None:
    engine = LlmPlanningEngine(
        provider=StaticProvider({"goal": "缺少 actions"}),
        mode="llm_mock",
    )

    result = engine.plan(
        PlanningInput(
            conversation_id="conversation_001",
            text="取消提醒",
            now="2026-05-21T09:00:00+08:00",
            timezone="Asia/Shanghai",
        ),
        ContextPack(
            reminder_summary=[
                "id=reminder_1; title=带电脑; due_at=2026-05-22T09:00:00+08:00; status=scheduled",
            ],
        ),
    )

    assert result.kind == "assistant_message"
    assert result.message is not None
    assert "规划器返回格式无效" in result.message


def test_llm_planning_engine_handles_non_json_provider_output() -> None:
    engine = LlmPlanningEngine(
        provider=RawProvider("not json"),
        mode="deepseek",
    )

    result = engine.plan(
        PlanningInput(
            conversation_id="conversation_001",
            text="明天上午九点提醒我带电脑",
            now="2026-05-21T09:00:00+08:00",
            timezone="Asia/Shanghai",
        ),
        ContextPack.empty(),
    )

    assert result.kind == "assistant_message"
    assert result.trace_id == "deepseek-invalid-response"
    assert result.message is not None
    assert "规划器返回格式无效" in result.message


def test_llm_planning_engine_parses_fenced_json_provider_output() -> None:
    engine = LlmPlanningEngine(
        provider=RawProvider(
            """```json
{
  "response_type": "chat",
  "assistant_message": "可以，我在。",
  "structured_elements": [],
  "clarification": null,
  "goal": "",
  "actions": [],
  "missing_information": [],
  "assumptions": [],
  "risk_notes": []
}
```""",
        ),
        mode="claude",
    )

    result = engine.plan(
        PlanningInput(
            conversation_id="conversation_fenced_json",
            text="今天有点累",
            now="2026-05-21T09:00:00+08:00",
            timezone="Asia/Shanghai",
        ),
        ContextPack.empty(),
    )

    assert result.kind == "assistant_message"
    assert result.trace_id == "claude-chat"
    assert result.message == "可以，我在。"


def test_llm_planning_engine_returns_chat_message() -> None:
    engine = LlmPlanningEngine(
        provider=StaticProvider(
            {
                "response_type": "chat",
                "assistant_message": "可以，我在。要不要一起整理明天的安排？",
                "clarification": None,
                "actions": [],
                "missing_information": [],
                "assumptions": [],
                "risk_notes": [],
            },
        ),
        mode="llm",
    )

    result = engine.plan(
        PlanningInput(
            conversation_id="conversation_chat_001",
            text="今天有点累",
            now="2026-05-21T09:00:00+08:00",
            timezone="Asia/Shanghai",
        ),
        ContextPack.empty(),
    )

    assert result.kind == "assistant_message"
    assert result.message == "可以，我在。要不要一起整理明天的安排？"
    assert result.planner_mode == "llm"


def test_llm_planning_engine_returns_chat_structured_elements() -> None:
    engine = LlmPlanningEngine(
        provider=StaticProvider(
            {
                "response_type": "chat",
                "assistant_message": "明天有 2 个安排。",
                "structured_elements": [
                    {
                        "id": "tomorrow-schedule",
                        "kind": "summary-list",
                        "title": "明天的安排",
                        "items": [
                            {
                                "id": "reminder_1",
                                "label": "带电脑",
                                "meta": "明天 09:00",
                                "tone": "warning",
                            },
                            {
                                "id": "event_1",
                                "label": "开会",
                                "meta": "明天 15:00-16:00",
                                "tone": "info",
                            },
                        ],
                    },
                ],
                "clarification": None,
                "actions": [],
                "missing_information": [],
                "assumptions": [],
                "risk_notes": [],
            },
        ),
        mode="llm",
    )

    result = engine.plan(
        PlanningInput(
            conversation_id="conversation_chat_structured_elements",
            text="明天我有什么安排？",
            now="2026-05-21T09:00:00+08:00",
            timezone="Asia/Shanghai",
        ),
        ContextPack.empty(),
    )

    assert result.kind == "assistant_message"
    assert result.message == "明天有 2 个安排。"
    assert result.structured_elements == [
        {
            "id": "tomorrow-schedule",
            "kind": "summary-list",
            "title": "明天的安排",
            "items": [
                {
                    "id": "reminder_1",
                    "label": "带电脑",
                    "meta": "明天 09:00",
                    "tone": "warning",
                },
                {
                    "id": "event_1",
                    "label": "开会",
                    "meta": "明天 15:00-16:00",
                    "tone": "info",
                },
            ],
        },
    ]


def test_llm_planning_engine_treats_chat_with_actions_as_message_only() -> None:
    engine = LlmPlanningEngine(
        provider=StaticProvider(
            {
                "response_type": "chat",
                "assistant_message": "我先只回答你，不生成执行计划。",
                "clarification": None,
                "actions": [
                    {
                        "domain": "reminder",
                        "action_type": "reminder.create_reminder",
                        "summary": "不应被执行的动作",
                        "payload": {
                            "title": "带电脑",
                            "due_at": "2026-05-22T09:00:00+08:00",
                            "timezone": "Asia/Shanghai",
                        },
                        "risk_level": "medium",
                        "missing_fields": [],
                    },
                ],
                "missing_information": [],
                "assumptions": [],
                "risk_notes": [],
            },
        ),
        mode="llm",
    )

    result = engine.plan(
        PlanningInput(
            conversation_id="conversation_chat_with_actions",
            text="今天有点累",
            now="2026-05-21T09:00:00+08:00",
            timezone="Asia/Shanghai",
        ),
        ContextPack.empty(),
    )

    assert result.kind == "assistant_message"
    assert result.candidate is None
    assert result.message == "我先只回答你，不生成执行计划。"


def test_llm_planning_engine_returns_clarification_candidate() -> None:
    engine = LlmPlanningEngine(
        provider=StaticProvider(
            {
                "response_type": "clarification",
                "assistant_message": "明天上午几点开始开会？",
                "clarification": {
                    "intent_id": "pending_calendar_meeting",
                    "domain": "calendar",
                    "action_type": "calendar.create_event",
                    "question": "明天上午几点开始开会？",
                    "missing_fields": ["start_at"],
                    "quick_replies": ["明天上午9点", "明天上午10点", "我再说具体时间"],
                    "partial_payload": {
                        "title": "开会",
                        "date_hint": "2026-05-22",
                        "time_range_hint": "morning",
                        "timezone": "Asia/Shanghai",
                    },
                },
                "actions": [],
                "missing_information": ["start_at"],
                "assumptions": [],
                "risk_notes": [],
            },
        ),
        mode="llm",
    )

    result = engine.plan(
        PlanningInput(
            conversation_id="conversation_clarification_001",
            text="明天上午我要去开会",
            now="2026-05-21T09:00:00+08:00",
            timezone="Asia/Shanghai",
        ),
        ContextPack.empty(),
    )

    assert result.kind == "clarification"
    assert result.clarification is not None
    assert result.clarification.question == "明天上午几点开始开会？"
    assert result.clarification.quick_replies == [
        "明天上午9点",
        "明天上午10点",
        "我再说具体时间",
    ]
    assert result.clarification.partial_payload["title"] == "开会"


def test_llm_planning_engine_returns_mixed_message_with_actions() -> None:
    engine = LlmPlanningEngine(
        provider=StaticProvider(
            {
                "response_type": "mixed",
                "assistant_message": "当然可以，我先列出会议安排，确认后写入日程。",
                "goal": "创建日程：开会",
                "actions": [
                    {
                        "domain": "calendar",
                        "action_type": "calendar.create_event",
                        "summary": "创建日程：开会",
                        "payload": {
                            "title": "开会",
                            "start_at": "2026-05-22T15:00:00+08:00",
                            "end_at": "2026-05-22T16:00:00+08:00",
                            "timezone": "Asia/Shanghai",
                        },
                        "risk_level": "medium",
                        "missing_fields": [],
                    },
                ],
                "missing_information": [],
                "assumptions": [],
                "risk_notes": [],
            },
        ),
        mode="llm",
    )

    result = engine.plan(
        PlanningInput(
            conversation_id="conversation_mixed_001",
            text="好的，帮我安排明天下午三点开会",
            now="2026-05-21T09:00:00+08:00",
            timezone="Asia/Shanghai",
        ),
        ContextPack.empty(),
    )

    assert result.kind == "plan_candidate"
    assert result.message == "当然可以，我先列出会议安排，确认后写入日程。"
    assert result.candidate is not None
    assert result.candidate.proposed_actions[0].action_type == "calendar.create_event"


def test_llm_planning_engine_logs_provider_latency_without_prompt_by_default(
    caplog: pytest.LogCaptureFixture,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    engine = LlmPlanningEngine(
        provider=StaticProvider({"goal": "缺少 actions"}),
        mode="llm",
    )
    timestamps = iter([10.0, 10.234])
    monkeypatch.setattr("agent_runtime.planning.llm.perf_counter", lambda: next(timestamps))
    monkeypatch.delenv("AI_PLANNER_LOG_PROMPT", raising=False)
    caplog.set_level(logging.INFO, logger="uvicorn.error")

    engine.plan(
        PlanningInput(
            conversation_id="conversation_001",
            text="明天上午九点提醒我带电脑",
            now="2026-05-21T09:00:00+08:00",
            timezone="Asia/Shanghai",
        ),
        ContextPack.empty(),
    )

    assert "LLM planner provider call completed" in caplog.text
    assert "provider=StaticProvider" in caplog.text
    assert "model=static-test-model" in caplog.text
    assert "duration_ms=234" in caplog.text
    assert "prompt_sha256=" in caplog.text
    assert "明天上午九点提醒我带电脑" not in caplog.text


def test_llm_planning_engine_returns_provider_call_observation(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    engine = LlmPlanningEngine(
        provider=StaticProvider(
            {
                "response_type": "chat",
                "assistant_message": "可以，我在。",
                "structured_elements": [],
                "clarification": None,
                "actions": [],
                "missing_information": [],
                "assumptions": [],
                "risk_notes": [],
            },
        ),
        mode="llm",
    )
    timestamps = iter([10.0, 10.123])
    monkeypatch.setattr("agent_runtime.planning.llm.perf_counter", lambda: next(timestamps))
    monkeypatch.delenv("AI_PLANNER_TRACE_PROMPT", raising=False)
    monkeypatch.delenv("AI_PLANNER_TRACE_RESPONSE", raising=False)

    result = engine.plan(
        PlanningInput(
            conversation_id="conversation_001",
            text="今天有点累",
            now="2026-05-21T09:00:00+08:00",
            timezone="Asia/Shanghai",
        ),
        ContextPack.empty(),
    )

    assert result.llm_call is not None
    assert result.llm_call["provider"] == "StaticProvider"
    assert result.llm_call["model"] == "static-test-model"
    assert result.llm_call["mode"] == "llm"
    assert result.llm_call["status"] == "completed"
    assert result.llm_call["durationMs"] == 123
    prompt_chars = result.llm_call["promptChars"]
    response_chars = result.llm_call["responseChars"]
    assert isinstance(prompt_chars, int)
    assert isinstance(response_chars, int)
    assert prompt_chars > 0
    assert response_chars > 0
    assert isinstance(result.llm_call["promptSha256"], str)
    assert "promptPreview" not in result.llm_call
    assert "responsePreview" not in result.llm_call


def test_llm_planning_engine_trace_previews_require_explicit_flags(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    engine = LlmPlanningEngine(
        provider=StaticProvider(
            {
                "response_type": "chat",
                "assistant_message": "可以，我在。",
                "structured_elements": [],
                "clarification": None,
                "actions": [],
                "missing_information": [],
                "assumptions": [],
                "risk_notes": [],
            },
        ),
        mode="llm",
    )
    monkeypatch.setenv("AI_PLANNER_TRACE_PROMPT", "1")
    monkeypatch.setenv("AI_PLANNER_TRACE_RESPONSE", "1")

    result = engine.plan(
        PlanningInput(
            conversation_id="conversation_trace_preview",
            text="今天有点累",
            now="2026-05-21T09:00:00+08:00",
            timezone="Asia/Shanghai",
        ),
        ContextPack.empty(),
    )

    assert result.llm_call is not None
    assert "今天有点累" in str(result.llm_call["promptPreview"])
    assert "可以，我在。" in str(result.llm_call["responsePreview"])


def test_llm_planning_engine_logs_prompt_when_enabled(
    caplog: pytest.LogCaptureFixture,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    engine = LlmPlanningEngine(
        provider=StaticProvider({"goal": "缺少 actions"}),
        mode="llm",
    )
    timestamps = iter([10.0, 10.001])
    monkeypatch.setattr("agent_runtime.planning.llm.perf_counter", lambda: next(timestamps))
    monkeypatch.setenv("AI_PLANNER_LOG_PROMPT", "1")
    caplog.set_level(logging.INFO, logger="uvicorn.error")

    engine.plan(
        PlanningInput(
            conversation_id="conversation_001",
            text="明天上午九点提醒我带电脑",
            now="2026-05-21T09:00:00+08:00",
            timezone="Asia/Shanghai",
        ),
        ContextPack.empty(),
    )

    assert "LLM planner prompt" in caplog.text
    assert "明天上午九点提醒我带电脑" in caplog.text


def test_llm_first_planning_engine_uses_llm_candidate_when_valid() -> None:
    llm_engine = LlmPlanningEngine(
        provider=StaticProvider(
            {
                "goal": "创建日程：跟老婆吃午饭",
                "actions": [
                    {
                        "domain": "calendar",
                        "action_type": "calendar.create_event",
                        "summary": "创建日程：跟老婆吃午饭",
                        "payload": {
                            "title": "跟老婆吃午饭",
                            "start_at": "2026-05-22T12:00:00+08:00",
                            "end_at": "2026-05-22T13:00:00+08:00",
                            "timezone": "Asia/Shanghai",
                        },
                        "risk_level": "medium",
                        "missing_fields": [],
                    }
                ],
                "missing_information": [],
                "assumptions": ["中午默认 12:00。"],
                "risk_notes": [],
            },
        ),
        mode="llm",
    )
    engine = LlmFirstPlanningEngine(
        llm_engine=llm_engine,
        fallback_engine=RuleBasedPlanningEngine(),
    )

    result = engine.plan(
        PlanningInput(
            conversation_id="conversation_001",
            text="帮我规划一个跟老婆吃午饭的日程",
            now="2026-05-21T09:00:00+08:00",
            timezone="Asia/Shanghai",
        ),
        ContextPack.empty(),
    )

    assert result.kind == "plan_candidate"
    assert result.planner_mode == "llm_first"
    assert result.fallback_reason is None
    assert result.candidate is not None
    assert result.candidate.proposed_actions[0].payload["title"] == "跟老婆吃午饭"


def test_llm_first_planning_engine_prefers_rule_target_clarification_over_llm_guess() -> None:
    llm_engine = LlmPlanningEngine(
        provider=StaticProvider(
            {
                "goal": "取消提醒：带水杯",
                "actions": [
                    {
                        "domain": "reminder",
                        "action_type": "reminder.cancel_reminder",
                        "summary": "取消提醒：带水杯",
                        "payload": {
                            "target_id": "reminder_2",
                            "target_kind": "reminder",
                            "expected_status": "scheduled",
                        },
                        "risk_level": "medium",
                        "missing_fields": [],
                    }
                ],
                "missing_information": [],
                "assumptions": [],
                "risk_notes": [],
            },
        ),
        mode="llm",
    )
    engine = LlmFirstPlanningEngine(
        llm_engine=llm_engine,
        fallback_engine=RuleBasedPlanningEngine(),
    )

    result = engine.plan(
        PlanningInput(
            conversation_id="conversation_ambiguous_llm_target",
            text="取消提醒",
            now="2026-05-21T09:00:00+08:00",
            timezone="Asia/Shanghai",
        ),
        ContextPack(
            reminder_summary=[
                "id=reminder_1; title=带电脑; due_at=2026-05-22T09:00:00+08:00; status=scheduled",
                "id=reminder_2; title=带水杯; due_at=2026-05-22T10:00:00+08:00; status=scheduled",
            ],
        ),
    )

    assert result.kind == "clarification"
    assert result.planner_mode == "llm_first"
    assert result.candidate is None
    assert result.clarification is not None
    assert result.clarification.missing_fields == ["target_id"]
    assert "哪一个提醒" in result.clarification.question
    assert result.fallback_reason == "rule_safety_clarification: target_id"


def test_llm_first_planning_engine_prefers_rule_recent_management_candidate() -> None:
    llm_engine = LlmPlanningEngine(
        provider=StaticProvider(
            {
                "goal": "修改提醒时间",
                "actions": [
                    {
                        "domain": "reminder",
                        "action_type": "reminder.update_reminder",
                        "summary": "修改提醒时间",
                        "payload": {
                            "target_id": "reminder_1",
                            "target_kind": "reminder",
                            "expected_status": "scheduled",
                            "patch": {"dueAt": "2026-05-21T10:00:00+08:00"},
                        },
                        "risk_level": "medium",
                        "missing_fields": [],
                    }
                ],
                "missing_information": [],
                "assumptions": [],
                "risk_notes": [],
            },
        ),
        mode="llm",
    )
    engine = LlmFirstPlanningEngine(
        llm_engine=llm_engine,
        fallback_engine=RuleBasedPlanningEngine(),
    )

    result = engine.plan(
        PlanningInput(
            conversation_id="conversation_recent_management_llm_time_drift",
            text="把刚才的提醒改到明天上午十点",
            now="2026-05-21T09:05:00+08:00",
            timezone="Asia/Shanghai",
        ),
        ContextPack(
            reminder_summary=[
                "id=reminder_1; title=带水杯; due_at=2026-05-22T09:00:00+08:00; status=scheduled",
            ],
            tool_catalog=["reminder.update_reminder"],
        ),
    )

    assert result.kind == "plan_candidate"
    assert result.planner_mode == "llm_first"
    assert result.fallback_reason == "rule_safety_deterministic: reminder.update_reminder"
    assert result.candidate is not None
    action = result.candidate.proposed_actions[0]
    assert action.action_type == "reminder.update_reminder"
    assert action.payload["target_id"] == "reminder_1"
    patch = cast(dict[str, object], action.payload["patch"])
    assert patch["dueAt"] == "2026-05-22T10:00:00+08:00"


def test_llm_first_planning_engine_prefers_rule_explicit_reminder_time() -> None:
    llm_engine = LlmPlanningEngine(
        provider=StaticProvider(
            {
                "goal": "创建提醒：带电脑",
                "actions": [
                    {
                        "domain": "reminder",
                        "action_type": "reminder.create_reminder",
                        "summary": "创建提醒：带电脑",
                        "payload": {
                            "title": "带电脑",
                            "due_at": "2026-05-21T09:00:00+08:00",
                            "timezone": "Asia/Shanghai",
                        },
                        "risk_level": "low",
                        "missing_fields": [],
                    }
                ],
                "missing_information": [],
                "assumptions": [],
                "risk_notes": [],
            },
        ),
        mode="llm",
    )
    engine = LlmFirstPlanningEngine(
        llm_engine=llm_engine,
        fallback_engine=RuleBasedPlanningEngine(),
    )

    result = engine.plan(
        PlanningInput(
            conversation_id="conversation_explicit_reminder_llm_time_drift",
            text="明天上午九点提醒我带电脑",
            now="2026-05-21T09:00:00+08:00",
            timezone="Asia/Shanghai",
        ),
        ContextPack(tool_catalog=["reminder.create_reminder"]),
    )

    assert result.kind == "plan_candidate"
    assert result.planner_mode == "llm_first"
    assert result.fallback_reason == "rule_safety_deterministic: reminder.create_reminder"
    assert result.candidate is not None
    action = result.candidate.proposed_actions[0]
    assert action.action_type == "reminder.create_reminder"
    assert action.payload["title"] == "带电脑"
    assert action.payload["due_at"] == "2026-05-22T09:00:00+08:00"


def test_llm_first_planning_engine_prefers_rule_explicit_expense_draft() -> None:
    llm_engine = LlmPlanningEngine(
        provider=StaticProvider(
            {
                "response_type": "chat",
                "assistant_message": "这像是一张打车票。",
                "structured_elements": [],
                "clarification": None,
                "goal": "",
                "actions": [],
                "missing_information": [],
                "assumptions": [],
                "risk_notes": [],
            },
        ),
        mode="llm",
    )
    engine = LlmFirstPlanningEngine(
        llm_engine=llm_engine,
        fallback_engine=RuleBasedPlanningEngine(),
    )

    result = engine.plan(
        PlanningInput(
            conversation_id="conversation_explicit_expense_llm_underclassified",
            text="把昨天 58 元打车票报销",
            now="2026-05-21T09:00:00+08:00",
            timezone="Asia/Shanghai",
        ),
        ContextPack(tool_catalog=["expense.create_reimbursement_draft"]),
    )

    assert result.kind == "plan_candidate"
    assert result.planner_mode == "llm_first"
    assert (
        result.fallback_reason
        == "rule_safety_deterministic: expense.create_reimbursement_draft"
    )
    assert result.candidate is not None
    action = result.candidate.proposed_actions[0]
    assert action.action_type == "expense.create_reimbursement_draft"
    assert action.payload["amount"] == 58
    assert action.payload["occurred_on"] == "2026-05-20"


def test_llm_first_planning_engine_prefers_rule_explicit_calendar_time() -> None:
    llm_engine = LlmPlanningEngine(
        provider=StaticProvider(
            {
                "goal": "创建日程：开会",
                "actions": [
                    {
                        "domain": "calendar",
                        "action_type": "calendar.create_event",
                        "summary": "创建日程：开会",
                        "payload": {
                            "title": "开会",
                            "start_at": "2026-05-21T15:00:00+08:00",
                            "end_at": "2026-05-21T16:00:00+08:00",
                            "timezone": "Asia/Shanghai",
                        },
                        "risk_level": "medium",
                        "missing_fields": [],
                    }
                ],
                "missing_information": [],
                "assumptions": [],
                "risk_notes": [],
            },
        ),
        mode="llm",
    )
    engine = LlmFirstPlanningEngine(
        llm_engine=llm_engine,
        fallback_engine=RuleBasedPlanningEngine(),
    )

    result = engine.plan(
        PlanningInput(
            conversation_id="conversation_explicit_calendar_llm_time_drift",
            text="明天下午三点开会",
            now="2026-05-21T09:00:00+08:00",
            timezone="Asia/Shanghai",
        ),
        ContextPack(tool_catalog=["calendar.create_event"]),
    )

    assert result.kind == "plan_candidate"
    assert result.planner_mode == "llm_first"
    assert result.fallback_reason == "rule_safety_deterministic: calendar.create_event"
    assert result.candidate is not None
    action = result.candidate.proposed_actions[0]
    assert action.action_type == "calendar.create_event"
    assert action.payload["start_at"] == "2026-05-22T15:00:00+08:00"
    assert action.payload["end_at"] == "2026-05-22T16:00:00+08:00"


def test_llm_first_planning_engine_keeps_llm_for_mixed_calendar_message() -> None:
    llm_engine = LlmPlanningEngine(
        provider=StaticProvider(
            {
                "response_type": "mixed",
                "assistant_message": "紧张很正常，我先帮你把会议列出来。",
                "goal": "创建日程：开会",
                "actions": [
                    {
                        "domain": "calendar",
                        "action_type": "calendar.create_event",
                        "summary": "创建日程：开会",
                        "payload": {
                            "title": "开会",
                            "start_at": "2026-05-22T15:00:00+08:00",
                            "end_at": "2026-05-22T16:00:00+08:00",
                            "timezone": "Asia/Shanghai",
                        },
                        "risk_level": "medium",
                        "missing_fields": [],
                    }
                ],
                "missing_information": [],
                "assumptions": [],
                "risk_notes": [],
            },
        ),
        mode="llm",
    )
    engine = LlmFirstPlanningEngine(
        llm_engine=llm_engine,
        fallback_engine=RuleBasedPlanningEngine(),
    )

    result = engine.plan(
        PlanningInput(
            conversation_id="conversation_mixed_calendar_should_use_llm",
            text="我有点紧张，顺便帮我安排明天下午三点开会",
            now="2026-05-21T09:02:00+08:00",
            timezone="Asia/Shanghai",
        ),
        ContextPack(tool_catalog=["calendar.create_event"]),
    )

    assert result.kind == "plan_candidate"
    assert result.planner_mode == "llm_first"
    assert result.fallback_reason is None
    assert result.message == "紧张很正常，我先帮你把会议列出来。"
    assert result.candidate is not None
    assert result.candidate.proposed_actions[0].action_type == "calendar.create_event"


def test_llm_first_planning_engine_prefers_rule_single_target_calendar_update() -> None:
    llm_engine = LlmPlanningEngine(
        provider=StaticProvider(
            {
                "goal": "修改日程时间",
                "actions": [
                    {
                        "domain": "calendar",
                        "action_type": "calendar.update_event",
                        "summary": "修改日程时间",
                        "payload": {
                            "target_id": "event_1",
                            "target_kind": "calendar_event",
                            "expected_status": "scheduled",
                            "patch": {
                                "startAt": "2026-05-21T10:00:00+08:00",
                                "endAt": "2026-05-21T11:00:00+08:00",
                            },
                        },
                        "risk_level": "medium",
                        "missing_fields": [],
                    }
                ],
                "missing_information": [],
                "assumptions": [],
                "risk_notes": [],
            },
        ),
        mode="llm",
    )
    engine = LlmFirstPlanningEngine(
        llm_engine=llm_engine,
        fallback_engine=RuleBasedPlanningEngine(),
    )

    result = engine.plan(
        PlanningInput(
            conversation_id="conversation_single_target_calendar_update_drift",
            text="把明天的会议改到十点",
            now="2026-05-21T09:13:00+08:00",
            timezone="Asia/Shanghai",
        ),
        ContextPack(
            calendar_summary=[
                "id=event_1; title=开会; start_at=2026-05-22T15:00:00+08:00; "
                "end_at=2026-05-22T16:00:00+08:00; status=scheduled",
            ],
            tool_catalog=["calendar.update_event"],
        ),
    )

    assert result.kind == "plan_candidate"
    assert result.planner_mode == "llm_first"
    assert result.fallback_reason == "rule_safety_deterministic: calendar.update_event"
    assert result.candidate is not None
    action = result.candidate.proposed_actions[0]
    assert action.action_type == "calendar.update_event"
    assert action.payload["target_id"] == "event_1"
    patch = cast(dict[str, object], action.payload["patch"])
    assert patch["startAt"] == "2026-05-22T10:00:00+08:00"
    assert patch["endAt"] == "2026-05-22T11:00:00+08:00"


def test_llm_first_planning_engine_falls_back_to_rule_when_llm_fails() -> None:
    class FailingProvider:
        model = "failing-provider-model"

        def complete(self, prompt: str) -> str:
            del prompt
            raise RuntimeError("network unavailable")

    llm_engine = LlmPlanningEngine(provider=FailingProvider(), mode="llm")
    engine = LlmFirstPlanningEngine(
        llm_engine=llm_engine,
        fallback_engine=RuleBasedPlanningEngine(),
    )

    result = engine.plan(
        PlanningInput(
            conversation_id="conversation_001",
            text="你好，今天状态怎么样？",
            now="2026-05-21T09:00:00+08:00",
            timezone="Asia/Shanghai",
        ),
        ContextPack.empty(),
    )

    assert result.kind == "assistant_message"
    assert result.planner_mode == "llm_first"
    assert result.fallback_reason == "llm_error: RuntimeError"
    assert result.message is not None
    assert result.llm_call is not None
    assert result.llm_call["provider"] == "FailingProvider"
    assert result.llm_call["model"] == "failing-provider-model"
    assert result.llm_call["status"] == "failed"
    assert result.llm_call["errorType"] == "RuntimeError"
    assert isinstance(result.llm_call["durationMs"], int)
    assert isinstance(result.llm_call["promptSha256"], str)


def test_deepseek_provider_uses_openai_compatible_chat_json_mode(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    created_clients: list[dict[str, object]] = []
    completion_calls: list[dict[str, object]] = []
    empty_payload = json.dumps(
        {
            "goal": "ok",
            "actions": [],
            "missing_information": [],
            "assumptions": [],
            "risk_notes": [],
        },
    )

    class FakeMessage:
        content = empty_payload

    class FakeChoice:
        message = FakeMessage()

    class FakeResponse:
        choices = [FakeChoice()]

    class FakeCompletions:
        def create(self, **kwargs: object) -> FakeResponse:
            completion_calls.append(kwargs)
            return FakeResponse()

    class FakeChat:
        completions = FakeCompletions()

    class FakeOpenAI:
        def __init__(self, *, api_key: str, base_url: str, timeout: float) -> None:
            created_clients.append(
                {"api_key": api_key, "base_url": base_url, "timeout": timeout},
            )
            self.chat = FakeChat()

    class FakeOpenAIModule:
        OpenAI = FakeOpenAI

    monkeypatch.setenv("DEEPSEEK_API_KEY", "deepseek-test-key")
    monkeypatch.delenv("AI_PLANNER_REQUEST_TIMEOUT_SECONDS", raising=False)
    monkeypatch.setattr(
        "agent_runtime.planning.llm.import_module",
        lambda name: FakeOpenAIModule,
    )

    provider = DeepSeekLlmProvider(model="deepseek-custom-model")

    assert provider.complete("user_input: 明天提醒我带电脑") == FakeMessage.content
    assert created_clients == [
        {
            "api_key": "deepseek-test-key",
            "base_url": "https://api.deepseek.com",
            "timeout": 20.0,
        }
    ]
    assert completion_calls == [
        {
            "model": "deepseek-custom-model",
            "messages": [
                {"role": "system", "content": provider.system_prompt},
                {"role": "user", "content": "user_input: 明天提醒我带电脑"},
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0,
        }
    ]


def test_deepseek_provider_passes_request_timeout_to_client(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    created_clients: list[dict[str, object]] = []

    class FakeMessage:
        content = "{}"

    class FakeChoice:
        message = FakeMessage()

    class FakeResponse:
        choices = [FakeChoice()]

    class FakeCompletions:
        def create(self, **kwargs: object) -> FakeResponse:
            del kwargs
            return FakeResponse()

    class FakeChat:
        completions = FakeCompletions()

    class FakeOpenAI:
        def __init__(
            self,
            *,
            api_key: str,
            base_url: str,
            timeout: float | None = None,
        ) -> None:
            created_clients.append(
                {"api_key": api_key, "base_url": base_url, "timeout": timeout},
            )
            self.chat = FakeChat()

    class FakeOpenAIModule:
        OpenAI = FakeOpenAI

    monkeypatch.setenv("DEEPSEEK_API_KEY", "deepseek-test-key")
    monkeypatch.setenv("AI_PLANNER_REQUEST_TIMEOUT_SECONDS", "12.5")
    monkeypatch.setattr(
        "agent_runtime.planning.llm.import_module",
        lambda name: FakeOpenAIModule,
    )

    DeepSeekLlmProvider().complete("user_input: 明天提醒我带电脑")

    assert created_clients == [
        {
            "api_key": "deepseek-test-key",
            "base_url": "https://api.deepseek.com",
            "timeout": 12.5,
        }
    ]


def test_deepseek_provider_requires_api_key(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("DEEPSEEK_API_KEY", raising=False)

    provider = DeepSeekLlmProvider()

    try:
        provider.complete("user_input: 明天提醒我带电脑")
    except RuntimeError as exc:
        assert "DEEPSEEK_API_KEY" in str(exc)
    else:
        raise AssertionError("DeepSeek provider should require DEEPSEEK_API_KEY")


def test_deepseek_provider_rejects_empty_choices(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    class FakeResponse:
        choices: list[object] = []

    class FakeCompletions:
        def create(self, **kwargs: object) -> FakeResponse:
            del kwargs
            return FakeResponse()

    class FakeChat:
        completions = FakeCompletions()

    class FakeOpenAI:
        def __init__(self, *, api_key: str, base_url: str, timeout: float) -> None:
            del api_key, base_url
            del timeout
            self.chat = FakeChat()

    class FakeOpenAIModule:
        OpenAI = FakeOpenAI

    monkeypatch.setenv("DEEPSEEK_API_KEY", "deepseek-test-key")
    monkeypatch.setattr(
        "agent_runtime.planning.llm.import_module",
        lambda name: FakeOpenAIModule,
    )

    provider = DeepSeekLlmProvider()

    with pytest.raises(RuntimeError, match="DeepSeek response did not include choices"):
        provider.complete("user_input: 明天提醒我带电脑")


def test_deepseek_provider_rejects_empty_content(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    class FakeMessage:
        content = "   "

    class FakeChoice:
        message = FakeMessage()

    class FakeResponse:
        choices = [FakeChoice()]

    class FakeCompletions:
        def create(self, **kwargs: object) -> FakeResponse:
            del kwargs
            return FakeResponse()

    class FakeChat:
        completions = FakeCompletions()

    class FakeOpenAI:
        def __init__(self, *, api_key: str, base_url: str, timeout: float) -> None:
            del api_key, base_url
            del timeout
            self.chat = FakeChat()

    class FakeOpenAIModule:
        OpenAI = FakeOpenAI

    monkeypatch.setenv("DEEPSEEK_API_KEY", "deepseek-test-key")
    monkeypatch.setattr(
        "agent_runtime.planning.llm.import_module",
        lambda name: FakeOpenAIModule,
    )

    provider = DeepSeekLlmProvider()

    with pytest.raises(RuntimeError, match="DeepSeek response did not include content"):
        provider.complete("user_input: 明天提醒我带电脑")


def test_openai_provider_still_uses_responses_api(monkeypatch: pytest.MonkeyPatch) -> None:
    response_calls: list[dict[str, object]] = []
    empty_payload = json.dumps(
        {
            "goal": "ok",
            "actions": [],
            "missing_information": [],
            "assumptions": [],
            "risk_notes": [],
        },
    )

    class FakeResponse:
        output_text = empty_payload

    class FakeResponses:
        def create(self, **kwargs: object) -> FakeResponse:
            response_calls.append(kwargs)
            return FakeResponse()

    class FakeOpenAI:
        def __init__(self, *, timeout: float) -> None:
            del timeout
            self.responses = FakeResponses()

    class FakeOpenAIModule:
        OpenAI = FakeOpenAI

    monkeypatch.setenv("OPENAI_API_KEY", "openai-test-key")
    monkeypatch.setattr(
        "agent_runtime.planning.llm.import_module",
        lambda name: FakeOpenAIModule,
    )

    provider = OpenAILlmProvider(model="gpt-custom")

    assert provider.complete("user_input: 明天提醒我带电脑") == FakeResponse.output_text
    assert response_calls == [
        {
            "model": "gpt-custom",
            "instructions": provider.system_prompt,
            "input": "user_input: 明天提醒我带电脑",
        }
    ]
