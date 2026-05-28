from dataclasses import dataclass
from os import environ
from typing import cast

from agent_runtime.context.assembler import ContextAssembler
from agent_runtime.context.providers import StaticContextProvider
from agent_runtime.memory.event_log import EventLogRepository, InMemoryEventLogRepository
from agent_runtime.memory.summary_memory import (
    InMemorySummaryMemoryRepository,
    SummaryMemoryRepository,
)
from agent_runtime.planning.engine import PlanningEngine
from agent_runtime.planning.llm import (
    DeepSeekLlmProvider,
    LlmFirstPlanningEngine,
    LlmPlanningEngine,
    LlmProvider,
    MockLlmProvider,
    OpenAILlmProvider,
)
from agent_runtime.planning.rule_based import RuleBasedPlanningEngine
from agent_runtime.planning.types import PlannerMode
from agent_runtime.tracing.decision_trace import (
    DecisionTraceRepository,
    InMemoryDecisionTraceRepository,
)
from orchestrator.executor import ExecutionCoordinator
from orchestrator.planner import ExecutionPlanner
from orchestrator.use_cases.confirm_plan import ConfirmPlanUseCase
from orchestrator.use_cases.reject_plan import RejectPlanUseCase
from orchestrator.use_cases.submit_turn import SubmitTurnUseCase

from backend.app.domains.attachment.context_provider import AttachmentSummaryProvider
from backend.app.domains.attachment.postgres_repository import (
    PostgresAttachmentIntakeRepository,
)
from backend.app.domains.attachment.repository import (
    AttachmentIntakeRepository,
    InMemoryAttachmentIntakeRepository,
)
from backend.app.domains.attachment.service import AttachmentIntakeService
from backend.app.domains.calendar.postgres_repository import PostgresCalendarEventRepository
from backend.app.domains.calendar.repository import (
    CalendarEventRepository,
    InMemoryCalendarEventRepository,
)
from backend.app.domains.calendar.service import CalendarDomainService
from backend.app.domains.expense.postgres_repository import PostgresExpenseRecordRepository
from backend.app.domains.expense.repository import (
    ExpenseRecordRepository,
    InMemoryExpenseRecordRepository,
)
from backend.app.domains.expense.service import ExpenseDomainService
from backend.app.domains.reminder.postgres_repository import PostgresReminderRepository
from backend.app.domains.reminder.repository import (
    InMemoryReminderRepository,
    ReminderRepository,
)
from backend.app.domains.reminder.service import ReminderDomainService
from backend.app.env import load_env_local
from backend.app.infrastructure.domain_context_providers import (
    CalendarSummaryProvider,
    ExpenseSummaryProvider,
    ReminderSummaryProvider,
    SummaryMemoryProvider,
)
from backend.app.infrastructure.postgres.context_providers import (
    BuiltInToolCatalogProvider,
    EmptyPreferenceProvider,
    PostgresCalendarSummaryProvider,
    PostgresExpenseSummaryProvider,
    PostgresPendingClarificationProvider,
    PostgresPendingPlanProvider,
    PostgresRecentConversationProvider,
    PostgresReminderSummaryProvider,
    PostgresSummaryMemoryProvider,
)
from backend.app.infrastructure.postgres.decision_trace_repository import (
    PostgresDecisionTraceRepository,
)
from backend.app.infrastructure.postgres.event_log_repository import (
    PostgresEventLogRepository,
)
from backend.app.infrastructure.postgres.pending_clarification_repository import (
    PostgresPendingClarificationRepository,
)
from backend.app.infrastructure.postgres.summary_memory_repository import (
    PostgresSummaryMemoryRepository,
)
from backend.app.services.conversation_turn_store import (
    ConversationTurnStore,
    InMemoryConversationTurnStore,
    PostgresConversationTurnStore,
)
from backend.app.services.database import DatabaseSettings, get_database_settings
from backend.app.services.direct_action_audit import DirectActionAuditService
from backend.app.services.execution_store import ExecutionStore, InMemoryExecutionStore
from backend.app.services.pending_clarification_store import (
    InMemoryPendingClarificationStore,
    PendingClarificationStore,
    PendingClarificationSummaryProvider,
)
from backend.app.services.postgres_execution_store import PostgresExecutionStore


