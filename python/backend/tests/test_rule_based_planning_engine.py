from agent_runtime.context.types import ContextPack
from agent_runtime.planning.rule_based import RuleBasedPlanningEngine
from agent_runtime.planning.types import PlanningInput


def test_rule_based_planner_returns_reminder_plan_candidate() -> None:
    planner = RuleBasedPlanningEngine()

    result = planner.plan(
        PlanningInput(
            conversation_id="conversation_001",
            text="明天上午九点提醒我带电脑",
            now="2026-05-23T18:43:00+08:00",
            timezone="Asia/Shanghai",
        ),
        ContextPack.empty(),
    )

    assert result.kind == "plan_candidate"
    assert result.candidate is not None
    assert result.candidate.proposed_actions[0].action_type == "reminder.create_reminder"
    assert result.candidate.proposed_actions[0].payload["title"] == "带电脑"


def test_rule_based_planner_returns_assistant_message_without_actions() -> None:
    planner = RuleBasedPlanningEngine()

    result = planner.plan(
        PlanningInput(
            conversation_id="conversation_001",
            text="你好",
            now="2026-05-23T18:43:00+08:00",
            timezone="Asia/Shanghai",
        ),
        ContextPack.empty(),
    )

    assert result.kind == "assistant_message"
    assert result.message == "我在。你可以继续聊，也可以让我帮你安排日程、提醒或费用。"


def test_rule_based_planner_clarifies_calendar_time_when_missing() -> None:
    result = RuleBasedPlanningEngine().plan(
        PlanningInput(
            conversation_id="conversation_missing_time",
            text="明天上午我要去开会",
            now="2026-05-21T09:00:00+08:00",
            timezone="Asia/Shanghai",
        ),
        ContextPack.empty(),
    )

    assert result.kind == "clarification"
    assert result.clarification is not None
    assert result.clarification.question == "明天上午几点开始开会？"
    assert result.clarification.missing_fields == ["start_at"]
    assert result.clarification.quick_replies == [
        "明天上午9点",
        "明天上午10点",
        "我再说具体时间",
    ]
    assert result.clarification.partial_payload["title"] == "开会"


def test_rule_based_planner_returns_chat_for_non_action_input() -> None:
    result = RuleBasedPlanningEngine().plan(
        PlanningInput(
            conversation_id="conversation_chat",
            text="今天有点累",
            now="2026-05-21T09:00:00+08:00",
            timezone="Asia/Shanghai",
        ),
        ContextPack.empty(),
    )

    assert result.kind == "assistant_message"
    assert result.message == "我在。你可以继续聊，也可以让我帮你安排日程、提醒或费用。"


def test_rule_based_planner_answers_schedule_query_from_context() -> None:
    result = RuleBasedPlanningEngine().plan(
        PlanningInput(
            conversation_id="conversation_query",
            text="明天我有什么安排？",
            now="2026-05-21T09:00:00+08:00",
            timezone="Asia/Shanghai",
        ),
        ContextPack(
            calendar_summary=[
                (
                    "id=event_1; source_action_id=action_1; title=开会; "
                    "start_at=2026-05-22T15:00:00+08:00; "
                    "end_at=2026-05-22T16:00:00+08:00; timezone=Asia/Shanghai; "
                    "status=scheduled"
                ),
            ],
            reminder_summary=[
                (
                    "id=reminder_1; source_action_id=action_2; title=带电脑; "
                    "due_at=2026-05-22T09:00:00+08:00; status=scheduled"
                ),
            ],
            expense_summary=[
                (
                    "id=expense_1; source_action_id=action_3; title=打车票; "
                    "amount=58; currency=CNY; occurred_on=2026-05-20; status=draft"
                ),
            ],
        ),
    )

    assert result.kind == "assistant_message"
    assert result.message is not None
    assert "开会" in result.message
    assert "带电脑" in result.message
    assert "打车票" not in result.message


