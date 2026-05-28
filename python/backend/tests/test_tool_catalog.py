from agent_runtime.tools.catalog import BuiltInToolCatalog
from agent_runtime.tools.selector import ToolSelector


def test_builtin_tool_catalog_exposes_create_and_manage_tools() -> None:
    catalog = BuiltInToolCatalog()

    tools = catalog.list_tools()

    assert [tool.action_type for tool in tools] == [
        "calendar.create_event",
        "expense.create_reimbursement_draft",
        "expense.submit_reimbursement",
        "expense.cancel_reimbursement",
        "expense.update_reimbursement",
        "reminder.create_reminder",
        "reminder.complete_reminder",
        "reminder.cancel_reminder",
        "reminder.update_reminder",
        "calendar.cancel_event",
        "calendar.update_event",
    ]
    assert all(tool.confirmation_required for tool in tools)
    assert catalog.get_tool("reminder.create_reminder").domain == "reminder"

    expense_schema = catalog.get_tool("expense.create_reimbursement_draft").input_schema
    expense_properties = expense_schema["properties"]
    assert isinstance(expense_properties, dict)
    assert expense_properties["amount"] == {"type": "number"}
    update_schema = catalog.get_tool("calendar.update_event").input_schema
    update_properties = update_schema["properties"]
    assert isinstance(update_properties, dict)
    assert update_properties["patch"] == {
        "type": "object",
        "properties": {
            "title": {"type": "string"},
            "startAt": {"type": "string"},
            "endAt": {"type": "string"},
            "timezone": {"type": "string"},
        },
    }

    expense_update_schema = catalog.get_tool("expense.update_reimbursement").input_schema
    expense_update_properties = expense_update_schema["properties"]
    assert isinstance(expense_update_properties, dict)
    assert expense_update_properties["patch"] == {
        "type": "object",
        "properties": {
            "title": {"type": "string"},
            "amount": {"type": "number"},
            "currency": {"type": "string"},
            "occurredOn": {"type": "string"},
        },
    }
    for action_type in [
        "expense.submit_reimbursement",
        "expense.cancel_reimbursement",
        "expense.update_reimbursement",
        "reminder.complete_reminder",
        "reminder.cancel_reminder",
        "reminder.update_reminder",
        "calendar.cancel_event",
        "calendar.update_event",
    ]:
        schema = catalog.get_tool(action_type).input_schema
        required = schema["required"]
        assert isinstance(required, list)
        assert required[:2] == ["target_id", "expected_status"]


def test_tool_selector_returns_requested_tools_in_order() -> None:
    catalog = BuiltInToolCatalog()
    selector = ToolSelector()

    selected = selector.select_by_action_type(
        catalog.list_tools(),
        ["reminder.create_reminder", "calendar.create_event"],
    )

    assert [tool.action_type for tool in selected] == [
        "reminder.create_reminder",
        "calendar.create_event",
    ]
