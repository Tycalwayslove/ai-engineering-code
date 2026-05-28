from typing import Literal, TypedDict

from backend.app.services.execution_store import ExecutionPlanRecord

AgentTurnKind = Literal[
    "assistant_message",
    "clarification_request",
    "confirmation_required",
    "execution_result",
]


class AgentTurnResponse(TypedDict, total=False):
    kind: AgentTurnKind
    conversationId: str
    message: str
    question: str
    clarificationId: str
    missingFields: list[str]
    quickReplies: list[str]
    quickReplyOptions: list[dict[str, str]]
    plan: ExecutionPlanRecord
    structuredElements: list[dict[str, object]]
