# Workflow Run：AI 时间管理 Agent UI 设计图草案

## 记忆类型

- id: run-2026-05-18-ui-design-draft-ai-time-management-agent
- domain: tasks
- scope: working
- status: waiting_for_human
- sourcePath: ai-factory/workflows/runs/2026-05-18-ui-design-draft-ai-time-management-agent.md
- created: 2026-05-18
- lastReviewed: 2026-05-18

## 运行信息

- workflow id: ui-design-draft
- run id: 2026-05-18-ai-time-management-agent-ui-design
- parent run id: 2026-05-18-ai-time-management-agent-design-brief
- lifecycle id: ai-time-management-agent-2026-05-18
- trigger: 用户确认 design brief，并允许进入 UI 设计图阶段
- owner: 当前任务负责人
- branch: codex/ai-native-factory-bootstrap

## 流程实例边界

- 主目标：将已确认 design brief 转成可审阅的 UI 设计图草案。
- 是否延续既有目标：是，延续 `ai-time-management-agent-2026-05-18`。
- 如果是子流程，链接回：`2026-05-18-ai-time-management-agent-design-brief`。
- revision 规则：用户对 UI 布局、交互状态和画板内容的修改建议仍属于本流程，不因对话轮次新建主流程。

## 输入来源

- Design Brief：`ai-factory/specs/design/2026-05-18-ai-time-management-agent-design-brief.md`
- PRD：`ai-factory/specs/prd/2026-05-18-ai-time-management-agent-prd-draft.md`
- 需求点记录：`ai-factory/specs/requirements/2026-05-18-ai-time-management-agent-requirements.md`
- UI 审查清单：`ai-factory/design-system/patterns/ui-review-checklist.md`
- 组件层级：`ai-factory/design-system/components/component-layering.md`

## 范围

- 包含：Figma 文件、核心画板、设计判断、待确认点和下一步建议。
- 不包含：工程规格、开发实施、最终视觉规范、外部日历接入、账号体系。

## 状态轨迹

| 时间       | 状态                 | 说明                                                     |
| ---------- | -------------------- | -------------------------------------------------------- |
| 2026-05-18 | not_started          | 用户确认 design brief                                    |
| 2026-05-18 | intake               | 读取 PRD、design brief 和设计系统规则                    |
| 2026-05-18 | design_brief_checked | 确认 design brief 已接受                                 |
| 2026-05-18 | figma_created        | 创建 Figma 文件                                          |
| 2026-05-18 | ui_drafted           | 生成 5 个核心画板                                        |
| 2026-05-18 | waiting_for_human    | 等待用户确认或提出修订意见                               |
| 2026-05-18 | needs_revision       | 用户反馈 UI 效果未达预期                                 |
| 2026-05-18 | ui_drafted           | 安装并使用 `ui-ux-pro-max` 重画 v0.2                     |
| 2026-05-18 | waiting_for_human    | 等待用户确认 v0.2 或继续修订                             |
| 2026-05-18 | needs_revision       | 用户要求 iOS 26 风格、无底部 tab、底部输入、左侧面板     |
| 2026-05-18 | ui_drafted           | 基于 `ui-ux-pro-max` 和 Apple Liquid Glass 指南重画 v0.3 |
| 2026-05-18 | waiting_for_human    | 等待用户确认 v0.3 或继续修订                             |
| 2026-05-18 | ui_drafted           | 用户接受当前效果，继续补齐细节交互和其他页面             |
| 2026-05-18 | prototype_wired      | 在 Figma v0.3 中补充可点击原型交互                       |
| 2026-05-18 | waiting_for_human    | 等待用户确认原型是否足够进入工程规格                     |

## 人工确认点

| 确认项                             | 状态    | 记录   |
| ---------------------------------- | ------- | ------ |
| UI 图是否表达了 design brief       | pending | 待确认 |
| 工作台首页结构是否合理             | pending | 待确认 |
| AI 追问状态是否清晰                | pending | 待确认 |
| 确认卡片是否足够支撑执行前信任机制 | pending | 待确认 |
| 是否进入工程规格阶段               | pending | 待确认 |

## 输出

- `ai-factory/specs/design/2026-05-18-ai-time-management-agent-ui-design.md`
- Figma：<https://www.figma.com/design/HkZQagTFqRtGaoxwOGcriy>
- 当前页面：`AI 时间管理 Agent v0.3`

## 修订记录

### v0.1

- 产出 5 个基础 UI 画板。
- 问题：更像流程说明稿，真实 App 质感不足。

### v0.2

- 使用 `ui-ux-pro-max` skill 重新校准设计方向。
- 采用 Soft UI Evolution、日历蓝 + 执行绿、移动端工作台结构。
- 重画 5 个高保真手机画板：工作台首页、AI 创建、信息追问、执行确认、时间对象。

### v0.3

- 用户继续反馈 v0.2 未达预期，并明确要求 iOS 26 风格、无底部 tab、底部输入、顶部 header、左上角侧滑面板、类似千问 App。
- 使用 `ui-ux-pro-max` 查询 Liquid Glass、AI-native UI、移动端输入和触控规则。
- 参考 Apple 官方 iOS 26 / Liquid Glass 指南：玻璃材质只用于控制与导航层，不滥用在内容层。
- 重画 5 个手机画板：主界面、侧滑面板、创建日程、无 tab 内容区、深色模式。
- 用户接受当前效果后，继续补齐 8 个细节画板：对象详情、编辑 sheet、时间收件箱、内部日历、待办与提醒、连接器与权限、通知授权、状态覆盖。
- 用户询问是否能在 Figma 上直接增加交互后，补充 67 个可点击热区，并设置原型入口 `AI 时间管理 Agent v0.3 原型入口`。
- 原型交互覆盖：打开侧滑面板、创建日程、确认创建、进入详情、编辑 sheet、侧栏导航、时间收件箱、内部日历、待办/提醒、连接器权限和状态恢复。
- 为保持阶段轻量，侧滑面板和编辑 sheet 先用状态画板跳转表达，不引入复杂 overlay 变量或组件状态。
- 当前仍停在人工确认点，不进入工程实现。

## 验证

- 已创建 Figma v0.3 页面和核心画板。
- 已截图核对主界面与侧滑面板，确认非空且底部 tab 已移除。
- 已截图核对对象详情与状态覆盖页，确认页面非空且布局没有明显遮挡。
- 已通过 Figma API 校验当前页面原型入口和交互覆盖，交互节点数为 67。
- 已运行 `pnpm validate:factory`。
- 已运行 Markdown/JSON 格式检查。

## 记忆更新建议

- 如果 UI 方向被用户确认，可将“工作台优先”和“确认卡片作为信任机制”进入 durable design 候选。
- 如果 Hybrid 边界继续被确认，可将 Native/H5 分工进入 durable architecture 或 decisions 候选。
- 未确认前不写入 durable memory。

## 复盘

- 这是 AI 时间管理 Agent 从需求资产进入设计资产的第一张 UI 图。
- 当前仍处于人工确认点，不进入工程实现。
