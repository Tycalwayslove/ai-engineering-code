from orchestrator.executor import ExecutionCoordinator
from orchestrator.types import AgentTurnResponse


class ConfirmPlanUseCase:
    def __init__(self, execution_coordinator: ExecutionCoordinator) -> None:
        self._execution_coordinator = execution_coordinator

    def execute(
        self,
        plan_id: str,
        confirm_token: str,
        action_ids: list[str] | None = None,
    ) -> AgentTurnResponse:
        return self._execution_coordinator.confirm_plan(
            plan_id=plan_id,
            confirm_token=confirm_token,
            action_ids=action_ids,
        )
