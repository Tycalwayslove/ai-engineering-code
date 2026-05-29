# iOS

## 目的

该目录保存 AI 时间管理 Agent 的 iOS 原生壳。

## 所有权

当前 iOS 只负责稳定 Native Shell：

- 启动 SwiftUI App。
- 用 `WKWebView` 加载 H5 产品层。
- 提供深色宿主背景、加载态和错误态。
- 拥有 App 头部 Header、底部输入框、主题切换入口和本地通知调度能力。
- 拥有点击菜单后出现的 Timepage 风格 Drawer、完整日历入口和执行记录入口。
- 实现 `NativeBridge` 消息入口、宿主上下文回传、视图切换事件、输入提交事件、主题切换事件和 ACK / Error 回传。
- 提供 Header 跳转、Drawer 切换、Timepage 日期选择、原生文本输入、原生语音识别入口、提醒本地通知调度和图片入口文本，并通过 H5 驱动后端 Agent 流程。

H5 不再拥有 App 壳层 UI，只负责渲染后端返回的内容元素和接口驱动的页面内执行状态条。执行状态条视觉上固定在输入框上方，但数据与渲染归 H5。

## 依赖边界

- iOS 不实现日程业务逻辑。
- iOS 可以提交用户输入和系统入口事件，但不解析日程语义。
- iOS 不直接读取 `services/*` 或 `ai-factory/*`。
- iOS 不直接调用后端业务接口。
- iOS 可以根据 H5 同步的已确认提醒事实调度本地通知，但不决定提醒业务语义。
- iOS 可以根据 H5 同步的已确认日程事实写入系统日历，但不决定日程业务语义。
- iOS 与 H5 的通信必须通过 `contracts/hybrid-bridge` 的显式契约定义。
- 本地调试默认通过 `H5_DEV_SERVER_URL` 加载 H5。

## 本地调试

1. 启动前后端：

   ```bash
   pnpm dev:full
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

该地址来自 Target Build Settings 的 `H5_DEV_SERVER_URL`，并通过 `Info.plist` 的 `H5DevServerURL=$(H5_DEV_SERVER_URL)` 展开到构建产物中。

如果使用真机调试，`127.0.0.1` 会指向手机自己，不会指向 Mac。此时需要：

1. 启动可被局域网访问的 H5 和 API：

   ```bash
   pnpm dev:full
   ```

2. 查询 Mac 的局域网 IP：

   ```bash
   ipconfig getifaddr en0
   ```

3. 在 Xcode 中打开 Target `AIEngineeringCode` 的 Build Settings，搜索 `H5_DEV_SERVER_URL`，改成：

   ```text
   http://你的-Mac-IP:3000/?native=ios
   ```

4. 确保 Mac 和 iPhone 在同一个 Wi-Fi，且系统防火墙没有拦截 `3000` 和 `8000` 端口。

H5 会根据当前页面地址自动推导 API 地址：例如 H5 为 `http://192.168.1.238:3000/?native=ios&bridgeDebug=1` 时，API 会请求 `http://192.168.1.238:8000`。底部输入框提交“明天下午三点安排一个新年业务规划会，时间一个半小时”后，H5 会调用后端生成确认卡；点击确认后会写入 Postgres 的 `calendar_events` 和 `execution_ledger`。

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
- `Info.plist`：本地 HTTP 调试权限、语音 / 麦克风 / 日历权限说明和 App 基础配置。

## 当前交互能力

- Header 菜单、执行记录、日历按钮会打开对应 Native Drawer，并通过 `native.viewChanged` 通知 H5 切换后端元素。
- Header 主题按钮会切换 iOS 深色 / 浅色壳层，并通过 `native.themeChanged` 通知 H5 同步主题。
- Native 会用 `UserDefaults` 保存稳定 `conversation_ios_*`，并在 H5 URL 缺少 `conversationId` 时自动追加该参数，保证 App 重启后 H5 仍恢复同一后端会话视角。
- 底部输入框支持文本提交和点击式语音输入。文本提交后，iOS 通过 `native.inputSubmitted` 把原始文本交给 H5；语音输入会调用 iOS Speech / Microphone 权限，把识别出的中文文本作为 `native.inputSubmitted` 提交给 H5。
- 纸夹附件入口会打开原生选择器：照片走 `PhotosPicker`，文件走 `fileImporter`；选择后通过 `native.inputSubmitted` 提交附件名称、类型、大小和可读文本。照片和 Files 中的图片会先用 iOS Vision 尝试识别文字，PDF 文件会用 PDFKit 抽取页面文本，识别结果会追加到附件 `text` 中；识别失败不阻断附件提交。原始内容不超过 5MB 的照片或文件会额外携带 `base64Content`，超过 5MB 时仍只提交元数据和可读文本。
- H5 收到 `native.inputSubmitted` 后会调用后端 `/agent/turns`，渲染后端确认卡；用户确认后调用 `/execution-plans/{id}/confirm`，再刷新数据库日程、提醒和执行记录。
- H5 刷新到已确认提醒后，会通过 `notifications.reminders.sync` 把提醒事实同步给 iOS；iOS 请求系统通知权限，并用提醒 `id` 调度本地通知，重复刷新会覆盖同一提醒的 pending notification。
- 用户点击系统提醒通知后，iOS 会打开提醒 Drawer，并通过 `native.viewChanged` 把 `view=reminders` 和 `reminderId` 回传给 H5；H5 会刷新提醒快照并高亮对应提醒行。
- H5 刷新到已确认日程后，会通过 `calendar.events.sync` 把全部日程事实同步给 iOS；iOS 请求系统日历权限，并用后端 `event.id` 写入 notes marker，重复刷新会替换同一日程而不是重复创建。非 `scheduled` 日程不会写入系统日历，如果本地已存在同一 marker 的旧系统日历事件，会在同步时删除，避免后端取消后系统日历残留。

