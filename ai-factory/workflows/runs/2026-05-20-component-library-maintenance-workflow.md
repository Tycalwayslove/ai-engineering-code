# Workflow Run：补全组件库维护工作流

## 元数据

- id: run-2026-05-20-component-library-maintenance-workflow
- workflow: `component-library-maintenance`
- status: synced
- owner: Codex
- created: 2026-05-20
- updated: 2026-05-20
- trigger: 用户要求补全 `component-library-maintenance` 工作流

## 背景

用户在准备进入具体代码实现前，询问组件库完善、调整和 bug 修复在工作流中如何操作，以及这些修改记录应在哪里查看。

此前项目已经建立了 v0.5 本地组件库、Figma Component Gallery、Figma Changelog、v0.7 主题 token 和 `ui-to-code-implementation` 工作流。但组件库后续维护尚未形成独立流程，容易出现以下风险：

- shared-ui、Figma、产品页面和知识库记录不同步。
- token 修改影响范围不清。
- 页面临时组件被过早提升为共享组件。
- 组件 bug 修复没有 workflow run 和验证记录。

## 输入

- 变更类型：`documentation-only`
- 变更对象：组件库维护流程、工作流注册表、工厂校验、知识库同步。
- 关联资产：
  - `ai-factory/workflows/ui-to-code-implementation.md`
  - `ai-factory/specs/design/2026-05-19-ai-time-management-agent-design-system-v0-5-plan.md`
  - `packages/shared-ui`
  - Figma `AI 时间管理 Agent v0.5 Design System`
- 验收方式：
  - workflow 文档包含强制章节。
  - manifest 包含工厂校验字段。
  - `pnpm validate:factory` 通过。
  - Obsidian 和飞书同步完成。

## 输出

- 新增 `ai-factory/workflows/component-library-maintenance.md`
- 新增 `ai-factory/workflows/registries/component-library-maintenance.manifest.json`
- 将 `ui-to-code-implementation` 和 `component-library-maintenance` 纳入 `scripts/validate-factory.mjs`
- 更新工作流 README 与注册表 README
- 更新设计系统 v0.5 计划，明确组件库后续维护入口
- 更新飞书源稿：
  - `docs/knowledge-sync/feishu-pages/05-ai-workflow-collaboration.md`
  - `docs/knowledge-sync/feishu-pages/03-evolution-log.md`
  - `docs/knowledge-sync/feishu-index.md`
- 写入 Obsidian 阶段成果

## 状态转换

- `not_started` -> `context_loaded`：读取现有工作流、注册表、校验脚本和知识库源稿。
- `context_loaded` -> `change_classified`：确认本次为流程与文档补全，不直接改组件代码。
- `change_classified` -> `impact_mapped`：确认影响工作流、设计系统规格、知识库与工厂校验。
- `impact_mapped` -> `spec_or_fix_plan_drafted`：形成组件库维护流程结构。
- `spec_or_fix_plan_drafted` -> `in_progress`：写入 workflow、manifest、README、run 和知识库源稿。
- `in_progress` -> `verified`：完成格式化与校验。
- `verified` -> `synced`：同步 Obsidian 与飞书。

## 人工确认点

本次用户已明确要求补全 `component-library-maintenance` 工作流。由于该变更属于流程补全，不改变产品功能、不改组件 API、不改 Figma 资产，因此不需要额外等待确认后再落库。

后续如果该工作流用于真实组件变更，以下情况必须重新确认：

- 新增共享组件。
- 修改 theme token。
- 修改组件 props 或导出路径。
- 更新 Figma 组件结构。
- 将页面组件提升为 shared-ui。

## 失败处理

- 如果工厂校验失败，修正文档章节或 manifest 字段后重新验证。
- 如果飞书同步失败，保留仓库源稿，run 状态回退为 `verified`。
- 如果后续真实组件变更范围不清，停在 `context_loaded`，先补组件来源和影响范围。

## 验证记录

已完成：

- `pnpm validate:factory`
- `pnpm exec prettier --check "**/*.{md,json,yml,yaml,ts,tsx,mjs,css}"`
- `git diff --check`
- 飞书 fetch 验证关键字

## 结果

`component-library-maintenance` 成为组件库维护的正式入口。之后用户要求“完善组件库”“修复组件样式”“调整主题 token”“同步 Figma 组件”时，应优先走该流程，并在对应 run、设计系统规格、Obsidian 和飞书中留下记录。
