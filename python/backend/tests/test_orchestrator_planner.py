import logging

import pytest
from agent_runtime.context.assembler import ContextAssembler
from agent_runtime.context.providers import StaticContextProvider
from agent_runtime.context.types import ContextPack
from agent_runtime.memory.summary_memory import (
    InMemorySummaryMemoryRepository,
    SummaryMemory,
)
from agent_runtime.parsers.rule_parser import RuleParser
from agent_runtime.planning.types import (
    ClarificationRequest,
    PlanCandidate,
    PlanningInput,
    PlanningResult,
    ProposedAction,
)
from agent_runtime.tracing.decision_trace import DecisionTrace
from backend.app.domains.calendar.repository import InMemoryCalendarEventRepository
from backend.app.domains.calendar.service import CalendarDomainService
from backend.app.domains.expense.repository import InMemoryExpenseRecordRepository
from backend.app.domains.expense.service import ExpenseDomainService
from backend.app.domains.reminder.repository import InMemoryReminderRepository
from backend.app.domains.reminder.service import ReminderDomainService
from backend.app.services.execution_store import ExecutionPlanRecord, InMemoryExecutionStore
from backend.app.services.pending_clarification_store import (
    InMemoryPendingClarificationStore,
)
from orchestrator.executor import ExecutionCoordinator
from orchestrator.planner import ExecutionPlanner


class CapturingDecisionTraceRepository:
    def __init__(self) -> None:
        self.traces: list[DecisionTrace] = []

    def save(self, conversation_id: str, trace: DecisionTrace) -> DecisionTrace:
        del conversation_id
        self.traces.append(trace)
        return trace

    def get(self, trace_id: str) -> DecisionTrace | None:
        return next((trace for trace in self.traces if trace.id == trace_id), None)


class FailingSummaryMemoryRepository:
    def save(self, memory: SummaryMemory) -> SummaryMemory:
        raise RuntimeError("summary memory unavailable")

    def list_for_conversation(self, conversation_id: str) -> list[SummaryMemory]:
        del conversation_id
        return []


def _context_assembler_for_domain_summaries(
    *,
    calendar_summary: list[str] | None = None,
    reminder_summary: list[str] | None = None,
    expense_summary: list[str] | None = None,
) -> ContextAssembler:
    empty_list_provider: StaticContextProvider[list[str]] = StaticContextProvider([])
    return ContextAssembler(
        conversation_provider=empty_list_provider,
        pending_plan_provider=empty_list_provider,
        pending_clarification_provider=empty_list_provider,
        calendar_provider=StaticContextProvider(calendar_summary or []),
        reminder_provider=StaticContextProvider(reminder_summary or []),
        expense_provider=StaticContextProvider(expense_summary or []),
        attachment_provider=empty_list_provider,
        preference_provider=empty_list_provider,
        summary_memory_provider=empty_list_provider,
        tool_catalog_provider=empty_list_provider,
    )


class FixedPlanningEngine:
    def plan(
        self,
        planning_input: PlanningInput,
        context_pack: ContextPack,
    ) -> PlanningResult:
        del planning_input, context_pack
        return PlanningResult(
            kind="plan_candidate",
            trace_id="llm_first-fallback-rule-parser-v1",
            planner_mode="llm_first",
            fallback_reason="llm_error: RuntimeError",
            candidate=PlanCandidate(
                goal="创建提醒：带电脑",
                proposed_actions=[
                    ProposedAction(
                        domain="reminder",
                        action_type="reminder.create_reminder",
                        summary="创建提醒：带电脑",
                        payload={
                            "title": "带电脑",
                            "due_at": "2026-05-22T09:00:00+08:00",
                            "timezone": "Asia/Shanghai",
                        },
                    )
                ],
                missing_information=[],
                assumptions=[],
                risk_notes=[],
            ),
        )


class MixedMessagePlanningEngine:
    def plan(
        self,
        planning_input: PlanningInput,
        context_pack: ContextPack,
    ) -> PlanningResult:
        del planning_input, context_pack
        return PlanningResult(
            kind="plan_candidate",
            trace_id="llm-mixed-planner-v1",
            planner_mode="llm",
            message="当然可以，我先把明天下午三点的会议列出来，确认后写入日程。",
            candidate=PlanCandidate(
                goal="创建日程：开会",
                proposed_actions=[
                    ProposedAction(
                        domain="calendar",
                        action_type="calendar.create_event",
                        summary="创建日程：开会",
                        payload={
                            "title": "开会",
                            "start_at": "2026-05-22T15:00:00+08:00",
                            "end_at": "2026-05-22T16:00:00+08:00",
                            "timezone": "Asia/Shanghai",
                        },
                    ),
                ],
                missing_information=[],
                assumptions=[],
                risk_notes=[],
            ),
        )


class ChatPlanningEngine:
    def plan(
        self,
        planning_input: PlanningInput,
        context_pack: ContextPack,
    ) -> PlanningResult:
        del planning_input, context_pack
        return PlanningResult(
            kind="assistant_message",
            trace_id="llm-chat",
            planner_mode="llm",
            message="可以，我们先聊聊，不创建执行计划。",
        )


class StructuredChatPlanningEngine:
    def plan(
        self,
        planning_input: PlanningInput,
        context_pack: ContextPack,
    ) -> PlanningResult:
        del planning_input, context_pack
        return PlanningResult(
            kind="assistant_message",
            trace_id="llm-chat-structured",
            planner_mode="llm",
            message="明天有 2 个安排。",
            structured_elements=[
                {
                    "id": "tomorrow-schedule",
                    "kind": "summary-list",
                    "title": "明天的安排",
                    "items": [
                        {
                            "id": "reminder_1",
                            "label": "带电脑",
                            "meta": "明天 09:00",
                            "tone": "warning",
                        },
                    ],
                },
            ],
        )


class ClarificationPlanningEngine:
    def plan(
        self,
        planning_input: PlanningInput,
        context_pack: ContextPack,
    ) -> PlanningResult:
        del planning_input, context_pack
        return PlanningResult(
            kind="clarification",
            trace_id="llm-clarification",
            planner_mode="llm",
            clarification=ClarificationRequest(
                intent_id="pending_calendar_meeting",
                domain="calendar",
                action_type="calendar.create_event",
                question="明天上午几点开始开会？",
                missing_fields=["start_at"],
                quick_replies=["明天上午9点", "明天上午10点", "我再说具体时间"],
                partial_payload={"title": "开会", "date_hint": "明天"},
            ),
        )


