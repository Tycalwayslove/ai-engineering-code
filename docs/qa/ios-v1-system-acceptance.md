# iOS v1 系统能力验收清单

## 目的

本文用于验收 AI 时间管理 Agent 第一版 iOS 原生壳在模拟器或真机上的系统能力。自动门禁已经覆盖 Swift 编译、Simulator 安装启动、H5 可点击主链路、后端产品 smoke 和 H5 到 Native payload；但系统权限弹窗、系统 App 写入结果、照片 / 文件选择器和语音识别质量仍需要人工确认。

## 前置条件

1. 本机已安装完整 Xcode，并能通过：

   ```bash
   pnpm validate:ios-build
   pnpm validate:ios-simulator-smoke
   ```

2. 启动本地服务：

   ```bash
   pnpm dev:full
   ```

3. 模拟器使用默认 H5 地址：

   ```text
   http://127.0.0.1:3000/?native=ios
   ```

4. 真机使用 Mac 局域网地址覆盖 `H5_DEV_SERVER_URL`，例如：

   ```bash
   H5_DEV_SERVER_URL="http://你的-Mac-IP:3000/?native=ios&bridgeDebug=1" pnpm validate:ios-build
   ```

5. 验收前建议清理目标模拟器或真机里的旧 App 权限，避免旧授权掩盖权限弹窗问题。

## 验收证据

每次验收至少记录：

- 验收日期、设备型号、iOS 版本、Git 分支和提交或工作区说明。
- H5 地址覆盖后的 App 内实际地址，模拟器可检查构建产物 `Info.plist` 的 `H5DevServerURL`。
- 每个系统能力的截图、屏幕录制或系统 App 截图。
- 后端接口证据，例如 `/calendar/events`、`/reminders`、`/expenses`、`/execution-ledger` 或 `/agent/conversations/{conversationId}/debug` 响应摘要。
- 如果权限被拒绝，需要记录 H5 状态栏文案和是否仍保留后端事实。

可以先运行自动证据包采集器，生成本轮验收的辅助材料：

```bash
pnpm collect:ios-acceptance-evidence
```

如果要一次性采集当前支持的系统辅助证据，可以运行：

```bash
pnpm collect:ios-system-evidence
```

如果要单独采集键盘输入的 H5 / 后端辅助证据，可以运行：

```bash
pnpm collect:ios-keyboard-evidence
```

如果要自动验证真实 Native Header / Drawer 能切换 H5 七个页面，可以运行：

```bash
pnpm validate:ios-navigation-ui-test
```

如果要自动验证真实 Native 键盘输入框、系统键盘和发送按钮到 H5 Bridge Debug 的链路，可以运行：

```bash
pnpm validate:ios-keyboard-ui-test
```

如果要自动验证 Native 语音按钮到 H5 / 后端提醒事实的工程闭环，可以运行：

```bash
pnpm validate:ios-voice-ui-test
```

如果要归档语音 / 麦克风系统权限弹窗候选证据，可以运行：

```bash
pnpm validate:ios-voice-permission-ui-test
```

如果要自动验证 Native 纸夹入口能打开附件菜单，可以运行：

```bash
pnpm validate:ios-attachment-ui-test
```

如果要单独采集照片 / 文件 / PDF 附件输入的 H5 / 后端辅助证据，可以运行：

```bash
pnpm collect:ios-attachment-evidence
```

如果要把 `manual-evidence-record.review.json` 整理成给操作者复核的 Markdown / HTML 清单，可以运行：

```bash
pnpm prepare:ios-manual-review-pack -- --record .tmp/ios-acceptance-evidence/<run>/manual-evidence-record.review.json
```

该命令会同时生成 `manual-evidence-review-pack.md` 和 `manual-evidence-review-pack.html`。两种格式都会按 item 展示 required evidence 和已预填候选证据；HTML 版还会把截图、录屏、日志、JSON、xcresult 等候选证据路径渲染为可点击链接，便于逐项打开材料复核；它仍不代表验收通过。

证据包默认输出到 `.tmp/ios-acceptance-evidence/<timestamp>/`，包含 `manifest.json`、`acceptance-evidence.json`、`summary.md`、`manual-checklist.todo.md`、`manual-evidence-record.template.json`、`manual-evidence-record.draft.json`、`manual-evidence-record.review.json` 和 `simulator-launch.png`。常用参数：

