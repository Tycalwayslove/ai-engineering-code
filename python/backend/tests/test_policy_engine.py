from agent_runtime.context.types import ContextPack
from agent_runtime.planning.types import PlanCandidate, ProposedAction
from agent_runtime.policy.engine import PolicyEngine
from agent_runtime.policy.management_targets import ManagementTargetValidator


def test_policy_requires_confirmation_for_write_actions() -> None:
    policy = PolicyEngine()
    candidate = PlanCandidate(
        goal="创建提醒",
        proposed_actions=[
            ProposedAction(
                domain="reminder",
                action_type="reminder.create_reminder",
                summary="创建提醒：带电脑",
                payload={
                    "title": "带电脑",
                    "due_at": "2026-05-24T09:00:00+08:00",
                    "timezone": "Asia/Shanghai",
                },
            )
        ],
        missing_information=[],
        assumptions=[],
        risk_notes=[],
    )

    decision = policy.evaluate(candidate)

    assert decision.requires_confirmation is True
    assert decision.required_action_indexes == [0]
    assert decision.risk_level == "medium"


def test_policy_returns_clarification_for_missing_fields() -> None:
    policy = PolicyEngine()
    candidate = PlanCandidate(
        goal="创建费用草稿",
        proposed_actions=[
            ProposedAction(
                domain="expense",
                action_type="expense.create_reimbursement_draft",
                summary="创建费用草稿：打车票报销",
                payload={
                    "title": "打车票报销",
                    "currency": "CNY",
                    "occurred_on": "2026-05-20",
                },
                missing_fields=["amount"],
            )
        ],
        missing_information=[],
        assumptions=[],
        risk_notes=[],
    )

    decision = policy.evaluate(candidate)

    assert decision.requires_confirmation is False
    assert decision.clarification_question == "打车票报销需要补充金额。"
    assert decision.missing_fields == ["amount"]


def test_policy_rejects_unknown_tool_actions_before_confirmation() -> None:
    policy = PolicyEngine()
    candidate = PlanCandidate(
        goal="未知动作",
        proposed_actions=[
            ProposedAction(
                domain="reminder",
                action_type="reminder.delete_everything",
                summary="未知动作",
                payload={},
            )
        ],
        missing_information=[],
        assumptions=[],
        risk_notes=[],
    )

    decision = policy.evaluate(candidate)

    assert decision.requires_confirmation is False
    assert decision.clarification_question == "我还不能安全执行这个动作。"
    assert decision.missing_fields == ["supported_action_type"]


def test_policy_detects_missing_required_payload_fields_from_tool_schema() -> None:
    policy = PolicyEngine()
    candidate = PlanCandidate(
        goal="创建日程",
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
            )
        ],
        missing_information=[],
        assumptions=[],
        risk_notes=[],
    )

    decision = policy.evaluate(candidate)

    assert decision.requires_confirmation is False
    assert decision.clarification_question == "需要补充：end_at, start_at。"
    assert decision.missing_fields == ["end_at", "start_at"]


def test_policy_rejects_invalid_payload_field_types_from_tool_schema() -> None:
    policy = PolicyEngine()
    candidate = PlanCandidate(
        goal="创建费用草稿",
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
            )
        ],
        missing_information=[],
        assumptions=[],
        risk_notes=[],
    )

    decision = policy.evaluate(candidate)

    assert decision.requires_confirmation is False
    assert decision.clarification_question == "需要修正字段类型：amount。"
    assert decision.missing_fields == ["amount"]


def test_policy_rejects_bool_for_numeric_payload_fields() -> None:
    policy = PolicyEngine()
    candidate = PlanCandidate(
        goal="创建费用草稿",
        proposed_actions=[
            ProposedAction(
                domain="expense",
                action_type="expense.create_reimbursement_draft",
                summary="创建费用草稿：打车票报销",
                payload={
                    "title": "打车票报销",
                    "amount": True,
                    "currency": "CNY",
                    "occurred_on": "2026-05-20",
                },
            )
        ],
        missing_information=[],
        assumptions=[],
        risk_notes=[],
    )

    decision = policy.evaluate(candidate)

    assert decision.requires_confirmation is False
    assert decision.clarification_question == "需要修正字段类型：amount。"
    assert decision.missing_fields == ["amount"]


def test_policy_rejects_non_object_update_patch() -> None:
    policy = PolicyEngine()
    candidate = PlanCandidate(
        goal="更新提醒",
        proposed_actions=[
            ProposedAction(
                domain="reminder",
                action_type="reminder.update_reminder",
                summary="更新提醒：带电脑",
                payload={
                    "target_id": "reminder_001",
                    "expected_status": "scheduled",
                    "patch": "改到明天上午十点",
                },
            )
        ],
        missing_information=[],
        assumptions=[],
        risk_notes=[],
    )

    decision = policy.evaluate(candidate)

    assert decision.requires_confirmation is False
    assert decision.clarification_question == "需要修正字段类型：patch。"
    assert decision.missing_fields == ["patch"]


