# Orchestrator-First Backend Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first working backend slice for the AI scheduling execution agent: typed contracts, SDK methods, FastAPI routes, orchestrator planning, guarded domain execution, and execution ledger persistence.

**Architecture:** Keep FastAPI thin and route work through `python/orchestrator`. Use `python/agent-runtime` for framework-agnostic parsing and structured planning primitives. Implement calendar as the first executable domain, with expense and reminder represented in contracts and plan payloads so multi-intent data shapes are stable from day one.

**Tech Stack:** FastAPI, Pydantic v2, Python 3.12, pytest, TypeScript, pnpm, OpenAPI 3.1, lightweight repository interfaces, Postgres-ready data shapes.

---

## Scope

This plan implements Phase 1 from [the approved design spec](../specs/2026-05-21-backend-architecture-design.md): synchronous Orchestrator, agent-runtime interfaces, typed API contract, SDK methods, calendar execution, expense/reminder planning boundaries, and execution ledger retrieval.

This plan does not implement a production authentication system, async workers, Redis queues, external reimbursement systems, external calendars, or real LLM API calls. It creates stable adapter interfaces and deterministic parser behavior so those integrations can be added without moving the core boundaries.

## File Structure

Create or modify these files.

Contracts and TypeScript:

- Modify `contracts/openapi/api-gateway.yaml`: add Agent turn, execution plan, confirmation, ledger, calendar, expense, and reminder schemas and paths.
- Modify `packages/shared-types/src/index.ts`: add workflow, plan, action, confirmation, ledger, and domain object types.
- Modify `packages/sdk/src/index.ts`: add typed client methods for agent turns, plan confirmation, plan rejection, plan retrieval, ledger retrieval, and domain reads.
- Modify `scripts/validate-contracts.mjs`: extend lightweight contract validation for the new slice.

Python runtime:

- Create `python/agent-runtime/agent_runtime/types.py`: framework-agnostic parser and planning types.
- Create `python/agent-runtime/agent_runtime/parsers/rule_parser.py`: deterministic parser for the first Chinese scheduling scenarios.
- Create `python/orchestrator/orchestrator/types.py`: orchestrator request and response types.
- Create `python/orchestrator/orchestrator/planner.py`: plan creation and response selection.
- Create `python/orchestrator/orchestrator/executor.py`: confirmation and synchronous action execution.
- Create `python/backend/backend/app/domains/calendar/models.py`: calendar domain typed dictionaries.
- Create `python/backend/backend/app/domains/calendar/repository.py`: in-process repository interface and implementation used by tests.
- Create `python/backend/backend/app/domains/calendar/service.py`: guarded calendar domain service.
- Create `python/backend/backend/app/services/execution_store.py`: plan, action, confirmation, and ledger store interface.
- Create `python/backend/backend/app/routes/agent.py`: `/agent/turns` route.
- Create `python/backend/backend/app/routes/execution.py`: execution plan and ledger routes.
- Create `python/backend/backend/app/routes/calendar.py`: calendar read route.
- Modify `python/backend/backend/app/main.py`: register new routers.

Tests:

- Create `python/backend/tests/test_agent_turns.py`: end-to-end tests for turn planning, clarification, confirmation, execution, and ledger.
- Create `python/backend/tests/test_orchestrator_planner.py`: unit tests for deterministic multi-intent planning.
- Create `python/backend/tests/test_calendar_domain.py`: domain service tests for guarded, idempotent event creation.

## Implementation Tasks

### Task 1: Add Shared TypeScript Workflow Types

**Files:**

- Modify: `packages/shared-types/src/index.ts`

- [ ] **Step 1: Add failing type usage test by extending the package with concrete exports**

Modify `packages/shared-types/src/index.ts` by appending these types after the existing `FactoryStatus` type:

```ts
export type RiskLevel = "low" | "medium" | "high";

export type ExecutionPlanStatus =
  | "input_received"
  | "planning"
  | "needs_clarification"
  | "awaiting_confirmation"
  | "executing"
  | "succeeded"
  | "failed"
  | "rejected";

export type DomainActionStatus =
  | "planned"
  | "awaiting_confirmation"
  | "executing"
  | "succeeded"
  | "failed"
  | "rejected";

export type DomainName = "calendar" | "expense" | "reminder";

export type DomainActionType =
  | "calendar.create_event"
  | "calendar.query_events"
  | "expense.create_reimbursement_draft"
  | "reminder.create_reminder";

export type AgentTurnRequest = {
  conversationId?: string;
  input: string;
  clientContext?: {
    locale?: string;
    timezone?: string;
    now?: string;
  };
};

export type DomainAction = {
  id: string;
  planId: string;
  domain: DomainName;
  actionType: DomainActionType;
  status: DomainActionStatus;
  riskLevel: RiskLevel;
  summary: string;
  payload: Record<string, unknown>;
  result?: Record<string, unknown>;
};

export type ConfirmationCard = {
  id: string;
  planId: string;
  status: "pending" | "confirmed" | "rejected" | "expired";
  requiredActionIds: string[];
  title: string;
  description: string;
  confirmToken: string;
};

export type ExecutionPlan = {
  id: string;
  conversationId: string;
  status: ExecutionPlanStatus;
  riskLevel: RiskLevel;
  summary: string;
  decisionTraceId: string;
  actions: DomainAction[];
  confirmation?: ConfirmationCard;
};

export type ClarificationRequest = {
  kind: "clarification_request";
  conversationId: string;
  question: string;
  missingFields: string[];
};

export type ConfirmationRequiredResponse = {
  kind: "confirmation_required";
  conversationId: string;
  plan: ExecutionPlan;
};

export type AssistantMessageResponse = {
  kind: "assistant_message";
  conversationId: string;
  message: string;
  structuredElements: Record<string, unknown>[];
};

export type ExecutionResultResponse = {
  kind: "execution_result";
  conversationId: string;
  plan: ExecutionPlan;
};

export type AgentTurnResponse =
  | AssistantMessageResponse
  | ClarificationRequest
  | ConfirmationRequiredResponse
  | ExecutionResultResponse;

export type ConfirmExecutionPlanRequest = {
  confirmToken: string;
  actionIds?: string[];
};

export type ExecutionLedgerItem = {
  id: string;
  planId: string;
  actionId?: string;
  eventType:
    | "plan_created"
    | "confirmation_created"
    | "action_executed"
    | "action_failed"
    | "plan_rejected";
  status: "info" | "succeeded" | "failed";
  message: string;
  createdAt: string;
};

export type CalendarEvent = {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  timezone: string;
  status: "scheduled" | "canceled";
  sourceActionId: string;
};

export type ExpenseRecord = {
  id: string;
  title: string;
  amount?: number;
  currency: string;
  occurredOn?: string;
  status: "draft" | "submitted" | "canceled";
  sourceActionId: string;
};

export type Reminder = {
  id: string;
  title: string;
  dueAt: string;
  status: "scheduled" | "done" | "canceled";
  sourceActionId: string;
};
```

