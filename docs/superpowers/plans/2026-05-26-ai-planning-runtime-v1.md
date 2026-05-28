# AI Planning Runtime v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有后端重构为智能规划大脑优先的 AI Planning Runtime v1，并保持当前日程、费用、提醒 API 行为兼容。

**Architecture:** 保留 FastAPI + Postgres 的模块化单体，把规划、策略、工具目录、执行 runner、事件日志和摘要记忆抽成显式边界。默认使用 rule planner，可选 `llm_mock` 和真实 LLM provider；LLM 只生成候选计划，不直接执行工具或写业务事实。

**Tech Stack:** Python 3.14, FastAPI, psycopg, pytest, ruff, mypy, Postgres, pnpm validation scripts.

---

## File Structure

### New agent runtime modules

- Create: `python/agent-runtime/agent_runtime/context/types.py`
  - Owns `ContextPack`, context summaries, and redaction result types.
- Create: `python/agent-runtime/agent_runtime/context/providers.py`
  - Owns provider protocols for conversation, pending plans, domain summaries, preferences, summary memory, and tool catalog.
- Create: `python/agent-runtime/agent_runtime/context/redactor.py`
  - Owns deterministic context trimming and field minimization.
- Create: `python/agent-runtime/agent_runtime/context/assembler.py`
  - Owns `ContextAssembler`.
- Create: `python/agent-runtime/agent_runtime/planning/types.py`
  - Owns `PlanningInput`, `PlanningResult`, `PlanCandidate`, `ProposedAction`, `ClarificationRequest`, and planner mode types.
- Create: `python/agent-runtime/agent_runtime/planning/engine.py`
  - Owns `PlanningEngine` protocol.
- Create: `python/agent-runtime/agent_runtime/planning/rule_based.py`
  - Owns default rule planner.
- Create: `python/agent-runtime/agent_runtime/planning/compiler.py`
  - Owns candidate-to-execution-plan compilation helpers.
- Create: `python/agent-runtime/agent_runtime/planning/llm.py`
  - Owns `LlmPlanningEngine`, `LlmProvider`, `MockLlmProvider`, and provider response validation.
- Create: `python/agent-runtime/agent_runtime/policy/types.py`
  - Owns policy decision types.
- Create: `python/agent-runtime/agent_runtime/policy/engine.py`
  - Owns `PolicyEngine`.
- Create: `python/agent-runtime/agent_runtime/tools/schemas.py`
  - Owns tool schema model.
- Create: `python/agent-runtime/agent_runtime/tools/catalog.py`
  - Owns built-in tool catalog.
- Create: `python/agent-runtime/agent_runtime/tools/selector.py`
  - Owns deterministic tool selector helper.
- Create: `python/agent-runtime/agent_runtime/tracing/decision_trace.py`
  - Owns decision trace model and factory helpers.
- Create: `python/agent-runtime/agent_runtime/memory/event_log.py`
  - Owns event log model and ports.
- Create: `python/agent-runtime/agent_runtime/memory/summary_memory.py`
  - Owns summary memory model and ports.
- Create: `python/agent-runtime/agent_runtime/memory/ports.py`
  - Owns `MemorySearchPort` and default empty search implementation.

### New orchestrator modules

- Create: `python/orchestrator/orchestrator/use_cases/submit_turn.py`
  - Owns submit-turn application flow.
- Create: `python/orchestrator/orchestrator/use_cases/confirm_plan.py`
  - Owns confirm-plan application flow.
- Create: `python/orchestrator/orchestrator/use_cases/reject_plan.py`
  - Owns reject-plan application flow.
- Create: `python/orchestrator/orchestrator/execution/registry.py`
  - Owns action handler registry.
- Create: `python/orchestrator/orchestrator/execution/handlers.py`
  - Owns built-in action handlers for calendar, expense, reminder.
- Create: `python/orchestrator/orchestrator/execution/runner.py`
  - Owns action execution runner.
- Create: `python/orchestrator/orchestrator/ports.py`
  - Owns orchestrator-facing store and unit-of-work protocols.

### Backend modules

- Modify: `python/backend/backend/app/runtime.py`
  - Replace direct object graph with bootstrap wiring.
- Create: `python/backend/backend/app/bootstrap.py`
  - Owns runtime dependency assembly based on environment.
- Create: `python/backend/backend/app/infrastructure/unit_of_work.py`
  - Owns in-memory and Postgres unit-of-work boundary protocols.
- Create: `python/backend/backend/app/infrastructure/postgres/event_log_repository.py`
  - Owns Postgres agent event persistence.
