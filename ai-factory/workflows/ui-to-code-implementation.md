# UI 图到代码实现工作流

## 目的

将已经确认的 UI 设计图、设计系统和工程边界，转换为可验证的前端实现。

该工作流解决的问题是：UI 图不能直接等同于代码任务。进入实现前，必须先明确哪些内容是页面结构、哪些内容是共享组件、哪些内容是暂时 mock、哪些内容需要后端契约。

## 工作流声明

- id: `ui-to-code-implementation`
- owner: 当前任务负责人
- trigger: 人工触发
- execution: 手动运行，不得自动执行
- discovery: 不得动态扫描 Figma、规格或记忆目录
- source: Figma + Markdown + codebase

## 人工触发方式

人类在任务上下文中明确提出类似请求时才可启动：

```text
请按 ui-to-code-implementation 工作流，把 <Figma 页面 / UI 规格> 转成代码实现。
```

触发请求必须明确 UI 来源、实现范围和验收方式。agent 不得自行把未确认 UI 图推进到代码。

## 输入

必需输入：

- UI 来源：Figma 页面、节点、截图或本地 UI 规格。
- 设计系统来源：tokens、组件库、主题规则和图标规则。
- 产品来源：PRD、需求点记录或设计 brief。
- 实现范围：本次要落地的页面、状态、组件和非目标。
- 验证要求：构建、类型检查、人工截图检查或交互检查。

可选输入：

- 后端契约草案。
- SDK 边界规则。
- Native / H5 Bridge 约束。
- 需要同步的 Obsidian / 飞书页面。

## 输出

主要输出：

- UI 工程规格，默认写入 `ai-factory/specs/engineering/`。
- 实施计划，默认写入 `ai-factory/specs/active/`。
- 代码变更。
- 验证记录。
- Workflow run 记录。

工程规格必须包含：

- UI 来源和权威输入。
- 页面映射。
- 组件映射。
- 主题和设计 token 映射。
- mock 数据边界。
- 后端和 SDK 边界。
- 非目标。
- 验收标准。

## 状态转换

允许状态：

- `not_started`：已收到人工触发，但尚未读取输入。
- `context_loaded`：已读取明确指定的 UI、规格和代码上下文。
- `engineering_spec_drafted`：已生成 UI 工程规格。
- `implementation_plan_drafted`：已生成实施计划。
- `in_progress`：正在执行代码实现。
- `verified`：验证命令和人工检查项完成。
- `synced`：Obsidian、飞书和仓库记录已同步。
- `archived`：任务完成、取消或迁移。

允许转换：

- `not_started` -> `context_loaded`
- `context_loaded` -> `engineering_spec_drafted`
- `engineering_spec_drafted` -> `implementation_plan_drafted`
- `implementation_plan_drafted` -> `in_progress`
- `in_progress` -> `verified`
- `verified` -> `synced`
- `synced` -> `archived`
- `context_loaded` -> `archived`

禁止转换：

- 未生成工程规格直接写代码。
- 未列出 UI 来源和设计系统来源直接写代码。
- 未列出验证方式直接宣称完成。
- 未区分 mock 与真实后端能力直接接入业务逻辑。

## 实现顺序

1. 明确 UI 来源和版本。
2. 读取关联 PRD、需求、设计 brief、设计系统和当前代码。
3. 生成 UI 工程规格。
4. 生成实施计划。
5. 先实现最小可验证 H5 切片。
6. 再实现 shared-ui 缺口。
7. 再接入 SDK 或后端契约。
8. 运行验证。
9. 同步 Obsidian 和飞书。
10. 提交中文 Conventional Commit。

## 边界规则

- H5 可以组合页面、状态和 mock 数据。
- shared-ui 只沉淀可复用 primitives、composites 和 layouts。
- packages/sdk 是未来 API 访问唯一入口。
- H5 不直接访问后端 endpoint。
- H5 不承担 AI 解析、日程写入、冲突判断等业务编排。
- mock 数据必须明确命名，不能伪装成真实接口。
- 主题必须通过设计 token 或 CSS variables 实现，不能在页面中散落 raw hex。

## 检查清单

- 是否明确 Figma 页面或节点。
- 是否明确关联 PRD / design brief / UI 规格。
- 是否明确本次实现非目标。
- 是否列出 page -> component -> token 映射。
- 是否列出 mock 数据边界。
- 是否避免前端业务编排。
- 是否保留 SDK / backend 后续接入点。
- 是否有验证命令。
- 是否同步 Obsidian 和飞书。
