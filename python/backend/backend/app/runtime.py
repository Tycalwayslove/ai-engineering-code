from orchestrator.executor import ExecutionCoordinator
from orchestrator.planner import ExecutionPlanner

from backend.app.domains.calendar.postgres_repository import PostgresCalendarEventRepository
from backend.app.domains.calendar.repository import (
    CalendarEventRepository,
    InMemoryCalendarEventRepository,
)
from backend.app.domains.calendar.service import CalendarDomainService
from backend.app.services.conversation_turn_store import (
    ConversationTurnStore,
    InMemoryConversationTurnStore,
    PostgresConversationTurnStore,
)
from backend.app.services.database import get_database_settings
from backend.app.services.execution_store import ExecutionStore, InMemoryExecutionStore
from backend.app.services.postgres_execution_store import PostgresExecutionStore

database_settings = get_database_settings()
if database_settings is None:
    execution_store: ExecutionStore = InMemoryExecutionStore()
    calendar_repository: CalendarEventRepository = InMemoryCalendarEventRepository()
    conversation_turn_store: ConversationTurnStore = InMemoryConversationTurnStore()
else:
    execution_store = PostgresExecutionStore(settings=database_settings)
    calendar_repository = PostgresCalendarEventRepository(settings=database_settings)
    conversation_turn_store = PostgresConversationTurnStore(settings=database_settings)
calendar_service = CalendarDomainService(calendar_repository)
execution_planner = ExecutionPlanner(store=execution_store)
execution_coordinator = ExecutionCoordinator(
    store=execution_store,
    calendar_service=calendar_service,
)