- Create: `python/backend/backend/app/infrastructure/postgres/decision_trace_repository.py`
  - Owns Postgres decision trace persistence.
- Create: `python/backend/backend/app/infrastructure/postgres/summary_memory_repository.py`
  - Owns Postgres summary memory persistence.
- Create: `python/backend/backend/app/infrastructure/postgres/context_providers.py`
  - Owns SQL-backed context providers.
- Modify: `python/backend/backend/app/routes/agent.py`
  - Delegate to submit-turn use case.
- Modify: `python/backend/backend/app/routes/execution.py`
  - Delegate confirm/reject/get operations to use cases.
- Add migration: `infra/db/migrations/0002_agent_planning_runtime.up.sql`
- Add migration: `infra/db/migrations/0002_agent_planning_runtime.down.sql`

### Tests

- Create: `python/backend/tests/test_planning_runtime_types.py`
- Create: `python/backend/tests/test_tool_catalog.py`
- Create: `python/backend/tests/test_policy_engine.py`
- Create: `python/backend/tests/test_rule_based_planning_engine.py`
- Create: `python/backend/tests/test_plan_compiler.py`
- Create: `python/backend/tests/test_execution_runner.py`
- Create: `python/backend/tests/test_context_assembler.py`
- Create: `python/backend/tests/test_agent_events.py`
- Create: `python/backend/tests/test_summary_memory.py`
- Create: `python/backend/tests/test_llm_planning_engine.py`
- Modify: `python/backend/tests/test_agent_turns.py`
- Modify: `python/backend/tests/test_orchestrator_planner.py`
- Modify: `python/backend/tests/test_postgres_repositories.py`

---

### Task 1: Runtime Type Skeleton and Tool Catalog

**Files:**
- Create: `python/agent-runtime/agent_runtime/tools/schemas.py`
- Create: `python/agent-runtime/agent_runtime/tools/catalog.py`
- Create: `python/agent-runtime/agent_runtime/tools/selector.py`
- Create: `python/agent-runtime/agent_runtime/planning/types.py`
- Create: `python/agent-runtime/agent_runtime/tracing/decision_trace.py`
- Test: `python/backend/tests/test_tool_catalog.py`
- Test: `python/backend/tests/test_planning_runtime_types.py`

- [ ] Write failing tests for built-in tool catalog.

```python
from agent_runtime.tools.catalog import BuiltInToolCatalog


def test_builtin_tool_catalog_exposes_three_write_tools() -> None:
    catalog = BuiltInToolCatalog()

    tools = catalog.list_tools()

    assert [tool.action_type for tool in tools] == [
        "calendar.create_event",
        "expense.create_reimbursement_draft",
        "reminder.create_reminder",
    ]
    assert all(tool.confirmation_required for tool in tools)
    assert catalog.get_tool("reminder.create_reminder").domain == "reminder"
```

- [ ] Run failing catalog test.

Run:

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_tool_catalog.py -q
```

Expected: fail because `agent_runtime.tools.catalog` does not exist.

- [ ] Implement tool schema and catalog.

Create `python/agent-runtime/agent_runtime/tools/schemas.py`:

```python
from dataclasses import dataclass
from typing import Literal


RiskLevel = Literal["low", "medium", "high"]


@dataclass(frozen=True)
class ToolSchema:
    name: str
    action_type: str
    domain: str
    description: str
    input_schema: dict[str, object]
    output_schema: dict[str, object]
    risk_level: RiskLevel
    confirmation_required: bool
    handler_key: str
```

Create `python/agent-runtime/agent_runtime/tools/catalog.py` with a `BuiltInToolCatalog` returning calendar, expense, and reminder schemas.

- [ ] Implement deterministic selector.

Create `python/agent-runtime/agent_runtime/tools/selector.py`:

```python
from agent_runtime.tools.schemas import ToolSchema


class ToolSelector:
    def select_by_action_type(
        self,
        tools: list[ToolSchema],
        action_types: list[str],
    ) -> list[ToolSchema]:
        tool_by_action_type = {tool.action_type: tool for tool in tools}
        return [
            tool_by_action_type[action_type]
            for action_type in action_types
            if action_type in tool_by_action_type
        ]
```

- [ ] Implement planning and trace types.

Create `python/agent-runtime/agent_runtime/planning/types.py` with dataclasses:

```python
from dataclasses import dataclass, field
from typing import Literal


PlannerMode = Literal["rule", "llm_mock", "llm"]
PlanningResultKind = Literal["plan_candidate", "clarification", "assistant_message"]


@dataclass(frozen=True)
class PlanningInput:
    conversation_id: str
    text: str
    now: str
    timezone: str