class ReminderClarificationPlanningEngine:
    def plan(
        self,
        planning_input: PlanningInput,
        context_pack: ContextPack,
    ) -> PlanningResult:
        del planning_input, context_pack
        return PlanningResult(
            kind="clarification",
            trace_id="llm-reminder-clarification",
            planner_mode="llm",
            clarification=ClarificationRequest(
                intent_id="pending_reminder_due_at",
                domain="reminder",
                action_type="reminder.create_reminder",
                question="明天几点提醒你喝水？",
                missing_fields=["due_at"],
                quick_replies=["明天上午9点", "明天上午10点", "我再说具体时间"],
                partial_payload={
                    "title": "喝水",
                    "date_hint": "明天",
                    "time_range_hint": "morning",
                },
            ),
        )


class UnknownActionPlanningEngine:
    def plan(
        self,
        planning_input: PlanningInput,
        context_pack: ContextPack,
    ) -> PlanningResult:
        del planning_input, context_pack
        return PlanningResult(
            kind="plan_candidate",
            trace_id="llm-unknown-action",
            planner_mode="llm",
            candidate=PlanCandidate(
                goal="删除全部提醒",
                proposed_actions=[
                    ProposedAction(
                        domain="reminder",
                        action_type="reminder.delete_everything",
                        summary="删除全部提醒",
                        payload={},
                    )
                ],
                missing_information=[],
                assumptions=[],
                risk_notes=[],
            ),
        )


class MissingRequiredPayloadPlanningEngine:
    def plan(
        self,
        planning_input: PlanningInput,
        context_pack: ContextPack,
    ) -> PlanningResult:
        del planning_input, context_pack
        return PlanningResult(
            kind="plan_candidate",
            trace_id="llm-missing-required-payload",
            planner_mode="llm",
            candidate=PlanCandidate(
                goal="创建日程：开会",
                proposed_actions=[
                    ProposedAction(
                        domain="calendar",
                        action_type="calendar.create_event",
                        summary="创建日程：开会",
                        payload={
                            "title": "开会",
                            "timezone": "Asia/Shanghai",
                        },
                        missing_fields=[],
                    ),
                ],
                missing_information=[],
                assumptions=[],
                risk_notes=[],
            ),
        )


class InvalidPayloadTypePlanningEngine:
    def plan(
        self,
        planning_input: PlanningInput,
        context_pack: ContextPack,
    ) -> PlanningResult:
        del planning_input, context_pack
        return PlanningResult(
            kind="plan_candidate",
            trace_id="llm-invalid-payload-type",
            planner_mode="llm",
            candidate=PlanCandidate(
                goal="创建费用草稿：打车票报销",
                proposed_actions=[
                    ProposedAction(
                        domain="expense",
                        action_type="expense.create_reimbursement_draft",
                        summary="创建费用草稿：打车票报销",
                        payload={
                            "title": "打车票报销",
                            "amount": "58",
                            "currency": "CNY",
                            "occurred_on": "2026-05-20",
                        },
                        missing_fields=[],
                    ),
                ],
                missing_information=[],
                assumptions=[],
                risk_notes=[],
            ),
        )


class InvalidPatchPayloadTypePlanningEngine:
    def plan(
        self,
        planning_input: PlanningInput,
        context_pack: ContextPack,
    ) -> PlanningResult:
        del planning_input, context_pack
        return PlanningResult(
            kind="plan_candidate",
            trace_id="llm-invalid-patch-payload-type",
            planner_mode="llm",
            candidate=PlanCandidate(
                goal="更新费用：打车票报销",
                proposed_actions=[
                    ProposedAction(
                        domain="expense",
                        action_type="expense.update_reimbursement",
                        summary="更新费用：打车票报销",
                        payload={
                            "target_id": "expense_record_001",
                            "expected_status": "draft",
                            "patch": {"amount": "88"},
                        },
                        missing_fields=[],
                    ),
                ],
                missing_information=[],
                assumptions=[],
                risk_notes=[],
            ),
        )


class CrossConversationTargetPlanningEngine:
    def plan(
        self,
        planning_input: PlanningInput,
        context_pack: ContextPack,
    ) -> PlanningResult:
        del planning_input, context_pack
        return PlanningResult(
            kind="plan_candidate",
            trace_id="llm-cross-conversation-target",
            planner_mode="llm",
            candidate=PlanCandidate(
                goal="取消提醒：喝水",
                proposed_actions=[
                    ProposedAction(
                        domain="reminder",
                        action_type="reminder.cancel_reminder",
                        summary="取消提醒：喝水",
                        payload={
                            "target_id": "reminder_other_conversation",
                            "expected_status": "scheduled",
                        },
                        missing_fields=[],
                    ),
                ],
                missing_information=[],
                assumptions=[],
                risk_notes=[],
            ),
        )


class StaleTargetStatusPlanningEngine:
    def plan(
        self,
        planning_input: PlanningInput,
        context_pack: ContextPack,
    ) -> PlanningResult:
        del planning_input, context_pack
        return PlanningResult(
            kind="plan_candidate",
            trace_id="llm-stale-target-status",
            planner_mode="llm",
            candidate=PlanCandidate(
                goal="完成提醒：喝水",
                proposed_actions=[
                    ProposedAction(
                        domain="reminder",
                        action_type="reminder.complete_reminder",
                        summary="完成提醒：喝水",
                        payload={
                            "target_id": "reminder_current",
                            "expected_status": "scheduled",
                        },
                        missing_fields=[],
                    ),
                ],
                missing_information=[],
                assumptions=[],
                risk_notes=[],
            ),
        )


class AmbiguousTargetGuessPlanningEngine:
    def plan(
        self,
        planning_input: PlanningInput,
        context_pack: ContextPack,
    ) -> PlanningResult:
        del planning_input, context_pack
        return PlanningResult(
            kind="plan_candidate",
            trace_id="llm-ambiguous-target-guess",
            planner_mode="llm",
            candidate=PlanCandidate(
                goal="提交费用：午餐",
                proposed_actions=[
                    ProposedAction(
                        domain="expense",
                        action_type="expense.submit_reimbursement",
                        summary="提交费用：午餐",
                        payload={
                            "target_id": "expense_2",
                            "expected_status": "draft",
                        },
                        missing_fields=[],
                    ),
                ],
                missing_information=[],
                assumptions=[],
                risk_notes=[],
            ),
        )


