from agent_runtime.tools.schemas import ToolSchema


class ToolSelector:
    def select_by_action_type(
        self,
        tools: list[ToolSchema],
        action_types: list[str],
    ) -> list[ToolSchema]:
        tool_by_action_type = {tool.action_type: tool for tool in tools}
        return [
            tool_by_action_type[action_type]
            for action_type in action_types
            if action_type in tool_by_action_type
        ]