- `AI_CODE_IOS_ACCEPTANCE_RESET_APP=1` 或 `--reset-app`：重新安装并启动 App，减少旧权限或旧 UI 状态干扰。
- `AI_CODE_IOS_ACCEPTANCE_SKIP_BUILD=1` 或 `--skip-build`：复用已有构建产物，加快重复采集。
- `AI_CODE_IOS_ACCEPTANCE_SCREENSHOT_DELAY_MS=8000` 或 `--screenshot-delay-ms 8000`：等待 WebView 加载后再截图。
- `pnpm collect:ios-system-evidence`、`AI_CODE_IOS_ACCEPTANCE_SEED_SUPPORTED_SYSTEM_EVIDENCE=1` 或 `--seed-supported-system-evidence`：一次性启用当前已支持的系统辅助证据采集，包括三领域验收事实种子、系统 Calendar App 截图、系统日历取消清理、日历权限拒绝降级、通知点击回流和通知 delivered 诊断。该模式会在系统 Calendar App 截图 / 日历取消清理前先对目标 Simulator 执行日历权限预授权，避免上一轮权限拒绝采证留下的 TCC 状态污染 EventKit 写入；随后仍会单独撤销日历权限验证降级路径。完整运行可能需要数分钟；它仍不替代人工验收。
- `AI_CODE_IOS_ACCEPTANCE_SEED_FACTS=1` 或 `--seed-acceptance-facts`：显式通过真实 Agent 提交 / 确认流向当前 Native 会话写入一条日程、一条费用和一条提醒，用于生成三领域后端事实和 H5 页面截图证据。默认关闭，避免普通采集污染当前会话。
- `AI_CODE_IOS_ACCEPTANCE_CAPTURE_CALENDAR_APP=1` 或 `--capture-calendar-system-app`：必须配合 `--seed-acceptance-facts` 使用。采集器会根据 seed 日程的 `startAt` 计算 `calshow:<seconds>`，打开 Simulator 中的系统 Calendar App 到对应日期并保存 `system-calendar-app.png`。该截图是系统 Calendar UI 辅助证据，仍需人工复核标题、日期和事件是否匹配。
- `AI_CODE_IOS_ACCEPTANCE_SEED_CALENDAR_CLEANUP=1` 或 `--seed-calendar-cleanup`：必须配合 `--seed-acceptance-facts` 使用。采集器会取消刚创建的 seed 日程，记录取消前 / 取消后 EventKit 标识符和 `calendar.removedEventIds`，并分别保存 `calendar-cleanup-before.png`、`calendar-cleanup-after.png` 两张系统 Calendar App 日期页截图。截图只作为辅助材料，机器不判断事件是否肉眼可见或消失。
- `AI_CODE_IOS_ACCEPTANCE_SEED_CALENDAR_PERMISSION_DENIAL=1` 或 `--seed-calendar-permission-denial`：显式撤销目标 Simulator 的日历权限，创建一条 seed 日程，验证后端事实仍写入且 Native 日历同步按降级路径记录 `calendar.lastSyncStatus=failed`。采集器会在权限原本已授权时尝试恢复日历权限。
- `AI_CODE_IOS_ACCEPTANCE_SEED_NOTIFICATION_CLICK_BACKFLOW=1` 或 `--seed-notification-click-backflow`：显式创建一条“3 分钟后”的 seed 提醒，刷新 Native 诊断并轮询确认对应 `ai-code.reminder.{id}` 进入 pending local notification，再用同形态 `native.viewChanged` synthetic 事件验证 H5 能打开提醒页并高亮目标提醒。该证据只证明 Native pending notification 与 H5 回流处理两段链路，不替代真实系统通知点击。
- `AI_CODE_IOS_ACCEPTANCE_SEED_NOTIFICATION_DELIVERY=1` 或 `--seed-notification-delivery`：显式创建一条“2 分钟后”的 seed 提醒，确认目标先进入 pending local notification，再等待到期和缓冲时间，轮询 Native delivered diagnostics，验证对应 `ai-code.reminder.{id}` 出现在 `notifications.deliveredReminderIds`。该证据只证明系统通知中心 delivered 诊断链路，不替代真实 banner、锁屏展示、声音、badge 或用户点击。
- `pnpm validate:ios-navigation-ui-test`：运行 Xcode UI test，真实点击 Native Header 的 Timeline、执行记录、日历和菜单按钮，再点击 Drawer 中的对话、Timeline、日程、费用、提醒、执行记录和设置入口；每次都在 H5 Bridge Debug 中断言真实 `native.viewChanged` 来源和 `view=<surface>`。该命令只证明原生可点击导航、WKWebView Bridge 和 H5 surface 切换链路，不替代人工页面截图、长列表滚动和真实业务数据复核。
- `pnpm validate:ios-keyboard-ui-test`：运行 Xcode UI test，真实点击 `ai-code.composer.mode-toggle-button`、`ai-code.composer.keyboard-text-field`、系统键盘和 `ai-code.composer.submit-button`，并在 H5 Bridge Debug 中断言 `source=native.composer.keyboard` 与提交文本；随后点击 H5 确认卡，断言确认完成后出现 `已创建提醒`、`scheduled` 和“带电脑”提醒事实。该命令会通过 UI test 专用启动参数跳过通知 / 日历权限请求，避免键盘路径被系统同步弹窗污染，并为每次运行注入独立 `AI_CODE_UI_TEST_CONVERSATION_ID`，避免旧会话数据干扰。
- `pnpm validate:ios-voice-ui-test`：运行 Xcode UI test，真实点击 `ai-code.composer.voice-button`，并在 `AI_CODE_UI_TEST_DISABLE_SYSTEM_PERMISSION_REQUESTS=1` 时通过 UI test 专用 `AI_CODE_UI_TEST_VOICE_TRANSCRIPT` 注入“明天上午十点提醒我带电脑”，随后断言 H5 Bridge Debug 出现 `source=native.composer.voice`，点击 H5 确认卡，并看到 `已创建提醒`、`scheduled` 和“带电脑”提醒事实。该命令只证明 Native 语音入口、H5 Bridge、确认卡和后端提醒读模型的工程闭环，不替代麦克风权限弹窗、真实录音和中文识别质量验收。
- `pnpm validate:ios-voice-permission-ui-test`：运行 Xcode UI test，先重置目标 App 麦克风 / 系统权限，再真实点击 `ai-code.composer.voice-button`，从 SpringBoard 权限弹窗保存 `麦克风 / 语音识别权限弹窗` 和 `iOS 权限弹窗截图或录屏` screenshot attachment。该命令只证明权限弹窗可触发并可归档，不替代真实语音识别质量或人工验收结论。
- `pnpm validate:ios-notification-ui-test`：运行 Xcode UI test，真实创建“1 分钟后”的提醒确认卡，等待 iOS 系统通知 banner，保存 `系统通知截图`，点击通知后断言 H5 显示 `已从系统通知打开提醒`，并归档 `通知点击后 App 回流` screenshot attachment 和 `system-notification-click.mp4` 录屏。该命令证明系统通知展示和点击回流可归档，不把通知权限首弹当作必然产物，也不替代人工验收结论。
- `pnpm validate:ios-attachment-ui-test`：运行 Xcode UI test，真实点击 `ai-code.composer.attachment-button`，断言系统菜单展示“选择附件”“选择照片”“选择文件”和“取消”，并继续打开照片 / 文件入口，保存 `附件菜单`、`PhotosPicker 选择流程`、`fileImporter 选择流程` 和 `PDF 选择流程` screenshot attachment。该命令会固定写出 log、xcresult 和 `attachment-ui-test.json` metadata，作为 completion audit 的 supporting-only 候选证据；它不替代真实选中文件、PhotosPicker、fileImporter、权限弹窗、安全作用域文件读取、Vision OCR 或 PDFKit 抽取质量验收。
- `pnpm collect:ios-keyboard-evidence`、`AI_CODE_IOS_ACCEPTANCE_SEED_KEYBOARD_INPUT=1` 或 `--seed-keyboard-input`：显式向当前 Native 会话注入同形态 `native.inputSubmitted`，使用 `source=native.composer.keyboard` 走 H5 `/agent/turns`、确认卡、确认执行和 `/reminders` 读模型闭环，并保存 `native-keyboard-input.png`。该证据只证明 H5 / 后端能处理原生键盘来源的输入，不替代真实 Native 输入框获得焦点、系统键盘弹出、用户实际输入和点击发送的截图。
- `pnpm collect:ios-attachment-evidence`、`AI_CODE_IOS_ACCEPTANCE_SEED_ATTACHMENT_INPUTS=1` 或 `--seed-attachment-inputs`：显式向当前 Native 会话注入同形态 `native.inputSubmitted` 附件消息，覆盖 `source=native.composer.attachment.photo`、`source=native.composer.attachment.file` 和 PDF 文本提取样例，走 H5 `/attachments/upload`、附件摘要卡和 `/attachments` 读模型闭环，并保存 `native-attachment-inputs.png`。该证据只证明 H5 / 后端能处理 Native 附件 payload，不替代真实 PhotosPicker、fileImporter、系统权限弹窗、安全作用域文件读取、Vision OCR 或 PDFKit 抽取质量验收。