def test_rule_parser_extracts_calendar_create_action() -> None:
    parser = RuleParser()

    result = parser.parse(
        text="明天下午三点开会",
        now="2026-05-21T09:00:00+08:00",
        timezone="Asia/Shanghai",
    )

    assert result.intent_count == 1
    assert result.actions[0]["domain"] == "calendar"
    assert result.actions[0]["action_type"] == "calendar.create_event"
    assert result.actions[0]["payload"]["title"] == "开会"
    assert result.actions[0]["payload"]["start_at"] == "2026-05-22T15:00:00+08:00"
    assert result.actions[0]["payload"]["end_at"] == "2026-05-22T16:00:00+08:00"


def test_rule_parser_extracts_named_planning_meeting_duration() -> None:
    parser = RuleParser()

    result = parser.parse(
        text="明天下午三点安排一个新年业务规划会，时间一个半小时",
        now="2026-05-21T09:00:00+08:00",
        timezone="Asia/Shanghai",
    )

    assert result.intent_count == 1
    assert result.actions[0]["summary"] == "创建日程：新年业务规划会"
    assert result.actions[0]["payload"]["title"] == "新年业务规划会"
    assert result.actions[0]["payload"]["start_at"] == "2026-05-22T15:00:00+08:00"
    assert result.actions[0]["payload"]["end_at"] == "2026-05-22T16:30:00+08:00"


def test_rule_parser_extracts_lunch_calendar_event() -> None:
    parser = RuleParser()

    result = parser.parse(
        text="明天中午我要去跟老婆吃午饭",
        now="2026-05-21T09:00:00+08:00",
        timezone="Asia/Shanghai",
    )

    assert result.intent_count == 1
    action = result.actions[0]
    assert action["domain"] == "calendar"
    assert action["action_type"] == "calendar.create_event"
    assert action["summary"] == "创建日程：跟老婆吃午饭"
    assert action["payload"] == {
        "title": "跟老婆吃午饭",
        "start_at": "2026-05-22T12:00:00+08:00",
        "end_at": "2026-05-22T13:00:00+08:00",
        "timezone": "Asia/Shanghai",
    }


def test_rule_parser_extracts_multi_intent_calendar_and_expense() -> None:
    parser = RuleParser()

    result = parser.parse(
        text="明天下午三点开会，顺便把昨天打车票报销",
        now="2026-05-21T09:00:00+08:00",
        timezone="Asia/Shanghai",
    )

    assert result.intent_count == 2
    assert [action["domain"] for action in result.actions] == ["calendar", "expense"]
    assert result.actions[1]["action_type"] == "expense.create_reimbursement_draft"
    assert result.actions[1]["missing_fields"] == ["amount"]


def test_rule_parser_extracts_calendar_expense_and_reminder() -> None:
    parser = RuleParser()

    result = parser.parse(
        text="明天下午三点开会，顺便把昨天 58 元打车票报销，再提醒我带电脑",
        now="2026-05-21T09:00:00+08:00",
        timezone="Asia/Shanghai",
    )

    assert result.intent_count == 3
    assert [action["action_type"] for action in result.actions] == [
        "calendar.create_event",
        "expense.create_reimbursement_draft",
        "reminder.create_reminder",
    ]
    assert result.actions[1]["payload"]["amount"] == 58
    assert result.actions[2]["payload"]["title"] == "带电脑"


def test_rule_parser_extracts_expense_amount_and_occurred_date() -> None:
    parser = RuleParser()

    result = parser.parse(
        text="把昨天 58 元打车票报销",
        now="2026-05-21T09:00:00+08:00",
        timezone="Asia/Shanghai",
    )

    assert result.intent_count == 1
    action = result.actions[0]
    assert action["domain"] == "expense"
    assert action["action_type"] == "expense.create_reimbursement_draft"
    assert action["summary"] == "创建费用草稿：打车票报销 58 元"
    assert action["payload"] == {
        "title": "打车票报销",
        "amount": 58,
        "currency": "CNY",
        "occurred_on": "2026-05-20",
    }
    assert action["missing_fields"] == []


def test_rule_parser_extracts_reminder_due_time() -> None:
    parser = RuleParser()

    result = parser.parse(
        text="明天上午九点提醒我带电脑",
        now="2026-05-21T09:00:00+08:00",
        timezone="Asia/Shanghai",
    )

    assert result.intent_count == 1
    action = result.actions[0]
    assert action["domain"] == "reminder"
    assert action["action_type"] == "reminder.create_reminder"
    assert action["summary"] == "创建提醒：带电脑"
    assert action["payload"] == {
        "title": "带电脑",
        "due_at": "2026-05-22T09:00:00+08:00",
        "timezone": "Asia/Shanghai",
    }
    assert action["missing_fields"] == []


def test_planner_returns_confirmation_required_for_calendar_write() -> None:
    store = InMemoryExecutionStore()
    planner = ExecutionPlanner(store=store)

    response = planner.submit_turn(
        conversation_id="conversation_001",
        text="明天下午三点开会",
        now="2026-05-21T09:00:00+08:00",
        timezone="Asia/Shanghai",
    )

    assert response["kind"] == "confirmation_required"
    plan = response["plan"]
    confirmation = plan["confirmation"]
    assert confirmation is not None
    assert plan["status"] == "awaiting_confirmation"
    assert plan["actions"][0]["actionType"] == "calendar.create_event"
    assert confirmation["confirmToken"].startswith("confirm_")


def test_planner_preserves_mixed_assistant_message_with_confirmation() -> None:
    planner = ExecutionPlanner(
        store=InMemoryExecutionStore(),
        planning_engine=MixedMessagePlanningEngine(),
    )

    response = planner.submit_turn(
        conversation_id="conversation_mixed_001",
        text="好的，帮我安排明天下午三点开会",
        now="2026-05-21T09:00:00+08:00",
        timezone="Asia/Shanghai",
    )

    assert response["kind"] == "confirmation_required"
    assert (
        response["message"]
        == "当然可以，我先把明天下午三点的会议列出来，确认后写入日程。"
    )
    assert response["plan"]["actions"][0]["actionType"] == "calendar.create_event"