def test_rule_based_planner_clarifies_ambiguous_reminder_management_target() -> None:
    result = RuleBasedPlanningEngine().plan(
        PlanningInput(
            conversation_id="conversation_ambiguous_reminder",
            text="取消提醒",
            now="2026-05-21T09:00:00+08:00",
            timezone="Asia/Shanghai",
        ),
        ContextPack(
            reminder_summary=[
                (
                    "id=reminder_1; source_action_id=action_1; title=带电脑; "
                    "due_at=2026-05-22T09:00:00+08:00; status=scheduled"
                ),
                (
                    "id=reminder_2; source_action_id=action_2; title=带水杯; "
                    "due_at=2026-05-22T10:00:00+08:00; status=scheduled"
                ),
            ],
        ),
    )

    assert result.kind == "clarification"
    assert result.clarification is not None
    assert result.clarification.missing_fields == ["target_id"]
    assert "哪一个提醒" in result.clarification.question


def test_rule_based_planner_clarifies_ambiguous_expense_management_target() -> None:
    result = RuleBasedPlanningEngine().plan(
        PlanningInput(
            conversation_id="conversation_ambiguous_expense",
            text="提交费用",
            now="2026-05-21T09:00:00+08:00",
            timezone="Asia/Shanghai",
        ),
        ContextPack(
            expense_summary=[
                (
                    "id=expense_1; source_action_id=action_1; title=打车票; "
                    "amount=58; currency=CNY; occurred_on=2026-05-20; status=draft"
                ),
                (
                    "id=expense_2; source_action_id=action_2; title=午餐报销; "
                    "amount=88; currency=CNY; occurred_on=2026-05-20; status=draft"
                ),
            ],
        ),
    )

    assert result.kind == "clarification"
    assert result.clarification is not None
    assert result.clarification.missing_fields == ["target_id"]
    assert "哪一笔费用" in result.clarification.question


def test_rule_based_planner_clarifies_ambiguous_calendar_management_target() -> None:
    result = RuleBasedPlanningEngine().plan(
        PlanningInput(
            conversation_id="conversation_ambiguous_calendar",
            text="取消明天的会议",
            now="2026-05-21T09:00:00+08:00",
            timezone="Asia/Shanghai",
        ),
        ContextPack(
            calendar_summary=[
                (
                    "id=event_1; source_action_id=action_1; title=晨会; "
                    "start_at=2026-05-22T09:00:00+08:00; "
                    "end_at=2026-05-22T10:00:00+08:00; timezone=Asia/Shanghai; "
                    "status=scheduled"
                ),
                (
                    "id=event_2; source_action_id=action_2; title=评审会; "
                    "start_at=2026-05-22T15:00:00+08:00; "
                    "end_at=2026-05-22T16:00:00+08:00; timezone=Asia/Shanghai; "
                    "status=scheduled"
                ),
            ],
        ),
    )

    assert result.kind == "clarification"
    assert result.clarification is not None
    assert result.clarification.missing_fields == ["target_id"]
    assert "哪一个日程" in result.clarification.question


def test_rule_based_planner_uses_latest_target_for_recent_reminder_reference() -> None:
    result = RuleBasedPlanningEngine().plan(
        PlanningInput(
            conversation_id="conversation_recent_reminder",
            text="取消刚才的提醒",
            now="2026-05-21T09:00:00+08:00",
            timezone="Asia/Shanghai",
        ),
        ContextPack(
            reminder_summary=[
                (
                    "id=reminder_1; source_action_id=action_1; title=带电脑; "
                    "due_at=2026-05-22T09:00:00+08:00; status=scheduled"
                ),
                (
                    "id=reminder_2; source_action_id=action_2; title=带水杯; "
                    "due_at=2026-05-22T10:00:00+08:00; status=scheduled"
                ),
            ],
        ),
    )

    assert result.kind == "plan_candidate"
    assert result.candidate is not None
    action = result.candidate.proposed_actions[0]
    assert action.action_type == "reminder.cancel_reminder"
    assert action.payload["target_id"] == "reminder_2"
