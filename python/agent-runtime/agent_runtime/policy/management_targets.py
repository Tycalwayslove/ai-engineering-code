from agent_runtime.context.types import ContextPack
from agent_runtime.planning.types import PlanCandidate, ProposedAction
from agent_runtime.policy.types import PolicyDecision


class ManagementTargetValidator:
    _MANAGEMENT_ACTION_TYPES = {
        "calendar.cancel_event",
        "calendar.update_event",
        "expense.cancel_reimbursement",
        "expense.submit_reimbursement",
        "expense.update_reimbursement",
        "reminder.cancel_reminder",
        "reminder.complete_reminder",
        "reminder.update_reminder",
    }

    def evaluate(
        self,
        candidate: PlanCandidate,
        context_pack: ContextPack,
    ) -> PolicyDecision | None:
        for action in candidate.proposed_actions:
            target_id = action.payload.get("target_id")
            expected_status = action.payload.get("expected_status")
            if not isinstance(target_id, str) or target_id == "":
                continue
            if not isinstance(expected_status, str) or expected_status == "":
                continue

            target = self._target_summary_for_action(action, context_pack)
            if target is None:
                return PolicyDecision(
                    requires_confirmation=False,
                    required_action_indexes=[],
                    risk_level="medium",
                    clarification_question="我找不到当前会话中可操作的目标事项。",
                    missing_fields=["target_id"],
                    policy_notes=[
                        "目标事项不属于当前会话上下文，不能生成待确认写入计划。",
                    ],
                )

            actual_status = target.get("status", "")
            if actual_status != expected_status:
                return PolicyDecision(
                    requires_confirmation=False,
                    required_action_indexes=[],
                    risk_level="medium",
                    clarification_question="目标事项状态已变化，请重新选择。",
                    missing_fields=["expected_status"],
                    policy_notes=[
                        (
                            f"目标事项状态是 {actual_status or 'unknown'}，"
                            f"不符合预期 {expected_status}，不能生成待确认写入计划。"
                        ),
                    ],
                )
            ambiguous_decision = self._ambiguous_target_decision(
                action=action,
                context_pack=context_pack,
                expected_status=expected_status,
            )
            if ambiguous_decision is not None:
                return ambiguous_decision
        return None

    def _ambiguous_target_decision(
        self,
        *,
        action: ProposedAction,
        context_pack: ContextPack,
        expected_status: str,
    ) -> PolicyDecision | None:
        if action.action_type not in self._MANAGEMENT_ACTION_TYPES:
            return None
        if action.payload.get("resolution_reason") == "selected_pending_clarification_target":
            return None
        if self._uses_recent_reference(context_pack.current_input):
            return None

        targets = self._candidate_targets_for_action(
            action,
            context_pack,
            expected_status,
        )
        if len(targets) <= 1:
            return None

        label = self._target_label(action)
        question = "你要操作哪一笔费用？" if label == "费用" else f"你要操作哪一个{label}？"
        return PolicyDecision(
            requires_confirmation=False,
            required_action_indexes=[],
            risk_level="medium",
            clarification_question=question,
            missing_fields=["target_id"],
            policy_notes=[
                "当前会话中存在多个可操作目标，不能替用户猜测 target_id。",
            ],
        )

    def _candidate_targets_for_action(
        self,
        action: ProposedAction,
        context_pack: ContextPack,
        expected_status: str,
    ) -> list[dict[str, str]]:
        targets = []
        for summary in self._domain_summaries_for_action(action, context_pack):
            parsed = self._parse_context_summary(summary)
            if parsed.get("id") and parsed.get("status") == expected_status:
                targets.append(parsed)
        return targets

    def _uses_recent_reference(self, text: str) -> bool:
        return "刚才" in text or "刚刚" in text

    def _target_label(self, action: ProposedAction) -> str:
        if action.domain == "expense" or action.action_type.startswith("expense."):
            return "费用"
        if action.domain == "reminder" or action.action_type.startswith("reminder."):
            return "提醒"
        return "日程"

    def _target_summary_for_action(
        self,
        action: ProposedAction,
        context_pack: ContextPack,
    ) -> dict[str, str] | None:
        target_id = action.payload.get("target_id")
        if not isinstance(target_id, str):
            return None

        for summary in self._domain_summaries_for_action(action, context_pack):
            parsed = self._parse_context_summary(summary)
            if parsed.get("id") == target_id:
                return parsed
        return None

    def _domain_summaries_for_action(
        self,
        action: ProposedAction,
        context_pack: ContextPack,
    ) -> list[str]:
        if action.domain == "calendar" or action.action_type.startswith("calendar."):
            return context_pack.calendar_summary
        if action.domain == "expense" or action.action_type.startswith("expense."):
            return context_pack.expense_summary
        if action.domain == "reminder" or action.action_type.startswith("reminder."):
            return context_pack.reminder_summary
        return []

    def _parse_context_summary(self, summary: str) -> dict[str, str]:
        values: dict[str, str] = {}
        for part in summary.split("; "):
            key, separator, value = part.partition("=")
            if separator:
                values[key.strip()] = value.strip()
        return values
