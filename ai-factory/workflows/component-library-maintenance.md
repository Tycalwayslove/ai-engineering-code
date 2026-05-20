# 组件库维护工作流

## 目的

将设计系统、Figma 组件、本地 `packages/shared-ui` 组件和产品页面之间的变更，纳入一条可审计的维护流程。

该工作流解决的问题是：组件库不是一次性资产。后续新增组件、调整 token、修复浅色模式问题、同步 Figma 组件或修复页面视觉 bug 时，都必须知道变更从哪里来、影响哪些页面、需要更新哪些记录，以及如何验证没有造成新的漂移。

## 工作流声明

- id: `component-library-maintenance`
- owner: 当前任务负责人
- trigger: 人工触发
- execution: 手动运行，不得自动执行
- discovery: 不得动态扫描 Figma、组件目录、设计系统或记忆目录
- source: Figma + Markdown + codebase

## 人工触发方式

人类在任务上下文中明确提出类似请求时才可启动：

```text
请按 component-library-maintenance 工作流，完善 / 调整 / 修复 <组件、token、图标或组件库文档>。
```

常见触发语义：

- 完善组件库。
- 新增一个共享组件。
- 修复 Button 在浅色模式下的对比度。
- 同步 Figma 组件到 `packages/shared-ui`。
- 调整 AI 时间管理 Agent 的主题 token。
- 更新组件库 Gallery 或 Changelog。

## 输入

必需输入：

- 变更类型：`component-addition`、`component-adjustment`、`token-change`、`icon-change`、`bugfix`、`figma-sync` 或 `documentation-only`。
- 变更对象：组件、token、图标、Figma 节点、设计系统页面或代码路径。
- 变更原因：用户反馈、UI 图差异、实现缺口、视觉回归、可访问性问题或工程维护。
- 影响范围：涉及哪些产品页面、Figma 组件、shared-ui 组件、主题或图标。
- 验收方式：截图检查、类型检查、构建、组件示例页、Figma Gallery、人工评审或知识库同步。

可选输入：

- 对应 PRD、design brief、UI revision 或工程规格。
- Figma 页面、节点 ID 或截图。
- 现有组件 API、props、状态清单。
- 需要同步的 Obsidian / 飞书页面。
- 是否需要进入 durable design memory。

## 输出

主要输出：

- 组件库维护 run 记录，默认写入 `ai-factory/workflows/runs/`。
- 设计系统修订说明，默认写入或更新 `ai-factory/specs/design/`。
- 如涉及代码，实现或修复落在 `packages/shared-ui`、对应 app 示例页或消费页面。
- 如涉及视觉资产，同步 Figma Component Gallery 和 Design System Changelog。
- 如涉及工程实现，补充实施计划或关联 `ui-to-code-implementation` run。
- 验证记录。
- Obsidian 阶段成果。
- 飞书知识库源稿和页面同步。

代码输出边界：

- 可复用 UI primitive、composite、layout 才进入 `packages/shared-ui`。
- 产品特定组合、mock 数据和页面状态留在对应 app。
- SDK、后端、AI 解析、日程写入和业务编排不属于组件库维护输出。

## 状态转换

允许状态：

- `not_started`：已收到人工触发，但尚未读取输入。
- `context_loaded`：已读取明确指定的设计、代码、Figma 或规格上下文。
- `change_classified`：已确定变更类型和变更对象。
- `impact_mapped`：已列出受影响组件、页面、token、Figma 资产和知识库记录。
- `spec_or_fix_plan_drafted`：已生成修订说明、修复计划或组件规格。
- `in_progress`：正在执行 Figma、文档或代码变更。
- `verified`：验证命令、截图检查或人工检查项完成。
- `synced`：Obsidian、飞书和仓库记录已同步。
- `archived`：任务完成、取消或迁移。

允许转换：

- `not_started` -> `context_loaded`
- `context_loaded` -> `change_classified`
- `change_classified` -> `impact_mapped`
- `impact_mapped` -> `spec_or_fix_plan_drafted`
- `spec_or_fix_plan_drafted` -> `in_progress`
- `in_progress` -> `verified`
- `verified` -> `synced`
- `synced` -> `archived`
- `context_loaded` -> `archived`

禁止转换：

- 未分类变更类型直接改组件。
- 未映射影响范围直接改 token。
- 未说明 Figma 与代码来源直接覆盖组件库。
- 未验证浅色 / 深色或主要消费页面直接宣称完成。
- 未写 workflow run 直接提交组件库变更。

## 人工确认点

以下情况必须在执行前或进入下一阶段前进行人工确认：

- 新增或移除共享组件。
- 修改会影响多个页面的 token、主题、圆角、字体、间距或图标规则。
- 修改组件 props、状态命名或导出路径。
- Figma 组件结构与代码组件 API 发生不兼容变化。
- 将临时页面组件提升为 `packages/shared-ui` 组件。
- 将组件库经验提升为 durable design memory。
- 需要覆盖飞书或 Figma 中面向外部展示的成果说明。

Goal 模式下，如果用户已明确授权连续执行，主线程可以给出推荐方案并执行，但必须在 run 记录中写明推荐依据、影响范围和验证结果。

## 失败处理

常见失败和处理方式：

- 来源不明确：停在 `context_loaded`，补充 UI 来源、代码路径或 Figma 节点，不得猜测组件意图。
- 组件边界模糊：先判断是否属于 shared-ui；如果只是单页面组合，保留在 app 内。
- token 冲突：列出冲突 token、影响主题和受影响组件，先写修订说明，再改代码。
- Figma 与代码不一致：记录差异来源，优先更新源头资产，再同步另一端。
- 视觉回归：停在 `in_progress`，补充截图、组件示例页或消费页面验证。
- 验证不足：不得进入 `verified`，必须补齐 typecheck、build、factory validation 或人工截图检查。
- 知识库同步失败：代码和仓库记录可以保留，但 run 状态停在 `verified`，待 Obsidian / 飞书补同步后再进入 `synced`。

## 实现顺序

1. 确认变更对象和变更类型。
2. 读取相关设计系统规格、Figma 记录、组件源码、消费页面和历史 run。
3. 映射影响范围。
4. 生成组件规格、修复计划或修订说明。
5. 更新 Figma、文档或代码。
6. 更新组件示例页或消费页面。
7. 运行验证。
8. 更新 workflow run。
9. 同步 Obsidian 和飞书。
10. 提交中文 Conventional Commit。

## 边界规则

- 组件库维护不负责产品需求决策。
- 组件库维护不负责后端能力、SDK 契约或 AI 编排实现。
- 共享组件必须保持通用语义，不写入产品特定业务状态。
- 主题能力必须通过 token 或 CSS variables 表达，不在页面中散落 raw hex。
- Figma Gallery、Figma Changelog、代码组件和知识库记录必须保持可追踪。
- 不引入隐藏生成器、自动扫描或自动组件注册。

## 检查清单

- 是否明确变更类型。
- 是否明确组件、token、图标或 Figma 来源。
- 是否列出影响页面和消费组件。
- 是否判断是否适合进入 `packages/shared-ui`。
- 是否更新设计系统规格或 Changelog。
- 是否更新组件示例页。
- 是否覆盖深色 / 浅色模式。
- 是否运行必要验证。
- 是否写入 workflow run。
- 是否同步 Obsidian 和飞书。
