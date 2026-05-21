# AI 日程执行 Agent 后端架构设计

日期：2026-05-21
状态：已批准进入实施计划

## 目的

本设计定义 AI 日程执行 Agent 的 V1 后端架构。后端必须支持自然语言输入、多意图拆解、多领域计划、用户确认、真实持久化、领域执行和执行审计。

V1 不是普通日程 CRUD 后端，也不是只返回 demo 数据的接口样板。它要让一句用户输入经过后端理解、计划、确认和执行，最后落到可追踪的业务事实与执行记录中。

## 已确认决策

- 后端范围选择 V1 产品闭环优先。
- 数据策略选择真实 Postgres 持久化闭环。
- AI 执行链路选择规则与 LLM 混合模式。
- 架构方向选择 `Orchestrator-first Modular Backend`。
- `python/backend`、`python/orchestrator` 和 `python/agent-runtime` 从第一天保持清晰包边界。
- 领域层包含日程、费用和提醒/任务边界。费用领域在 V1 可以先做轻实现，但架构中必须是一等边界。
- FastAPI 保持 HTTP 网关角色，不承载 Agent 编排细节。
- Orchestrator 拥有多意图拆解、领域路由、计划生命周期、风险分级、确认策略和执行协调。
- Agent runtime 先定义框架无关接口，不在设计阶段绑定具体 LLM SDK 或 Agent SDK。

## 被拒绝的方向

### 模块化单体优先

纯模块化单体能最快跑通一条日程闭环，但容易把编排、Agent runtime、领域工具和 HTTP service 混在 `python/backend` 内。后续支持多意图、多领域和长期 Agent 平台能力时，边界迁移成本过高。

### 准微服务化优先

直接拆成多个运行时服务会过早引入部署、队列、服务发现和独立数据所有权复杂度。当前仓库规则仍要求 `services/*` 先作为边界定义，只有出现运营压力后才拆分运行时服务。

## 总体架构

```text
Client / SDK
  -> FastAPI Gateway
    -> Orchestrator
      -> Agent Runtime
      -> Domain Services / Tools
        -> Postgres
```

`packages/sdk` 是前端访问后端的唯一路径。H5、Admin 和 Native Shell 不直接拼接后端 URL，也不在前端解析业务语义。

`python/backend` 拥有 FastAPI 应用、HTTP 路由、认证上下文、请求 ID、响应结构和 API 错误格式。

`python/orchestrator` 拥有执行计划生命周期。它把用户输入拆成一个或多个领域动作，计算风险，决定是否追问或要求确认，并在确认后协调执行。

`python/agent-runtime` 拥有规则解析接口、LLM adapter 接口、结构化输出校验、tool loop contract 和 decision trace。它不直接拥有业务表，也不绕过领域层执行写入。

领域层拥有业务事实和业务不变量。日程、费用、提醒/任务分别拥有 service、repository 和 tool adapter。Agent 负责理解和规划；领域层负责合法性、一致性和最终写入。

## 包边界

```text
python/backend/
  backend/app/main.py
  backend/app/routes/
  backend/app/schemas/
  backend/app/errors/

python/orchestrator/
  orchestrator/planning/
  orchestrator/risk/
  orchestrator/confirmation/
  orchestrator/execution/

python/agent-runtime/
  agent_runtime/adapters/
  agent_runtime/parsers/
  agent_runtime/schemas/
  agent_runtime/tracing/

python/backend/backend/app/domains/
  calendar/
  expense/
  reminder/
```

V1 可以让领域模块先落在 `python/backend` 的应用包内，以便共享数据库会话和 FastAPI 测试环境。但领域接口必须独立于 HTTP 路由，后续可迁移到独立包或服务。

依赖方向：

```text
backend routes
  -> orchestrator
    -> agent_runtime
    -> domain services
      -> repositories
```

禁止方向：

```text
agent_runtime -> backend routes
domain services -> FastAPI request objects
tools -> direct unchecked database mutation
frontends -> domain-specific parsing
```

## 多意图执行模型

一次用户输入生成一个 `execution_plan`。一个 plan 可以包含多个 `domain_action`。

示例：

```text
用户输入：
明天下午三点开会，顺便把昨天打车票报销。

execution_plan:
  action_001:
    domain: calendar
    action_type: create_event

  action_002:
    domain: expense
    action_type: create_reimbursement_draft
```

Orchestrator 对每个 action 分别计算风险和缺失字段，再汇总成一个前端可渲染的响应。低风险查询可以直接返回结果；中风险和高风险写入必须进入确认流程。

## 数据模型

核心执行表：