def test_policy_rejects_invalid_update_patch_field_types() -> None:
    policy = PolicyEngine()
    candidate = PlanCandidate(
        goal="更新费用",
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
            )
        ],
        missing_information=[],
        assumptions=[],
        risk_notes=[],
    )

    decision = policy.evaluate(candidate)

    assert decision.requires_confirmation is False
    assert decision.clarification_question == "需要修正字段类型：patch.amount。"
    assert decision.missing_fields == ["patch.amount"]


def test_management_target_validator_rejects_unknown_target_id() -> None:
    candidate = PlanCandidate(
        goal="取消提醒",
        proposed_actions=[
            ProposedAction(
                domain="reminder",
                action_type="reminder.cancel_reminder",
                summary="取消提醒：喝水",
                payload={
                    "target_id": "reminder_other",
                    "expected_status": "scheduled",
                },
            )
        ],
        missing_information=[],
        assumptions=[],
        risk_notes=[],
    )

    decision = ManagementTargetValidator().evaluate(
        candidate,
        ContextPack(
            reminder_summary=[
                (
                    "id=reminder_current; source_action_id=action_current; "
                    "title=喝水; due_at=2026-05-22T10:00:00+08:00; "
                    "status=scheduled"
                )
            ]
        ),
    )

    assert decision is not None
    assert decision.requires_confirmation is False
    assert decision.clarification_question == "我找不到当前会话中可操作的目标事项。"
    assert decision.missing_fields == ["target_id"]


def test_management_target_validator_rejects_stale_expected_status() -> None:
    candidate = PlanCandidate(
        goal="完成提醒",
        proposed_actions=[
            ProposedAction(
                domain="reminder",
                action_type="reminder.complete_reminder",
                summary="完成提醒：喝水",
                payload={
                    "target_id": "reminder_current",
                    "expected_status": "scheduled",
                },
            )
        ],
        missing_information=[],
        assumptions=[],
        risk_notes=[],
    )

    decision = ManagementTargetValidator().evaluate(
        candidate,
        ContextPack(
            reminder_summary=[
                (
                    "id=reminder_current; source_action_id=action_current; "
                    "title=喝水; due_at=2026-05-22T10:00:00+08:00; "
                    "status=done"
                )
            ]
        ),
    )

    assert decision is not None
    assert decision.requires_confirmation is False
    assert decision.clarification_question == "目标事项状态已变化，请重新选择。"
    assert decision.missing_fields == ["expected_status"]


def test_management_target_validator_allows_matching_target() -> None:
    candidate = PlanCandidate(
        goal="提交费用",
        proposed_actions=[
            ProposedAction(
                domain="expense",
                action_type="expense.submit_reimbursement",
                summary="提交费用：打车票",
                payload={
                    "target_id": "expense_current",
                    "expected_status": "draft",
                },
            )
        ],
        missing_information=[],
        assumptions=[],
        risk_notes=[],
    )

    decision = ManagementTargetValidator().evaluate(
        candidate,
        ContextPack(
            expense_summary=[
                (
                    "id=expense_current; source_action_id=action_current; "
                    "title=打车票; amount=58; currency=CNY; "
                    "occurred_on=2026-05-20; status=draft"
                )
            ]
        ),
    )

    assert decision is None


def test_management_target_validator_clarifies_ambiguous_expense_target_guess() -> None:
    candidate = PlanCandidate(
        goal="提交费用",
        proposed_actions=[
            ProposedAction(
                domain="expense",
                action_type="expense.submit_reimbursement",
                summary="提交费用：午餐",
                payload={
                    "target_id": "expense_2",
                    "expected_status": "draft",
                },
            )
        ],
        missing_information=[],
        assumptions=[],
        risk_notes=[],
    )

    decision = ManagementTargetValidator().evaluate(
        candidate,
        ContextPack(
            current_input="提交费用",
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
    )

    assert decision is not None
    assert decision.requires_confirmation is False
    assert decision.clarification_question == "你要操作哪一笔费用？"
    assert decision.missing_fields == ["target_id"]


def test_management_target_validator_allows_recent_reference_target_guess() -> None:
    candidate = PlanCandidate(
        goal="提交费用",
        proposed_actions=[
            ProposedAction(
                domain="expense",
                action_type="expense.submit_reimbursement",
                summary="提交费用：午餐",
                payload={
                    "target_id": "expense_2",
                    "expected_status": "draft",
                },
            )
        ],
        missing_information=[],
        assumptions=[],
        risk_notes=[],
    )

    decision = ManagementTargetValidator().evaluate(
        candidate,
        ContextPack(
            current_input="提交刚才的费用",
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
    )

    assert decision is None
