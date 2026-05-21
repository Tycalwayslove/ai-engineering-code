from uuid import uuid4

from agent_runtime.parsers.rule_parser import RuleParser
from backend.app.services.execution_store import (
    ConfirmationRecord,
    DomainActionRecord,
    ExecutionPlanRecord,
    InMemoryExecutionStore,
)

from orchestrator.types import AgentTurnResponse


class ExecutionPlanner:
    def __init__(
        self,
        store: InMemoryExecutionStore,
        parser: RuleParser | None = None,
    ) -> None:
        self._store = store
        self._parser = parser or RuleParser()

    def submit_turn(
        self,
        conversation_id: str,
        text: str,
        now: str,
        timezone: str,
    ) -> AgentTurnResponse:
        parsed = self._parser.parse(text=text, now=now, timezone=timezone)
        missing_fields = [
            field for action in parsed.actions for field in action["missing_fields"]
        ]
        if missing_fields:
            return {
                "kind": "clarification_request",
                "conversationId": conversation_id,
                "question": "打车票报销需要补充金额。",
                "missingFields": sorted(set(missing_fields)),
            }

        plan_id = f"plan_{uuid4().hex}"
        actions: list[DomainActionRecord] = []
        for parsed_action in parsed.actions:
            action_id = f"action_{uuid4().hex}"
            actions.append(
                {
                    "id": action_id,
                    "planId": plan_id,
                    "domain": parsed_action["domain"],
                    "actionType": parsed_action["action_type"],
                    "status": "awaiting_confirmation",
                    "riskLevel": parsed_action["risk_level"],
                    "summary": parsed_action["summary"],
                    "payload": parsed_action["payload"],
                    "result": None,
                }
            )

        if not actions:
            return {
                "kind": "assistant_message",
                "conversationId": conversation_id,
                "message": "我还没有识别到可执行的日程、费用或提醒动作。",
                "structuredElements": [],
            }

        confirmation: ConfirmationRecord = {
            "id": f"confirmation_{uuid4().hex}",
            "planId": plan_id,
            "status": "pending",
            "requiredActionIds": [action["id"] for action in actions],
            "title": "请确认执行计划",
            "description": "确认后我会执行这些动作。",
            "confirmToken": f"confirm_{uuid4().hex}",
        }
        plan: ExecutionPlanRecord = {
            "id": plan_id,
            "conversationId": conversation_id,
            "status": "awaiting_confirmation",
            "riskLevel": "medium",
            "summary": "确认后执行计划",
            "decisionTraceId": parsed.trace_id,
            "actions": actions,
            "confirmation": confirmation,
        }
        self._store.save_plan(plan)
        self._store.append_ledger(
            plan_id=plan_id,
            event_type="plan_created",
            status="info",
            message="Execution plan created.",
        )
        self._store.append_ledger(
            plan_id=plan_id,
            event_type="confirmation_created",
            status="info",
            message="Confirmation required before execution.",
        )
        return {
            "kind": "confirmation_required",
            "conversationId": conversation_id,
            "plan": plan,
        }
