from typing import cast

from agent_runtime.planning.compiler import PlanCompiler
from agent_runtime.planning.types import PlanCandidate, ProposedAction
from agent_runtime.policy.engine import PolicyEngine
from backend.app.services.execution_store import ConfirmationRecord, DomainActionRecord


def test_plan_compiler_builds_current_execution_plan_shape() -> None:
    compiler = PlanCompiler(
        id_factory=lambda prefix: f"{prefix}_fixed",
        token_factory=lambda: "confirm_fixed",
    )
    candidate = PlanCandidate(
        goal="创建提醒",
        proposed_actions=[
            ProposedAction(
                domain="reminder",
                action_type="reminder.create_reminder",
                summary="创建提醒：带电脑",
                payload={
                    "title": "带电脑",
                    "due_at": "2026-05-24T09:00:00+08:00",
                    "timezone": "Asia/Shanghai",
                },
            )
        ],
        missing_information=[],
        assumptions=[],
        risk_notes=[],
    )
    decision = PolicyEngine().evaluate(candidate)

    plan = compiler.compile(
        conversation_id="conversation_001",
        candidate=candidate,
        policy_decision=decision,
        decision_trace_id="trace_001",
    )

    assert plan["id"] == "plan_fixed"
    assert plan["status"] == "awaiting_confirmation"
    actions = plan["actions"]
    assert isinstance(actions, list)
    action = actions[0]
    assert isinstance(action, dict)
    typed_action = cast(DomainActionRecord, action)
    assert typed_action["actionType"] == "reminder.create_reminder"
    confirmation = plan["confirmation"]
    assert isinstance(confirmation, dict)
    typed_confirmation = cast(ConfirmationRecord, confirmation)
    assert typed_confirmation["confirmToken"] == "confirm_fixed"
