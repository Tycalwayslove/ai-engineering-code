from uuid import uuid4

from fastapi import APIRouter
from orchestrator.types import AgentTurnResponse
from pydantic import BaseModel, Field

from backend.app.runtime import execution_planner

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
    return execution_planner.submit_turn(
        conversation_id=request.conversation_id or f"conversation_{uuid4().hex}",
        text=request.input,
        now=request.client_context.now,
        timezone=request.client_context.timezone,
    )
