# AI 时间管理 Agent Hybrid 布局工程规格 v0.1

## 元数据

- id: engineering-ai-time-management-agent-hybrid-layout-001
- kind: engineering-spec
- status: implemented
- lifecycle id: ai-time-management-agent-2026-05-18
- linked workflow: `ui-to-code-implementation`
- linked component workflow: `component-library-maintenance`
- created: 2026-05-20

## 背景

AI 时间管理 Agent 的产品形态是 Hybrid App：Native 提供稳定壳和系统能力，H5 承载主要产品界面。进入更深的产品代码前，需要先把 H5 / iOS / Android 三类宿主布局稳定下来。

本规格只处理布局和样式基础，不实现真实 Native Bridge、日程写入、AI 解析或跨端工程。

## 目标

- 首页可以在 H5、iOS、Android 三种宿主模式下预览。
- H5 主内容继续复用 shared-ui 组件。
- iOS / Android 差异只影响宿主外框、安全区、预览 chrome 和容器尺寸。
- 主题系统继续支持深色和浅色。
- Timeline 仍作为辅助检查区，不成为业务编排入口。

## 非目标

- 不创建真实 iOS 工程代码。
- 不创建真实 Android 工程代码。
- 不接 Native Bridge。
- 不接真实后端。
- 不新增产品业务状态机。
- 不把宿主平台判断散落到业务组件内部。

## 分层

### Native Host Frame

代码入口：`packages/shared-ui/src/layouts/HybridHostShell.tsx`

职责：

- 声明 `h5`、`ios`、`android` 三种宿主平台。
- 为预览模式提供宿主外框。
- 设置 `--ai-host-safe-top` 和 `--ai-host-safe-bottom`。
- 保持宿主差异可见，但不模拟真实系统能力。

### H5 Agent Surface

代码入口：`apps/h5/src/app/ai-time-agent/components.tsx`

职责：

- 组合 AI 日程执行首页。
- 提供开发态宿主切换。
- 将 `MobileAgentShell` 放入 `HybridHostShell`。
- 继续使用 mock 数据。

### Shared UI Layout

代码入口：`packages/shared-ui/src/layouts/MobileAgentShell.tsx`

职责：

- 固定 header、滚动内容、执行状态栏和底部输入。
- 消费宿主安全区变量。
- 不关心当前是 iOS、Android 还是 H5。

## 验收标准

- TypeScript 能识别 `HybridHostPlatform` 和 `hybridHostPlatforms`。
- H5 首页可切换 H5 / iOS / Android 宿主模式。
- H5 首页可切换深色 / 浅色主题。
- 状态栏仍固定在输入区上方。
- 构建通过。
- 工厂校验通过。

## 验证命令

- `pnpm --filter @ai-code/h5 typecheck`
- `pnpm --filter @ai-code/shared-ui typecheck`
- `pnpm --filter @ai-code/h5 build`
- `pnpm validate:factory`
- `pnpm exec prettier --check "**/*.{md,json,yml,yaml,ts,tsx,mjs,css}"`
- `git diff --check`
