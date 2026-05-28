from pathlib import Path

import pytest
from agent_runtime.context.types import ContextPack
from agent_runtime.planning.llm import (
    DeepSeekLlmProvider,
    LlmFirstPlanningEngine,
    LlmPlanningEngine,
    OpenAILlmProvider,
)
from agent_runtime.planning.rule_based import RuleBasedPlanningEngine
from agent_runtime.planning.types import PlanningInput
from backend.app.bootstrap import create_llm_provider, create_planning_engine


def test_planner_mode_defaults_to_llm_first(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    monkeypatch.chdir(tmp_path)
    monkeypatch.delenv("AI_PLANNER_MODE", raising=False)

    assert isinstance(create_planning_engine(), LlmFirstPlanningEngine)


def test_llm_provider_defaults_to_openai(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    monkeypatch.chdir(tmp_path)
    monkeypatch.delenv("AI_PLANNER_PROVIDER", raising=False)

    assert isinstance(create_llm_provider(), OpenAILlmProvider)


def test_llm_provider_can_select_deepseek(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("AI_PLANNER_PROVIDER", "deepseek")
    monkeypatch.setenv("AI_PLANNER_MODEL", "deepseek-next")

    provider = create_llm_provider()

    assert isinstance(provider, DeepSeekLlmProvider)
    assert provider.model == "deepseek-next"


def test_llm_provider_can_select_openai(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("AI_PLANNER_PROVIDER", "openai")
    monkeypatch.setenv("AI_PLANNER_MODEL", "gpt-next")

    provider = create_llm_provider()

    assert isinstance(provider, OpenAILlmProvider)
    assert provider.model == "gpt-next"


def test_llm_provider_loads_env_local_from_working_directory(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    monkeypatch.chdir(tmp_path)
    monkeypatch.setenv("AI_CODE_LOAD_ENV_LOCAL", "1")
    monkeypatch.delenv("AI_PLANNER_PROVIDER", raising=False)
    monkeypatch.delenv("AI_PLANNER_MODEL", raising=False)
    monkeypatch.delenv("DEEPSEEK_API_KEY", raising=False)
    tmp_path.joinpath(".env.local").write_text(
        "\n".join(
            [
                "AI_PLANNER_PROVIDER=deepseek",
                "AI_PLANNER_MODEL=deepseek-from-env-local",
                "DEEPSEEK_API_KEY=deepseek-local-key",
            ],
        ),
        encoding="utf-8",
    )

    provider = create_llm_provider()

    assert isinstance(provider, DeepSeekLlmProvider)
    assert provider.model == "deepseek-from-env-local"


def test_env_local_does_not_override_explicit_environment(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    monkeypatch.chdir(tmp_path)
    monkeypatch.setenv("AI_CODE_LOAD_ENV_LOCAL", "1")
    monkeypatch.setenv("AI_PLANNER_PROVIDER", "openai")
    monkeypatch.setenv("AI_PLANNER_MODEL", "gpt-from-shell")
    tmp_path.joinpath(".env.local").write_text(
        "\n".join(
            [
                "AI_PLANNER_PROVIDER=deepseek",
                "AI_PLANNER_MODEL=deepseek-from-env-local",
                "DEEPSEEK_API_KEY=deepseek-local-key",
            ],
        ),
        encoding="utf-8",
    )

    provider = create_llm_provider()

    assert isinstance(provider, OpenAILlmProvider)
    assert provider.model == "gpt-from-shell"


def test_llm_provider_rejects_unknown_value(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("AI_PLANNER_PROVIDER", "claude")

    with pytest.raises(ValueError, match="unsupported AI_PLANNER_PROVIDER"):
        create_llm_provider()


def test_default_llm_first_falls_back_without_openai_key(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    monkeypatch.chdir(tmp_path)
    monkeypatch.delenv("AI_PLANNER_MODE", raising=False)
    monkeypatch.delenv("AI_PLANNER_PROVIDER", raising=False)
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    planner = create_planning_engine()

    result = planner.plan(
        PlanningInput(
            conversation_id="conversation_001",
            text="明天上午九点提醒我带电脑",
            now="2026-05-21T09:00:00+08:00",
            timezone="Asia/Shanghai",
        ),
        ContextPack.empty(),
    )

    assert result.kind == "plan_candidate"
    assert result.planner_mode == "llm_first"
    assert result.fallback_reason == "rule_safety_deterministic: reminder.create_reminder"
    assert result.candidate is not None
    assert result.candidate.proposed_actions[0].action_type == "reminder.create_reminder"


def test_planner_mode_can_select_rule(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("AI_PLANNER_MODE", "rule")

    assert isinstance(create_planning_engine(), RuleBasedPlanningEngine)


def test_planner_mode_can_select_llm_mock(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("AI_PLANNER_MODE", "llm_mock")

    assert isinstance(create_planning_engine(), LlmPlanningEngine)


def test_planner_mode_can_select_llm_first(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("AI_PLANNER_MODE", "llm_first")

    assert isinstance(create_planning_engine(), LlmFirstPlanningEngine)


def test_planner_mode_rejects_unknown_value(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("AI_PLANNER_MODE", "surprise")

    with pytest.raises(ValueError, match="unsupported AI_PLANNER_MODE"):
        create_planning_engine()
