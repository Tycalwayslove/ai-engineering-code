# AI 时间管理 Agent H5 UI 工程规格 v0.1

## 状态

- status: draft
- lifecycle id: ai-time-management-agent-2026-05-18
- workflow: `ui-to-code-implementation`
- linkedPrd: `ai-factory/specs/prd/2026-05-18-ai-time-management-agent-prd-draft.md`
- linkedRequirements:
  - `ai-factory/specs/requirements/2026-05-18-ai-time-management-agent-requirements.md`
  - `ai-factory/specs/requirements/2026-05-19-ai-time-management-agent-execution-workbench-revision.md`
- linkedDesign:
  - `ai-factory/specs/design/2026-05-18-ai-time-management-agent-design-brief.md`
  - `ai-factory/specs/design/2026-05-19-ai-time-management-agent-ui-revision.md`
  - `ai-factory/specs/design/2026-05-20-ai-time-management-agent-ui-v0-6-component-based.md`
  - `ai-factory/specs/design/2026-05-20-ai-time-management-agent-theme-system-v0-7.md`
- figma:
  - v0.6: <https://www.figma.com/design/HkZQagTFqRtGaoxwOGcriy?node-id=63-2>
  - v0.7: <https://www.figma.com/design/HkZQagTFqRtGaoxwOGcriy?node-id=65-28>
- created: 2026-05-20

## 背景

AI 时间管理 Agent 已经完成从产品想法、PRD、Design Brief、UI 修订、Figma v0.6 到主题系统 v0.7 的设计链路。

现在进入第一段具体代码实现，但实现范围必须保持薄切片：先把 H5 端的主视觉、布局、状态表达和主题基础跑通，不直接实现真实 AI 日程后端。

## 目标

本次实现一个 H5 首屏薄切片：

- 将 `apps/h5` 首页从工厂状态占位页切换为 AI 时间管理 Agent 主界面。
- 使用 `packages/shared-ui` 中已有组件组合出 Figma v0.6 / v0.7 的核心体验。
- 支持深色 / 浅色主题的静态切换入口。
- 展示 AI 执行流、Timeline Drawer、固定执行状态栏、底部输入栏和确认卡片。
- 使用明确 mock 数据表达状态，不伪装成真实后端。

## 非目标

- 不实现真实 AI 指令解析。
- 不实现真实日程 CRUD。
- 不接入手机系统日历。
- 不接入飞书会议、Things3 或费用管理。
- 不实现账号体系。
- 不实现 Native Bridge。
- 不在 H5 中实现业务编排、冲突判断、计划生成或后端写入。
- 不把所有 Figma 画板一次性做完。

## 影响范围

apps:

- `apps/h5/src/app/page.tsx`
- `apps/h5/src/app/globals.css`
- `apps/h5/src/app/ai-time-agent/demoData.ts`
- `apps/h5/src/app/ai-time-agent/types.ts`
- `apps/h5/src/app/ai-time-agent/components.tsx`

packages:

- `packages/shared-ui/src/composites/*`
- `packages/shared-ui/src/primitives/*`
- `packages/shared-ui/src/layouts/*`
- `packages/shared-ui/src/tokens/*`

python:

- 本次不改。

contracts:

- 本次不改。后续进入 AI 执行接口时再补。

ai-factory:

- 新增 workflow run。
- 更新飞书 / Obsidian 同步记录。

## UI 到代码映射

| Figma / 设计对象           | H5 代码实现                                        | 说明                                     |
| -------------------------- | -------------------------------------------------- | ---------------------------------------- |
| 首页默认态 / AI 执行流     | `apps/h5/src/app/page.tsx`                         | 首页直接展示 Agent 主界面。              |
| Timeline Drawer            | `TimelineDrawer` + `demoData.ts`                   | 初期常驻或可视化展示，不接真实抽屉动画。 |
| 固定执行状态栏             | `ExecutionStatusBar`                               | 固定在输入框上方。                       |
| 底部输入栏                 | `ComposerBar`                                      | 静态展示，不执行真实提交。               |
| 单项确认卡片               | `ConfirmationCard`                                 | mock 一项日程确认。                      |
| 对话气泡                   | `MessageBubble`                                    | 展示用户输入与 AI 追问。                 |
| 顶部按钮                   | `IconButton`                                       | Timeline、执行记录、日历入口。           |
| 深色 / 浅色主题            | `createAiTimeThemeCssVariables(theme)` + CSS class | 初期静态双入口或默认浅色。               |
| 执行记录 / 完整日历 / 详情 | 文案入口或简化面板                                 | 本次不做完整页面跳转。                   |

## 组件边界

### 可以放在 H5 页面层

- 页面组合。
- mock 数据。
- 选中主题。
- 当前展示状态。
- 页面级文案。
- 临时演示布局。

### 可以进入 shared-ui

- 与业务无关、可复用的布局、按钮、气泡、状态条、确认卡片。
- 只依赖 props 和 design tokens 的 UI 组件。

### 不能进入 H5 页面层

- AI 指令解析。
- 日程冲突判断。
- 创建 / 修改 / 删除日程的真实执行逻辑。
- 后端接口请求封装。
- SDK 之外的 fetch 调用。

## 数据策略

本次使用 `demoData.ts` 保存 mock 数据，必须明确命名为 demo。

mock 数据包含：

- `demoConversation`
- `demoTimelineDays`
- `demoConfirmationActions`
- `demoExecutionStatus`
- `demoQuickStats`

mock 数据不得写成 API client，不得模拟真实持久化。

## 主题策略

本次使用 v0.7 主题系统基础：

- `dark` 和 `light` 是当前支持主题。
- 页面通过 CSS variables 应用主题。
- 组件只读取 `aiTimeDesignTokens`。
- 页面不散落 raw hex；必要页面装饰色优先从 token 获取。

## 验收标准

- H5 首页展示 AI 时间管理 Agent 主界面，而不是工厂状态占位页。
- 画面包含顶部入口、AI 执行流、Timeline、确认卡片、固定状态栏和底部输入栏。
- 页面可展示深色 / 浅色主题的效果。
- 代码通过 TypeScript 检查。
- H5 build 通过。
- `pnpm validate:factory` 通过。
- `git diff --check` 通过。

## 后续边界

下一阶段如果继续开发，优先补：

1. 前端页面交互状态。
2. AI 执行协议草案。
3. 后端日程领域最小模型。
4. SDK typed client。
5. 从 mock 数据迁移到 API 数据。

不建议下一步直接接真实 LLM。应先定义确认卡片协议和执行记录协议。
