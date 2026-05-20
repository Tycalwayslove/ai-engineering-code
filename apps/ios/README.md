# iOS

## 目的

该目录保存 AI 时间管理 Agent 的 iOS 原生壳。

## 所有权

当前 iOS 只负责稳定 Native Shell：

- 启动 SwiftUI App。
- 用 `WKWebView` 加载 H5 产品层。
- 提供深色宿主背景、加载态和错误态。
- 预留 `NativeBridge` 消息入口。

业务界面、AI 执行流、日程确认、Timeline 和主题系统仍由 H5 承载。

## 依赖边界

- iOS 不实现日程业务逻辑。
- iOS 不直接读取 `services/*` 或 `ai-factory/*`。
- iOS 不直接调用后端业务接口。
- iOS 与 H5 的通信必须后续通过显式 Native Bridge 契约定义。
- 本地调试默认加载 `http://127.0.0.1:3000`。

## 本地调试

1. 启动 H5：

   ```bash
   pnpm dev:h5
   ```

2. 用 Xcode 打开：

   ```bash
   open apps/ios/AIEngineeringCode.xcodeproj
   ```

3. 选择 iPhone Simulator 运行。

如果使用真机调试，需要把 `HybridShellConfiguration.development` 里的 URL 改成 Mac 的局域网地址，例如 `http://192.168.x.x:3000`。

## 文件结构

- `AIEngineeringCodeApp.swift`：App 入口。
- `HybridShellView.swift`：Native 壳样式、加载态和错误态。
- `H5WebView.swift`：`WKWebView` 封装和 `NativeBridge` 占位。
- `Info.plist`：本地 HTTP 调试权限和 App 基础配置。

## 后续演进

下一步应先定义 Native Bridge 契约，再接真实系统能力：

- 系统日历权限。
- 通知权限。
- 语音输入。
- 图片 / 文件选择。
- H5 与 Native 的事件回传。
- 生产环境 HTTPS 域名与 ATS 白名单收紧。

不建议在 iOS 层实现产品业务状态机。
