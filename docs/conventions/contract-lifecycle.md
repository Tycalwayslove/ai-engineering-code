# 契约生命周期

## 目的

契约生命周期用于防止前端、后端、工作流、记忆、需求和设计资产互相漂移。

## 契约类型

| 类型         | 权威位置                  | 当前阶段                       |
| ------------ | ------------------------- | ------------------------------ |
| HTTP API     | `contracts/openapi/`      | 已用于 `/factory/status`       |
| Workflow     | `contracts/workflow/`     | Phase 1.1 校验 manifest        |
| Memory       | `contracts/memory/`       | Phase 1.1 约束 memory metadata |
| Requirements | `contracts/requirements/` | Phase 1.1 约束需求点记录       |
| Design       | `contracts/design/`       | Phase 1.1 预留，Phase 1.2 细化 |

## API 变更顺序

```text
contract first
  -> backend implementation
  -> SDK / shared-types
  -> frontend usage
  -> validation
```

## 规则

- 前端应用不得直接 fetch 后端。
- 后端不得先新增跨边界接口再补 OpenAPI。
- workflow、memory、requirements 和 design 的实例应能追溯到对应 contract。
- 生成器只有在手工契约维护产生真实漂移压力后才引入。

## Phase 1.1 校验

`pnpm validate:factory` 检查 AI 工厂流程资产和实例结构。

`pnpm validate:contracts` 检查跨运行时契约基础结构和当前薄切片一致性。
