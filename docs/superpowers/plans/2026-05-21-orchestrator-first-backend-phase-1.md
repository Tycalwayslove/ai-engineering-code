# Orchestrator-First 后端 Phase 1 实施计划

> **给 agentic workers：** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development`（推荐）或 `superpowers:executing-plans` 按任务逐步执行本计划。步骤使用 checkbox（`- [ ]`）追踪。

**目标：** 构建 AI 日程执行 Agent 的第一条可运行后端薄切片，覆盖类型契约、SDK 方法、FastAPI 路由、Orchestrator 计划生成、受保护的领域执行和 execution ledger。

**架构：** FastAPI 保持薄网关，业务请求进入 `python/orchestrator`。`python/agent-runtime` 提供框架无关的解析与结构化计划原语。Phase 1 先把 calendar 做成可执行领域，同时让 expense 和 reminder 在契约、类型和计划载荷中成为一等边界。

**技术栈：** FastAPI、Pydantic v2、Python 3.12、pytest、TypeScript、pnpm、OpenAPI 3.1、轻量 repository interface、Postgres-ready 数据形态。

---

## 范围

本计划实现已批准设计文档中的 Phase 1：[AI 日程执行 Agent 后端架构设计](../specs/2026-05-21-backend-architecture-design.md)。

本计划包含：

- 同步 Orchestrator。
- Agent runtime 接口。
- typed API contract。
- SDK 工作流方法。
- calendar 领域执行。
- expense 和 reminder 的计划边界。
- execution ledger 查询。

本计划不包含：

- 生产级账号体系。
- async worker 或 Redis queue。
- 外部报销系统。
- 外部日历系统。
- 真实 LLM API 调用。

这些能力后续通过 adapter、repository 和 worker 边界接入，不能反向污染当前的计划生命周期。

## 文件结构

### 契约与 TypeScript

- 修改 `contracts/openapi/api-gateway.yaml`：新增 Agent turn、execution plan、confirmation、ledger、calendar、expense 和 reminder schema/path。
- 修改 `packages/shared-types/src/index.ts`：新增 workflow、plan、action、confirmation、ledger 和领域对象类型。
- 修改 `packages/sdk/src/index.ts`：新增提交 turn、确认 plan、拒绝 plan、读取 plan、读取 ledger 和读取领域数据的方法。
- 修改 `scripts/validate-contracts.mjs`：把新 workflow slice 纳入轻量契约校验。

### Python 运行时

- 新建 `python/agent-runtime/agent_runtime/types.py`：解析与计划类型。
- 新建 `python/agent-runtime/agent_runtime/parsers/rule_parser.py`：第一批中文日程表达的确定性解析器。
- 新建 `python/orchestrator/orchestrator/types.py`：Orchestrator 请求和响应类型。
- 新建 `python/orchestrator/orchestrator/planner.py`：创建 plan 并决定响应类型。
- 新建 `python/orchestrator/orchestrator/executor.py`：确认 plan 后同步执行 action。
- 新建 `python/backend/backend/app/domains/calendar/models.py`：calendar 领域模型。
- 新建 `python/backend/backend/app/domains/calendar/repository.py`：测试用 in-process repository。
- 新建 `python/backend/backend/app/domains/calendar/service.py`：受保护的 calendar domain service。
- 新建 `python/backend/backend/app/services/execution_store.py`：plan、action、confirmation 和 ledger store。
- 新建 `python/backend/backend/app/routes/agent.py`：`/agent/turns`。
- 新建 `python/backend/backend/app/routes/execution.py`：execution plan 与 ledger 路由。
- 新建 `python/backend/backend/app/routes/calendar.py`：calendar 读取路由。
- 新建 `python/backend/backend/app/routes/expense.py`：expense 读取边界路由。
- 新建 `python/backend/backend/app/routes/reminder.py`：reminder 读取边界路由。
- 修改 `python/backend/backend/app/main.py`：注册新路由。

### 测试

- 新建 `python/backend/tests/test_agent_turns.py`：端到端验证 turn、追问、确认、执行和 ledger。
- 新建 `python/backend/tests/test_orchestrator_planner.py`：验证多意图解析和计划生成。
- 新建 `python/backend/tests/test_calendar_domain.py`：验证 calendar 领域校验和幂等执行。

## 执行任务

### 任务 1：新增 TypeScript 工作流类型

**文件：**

- 修改 `packages/shared-types/src/index.ts`

- [ ] **步骤 1：追加 workflow 类型**

在 `packages/shared-types/src/index.ts` 的 `FactoryStatus` 类型之后追加：

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

- [ ] **步骤 2：运行 shared-types 类型检查**

运行：

```bash
pnpm --filter @ai-code/shared-types typecheck
```

预期：命令通过。

- [ ] **步骤 3：提交**

```bash
git add packages/shared-types/src/index.ts
git commit -m "feat(types): add execution workflow types"
```

### 任务 2：新增 SDK 工作流方法

**文件：**

- 修改 `packages/sdk/src/index.ts`

- [ ] **步骤 1：替换 import/export 区块**

把 `packages/sdk/src/index.ts` 顶部 import/export 区块替换为：

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

- [ ] **步骤 2：新增 SDK 方法**

在 `ApiClient` 的 `getFactoryStatus()` 后加入：

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

- [ ] **步骤 3：让 request 支持 POST**

把：

```ts
  private async request<T>(path: string): Promise<T> {
```

改为：

```ts
  private async request<T>(
    path: string,
    init: RequestInit = {},
  ): Promise<T> {
```

把 `headers` 对象改为：

```ts
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    };
```

把 fetch 调用改为：

```ts
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        ...headers,
        ...init.headers,
      },
    });