## 验收自动化标识

Native composer 为后续 Simulator / XCUITest / 可访问性半自动采证保留稳定 accessibility identifiers：

- `ai-code.composer.attachment-button`
- `ai-code.composer.keyboard-text-field`
- `ai-code.composer.submit-button`
- `ai-code.composer.voice-button`
- `ai-code.composer.mode-toggle-button`

这些标识只用于定位真实原生控件，不能替代系统权限弹窗、语音识别质量、PhotosPicker / fileImporter 体验、系统通知或系统日历写入结果的人工验收。

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

推荐用根目录门禁命令做模拟器编译校验：

```bash
pnpm validate:ios-build
```

该命令默认使用 `generic/platform=iOS Simulator`、`CODE_SIGNING_ALLOWED=NO` 和仓库内 `.tmp/xcodebuild/AIEngineeringCode` 作为 DerivedData，避免绑定某个具体模拟器名称或污染用户全局 DerivedData。可用以下环境变量覆盖：

- `AI_CODE_IOS_PROJECT`
- `AI_CODE_IOS_SCHEME`
- `AI_CODE_IOS_CONFIGURATION`
- `AI_CODE_IOS_DESTINATION`
- `AI_CODE_IOS_DERIVED_DATA_PATH`
- `AI_CODE_IOS_BUILD_TIMEOUT_MS`
- `H5_DEV_SERVER_URL`

推荐用根目录 smoke 命令验证 App 能安装并启动到 iOS Simulator：

```bash
pnpm validate:ios-simulator-smoke
```

该命令会先运行 `pnpm validate:ios-build`，然后选择一个可用 iPhone Simulator，优先复用已经 booted 的设备；安装 `.tmp/xcodebuild/AIEngineeringCode/Build/Products/Debug-iphonesimulator/AIEngineeringCode.app`，启动 `com.aiengineeringcode.shell`，并用 `simctl get_app_container` 验证安装成功。它不会启动 H5 / API，也不会验证语音、通知、日历或照片权限弹窗；这些仍需要 Xcode 模拟器或真机手测。

可用以下环境变量覆盖 simulator smoke：

- `AI_CODE_IOS_APP_PATH`
- `AI_CODE_IOS_BUNDLE_ID`
- `AI_CODE_IOS_SIMULATOR_UDID`
- `AI_CODE_IOS_SIMULATOR_SKIP_BUILD=1`
- `AI_CODE_IOS_SIMULATOR_KEEP_BOOTED=1`
- `AI_CODE_IOS_SIMULATOR_KEEP_APP_RUNNING=1`

如果要验证真实 Native 顶部导航和 Drawer 能切换 H5 七个页面，可以在本地 H5 页面可访问时运行：

```bash
pnpm validate:ios-navigation-ui-test
```

该命令通过 Xcode UI test 真实点击 `ai-code.native.header.timeline-button`、`ai-code.native.header.ledger-button`、`ai-code.native.header.calendar-button` 和 `ai-code.native.header.menu-button`，再点击 Drawer 中的 `timeline/calendar/expenses/reminders/ledger/settings/conversation` 七个 quick-switch 按钮；每次都在 H5 Bridge Debug 中断言对应 `source=native.header.*` 或 `source=native.drawer.quick-switch` 与 `view=<surface>`。它证明原生可点击导航、WKWebView Bridge 和 H5 surface 切换链路可自动防回归，但不替代人工验收中的页面截图、长列表滚动和真实业务数据复核。

如果要验证真实 Native 键盘输入路径，可以在本地 H5 页面可访问时运行：

```bash
pnpm validate:ios-keyboard-ui-test
```

