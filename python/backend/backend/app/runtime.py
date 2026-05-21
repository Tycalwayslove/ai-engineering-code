from orchestrator.executor import ExecutionCoordinator
from orchestrator.planner import ExecutionPlanner

from backend.app.domains.calendar.repository import InMemoryCalendarEventRepository
from backend.app.domains.calendar.service import CalendarDomainService
from backend.app.services.execution_store import InMemoryExecutionStore

execution_store = InMemoryExecutionStore()
calendar_repository = InMemoryCalendarEventRepository()
calendar_service = CalendarDomainService(calendar_repository)
execution_planner = ExecutionPlanner(store=execution_store)
execution_coordinator = ExecutionCoordinator(
    store=execution_store,
    calendar_service=calendar_service,
)
