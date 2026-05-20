# AI 时间管理 Agent iOS Bridge Implementation Plan

## 目标

先完成 iOS + H5 的 Hybrid Bridge 基础，不继续实现 Android。Android 后续根据 iOS 变更清单补齐。

## 本阶段实现

- 新增 `contracts/hybrid-bridge`，作为 H5 与原生壳通信的单一事实来源。
- 新增 H5 Bridge 客户端，封装 `window.webkit.messageHandlers.NativeBridge`。
- 修正 Hybrid 分层：iOS 拥有 Header、底部输入和 Timepage Drawer。
- H5 收敛为后端元素渲染表面，不再拥有 App 壳层 UI；接口驱动的页面内执行状态条仍归 H5。
- 页面内执行状态条固定在 WebView 底部，视觉上位于 Native 输入框上方。
- iOS `WKWebView` 接收 H5 消息，并向 H5 回传 `native.hostContext`、`native.viewChanged`、`native.inputRequested`、`native.ack`、`native.error`。
- Android 只保留后续需求计划，不改运行时代码。

## 后续 Android 执行清单

后续进入 Android 阶段时，按以下顺序执行：

1. 将 iOS 当前支持的消息类型同步到 Android `MainActivity.kt`。
2. Android WebView 收到 `h5.ready` 后回传 `native.hostContext`，payload 中 `platform` 改为 `android`。
3. Android 实现原生 Header、底部输入和 Timepage Drawer。
4. Android 通过 `native.viewChanged` 通知 H5 渲染对应后端元素。
5. Android 通过 `native.inputRequested` 通知 H5 当前输入入口。
6. Android 与 iOS 共用 `contracts/hybrid-bridge/native-bridge-message.schema.json`。

## 验证清单

- `pnpm --filter @ai-code/h5 typecheck`
- `pnpm --filter @ai-code/h5 build`
- `pnpm validate:contracts`
- `pnpm validate:native-shells`
- `xcodebuild -project apps/ios/AIEngineeringCode.xcodeproj -scheme AIEngineeringCode -configuration Debug -destination 'platform=iOS Simulator,name=iPhone 16,OS=18.6' build`
