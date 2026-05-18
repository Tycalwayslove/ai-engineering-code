# 工厂状态面板 v1 规格

## 背景

当前仓库已经具备第一个端到端薄切片：`GET /factory/status` 从 OpenAPI 契约贯穿到 FastAPI、SDK、H5 和 Admin 页面。

下一步需要把它升级成一个更可检查的 Admin 状态面板。这个面板不是生产监控系统，而是 AI 原生软件工厂的第一块工作台：让维护者看到当前工厂基础设施有哪些能力、能力来自哪里、哪些能力仍处于计划中，以及下一步应该做什么。

## 目标

- 让 `/factory/status` 返回显式能力来源，而不是只有静态标签。
- 让 Admin 页面展示工厂状态概览、能力清单、来源说明和下一步行动。
- 让能力清单来自后端显式注册表，避免动态扫描或隐藏发现。
- 增强 `pnpm validate:contracts`，轻量检查 OpenAPI、SDK、共享类型之间的关键一致性。
- 继续保持第一阶段约束：无 LangGraph、无向量库、无微服务拆分、无自动工作流执行。

## 非目标

- 不做实时生产监控。
- 不接数据库、Redis、消息队列或外部状态源。
- 不从文件系统动态扫描契约、工作流或记忆。
- 不生成 SDK 或服务端代码。
- 不重构 H5 页面为完整工作台。

## 用户体验

Admin 首页应优先显示：

- 工厂名称、版本和整体状态。
- 能力总数、ready 数量、planned 数量。
- 每个能力的名称、状态、来源和简短说明。
- 一组下一步行动，用于提示当前阶段最值得推进的事项。
- API 不可达时显示清晰离线状态。

H5 页面可以继续保持轻量，只消费同一 SDK 返回结构。

## 数据契约

`FactoryCapability` 需要包含：

- `id`
- `label`
- `status`
- `source`
- `summary`

`FactoryStatus` 需要包含：

- `name`
- `status`
- `version`
- `capabilities`
- `nextActions`

状态取值保持简单：

- capability status: `ready` 或 `planned`
- factory status: `ready` 或 `degraded`

## 后端边界

后端保持：

```text
routes -> services -> explicit capability registry
```

`routes` 只处理 HTTP 暴露。`services` 组装响应。能力清单由显式注册表维护，不从目录或运行时环境自动发现。

## 契约一致性

`pnpm validate:contracts` 应继续声明自己是轻量校验，但增加以下检查：

- OpenAPI 中存在 `getHealth`、`getVersion`、`getFactoryStatus`。
- SDK 中存在 `getHealth()`、`getVersion()`、`getFactoryStatus()`。
- OpenAPI 的 `FactoryCapability.required` 包含 `id`、`label`、`status`、`source`、`summary`。
- OpenAPI 的 `FactoryStatus.required` 包含 `name`、`status`、`version`、`capabilities`、`nextActions`。
- `packages/shared-types/src/index.ts` 中存在对应字段名称。

这仍不是完整 OpenAPI 语义校验，只是防止当前薄切片发生明显漂移。

## 验收标准

- Admin 页面能展示状态概览、能力卡片、来源和下一步行动。
- `/factory/status` 测试覆盖新增字段。
- `pnpm validate:contracts` 能检查当前薄切片关键一致性。
- `pnpm build`、`pnpm typecheck`、`pytest python`、`mypy python` 通过。
- 阶段成果写入 Obsidian。