- [ ] **Step 2: Run shared-types typecheck**

Run:

```bash
pnpm --filter @ai-code/shared-types typecheck
```

Expected: PASS. This task only adds types.

- [ ] **Step 3: Commit**

```bash
git add packages/shared-types/src/index.ts
git commit -m "feat(types): add execution workflow types"
```

### Task 2: Add SDK Workflow Methods

**Files:**

- Modify: `packages/sdk/src/index.ts`

- [ ] **Step 1: Update SDK imports and exports**

Replace the import/export block at the top of `packages/sdk/src/index.ts` with:

```ts
import type {
  AgentTurnRequest,
  AgentTurnResponse,
  CalendarEvent,
  ConfirmExecutionPlanRequest,
  ExecutionLedgerItem,
  ExecutionPlan,
  ExpenseRecord,
  FactoryStatus,
  HealthStatus,
  Reminder,
  VersionInfo,
} from "@ai-code/shared-types";

export type {
  AgentTurnRequest,
  AgentTurnResponse,
  CalendarEvent,
  ConfirmationCard,
  ConfirmExecutionPlanRequest,
  DomainAction,
  DomainActionStatus,
  DomainActionType,
  DomainName,
  ExecutionLedgerItem,
  ExecutionPlan,
  ExecutionPlanStatus,
  ExpenseRecord,
  FactoryCapability,
  FactoryCapabilityStatus,
  FactoryStatus,
  Reminder,
  RiskLevel,
} from "@ai-code/shared-types";
```

- [ ] **Step 2: Add SDK methods**

Inside `ApiClient`, after `getFactoryStatus()`, add:

```ts
  async submitAgentTurn(request: AgentTurnRequest): Promise<AgentTurnResponse> {
    return this.request<AgentTurnResponse>("/agent/turns", {
      body: JSON.stringify(request),
      method: "POST",
    });
  }

  async confirmExecutionPlan(
    planId: string,
    request: ConfirmExecutionPlanRequest,
  ): Promise<AgentTurnResponse> {
    return this.request<AgentTurnResponse>(
      `/execution-plans/${encodeURIComponent(planId)}/confirm`,
      {
        body: JSON.stringify(request),
        method: "POST",
      },
    );
  }

  async rejectExecutionPlan(planId: string): Promise<ExecutionPlan> {
    return this.request<ExecutionPlan>(
      `/execution-plans/${encodeURIComponent(planId)}/reject`,
      {
        method: "POST",
      },
    );
  }

  async getExecutionPlan(planId: string): Promise<ExecutionPlan> {
    return this.request<ExecutionPlan>(
      `/execution-plans/${encodeURIComponent(planId)}`,
    );
  }

  async getExecutionLedger(): Promise<ExecutionLedgerItem[]> {
    return this.request<ExecutionLedgerItem[]>("/execution-ledger");
  }

  async getCalendarEvents(): Promise<CalendarEvent[]> {
    return this.request<CalendarEvent[]>("/calendar/events");
  }

  async getExpenses(): Promise<ExpenseRecord[]> {
    return this.request<ExpenseRecord[]>("/expenses");
  }

  async getReminders(): Promise<Reminder[]> {
    return this.request<Reminder[]>("/reminders");
  }
```

- [ ] **Step 3: Extend private request options**

Change:

```ts
  private async request<T>(path: string): Promise<T> {
```

to:

```ts
  private async request<T>(
    path: string,
    init: RequestInit = {},
  ): Promise<T> {
```

Then replace the `headers` object with:

```ts
const headers: Record<string, string> = {
  Accept: "application/json",
  ...(init.body ? { "Content-Type": "application/json" } : {}),
};
```

Then replace the fetch call with:

```ts
const response = await fetch(`${this.baseUrl}${path}`, {
  ...init,
  headers: {
    ...headers,
    ...init.headers,
  },
});
```

- [ ] **Step 4: Run SDK typecheck**

Run:

```bash
pnpm --filter @ai-code/sdk typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/sdk/src/index.ts
git commit -m "feat(sdk): add execution workflow methods"
```

### Task 3: Extend OpenAPI and Contract Validation

**Files:**

- Modify: `contracts/openapi/api-gateway.yaml`
- Modify: `scripts/validate-contracts.mjs`

- [ ] **Step 1: Add OpenAPI paths**

In `contracts/openapi/api-gateway.yaml`, add these paths under `paths:` after `/factory/status`. The snippet starts at the path-key level; indent it by two spaces when inserting it under `paths:`.

```yaml
/agent/turns:
  post:
    operationId: submitAgentTurn
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/AgentTurnRequest"
    responses:
      "200":
        description: Agent turn result
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/AgentTurnResponse"
/execution-plans/{id}/confirm:
  post:
    operationId: confirmExecutionPlan
    parameters:
      - name: id
        in: path
        required: true
        schema:
          type: string
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/ConfirmExecutionPlanRequest"
    responses:
      "200":
        description: Execution result after confirmation
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/AgentTurnResponse"
/execution-plans/{id}/reject:
  post:
    operationId: rejectExecutionPlan
    parameters:
      - name: id
        in: path
        required: true
        schema:
          type: string
    responses:
      "200":
        description: Rejected execution plan
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/ExecutionPlan"
/execution-plans/{id}:
  get:
    operationId: getExecutionPlan
    parameters:
      - name: id
        in: path
        required: true
        schema:
          type: string
    responses:
      "200":
        description: Execution plan
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/ExecutionPlan"
/execution-ledger:
  get:
    operationId: getExecutionLedger
    responses:
      "200":
        description: Execution ledger
        content:
          application/json:
            schema:
              type: array
              items:
                $ref: "#/components/schemas/ExecutionLedgerItem"
/calendar/events:
  get:
    operationId: getCalendarEvents
    responses:
      "200":
        description: Calendar events
        content:
          application/json:
            schema:
              type: array
              items:
                $ref: "#/components/schemas/CalendarEvent"
/expenses:
  get:
    operationId: getExpenses
    responses:
      "200":
        description: Expense records
        content:
          application/json:
            schema:
              type: array
              items:
                $ref: "#/components/schemas/ExpenseRecord"
/reminders:
  get:
    operationId: getReminders
    responses:
      "200":
        description: Reminders
        content:
          application/json:
            schema:
              type: array
              items:
                $ref: "#/components/schemas/Reminder"
```

