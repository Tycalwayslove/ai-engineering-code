# Workflow Run：AI 时间管理 Agent 产品理解

## 记忆类型

- id: run-2026-05-18-idea-to-product-understanding-ai-time-management-agent
- domain: tasks
- scope: working
- status: active
- sourcePath: ai-factory/workflows/runs/2026-05-18-idea-to-product-understanding-ai-time-management-agent.md
- created: 2026-05-18
- lastReviewed: 2026-05-18

## 运行信息

- workflow id: idea-to-product-understanding
- run id: 2026-05-18-ai-time-management-agent
- parent run id:
- lifecycle id: ai-time-management-agent-2026-05-18
- trigger: 用户提出第一个正式产品方向：通过 AI 对话实现日程和时间管理的 App
- owner: 当前任务负责人
- branch: codex/ai-native-factory-bootstrap

## 流程实例边界

- 主目标：将“AI 对话式日程管理 App”整理为可确认的产品理解。
- 是否延续既有目标：否，这是该产品方向的第一个主流程实例。
- 如果是子流程，链接回：无。
- revision 规则：围绕该产品方向的定位、需求、设计、Hybrid 边界和 UI 调整，都记录在同一生命周期内，不因对话轮次新建主流程。

## 输入来源

- 用户原始想法：通过 AI 对话实现日程管理，原生壳子 + H5 内容。
- 用户补充：大方向使用个人时间管理 Agent。
- 用户补充：不能只根据待办和日历生成事项，AI 也要能创建日程。
- 用户确认：App 内部日历先跑通，后续再接手机日历。
- 用户确认：待办等对象需要具备扩展性，后续可接飞书会议、Things3 等工具。
- 用户确认：第一版包含日程、待办、提醒。
- 用户确认：信息不足时 AI 追问。
- 用户确认：执行前必须展示确认卡片。
- 用户确认：首页采用工作台为主。
- 用户修正：布局必须考虑 Hybrid 和原生 App 的交互，原生层应尽量稳定少改。
- 用户确认：原生层稳定，H5 负责主要产品流程，二者通过显式 Bridge Contract 通信。
- 用户确认：数据策略采用本地优先 + 关键结构同步后端。
- 用户确认：AI 策略采用规则 + LLM 混合。
- 用户确认：第一版不做语音输入。

## 范围

- 包含：Intake 记录、产品理解草案、工作流运行记录。
- 不包含：需求点记录、PRD、设计 brief、UI 设计图、工程规格、产品功能开发。

## 状态轨迹

| 时间       | 状态                  | 说明                                             |
| ---------- | --------------------- | ------------------------------------------------ |
| 2026-05-18 | not_started           | 用户提出第一个正式产品方向                       |
| 2026-05-18 | intake                | 捕获原始想法和对话澄清                           |
| 2026-05-18 | context_loaded        | 读取规格生命周期、产品理解模板和 workflow 模板   |
| 2026-05-18 | understanding_drafted | 生成产品理解草案                                 |
| 2026-05-18 | waiting_for_human     | 等待用户确认产品理解是否准确，是否进入需求点记录 |

## 人工确认点

| 确认项                           | 状态    | 记录 |
| -------------------------------- | ------- | ---- |
| 产品方向是否准确                 | pending |      |
| 第一版范围是否准确               | pending |      |
| Native/H5/Bridge 边界是否准确    | pending |      |
| 是否允许进入 requirement-capture | pending |      |

## 输出

- `ai-factory/specs/intake/2026-05-18-ai-time-management-agent.md`
- `ai-factory/specs/product-understanding/2026-05-18-ai-time-management-agent-product-understanding.md`

## 验证

- 已运行 `pnpm validate:factory`。
- 已运行 Markdown 格式检查。

## 记忆更新建议

- 如果用户确认该方向，可将“第一个正式产品方向是 AI 时间管理 Agent”作为 durable product 候选。
- 如果用户确认 Hybrid 边界，可将“原生层稳定、H5 承担产品体验、Bridge Contract 显式通信”作为 durable architecture 或 decisions 候选。
- 未确认前不得写入 durable memory。

## 复盘

- 这是第一个正式产品方向的产品理解流程。
- 当前停止在 `waiting_for_human`，等待用户确认。
