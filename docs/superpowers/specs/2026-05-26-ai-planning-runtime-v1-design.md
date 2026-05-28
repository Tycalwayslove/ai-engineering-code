# AI Planning Runtime v1 后端架构设计

日期：2026-05-26
状态：待用户复审

## 背景

当前 AI 时间管理 Agent 已经打通原生 iOS、H5、FastAPI、Postgres 的初版链路，并支持日程、费用、提醒三个领域的确认执行。但当前后端仍是“能跑通”的薄切片结构：`ExecutionPlanner` 直接调用 `RuleParser`，`ExecutionCoordinator` 用 `if/elif` 分派 action，`runtime.py` 手工装配所有依赖，执行计划、确认、审计和领域事实之间缺少稳定的运行时边界。

下一阶段后端重心调整为 **智能规划大脑优先**。后端不只是 App 的业务 API，而要成为一个可解释、可扩展、可审计的 Agent Planning Runtime：能够理解目标、组装上下文、生成候选计划、选择工具、应用策略、请求确认、执行动作并沉淀记忆。

## 目标

AI Planning Runtime v1 的目标是建立后端规划内核，而不是继续堆业务薄切片。

本阶段要做到：

- 建立 `ContextAssembler`、`PlanningEngine`、`PolicyEngine`、`ToolCatalog`、`PlanCompiler`、`ExecutionRunner`、`DecisionTrace` 等一等架构边界。
- 默认继续使用规则规划，保证现有日程、费用、提醒能力稳定。
- 增加可选 LLM planner：通过环境变量开启，默认关闭。
- 允许 LLM planner 使用完整上下文包，但不允许直接执行工具或写业务事实。
- 建立事件日志和摘要记忆机制，为长期上下文和后续复盘提供基础。
- 为向量检索预留接口，但第一阶段不真实实现 embedding 或 vector store。
- 移除 `ExecutionCoordinator` 中随领域增长而扩散的 `if/elif` action 分派，改为 handler registry。

## 非目标

本阶段不做：

- 不把后端拆成微服务。
- 不默认启用真实 LLM 调用。
- 不让 LLM 直接调用工具、写数据库或绕过确认策略。
- 不实现真实向量检索、embedding 生成或外部记忆库。
- 不引入异步 worker 作为默认执行路径。
- 不重做前端页面或原生壳。
- 不扩大业务领域范围到 Things3、飞书、系统日历或系统通知。

## 总体架构

目标结构：

```text
FastAPI API
  -> Application Use Cases
    -> Agent Runtime
      -> ContextAssembler
      -> PlanningEngine
        -> RuleBasedPlanningEngine
        -> LlmPlanningEngine
      -> PolicyEngine
      -> PlanCompiler
      -> ConfirmationComposer
      -> ExecutionRunner
    -> Infrastructure
      -> UnitOfWork
      -> EventLog
      -> SummaryMemory
      -> Postgres Repositories
```

关键原则：

- API 层只处理 HTTP DTO、认证上下文、错误映射和响应格式。
- Application 层表达用例，例如提交用户输入、确认计划、拒绝计划、读取执行记录。
- Agent Runtime 层负责智能规划、策略判断、工具选择、执行调度和 trace。
- Domain Tool 层负责具体业务动作，例如创建日程、创建费用草稿、创建提醒。
- Infrastructure 层负责 Postgres、事务、时钟、ID、事件日志、摘要记忆和外部 LLM provider。

## 目录建议

```text
python/agent-runtime/agent_runtime/
  context/
    assembler.py
    providers.py
    redactor.py
    types.py
  planning/
    engine.py
    rule_based.py
    llm.py
    compiler.py
    types.py
  policy/
    engine.py
    types.py
  tools/
    catalog.py
    schemas.py
    selector.py
  tracing/
    decision_trace.py
  memory/
    event_log.py
    summary_memory.py
    ports.py

python/orchestrator/orchestrator/
  use_cases/
    submit_turn.py
    confirm_plan.py
    reject_plan.py
  execution/
    runner.py
    handlers.py
    registry.py
  ports.py

python/backend/backend/app/
  api/
  bootstrap.py
  infrastructure/
    postgres/
    unit_of_work.py
  domains/
    calendar/
    expense/
    reminder/
```

