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
- 确认恢复：`confirmation_token_sessions` 保存待确认计划恢复 token 的 hash 与过期时间，不保存明文 token。
- 领域事实：`calendar_events`、`expense_records`、`reminders`

后端未设置 `DATABASE_URL` 时使用 in-process repository；设置后使用 Postgres repository。`pnpm dev:api` 和 `pnpm dev:full` 会在启动 API 前自动执行当前迁移。

## 本地运行

启动本地 Postgres：

```bash
docker compose up -d postgres
```

应用迁移：

```bash
pnpm db:migrate
```

指定连接串或只查看计划：

```bash
DATABASE_URL=postgresql://ai_code:ai_code@localhost:5432/ai_code pnpm db:migrate
pnpm db:migrate -- --dry-run
```

迁移 runner 会维护 `schema_migrations` 表；如果检测到某一阶段的表已经通过旧手动方式创建，但没有记录，会自动 baseline 该版本，避免重复执行已存在的表结构。

手动回滚迁移：

```bash
psql postgresql://ai_code:ai_code@localhost:5432/ai_code \
  -f infra/db/migrations/0001_agent_execution_core.down.sql
```

后续如果引入 Alembic、Flyway 或 sqitch，必须继续沿用当前编号和 up/down 语义，不另建一套迁移来源。
