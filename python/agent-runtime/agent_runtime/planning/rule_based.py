import re
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from agent_runtime.context.types import ContextPack
from agent_runtime.parsers.rule_parser import RuleParser
from agent_runtime.planning.engine import PlanningEngine
from agent_runtime.planning.types import (
    ClarificationRequest,
    PlanCandidate,
    PlanningInput,
    PlanningResult,
    ProposedAction,
)


class RuleBasedPlanningEngine(PlanningEngine):
    def __init__(self, parser: RuleParser | None = None) -> None:
        self._parser = parser or RuleParser()

    def plan(
        self,
        planning_input: PlanningInput,
        context_pack: ContextPack,
    ) -> PlanningResult:
        query_result = self._existing_item_query_result(
            text=planning_input.text,
            now=planning_input.now,
            timezone=planning_input.timezone,
            context_pack=context_pack,
        )
        if query_result is not None:
            query_message, structured_elements = query_result
            return PlanningResult(
                kind="assistant_message",
                trace_id="rule-existing-item-query",
                message=query_message,
                structured_elements=structured_elements,
                planner_mode="rule",
            )

        existing_item_result = self._existing_item_candidate(
            text=planning_input.text,
            now=planning_input.now,
            timezone=planning_input.timezone,
            context_pack=context_pack,
        )
        if isinstance(existing_item_result, ClarificationRequest):
            return PlanningResult(
                kind="clarification",
                trace_id="rule-existing-item-management-ambiguous",
                clarification=existing_item_result,
                planner_mode="rule",
            )
        if existing_item_result is not None:
            return PlanningResult(
                kind="plan_candidate",
                trace_id="rule-existing-item-management",
                planner_mode="rule",
                candidate=existing_item_result,
            )

        attachment_candidate = self._attachment_receipt_candidate(
            text=planning_input.text,
            now=planning_input.now,
            timezone=planning_input.timezone,
            context_pack=context_pack,
        )
        if attachment_candidate is not None:
            return PlanningResult(
                kind="plan_candidate",
                trace_id="rule-attachment-expense-from-text",
                planner_mode="rule",
                candidate=attachment_candidate,
            )

        attachment_clarification = self._attachment_receipt_clarification(
            text=planning_input.text,
            context_pack=context_pack,
        )
        if attachment_clarification is not None:
            return PlanningResult(
                kind="clarification",
                trace_id="rule-attachment-expense-clarification",
                clarification=attachment_clarification,
                planner_mode="rule",
            )

        attachment_calendar_clarification = self._attachment_calendar_clarification(
            text=planning_input.text,
            context_pack=context_pack,
        )
        if attachment_calendar_clarification is not None:
            return PlanningResult(
                kind="clarification",
                trace_id="rule-attachment-calendar-clarification",
                clarification=attachment_calendar_clarification,
                planner_mode="rule",
            )

        calendar_clarification = self._parser.parse_calendar_clarification(
            text=planning_input.text,
            now=planning_input.now,
            timezone=planning_input.timezone,
        )
        if calendar_clarification is not None:
            missing_fields = self._list_value(calendar_clarification["missing_fields"])
            quick_replies = self._list_value(calendar_clarification["quick_replies"])
            partial_payload = self._dict_value(calendar_clarification["partial_payload"])
            return PlanningResult(
                kind="clarification",
                trace_id="rule-calendar-clarification",
                clarification=ClarificationRequest(
                    question=str(calendar_clarification["question"]),
                    missing_fields=[str(item) for item in missing_fields],
                    intent_id="pending_calendar_meeting",
                    domain="calendar",
                    action_type="calendar.create_event",
                    quick_replies=[str(item) for item in quick_replies],
                    partial_payload=partial_payload,
                ),
                planner_mode="rule",
            )

        parsed = self._parser.parse(
            text=planning_input.text,
            now=planning_input.now,
            timezone=planning_input.timezone,
        )
        if not parsed.actions:
            return PlanningResult(
                kind="assistant_message",
                trace_id="rule-chat",
                message="我在。你可以继续聊，也可以让我帮你安排日程、提醒或费用。",
                planner_mode="rule",
            )

        proposed_actions = [
            ProposedAction(
                domain=action["domain"],
                action_type=action["action_type"],
                summary=action["summary"],
                payload=action["payload"],
                risk_level=action["risk_level"],
                missing_fields=action["missing_fields"],
            )
            for action in parsed.actions
        ]
        missing_information = sorted(
            {
                field
                for action in proposed_actions
                for field in action.missing_fields
            }
        )
        return PlanningResult(
            kind="plan_candidate",
            trace_id=parsed.trace_id,
            planner_mode="rule",
            candidate=PlanCandidate(
                goal=self._goal_from_actions(proposed_actions),
                proposed_actions=proposed_actions,
                missing_information=missing_information,
                assumptions=[],
                risk_notes=[],
            ),
        )

    def _goal_from_actions(self, actions: list[ProposedAction]) -> str:
        if len(actions) == 1:
            return actions[0].summary
        return "确认后执行计划"

    def _list_value(self, value: object) -> list[object]:
        if not isinstance(value, list):
            return []
        return value

    def _dict_value(self, value: object) -> dict[str, object]:
        if not isinstance(value, dict):
            return {}
        return dict(value)

    def _attachment_receipt_clarification(
        self,
        *,
        text: str,
        context_pack: ContextPack,
    ) -> ClarificationRequest | None:
        if not self._is_attachment_expense_request(text):
            return None
        if not context_pack.attachment_summary:
            return None

        attachment = self._attachment_from_summary(context_pack.attachment_summary[-1])
        if attachment is None:
            return None

        title = f"{attachment['name']} 报销"
        return ClarificationRequest(
            question=f"{title}需要补充金额。",
            missing_fields=["amount"],
            intent_id="pending_attachment_expense",
            domain="expense",
            action_type="expense.create_reimbursement_draft",
            quick_replies=["58 元", "100 元", "我再说具体金额"],
            partial_payload={
                "attachment_id": attachment["attachment_id"],
                "attachment_name": attachment["name"],
                "currency": "CNY",
                "title": title,
            },
        )

    def _attachment_receipt_candidate(
        self,
        *,
        text: str,
        now: str,
        timezone: str,
        context_pack: ContextPack,
    ) -> PlanCandidate | None:
        if not self._is_attachment_expense_request(text):
            return None
        if not context_pack.attachment_summary:
            return None

        attachment = self._attachment_from_summary(context_pack.attachment_summary[-1])
        if attachment is None:
            return None
        attachment_text = attachment.get("text", "")
        amount = self._amount_from_text(attachment_text)
        if amount is None:
            return None

        title = f"{attachment['name']} 报销"
        occurred_on = self._date_from_text(attachment_text) or self._target_date(
            "今天",
            now,
            timezone,
        )
        payload: dict[str, object] = {
            "amount": amount,
            "attachment_id": attachment["attachment_id"],
            "attachment_name": attachment["name"],
            "currency": "CNY",
            "occurred_on": occurred_on,
            "title": title,
        }
        return PlanCandidate(
            goal=f"创建费用草稿：{title} {amount:g} 元",
            proposed_actions=[
                ProposedAction(
                    domain="expense",
                    action_type="expense.create_reimbursement_draft",
                    summary=f"创建费用草稿：{title} {amount:g} 元",
                    payload=payload,
                    risk_level="medium",
                    missing_fields=[],
                ),
            ],
            missing_information=[],
            assumptions=["从附件可读文本中提取费用金额。"],
            risk_notes=[],
        )

    def _is_attachment_expense_request(self, text: str) -> bool:
        return (
            ("费用" in text or "报销" in text or "票据" in text or "凭证" in text)
            and ("附件" in text or "receipt" in text or "票" in text)
            and ("处理" in text or "作为" in text or "记录" in text or "报销" in text)
        )

    def _attachment_calendar_clarification(
        self,
        *,
        text: str,
        context_pack: ContextPack,
    ) -> ClarificationRequest | None:
        if not self._is_attachment_calendar_request(text):
            return None
        if not context_pack.attachment_summary:
            return None

        attachment = self._attachment_from_summary(context_pack.attachment_summary[-1])
        if attachment is None:
            return None

        title = f"{attachment['name']} 相关日程"
        return ClarificationRequest(
            question=f"{attachment['name']} 要关联到哪个时间的日程？",
            missing_fields=["start_at"],
            intent_id="pending_attachment_calendar_material",
            domain="calendar",
            action_type="calendar.create_event",
            quick_replies=["明天上午9点", "明天上午10点", "我再说具体时间"],
            partial_payload={
                "attachment_id": attachment["attachment_id"],
                "attachment_name": attachment["name"],
                "date_hint": "tomorrow",
                "time_range_hint": "morning",
                "title": title,
            },
        )

    def _is_attachment_calendar_request(self, text: str) -> bool:
        return (
            ("日程" in text or "会议" in text or "材料" in text or "资料" in text)
            and ("附件" in text or "材料" in text or "资料" in text or "pdf" in text)
            and ("处理" in text or "作为" in text or "关联" in text or "记录" in text)
        )

    def _attachment_from_summary(self, summary: str) -> dict[str, str] | None:
        attachment_id = self._summary_value(summary, "attachment_id")
        name = self._summary_value(summary, "name")
        if attachment_id is None or name is None:
            return None
        return {
            "attachment_id": attachment_id,
            "name": name,
            "text": self._summary_value(summary, "text") or "",
        }

    def _summary_value(self, summary: str, key: str) -> str | None:
        match = re.search(rf"(?:^|; )({re.escape(key)})=([^;]+)", summary)
        if match is None:
            return None
        return match.group(2).strip()

    def _existing_item_query_result(
        self,
        *,
        text: str,
        now: str,
        timezone: str,
        context_pack: ContextPack,
    ) -> tuple[str, list[dict[str, object]]] | None:
        if not self._is_existing_item_query(text):
            return None

        query_expenses = "费用" in text or "报销" in text
        query_reminders = "提醒" in text
        query_calendar = any(keyword in text for keyword in ("日程", "会议", "开会"))
        query_general_schedule = any(
            keyword in text for keyword in ("安排", "计划", "要做什么")
        )
        query_schedule = (
            not query_expenses
            and not query_reminders
            and not query_calendar
        ) or query_general_schedule
        target_date = self._target_date(text, now, timezone)

        lines: list[str] = []
        structured_elements: list[dict[str, object]] = []
        if query_schedule:
            schedule_items = self._schedule_query_items(
                calendar_summaries=context_pack.calendar_summary,
                reminder_summaries=context_pack.reminder_summary,
                target_date=target_date,
                include_reminders=True,
            )
            if schedule_items:
                date_label = self._date_label(text, target_date)
                lines.append(f"{date_label}的安排：")
                lines.extend(item["line"] for item in schedule_items)
                structured_elements.append(
                    {
                        "id": f"query-schedule-{target_date or 'current'}",
                        "kind": "summary-list",
                        "title": f"{date_label}的安排",
                        "items": [
                            {
                                "id": item["id"],
                                "label": item["label"],
                                "meta": item["meta"],
                                "tone": item["tone"],
                            }
                            for item in schedule_items
                        ],
                    }
                )
            elif any(keyword in text for keyword in ("安排", "日程", "会议", "计划", "要做什么")):
                date_label = self._date_label(text, target_date)
                lines.append(f"当前会话里{date_label}还没有日程或提醒。")

        if query_calendar and not query_schedule:
            calendar_items = self._schedule_query_items(
                calendar_summaries=context_pack.calendar_summary,
                reminder_summaries=[],
                target_date=target_date,
                include_reminders=False,
            )
            date_label = self._date_label(text, target_date)
            if calendar_items:
                lines.append(f"{date_label}的日程：")
                lines.extend(item["line"] for item in calendar_items)
                structured_elements.append(
                    {
                        "id": f"query-calendar-{target_date or 'current'}",
                        "kind": "summary-list",
                        "title": f"{date_label}的日程",
                        "items": [
                            {
                                "id": item["id"],
                                "label": item["label"],
                                "meta": item["meta"],
                                "tone": item["tone"],
                            }
                            for item in calendar_items
                        ],
                    }
                )
            else:
                lines.append(f"当前会话里{date_label}还没有日程。")

        if query_reminders and not query_schedule:
            reminder_items = self._reminder_query_items(
                context_pack.reminder_summary,
                target_date,
            )
            if reminder_items:
                date_label = self._date_label(text, target_date)
                lines.append(f"{date_label}的提醒：")
                lines.extend(item["line"] for item in reminder_items)
                structured_elements.append(
                    {
                        "id": f"query-reminders-{target_date or 'current'}",
                        "kind": "summary-list",
                        "title": f"{date_label}的提醒",
                        "items": [
                            {
                                "id": item["id"],
                                "label": item["label"],
                                "meta": item["meta"],
                                "tone": item["tone"],
                            }
                            for item in reminder_items
                        ],
                    }
                )
            else:
                date_label = self._date_label(text, target_date)
                lines.append(f"当前会话里{date_label}还没有提醒。")

        if query_expenses:
            expense_items = self._expense_query_items(
                context_pack.expense_summary,
                target_date,
            )
            if expense_items:
                date_label = self._date_label(text, target_date)
                title = (
                    "当前会话里的费用"
                    if target_date == ""
                    else f"{date_label}的费用"
                )
                lines.append(f"{title}：")
                lines.extend(item["line"] for item in expense_items)
                structured_elements.append(
                    {
                        "id": f"query-expenses-{target_date or 'current'}",
                        "kind": "summary-list",
                        "title": title,
                        "items": [
                            {
                                "id": item["id"],
                                "label": item["label"],
                                "meta": item["meta"],
                                "tone": item["tone"],
                            }
                            for item in expense_items
                        ],
                    }
                )
            else:
                date_label = self._date_label(text, target_date)
                if target_date == "":
                    lines.append("当前会话里还没有费用记录。")
                else:
                    lines.append(f"当前会话里{date_label}还没有费用记录。")

        if not lines:
            return None
        return "\n".join(lines), structured_elements

    def _is_existing_item_query(self, text: str) -> bool:
        if any(
            keyword in text
            for keyword in (
                "取消",
                "完成",
                "提交",
                "改到",
                "改成",
                "调整到",
                "调整为",
                "提醒我",
                "安排一个",
                "创建",
                "新增",
            )
        ):
            return False
        return any(
            keyword in text
            for keyword in ("有什么", "有哪些", "查一下", "看看", "列表", "要做什么")
        )

    def _schedule_query_items(
        self,
        *,
        calendar_summaries: list[str],
        reminder_summaries: list[str],
        target_date: str,
        include_reminders: bool,
    ) -> list[dict[str, str]]:
        items: list[tuple[str, dict[str, str]]] = []
        for summary in calendar_summaries:
            parsed = self._parse_summary(summary)
            if parsed.get("status") != "scheduled":
                continue
            start_at = parsed.get("start_at", "")
            if target_date and not start_at.startswith(target_date):
                continue
            title = parsed.get("title", "日程")
            time_label = self._time_label(start_at)
            end_label = self._time_label(parsed.get("end_at", ""))
            suffix = f"{time_label}-{end_label}" if end_label else time_label
            items.append(
                (
                    start_at,
                    {
                        "id": parsed.get("id", f"calendar-{start_at}"),
                        "label": title,
                        "line": f"- 日程：{title}（{suffix}）",
                        "meta": f"日程｜{suffix}",
                        "tone": "success",
                    },
                )
            )

        if include_reminders:
            for summary in reminder_summaries:
                parsed = self._parse_summary(summary)
                if parsed.get("status") != "scheduled":
                    continue
                due_at = parsed.get("due_at", "")
                if target_date and not due_at.startswith(target_date):
                    continue
                title = parsed.get("title", "提醒")
                time_label = self._time_label(due_at)
                items.append(
                    (
                        due_at,
                        {
                            "id": parsed.get("id", f"reminder-{due_at}"),
                            "label": title,
                            "line": f"- 提醒：{title}（{time_label}）",
                            "meta": f"提醒｜{time_label}",
                            "tone": "info",
                        },
                    )
                )

        return [item for _, item in sorted(items, key=lambda item: item[0])]

    def _reminder_query_items(
        self,
        summaries: list[str],
        target_date: str,
    ) -> list[dict[str, str]]:
        items: list[dict[str, str]] = []
        for summary in summaries:
            parsed = self._parse_summary(summary)
            if parsed.get("status") != "scheduled":
                continue
            due_at = parsed.get("due_at", "")
            if target_date and not due_at.startswith(target_date):
                continue
            title = parsed.get("title", "提醒")
            time_label = self._time_label(due_at)
            items.append(
                {
                    "id": parsed.get("id", f"reminder-{due_at}"),
                    "label": title,
                    "line": f"- {title}（{time_label}）",
                    "meta": f"提醒｜{time_label}",
                    "tone": "info",
                }
            )
        return items

    def _expense_query_items(
        self,
        summaries: list[str],
        target_date: str,
    ) -> list[dict[str, str]]:
        items: list[dict[str, str]] = []
        for summary in summaries:
            parsed = self._parse_summary(summary)
            title = parsed.get("title")
            if title is None:
                continue
            amount = parsed.get("amount", "待补金额")
            currency = parsed.get("currency", "CNY")
            status = parsed.get("status", "unknown")
            occurred_on = parsed.get("occurred_on", "待补日期")
            if target_date and occurred_on != target_date:
                continue
            items.append(
                {
                    "id": parsed.get("id", f"expense-{title}"),
                    "label": title,
                    "line": f"- {title}：{amount} {currency}，{occurred_on}，状态 {status}",
                    "meta": f"{amount} {currency}｜{occurred_on}｜{status}",
                    "tone": "warning" if status == "draft" else "success",
                }
            )
        return items

    def _date_label(self, text: str, target_date: str) -> str:
        if "明天" in text:
            return "明天"
        if "后天" in text:
            return "后天"
        if "今天" in text:
            return "今天"
        if "昨天" in text:
            return "昨天"
        if target_date:
            return target_date
        return "当前会话"

    def _time_label(self, value: str) -> str:
        if value == "":
            return "待补时间"
        try:
            parsed = datetime.fromisoformat(value)
        except ValueError:
            return value
        return parsed.strftime("%H:%M")

    def _existing_item_candidate(
        self,
        *,
        text: str,
        now: str,
        timezone: str,
        context_pack: ContextPack,
    ) -> PlanCandidate | ClarificationRequest | None:
        reminder_candidate = self._reminder_management_candidate(
            text,
            now,
            timezone,
            context_pack.reminder_summary,
        )
        if reminder_candidate is not None:
            return reminder_candidate

        expense_candidate = self._expense_management_candidate(
            text,
            context_pack.expense_summary,
        )
        if expense_candidate is not None:
            return expense_candidate

        return self._calendar_management_candidate(
            text=text,
            now=now,
            timezone=timezone,
            summaries=context_pack.calendar_summary,
        )

    def _reminder_management_candidate(
        self,
        text: str,
        now: str,
        timezone: str,
        summaries: list[str],
    ) -> PlanCandidate | ClarificationRequest | None:
        if "提醒" not in text:
            return None
        allow_recent_target = self._uses_recent_reference(text)
        if any(keyword in text for keyword in ("改到", "改成", "调整到")):
            targets = self._summaries_with_status(summaries, "scheduled")
            due_at = self._calendar_update_start(
                text=text,
                now=now,
                timezone=timezone,
            )
            if len(targets) > 1 and not allow_recent_target:
                return self._target_clarification(
                    domain="reminder",
                    action_type="reminder.update_reminder",
                    target_label="提醒",
                    targets=targets,
                    partial_payload={
                        "patch": {"dueAt": due_at.isoformat()},
                    }
                    if due_at is not None
                    else None,
                )
            target = targets[-1] if targets else None
            if target is None:
                return None
            if due_at is None:
                return None
            title = target.get("title", "提醒")
            return PlanCandidate(
                goal=f"更新提醒：{title}",
                proposed_actions=[
                    ProposedAction(
                        domain="reminder",
                        action_type="reminder.update_reminder",
                        summary=f"更新提醒：{title}",
                        payload={
                            "target_id": target["id"],
                            "target_kind": "reminder",
                            "expected_status": "scheduled",
                            "patch": {"dueAt": due_at.isoformat()},
                            "resolution_reason": "matched_recent_conversation_reminder",
                        },
                        risk_level="medium",
                    )
                ],
                missing_information=[],
                assumptions=[],
                risk_notes=[],
            )
        if "取消" in text:
            targets = self._summaries_with_status(summaries, "scheduled")
            if len(targets) > 1 and not allow_recent_target:
                return self._target_clarification(
                    domain="reminder",
                    action_type="reminder.cancel_reminder",
                    target_label="提醒",
                    targets=targets,
                )
            target = targets[-1] if targets else None
            if target is None:
                return None
            title = target.get("title", "提醒")
            return PlanCandidate(
                goal=f"取消提醒：{title}",
                proposed_actions=[
                    ProposedAction(
                        domain="reminder",
                        action_type="reminder.cancel_reminder",
                        summary=f"取消提醒：{title}",
                        payload={
                            "target_id": target["id"],
                            "target_kind": "reminder",
                            "expected_status": "scheduled",
                            "resolution_reason": "matched_recent_conversation_reminder",
                        },
                        risk_level="medium",
                    )
                ],
                missing_information=[],
                assumptions=[],
                risk_notes=[],
            )
        if "完成" in text:
            targets = self._summaries_with_status(summaries, "scheduled")
            if len(targets) > 1 and not allow_recent_target:
                return self._target_clarification(
                    domain="reminder",
                    action_type="reminder.complete_reminder",
                    target_label="提醒",
                    targets=targets,
                )
            target = targets[-1] if targets else None
            if target is None:
                return None
            title = target.get("title", "提醒")
            return PlanCandidate(
                goal=f"完成提醒：{title}",
                proposed_actions=[
                    ProposedAction(
                        domain="reminder",
                        action_type="reminder.complete_reminder",
                        summary=f"完成提醒：{title}",
                        payload={
                            "target_id": target["id"],
                            "target_kind": "reminder",
                            "expected_status": "scheduled",
                            "resolution_reason": "matched_recent_conversation_reminder",
                        },
                        risk_level="medium",
                    )
                ],
                missing_information=[],
                assumptions=[],
                risk_notes=[],
            )
        return None

    def _expense_management_candidate(
        self,
        text: str,
        summaries: list[str],
    ) -> PlanCandidate | ClarificationRequest | None:
        if "费用" not in text and "报销" not in text:
            return None
        allow_recent_target = self._uses_recent_reference(text)
        if any(keyword in text for keyword in ("改成", "改到", "调整为")):
            targets = self._summaries_with_status(summaries, "draft")
            amount = self._amount_from_text(text)
            if len(targets) > 1 and not allow_recent_target:
                return self._target_clarification(
                    domain="expense",
                    action_type="expense.update_reimbursement",
                    target_label="费用",
                    targets=targets,
                    partial_payload={"patch": {"amount": amount}}
                    if amount is not None
                    else None,
                )
            target = targets[-1] if targets else None
            if target is None or amount is None:
                return None
            title = target.get("title", "费用")
            return PlanCandidate(
                goal=f"更新费用：{title}",
                proposed_actions=[
                    ProposedAction(
                        domain="expense",
                        action_type="expense.update_reimbursement",
                        summary=f"更新费用：{title}",
                        payload={
                            "target_id": target["id"],
                            "target_kind": "expense",
                            "expected_status": "draft",
                            "patch": {"amount": amount},
                            "resolution_reason": "matched_recent_conversation_expense",
                        },
                        risk_level="medium",
                    )
                ],
                missing_information=[],
                assumptions=[],
                risk_notes=[],
            )
        if "提交" in text:
            targets = self._summaries_with_status(summaries, "draft")
            if len(targets) > 1 and not allow_recent_target:
                return self._target_clarification(
                    domain="expense",
                    action_type="expense.submit_reimbursement",
                    target_label="费用",
                    targets=targets,
                )
            target = targets[-1] if targets else None
            if target is None:
                return None
            title = target.get("title", "费用")
            return PlanCandidate(
                goal=f"提交费用：{title}",
                proposed_actions=[
                    ProposedAction(
                        domain="expense",
                        action_type="expense.submit_reimbursement",
                        summary=f"提交费用：{title}",
                        payload={
                            "target_id": target["id"],
                            "target_kind": "expense",
                            "expected_status": "draft",
                            "resolution_reason": "matched_recent_conversation_expense",
                        },
                        risk_level="medium",
                    )
                ],
                missing_information=[],
                assumptions=[],
                risk_notes=[],
            )
        if "取消" in text:
            targets = self._summaries_with_status(summaries, "draft")
            if len(targets) > 1 and not allow_recent_target:
                return self._target_clarification(
                    domain="expense",
                    action_type="expense.cancel_reimbursement",
                    target_label="费用",
                    targets=targets,
                )
            target = targets[-1] if targets else None
            if target is None:
                return None
            title = target.get("title", "费用")
            return PlanCandidate(
                goal=f"取消费用：{title}",
                proposed_actions=[
                    ProposedAction(
                        domain="expense",
                        action_type="expense.cancel_reimbursement",
                        summary=f"取消费用：{title}",
                        payload={
                            "target_id": target["id"],
                            "target_kind": "expense",
                            "expected_status": "draft",
                            "resolution_reason": "matched_recent_conversation_expense",
                        },
                        risk_level="medium",
                    )
                ],
                missing_information=[],
                assumptions=[],
                risk_notes=[],
            )
        return None

    def _calendar_management_candidate(
        self,
        *,
        text: str,
        now: str,
        timezone: str,
        summaries: list[str],
    ) -> PlanCandidate | ClarificationRequest | None:
        if not any(keyword in text for keyword in ("会议", "开会", "日程")):
            return None
        allow_recent_target = self._uses_recent_reference(text)
        if not any(keyword in text for keyword in ("改到", "改成", "调整到")):
            if "取消" not in text:
                return None
            targets = self._calendar_targets(text, now, timezone, summaries)
            if len(targets) > 1 and not allow_recent_target:
                return self._target_clarification(
                    domain="calendar",
                    action_type="calendar.cancel_event",
                    target_label="日程",
                    targets=targets,
                )
            target = targets[-1] if targets else None
            if target is None:
                return None
            title = target.get("title", "日程")
            return PlanCandidate(
                goal=f"取消日程：{title}",
                proposed_actions=[
                    ProposedAction(
                        domain="calendar",
                        action_type="calendar.cancel_event",
                        summary=f"取消日程：{title}",
                        payload={
                            "target_id": target["id"],
                            "target_kind": "calendar_event",
                            "expected_status": "scheduled",
                            "resolution_reason": "matched_conversation_calendar_event",
                        },
                        risk_level="medium",
                    )
                ],
                missing_information=[],
                assumptions=[],
                risk_notes=[],
            )

        targets = self._calendar_targets(text, now, timezone, summaries)
        if len(targets) > 1 and not allow_recent_target:
            update_patch = self._calendar_update_patch_for_pending(
                text=text,
                now=now,
                timezone=timezone,
            )
            return self._target_clarification(
                domain="calendar",
                action_type="calendar.update_event",
                target_label="日程",
                targets=targets,
                partial_payload={"patch": update_patch}
                if update_patch is not None
                else None,
            )
        target = targets[-1] if targets else None
        if target is None:
            return None
        start_at = target.get("start_at")
        end_at = target.get("end_at")
        if start_at is None or end_at is None:
            return None
        new_start = self._calendar_update_start(text, now, timezone)
        if new_start is None:
            return None
        duration = datetime.fromisoformat(end_at) - datetime.fromisoformat(start_at)
        if duration.total_seconds() <= 0:
            duration = timedelta(hours=1)
        new_end = new_start + duration
        title = target.get("title", "日程")
        return PlanCandidate(
            goal=f"更新日程：{title}",
            proposed_actions=[
                ProposedAction(
                    domain="calendar",
                    action_type="calendar.update_event",
                    summary=f"更新日程：{title}",
                    payload={
                        "target_id": target["id"],
                        "target_kind": "calendar_event",
                        "expected_status": "scheduled",
                        "patch": {
                            "startAt": new_start.isoformat(),
                            "endAt": new_end.isoformat(),
                        },
                        "resolution_reason": "matched_conversation_calendar_event",
                    },
                    risk_level="medium",
                )
            ],
            missing_information=[],
            assumptions=[],
            risk_notes=[],
        )

    def _latest_summary_with_status(
        self,
        summaries: list[str],
        status: str,
    ) -> dict[str, str] | None:
        targets = self._summaries_with_status(summaries, status)
        return targets[-1] if targets else None

    def _summaries_with_status(
        self,
        summaries: list[str],
        status: str,
    ) -> list[dict[str, str]]:
        targets: list[dict[str, str]] = []
        for summary in summaries:
            parsed = self._parse_summary(summary)
            if parsed.get("id") and parsed.get("status") == status:
                targets.append(parsed)
        return targets

    def _calendar_target(
        self,
        text: str,
        now: str,
        timezone: str,
        summaries: list[str],
    ) -> dict[str, str] | None:
        targets = self._calendar_targets(text, now, timezone, summaries)
        return targets[-1] if targets else None

    def _calendar_targets(
        self,
        text: str,
        now: str,
        timezone: str,
        summaries: list[str],
    ) -> list[dict[str, str]]:
        target_date = self._target_date(text, now, timezone)
        targets: list[dict[str, str]] = []
        for summary in summaries:
            parsed = self._parse_summary(summary)
            if parsed.get("status") != "scheduled" or "id" not in parsed:
                continue
            start_at = parsed.get("start_at", "")
            if target_date and not start_at.startswith(target_date):
                continue
            targets.append(parsed)
        return targets

    def _target_clarification(
        self,
        *,
        domain: str,
        action_type: str,
        target_label: str,
        targets: list[dict[str, str]],
        partial_payload: dict[str, object] | None = None,
    ) -> ClarificationRequest:
        displayed_targets = targets[-3:]
        quick_replies = [
            self._target_quick_reply(target_label, target)
            for target in displayed_targets
        ]
        question = (
            "你要操作哪一笔费用？"
            if target_label == "费用"
            else f"你要操作哪一个{target_label}？"
        )
        return ClarificationRequest(
            question=question,
            missing_fields=["target_id"],
            intent_id=f"pending_{domain}_management_target",
            domain=domain,
            action_type=action_type,
            quick_replies=quick_replies,
            partial_payload={
                **(partial_payload or {}),
                "candidate_target_ids": [
                    target["id"]
                    for target in displayed_targets
                    if "id" in target
                ],
            },
        )

    def _target_quick_reply(
        self,
        target_label: str,
        target: dict[str, str],
    ) -> str:
        title = target.get("title", target_label)
        time_value = (
            target.get("due_at")
            or target.get("start_at")
            or target.get("occurred_on")
            or ""
        )
        time_label = self._time_label(time_value) if "T" in time_value else time_value
        if time_label:
            return f"{title}（{time_label}）"
        return title

    def _calendar_update_patch_for_pending(
        self,
        *,
        text: str,
        now: str,
        timezone: str,
    ) -> dict[str, str] | None:
        new_start = self._calendar_update_start(text, now, timezone)
        if new_start is None:
            return None
        return {
            "startAt": new_start.isoformat(),
        }

    def _uses_recent_reference(self, text: str) -> bool:
        return "刚才" in text or "刚刚" in text

    def _calendar_update_start(
        self,
        text: str,
        now: str,
        timezone: str,
    ) -> datetime | None:
        if now == "":
            return None
        hour_match = re.search(r"(十[一二]?|[一二三四五六七八九十]|\d{1,2})点", text)
        if hour_match is None:
            return None
        target_timezone = ZoneInfo(timezone)
        current_time = datetime.fromisoformat(now)
        if current_time.tzinfo is None:
            current_time = current_time.replace(tzinfo=target_timezone)
        else:
            current_time = current_time.astimezone(target_timezone)
        target_day = current_time
        if "明天" in text:
            target_day = current_time + timedelta(days=1)
        elif "后天" in text:
            target_day = current_time + timedelta(days=2)
        hour = self._parse_chinese_hour(hour_match.group(1))
        if ("下午" in text or "晚上" in text) and hour < 12:
            hour += 12
        return target_day.replace(hour=hour, minute=0, second=0, microsecond=0)

    def _amount_from_text(self, text: str) -> float | None:
        match = re.search(r"(\d+(?:\.\d{1,2})?)\s*元", text)
        if match is None:
            return None
        return float(match.group(1))

    def _date_from_text(self, text: str) -> str:
        match = re.search(r"\b(20\d{2}-\d{2}-\d{2})\b", text)
        if match is None:
            return ""
        return match.group(1)

    def _target_date(self, text: str, now: str, timezone: str) -> str:
        target_timezone = ZoneInfo(timezone)
        current_time = datetime.fromisoformat(now)
        if current_time.tzinfo is None:
            current_time = current_time.replace(tzinfo=target_timezone)
        else:
            current_time = current_time.astimezone(target_timezone)
        if "明天" in text:
            return (current_time + timedelta(days=1)).date().isoformat()
        if "后天" in text:
            return (current_time + timedelta(days=2)).date().isoformat()
        if "今天" in text:
            return current_time.date().isoformat()
        if "昨天" in text:
            return (current_time - timedelta(days=1)).date().isoformat()
        return ""

    def _parse_summary(self, summary: str) -> dict[str, str]:
        values: dict[str, str] = {}
        for part in summary.split("; "):
            key, separator, value = part.partition("=")
            if separator:
                values[key.strip()] = value.strip()
        return values

    def _parse_chinese_hour(self, value: str) -> int:
        if value.isdigit():
            return int(value)
        hours = {
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
            "十一": 11,
            "十二": 12,
        }
        return hours.get(value, 9)
