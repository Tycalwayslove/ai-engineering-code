# 记忆复盘工作流

## 目的

在阶段结束或重要工作流完成后，复审 working memory，并提出 durable memory 候选。

## 工作流声明

- id: `memory-review`
- owner: 当前任务负责人
- trigger: 人工触发
- execution: 手动运行，不得自动执行
- discovery: 不得动态扫描整个记忆目录
- source: Markdown

## 输入

- 阶段成果摘要。
- 人工指定的 working memory 文件。
- 相关规格、ADR、提交、Obsidian 或飞书链接。
- memory review 模板。

## 输出

- working memory 处理建议。
- durable memory 候选。
- 不应提升的内容。
- 记忆索引更新建议。

## 状态转换

- `not_started` -> `intake`
- `intake` -> `sources_loaded`
- `sources_loaded` -> `review_drafted`
- `review_drafted` -> `waiting_for_human`
- `waiting_for_human` -> `approved`
- `waiting_for_human` -> `needs_revision`
- `approved` -> `memory_updated`
- `memory_updated` -> `archived`

## 人工确认点

- 用户确认哪些候选事实可以进入 durable memory。
- 用户确认哪些 working memory 应归档或删除。
- 用户确认记忆索引是否更新。

## 失败处理

- 来源不清：标记 `source_missing`。
- 候选事实不稳定：保留 working memory。
- 记忆冲突：列出冲突并等待用户确认。
- 用户未确认：不得写入 durable memory。

## 使用的记忆领域

- `ai-factory/memory/working/tasks/`
- `ai-factory/memory/working/iterations/`
- `ai-factory/memory/working/retrospectives/`
- `ai-factory/memory/durable/architecture/`
- `ai-factory/memory/durable/decisions/`

## 检查清单

- 是否区分 working 和 durable。
- durable 候选是否有来源。
- 是否等待用户确认。
- 是否更新 `ai-factory/memory/index.md`。
