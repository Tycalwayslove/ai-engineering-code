from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from backend.app.domains.expense.models import ExpenseRecord
from backend.app.runtime import direct_action_auditor, execution_store, expense_service

router = APIRouter(prefix="/expenses")


class ExpenseUpdateRequest(BaseModel):
    title: str | None = None
    amount: object | None = None
    currency: str | None = None
    occurredOn: str | None = None


@router.get("")
def get_expenses(
    conversation_id: str | None = Query(default=None, alias="conversationId"),
) -> list[ExpenseRecord]:
    source_action_ids = _source_action_ids_for_conversation(conversation_id)
    return expense_service.list_records(source_action_ids=source_action_ids)


@router.patch("/{expense_id}")
def update_expense(
    expense_id: str,
    request: ExpenseUpdateRequest,
    conversation_id: str | None = Query(default=None, alias="conversationId"),
) -> ExpenseRecord:
    try:
        existing = expense_service.get_record(expense_id)
        direct_action_auditor.require_source_action_in_conversation(
            conversation_id=conversation_id,
            source_action_id=existing["sourceActionId"],
        )
        patch = request.model_dump(exclude_unset=True)
        expense = expense_service.update_record(
            expense_id,
            patch,
        )
        direct_action_auditor.record_success(
            conversation_id=conversation_id,
            domain="expense",
            action_type="expense.update_reimbursement",
            summary=f"更新费用：{expense['title']}",
            payload={"target_id": expense_id, "patch": patch},
            result={"expenseRecord": expense},
        )
        return expense
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="expense not found") from exc


@router.post("/{expense_id}/submit")
def submit_expense(
    expense_id: str,
    conversation_id: str | None = Query(default=None, alias="conversationId"),
) -> ExpenseRecord:
    try:
        existing = expense_service.get_record(expense_id)
        direct_action_auditor.require_source_action_in_conversation(
            conversation_id=conversation_id,
            source_action_id=existing["sourceActionId"],
        )
        expense = expense_service.submit_record(expense_id)
        direct_action_auditor.record_success(
            conversation_id=conversation_id,
            domain="expense",
            action_type="expense.submit_reimbursement",
            summary=f"提交费用：{expense['title']}",
            payload={"target_id": expense_id},
            result={"expenseRecord": expense},
        )
        return expense
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="expense not found") from exc


@router.post("/{expense_id}/cancel")
def cancel_expense(
    expense_id: str,
    conversation_id: str | None = Query(default=None, alias="conversationId"),
) -> ExpenseRecord:
    try:
        existing = expense_service.get_record(expense_id)
        direct_action_auditor.require_source_action_in_conversation(
            conversation_id=conversation_id,
            source_action_id=existing["sourceActionId"],
        )
        expense = expense_service.cancel_record(expense_id)
        direct_action_auditor.record_success(
            conversation_id=conversation_id,
            domain="expense",
            action_type="expense.cancel_reimbursement",
            summary=f"取消费用：{expense['title']}",
            payload={"target_id": expense_id},
            result={"expenseRecord": expense},
        )
        return expense
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="expense not found") from exc


def _source_action_ids_for_conversation(
    conversation_id: str | None,
) -> set[str] | None:
    if conversation_id is None:
        return None
    return set(execution_store.list_action_ids_for_conversation(conversation_id))
