# 后端 API 网关

## 目的

- 承载 AI Code 的 Python FastAPI 网关。
- 暴露本地开发、CI 和服务契约使用的健康检查与版本端点。

## 所有权

- `backend.app.main` 拥有应用组装。
- `backend.app.routes` 拥有 HTTP 路由模块。
- `backend.app.services` 拥有路由背后的轻量业务编排。
- `python/backend/tests` 下的测试验证网关行为。

## 依赖边界

- 路由模块委托 service 层返回显式响应字典，并避免隐藏式运行时发现。
- 在契约和所有权边界成熟之前，业务编排不进入网关。
- 只有多个模块需要时，共享行为才移动到具名 Python 包。

## 演进路径

- 随匹配的 OpenAPI 契约变更一起添加路由。
- 只有稳定契约边界存在后，才引入服务客户端。
- 保持网关很薄；只有出现运营压力后才抽取领域服务。

## 端点

- `GET /factory/status` 返回工厂状态、版本和当前能力清单。
- `GET /health` 返回服务健康状态。
- `GET /version` 返回 API 名称和版本。

## Agent 执行工作流

V1 后端保持 FastAPI 薄网关定位，自然语言工作流通过 Orchestrator 处理。

关键端点：

- `POST /agent/turns` 提交用户输入，返回 assistant message、clarification request、confirmation card 或 execution result。
- `POST /execution-plans/{id}/confirm` 确认并同步执行待确认计划。
- `POST /execution-plans/{id}/reject` 拒绝待确认计划。
- `GET /execution-plans/{id}` 读取执行计划。
- `GET /execution-ledger` 读取执行审计事件。
- `GET /calendar/events` 读取已确认 action 创建的日程事实。

未设置 `DATABASE_URL` 时，V1 使用 in-process repository，便于测试和轻量本地运行。

设置 `DATABASE_URL` 后，后端使用本地 Postgres repository：

```bash
DATABASE_URL=postgresql://ai_code:ai_code@127.0.0.1:5432/ai_code \
  uvicorn backend.app.main:app --app-dir python/backend --reload
```

根目录 `pnpm dev:api` 和 `pnpm dev:full` 默认连接本地 Docker Compose Postgres。当前会持久化 `conversation_turns`、`execution_plans`、`domain_actions`、`confirmations`、`execution_ledger` 和 `calendar_events`。领域 service 拥有业务校验和幂等控制。Agent runtime 的输出不能直接写入领域事实表。