- [ ] **Step 2: Add OpenAPI schemas**

Append these schemas under `components.schemas` after `FactoryStatus`. The snippet starts at the schema-key level; indent it by four spaces when inserting it under `components.schemas`.

```yaml
AgentTurnRequest:
  type: object
  required: [input]
  properties:
    conversationId:
      type: string
    input:
      type: string
    clientContext:
      type: object
ConfirmExecutionPlanRequest:
  type: object
  required: [confirmToken]
  properties:
    confirmToken:
      type: string
    actionIds:
      type: array
      items:
        type: string
DomainAction:
  type: object
  required:
    [id, planId, domain, actionType, status, riskLevel, summary, payload]
  properties:
    id:
      type: string
    planId:
      type: string
    domain:
      type: string
      enum: [calendar, expense, reminder]
    actionType:
      type: string
    status:
      type: string
    riskLevel:
      type: string
      enum: [low, medium, high]
    summary:
      type: string
    payload:
      type: object
    result:
      type: object
ConfirmationCard:
  type: object
  required:
    [id, planId, status, requiredActionIds, title, description, confirmToken]
  properties:
    id:
      type: string
    planId:
      type: string
    status:
      type: string
    requiredActionIds:
      type: array
      items:
        type: string
    title:
      type: string
    description:
      type: string
    confirmToken:
      type: string
ExecutionPlan:
  type: object
  required:
    [id, conversationId, status, riskLevel, summary, decisionTraceId, actions]
  properties:
    id:
      type: string
    conversationId:
      type: string
    status:
      type: string
    riskLevel:
      type: string
      enum: [low, medium, high]
    summary:
      type: string
    decisionTraceId:
      type: string
    actions:
      type: array
      items:
        $ref: "#/components/schemas/DomainAction"
    confirmation:
      $ref: "#/components/schemas/ConfirmationCard"
AgentTurnResponse:
  type: object
  required: [kind, conversationId]
  properties:
    kind:
      type: string
      enum:
        [
          assistant_message,
          clarification_request,
          confirmation_required,
          execution_result,
        ]
    conversationId:
      type: string
    message:
      type: string
    question:
      type: string
    missingFields:
      type: array
      items:
        type: string
    plan:
      $ref: "#/components/schemas/ExecutionPlan"
    structuredElements:
      type: array
      items:
        type: object
ExecutionLedgerItem:
  type: object
  required: [id, planId, eventType, status, message, createdAt]
  properties:
    id:
      type: string
    planId:
      type: string
    actionId:
      type: string
    eventType:
      type: string
    status:
      type: string
    message:
      type: string
    createdAt:
      type: string
CalendarEvent:
  type: object
  required: [id, title, startAt, endAt, timezone, status, sourceActionId]
  properties:
    id:
      type: string
    title:
      type: string
    startAt:
      type: string
    endAt:
      type: string
    timezone:
      type: string
    status:
      type: string
    sourceActionId:
      type: string
ExpenseRecord:
  type: object
  required: [id, title, currency, status, sourceActionId]
  properties:
    id:
      type: string
    title:
      type: string
    amount:
      type: number
    currency:
      type: string
    occurredOn:
      type: string
    status:
      type: string
    sourceActionId:
      type: string
Reminder:
  type: object
  required: [id, title, dueAt, status, sourceActionId]
  properties:
    id:
      type: string
    title:
      type: string
    dueAt:
      type: string
    status:
      type: string
    sourceActionId:
      type: string
```

- [ ] **Step 3: Extend validation script operation checks**

In `scripts/validate-contracts.mjs`, extend `expectedOperations` to:

```js
const expectedOperations = {
  confirmExecutionPlan: "confirmExecutionPlan",
  getCalendarEvents: "getCalendarEvents",
  getExecutionLedger: "getExecutionLedger",
  getExecutionPlan: "getExecutionPlan",
  getExpenses: "getExpenses",
  getFactoryStatus: "getFactoryStatus",
  getHealth: "getHealth",
  getReminders: "getReminders",
  getVersion: "getVersion",
  rejectExecutionPlan: "rejectExecutionPlan",
  submitAgentTurn: "submitAgentTurn",
};
```

Then add this constant near `expectedFactoryStatusFields`:

```js
const expectedExecutionPlanFields = [
  "id",
  "conversationId",
  "status",
  "riskLevel",
  "summary",
  "decisionTraceId",
  "actions",
];
```

Then in `validateFactoryStatusSlice`, after the FactoryStatus required check, add:

```js
const executionPlanRequired = getPathValue(openapiDocument, [
  "components",
  "schemas",
  "ExecutionPlan",
  "required",
]);
assertArrayIncludesAll(
  contractFiles.openapi,
  "ExecutionPlan.required",
  executionPlanRequired,
  expectedExecutionPlanFields,
);
```

- [ ] **Step 4: Run contract validation**

Run:

```bash
pnpm validate:contracts
```

Expected: PASS and output includes `Contract validation passed.`

- [ ] **Step 5: Commit**

```bash
git add contracts/openapi/api-gateway.yaml scripts/validate-contracts.mjs
git commit -m "feat(contracts): add execution workflow api"
```

### Task 4: Add Agent Runtime Rule Parser

**Files:**

- Create: `python/agent-runtime/agent_runtime/types.py`
- Create: `python/agent-runtime/agent_runtime/parsers/__init__.py`
- Create: `python/agent-runtime/agent_runtime/parsers/rule_parser.py`

- [ ] **Step 1: Write failing parser tests**

