from uuid import uuid4

from fastapi import APIRouter
from orchestrator.types import AgentTurnResponse
from pydantic import BaseModel, Field

from backend.app.runtime import conversation_turn_store, execution_planner

router = APIRouter(prefix="/agent")


class AgentClientContext(BaseModel):
    locale: str = "zh-CN"
    timezone: str = "Asia/Shanghai"
    now: str = "2026-05-21T09:00:00+08:00"


class AgentTurnRequest(BaseModel):
    conversation_id: str | None = Field(default=None, alias="conversationId")
    input: str
    client_context: AgentClientContext = Field(
        default_factory=AgentClientContext,
        alias="clientContext",
    )


@router.post("/turns")
def submit_turn(request: AgentTurnRequest) -> AgentTurnResponse:
    conversation_id = request.conversation_id or f"conversation_{uuid4().hex}"
    response = execution_planner.submit_turn(
        conversation_id=conversation_id,
        text=request.input,
        now=request.client_context.now,
        timezone=request.client_context.timezone,
    )
    conversation_turn_store.record_user_turn(
        conversation_id=conversation_id,
        input_text=request.input,
        raw_content={"clientContext": request.client_context.model_dump(by_alias=True)},
    )
    conversation_turn_store.record_assistant_turn(
        conversation_id=conversation_id,
        response_summary=_response_summary(response),
        structured_response=dict(response),
    )
    return response


def _response_summary(response: AgentTurnResponse) -> str:
    if response["kind"] == "confirmation_required":
        return response["plan"]["summary"]
    if response["kind"] == "clarification_request":
        return response["question"]
    return response["plan"]["summary"]
