# Workflow Run：AI 时间管理 Agent 需求与 UI 修订

## 记忆类型

- id: run-2026-05-19-ai-time-management-agent-requirement-ui-revision
- domain: tasks
- scope: working
- status: confirmed
- sourcePath: ai-factory/workflows/runs/2026-05-19-ai-time-management-agent-requirement-ui-revision.md
- created: 2026-05-19
- lastReviewed: 2026-05-19

## 运行信息

- workflow id: requirement-and-ui-revision
- run id: 2026-05-19-ai-time-management-agent-revision
- lifecycle id: ai-time-management-agent-2026-05-18
- trigger: 用户反馈 Figma v0.3 不满意，并提供参考产品截图与笔记
- owner: 当前任务负责人
- branch: codex/ai-native-factory-bootstrap

## 流程实例边界

- 主目标：把用户对参考产品的理解转成新的需求基线和 UI 修订方向。
- 是否延续既有目标：是，延续 `ai-time-management-agent-2026-05-18`。
- revision 规则：本轮属于同一产品生命周期内的需求和 UI 方向修订，不新建产品主流程。

## 输入来源

- 用户对 Figma v0.3 的反馈。
- 用户提供的视频截图。
- 用户提供的 AI 笔记。
- 既有 PRD：`ai-factory/specs/prd/2026-05-18-ai-time-management-agent-prd-draft.md`
- 既有 Design Brief：`ai-factory/specs/design/2026-05-18-ai-time-management-agent-design-brief.md`
- 既有 UI 设计图记录：`ai-factory/specs/design/2026-05-18-ai-time-management-agent-ui-design.md`

## 状态轨迹

| 时间       | 状态                  | 说明                                                                  |
| ---------- | --------------------- | --------------------------------------------------------------------- |
| 2026-05-19 | needs_revision        | 用户反馈顶部、跳转、侧栏和日期需求不清楚                              |
| 2026-05-19 | reference_analyzed    | 基于用户提供的视频截图和 AI 笔记分析参考产品                          |
| 2026-05-19 | direction_confirmed   | 确认从“日历工作台”改为“AI 执行流 + Timeline 强化型”                   |
| 2026-05-19 | domain_boundary_set   | 确认 V1 只做日程管理领域，费用管理作为 DDD 未来领域预留               |
| 2026-05-19 | pipeline_confirmed    | 确认后端负责指令解析、补全、计划、风险分级、确认和执行                |
| 2026-05-19 | information_arch_set  | 确认首页为 AI 执行流，Timeline Drawer、执行记录、完整日历为辅助区域   |
| 2026-05-19 | timeline_confirmed    | 确认 Timeline Drawer 参考 Timepage，默认今天 + 未来 7 天              |
| 2026-05-19 | status_bar_confirmed  | 确认实时执行状态固定在输入框上方                                      |
| 2026-05-19 | revision_docs_created | 写入需求修订方案和 UI 修订方案                                        |
| 2026-05-19 | waiting_for_human     | 等待用户确认修订文档后再重画 Figma                                    |
| 2026-05-19 | confirmed             | 用户确认当前低保真方案符合预期，允许进入文档落地与后续 Figma 重画准备 |

## 人工确认点

| 确认项              | 状态      | 记录                                           |
| ------------------- | --------- | ---------------------------------------------- |
| 首页默认 AI 执行流  | confirmed | 用户选择 A                                     |
| V1 只做日程管理领域 | confirmed | 费用管理仅做架构预留                           |
| V1 能力边界         | confirmed | A + C 必做，轻量 B，D 预留                     |
| 风险分级规则        | confirmed | 低风险直接执行，中风险复述确认，高风险卡片确认 |
| Timeline Drawer     | confirmed | 参考 Timepage，今天 + 未来 7 天                |
| 固定执行状态栏      | confirmed | 放在输入框上方                                 |
| 是否进入 Figma 重画 | confirmed | 用户确认低保真方向符合，后续可按修订文档重画   |

## 输出

- `ai-factory/specs/requirements/2026-05-19-ai-time-management-agent-execution-workbench-revision.md`
- `ai-factory/specs/design/2026-05-19-ai-time-management-agent-ui-revision.md`
- 本运行记录。

## 关键决策

- 产品定位从“AI 时间管理工作台”修订为“AI 日程执行 Agent”。
- 首页主舞台从日历/工作台修订为 AI 执行流。
- Timeline Drawer 是日期上下文抽屉，不是菜单。
- 实时状态固定在输入框上方，避免对话滚动后丢失 AI 当前状态。
- 执行记录是 AI 操作账本，不是聊天历史。
- 日历是结果检查工具，不是主要创建入口。
- 费用管理按 DDD 独立领域预留，不进入 V1。

## 验证

- 已用低保真 HTML 辅助用户确认信息架构。
- 已用低保真 HTML 辅助用户确认 Timepage 风格 Timeline Drawer。
- 已用低保真 HTML 辅助用户确认固定执行状态栏。
- 待运行 `pnpm validate:factory`。
- 待运行 Markdown/JSON 格式检查。

## 记忆更新建议

以下判断应进入 durable memory 候选：

- AI 日程执行 Agent 是产品定位。
- 首页默认 AI 执行流。
- Timeline Drawer 是 Timepage 风格日期上下文抽屉。
- 实时执行状态固定在输入框上方。
- V1 只做日程管理领域，费用管理作为未来 DDD 领域预留。

## 复盘

这次修订说明 UI 不满意并非单纯视觉问题，而是产品主路径和信息架构问题。通过对话和低保真图确认后，方向从“日历工作台”转为“AI 执行流 + Timeline 强化型”。下一步应先确认文档，再重画 Figma。
