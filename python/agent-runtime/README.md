# Agent 运行时

## 目的

- 为未来 agent 执行基础能力预留 Python 包边界。
- 在引入任何 AI 工作流框架之前，保持运行时所有权明确。

## 所有权

- `agent_runtime` will own agent execution helpers, tool adapters, and runtime state models when they become necessary.
- 提示词、工作流和记忆源文件保留在 `ai-factory/` 下。

## 依赖边界

- 该包目前没有工作流框架依赖。
- 在第一个真实工作流需要之前，不添加 LangGraph 或 agent 框架代码。
- 显式导入契约和配置，而不是使用动态自动加载。

## 演进路径

- 当重复 agent 执行模式出现时，从简单类型化 helper 开始。
- 只有执行、状态、重放或评审需求具体化后，才添加框架集成。
- 保持每个新运行时基础能力都绑定到真实工作流需求。
