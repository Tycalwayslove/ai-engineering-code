# 工厂状态面板 v1 任务记忆

## 记忆类型

- id: factory-status-panel-v1
- domain: tasks
- scope: working
- status: active
- sourcePath: ai-factory/memory/working/tasks/factory-status-panel-v1.md
- created: 2026-05-18
- lastReviewed: 2026-05-18

## 背景

该任务实际运行 `spec-to-implementation-plan` 工作流：先写规格，再写实施计划，再按 TDD 推进后端响应、契约一致性检查和 Admin 面板。

## 当前目标

- 让 Admin 首页成为软件工厂状态工作台。
- 让 `/factory/status` 返回能力来源、说明和下一步行动。
- 让契约校验覆盖当前薄切片的关键一致性。

## 约束

- 不引入 LangGraph、向量库、数据库、消息队列或微服务运行时。
- 不动态扫描能力、契约、记忆或工作流。
- 前端继续通过 `@ai-code/sdk` 访问后端。
- 阶段性结果需要写入 Obsidian。

## 验证关注

- Python 测试必须覆盖新增响应字段。
- `pnpm validate:contracts` 必须在 OpenAPI、SDK 和 shared-types 漂移时失败。
- Admin 页面必须通过构建和类型检查。
