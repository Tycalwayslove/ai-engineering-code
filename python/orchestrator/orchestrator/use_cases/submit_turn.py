from copy import deepcopy
from uuid import uuid4

from backend.app.services.conversation_turn_store import ConversationTurnStore

from orchestrator.planner import ExecutionPlanner
from orchestrator.types import AgentTurnResponse


class SubmitTurnUseCase:
    def __init__(
        self,
        execution_planner: ExecutionPlanner,
        conversation_turn_store: ConversationTurnStore,
    ) -> None:
        self._execution_planner = execution_planner
        self._conversation_turn_store = conversation_turn_store

    def execute(
        self,
        conversation_id: str | None,
        input_text: str,
        display_input: str | None,
        now: str,
        timezone: str,
        client_context: dict[str, object],
    ) -> AgentTurnResponse:
        resolved_conversation_id = conversation_id or f"conversation_{uuid4().hex}"
        response = self._execution_planner.submit_turn(
            conversation_id=resolved_conversation_id,
            text=input_text,
            now=now,
            timezone=timezone,
        )
        raw_content: dict[str, object] = {
            "clientContext": client_context,
            "submittedInput": input_text,
        }
        stored_input_text = input_text
        if display_input:
            raw_content["displayInput"] = display_input
            stored_input_text = display_input
        self._conversation_turn_store.record_user_turn(
            conversation_id=resolved_conversation_id,
            input_text=stored_input_text,
            raw_content=raw_content,
        )
        self._conversation_turn_store.record_assistant_turn(
            conversation_id=resolved_conversation_id,
            response_summary=response_summary(response),
            structured_response=response_for_storage(response),
        )
        return response


def response_summary(response: AgentTurnResponse) -> str:
    if response["kind"] == "confirmation_required":
        message = response.get("message")
        if isinstance(message, str) and message:
            return message
        return response["plan"]["summary"]
    if response["kind"] == "clarification_request":
        return response["question"]
    if response["kind"] == "assistant_message":
        return response["message"]
    return response["plan"]["summary"]


def response_for_storage(response: AgentTurnResponse) -> dict[str, object]:
    stored = deepcopy(dict(response))
    plan = stored.get("plan")
    if isinstance(plan, dict):
        confirmation = plan.get("confirmation")
        if isinstance(confirmation, dict):
            confirmation["confirmToken"] = "redacted"

    return stored