@dataclass(frozen=True)
class AppRuntime:
    execution_store: ExecutionStore
    pending_clarification_store: PendingClarificationStore
    attachment_repository: AttachmentIntakeRepository
    calendar_repository: CalendarEventRepository
    expense_repository: ExpenseRecordRepository
    reminder_repository: ReminderRepository
    conversation_turn_store: ConversationTurnStore
    event_log_repository: EventLogRepository
    decision_trace_repository: DecisionTraceRepository
    summary_memory_repository: SummaryMemoryRepository
    attachment_service: AttachmentIntakeService
    calendar_service: CalendarDomainService
    expense_service: ExpenseDomainService
    reminder_service: ReminderDomainService
    direct_action_auditor: DirectActionAuditService
    execution_planner: ExecutionPlanner
    execution_coordinator: ExecutionCoordinator
    submit_turn_use_case: SubmitTurnUseCase
    confirm_plan_use_case: ConfirmPlanUseCase
    reject_plan_use_case: RejectPlanUseCase


def create_planning_engine(mode: PlannerMode | None = None) -> PlanningEngine:
    load_env_local()
    planner_mode = mode or _planner_mode_from_env()
    if planner_mode == "llm_first":
        return LlmFirstPlanningEngine(
            llm_engine=LlmPlanningEngine(
                provider=create_llm_provider(),
                mode="llm",
            ),
            fallback_engine=RuleBasedPlanningEngine(),
        )
    if planner_mode == "rule":
        return RuleBasedPlanningEngine()
    if planner_mode == "llm_mock":
        return LlmPlanningEngine(provider=MockLlmProvider(), mode="llm_mock")
    if planner_mode == "llm":
        return LlmPlanningEngine(provider=create_llm_provider(), mode="llm")
    raise ValueError(f"unsupported AI_PLANNER_MODE: {planner_mode}")


def create_llm_provider(provider_name: str | None = None) -> LlmProvider:
    load_env_local()
    selected_provider = provider_name or environ.get("AI_PLANNER_PROVIDER", "openai")
    selected_provider = selected_provider.strip().lower()

    if selected_provider == "openai":
        return OpenAILlmProvider(model=environ.get("AI_PLANNER_MODEL", "gpt-4.1-mini"))
    if selected_provider == "deepseek":
        return DeepSeekLlmProvider(
            model=environ.get("AI_PLANNER_MODEL", "deepseek-v4-flash"),
            base_url=environ.get("DEEPSEEK_BASE_URL", "https://api.deepseek.com"),
        )
    raise ValueError(f"unsupported AI_PLANNER_PROVIDER: {selected_provider}")


def create_runtime(settings: DatabaseSettings | None = None) -> AppRuntime:
    database_settings = settings if settings is not None else get_database_settings()
    if database_settings is None:
        execution_store: ExecutionStore = InMemoryExecutionStore()
        pending_clarification_store: PendingClarificationStore = (
            InMemoryPendingClarificationStore()
        )
        calendar_repository: CalendarEventRepository = InMemoryCalendarEventRepository()
        attachment_repository: AttachmentIntakeRepository = (
            InMemoryAttachmentIntakeRepository()
        )
        expense_repository: ExpenseRecordRepository = InMemoryExpenseRecordRepository()
        reminder_repository: ReminderRepository = InMemoryReminderRepository()
        conversation_turn_store: ConversationTurnStore = InMemoryConversationTurnStore()
        summary_memory_repository: SummaryMemoryRepository = (
            InMemorySummaryMemoryRepository()
        )
        context_assembler = _create_in_memory_context_assembler(
            execution_store,
            calendar_repository,
            expense_repository,
            reminder_repository,
            pending_clarification_store,
            attachment_repository,
            summary_memory_repository,
        )
        event_log_repository: EventLogRepository = InMemoryEventLogRepository()
        decision_trace_repository: DecisionTraceRepository = (
            InMemoryDecisionTraceRepository()
        )
    else:
        execution_store = PostgresExecutionStore(settings=database_settings)
        pending_clarification_store = PostgresPendingClarificationRepository(
            settings=database_settings,
        )
        calendar_repository = PostgresCalendarEventRepository(settings=database_settings)
        attachment_repository = PostgresAttachmentIntakeRepository(
            settings=database_settings,
        )
        expense_repository = PostgresExpenseRecordRepository(settings=database_settings)
        reminder_repository = PostgresReminderRepository(settings=database_settings)
        conversation_turn_store = PostgresConversationTurnStore(settings=database_settings)
        summary_memory_repository = PostgresSummaryMemoryRepository(
            settings=database_settings,
        )
        context_assembler = _create_postgres_context_assembler(database_settings)
        event_log_repository = PostgresEventLogRepository(settings=database_settings)
        decision_trace_repository = PostgresDecisionTraceRepository(
            settings=database_settings,
        )

    attachment_service = AttachmentIntakeService(attachment_repository)
    calendar_service = CalendarDomainService(calendar_repository)
    expense_service = ExpenseDomainService(expense_repository)
    reminder_service = ReminderDomainService(reminder_repository)
    direct_action_auditor = DirectActionAuditService(
        execution_store=execution_store,
        summary_memory_repository=summary_memory_repository,
    )
    execution_planner = ExecutionPlanner(
        store=execution_store,
        planning_engine=create_planning_engine(),
        context_assembler=context_assembler,
        event_log_repository=event_log_repository,
        decision_trace_repository=decision_trace_repository,
        pending_clarification_store=pending_clarification_store,
    )
    execution_coordinator = ExecutionCoordinator(
        store=execution_store,
        calendar_service=calendar_service,
        expense_service=expense_service,
        reminder_service=reminder_service,
        summary_memory_repository=summary_memory_repository,
    )
    submit_turn_use_case = SubmitTurnUseCase(
        execution_planner=execution_planner,
        conversation_turn_store=conversation_turn_store,
    )
    confirm_plan_use_case = ConfirmPlanUseCase(execution_coordinator)
    reject_plan_use_case = RejectPlanUseCase(execution_coordinator)

    return AppRuntime(
        execution_store=execution_store,
        pending_clarification_store=pending_clarification_store,
        attachment_repository=attachment_repository,
        calendar_repository=calendar_repository,
        expense_repository=expense_repository,
        reminder_repository=reminder_repository,
        conversation_turn_store=conversation_turn_store,
        event_log_repository=event_log_repository,
        decision_trace_repository=decision_trace_repository,
        summary_memory_repository=summary_memory_repository,
        attachment_service=attachment_service,
        calendar_service=calendar_service,
        expense_service=expense_service,
        reminder_service=reminder_service,
        direct_action_auditor=direct_action_auditor,
        execution_planner=execution_planner,
        execution_coordinator=execution_coordinator,
        submit_turn_use_case=submit_turn_use_case,
        confirm_plan_use_case=confirm_plan_use_case,
        reject_plan_use_case=reject_plan_use_case,
    )


