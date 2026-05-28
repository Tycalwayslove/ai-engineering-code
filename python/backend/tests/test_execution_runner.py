from typing import cast

from backend.app.domains.calendar.repository import InMemoryCalendarEventRepository
from backend.app.domains.calendar.service import CalendarDomainService
from backend.app.domains.expense.repository import InMemoryExpenseRecordRepository
from backend.app.domains.expense.service import ExpenseDomainService
from backend.app.domains.reminder.repository import InMemoryReminderRepository
from backend.app.domains.reminder.service import ReminderDomainService
from backend.app.services.execution_store import DomainActionRecord
from orchestrator.execution.handlers import (
    CalendarCreateEventHandler,
    CalendarUpdateEventHandler,
    ExpenseDraftHandler,
    ExpenseSubmitHandler,
    ReminderCancelHandler,
    ReminderCreateHandler,
)
from orchestrator.execution.registry import ActionHandlerRegistry
from orchestrator.execution.runner import ExecutionRunner


def test_execution_runner_executes_registered_calendar_handler() -> None:
    calendar_service = CalendarDomainService(InMemoryCalendarEventRepository())
    registry = ActionHandlerRegistry()
    registry.register("calendar.create_event", CalendarCreateEventHandler(calendar_service))
    runner = ExecutionRunner(registry)
    action = cast(
        DomainActionRecord,
        {
            "id": "action_001",
            "planId": "plan_001",
            "domain": "calendar",
            "actionType": "calendar.create_event",
            "status": "awaiting_confirmation",
            "riskLevel": "medium",
            "summary": "创建日程：开会",
            "payload": {
                "title": "开会",
                "start_at": "2026-05-24T15:00:00+08:00",
                "end_at": "2026-05-24T16:00:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    )

    result = runner.execute_action(action)

    assert result.status == "succeeded"
    calendar_event = result.output["calendarEvent"]
    assert isinstance(calendar_event, dict)
    assert calendar_event["title"] == "开会"


def test_execution_runner_executes_registered_expense_and_reminder_handlers() -> None:
    expense_service = ExpenseDomainService(InMemoryExpenseRecordRepository())
    reminder_service = ReminderDomainService(InMemoryReminderRepository())
    registry = ActionHandlerRegistry()
    registry.register(
        "expense.create_reimbursement_draft",
        ExpenseDraftHandler(expense_service),
    )
    registry.register("reminder.create_reminder", ReminderCreateHandler(reminder_service))
    runner = ExecutionRunner(registry)

    expense_result = runner.execute_action(
        cast(
            DomainActionRecord,
            {
                "id": "action_expense",
                "planId": "plan_001",
                "domain": "expense",
                "actionType": "expense.create_reimbursement_draft",
                "status": "awaiting_confirmation",
                "riskLevel": "medium",
                "summary": "创建费用草稿：打车票报销 58 元",
                "payload": {
                    "title": "打车票报销",
                    "amount": 58,
                    "currency": "CNY",
                    "occurred_on": "2026-05-23",
                },
            },
        )
    )
    reminder_result = runner.execute_action(
        cast(
            DomainActionRecord,
            {
                "id": "action_reminder",
                "planId": "plan_001",
                "domain": "reminder",
                "actionType": "reminder.create_reminder",
                "status": "awaiting_confirmation",
                "riskLevel": "medium",
                "summary": "创建提醒：带电脑",
                "payload": {
                    "title": "带电脑",
                    "due_at": "2026-05-24T09:00:00+08:00",
                    "timezone": "Asia/Shanghai",
                },
            },
        )
    )

    expense_record = expense_result.output["expenseRecord"]
    reminder = reminder_result.output["reminder"]
    assert isinstance(expense_record, dict)
    assert isinstance(reminder, dict)
    assert expense_record["title"] == "打车票报销"
    assert reminder["title"] == "带电脑"


def test_execution_runner_returns_failed_result_for_unknown_action() -> None:
    runner = ExecutionRunner(ActionHandlerRegistry())

    result = runner.execute_action(
        cast(
            DomainActionRecord,
            {
                "id": "action_unknown",
                "planId": "plan_001",
                "domain": "unknown",
                "actionType": "unknown.action",
                "status": "awaiting_confirmation",
                "riskLevel": "medium",
                "summary": "未知动作",
                "payload": {},
            },
        )
    )

    assert result.status == "failed"
    assert result.error == "unsupported action type: unknown.action"


def test_execution_runner_executes_registered_manage_handlers() -> None:
    calendar_service = CalendarDomainService(InMemoryCalendarEventRepository())
    expense_service = ExpenseDomainService(InMemoryExpenseRecordRepository())
    reminder_service = ReminderDomainService(InMemoryReminderRepository())
    calendar_event = calendar_service.create_event(
        "action_calendar_create",
        {
            "title": "开会",
            "start_at": "2026-05-24T15:00:00+08:00",
            "end_at": "2026-05-24T16:00:00+08:00",
            "timezone": "Asia/Shanghai",
        },
    )
    expense = expense_service.create_reimbursement_draft(
        "action_expense_create",
        {
            "title": "打车票报销",
            "amount": 58,
            "currency": "CNY",
            "occurred_on": "2026-05-23",
        },
    )
    reminder = reminder_service.create_reminder(
        "action_reminder_create",
        {
            "title": "带电脑",
            "due_at": "2026-05-24T09:00:00+08:00",
        },
    )
    registry = ActionHandlerRegistry()
    registry.register("calendar.update_event", CalendarUpdateEventHandler(calendar_service))
    registry.register("expense.submit_reimbursement", ExpenseSubmitHandler(expense_service))
    registry.register("reminder.cancel_reminder", ReminderCancelHandler(reminder_service))
    runner = ExecutionRunner(registry)

    calendar_result = runner.execute_action(
        cast(
            DomainActionRecord,
            {
                "id": "action_calendar_update",
                "planId": "plan_001",
                "domain": "calendar",
                "actionType": "calendar.update_event",
                "status": "awaiting_confirmation",
                "riskLevel": "medium",
                "summary": "更新日程：开会",
                "payload": {
                    "target_id": calendar_event["id"],
                    "expected_status": "scheduled",
                    "patch": {
                        "startAt": "2026-05-24T10:00:00+08:00",
                        "endAt": "2026-05-24T11:00:00+08:00",
                    },
                },
            },
        )
    )
    expense_result = runner.execute_action(
        cast(
            DomainActionRecord,
            {
                "id": "action_expense_submit",
                "planId": "plan_001",
                "domain": "expense",
                "actionType": "expense.submit_reimbursement",
                "status": "awaiting_confirmation",
                "riskLevel": "medium",
                "summary": "提交费用：打车票报销",
                "payload": {
                    "target_id": expense["id"],
                    "expected_status": "draft",
                },
            },
        )
    )
    reminder_result = runner.execute_action(
        cast(
            DomainActionRecord,
            {
                "id": "action_reminder_cancel",
                "planId": "plan_001",
                "domain": "reminder",
                "actionType": "reminder.cancel_reminder",
                "status": "awaiting_confirmation",
                "riskLevel": "medium",
                "summary": "取消提醒：带电脑",
                "payload": {
                    "target_id": reminder["id"],
                    "expected_status": "scheduled",
                },
            },
        )
    )

    updated_calendar_event = calendar_result.output["calendarEvent"]
    submitted_expense = expense_result.output["expenseRecord"]
    canceled_reminder = reminder_result.output["reminder"]
    assert isinstance(updated_calendar_event, dict)
    assert isinstance(submitted_expense, dict)
    assert isinstance(canceled_reminder, dict)
    assert updated_calendar_event["startAt"] == "2026-05-24T10:00:00+08:00"
    assert submitted_expense["status"] == "submitted"
    assert canceled_reminder["status"] == "canceled"