@dataclass(frozen=True)
class ProposedAction:
    domain: str
    action_type: str
    summary: str
    payload: dict[str, object]
    risk_level: str = "medium"
    missing_fields: list[str] = field(default_factory=list)


@dataclass(frozen=True)
class PlanCandidate:
    goal: str
    proposed_actions: list[ProposedAction]
    missing_information: list[str]
    assumptions: list[str]
    risk_notes: list[str]


@dataclass(frozen=True)
class ClarificationRequest:
    question: str
    missing_fields: list[str]


@dataclass(frozen=True)
class PlanningResult:
    kind: PlanningResultKind
    trace_id: str
    candidate: PlanCandidate | None = None
    clarification: ClarificationRequest | None = None
    message: str | None = None
```

Create `python/agent-runtime/agent_runtime/tracing/decision_trace.py` with `DecisionTrace` dataclass and `DecisionTraceFactory`.

- [ ] Run tests.

Run:

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_tool_catalog.py python/backend/tests/test_planning_runtime_types.py -q
```

Expected: pass.

---

### Task 2: RuleBasedPlanningEngine and PlanCompiler

**Files:**
- Create: `python/agent-runtime/agent_runtime/planning/engine.py`
- Create: `python/agent-runtime/agent_runtime/planning/rule_based.py`
- Create: `python/agent-runtime/agent_runtime/planning/compiler.py`
- Modify: `python/orchestrator/orchestrator/planner.py`
- Test: `python/backend/tests/test_rule_based_planning_engine.py`
- Test: `python/backend/tests/test_plan_compiler.py`

- [ ] Write failing tests for rule planner.

```python
from agent_runtime.context.types import ContextPack
from agent_runtime.planning.rule_based import RuleBasedPlanningEngine
from agent_runtime.planning.types import PlanningInput


def test_rule_based_planner_returns_reminder_plan_candidate() -> None:
    planner = RuleBasedPlanningEngine()
    result = planner.plan(
        PlanningInput(
            conversation_id="conversation_001",
            text="明天上午九点提醒我带电脑",
            now="2026-05-23T18:43:00+08:00",
            timezone="Asia/Shanghai",
        ),
        ContextPack.empty(),
    )

    assert result.kind == "plan_candidate"
    assert result.candidate is not None
    assert result.candidate.proposed_actions[0].action_type == "reminder.create_reminder"
```

- [ ] Run failing planner test.

Run:

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_rule_based_planning_engine.py -q
```

Expected: fail because `RuleBasedPlanningEngine` does not exist.

- [ ] Implement `PlanningEngine` protocol.

Create `python/agent-runtime/agent_runtime/planning/engine.py`:

```python
from typing import Protocol

from agent_runtime.context.types import ContextPack
from agent_runtime.planning.types import PlanningInput, PlanningResult


class PlanningEngine(Protocol):
    def plan(
        self,
        planning_input: PlanningInput,
        context_pack: ContextPack,
    ) -> PlanningResult: ...
```

- [ ] Implement `ContextPack.empty()` minimal type.

Create `python/agent-runtime/agent_runtime/context/types.py` with `ContextPack` and the summary dataclasses needed by tests.

- [ ] Implement `RuleBasedPlanningEngine`.

Create `python/agent-runtime/agent_runtime/planning/rule_based.py` that wraps current `RuleParser.parse()` and maps parsed actions to `PlanCandidate`.

- [ ] Implement `PlanCompiler`.

Create `python/agent-runtime/agent_runtime/planning/compiler.py` with a `compile_candidate_to_plan()` function that preserves current `ExecutionPlanRecord` shape and generates IDs through injectable callables.

- [ ] Wire `ExecutionPlanner` through rule planner and compiler.

Modify `python/orchestrator/orchestrator/planner.py` so public behavior remains unchanged but internal flow is:

```text
PlanningInput -> ContextPack.empty -> RuleBasedPlanningEngine -> PlanCompiler -> store
```

- [ ] Run behavior regression tests.

Run:

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_orchestrator_planner.py python/backend/tests/test_agent_turns.py -q
```

Expected: pass.

---

### Task 3: PolicyEngine and ConfirmationComposer

**Files:**
- Create: `python/agent-runtime/agent_runtime/policy/types.py`
- Create: `python/agent-runtime/agent_runtime/policy/engine.py`
- Modify: `python/agent-runtime/agent_runtime/planning/compiler.py`
- Test: `python/backend/tests/test_policy_engine.py`
- Test: `python/backend/tests/test_plan_compiler.py`

- [ ] Write failing tests for policy.

