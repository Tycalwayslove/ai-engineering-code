# 组件层级

## 目的

为 AI 生成 UI 提供稳定组件层级，减少业务逻辑散落到页面和基础组件中。

## 分层

```text
packages/shared-ui
  primitives
  composites
  layouts
```

## primitives

基础组件，例如 Button、Input、Badge、Tabs、Dialog。

规则：

- 不包含业务语义。
- 不发起网络请求。
- 不读取业务状态。

## composites

组合组件，例如 StatusCard、MetricPanel、WorkflowList。

规则：

- 可以表达轻量产品语义。
- 不拥有业务编排。
- 数据由调用方传入。

## layouts

页面结构，例如 AppShell、DashboardLayout、DetailLayout。

规则：

- 只负责导航和布局。
- 不决定业务流程。
- 不直接访问后端。

## 开发门槛

产品 UI 开发前必须有关联 PRD 或 design brief。