自动证据包覆盖构建、安装、启动、H5 地址、服务可达性、启动截图、Native 会话 ID、同会话后端事实摘要、H5 同会话页面截图和 Native 系统诊断摘要；服务可达性不仅记录 HTTP 200，还会用 `h5NativeTargetMarkerFound` 判断默认 H5 地址是否真的是当前 AI 时间管理 H5，并用 `ios.h5DevServerTargetMarkerFound` 判断 App 包 `Info.plist` 中的 `H5DevServerURL` 是否也指向当前产品页面，避免其他本机 dev server 占用端口或 App 包地址指错时误判。启用系统 Calendar App 截图或系统日历取消清理时，`ios.calendarAccessPreparation` 会记录预授权命令、用途和结果；这一步只保证后续 EventKit 辅助证据不被旧权限拒绝状态污染，不代表人工验收通过。显式开启 seed 时，`acceptanceFactSeed` 会记录 `seedRunId`、`seedNow`、三条输入、planId 和 actionType，证明这些事实来自真实 Agent 确认流，而不是直接写库或前端 demo。显式同时开启 `--capture-calendar-system-app` 时，`calendarSystemAppEvidence` 会打开系统 Calendar App 并保存对应日期截图；该能力使用 Simulator 的 `calshow:` URL scheme，作为可复查辅助材料，不作为机器强断言。显式同时开启 `--seed-calendar-cleanup` 时，`calendarCleanupSeed` 会取消刚创建的 seed 日程，并记录目标 event、取消前 / 取消后状态、取消前 / 取消后 EventKit identifier 是否存在、Native `calendar.removedEventIds`，以及取消前 / 取消后系统 Calendar App 日期页截图；取消前会轮询 Native 诊断并记录 `preCancelDiagnosticsFresh`，只有看到本轮 EventKit identifier 后才取消，取消后也会轮询到 identifier 删除且 removed ids 包含目标 event。截图不改变 `manualAcceptanceRequired=true`，仍需人工复核标题、日期、事件详情、notes marker、无重复事件和取消后消失。显式开启 `--seed-calendar-permission-denial` 时，`calendarPermissionDenialSeed` 会撤销目标 Simulator 日历权限，创建 seed 日程，并记录后端事实、`calendar.lastSyncStatus=failed` 和 Native 日历权限错误原因；不同 iOS / Simulator 组合里 `calendar.authorizationStatus` 可能显示为 `denied` 或仍显示 `authorized`，可用性判断以 Native 同步失败和权限错误原因为准。显式开启 `--seed-notification-click-backflow` 时，`notificationClickBackflow` 会记录 seed 提醒、pending notification identifier、H5 synthetic `native.viewChanged` 入站摘要、状态文案和高亮截图，并明确 `supportingOnly=true`。显式开启 `--seed-notification-delivery` 时，`notificationDelivery` 会记录 seed 提醒、pending / delivered notification identifier、等待窗口和 delivered diagnostics，并明确 `supportingOnly=true`。显式开启 `--seed-keyboard-input` 时，`nativeKeyboardInput` 会记录 seed 输入、`source=native.composer.keyboard` 入站摘要、确认卡状态、确认后的 reminder id 和 H5 提醒页截图，并明确 `supportingOnly=true`。显式开启 `--seed-attachment-inputs` 时，`nativeAttachmentInputs` 会记录照片、文件和 PDF 三类 seed 附件、Native source、后端 attachment id、content status 和 H5 附件摘要截图，并明确 `supportingOnly=true`。H5 页面截图会在 `h5-surfaces/` 下保存对话、Timeline、日程、费用、提醒、执行记录和设置 7 个页面，用于证明同一个 `conversationId` 的用户可见读模型能够渲染；如果 H5 截图失败，会额外保存 `h5-surface-error.png`、`h5-surface-error.html`、页面 URL、title 和正文片段，辅助判断错误页、空白页、hydration 失败或端口指错。它不替代 WKWebView 真实操作、系统权限弹窗或系统 App 截图。Native 系统诊断来自 Simulator data container 中 `Library/Preferences/com.aiengineeringcode.shell.plist` 的 `ai-code.native.systemDiagnostics`，用于归档通知权限、pending / delivered notification 数量、日历权限、本地 EventKit 标识符计数、后端 event id 列表、取消清理 id 列表和权限降级错误。包内 manifest 必须保留 `acceptanceVerdict=not_evaluated`、`manualAcceptanceRequired=true` 和 `automationCanReplaceManualAcceptance=false`；键盘真实输入框操作、语音、照片 / 文件、PDF、本地通知真实展示、真实通知点击回流和系统 App UI 仍必须按下方清单人工操作并留证。

