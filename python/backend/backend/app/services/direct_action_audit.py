import logging
from uuid import uuid4

from agent_runtime.memory.summary_memory import (
    SummaryMemory,
    SummaryMemoryRepository,
)

from backend.app.services.execution_store import (
    DomainActionRecord,
    ExecutionPlanRecord,
    ExecutionStore,
    RiskLevel,
)

LOGGER = logging.getLogger("uvicorn.error")


class DirectActionAuditService:
    def __init__(
        self,
        execution_store: ExecutionStore,
        summary_memory_repository: SummaryMemoryRepository | None = None,
    ) -> None:
        self._execution_store = execution_store
        self._summary_memory_repository = summary_memory_repository

    def require_source_action_in_conversation(
        self,
        *,
        conversation_id: str | None,
        source_action_id: str,
    ) -> None:
        if conversation_id is None or conversation_id.strip() == "":
            raise ValueError("conversationId is required for direct UI actions")
        action_ids = set(
            self._execution_store.list_action_ids_for_conversation(conversation_id)
        )
        if source_action_id not in action_ids:
            raise KeyError(source_action_id)

    def record_success(
        self,
        *,
        conversation_id: str | None,
        domain: str,
        action_type: str,
        summary: str,
        payload: dict[str, object],
        result: dict[str, object],
        risk_level: RiskLevel = "low",
    ) -> None:
        if conversation_id is None or conversation_id.strip() == "":
            raise ValueError("conversationId is required for direct UI actions")

        plan_id = f"direct_plan_{uuid4().hex}"
        action_id = f"direct_action_{uuid4().hex}"
        action: DomainActionRecord = {
            "id": action_id,
            "planId": plan_id,
            "domain": domain,
            "actionType": action_type,
            "status": "succeeded",
            "riskLevel": risk_level,
            "summary": summary,
            "payload": payload,
            "result": result,
        }
        plan: ExecutionPlanRecord = {
            "id": plan_id,
            "conversationId": conversation_id,
            "status": "succeeded",
            "riskLevel": risk_level,
            "summary": summary,
            "decisionTraceId": "direct_ui_action",
            "actions": [action],
            "confirmation": None,
        }
        self._execution_store.save_plan(plan)
        ledger = self._execution_store.append_ledger(
            plan_id=plan_id,
            event_type="direct_action_executed",
            status="succeeded",
            message="Direct UI action executed.",
            action_id=action_id,
        )
        self._save_summary_memory(
            conversation_id=conversation_id,
            action=action,
            source_event_id=ledger["id"],
        )

    def _save_summary_memory(
        self,
        *,
        conversation_id: str,
        action: DomainActionRecord,
        source_event_id: str,
    ) -> None:
        if self._summary_memory_repository is None:
            return
        payload: dict[str, object] = {
            "domain": action["domain"],
            "actionType": action["actionType"],
            "actionId": action["id"],
            "planId": action["planId"],
            "result": action.get("result", {}),
        }
        payload.update(self._result_fact_payload(action.get("result", {})))
        try:
            self._summary_memory_repository.save(
                SummaryMemory(
                    conversation_id=conversation_id,
                    memory_type="domain_fact",
                    summary=self._memory_summary(action),
                    payload=payload,
                    source_event_ids=[source_event_id],
                )
            )
        except Exception:
            LOGGER.warning(
                "Summary memory save failed; direct action audit is preserved. "
                "plan_id=%s action_id=%s action_type=%s conversation_id=%s",
                action["planId"],
                action["id"],
                action["actionType"],
                conversation_id,
                exc_info=True,
            )

    def _memory_summary(self, action: DomainActionRecord) -> str:
        status = self._result_status(action.get("result", {}))
        if status:
            return f"{action['summary']}；状态 {status}"
        return action["summary"]

    def _result_status(self, result: object) -> str:
        if not isinstance(result, dict):
            return ""
        for key in ("calendarEvent", "expenseRecord", "reminder"):
            value = result.get(key)
            if not isinstance(value, dict):
                continue
            status = value.get("status")
            if isinstance(status, str):
                return status
        return ""

    def _result_fact_payload(self, result: object) -> dict[str, object]:
        if not isinstance(result, dict):
            return {}
        for key in ("calendarEvent", "expenseRecord", "reminder"):
            value = result.get(key)
            if not isinstance(value, dict):
                continue
            payload: dict[str, object] = {}
            fact_id = value.get("id")
            if isinstance(fact_id, str):
                payload["factId"] = fact_id
            title = value.get("title")
            if isinstance(title, str):
                payload["factTitle"] = title
            status = value.get("status")
            if isinstance(status, str):
                payload["factStatus"] = status
            return payload
        return {}