def test_planner_handles_llm_chat_without_creating_plan() -> None:
    store = InMemoryExecutionStore()
    planner = ExecutionPlanner(
        store=store,
        planning_engine=ChatPlanningEngine(),
    )

    response = planner.submit_turn(
        conversation_id="conversation_llm_chat",
        text="今天有点累",
        now="2026-05-21T09:00:00+08:00",
        timezone="Asia/Shanghai",
    )

    assert response == {
        "kind": "assistant_message",
        "conversationId": "conversation_llm_chat",
        "message": "可以，我们先聊聊，不创建执行计划。",
        "structuredElements": [],
    }
    assert store.list_pending_plans_for_conversation("conversation_llm_chat") == []
    assert store.list_ledger("conversation_llm_chat") == []


def test_planner_returns_llm_chat_structured_elements_without_creating_plan() -> None:
    store = InMemoryExecutionStore()
    planner = ExecutionPlanner(
        store=store,
        planning_engine=StructuredChatPlanningEngine(),
    )

    response = planner.submit_turn(
        conversation_id="conversation_llm_chat_structured",
        text="明天我有什么安排？",
        now="2026-05-21T09:00:00+08:00",
        timezone="Asia/Shanghai",
    )

    assert response["kind"] == "assistant_message"
    assert response["structuredElements"] == [
        {
            "id": "tomorrow-schedule",
            "kind": "summary-list",
            "title": "明天的安排",
            "items": [
                {
                    "id": "reminder_1",
                    "label": "带电脑",
                    "meta": "明天 09:00",
                    "tone": "warning",
                },
            ],
        },
    ]
    assert store.list_pending_plans_for_conversation("conversation_llm_chat_structured") == []
    assert store.list_ledger("conversation_llm_chat_structured") == []


def test_planner_saves_llm_clarification_pending_item() -> None:
    store = InMemoryExecutionStore()
    pending_store = InMemoryPendingClarificationStore()
    planner = ExecutionPlanner(
        store=store,
        planning_engine=ClarificationPlanningEngine(),
        pending_clarification_store=pending_store,
    )

    response = planner.submit_turn(
        conversation_id="conversation_llm_clarification",
        text="明天上午我要去开会",
        now="2026-05-21T09:00:00+08:00",
        timezone="Asia/Shanghai",
    )

    assert response["kind"] == "clarification_request"
    assert response["question"] == "明天上午几点开始开会？"
    assert response["missingFields"] == ["start_at"]
    assert store.list_pending_plans_for_conversation("conversation_llm_clarification") == []
    pending_items = pending_store.list_for_conversation("conversation_llm_clarification")
    assert len(pending_items) == 1
    assert pending_items[0].status == "open"
    assert pending_items[0].action_type == "calendar.create_event"


def test_planner_resolves_llm_chinese_tomorrow_date_hint() -> None:
    store = InMemoryExecutionStore()
    pending_store = InMemoryPendingClarificationStore()
    planner = ExecutionPlanner(
        store=store,
        planning_engine=ClarificationPlanningEngine(),
        pending_clarification_store=pending_store,
    )
    conversation_id = "conversation_llm_chinese_date_hint"

    first = planner.submit_turn(
        conversation_id=conversation_id,
        text="明天上午我要去开会",
        now="2026-05-21T09:00:00+08:00",
        timezone="Asia/Shanghai",
    )
    assert first["kind"] == "clarification_request"

    second = planner.submit_turn(
        conversation_id=conversation_id,
        text="十点",
        now="2026-05-21T09:01:00+08:00",
        timezone="Asia/Shanghai",
    )

    assert second["kind"] == "confirmation_required"
    action = second["plan"]["actions"][0]
    assert action["actionType"] == "calendar.create_event"
    assert action["payload"]["start_at"] == "2026-05-22T10:00:00+08:00"
    assert action["payload"]["end_at"] == "2026-05-22T11:00:00+08:00"


def test_planner_resolves_pending_reminder_time() -> None:
    store = InMemoryExecutionStore()
    pending_store = InMemoryPendingClarificationStore()
    planner = ExecutionPlanner(
        store=store,
        planning_engine=ReminderClarificationPlanningEngine(),
        pending_clarification_store=pending_store,
    )
    conversation_id = "conversation_pending_reminder_due_at"

    first = planner.submit_turn(
        conversation_id=conversation_id,
        text="明天提醒我喝水",
        now="2026-05-21T09:00:00+08:00",
        timezone="Asia/Shanghai",
    )
    assert first["kind"] == "clarification_request"

    second = planner.submit_turn(
        conversation_id=conversation_id,
        text="十点",
        now="2026-05-21T09:01:00+08:00",
        timezone="Asia/Shanghai",
    )

    assert second["kind"] == "confirmation_required"
    action = second["plan"]["actions"][0]
    assert action["actionType"] == "reminder.create_reminder"
    assert action["payload"]["title"] == "喝水"
    assert action["payload"]["due_at"] == "2026-05-22T10:00:00+08:00"
    assert action["payload"]["timezone"] == "Asia/Shanghai"


def test_planner_blocks_llm_unknown_action_before_confirmation() -> None:
    store = InMemoryExecutionStore()
    pending_store = InMemoryPendingClarificationStore()
    planner = ExecutionPlanner(
        store=store,
        planning_engine=UnknownActionPlanningEngine(),
        pending_clarification_store=pending_store,
    )

    response = planner.submit_turn(
        conversation_id="conversation_llm_unknown_action",
        text="删除所有提醒",
        now="2026-05-21T09:00:00+08:00",
        timezone="Asia/Shanghai",
    )

    assert response["kind"] == "clarification_request"
    assert response["question"] == "我还不能安全执行这个动作。"
    assert response["missingFields"] == ["supported_action_type"]
    assert store.list_pending_plans_for_conversation("conversation_llm_unknown_action") == []
    assert store.list_ledger("conversation_llm_unknown_action") == []


def test_planner_clarifies_llm_action_missing_required_payload_fields() -> None:
    store = InMemoryExecutionStore()
    pending_store = InMemoryPendingClarificationStore()
    planner = ExecutionPlanner(
        store=store,
        planning_engine=MissingRequiredPayloadPlanningEngine(),
        pending_clarification_store=pending_store,
    )

    response = planner.submit_turn(
        conversation_id="conversation_llm_missing_payload",
        text="明天上午我要去开会",
        now="2026-05-21T09:00:00+08:00",
        timezone="Asia/Shanghai",
    )

    assert response["kind"] == "clarification_request"
    assert response["question"] == "需要补充：end_at, start_at。"
    assert response["missingFields"] == ["end_at", "start_at"]
    assert store.list_pending_plans_for_conversation("conversation_llm_missing_payload") == []
    assert store.list_ledger("conversation_llm_missing_payload") == []
    pending_items = pending_store.list_for_conversation("conversation_llm_missing_payload")
    assert len(pending_items) == 1
    assert pending_items[0].action_type == "calendar.create_event"
    assert pending_items[0].missing_fields == ["end_at", "start_at"]


