# 记忆索引

## 目的

该索引列出当前有效的结构化记忆，避免运行时代码或 AI 动态扫描整个记忆目录。

## Durable Memory

| 领域         | 文件                                                      | 状态    | 用途                     |
| ------------ | --------------------------------------------------------- | ------- | ------------------------ |
| architecture | `ai-factory/memory/durable/architecture/current-state.md` | current | 当前架构边界和演进规则   |
| decisions    | `ai-factory/memory/durable/decisions/phase-strategy.md`   | current | Phase 1.1/1.2/2 阶段策略 |

## Working Memory

| 领域  | 文件                                                                  | 状态   | 用途                         |
| ----- | --------------------------------------------------------------------- | ------ | ---------------------------- |
| tasks | `ai-factory/memory/working/tasks/ai-factory-spec-to-plan-workflow.md` | active | 首个真实工作流补齐任务上下文 |
| tasks | `ai-factory/memory/working/tasks/factory-status-panel-v1.md`          | active | 工厂状态面板 v1 任务上下文   |

## 使用规则

- AI 读取记忆时，应优先从本索引确定范围。
- 本索引不是数据库，不支持隐式检索。
- 新增 durable memory 后必须更新本索引。
- 阶段结束时必须复审 working memory。