`manual-evidence-record.template.json` 是机器可读的人工补证记录模板。每个 `items[]` 都有稳定 `id`，并与 `manual-checklist.todo.md` 中的 `record_id` 对齐；其中原生导航 / 页面切换使用 `navigation_surfaces`，要求补 Header / Drawer 页面截图、真实 `source=native.header.timeline`、`source=native.drawer.quick-switch`、`view=...` 和 `pnpm validate:ios-navigation-ui-test` 输出或 xcresult。人工执行验收后，把 `status` 从 `pending` 改为 `passed`、`failed` 或 `blocked`，并把截图、录屏、接口摘要、bridge marker、系统证据路径和操作者备注写入 `evidence`。`manual-evidence-record.draft.json` 是同结构的补证草稿，会把已采集的自动辅助信号写入 `operatorNotes`，但不会把辅助信号填进截图、录屏、系统证据或通过状态。`manual-evidence-record.review.json` 会把可客观映射的自动辅助截图、API 摘要、bridge marker 和系统 artifact 预填进 `evidence` 字段，便于人工逐项复核；它仍保持所有 item 为 `pending`，不会自动改为 `passed`。这些文件默认都不能当作验收通过；只有人工证据齐全且无 P0 / P1 阻塞时，才允许在最终 completion audit 中改变结论。

人工复核时可以先用 `pnpm prepare:ios-manual-evidence-record -- --record .tmp/ios-acceptance-evidence/<run>/manual-evidence-record.review.json --output .tmp/ios-acceptance-evidence/<run>/manual-evidence-record.filled.json` 生成 filled 草稿。默认模式只写入 `operatorSignoff.mode=draft` 和 `reviewedItemIds=[]`，保留 `acceptanceVerdict=not_evaluated` 和所有 item 的 `pending` 状态，便于操作者逐项检查。只有操作者已经真实复核并确认所有证据通过时，才允许追加 `--mark-passed --operator <name> --confirmed-at <iso8601> --reviewed-item <item-id>...` 或 `--reviewed-items-file <json-or-lines>`；该模式会先按 `--require-complete` 校验证据字段，并要求确认列表与 `record.items[].id` 完全一致，缺证据、漏 item、未知 item 或重复 item 都不会生成通过记录。生成后的 filled 记录仍要再运行 `node scripts/validate-ios-manual-evidence-record.mjs --record <path> --require-complete --report <report-path>`，再进入 completion audit。