def test_planner_clarifies_llm_action_invalid_payload_field_types() -> None:
    store = InMemoryExecutionStore()
    pending_store = InMemoryPendingClarificationStore()
    planner = ExecutionPlanner(
        store=store,
        planning_engine=InvalidPayloadTypePlanningEngine(),
        pending_clarification_store=pending_store,
    )

    response = planner.submit_turn(
        conversation_id="conversation_llm_invalid_payload_type",
        text="把昨天 58 元打车票报销",
        now="2026-05-21T09:00:00+08:00",
        timezone="Asia/Shanghai",
    )

    assert response["kind"] == "clarification_request"
    assert response["question"] == "需要修正字段类型：amount。"
    assert response["missingFields"] == ["amount"]
    assert (
        store.list_pending_plans_for_conversation(
            "conversation_llm_invalid_payload_type",
        )
        == []
    )
    assert store.list_ledger("conversation_llm_invalid_payload_type") == []
    pending_items = pending_store.list_for_conversation(
        "conversation_llm_invalid_payload_type",
    )
    assert len(pending_items) == 1
    assert pending_items[0].action_type == "expense.create_reimbursement_draft"
    assert pending_items[0].missing_fields == ["amount"]


def test_planner_clarifies_llm_update_action_invalid_patch_field_types() -> None:
    store = InMemoryExecutionStore()
    pending_store = InMemoryPendingClarificationStore()
    planner = ExecutionPlanner(
        store=store,
        planning_engine=InvalidPatchPayloadTypePlanningEngine(),
        pending_clarification_store=pending_store,
    )

    response = planner.submit_turn(
        conversation_id="conversation_llm_invalid_patch_payload_type",
        text="把刚才的费用改成 88 元",
        now="2026-05-21T09:00:00+08:00",
        timezone="Asia/Shanghai",
    )

    assert response["kind"] == "clarification_request"
    assert response["question"] == "需要修正字段类型：patch.amount。"
    assert response["missingFields"] == ["patch.amount"]
    assert (
        store.list_pending_plans_for_conversation(
            "conversation_llm_invalid_patch_payload_type",
        )
        == []
    )
    assert store.list_ledger("conversation_llm_invalid_patch_payload_type") == []
    pending_items = pending_store.list_for_conversation(
        "conversation_llm_invalid_patch_payload_type",
    )
    assert len(pending_items) == 1
    assert pending_items[0].action_type == "expense.update_reimbursement"
    assert pending_items[0].missing_fields == ["patch.amount"]


def test_planner_blocks_llm_target_outside_current_conversation() -> None:
    store = InMemoryExecutionStore()
    trace_repository = CapturingDecisionTraceRepository()
    planner = ExecutionPlanner(
        store=store,
        planning_engine=CrossConversationTargetPlanningEngine(),
        context_assembler=_context_assembler_for_domain_summaries(
            reminder_summary=[
                (
                    "id=reminder_current; source_action_id=action_current; "
                    "title=喝水; due_at=2026-05-22T10:00:00+08:00; "
                    "status=scheduled"
                ),
            ],
        ),
        decision_trace_repository=trace_repository,
    )

    response = planner.submit_turn(
        conversation_id="conversation_target_guard",
        text="取消刚才的提醒",
        now="2026-05-21T09:00:00+08:00",
        timezone="Asia/Shanghai",
    )

    assert response["kind"] == "clarification_request"
    assert response["question"] == "我找不到当前会话中可操作的目标事项。"
    assert response["missingFields"] == ["target_id"]
    assert store.list_pending_plans_for_conversation("conversation_target_guard") == []
    assert store.list_ledger("conversation_target_guard") == []
    assert trace_repository.traces[0].policy_decisions == [
        "目标事项不属于当前会话上下文，不能生成待确认写入计划。",
    ]


def test_planner_blocks_llm_target_when_expected_status_is_stale() -> None:
    store = InMemoryExecutionStore()
    trace_repository = CapturingDecisionTraceRepository()
    planner = ExecutionPlanner(
        store=store,
        planning_engine=StaleTargetStatusPlanningEngine(),
        context_assembler=_context_assembler_for_domain_summaries(
            reminder_summary=[
                (
                    "id=reminder_current; source_action_id=action_current; "
                    "title=喝水; due_at=2026-05-22T10:00:00+08:00; "
                    "status=done"
                ),
            ],
        ),
        decision_trace_repository=trace_repository,
    )

    response = planner.submit_turn(
        conversation_id="conversation_target_status_guard",
        text="完成刚才的提醒",
        now="2026-05-21T09:00:00+08:00",
        timezone="Asia/Shanghai",
    )

    assert response["kind"] == "clarification_request"
    assert response["question"] == "目标事项状态已变化，请重新选择。"
    assert response["missingFields"] == ["expected_status"]
    assert (
        store.list_pending_plans_for_conversation(
            "conversation_target_status_guard",
        )
        == []
    )
    assert store.list_ledger("conversation_target_status_guard") == []
    assert trace_repository.traces[0].policy_decisions == [
        "目标事项状态是 done，不符合预期 scheduled，不能生成待确认写入计划。",
    ]


def test_planner_clarifies_llm_ambiguous_target_guess() -> None:
    store = InMemoryExecutionStore()
    trace_repository = CapturingDecisionTraceRepository()
    planner = ExecutionPlanner(
        store=store,
        planning_engine=AmbiguousTargetGuessPlanningEngine(),
        context_assembler=_context_assembler_for_domain_summaries(
            expense_summary=[
                (
                    "id=expense_1; source_action_id=action_1; title=打车票; "
                    "amount=58; currency=CNY; occurred_on=2026-05-20; status=draft"
                ),
                (
                    "id=expense_2; source_action_id=action_2; title=午餐; "
                    "amount=88; currency=CNY; occurred_on=2026-05-21; status=draft"
                ),
            ],
        ),
        decision_trace_repository=trace_repository,
    )

    response = planner.submit_turn(
        conversation_id="conversation_ambiguous_target_guard",
        text="提交费用",
        now="2026-05-21T09:00:00+08:00",
        timezone="Asia/Shanghai",
    )

    assert response["kind"] == "clarification_request"
    assert response["question"] == "你要操作哪一笔费用？"
    assert response["missingFields"] == ["target_id"]
    assert store.list_pending_plans_for_conversation("conversation_ambiguous_target_guard") == []
    assert store.list_ledger("conversation_ambiguous_target_guard") == []
    assert trace_repository.traces[0].policy_decisions == [
        "当前会话中存在多个可操作目标，不能替用户猜测 target_id。",
    ]