目录所有权：

- `agent-runtime` 拥有规划大脑的核心抽象和纯运行时模型。
- `orchestrator` 拥有应用用例、执行 runner、handler registry，以及 runtime 和 backend 之间的协调。
- `backend` 拥有 FastAPI、Postgres adapter、事务装配和领域事实 repository。

## 运行模式

规划模式由环境变量控制：

```text
AI_PLANNER_MODE=llm_first  # 默认，优先真实 LLM provider，失败时回落规则规划
AI_PLANNER_MODE=rule       # 只使用规则规划
AI_PLANNER_MODE=llm_mock   # 使用 mock LLM provider，验证 prompt/schema/trace
AI_PLANNER_MODE=llm        # 使用真实 LLM provider

AI_PLANNER_PROVIDER=openai    # 默认，使用 OpenAI Responses API
AI_PLANNER_PROVIDER=deepseek  # 使用 DeepSeek OpenAI-compatible Chat Completions API
AI_PLANNER_MODEL=...          # 模型名字符串透传给 provider
```

默认必须是 `llm_first`，保证产品体验优先使用真实模型；无 API key、SDK 不可用、请求失败或返回无效时自动回落到 rule planner，保证本地测试、CI 和无外部模型环境稳定。

真实 LLM provider 开启后，执行边界仍然不变：

- LLM 只产出 `PlanCandidate`。
- `PolicyEngine` 判断风险、缺字段、确认策略。
- `PlanCompiler` 把候选计划编译成内部 `ExecutionPlan`。
- `ExecutionRunner` 只执行已经确认的 action。
- 领域事实只能通过具名 handler 和 repository 写入。

## ContextPack

完整上下文模式通过 `ContextPack` 实现，而不是把数据库原始数据直接发送给模型。

`ContextPack` 包含：

```text
current_input
current_time
timezone
recent_conversation
pending_plans
calendar_summary
reminder_summary
expense_summary
user_preferences
relevant_history
tool_catalog
```

`ContextAssembler` 负责从各 provider 收集上下文：

- `ConversationContextProvider`
- `PendingPlanContextProvider`
- `CalendarContextProvider`
- `ReminderContextProvider`
- `ExpenseContextProvider`
- `UserPreferenceContextProvider`
- `SummaryMemoryProvider`
- `ToolCatalogProvider`

`ContextRedactor` 负责最小化敏感数据暴露。第一阶段可先做规则化 redaction，例如限制条数、去除长备注、裁剪明细字段、保留摘要。

## PlanningEngine

统一接口：

```text
PlanningEngine.plan(input, context_pack) -> PlanningResult
```

核心类型：

```text
PlanningResult
  kind: plan_candidate | clarification | assistant_message
  candidate?: PlanCandidate
  clarification?: ClarificationRequest
  trace: DecisionTrace

PlanCandidate
  goal
  steps
  proposed_actions
  missing_information
  assumptions
  risk_notes
```

`RuleBasedPlanningEngine`：

- 第一阶段继承当前 `RuleParser` 的能力。
- 支持单 action：日程、费用、提醒。
- 支持多 action：一句话中同时创建日程、费用草稿和提醒。
- 对“帮我安排明天上午的工作”这类规划型请求返回 clarification 或 plan candidate，而不是硬执行。

`LlmPlanningEngine`：

- 使用 `ContextPack`、工具 schema 和 prompt 生成 `PlanCandidate`。
- 输出必须通过 schema 校验。
- 校验失败时 fallback 到 rule planner 或 assistant message。
- 真实 provider 通过 `AI_PLANNER_MODE=llm_first` 或 `AI_PLANNER_MODE=llm` 开启。
- Provider 由 `AI_PLANNER_PROVIDER` 选择；当前支持 `openai` 和 `deepseek`，后续 Claude、OpenRouter 或其他模型只新增 adapter，不改变业务执行链路。

## ToolCatalog 和 ActionRegistry

`ToolCatalog` 描述可规划工具：

```text
tool_name
action_type
domain
description
input_schema
output_schema
risk_level
confirmation_required
handler_key
```

第一阶段工具：

