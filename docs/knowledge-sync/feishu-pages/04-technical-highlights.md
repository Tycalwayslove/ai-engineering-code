# 04 核心技术亮点

## 1. AI 原生目录结构

项目不是把 AI 能力当作后期插件，而是从仓库结构上承认 AI 协作需要基础设施。

`ai-factory/` 包含：

- `specs`：实现意图和验收标准。
- `memory`：稳定知识和临时上下文。
- `prompts`：分层提示词。
- `workflows`：显式工作流模板、状态和注册表。
- `design-system`：面向 AI 生成 UI 的设计资产。
- `playbooks`：功能开发、修复、评审和发布流程。

## 2. Thin Polyglot Skeleton

项目同时支持 TypeScript 和 Python，但不急着做复杂运行时。

这种路线的价值是：

- 前端生态用 TypeScript、Next.js、pnpm 和 Turborepo。
- AI/backend 生态用 Python、FastAPI、Pydantic 和显式编排边界。
- 两个生态通过 contracts 和 SDK 协作，而不是互相 import。
- 早期保持可运行、可理解、可验证。

## 3. Contract-first 薄切片

`/factory/status` 不是随手写的接口，而是从 OpenAPI 到 SDK 到前端页面的完整链路。

这体现了三个工程习惯：

- 契约先行，减少前后端漂移。
- SDK 统一网络访问，避免应用内散落 fetch。
- 契约校验虽然轻量，但能防止核心字段被意外删改。

## 4. 明确反模式

项目主动写下不做什么：

- 不过早微服务化。
- 不隐藏运行时发现。
- 不复制提示词和上下文。
- 不让前端承担业务编排。
- 不让任意模块直接访问 memory。
- 不引入没有实际压力的抽象和插件系统。

这对 AI 协作尤其重要，因为 AI 很容易为了“看起来完整”而生成过度架构。

## 5. 三层证据链

项目成果不只留在代码里：

- GitHub 保存可运行代码和提交历史。
- Obsidian 保存阶段过程和个人工作记忆。
- 飞书保存面试展示型知识库。

这让项目既能被验证，也能被讲清楚。
