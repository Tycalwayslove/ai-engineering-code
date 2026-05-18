# 规格到实施计划工作流

## 目的

将一份已经存在的产品或工程规格，转换为可人工审阅、可分派、可验证的实施计划。

该工作流是 AI 工厂的第一个真实工作流，但仍保持手动优先。它定义协作步骤和检查点，不定义自动执行器。

## 工作流声明

- id: `spec-to-implementation-plan`
- owner: 当前任务负责人
- trigger: 人工触发
- execution: 手动运行，不得自动执行
- discovery: 不得动态扫描规格、记忆或仓库目录
- source: Markdown

## 人工触发方式

人类在任务上下文中显式提出类似请求时才可启动：

```text
请按 ai-factory/workflows/spec-to-implementation-plan.md，把 <规格文件或规格摘录> 转成实施计划。
```

触发请求必须直接给出规格文件路径、规格摘录或明确的规格标题。agent 不得自行扫描 `ai-factory/specs/**` 来猜测目标规格。

## 输入

必需输入：

- 规格来源：一个明确的 Markdown 文件路径、Notion/文档摘录，或粘贴在对话中的规格文本。
- 目标范围：本次计划覆盖的功能、修复或架构变化边界。
- 约束：禁止修改区域、允许修改区域、时间限制、评审要求和兼容性要求。
- 验证要求：必须运行的测试、人工检查项或验收标准。

可选输入：

- 相关 durable memory：长期架构、产品、API、设计或决策上下文。
- 相关 working memory：当前任务、活动上下文、迭代记录或临时风险。
- 交付偏好：是否需要拆成子任务、是否需要 PR 描述、是否需要迁移计划。

## 输出

主要输出：

- 一份 Markdown 实施计划，默认写入 `ai-factory/specs/active/` 或用户指定位置。

实施计划必须包含：

- 背景和目标
- 明确的非目标
- 受影响文件或目录
- 实施步骤
- 状态转换计划
- 风险和人工决策点
- 验证命令和人工检查项
- 记忆更新建议

辅助输出：

- 对缺失规格信息的开放问题。
- 可提升到 durable memory 的候选事实。
- 任务完成后应清理或归档的 working memory。

## 状态转换

允许状态：

- `not_started`：已收到人工触发，但尚未读取输入。
- `intake`：正在确认规格来源、范围、约束和验证要求。
- `context_loaded`：已按人工指定路径读取必要规格和记忆。
- `plan_drafted`：已生成初版实施计划。
- `human_review`：等待人类审阅范围、风险和验证项。
- `approved`：人类确认计划可执行。
- `in_progress`：计划正在被执行。
- `verified`：验证命令和人工检查项已完成。
- `archived`：计划完成、取消或迁移到其他任务系统。

允许转换：

- `not_started` -> `intake`
- `intake` -> `context_loaded`
- `context_loaded` -> `plan_drafted`
- `plan_drafted` -> `human_review`
- `human_review` -> `approved`
- `human_review` -> `intake`
- `approved` -> `in_progress`
- `in_progress` -> `verified`
- `verified` -> `archived`
- `intake` -> `archived`
- `human_review` -> `archived`

禁止转换：

- 未经 `human_review` 直接进入 `approved`。
- 未经人工触发从任何状态自动进入 `in_progress`。
- 通过目录扫描发现新规格并自动创建计划。

## 使用的记忆领域

durable memory：

- `ai-factory/memory/durable/architecture/`：稳定架构边界、运行时限制和目录职责。
- `ai-factory/memory/durable/product/`：长期产品目标和用户价值判断。
- `ai-factory/memory/durable/api/`：跨运行时协议或 API 约束。
- `ai-factory/memory/durable/decisions/`：已接受的架构或流程决策。

working memory：

- `ai-factory/memory/working/active-context/`：当前会话、分支或多人协作背景。
- `ai-factory/memory/working/tasks/`：本次任务目标、范围、约束和验收记录。
- `ai-factory/memory/working/iterations/`：计划执行过程中的短期迭代笔记。
- `ai-factory/memory/working/retrospectives/`：完成后的复盘和可提升经验。

记忆使用规则：

- 只读取人工指定或计划中明确列出的记忆文件。
- durable memory 只能记录跨任务仍成立的事实。
- working memory 只能记录当前任务或短期协作上下文。
- 不得把记忆目录当作数据库、向量库或自动检索源。

## 手动运行步骤

1. 确认触发请求明确给出规格来源和计划目标。
2. 读取规格来源，以及人类明确指定的记忆文件。
3. 摘出需求、非目标、约束、验收标准和未知项。
4. 将规格拆成可执行步骤，并为每步标注预期状态、风险和验证方式。
5. 生成 Markdown 实施计划。
6. 请求或记录人工审阅结果。
7. 只有人工确认后，才进入执行工作。
8. 执行完成后，根据验证结果更新 working memory；仅将稳定事实提升到 durable memory。

## 检查清单

- 输入是否来自明确人工指定，而不是动态扫描。
- 输出是否可被人类独立检查。
- 状态转换是否包含人工审阅。
- 计划是否列出修改边界和禁止区域。
- 计划是否列出验证命令和预期结果。
- 记忆更新是否区分 durable 与 working。
