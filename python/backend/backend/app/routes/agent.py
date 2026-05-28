from agent_runtime.clarifications.types import PendingClarification
from agent_runtime.memory.event_log import AgentEvent
from agent_runtime.tracing.decision_trace import DecisionTrace
from fastapi import APIRouter, HTTPException, Query
from orchestrator.types import AgentTurnResponse
from orchestrator.use_cases.submit_turn import response_for_storage, response_summary
from pydantic import BaseModel, Field

from backend.app.runtime import (
    conversation_turn_store,
    decision_trace_repository,
    event_log_repository,
    execution_store,
    pending_clarification_store,
    submit_turn_use_case,
)
from backend.app.services.conversation_turn_store import ConversationTurn
from backend.app.services.execution_store import ExecutionPlanRecord

router = APIRouter(prefix="/agent")


class AgentClientContext(BaseModel):
    locale: str = "zh-CN"
    timezone: str = "Asia/Shanghai"
    now: str = "2026-05-21T09:00:00+08:00"


class AgentTurnRequest(BaseModel):
    conversation_id: str | None = Field(default=None, alias="conversationId")
    input: str
    display_input: str | None = Field(default=None, alias="displayInput")
    client_context: AgentClientContext = Field(
        default_factory=AgentClientContext,
        alias="clientContext",
    )


class AgentDebugEvent(BaseModel):
    id: str
    event_type: str = Field(alias="eventType")
    turn_id: str | None = Field(default=None, alias="turnId")
    plan_id: str | None = Field(default=None, alias="planId")
    trace_id: str | None = Field(default=None, alias="traceId")
    payload: dict[str, object]


class AgentDebugDecisionTrace(BaseModel):
    id: str
    planner_mode: str = Field(alias="plannerMode")
    context_sections_used: list[str] = Field(alias="contextSectionsUsed")
    tools_considered: list[str] = Field(alias="toolsConsidered")
    tools_selected: list[str] = Field(alias="toolsSelected")
    missing_information: list[str] = Field(alias="missingInformation")
    policy_decisions: list[str] = Field(alias="policyDecisions")
    confirmation_reason: str | None = Field(default=None, alias="confirmationReason")
    fallback_reason: str | None = Field(default=None, alias="fallbackReason")
    reasoning_summary: list[str] = Field(alias="reasoningSummary")
    llm_call: dict[str, object] | None = Field(default=None, alias="llmCall")


class AgentDebugPendingClarification(BaseModel):
    id: str
    domain: str
    action_type: str = Field(alias="actionType")
    question: str
    missing_fields: list[str] = Field(alias="missingFields")
    partial_payload: dict[str, object] = Field(alias="partialPayload")
    quick_replies: list[str] = Field(alias="quickReplies")
    quick_reply_options: list[dict[str, str]] = Field(
        default_factory=list,
        alias="quickReplyOptions",
    )
    status: str
    created_at: str = Field(alias="createdAt")
    expires_at: str = Field(alias="expiresAt")
    resolved_at: str | None = Field(default=None, alias="resolvedAt")


class AgentConversationDebugResponse(BaseModel):
    conversation_id: str = Field(alias="conversationId")
    events: list[AgentDebugEvent]
    decision_traces: list[AgentDebugDecisionTrace] = Field(alias="decisionTraces")
    pending_clarifications: list[AgentDebugPendingClarification] = Field(
        alias="pendingClarifications",
    )


class AgentConversationTurn(BaseModel):
    id: str
    role: str
    summary: str
    input_text: str | None = Field(default=None, alias="inputText")
    raw_content: dict[str, object] | None = Field(default=None, alias="rawContent")
    structured_response: dict[str, object] | None = Field(
        default=None,
        alias="structuredResponse",
    )
    created_at: str = Field(alias="createdAt")


class AgentConversationTurnsResponse(BaseModel):
    conversation_id: str = Field(alias="conversationId")
    turns: list[AgentConversationTurn]


class AgentPendingConfirmationsResponse(BaseModel):
    conversation_id: str = Field(alias="conversationId")
    plans: list[ExecutionPlanRecord]


@router.post("/turns")
def submit_turn(request: AgentTurnRequest) -> AgentTurnResponse:
    return submit_turn_use_case.execute(
        conversation_id=request.conversation_id,
        input_text=request.input,
        display_input=request.display_input,
        now=request.client_context.now,
        timezone=request.client_context.timezone,
        client_context=request.client_context.model_dump(by_alias=True),
    )


@router.get(
    "/conversations/{conversation_id}/turns",
    response_model=AgentConversationTurnsResponse,
)
def get_conversation_turns(
    conversation_id: str,
    limit: int = Query(default=50, ge=1, le=200),
) -> AgentConversationTurnsResponse:
    try:
        turns = conversation_turn_store.list_for_conversation(conversation_id, limit)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return AgentConversationTurnsResponse(
        conversationId=conversation_id,
        turns=[_conversation_turn_from_store(turn) for turn in turns],
    )


