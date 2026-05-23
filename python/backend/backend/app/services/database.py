from dataclasses import dataclass
from os import environ
from typing import Any

import psycopg


@dataclass(frozen=True)
class DatabaseSettings:
    url: str
    default_user_id: str = "local_user"


def get_database_settings() -> DatabaseSettings | None:
    url = environ.get("DATABASE_URL")
    if url is None or url.strip() == "":
        return None

    return DatabaseSettings(
        url=url,
        default_user_id=environ.get("AI_CODE_DEFAULT_USER_ID", "local_user"),
    )


def ensure_default_user(
    connection: psycopg.Connection[Any],
    settings: DatabaseSettings,
) -> None:
    connection.execute(
        """
        insert into users (id, display_name)
        values (%s, %s)
        on conflict (id) do nothing
        """,
        (settings.default_user_id, "Local User"),
    )


def ensure_conversation(
    connection: psycopg.Connection[Any],
    settings: DatabaseSettings,
    conversation_id: str,
) -> None:
    ensure_default_user(connection, settings)
    connection.execute(
        """
        insert into conversations (id, user_id)
        values (%s, %s)
        on conflict (id) do nothing
        """,
        (conversation_id, settings.default_user_id),
    )