```

- [ ] **步骤 4：运行 SDK 类型检查**

```bash
pnpm --filter @ai-code/sdk typecheck
```

预期：命令通过。

- [ ] **步骤 5：提交**

```bash
git add packages/sdk/src/index.ts
git commit -m "feat(sdk): add execution workflow methods"
```

### 任务 3：扩展 OpenAPI 和契约校验

**文件：**

- 修改 `contracts/openapi/api-gateway.yaml`
- 修改 `scripts/validate-contracts.mjs`

- [ ] **步骤 1：新增 OpenAPI paths**

在 `contracts/openapi/api-gateway.yaml` 的 `paths:` 下、`/factory/status` 后新增以下 path。下面代码块从 path key 开始，插入到 `paths:` 下时整体缩进两个空格。

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

- [ ] **步骤 2：新增 OpenAPI schemas**

在 `components.schemas` 下、`FactoryStatus` 后新增以下 schema。下面代码块从 schema key 开始，插入到 `components.schemas` 下时整体缩进四个空格。

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
  required: [id, planId, domain, actionType, status, riskLevel, summary, payload]
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
  required: [id, planId, status, requiredActionIds, title, description, confirmToken]
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
  required: [id, conversationId, status, riskLevel, summary, decisionTraceId, actions]
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
      enum: [assistant_message, clarification_request, confirmation_required, execution_result]
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

- [ ] **步骤 3：扩展契约校验脚本**

在 `scripts/validate-contracts.mjs` 中，把 `expectedOperations` 改为：

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

在 `expectedFactoryStatusFields` 附近增加：

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

在 `validateFactoryStatusSlice` 的 `FactoryStatus.required` 校验之后增加：

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

- [ ] **步骤 4：运行契约校验**

```bash
pnpm validate:contracts
```

预期：命令通过，并输出 `Contract validation passed.`。

- [ ] **步骤 5：提交**

```bash
git add contracts/openapi/api-gateway.yaml scripts/validate-contracts.mjs
git commit -m "feat(contracts): add execution workflow api"
```

### 任务 4：新增 Agent Runtime 规则解析器

**文件：**

- 新建 `python/agent-runtime/agent_runtime/types.py`
- 新建 `python/agent-runtime/agent_runtime/parsers/__init__.py`
- 新建 `python/agent-runtime/agent_runtime/parsers/rule_parser.py`
- 新建 `python/backend/tests/test_orchestrator_planner.py`

- [ ] **步骤 1：先写失败测试**

新建 `python/backend/tests/test_orchestrator_planner.py`：

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

- [ ] **步骤 2：确认测试失败**

```bash
pytest python/backend/tests/test_orchestrator_planner.py -v
```

预期：失败，报错包含 `ModuleNotFoundError: No module named 'agent_runtime.parsers'`。

- [ ] **步骤 3：新增 agent runtime 类型**

新建 `python/agent-runtime/agent_runtime/types.py`：

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

- [ ] **步骤 4：新增 parser package**

新建 `python/agent-runtime/agent_runtime/parsers/__init__.py`：

```python
from agent_runtime.parsers.rule_parser import RuleParser