```python
from agent_runtime.planning.types import PlanCandidate, ProposedAction
from agent_runtime.policy.engine import PolicyEngine


def test_policy_requires_confirmation_for_write_actions() -> None:
    policy = PolicyEngine()
    candidate = PlanCandidate(
        goal="创建提醒",
        proposed_actions=[
            ProposedAction(
                domain="reminder",
                action_type="reminder.create_reminder",
                summary="创建提醒：带电脑",
                payload={"title": "带电脑", "due_at": "2026-05-24T09:00:00+08:00"},
            )
        ],
        missing_information=[],
        assumptions=[],
        risk_notes=[],
    )

    decision = policy.evaluate(candidate)

    assert decision.requires_confirmation is True
    assert decision.required_action_indexes == [0]
    assert decision.risk_level == "medium"
```

- [ ] Run failing policy tests.

Run:

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_policy_engine.py -q
```

Expected: fail because policy module does not exist.

- [ ] Implement policy types and engine.

Create `PolicyDecision` with fields:

```text
requires_confirmation
required_action_indexes
risk_level
clarification_question
missing_fields
policy_notes
```

Implement first rules:

- Any proposed write action requires confirmation.
- Any missing field returns clarification.
- Calendar, expense, reminder writes are `medium` risk.

- [ ] Make compiler consume policy decisions.

Update `PlanCompiler` so confirmation title, description, required action IDs, and plan risk derive from `PolicyDecision`.

- [ ] Run policy and compiler tests.

Run:

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_policy_engine.py python/backend/tests/test_plan_compiler.py -q
```

Expected: pass.

---

### Task 4: ActionRegistry and ExecutionRunner

**Files:**
- Create: `python/orchestrator/orchestrator/execution/registry.py`
- Create: `python/orchestrator/orchestrator/execution/handlers.py`
- Create: `python/orchestrator/orchestrator/execution/runner.py`
- Modify: `python/orchestrator/orchestrator/executor.py`
- Modify: `python/backend/backend/app/runtime.py`
- Test: `python/backend/tests/test_execution_runner.py`
- Modify: `python/backend/tests/test_orchestrator_planner.py`

- [ ] Write failing tests for registry execution.

```python
from backend.app.domains.calendar.repository import InMemoryCalendarEventRepository
from backend.app.domains.calendar.service import CalendarDomainService
from orchestrator.execution.handlers import CalendarCreateEventHandler
from orchestrator.execution.registry import ActionHandlerRegistry
from orchestrator.execution.runner import ExecutionRunner


def test_execution_runner_executes_registered_calendar_handler() -> None:
    calendar_service = CalendarDomainService(InMemoryCalendarEventRepository())
    registry = ActionHandlerRegistry()
    registry.register("calendar.create_event", CalendarCreateEventHandler(calendar_service))
    runner = ExecutionRunner(registry)
    action = {
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
    }

    result = runner.execute_action(action)

    assert result.status == "succeeded"
    assert result.output["calendarEvent"]["title"] == "开会"
```

- [ ] Run failing execution runner test.

Run:

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_execution_runner.py -q
```

Expected: fail because execution modules do not exist.

- [ ] Implement registry and handlers.

Implement:

- `ActionHandler` protocol with `execute(action) -> ActionExecutionResult`.
- `ActionHandlerRegistry.register(action_type, handler)`.
- `ActionHandlerRegistry.resolve(action_type)`.
- `CalendarCreateEventHandler`.
- `ExpenseDraftHandler`.
- `ReminderCreateHandler`.

- [ ] Implement runner.

`ExecutionRunner.execute_action()` resolves the handler and returns structured result without mutating the plan by itself.

- [ ] Update `ExecutionCoordinator`.

Keep `ExecutionCoordinator.confirm_plan()` public API, but replace `_execute_action()` internals with `ExecutionRunner`.

- [ ] Update runtime wiring.

Register the three built-in handlers in `runtime.py` or `bootstrap.py`.

- [ ] Run regression tests.

Run:

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_execution_runner.py python/backend/tests/test_orchestrator_planner.py python/backend/tests/test_agent_turns.py -q
```

Expected: pass.

---

### Task 5: ContextAssembler and ContextRedactor

**Files:**
- Create: `python/agent-runtime/agent_runtime/context/providers.py`
- Create: `python/agent-runtime/agent_runtime/context/redactor.py`
- Create: `python/agent-runtime/agent_runtime/context/assembler.py`
- Create: `python/backend/backend/app/infrastructure/postgres/context_providers.py`
- Test: `python/backend/tests/test_context_assembler.py`

- [ ] Write failing context assembler test.