def test_planner_returns_clarification_for_missing_expense_amount() -> None:
    store = InMemoryExecutionStore()
    planner = ExecutionPlanner(store=store)

    response = planner.submit_turn(
        conversation_id="conversation_001",
        text="把昨天打车票报销",
        now="2026-05-21T09:00:00+08:00",
        timezone="Asia/Shanghai",
    )

    assert response["kind"] == "clarification_request"
    assert response["conversationId"] == "conversation_001"
    assert response["question"] == "打车票报销需要补充金额。"
    assert response["missingFields"] == ["amount"]
    assert response["quickReplies"] == ["58 元", "100 元", "我再说具体金额"]
    assert response["clarificationId"].startswith("pending_")


def test_planner_returns_confirmation_required_for_expense_with_amount() -> None:
    store = InMemoryExecutionStore()
    planner = ExecutionPlanner(store=store)

    response = planner.submit_turn(
        conversation_id="conversation_001",
        text="把昨天 58 元打车票报销",
        now="2026-05-21T09:00:00+08:00",
        timezone="Asia/Shanghai",
    )

    assert response["kind"] == "confirmation_required"
    plan = response["plan"]
    confirmation = plan["confirmation"]
    assert confirmation is not None
    assert plan["actions"][0]["actionType"] == "expense.create_reimbursement_draft"
    assert plan["actions"][0]["payload"]["amount"] == 58
    assert confirmation["confirmToken"].startswith("confirm_")


def test_planner_returns_confirmation_required_for_reminder() -> None:
    store = InMemoryExecutionStore()
    planner = ExecutionPlanner(store=store)

    response = planner.submit_turn(
        conversation_id="conversation_001",
        text="明天上午九点提醒我带电脑",
        now="2026-05-21T09:00:00+08:00",
        timezone="Asia/Shanghai",
    )

    assert response["kind"] == "confirmation_required"
    plan = response["plan"]
    confirmation = plan["confirmation"]
    assert confirmation is not None
    assert plan["actions"][0]["actionType"] == "reminder.create_reminder"
    assert plan["actions"][0]["payload"]["title"] == "带电脑"
    assert confirmation["confirmToken"].startswith("confirm_")


def test_planner_decision_trace_records_planner_mode_and_fallback_reason() -> None:
    trace_repository = CapturingDecisionTraceRepository()
    planner = ExecutionPlanner(
        store=InMemoryExecutionStore(),
        planning_engine=FixedPlanningEngine(),
        decision_trace_repository=trace_repository,
    )

    response = planner.submit_turn(
        conversation_id="conversation_trace_001",
        text="明天上午九点提醒我带电脑",
        now="2026-05-21T09:00:00+08:00",
        timezone="Asia/Shanghai",
    )

    assert response["kind"] == "confirmation_required"
    assert len(trace_repository.traces) == 1
    trace = trace_repository.traces[0]
    assert trace.planner_mode == "llm_first"
    assert trace.fallback_reason == "llm_error: RuntimeError"
    assert trace.tools_selected == ["reminder.create_reminder"]


def test_planner_decision_trace_records_llm_call_observation() -> None:
    class FixedLlmPlanningEngine:
        def plan(
            self,
            planning_input: PlanningInput,
            context_pack: ContextPack,
        ) -> PlanningResult:
            del planning_input, context_pack
            return PlanningResult(
                kind="assistant_message",
                trace_id="llm-chat",
                message="可以，我在。",
                planner_mode="llm_first",
                llm_call={
                    "provider": "DeepSeekLlmProvider",
                    "model": "deepseek-v4-flash",
                    "mode": "llm",
                    "status": "completed",
                    "durationMs": 321,
                    "promptChars": 1000,
                    "responseChars": 120,
                    "promptSha256": "abc123",
                },
            )

    trace_repository = CapturingDecisionTraceRepository()
    planner = ExecutionPlanner(
        store=InMemoryExecutionStore(),
        planning_engine=FixedLlmPlanningEngine(),
        decision_trace_repository=trace_repository,
    )

    response = planner.submit_turn(
        conversation_id="conversation_trace_llm_call",
        text="今天有点累",
        now="2026-05-21T09:00:00+08:00",
        timezone="Asia/Shanghai",
    )

    assert response["kind"] == "assistant_message"
    assert len(trace_repository.traces) == 1
    assert trace_repository.traces[0].llm_call == {
        "provider": "DeepSeekLlmProvider",
        "model": "deepseek-v4-flash",
        "mode": "llm",
        "status": "completed",
        "durationMs": 321,
        "promptChars": 1000,
        "responseChars": 120,
        "promptSha256": "abc123",
    }


def test_planner_decision_trace_keeps_tools_considered_as_action_types() -> None:
    trace_repository = CapturingDecisionTraceRepository()
    tool_contract = (
        '{"action_type": "reminder.create_reminder", '
        '"domain": "reminder", '
        '"required": ["title", "due_at", "timezone"]}'
    )
    empty_list_provider: StaticContextProvider[list[str]] = StaticContextProvider([])
    context_assembler = ContextAssembler(
        conversation_provider=empty_list_provider,
        pending_plan_provider=empty_list_provider,
        pending_clarification_provider=empty_list_provider,
        calendar_provider=empty_list_provider,
        reminder_provider=empty_list_provider,
        expense_provider=empty_list_provider,
        attachment_provider=empty_list_provider,
        preference_provider=empty_list_provider,
        summary_memory_provider=empty_list_provider,
        tool_catalog_provider=StaticContextProvider([tool_contract]),
    )
    planner = ExecutionPlanner(
        store=InMemoryExecutionStore(),
        planning_engine=FixedPlanningEngine(),
        context_assembler=context_assembler,
        decision_trace_repository=trace_repository,
    )

    planner.submit_turn(
        conversation_id="conversation_trace_tool_contract",
        text="明天上午九点提醒我带电脑",
        now="2026-05-21T09:00:00+08:00",
        timezone="Asia/Shanghai",
    )

    trace = trace_repository.traces[0]
    assert trace.tools_considered == ["reminder.create_reminder"]
    assert trace.tools_selected == ["reminder.create_reminder"]


