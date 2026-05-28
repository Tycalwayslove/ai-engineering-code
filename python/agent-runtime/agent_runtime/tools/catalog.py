from agent_runtime.tools.schemas import ToolSchema

JsonSchemaProperty = str | dict[str, object]


def _object_schema(
    *,
    required: list[str],
    properties: dict[str, JsonSchemaProperty],
) -> dict[str, object]:
    return {
        "type": "object",
        "required": required,
        "properties": {
            name: _property_schema(property_schema)
            for name, property_schema in properties.items()
        },
    }


def _property_schema(property_schema: JsonSchemaProperty) -> dict[str, object]:
    if isinstance(property_schema, str):
        return {"type": property_schema}
    return property_schema


class BuiltInToolCatalog:
    def __init__(self) -> None:
        self._tools = [
            ToolSchema(
                name="创建日程",
                action_type="calendar.create_event",
                domain="calendar",
                description="在内部日历中创建一个日程。",
                input_schema=_object_schema(
                    required=["title", "start_at", "end_at", "timezone"],
                    properties={
                        "title": "string",
                        "start_at": "string",
                        "end_at": "string",
                        "timezone": "string",
                    },
                ),
                output_schema={"required": ["calendarEvent"], "type": "object"},
                risk_level="medium",
                confirmation_required=True,
                handler_key="calendar.create_event",
            ),
            ToolSchema(
                name="创建费用草稿",
                action_type="expense.create_reimbursement_draft",
                domain="expense",
                description="创建一条待补充和提交的费用报销草稿。",
                input_schema=_object_schema(
                    required=["title", "amount", "currency", "occurred_on"],
                    properties={
                        "title": "string",
                        "amount": "number",
                        "currency": "string",
                        "occurred_on": "string",
                        "attachment_id": "string",
                        "attachment_name": "string",
                    },
                ),
                output_schema={"required": ["expenseRecord"], "type": "object"},
                risk_level="medium",
                confirmation_required=True,
                handler_key="expense.create_reimbursement_draft",
            ),
            ToolSchema(
                name="提交费用草稿",
                action_type="expense.submit_reimbursement",
                domain="expense",
                description="提交一条已有费用报销草稿。",
                input_schema=_object_schema(
                    required=["target_id", "expected_status"],
                    properties={
                        "target_id": "string",
                        "expected_status": "string",
                    },
                ),
                output_schema={"required": ["expenseRecord"], "type": "object"},
                risk_level="medium",
                confirmation_required=True,
                handler_key="expense.submit_reimbursement",
            ),
            ToolSchema(
                name="取消费用草稿",
                action_type="expense.cancel_reimbursement",
                domain="expense",
                description="取消一条已有费用报销草稿。",
                input_schema=_object_schema(
                    required=["target_id", "expected_status"],
                    properties={
                        "target_id": "string",
                        "expected_status": "string",
                    },
                ),
                output_schema={"required": ["expenseRecord"], "type": "object"},
                risk_level="medium",
                confirmation_required=True,
                handler_key="expense.cancel_reimbursement",
            ),
            ToolSchema(
                name="更新费用草稿",
                action_type="expense.update_reimbursement",
                domain="expense",
                description="更新一条已有费用草稿的内容字段。",
                input_schema=_object_schema(
                    required=["target_id", "expected_status", "patch"],
                    properties={
                        "target_id": "string",
                        "expected_status": "string",
                        "patch": {
                            "type": "object",
                            "properties": {
                                "title": {"type": "string"},
                                "amount": {"type": "number"},
                                "currency": {"type": "string"},
                                "occurredOn": {"type": "string"},
                            },
                        },
                    },
                ),
                output_schema={"required": ["expenseRecord"], "type": "object"},
                risk_level="medium",
                confirmation_required=True,
                handler_key="expense.update_reimbursement",
            ),
            ToolSchema(
                name="创建提醒",
                action_type="reminder.create_reminder",
                domain="reminder",
                description="创建一个指定时间触发的内部提醒。",
                input_schema=_object_schema(
                    required=["title", "due_at", "timezone"],
                    properties={
                        "title": "string",
                        "due_at": "string",
                        "timezone": "string",
                    },
                ),
                output_schema={"required": ["reminder"], "type": "object"},
                risk_level="medium",
                confirmation_required=True,
                handler_key="reminder.create_reminder",
            ),
            ToolSchema(
                name="完成提醒",
                action_type="reminder.complete_reminder",
                domain="reminder",
                description="将一条已有提醒标记为完成。",
                input_schema=_object_schema(
                    required=["target_id", "expected_status"],
                    properties={
                        "target_id": "string",
                        "expected_status": "string",
                    },
                ),
                output_schema={"required": ["reminder"], "type": "object"},
                risk_level="medium",
                confirmation_required=True,
                handler_key="reminder.complete_reminder",
            ),
            ToolSchema(
                name="取消提醒",
                action_type="reminder.cancel_reminder",
                domain="reminder",
                description="取消一条已有提醒。",
                input_schema=_object_schema(
                    required=["target_id", "expected_status"],
                    properties={
                        "target_id": "string",
                        "expected_status": "string",
                    },
                ),
                output_schema={"required": ["reminder"], "type": "object"},
                risk_level="medium",
                confirmation_required=True,
                handler_key="reminder.cancel_reminder",
            ),
            ToolSchema(
                name="更新提醒",
                action_type="reminder.update_reminder",
                domain="reminder",
                description="更新一条已有提醒的内容或提醒时间。",
                input_schema=_object_schema(
                    required=["target_id", "expected_status", "patch"],
                    properties={
                        "target_id": "string",
                        "expected_status": "string",
                        "patch": {
                            "type": "object",
                            "properties": {
                                "title": {"type": "string"},
                                "dueAt": {"type": "string"},
                            },
                        },
                    },
                ),
                output_schema={"required": ["reminder"], "type": "object"},
                risk_level="medium",
                confirmation_required=True,
                handler_key="reminder.update_reminder",
            ),
            ToolSchema(
                name="取消日程",
                action_type="calendar.cancel_event",
                domain="calendar",
                description="取消一条已有日程。",
                input_schema=_object_schema(
                    required=["target_id", "expected_status"],
                    properties={
                        "target_id": "string",
                        "expected_status": "string",
                    },
                ),
                output_schema={"required": ["calendarEvent"], "type": "object"},
                risk_level="medium",
                confirmation_required=True,
                handler_key="calendar.cancel_event",
            ),
            ToolSchema(
                name="更新日程",
                action_type="calendar.update_event",
                domain="calendar",
                description="更新一条已有日程的标题、时间或时区。",
                input_schema=_object_schema(
                    required=["target_id", "expected_status", "patch"],
                    properties={
                        "target_id": "string",
                        "expected_status": "string",
                        "patch": {
                            "type": "object",
                            "properties": {
                                "title": {"type": "string"},
                                "startAt": {"type": "string"},
                                "endAt": {"type": "string"},
                                "timezone": {"type": "string"},
                            },
                        },
                    },
                ),
                output_schema={"required": ["calendarEvent"], "type": "object"},
                risk_level="medium",
                confirmation_required=True,
                handler_key="calendar.update_event",
            ),
        ]

    def list_tools(self) -> list[ToolSchema]:
        return list(self._tools)

    def get_tool(self, action_type: str) -> ToolSchema:
        for tool in self._tools:
            if tool.action_type == action_type:
                return tool
        raise KeyError(action_type)
