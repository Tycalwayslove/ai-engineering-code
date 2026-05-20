# AI 时间管理 Agent 原生壳工程规格 v0.1

## 元数据

- id: engineering-ai-time-management-agent-native-shell-001
- kind: engineering-spec
- status: implemented
- lifecycle id: ai-time-management-agent-2026-05-18
- linked workflow: `ui-to-code-implementation`
- created: 2026-05-20

## 背景

用户明确希望先写出真实 iOS / Android 原生壳，再通过 WebView 嵌套 H5。此前 H5 中的宿主预览只能帮助前端检查布局，不能替代 Xcode / Android Studio 中的真实壳调试。

因此本阶段新增最小原生壳工程：Native 只提供稳定容器和 WebView，产品界面仍由 H5 承载。

## 目标

- iOS 可用 Xcode 打开最小 SwiftUI App。
- Android 可用 Android Studio 打开最小 Kotlin App。
- 两端都加载本地 H5 dev server。
- 两端都提供加载态、错误态和深色宿主背景。
- 两端都预留 `NativeBridge`。
- H5 增加 `viewport-fit=cover`，为 WebView 安全区适配做准备。

## 非目标

- 不实现真实系统日历。
- 不实现通知权限。
- 不实现语音输入。
- 不实现登录。
- 不实现生产域名。
- 不在 Native 层写产品业务状态机。
- 不让 Native 直接调用后端业务接口。

## iOS 壳

路径：`apps/ios`

技术：

- SwiftUI
- WKWebView
- Xcode project

默认 URL：

- Simulator：`http://127.0.0.1:3000`
- 真机：需要改成 Mac 局域网地址。

职责：

- `AIEngineeringCodeApp.swift`：App 入口。
- `HybridShellView.swift`：宿主背景、加载态、错误态。
- `H5WebView.swift`：WKWebView、透明背景、inline media、NativeBridge 占位。

## Android 壳

路径：`apps/android`

技术：

- Kotlin
- Android WebView
- Gradle Kotlin DSL

默认 URL：

- Emulator：`http://10.0.2.2:3000`
- 真机：需要改成 Mac 局域网地址。

职责：

- `MainActivity.kt`：宿主背景、WebView、加载态、错误态、NativeBridge 占位。
- `network_security_config.xml`：允许本地 HTTP 调试。
- `app/build.gradle.kts`：声明 H5 dev URL。

## Bridge 原则

本阶段只预留 Bridge 名称，不定义业务消息：

- iOS：`window.webkit.messageHandlers.NativeBridge.postMessage(...)`
- Android：`window.NativeBridge.postMessage(...)`

后续必须先写 Native Bridge 契约，再接真实系统能力。

## 验收标准

- `pnpm validate:native-shells` 通过。
- `plutil -lint apps/ios/AIEngineeringCode/Info.plist` 通过。
- H5 `viewport-fit=cover` 已配置。
- README 写清 Xcode / Android Studio 调试方式。
- 原生壳不实现业务状态机。