```text
users
conversations
conversation_turns
execution_plans
domain_actions
confirmations
execution_ledger
```

领域事实表：

```text
calendar_events
expense_records
reminders
tasks
```

`users` 在 V1 可以使用本地匿名用户或开发用户，不要求完整账号体系。表中仍保留 `locale` 和 `timezone`，因为时间解析必须依赖用户上下文。

`conversations` 表示一次连续工作台上下文。它不等同于完整聊天归档。

`conversation_turns` 保存用户输入和助手响应摘要。V1 默认保存结构化摘要和必要原文引用，不默认保存完整对话原文。需要回放或审计时，再通过配置开启更完整的 raw content 存储。

`execution_plans` 保存一次输入对应的计划、状态、总体风险、摘要和 `decision_trace_id`。

`domain_actions` 保存计划下的领域动作。每个 action 包含领域、动作类型、风险、状态、结构化 payload、执行结果和幂等键。

`confirmations` 保存确认卡片的呈现内容、确认状态、确认时间和它覆盖的 action 集合。

`execution_ledger` 保存执行事件。它记录每一步的状态、消息、关联 action、执行前快照和执行后快照。前端执行记录和后端调试都从这里取数。

领域表使用 `source_action_id` 关联创建或修改它们的 action。取消和删除优先更新 `status`，不做物理删除。

## 持久化规则

任何写入都必须先形成计划。系统先写入 `execution_plan` 和 `domain_actions`，再根据风险返回追问、确认卡片或查询结果。

用户确认后，Orchestrator 才调用领域 service 执行 action。领域 service 校验 schema、权限、幂等键和业务不变量，然后通过 repository 写入 Postgres。

每个 `domain_action` 是幂等执行单元。网络重试、重复点击确认或客户端恢复请求不能重复创建日程、费用草稿或提醒。

系统用 status 表达生命周期。日程取消、费用草稿撤回和提醒关闭都保留记录与审计链。

## API 设计

V1 API 围绕计划状态机设计。

```text
POST /agent/turns
POST /execution-plans/{id}/confirm
POST /execution-plans/{id}/reject
GET  /execution-plans/{id}
GET  /execution-ledger
GET  /calendar/events
GET  /expenses
GET  /reminders
```

`POST /agent/turns` 是主入口。请求包含 `conversation_id`、用户输入、客户端上下文和可选附件引用。响应必须是下列类型之一：

```text
assistant_message
clarification_request
confirmation_required
execution_result
```

`assistant_message` 用于低风险查询和普通回复。

`clarification_request` 用于缺少结束时间、报销金额、票据日期等必要信息的场景。缺信息不是异常，而是产品状态。

`confirmation_required` 返回 `plan_id`、action 列表、风险等级、确认卡片预览和确认 token。

`execution_result` 返回已执行 action、领域对象 ID 和 ledger 摘要。

`POST /execution-plans/{id}/confirm` 执行确认。它可以确认整个 plan，也可以确认确认卡片覆盖的一组 action。服务端必须验证确认 token、plan 状态、action 状态和幂等键。

`POST /execution-plans/{id}/reject` 拒绝或取消待确认计划。拒绝也写入 ledger。

领域读取接口服务于工作台视图。日历、费用和提醒视图从后端读取事实数据，不从聊天消息中反推状态。

## 执行状态机

```text
input_received
  -> planning
  -> needs_clarification
  -> awaiting_confirmation
  -> executing
  -> succeeded
  -> failed
```

`needs_clarification` 可以回到 `planning`。用户补充字段后，系统继续同一个 conversation，并可以生成新的 plan 或修订原 plan。

`awaiting_confirmation` 只能通过 confirm、reject 或过期策略离开。

V1 确认后优先同步执行。外部 API、长任务或批量处理出现后，再引入 Redis、worker、status polling 或 streaming。

## 风险策略

低风险动作包括查询今日安排、查询本周安排、查询可用时间和读取执行记录。低风险动作可以直接返回。

中风险动作包括创建单个日程、修改单个事项、创建单个提醒或生成单个费用草稿。中风险动作必须复述结构化信息并等待确认。

高风险动作包括批量创建、批量删除、清空日程、批量报销和跨领域批量执行。高风险动作必须展示结构化确认卡片，列出影响范围。

风险策略由 Orchestrator 统一执行。领域层仍要做最终校验，不能因为 Orchestrator 已分级就放弃业务检查。

## Agent Runtime

Agent runtime 提供框架无关接口：

```text
RuleParser
LLMPlanner
StructuredOutputValidator
ToolLoop
DecisionTracer
```

