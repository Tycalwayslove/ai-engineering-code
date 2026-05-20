# AI 时间管理 Agent：Hybrid 可交互 Mock v0.1

## 目的

本规格记录“无后端可交互 Demo 版”的工程边界。

目标不是实现真实 AI 解析、后端日程写入或系统日历同步，而是让 iOS 原生壳、H5 渲染层和 Hybrid Bridge 形成可演示的交互闭环。

## 能力范围

- iOS Header 按钮可打开菜单、执行记录和完整日历面板。
- iOS Header 可切换深色 / 浅色主题，并同步给 H5。
- iOS Drawer 可在 Timeline、日历、执行记录三类面板之间切换。
- iOS Timepage Drawer 支持日期选择和选中态。
- iOS 底部输入支持语音态 / 文本态切换。
- iOS 文本提交、语音入口和图片入口通过 `native.inputSubmitted` 发送 mock 文本给 H5。
- H5 收到输入后生成 mock 后端元素：用户消息、AI 解析消息、确认卡片、日程摘要、Timeline 摘要和执行记录。
- H5 页面内执行状态从等待输入推进到理解中、规划中、待确认或已完成。

## 边界

- Native 负责真实点击、输入、主题和 Drawer。
- H5 负责 mock 后端元素渲染和页面内执行状态。
- Bridge 负责显式消息，不做隐式状态共享。
- 后端仍是未来真实语义解析、计划生成、日程写入和跨领域编排的归属。

## 新增 Bridge 消息

- `native.inputSubmitted`
  - 方向：Native -> H5
  - 用途：提交原生输入框文本、语音 mock 文本或图片入口 mock 文本。
  - 典型 payload：`{ "text": "...", "source": "native.composer.keyboard", "view": "conversation" }`

- `native.themeChanged`
  - 方向：Native -> H5
  - 用途：同步深色 / 浅色主题。
  - 典型 payload：`{ "theme": "light", "source": "native.header.theme" }`

## 非目标

- 不接真实后端。
- 不写入真实系统日历。
- 不接语音识别、图片识别或 OCR。
- 不在 Native 层实现日程语义解析。
- 不把 H5 mock 逻辑当成长期业务逻辑。

## 后续替换路径

当后端可用后，H5 当前的 mock 生成函数应替换为 SDK / API 返回结果：

1. Native 仍通过 `native.inputSubmitted` 提交用户输入。
2. H5 或 SDK 调用后端指令解析接口。
3. 后端返回 backend-rendered elements、执行状态和确认操作。
4. H5 继续只渲染元素，不复制后端业务状态机。
