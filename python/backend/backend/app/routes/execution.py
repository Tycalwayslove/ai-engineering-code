from fastapi import APIRouter, HTTPException
from orchestrator.types import AgentTurnResponse
from pydantic import BaseModel, Field

from backend.app.runtime import execution_coordinator, execution_store
from backend.app.services.execution_store import (
    ExecutionPlanNotFound,
    ExecutionPlanRecord,
    LedgerRecord,
)

router = APIRouter()


class ConfirmExecutionPlanRequest(BaseModel):
    confirm_token: str = Field(alias="confirmToken")
    action_ids: list[str] | None = Field(default=None, alias="actionIds")


@router.post("/execution-plans/{plan_id}/confirm")
def confirm_execution_plan(
    plan_id: str,
    request: ConfirmExecutionPlanRequest,
) -> AgentTurnResponse:
    try:
        return execution_coordinator.confirm_plan(
            plan_id=plan_id,
            confirm_token=request.confirm_token,
            action_ids=request.action_ids,
        )
    except ExecutionPlanNotFound as error:
        raise HTTPException(
            status_code=404,
            detail=f"execution plan not found: {error.plan_id}",
        ) from error
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/execution-plans/{plan_id}/reject")
def reject_execution_plan(plan_id: str) -> ExecutionPlanRecord:
    try:
        return execution_coordinator.reject_plan(plan_id)
    except ExecutionPlanNotFound as error:
        raise HTTPException(
            status_code=404,
            detail=f"execution plan not found: {error.plan_id}",
        ) from error
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.get("/execution-plans/{plan_id}")
def get_execution_plan(plan_id: str) -> ExecutionPlanRecord:
    try:
        return execution_store.get_plan(plan_id)
    except ExecutionPlanNotFound as error:
        raise HTTPException(
            status_code=404,
            detail=f"execution plan not found: {error.plan_id}",
        ) from error


@router.get("/execution-ledger")
def get_execution_ledger() -> list[LedgerRecord]:
    return execution_store.list_ledger()
