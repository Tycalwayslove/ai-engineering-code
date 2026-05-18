# 阶段策略

## 记忆类型

- id: phase-strategy
- domain: decisions
- scope: durable
- status: current
- sourcePath: ai-factory/memory/durable/decisions/phase-strategy.md
- created: 2026-05-18
- lastReviewed: 2026-05-18
- tags: phase, governance, ai-factory

## 稳定决策

- Phase 1.1 定位为 AI 工厂流程稳定化，不进入正式产品功能开发。
- Phase 1.2 定位为需求与设计资产成型，重点生成产品理解、PRD、用户流程、设计 brief 和 UI 设计图。
- Phase 2 才进入受控产品开发。
- 在 PRD 和 UI 设计资产稳定前，任何产品功能开发都属于过早开发。

## 决策理由

当前项目已经有 monorepo、契约、运行时基础和第一条薄切片，但 AI factory 的 prompt、workflow、memory、playbook、design-system 仍缺少内容密度和校验机制。

先稳定流程，可以避免后续功能开发依赖临时上下文、隐性判断和不完整需求。

## 更新条件

当 Phase 1.1 退出条件全部满足，并且至少一轮真实“想法到需求点记录”流程跑通后，复审本记忆。
