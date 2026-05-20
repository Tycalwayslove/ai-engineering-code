# iOS

## 目的

该目录保存 AI 时间管理 Agent 的 iOS 原生壳。

## 所有权

当前 iOS 只负责稳定 Native Shell：

- 启动 SwiftUI App。
- 用 `WKWebView` 加载 H5 产品层。
- 提供深色宿主背景、加载态和错误态。
- 拥有 App 头部 Header、底部输入框、主题切换入口。
- 拥有点击菜单后出现的 Timepage 风格 Drawer、完整日历入口和执行记录入口。
- 实现 `NativeBridge` 消息入口、宿主上下文回传、视图切换事件、输入提交事件、主题切换事件和 ACK / Error 回传。
- 在无后端阶段提供可交互 mock：Header 跳转、Drawer 切换、Timepage 日期选择、原生文本输入、语音 / 图片入口 mock 文本。

H5 不再拥有 App 壳层 UI，只负责渲染后端返回的内容元素和接口驱动的页面内执行状态条。执行状态条视觉上固定在输入框上方，但数据与渲染归 H5。

## 依赖边界

- iOS 不实现日程业务逻辑。
- iOS 可以提交用户输入和系统入口事件，但不解析日程语义。
- iOS 不直接读取 `services/*` 或 `ai-factory/*`。
- iOS 不直接调用后端业务接口。
- iOS 与 H5 的通信必须通过 `contracts/hybrid-bridge` 的显式契约定义。
- 本地调试默认通过 `H5_DEV_SERVER_URL` 加载 H5。

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

模拟器默认地址是：

```text
http://127.0.0.1:3000/?native=ios
```

如果使用真机调试，`127.0.0.1` 会指向手机自己，不会指向 Mac。此时需要：

1. 启动可被局域网访问的 H5：

   ```bash
   pnpm dev:h5:host
   ```

2. 查询 Mac 的局域网 IP：

   ```bash
   ipconfig getifaddr en0
   ```

3. 在 Xcode 中打开 Target `AIEngineeringCode` 的 Build Settings，搜索 `H5_DEV_SERVER_URL`，改成：

   ```text
   http://你的-Mac-IP:3000/?native=ios
   ```

4. 确保 Mac 和 iPhone 在同一个 Wi-Fi，且系统防火墙没有拦截 3000 端口。

也可以用命令行临时覆盖：

```bash
xcodebuild \
  -project apps/ios/AIEngineeringCode.xcodeproj \
  -scheme AIEngineeringCode \
  -configuration Debug \
  -destination 'platform=iOS Simulator,name=iPhone 16,OS=18.6' \
  H5_DEV_SERVER_URL=http://127.0.0.1:3000/?native=ios \
  build
```

真机命令行构建时，需要把 `H5_DEV_SERVER_URL` 替换成 Mac 的局域网地址，并配置签名团队。

## 文件结构

- `AIEngineeringCodeApp.swift`：App 入口。
- `HybridShellView.swift`：Native 壳样式、加载态和错误态。
- `H5WebView.swift`：`WKWebView` 封装、`NativeBridge` 消息解析和 Native -> H5 事件回传。
- `Info.plist`：本地 HTTP 调试权限和 App 基础配置。

## 当前交互能力

- Header 菜单、执行记录、日历按钮会打开对应 Native Drawer，并通过 `native.viewChanged` 通知 H5 切换后端元素。
- Header 主题按钮会切换 iOS 深色 / 浅色壳层，并通过 `native.themeChanged` 通知 H5 同步主题。
- 底部输入框支持语音态和文本态切换。文本提交后，iOS 通过 `native.inputSubmitted` 把原始文本交给 H5。
- 当前 H5 使用 mock 数据模拟后端响应，真实语义解析、计划生成和写入内部日历仍属于后端后续工作。

## xcodebuild 环境

完整运行 `xcodebuild` 需要安装完整 Xcode，而不是只有 Command Line Tools。

本机首次配置：

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -license accept
sudo xcodebuild -runFirstLaunch
xcodebuild -version
```

查看项目：

```bash
xcodebuild -list -project apps/ios/AIEngineeringCode.xcodeproj
```

模拟器构建：

```bash
xcodebuild \
  -project apps/ios/AIEngineeringCode.xcodeproj \
  -scheme AIEngineeringCode \
  -configuration Debug \
  -destination 'platform=iOS Simulator,name=iPhone 16,OS=18.6' \
  build
```

如果不知道可用模拟器名称：

```bash
xcrun simctl list devices available
```

## 后续演进

下一步应在现有 Native Bridge 契约上接真实系统能力：

- 系统日历权限。
- 通知权限。
- 语音输入。
- 图片 / 文件选择。
- H5 与 Native 的事件回传。
- 生产环境 HTTPS 域名与 ATS 白名单收紧。

不建议在 iOS 层实现产品业务状态机。