Create `python/backend/tests/test_orchestrator_planner.py` with:

```python
from agent_runtime.parsers.rule_parser import RuleParser


def test_rule_parser_extracts_calendar_create_action() -> None:
    parser = RuleParser()

    result = parser.parse(
        text="明天下午三点开会",
        now="2026-05-21T09:00:00+08:00",
        timezone="Asia/Shanghai",
    )

    assert result.intent_count == 1
    assert result.actions[0]["domain"] == "calendar"
    assert result.actions[0]["action_type"] == "calendar.create_event"
    assert result.actions[0]["payload"]["title"] == "开会"
    assert result.actions[0]["payload"]["start_at"] == "2026-05-22T15:00:00+08:00"
    assert result.actions[0]["payload"]["end_at"] == "2026-05-22T16:00:00+08:00"


def test_rule_parser_extracts_multi_intent_calendar_and_expense() -> None:
    parser = RuleParser()

    result = parser.parse(
        text="明天下午三点开会，顺便把昨天打车票报销",
        now="2026-05-21T09:00:00+08:00",
        timezone="Asia/Shanghai",
    )

    assert result.intent_count == 2
    assert [action["domain"] for action in result.actions] == ["calendar", "expense"]
    assert result.actions[1]["action_type"] == "expense.create_reimbursement_draft"
    assert result.actions[1]["missing_fields"] == ["amount"]
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
pytest python/backend/tests/test_orchestrator_planner.py -v
```

Expected: FAIL with `ModuleNotFoundError: No module named 'agent_runtime.parsers'`.

- [ ] **Step 3: Add agent runtime types**

Create `python/agent-runtime/agent_runtime/types.py`:

```python
from typing import Literal, TypedDict

RiskLevel = Literal["low", "medium", "high"]
DomainName = Literal["calendar", "expense", "reminder"]


class ParsedAction(TypedDict):
    domain: DomainName
    action_type: str
    risk_level: RiskLevel
    summary: str
    payload: dict[str, object]
    missing_fields: list[str]


class ParseResult:
    def __init__(self, actions: list[ParsedAction], trace_id: str) -> None:
        self.actions = actions
        self.trace_id = trace_id

    @property
    def intent_count(self) -> int:
        return len(self.actions)
```

- [ ] **Step 4: Add parser package**

Create `python/agent-runtime/agent_runtime/parsers/__init__.py`:

```python
from agent_runtime.parsers.rule_parser import RuleParser

__all__ = ["RuleParser"]
```

- [ ] **Step 5: Add deterministic rule parser**

Create `python/agent-runtime/agent_runtime/parsers/rule_parser.py`:

```python
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
```

- [ ] **Step 6: Run parser tests**

Run:

```bash
pytest python/backend/tests/test_orchestrator_planner.py -v
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add python/agent-runtime/agent_runtime/types.py python/agent-runtime/agent_runtime/parsers python/backend/tests/test_orchestrator_planner.py
git commit -m "feat(agent-runtime): add deterministic rule parser"
```

### Task 5: Add Calendar Domain and Execution Store

**Files:**

- Create: `python/backend/backend/app/domains/__init__.py`
- Create: `python/backend/backend/app/domains/calendar/__init__.py`
- Create: `python/backend/backend/app/domains/calendar/models.py`
- Create: `python/backend/backend/app/domains/calendar/repository.py`
- Create: `python/backend/backend/app/domains/calendar/service.py`
- Create: `python/backend/backend/app/services/execution_store.py`
- Create: `python/backend/tests/test_calendar_domain.py`

- [ ] **Step 1: Write failing calendar domain tests**

Create `python/backend/tests/test_calendar_domain.py`:

```python
import pytest

from backend.app.domains.calendar.repository import InMemoryCalendarEventRepository
from backend.app.domains.calendar.service import CalendarDomainService


def test_calendar_service_creates_event_with_source_action() -> None:
    repository = InMemoryCalendarEventRepository()
    service = CalendarDomainService(repository)

    event = service.create_event(
        action_id="action_001",
        payload={
            "title": "开会",
            "start_at": "2026-05-22T15:00:00+08:00",
            "end_at": "2026-05-22T16:00:00+08:00",
            "timezone": "Asia/Shanghai",
        },
    )

    assert event["title"] == "开会"
    assert event["sourceActionId"] == "action_001"
    assert repository.list_events() == [event]


def test_calendar_service_is_idempotent_by_action_id() -> None:
    repository = InMemoryCalendarEventRepository()
    service = CalendarDomainService(repository)

    first = service.create_event(
        action_id="action_001",
        payload={
            "title": "开会",
            "start_at": "2026-05-22T15:00:00+08:00",
            "end_at": "2026-05-22T16:00:00+08:00",
            "timezone": "Asia/Shanghai",
        },
    )
    second = service.create_event(
        action_id="action_001",
        payload={
            "title": "开会",
            "start_at": "2026-05-22T15:00:00+08:00",
            "end_at": "2026-05-22T16:00:00+08:00",
            "timezone": "Asia/Shanghai",
        },
    )

    assert first == second
    assert len(repository.list_events()) == 1


def test_calendar_service_rejects_missing_title() -> None:
    repository = InMemoryCalendarEventRepository()
    service = CalendarDomainService(repository)

    with pytest.raises(ValueError, match="title is required"):
        service.create_event(
            action_id="action_001",
            payload={
                "start_at": "2026-05-22T15:00:00+08:00",
                "end_at": "2026-05-22T16:00:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        )
```

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
pytest python/backend/tests/test_calendar_domain.py -v
```

Expected: FAIL with `ModuleNotFoundError: No module named 'backend.app.domains'`.

- [ ] **Step 3: Add calendar models**

Create `python/backend/backend/app/domains/__init__.py`:

```python

```

Create `python/backend/backend/app/domains/calendar/__init__.py`:

```python

```

Create `python/backend/backend/app/domains/calendar/models.py`:

```python
from typing import Literal, TypedDict


class CalendarEvent(TypedDict):
    id: str
    title: str
    startAt: str
    endAt: str
    timezone: str
    status: Literal["scheduled", "canceled"]
    sourceActionId: str
```

- [ ] **Step 4: Add repository**

Create `python/backend/backend/app/domains/calendar/repository.py`:

```python
from backend.app.domains.calendar.models import CalendarEvent


