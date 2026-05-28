import importlib.util
import sys
from pathlib import Path
from typing import Any


def load_db_migrate_module() -> Any:
    script_path = Path(__file__).resolve().parents[3] / "scripts" / "db_migrate.py"
    spec = importlib.util.spec_from_file_location("db_migrate", script_path)
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules["db_migrate"] = module
    spec.loader.exec_module(module)
    return module


def test_migration_version_uses_numeric_prefix() -> None:
    db_migrate = load_db_migrate_module()

    assert (
        db_migrate.migration_version(
            Path("infra/db/migrations/0003_pending_clarifications.up.sql"),
        )
        == "0003"
    )


def test_build_migration_plan_skips_applied_and_baselines_existing_tables() -> None:
    db_migrate = load_db_migrate_module()
    migrations = [
        db_migrate.Migration(Path("0001_agent_execution_core.up.sql"), "0001", "hash1"),
        db_migrate.Migration(Path("0002_agent_planning_runtime.up.sql"), "0002", "hash2"),
        db_migrate.Migration(Path("0003_pending_clarifications.up.sql"), "0003", "hash3"),
    ]

    plan = db_migrate.build_migration_plan(
        migrations=migrations,
        applied_versions={"0001": "hash1"},
        existing_tables={
            "agent_events",
            "decision_traces",
            "summary_memories",
        },
    )

    assert [item.action for item in plan] == ["skip", "baseline", "apply"]
    assert [item.migration.version for item in plan] == ["0001", "0002", "0003"]


def test_build_migration_plan_fails_on_checksum_mismatch() -> None:
    db_migrate = load_db_migrate_module()
    migrations = [
        db_migrate.Migration(Path("0001_agent_execution_core.up.sql"), "0001", "new-hash"),
    ]

    try:
        db_migrate.build_migration_plan(
            migrations=migrations,
            applied_versions={"0001": "old-hash"},
            existing_tables=set(),
        )
    except ValueError as exc:
        assert "checksum mismatch" in str(exc)
    else:
        raise AssertionError("expected checksum mismatch")


def test_decision_trace_migrations_allow_current_planner_modes() -> None:
    root = Path(__file__).resolve().parents[3]
    migration_text = "\n".join(
        path.read_text(encoding="utf-8")
        for path in sorted((root / "infra" / "db" / "migrations").glob("*.up.sql"))
        if "agent_planning_runtime" in path.name
        or "planner_mode" in path.name
        or "decision_trace" in path.name
    )

    assert "'llm_first'" in migration_text
    assert "'pending_clarification'" in migration_text


def test_decision_trace_migrations_include_llm_call_observation_column() -> None:
    root = Path(__file__).resolve().parents[3]
    migration_text = "\n".join(
        path.read_text(encoding="utf-8")
        for path in sorted((root / "infra" / "db" / "migrations").glob("*.up.sql"))
        if "decision_trace" in path.name or "agent_planning_runtime" in path.name
    )

    assert "llm_call jsonb" in migration_text
