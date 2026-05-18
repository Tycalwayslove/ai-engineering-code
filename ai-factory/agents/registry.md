# Agent 注册表

第一阶段不包含自主 agent。

未来 agent 条目必须声明：

- id
- purpose
- inputs
- outputs
- allowed tools
- allowed memory domains
- escalation path

Agent 不得被自动加载。运行时代码必须通过显式配置加载具名 agent。

## Phase 1.1 角色

| id                    | 目的                       | 定义                                                     |
| --------------------- | -------------------------- | -------------------------------------------------------- |
| product-synthesizer   | 主动生成产品理解草案       | `ai-factory/agents/definitions/product-synthesizer.md`   |
| process-auditor       | 审计流程资产和待完善点     | `ai-factory/agents/definitions/process-auditor.md`       |
| spec-planner          | 将已确认规格转为实施计划   | `ai-factory/agents/definitions/spec-planner.md`          |
| design-system-curator | 整理设计输入和 UI 审查规则 | `ai-factory/agents/definitions/design-system-curator.md` |
| implementation-worker | 在受控阶段执行明确实现任务 | `ai-factory/agents/definitions/implementation-worker.md` |
| reviewer              | 评审代码、文档和流程资产   | `ai-factory/agents/definitions/reviewer.md`              |

## 决策边界

- 子 agent 不参与最终决策。
- 主线程负责整合子 agent 输出并等待用户确认。
- 子 agent 不得写入 durable memory。
- 子 agent 不得自动触发工作流执行。