class InMemoryCalendarEventRepository:
    def __init__(self) -> None:
        self._events_by_action_id: dict[str, CalendarEvent] = {}

    def create_event(self, event: CalendarEvent) -> CalendarEvent:
        existing = self._events_by_action_id.get(event["sourceActionId"])
        if existing is not None:
            return existing

        self._events_by_action_id[event["sourceActionId"]] = event
        return event

    def list_events(self) -> list[CalendarEvent]:
        return list(self._events_by_action_id.values())
```

- [ ] **Step 5: Add guarded domain service**

Create `python/backend/backend/app/domains/calendar/service.py`:

```python
from uuid import uuid4

from backend.app.domains.calendar.models import CalendarEvent
from backend.app.domains.calendar.repository import InMemoryCalendarEventRepository


class CalendarDomainService:
    def __init__(self, repository: InMemoryCalendarEventRepository) -> None:
        self._repository = repository

    def create_event(self, action_id: str, payload: dict[str, object]) -> CalendarEvent:
        title = self._require_string(payload, "title")
        start_at = self._require_string(payload, "start_at")
        end_at = self._require_string(payload, "end_at")
        timezone = self._require_string(payload, "timezone")

        return self._repository.create_event(
            {
                "id": f"calendar_event_{uuid4().hex}",
                "title": title,
                "startAt": start_at,
                "endAt": end_at,
                "timezone": timezone,
                "status": "scheduled",
                "sourceActionId": action_id,
            }
        )

    def list_events(self) -> list[CalendarEvent]:
        return self._repository.list_events()

    def _require_string(self, payload: dict[str, object], key: str) -> str:
        value = payload.get(key)
        if not isinstance(value, str) or value.strip() == "":
            raise ValueError(f"{key} is required")
        return value
```

- [ ] **Step 6: Add execution store**

Create `python/backend/backend/app/services/execution_store.py`:

```python
from datetime import UTC, datetime
from typing import Literal, TypedDict

RiskLevel = Literal["low", "medium", "high"]


class DomainActionRecord(TypedDict):
    id: str
    planId: str
    domain: str
    actionType: str
    status: str
    riskLevel: RiskLevel
    summary: str
    payload: dict[str, object]
    result: dict[str, object] | None


class ConfirmationRecord(TypedDict):
    id: str
    planId: str
    status: str
    requiredActionIds: list[str]
    title: str
    description: str
    confirmToken: str


class ExecutionPlanRecord(TypedDict):
    id: str
    conversationId: str
    status: str
    riskLevel: RiskLevel
    summary: str
    decisionTraceId: str
    actions: list[DomainActionRecord]
    confirmation: ConfirmationRecord | None


class LedgerRecord(TypedDict):
    id: str
    planId: str
    actionId: str | None
    eventType: str
    status: str
    message: str
    createdAt: str


class InMemoryExecutionStore:
    def __init__(self) -> None:
        self._plans: dict[str, ExecutionPlanRecord] = {}
        self._ledger: list[LedgerRecord] = []

    def save_plan(self, plan: ExecutionPlanRecord) -> ExecutionPlanRecord:
        self._plans[plan["id"]] = plan
        return plan

    def get_plan(self, plan_id: str) -> ExecutionPlanRecord:
        return self._plans[plan_id]

    def list_ledger(self) -> list[LedgerRecord]:
        return self._ledger

    def append_ledger(
        self,
        plan_id: str,
        event_type: str,
        status: str,
        message: str,
        action_id: str | None = None,
    ) -> LedgerRecord:
        record: LedgerRecord = {
            "id": f"ledger_{len(self._ledger) + 1}",
            "planId": plan_id,
            "actionId": action_id,
            "eventType": event_type,
            "status": status,
            "message": message,
            "createdAt": datetime.now(UTC).isoformat(),
        }
        self._ledger.append(record)
        return record
```

- [ ] **Step 7: Run calendar domain tests**

Run:

```bash
pytest python/backend/tests/test_calendar_domain.py -v
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add python/backend/backend/app/domains python/backend/backend/app/services/execution_store.py python/backend/tests/test_calendar_domain.py
git commit -m "feat(backend): add guarded calendar domain"
```

### Task 6: Add Orchestrator Planner and Executor

**Files:**

- Create: `python/orchestrator/orchestrator/types.py`
- Create: `python/orchestrator/orchestrator/planner.py`
- Create: `python/orchestrator/orchestrator/executor.py`
- Modify: `python/backend/tests/test_orchestrator_planner.py`

- [ ] **Step 1: Extend orchestrator tests**

Append to `python/backend/tests/test_orchestrator_planner.py`:

```python
from backend.app.domains.calendar.repository import InMemoryCalendarEventRepository
from backend.app.domains.calendar.service import CalendarDomainService
from backend.app.services.execution_store import InMemoryExecutionStore
from orchestrator.executor import ExecutionCoordinator
from orchestrator.planner import ExecutionPlanner


def test_planner_returns_confirmation_required_for_calendar_write() -> None:
    store = InMemoryExecutionStore()
    planner = ExecutionPlanner(store=store)

    response = planner.submit_turn(
        conversation_id="conversation_001",
        text="明天下午三点开会",
        now="2026-05-21T09:00:00+08:00",
        timezone="Asia/Shanghai",
    )

    assert response["kind"] == "confirmation_required"
    plan = response["plan"]
    assert plan["status"] == "awaiting_confirmation"
    assert plan["actions"][0]["actionType"] == "calendar.create_event"
    assert plan["confirmation"]["confirmToken"].startswith("confirm_")


def test_planner_returns_clarification_for_missing_expense_amount() -> None:
    store = InMemoryExecutionStore()
    planner = ExecutionPlanner(store=store)

    response = planner.submit_turn(
        conversation_id="conversation_001",
        text="把昨天打车票报销",
        now="2026-05-21T09:00:00+08:00",
        timezone="Asia/Shanghai",
    )

    assert response == {
        "kind": "clarification_request",
        "conversationId": "conversation_001",
        "question": "打车票报销需要补充金额。",
        "missingFields": ["amount"],
    }


