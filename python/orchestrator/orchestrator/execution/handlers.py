from backend.app.domains.calendar.service import CalendarDomainService
from backend.app.domains.expense.service import ExpenseDomainService
from backend.app.domains.reminder.service import ReminderDomainService
from backend.app.services.execution_store import DomainActionRecord

from orchestrator.execution.result import ActionExecutionResult


class CalendarCreateEventHandler:
    def __init__(self, calendar_service: CalendarDomainService) -> None:
        self._calendar_service = calendar_service

    def execute(self, action: DomainActionRecord) -> ActionExecutionResult:
        event = self._calendar_service.create_event(
            action_id=action["id"],
            payload=action["payload"],
        )
        return ActionExecutionResult(
            status="succeeded",
            output={"calendarEvent": dict(event)},
        )


class CalendarCancelEventHandler:
    def __init__(self, calendar_service: CalendarDomainService) -> None:
        self._calendar_service = calendar_service

    def execute(self, action: DomainActionRecord) -> ActionExecutionResult:
        event = self._calendar_service.cancel_event(
            self._target_id(action),
        )
        return ActionExecutionResult(
            status="succeeded",
            output={"calendarEvent": dict(event)},
        )

    def _target_id(self, action: DomainActionRecord) -> str:
        value = action["payload"].get("target_id")
        if not isinstance(value, str) or value.strip() == "":
            raise ValueError("target_id is required")
        return value


class CalendarUpdateEventHandler:
    def __init__(self, calendar_service: CalendarDomainService) -> None:
        self._calendar_service = calendar_service

    def execute(self, action: DomainActionRecord) -> ActionExecutionResult:
        event = self._calendar_service.update_event(
            self._target_id(action),
            self._patch(action),
        )
        return ActionExecutionResult(
            status="succeeded",
            output={"calendarEvent": dict(event)},
        )

    def _target_id(self, action: DomainActionRecord) -> str:
        value = action["payload"].get("target_id")
        if not isinstance(value, str) or value.strip() == "":
            raise ValueError("target_id is required")
        return value

    def _patch(self, action: DomainActionRecord) -> dict[str, object]:
        value = action["payload"].get("patch")
        if not isinstance(value, dict):
            raise ValueError("patch is required")
        return dict(value)


class ExpenseDraftHandler:
    def __init__(self, expense_service: ExpenseDomainService) -> None:
        self._expense_service = expense_service

    def execute(self, action: DomainActionRecord) -> ActionExecutionResult:
        record = self._expense_service.create_reimbursement_draft(
            action_id=action["id"],
            payload=action["payload"],
        )
        return ActionExecutionResult(
            status="succeeded",
            output={"expenseRecord": dict(record)},
        )


class ExpenseSubmitHandler:
    def __init__(self, expense_service: ExpenseDomainService) -> None:
        self._expense_service = expense_service

    def execute(self, action: DomainActionRecord) -> ActionExecutionResult:
        record = self._expense_service.submit_record(self._target_id(action))
        return ActionExecutionResult(
            status="succeeded",
            output={"expenseRecord": dict(record)},
        )

    def _target_id(self, action: DomainActionRecord) -> str:
        value = action["payload"].get("target_id")
        if not isinstance(value, str) or value.strip() == "":
            raise ValueError("target_id is required")
        return value


class ExpenseCancelHandler:
    def __init__(self, expense_service: ExpenseDomainService) -> None:
        self._expense_service = expense_service

    def execute(self, action: DomainActionRecord) -> ActionExecutionResult:
        record = self._expense_service.cancel_record(self._target_id(action))
        return ActionExecutionResult(
            status="succeeded",
            output={"expenseRecord": dict(record)},
        )

    def _target_id(self, action: DomainActionRecord) -> str:
        value = action["payload"].get("target_id")
        if not isinstance(value, str) or value.strip() == "":
            raise ValueError("target_id is required")
        return value


class ExpenseUpdateHandler:
    def __init__(self, expense_service: ExpenseDomainService) -> None:
        self._expense_service = expense_service

    def execute(self, action: DomainActionRecord) -> ActionExecutionResult:
        record = self._expense_service.update_record(
            self._target_id(action),
            self._patch(action),
        )
        return ActionExecutionResult(
            status="succeeded",
            output={"expenseRecord": dict(record)},
        )

    def _target_id(self, action: DomainActionRecord) -> str:
        value = action["payload"].get("target_id")
        if not isinstance(value, str) or value.strip() == "":
            raise ValueError("target_id is required")
        return value

    def _patch(self, action: DomainActionRecord) -> dict[str, object]:
        value = action["payload"].get("patch")
        if not isinstance(value, dict):
            raise ValueError("patch is required")
        return dict(value)


class ReminderCreateHandler:
    def __init__(self, reminder_service: ReminderDomainService) -> None:
        self._reminder_service = reminder_service

    def execute(self, action: DomainActionRecord) -> ActionExecutionResult:
        reminder = self._reminder_service.create_reminder(
            action_id=action["id"],
            payload=action["payload"],
        )
        return ActionExecutionResult(
            status="succeeded",
            output={"reminder": dict(reminder)},
        )


class ReminderCompleteHandler:
    def __init__(self, reminder_service: ReminderDomainService) -> None:
        self._reminder_service = reminder_service

    def execute(self, action: DomainActionRecord) -> ActionExecutionResult:
        reminder = self._reminder_service.complete_reminder(self._target_id(action))
        return ActionExecutionResult(
            status="succeeded",
            output={"reminder": dict(reminder)},
        )

    def _target_id(self, action: DomainActionRecord) -> str:
        value = action["payload"].get("target_id")
        if not isinstance(value, str) or value.strip() == "":
            raise ValueError("target_id is required")
        return value


class ReminderCancelHandler:
    def __init__(self, reminder_service: ReminderDomainService) -> None:
        self._reminder_service = reminder_service

    def execute(self, action: DomainActionRecord) -> ActionExecutionResult:
        reminder = self._reminder_service.cancel_reminder(self._target_id(action))
        return ActionExecutionResult(
            status="succeeded",
            output={"reminder": dict(reminder)},
        )

    def _target_id(self, action: DomainActionRecord) -> str:
        value = action["payload"].get("target_id")
        if not isinstance(value, str) or value.strip() == "":
            raise ValueError("target_id is required")
        return value


class ReminderUpdateHandler:
    def __init__(self, reminder_service: ReminderDomainService) -> None:
        self._reminder_service = reminder_service

    def execute(self, action: DomainActionRecord) -> ActionExecutionResult:
        reminder = self._reminder_service.update_reminder(
            self._target_id(action),
            self._patch(action),
        )
        return ActionExecutionResult(
            status="succeeded",
            output={"reminder": dict(reminder)},
        )

    def _target_id(self, action: DomainActionRecord) -> str:
        value = action["payload"].get("target_id")
        if not isinstance(value, str) or value.strip() == "":
            raise ValueError("target_id is required")
        return value

    def _patch(self, action: DomainActionRecord) -> dict[str, object]:
        value = action["payload"].get("patch")
        if not isinstance(value, dict):
            raise ValueError("patch is required")
        return dict(value)
