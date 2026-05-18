# Phase 1.1 AI 工厂流程稳定化计划

## 目标

Phase 1.1 不开发正式产品功能。目标是让 AI 工厂具备稳定流程、确认机制、模板、校验和记录能力。

## 范围

- 阶段治理。
- 规格和需求生命周期。
- 记忆生命周期。
- Prompt 最小集。
- Agent 角色规范。
- 核心 workflow、manifest 和 run record。
- 四个核心 playbook。
- requirements/design 契约入口。
- 设计输入和 UI 审查规则。
- knowledge-sync 规则。
- `validate:factory`。

## 非目标

- 不生成正式 PRD。
- 不生成正式 UI 设计图。
- 不接入 LangGraph。
- 不启用自动 agent runtime。
- 不做产品功能开发。

## 实施顺序

1. 建立 Phase Gate 和生命周期规则。
2. 补齐 specs、memory、prompt、agent、workflow 和 playbook 资产。
3. 建立 requirements/design 契约入口。
4. 建立设计系统最小检查资产。
5. 建立知识同步规则。
6. 增加 `validate:factory` 并接入 CI。
7. 同步 Obsidian 和飞书。

## 退出条件

- `pnpm validate:factory` 通过。
- `pnpm validate:contracts` 通过。
- CI 包含 `pnpm validate:factory`。
- Obsidian 和飞书记录 Phase 1.1 阶段成果。
- 下一阶段仍不进入功能开发，除非 PRD 和设计资产完成。
