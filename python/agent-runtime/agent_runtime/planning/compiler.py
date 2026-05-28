from collections.abc import Callable
from uuid import uuid4

from agent_runtime.planning.types import PlanCandidate
from agent_runtime.policy.types import PolicyDecision

type ExecutionPlanDict = dict[str, object]


class PlanCompiler:
    def __init__(
        self,
        id_factory: Callable[[str], str] | None = None,
        token_factory: Callable[[], str] | None = None,
    ) -> None:
        self._id_factory = id_factory or self._default_id
        self._token_factory = token_factory or (lambda: self._default_id("confirm"))

    def compile(
        self,
        conversation_id: str,
        candidate: PlanCandidate,
        policy_decision: PolicyDecision,
        decision_trace_id: str,
    ) -> ExecutionPlanDict:
        plan_id = self._id_factory("plan")
        actions: list[dict[str, object]] = []
        for proposed_action in candidate.proposed_actions:
            actions.append(
                {
                    "id": self._id_factory("action"),
                    "planId": plan_id,
                    "domain": proposed_action.domain,
                    "actionType": proposed_action.action_type,
                    "status": "awaiting_confirmation",
                    "riskLevel": proposed_action.risk_level,
                    "summary": proposed_action.summary,
                    "payload": proposed_action.payload,
                }
            )

        confirmation = None
        if policy_decision.requires_confirmation:
            required_action_ids = [
                actions[index]["id"]
                for index in policy_decision.required_action_indexes
            ]
            confirmation = {
                "id": self._id_factory("confirmation"),
                "planId": plan_id,
                "status": "pending",
                "requiredActionIds": required_action_ids,
                "title": "请确认执行计划",
                "description": "确认后我会执行这些动作。",
                "confirmToken": self._token_factory(),
            }

        return {
            "id": plan_id,
            "conversationId": conversation_id,
            "status": "awaiting_confirmation",
            "riskLevel": policy_decision.risk_level,
            "summary": candidate.goal,
            "decisionTraceId": decision_trace_id,
            "actions": actions,
            "confirmation": confirmation,
        }

    def _default_id(self, prefix: str) -> str:
        return f"{prefix}_{uuid4().hex}"
