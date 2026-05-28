from datetime import UTC, datetime, timedelta
from hashlib import sha256
from uuid import uuid4

import psycopg
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb

from backend.app.services.database import DatabaseSettings, ensure_conversation
from backend.app.services.execution_store import (
    ConfirmationRecord,
    DomainActionRecord,
    ExecutionPlanNotFound,
    ExecutionPlanRecord,
    LedgerRecord,
)


class PostgresExecutionStore:
    def __init__(self, settings: DatabaseSettings) -> None:
        self._settings = settings

    def save_plan(self, plan: ExecutionPlanRecord) -> ExecutionPlanRecord:
        with self._connect() as connection:
            with connection.transaction():
                ensure_conversation(connection, self._settings, plan["conversationId"])
                connection.execute(
                    """
                    insert into execution_plans (
                      id,
                      conversation_id,
                      status,
                      risk_level,
                      summary,
                      decision_trace_id
                    )
                    values (%s, %s, %s, %s, %s, %s)
                    on conflict (id) do update set
                      status = excluded.status,
                      risk_level = excluded.risk_level,
                      summary = excluded.summary,
                      decision_trace_id = excluded.decision_trace_id
                    """,
                    (
                        plan["id"],
                        plan["conversationId"],
                        plan["status"],
                        plan["riskLevel"],
                        plan["summary"],
                        plan["decisionTraceId"],
                    ),
                )
                for action in plan["actions"]:
                    self._save_action(connection, action)
                if plan["confirmation"] is not None:
                    self._save_confirmation(connection, plan["confirmation"])

        return plan

    def get_plan(self, plan_id: str) -> ExecutionPlanRecord:
        with self._connect() as connection:
            plan = connection.execute(
                """
                select id, conversation_id, status, risk_level, summary, decision_trace_id
                from execution_plans
                where id = %s
                """,
                (plan_id,),
            ).fetchone()
            if plan is None:
                raise ExecutionPlanNotFound(plan_id)

            actions = [
                self._action_from_row(row)
                for row in connection.execute(
                    """
                    select id, plan_id, domain, action_type, status, risk_level, summary,
                      payload, result
                    from domain_actions
                    where plan_id = %s
                    order by created_at, id
                    """,
                    (plan_id,),
                ).fetchall()
            ]
            confirmation = self._get_confirmation(connection, plan_id)

        return {
            "id": str(plan["id"]),
            "conversationId": str(plan["conversation_id"]),
            "status": str(plan["status"]),
            "riskLevel": plan["risk_level"],  # type: ignore[typeddict-item]
            "summary": str(plan["summary"]),
            "decisionTraceId": str(plan["decision_trace_id"]),
            "actions": actions,
            "confirmation": confirmation,
        }

    def list_pending_plans_for_conversation(
        self,
        conversation_id: str,
    ) -> list[ExecutionPlanRecord]:
        with self._connect() as connection:
            rows = connection.execute(
                """
                select id
                from execution_plans
                where conversation_id = %s and status = 'awaiting_confirmation'
                order by created_at, id
                """,
                (conversation_id,),
            ).fetchall()

        pending_plans: list[ExecutionPlanRecord] = []
        for row in rows:
            plan = self.get_plan(str(row["id"]))
            confirmation = plan["confirmation"]
            if confirmation is None or confirmation["status"] != "pending":
                continue
            confirmation["confirmToken"] = self._issue_recovery_confirm_token(
                plan_id=plan["id"],
                confirmation_id=confirmation["id"],
            )
            pending_plans.append(plan)
        return pending_plans

    def list_action_ids_for_conversation(self, conversation_id: str) -> list[str]:
        with self._connect() as connection:
            rows = connection.execute(
                """
                select domain_actions.id
                from domain_actions
                join execution_plans on execution_plans.id = domain_actions.plan_id
                where execution_plans.conversation_id = %s
                order by domain_actions.created_at, domain_actions.id
                """,
                (conversation_id,),
            ).fetchall()
        return [str(row["id"]) for row in rows]

    def list_ledger(self, conversation_id: str | None = None) -> list[LedgerRecord]:
        if conversation_id is not None:
            return self._list_ledger_for_conversation(conversation_id)

        with self._connect() as connection:
            rows = connection.execute(
                """
                select id, plan_id, action_id, event_type, status, message, created_at
                from execution_ledger
                order by created_at, id
                """
            ).fetchall()
        return [self._ledger_from_row(row) for row in rows]

    def _list_ledger_for_conversation(self, conversation_id: str) -> list[LedgerRecord]:
        with self._connect() as connection:
            rows = connection.execute(
                """
                select execution_ledger.id, execution_ledger.plan_id,
                  execution_ledger.action_id, execution_ledger.event_type,
                  execution_ledger.status, execution_ledger.message,
                  execution_ledger.created_at
                from execution_ledger
                join execution_plans on execution_plans.id = execution_ledger.plan_id
                where execution_plans.conversation_id = %s
                order by execution_ledger.created_at, execution_ledger.id
                """,
                (conversation_id,),
            ).fetchall()
        return [self._ledger_from_row(row) for row in rows]

    def append_ledger(
        self,
        plan_id: str,
        event_type: str,
        status: str,
        message: str,
        action_id: str | None = None,
    ) -> LedgerRecord:
        record_id = f"ledger_{uuid4().hex}"
        with self._connect() as connection:
            row = connection.execute(
                """
                insert into execution_ledger (id, plan_id, action_id, event_type, status, message)
                values (%s, %s, %s, %s, %s, %s)
                returning id, plan_id, action_id, event_type, status, message, created_at
                """,
                (record_id, plan_id, action_id, event_type, status, message),
            ).fetchone()
        if row is None:
            raise RuntimeError("failed to append execution ledger")
        return self._ledger_from_row(row)

    def verify_confirm_token(self, plan_id: str, confirm_token: str) -> bool:
        with self._connect() as connection:
            row = connection.execute(
                """
                select 1
                from confirmations
                where plan_id = %s and confirm_token_hash = %s
                """,
                (plan_id, self._hash_token(confirm_token)),
            ).fetchone()
            if row is not None:
                return True

            session = connection.execute(
                """
                select 1
                from confirmation_token_sessions
                where plan_id = %s
                  and confirm_token_hash = %s
                  and status = 'active'
                  and expires_at > now()
                """,
                (plan_id, self._hash_token(confirm_token)),
            ).fetchone()
        return session is not None

    def _issue_recovery_confirm_token(
        self,
        plan_id: str,
        confirmation_id: str,
    ) -> str:
        token = f"confirm_{uuid4().hex}"
        expires_at = datetime.now(UTC) + timedelta(minutes=30)
        with self._connect() as connection:
            connection.execute(
                """
                insert into confirmation_token_sessions (
                  id,
                  confirmation_id,
                  plan_id,
                  confirm_token_hash,
                  expires_at
                )
                values (%s, %s, %s, %s, %s)
                """,
                (
                    f"confirmation_token_{uuid4().hex}",
                    confirmation_id,
                    plan_id,
                    self._hash_token(token),
                    expires_at,
                ),
            )
        return token

    def _connect(self) -> psycopg.Connection[dict[str, object]]:
        return psycopg.connect(self._settings.url, row_factory=dict_row)

    def _save_action(
        self,
        connection: psycopg.Connection[dict[str, object]],
        action: DomainActionRecord,
    ) -> None:
        connection.execute(
            """
            insert into domain_actions (
              id,
              plan_id,
              domain,
              action_type,
              status,
              risk_level,
              summary,
              payload,
              result,
              idempotency_key
            )
            values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            on conflict (id) do update set
              status = excluded.status,
              risk_level = excluded.risk_level,
              summary = excluded.summary,
              payload = excluded.payload,
              result = excluded.result
            """,
            (
                action["id"],
                action["planId"],
                action["domain"],
                action["actionType"],
                action["status"],
                action["riskLevel"],
                action["summary"],
                Jsonb(action["payload"]),
                Jsonb(action["result"]) if "result" in action else None,
                action["id"],
            ),
        )

    def _save_confirmation(
        self,
        connection: psycopg.Connection[dict[str, object]],
        confirmation: ConfirmationRecord,
    ) -> None:
        connection.execute(
            """
            insert into confirmations (
              id,
              plan_id,
              status,
              title,
              description,
              confirm_token_hash,
              confirmed_at,
              rejected_at
            )
            values (%s, %s, %s, %s, %s, %s, %s, %s)
            on conflict (id) do update set
              status = excluded.status,
              title = excluded.title,
              description = excluded.description,
              confirmed_at = excluded.confirmed_at,
              rejected_at = excluded.rejected_at
            """,
            (
                confirmation["id"],
                confirmation["planId"],
                confirmation["status"],
                confirmation["title"],
                confirmation["description"],
                self._hash_token(confirmation["confirmToken"]),
                self._status_timestamp(confirmation["status"], "confirmed"),
                self._status_timestamp(confirmation["status"], "rejected"),
            ),
        )
        for action_id in confirmation["requiredActionIds"]:
            connection.execute(
                """
                insert into confirmation_actions (plan_id, confirmation_id, action_id)
                values (%s, %s, %s)
                on conflict (confirmation_id, action_id) do nothing
                """,
                (confirmation["planId"], confirmation["id"], action_id),
            )

    def _get_confirmation(
        self,
        connection: psycopg.Connection[dict[str, object]],
        plan_id: str,
    ) -> ConfirmationRecord | None:
        row = connection.execute(
            """
            select id, plan_id, status, title, description
            from confirmations
            where plan_id = %s
            order by created_at desc
            limit 1
            """,
            (plan_id,),
        ).fetchone()
        if row is None:
            return None

        actions = connection.execute(
            """
            select action_id
            from confirmation_actions
            where confirmation_id = %s
            order by created_at, action_id
            """,
            (row["id"],),
        ).fetchall()
        return {
            "id": str(row["id"]),
            "planId": str(row["plan_id"]),
            "status": str(row["status"]),
            "requiredActionIds": [str(action["action_id"]) for action in actions],
            "title": str(row["title"]),
            "description": str(row["description"]),
            "confirmToken": "redacted",
        }

    def _action_from_row(self, row: dict[str, object]) -> DomainActionRecord:
        action: DomainActionRecord = {
            "id": str(row["id"]),
            "planId": str(row["plan_id"]),
            "domain": row["domain"],  # type: ignore[typeddict-item]
            "actionType": row["action_type"],  # type: ignore[typeddict-item]
            "status": str(row["status"]),
            "riskLevel": row["risk_level"],  # type: ignore[typeddict-item]
            "summary": str(row["summary"]),
            "payload": self._json_object(row["payload"]),
        }
        if row["result"] is not None:
            action["result"] = self._json_object(row["result"])
        return action

    def _ledger_from_row(self, row: dict[str, object]) -> LedgerRecord:
        created_at = row["created_at"]
        if not isinstance(created_at, datetime):
            raise TypeError("execution ledger created_at must be a datetime")
        record: LedgerRecord = {
            "id": str(row["id"]),
            "planId": str(row["plan_id"]),
            "eventType": str(row["event_type"]),
            "status": str(row["status"]),
            "message": str(row["message"]),
            "createdAt": created_at.isoformat(),
        }
        if row["action_id"] is not None:
            record["actionId"] = str(row["action_id"])
        return record

    def _json_object(self, value: object) -> dict[str, object]:
        if not isinstance(value, dict):
            raise TypeError("expected JSON object from Postgres")
        return dict(value)

    def _hash_token(self, confirm_token: str) -> str:
        return sha256(confirm_token.encode("utf-8")).hexdigest()

    def _status_timestamp(self, status: str, expected: str) -> datetime | None:
        return datetime.now().astimezone() if status == expected else None
