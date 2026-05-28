from backend.app.services.execution_store import DomainActionRecord

from orchestrator.execution.registry import ActionHandlerRegistry
from orchestrator.execution.result import ActionExecutionResult


class ExecutionRunner:
    def __init__(self, registry: ActionHandlerRegistry) -> None:
        self._registry = registry

    def execute_action(self, action: DomainActionRecord) -> ActionExecutionResult:
        try:
            handler = self._registry.resolve(action["actionType"])
            return handler.execute(action)
        except KeyError:
            return ActionExecutionResult(
                status="failed",
                error=f"unsupported action type: {action['actionType']}",
            )
        except Exception as error:
            return ActionExecutionResult(status="failed", error=str(error))