```python
from agent_runtime.context.assembler import ContextAssembler
from agent_runtime.context.providers import StaticContextProvider


def test_context_assembler_includes_domain_summaries_and_tool_catalog() -> None:
    assembler = ContextAssembler(
        conversation_provider=StaticContextProvider(recent_conversation=["用户：明天提醒我"]),
        pending_plan_provider=StaticContextProvider(pending_plans=[]),
        calendar_provider=StaticContextProvider(calendar_summary=["明天 15:00 开会"]),
        reminder_provider=StaticContextProvider(reminder_summary=[]),
        expense_provider=StaticContextProvider(expense_summary=[]),
        preference_provider=StaticContextProvider(user_preferences=["默认提前 30 分钟提醒"]),
        summary_memory_provider=StaticContextProvider(relevant_history=[]),
        tool_catalog_provider=StaticContextProvider(tool_catalog=["reminder.create_reminder"]),
    )

    context = assembler.assemble(
        current_input="明天上午九点提醒我带电脑",
        current_time="2026-05-23T18:43:00+08:00",
        timezone="Asia/Shanghai",
    )

    assert context.current_input == "明天上午九点提醒我带电脑"
    assert context.calendar_summary == ["明天 15:00 开会"]
    assert context.user_preferences == ["默认提前 30 分钟提醒"]
    assert context.tool_catalog == ["reminder.create_reminder"]
```

- [ ] Run failing context assembler test.

Run:

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_context_assembler.py -q
```

Expected: fail because context assembler does not exist.

- [ ] Implement provider protocols and static provider.

`providers.py` defines provider protocols and `StaticContextProvider` for tests.

- [ ] Implement redactor.

`ContextRedactor.redact(context_pack)` trims lists to configured limits and returns `RedactionResult`.

- [ ] Implement assembler.

`ContextAssembler.assemble()` gathers sections, runs redactor, and returns `ContextPack`.

- [ ] Add SQL-backed providers.

`context_providers.py` reads from existing conversation, calendar, reminder, expense, and execution plan tables. Keep queries bounded with explicit `limit` values.

- [ ] Run context tests and type checks.

Run:

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_context_assembler.py -q
PATH=.venv/bin:$PATH mypy python
```

Expected: pass.

---

### Task 6: EventLog and DecisionTrace Persistence

**Files:**
- Create: `infra/db/migrations/0002_agent_planning_runtime.up.sql`
- Create: `infra/db/migrations/0002_agent_planning_runtime.down.sql`
- Create: `python/agent-runtime/agent_runtime/memory/event_log.py`
- Create: `python/backend/backend/app/infrastructure/postgres/event_log_repository.py`
- Create: `python/backend/backend/app/infrastructure/postgres/decision_trace_repository.py`
- Modify: `python/backend/tests/test_postgres_repositories.py`
- Test: `python/backend/tests/test_agent_events.py`

- [ ] Write failing repository tests.

```python
from agent_runtime.memory.event_log import AgentEvent
from backend.app.infrastructure.postgres.event_log_repository import PostgresAgentEventRepository


def test_postgres_agent_event_repository_records_event(settings) -> None:
    repository = PostgresAgentEventRepository(settings=settings)
    event = AgentEvent(
        id="agent_event_test",
        conversation_id="conversation_event_test",
        plan_id=None,
        action_id=None,
        event_type="user_input_received",
        payload={"input": "明天上午九点提醒我带电脑"},
        created_at="2026-05-23T18:43:00+08:00",
    )

    repository.append(event)

    assert repository.list_for_conversation("conversation_event_test")[-1].event_type == "user_input_received"
```

- [ ] Run failing repository test.

Run:

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_agent_events.py -q
```

Expected: fail before migration and repositories exist.

- [ ] Add migration tables.

Create `agent_events`, `decision_traces`, and `summary_memories` tables exactly as specified in the design document.

- [ ] Implement event and trace models.

`AgentEvent` and `DecisionTraceRecord` are dataclasses with JSON payload fields.

- [ ] Implement Postgres repositories.

Repositories expose:

- `append(event)`.
- `list_for_conversation(conversation_id, limit=50)`.
- `save(trace)`.
- `get(trace_id)`.

- [ ] Integrate event writes into submit and confirm flows.

Record at least:

- `user_input_received`.
- `context_pack_created`.
- `plan_candidate_created`.
- `policy_evaluated`.
- `confirmation_created`.
- `plan_confirmed`.
- `action_executed`.
- `action_failed`.

- [ ] Run repository and API regression tests.

Run:

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_agent_events.py python/backend/tests/test_agent_turns.py python/backend/tests/test_postgres_repositories.py -q
```

Expected: pass.

---

