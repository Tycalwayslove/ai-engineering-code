# 工作流契约

## 所有权

- 工作流所有者维护 manifest 形态，并由运行时、记忆和产品消费者评审。
- 每个工作流在成为可执行基础设施前，必须声明所有权。

## 单一事实来源

- `workflow-manifest.schema.json` 是工作流元数据的单一事实来源。
- 运行时注册表和文档必须来自通过该 schema 校验的 manifest 文件。

## 依赖边界

- 工作流契约描述输入、输出、状态和记忆领域。
- Phase 1.1 manifest 还必须声明 trigger、execution、discovery、source 和 humanReviewRequired。
- 它们不得依赖编排引擎、UI 流程、提示词内部细节或队列提供商。

## 演进

- 只有出现真实工作流执行或评审需求后，才扩展 manifest。
- 通过新契约或版本化 schema 添加运行时专属字段，而不是临时 manifest 键。

## 校验

- 运行 `pnpm validate:contracts` 可确认 `workflow-manifest.schema.json` 文件存在、JSON 可解析，并包含 JSON Schema 基础根字段。
- 运行 `pnpm validate:factory` 可确认当前 workflow manifest 实例存在，并包含 Phase 1.1 所需字段。
