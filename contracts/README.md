# 契约

## 所有权

- 契约由其描述的运行时边界拥有，破坏性变更落地前需由所有消费者评审。
- `contracts/openapi` 拥有 HTTP API 形态，`contracts/events` 拥有事件信封，`contracts/memory` 拥有记忆记录，`contracts/workflow` 拥有工作流 manifest，`contracts/requirements` 拥有需求点记录，`contracts/design` 拥有设计 brief，`contracts/hybrid-bridge` 拥有 H5 与原生壳通信协议。

## 单一事实来源

- 本目录文件是跨运行时协议的单一事实来源。
- 运行时代码可以从这些文件生成客户端、校验器或文档，但不得在其他地方重定义同一形态。

## 依赖边界

- 应用、包、Python 服务和 AI 工厂工作流可以依赖契约。
- 契约不得依赖运行时实现、框架内部细节、生成客户端或环境专属设置。

## 演进

- 增量变更可在同步更新文档和消费者后落地。
- 当影响跨越所有权边界时，破坏性变更需要迁移路径、版本化契约文件或 ADR。

## 机器校验

- 本仓库通过 `pnpm validate:contracts` 校验契约文件存在且可被轻量解析。
- 当前校验覆盖 `contracts/openapi/api-gateway.yaml`、`contracts/memory/memory-document.schema.json` 和 `contracts/workflow/workflow-manifest.schema.json`。
- OpenAPI 校验使用仓库内 Node 脚本解析当前文件使用的 YAML 子集，并检查 `openapi`、`info`、`paths` 等根结构；它不是完整 OpenAPI 语义校验器。
- JSON Schema 校验使用原生 JSON 解析，并检查 schema 文档的基础根字段。
