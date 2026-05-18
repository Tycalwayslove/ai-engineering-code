# Python 运行时

## 目的

- 拥有 monorepo 中的 Python 服务和 AI 运行时包。
- 提供 FastAPI API 网关基础，以及未来 agent 执行和编排的空包边界。

## 所有权

- 后端 API 代码位于 `python/backend`。
- Agent 运行时基础能力归属 `python/agent-runtime`。
- 工作流协调代码归属 `python/orchestrator`。

## 依赖边界

- 后端代码只能通过显式导入依赖 FastAPI、Pydantic 和运行时包。
- 在真实工作流需要执行、状态、重放或评审之前，agent runtime 和 orchestrator 保持无框架。
- 跨运行时契约保留在 `contracts/`；Python 包可以消费契约，但不得重新定义契约。

## 演进路径

- 当 OpenAPI 契约或产品流程需要时，添加后端路由。
- 重复 agent 执行模式稳定后，才添加 agent 运行时抽象。
- 只有存在具体工作流压力后，才添加编排框架。