该命令通过 Xcode UI test 启动 `AIEngineeringCodeUITests`，真实点击 mode toggle、Native TextField、系统键盘和发送按钮，并在 H5 Bridge Debug 中断言 `source=native.composer.keyboard` 与提交文本；随后点击 H5 确认卡，断言确认完成后出现 `已创建提醒`、`scheduled` 和“带电脑”提醒事实。UI test 会通过启动参数跳过通知 / 日历权限请求，避免系统同步弹窗污染键盘路径，并为每次运行注入独立 `AI_CODE_UI_TEST_CONVERSATION_ID`，避免旧会话数据干扰。可用以下环境变量覆盖：

- `AI_CODE_IOS_KEYBOARD_UI_TEST_DESTINATION`
- `AI_CODE_IOS_KEYBOARD_UI_TEST_TIMEOUT_MS`
- `AI_CODE_IOS_DERIVED_DATA_PATH`
- `H5_DEV_SERVER_URL`

如果要验证 Native 语音按钮到 H5 / 后端提醒事实的工程闭环，可以运行：

```bash
pnpm validate:ios-voice-ui-test
```

该命令通过 Xcode UI test 真实点击 `ai-code.composer.voice-button`，并通过 UI test 专用的 `AI_CODE_UI_TEST_VOICE_TRANSCRIPT` 注入识别文本，随后断言 H5 Bridge Debug 出现 `source=native.composer.voice`，点击 H5 确认卡，并看到 `已创建提醒`、`scheduled` 和“带电脑”提醒事实。该注入只在 `AI_CODE_UI_TEST_DISABLE_SYSTEM_PERMISSION_REQUESTS=1` 时生效，不影响普通 App 的真实 Speech / Microphone 路径；它不能替代麦克风权限弹窗、真实录音和中文识别质量的人工验收。

如果要验证 Native 纸夹入口能打开附件菜单，可以运行：

```bash
pnpm validate:ios-attachment-ui-test
```

该命令通过 Xcode UI test 真实点击 `ai-code.composer.attachment-button`，并断言系统菜单展示“选择附件”“选择照片”“选择文件”和“取消”。它只证明附件入口可点击和菜单选项可见，不替代 PhotosPicker、fileImporter、系统权限弹窗、安全作用域文件读取、Vision OCR 或 PDFKit 抽取质量验收。

系统权限和真机体验不能只靠自动 smoke 判断。第一版发布前需要按仓库清单执行人工验收：

```bash
pnpm validate:ios-manual-acceptance
```

该命令只验证 [iOS v1 系统能力验收清单](../../docs/qa/ios-v1-system-acceptance.md) 是否覆盖必需项目和证据字段；实际权限弹窗、语音识别、照片 / 文件选择、系统通知、通知点击回流和系统日历写入 / 取消清理仍需要在 Xcode 模拟器或真机上逐项执行。

可以先生成一份 iOS 验收辅助证据包：

```bash
pnpm collect:ios-acceptance-evidence
```

该命令会采集 git 状态、本地 API / H5 可达性、构建产物 `H5DevServerURL`、iOS build、Simulator 安装启动、启动截图和人工验收清单形状，默认输出到 `.tmp/ios-acceptance-evidence/<timestamp>/`。证据包包含 `manifest.json`、`acceptance-evidence.json`、`summary.md`、`manual-checklist.todo.md` 和 `simulator-launch.png`。常用覆盖项：

- `AI_CODE_IOS_ACCEPTANCE_RESET_APP=1` 或 `--reset-app`
- `AI_CODE_IOS_ACCEPTANCE_SKIP_BUILD=1` 或 `--skip-build`
- `AI_CODE_IOS_ACCEPTANCE_SCREENSHOT_DELAY_MS=8000` 或 `--screenshot-delay-ms 8000`
- `AI_CODE_IOS_ACCEPTANCE_EVIDENCE_DIR=.tmp/ios-acceptance-evidence/manual-pass-1` 或 `--output-dir .tmp/ios-acceptance-evidence/manual-pass-1`

这份证据包只能证明可自动采集的构建、安装、启动、H5 地址和服务可达性。包内 manifest 会固定声明 `acceptanceVerdict=not_evaluated`、`manualAcceptanceRequired=true` 和 `automationCanReplaceManualAcceptance=false`；它不能替代语音、照片 / 文件、PDF、本地通知、通知点击回流、系统日历和权限拒绝降级的真实人工验收。

也可以直接运行 `xcodebuild` 做模拟器构建：

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

- 通知点击回到对应提醒详情，而不只是提醒列表。
- 语音输入的长按交互、异常提示和真机识别质量优化。
- 图片 / 文件上传、OCR 和票据解析。
- H5 与 Native 的事件回传。
- 生产环境 HTTPS 域名与 ATS 白名单收紧。

不建议在 iOS 层实现产品业务状态机。