def test_planner_returns_single_confirmation_for_three_actions() -> None:
    store = InMemoryExecutionStore()
    planner = ExecutionPlanner(store=store)

    response = planner.submit_turn(
        conversation_id="conversation_001",
        text="明天下午三点开会，顺便把昨天 58 元打车票报销，再提醒我带电脑",
        now="2026-05-21T09:00:00+08:00",
        timezone="Asia/Shanghai",
    )

    assert response["kind"] == "confirmation_required"
    plan = response["plan"]
    confirmation = plan["confirmation"]
    assert confirmation is not None
    assert [action["actionType"] for action in plan["actions"]] == [
        "calendar.create_event",
        "expense.create_reimbursement_draft",
        "reminder.create_reminder",
    ]
    assert confirmation["requiredActionIds"] == [
        action["id"] for action in plan["actions"]
    ]


def test_executor_confirms_and_executes_calendar_action() -> None:
    store = InMemoryExecutionStore()
    calendar_service = CalendarDomainService(InMemoryCalendarEventRepository())
    planner = ExecutionPlanner(store=store)
    expense_service = ExpenseDomainService(InMemoryExpenseRecordRepository())
    reminder_service = ReminderDomainService(InMemoryReminderRepository())
    coordinator = ExecutionCoordinator(
        store=store,
        calendar_service=calendar_service,
        expense_service=expense_service,
        reminder_service=reminder_service,
    )

    planning_response = planner.submit_turn(
        conversation_id="conversation_001",
        text="明天下午三点开会",
        now="2026-05-21T09:00:00+08:00",
        timezone="Asia/Shanghai",
    )
    plan = planning_response["plan"]
    confirmation = plan["confirmation"]
    assert confirmation is not None

    result = coordinator.confirm_plan(
        plan_id=plan["id"],
        confirm_token=confirmation["confirmToken"],
    )

    assert result["kind"] == "execution_result"
    assert result["plan"]["status"] == "succeeded"
    assert calendar_service.list_events()[0]["title"] == "开会"


def test_executor_confirms_and_executes_three_actions() -> None:
    store = InMemoryExecutionStore()
    calendar_service = CalendarDomainService(InMemoryCalendarEventRepository())
    expense_service = ExpenseDomainService(InMemoryExpenseRecordRepository())
    reminder_service = ReminderDomainService(InMemoryReminderRepository())
    planner = ExecutionPlanner(store=store)
    coordinator = ExecutionCoordinator(
        store=store,
        calendar_service=calendar_service,
        expense_service=expense_service,
        reminder_service=reminder_service,
    )

    planning_response = planner.submit_turn(
        conversation_id="conversation_001",
        text="明天下午三点开会，顺便把昨天 58 元打车票报销，再提醒我带电脑",
        now="2026-05-21T09:00:00+08:00",
        timezone="Asia/Shanghai",
    )
    plan = planning_response["plan"]
    confirmation = plan["confirmation"]
    assert confirmation is not None

    result = coordinator.confirm_plan(
        plan_id=plan["id"],
        confirm_token=confirmation["confirmToken"],
    )

    assert result["kind"] == "execution_result"
    assert result["plan"]["status"] == "succeeded"
    assert calendar_service.list_events()[0]["title"] == "开会"
    assert expense_service.list_records()[0]["amount"] == 58
    assert reminder_service.list_reminders()[0]["title"] == "带电脑"


def test_executor_confirms_and_executes_expense_action() -> None:
    store = InMemoryExecutionStore()
    calendar_service = CalendarDomainService(InMemoryCalendarEventRepository())
    expense_service = ExpenseDomainService(InMemoryExpenseRecordRepository())
    reminder_service = ReminderDomainService(InMemoryReminderRepository())
    planner = ExecutionPlanner(store=store)
    coordinator = ExecutionCoordinator(
        store=store,
        calendar_service=calendar_service,
        expense_service=expense_service,
        reminder_service=reminder_service,
    )

    planning_response = planner.submit_turn(
        conversation_id="conversation_001",
        text="把昨天 58 元打车票报销",
        now="2026-05-21T09:00:00+08:00",
        timezone="Asia/Shanghai",
    )
    plan = planning_response["plan"]
    confirmation = plan["confirmation"]
    assert confirmation is not None

    result = coordinator.confirm_plan(
        plan_id=plan["id"],
        confirm_token=confirmation["confirmToken"],
    )

    assert result["kind"] == "execution_result"
    assert result["plan"]["status"] == "succeeded"
    assert expense_service.list_records()[0]["title"] == "打车票报销"
    assert expense_service.list_records()[0]["amount"] == 58


def test_executor_confirms_and_executes_reminder_action() -> None:
    store = InMemoryExecutionStore()
    calendar_service = CalendarDomainService(InMemoryCalendarEventRepository())
    expense_service = ExpenseDomainService(InMemoryExpenseRecordRepository())
    reminder_service = ReminderDomainService(InMemoryReminderRepository())
    planner = ExecutionPlanner(store=store)
    coordinator = ExecutionCoordinator(
        store=store,
        calendar_service=calendar_service,
        expense_service=expense_service,
        reminder_service=reminder_service,
    )

    planning_response = planner.submit_turn(
        conversation_id="conversation_001",
        text="明天上午九点提醒我带电脑",
        now="2026-05-21T09:00:00+08:00",
        timezone="Asia/Shanghai",
    )
    plan = planning_response["plan"]
    confirmation = plan["confirmation"]
    assert confirmation is not None

    result = coordinator.confirm_plan(
        plan_id=plan["id"],
        confirm_token=confirmation["confirmToken"],
    )

    assert result["kind"] == "execution_result"
    assert result["plan"]["status"] == "succeeded"
    reminder = reminder_service.list_reminders()[0]
    assert reminder["title"] == "带电脑"
    assert reminder["dueAt"] == "2026-05-22T09:00:00+08:00"
    assert reminder["status"] == "scheduled"


