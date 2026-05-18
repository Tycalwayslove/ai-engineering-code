# 当前任务上下文：AI 工厂规格到实施计划工作流

## 记忆类型

- domain: working
- area: tasks
- status: active
- created: 2026-05-18

## 当前目标

为 AI 工厂补齐第一个手动优先、可检查的真实工作流，主题为“规格到实施计划”，并补充当前架构和任务相关结构化记忆。

## 本次范围

允许修改：

- `ai-factory/workflows/**`
- `ai-factory/memory/**`
- `ai-factory/prompts/**`
- `ai-factory/playbooks/**`
- `ai-factory/specs/**`
- `docs/architecture/**`
- `docs/conventions/**`

避免修改：

- `apps/**`
- `packages/**`
- `python/**`
- `contracts/openapi/**`
- `.github/**`

## 关键约束

- 工作流必须显式声明输入、输出、状态转换、使用的记忆领域和人工触发方式。
- 工作流不得自动执行。
- 工作流不得动态扫描规格、记忆或仓库目录。
- Markdown 保持为源。
- 不引入数据库、向量库或框架。
- 记忆必须区分 durable 与 working。
- 文档中文为主，保留必要技术名词。

## 交付物

- `ai-factory/workflows/spec-to-implementation-plan.md`
- `ai-factory/memory/durable/architecture/current-state.md`
- 本任务 working memory 记录
- 必要 README 索引更新

## 验收检查

- 能通过文本检查确认工作流包含输入、输出、状态转换、记忆领域和人工触发方式。
- 能通过文本检查确认禁止自动执行和动态扫描。
- durable memory 与 working memory 文件分属对应目录。
- 未触碰禁止修改目录。