- `calendar.create_event`
- `expense.create_reimbursement_draft`
- `reminder.create_reminder`

`ActionRegistry` 描述可执行 handler：

```text
calendar.create_event -> CalendarCreateEventHandler
expense.create_reimbursement_draft -> ExpenseDraftHandler
reminder.create_reminder -> ReminderCreateHandler
```

`ExecutionRunner` 不再知道具体领域 service，只依赖 registry：

```text
handler = registry.resolve(action.action_type)
result = handler.execute(action, execution_context)
```

## PolicyEngine

`PolicyEngine` 在规划结果和执行计划之间运行。

职责：

- 判断每个 action 的风险等级。
- 判断是否需要确认。
- 判断是否缺字段。
- 判断是否允许合并到一张确认卡。
- 判断是否应该返回 clarification。
- 生成可展示给用户的确认说明。

第一阶段规则：

- 所有写入动作都需要确认。
- 查询动作后续可设置为低风险、免确认。
- 缺少必要字段时返回 clarification，不生成待确认写入计划。
- 多个写入 action 可以合并到一张确认卡，但仍保留 action 级别审计。

## ExecutionRunner

`ExecutionRunner` 负责确认后的执行，不负责规划。

同步执行仍是第一阶段默认行为：

```text
confirm plan
  -> mark plan executing
  -> execute selected required actions
  -> write action result
  -> append ledger
  -> mark plan succeeded or failed
```

但接口设计预留异步执行：

```text
execute_now(plan)
enqueue_later(plan)  # 第一阶段不启用
```

失败策略：

- 单 action 失败时记录 `action_failed`。
- plan 状态根据 action 结果汇总。
- 重复确认已成功 plan 时保持幂等返回。
- handler 必须通过 `sourceActionId` 保持领域事实写入幂等。

## EventLog 和 SummaryMemory

本阶段采用 **事件日志 + 摘要记忆**，向量检索预留接口。

事件日志记录：

```text
user_input_received
context_pack_created
intent_interpreted
plan_candidate_created
policy_evaluated
confirmation_created
plan_confirmed
plan_rejected
action_executed
action_failed
summary_memory_created
```

摘要记忆类型：

```text
conversation_summary
user_preference_summary
recent_execution_summary
planning_pattern_summary
```

第一阶段摘要记忆可以按需生成，不必引入后台任务。后续如果出现长会话、跨天偏好、相似历史检索需求，再接 `MemorySearchPort` 的向量实现。

预留接口：

```text
MemorySearchPort.search(query, filters) -> RelevantMemory[]
```

第一阶段实现可以是空实现或 SQL summary search。

## DecisionTrace

每次规划都必须生成 trace。trace 不是完整 chain-of-thought，而是面向产品和调试的决策摘要。

字段建议：

```text
trace_id
planner_mode
context_sections_used
tools_considered
tools_selected
missing_information
policy_decisions
confirmation_reason
fallback_reason
reasoning_summary
created_at
```

原则：

- 记录可审计摘要，不记录模型隐藏推理。
- 记录 LLM provider、schema 校验结果和 fallback 原因。
- trace 可以被 ledger 或专门 trace 表引用。

## 数据库演进

当前已有：

- `conversation_turns`
- `execution_plans`
- `domain_actions`
- `confirmations`
- `execution_ledger`
- `calendar_events`
- `expense_records`
- `reminders`

建议新增：

```text
agent_events
  id
  conversation_id
  plan_id nullable
  action_id nullable
  event_type
  payload jsonb
  created_at

decision_traces
  id
  conversation_id
  plan_id nullable
  planner_mode
  payload jsonb
  created_at

summary_memories
  id
  conversation_id nullable
  memory_type
  summary
  payload jsonb
  valid_from nullable
  valid_until nullable
  created_at
```

向量字段不在第一阶段加入。需要时通过新 migration 增加 embedding 或外部 vector store adapter。

## API 行为兼容

现有 API 行为必须保持：

- `POST /agent/turns`
- `POST /execution-plans/{id}/confirm`
- `POST /execution-plans/{id}/reject`
- `GET /execution-plans/{id}`
- `GET /execution-ledger`
- `GET /calendar/events`
- `GET /expenses`
- `GET /reminders`

