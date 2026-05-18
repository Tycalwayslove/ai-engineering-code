# 记忆生命周期

## 目的

记忆生命周期用于区分短期上下文和长期事实，防止 AI 把一次对话直接写成长期记忆。

## 记忆层级

| 层级       | 位置                           | 说明                               |
| ---------- | ------------------------------ | ---------------------------------- |
| 原始上下文 | 对话、Obsidian、飞书、外部资料 | 未必稳定，不能直接作为长期事实     |
| 工作记忆   | `ai-factory/memory/working/`   | 当前任务、阶段、迭代和复盘上下文   |
| 持久记忆   | `ai-factory/memory/durable/`   | 跨任务仍成立、会影响后续决策的事实 |

## 提升流程

```text
原始上下文
  -> working memory
  -> memory review
  -> durable memory 候选
  -> 用户确认
  -> durable memory
```

## 规则

- AI 可以主动记录 working memory。
- AI 只能提出 durable memory 候选，不能默认写入长期记忆。
- durable memory 必须能回答：这个事实未来是否仍会指导决策。
- 需求相关内容先进入需求点记录或 working memory。
- 只有稳定产品原则、架构判断、技术路线、设计原则和 API 边界才能进入 durable memory。
- Obsidian 继续保存自由过程记录。
- `ai-factory/memory` 只保存会影响项目协作和决策的结构化记忆。

## 阶段结束检查

每个阶段结束时必须做 memory review：

- 新增 working memory 是否仍有效。
- 哪些事实可提升为 durable memory 候选。
- 哪些 working memory 应归档。
- 哪些临时判断应删除或标记为过期。
