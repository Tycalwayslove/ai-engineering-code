# 费用草稿薄切片设计

日期：2026-05-23
状态：已确认进入实施

## 目标

让 AI 时间管理 Agent 支持第一条费用领域真实闭环：用户输入明确金额的打车票报销请求，系统生成确认计划，用户确认后写入 `expense_records`，并可通过 `/expenses` 读取费用草稿。

## 范围

本次只做内部费用草稿，不接外部报销系统，不上传票据图片，不做审批流，不做多币种汇率换算。

支持示例：

```text
把昨天 58 元打车票报销
```

结果：

- `POST /agent/turns` 返回 `confirmation_required`。
- 计划中包含 `expense.create_reimbursement_draft` action。
- action payload 包含 `title`、`amount`、`currency`、`occurred_on`。
- `POST /execution-plans/{id}/confirm` 后写入一条 `expense_records` 草稿。
- `GET /expenses` 返回该草稿。

缺少金额时继续保持现状：返回 clarification request，不创建计划。

## 架构

继续沿用 `Orchestrator-first Modular Backend`。

```text
RuleParser
  -> ExecutionPlanner
  -> ExecutionCoordinator
  -> ExpenseDomainService
  -> ExpenseRecordRepository
  -> InMemory / Postgres
```

`agent-runtime` 只解析候选动作，不写领域事实。`orchestrator` 负责计划、确认和执行分派。`backend.app.domains.expense` 拥有费用模型、repository 和 service。FastAPI 路由只读取 service，不直接访问数据库。

## 数据

费用草稿使用已有 `expense_records` 表。

领域模型：

- `id`
- `title`
- `amount`
- `currency`
- `occurredOn`
- `status`
- `sourceActionId`

`sourceActionId` 保持唯一，重复确认或重试不能重复创建费用草稿。

## 解析规则

第一版规则只处理明确中文金额：

- `58 元`
- `58.5 元`
- `58.50元`

包含 `昨天` 时，`occurred_on` 按用户上下文 `now` 的日期减一天。没有日期时先不写 `occurred_on`，后续再扩展。

标题第一版固定为 `打车票报销`。这和当前缺金额澄清路径保持一致，避免过早做通用费用分类。

## 错误处理

- 缺少 `amount`：planner 返回 clarification request。
- payload 金额不是数字或小于 0：expense service 抛出 `ValueError`，coordinator 标记 action failed 并写入 ledger。
- 未支持 action type：维持现有失败行为。

## 测试

- `RuleParser` 能解析明确金额的费用动作。
- `ExecutionPlanner` 对明确金额费用返回确认计划。
- `ExecutionCoordinator` 确认后创建费用草稿并保证重复确认幂等。
- FastAPI 端到端测试覆盖 `/agent/turns`、`/confirm`、`/expenses`。
- Postgres 集成测试覆盖费用草稿持久化。
- 运行 `pytest python/backend/tests -v`、`ruff check python`、`mypy python`、`pnpm validate:contracts`。
