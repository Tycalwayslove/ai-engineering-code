from dataclasses import replace

from agent_runtime.context.types import ContextPack


class ContextRedactor:
    def __init__(self, max_items_per_section: int = 12) -> None:
        self._max_items_per_section = max_items_per_section

    def redact(self, context: ContextPack) -> ContextPack:
        redactions: list[str] = []
        return replace(
            context,
            recent_conversation=self._trim(
                context.recent_conversation,
                "recent_conversation",
                redactions,
            ),
            pending_plans=self._trim(context.pending_plans, "pending_plans", redactions),
            calendar_summary=self._trim(
                context.calendar_summary,
                "calendar_summary",
                redactions,
            ),
            reminder_summary=self._trim(
                context.reminder_summary,
                "reminder_summary",
                redactions,
            ),
            expense_summary=self._trim(
                context.expense_summary,
                "expense_summary",
                redactions,
            ),
            attachment_summary=self._trim(
                context.attachment_summary,
                "attachment_summary",
                redactions,
            ),
            user_preferences=self._trim(
                context.user_preferences,
                "user_preferences",
                redactions,
            ),
            relevant_history=self._trim(
                context.relevant_history,
                "relevant_history",
                redactions,
            ),
            tool_catalog=context.tool_catalog,
            redactions_applied=context.redactions_applied + redactions,
        )

    def _trim(self, values: list[str], section: str, redactions: list[str]) -> list[str]:
        if len(values) <= self._max_items_per_section:
            return values

        redactions.append(f"{section}:trimmed_to_{self._max_items_per_section}")
        return values[-self._max_items_per_section :]
