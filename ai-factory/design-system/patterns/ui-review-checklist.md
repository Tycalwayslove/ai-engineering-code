# AI 生成 UI 审查清单

## 目的

任何 AI 生成 UI 进入实现前，都必须通过本清单。

## 检查项

- 是否有关联需求点、PRD 或 design brief。
- 是否明确页面目标和目标用户。
- 是否列出信息优先级。
- 是否覆盖 loading、empty、error、success 状态。
- 是否符合 primitives / composites / layouts 分层。
- 是否避免前端业务编排。
- 是否避免 app 内直接 fetch。
- 是否考虑响应式。
- 文本是否可能溢出。
- 是否满足基本可访问性。
- 是否遵守设计 token 或设计方向。
- 是否需要 Figma 或飞书画板确认。

## 阻断条件

- 无需求来源。
- 无 design brief。
- 关键状态缺失。
- UI 设计与阶段门禁冲突。
- 需要正式设计图但尚未进入 Phase 1.2。
