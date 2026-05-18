# SDK

## 目的

- 为 AI Code HTTP API 提供小型 TypeScript 客户端。
- 集中处理 base URL、认证头和响应错误。

## 所有权

- 平台维护者拥有客户端行为和公共方法命名。
- 相关端点存在于 `contracts/openapi` 后，API 消费者可以请求新增方法。

## 依赖边界

- May depend on `@ai-code/shared-types` for response types.
- 不得依赖应用、UI 包、服务内部实现或后端实现文件。

## 演进路径

- 随着 API 契约稳定，一次添加一个端点方法。
- 只有手写方法造成漂移或维护压力后，才引入生成客户端。
