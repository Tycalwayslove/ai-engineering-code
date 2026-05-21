from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from agent_runtime.types import ParsedAction, ParseResult


class RuleParser:
    def parse(self, text: str, now: str, timezone: str) -> ParseResult:
        current_time = datetime.fromisoformat(now)
        if current_time.tzinfo is None:
            current_time = current_time.replace(tzinfo=ZoneInfo(timezone))

        actions: list[ParsedAction] = []

        if "开会" in text or "会议" in text:
            start_at = self._parse_meeting_start(text, current_time)
            end_at = start_at + timedelta(hours=1)
            actions.append(
                {
                    "domain": "calendar",
                    "action_type": "calendar.create_event",
                    "risk_level": "medium",
                    "summary": "创建日程：开会",
                    "payload": {
                        "title": "开会",
                        "start_at": start_at.isoformat(),
                        "end_at": end_at.isoformat(),
                        "timezone": timezone,
                    },
                    "missing_fields": [],
                }
            )

        if "报销" in text or "发票" in text or "打车票" in text:
            actions.append(
                {
                    "domain": "expense",
                    "action_type": "expense.create_reimbursement_draft",
                    "risk_level": "medium",
                    "summary": "创建费用草稿：打车票报销",
                    "payload": {
                        "title": "打车票报销",
                        "currency": "CNY",
                    },
                    "missing_fields": ["amount"],
                }
            )

        return ParseResult(actions=actions, trace_id="rule-parser-v1")

    def _parse_meeting_start(self, text: str, now: datetime) -> datetime:
        target_day = now
        if "明天" in text:
            target_day = now + timedelta(days=1)

        hour = 15 if "下午三点" in text or "下午3点" in text else 9
        return target_day.replace(hour=hour, minute=0, second=0, microsecond=0)