__all__ = ["RuleParser"]
```

- [ ] **步骤 5：新增确定性规则解析器**

新建 `python/agent-runtime/agent_runtime/parsers/rule_parser.py`：

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

- [ ] **步骤 6：运行 parser 测试**

```bash
pytest python/backend/tests/test_orchestrator_planner.py -v
```

预期：命令通过。

- [ ] **步骤 7：提交**

```bash
git add python/agent-runtime/agent_runtime/types.py python/agent-runtime/agent_runtime/parsers python/backend/tests/test_orchestrator_planner.py
git commit -m "feat(agent-runtime): add deterministic rule parser"
```

### 任务 5：新增 Calendar 领域和 Execution Store

**文件：**

- 新建 `python/backend/backend/app/domains/__init__.py`
- 新建 `python/backend/backend/app/domains/calendar/__init__.py`
- 新建 `python/backend/backend/app/domains/calendar/models.py`
- 新建 `python/backend/backend/app/domains/calendar/repository.py`
- 新建 `python/backend/backend/app/domains/calendar/service.py`
- 新建 `python/backend/backend/app/services/execution_store.py`
- 新建 `python/backend/tests/test_calendar_domain.py`

- [ ] **步骤 1：先写 calendar 领域失败测试**

新建 `python/backend/tests/test_calendar_domain.py`：

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

- [ ] **步骤 2：确认测试失败**

```bash
pytest python/backend/tests/test_calendar_domain.py -v
```

预期：失败，报错包含 `ModuleNotFoundError: No module named 'backend.app.domains'`。

- [ ] **步骤 3：新增 calendar model**

新建 `python/backend/backend/app/domains/__init__.py` 和 `python/backend/backend/app/domains/calendar/__init__.py`，内容为空文件。

新建 `python/backend/backend/app/domains/calendar/models.py`：

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

- [ ] **步骤 4：新增 repository**

新建 `python/backend/backend/app/domains/calendar/repository.py`：

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

- [ ] **步骤 5：新增受保护的领域 service**

新建 `python/backend/backend/app/domains/calendar/service.py`：

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

- [ ] **步骤 6：新增 execution store**

新建 `python/backend/backend/app/services/execution_store.py`：

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

- [ ] **步骤 7：运行 calendar 领域测试**

```bash
pytest python/backend/tests/test_calendar_domain.py -v
```

预期：命令通过。

- [ ] **步骤 8：提交**

```bash
git add python/backend/backend/app/domains python/backend/backend/app/services/execution_store.py python/backend/tests/test_calendar_domain.py
git commit -m "feat(backend): add guarded calendar domain"
```

### 任务 6：新增 Orchestrator Planner 和 Executor

**文件：**

- 新建 `python/orchestrator/orchestrator/types.py`
- 新建 `python/orchestrator/orchestrator/planner.py`
- 新建 `python/orchestrator/orchestrator/executor.py`
- 修改 `python/backend/tests/test_orchestrator_planner.py`

- [ ] **步骤 1：扩展 Orchestrator 测试**

在 `python/backend/tests/test_orchestrator_planner.py` 追加：

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

- [ ] **步骤 2：确认测试失败**

```bash
pytest python/backend/tests/test_orchestrator_planner.py -v
```

预期：失败，报错包含 `ModuleNotFoundError: No module named 'orchestrator.planner'`。

- [ ] **步骤 3：新增 Orchestrator 类型**

新建 `python/orchestrator/orchestrator/types.py`：

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

- [ ] **步骤 4：新增 planner**

新建 `python/orchestrator/orchestrator/planner.py`。实现要求：

- 调用 `RuleParser.parse()`。
- 如果任一 action 有 `missing_fields`，返回 `clarification_request`。
- 如果没有 action，返回 `assistant_message`。
- 如果有可执行 action，创建 `ExecutionPlanRecord`、`DomainActionRecord`、`ConfirmationRecord`，保存到 store，并写入 `plan_created` 与 `confirmation_created` ledger。
- 返回 `confirmation_required`。

关键实现代码：

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

- [ ] **步骤 5：新增 executor**

新建 `python/orchestrator/orchestrator/executor.py`。实现要求：

- 校验 confirm token。
- 将 plan 和 action 推进到 executing。
- 对 `calendar.create_event` 调用 `CalendarDomainService.create_event()`。
- 成功后写入 `action_executed` ledger。
- 失败后写入 `action_failed` ledger。
- 支持 reject plan。

- [ ] **步骤 6：运行 Orchestrator 测试**

```bash
pytest python/backend/tests/test_orchestrator_planner.py -v
```

预期：命令通过。

- [ ] **步骤 7：运行 Python 类型检查**

```bash
mypy python
```

预期：命令通过。如果 `AgentTurnResponse.plan` 的类型过宽，改为从 `backend.app.services.execution_store` 导入 `ExecutionPlanRecord` 并使用该类型。

- [ ] **步骤 8：提交**

```bash
git add python/orchestrator/orchestrator python/backend/tests/test_orchestrator_planner.py
git commit -m "feat(orchestrator): add plan and execution lifecycle"
```

### 任务 7：接入 FastAPI 路由

**文件：**

- 新建 `python/backend/backend/app/runtime.py`
- 新建 `python/backend/backend/app/routes/agent.py`
- 新建 `python/backend/backend/app/routes/execution.py`
- 新建 `python/backend/backend/app/routes/calendar.py`
- 新建 `python/backend/backend/app/routes/expense.py`
- 新建 `python/backend/backend/app/routes/reminder.py`
- 修改 `python/backend/backend/app/main.py`
- 新建 `python/backend/tests/test_agent_turns.py`

- [ ] **步骤 1：先写 API 失败测试**

新建 `python/backend/tests/test_agent_turns.py`：

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

- [ ] **步骤 2：确认 API 测试失败**

```bash
pytest python/backend/tests/test_agent_turns.py -v
```

预期：失败，`/agent/turns` 返回 404。

- [ ] **步骤 3：新增 runtime 组装**

新建 `python/backend/backend/app/runtime.py`：

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

- [ ] **步骤 4：新增 agent route**

新建 `python/backend/backend/app/routes/agent.py`：

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

- [ ] **步骤 5：新增 execution routes**

新建 `python/backend/backend/app/routes/execution.py`：

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

- [ ] **步骤 6：新增领域读取 routes**

新建 `python/backend/backend/app/routes/calendar.py`：

```python
from backend.app.domains.calendar.models import CalendarEvent
from backend.app.runtime import calendar_service
from fastapi import APIRouter

