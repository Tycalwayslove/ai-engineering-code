# 工厂状态面板 v1 实施计划

## 工作流来源

本计划由 `ai-factory/workflows/spec-to-implementation-plan.md` 手动运行产生。

规格来源：`ai-factory/specs/active/factory-status-panel-v1.md`

状态：`approved`

## 背景和目标

将现有 `/factory/status` 薄切片升级为 Admin 可读的工厂状态面板 v1，并增强契约一致性检查。

## 非目标

- 不引入生产监控。
- 不添加数据库、向量库、LangGraph 或自动工作流执行。
- 不拆分微服务运行时。
- 不生成 SDK。

## 受影响文件

- `ai-factory/specs/active/factory-status-panel-v1.md`
- `ai-factory/specs/active/factory-status-panel-v1-implementation-plan.md`
- `contracts/openapi/api-gateway.yaml`
- `packages/shared-types/src/index.ts`
- `packages/sdk/src/index.ts`
- `python/backend/backend/app/services/factory_status.py`
- `python/backend/backend/app/services/factory_capabilities.py`
- `python/backend/tests/test_factory_status.py`
- `apps/admin/src/app/page.tsx`
- `apps/admin/src/app/globals.css`
- `scripts/validate-contracts.mjs`
- Obsidian 阶段成果笔记

## 实施步骤

1. 先更新测试和校验脚本，使新增字段要求在当前实现下失败。
2. 添加显式能力注册表，包含能力 `id`、`label`、`status`、`source`、`summary`。
3. 更新 `/factory/status` 响应，增加能力来源和 `nextActions`。
4. 更新 OpenAPI 和 TypeScript 共享类型。
5. 更新 Admin 页面，使其展示概览、能力卡片、来源和下一步行动。
6. 增强 `pnpm validate:contracts` 的轻量一致性检查。
7. 运行完整验证。
8. 将阶段成果写入 Obsidian。

## 状态转换计划

- `intake`：规格已明确。
- `context_loaded`：已读取当前后端、契约、SDK、Admin 页面和契约校验脚本。
- `plan_drafted`：本文件创建。
- `approved`：用户已要求按规划推进。
- `in_progress`：开始 TDD 和实现。
- `verified`：完整验证通过。
- `archived`：提交并写入 Obsidian 后归档。

## 风险

- 契约一致性脚本仍是轻量检查，不能替代完整 OpenAPI 校验器。
- Admin 页面在后端未启动时只能展示离线状态。
- 当前无前端测试框架，Admin UI 主要通过 TypeScript 和构建验证。

## 验证命令

- `pnpm validate:contracts`
- `pnpm build`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `ruff check python`
- `ruff format --check python`
- `mypy python`
- `pytest python`
- `docker compose config`
- `prettier --check`
- `git diff --check`

## 记忆更新建议

- 若该面板成为后续工厂工作台入口，将其提升到 durable product 或 architecture memory。
- 本次阶段结果写入 Obsidian 阶段成果。