### Task 7: SummaryMemory and MemorySearchPort

**Files:**
- Create: `python/agent-runtime/agent_runtime/memory/summary_memory.py`
- Create: `python/agent-runtime/agent_runtime/memory/ports.py`
- Create: `python/backend/backend/app/infrastructure/postgres/summary_memory_repository.py`
- Test: `python/backend/tests/test_summary_memory.py`

- [ ] Write failing summary memory tests.

```python
from agent_runtime.memory.ports import EmptyMemorySearchPort
from agent_runtime.memory.summary_memory import SummaryMemory


def test_empty_memory_search_returns_no_results() -> None:
    search = EmptyMemorySearchPort()

    assert search.search("明天上午安排", filters={"conversation_id": "conversation_001"}) == []


def test_summary_memory_carries_type_and_payload() -> None:
    memory = SummaryMemory(
        id="summary_001",
        conversation_id="conversation_001",
        memory_type="recent_execution_summary",
        summary="用户最近创建了一个提醒和一个费用草稿。",
        payload={"actions": ["reminder.create_reminder", "expense.create_reimbursement_draft"]},
        created_at="2026-05-26T10:00:00+08:00",
    )

    assert memory.memory_type == "recent_execution_summary"
    assert memory.payload["actions"] == ["reminder.create_reminder", "expense.create_reimbursement_draft"]
```

- [ ] Run failing memory tests.

Run:

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_summary_memory.py -q
```

Expected: fail because memory modules do not exist.

- [ ] Implement summary memory dataclass.

Support memory types:

- `conversation_summary`.
- `user_preference_summary`.
- `recent_execution_summary`.
- `planning_pattern_summary`.

- [ ] Implement empty search port.

`EmptyMemorySearchPort.search()` returns `[]` and is used until vector retrieval is added.

- [ ] Implement Postgres repository.

Support `save(memory)` and `list_recent(conversation_id=None, limit=20)`.

- [ ] Add ContextAssembler integration.

Read recent summary memory through provider and include it in `ContextPack.relevant_history`.

- [ ] Run memory tests and context tests.

Run:

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_summary_memory.py python/backend/tests/test_context_assembler.py -q
```

Expected: pass.

---

### Task 8: LLM Mock Planner

**Files:**
- Create: `python/agent-runtime/agent_runtime/planning/llm.py`
- Create: `python/agent-runtime/agent_runtime/planning/prompts.py`
- Test: `python/backend/tests/test_llm_planning_engine.py`
- Modify: `python/backend/backend/app/bootstrap.py`

- [ ] Write failing LLM mock test.

```python
from agent_runtime.context.types import ContextPack
from agent_runtime.planning.llm import LlmPlanningEngine, MockLlmProvider
from agent_runtime.planning.types import PlanningInput


def test_llm_mock_planner_validates_candidate_schema() -> None:
    provider = MockLlmProvider(
        response={
            "goal": "创建提醒",
            "proposed_actions": [
                {
                    "domain": "reminder",
                    "action_type": "reminder.create_reminder",
                    "summary": "创建提醒：带电脑",
                    "payload": {
                        "title": "带电脑",
                        "due_at": "2026-05-24T09:00:00+08:00",
                        "timezone": "Asia/Shanghai",
                    },
                    "risk_level": "medium",
                    "missing_fields": [],
                }
            ],
            "missing_information": [],
            "assumptions": ["用户指的是明天上午九点"],
            "risk_notes": ["写入提醒需要确认"],
        }
    )
    planner = LlmPlanningEngine(provider=provider)

    result = planner.plan(
        PlanningInput(
            conversation_id="conversation_001",
            text="明天上午九点提醒我带电脑",
            now="2026-05-23T18:43:00+08:00",
            timezone="Asia/Shanghai",
        ),
        ContextPack.empty(),
    )

    assert result.kind == "plan_candidate"
    assert result.candidate is not None
    assert result.candidate.proposed_actions[0].action_type == "reminder.create_reminder"
```

- [ ] Run failing LLM mock test.

Run:

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_llm_planning_engine.py -q
```

Expected: fail because `planning.llm` does not exist.

- [ ] Implement prompt builder.

`prompts.py` exposes `build_planning_prompt(context_pack, tool_catalog)` and returns deterministic text sections:

- current input.
- context summaries.
- available tools.
- JSON output contract.

- [ ] Implement provider protocol and mock provider.

`LlmProvider.complete_json(prompt, schema)` returns a dictionary.

- [ ] Implement LLM planning engine.

Validate required keys before creating `PlanCandidate`. On invalid response return assistant message with `fallback_reason` in trace.

- [ ] Wire `AI_PLANNER_MODE=llm_mock`.

`bootstrap.py` chooses:

- `RuleBasedPlanningEngine` for `rule` or unset.
- `LlmPlanningEngine(MockLlmProvider(...))` for `llm_mock`.

- [ ] Run LLM tests and full backend tests.

Run:

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_llm_planning_engine.py python/backend/tests -q
```

