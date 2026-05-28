from datetime import date
from decimal import Decimal
from uuid import uuid4

import psycopg
from psycopg.rows import dict_row

from backend.app.domains.expense.models import (
    ExpenseRecord,
    ExpenseRecordUpdate,
    ExpenseStatus,
)
from backend.app.domains.expense.service import ExpenseDomainService
from backend.app.services.database import DatabaseSettings


class PostgresExpenseRecordRepository:
    def __init__(self, settings: DatabaseSettings) -> None:
        self._settings = settings

    def create_record(self, record: ExpenseRecord) -> ExpenseRecord:
        record_id = record.get("id") or f"expense_record_{uuid4().hex}"
        with self._connect() as connection:
            row = connection.execute(
                """
                insert into expense_records (
                  id,
                  title,
                  amount,
                  currency,
                  occurred_on,
                  status,
                  source_action_id
                )
                values (%s, %s, %s, %s, %s, %s, %s)
                on conflict (source_action_id) do update set
                  source_action_id = excluded.source_action_id
                returning id, title, amount, currency, occurred_on, status, source_action_id
                """,
                (
                    record_id,
                    record["title"],
                    record["amount"],
                    record["currency"],
                    record["occurredOn"],
                    record["status"],
                    record["sourceActionId"],
                ),
            ).fetchone()
        if row is None:
            raise RuntimeError("failed to create expense record")
        return self._record_from_row(row)

    def list_records(
        self, source_action_ids: set[str] | None = None
    ) -> list[ExpenseRecord]:
        if source_action_ids is not None and len(source_action_ids) == 0:
            return []

        source_filter = ""
        params: tuple[object, ...] = ()
        if source_action_ids is not None:
            source_filter = "where source_action_id = any(%s)"
            params = (list(source_action_ids),)

        with self._connect() as connection:
            rows = connection.execute(
                f"""
                select id, title, amount, currency, occurred_on, status, source_action_id
                from expense_records
                {source_filter}
                order by created_at, id
                """,
                params,
            ).fetchall()
        return [self._record_from_row(row) for row in rows]

    def get_record(self, record_id: str) -> ExpenseRecord:
        with self._connect() as connection:
            row = connection.execute(
                """
                select id, title, amount, currency, occurred_on, status, source_action_id
                from expense_records
                where id = %s
                """,
                (record_id,),
            ).fetchone()
        if row is None:
            raise KeyError(record_id)
        return self._record_from_row(row)

    def update_record_status(
        self,
        record_id: str,
        status: ExpenseStatus,
    ) -> ExpenseRecord:
        with self._connect() as connection:
            row = connection.execute(
                """
                update expense_records
                set status = %s
                where id = %s and status = 'draft' and %s in ('submitted', 'canceled')
                returning id, title, amount, currency, occurred_on, status, source_action_id
                """,
                (status, record_id, status),
            ).fetchone()
            if row is None:
                self._raise_status_error(connection, record_id)
        if row is None:
            raise KeyError(record_id)
        return self._record_from_row(row)

    def update_record(
        self,
        record_id: str,
        updates: ExpenseRecordUpdate,
    ) -> ExpenseRecord:
        with self._connect() as connection:
            row = connection.execute(
                """
                update expense_records
                set
                  title = coalesce(%s, title),
                  amount = coalesce(%s, amount),
                  currency = coalesce(%s, currency),
                  occurred_on = coalesce(%s, occurred_on)
                where id = %s and status = 'draft'
                returning id, title, amount, currency, occurred_on, status, source_action_id
                """,
                (
                    updates.get("title"),
                    updates.get("amount"),
                    updates.get("currency"),
                    updates.get("occurredOn"),
                    record_id,
                ),
            ).fetchone()
            if row is None:
                self._raise_update_error(connection, record_id)
        if row is None:
            raise KeyError(record_id)
        return self._record_from_row(row)

    def to_domain_service(self) -> ExpenseDomainService:
        return ExpenseDomainService(self)

    def _connect(self) -> psycopg.Connection[dict[str, object]]:
        return psycopg.connect(self._settings.url, row_factory=dict_row)

    def _raise_update_error(
        self, connection: psycopg.Connection[dict[str, object]], record_id: str
    ) -> None:
        row = connection.execute(
            "select status from expense_records where id = %s",
            (record_id,),
        ).fetchone()
        if row is None:
            raise KeyError(record_id)
        raise ValueError("expense is not editable")

    def _raise_status_error(
        self, connection: psycopg.Connection[dict[str, object]], record_id: str
    ) -> None:
        row = connection.execute(
            "select status from expense_records where id = %s",
            (record_id,),
        ).fetchone()
        if row is None:
            raise KeyError(record_id)
        raise ValueError("expense status cannot transition")

    def _record_from_row(self, row: dict[str, object]) -> ExpenseRecord:
        amount = row["amount"]
        occurred_on = row["occurred_on"]
        if not isinstance(amount, Decimal):
            raise TypeError("expense amount must be a Decimal")
        if not isinstance(occurred_on, date):
            raise TypeError("expense occurred_on must be a date")
        return {
            "id": str(row["id"]),
            "title": str(row["title"]),
            "amount": float(amount),
            "currency": str(row["currency"]),
            "occurredOn": occurred_on.isoformat(),
            "status": row["status"],  # type: ignore[typeddict-item]
            "sourceActionId": str(row["source_action_id"]),
        }
