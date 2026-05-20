# AI 时间管理 Agent v0.7：浅色模式与主题系统基础

## 元数据

- id: theme-ai-time-management-agent-001
- kind: design-system-theme
- status: generated
- lifecycle id: ai-time-management-agent-2026-05-18
- linkedDesignSystem: `ai-factory/specs/design/2026-05-19-ai-time-management-agent-design-system-v0-5-plan.md`
- linkedUi: `ai-factory/specs/design/2026-05-20-ai-time-management-agent-ui-v0-6-component-based.md`
- created: 2026-05-20
- figmaFileKey: `HkZQagTFqRtGaoxwOGcriy`
- figmaV07Page: `AI 时间管理 Agent v0.7 Theme Modes`
- figmaV07Node: `65:28`
- figmaV07Url: <https://www.figma.com/design/HkZQagTFqRtGaoxwOGcriy?node-id=65-28>

## 背景

v0.6 的 UI 主要验证深色模式下的 AI 执行流、Timeline Drawer、确认卡片和日历检查层。用户指出：产品不应只有深色模式，后续还可能增加更多主题。

因此 v0.7 不把浅色模式当作单张补图，而是把颜色体系升级为主题系统基础。

## 目标

- 增加浅色模式 UI 参考。
- 保留深色模式作为沉浸执行场景。
- 让组件读取语义 token，而不是直接读取固定深色值。
- 为后续更多主题保留 mode 扩展方式。

## 主题原则

1. 主题不改变产品信息架构。
2. 主题不改变组件 API。
3. 组件只消费语义 token。
4. 新主题只新增 token values 和 Figma mode。
5. 每次主题新增都必须同步 Figma、代码、Obsidian、飞书和 Git 提交。

## 当前主题

| 主题    | 使用场景                         | 设计判断                                   |
| ------- | -------------------------------- | ------------------------------------------ |
| `dark`  | 沉浸式对话、夜间使用、高专注流程 | 背景更暗，强调执行流和确认卡片。           |
| `light` | 白天、办公、长时间阅读、面试展示 | 背景更轻，降低品牌绿刺激度，提高阅读舒适。 |

## Figma 输出

Figma v0.7 页面包含：

| 画板                                         | 说明                             |
| -------------------------------------------- | -------------------------------- |
| `00 v0.7 Theme System / Cover`               | 主题系统目标、原则和当前模式。   |
| `01 Light 首页默认态 / AI 执行流`            | 浅色首页主舞台。                 |
| `02 Light Timeline Drawer / Timepage 日期轴` | 浅色 Timepage 风格日期轴。       |
| `03 Light 确认与执行记录`                    | 浅色确认卡片和固定状态栏。       |
| `04 Theme Tokens / Dark Light Modes`         | Dark / Light 语义 token 对照表。 |
| `05 Theme Expansion Map / v0.7`              | 未来主题扩展路径。               |

同时新增 Figma 变量集合：

- collection: `AI Time Theme Tokens`
- modes: `Dark`, `Light`
- color variables: 25 个语义色彩变量

## 代码输出

`packages/shared-ui` 已从固定深色 token 升级为主题变量模型：

- `aiTimeThemeValues` 保存 `dark` 和 `light` 的真实值。
- `aiTimeDesignTokens` 暴露 CSS variable 引用和 fallback。
- `createAiTimeThemeCssVariables(theme)` 生成主题 CSS 变量。
- 组件继续读取 `aiTimeDesignTokens`，不感知具体主题名称。
- H5 `/design-system` 示例页新增深色与浅色并排预览。

## 后续

如果用户认可 v0.7，下一步可以进入工程规格：

- 定义 H5 主题切换入口。
- 定义主题持久化策略。
- 定义系统主题跟随规则。
- 定义高对比主题和低动效主题是否进入近期范围。
