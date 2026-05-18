# 记忆复盘 Prompt

## 目的

在阶段结束或工作流完成后，判断哪些 working memory 应保留、归档、删除或提升为 durable memory 候选。

## 输入

- 阶段成果摘要。
- 相关 working memory 文件。
- 相关规格、ADR、提交、Obsidian 或飞书链接。
- memory review 模板。

## 输出

- working memory 处理建议。
- durable memory 候选。
- 不应提升的内容。
- 需要用户确认的问题。
- 需要更新的记忆索引。

## 确认规则

- AI 只能提出 durable memory 候选。
- durable memory 写入前必须等待用户确认。
- 需求点不得直接提升为 durable product memory。
- 临时判断不得写成稳定事实。

## 失败处理

- 来源不清时，标记 `source_missing`。
- 候选事实无法证明长期有效时，保留在 working memory。
- 出现互相冲突的记忆时，列出冲突并等待人工确认。

## 使用提示

```text
请使用 memory-review prompt，复盘本阶段 working memory，并提出 durable memory 候选。不要直接写入长期记忆。
```