H5 和 iOS 不应感知本次后端架构重构。第一阶段重构完成后，相同输入仍返回相同类型响应。

## 测试策略

测试分层：

- `agent-runtime` 单元测试：context pack、planner、policy、tool catalog、schema validation。
- `orchestrator` 单元测试：plan compile、confirmation compose、execution runner、handler registry。
- `backend` API 测试：现有端点行为不变。
- Postgres 集成测试：event log、trace、summary memory、领域事实幂等。
- LLM mock 测试：`AI_PLANNER_MODE=llm_mock` 输出固定 plan candidate。

必须保留现有三领域回归：

- 日程创建。
- 费用草稿。
- 提醒创建。
- 多 action 合并确认。
- 缺字段 clarification。
- 重复确认幂等。

## 分阶段实施

### Phase 1：结构落位，行为不变

- 新增 planning、policy、tools、tracing、memory 的类型和接口。
- 将当前 `RuleParser -> ExecutionPlan` 包装进 `RuleBasedPlanningEngine` 和 `PlanCompiler`。
- API 响应保持不变。

### Phase 2：ActionRegistry 和 ExecutionRunner

- 新增 action handler registry。
- 将 calendar、expense、reminder 执行移入 handler。
- 移除 `ExecutionCoordinator` 中的领域 `if/elif` 分派。

### Phase 3：ContextPack、EventLog、DecisionTrace

- 新增 `ContextAssembler`。
- 新增 `agent_events` 和 `decision_traces`。
- 每次 submit turn 写入上下文、候选计划和策略 trace。

### Phase 4：SummaryMemory

- 新增 `summary_memories`。
- 先实现最近会话和最近执行摘要。
- `ContextAssembler` 可以读取摘要记忆。

### Phase 5：LLM mock planner

- 新增 prompt、schema、`MockLlmProvider`。
- `AI_PLANNER_MODE=llm_mock` 可走 LLM planner 结构，但不调用外部 API。

### Phase 6：可选真实 LLM provider

- 新增真实 provider adapter。
- 通过 `AI_PLANNER_MODE=llm` 和 API key 环境变量启用。
- 默认继续关闭。

## 验收标准

架构验收：

- `ExecutionRunner` 不依赖具体 calendar、expense、reminder service。
- 新增 action 只需要注册 tool schema 和 handler，不需要修改 runner 主流程。
- `SubmitTurnUseCase` 能在 rule、llm_mock、llm 三种模式下复用同一 application flow。
- LLM 输出无法绕过 policy、confirmation 和 handler registry。
- `DecisionTrace` 能说明使用了哪些上下文、选择了哪些工具、是否 fallback。
- `EventLog` 能串起用户输入、计划、确认、执行和失败。

行为验收：

- 现有日程、费用、提醒 API 行为保持兼容。
- 多 action 请求可以生成一张确认卡。
- 信息不足时返回 clarification。
- 重复确认仍幂等。
- 默认无 LLM API key 环境下测试仍通过。

## 风险和缓解

风险：一次性重构过大，破坏已跑通 App。

缓解：按阶段推进，每阶段保持 API 行为兼容，先移动边界，再升级能力。

风险：LLM 接入后输出不稳定。

缓解：默认关闭真实 LLM；LLM 输出必须 schema 校验；失败 fallback；trace 记录原因。

风险：完整上下文泄漏过多个人数据。

缓解：通过 `ContextPack` 和 `ContextRedactor` 控制，不直接暴露原始数据库全集。

风险：事件日志和摘要记忆过早复杂化。

缓解：第一阶段只做 Postgres 事件日志和按需摘要，不做后台任务和向量检索。

## 设计结论

AI Planning Runtime v1 采用 **智能规划大脑优先** 的模块化单体架构。它同时完成三件事：建立规划内核结构、支持更强的多步骤计划能力、为真实 LLM planner 做可选接入准备。

本设计不追求马上变成全自动 Agent 平台，而是先建立可靠的运行时骨架：LLM 可以读完整上下文并生成候选计划，但所有业务写入必须经过 policy、confirmation、execution runner 和 domain handler。这样既能支持智能规划演进，也能保留当前产品链路的可控性和可审计性。
