import json

from agent_runtime.context.assembler import ContextAssembler
from agent_runtime.context.providers import StaticContextProvider
from agent_runtime.context.redactor import ContextRedactor
from backend.app.infrastructure.postgres.context_providers import BuiltInToolCatalogProvider


def test_context_assembler_includes_domain_summaries_and_tool_catalog() -> None:
    assembler = ContextAssembler(
        conversation_provider=StaticContextProvider(["用户：明天提醒我"]),
        pending_plan_provider=StaticContextProvider([]),
        pending_clarification_provider=StaticContextProvider([]),
        calendar_provider=StaticContextProvider(["明天 15:00 开会"]),
        reminder_provider=StaticContextProvider([]),
        expense_provider=StaticContextProvider([]),
        attachment_provider=StaticContextProvider(
            ["attachment_id=attachment_001; name=receipt.jpg; kind=image"],
        ),
        preference_provider=StaticContextProvider(["默认提前 30 分钟提醒"]),
        summary_memory_provider=StaticContextProvider([]),
        tool_catalog_provider=StaticContextProvider(["reminder.create_reminder"]),
    )

    context = assembler.assemble(
        current_input="明天上午九点提醒我带电脑",
        current_time="2026-05-23T18:43:00+08:00",
        timezone="Asia/Shanghai",
    )

    assert context.current_input == "明天上午九点提醒我带电脑"
    assert context.attachment_summary == [
        "attachment_id=attachment_001; name=receipt.jpg; kind=image",
    ]
    assert context.calendar_summary == ["明天 15:00 开会"]
    assert context.user_preferences == ["默认提前 30 分钟提醒"]
    assert context.tool_catalog == ["reminder.create_reminder"]


def test_builtin_tool_catalog_provider_exposes_payload_contracts() -> None:
    provider = BuiltInToolCatalogProvider()

    context_lines = provider.get(
        conversation_id="conversation_tool_contract",
        current_input="明天下午三点开会",
    )

    expense_contract = next(
        line
        for line in context_lines
        if '"action_type": "expense.create_reimbursement_draft"' in line
    )
    assert '"required": ["title", "amount", "currency", "occurred_on"]' in expense_contract
    assert '"amount": {"type": "number"}' in expense_contract

    reminder_contract = next(
        line
        for line in context_lines
        if '"action_type": "reminder.update_reminder"' in line
    )
    reminder_schema = json.loads(reminder_contract)
    assert reminder_schema["properties"]["patch"] == {
        "type": "object",
        "properties": {
            "title": {"type": "string"},
            "dueAt": {"type": "string"},
        },
    }


def test_context_assembler_includes_pending_clarifications() -> None:
    provider = StaticContextProvider(
        [
            (
                "pending_id=pending_001; action=calendar.create_event; "
                'question=明天上午几点开始开会？; partial_payload={"title":"开会"}'
            ),
        ]
    )
    assembler = ContextAssembler(
        conversation_provider=StaticContextProvider([]),
        pending_plan_provider=StaticContextProvider([]),
        pending_clarification_provider=provider,
        calendar_provider=StaticContextProvider([]),
        reminder_provider=StaticContextProvider([]),
        expense_provider=StaticContextProvider([]),
        attachment_provider=StaticContextProvider([]),
        preference_provider=StaticContextProvider([]),
        summary_memory_provider=StaticContextProvider([]),
        tool_catalog_provider=StaticContextProvider([]),
    )

    context = assembler.assemble(
        conversation_id="conversation_001",
        current_input="十点",
        current_time="2026-05-21T09:00:00+08:00",
        timezone="Asia/Shanghai",
    )

    assert context.pending_clarifications == [
        (
            "pending_id=pending_001; action=calendar.create_event; "
            'question=明天上午几点开始开会？; partial_payload={"title":"开会"}'
        ),
    ]


def test_context_redactor_trims_large_sections() -> None:
    assembler = ContextAssembler(
        conversation_provider=StaticContextProvider(["早期", "近期"]),
        pending_plan_provider=StaticContextProvider([]),
        pending_clarification_provider=StaticContextProvider([]),
        calendar_provider=StaticContextProvider([]),
        reminder_provider=StaticContextProvider([]),
        expense_provider=StaticContextProvider([]),
        attachment_provider=StaticContextProvider([]),
        preference_provider=StaticContextProvider([]),
        summary_memory_provider=StaticContextProvider([]),
        tool_catalog_provider=StaticContextProvider([]),
        redactor=ContextRedactor(max_items_per_section=1),
    )

    context = assembler.assemble(
        current_input="继续",
        current_time="2026-05-23T18:43:00+08:00",
        timezone="Asia/Shanghai",
    )

    assert context.recent_conversation == ["近期"]
    assert context.redactions_applied == ["recent_conversation:trimmed_to_1"]


def test_context_redactor_keeps_full_tool_catalog_contracts() -> None:
    assembler = ContextAssembler(
        conversation_provider=StaticContextProvider(["早期", "近期"]),
        pending_plan_provider=StaticContextProvider([]),
        pending_clarification_provider=StaticContextProvider([]),
        calendar_provider=StaticContextProvider([]),
        reminder_provider=StaticContextProvider([]),
        expense_provider=StaticContextProvider([]),
        attachment_provider=StaticContextProvider([]),
        preference_provider=StaticContextProvider([]),
        summary_memory_provider=StaticContextProvider([]),
        tool_catalog_provider=StaticContextProvider(
            [
                '{"action_type": "calendar.create_event"}',
                '{"action_type": "expense.create_reimbursement_draft"}',
                '{"action_type": "reminder.create_reminder"}',
            ],
        ),
        redactor=ContextRedactor(max_items_per_section=1),
    )

    context = assembler.assemble(
        current_input="继续",
        current_time="2026-05-23T18:43:00+08:00",
        timezone="Asia/Shanghai",
    )

    assert context.recent_conversation == ["近期"]
    assert context.tool_catalog == [
        '{"action_type": "calendar.create_event"}',
        '{"action_type": "expense.create_reimbursement_draft"}',
        '{"action_type": "reminder.create_reminder"}',
    ]
    assert "tool_catalog:trimmed_to_1" not in context.redactions_applied
