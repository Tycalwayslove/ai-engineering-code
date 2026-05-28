from agent_runtime.context.providers import ContextProvider
from agent_runtime.context.redactor import ContextRedactor
from agent_runtime.context.types import ContextPack


class ContextAssembler:
    def __init__(
        self,
        conversation_provider: ContextProvider[list[str]],
        pending_plan_provider: ContextProvider[list[str]],
        pending_clarification_provider: ContextProvider[list[str]],
        calendar_provider: ContextProvider[list[str]],
        reminder_provider: ContextProvider[list[str]],
        expense_provider: ContextProvider[list[str]],
        attachment_provider: ContextProvider[list[str]],
        preference_provider: ContextProvider[list[str]],
        summary_memory_provider: ContextProvider[list[str]],
        tool_catalog_provider: ContextProvider[list[str]],
        redactor: ContextRedactor | None = None,
    ) -> None:
        self._conversation_provider = conversation_provider
        self._pending_plan_provider = pending_plan_provider
        self._pending_clarification_provider = pending_clarification_provider
        self._calendar_provider = calendar_provider
        self._reminder_provider = reminder_provider
        self._expense_provider = expense_provider
        self._attachment_provider = attachment_provider
        self._preference_provider = preference_provider
        self._summary_memory_provider = summary_memory_provider
        self._tool_catalog_provider = tool_catalog_provider
        self._redactor = redactor or ContextRedactor()

    def assemble(
        self,
        current_input: str,
        current_time: str,
        timezone: str,
        conversation_id: str = "",
    ) -> ContextPack:
        context = ContextPack(
            current_input=current_input,
            current_time=current_time,
            timezone=timezone,
            recent_conversation=self._conversation_provider.get(
                conversation_id,
                current_input,
            ),
            pending_plans=self._pending_plan_provider.get(conversation_id, current_input),
            pending_clarifications=self._pending_clarification_provider.get(
                conversation_id,
                current_input,
            ),
            calendar_summary=self._calendar_provider.get(conversation_id, current_input),
            reminder_summary=self._reminder_provider.get(conversation_id, current_input),
            expense_summary=self._expense_provider.get(conversation_id, current_input),
            attachment_summary=self._attachment_provider.get(
                conversation_id,
                current_input,
            ),
            user_preferences=self._preference_provider.get(conversation_id, current_input),
            relevant_history=self._summary_memory_provider.get(
                conversation_id,
                current_input,
            ),
            tool_catalog=self._tool_catalog_provider.get(conversation_id, current_input),
        )
        return self._redactor.redact(context)
