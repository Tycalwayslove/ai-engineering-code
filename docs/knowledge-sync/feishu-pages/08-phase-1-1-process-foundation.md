# 08 Phase 1.1 流程稳定化成果

## 阶段定位

Phase 1.1 的目标不是开发产品功能，而是把 AI 工厂从“有目录、有原则、有雏形”推进到“有稳定流程、有确认机制、有模板、有校验、有记录”。

核心原则：

> 在需求文档、产品理解、设计资产和流程机制稳定前，不进入产品功能开发。

## 本阶段补齐了什么

- 阶段治理：Phase Gate、发布与 tag、阶段退出条件。
- 规格链路：想法捕获、产品理解、需求点记录、PRD、工程规格和实施计划的生命周期。
- 记忆系统：working/durable memory 的模板、索引、复盘和提升规则。
- Prompt：产品理解、需求点记录、规格到计划、记忆复盘、流程审计、评审的最小 prompt 集。
- Agent：定义 product-synthesizer、process-auditor、spec-planner、design-system-curator、implementation-worker、reviewer 六类角色，但不做自动化运行时。
- Workflow：补齐 idea-to-product-understanding、requirement-capture、memory-review、process-audit，并为现有 spec-to-implementation-plan 增加 manifest。
- Playbook：补齐 feature-development、bugfix、review、release 四个核心操作手册。
- 契约：新增 requirements 和 design 契约入口，扩展 workflow 与 memory schema。
- 设计系统：补最小 token、组件层级、design brief 模板和 UI review checklist。
- 质量门禁：新增 `pnpm validate:factory`，并接入 CI。
- 知识同步：补齐仓库、Obsidian、飞书之间的同步规则和外部引用规则。

## 为什么这一步重要

AI 原生项目的风险不是没有代码，而是上下文漂移、需求漂移、流程漂移和记忆污染。

这一步把项目的协作流程变成可检查资产，让后续“想法 -> 产品理解 -> 需求点 -> PRD -> 设计 -> 工程规格 -> 实施计划”可以按固定路径推进。

## 当前仍不做什么

- 不做正式产品功能。
- 不生成正式 PRD。
- 不生成正式 UI 设计图。
- 不启用 LangGraph。
- 不启用自动 agent runtime。
- 不把飞书或 Obsidian 当成唯一权威来源。

## 下一步

下一轮可以开始运行第一条真实流程样例：

```text
原始想法
  -> idea-to-product-understanding
  -> 用户确认
  -> requirement-capture
  -> memory-review
```

跑通后，再进入 Phase 1.2 的 PRD 和设计资产成型阶段。
