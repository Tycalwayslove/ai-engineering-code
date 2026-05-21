from backend.app.domains.calendar.service import CalendarDomainService
from backend.app.services.execution_store import (
    DomainActionRecord,
    ExecutionPlanRecord,
    InMemoryExecutionStore,
)

from orchestrator.types import AgentTurnResponse


class ExecutionCoordinator:
    def __init__(
        self,
        store: InMemoryExecutionStore,
        calendar_service: CalendarDomainService,
    ) -> None:
        self._store = store
        self._calendar_service = calendar_service

    def confirm_plan(
        self,
        plan_id: str,
        confirm_token: str,
        action_ids: list[str] | None = None,
    ) -> AgentTurnResponse:
        plan = self._store.get_plan(plan_id)
        if plan["status"] != "awaiting_confirmation":
            raise ValueError("only awaiting confirmation plans can be confirmed")

        confirmation = plan["confirmation"]
        if confirmation is None:
            raise ValueError("confirmation is required")
        if confirmation["confirmToken"] != confirm_token:
            raise ValueError("confirm token is invalid")
        if confirmation["status"] != "pending":
            raise ValueError("confirmation is not pending")

        selected_action_ids = set(action_ids or confirmation["requiredActionIds"])
        known_action_ids = {action["id"] for action in plan["actions"]}
        unknown_action_ids = sorted(selected_action_ids - known_action_ids)
        if unknown_action_ids:
            raise ValueError(f"unknown action ids: {', '.join(unknown_action_ids)}")

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
        try:
            if action["actionType"] == "calendar.create_event":
                event = self._calendar_service.create_event(
                    action_id=action["id"],
                    payload=action["payload"],
                )
                action["result"] = {"calendarEvent": dict(event)}
            else:
                raise ValueError(f"unsupported action type: {action['actionType']}")
        except Exception as error:
            action["status"] = "failed"
            self._store.append_ledger(
                plan_id=plan["id"],
                event_type="action_failed",
                status="failed",
                message=str(error),
                action_id=action["id"],
            )
            return

        action["status"] = "succeeded"
        self._store.append_ledger(
            plan_id=plan["id"],
            event_type="action_executed",
            status="succeeded",
            message="Action executed.",
            action_id=action["id"],
        )
