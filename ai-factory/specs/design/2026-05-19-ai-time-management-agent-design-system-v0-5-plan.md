# AI 时间管理 Agent 设计系统 v0.5 计划：本地组件库与图标库

## 元数据

- id: ui-ai-time-management-agent-design-system-001
- kind: design-system-plan
- status: implemented
- lifecycle id: ai-time-management-agent-2026-05-18
- linkedDesign: `ai-factory/specs/design/2026-05-19-ai-time-management-agent-ui-revision.md`
- targetVersion: `v0.5`
- created: 2026-05-19

## 背景

Figma v0.4 已经把产品主路径从“日历工作台”修订为“AI 执行流”。但当前画板仍主要是高保真设计稿，还没有沉淀成本地组件库。

后续进入工程规格和产品开发前，应抽一个独立版本完善设计系统基础，避免 UI 资产、代码组件和图标资源各自漂移。

## v0.5 目标

v0.5 不新增产品功能，不重做产品需求。

v0.5 的目标是建立可复用的本地设计系统基础：

- 明确 AI 时间管理 Agent 的视觉风格和设计令牌。
- 在 Figma 内建立本地组件库。
- 在代码侧建立对应的 shared-ui 组件规划。
- 准备可下载、可追溯、可替换的 icon 图标库。
- 让后续 AI 生成 UI 时优先复用组件，而不是重复画临时样式。

## 实施状态

当前已完成代码侧第一版实施：

- `packages/shared-ui/src/tokens`：新增设计令牌与 CSS 变量映射。
- `packages/shared-ui/src/icons`：新增 React Icon 组件与本地 SVG 图标资产。
- `packages/shared-ui/src/primitives`：新增 Button、IconButton、StatusBadge 等基础组件。
- `packages/shared-ui/src/composites`：新增 ComposerBar、ExecutionStatusBar、MessageBubble、ConfirmationCard、TimelineDrawer。
- `packages/shared-ui/src/layouts`：新增 MobileAgentShell。
- `apps/h5/src/app/design-system/page.tsx`：新增组件库示例页。

仍待后续补齐：

- Figma 本地组件库。
- Figma 组件到代码组件的映射表。
- Code Connect 候选计划。

本阶段验证：

- `pnpm --filter @ai-code/shared-ui typecheck`
- `pnpm --filter @ai-code/h5 typecheck`
- `pnpm typecheck`
- `pnpm --filter @ai-code/h5 build`
- `pnpm validate:factory`
- `curl http://localhost:3000/design-system` 返回 `200`

## 设计系统层级

### 1. 设计风格与令牌

需要沉淀：

- 色彩令牌：背景、表面、文字、边框、成功、警告、危险、AI 执行状态色。
- 字体令牌：标题、正文、标签、状态、按钮。
- 间距令牌：4/8pt 基础间距、卡片内边距、列表间距。
- 圆角令牌：按钮、卡片、状态栏、抽屉。
- 阴影与玻璃材质：只用于控制层和状态层，不滥用在正文内容层。
- 动效令牌：页面跳转、抽屉、确认卡片、状态切换。

### 2. Figma 本地组件库

优先组件：

| 组件                     | 用途                                                                     |
| ------------------------ | ------------------------------------------------------------------------ |
| Icon Button              | 顶部 Timeline、执行记录、完整日历、关闭、返回等按钮。                    |
| Bottom Composer          | 底部输入区，支持语音优先和键盘切换。                                     |
| Fixed Status Bar         | 固定执行状态栏，覆盖理解中、查询中、规划中、待确认、执行中、完成、失败。 |
| Message Bubble           | 用户消息和 AI 消息。                                                     |
| Info Completion Card     | 信息缺失时的追问卡片。                                                   |
| Single Confirmation Card | 单项写入前的确认卡片。                                                   |
| Batch Confirmation Card  | 高风险批量操作确认卡片。                                                 |
| Result Card              | 执行结果卡片。                                                           |
| Timeline Day Row         | Timepage 风格日期行。                                                    |
| Timeline Drawer          | 日期上下文抽屉。                                                         |
| Execution Record Row     | 执行记录列表项。                                                         |
| Calendar Event Block     | 完整日历中的事件块。                                                     |
| Detail Field Row         | 事项详情字段行。                                                         |

组件应带基础状态：

- default
- pressed
- disabled
- selected
- loading
- success
- warning
- error

### 3. 代码侧本地组件库

代码侧建议落到：

- `packages/shared-ui/primitives`
- `packages/shared-ui/composites`
- `packages/shared-ui/layouts`

对应关系：

| Figma 组件           | 代码组件候选         |
| -------------------- | -------------------- |
| Icon Button          | `IconButton`         |
| Bottom Composer      | `ComposerBar`        |
| Fixed Status Bar     | `ExecutionStatusBar` |
| Message Bubble       | `MessageBubble`      |
| Confirmation Card    | `ConfirmationCard`   |
| Timeline Drawer      | `TimelineDrawer`     |
| Execution Record Row | `ExecutionRecordRow` |
| Calendar Event Block | `CalendarEventBlock` |

本阶段只规划组件边界，不直接实现业务逻辑。

### 4. Icon 图标库

需要建立一个可下载、可替换的图标策略：

- 优先选择开源、可商用、可下载的 SVG 图标库。
- 图标必须支持 stroke 宽度统一、深色模式变色和本地打包。
- 图标不得依赖远程运行时加载。
- 后续工程中应通过统一 Icon 组件引用，不在页面里散落 SVG。

候选：

- Lucide Icons：适合产品工具类界面，线性风格统一。
- SF Symbols：适合 iOS 原生层参考，但授权和跨平台使用要单独确认。
- Material Symbols：适合 Android/Material 参考，但不作为第一选择。

第一建议：代码侧使用 Lucide Icons，Figma 侧建立对应图标组件或导入常用 SVG。

## 交付物

v0.5 应交付：

- Figma 本地组件库页面。
- 设计令牌说明。
- 组件命名规则。
- 图标库选择与下载说明。
- Figma 组件到代码组件的映射表。
- `packages/shared-ui` 组件目录规划。
- 后续 Code Connect 候选计划。

## 不进入 v0.5

- 不开始业务功能开发。
- 不实现完整组件代码。
- 不接入真实后端。
- 不建立复杂 design token 编译管线。
- 不引入隐藏生成器或自动组件发现。

## 后续演进

当 v0.5 稳定后，再考虑：

- Figma Code Connect。
- Design token JSON 输出。
- shared-ui 真实组件实现。
- 图标子集自动打包。
- Figma 与代码组件一致性校验。
