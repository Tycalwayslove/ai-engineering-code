# 想法到产品理解工作流

## 目的

将用户原始想法、外部引用和对话上下文整理为可确认的产品理解草案。

## 工作流声明

- id: `idea-to-product-understanding`
- owner: 当前任务负责人
- trigger: 人工触发
- execution: 手动运行，不得自动执行
- discovery: 不得动态扫描想法、记忆或外部资料
- source: Markdown

## 输入

- 用户原始想法。
- 明确给出的外部引用。
- 相关 Obsidian 或飞书摘要。
- 人工指定的 memory 文件。

## 输出

- 产品理解草案。
- 已确认事实。
- 推测。
- 待确认问题。
- 推荐方案。
- 是否进入需求点记录的建议。

## 状态转换

- `not_started` -> `intake`
- `intake` -> `context_loaded`
- `context_loaded` -> `understanding_drafted`
- `understanding_drafted` -> `waiting_for_human`
- `waiting_for_human` -> `confirmed`
- `waiting_for_human` -> `needs_revision`
- `needs_revision` -> `understanding_drafted`
- `confirmed` -> `archived`

## 人工确认点

- 用户确认 AI 是否正确理解了产品目标。
- 用户补充遗漏信息或修正误解。
- 用户决定是否进入需求点记录。

## 失败处理

- 信息不足：进入 `needs_revision`，列出缺失输入。
- 范围过大：建议拆分多个产品理解主题。
- 出现长期架构判断：提示可能需要 ADR。
- 用户未确认：不得进入需求点记录或 PRD。

## 使用的记忆领域

- `ai-factory/memory/working/active-context/`
- `ai-factory/memory/working/tasks/`
- `ai-factory/memory/durable/product/`
- `ai-factory/memory/durable/architecture/`

## 检查清单

- 是否标注已确认事实和推测。
- 是否列出待确认问题。
- 是否避免直接生成 PRD。
- 是否等待用户确认。