router = APIRouter(prefix="/calendar")


@router.get("/events")
def get_events() -> list[CalendarEvent]:
    return calendar_service.list_events()
```

新建 `python/backend/backend/app/routes/expense.py`：

```python
from fastapi import APIRouter

router = APIRouter(prefix="/expenses")


@router.get("")
def get_expenses() -> list[dict[str, object]]:
    return []
```

新建 `python/backend/backend/app/routes/reminder.py`：

```python
from fastapi import APIRouter

router = APIRouter(prefix="/reminders")


@router.get("")
def get_reminders() -> list[dict[str, object]]:
    return []
```

- [ ] **步骤 7：注册路由**

把 `python/backend/backend/app/main.py` 改为：

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

- [ ] **步骤 8：运行 API 测试**

```bash
pytest python/backend/tests/test_agent_turns.py -v
```

预期：命令通过。

- [ ] **步骤 9：运行完整后端测试**

```bash
pytest python/backend/tests -v
```

预期：命令通过。

- [ ] **步骤 10：提交**

```bash
git add python/backend/backend/app/runtime.py python/backend/backend/app/routes/agent.py python/backend/backend/app/routes/execution.py python/backend/backend/app/routes/calendar.py python/backend/backend/app/routes/expense.py python/backend/backend/app/routes/reminder.py python/backend/backend/app/main.py python/backend/tests/test_agent_turns.py
git commit -m "feat(api): expose agent execution workflow"
```

### 任务 8：最终验证和文档对齐

**文件：**

- 修改 `python/backend/README.md`
- 修改 `packages/sdk/README.md`

- [ ] **步骤 1：更新后端 README**

在 `python/backend/README.md` 末尾追加：

```markdown