@router.get(
    "/conversations/{conversation_id}/pending-confirmations",
    response_model=AgentPendingConfirmationsResponse,
)
def get_pending_confirmations(
    conversation_id: str,
) -> AgentPendingConfirmationsResponse:
    return AgentPendingConfirmationsResponse(
        conversationId=conversation_id,
        plans=execution_store.list_pending_plans_for_conversation(conversation_id),
    )


@router.get(
    "/conversations/{conversation_id}/debug",
    response_model=AgentConversationDebugResponse,
)
def get_conversation_debug(conversation_id: str) -> AgentConversationDebugResponse:
    events = event_log_repository.list_for_conversation(conversation_id)
    traces = [
        trace
        for trace_id in _trace_ids_from_events(events)
        if (trace := decision_trace_repository.get(trace_id)) is not None
    ]
    return AgentConversationDebugResponse(
        conversationId=conversation_id,
        events=[_debug_event_from_event(event) for event in events],
        decisionTraces=[_debug_trace_from_trace(trace) for trace in traces],
        pendingClarifications=[
            _debug_pending_from_pending(pending)
            for pending in pending_clarification_store.list_for_conversation(
                conversation_id,
            )
        ],
    )


def _response_summary(response: AgentTurnResponse) -> str:
    return response_summary(response)


def _response_for_storage(response: AgentTurnResponse) -> dict[str, object]:
    return response_for_storage(response)


def _conversation_turn_from_store(
    turn: ConversationTurn,
) -> AgentConversationTurn:
    input_text = turn.get("inputText")
    response_summary = turn.get("responseSummary")
    summary = response_summary if isinstance(response_summary, str) else input_text
    structured_response = turn.get("structuredResponse")
    raw_content = turn.get("rawContent")

    return AgentConversationTurn(
        id=str(turn["id"]),
        role=str(turn["role"]),
        summary=str(summary or ""),
        inputText=input_text if isinstance(input_text, str) else None,
        rawContent=raw_content if isinstance(raw_content, dict) else None,
        structuredResponse=structured_response
        if isinstance(structured_response, dict)
        else None,
        createdAt=str(turn["createdAt"]),
    )


def _trace_ids_from_events(events: list[AgentEvent]) -> list[str]:
    trace_ids: list[str] = []
    for event in events:
        trace_id = event.payload.get("traceId")
        if isinstance(trace_id, str) and trace_id not in trace_ids:
            trace_ids.append(trace_id)
    return trace_ids


def _debug_event_from_event(event: AgentEvent) -> AgentDebugEvent:
    trace_id = event.payload.get("traceId")
    return AgentDebugEvent(
        id=event.id,
        eventType=event.event_type,
        turnId=event.turn_id,
        planId=event.plan_id,
        traceId=trace_id if isinstance(trace_id, str) else None,
        payload=event.payload,
    )


def _debug_trace_from_trace(trace: DecisionTrace) -> AgentDebugDecisionTrace:
    return AgentDebugDecisionTrace(
        id=trace.id,
        plannerMode=trace.planner_mode,
        contextSectionsUsed=trace.context_sections_used,
        toolsConsidered=trace.tools_considered,
        toolsSelected=trace.tools_selected,
        missingInformation=trace.missing_information,
        policyDecisions=trace.policy_decisions,
        confirmationReason=trace.confirmation_reason,
        fallbackReason=trace.fallback_reason,
        reasoningSummary=trace.reasoning_summary,
        llmCall=trace.llm_call,
    )


def _debug_pending_from_pending(
    pending: PendingClarification,
) -> AgentDebugPendingClarification:
    return AgentDebugPendingClarification(
        id=pending.id,
        domain=pending.domain,
        actionType=pending.action_type,
        question=pending.question,
        missingFields=pending.missing_fields,
        partialPayload=pending.partial_payload,
        quickReplies=pending.quick_replies,
        quickReplyOptions=_quick_reply_options_from_pending(pending),
        status=pending.status,
        createdAt=pending.created_at.isoformat(),
        expiresAt=pending.expires_at.isoformat(),
        resolvedAt=pending.resolved_at.isoformat()
        if pending.resolved_at is not None
        else None,
    )


def _quick_reply_options_from_pending(
    pending: PendingClarification,
) -> list[dict[str, str]]:
    raw_candidate_ids = pending.partial_payload.get("candidate_target_ids")
    candidate_ids = []
    if isinstance(raw_candidate_ids, list):
        candidate_ids = [
            item.strip()
            for item in raw_candidate_ids
            if isinstance(item, str) and item.strip() != ""
        ]
    use_candidate_ids = len(candidate_ids) == len(pending.quick_replies)
    return [
        {
            "label": label,
            "value": candidate_ids[index] if use_candidate_ids else label,
        }
        for index, label in enumerate(pending.quick_replies)
    ]
