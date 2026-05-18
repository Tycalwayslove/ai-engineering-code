# Design Brief 草案工作流

## 目的

将已确认 PRD 转成可人工审阅的设计输入，明确页面目标、用户、信息优先级、关键状态、组件层级和 UI 设计图约束。

该工作流不生成最终 UI，不进入产品开发。

## 工作流声明

- id: `design-brief-draft`
- owner: 当前任务负责人
- trigger: 人工触发
- execution: 手动运行，不得自动执行
- discovery: 不得动态扫描 PRD、设计系统或外部资料
- source: Markdown

## 输入

- 已确认 PRD。
- 已确认需求点记录。
- design brief 模板。
- 设计系统 token、组件层级和 UI 审查清单。

## 输出

- design brief 草案。
- 页面目标和用户说明。
- 信息优先级。
- 状态覆盖清单。
- 组件需求。
- 响应式与 Hybrid 约束。
- 是否进入 UI 设计图阶段的建议。

## 状态转换

- `not_started` -> `intake`
- `intake` -> `prd_checked`
- `prd_checked` -> `design_context_loaded`
- `design_context_loaded` -> `brief_drafted`
- `brief_drafted` -> `waiting_for_human`
- `waiting_for_human` -> `accepted`
- `waiting_for_human` -> `needs_revision`
- `needs_revision` -> `brief_drafted`
- `accepted` -> `archived`

## 人工确认点

- 用户确认 design brief 是否准确表达第一版体验目标。
- 用户确认信息优先级是否准确。
- 用户确认关键状态是否完整。
- 用户确认是否进入 UI 设计图阶段。

## 失败处理

- PRD 未确认：退回 `prd-draft`。
- 设计输入不足：列出缺失问题，停在 `waiting_for_human`。
- 范围过大：拆分页面或设计 brief，不进入 UI 设计图。
- 发现组件层级冲突：回到设计系统规则修正。

## 使用的记忆领域

- `ai-factory/memory/working/tasks/`
- `ai-factory/memory/working/active-context/`
- `ai-factory/memory/durable/product/`
- `ai-factory/memory/durable/design/`

## 检查清单

- 是否引用已确认 PRD。
- 是否明确页面目标和目标用户。
- 是否列出信息优先级。
- 是否覆盖 loading、empty、error、success 状态。
- 是否符合 primitives / composites / layouts 分层。
- 是否避免前端业务编排。
- 是否保留 Native/H5/Bridge 边界。
- 是否等待用户确认。
