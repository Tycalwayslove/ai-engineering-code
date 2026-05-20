# Workflow Run：Hybrid H5 / iOS / Android 布局实现

## 元数据

- id: run-2026-05-20-hybrid-host-layout-implementation
- workflow: `ui-to-code-implementation`
- component workflow: `component-library-maintenance`
- status: synced
- owner: Codex
- created: 2026-05-20
- updated: 2026-05-20
- trigger: 用户确认开始具体代码开发，先整合 Hybrid H5 / iOS / Android 对应布局和样式

## 输入

- UI 来源：AI 时间管理 Agent v0.7 Theme Modes、v0.6 Component-Based UI、当前 H5 首屏薄切片。
- 产品边界：Native 壳稳定，H5 负责产品界面，后续再接真实 Native Bridge。
- 实现范围：
  - shared-ui 增加 Hybrid 宿主布局壳。
  - H5 首页增加 H5 / iOS / Android 宿主预览切换。
  - 保留深色 / 浅色主题。
  - 不接业务后端。
- 非目标：
  - 不创建 iOS / Android 原生工程。
  - 不实现真实 Bridge。
  - 不实现 AI 指令解析。

## 输出

- `packages/shared-ui/src/layouts/HybridHostShell.tsx`
- `packages/shared-ui/src/layouts/MobileAgentShell.tsx`
- `apps/h5/src/app/ai-time-agent/components.tsx`
- `apps/h5/src/app/ai-time-agent/hybridHost.contract.test.ts`
- `apps/h5/src/app/globals.css`
- `apps/h5/src/app/design-system/page.tsx`
- `ai-factory/specs/engineering/2026-05-20-ai-time-management-agent-hybrid-layout-v0-1.md`

## 状态转换

- `not_started` -> `context_loaded`：读取 H5 页面、shared-ui layouts、设计系统示例页和现有契约测试。
- `context_loaded` -> `engineering_spec_drafted`：明确宿主差异只进入布局层和安全区变量。
- `engineering_spec_drafted` -> `implementation_plan_drafted`：确认先做 Hybrid 宿主薄切片。
- `implementation_plan_drafted` -> `in_progress`：先写失败契约测试，再实现 shared-ui 和 H5 页面。

## 人工确认点

用户已确认按推荐方案实现。当前变更只涉及布局和样式基础，不改变业务功能和后端契约。

## 失败处理

- 如果 typecheck 失败，先修复 shared-ui 导出和 H5 类型契约。
- 如果移动布局溢出，优先修复 `HybridHostShell` 与 `MobileAgentShell` 的高度和安全区。
- 如果视觉检查发现宿主切换不清晰，先调整开发态预览控制，不改变业务组件。

## 验证记录

已完成：

- `pnpm --filter @ai-code/h5 typecheck` 在实现前失败，确认契约有效。
- `pnpm --filter @ai-code/h5 typecheck` 在 shared-ui 导出后通过。
- `pnpm --filter @ai-code/shared-ui typecheck` 在 shared-ui 导出后通过。
- `pnpm --filter @ai-code/h5 build`
- `pnpm --filter @ai-code/h5 lint`
- `pnpm --filter @ai-code/h5 test`
- `pnpm validate:factory`
- `pnpm exec prettier --check "**/*.{md,json,yml,yaml,ts,tsx,mjs,css}"`
- `git diff --check`
- `curl -I http://127.0.0.1:3000/`
- `curl -I http://127.0.0.1:3000/design-system`
- 临时 `next start --port 3001` 生产服务器浏览器检查：
  - 初始宿主：`ios`
  - 点击 Android 后页面宿主：`android`
  - 点击浅色后主题：`浅色`
  - 固定状态栏与底部输入可见

备注：

- 既有 `localhost:3000` dev server 存在 HMR WebSocket 握手异常，页面可渲染但自动化点击状态未更新。
- 未终止既有 dev server；使用临时 `next start --port 3001` 完成干净构建产物验证后已关闭。
