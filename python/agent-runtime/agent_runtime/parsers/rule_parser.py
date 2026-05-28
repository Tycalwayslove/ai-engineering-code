import re
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from agent_runtime.types import ParsedAction, ParseResult


class RuleParser:
    def parse(self, text: str, now: str, timezone: str) -> ParseResult:
        target_timezone = ZoneInfo(timezone)
        current_time = datetime.fromisoformat(now)
        if current_time.tzinfo is None:
            current_time = current_time.replace(tzinfo=target_timezone)
        else:
            current_time = current_time.astimezone(target_timezone)

        actions: list[ParsedAction] = []

        calendar_title = self._parse_calendar_title(text)
        if calendar_title is not None:
            start_at = self._parse_meeting_start(text, current_time)
            end_at = start_at + self._parse_duration(text)
            actions.append(
                {
                    "domain": "calendar",
                    "action_type": "calendar.create_event",
                    "risk_level": "medium",
                    "summary": f"创建日程：{calendar_title}",
                    "payload": {
                        "title": calendar_title,
                        "start_at": start_at.isoformat(),
                        "end_at": end_at.isoformat(),
                        "timezone": timezone,
                    },
                    "missing_fields": [],
                }
            )

        if "报销" in text or "发票" in text or "打车票" in text:
            amount = self._parse_expense_amount(text)
            payload: dict[str, object] = {
                "title": "打车票报销",
                "currency": "CNY",
            }
            missing_fields: list[str] = []
            if amount is None:
                missing_fields.append("amount")
            else:
                payload["amount"] = amount
            if "昨天" in text:
                payload["occurred_on"] = (current_time - timedelta(days=1)).date().isoformat()
            elif "今天" in text:
                payload["occurred_on"] = current_time.date().isoformat()

            amount_summary = f" {amount:g} 元" if amount is not None else ""
            actions.append(
                {
                    "domain": "expense",
                    "action_type": "expense.create_reimbursement_draft",
                    "risk_level": "medium",
                    "summary": f"创建费用草稿：打车票报销{amount_summary}",
                    "payload": payload,
                    "missing_fields": missing_fields,
                }
            )

        reminder_title = self._parse_reminder_title(text)
        if reminder_title is not None:
            due_at = self._parse_reminder_due_at(text, current_time)
            actions.append(
                {
                    "domain": "reminder",
                    "action_type": "reminder.create_reminder",
                    "risk_level": "medium",
                    "summary": f"创建提醒：{reminder_title}",
                    "payload": {
                        "title": reminder_title,
                        "due_at": due_at.isoformat(),
                        "timezone": timezone,
                    },
                    "missing_fields": [],
                }
            )

        return ParseResult(actions=actions, trace_id="rule-parser-v1")

    def parse_calendar_clarification(
        self,
        text: str,
        now: str,
        timezone: str,
    ) -> dict[str, object] | None:
        del now
        if "开会" not in text and "会议" not in text:
            return None
        if self._has_explicit_hour(text):
            return None
        if not any(
            token in text
            for token in ("上午", "下午", "晚上", "中午", "明天", "后天", "今天")
        ):
            return None

        day_hint = self._date_hint_from_text(text)
        range_hint = self._time_range_hint_from_text(text)
        day_label = self._day_label_from_text(text)
        range_label = self._range_label_from_text(text)
        question_prefix = f"{day_label}{range_label}" if day_label or range_label else "这个日程"

        return {
            "question": f"{question_prefix}几点开始开会？",
            "missing_fields": ["start_at"],
            "quick_replies": self._calendar_quick_replies(day_label, range_label),
            "partial_payload": {
                "title": "开会",
                "date_hint": day_hint,
                "time_range_hint": range_hint,
                "timezone": timezone,
            },
        }

    def _parse_calendar_title(self, text: str) -> str | None:
        if "会议" in text:
            return "开会"
        if "开会" in text:
            return "开会"
        if self._contains_life_calendar_event(text):
            return self._parse_life_calendar_title(text)

        match = re.search(r"安排(?:一个|一场|一次)?([^，,。.!！?\s]{2,24}会)", text)
        if match:
            return match.group(1)

        match = re.search(r"([^，,。.!！?\s]{2,24}会)", text)
        if match and any(keyword in text for keyword in ("安排", "创建", "新增", "加一个")):
            return match.group(1)

        return None

    def _contains_life_calendar_event(self, text: str) -> bool:
        explicit_hour_pattern = (
            r"(?:上午|中午|下午|晚上)?(?:\d{1,2}|十[一二]?|[一二三四五六七八九十])点"
        )
        has_time_hint = any(
            keyword in text
            for keyword in ("今天", "明天", "后天", "上午", "中午", "下午", "晚上", "今晚")
        ) or re.search(explicit_hour_pattern, text) is not None
        has_event_hint = any(
            keyword in text
            for keyword in ("吃饭", "吃午饭", "吃晚饭", "吃早餐", "午饭", "晚饭", "早餐")
        )
        return has_time_hint and has_event_hint

    def _parse_life_calendar_title(self, text: str) -> str:
        title = text.strip(" ，,。.!！?")
        title = re.sub(r"^(?:今天|明天|后天|今晚)", "", title)
        title = re.sub(r"^(?:上午|中午|下午|晚上)", "", title)
        title = re.sub(
            r"^(?:\d{1,2}|十[一二]?|[一二三四五六七八九十])点(?:半|[一二三四五六]十(?:分)?)?",
            "",
            title,
        )
        title = re.sub(r"^我(?:要|想|准备|打算)?(?:去)?", "", title)
        title = re.sub(r"^(?:要|想|准备|打算)(?:去)?", "", title)
        return title.strip(" ，,。.!！?") or "吃饭"

    def _has_explicit_hour(self, text: str) -> bool:
        pattern = r"(?:上午|中午|下午|晚上)?(十[一二]?|[一二三四五六七八九十]|\d{1,2})点"
        return re.search(pattern, text) is not None

    def _date_hint_from_text(self, text: str) -> str:
        if "明天" in text:
            return "tomorrow"
        if "后天" in text:
            return "day_after_tomorrow"
        if "今天" in text:
            return "today"
        return ""

    def _time_range_hint_from_text(self, text: str) -> str:
        if "上午" in text:
            return "morning"
        if "中午" in text:
            return "noon"
        if "下午" in text:
            return "afternoon"
        if "晚上" in text:
            return "evening"
        return ""

    def _day_label_from_text(self, text: str) -> str:
        if "明天" in text:
            return "明天"
        if "后天" in text:
            return "后天"
        if "今天" in text:
            return "今天"
        return ""

    def _range_label_from_text(self, text: str) -> str:
        if "上午" in text:
            return "上午"
        if "中午" in text:
            return "中午"
        if "下午" in text:
            return "下午"
        if "晚上" in text:
            return "晚上"
        return ""

    def _calendar_quick_replies(self, day_label: str, range_label: str) -> list[str]:
        prefix = f"{day_label}{range_label}"
        if range_label == "上午":
            return ["明天上午9点", "明天上午10点", "我再说具体时间"]
        if range_label == "下午":
            return [f"{prefix}3点", f"{prefix}4点", "我再说具体时间"]
        if range_label == "晚上":
            return [f"{prefix}7点", f"{prefix}8点", "我再说具体时间"]
        if range_label == "中午":
            return [f"{prefix}12点", f"{prefix}1点", "我再说具体时间"]
        if prefix:
            return [f"{prefix}9点", f"{prefix}10点", "我再说具体时间"]
        return ["9点", "10点", "我再说具体时间"]

    def _parse_meeting_start(self, text: str, now: datetime) -> datetime:
        target_day = now
        if "明天" in text:
            target_day = now + timedelta(days=1)

        hour = 9
        hour_match = re.search(
            r"(?:上午|中午|下午|晚上)?(十[一二]?|[一二三四五六七八九十]|\d{1,2})点",
            text,
        )
        if hour_match is not None:
            hour = self._parse_chinese_hour(hour_match.group(1))
        elif "中午" in text:
            hour = 12
        elif "晚上" in text or "今晚" in text:
            hour = 19
        elif "下午" in text:
            hour = 15
        if ("下午" in text or "晚上" in text) and hour < 12:
            hour += 12
        return target_day.replace(hour=hour, minute=0, second=0, microsecond=0)

    def _parse_duration(self, text: str) -> timedelta:
        if "一个半小时" in text or "1.5小时" in text:
            return timedelta(minutes=90)
        return timedelta(hours=1)

    def _parse_expense_amount(self, text: str) -> float | None:
        match = re.search(r"(\d+(?:\.\d{1,2})?)\s*元", text)
        if match is None:
            return None
        return float(match.group(1))

    def _parse_reminder_title(self, text: str) -> str | None:
        match = re.search(r"提醒我(.+)$", text)
        if match is None:
            return None
        title = match.group(1).strip(" ，,。.!！?")
        title = re.sub(
            r"^(?:半|两|[一二三四五六七八九十]|\d+)\s*(?:分钟|小时)后",
            "",
            title,
        )
        return title or None

    def _parse_reminder_due_at(self, text: str, now: datetime) -> datetime:
        relative_due_at = self._parse_relative_reminder_due_at(text, now)
        if relative_due_at is not None:
            return relative_due_at

        target_day = now
        if "明天" in text:
            target_day = now + timedelta(days=1)

        hour = 9
        hour_match = re.search(r"(?:上午|早上)?(十[一二]?|[一二三四五六七八九十]|\d{1,2})点", text)
        if hour_match is not None:
            hour = self._parse_chinese_hour(hour_match.group(1))
        if "下午" in text and hour < 12:
            hour += 12
        return target_day.replace(hour=hour, minute=0, second=0, microsecond=0)

    def _parse_relative_reminder_due_at(self, text: str, now: datetime) -> datetime | None:
        if "半小时后" in text:
            return (now + timedelta(minutes=30)).replace(microsecond=0)

        match = re.search(
            r"(两|[一二三四五六七八九十]|\d+)\s*(分钟|小时)后",
            text,
        )
        if match is None:
            return None

        amount = self._parse_chinese_number(match.group(1))
        if amount <= 0:
            return None
        unit = match.group(2)
        delta = timedelta(minutes=amount) if unit == "分钟" else timedelta(hours=amount)
        return (now + delta).replace(microsecond=0)

    def _parse_chinese_number(self, value: str) -> int:
        if value.isdigit():
            return int(value)
        if value == "两":
            return 2
        return self._parse_chinese_hour(value)

    def _parse_chinese_hour(self, value: str) -> int:
        if value.isdigit():
            return int(value)
        hours = {
            "一": 1,
            "二": 2,
            "三": 3,
            "四": 4,
            "五": 5,
            "六": 6,
            "七": 7,
            "八": 8,
            "九": 9,
            "十": 10,
            "十一": 11,
            "十二": 12,
        }
        return hours.get(value, 9)
