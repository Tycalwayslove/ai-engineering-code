# 约定

## 目的

- 定义适用于应用、包、Python 代码、服务、契约和 AI 工厂资产的仓库级规则。
- 让代码库对人和 AI agent 都可读。
- 通过明确常见职责的权威位置来减少漂移。

## 规则

- 代码和工作流形态遵循 `ai-readability.md`。
- 创建包、目录、模块或服务边界前遵循 `naming.md`。
- 复制契约、提示词、记忆或工作流定义前遵循 `source-of-truth.md`。
- 评估新基础设施或抽象时遵循 `anti-patterns.md`。
- 拆分服务、添加运行时、索引记忆或强制契约前遵循 `evolution.md`。
- 提交代码或文档变更时遵循 `git-commits.md`。
- 进入下一阶段前遵循 `phase-gates.md`。
- 流转规格、需求、记忆、契约或发布时，分别遵循对应 lifecycle 文档。

## 演进

- 当重复评审意见暴露稳定规则时，添加约定。
- 保持约定足够短，使其能在日常代码评审中执行。
- 优先更新现有约定，而不是创建重叠指南。

## 当前关键约定

- `phase-gates.md`：阶段进入、退出和功能开发门槛。
- `spec-lifecycle.md`：想法、产品理解、需求点、PRD、工程规格和实施计划的流转。
- `memory-lifecycle.md`：working memory 与 durable memory 的提升和复盘规则。
- `contract-lifecycle.md`：跨运行时和 AI 工厂资产的契约变更顺序。
- `release-and-tags.md`：阶段性 tag、提交和发布说明规则。