## Agent 执行工作流

V1 后端保持 FastAPI 薄网关定位，自然语言工作流通过 Orchestrator 处理。

关键端点：

- `POST /agent/turns` 提交用户输入，返回 assistant message、clarification request、confirmation card 或 execution result。
- `POST /execution-plans/{id}/confirm` 确认并同步执行待确认计划。
- `POST /execution-plans/{id}/reject` 拒绝待确认计划。
- `GET /execution-plans/{id}` 读取执行计划。
- `GET /execution-ledger` 读取执行审计事件。
- `GET /calendar/events` 读取已确认 action 创建的日程事实。

V1 使用 in-process repository，但 plan、action 和 ledger 的数据形态保持 Postgres-ready。领域 service 拥有业务校验和幂等控制。Agent runtime 的输出不能直接写入领域事实表。
```

- [ ] **步骤 2：更新 SDK README**

在 `packages/sdk/README.md` 末尾追加：

```markdown

## Agent 工作流方法

SDK 暴露工作流方法，应用不直接拼装后端 URL：

- `submitAgentTurn(request)`
- `confirmExecutionPlan(planId, request)`
- `rejectExecutionPlan(planId)`
- `getExecutionPlan(planId)`
- `getExecutionLedger()`
- `getCalendarEvents()`
- `getExpenses()`
- `getReminders()`

应用只渲染返回的 union type，不解析自然语言，也不从聊天消息反推领域状态。
```

- [ ] **步骤 3：运行完整验证**

```bash
pnpm validate:contracts
pnpm --filter @ai-code/shared-types typecheck
pnpm --filter @ai-code/sdk typecheck
pytest python/backend/tests -v
mypy python
ruff check python
```

预期：全部命令通过。

- [ ] **步骤 4：提交**

```bash
git add python/backend/README.md packages/sdk/README.md
git commit -m "docs: document agent execution workflow"
```

## 计划自检

规格覆盖：

- 总体架构由任务 4、任务 6 和任务 7 覆盖。
- 多意图执行由任务 4 的 parser 测试和任务 6 的 Orchestrator 测试覆盖。
- 数据模型形态由任务 1、任务 3 和任务 5 的类型、schema 与 record 覆盖。
- API 流程由任务 2、任务 3 和任务 7 覆盖。
- guarded tools 和幂等由任务 5 覆盖。
- trace 与 ledger 由任务 5、任务 6 和任务 7 覆盖。
- 测试策略由每个任务的 TDD 步骤和任务 8 的最终验证覆盖。

已推迟的工作：

- 真实 Postgres 表和 migration 留到下一份实施计划。当前计划先用 in-process repository 验证 API 与生命周期，且保留可迁移的数据边界。
- 真实 LLM 调用留到确定性计划生命周期测试稳定后接入。`RuleParser` 和 agent-runtime 接口保留 adapter 边界。
- expense 和 reminder 的执行留到后续任务；本计划先建立 API、类型和路由边界。

类型一致性：

- TypeScript API 字段使用 camelCase。
- Python route request model 使用 Pydantic alias 兼容 camelCase JSON。
- Orchestrator 和 backend store record 使用 camelCase key，让 FastAPI 能直接返回契约形态的 JSON。
