from __future__ import annotations

import importlib.util
import sys
from pathlib import Path
from types import ModuleType

import pytest

ROOT_DIR = Path(__file__).resolve().parents[3]
SCRIPT_PATH = ROOT_DIR / "scripts" / "validate_llm_smoke.py"

spec = importlib.util.spec_from_file_location("validate_llm_smoke", SCRIPT_PATH)
assert spec is not None
assert spec.loader is not None
validate_llm_smoke = importlib.util.module_from_spec(spec)
assert isinstance(validate_llm_smoke, ModuleType)
sys.modules[spec.name] = validate_llm_smoke
spec.loader.exec_module(validate_llm_smoke)


def test_llm_smoke_requires_provider_api_key(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("AI_CODE_LOAD_ENV_LOCAL", "0")
    monkeypatch.delenv("AI_PLANNER_PROVIDER", raising=False)
    monkeypatch.delenv("DEEPSEEK_API_KEY", raising=False)
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)

    with pytest.raises(RuntimeError, match="DEEPSEEK_API_KEY 或 OPENAI_API_KEY"):
        validate_llm_smoke.configure_llm_smoke_environment()


def test_llm_smoke_main_configures_llm_first_provider(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    calls: list[tuple[object, str]] = []

    class FakeClient:
        pass

    def fake_build_client() -> FakeClient:
        return FakeClient()

    def fake_run_llm_smoke(client: object, *, provider: str) -> None:
        calls.append((client, provider))

    monkeypatch.setenv("AI_CODE_LOAD_ENV_LOCAL", "0")
    monkeypatch.setenv("AI_PLANNER_PROVIDER", "deepseek")
    monkeypatch.setenv("DEEPSEEK_API_KEY", "test-key")
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.setattr(validate_llm_smoke, "build_client", fake_build_client)
    monkeypatch.setattr(validate_llm_smoke, "run_llm_smoke", fake_run_llm_smoke)

    validate_llm_smoke.main([])

    assert len(calls) == 1
    assert calls[0][1] == "deepseek"
    assert validate_llm_smoke.os.environ["AI_PLANNER_MODE"] == "llm_first"
    assert validate_llm_smoke.os.environ["AI_PLANNER_PROVIDER"] == "deepseek"


def test_llm_smoke_defaults_to_in_memory_after_loading_local_env(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.delenv("AI_CODE_LOAD_ENV_LOCAL", raising=False)
    monkeypatch.delenv("AI_CODE_LLM_SMOKE_USE_DATABASE", raising=False)
    monkeypatch.setenv("AI_PLANNER_PROVIDER", "deepseek")
    monkeypatch.setenv("DEEPSEEK_API_KEY", "test-key")
    monkeypatch.setenv(
        "DATABASE_URL",
        "postgresql://ai_code:wrong-password@127.0.0.1:5432/ai_code",
    )

    validate_llm_smoke.configure_llm_smoke_environment()

    assert validate_llm_smoke.os.environ["DATABASE_URL"] == ""
    assert validate_llm_smoke.os.environ["AI_CODE_LOAD_ENV_LOCAL"] == "0"
