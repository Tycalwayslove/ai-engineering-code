from backend.app.services.execution_store import ExecutionPlanRecord

from orchestrator.executor import ExecutionCoordinator


class RejectPlanUseCase:
    def __init__(self, execution_coordinator: ExecutionCoordinator) -> None:
        self._execution_coordinator = execution_coordinator

    def execute(self, plan_id: str) -> ExecutionPlanRecord:
        return self._execution_coordinator.reject_plan(plan_id)
