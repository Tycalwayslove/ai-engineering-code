# AI 时间管理 Agent v1 readiness audit

## 当前结论

Goal 不能标记 complete。

当前代码和文档已经把第一版主链路推进到“自动化主路径基本可验收”的状态。本轮已补跑真实 LLM provider、SDK runtime、v1 readiness 和 factory 总闸门，但仍缺少 iOS 系统能力人工验收的真实证据。自动化门禁能证明后端、H5、契约、iOS 编译和 Simulator 安装启动；它不能证明真实权限弹窗、语音识别质量、照片 / 文件选择器、系统通知投递、通知点击回流和系统日历写入 / 删除已经在模拟器或真机上逐项通过。

因此本审计文档的结论是：继续保持 goal active，直到自动化证据和人工证据都满足完成判定门槛。

## 自动化证据

| 证据域 | 当前命令 | 证明范围 | 当前状态 |
| --- | --- | --- | --- |
| 后端产品主路径 | `pnpm validate:product-smoke` | in-memory runtime + rule planner 下的日程、提醒、费用、追问、确认、直接动作、只读查询、debug trace、会话历史和附件资源主路径 | 已有命令，需在最终 completion audit 前重新运行 |
| Postgres 持久化主路径 | `pnpm validate:product-smoke:postgres` | migration、Postgres repository、真实数据库读写、产品 API 主路径 | 已有命令，需本地 Postgres 可用并在最终 completion audit 前重新运行 |
| H5 可点击主链路 | `pnpm validate:h5-click-smoke` | H5 页面、NativeBridge mock、对话、quick reply、确认卡、Timeline 编辑和三领域行内动作 | 已有命令，需在最终 completion audit 前重新运行 |
| H5 到 Native payload | `pnpm validate:h5-click-smoke` 和 `pnpm validate:contracts` | `calendar.events.sync` 与 `notifications.reminders.sync` payload 必填字段、取消日程清理 payload、完成提醒排除 payload | 已有命令，需在最终 completion audit 前重新运行 |
| iOS 编译 | `pnpm validate:ios-build` | Swift 工程 Debug simulator build、`H5_DEV_SERVER_URL` build setting、签名关闭下产出 `.app` | 已有命令，需在最终 completion audit 前重新运行 |
| iOS Simulator 安装启动 | `pnpm validate:ios-simulator-smoke` | 选择 / 启动 iPhone Simulator、安装 `.app`、launch `com.aiengineeringcode.shell`、`get_app_container` | 已有命令，需在最终 completion audit 前重新运行 |
| iOS 系统能力人工验收清单完整性 | `pnpm validate:ios-manual-acceptance` | 检查人工验收清单包含权限、系统能力和证据 marker | 已通过文档级门禁，但不等于人工验收已经执行 |
| 真实 LLM provider | `pnpm validate:llm-smoke` | DeepSeek / OpenAI provider 的 `chat`、`clarification`、`mixed`、只读查询和安全追问 | 已有命令，依赖 `.env.local` 中 provider key；最终 completion audit 前需重新运行或明确跳过原因 |
| Postman / OpenAPI / SDK 契约 | `pnpm validate:contracts` 和 `pnpm validate:sdk-runtime` | OpenAPI、Postman、SDK 方法、直接动作必传 `conversationId`、Hybrid Bridge payload schema | 已有命令，需在最终 completion audit 前重新运行 |
| 上下文与知识同步 | `pnpm validate:context-sync` | 当前项目状态、记忆索引、飞书源稿和同步声明 | 已有命令，需在阶段结束前重新运行 |
| 全局格式残留 | `git diff --check` | 空白错误和 patch 格式问题 | 已有命令，需在最终 completion audit 前重新运行 |

## 本轮自动化证据

2026-05-28 本轮状态检查中已重新运行：

- `pnpm validate:llm-smoke`：通过，provider 为 `deepseek`。
- `pnpm validate:sdk-runtime`：通过。
- `pnpm validate:v1-readiness`：通过。
- `pnpm validate:factory`：通过；其中包含 `validate:h5-runtime`、`validate:h5-datetime-runtime`、`validate:sdk-runtime` 和 `validate:context-sync`。
- `AI_CODE_PRODUCT_SMOKE_TIMEOUT_SECONDS=45 pnpm validate:product-smoke:live`：通过。此前 live 服务组合会因真实 provider 对核心时间/金额/patch 的语义漂移而失败；已通过 `rule_safety_deterministic` 护栏修复，当前运行中的 `127.0.0.1:8000` API 能通过完整 live product smoke。
- `pnpm validate:product-smoke`：通过，证明 in-memory runtime + rule planner 下的产品主路径仍可用。

同一轮工作中此前已经通过的证据包括：`pnpm validate:contracts`、`pnpm validate:product-smoke`、`pnpm validate:product-smoke:postgres`、`pnpm validate:h5-click-smoke`、`pnpm validate:ios-simulator-smoke`、`pnpm validate:native-shells`、`pnpm validate:ios-manual-acceptance`、`pnpm validate:v1-readiness`、`pnpm validate:context-sync` 和 `git diff --check`。这些命令证明自动化主路径已经具备完整验收入口；正式 completion audit 仍应在收尾时整套重跑并保存结果。