def test_executor_confirms_and_executes_calendar_action() -> None:
    store = InMemoryExecutionStore()
    calendar_service = CalendarDomainService(InMemoryCalendarEventRepository())
    planner = ExecutionPlanner(store=store)
    coordinator = ExecutionCoordinator(store=store, calendar_service=calendar_service)

    planning_response = planner.submit_turn(
        conversation_id="conversation_001",
        text="明天下午三点开会",
        now="2026-05-21T09:00:00+08:00",
        timezone="Asia/Shanghai",
    )
    plan = planning_response["plan"]

    result = coordinator.confirm_plan(
        plan_id=plan["id"],
        confirm_token=plan["confirmation"]["confirmToken"],
    )

    assert result["kind"] == "execution_result"
    assert result["plan"]["status"] == "succeeded"
    assert calendar_service.list_events()[0]["title"] == "开会"
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
pytest python/backend/tests/test_orchestrator_planner.py -v
```

Expected: FAIL with `ModuleNotFoundError: No module named 'orchestrator.planner'`.

- [ ] **Step 3: Add orchestrator types**

Create `python/orchestrator/orchestrator/types.py`:

```python
from typing import Literal, TypedDict

AgentTurnKind = Literal[
    "assistant_message",
    "clarification_request",
    "confirmation_required",
    "execution_result",
]


class AgentTurnResponse(TypedDict, total=False):
    kind: AgentTurnKind
    conversationId: str
    message: str
    question: str
    missingFields: list[str]
    plan: dict[str, object]
    structuredElements: list[dict[str, object]]
```

- [ ] **Step 4: Add execution planner**

Create `python/orchestrator/orchestrator/planner.py`:

```python
from uuid import uuid4

from agent_runtime.parsers.rule_parser import RuleParser
from backend.app.services.execution_store import (
    ConfirmationRecord,
    DomainActionRecord,
    ExecutionPlanRecord,
    InMemoryExecutionStore,
)
from orchestrator.types import AgentTurnResponse


class ExecutionPlanner:
    def __init__(
        self,
        store: InMemoryExecutionStore,
        parser: RuleParser | None = None,
    ) -> None:
        self._store = store
        self._parser = parser or RuleParser()

    def submit_turn(
        self,
        conversation_id: str,
        text: str,
        now: str,
        timezone: str,
    ) -> AgentTurnResponse:
        parsed = self._parser.parse(text=text, now=now, timezone=timezone)
        missing_fields = [
            field for action in parsed.actions for field in action["missing_fields"]
        ]
        if missing_fields:
            return {
                "kind": "clarification_request",
                "conversationId": conversation_id,
                "question": "打车票报销需要补充金额。",
                "missingFields": sorted(set(missing_fields)),
            }

        plan_id = f"plan_{uuid4().hex}"
        actions: list[DomainActionRecord] = []
        for parsed_action in parsed.actions:
            action_id = f"action_{uuid4().hex}"
            actions.append(
                {
                    "id": action_id,
                    "planId": plan_id,
                    "domain": parsed_action["domain"],
                    "actionType": parsed_action["action_type"],
                    "status": "awaiting_confirmation",
                    "riskLevel": parsed_action["risk_level"],
                    "summary": parsed_action["summary"],
                    "payload": parsed_action["payload"],
                    "result": None,
                }
            )

        if not actions:
            return {
                "kind": "assistant_message",
                "conversationId": conversation_id,
                "message": "我还没有识别到可执行的日程、费用或提醒动作。",
                "structuredElements": [],
            }

        confirmation: ConfirmationRecord = {
            "id": f"confirmation_{uuid4().hex}",
            "planId": plan_id,
            "status": "pending",
            "requiredActionIds": [action["id"] for action in actions],
            "title": "请确认执行计划",
            "description": "确认后我会执行这些动作。",
            "confirmToken": f"confirm_{uuid4().hex}",
        }
        plan: ExecutionPlanRecord = {
            "id": plan_id,
            "conversationId": conversation_id,
            "status": "awaiting_confirmation",
            "riskLevel": "medium",
            "summary": "确认后执行计划",
            "decisionTraceId": parsed.trace_id,
            "actions": actions,
            "confirmation": confirmation,
        }
        self._store.save_plan(plan)
        self._store.append_ledger(
            plan_id=plan_id,
            event_type="plan_created",
            status="info",
            message="Execution plan created.",
        )
        self._store.append_ledger(
            plan_id=plan_id,
            event_type="confirmation_created",
            status="info",
            message="Confirmation required before execution.",
        )
        return {
            "kind": "confirmation_required",
            "conversationId": conversation_id,
            "plan": plan,
        }
```

- [ ] **Step 5: Add execution coordinator**

Create `python/orchestrator/orchestrator/executor.py`:

```python
from backend.app.domains.calendar.service import CalendarDomainService
from backend.app.services.execution_store import InMemoryExecutionStore
from orchestrator.types import AgentTurnResponse


class ExecutionCoordinator:
    def __init__(
        self,
        store: InMemoryExecutionStore,
        calendar_service: CalendarDomainService,
    ) -> None:
        self._store = store
        self._calendar_service = calendar_service

    def confirm_plan(self, plan_id: str, confirm_token: str) -> AgentTurnResponse:
        plan = self._store.get_plan(plan_id)
        confirmation = plan["confirmation"]
        if confirmation is None or confirmation["confirmToken"] != confirm_token:
            raise ValueError("invalid confirm token")

        plan["status"] = "executing"
        confirmation["status"] = "confirmed"

        for action in plan["actions"]:
            action["status"] = "executing"
            try:
                if action["actionType"] == "calendar.create_event":
                    event = self._calendar_service.create_event(
                        action_id=action["id"],
                        payload=action["payload"],
                    )
                    action["result"] = {"calendarEventId": event["id"]}
                action["status"] = "succeeded"
                self._store.append_ledger(
                    plan_id=plan_id,
                    action_id=action["id"],
                    event_type="action_executed",
                    status="succeeded",
                    message=f'{action["actionType"]} succeeded.',
                )
            except ValueError as error:
                action["status"] = "failed"
                plan["status"] = "failed"
                self._store.append_ledger(
                    plan_id=plan_id,
                    action_id=action["id"],
                    event_type="action_failed",
                    status="failed",
                    message=str(error),
                )
                raise

        plan["status"] = "succeeded"
        self._store.save_plan(plan)
        return {
            "kind": "execution_result",
            "conversationId": plan["conversationId"],
            "plan": plan,
        }

    def reject_plan(self, plan_id: str) -> dict[str, object]:
        plan = self._store.get_plan(plan_id)
        plan["status"] = "rejected"
        if plan["confirmation"] is not None:
            plan["confirmation"]["status"] = "rejected"
        for action in plan["actions"]:
            action["status"] = "rejected"
        self._store.append_ledger(
            plan_id=plan_id,
            event_type="plan_rejected",
            status="info",
            message="Execution plan rejected.",
        )
        return plan
