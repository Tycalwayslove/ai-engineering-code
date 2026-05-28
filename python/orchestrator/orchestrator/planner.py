import json
import re
from datetime import datetime, timedelta
from typing import cast
from uuid import uuid4
from zoneinfo import ZoneInfo

from agent_runtime.clarifications.types import PendingClarification
from agent_runtime.context.assembler import ContextAssembler
from agent_runtime.context.types import ContextPack
from agent_runtime.memory.event_log import AgentEvent, EventLogRepository
from agent_runtime.planning.compiler import PlanCompiler
from agent_runtime.planning.engine import PlanningEngine
from agent_runtime.planning.rule_based import RuleBasedPlanningEngine
from agent_runtime.planning.types import (
    ClarificationRequest,
    PlanCandidate,
    PlanningInput,
    PlanningResult,
    ProposedAction,
)
from agent_runtime.policy.engine import PolicyEngine
from agent_runtime.policy.management_targets import ManagementTargetValidator
from agent_runtime.policy.types import PolicyDecision
from agent_runtime.tracing.decision_trace import DecisionTrace, DecisionTraceRepository
from backend.app.services.execution_store import (
    ExecutionPlanRecord,
    ExecutionStore,
)
from backend.app.services.pending_clarification_store import PendingClarificationStore

from orchestrator.types import AgentTurnResponse