Expected: pass.

---

### Task 9: Optional Real LLM Provider

**Files:**
- Modify: `python/agent-runtime/agent_runtime/planning/llm.py`
- Modify: `python/backend/backend/app/bootstrap.py`
- Create: `python/backend/tests/test_planner_mode_selection.py`

- [ ] Write failing mode selection tests.

```python
from backend.app.bootstrap import create_planning_engine


def test_default_planner_mode_is_rule(monkeypatch) -> None:
    monkeypatch.delenv("AI_PLANNER_MODE", raising=False)

    engine = create_planning_engine()

    assert engine.__class__.__name__ == "RuleBasedPlanningEngine"


def test_llm_mode_requires_api_key(monkeypatch) -> None:
    monkeypatch.setenv("AI_PLANNER_MODE", "llm")
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)

    try:
        create_planning_engine()
    except RuntimeError as error:
        assert "OPENAI_API_KEY is required" in str(error)
    else:
        raise AssertionError("expected missing API key to fail")
```

- [ ] Run failing mode selection tests.

Run:

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_planner_mode_selection.py -q
```

Expected: fail because `create_planning_engine()` does not exist.

- [ ] Implement mode selection.

`create_planning_engine()` reads `AI_PLANNER_MODE` and creates the correct engine.

- [ ] Implement real provider boundary without default activation.

`OpenAILlmProvider` should be constructed only when `AI_PLANNER_MODE=llm`. It must not run during default tests. If the OpenAI SDK is unavailable, raise a clear `RuntimeError` only in `llm` mode.

- [ ] Add provider integration test with monkeypatch.

Use a fake client object to assert provider passes prompt and schema into the client adapter. Do not call the network from tests.

- [ ] Run mode selection tests.

Run:

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_planner_mode_selection.py python/backend/tests/test_llm_planning_engine.py -q
```

Expected: pass without an API key.

---

### Task 10: Use Cases and Backend Bootstrap

**Files:**
- Create: `python/orchestrator/orchestrator/use_cases/submit_turn.py`
- Create: `python/orchestrator/orchestrator/use_cases/confirm_plan.py`
- Create: `python/orchestrator/orchestrator/use_cases/reject_plan.py`
- Create: `python/backend/backend/app/bootstrap.py`
- Modify: `python/backend/backend/app/runtime.py`
- Modify: `python/backend/backend/app/routes/agent.py`
- Modify: `python/backend/backend/app/routes/execution.py`
- Test: `python/backend/tests/test_agent_turns.py`

- [ ] Write failing route delegation test.

Extend `test_agent_turns.py` to assert event log side effects and existing response shape for reminder input.

- [ ] Run failing route test.

Run:

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_agent_turns.py::test_confirmation_executes_reminder_and_lists_reminders -q
```

Expected: initially pass for response shape; new event assertion fails before use-case event integration.

- [ ] Implement use cases.

`SubmitTurnUseCase.execute()` orchestrates:

```text
record user_input_received
assemble context
plan
evaluate policy
compile plan or clarification
save plan
record trace/events
return AgentTurnResponse
```

`ConfirmPlanUseCase.execute()` delegates to `ExecutionRunner` through coordinator-compatible flow and records events.

`RejectPlanUseCase.execute()` rejects plans and records `plan_rejected`.

- [ ] Implement backend bootstrap.

`bootstrap.py` creates stores, repositories, context providers, planning engine, policy engine, action registry, runner, and use cases.

- [ ] Shrink runtime module.

`runtime.py` imports a single `container = create_app_container()` and exposes current route dependencies from container attributes for compatibility.

- [ ] Update routes.

Routes delegate to use cases without knowing planner or runner details.

- [ ] Run API regression tests.

Run:

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_agent_turns.py python/backend/tests/test_health.py -q
```

Expected: pass.

---

### Task 11: Multi-Action Planning Regression

**Files:**
- Modify: `python/agent-runtime/agent_runtime/parsers/rule_parser.py`
- Modify: `python/agent-runtime/agent_runtime/planning/rule_based.py`
- Test: `python/backend/tests/test_rule_based_planning_engine.py`
- Modify: `python/backend/tests/test_agent_turns.py`

- [ ] Write failing multi-action test.