## 人工证据缺口

以下内容必须按 `docs/qa/ios-v1-system-acceptance.md` 在 Xcode 模拟器或真机上逐项记录证据。没有这些证据时，不能把“第一版原生 App 系统能力完整可用”作为已完成事实。

| 缺口 | 需要的证据 | 自动化为什么不能替代 |
| --- | --- | --- |
| H5 地址覆盖 | 默认地址和局域网 `H5_DEV_SERVER_URL` 构建后 App 实际加载截图、构建产物 `H5DevServerURL` 记录 | 自动 build 只能检查构建产物，不能证明真机网络和防火墙组合可用 |
| 会话持久 ID | 重启前后同一 `conversation_ios_*`、后端历史仍可读取 | Simulator smoke 只 launch App，不检查 H5 URL 和后端历史 |
| 键盘输入 | 键盘弹出、`source=native.composer.keyboard`、后端确认卡和提醒事实 | H5 click smoke 使用 mock NativeBridge，不验证真实原生输入框 |
| 语音输入 | 麦克风 / 语音识别权限弹窗、`source=native.composer.voice`、识别文本和确认卡 | 自动脚本不能采集麦克风，也不能证明中文识别质量 |
| 照片附件 | PhotosPicker 截图、`inputKind=attachment`、`attachmentKind=image`、OCR 文本、`base64Content` 小文件样例、附件接口摘要 | 自动脚本不能打开系统照片选择器或验证 Vision OCR 样本质量 |
| 文件附件 | fileImporter 截图、文件名 / MIME / size、超过 5MB 不传 `base64Content` 的边界样例 | 自动脚本不打开文件选择器，也不覆盖真实安全作用域文件读取 |
| PDF 文本提取 | PDF 选择截图、PDFKit 抽取文本摘要、后续追问或确认卡 | 自动脚本不验证真实 PDF 样本抽取质量 |
| 本地通知 | 通知权限弹窗、系统通知截图、`ai-code.reminder.{id}` 标识、提醒事实摘要 | payload smoke 不证明系统通知投递 |
| 通知点击回流 | 点击通知录屏、reminders drawer 打开、目标提醒高亮、`source=native.notifications.reminders.opened` | 自动脚本不触发真实系统通知点击 |
| 系统日历写入 | 日历权限弹窗、系统日历事件截图、`AI_CODE_EVENT_ID:{id}` 和 `AI_CODE_ACTION_ID:{sourceActionId}` notes marker | payload smoke 不证明 EventKit 写入用户可见日历 |
| 系统日历取消清理 | H5 取消动作、后端 `canceled` 状态、系统日历旧事件消失 | payload smoke 不证明 EventKit 删除实际成功 |
| 后端事实确认 | 日程、提醒、费用、Timeline、执行记录页面截图和接口摘要 | product smoke 证明 API 主路径，但不证明当前真机 / 模拟器会话 UI 已留证 |
| 系统同步降级 | 拒绝通知或日历权限后的 H5 状态栏和后端事实接口摘要 | 自动脚本不操作系统权限拒绝场景 |

## 未完成证据

- 尚未在仓库中保存完整的 iOS 系统能力人工验收记录。
- 尚未在单一 completion audit 记录中留存全套自动化命令输出；本轮已补跑 LLM、SDK、readiness 和 factory 关键门禁。
- 尚未执行外部知识库真实同步；当前只有仓库内 `docs/knowledge-sync/feishu-pages/` 源稿更新。

## 完成判定门槛

只有同时满足以下条件，才可以把 goal 标记为 complete：

1. 自动化证据表中的命令在同一 completion audit 中重新运行，并且全部通过；如果某个命令因为环境原因无法运行，需要有明确风险说明，不能把缺证据当作已完成。
2. `docs/qa/ios-v1-system-acceptance.md` 中的必验项目已经在模拟器或真机上逐项执行，并沉淀截图、录屏、bridge/debug 或后端接口摘要。
3. iOS 系统能力人工验收没有 P0 / P1 阻塞项；若有问题，需要在代码、文档或已知问题记录中闭环。
4. `pnpm validate:context-sync` 通过，且 `current-project-state.md` 记录最终 completion audit 的日期、命令和结论。
5. 外部知识库如未实际同步，最终回复必须明确“仓库已更新，外部知识库未同步”。

## 下一步建议

1. 先运行可自动化的最终门禁：`pnpm validate:contracts`、`pnpm validate:product-smoke`、`pnpm validate:product-smoke:postgres`、`pnpm validate:h5-click-smoke`、`pnpm validate:ios-simulator-smoke`、`pnpm validate:ios-manual-acceptance`、`pnpm validate:context-sync` 和 `git diff --check`。
2. 如果 `.env.local` 有可用 key，再运行 `pnpm validate:llm-smoke`。
3. 按 `docs/qa/ios-v1-system-acceptance.md` 做一次真实模拟器或真机验收，把证据沉淀到仓库或外部知识库。
