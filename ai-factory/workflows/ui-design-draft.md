# UI 设计图草案工作流

## 目的

将已确认 design brief 转成可人工审阅的 UI 设计图草案，并记录设计图来源、范围、工具、链接和后续确认点。

该工作流不进入产品开发，不生成工程规格。

## 工作流声明

- id: `ui-design-draft`
- owner: 当前任务负责人
- trigger: 人工触发
- execution: 手动运行，不得自动执行
- discovery: 不得动态扫描设计文件、Figma 文件或外部资料
- source: Markdown + Figma

## 输入

- 已确认 design brief。
- 已确认 PRD。
- UI 审查清单。
- 设计系统 token、组件层级和 Hybrid 约束。

## 输出

- UI 设计图草案。
- 设计图链接。
- 覆盖的页面或状态清单。
- 待确认设计问题。
- 是否进入工程规格的建议。

## 状态转换

- `not_started` -> `intake`
- `intake` -> `design_brief_checked`
- `design_brief_checked` -> `figma_created`
- `figma_created` -> `ui_drafted`
- `ui_drafted` -> `waiting_for_human`
- `waiting_for_human` -> `accepted`
- `waiting_for_human` -> `needs_revision`
- `needs_revision` -> `ui_drafted`
- `accepted` -> `archived`

## 人工确认点

- 用户确认 UI 设计图是否表达了 design brief。
- 用户确认工作台、AI 追问、确认卡片和时间对象视图是否合理。
- 用户确认设计默认值是否继续保留。
- 用户确认是否进入工程规格阶段。

## 失败处理

- design brief 未确认：退回 `design-brief-draft`。
- UI 设计图无法覆盖关键状态：回到 `ui_drafted` 修正。
- Figma 创建或更新失败：记录失败原因，不进入工程规格。
- 用户未确认：不得进入工程规格或开发。

## 使用的记忆领域

- `ai-factory/memory/working/tasks/`
- `ai-factory/memory/working/active-context/`
- `ai-factory/memory/durable/design/`
- `ai-factory/memory/durable/product/`

## 检查清单

- 是否引用已确认 design brief。
- 是否覆盖核心视图。
- 是否覆盖关键状态。
- 是否保留 Hybrid 边界。
- 是否避免最终开发承诺。
- 是否等待用户确认。
