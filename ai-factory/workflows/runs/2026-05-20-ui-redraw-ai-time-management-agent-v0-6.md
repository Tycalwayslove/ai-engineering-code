# Workflow Run：AI 时间管理 Agent Figma v0.6 基于组件库重画

## 记忆类型

- id: run-2026-05-20-ui-redraw-ai-time-management-agent-v0-6
- domain: tasks
- scope: working
- status: waiting_for_human_review
- sourcePath: ai-factory/workflows/runs/2026-05-20-ui-redraw-ai-time-management-agent-v0-6.md
- created: 2026-05-20
- lastReviewed: 2026-05-20

## 运行信息

- workflow id: ui-design-redraw
- run id: 2026-05-20-ai-time-management-agent-v0-6
- lifecycle id: ai-time-management-agent-2026-05-18
- trigger: 用户要求基于当前设计规范绘制新的 UI
- owner: 当前任务负责人
- branch: codex/ai-native-factory-bootstrap

## 输入来源

- 需求修订：`ai-factory/specs/requirements/2026-05-19-ai-time-management-agent-execution-workbench-revision.md`
- UI 修订：`ai-factory/specs/design/2026-05-19-ai-time-management-agent-ui-revision.md`
- 设计系统：`ai-factory/specs/design/2026-05-19-ai-time-management-agent-design-system-v0-5-plan.md`
- 代码组件：`packages/shared-ui/src`
- Figma v0.5：`AI 时间管理 Agent v0.5 Design System`

## 输出

- Figma 文件：<https://www.figma.com/design/HkZQagTFqRtGaoxwOGcriy>
- Figma v0.6 页面：<https://www.figma.com/design/HkZQagTFqRtGaoxwOGcriy?node-id=63-2>
- 页面名：`AI 时间管理 Agent v0.6 Component-Based UI`
- 页面 node id：`63:2`

## 画板清单

| 画板                                   | 说明                                     |
| -------------------------------------- | ---------------------------------------- |
| `00 v0.6 Cover / Component-Based UI`   | 本版目标、组件复用范围和执行流说明。     |
| `01 首页默认态 / AI 执行流`            | 主执行流、补全卡片、固定状态栏和输入区。 |
| `02 Timeline Drawer / Timepage 日期轴` | 日期上下文抽屉。                         |
| `03 信息补全后 / 单项确认`             | 单项创建确认。                           |
| `04 批量操作 / 高风险确认`             | 高风险批量操作确认。                     |
| `05 执行记录 / AI 操作账本`            | AI 操作记录。                            |
| `06 完整日历 / 结果检查`               | 完整日历检查视图。                       |
| `07 事项详情 / 主动点开`               | 用户主动点开后的事项详情。               |
| `08 Interaction Map / v0.6`            | 页面关系和交互规则。                     |

## 校验

- Figma metadata 验证：v0.6 页面和 9 个画板存在。
- Figma screenshot 验证：首页、Timeline Drawer、完整日历和交互关系图可渲染。
- 修复项：完整日历初版出现超过 31 的占位数字，已修正为下月日期并弱化显示。

## 当前状态

v0.6 已生成，等待用户人工评审。

若用户认可，下一步建议进入工程规格，不直接进入业务开发。