规则解析处理高频明确表达，例如“明天下午三点开会”。LLM 处理模糊表达、多意图拆解和自然语言追问。所有 LLM 输出都必须经过结构化 schema 校验和领域规则校验。

Agent runtime 不直接写业务表。它只返回候选计划、缺失字段、置信度、解释和 trace。

具体 SDK 通过 adapter 接入。架构不依赖某个私有 SDK 的上下文模型、循环模型或工具定义。

## 工具原则

系统采用 Smart Agent, guarded tools。

Agent 负责理解上下文、提出计划和选择工具。工具保持薄，执行明确动作。

工具不能无校验。每个工具必须校验输入 schema、用户权限、幂等键、领域约束和 repository 结果。工具失败必须返回结构化错误，并写入 ledger。

## 错误处理

API 错误使用稳定错误码：

```text
clarification_needed
validation_failed
confirmation_required
tool_execution_failed
llm_unavailable
parse_failed
plan_conflict
action_already_executed
```

`clarification_needed` 和 `confirmation_required` 是正常产品状态，不应作为 5xx 异常处理。

`llm_unavailable` 优先降级到规则解析。规则无法处理时，返回可恢复错误，提示用户稍后重试或改用更明确表达。

`parse_failed` 表示模型输出无法通过 schema 校验。系统保存 trace，不执行写入。

`plan_conflict` 表示确认时计划已经过期、领域对象被修改或 action 状态不再可执行。

## 可观测性

每条执行链都带有可追踪 ID：

```text
request_id
turn_id
plan_id
decision_trace_id
action_id
ledger_id
```

日志必须包含这些 ID。执行记录必须能回答：

- 用户说了什么。
- 系统理解成什么。
- 哪些字段缺失。
- 为什么需要确认。
- 用户确认了什么。
- 哪个 action 执行成功或失败。
- 执行前后业务对象如何变化。

前端执行记录视图读取 `execution_ledger` 摘要。后端调试读取更完整的 trace 和 payload。

## 测试策略

契约测试验证 OpenAPI、`packages/shared-types` 和 `packages/sdk` 的响应形态一致。

Orchestrator 单元测试覆盖多意图拆解、领域路由、风险策略、确认策略和状态机转换。

Agent runtime 测试覆盖规则解析、LLM adapter mock、结构化输出校验和 parse failure。

领域测试覆盖日程时间规则、费用字段规则、提醒规则、幂等执行和 status 生命周期。

Golden scenario 测试覆盖典型中文输入：

```text
明天下午三点开会
把明天的会改到四点
取消今天下午的会议
明天下午开会，顺便把昨天打车票报销
下周找两个小时安排复盘
```

用户报告的问题沉淀为 regression fixtures。每个修复都应新增或更新一个可复现样本。

## 演进路线

### Phase 1：同步 Orchestrator

实现 FastAPI 网关、Orchestrator 包、Agent runtime 接口、Postgres 表、日程领域、轻量费用边界和执行 ledger。确认后同步执行。

### Phase 2：异步执行

当外部 API、长任务、批处理或移动端后台限制出现时，引入 Redis、worker、status polling 或 streaming。

### Phase 3：领域扩展

费用、提醒、外部日历连接器和更多工具成熟后，扩展领域表、领域 service 和 tool adapter。

### Phase 4：运行时服务拆分

只有出现独立部署节奏、独立扩缩容、独立数据所有权、团队所有权或可靠性压力后，才把边界拆成独立服务。拆分前必须补充 ADR。

## 对当前仓库的影响

`contracts/openapi/api-gateway.yaml` 需要新增 Agent turn、execution plan、ledger 和领域读取接口。

`packages/shared-types` 需要新增执行计划、领域动作、确认卡片、ledger 和领域对象类型。

`packages/sdk` 需要新增 `submitAgentTurn()`、`confirmExecutionPlan()`、`rejectExecutionPlan()`、`getExecutionPlan()` 和 `getExecutionLedger()`。

`python/orchestrator` 从预留包升级为计划生命周期所有者。

`python/agent-runtime` 从预留包升级为框架无关 Agent 原语所有者。

`python/backend` 增加 routes、schemas、domain services、repositories 和数据库迁移入口。

`services/*` 继续作为服务边界文档，不新增独立运行时。

## 开放边界

V1 不实现完整账号体系，但数据模型保留用户、时区和 locale。

V1 不要求真实费用报销外部系统集成，但 expense domain 必须能创建内部费用草稿。

V1 不要求队列和 worker，但状态机必须允许未来异步执行。

V1 不绑定具体 LLM 或 Agent SDK，但 adapter 接口必须让后续接入自然发生。
