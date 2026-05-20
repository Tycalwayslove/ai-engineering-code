# Android

## 目的

该目录保存 AI 时间管理 Agent 的 Android 原生壳。

## 所有权

当前 Android 只保留稳定 Native Shell 骨架。现阶段实际原生开发先集中在 iOS：

- 启动 Android App。
- 用 `WebView` 加载 H5 产品层。
- 提供深色宿主背景、加载态和错误态。
- 预留 `NativeBridge` JavaScript Interface。

业务界面、AI 执行流、日程确认、Timeline 和主题系统仍由 H5 承载。

## 依赖边界

- Android 不实现日程业务逻辑。
- Android 不直接读取 `services/*` 或 `ai-factory/*`。
- Android 不直接调用后端业务接口。
- Android 后续必须复用 `contracts/hybrid-bridge`，不得另起一套 Bridge 命名。
- Android Emulator 本地调试默认加载 `http://10.0.2.2:3000`。

## 后续需求计划

Android 进入开发时，以 iOS 已验证能力作为输入清单：

1. 支持 `h5.ready`，并回传 `native.hostContext`。
2. 支持 `ui.openTimeline`、`ui.openCalendar`、`ui.openExecutionLedger`，先返回 `native.ack`。
3. 支持 `input.voice.start`、`input.keyboard.open`，未接真实系统能力前返回 `notImplemented`。
4. H5 仍通过 `ai-native-message` 事件接收 Android 回传。
5. Android 不承载产品业务页面，只承载系统能力和 WebView 宿主。

## 本地调试

1. 启动 H5：

   ```bash
   pnpm dev:h5
   ```

2. 用 Android Studio 打开：

   ```text
   apps/android
   ```

3. 等待 Gradle sync 后运行 `app`。

如果使用真机调试，需要把 `app/build.gradle.kts` 里的 `H5_DEV_URL` 改成 Mac 的局域网地址，例如 `http://192.168.x.x:3000`。

## 文件结构

- `settings.gradle.kts`：Android Studio 项目入口。
- `app/build.gradle.kts`：App 模块、SDK 版本和 H5 dev URL。
- `MainActivity.kt`：Native 壳、WebView、加载态和 Bridge 占位。
- `network_security_config.xml`：允许本地 HTTP 调试。

## 后续演进

下一步应先对齐 iOS 已验证 Bridge 行为，再接真实系统能力：

- 系统日历权限。
- 通知权限。
- 语音输入。
- 图片 / 文件选择。
- H5 与 Native 的事件回传。
- 生产环境 HTTPS 域名和 cleartext 策略收紧。

不建议在 Android 层实现产品业务状态机。