```

- [ ] **Step 6: Run orchestrator tests**

Run:

```bash
pytest python/backend/tests/test_orchestrator_planner.py -v
```

Expected: PASS.

- [ ] **Step 7: Run mypy for Python packages**

Run:

```bash
mypy python
```

Expected: PASS. If it fails because `AgentTurnResponse.plan` is typed as `dict[str, object]`, refine `orchestrator/types.py` to import `ExecutionPlanRecord` and set `plan: ExecutionPlanRecord`.

- [ ] **Step 8: Commit**

```bash
git add python/orchestrator/orchestrator python/backend/tests/test_orchestrator_planner.py
git commit -m "feat(orchestrator): add plan and execution lifecycle"
```

### Task 7: Wire FastAPI Routes

**Files:**

- Create: `python/backend/backend/app/runtime.py`
- Create: `python/backend/backend/app/routes/agent.py`
- Create: `python/backend/backend/app/routes/execution.py`
- Create: `python/backend/backend/app/routes/calendar.py`
- Create: `python/backend/backend/app/routes/expense.py`
- Create: `python/backend/backend/app/routes/reminder.py`
- Modify: `python/backend/backend/app/main.py`
- Create: `python/backend/tests/test_agent_turns.py`

- [ ] **Step 1: Write failing API tests**

Create `python/backend/tests/test_agent_turns.py`:

```python
from backend.app.main import app
from fastapi.testclient import TestClient


