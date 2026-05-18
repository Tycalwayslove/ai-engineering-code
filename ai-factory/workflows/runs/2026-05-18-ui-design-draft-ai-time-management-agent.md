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

| 时间       | 状态                 | 说明                                  |
| ---------- | -------------------- | ------------------------------------- |
| 2026-05-18 | not_started          | 用户确认 design brief                 |
| 2026-05-18 | intake               | 读取 PRD、design brief 和设计系统规则 |
| 2026-05-18 | design_brief_checked | 确认 design brief 已接受              |
| 2026-05-18 | figma_created        | 创建 Figma 文件                       |
| 2026-05-18 | ui_drafted           | 生成 5 个核心画板                     |
| 2026-05-18 | waiting_for_human    | 等待用户确认或提出修订意见            |

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

## 验证

- 已创建 Figma 文件和核心画板。
- 已运行 `pnpm validate:factory`。
- 已运行 Markdown/JSON 格式检查。

## 记忆更新建议

- 如果 UI 方向被用户确认，可将“工作台优先”和“确认卡片作为信任机制”进入 durable design 候选。
- 如果 Hybrid 边界继续被确认，可将 Native/H5 分工进入 durable architecture 或 decisions 候选。
- 未确认前不写入 durable memory。

## 复盘

- 这是 AI 时间管理 Agent 从需求资产进入设计资产的第一张 UI 图。
- 当前仍处于人工确认点，不进入工程实现。
