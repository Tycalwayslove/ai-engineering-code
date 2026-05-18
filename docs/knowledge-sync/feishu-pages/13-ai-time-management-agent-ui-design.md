# 13 AI 时间管理 Agent：UI 设计图草案

## 当前阶段

AI 时间管理 Agent 已从 design brief 进入 UI 设计图草案阶段。

这一步的目标不是开始开发，而是把已经确认的需求和设计输入转成可审阅的界面资产。UI 图必须能追溯到 PRD、Design Brief、Hybrid 边界和人工确认记录。

## Figma 设计图

- 文件名：AI 时间管理 Agent - UI 设计图 v0.1
- 链接：<https://www.figma.com/design/HkZQagTFqRtGaoxwOGcriy>

## 覆盖画板

| 画板                   | 说明                                                          |
| ---------------------- | ------------------------------------------------------------- |
| 00 设计说明 / 来源链路 | 说明 UI 图来自 PRD、Design Brief、Hybrid 约束和人工确认记录。 |
| 01 工作台首页 / 默认态 | 展示首页信息结构：概览、AI 输入、待处理事项和时间对象摘要。   |
| 02 AI 追问 / 信息不足  | 展示 AI 无法安全创建时如何追问缺失字段。                      |
| 03 确认卡片 / 执行前   | 展示日程、待办、提醒写入前的用户确认机制。                    |
| 04 时间对象 / 列表态   | 展示内部日历、待办、提醒三类时间对象的列表入口。              |

## 关键设计判断

### 工作台优先

首页不是纯聊天页，也不是传统日历页，而是工作台。这样可以同时承载 AI 输入、今日时间状态、待确认事项和三类时间对象。

### H5 承载产品变化

工作台、AI 输入、确认卡片、时间对象列表和底部导航都由 H5 控制。原生层主要负责稳定容器、safe area、通知授权、本地能力和未来系统日历桥接。

### 确认卡片建立信任

AI 不静默创建或修改事项。所有执行动作都先转成确认卡片，用户检查后再确认、修改或取消。

### 时间收件箱承接不完整输入

自然语言输入经常缺信息。时间收件箱用于保存待补充、待确认和待同步的事项，避免信息在对话里丢失。

## 面试讲解重点

这个阶段展示的是 AI 原生软件工厂的不同点：设计图不是凭感觉生成的，而是流程化地产生。

从想法到产品理解、需求点、PRD、Design Brief，再到 UI 设计图，每一步都有人工确认、源文件和运行记录。面试官可以看到这个项目不仅是在写代码，而是在搭建一套可追溯的 AI 协作生产流程。

## 当前状态

UI 设计图已经生成，但仍处于人工确认点。

确认后建议先做一轮 UI 评审和修订，再进入工程规格阶段。工程规格阶段需要补齐 H5 页面结构、前端状态模型、Backend action schema、Native Bridge Contract、SDK 接口和本地存储策略。

## 仓库证据

- `ai-factory/specs/design/2026-05-18-ai-time-management-agent-ui-design.md`
- `ai-factory/workflows/ui-design-draft.md`
- `ai-factory/workflows/registries/ui-design-draft.manifest.json`
- `ai-factory/workflows/runs/2026-05-18-ui-design-draft-ai-time-management-agent.md`
