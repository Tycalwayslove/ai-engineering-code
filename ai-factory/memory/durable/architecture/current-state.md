# 架构当前状态

## 记忆类型

- domain: durable
- area: architecture
- status: current
- last_reviewed: 2026-05-23

## 稳定事实

- 仓库采用 monorepo 结构，当前以 TypeScript 应用、共享 TypeScript 包、Python 代码、跨运行时契约和 AI 工厂资产分区。
- `ai-factory/` 是 AI 辅助交付资产的 Markdown 源，包括 agent、提示词、工作流、记忆、规格、作战手册和设计系统说明。
- AI 工厂第一阶段保持文档优先。运行时代码不得自动发现、加载或执行 `ai-factory/` 下的内容。
- 记忆系统以 Markdown 为源，并明确区分 durable memory 与 working memory。
- durable memory 保存跨任务仍成立的稳定事实；working memory 保存当前任务、会话、迭代和复盘上下文。
- 在真实工作流需求被验证前，不引入数据库、向量库、框架化编排器或自动索引。
- 截至 2026-05-23，AI 时间管理 Agent 已进入真实端到端薄切片：iOS Native 壳通过 Bridge 将输入交给 H5，H5 经 `@ai-code/sdk` 调 FastAPI，后端经 orchestrator 生成确认计划并写入 Postgres。
- 当前 Postgres 已作为 V1 执行事实库，保存 conversation turns、execution plans、domain actions、confirmations、execution ledger 和 calendar events。
- 当前全链路仍是同步执行，不引入 worker/queue；重复确认必须幂等，领域事实写入由 domain service 和 repository 负责。

## 当前边界

- 可执行应用和共享包位于 `apps/`、`packages/`、`python/`、`contracts/` 等运行时代码区域。
- AI 工厂文档位于 `ai-factory/`，架构说明位于 `docs/architecture/`，工程约定位于 `docs/conventions/`。
- 架构文档不得复制契约或提示词的完整内容，只记录边界、职责和演进规则。
- 工作流文档可以声明步骤、状态和检查点，但不得成为可自动发现的运行时注册表。
- `ai-factory/memory/working/active-context/current-project-state.md` 是新 Codex 窗口恢复项目进展的活动上下文入口，不属于运行时代码依赖。

## 演进规则

- 只有所有权、触发器、状态、记忆领域和失败处理清楚后，才允许推进工作流自动化。
- 只有 Markdown 检索不足以支撑真实工作，且已有明确访问契约后，才考虑索引。
- 只有稳定架构决策影响多个区域时，才提升为 ADR 或 durable decision。
