from dataclasses import dataclass, field


@dataclass(frozen=True)
class ContextPack:
    current_input: str = ""
    current_time: str = ""
    timezone: str = "Asia/Shanghai"
    recent_conversation: list[str] = field(default_factory=list)
    pending_plans: list[str] = field(default_factory=list)
    pending_clarifications: list[str] = field(default_factory=list)
    calendar_summary: list[str] = field(default_factory=list)
    reminder_summary: list[str] = field(default_factory=list)
    expense_summary: list[str] = field(default_factory=list)
    attachment_summary: list[str] = field(default_factory=list)
    user_preferences: list[str] = field(default_factory=list)
    relevant_history: list[str] = field(default_factory=list)
    tool_catalog: list[str] = field(default_factory=list)
    redactions_applied: list[str] = field(default_factory=list)

    @classmethod
    def empty(cls) -> "ContextPack":
        return cls()
