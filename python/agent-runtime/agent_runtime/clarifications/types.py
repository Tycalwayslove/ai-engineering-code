from dataclasses import dataclass
from datetime import datetime
from typing import Literal

PendingClarificationStatus = Literal["open", "resolved", "abandoned"]


@dataclass(frozen=True)
class PendingClarification:
    id: str
    conversation_id: str
    domain: str
    action_type: str
    question: str
    missing_fields: list[str]
    partial_payload: dict[str, object]
    quick_replies: list[str]
    status: PendingClarificationStatus
    created_at: datetime
    expires_at: datetime
    resolved_at: datetime | None
