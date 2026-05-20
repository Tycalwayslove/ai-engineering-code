# Workflow Run：原生 iOS / Android 壳启动

## 元数据

- id: run-2026-05-20-native-shell-bootstrap
- workflow: `ui-to-code-implementation`
- status: synced
- owner: Codex
- created: 2026-05-20
- updated: 2026-05-20
- trigger: 用户明确要求先写出原生 iOS / Android 壳，通过 WebView 嵌套 H5，后续用 Xcode / Android Studio 调试

## 输入

- 产品边界：Native 是稳定壳，H5 是产品界面。
- 技术方向：iOS 使用 WKWebView，Android 使用 WebView。
- 本地 H5：`pnpm dev:h5` 默认 `localhost:3000`。
- 非目标：不接真实日历、通知、语音、登录和后端业务。

## 输出

- iOS SwiftUI + WKWebView 壳：
  - `apps/ios/AIEngineeringCode.xcodeproj`
  - `apps/ios/AIEngineeringCode/AIEngineeringCodeApp.swift`
  - `apps/ios/AIEngineeringCode/HybridShellView.swift`
  - `apps/ios/AIEngineeringCode/H5WebView.swift`
- Android Kotlin + WebView 壳：
  - `apps/android/settings.gradle.kts`
  - `apps/android/app/build.gradle.kts`
  - `apps/android/app/src/main/java/com/aiengineeringcode/shell/MainActivity.kt`
- H5 WebView 适配：
  - `apps/h5/src/app/layout.tsx` 增加 `viewportFit: "cover"`
- 验证脚本：
  - `scripts/validate-native-shells.mjs`
  - `pnpm validate:native-shells`
- 工程规格：
  - `ai-factory/specs/engineering/2026-05-20-ai-time-management-agent-native-shell-v0-1.md`

## 状态转换

- `not_started` -> `context_loaded`：读取现有 `apps/ios`、`apps/android` 和 H5 layout。
- `context_loaded` -> `engineering_spec_drafted`：明确 Native 只做壳，H5 承载产品界面。
- `engineering_spec_drafted` -> `implementation_plan_drafted`：确认先创建可打开的原生项目骨架。
- `implementation_plan_drafted` -> `in_progress`：写入 iOS / Android 原生壳代码。
- `in_progress` -> `verified`：运行静态验证和 H5 验证。
- `verified` -> `synced`：同步 Obsidian、飞书和 Git。

## 人工确认点

用户已明确纠正方向：不是 H5 内部预览，而是真实原生壳。因此本阶段按 SwiftUI + WKWebView、Kotlin + WebView 实施。

## 失败处理

- 如果 Xcode project 后续无法打开，优先修正 `project.pbxproj`，不改 H5 页面。
- 如果 Android Studio Gradle sync 失败，优先修正 Gradle 配置和 SDK 版本。
- 如果真机无法访问本地 H5，改成本机局域网 IP，不把 URL 写死到业务代码。

## 验证记录

已完成：

- `pnpm validate:native-shells`
- `plutil -lint apps/ios/AIEngineeringCode/Info.plist`
- `find apps/android/app/src/main -name '*.xml' -type f -print0 | xargs -0 -n1 xmllint --noout`
- `pnpm --filter @ai-code/h5 typecheck`
- `pnpm --filter @ai-code/h5 build`
- `pnpm validate:factory`

环境限制：

- 当前机器 `xcodebuild` 指向 Command Line Tools，不是完整 Xcode，无法在 Codex 环境内执行 iOS 编译。
- 当前机器未安装 `gradle`，无法在 Codex 环境内执行 Android Gradle build。
- 后续应在 Xcode 和 Android Studio 中完成原生运行调试。
