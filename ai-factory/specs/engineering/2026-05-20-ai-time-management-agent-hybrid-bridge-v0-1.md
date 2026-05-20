# AI 时间管理 Agent Hybrid Bridge 工程规格 v0.1

## 背景

用户确认后续原生 App 端先只开发 iOS。Android 不继续编码，只保留需求计划，后续根据 iOS 已验证能力再补实现。

当前目标是把页面职责拆清楚，并补齐 H5 与 iOS 原生壳之间的桥接层。

## 页面归属

### H5 拥有

- AI 执行流首页。
- Timeline 视图。
- 完整日历视图。
- 执行记录视图。
- 主题、组件组合和页面状态展示。

### iOS 拥有

- SwiftUI App 启动入口。
- `WKWebView` 宿主。
- 加载态和错误态。
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
- Native -> H5：`native.hostContext`、`native.ack`、`native.error`

## 实现策略

- H5 通过 `apps/h5/src/app/ai-time-agent/bridge.ts` 封装 NativeBridge。
- H5 页面按钮先切换内部视图，再向 Native 发送显式消息。
- iOS 在 `WKScriptMessageHandler` 中接收消息，返回 ACK 或错误。
- iOS 在 WebView 加载完成后向 H5 派发 `native.hostContext`。
- 未实现的系统能力必须显式返回 `notImplemented`，不得静默失败。

## Android 后续计划

Android 不在本阶段继续编码。后续实现应复用同一 Bridge 契约：

1. Kotlin `WebView` 保持 H5 宿主职责。
2. `NativeBridge.postMessage(payload: String)` 解析同一 envelope。
3. Android 回传应派发与 iOS 同名的 `ai-native-message` 事件。
4. Android 不实现独立业务状态机。
5. Android 的具体实现应以 iOS 已验证消息为开发清单。

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
