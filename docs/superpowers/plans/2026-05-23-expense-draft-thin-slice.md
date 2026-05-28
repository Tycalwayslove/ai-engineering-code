# Expense Draft Thin Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让明确金额的打车票报销请求经确认后写入 `expense_records` 并通过 `/expenses` 读取。

**Architecture:** 沿用 `RuleParser -> ExecutionPlanner -> ExecutionCoordinator -> DomainService -> Repository`。新增 expense domain，提供 in-memory 和 Postgres repository；orchestrator 只按 action type 分派，不直接写数据库。

**Tech Stack:** Python/FastAPI, psycopg, pytest, OpenAPI, pnpm validation scripts.

---

### Task 1: 费用解析和计划

**Files:**

- Modify: `python/agent-runtime/agent_runtime/parsers/rule_parser.py`
- Modify: `python/backend/tests/test_orchestrator_planner.py`

- [ ] 写失败测试：`RuleParser` 能把“把昨天 58 元打车票报销”解析为 `expense.create_reimbursement_draft`，payload 含 `amount=58`、`currency=CNY`、`occurred_on=2026-05-20`。
- [ ] 写失败测试：`ExecutionPlanner` 对明确金额费用返回确认计划，而不是 clarification。
- [ ] 实现最小金额和日期解析。
- [ ] 运行 `PATH=.venv/bin:$PATH pytest python/backend/tests/test_orchestrator_planner.py -v`。

### Task 2: 费用领域服务

**Files:**

- Create: `python/backend/backend/app/domains/expense/__init__.py`
- Create: `python/backend/backend/app/domains/expense/models.py`
- Create: `python/backend/backend/app/domains/expense/repository.py`
- Create: `python/backend/backend/app/domains/expense/service.py`
- Modify: `python/backend/tests/test_orchestrator_planner.py`

- [ ] 写失败测试：确认费用 action 后，in-memory repository 中出现一条草稿。
- [ ] 实现 `ExpenseRecord`、`ExpenseRecordRepository`、`InMemoryExpenseRecordRepository` 和 `ExpenseDomainService`。
- [ ] 修改 `ExecutionCoordinator` 构造函数，接收 expense service 并执行 `expense.create_reimbursement_draft`。
- [ ] 运行 `PATH=.venv/bin:$PATH pytest python/backend/tests/test_orchestrator_planner.py -v`。

### Task 3: API 和 Postgres

**Files:**

- Create: `python/backend/backend/app/domains/expense/postgres_repository.py`
- Modify: `python/backend/backend/app/runtime.py`
- Modify: `python/backend/backend/app/routes/expense.py`
- Modify: `python/backend/tests/test_agent_turns.py`
- Modify: `python/backend/tests/test_postgres_repositories.py`

- [ ] 写失败测试：FastAPI 确认费用计划后，`GET /expenses` 返回草稿。
- [ ] 写失败测试：Postgres execution flow 能持久化 `expense_records`。
- [ ] 实现 Postgres repository 和 runtime wiring。
- [ ] 更新清理逻辑，删除测试 conversation 时清理 expense records。
- [ ] 运行 `PATH=.venv/bin:$PATH pytest python/backend/tests -v`。

### Task 4: 文档和验证

**Files:**

- Modify: `ai-factory/memory/working/active-context/current-project-state.md`
- Modify: `docs/knowledge-sync/feishu-pages/03-evolution-log.md`

- [ ] 更新当前项目状态，记录费用草稿薄切片。
- [ ] 更新阶段演进源稿。
- [ ] 运行 `PATH=.venv/bin:$PATH ruff check python`。
- [ ] 运行 `PATH=.venv/bin:$PATH mypy python`。
- [ ] 运行 `pnpm validate:contracts`。
- [ ] 运行 `pnpm validate:context-sync`。