```python
def test_rule_based_planner_supports_calendar_expense_and_reminder_in_one_turn() -> None:
    planner = RuleBasedPlanningEngine()
    result = planner.plan(
        PlanningInput(
            conversation_id="conversation_multi",
            text="明天下午三点开会，顺便把昨天 58 元打车票报销，再提醒我带电脑",
            now="2026-05-23T18:43:00+08:00",
            timezone="Asia/Shanghai",
        ),
        ContextPack.empty(),
    )

    assert result.kind == "plan_candidate"
    assert result.candidate is not None
    assert [action.action_type for action in result.candidate.proposed_actions] == [
        "calendar.create_event",
        "expense.create_reimbursement_draft",
        "reminder.create_reminder",
    ]
```

- [ ] Run failing multi-action test.

Run:

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_rule_based_planning_engine.py::test_rule_based_planner_supports_calendar_expense_and_reminder_in_one_turn -q
```

Expected: fail if reminder title extraction includes unwanted suffix or multi-action ordering is wrong.

- [ ] Tighten rule parser segmentation.

Update parser helpers so reminder text in a multi-intent sentence extracts `带电脑` from `再提醒我带电脑` and does not absorb earlier clauses.

- [ ] Add API multi-action confirmation test.

Submit the multi-action input through `/agent/turns`, confirm once, then assert:

- one calendar event exists for action ID.
- one expense record exists for action ID.
- one reminder exists for action ID.
- ledger contains three `action_executed` events.

- [ ] Run multi-action and full regression.

Run:

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_rule_based_planning_engine.py python/backend/tests/test_agent_turns.py -q
```

Expected: pass.

---

### Task 12: Final Verification and Documentation

**Files:**
- Modify: `ai-factory/memory/working/active-context/current-project-state.md`
- Modify: `docs/knowledge-sync/feishu-pages/03-evolution-log.md`
- Add: Obsidian stage note for implementation

- [ ] Run full backend tests.

Run:

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests -v
```

Expected: all tests pass.

- [ ] Run Python quality checks.

Run:

```bash
PATH=.venv/bin:$PATH ruff check python
PATH=.venv/bin:$PATH mypy python
```

Expected: both pass.

- [ ] Run frontend and contract checks.

Run:

```bash
pnpm --filter @ai-code/h5 typecheck
pnpm --filter @ai-code/sdk typecheck
pnpm --filter @ai-code/shared-types typecheck
pnpm validate:contracts
pnpm validate:native-shells
pnpm validate:context-sync
pnpm validate:factory
git diff --check
```

Expected: all pass.

- [ ] Verify default planner mode.

Run:

```bash
curl -fsS -X POST http://127.0.0.1:8000/agent/turns \
  -H 'Content-Type: application/json' \
  -d '{"conversationId":"verify_rule_mode","input":"明天上午九点提醒我带电脑","clientContext":{"now":"2026-05-26T10:00:00+08:00","timezone":"Asia/Shanghai"}}'
```

Expected: response kind is `confirmation_required`, and first action type is `reminder.create_reminder`.

- [ ] Update project state.

Add a concise implementation summary and verification commands to `current-project-state.md`.

- [ ] Update Feishu source draft.

Add a new phase entry in `docs/knowledge-sync/feishu-pages/03-evolution-log.md`.

- [ ] Add Obsidian implementation note.

Create:

```text
/Users/mac/Library/Mobile Documents/com~apple~CloudDocs/Obsidian/Projects/AI Engineering Code/阶段成果/2026-05-26 AI Planning Runtime v1 后端架构实施.md
```

- [ ] Run context sync validation again.

Run:

```bash
pnpm validate:context-sync
```

Expected: pass.

---

## Self-Review

Spec coverage:

- Structure-first runtime boundaries are covered by Tasks 1, 2, 3, 4, 5, and 10.
- Multi-step planning is covered by Task 11.
- LLM-ready and optional real provider are covered by Tasks 8 and 9.
- Full context pack is covered by Task 5.
- Event log and decision trace are covered by Task 6.
- Summary memory and vector-search interface reservation are covered by Task 7.
- API compatibility and verification are covered by Tasks 10, 11, and 12.

Placeholder scan:

- This plan avoids unfinished marker words and open-ended implementation placeholders.
- Each task lists exact files, tests, commands, and expected outcomes.

Type consistency:

- `PlanningInput`, `PlanningResult`, `PlanCandidate`, `ProposedAction`, `ContextPack`, `PolicyDecision`, `ToolSchema`, `AgentEvent`, and `SummaryMemory` are introduced before later tasks consume them.
- Planner modes are consistently `rule`, `llm_mock`, and `llm`.
