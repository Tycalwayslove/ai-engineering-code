from datetime import UTC, datetime, timedelta

from agent_runtime.clarifications.types import PendingClarification
from backend.app.services.pending_clarification_store import (
    InMemoryPendingClarificationStore,
    PendingClarificationSummaryProvider,
)


def test_pending_clarification_store_returns_latest_open_item() -> None:
    store = InMemoryPendingClarificationStore()
    now = datetime(2026, 5, 21, 9, 0, tzinfo=UTC)
    pending = PendingClarification(
        id="pending_001",
        conversation_id="conversation_001",
        domain="calendar",
        action_type="calendar.create_event",
        question="明天上午几点开始开会？",
        missing_fields=["start_at"],
        partial_payload={"title": "开会", "date_hint": "tomorrow"},
        quick_replies=["明天上午9点", "明天上午10点"],
        status="open",
        created_at=now,
        expires_at=now + timedelta(hours=24),
        resolved_at=None,
    )

    store.save(pending)

    assert store.latest_open("conversation_001", now) == pending


def test_pending_clarification_store_lists_items_for_conversation() -> None:
    store = InMemoryPendingClarificationStore()
    now = datetime(2026, 5, 21, 9, 0, tzinfo=UTC)
    first = PendingClarification(
        id="pending_first",
        conversation_id="conversation_001",
        domain="calendar",
        action_type="calendar.create_event",
        question="明天上午几点开始开会？",
        missing_fields=["start_at"],
        partial_payload={"title": "开会"},
        quick_replies=[],
        status="open",
        created_at=now,
        expires_at=now + timedelta(hours=24),
        resolved_at=None,
    )
    second = PendingClarification(
        id="pending_second",
        conversation_id="conversation_001",
        domain="expense",
        action_type="expense.create_reimbursement_draft",
        question="这笔报销金额是多少？",
        missing_fields=["amount"],
        partial_payload={"title": "打车票报销"},
        quick_replies=[],
        status="open",
        created_at=now + timedelta(minutes=1),
        expires_at=now + timedelta(hours=24),
        resolved_at=None,
    )
    other = PendingClarification(
        id="pending_other",
        conversation_id="conversation_other",
        domain="calendar",
        action_type="calendar.create_event",
        question="几点？",
        missing_fields=["start_at"],
        partial_payload={},
        quick_replies=[],
        status="open",
        created_at=now,
        expires_at=now + timedelta(hours=24),
        resolved_at=None,
    )

    store.save(second)
    store.save(other)
    store.save(first)

    assert store.list_for_conversation("conversation_001") == [first, second]


def test_pending_clarification_summary_provider_formats_open_items() -> None:
    store = InMemoryPendingClarificationStore()
    now = datetime(2026, 5, 21, 9, 0, tzinfo=UTC)
    store.save(
        PendingClarification(
            id="pending_001",
            conversation_id="conversation_001",
            domain="calendar",
            action_type="calendar.create_event",
            question="明天上午几点开始开会？",
            missing_fields=["start_at"],
            partial_payload={"title": "开会", "date_hint": "tomorrow"},
            quick_replies=["明天上午9点"],
            status="open",
            created_at=now,
            expires_at=now + timedelta(hours=24),
            resolved_at=None,
        ),
    )

    summaries = PendingClarificationSummaryProvider(store).get(
        "conversation_001",
        "十点",
    )

    assert summaries == [
        (
            "pending_id=pending_001; action=calendar.create_event; "
            "question=明天上午几点开始开会？; missing_fields=['start_at']; "
            'partial_payload={"date_hint": "tomorrow", "title": "开会"}'
        ),
    ]


def test_pending_clarification_store_ignores_expired_items() -> None:
    store = InMemoryPendingClarificationStore()
    now = datetime(2026, 5, 21, 9, 0, tzinfo=UTC)
    pending = PendingClarification(
        id="pending_expired",
        conversation_id="conversation_001",
        domain="calendar",
        action_type="calendar.create_event",
        question="明天上午几点开始开会？",
        missing_fields=["start_at"],
        partial_payload={"title": "开会"},
        quick_replies=[],
        status="open",
        created_at=now - timedelta(days=2),
        expires_at=now - timedelta(days=1),
        resolved_at=None,
    )

    store.save(pending)

    assert store.latest_open("conversation_001", now) is None