class ExecutionPlanner:
    def __init__(
        self,
        store: ExecutionStore,
        planning_engine: PlanningEngine | None = None,
        policy_engine: PolicyEngine | None = None,
        target_validator: ManagementTargetValidator | None = None,
        plan_compiler: PlanCompiler | None = None,
        context_assembler: ContextAssembler | None = None,
        event_log_repository: EventLogRepository | None = None,
        decision_trace_repository: DecisionTraceRepository | None = None,
        pending_clarification_store: PendingClarificationStore | None = None,
    ) -> None:
        self._store = store
        self._planning_engine = planning_engine or RuleBasedPlanningEngine()
        self._policy_engine = policy_engine or PolicyEngine()
        self._target_validator = target_validator or ManagementTargetValidator()
        self._plan_compiler = plan_compiler or PlanCompiler()
        self._context_assembler = context_assembler
        self._event_log_repository = event_log_repository
        self._decision_trace_repository = decision_trace_repository
        self._pending_clarification_store = pending_clarification_store

    def submit_turn(
        self,
        conversation_id: str,
        text: str,
        now: str,
        timezone: str,
    ) -> AgentTurnResponse:
        self._record_event(
            AgentEvent(
                conversation_id=conversation_id,
                event_type="planning_started",
                payload={"text": text, "now": now, "timezone": timezone},
            )
        )
        now_dt = self._parse_datetime(now, timezone)
        open_pending = self._latest_open_pending(conversation_id, now_dt)
        resolved_candidate = self._try_resolve_pending_clarification(
            conversation_id=conversation_id,
            text=text,
            now=now,
            timezone=timezone,
        )
        if resolved_candidate is None:
            context_pack = self._assemble_context(
                conversation_id=conversation_id,
                text=text,
                now=now,
                timezone=timezone,
            )
            planning_result = self._planning_engine.plan(
                PlanningInput(
                    conversation_id=conversation_id,
                    text=text,
                    now=now,
                    timezone=timezone,
                ),
                context_pack,
            )
        else:
            pending_id, resolved_plan_candidate = resolved_candidate
            context_pack = self._assemble_context(
                conversation_id=conversation_id,
                text=text,
                now=now,
                timezone=timezone,
            )
            planning_result = PlanningResult(
                kind="plan_candidate",
                trace_id=f"pending-clarification-{pending_id}",
                candidate=resolved_plan_candidate,
                planner_mode="pending_clarification",
            )

        if (
            open_pending is not None
            and resolved_candidate is None
            and planning_result.kind in ("clarification", "plan_candidate")
        ):
            self._mark_pending_abandoned(open_pending.id, now_dt)

        if planning_result.kind == "assistant_message":
            self._save_trace(
                conversation_id=conversation_id,
                trace=self._non_action_decision_trace_from_result(
                    planning_result=planning_result,
                    context_pack=context_pack,
                    missing_information=[],
                    policy_decisions=["未生成写入动作。"],
                ),
            )
            self._record_event(
                AgentEvent(
                    conversation_id=conversation_id,
                    event_type="planning_no_action",
                    payload={
                        "traceId": planning_result.trace_id,
                        "message": planning_result.message,
                    },
                )
            )
            return {
                "kind": "assistant_message",
                "conversationId": conversation_id,
                "message": planning_result.message
                or "我还没有识别到可执行的日程、费用或提醒动作。",
                "structuredElements": planning_result.structured_elements,
            }

        if planning_result.kind == "clarification" and planning_result.clarification:
            self._save_trace(
                conversation_id=conversation_id,
                trace=self._non_action_decision_trace_from_result(
                    planning_result=planning_result,
                    context_pack=context_pack,
                    missing_information=planning_result.clarification.missing_fields,
                    policy_decisions=["缺少必要字段，等待用户补充。"],
                ),
            )
            pending_id = self._save_planning_clarification(
                conversation_id=conversation_id,
                clarification=planning_result.clarification,
                now=now,
                timezone=timezone,
            )
            self._record_event(
                AgentEvent(
                    conversation_id=conversation_id,
                    event_type="planning_clarification_requested",
                    payload={
                        "traceId": planning_result.trace_id,
                        "missingFields": planning_result.clarification.missing_fields,
                    },
                )
            )
            return {
                "kind": "clarification_request",
                "conversationId": conversation_id,
                "question": planning_result.clarification.question,
                "missingFields": planning_result.clarification.missing_fields,
                "quickReplies": planning_result.clarification.quick_replies,
                "quickReplyOptions": self._quick_reply_options(
                    quick_replies=planning_result.clarification.quick_replies,
                    partial_payload=planning_result.clarification.partial_payload,
                ),
                "clarificationId": pending_id,
            }

        candidate = planning_result.candidate
        if candidate is None:
            self._save_trace(
                conversation_id=conversation_id,
                trace=self._non_action_decision_trace_from_result(
                    planning_result=planning_result,
                    context_pack=context_pack,
                    missing_information=[],
                    policy_decisions=["规划结果没有候选动作。"],
                ),
            )
            self._record_event(
                AgentEvent(
                    conversation_id=conversation_id,
                    event_type="planning_no_action",
                    payload={"traceId": planning_result.trace_id},
                )
            )
            return {
                "kind": "assistant_message",
                "conversationId": conversation_id,
                "message": "我还没有识别到可执行的日程、费用或提醒动作。",
                "structuredElements": [],
            }

        policy_decision = self._policy_engine.evaluate(candidate)
        target_policy_decision = None
        if not policy_decision.missing_fields:
            target_policy_decision = self._target_validator.evaluate(
                candidate,
                context_pack,
            )
        if target_policy_decision is not None:
            self._save_trace(
                conversation_id=conversation_id,
                trace=self._decision_trace_from_result(
                    planning_result=planning_result,
                    policy_decision=target_policy_decision,
                    context_pack=context_pack,
                ),
            )
            self._record_event(
                AgentEvent(
                    conversation_id=conversation_id,
                    event_type="planning_clarification_requested",
                    payload={
                        "traceId": planning_result.trace_id,
                        "missingFields": target_policy_decision.missing_fields,
                    },
                )
            )
            return {
                "kind": "clarification_request",
                "conversationId": conversation_id,
                "question": target_policy_decision.clarification_question
                or "需要重新确认目标事项。",
                "missingFields": target_policy_decision.missing_fields,
                "quickReplies": [],
                "quickReplyOptions": [],
            }

        self._save_trace(
            conversation_id=conversation_id,
            trace=self._decision_trace_from_result(
                planning_result=planning_result,
                policy_decision=policy_decision,
                context_pack=context_pack,
            ),
        )
        if policy_decision.missing_fields and policy_decision.clarification_question:
            clarification = self._clarification_from_policy_decision(
                candidate=candidate,
                policy_decision=policy_decision,
            )
            pending_id = self._save_planning_clarification(
                conversation_id=conversation_id,
                clarification=clarification,
                now=now,
                timezone=timezone,
            )
            self._record_event(
                AgentEvent(
                    conversation_id=conversation_id,
                    event_type="planning_clarification_requested",
                    payload={
                        "traceId": planning_result.trace_id,
                        "missingFields": policy_decision.missing_fields,
                    },
                )
            )
            return {
                "kind": "clarification_request",
                "conversationId": conversation_id,
                "question": policy_decision.clarification_question,
                "missingFields": policy_decision.missing_fields,
                "quickReplies": clarification.quick_replies,
                "quickReplyOptions": self._quick_reply_options(
                    quick_replies=clarification.quick_replies,
                    partial_payload=clarification.partial_payload,
                ),
                "clarificationId": pending_id,
            }

        plan = cast(
            ExecutionPlanRecord,
            self._plan_compiler.compile(
                conversation_id=conversation_id,
                candidate=candidate,
                policy_decision=policy_decision,
                decision_trace_id=planning_result.trace_id,
            ),
        )
        self._store.save_plan(plan)
        self._store.append_ledger(
            plan_id=plan["id"],
            event_type="plan_created",
            status="info",
            message="Execution plan created.",
        )
        self._store.append_ledger(
            plan_id=plan["id"],
            event_type="confirmation_created",
            status="info",
            message="Confirmation required before execution.",
        )
        self._record_event(
            AgentEvent(
                conversation_id=conversation_id,
                event_type="execution_plan_created",
                plan_id=plan["id"],
                payload={
                    "traceId": planning_result.trace_id,
                    "actionCount": len(plan["actions"]),
                    "requiresConfirmation": plan["confirmation"] is not None,
                },
            )
        )
        response: AgentTurnResponse = {
            "kind": "confirmation_required",
            "conversationId": conversation_id,
            "plan": plan,
        }
        if planning_result.message:
            response["message"] = planning_result.message
        return response

    def _assemble_context(
        self,
        conversation_id: str,
        text: str,
        now: str,
        timezone: str,
    ) -> ContextPack:
        if self._context_assembler is None:
            return ContextPack.empty()
        return self._context_assembler.assemble(
            conversation_id=conversation_id,
            current_input=text,
            current_time=now,
            timezone=timezone,
        )

    def _save_planning_clarification(
        self,
        conversation_id: str,
        clarification: ClarificationRequest,
        now: str,
        timezone: str,
    ) -> str:
        pending_id = f"pending_{uuid4().hex}"
        if self._pending_clarification_store is None:
            return pending_id

        created_at = self._parse_datetime(now, timezone)
        pending = PendingClarification(
            id=pending_id,
            conversation_id=conversation_id,
            domain=clarification.domain or "",
            action_type=clarification.action_type or "",
            question=clarification.question,
            missing_fields=clarification.missing_fields,
            partial_payload=clarification.partial_payload,
            quick_replies=clarification.quick_replies,
            status="open",
            created_at=created_at,
            expires_at=created_at + timedelta(hours=24),
            resolved_at=None,
        )
        self._pending_clarification_store.save(pending)
        return pending_id

    def _quick_reply_options(
        self,
        *,
        quick_replies: list[str],
        partial_payload: dict[str, object],
    ) -> list[dict[str, str]]:
        candidate_values = self._quick_reply_candidate_values(
            partial_payload=partial_payload,
            count=len(quick_replies),
        )
        options: list[dict[str, str]] = []
        for index, label in enumerate(quick_replies):
            value = candidate_values[index] if candidate_values else label
            options.append({"label": label, "value": value})
        return options

    def _quick_reply_candidate_values(
        self,
        *,
        partial_payload: dict[str, object],
        count: int,
    ) -> list[str] | None:
        raw_candidate_ids = partial_payload.get("candidate_target_ids")
        if not isinstance(raw_candidate_ids, list):
            return None
        candidate_ids = [
            item.strip()
            for item in raw_candidate_ids
            if isinstance(item, str) and item.strip() != ""
        ]
        if len(candidate_ids) != count:
            return None
        return candidate_ids

    def _try_resolve_pending_clarification(
        self,
        conversation_id: str,
        text: str,
        now: str,
        timezone: str,
    ) -> tuple[str, PlanCandidate] | None:
        if self._pending_clarification_store is None:
            return None

        now_dt = self._parse_datetime(now, timezone)
        pending = self._latest_open_pending(conversation_id, now_dt)
        if pending is None:
            return None

        if pending.missing_fields == ["target_id"]:
            resolved_target = self._try_resolve_target_pending(
                conversation_id=conversation_id,
                pending=pending,
                text=text,
                now=now_dt,
                timezone=timezone,
            )
            if resolved_target is not None:
                return resolved_target
        if pending.action_type == "calendar.create_event":
            return self._try_resolve_calendar_pending(
                pending=pending,
                text=text,
                now=now_dt,
                timezone=timezone,
            )
        if pending.action_type == "expense.create_reimbursement_draft":
            return self._try_resolve_expense_pending(
                pending=pending,
                text=text,
                now=now_dt,
            )
        if pending.action_type == "reminder.create_reminder":
            return self._try_resolve_reminder_pending(
                pending=pending,
                text=text,
                now=now_dt,
                timezone=timezone,
            )
        return None

    def _latest_open_pending(
        self,
        conversation_id: str,
        now: datetime,
    ) -> PendingClarification | None:
        if self._pending_clarification_store is None:
            return None
        return self._pending_clarification_store.latest_open(conversation_id, now)

    def _try_resolve_target_pending(
        self,
        *,
        conversation_id: str,
        pending: PendingClarification,
        text: str,
        now: datetime,
        timezone: str,
    ) -> tuple[str, PlanCandidate] | None:
        target_id = self._target_id_from_pending_selection(pending, text)
        if target_id is None:
            return None

        context_pack = self._assemble_context(
            conversation_id=conversation_id,
            text=text,
            now=now.isoformat(),
            timezone=timezone,
        )
        target = self._target_summary_by_id(
            domain=pending.domain,
            target_id=target_id,
            context_pack=context_pack,
        )
        if target is None:
            return None

        expected_status = self._expected_status_for_management_action(
            pending.action_type,
        )
        target_kind = self._target_kind_for_domain(pending.domain)
        if expected_status is None or target_kind is None:
            return None

        payload: dict[str, object] = {
            "target_id": target_id,
            "target_kind": target_kind,
            "expected_status": expected_status,
            "resolution_reason": "selected_pending_clarification_target",
        }
        patch = pending.partial_payload.get("patch")
        if pending.action_type in (
            "calendar.update_event",
            "expense.update_reimbursement",
            "reminder.update_reminder",
        ):
            if not isinstance(patch, dict):
                return None
            patch = dict(patch)
            if pending.action_type == "calendar.update_event":
                patch = self._calendar_update_patch_from_selected_target(
                    patch=patch,
                    target=target,
                )
                if patch is None:
                    return None
            payload["patch"] = patch

        title = target.get("title", "目标事项")
        summary = self._management_action_summary(pending.action_type, title)
        self._mark_pending_resolved(pending.id, now)
        return (
            pending.id,
            PlanCandidate(
                goal=summary,
                proposed_actions=[
                    ProposedAction(
                        domain=pending.domain,
                        action_type=pending.action_type,
                        summary=summary,
                        payload=payload,
                        risk_level="medium",
                        missing_fields=[],
                    )
                ],
                missing_information=[],
                assumptions=["用户从追问候选中选择了目标事项。"],
                risk_notes=[],
            ),
        )

    def _target_id_from_pending_selection(
        self,
        pending: PendingClarification,
        text: str,
    ) -> str | None:
        raw_candidate_ids = pending.partial_payload.get("candidate_target_ids", [])
        if not isinstance(raw_candidate_ids, list):
            return None
        candidate_ids = [
            item
            for item in raw_candidate_ids
            if isinstance(item, str) and item.strip() != ""
        ]
        if not candidate_ids:
            return None

        stripped = text.strip()
        if stripped in candidate_ids:
            return stripped

        quick_replies = [reply.strip() for reply in pending.quick_replies]
        if stripped in quick_replies:
            index = quick_replies.index(stripped)
            if index < len(candidate_ids):
                return candidate_ids[index]

        ordinal_index = self._selection_ordinal_index(stripped)
        if ordinal_index is not None and ordinal_index < len(candidate_ids):
            return candidate_ids[ordinal_index]
        return None

    def _calendar_update_patch_from_selected_target(
        self,
        *,
        patch: dict[object, object],
        target: dict[str, str],
    ) -> dict[str, object] | None:
        start_at = patch.get("startAt")
        if not isinstance(start_at, str) or start_at == "":
            return None

        if isinstance(patch.get("endAt"), str) and patch["endAt"] != "":
            return {str(key): value for key, value in patch.items()}

        target_start = target.get("start_at")
        target_end = target.get("end_at")
        if target_start is None or target_end is None:
            return None
        try:
            duration = datetime.fromisoformat(target_end) - datetime.fromisoformat(
                target_start,
            )
            new_start = datetime.fromisoformat(start_at)
        except ValueError:
            return None
        if duration.total_seconds() <= 0:
            duration = timedelta(hours=1)
        return {
            **{str(key): value for key, value in patch.items()},
            "endAt": (new_start + duration).isoformat(),
        }

    def _selection_ordinal_index(self, text: str) -> int | None:
        stripped = text.strip(" ，,。.!！?")
        ordinals = {
            "第一个": 0,
            "第一条": 0,
            "第1个": 0,
            "第1条": 0,
            "1": 0,
            "第二个": 1,
            "第二条": 1,
            "第2个": 1,
            "第2条": 1,
            "2": 1,
            "第三个": 2,
            "第三条": 2,
            "第3个": 2,
            "第3条": 2,
            "3": 2,
        }
        return ordinals.get(stripped)

    def _target_summary_by_id(
        self,
        *,
        domain: str,
        target_id: str,
        context_pack: ContextPack,
    ) -> dict[str, str] | None:
        summaries = {
            "calendar": context_pack.calendar_summary,
            "expense": context_pack.expense_summary,
            "reminder": context_pack.reminder_summary,
        }.get(domain, [])
        for summary in summaries:
            parsed = self._parse_context_summary(summary)
            if parsed.get("id") == target_id:
                return parsed
        return None

    def _parse_context_summary(self, summary: str) -> dict[str, str]:
        values: dict[str, str] = {}
        for part in summary.split("; "):
            key, separator, value = part.partition("=")
            if separator:
                values[key.strip()] = value.strip()
        return values

    def _expected_status_for_management_action(self, action_type: str) -> str | None:
        if action_type.startswith("calendar.") or action_type.startswith("reminder."):
            return "scheduled"
        if action_type.startswith("expense."):
            return "draft"
        return None

    def _target_kind_for_domain(self, domain: str) -> str | None:
        match domain:
            case "calendar":
                return "calendar_event"
            case "expense":
                return "expense"
            case "reminder":
                return "reminder"
            case _:
                return None

    def _management_action_summary(self, action_type: str, title: str) -> str:
        labels = {
            "calendar.cancel_event": "取消日程",
            "calendar.update_event": "更新日程",
            "expense.cancel_reimbursement": "取消费用",
            "expense.submit_reimbursement": "提交费用",
            "expense.update_reimbursement": "更新费用",
            "reminder.cancel_reminder": "取消提醒",
            "reminder.complete_reminder": "完成提醒",
            "reminder.update_reminder": "更新提醒",
        }
        return f"{labels.get(action_type, '管理事项')}：{title}"

    def _try_resolve_calendar_pending(
        self,
        *,
        pending: PendingClarification,
        text: str,
        now: datetime,
        timezone: str,
    ) -> tuple[str, PlanCandidate] | None:
        if not self._is_pure_time_reply(text):
            return None

        hour = self._hour_from_short_time(text)
        if hour is None:
            return None

        hour = self._normalize_hour_for_pending(pending, hour)
        start_at = self._datetime_from_pending(pending, hour, now, timezone)
        end_at = start_at + timedelta(hours=1)
        title = str(pending.partial_payload.get("title", "开会"))
        payload: dict[str, object] = {
            "title": title,
            "start_at": start_at.isoformat(),
            "end_at": end_at.isoformat(),
            "timezone": timezone,
        }
        if "attachment_id" in pending.partial_payload:
            payload["attachment_id"] = pending.partial_payload["attachment_id"]
        if "attachment_name" in pending.partial_payload:
            payload["attachment_name"] = pending.partial_payload["attachment_name"]
        self._mark_pending_resolved(pending.id, now)
        return (
            pending.id,
            PlanCandidate(
                goal=f"创建日程：{title}",
                proposed_actions=[
                    ProposedAction(
                        domain="calendar",
                        action_type="calendar.create_event",
                        summary=f"创建日程：{title}",
                        payload=payload,
                        risk_level="medium",
                        missing_fields=[],
                    )
                ],
                missing_information=[],
                assumptions=["用户补充了开始时间，未说明时长，默认 1 小时。"],
                risk_notes=[],
            ),
        )

    def _try_resolve_expense_pending(
        self,
        *,
        pending: PendingClarification,
        text: str,
        now: datetime,
    ) -> tuple[str, PlanCandidate] | None:
        amount = self._amount_from_reply(text)
        if amount is None:
            return None

        payload = dict(pending.partial_payload)
        payload["amount"] = amount
        payload.setdefault("currency", "CNY")
        payload.setdefault("occurred_on", now.date().isoformat())
        title = str(payload.get("title", "打车票报销"))
        amount_summary = f"{amount:g} 元"
        self._mark_pending_resolved(pending.id, now)
        return (
            pending.id,
            PlanCandidate(
                goal=f"创建费用草稿：{title} {amount_summary}",
                proposed_actions=[
                    ProposedAction(
                        domain="expense",
                        action_type="expense.create_reimbursement_draft",
                        summary=f"创建费用草稿：{title} {amount_summary}",
                        payload=payload,
                        risk_level="medium",
                        missing_fields=[],
                    )
                ],
                missing_information=[],
                assumptions=["用户补充了费用金额。"],
                risk_notes=[],
            ),
        )

    def _try_resolve_reminder_pending(
        self,
        *,
        pending: PendingClarification,
        text: str,
        now: datetime,
        timezone: str,
    ) -> tuple[str, PlanCandidate] | None:
        if not self._is_pure_time_reply(text):
            return None

        hour = self._hour_from_short_time(text)
        if hour is None:
            return None

        hour = self._normalize_hour_for_pending(pending, hour)
        due_at = self._datetime_from_pending(pending, hour, now, timezone)
        title = str(pending.partial_payload.get("title", "提醒"))
        self._mark_pending_resolved(pending.id, now)
        return (
            pending.id,
            PlanCandidate(
                goal=f"创建提醒：{title}",
                proposed_actions=[
                    ProposedAction(
                        domain="reminder",
                        action_type="reminder.create_reminder",
                        summary=f"创建提醒：{title}",
                        payload={
                            "title": title,
                            "due_at": due_at.isoformat(),
                            "timezone": timezone,
                        },
                        risk_level="medium",
                        missing_fields=[],
                    )
                ],
                missing_information=[],
                assumptions=["用户补充了提醒时间。"],
                risk_notes=[],
            ),
        )

    def _clarification_from_policy_decision(
        self,
        *,
        candidate: PlanCandidate,
        policy_decision: PolicyDecision,
    ) -> ClarificationRequest:
        action = candidate.proposed_actions[0]
        quick_replies = []
        if (
            action.action_type == "expense.create_reimbursement_draft"
            and policy_decision.missing_fields == ["amount"]
        ):
            quick_replies = ["58 元", "100 元", "我再说具体金额"]
        return ClarificationRequest(
            question=policy_decision.clarification_question or "需要补充信息。",
            missing_fields=policy_decision.missing_fields,
            domain=action.domain,
            action_type=action.action_type,
            quick_replies=quick_replies,
            partial_payload=action.payload,
        )

    def _mark_pending_resolved(self, pending_id: str, resolved_at: datetime) -> None:
        if self._pending_clarification_store is not None:
            self._pending_clarification_store.mark_resolved(pending_id, resolved_at)

    def _mark_pending_abandoned(self, pending_id: str, abandoned_at: datetime) -> None:
        if self._pending_clarification_store is not None:
            self._pending_clarification_store.mark_abandoned(pending_id, abandoned_at)

    def _is_pure_time_reply(self, text: str) -> bool:
        stripped = text.strip(" ，,。.!！?")
        return re.fullmatch(
            r"(?:今天|明天|后天)?(?:上午|中午|下午|晚上)?"
            r"(?:[一二三四五六七八九十]|\d{1,2})点",
            stripped,
        ) is not None

    def _amount_from_reply(self, text: str) -> float | None:
        stripped = text.strip(" ，,。.!！?")
        match = re.fullmatch(r"(\d+(?:\.\d{1,2})?)\s*(?:元|块)?", stripped)
        if match is None:
            return None
        return float(match.group(1))

    def _hour_from_short_time(self, text: str) -> int | None:
        stripped = text.strip()
        mapping = {
            "九点": 9,
            "9点": 9,
            "上午九点": 9,
            "上午9点": 9,
            "明天上午九点": 9,
            "明天上午9点": 9,
            "十点": 10,
            "10点": 10,
            "上午十点": 10,
            "上午10点": 10,
            "明天上午十点": 10,
            "明天上午10点": 10,
        }
        if stripped in mapping:
            return mapping[stripped]
        match = re.search(r"([一二三四五六七八九十]|\d{1,2})点", stripped)
        if match is None:
            return None
        return self._parse_hour_token(match.group(1))

    def _parse_hour_token(self, value: str) -> int:
        if value.isdigit():
            return int(value)
        return {
            "一": 1,
            "二": 2,
            "三": 3,
            "四": 4,
            "五": 5,
            "六": 6,
            "七": 7,
            "八": 8,
            "九": 9,
            "十": 10,
        }.get(value, 9)

    def _normalize_hour_for_pending(
        self,
        pending: PendingClarification,
        hour: int,
    ) -> int:
        time_range_hint = str(pending.partial_payload.get("time_range_hint", ""))
        if time_range_hint == "afternoon" and hour < 12:
            return hour + 12
        if time_range_hint == "evening" and hour < 12:
            return hour + 12
        if time_range_hint == "noon" and hour == 1:
            return 13
        return hour

    def _datetime_from_pending(
        self,
        pending: PendingClarification,
        hour: int,
        now: datetime,
        timezone: str,
    ) -> datetime:
        tz = ZoneInfo(timezone)
        target_day = now.astimezone(tz)
        date_hint = str(pending.partial_payload.get("date_hint", "")).strip()
        if date_hint in ("tomorrow", "明天"):
            target_day = target_day + timedelta(days=1)
        elif date_hint in ("day_after_tomorrow", "后天"):
            target_day = target_day + timedelta(days=2)
        elif date_hint in ("today", "今天"):
            target_day = target_day
        elif re.match(r"^\d{4}-\d{2}-\d{2}$", date_hint):
            parsed_date = datetime.fromisoformat(date_hint).date()
            target_day = target_day.replace(
                year=parsed_date.year,
                month=parsed_date.month,
                day=parsed_date.day,
            )
        return target_day.replace(hour=hour, minute=0, second=0, microsecond=0)

    def _parse_datetime(self, value: str, timezone: str) -> datetime:
        parsed = datetime.fromisoformat(value)
        target_timezone = ZoneInfo(timezone)
        if parsed.tzinfo is None:
            return parsed.replace(tzinfo=target_timezone)
        return parsed.astimezone(target_timezone)

    def _decision_trace_from_result(
        self,
        planning_result: PlanningResult,
        policy_decision: PolicyDecision,
        context_pack: ContextPack,
    ) -> DecisionTrace:
        candidate = planning_result.candidate
        tools_selected = (
            [action.action_type for action in candidate.proposed_actions]
            if candidate is not None
            else []
        )
        return DecisionTrace(
            id=planning_result.trace_id,
            planner_mode=planning_result.planner_mode or "unknown",
            context_sections_used=self._context_sections_used(context_pack),
            tools_considered=self._tool_action_types(context_pack.tool_catalog),
            tools_selected=tools_selected,
            missing_information=policy_decision.missing_fields,
            policy_decisions=policy_decision.policy_notes,
            confirmation_reason="写入动作需要用户确认。"
            if policy_decision.requires_confirmation
            else None,
            fallback_reason=planning_result.fallback_reason,
            reasoning_summary=planning_result.reasoning_summary,
            llm_call=planning_result.llm_call,
        )

    def _non_action_decision_trace_from_result(
        self,
        planning_result: PlanningResult,
        context_pack: ContextPack,
        missing_information: list[str],
        policy_decisions: list[str],
    ) -> DecisionTrace:
        return DecisionTrace(
            id=planning_result.trace_id,
            planner_mode=planning_result.planner_mode or "unknown",
            context_sections_used=self._context_sections_used(context_pack),
            tools_considered=self._tool_action_types(context_pack.tool_catalog),
            tools_selected=[],
            missing_information=missing_information,
            policy_decisions=policy_decisions,
            confirmation_reason=None,
            fallback_reason=planning_result.fallback_reason,
            reasoning_summary=planning_result.reasoning_summary,
            llm_call=planning_result.llm_call,
        )

    def _tool_action_types(self, tool_catalog: list[str]) -> list[str]:
        action_types = []
        for item in tool_catalog:
            try:
                parsed = json.loads(item)
            except json.JSONDecodeError:
                action_types.append(item)
                continue
            if not isinstance(parsed, dict):
                action_types.append(item)
                continue
            action_type = parsed.get("action_type")
            action_types.append(action_type if isinstance(action_type, str) else item)
        return action_types

    def _context_sections_used(self, context_pack: ContextPack) -> list[str]:
        sections: list[str] = ["current_input"]
        for name in (
            "recent_conversation",
            "pending_plans",
            "pending_clarifications",
            "calendar_summary",
            "reminder_summary",
            "expense_summary",
            "attachment_summary",
            "user_preferences",
            "relevant_history",
            "tool_catalog",
        ):
            value = getattr(context_pack, name)
            if isinstance(value, list) and value:
                sections.append(name)
        return sections

    def _record_event(self, event: AgentEvent) -> None:
        if self._event_log_repository is not None:
            self._event_log_repository.append(event)

    def _save_trace(self, conversation_id: str, trace: DecisionTrace) -> None:
        if self._decision_trace_repository is not None:
            self._decision_trace_repository.save(conversation_id, trace)
