# Workflow Runs

## 目的

该目录保存正式 workflow 的运行记录。运行记录是证据，不是 workflow 定义。

## 命名

```text
YYYY-MM-DD-<workflow-id>-<short-topic>.md
```

## 边界

- 每次正式运行 workflow 都应生成 run record。
- run record 必须记录输入、状态、人工确认点、输出、验证和记忆更新建议。
- 未确认的 run record 不得作为 durable memory。

## 演进

Phase 1.1 保持 Markdown 手动记录。只有当运行记录稳定后，才考虑工具化。
