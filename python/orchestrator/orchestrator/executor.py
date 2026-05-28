import logging

from agent_runtime.memory.summary_memory import (
    SummaryMemory,
    SummaryMemoryRepository,
)
from backend.app.domains.calendar.service import CalendarDomainService
from backend.app.domains.expense.service import ExpenseDomainService
from backend.app.domains.reminder.service import ReminderDomainService
from backend.app.services.execution_store import (
    DomainActionRecord,
    ExecutionPlanRecord,
    ExecutionStore,
)

from orchestrator.execution.handlers import (
    CalendarCancelEventHandler,
    CalendarCreateEventHandler,
    CalendarUpdateEventHandler,
    ExpenseCancelHandler,
    ExpenseDraftHandler,
    ExpenseSubmitHandler,
    ExpenseUpdateHandler,
    ReminderCancelHandler,
    ReminderCompleteHandler,
    ReminderCreateHandler,
    ReminderUpdateHandler,
)
from orchestrator.execution.registry import ActionHandlerRegistry
from orchestrator.execution.runner import ExecutionRunner
from orchestrator.types import AgentTurnResponse

LOGGER = logging.getLogger("uvicorn.error")


class ExecutionCoordinator:
    def __init__(
        self,
        store: ExecutionStore,
        calendar_service: CalendarDomainService,
        expense_service: ExpenseDomainService,
        reminder_service: ReminderDomainService,
        execution_runner: ExecutionRunner | None = None,
        summary_memory_repository: SummaryMemoryRepository | None = None,
    ) -> None:
        self._store = store
        self._summary_memory_repository = summary_memory_repository
        self._execution_runner = execution_runner or self._build_execution_runner(
            calendar_service=calendar_service,
            expense_service=expense_service,
            reminder_service=reminder_service,
        )

    def _build_execution_runner(
        self,
        calendar_service: CalendarDomainService,
        expense_service: ExpenseDomainService,
        reminder_service: ReminderDomainService,
    ) -> ExecutionRunner:
        registry = ActionHandlerRegistry()
        registry.register(
            "calendar.create_event",
            CalendarCreateEventHandler(calendar_service),
        )
        registry.register(
            "calendar.cancel_event",
            CalendarCancelEventHandler(calendar_service),
        )
        registry.register(
            "calendar.update_event",
            CalendarUpdateEventHandler(calendar_service),
        )
        registry.register(
            "expense.create_reimbursement_draft",
            ExpenseDraftHandler(expense_service),
        )
        registry.register(
            "expense.submit_reimbursement",
            ExpenseSubmitHandler(expense_service),
        )
        registry.register(
            "expense.cancel_reimbursement",
            ExpenseCancelHandler(expense_service),
        )
        registry.register(
            "expense.update_reimbursement",
            ExpenseUpdateHandler(expense_service),
        )
        registry.register(
            "reminder.create_reminder",
            ReminderCreateHandler(reminder_service),
        )
        registry.register(
            "reminder.complete_reminder",
            ReminderCompleteHandler(reminder_service),
        )
        registry.register(
            "reminder.cancel_reminder",
            ReminderCancelHandler(reminder_service),
        )
        registry.register(
            "reminder.update_reminder",
            ReminderUpdateHandler(reminder_service),
        )
        return ExecutionRunner(registry)

    def confirm_plan(
        self,
        plan_id: str,
        confirm_token: str,
        action_ids: list[str] | None = None,
    ) -> AgentTurnResponse:
        plan = self._store.get_plan(plan_id)
        if plan["status"] == "succeeded" and self._store.verify_confirm_token(
            plan_id,
            confirm_token,
        ):
            return {
                "kind": "execution_result",
                "conversationId": plan["conversationId"],
                "plan": plan,
            }
        if plan["status"] != "awaiting_confirmation":
            raise ValueError("only awaiting confirmation plans can be confirmed")

        confirmation = plan["confirmation"]
        if confirmation is None:
            raise ValueError("confirmation is required")
        if not self._store.verify_confirm_token(plan_id, confirm_token):
            raise ValueError("confirm token is invalid")
        if confirmation["status"] != "pending":
            raise ValueError("confirmation is not pending")

        required_action_ids = set(confirmation["requiredActionIds"])
        selected_action_ids = set(
            confirmation["requiredActionIds"] if action_ids is None else action_ids
        )
        known_action_ids = {action["id"] for action in plan["actions"]}
        unknown_action_ids = sorted(selected_action_ids - known_action_ids)
        if unknown_action_ids:
            raise ValueError(f"unknown action ids: {', '.join(unknown_action_ids)}")
        if selected_action_ids != required_action_ids:
            raise ValueError("partial action confirmation is not supported")

        non_pending_action_ids = sorted(
            action["id"]
            for action in plan["actions"]
            if action["id"] in selected_action_ids
            and action["status"] != "awaiting_confirmation"
        )
        if non_pending_action_ids:
            raise ValueError(
                f"actions are not awaiting confirmation: {', '.join(non_pending_action_ids)}"
            )

        plan["status"] = "executing"
        confirmation["status"] = "confirmed"

        for action in plan["actions"]:
            if action["id"] not in selected_action_ids:
                continue
            self._execute_action(plan, action)

        failed_actions = [action for action in plan["actions"] if action["status"] == "failed"]
        plan["status"] = "failed" if failed_actions else "succeeded"
        self._store.save_plan(plan)
        return {
            "kind": "execution_result",
            "conversationId": plan["conversationId"],
            "plan": plan,
        }

    def reject_plan(self, plan_id: str) -> ExecutionPlanRecord:
        plan = self._store.get_plan(plan_id)
        if plan["status"] != "awaiting_confirmation":
            raise ValueError("only awaiting confirmation plans can be rejected")

        plan["status"] = "rejected"
        if plan["confirmation"] is not None:
            plan["confirmation"]["status"] = "rejected"
        for action in plan["actions"]:
            action["status"] = "rejected"

        self._store.save_plan(plan)
        self._store.append_ledger(
            plan_id=plan_id,
            event_type="plan_rejected",
            status="info",
            message="Execution plan rejected.",
        )
        return plan

    def _execute_action(
        self,
        plan: ExecutionPlanRecord,
        action: DomainActionRecord,
    ) -> None:
        action["status"] = "executing"
        result = self._execution_runner.execute_action(action)
        if result.status == "failed":
            action["status"] = "failed"
            self._store.append_ledger(
                plan_id=plan["id"],
                event_type="action_failed",
                status="failed",
                message=result.error or "Action failed.",
                action_id=action["id"],
            )
            return

        action["status"] = "succeeded"
        action["result"] = result.output
        ledger = self._store.append_ledger(
            plan_id=plan["id"],
            event_type="action_executed",
            status="succeeded",
            message="Action executed.",
            action_id=action["id"],
        )
        self._save_summary_memory(plan, action, ledger["id"])

    def _save_summary_memory(
        self,
        plan: ExecutionPlanRecord,
        action: DomainActionRecord,
        source_event_id: str,
    ) -> None:
        if self._summary_memory_repository is None:
            return
        payload: dict[str, object] = {
            "domain": action["domain"],
            "actionType": action["actionType"],
            "actionId": action["id"],
            "planId": plan["id"],
            "result": action.get("result", {}),
        }
        payload.update(self._result_fact_payload(action.get("result", {})))
        try:
            self._summary_memory_repository.save(
                SummaryMemory(
                    conversation_id=plan["conversationId"],
                    memory_type="domain_fact",
                    summary=self._memory_summary(action),
                    payload=payload,
                    source_event_ids=[source_event_id],
                )
            )
        except Exception:
            LOGGER.warning(
                "Summary memory save failed; execution result is preserved. "
                "plan_id=%s action_id=%s action_type=%s conversation_id=%s",
                plan["id"],
                action["id"],
                action["actionType"],
                plan["conversationId"],
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