正式签署前建议先生成 `manual-evidence-review-pack.md` 和 `manual-evidence-review-pack.html`。它们会汇总 record 路径、record HEAD、当前 HEAD、新鲜度、`acceptanceVerdict`、每个 item 的状态、required evidence、缺少的候选证据、已预填的截图 / 录屏 / API 摘要 / bridge marker / 系统 artifact，以及下一步签署命令。命令同时会在同目录生成 `manual-evidence-reviewed-items.json`，签署命令会引用该文件；该文件默认包含 `schemaVersion`、`recordHeadSha` 和 `reviewedItemIds`，签署脚本会拒绝 `recordHeadSha` 与当前人工记录 `headSha` 不一致的确认列表。操作者应逐项打开材料确认后再运行。HTML 版会把本地候选证据路径渲染为可点击链接。它们都是复核工作台，不是通过证明；只要 review 记录仍是 `pending` / `not_evaluated`，completion audit 就必须保持 `not_complete`。

可以用结构化记录校验器检查模板或已补证记录：

```bash
pnpm validate:ios-manual-evidence-record
node scripts/validate-ios-manual-evidence-record.mjs --record .tmp/ios-acceptance-evidence/<run>/manual-evidence-record.draft.json --require-complete
node scripts/validate-ios-manual-evidence-record.mjs --record .tmp/ios-acceptance-evidence/<run>/manual-evidence-record.draft.json --report .tmp/ios-acceptance-evidence/<run>/manual-evidence-gaps.md
node scripts/validate-ios-manual-evidence-record.mjs --record .tmp/ios-acceptance-evidence/<run>/manual-evidence-record.draft.json --require-complete --report .tmp/ios-acceptance-evidence/<run>/manual-evidence-gaps.md
```

不传 `--record` 时，`pnpm validate:ios-manual-evidence-record` 会生成一份 dry-run 证据包并校验模板结构；传入 `--require-complete` 时，所有 `items[]` 必须为 `passed`，且每个必填证据类别都要补齐对应证据，适合最终验收前使用。传入 `--report <path>` 时，校验器会额外生成 Markdown 缺口报告，列出每个未完成项目、当前状态和缺少的截图 / 录屏 / API / bridge marker / 系统证据。

正式 v1 收尾时，也可以直接把补证后的记录交给 completion audit：

```bash
pnpm collect:v1-completion-audit -- --run-automated-commands --manual-record .tmp/ios-acceptance-evidence/<run>/manual-evidence-record.filled.json
pnpm collect:v1-completion-audit -- --run-automated-commands --manual-record best --manual-record-root .tmp/ios-acceptance-evidence
```

只要传入 `--manual-record`，completion audit 会在同一个输出目录额外归档 `manual-evidence-gaps.md`，并在 `v1-completion-audit.json` / `.md` 的 `manualEvidence.reportPath` 中记录该文件。`--manual-record best` 会在 `--manual-record-root` 下递归选择当前最适合审计的 `manual-evidence-record.filled.json`、`manual-evidence-record.review.json` 或 `manual-evidence-record.draft.json`，并把 `manualEvidence.selection` 写入审计 JSON；它只减少找文件路径的成本，不会把 review / draft 自动视为人工验收通过。completion audit 还会把人工记录或同目录 `manifest.json` 的 `headSha` 与当前 git HEAD 对比，并写入 `manualEvidence.packageFreshness`；如果记录来自旧 HEAD，最终结论必须保持 `not_complete`。即使人工记录已经通过，保留这份报告也便于后续复查当时的人工验收状态。

completion audit 还会结构化记录外部知识库同步状态。默认 `externalKnowledgeSync.status=not_synced`，并记录飞书源稿路径和最终回复必须披露的“仓库已更新，外部知识库未同步”。如果收尾时已经真实执行飞书或 Obsidian 同步，可以追加 `--external-knowledge-status synced|partial`、`--feishu-sync-evidence <path>` 或 `--obsidian-sync-evidence <path>`，把同步证据写进同一份审计 JSON。

## 必验项目

### H5 地址覆盖

验收步骤：

1. 用默认地址构建并启动模拟器 App。
2. 用 `H5_DEV_SERVER_URL` 覆盖为局域网地址重新构建。
3. 分别检查构建产物中的 `H5DevServerURL`。

预期结果：

- 默认构建为 `http://127.0.0.1:3000/?native=ios`。
- 覆盖构建为指定局域网地址。
- App 启动后能加载对应 H5 页面。

验收证据：

