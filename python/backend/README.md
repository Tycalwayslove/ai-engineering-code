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
  uvicorn backend.app.main:app --app-dir python/backend --host 0.0.0.0 --port 8000 --reload
```

根目录 `pnpm dev:api` 和 `pnpm dev:full` 默认连接本地 Docker Compose Postgres，并监听 `0.0.0.0:8000`，方便 Xcode / 真机 H5 通过 Mac 局域网 IP 访问。当前会持久化 `conversation_turns`、`execution_plans`、`domain_actions`、`confirmations`、`execution_ledger` 和 `calendar_events`。领域 service 拥有业务校验和幂等控制。Agent runtime 的输出不能直接写入领域事实表。

## 本地 `.env.local`

后端会自动查找并读取仓库根目录的 `.env.local`，用于本机密钥和模型 provider 配置；已存在的终端环境变量优先级更高。

DeepSeek 示例：

```bash
AI_PLANNER_MODE=llm_first
AI_PLANNER_PROVIDER=deepseek
AI_PLANNER_MODEL=deepseek-v4-flash
DEEPSEEK_API_KEY=你的_deepseek_key
```

OpenAI 示例：

```bash
AI_PLANNER_MODE=llm_first
AI_PLANNER_PROVIDER=openai
AI_PLANNER_MODEL=gpt-4.1-mini
OPENAI_API_KEY=你的_openai_key
```

## LLM 调用日志

后端会为每次 LLM provider 调用输出安全摘要，便于观察 DeepSeek/OpenAI 的耗时和 prompt 大小：

```text
LLM planner provider call completed provider=DeepSeekLlmProvider model=deepseek-v4-flash mode=llm duration_ms=1234 prompt_chars=5678 response_chars=901 prompt_sha256=...
```

默认不打印完整 prompt。需要临时查看时，在 `.env.local` 中开启：

```bash
AI_PLANNER_LOG_PROMPT=1
```

需要查看模型原始响应时开启：

```bash
AI_PLANNER_LOG_RESPONSE=1
```

完整 prompt 和响应可能包含用户输入、上下文摘要和待确认计划，调试结束后应改回 `0`。

## LLM 调试快照

`GET /agent/conversations/{conversationId}/debug` 的 `decisionTraces[].llmCall` 会返回最近一次 provider 调用的安全摘要：

- `provider` / `model` / `mode`
- `status`
- `durationMs`
- `promptChars` / `responseChars`
- `promptSha256`
- 可选 `errorType`

默认不把完整 prompt 或 response 写入 debug 快照。需要临时在 H5 设置页 / Postman debug 响应中查看原文时，可以显式开启：

```bash
AI_PLANNER_TRACE_PROMPT=1
AI_PLANNER_TRACE_RESPONSE=1
```

真实 provider 请求默认超时为 20 秒，可用 `AI_PLANNER_REQUEST_TIMEOUT_SECONDS` 调整。完整 prompt 和 response 可能包含用户输入与上下文摘要，调试结束后应关闭 trace preview。