def _planner_mode_from_env() -> PlannerMode:
    value = environ.get("AI_PLANNER_MODE", "llm_first")
    if value in ("llm_first", "rule", "llm_mock", "llm"):
        return cast(PlannerMode, value)
    raise ValueError(f"unsupported AI_PLANNER_MODE: {value}")


def _create_in_memory_context_assembler(
    execution_store: ExecutionStore,
    calendar_repository: CalendarEventRepository,
    expense_repository: ExpenseRecordRepository,
    reminder_repository: ReminderRepository,
    pending_clarification_store: PendingClarificationStore,
    attachment_repository: AttachmentIntakeRepository,
    summary_memory_repository: SummaryMemoryRepository,
) -> ContextAssembler:
    empty_list_provider: StaticContextProvider[list[str]] = StaticContextProvider([])
    return ContextAssembler(
        conversation_provider=empty_list_provider,
        pending_plan_provider=empty_list_provider,
        pending_clarification_provider=PendingClarificationSummaryProvider(
            pending_clarification_store,
        ),
        calendar_provider=CalendarSummaryProvider(
            calendar_repository,
            execution_store,
        ),
        reminder_provider=ReminderSummaryProvider(
            reminder_repository,
            execution_store,
        ),
        expense_provider=ExpenseSummaryProvider(
            expense_repository,
            execution_store,
        ),
        attachment_provider=AttachmentSummaryProvider(attachment_repository),
        preference_provider=empty_list_provider,
        summary_memory_provider=SummaryMemoryProvider(summary_memory_repository),
        tool_catalog_provider=BuiltInToolCatalogProvider(),
    )


def _create_postgres_context_assembler(settings: DatabaseSettings) -> ContextAssembler:
    return ContextAssembler(
        conversation_provider=PostgresRecentConversationProvider(settings=settings),
        pending_plan_provider=PostgresPendingPlanProvider(settings=settings),
        pending_clarification_provider=PostgresPendingClarificationProvider(
            settings=settings,
        ),
        calendar_provider=PostgresCalendarSummaryProvider(settings=settings),
        reminder_provider=PostgresReminderSummaryProvider(settings=settings),
        expense_provider=PostgresExpenseSummaryProvider(settings=settings),
        attachment_provider=AttachmentSummaryProvider(
            PostgresAttachmentIntakeRepository(settings=settings),
        ),
        preference_provider=EmptyPreferenceProvider(),
        summary_memory_provider=PostgresSummaryMemoryProvider(settings=settings),
        tool_catalog_provider=BuiltInToolCatalogProvider(),
    )