- `plutil -p .tmp/xcodebuild/AIEngineeringCode/Build/Products/Debug-iphonesimulator/AIEngineeringCode.app/Info.plist | rg H5DevServerURL`
- 模拟器或真机启动截图。

### 会话持久 ID

验收步骤：

1. 启动 App，观察 H5 URL 或 debug 信息中的 `conversationId`。
2. 输入一条可识别内容，例如“明天上午十点开会”，不要清理 App 数据。
3. 杀掉 App 后重新打开。

预期结果：

- Native 生成并持久化 `conversation_ios_*`。
- 重启后 H5 仍使用同一个 `conversationId`。
- 同一会话下能恢复历史 turn、待确认卡或 debug 摘要。

验收证据：

- 重启前后的 `conversationId`。
- `pnpm collect:ios-acceptance-evidence` 生成的 `acceptance-evidence.json` 中 `ios.conversationPersistence.beforeRelaunch`、`afterRelaunch` 和 `stableAcrossRelaunch`。
- `/agent/conversations/{conversationId}/turns` 响应摘要。

### 原生导航 / 页面切换

验收步骤：

1. 点击 Header 的 Timeline、执行记录、日历和菜单按钮。
2. 打开 Drawer 后依次点击对话、Timeline、日程、费用、提醒、执行记录和设置入口。
3. 每次切换后观察 H5 页面和 Bridge Debug。

预期结果：

- 原生 Header 和 Drawer 按钮都可点击。
- H5 会切到对应页面，Bridge Debug 显示 `source=native.header.*` 或 `source=native.drawer.quick-switch`。
- H5 页面展示当前会话的真实读模型，不回退到 demo fixtures。

验收证据：

- 每个页面切换后的截图或录屏片段。
- Bridge Debug 中的 `view=timeline/calendar/expenses/reminders/ledger/settings/conversation`。
- `pnpm validate:ios-navigation-ui-test` 可自动覆盖真实 Header / Drawer 点击和 H5 `native.viewChanged` 链路；人工验收仍需复核页面内容、长列表滚动和真实业务数据。

### 键盘输入

验收步骤：

1. 点击原生底部输入框。
2. 输入“明天上午十点提醒我带电脑”并发送。
3. 点击 H5 确认卡确认。

预期结果：

- H5 收到 `native.inputSubmitted`。
- 后端返回提醒确认卡。
- 确认后 `/reminders` 中出现 scheduled 提醒。
- H5 Timeline 和提醒页刷新出该提醒。

验收证据：

- 输入和确认卡截图。
- bridge/debug 日志或 H5 Bridge Debug 面板含 `source=native.composer.keyboard`。
- `/reminders?conversationId=...` 响应摘要。
- `pnpm validate:ios-keyboard-ui-test` 可自动覆盖 Native composer 稳定可访问性标识、系统键盘存在、输入中文、发送按钮、H5 确认卡点击和提醒事实可见路径。
- `pnpm collect:ios-keyboard-evidence` 可继续补 H5 / 后端确认执行和 `/reminders` 的证据包辅助截图。

### 语音输入

验收步骤：

1. 点击语音按钮。
2. 首次使用时允许麦克风和语音识别权限。
3. 说“明天上午十点提醒我带电脑”。
4. 停止录音并确认 H5 收到识别文本。

预期结果：

- iOS 弹出麦克风 / 语音识别权限请求。
- 授权后语音识别文本通过 `native.inputSubmitted` 提交。
- 后端生成提醒确认卡。
- 识别失败时 H5 显示 Native 能力失败，不创建错误业务事实。

验收证据：

- 权限弹窗截图或录屏。
- 识别文本截图。
- bridge/debug 日志或 H5 Bridge Debug 面板含 `source=native.composer.voice`。
- 失败场景的 H5 状态栏文案。
- `pnpm validate:ios-voice-ui-test` 可自动覆盖 Native 语音按钮、UI test 专用 transcript 注入、H5 Bridge Debug 来源、H5 确认卡点击和后端提醒事实可见路径。
- `pnpm validate:ios-voice-permission-ui-test` 可自动归档语音 / 麦克风权限弹窗候选截图和 xcresult。
- 半自动采证可以定位 `ai-code.composer.voice-button` 和 `ai-code.composer.mode-toggle-button`，但语音权限弹窗和识别质量仍必须人工判断。

### 照片附件

验收步骤：

1. 点击纸夹入口，选择照片。
2. 首次使用时允许照片访问权限。
3. 选择一张包含票据文字或金额的图片。
4. 点击“作为费用票据处理”快捷回复。

预期结果：

- Native 通过 PhotosPicker 返回附件名称、类型、大小。
- 小于 5MB 时 payload 包含 `base64Content`，H5 调用 `/attachments/upload`。
- Vision OCR 识别出的文本追加到附件 `text`。
- 如果识别到金额，后端生成费用确认卡；没有金额时进入金额追问。

验收证据：

