from datetime import UTC, datetime
from typing import Literal, Protocol, TypedDict
from uuid import uuid4

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


class ExecutionStore(Protocol):
    def save_plan(self, plan: ExecutionPlanRecord) -> ExecutionPlanRecord: ...

    def get_plan(self, plan_id: str) -> ExecutionPlanRecord: ...

    def list_pending_plans_for_conversation(
        self,
        conversation_id: str,
    ) -> list[ExecutionPlanRecord]: ...

    def list_action_ids_for_conversation(self, conversation_id: str) -> list[str]: ...

    def list_ledger(self, conversation_id: str | None = None) -> list[LedgerRecord]: ...

    def append_ledger(
        self,
        plan_id: str,
        event_type: str,
        status: str,
        message: str,
        action_id: str | None = None,
    ) -> LedgerRecord: ...

    def verify_confirm_token(self, plan_id: str, confirm_token: str) -> bool: ...


class InMemoryExecutionStore:
    def __init__(self) -> None:
        self._plans: dict[str, ExecutionPlanRecord] = {}
        self._ledger: list[LedgerRecord] = []
        self._confirm_tokens_by_plan_id: dict[str, set[str]] = {}

    def save_plan(self, plan: ExecutionPlanRecord) -> ExecutionPlanRecord:
        self._plans[plan["id"]] = plan
        confirmation = plan["confirmation"]
        if confirmation is not None and confirmation["confirmToken"] != "redacted":
            self._confirm_tokens_by_plan_id.setdefault(plan["id"], set()).add(
                confirmation["confirmToken"],
            )
        return plan

    def get_plan(self, plan_id: str) -> ExecutionPlanRecord:
        try:
            return self._plans[plan_id]
        except KeyError as error:
            raise ExecutionPlanNotFound(plan_id) from error

    def list_pending_plans_for_conversation(
        self,
        conversation_id: str,
    ) -> list[ExecutionPlanRecord]:
        plans = [
            plan
            for plan in self._plans.values()
            if plan["conversationId"] == conversation_id
            and plan["status"] == "awaiting_confirmation"
            and plan["confirmation"] is not None
            and plan["confirmation"]["status"] == "pending"
        ]
        for plan in plans:
            confirmation = plan["confirmation"]
            if confirmation is None:
                continue
            recovery_token = f"confirm_{uuid4().hex}"
            self._confirm_tokens_by_plan_id.setdefault(plan["id"], set()).add(
                recovery_token,
            )
            confirmation["confirmToken"] = recovery_token
        return plans

    def list_action_ids_for_conversation(self, conversation_id: str) -> list[str]:
        return [
            action["id"]
            for plan in self._plans.values()
            if plan["conversationId"] == conversation_id
            for action in plan["actions"]
        ]

    def list_ledger(self, conversation_id: str | None = None) -> list[LedgerRecord]:
        if conversation_id is None:
            return self._ledger
        plan_ids = {
            plan["id"]
            for plan in self._plans.values()
            if plan["conversationId"] == conversation_id
        }
        return [record for record in self._ledger if record["planId"] in plan_ids]

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

    def verify_confirm_token(self, plan_id: str, confirm_token: str) -> bool:
        confirmation = self.get_plan(plan_id)["confirmation"]
        return confirmation is not None and confirm_token in self._confirm_tokens_by_plan_id.get(
            plan_id,
            set(),
        )