def test_agent_turn_returns_confirmation_required() -> None:
    client = TestClient(app)

    response = client.post(
        "/agent/turns",
        json={
            "conversationId": "conversation_001",
            "input": "明天下午三点开会",
            "clientContext": {
                "now": "2026-05-21T09:00:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["kind"] == "confirmation_required"
    assert body["conversationId"] == "conversation_001"
    assert body["plan"]["actions"][0]["actionType"] == "calendar.create_event"


def test_confirmation_executes_calendar_event_and_writes_ledger() -> None:
    client = TestClient(app)

    plan_response = client.post(
        "/agent/turns",
        json={
            "conversationId": "conversation_002",
            "input": "明天下午三点开会",
            "clientContext": {
                "now": "2026-05-21T09:00:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    ).json()
    plan = plan_response["plan"]

    confirm_response = client.post(
        f"/execution-plans/{plan['id']}/confirm",
        json={"confirmToken": plan["confirmation"]["confirmToken"]},
    )

    assert confirm_response.status_code == 200
    assert confirm_response.json()["kind"] == "execution_result"

    events_response = client.get("/calendar/events")
    assert events_response.status_code == 200
    assert events_response.json()[-1]["title"] == "开会"

    ledger_response = client.get("/execution-ledger")
    assert ledger_response.status_code == 200
    assert any(
        item["eventType"] == "action_executed"
        for item in ledger_response.json()
    )


def test_agent_turn_returns_clarification_for_expense_amount() -> None:
    client = TestClient(app)

    response = client.post(
        "/agent/turns",
        json={
            "conversationId": "conversation_003",
            "input": "把昨天打车票报销",
            "clientContext": {
                "now": "2026-05-21T09:00:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    )

    assert response.status_code == 200
    assert response.json() == {
        "kind": "clarification_request",
        "conversationId": "conversation_003",
        "question": "打车票报销需要补充金额。",
        "missingFields": ["amount"],
    }
```

- [ ] **Step 2: Run API tests to verify failure**

Run:

```bash
pytest python/backend/tests/test_agent_turns.py -v
```

Expected: FAIL with 404 for `/agent/turns`.

- [ ] **Step 3: Add runtime assembly**

Create `python/backend/backend/app/runtime.py`:

```python
from backend.app.domains.calendar.repository import InMemoryCalendarEventRepository
from backend.app.domains.calendar.service import CalendarDomainService
from backend.app.services.execution_store import InMemoryExecutionStore
from orchestrator.executor import ExecutionCoordinator
from orchestrator.planner import ExecutionPlanner

execution_store = InMemoryExecutionStore()
calendar_repository = InMemoryCalendarEventRepository()
calendar_service = CalendarDomainService(calendar_repository)
execution_planner = ExecutionPlanner(store=execution_store)
execution_coordinator = ExecutionCoordinator(
    store=execution_store,
    calendar_service=calendar_service,
)
```

- [ ] **Step 4: Add agent route**

Create `python/backend/backend/app/routes/agent.py`:

```python
from typing import Any
from uuid import uuid4

from backend.app.runtime import execution_planner
from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/agent")


class AgentClientContext(BaseModel):
    locale: str = "zh-CN"
    timezone: str = "Asia/Shanghai"
    now: str = "2026-05-21T09:00:00+08:00"


class AgentTurnRequest(BaseModel):
    conversation_id: str | None = Field(default=None, alias="conversationId")
    input: str
    client_context: AgentClientContext = Field(
        default_factory=AgentClientContext,
        alias="clientContext",
    )


@router.post("/turns")
def submit_turn(request: AgentTurnRequest) -> dict[str, Any]:
    return execution_planner.submit_turn(
        conversation_id=request.conversation_id or f"conversation_{uuid4().hex}",
        text=request.input,
        now=request.client_context.now,
        timezone=request.client_context.timezone,
    )
```

- [ ] **Step 5: Add execution routes**

Create `python/backend/backend/app/routes/execution.py`:

```python
from typing import Any

from backend.app.runtime import execution_coordinator, execution_store
from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter()


class ConfirmExecutionPlanRequest(BaseModel):
    confirm_token: str = Field(alias="confirmToken")
    action_ids: list[str] | None = Field(default=None, alias="actionIds")


@router.post("/execution-plans/{plan_id}/confirm")
def confirm_execution_plan(
    plan_id: str,
    request: ConfirmExecutionPlanRequest,
) -> dict[str, Any]:
    return execution_coordinator.confirm_plan(
        plan_id=plan_id,
        confirm_token=request.confirm_token,
    )


@router.post("/execution-plans/{plan_id}/reject")
def reject_execution_plan(plan_id: str) -> dict[str, Any]:
    return execution_coordinator.reject_plan(plan_id)


@router.get("/execution-plans/{plan_id}")
def get_execution_plan(plan_id: str) -> dict[str, Any]:
    return execution_store.get_plan(plan_id)


@router.get("/execution-ledger")
def get_execution_ledger() -> list[dict[str, Any]]:
    return execution_store.list_ledger()
```

- [ ] **Step 6: Add domain read routes**

Create `python/backend/backend/app/routes/calendar.py`:

```python
from backend.app.domains.calendar.models import CalendarEvent
from backend.app.runtime import calendar_service
from fastapi import APIRouter

router = APIRouter(prefix="/calendar")


@router.get("/events")
def get_events() -> list[CalendarEvent]:
    return calendar_service.list_events()
```

Create `python/backend/backend/app/routes/expense.py`:

```python
from fastapi import APIRouter

router = APIRouter(prefix="/expenses")


@router.get("")
def get_expenses() -> list[dict[str, object]]:
    return []
```

Create `python/backend/backend/app/routes/reminder.py`:

```python
from fastapi import APIRouter

router = APIRouter(prefix="/reminders")


@router.get("")
def get_reminders() -> list[dict[str, object]]:
    return []
```

- [ ] **Step 7: Register routers**

Modify `python/backend/backend/app/main.py` to:

```python
from fastapi import FastAPI

from backend.app.routes.agent import router as agent_router
from backend.app.routes.calendar import router as calendar_router
from backend.app.routes.execution import router as execution_router
from backend.app.routes.expense import router as expense_router
from backend.app.routes.factory import router as factory_router
from backend.app.routes.health import router as health_router
from backend.app.routes.reminder import router as reminder_router
from backend.app.routes.version import router as version_router

app = FastAPI(title="AI Code API Gateway", version="0.1.0")
app.include_router(agent_router)
app.include_router(calendar_router)
app.include_router(execution_router)
app.include_router(expense_router)
app.include_router(factory_router)
app.include_router(health_router)
app.include_router(reminder_router)
app.include_router(version_router)
```

- [ ] **Step 8: Run API tests**

Run:

```bash
pytest python/backend/tests/test_agent_turns.py -v
```

Expected: PASS.

- [ ] **Step 9: Run full backend tests**

Run:

```bash
pytest python/backend/tests -v
```

Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add python/backend/backend/app/runtime.py python/backend/backend/app/routes/agent.py python/backend/backend/app/routes/execution.py python/backend/backend/app/routes/calendar.py python/backend/backend/app/routes/expense.py python/backend/backend/app/routes/reminder.py python/backend/backend/app/main.py python/backend/tests/test_agent_turns.py
git commit -m "feat(api): expose agent execution workflow"
```

### Task 8: Final Verification and Documentation Alignment

**Files:**

- Modify: `python/backend/README.md`
- Modify: `packages/sdk/README.md`

- [ ] **Step 1: Update backend README**

Append to `python/backend/README.md`:

```markdown
## Agent execution workflow

The V1 backend keeps FastAPI thin and routes natural-language work through the orchestrator.

Key endpoints:

- `POST /agent/turns` submits a user turn and returns an assistant message, clarification request, confirmation card, or execution result.
- `POST /execution-plans/{id}/confirm` confirms and synchronously executes a pending plan.
- `POST /execution-plans/{id}/reject` rejects a pending plan.
- `GET /execution-plans/{id}` reads a plan.
- `GET /execution-ledger` reads execution audit events.
- `GET /calendar/events` reads calendar facts created by confirmed actions.

V1 uses in-process repositories while the plan/action/ledger shapes remain Postgres-ready. Domain services own business validation and idempotency. Agent runtime output never writes directly to domain facts.
```

- [ ] **Step 2: Update SDK README**

Append to `packages/sdk/README.md`:

```markdown
## Agent workflow methods

The SDK exposes workflow methods so apps do not assemble backend URLs directly:

- `submitAgentTurn(request)`
- `confirmExecutionPlan(planId, request)`
- `rejectExecutionPlan(planId)`
- `getExecutionPlan(planId)`
- `getExecutionLedger()`
- `getCalendarEvents()`
- `getExpenses()`
- `getReminders()`

Apps render the returned union type. They do not parse natural language or infer domain state from chat messages.
```

- [ ] **Step 3: Run complete verification**

Run:

```bash
pnpm validate:contracts
pnpm --filter @ai-code/shared-types typecheck
pnpm --filter @ai-code/sdk typecheck
pytest python/backend/tests -v
mypy python
ruff check python
```

Expected: all commands pass.

- [ ] **Step 4: Commit**

```bash
git add python/backend/README.md packages/sdk/README.md
git commit -m "docs: document agent execution workflow"
```

## Plan Self-Review

Spec coverage:

- Overall architecture is covered by Tasks 4, 6, and 7.
- Multi-intent execution is covered by Task 4 parser tests and Task 6 orchestrator tests.
- Data model shape is covered by Tasks 1, 3, and 5 through typed records and API schemas.
- API flow is covered by Tasks 2, 3, and 7.
- Guarded tools and idempotency are covered by Task 5.
- Trace and ledger are covered by Tasks 5, 6, and 7.
- Test strategy is covered by per-task TDD steps and Task 8 final verification.

Known deferred work:

- Real Postgres tables and migrations are deferred to the next implementation plan after the in-process repository slice proves the API and lifecycle. The types and repository boundaries in this plan keep that migration direct.
- Real LLM calls are deferred until deterministic plan lifecycle tests pass. The `RuleParser` and agent-runtime interfaces keep the adapter boundary explicit.
- Expense and reminder execution are deferred, but their API, type, and route boundaries exist in this slice.

Placeholder scan:

- No placeholder markers or undefined task references should remain.

Type consistency:

- TypeScript uses camelCase API fields.
- Python route request models use Pydantic aliases for camelCase JSON.
- Orchestrator and backend store records use camelCase keys so FastAPI returns contract-shaped JSON without extra mapping code.
