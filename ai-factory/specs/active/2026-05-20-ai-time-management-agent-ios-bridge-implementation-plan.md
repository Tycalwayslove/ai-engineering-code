# AI 时间管理 Agent iOS Bridge Implementation Plan

## 目标

先完成 iOS + H5 的 Hybrid Bridge 基础，不继续实现 Android。Android 后续根据 iOS 变更清单补齐。

## 本阶段实现

- 新增 `contracts/hybrid-bridge`，作为 H5 与原生壳通信的单一事实来源。
- 新增 H5 Bridge 客户端，封装 `window.webkit.messageHandlers.NativeBridge`。
- 将 H5 页面拆为 AI 执行流、Timeline、完整日历、执行记录四个视图。
- iOS `WKWebView` 接收 H5 消息，并向 H5 回传 `native.hostContext`、`native.ack`、`native.error`。
- Android 只保留后续需求计划，不改运行时代码。

## 后续 Android 执行清单

后续进入 Android 阶段时，按以下顺序执行：

1. 将 iOS 当前支持的消息类型同步到 Android `MainActivity.kt`。
2. Android WebView 收到 `h5.ready` 后回传 `native.hostContext`，payload 中 `platform` 改为 `android`。
3. Android 对 `ui.openTimeline`、`ui.openCalendar`、`ui.openExecutionLedger` 返回 `native.ack`。
4. Android 对 `input.voice.start` 返回 `notImplemented`，直到接入真实语音能力。
5. Android 与 iOS 共用 `contracts/hybrid-bridge/native-bridge-message.schema.json`。

## 验证清单

- `pnpm --filter @ai-code/h5 typecheck`
- `pnpm --filter @ai-code/h5 build`
- `pnpm validate:contracts`
- `pnpm validate:native-shells`
- `xcodebuild -project apps/ios/AIEngineeringCode.xcodeproj -scheme AIEngineeringCode -configuration Debug -destination 'platform=iOS Simulator,name=iPhone 16,OS=18.6' build`
