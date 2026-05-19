# Workflow Run：AI 时间管理 Agent Figma v0.4 重画

## 记忆类型

- id: run-2026-05-19-ui-redraw-ai-time-management-agent-v0-4
- domain: tasks
- scope: working
- status: waiting_for_human_review
- sourcePath: ai-factory/workflows/runs/2026-05-19-ui-redraw-ai-time-management-agent-v0-4.md
- created: 2026-05-19
- lastReviewed: 2026-05-19

## 运行信息

- workflow id: ui-design-redraw
- run id: 2026-05-19-ai-time-management-agent-v0-4
- lifecycle id: ai-time-management-agent-2026-05-18
- trigger: 用户要求基于已确认方案重画 Figma v0.4，并明确使用 `ui-ux-pro-max` skill
- owner: 当前任务负责人
- branch: codex/ai-native-factory-bootstrap

## 输入来源

- 需求修订：`ai-factory/specs/requirements/2026-05-19-ai-time-management-agent-execution-workbench-revision.md`
- UI 修订：`ai-factory/specs/design/2026-05-19-ai-time-management-agent-ui-revision.md`
- 用户确认：Timeline Drawer 参考 Timepage，固定执行状态栏放在输入框上方
- 技能约束：`ui-ux-pro-max` 移动端触控、安全区、深色对比、状态可见性规则

## 输出

- Figma 文件：<https://www.figma.com/design/HkZQagTFqRtGaoxwOGcriy>
- Figma v0.4 页面：<https://www.figma.com/design/HkZQagTFqRtGaoxwOGcriy?node-id=33-2>
- 页面名：`AI 时间管理 Agent v0.4`
- 页面 node id：`33:2`

## 画板清单

| 画板                                 | 说明                                                           |
| ------------------------------------ | -------------------------------------------------------------- |
| `00 v0.4 Design System & Flow`       | 设计约束、设计令牌和执行流水线说明。                           |
| `01 首页默认态 / AI 执行流`          | 首页默认展示 AI 执行流、顶部三入口、底部输入和固定状态栏。     |
| `02 Timeline Drawer / Timepage 风格` | 日期上下文抽屉，展示今天 + 未来 7 天。                         |
| `03 信息补全 / 缺日期`               | 用户输入不完整时，AI 复述已确定字段并追问。                    |
| `04 单项确认 / 中风险`               | 单项创建或修改前的确认卡片。                                   |
| `05 批量确认 / 高风险`               | 批量或清空类操作的高风险确认卡片。                             |
| `06 固定状态栏 / 多状态`             | 展示理解中、查询中、规划中、待确认、执行中、完成、失败等状态。 |
| `07 执行结果 / 已完成`               | 执行完成后的结果卡片。                                         |
| `08 执行记录 / AI 操作账本`          | 审计 AI 最近做了什么。                                         |
| `09 完整日历 / 结果检查`             | 日历作为结果检查和日期定位工具。                               |
| `10 事项详情 / 主动点开`             | 用户主动查看事项详情时使用。                                   |
| `11 v0.4 Interaction Map`            | 页面关系和交互规则说明。                                       |

## 原型交互

已绑定 16 个基础可点击原型入口：

- 首页到 Timeline Drawer、执行记录、完整日历、信息补全、执行结果。
- Timeline Drawer 关闭或选择日期返回首页。
- 信息补全选择今天/明天进入单项确认。
- 单项确认和批量确认进入执行结果。
- 执行结果、执行记录、日历事件进入事项详情。
- 详情页返回结果或继续对话回首页。

## 校验

- Figma 页面结构校验：12 个画板。
- Figma 原型交互校验：16 个带 reaction 的节点。
- 截图校验：已生成整页截图、首页截图和批量确认截图。
- 修复项：首页确认卡片初版与固定状态栏距离过近，已压缩为紧凑确认卡片。

## 当前状态

v0.4 已生成，等待用户人工评审。

若用户确认 v0.4 方向，再进入下一步工程规格，不直接进入产品开发。
