from typing import Protocol

from backend.app.services.execution_store import DomainActionRecord

from orchestrator.execution.result import ActionExecutionResult


class ActionHandler(Protocol):
    def execute(self, action: DomainActionRecord) -> ActionExecutionResult: ...


class ActionHandlerRegistry:
    def __init__(self) -> None:
        self._handlers: dict[str, ActionHandler] = {}

    def register(self, action_type: str, handler: ActionHandler) -> None:
        self._handlers[action_type] = handler

    def resolve(self, action_type: str) -> ActionHandler:
        handler = self._handlers.get(action_type)
        if handler is None:
            raise KeyError(action_type)
        return handler
