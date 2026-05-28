# AI 时间管理 Agent v1.0 初版 App 设计

日期：2026-05-23
状态：已确认进入实施

## 目标

v1.0 要成为一个用户可以直接打开、点击、输入和查看结果的初版 iOS Hybrid App，而不是后端薄切片集合。用户在原生 App 中使用 Header、Drawer、键盘、语音入口和附件入口；H5 负责业务页面、对话组件、确认卡和数据展示；后端负责自然语言解析、执行计划、确认执行和 Postgres 持久化。

## 产品范围

v1.0 覆盖以下可用功能：

- 原生 Header：菜单、Timeline、日历、执行记录、主题切换。
- 原生 Drawer：对话、Timeline、日历、费用、提醒、执行记录、设置。
- 原生输入：文本提交、语音 mock 提交、附件 mock 提交。
- H5 页面：对话工作台、Timeline、日历、费用、提醒、执行记录、设置。
- 对话组件：用户消息、AI 消息、追问、确认卡、领域结果卡、错误消息。
- 后端领域：日程创建、费用草稿创建、提醒创建。

v1.0 不做真实 LLM、真实语音识别、真实图片识别、外部日历同步、系统通知推送、费用审批、账号体系或异步 worker。

## 架构边界

Native 拥有 App 壳层和系统能力入口：

- 顶部导航。
- Drawer 和原生菜单。
- 底部输入栏。
- 键盘、语音和附件入口。
- 主题切换。
- Bridge 消息发送。

H5 拥有业务页面和后端元素渲染：

- 页面状态和页面内容。
- 对话组件。
- 确认卡交互。
- API 调用和数据刷新。
- 执行状态 Dock。

后端拥有业务执行：

- 解析自然语言。
- 生成 execution plan。
- 生成 confirmation。
- 确认后执行领域 service。
- 写入 Postgres。
- 返回领域事实读取接口。

## 页面结构

H5 页面集合：

- `conversation`：对话工作台。
- `timeline`：按时间聚合日程和提醒。
- `calendar`：数据库日程。
- `expenses`：费用草稿。
- `reminders`：提醒列表。
- `ledger`：执行记录。
- `settings`：API、Bridge、主题和调试状态。

每个页面必须有标题、空状态、加载或错误反馈以及数据展示。Native 嵌入时隐藏 H5 开发预览控件；本地开发时保留页面切换控件。

## Bridge 契约

新增或稳定以下消息：

- `native.viewChanged`：payload.view 可为 `conversation`、`timeline`、`calendar`、`expenses`、`reminders`、`ledger`、`settings`。
- `native.inputSubmitted`：payload.text 为提交给 H5 的文本，payload.source 区分 keyboard、voice、attachment。
- `native.themeChanged`：同步 H5 主题。
- H5 初始化后发送 `h5.ready`。

v1.0 中语音和附件是原生 mock：按钮必须可点、有状态、有提交文本，但不接系统 ASR 或真实图片识别。

## 后端领域

已完成：

- 日程创建。
- 费用草稿。

本迭代补齐：

- 提醒创建。

示例输入：

```text
明天上午九点提醒我带电脑
```

结果：

- `POST /agent/turns` 返回 confirmation。
- `POST /execution-plans/{id}/confirm` 写入 `reminders`。
- `GET /reminders` 返回提醒。

## 体验要求

- 所有可点击控件必须有可见反馈。
- 关键触控目标不小于 44pt / 44px。
- 发送中、执行中和失败状态必须可见。
- 不把调试信息当成主要产品内容。
- H5 内容不能被原生输入栏遮挡。
- 深色和浅色主题都要可读。

## 验证

必须通过：

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests -v
PATH=.venv/bin:$PATH ruff check python
PATH=.venv/bin:$PATH mypy python
pnpm --filter @ai-code/h5 typecheck
pnpm --filter @ai-code/sdk typecheck
pnpm --filter @ai-code/shared-types typecheck
pnpm validate:contracts
pnpm validate:native-shells
pnpm validate:context-sync
pnpm validate:factory
```

如果本地 Xcode 环境可用，还应运行 iOS Debug 构建。H5 视觉和交互应使用浏览器验证主要页面。
