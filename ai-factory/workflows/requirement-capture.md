# 需求点记录工作流

## 目的

将已确认产品理解拆成普通需求点记录，为 Phase 1.2 PRD 做准备。

## 工作流声明

- id: `requirement-capture`
- owner: 当前任务负责人
- trigger: 人工触发
- execution: 手动运行，不得自动执行
- discovery: 不得动态扫描需求目录
- source: Markdown

## 输入

- 已确认产品理解。
- 用户补充意见。
- 外部引用摘要。
- requirement record 模板。

## 输出

- 需求点记录。
- 验收标准。
- 验证方式。
- 是否需要设计输入。
- 是否进入 PRD 候选的建议。

## 状态转换

- `not_started` -> `intake`
- `intake` -> `understanding_checked`
- `understanding_checked` -> `requirements_drafted`
- `requirements_drafted` -> `waiting_for_human`
- `waiting_for_human` -> `accepted`
- `waiting_for_human` -> `needs_revision`
- `needs_revision` -> `requirements_drafted`
- `accepted` -> `archived`

## 人工确认点

- 用户确认需求陈述是否准确。
- 用户确认优先级和非目标。
- 用户确认是否进入 PRD 候选。

## 失败处理

- 产品理解未确认：退回 `idea-to-product-understanding`。
- 验收标准无法定义：标记 `needs_revision`。
- 需求冲突：列出冲突并等待用户裁决。
- 影响长期架构：提示需要 ADR。

## 使用的记忆领域

- `ai-factory/memory/working/tasks/`
- `ai-factory/memory/durable/product/`
- `ai-factory/memory/durable/design/`

## 检查清单

- 需求是否描述“必须满足什么”。
- 是否避免写实现方案。
- 是否包含验收标准。
- 是否标记确认状态。
