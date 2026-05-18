# 06 面试讲解稿

## 30 秒版本

我做的是一个 AI 原生软件工厂 monorepo。它不是普通 Web 应用，而是把规格、记忆、提示词、工作流、契约、设计系统和运行时代码放在同一个可演进体系里。当前已经完成 TypeScript + Python 双生态骨架、FastAPI 后端、Next.js 应用、OpenAPI 契约、SDK、Admin 工厂状态面板，以及 Obsidian 和飞书的成果沉淀链路。

## 3 分钟版本

这个项目的出发点是：AI 参与长期软件开发后，最大的风险不是“代码写不出来”，而是上下文漂移、架构漂移和协作不可检查。

所以我先没有急着做复杂业务功能，而是搭建了一套 AI 能读懂、也能长期维护的工程基础：

- 前端用 TypeScript、pnpm workspace、Turborepo 和 Next.js。
- 后端与 AI runtime 用 Python、FastAPI 和显式编排边界。
- 跨运行时契约放在 `contracts/`，前端通过 `packages/sdk` 调后端。
- `ai-factory/` 专门管理 specs、memory、prompts、workflows、design-system 和 playbooks。
- `services/` 只作为边界定义，不提前复制运行时和依赖树。

我已经实现了第一条端到端薄切片：`/factory/status` 从 OpenAPI 契约到 FastAPI，再到 SDK 和 Admin 面板。它展示当前软件工厂具备哪些能力、能力来自哪里、哪些还是 planned，以及下一步行动。

这个项目最能体现我的工程判断的是：我没有过早接入 LangGraph、向量数据库、Kubernetes 或微服务，而是先把边界、契约、质量门禁和阶段记录做稳。

## 10 分钟展开路线

1. 先讲问题：AI 开发最容易丢上下文和制造隐性复杂度。
2. 再讲结构：为什么采用 TypeScript + Python 双生态。
3. 展示目录：`ai-factory/`、`contracts/`、`packages/sdk`、`python/backend`。
4. 展示薄切片：`/factory/status` 如何贯穿契约、后端、SDK 和 Admin。
5. 讲治理：ADR、反模式、演进规则、中文提交规范。
6. 讲协作证据：GitHub 提交、Obsidian 阶段记录、飞书展示知识库。
7. 讲下一步：把 Admin 面板演进为工厂工作台，逐步接入 workflow registry、memory repository 和真实 AI workflow。

## 面试官可能追问

| 问题                             | 回答方向                                                                              |
| -------------------------------- | ------------------------------------------------------------------------------------- |
| 为什么不直接上 LangGraph？       | 先等真实工作流出现，避免为了框架而框架化。                                            |
| 为什么 services 现在不是微服务？ | 当前只有边界压力，没有独立部署压力，先保留模块边界。                                  |
| 如何避免 AI 乱改架构？           | 通过 ADR、反模式、source-of-truth、规格和显式注册约束行为。                           |
| 契约如何保证一致？               | 目前用 OpenAPI、shared-types、SDK 和轻量校验，后续可引入生成式客户端。                |
| 这个项目的实际产出是什么？       | 可运行 monorepo、FastAPI 接口、Next.js 页面、Admin 状态面板、质量门禁和知识沉淀体系。 |
