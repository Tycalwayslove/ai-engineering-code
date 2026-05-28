from agent_runtime.context.types import ContextPack
from agent_runtime.planning.prompts import (
    LLM_PLANNER_SYSTEM_PROMPT,
    render_planning_prompt,
)
from agent_runtime.planning.types import PlanningInput


def test_llm_system_prompt_contains_conversation_routing_examples() -> None:
    prompt = LLM_PLANNER_SYSTEM_PROMPT

    assert "示例 1：闲聊" in prompt
    assert "今天有点累" in prompt
    assert '"response_type": "chat"' in prompt
    assert "不要编造工具动作" in prompt

    assert "示例 2：缺时间的日程" in prompt
    assert "明天上午我要去开会" in prompt
    assert '"response_type": "clarification"' in prompt
    assert '"missing_fields": ["start_at"]' in prompt

    assert "示例 3：只读查询" in prompt
    assert "明天我有什么安排" in prompt
    assert "基于 calendar_summary 和 reminder_summary 回答" in prompt
    assert '"structured_elements"' in prompt
    assert '"kind": "summary-list"' in prompt

    assert "示例 4：mixed" in prompt
    assert "好的，顺便帮我安排明天下午三点开会" in prompt
    assert '"response_type": "mixed"' in prompt


def test_llm_system_prompt_keeps_action_safety_boundary() -> None:
    prompt = LLM_PLANNER_SYSTEM_PROMPT

    assert "只能使用 tool_catalog 中出现的 action_type" in prompt
    assert "tool_catalog 每项是 JSON 工具合约" in prompt
    assert "required 和 properties" in prompt
    assert "amount 必须是 JSON number" in prompt
    assert "patch 必须是 JSON object" in prompt
    assert "不要说已经创建、已经修改、已经同步或已经提醒" in prompt
    assert "所有写入类动作都只是候选计划，必须等待用户确认后才执行" in prompt
    assert "当前会话中存在多个可操作目标" in prompt
    assert "不要替用户猜测 target_id" in prompt


def test_render_planning_prompt_exposes_context_sections_for_read_only_answers() -> None:
    prompt = render_planning_prompt(
        PlanningInput(
            conversation_id="conversation_prompt_contract",
            text="明天我有什么安排？",
            now="2026-05-21T09:00:00+08:00",
            timezone="Asia/Shanghai",
        ),
        ContextPack(
            calendar_summary=["id=event_1; title=开会; start_at=2026-05-22T15:00:00+08:00"],
            reminder_summary=["id=reminder_1; title=带电脑; due_at=2026-05-22T09:00:00+08:00"],
            expense_summary=["id=expense_1; title=打车票; occurred_on=2026-05-20"],
            pending_clarifications=["intent_id=pending_calendar_meeting; missing=start_at"],
        ),
    )

    assert "calendar_summary: ['id=event_1; title=开会;" in prompt
    assert "reminder_summary: ['id=reminder_1; title=带电脑;" in prompt
    assert "expense_summary: ['id=expense_1; title=打车票;" in prompt
    assert "pending_clarifications: ['intent_id=pending_calendar_meeting;" in prompt


def test_render_planning_prompt_exposes_tool_payload_contracts() -> None:
    prompt = render_planning_prompt(
        PlanningInput(
            conversation_id="conversation_prompt_tool_contract",
            text="把昨天 58 元打车票报销",
            now="2026-05-21T09:00:00+08:00",
            timezone="Asia/Shanghai",
        ),
        ContextPack(
            tool_catalog=[
                (
                    '{"action_type": "expense.create_reimbursement_draft", '
                    '"domain": "expense", '
                    '"required": ["title", "amount", "currency", "occurred_on"], '
                    '"properties": {"amount": {"type": "number"}}}'
                )
            ],
        ),
    )

    assert '"action_type": "expense.create_reimbursement_draft"' in prompt
    assert '"required": ["title", "amount", "currency", "occurred_on"]' in prompt
    assert '"amount": {"type": "number"}' in prompt
