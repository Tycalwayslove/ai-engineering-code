#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import os
import re
from dataclasses import dataclass
from pathlib import Path

import psycopg

DEFAULT_DATABASE_URL = "postgresql://ai_code:ai_code@127.0.0.1:5432/ai_code"
MIGRATIONS_DIR = Path("infra/db/migrations")

BASELINE_TABLES_BY_VERSION = {
    "0001": {
        "users",
        "conversations",
        "conversation_turns",
        "execution_plans",
        "domain_actions",
        "confirmations",
        "confirmation_actions",
        "execution_ledger",
        "calendar_events",
        "expense_records",
        "reminders",
    },
    "0002": {
        "agent_events",
        "decision_traces",
        "summary_memories",
    },
    "0003": {
        "pending_clarifications",
    },
}


@dataclass(frozen=True)
class Migration:
    path: Path
    version: str
    checksum: str


@dataclass(frozen=True)
class MigrationPlanItem:
    migration: Migration
    action: str


def migration_version(path: Path) -> str:
    match = re.match(r"^(\d+)_.*\.up\.sql$", path.name)
    if match is None:
        raise ValueError(f"invalid migration filename: {path}")
    return match.group(1)


def discover_migrations(root: Path) -> list[Migration]:
    files = sorted(root.glob("*.up.sql"))
    return [
        Migration(
            path=path,
            version=migration_version(path),
            checksum=hashlib.sha256(path.read_bytes()).hexdigest(),
        )
        for path in files
    ]


def build_migration_plan(
    *,
    migrations: list[Migration],
    applied_versions: dict[str, str],
    existing_tables: set[str],
) -> list[MigrationPlanItem]:
    plan: list[MigrationPlanItem] = []
    for migration in migrations:
        applied_checksum = applied_versions.get(migration.version)
        if applied_checksum is not None:
            if applied_checksum != migration.checksum:
                raise ValueError(
                    f"migration {migration.version} checksum mismatch: "
                    f"database={applied_checksum} file={migration.checksum}",
                )
            plan.append(MigrationPlanItem(migration=migration, action="skip"))
            continue

        baseline_tables = BASELINE_TABLES_BY_VERSION.get(migration.version, set())
        if baseline_tables and baseline_tables.issubset(existing_tables):
            plan.append(MigrationPlanItem(migration=migration, action="baseline"))
            continue

        plan.append(MigrationPlanItem(migration=migration, action="apply"))
    return plan


def ensure_schema_migrations(connection: psycopg.Connection[object]) -> None:
    connection.execute(
        """
        create table if not exists schema_migrations (
          version text primary key,
          filename text not null,
          checksum text not null,
          applied_at timestamptz not null default now()
        )
        """,
    )


def load_applied_versions(connection: psycopg.Connection[object]) -> dict[str, str]:
    rows = connection.execute(
        "select version, checksum from schema_migrations order by version",
    ).fetchall()
    return {str(row[0]): str(row[1]) for row in rows}


def load_existing_tables(connection: psycopg.Connection[object]) -> set[str]:
    rows = connection.execute(
        """
        select tablename
        from pg_tables
        where schemaname = 'public'
        """,
    ).fetchall()
    return {str(row[0]) for row in rows}


def record_migration(
    connection: psycopg.Connection[object],
    migration: Migration,
) -> None:
    connection.execute(
        """
        insert into schema_migrations (version, filename, checksum)
        values (%s, %s, %s)
        on conflict (version) do update set
          filename = excluded.filename,
          checksum = excluded.checksum
        """,
        (migration.version, migration.path.name, migration.checksum),
    )


def apply_migration(
    connection: psycopg.Connection[object],
    migration: Migration,
) -> None:
    sql = migration.path.read_text(encoding="utf-8")
    connection.execute(sql)
    record_migration(connection, migration)


def run_migrations(
    *,
    database_url: str,
    migrations_dir: Path,
    dry_run: bool = False,
) -> list[MigrationPlanItem]:
    migrations = discover_migrations(migrations_dir)
    with psycopg.connect(database_url, autocommit=True) as connection:
        ensure_schema_migrations(connection)
        plan = build_migration_plan(
            migrations=migrations,
            applied_versions=load_applied_versions(connection),
            existing_tables=load_existing_tables(connection),
        )
        for item in plan:
            if item.action == "skip":
                print(f"skip {item.migration.version} {item.migration.path.name}")
            elif item.action == "baseline":
                print(f"baseline {item.migration.version} {item.migration.path.name}")
                if not dry_run:
                    record_migration(connection, item.migration)
            elif item.action == "apply":
                print(f"apply {item.migration.version} {item.migration.path.name}")
                if not dry_run:
                    apply_migration(connection, item.migration)
            else:
                raise ValueError(f"unsupported migration action: {item.action}")
    return plan


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Apply local Postgres migrations.")
    parser.add_argument(
        "--database-url",
        default=os.environ.get("DATABASE_URL", DEFAULT_DATABASE_URL),
        help="Postgres connection URL. Defaults to DATABASE_URL or local ai_code.",
    )
    parser.add_argument(
        "--migrations-dir",
        default=str(MIGRATIONS_DIR),
        help="Directory containing *.up.sql files.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print the migration plan without applying changes.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    run_migrations(
        database_url=args.database_url,
        migrations_dir=Path(args.migrations_dir),
        dry_run=args.dry_run,
    )


if __name__ == "__main__":
    main()
