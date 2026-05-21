from datetime import UTC, datetime
from typing import Literal, TypedDict

RiskLevel = Literal["low", "medium", "high"]


class ExecutionPlanNotFound(KeyError):
    def __init__(self, plan_id: str) -> None:
        super().__init__(plan_id)
        self.plan_id = plan_id


class DomainActionRecordRequired(TypedDict):
    id: str
    planId: str
    domain: str
    actionType: str
    status: str
    riskLevel: RiskLevel
    summary: str
    payload: dict[str, object]


class DomainActionRecord(DomainActionRecordRequired, total=False):
    result: dict[str, object]


class ConfirmationRecord(TypedDict):
    id: str
    planId: str
    status: str
    requiredActionIds: list[str]
    title: str
    description: str
    confirmToken: str


class ExecutionPlanRecord(TypedDict):
    id: str
    conversationId: str
    status: str
    riskLevel: RiskLevel
    summary: str
    decisionTraceId: str
    actions: list[DomainActionRecord]
    confirmation: ConfirmationRecord | None


class LedgerRecordRequired(TypedDict):
    id: str
    planId: str
    eventType: str
    status: str
    message: str
    createdAt: str


class LedgerRecord(LedgerRecordRequired, total=False):
    actionId: str


class InMemoryExecutionStore:
    def __init__(self) -> None:
        self._plans: dict[str, ExecutionPlanRecord] = {}
        self._ledger: list[LedgerRecord] = []

    def save_plan(self, plan: ExecutionPlanRecord) -> ExecutionPlanRecord:
        self._plans[plan["id"]] = plan
        return plan

    def get_plan(self, plan_id: str) -> ExecutionPlanRecord:
        try:
            return self._plans[plan_id]
        except KeyError as error:
            raise ExecutionPlanNotFound(plan_id) from error

    def list_ledger(self) -> list[LedgerRecord]:
        return self._ledger

    def append_ledger(
        self,
        plan_id: str,
        event_type: str,
        status: str,
        message: str,
        action_id: str | None = None,
    ) -> LedgerRecord:
        record: LedgerRecord = {
            "id": f"ledger_{len(self._ledger) + 1}",
            "planId": plan_id,
            "eventType": event_type,
            "status": status,
            "message": message,
            "createdAt": datetime.now(UTC).isoformat(),
        }
        if action_id is not None:
            record["actionId"] = action_id
        self._ledger.append(record)
        return record