def test_executor_writes_summary_memory_for_succeeded_action() -> None:
    store = InMemoryExecutionStore()
    memory_repository = InMemorySummaryMemoryRepository()
    calendar_service = CalendarDomainService(InMemoryCalendarEventRepository())
    expense_service = ExpenseDomainService(InMemoryExpenseRecordRepository())
    reminder_service = ReminderDomainService(InMemoryReminderRepository())
    planner = ExecutionPlanner(store=store)
    coordinator = ExecutionCoordinator(
        store=store,
        calendar_service=calendar_service,
        expense_service=expense_service,
        reminder_service=reminder_service,
        summary_memory_repository=memory_repository,
    )

    planning_response = planner.submit_turn(
        conversation_id="conversation_memory_001",
        text="明天上午九点提醒我带电脑",
        now="2026-05-21T09:00:00+08:00",
        timezone="Asia/Shanghai",
    )
    plan = planning_response["plan"]
    confirmation = plan["confirmation"]
    assert confirmation is not None

    coordinator.confirm_plan(
        plan_id=plan["id"],
        confirm_token=confirmation["confirmToken"],
    )

    memories = memory_repository.list_for_conversation("conversation_memory_001")
    assert len(memories) == 1
    assert memories[0].memory_type == "domain_fact"
    assert memories[0].summary == "创建提醒：带电脑；状态 scheduled"
    assert memories[0].payload["domain"] == "reminder"
    assert memories[0].payload["actionType"] == "reminder.create_reminder"
    assert memories[0].payload["actionId"] == plan["actions"][0]["id"]
    assert memories[0].payload["planId"] == plan["id"]
    assert memories[0].payload["factId"] == reminder_service.list_reminders()[0]["id"]
    assert memories[0].payload["factTitle"] == "带电脑"
    assert memories[0].payload["factStatus"] == "scheduled"


def test_executor_does_not_fail_confirmation_when_summary_memory_write_fails(
    caplog: pytest.LogCaptureFixture,
) -> None:
    caplog.set_level(logging.WARNING, logger="uvicorn.error")
    store = InMemoryExecutionStore()
    calendar_service = CalendarDomainService(InMemoryCalendarEventRepository())
    expense_service = ExpenseDomainService(InMemoryExpenseRecordRepository())
    reminder_service = ReminderDomainService(InMemoryReminderRepository())
    planner = ExecutionPlanner(store=store)
    coordinator = ExecutionCoordinator(
        store=store,
        calendar_service=calendar_service,
        expense_service=expense_service,
        reminder_service=reminder_service,
        summary_memory_repository=FailingSummaryMemoryRepository(),
    )

    planning_response = planner.submit_turn(
        conversation_id="conversation_memory_failure",
        text="明天上午九点提醒我带电脑",
        now="2026-05-21T09:00:00+08:00",
        timezone="Asia/Shanghai",
    )
    plan = planning_response["plan"]
    confirmation = plan["confirmation"]
    assert confirmation is not None

    result = coordinator.confirm_plan(
        plan_id=plan["id"],
        confirm_token=confirmation["confirmToken"],
    )

    assert result["kind"] == "execution_result"
    assert result["plan"]["status"] == "succeeded"
    assert result["plan"]["actions"][0]["status"] == "succeeded"
    saved_plan = store.get_plan(plan["id"])
    assert saved_plan["status"] == "succeeded"
    assert saved_plan["confirmation"] is not None
    assert saved_plan["confirmation"]["status"] == "confirmed"
    assert reminder_service.list_reminders()[0]["title"] == "带电脑"
    ledger = store.list_ledger("conversation_memory_failure")
    assert ledger[-1]["eventType"] == "action_executed"
    assert ledger[-1]["status"] == "succeeded"
    assert all(record["eventType"] != "action_failed" for record in ledger)
    assert "Summary memory save failed" in caplog.text
    assert f"plan_id={plan['id']}" in caplog.text
    assert f"action_id={plan['actions'][0]['id']}" in caplog.text
    assert "action_type=reminder.create_reminder" in caplog.text
    assert "conversation_id=conversation_memory_failure" in caplog.text


def test_executor_rejects_partial_action_confirmation() -> None:
    store = InMemoryExecutionStore()
    calendar_service = CalendarDomainService(InMemoryCalendarEventRepository())
    expense_service = ExpenseDomainService(InMemoryExpenseRecordRepository())
    reminder_service = ReminderDomainService(InMemoryReminderRepository())
    coordinator = ExecutionCoordinator(
        store=store,
        calendar_service=calendar_service,
        expense_service=expense_service,
        reminder_service=reminder_service,
    )
    plan: ExecutionPlanRecord = {
        "id": "plan_multi",
        "conversationId": "conversation_001",
        "status": "awaiting_confirmation",
        "riskLevel": "medium",
        "summary": "确认后执行计划",
        "decisionTraceId": "test-trace",
        "actions": [
            {
                "id": "action_001",
                "planId": "plan_multi",
                "domain": "calendar",
                "actionType": "calendar.create_event",
                "status": "awaiting_confirmation",
                "riskLevel": "medium",
                "summary": "创建日程：开会",
                "payload": {
                    "title": "开会",
                    "start_at": "2026-05-22T15:00:00+08:00",
                    "end_at": "2026-05-22T16:00:00+08:00",
                    "timezone": "Asia/Shanghai",
                },
            },
            {
                "id": "action_002",
                "planId": "plan_multi",
                "domain": "calendar",
                "actionType": "calendar.create_event",
                "status": "awaiting_confirmation",
                "riskLevel": "medium",
                "summary": "创建日程：复盘",
                "payload": {
                    "title": "复盘",
                    "start_at": "2026-05-22T16:00:00+08:00",
                    "end_at": "2026-05-22T17:00:00+08:00",
                    "timezone": "Asia/Shanghai",
                },
            },
        ],
        "confirmation": {
            "id": "confirmation_multi",
            "planId": "plan_multi",
            "status": "pending",
            "requiredActionIds": ["action_001", "action_002"],
            "title": "请确认执行计划",
            "description": "确认后我会执行这些动作。",
            "confirmToken": "confirm_multi",
        },
    }
    store.save_plan(plan)

    with pytest.raises(ValueError, match="partial action confirmation is not supported"):
        coordinator.confirm_plan(
            plan_id="plan_multi",
            confirm_token="confirm_multi",
            action_ids=["action_001"],
        )

    assert store.get_plan("plan_multi")["status"] == "awaiting_confirmation"
    assert calendar_service.list_events() == []
