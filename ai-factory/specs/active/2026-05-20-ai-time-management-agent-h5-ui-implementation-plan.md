# AI 时间管理 Agent H5 UI Thin Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox syntax for tracking.

## Goal

把已经确认的 Figma v0.6 / v0.7、设计系统和 H5 工程规格，落成 `apps/h5` 的第一版可运行首屏薄切片。

这次只实现 UI 和演示状态，不实现真实 AI 解析、真实日程写入或 Native Bridge。

## Architecture

实现路径保持薄客户端原则：

```text
apps/h5
  -> route-local demo data
  -> route-local page composition
  -> packages/shared-ui
  -> design tokens / CSS variables
```

H5 页面只负责展示和局部交互状态。后端 AI 编排、日程领域模型、SDK 请求和 Native Bridge 都保留后续接入点，不在本次实现中伪造。

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- `@ai-code/shared-ui`
- CSS variables
- pnpm workspace

## Source Inputs

- 工程规格：`ai-factory/specs/engineering/2026-05-20-ai-time-management-agent-h5-ui-engineering-v0-1.md`
- Figma v0.6：<https://www.figma.com/design/HkZQagTFqRtGaoxwOGcriy?node-id=63-2>
- Figma v0.7：<https://www.figma.com/design/HkZQagTFqRtGaoxwOGcriy?node-id=65-28>
- 设计系统源码：`packages/shared-ui/src`
- H5 入口：`apps/h5/src/app/page.tsx`

## Non-Goals

- 不实现登录。
- 不接入真实后端。
- 不接入 LLM。
- 不接入手机日历。
- 不接入飞书会议、Things3 或费用管理。
- 不做完整路由跳转。
- 不把 mock 数据包装成 SDK 或 API。

## Task 1：新增 H5 路由局部类型和 mock 数据

- [x] 新建 `apps/h5/src/app/ai-time-agent/types.ts`
- [x] 定义 `AgentTheme`、`ConversationMessage`、`QuickStat`、`ExecutionLedgerItem`
- [x] 从 shared-ui 复用 `TimelineDay`、`ConfirmationAction` 等已有类型
- [x] 新建 `apps/h5/src/app/ai-time-agent/demoData.ts`
- [x] 添加 `demoConversation`
- [x] 添加 `demoTimelineDays`
- [x] 添加 `demoConfirmationActions`
- [x] 添加 `demoExecutionStatus`
- [x] 添加 `demoQuickStats`
- [x] 添加 `demoLedgerItems`

### Acceptance

- mock 数据命名明确包含 `demo`
- 数据不包含 API client、不包含 fetch、不包含持久化假象
- `pnpm --filter @ai-code/h5 typecheck` 通过

## Task 2：新增 H5 页面组合组件

- [x] 新建 `apps/h5/src/app/ai-time-agent/components.tsx`
- [x] 添加 `"use client"`，只用于主题切换和演示态
- [x] 实现 `AgentWorkbench`
- [x] 实现 `AgentHeader`
- [x] 实现 `ThemeSwitcher`
- [x] 实现 `ConversationPanel`
- [x] 实现 `QuickStats`
- [x] 实现 `ExecutionLedgerPreview`
- [x] 实现 `TimelinePanel`
- [x] 使用 `MobileAgentShell`
- [x] 使用 `IconButton`
- [x] 使用 `MessageBubble`
- [x] 使用 `ExecutionStatusBar`
- [x] 使用 `ComposerBar`
- [x] 使用 `ConfirmationCard`
- [x] 使用 `TimelineDrawer`
- [x] 使用 `StatusBadge`
- [x] 使用 `createAiTimeThemeCssVariables(theme)`

### Acceptance

- 组件只组合 UI 和演示状态
- 不出现业务编排逻辑
- 不出现后端 endpoint
- 不出现随机读取 `ai-factory` 文件
- H5 页面能展示深色 / 浅色主题切换

## Task 3：替换 H5 首页入口

- [x] 修改 `apps/h5/src/app/page.tsx`
- [x] 移除当前工厂状态占位页逻辑
- [x] 渲染 `AgentWorkbench`
- [x] 保持页面入口简单，不新增产品无关说明
- [x] 如需调整标题，修改 `apps/h5/src/app/layout.tsx`

### Acceptance

- `/` 首屏就是 AI 时间管理 Agent UI
- 首页不再展示工厂状态面板
- 工厂状态能力仍保留在 Admin 或后续独立入口，不在本次删除后端能力

## Task 4：补齐 H5 页面样式

- [x] 修改 `apps/h5/src/app/globals.css`
- [x] 添加 `.ai-agent-*` 页面级布局类
- [x] 固定状态栏在输入区上方
- [x] Timeline 区域在桌面预览下可见，在移动尺寸下保持主体验优先
- [x] 使用 CSS variables 承接主题 token
- [x] 避免页面中散落 raw hex；确需装饰值时先使用已有 token

### Acceptance

- 不出现文字重叠
- 不出现输入区遮挡执行状态
- 深色 / 浅色主题都能读清主要文字
- 布局符合 Hybrid H5 内容层，不依赖底部 tab

## Task 5：验证与记录

- [x] 运行 `pnpm exec prettier --write` 覆盖本次改动文件
- [x] 运行 `pnpm --filter @ai-code/h5 typecheck`
- [x] 运行 `pnpm --filter @ai-code/h5 build`
- [x] 运行 `pnpm validate:factory`
- [x] 运行 `git diff --check`
- [x] 如 dev server 未运行，启动 `pnpm dev:h5`
- [x] 尝试使用 in-app browser 查看 H5 首页，并使用 Chrome fallback 完成检查
- [x] 记录截图或人工检查结论
- [x] 更新 workflow run 状态
- [x] 同步 Obsidian 和飞书
- [x] 使用中文 Conventional Commit 提交

### Acceptance

- 所有验证命令通过
- H5 首页能在浏览器中打开
- 过程记录可追踪到工程规格、实施计划和 workflow run

## Risks

- **风险：把 mock 写成真实接口。** 规避方式：所有演示数据集中在 `demoData.ts`，命名明确。
- **风险：H5 页面承担业务编排。** 规避方式：页面只处理主题切换和演示态。
- **风险：视觉与组件库再次漂移。** 规避方式：优先使用 `packages/shared-ui`，缺口再补共享组件。
- **风险：一次性实现太多页面。** 规避方式：本次只做首页薄切片，其他画板作为后续任务。

## Execution Notes

这份计划生成后，下一阶段可以直接执行 Task 1 到 Task 5。

如果执行中发现 shared-ui 缺少必要组件，优先在 `packages/shared-ui` 中补可复用能力；如果只是首页一次性布局，留在 `apps/h5` 页面层。

## Implementation Result

- H5 首页已替换为 AI 时间管理 Agent 首屏薄切片。
- 新增 route-local demo data、类型契约测试和页面组合组件。
- 深色 / 浅色主题切换已接入 v0.7 theme tokens。
- 固定执行状态栏位于底部输入栏上方。
- Timeline 在桌面预览区展示，移动宽度下优先展示主执行流。
- 浏览器检查：in-app browser 自动化打开 localhost 被当前环境拦截，Chrome 打开 `http://localhost:3000/` 验证通过。
