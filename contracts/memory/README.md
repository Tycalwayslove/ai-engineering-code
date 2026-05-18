# 记忆契约

## 所有权

- 记忆系统所有者维护文档元数据契约，并由工作流和运行时消费者评审。
- 新增领域需要检索或编写记忆的团队达成一致。

## 单一事实来源

- `memory-document.schema.json` 是记忆文档元数据的单一事实来源。
- Markdown 文件可以承载内容，但该 schema 定义可移植记录形态。

## 依赖边界

- 记忆契约可以被 agent、工作流和服务消费。
- Phase 1.1 memory metadata 至少包含 status、created 和 lastReviewed。
- 它们不得依赖存储引擎、向量索引、提示词模板或检索实现。

## 演进

- 只有重复检索或治理需求出现后，才添加可选元数据。
- 当人工约定造成漂移时，收紧校验或添加新 schema。

## 校验

- 运行 `pnpm validate:contracts` 可确认 `memory-document.schema.json` 文件存在、JSON 可解析，并包含 JSON Schema 基础根字段。
- 运行 `pnpm validate:factory` 可确认关键 memory note 包含基础 metadata。