- 照片选择流程截图。
- bridge/debug payload 含 `inputKind=attachment`、`attachmentKind=image`、`attachmentSizeBytes`，小文件样例含 `base64Content`。
- H5 Bridge Debug 面板应显示附件来源、`input=attachment` 和附件名，但不展示 `base64Content`。
- `/attachments?conversationId=...` 响应摘要，包含 `contentStatus` 和文本摘要。
- 费用确认卡或金额追问截图。
- `pnpm validate:ios-attachment-ui-test` 可自动覆盖 Native 纸夹按钮、附件菜单，以及 `PhotosPicker 选择流程` 候选截图。
- 半自动采证可以从 `ai-code.composer.attachment-button` 打开附件入口，但 PhotosPicker 权限、选择器体验和真实 OCR 质量仍必须人工判断。

### 文件附件

验收步骤：

1. 点击纸夹入口，选择文件。
2. 选择一个小文本文件或图片文件。
3. 观察 H5 附件摘要卡和后续快捷回复。

预期结果：

- Native 通过 fileImporter 返回附件元数据。
- 小于 5MB 时 H5 调用 `/attachments/upload`。
- 大于 5MB 或读取失败时 H5 调用 `/attachments/intake`，保留元数据流程。
- 文件读取失败不阻断用户继续对话。

验收证据：

- 文件选择截图。
- bridge/debug payload 含 `inputKind=attachment`、文件名、MIME type、大小；超过 5MB 样例应记录没有 `base64Content`。
- H5 Bridge Debug 面板应显示 `input=attachment` 和文件名，但不展示文件内容。
- `/attachments?conversationId=...` 响应摘要。
- H5 附件摘要卡截图。

### PDF 文本提取

验收步骤：

1. 选择一个包含文字的 PDF。
2. 观察附件摘要和后续“作为日程材料处理 / 作为费用票据处理”快捷回复。

预期结果：

- Native 使用 PDFKit 抽取页面文本。
- 抽取文本进入附件 `text`。
- 后端可基于附件摘要追问时间、金额或生成候选确认卡。

验收证据：

- PDF 选择截图。
- `/attachments?conversationId=...` 中附件文本摘要。
- 后续追问或确认卡截图。

### 本地通知

验收步骤：

1. 创建一个未来 2 到 5 分钟的提醒并确认。
2. 首次使用时允许通知权限。
3. 保持 App 后台或锁屏等待通知。

预期结果：

- iOS 弹出通知权限请求。
- 已确认 scheduled 提醒同步为本地通知。
- 到点出现系统通知。
- 如果权限拒绝，H5 显示“后端事项已保存，系统同步未开启”，提醒事实仍保留。

验收证据：

- 通知权限状态截图或诊断摘要；如果首次授权环境出现系统权限弹窗，补充权限弹窗截图。
- 系统通知截图。
- 调试日志或 Xcode 控制台记录本地通知标识 `ai-code.reminder.{id}`。
- 自动证据包 `ios.systemDiagnostics.notifications.authorizationStatus`、`notifications.pendingReminderCount` 和 `notifications.pendingReminderIds` 摘要。
- 自动证据包 `notificationSyncBridge.available=true`、`bridgeOutboundLabel` 包含 `notifications.reminders.sync` 且 `targetReminderIncluded=true` 时，可作为 H5 已把目标 scheduled 提醒同步给 Native 的 Bridge 辅助证据；它不替代通知权限弹窗、系统通知截图或 delivered diagnostics。
- 自动证据包显式开启 `--seed-notification-delivery` 后，`notificationDelivery.available=true`、`pendingNotificationFound=true`、`deliveredNotificationFound=true` 和 `notifications.deliveredReminderIds` 包含目标标识，可作为系统通知 delivered 诊断辅助证据；它不替代真实系统通知展示截图。
- `pnpm validate:ios-notification-ui-test` 生成的 `系统通知截图`、`ios-notification-ui-test.xcresult` 和 `notification-ui-test.json` 可作为系统通知展示候选证据；该命令不保证通知权限首弹一定出现。
- `/reminders?conversationId=...` 响应摘要。

### 通知点击回流

验收步骤：

1. 点击系统提醒通知。
2. 观察 App 是否打开提醒视图。
3. 观察对应提醒是否高亮并滚动到可见位置。

预期结果：

- Native 打开 reminders drawer。
- 通过 `native.viewChanged` 向 H5 发送 `view=reminders` 和 `reminderId`。
- H5 刷新提醒快照并高亮对应提醒行。
- 通知点击刷新时不重复触发 Native 日历或提醒同步。

验收证据：

- 点击通知后的提醒页截图或录屏。
- H5 debug / bridge debug 中的 viewChanged 摘要，包含 `source=native.notifications.reminders.opened`、`view=reminders` 和 `reminderId`。
- 自动证据包 `notificationClickBackflow.available=true`、`pendingNotificationFound=true`、`h5StatusText=已从系统通知打开提醒` 和 `highlightedReminderFound=true` 的摘要；该证据使用 synthetic Native message，只能辅助证明 H5 回流处理，不能替代真实系统通知点击录屏。
- `pnpm validate:ios-notification-ui-test` 生成的 `system-notification-click.mp4`、`通知点击后 App 回流` attachment 和 xcresult 可作为真实系统通知点击回流候选证据；人工记录仍需保持复核结论。

