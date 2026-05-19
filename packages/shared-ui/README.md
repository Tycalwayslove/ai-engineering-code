# 共享 UI

## 目的

- 为 TypeScript 应用提供可复用 React UI 基础组件。
- 沉淀 AI 时间管理 Agent v0.5 的设计令牌、图标、基础组件、组合组件和移动端布局。
- 让应用优先复用组件库，而不是在页面里散落临时样式。

## 所有权

- 设计系统维护者拥有导出组件和属性兼容性。
- 产品应用团队可在重复 UI 模式出现后提议新增内容。

## 依赖边界

- 可以将 React 作为 peer dependency。
- 不得依赖应用、SDK 客户端、后端服务或 AI 工厂运行时文件。
- 基础组件必须比组合组件和布局更低层。
- 组合组件只表达稳定交互模式，不拥有业务状态机、网络请求或 AI 工作流。
- 图标以本地 SVG 和 React `Icon` 组件双形态保留，不依赖远程运行时加载。

## 当前结构

```text
src/
  tokens/       # 设计令牌与 CSS 变量映射
  icons/        # React Icon 组件与可下载 SVG 资产
  primitives/   # Button、IconButton、StatusBadge 等基础组件
  composites/   # ComposerBar、ConfirmationCard、TimelineDrawer 等组合组件
  layouts/      # MobileAgentShell 等共享布局
```

## 使用示例

```tsx
import {
  ComposerBar,
  ExecutionStatusBar,
  MobileAgentShell,
} from "@ai-code/shared-ui";

export function AgentScreen() {
  return (
    <MobileAgentShell
      bottom={<ComposerBar />}
      status={<ExecutionStatusBar status="executing" description="正在规划" />}
    >
      ...
    </MobileAgentShell>
  );
}
```

H5 示例页：

- `apps/h5/src/app/design-system/page.tsx`
- 本地运行后访问 `/design-system`

## 演进路径

- v0.5 先建立组件库最小骨架和示例页。
- v0.6 再根据真实 UI 评审补充状态、可访问性测试和视觉回归。
- 进入工程实现前，再考虑 Figma Code Connect 与设计令牌 JSON 输出。
