# AI 时间管理 Agent Hybrid Bridge 工程规格 v0.1

## 背景

用户确认后续原生 App 端先只开发 iOS。Android 不继续编码，只保留需求计划，后续根据 iOS 已验证能力再补实现。

当前目标是把页面职责拆清楚，并补齐 H5 与 iOS 原生壳之间的桥接层。

2026-05-20 修正：上一版把 Header、底部输入、Timeline、日历和执行记录都放在 H5 内部，这不符合 Hybrid 分层。当前版本将 App 壳层 UI 收回 iOS，H5 只保留后端元素渲染区。

## 页面归属

### H5 拥有

- 后端返回元素的渲染表面。
- 接口状态驱动的页面内执行状态条。
- AI 对话消息、确认卡片、摘要列表、执行记录等 backend element 的展示组件。
- 仅根据 `native.viewChanged` 或后端返回结果切换渲染元素集合。

### iOS 拥有

- SwiftUI App 启动入口。
- `WKWebView` 宿主。
- 加载态和错误态。
- App 头部 Header。
- 底部输入框。
- 点击菜单后出现的 Timepage 风格 Drawer。
- 完整日历入口和执行记录入口。
- NativeBridge 消息收发。
- 未来系统能力入口，例如语音、通知、系统日历、相机和文件选择。

### 后端后续拥有

- 用户自然语言解析。
- 日程领域写入。
- 冲突检查。
- 计划与执行流水线。
- 记忆和长期偏好。

## Bridge 契约

契约源文件：

- `contracts/hybrid-bridge/README.md`
- `contracts/hybrid-bridge/native-bridge-message.schema.json`

当前消息：

- H5 -> Native：`h5.ready`、`ui.openTimeline`、`ui.openCalendar`、`ui.openExecutionLedger`、`input.voice.start`、`input.keyboard.open`
- Native -> H5：`native.hostContext`、`native.viewChanged`、`native.inputRequested`、`native.ack`、`native.error`

## 实现策略

- H5 通过 `apps/h5/src/app/ai-time-agent/bridge.ts` 封装 NativeBridge。
- H5 不拥有页面 Header、底部输入或 Drawer，只接收 Native 发来的视图上下文并渲染对应后端元素。
- 页面内执行状态条由 H5 根据接口状态渲染，并固定在 WebView 底部、Native 输入框上方。
- Native 不同步页面内执行状态，避免 Bridge 变成状态总线。
- iOS 原生 Header、Drawer、底部输入通过 `native.viewChanged` 和 `native.inputRequested` 向 H5 发送事件。
- iOS 在 `WKScriptMessageHandler` 中接收消息，返回 ACK 或错误。
- iOS 在 WebView 加载完成后向 H5 派发 `native.hostContext`。
- 未实现的系统能力必须显式返回 `notImplemented`，不得静默失败。

## Android 后续计划

Android 不在本阶段继续编码。后续实现应复用同一 Bridge 契约：

1. Kotlin `WebView` 保持 H5 宿主职责。
2. Android 原生层实现 Header、底部输入和 Timepage Drawer；页面内执行状态仍由 H5 渲染。
3. `NativeBridge.postMessage(payload: String)` 解析同一 envelope。
4. Android 回传应派发与 iOS 同名的 `ai-native-message` 事件。
5. Android 不实现独立业务状态机。
6. Android 的具体实现应以 iOS 已验证消息为开发清单。

## 非目标

- 不接真实后端。
- 不实现真实语音识别。
- 不写入真实系统日历。
- 不扩展 Android 代码。
- 不在 Native 层实现产品页面。

## 验证

- H5 typecheck。
- H5 build。
- iOS `xcodebuild`。
- `pnpm validate:native-shells`。
- `pnpm validate:contracts`。
- 本地浏览器和 iOS WebView 能加载 H5。