### 系统日历写入

验收步骤：

1. 创建一个未来日程并确认。
2. 首次使用时允许日历权限。
3. 打开 iOS 系统日历检查事件。

预期结果：

- iOS 弹出日历 full access 权限请求。
- 系统日历出现对应标题、开始时间和结束时间。
- 重复刷新不创建重复系统日历事件。
- 事件 notes 中保留 `AI_CODE_EVENT_ID:{id}` marker 和 `AI_CODE_ACTION_ID:{sourceActionId}` marker。

验收证据：

- 日历权限弹窗截图。
- 系统日历事件截图。
- 系统日历 notes 中包含 `AI_CODE_EVENT_ID:{id}` 与 `AI_CODE_ACTION_ID:{sourceActionId}`。
- 自动证据包显式开启 `--capture-calendar-system-app` 后生成的 `system-calendar-app.png` 可作为系统 Calendar UI 辅助截图，但仍需人工复核事件标题和日期。
- `/calendar/events?conversationId=...` 响应摘要。

### 系统日历取消清理

验收步骤：

1. 在 H5 或 Timeline 中取消刚创建的日程。
2. 打开系统日历检查同一事件。

预期结果：

- 后端日程状态变为 `canceled`。
- H5 仍向 Native 同步 canceled event。
- iOS 根据 marker 删除旧系统日历事件。
- H5 状态显示业务执行完成。

验收证据：

- H5 取消动作截图。
- 系统日历中事件消失的截图。
- `/calendar/events?conversationId=...` 响应摘要。
- 自动证据包 `calendarCleanupSeed.available=true`、`preCancelDiagnosticsFresh=true`、`preCancelStoredIdentifierPresent=true`、`postCancelStoredIdentifierPresent=false`、`postCancelRemovedEventIdPresent=true` 和 `calendar.removedEventIds` 包含目标 event id 的摘要。
- 自动证据包中的 `calendar-cleanup-before.png` 和 `calendar-cleanup-after.png` 可作为取消前 / 取消后系统 Calendar UI 辅助截图；它们不能单独判定验收通过。

### 后端事实确认

验收步骤：

1. 分别创建并确认日程、提醒和费用。
2. 切换到 Timeline、日程、提醒、费用和执行记录页。

预期结果：

- 三类事项均由后端事实驱动展示，不依赖前端 demo 数据。
- Timeline 能合并展示日程、提醒和费用。
- 执行记录包含 `action_executed` 或 `direct_action_executed`。

验收证据：

- 五个页面截图。
- `pnpm collect:ios-acceptance-evidence` 生成的 `acceptance-evidence.json` 中 `backendFactSnapshot.counts` 和对应 `commands`。
- `/execution-ledger?conversationId=...` 响应摘要。

### 系统同步降级

验收步骤：

1. 拒绝通知或日历权限。
2. 创建并确认对应提醒或日程。

预期结果：

- 后端事实仍写入成功。
- H5 状态栏显示“后端事项已保存，系统同步未开启”。
- 对输入能力失败，例如语音启动失败，仍显示 failed，不误报业务成功。

验收证据：

- 权限拒绝截图。
- H5 状态栏截图。
- 后端事实接口响应摘要。
- 自动证据包 `calendarPermissionDenialSeed.available=true`、`calendar.authorizationStatus=denied`、`calendar.lastSyncStatus=failed`、`calendar.lastError` 和后端日程事实摘要。

## 不能由自动 smoke 替代

以下内容不能由当前自动 smoke 证明，必须保留人工验收：

- 用户是否看到了正确的 iOS 权限弹窗。
- 语音识别是否在真实环境中稳定识别中文。
- PhotosPicker / fileImporter 是否符合预期交互。
- Vision OCR 和 PDFKit 在真实样本上的文本质量。
- 系统通知是否在后台、锁屏或前台按预期展示。
- 通知点击是否在真实交互中回到正确提醒。
- EventKit 是否写入用户可见日历，并正确清理取消事件。
- 真机局域网、系统防火墙和 ATS 调试白名单组合是否可用。

## 自动门禁覆盖范围

- `pnpm validate:ios-build`：证明 Swift 工程可以构建。
- `pnpm validate:ios-simulator-smoke`：证明 App 可以安装并启动到 iPhone Simulator。
- `pnpm collect:ios-acceptance-evidence`：采集 iOS 辅助证据包，证明本地服务、H5 地址、构建、安装、启动和截图链路可复查。
- `pnpm validate:h5-click-smoke`：证明 H5 主链路可点击，并验证发给 Native 的日历 / 提醒 sync payload。
- `pnpm validate:product-smoke`：证明 in-memory 后端产品主路径。
- `pnpm validate:product-smoke:postgres`：证明 Postgres migration、repository 和产品 API 主路径。
- `pnpm validate:llm-smoke`：证明真实 LLM provider 的主要对话路由质量。

人工验收和自动门禁应互补使用：自动门禁防代码回归，人工验收确认系统权限和真实设备体验。
