# 数据库迁移

`infra/db` 保存本地和未来部署环境共享的数据库结构迁移文件。

## 所有权

- `migrations/*.up.sql` 定义向前迁移。
- `migrations/*.down.sql` 定义对应回滚。
- 业务表结构必须能追溯到 `docs/superpowers/specs/*database-design.md`。

## 当前范围

第一版迁移覆盖 Agent 执行工作流核心表：

- 对话上下文：`users`、`conversations`、`conversation_turns`
- 执行工作流：`execution_plans`、`domain_actions`、`confirmations`、`confirmation_actions`、`execution_ledger`
- 领域事实：`calendar_events`、`expense_records`、`reminders`

当前后端仍使用 in-process repository。迁移文件先作为 Postgres-ready 结构落库依据，运行时切换会在后续任务中完成。

## 本地运行

启动本地 Postgres：

```bash
docker compose up -d postgres
```

应用迁移：

```bash
psql postgresql://ai_code:ai_code@localhost:5432/ai_code \
  -f infra/db/migrations/0001_agent_execution_core.up.sql
```

回滚迁移：

```bash
psql postgresql://ai_code:ai_code@localhost:5432/ai_code \
  -f infra/db/migrations/0001_agent_execution_core.down.sql
```

后续如果引入 Alembic、Flyway 或 sqitch，必须继续沿用当前编号和 up/down 语义，不另建一套迁移来源。

