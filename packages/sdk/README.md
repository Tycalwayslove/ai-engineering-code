# SDK

## 目的

- 为 AI Code HTTP API 提供小型 TypeScript 客户端。
- 集中处理 base URL、认证头和响应错误。

## 所有权

- 平台维护者拥有客户端行为和公共方法命名。
- 相关端点存在于 `contracts/openapi` 后，API 消费者可以请求新增方法。

## 依赖边界

- 可以依赖 `@ai-code/shared-types` 获取响应类型。
- 不得依赖应用、UI 包、服务内部实现或后端实现文件。

## 演进路径

- 随着 API 契约稳定，一次添加一个端点方法。
- 只有手写方法造成漂移或维护压力后，才引入生成客户端。

## 当前方法

- `getFactoryStatus()` 调用 `GET /factory/status`，用于 H5 和 Admin 展示工厂状态闭环。
- `getHealth()` 调用 `GET /health`。
- `getVersion()` 调用 `GET /version`。

## Agent 工作流方法

SDK 暴露工作流方法，应用不直接拼装后端 URL：

- `submitAgentTurn(request)` 提交自然语言输入。
- `confirmExecutionPlan(planId, request)` 确认并执行待确认计划。
- `rejectExecutionPlan(planId)` 拒绝待确认计划，并返回更新后的执行计划。
- `getExecutionPlan(planId)` 读取执行计划。
- `getExecutionLedger()` 读取执行审计事件。
- `getCalendarEvents()` 读取日程事实。
- `getExpenses()` 读取费用记录。
- `getReminders()` 读取提醒记录。

应用只渲染返回的 union type，不解析自然语言，也不从聊天消息反推领域状态。
