# 当前项目状态

## 记忆类型

- domain: working
- area: active-context
- status: current
- last_updated: 2026-06-08
- sourcePath: `ai-factory/memory/working/active-context/current-project-state.md`

## 新窗口必读摘要

本文件是新 Codex 窗口恢复上下文的第一入口。进入 `/Users/mac/person_code/ai-code` 后，先读本文件，再结合 `git status --short --branch` 和最近提交判断当前状态。

当前主线是 **AI 时间管理 Agent 的原生 iOS -> H5 -> FastAPI 后端 -> Postgres 数据库** 全链路打通。项目选择的是“包边界优先的模块化后端”：`python/backend` 保持 FastAPI 网关，`python/orchestrator` 负责计划与确认执行，`python/agent-runtime` 负责解析器/Agent 原语，领域事实通过 repository 写入 Postgres。

## 最近关键提交

- `a1024e9 fix(h5): 避免重复确认导致状态栏报错`
- `6f4b864 feat(h5): 打通原生到数据库日程链路`
- `09ea11d feat(db): 接入后端 Postgres 存储`
- `f96cefb feat(db): 增加 Agent 执行工作流首版迁移`
- `caca1c8 chore(dev): 增加前后端一键启动脚本`

这些提交已推送到 `origin/codex/ai-native-factory-bootstrap`。

## 当前已完成

- 2026-05-26 用户确认后端架构重心调整为 **AI Planning Runtime v1：智能规划大脑优先**。已新增设计规格 `docs/superpowers/specs/2026-05-26-ai-planning-runtime-v1-design.md`，方案包含 `ContextAssembler`、`PlanningEngine`、`PolicyEngine`、`ToolCatalog`、`ExecutionRunner`、`DecisionTrace`、`EventLog`、`SummaryMemory`，并采用规则默认、LLM 可选、完整上下文包、事件日志 + 摘要记忆、向量检索预留的路线。
- 2026-05-26 用户确认 AI Planning Runtime v1 设计规格后，已新增实施计划 `docs/superpowers/plans/2026-05-26-ai-planning-runtime-v1.md`。计划分 12 个任务推进：runtime 类型和工具目录、rule planner 与 compiler、policy、execution runner、context assembler、event/trace 持久化、summary memory、LLM mock、可选真实 LLM provider、use cases/bootstrap、多 action 回归和最终验证文档。
- 2026-05-26 AI Planning Runtime v1 后端架构实施已完成一轮：新增 `agent_runtime.context`、`planning`、`policy`、`tools`、`memory`、`tracing` 边界；新增 `ContextAssembler`、`ContextRedactor`、`ToolCatalog`、`RuleBasedPlanningEngine`、`LlmPlanningEngine`、`PolicyEngine`、`PlanCompiler`、`ExecutionRunner`、`EventLog`、`DecisionTrace`、`SummaryMemory`；新增 migration `0002_agent_planning_runtime`，包含 `agent_events`、`decision_traces`、`summary_memories`。
- 后端启动已收拢到 `backend.app.bootstrap.create_runtime()`；当前默认 `AI_PLANNER_MODE=llm_first`，可用 `AI_PLANNER_MODE=rule` 固定规则规划，`AI_PLANNER_MODE=llm_mock` 开启 mock LLM planner，`AI_PLANNER_MODE=llm` 固定真实 LLM provider。LLM 只生成候选计划，不直接执行工具或写业务事实。
- FastAPI 路由已改为委托 `SubmitTurnUseCase`、`ConfirmPlanUseCase`、`RejectPlanUseCase`；现有响应结构保持兼容。多 action 输入“明天下午三点开会，顺便把昨天 58 元打车票报销，再提醒我带电脑”会生成单个确认计划，确认后分别写入日程、费用和提醒。
- 2026-05-27 已新增 Postman 导入资产：`docs/postman/ai-code-backend.postman_collection.json`、`docs/postman/ai-code-backend.postman_environment.json` 和 `docs/postman/README.md`。Collection 覆盖健康检查、版本、工厂状态、提交对话、确认/拒绝/查询执行计划、执行日志、日程、费用、提醒，以及提醒完成 / 取消；请求参数和接口说明已写入 Postman 描述，提交对话请求会自动提取 `planId`、`confirmToken`、`firstActionId` 和 `actionIdsJson`，查询提醒列表会自动提取 `reminderId`。
- 2026-05-27 已在 Postman 桌面端导入集合与环境：完整接口集合命名为 `ai-code-python`，右上角环境选择为 `AI Code Backend Local`；用户原先手动创建的空集合保留并重命名为 `ai-code-python-empty`，避免误删。
- 2026-05-27 已处理 `pnpm dev:full` 启动报错：根因是旧 `uvicorn`/`next-server` 进程占用 `8000`/`3000`，已停止旧进程并复验端口释放；同时修复 H5 原生模式 hydration mismatch，Workbench 首次渲染不再读取 `window.location.search`，挂载后再切换 `native=ios` 初始空态。
- 2026-05-27 已打通 H5 Timeline 业务聚合：页面挂载后会主动拉取已确认写入的 `/calendar/events`、`/reminders`、`/expenses` 和 `/execution-ledger`；Timeline 现在按时间合并展示日程、提醒和费用事项，费用使用 `occurredOn` 排序，待补日期排在最后。
- 2026-05-27 已补齐生活类日程识别：`RuleParser` 现在能把“明天中午我要去跟老婆吃午饭”解析为 `calendar.create_event`，标题“跟老婆吃午饭”，时间为明天 12:00-13:00；同类“吃饭/吃午饭/吃晚饭/吃早餐”等带时间提示的输入会进入日程确认流。
- 2026-05-27 已把规划主路径切到 **LLM-first**：默认 `AI_PLANNER_MODE=llm_first`，优先调用 OpenAI Responses API 生成候选计划；如果没有 `OPENAI_API_KEY`、OpenAI SDK 不可用、请求失败、返回无候选或格式无效，则自动回落到 rule planner。LLM 仍只生成候选计划，业务事实写入仍由确认卡、Policy、PlanCompiler 和 ExecutionRunner 控制。
- 2026-05-27 已为 LLM-first 增加审计字段：`PlanningResult` 携带 `planner_mode`、`fallback_reason`、`reasoning_summary`，`DecisionTrace` 会记录真实 planner mode、已选工具和 fallback 原因；本地 `.venv` 已安装 `openai 2.38.0`。
- 2026-05-27 已把真实 LLM provider 拆成多 provider 架构：`AI_PLANNER_PROVIDER=openai|deepseek`，OpenAI 继续走 Responses API，DeepSeek 走 OpenAI-compatible Chat Completions API 并启用 JSON mode；`AI_PLANNER_MODEL` 作为模型名字符串透传给 provider，后续接入 Claude、OpenRouter 或新的 ChatGPT/DeepSeek 模型时只需新增 adapter 或调整环境变量，不改变规划、确认和业务写入链路。
- 2026-05-27 已支持后端自动读取仓库根目录 `.env.local`：`create_planning_engine()`、`create_llm_provider()` 和 `get_database_settings()` 在读取环境变量前会加载本地文件；`.env.local` 不覆盖终端中已显式设置的变量，并已被 `.gitignore` 忽略，适合保存 `DEEPSEEK_API_KEY`、`OPENAI_API_KEY` 和本机模型配置。测试进程通过 `AI_CODE_LOAD_ENV_LOCAL=0` 默认隔离本机 `.env.local`，避免开发者私有 `DATABASE_URL` 或 key 污染单元测试。
- 2026-05-27 已为 LLM provider 调用增加后端观测日志：每次调用都会记录 provider、model、planner mode、耗时、prompt/response 字符数和 `prompt_sha256`；默认不打印完整 prompt/response，只有显式设置 `AI_PLANNER_LOG_PROMPT=1` 或 `AI_PLANNER_LOG_RESPONSE=1` 时才输出原文。
- 2026-05-27 用户确认对话体验需要从“三类工具识别”升级为“闲聊、追问补充、确认执行”三条路径；已新增设计规格 `docs/superpowers/specs/2026-05-27-conversation-routing-clarification-design.md`。设计包含 `chat`、`clarification`、`plan_candidate`、`mixed` 四类响应，新增 `PendingClarification` 承接“明天上午我要去开会” -> “十点”这类多轮补全，执行安全边界仍保持 LLM 只生成候选，业务事实必须经过确认。
- 2026-05-27 用户确认对话路由与追问补全设计后，已新增实施计划 `docs/superpowers/plans/2026-05-27-conversation-routing-clarification.md`。计划拆成 7 个任务：规划类型和 LLM schema、规则 fallback、PendingClarification 存储、ContextPack 注入、orchestrator 保存与补全、H5 quick replies、全链路验证和文档同步。
- 2026-05-27 已实现对话路由与追问补全 v1：LLM planner schema 支持 `chat`、`clarification`、`plan_candidate` 和 `mixed`；规则 fallback 支持闲聊和缺时间日程追问；后端新增 `pending_clarifications` 存储并可把“明天上午我要去开会”后的“十点”补全为日程确认卡；H5 可渲染并点击 quick replies。
- 2026-05-27 已补齐本地 Postgres migration 闭环：新增 `scripts/db_migrate.py`、`pnpm db:migrate` 和 `validate:db-migrations`，`pnpm dev:api` / `pnpm dev:full` 会在启动前自动应用 migration；迁移 runner 维护 `schema_migrations`，并能 baseline 已手动创建的旧表。
- 2026-05-27 已修复真实数据库约束风险：`decision_traces.planner_mode` 允许当前会写入的 `llm_first` 和 `pending_clarification`，并新增 `0004_decision_trace_planner_modes` 供已应用旧 `0002` 的数据库升级。
- 2026-05-27 已增强 pending clarification 补全策略：纯时间回复才会补全日程，避免“十点提醒我喝水”被上一轮会议追问抢占；下午/晚上追问会生成对应时段快捷回复并归一化为 15:00/19:00 等；费用缺金额会保存 pending，用户补“58 元”后生成费用确认卡并保留“昨天”的 `occurred_on`。
- 2026-05-28 已补齐 pending clarification 生命周期边界：当当前会话存在旧 open pending，但用户下一轮输入已经形成新的追问或新的候选计划时，后端会把旧 pending 标记为 `abandoned`，避免后续短回复再次唤醒过期上下文；回归覆盖“明天上午我要去开会”后输入“十点提醒我喝水”，再输入“十点”不会重新生成旧会议确认卡。
- 2026-05-27 已新增只读 Agent 对话调试接口：`GET /agent/conversations/{conversationId}/debug` 返回 `events`、`decisionTraces` 和 `pendingClarifications`，可在 Postman 里直接查看 planner mode、fallback reason、选中工具、缺失字段、追问上下文和执行计划创建事件；in-memory 与 Postgres runtime 都会挂载事件和 trace repository，in-memory ContextPack 也会注入 open pending clarification，避免测试模式和 Postgres 模式上下文不一致。
- 2026-05-28 已把 Agent 调试信息接入 H5 设置页：SDK 新增 `getAgentConversationDebug()` 并导出 debug 类型；H5 刷新后端快照时会读取当前 `conversationId` 的只读 debug 快照，在设置页展示 planner mode、fallback、工具选择、缺失字段、当前追问和事件记录数量；默认不展示完整 prompt 或 LLM response。
- 2026-05-27 已打通 LLM `mixed` 回复链路：当 LLM 同时返回 `assistant_message` 和 actions 时，后端 `confirmation_required` 会保留 `message`，对话摘要优先保存该自然回复，shared-types 允许确认响应携带可选 `message`，H5 会先展示自然回复再展示确认卡。
- 2026-05-27 已把 iOS 底部语音输入从 mock 文本替换为真实原生 Speech 闭环：`HybridShellView` 使用 `SFSpeechRecognizer`、`SFSpeechAudioBufferRecognitionRequest` 和 `AVAudioEngine` 采集并识别中文语音，停止后通过既有 `native.inputSubmitted` 提交识别文本；`Info.plist` 已补充麦克风和语音识别权限说明；H5 发起的 `input.voice.start` / `input.voice.stop` 也会桥接到原生语音入口，语音启动失败会通过 `native.error` 回传 H5。
- 2026-05-27 已接入 iOS 本地通知调度闭环：H5 在刷新到已确认 `reminders` 后通过 `notifications.reminders.sync` 同步 `id/title/dueAt/status` 给 Native；iOS 使用 `UNUserNotificationCenter` 请求通知权限，用 `ai-code.reminder.{id}` 作为本地通知标识，重复同步会清理并重建同前缀 pending notification，过期或非 scheduled 提醒不会调度。
- 2026-05-27 已补齐 iOS 提醒通知点击回流：`NativeReminderNotificationScheduler` 作为 `UNUserNotificationCenterDelegate` 处理前台展示和点击响应；点击系统提醒通知后，iOS 会打开 Reminders Drawer，并通过 `native.viewChanged` 发送 `view=reminders`、`source=native.notifications.reminders.opened` 和 `reminderId` 给 H5；H5 收到后会刷新提醒快照并高亮对应提醒行，且不会在通知点击刷新时再次触发 Native 日历或提醒同步。
- 2026-05-28 已补齐 H5 提醒通知目标定位滚动：提醒列表中的高亮行会标记 `data-highlighted-summary-item`，当 Native 通知点击把 H5 切到 reminders surface 并携带 `reminderId` 时，H5 会把高亮行 `scrollIntoView({block: "center"})`，避免长列表里只切页但用户看不到目标提醒。
- 2026-05-27 已接入 iOS 系统日历写入闭环：H5 在刷新到已确认 `calendar_events` 后通过 `calendar.events.sync` 同步 `id/title/startAt/endAt/timezone/status/sourceActionId` 给 Native；iOS 使用 `EventKit` / `EKEventStore` 请求系统日历 full access，用后端 `event.id` 写入 `AI_CODE_EVENT_ID:{id}` notes marker，重复同步会替换同一日程而不是创建重复系统日历事件，非 scheduled 或无效时间日程不会写入。
- 2026-05-27 已把 iOS 底部附件入口从固定 mock 文本替换为真实系统选择器：纸夹入口打开 `confirmationDialog`，照片走 `PhotosPicker`，文件走 `fileImporter`；选择后复用 `native.inputSubmitted` 提交 `inputKind=attachment`、附件 ID、名称、类型、大小和可读文本。
- 2026-05-28 已打通 iOS 原生小文件 base64 Bridge 契约：`PhotosPicker` 和 `fileImporter` 选中的原始内容不超过 5MB 时，Native 会在 `native.inputSubmitted` payload 中额外携带 `base64Content`；超过 5MB 或读取失败时保持现有附件元数据和可读文本流程，不传 base64。iOS 仍不直接调用后端业务接口，由 H5 按契约选择 `/attachments/upload` 或元数据 intake 路径。
- 2026-05-28 已接入 iOS 照片附件原生 OCR 薄闭环：`PhotosPicker` 选中图片后，iOS 使用 Vision `VNRecognizeTextRequest` 尝试识别中英文文字，并把识别结果追加到附件 `text` 字段；识别失败或无文字时不阻断原有附件提交。Native 仍不解析票据业务含义，费用 / 日程生成继续由后端 Agent 基于可读文本和确认卡完成。
- 2026-05-28 已扩展 iOS Files 附件可读内容提取：`fileImporter` 选择图片文件时复用 Vision OCR，选择 PDF 时使用 PDFKit `PDFDocument` 抽取页面文本，并把结果作为 `recognizedText` 追加到附件 `text` 字段；读取失败、无文本或超过 5MB 跳过内容读取时仍保持元数据提交。
- 2026-05-28 已打通 H5 附件上传路径选择：H5 解析 `native.inputSubmitted` 附件 payload 中的可选 `base64Content`；存在内容时通过 SDK 调用 `/attachments/upload`，缺失内容时保持 `/attachments/intake` 元数据路径。上传成功后仍复用当前附件摘要卡、快捷回复和 `attachment_summary` 后续处理链路。
- 2026-05-28 已修复附件上传文本合并：`POST /attachments/upload` 在收到 Native 展示文本和可解码文本内容时，会合并为“展示文本 + 识别文本”，避免 H5 传入“已选择附件...”后覆盖真实票据文本。已用浏览器脚本模拟 `native.inputSubmitted`，验证 H5 调用 upload 后，后端读回 `contentStatus=content_received`、`contentSha256` 和包含金额的 `text`。
- 2026-05-28 已补齐 iOS 原生会话持久 ID：Native 使用 `UserDefaults` 保存 `conversation_ios_*`，并在 H5 URL 缺少 `conversationId` 时追加该参数；H5 已优先读取 URL 会话 ID，因此即使 `WKWebView` 使用 non-persistent data store，App 重启也会回到同一会话视角。
- 2026-05-28 已修正 Native 系统同步错误的 H5 状态语义：`native.calendar.events.sync` 和 `native.notifications.reminders.sync` 失败时，H5 显示“后端事项已保存，系统同步未开启”，状态保持 completed；语音、附件选择等输入能力失败仍显示 failed，避免系统权限拒绝污染“业务事实已保存”的结果。
- 2026-05-28 已补齐 H5 快照刷新降级策略：`refreshBackendSnapshots()` 将日程、费用、提醒和 execution ledger 作为核心读模型，仍使用硬失败暴露问题；附件列表、Agent debug、历史 turn 和待确认卡恢复改为可选快照，失败时写 `optional snapshot refresh failed` 日志并降级为空，不阻断 Timeline 刷新或 Native 日历 / 提醒同步。
- 2026-05-27 已把 H5 真实提交链路里的运行时 mock 剥离：`handleSubmittedText` 不再用前端 `makeInteractionElements()` 推断 Timeline 事项，也不再显示“Mock 后端返回”；确认等待状态来自后端 `plan.summary`。新增 `pnpm validate:h5-runtime` 并串入 `validate:factory` 防回归。
- 2026-05-27 已修正 H5 确认卡取消行为：用户点取消后先调用后端 `rejectExecutionPlan`，成功才移除对应确认卡并追加取消消息；失败时保留卡片并显示错误，不再静默吞掉 reject 失败。
- 2026-05-27 已打通提醒完成 / 取消可点击闭环：后端新增 `POST /reminders/{id}/complete` 和 `POST /reminders/{id}/cancel`，Reminder in-memory / Postgres repository 都支持按提醒 ID 更新状态；SDK、OpenAPI、Postman 和 H5 提醒列表行内动作已同步，scheduled 提醒可直接点击“完成”或“取消”，刷新后非 scheduled 提醒不会继续同步给 Native 本地通知。
- 2026-05-27 已打通附件元数据 intake 闭环：后端新增 `POST /attachments/intake` 和 `attachment_intakes` migration，SDK、OpenAPI、Postman 与 H5 已接入；H5 收到 `inputKind=attachment` 后先写入附件元数据并展示后续处理快捷回复，不再把附件描述文本直接提交给 `/agent/turns`。
- 2026-05-27 已打通附件票据金额追问闭环：`ContextPack` 新增 `attachment_summary`，规划上下文可读取同会话最近附件；用户在附件 intake 后输入或点击“把 receipt.jpg 作为费用票据处理”会收到费用金额追问，补“58 元”后生成 `expense.create_reimbursement_draft` 确认计划，payload 保留 `attachment_id` 和 `attachment_name`。
- 2026-05-28 已打通附件票据可读文本金额提取：附件 intake 的 `text` 会进入 `attachment_summary`；如果可读文本里包含“88.5 元”和 `YYYY-MM-DD` 日期，用户点击或输入“把 receipt.jpg 作为费用票据处理”会直接生成费用草稿确认卡，不再追问金额，payload 保留 `attachment_id`、`attachment_name`、`amount`、`currency` 和 `occurred_on`；如果文本有金额但没有日期，则用当前客户端日期兜底，避免生成不可执行的费用 payload。无金额文本仍走原金额追问流程。
- 2026-05-28 已打通附件资源查询与对话回看闭环：后端新增 `GET /attachments?conversationId=...&limit=...`，复用已有 attachment repository 按会话读取最近附件；SDK 新增 `getAttachments()`，H5 会在当前对话流里维护“本轮附件资源”摘要卡，Postman 也新增当前会话附件列表查询。
- 2026-05-28 已打通附件内容上传后端闭环：后端新增 `POST /attachments/upload`，支持接收 base64 编码的小文件内容，限制解码后 5MB，计算 `contentSha256`，文本附件会按 UTF-8 抽取 `text` 并进入既有 `attachment_summary`；Postgres 新增 `0007_attachment_content_metadata` 保存 `content_sha256/content_status`，SDK、OpenAPI 和 Postman 已同步。该接口只登记附件资源和可读文本，不直接创建费用、日程或提醒。
- 2026-05-28 已打通附件日程材料追问闭环：H5 附件快捷回复“作为日程材料处理”现在会基于最近附件触发日程时间追问，补“明天上午10点”后生成 `calendar.create_event` 确认计划，action payload 保留 `attachment_id` 和 `attachment_name`，仍需用户确认后才写入日程事实。
- 2026-05-28 已打通费用草稿提交 / 取消可点击闭环：后端新增 `POST /expenses/{id}/submit` 和 `POST /expenses/{id}/cancel`，Expense in-memory / Postgres repository 都支持按费用 ID 更新状态；SDK、OpenAPI、Postman 与 H5 费用列表行内动作已同步，draft 费用可直接点击“提交”或“取消”，刷新后非 draft 费用不再展示可操作按钮。
- 2026-05-28 已打通日程取消可点击闭环：后端新增 `POST /calendar/events/{id}/cancel`，Calendar in-memory / Postgres repository 都支持按日程 ID 更新状态；SDK、OpenAPI、Postman 与 H5 日程列表行内动作已同步，scheduled 日程可直接点击“取消”，刷新后 canceled 日程不再同步给 Native 系统日历。
- 2026-05-28 已打通 Timeline 行内动作闭环：H5 summary-list action 支持 `targetId`，Timeline 中日程、费用、提醒条目可直接触发取消日程、提交 / 取消费用、完成 / 取消提醒，不再要求用户先切换到对应领域页。
- 2026-05-28 已打通事项内容编辑闭环：后端新增 `PATCH /calendar/events/{id}`、`PATCH /expenses/{id}`、`PATCH /reminders/{id}`，三领域 repository / service / Postgres repository 都支持按 ID 更新业务内容字段；SDK、OpenAPI、Postman 与 H5 行内“编辑”动作已同步，编辑不会修改 `status` 或 `sourceActionId`。
- 2026-05-28 已把 H5 事项编辑从浏览器 `window.prompt` 升级为应用内 `SummaryEditPanel`：日程、费用、提醒编辑都在 H5 面板内完成，提交仍复用现有 PATCH SDK；`validate:h5-runtime` 已禁止运行时重新引入 `window.prompt`。
- 2026-05-28 已补齐后端编辑输入校验与终态保护：日程创建 / 编辑校验带 timezone 的 ISO datetime 和结束晚于开始，且 PATCH 只改开始或结束其中一个字段时也会结合现有记录校验完整区间；费用创建 / 编辑校验 ISO date、非负金额，并拒绝 `bool` / 字符串金额的宽松转换；提醒创建 / 编辑校验带 timezone 的 ISO datetime；编辑路由将无效输入映射为 `400`，并且日程仅 `scheduled`、费用仅 `draft`、提醒仅 `scheduled` 可编辑，终态事项不会被内容 PATCH 静默改写。
- 2026-05-28 已补齐后端状态流转保护：日程仅允许 `scheduled -> canceled`，费用仅允许 `draft -> submitted/canceled`，提醒仅允许 `scheduled -> done/canceled`；in-memory 与 Postgres repository 都在状态更新入口内置转移表保护，Postgres 用带当前状态条件的原子更新区分不存在记录和非法状态流转，状态动作路由将非法流转映射为 `400`。
- 2026-05-28 已补齐 iOS 系统日历取消清理闭环：H5 `calendar.events.sync` 现在同步全部日程事实而不是只发 scheduled；iOS 收到非 `scheduled` 日程会删除已有同 marker 的系统日历事件，并保存后端 `event.id -> EKEvent.eventIdentifier` 到 `UserDefaults`，取消或改期后取消优先按稳定 identifier 清理，宽窗口 marker 搜索兜底。
- 2026-05-28 已打通 iOS 键盘 Bridge 入口并清理假点击控件：H5 设置页“键盘输入”会发送 `input.keyboard.open`，iOS 收到后切到底部原生文本输入并聚焦；Native 日历摘要里的空 `Button {}` 和误导性 chevron 已改为静态摘要行，`validate-native-shells` 已加入防回归检查。
- 2026-05-28 已打通会话历史恢复 API：后端新增 `GET /agent/conversations/{conversationId}/turns?limit=50`，in-memory 与 Postgres `ConversationTurnStore` 都支持按会话读回 turn；SDK/H5/OpenAPI/Postman 已接入，H5 启动时用 URL 或 `localStorage` 中的稳定 `conversationId` 恢复 transcript，历史确认响应只恢复摘要，不渲染带 redacted token 的可点击确认卡。
- 2026-05-28 已补齐待确认卡恢复闭环：后端仍不在历史 turn 或 plan 读取中暴露明文 `confirmToken`，但新增 `GET /agent/conversations/{conversationId}/pending-confirmations`，只返回仍 `awaiting_confirmation` / `pending` 的计划，并为每个 confirmation 签发短期恢复 token；Postgres 新增 `confirmation_token_sessions` 保存恢复 token hash，H5 刷新历史时会拉取该接口恢复可点击确认卡，确认或取消后 pending 列表不再返回该计划。本机 `localStorage` pending token 缓存仍作为同机兜底。
- 2026-05-28 已打通会话范围业务读模型：`GET /calendar/events`、`GET /expenses`、`GET /reminders` 和 `GET /execution-ledger` 都支持可选 `conversationId`；后端通过 `execution_plans -> domain_actions -> sourceActionId` 关联当前会话产生的业务事实，不把会话字段混入日程 / 费用 / 提醒事实模型；SDK/H5/OpenAPI/Postman 已接入，H5 Timeline 现在按当前稳定会话读取事项。
- 2026-05-28 已打通会话范围 Agent 上下文摘要：Postgres 的日程、费用、提醒 summary provider 现在按 `execution_plans.conversation_id` 过滤，并在摘要里包含 `id` / `source_action_id`，避免 LLM prompt 混入其他会话的业务事实，为自然语言管理已有事项打基础。
- 2026-05-28 已打通自然语言管理已有事项 v1：ToolCatalog 新增 8 个管理工具，覆盖日程取消 / 更新、费用提交 / 取消 / 更新、提醒完成 / 取消 / 更新；PolicyEngine 会拦截未知工具；ExecutionRunner 注册管理 handler；规则路径可把“取消/完成/修改刚才的提醒”“提交/取消/修改刚才的费用”“取消/修改明天的会议”解析成带 `target_id` 的确认计划，确认后通过领域 service 改写状态或内容。OpenAPI、shared-types、H5 契约和 Postman collection 已同步 8 个 action type。
- 2026-05-28 已补齐自然语言管理目标歧义追问：rule planner 在宽泛管理请求命中多条可操作目标时返回缺 `target_id` 的 clarification，不创建确认计划；覆盖多条 `scheduled` 提醒、多条 `draft` 费用和同一天多条 `scheduled` 日程。“刚才 / 刚刚”近指仍按最近可操作目标生成确认卡，保留顺序式操作体验；Policy 的 `ManagementTargetValidator` 继续兜底跨会话目标和状态过期目标。
- 2026-05-28 已把管理目标歧义安全闸下沉到多 provider 共享边界：`llm_first` 在调用真实 LLM 前会采用 rule safety precheck，遇到缺 `target_id` 的目标歧义直接返回追问；`ManagementTargetValidator` 会拦截 LLM/DeepSeek/OpenAI/未来 provider 返回的合法但武断 `target_id`，当当前输入没有“刚才 / 刚刚”近指且同域同状态存在多个可操作目标时，确认卡生成前转为安全追问。LLM prompt 合约同步要求多目标管理请求必须 clarification，不要替用户猜测 `target_id`。Pending clarification 也已支持用户点击 quick reply 或回复“第一个 / 第二个 / 第三个”选择目标，随后生成提交 / 取消 / 完成 / 更新类管理确认卡；更新类会保留原始 patch，例如费用金额、提醒时间和日程开始时间，日程选择目标后再按该目标原时长补齐结束时间。多目标追问的 quick replies 和 `candidate_target_ids` 现在来自同一个最多 3 条的展示候选集合，避免 4 条以上候选时用户点击展示项却命中未展示历史目标。
- 2026-05-28 已把追问快捷回复升级为兼容式结构化选择：`clarification_request` 保留旧 `quickReplies: string[]`，同时新增 `quickReplyOptions: [{label, value}]`。普通补字段场景 `label=value`；管理目标选择场景 `label` 是展示文案，`value` 是稳定 `target_id`。H5 quick-replies 元素现在展示 label、点击提交 value，并用 value+index 作为按钮 key，避免重复文案导致 React key 冲突或后端文本 `index()` 误选目标；会话历史恢复和 debug pending 也能看到结构化选项。
- 2026-05-28 已补齐结构化 quick reply 的用户显示闭环：H5 quick reply 点击时提交 `value` 给后端，但用户消息气泡显示 `label`，避免 `reminder_xxx` / `target_id` 等内部选择值出现在对话里。`pnpm validate:h5-runtime` 已加入防回归检查，要求 quick reply 点击必须使用 `handleSubmittedText(reply.value, { displayText: reply.label })`，且用户气泡内容来自 `displayText ?? text`。
- 2026-05-28 已补齐结构化 quick reply 的会话历史展示闭环：`POST /agent/turns` 新增可选 `displayInput`，H5 在提交 `quickReplyOptions.value` 时同步传 `quickReplyOptions.label`；后端规划仍使用真实 `input`，但 `conversation_turns.inputText` / `summary` 保存 `displayInput`，`rawContent.submittedInput` 保留稳定 value，避免刷新或重启后历史 transcript 暴露 `target_id`。
- 2026-05-28 已打通自然语言只读查询 v1：规则 fallback 可识别“明天我有什么安排？”“明天有什么提醒？”“明天有什么日程？”“昨天有哪些费用？”这类查询，直接基于当前会话的 `calendar_summary`、`reminder_summary` 和 `expense_summary` 返回 `assistant_message` 和 `summary-list` 结构化元素；泛化“安排”合并日程和提醒，专问“日程 / 提醒”会按领域过滤，费用支持相对日期过滤。这类请求不生成 action、不创建确认卡、不写业务事实。H5 会把 `structuredElements` 渲染为现有列表组件；LLM prompt 已明确只读查询应基于上下文摘要用 `chat` 返回；Postman 增加查询明天安排和查询费用两个请求。
- 2026-05-28 已补齐 LLM/DeepSeek 对话路由 prompt 合约：新增 prompt 合约测试，固定闲聊 `chat`、缺时间日程 `clarification`、已有事项只读查询 `chat`、自然回复 + 候选动作 `mixed` 四类 few-shot；系统 prompt 明确只能使用 `tool_catalog` 中的 action type，且所有写入类动作都只是候选计划，不能声称已经创建、修改、同步或提醒。
- 2026-05-28 已补齐 LLM / 只读查询负向回归证据：LLM provider 返回非 JSON 文本时会转为 `assistant_message` 并带 `deepseek-invalid-response` trace，不会生成候选 action；API 只读查询“明天我有什么安排？”会返回结构化列表，同时不会新增 pending confirmation 或 execution ledger 事件，避免只读问答污染执行流水。
- 2026-05-28 已补齐多 provider LLM fenced JSON 兼容：`LlmPlanningEngine` 在解析 provider 输出前会识别标准 Markdown JSON 代码块（带 `json` 语言标记或无语言标记），抽出其中 JSON 后再进入统一 schema / Policy / 确认卡链路；普通非 JSON 文本仍保持 `*-invalid-response` 降级，不会被误当成候选计划。这为后续 Claude、OpenRouter 或其它 OpenAI-compatible provider 偶发代码块输出提供兼容。
- 2026-05-28 已补齐 LLM 只读查询结构化组件输出：LLM schema / prompt 增加 `structured_elements`，允许只读 `chat` 返回 `summary-list` 给 H5 渲染；`LlmPlanningEngine` 会解析该字段并通过 `ExecutionPlanner` 原样返回 `/agent/turns` 的 `structuredElements`，同时不创建 execution plan、不写 ledger、不进入确认流程。
- 2026-05-28 已补齐 Policy 工具 schema 必填字段校验：PolicyEngine 不再只相信 LLM action 自带的 `missing_fields`，会读取 ToolCatalog 的 `input_schema.required` 检查 payload；如果 LLM 返回 `calendar.create_event` 但漏 `start_at/end_at`，后端会返回追问并保存 pending clarification，不生成确认计划、不写 ledger。为保持正常用户路径顺畅，规则费用解析已支持“今天”写入 `occurred_on`，pending 费用补金额时若缺日期会用补金额当日兜底。
- 2026-05-28 已补齐 Policy 工具 schema 字段类型校验：ToolCatalog 的 `input_schema` 增加 `properties` 类型声明，PolicyEngine 会在确认卡生成前拦截明显错误的 payload 类型，例如费用 `amount` 是字符串或布尔值、管理工具 `patch` 不是 object；错误会转为追问，不创建 execution plan、不写 ledger。类型校验只覆盖 `string`、`number`、`object` 等轻量 JSON schema 子集，不禁止额外元数据，避免误伤附件和目标解析来源字段。
- 2026-05-28 已补齐 LLM 工具目录 schema 注入：`BuiltInToolCatalogProvider` 不再只向 ContextPack 暴露 action type，而是为每个工具输出包含 `action_type`、`domain`、`description`、`required`、`properties`、`confirmation_required` 和 `risk_level` 的 JSON 合约行；LLM prompt 现在能看到费用 `amount` 必须是 number、更新 `patch` 必须是 object 等真实工具约束，Policy 仍作为后端兜底。为避免调试语义漂移，`DecisionTrace.tools_considered` 会从 JSON 合约中提取回 action type 列表。
- 2026-05-28 已补齐 ContextRedactor 工具目录保留边界：普通上下文段仍按条目数裁剪，但 `tool_catalog` 作为 LLM 写入工具合约不再被裁剪，避免后续新增工具超过默认裁剪阈值后，模型只看到部分 action schema。
- 2026-05-28 已补齐 update patch 内层字段类型校验：ToolCatalog 的三类 update 工具现在在 `patch.properties` 中声明可编辑字段类型，例如费用 `patch.amount` 必须是 number、提醒 `patch.dueAt` 必须是 string、日程 `patch.startAt/endAt/timezone` 必须是 string；PolicyEngine 会递归校验对象字段，LLM 若返回 `patch.amount: "88"` 会被转成追问，不生成确认卡或 ledger。
- 2026-05-28 已补齐管理目标确认前 guard：新增 `ManagementTargetValidator`，在确认卡生成前校验管理动作的 `target_id` 必须存在于当前 `ContextPack` 的对应领域摘要，且 `expected_status` 必须与摘要中的真实状态一致。LLM 若引用其他会话目标，或状态已经变为 `done` / `submitted` / `canceled` 的事项，会返回安全追问，不创建 confirmation、execution plan 或 ledger。
- 2026-05-28 已打通 SummaryMemory 执行事实生命周期：确认执行成功后，`ExecutionCoordinator` 会写入 `memory_type=domain_fact` 的 `SummaryMemory`，payload 保留 `domain`、`actionType`、`actionId`、`planId`、`factId`、`factTitle`、`factStatus` 和执行结果；in-memory runtime 现在与 Postgres runtime 一样把这些执行事实注入下一轮 `ContextPack.relevant_history`。SummaryMemory provider 只注入 `domain_fact`，不会把未来的 preference 等记忆类型混进已确认业务事实上下文。SummaryMemory 写入失败只记录 warning 日志，不会让已成功的领域事实和确认结果回滚或变成失败。
- 2026-05-28 已补齐直接 UI 行内动作审计闭环：H5 日程取消、费用提交 / 取消、提醒完成 / 取消以及三类编辑 PATCH 会把当前 `conversationId` 传给后端；后端新增 `DirectActionAuditService`，在状态变更前要求非空 `conversationId`，并校验目标事实的 `sourceActionId` 属于当前会话，缺失会话 ID 返回 `400`，跨会话目标返回 `404`，成功后创建 `direct_plan_*` / `direct_action_*` 轻量执行记录，写入 `execution_ledger.event_type=direct_action_executed` 和 `memory_type=domain_fact` 的 SummaryMemory。Postgres 新增 `0008_direct_action_ledger_events` 允许 direct ledger 事件，OpenAPI、shared-types、SDK 和 Postman 已同步；SDK 直接变更方法现在要求 `conversationId: string`，契约验证会防止这些 mutation 参数退回可选。
- 2026-05-28 已根据 subagent 只读审计补齐第一版可用性缺口：H5 默认初始态改为真实空态，只有显式 `?demo=1` 才展示 demo fixtures，避免非 Native 模式出现无 `planId/confirmToken` 的假确认卡；SDK 失败响应会解析 FastAPI `{detail}`、validation detail array 和纯文本错误，H5 状态栏可看到后端具体原因；H5 会消费 `native.ack`，键盘和语音 bridge action 不再卡在“正在打开 / 启动 / 提交”；OpenAPI 修复 `/attachments/intake` 与 `/agent/conversations/{conversationId}/debug` 的 response schema 层级，并把新增附件、会话恢复和 debug 端点纳入契约校验。
- 2026-05-28 已补齐 H5 编辑面板日期 / 时间输入本地化：日程开始 / 结束和提醒时间改用 `type=datetime-local`，费用发生日期改用 `type=date`；新增 `dateTimeInput.ts` 作为纯转换边界，把后端带 offset ISO 显示为 `YYYY-MM-DDTHH:mm`，提交 PATCH 前再恢复为带 offset ISO。日程编辑使用 timezone 字段计算 offset，提醒编辑保留原 ISO offset，避免 `datetime-local` 丢失时区导致系统日历或本地通知静默偏移。新增 `pnpm validate:h5-datetime-runtime` 并串入 `validate:factory`。
- 2026-05-28 已新增产品级 smoke 验证命令 `pnpm validate:product-smoke`：使用 FastAPI TestClient 和 rule planner 模拟真实用户路径，覆盖缺时间日程追问 -> 补时间 -> 确认写入、日程直接编辑、费用创建确认 -> 直接提交、提醒创建确认 -> 直接完成、自然语言管理已有日程 / 费用 / 提醒的 8 个核心动作、宽泛多目标管理追问与点选、4 条候选只展示 3 条时的快捷回复目标一致性、只读查询明日安排、execution ledger 中 `action_executed` / `direct_action_executed`、Agent debug trace、会话历史恢复和 pending confirmations 清空；同时用独立会话覆盖待确认卡恢复 token 确认，以及附件资源 `POST /attachments/upload`、`POST /attachments/intake` 和 `GET /attachments`。该命令默认 `AI_CODE_LOAD_ENV_LOCAL=0 AI_PLANNER_MODE=rule`，不依赖本地 LLM key 或 Postgres。
- 产品级 smoke 已扩展重复 quick reply 文案场景：同一会话创建两条同标题同时间提醒后，“完成提醒”会返回相同展示文案但不同 `quickReplyOptions.value`，smoke 使用第二个 value 选择目标并确认执行，验证不会误选第一条同名候选。
- 2026-05-28 已新增运行中 API 产品级 live smoke：`scripts/validate_product_smoke.py` 支持 `--live`，根命令 `pnpm validate:product-smoke:live` 默认连接 `http://127.0.0.1:8000`，也可用 `AI_CODE_API_BASE_URL` 指向局域网后端。live 模式不启动服务、不执行 migration、不强制切换 planner mode，复用产品级 smoke 主路径断言，真实验证当前 `pnpm dev:api` / `pnpm dev:full` 后端、Postgres 和 provider 配置组合；它会使用唯一 `conversation_product_live_smoke_*` 会话并真实写入测试数据，因此不串入 `validate:factory`。后端不可达时会输出当前 base URL、启动命令和地址覆盖建议，不再只抛底层网络堆栈。
- 2026-05-28 已扩展 H5 可点击产品级 smoke：`pnpm validate:h5-click-smoke` 会启动 in-memory rule API 和 H5 dev server，使用 Playwright Chromium 打开 `?native=ios&bridgeDebug=1`，模拟 iOS `native.inputSubmitted` 完成三领域真实点击主链路：日程追问补全 -> 确认 -> Timeline 编辑日程 -> 取消日程，费用确认 -> Timeline 编辑费用 -> 提交费用，提醒确认 -> Timeline 编辑提醒 -> 完成提醒；每条路径都会回查 `/calendar/events`、`/expenses` 或 `/reminders` 确认后端状态。该命令需要本机安装 Playwright Chromium，属于可点击本地验收入口，不串入离线 `validate:factory`。
- 2026-05-28 已补齐 H5 到 Native 系统同步 payload 验证：`pnpm validate:h5-click-smoke` 现在会检查 `calendar.events.sync` 在日程确认、编辑和取消后都携带完整 `id/title/startAt/endAt/timezone/status/sourceActionId`，其中 canceled 日程仍必须发给 Native 以清理旧系统日历；也会检查 `notifications.reminders.sync` 在提醒确认和编辑后携带完整 scheduled 提醒，并在提醒完成后不再包含该提醒，避免 iOS 本地通知残留。Hybrid Bridge JSON Schema 已为这两类 payload 增加条件约束，`pnpm validate:contracts` 会防回归。
- 2026-05-28 已新增 iOS 真编译门禁：根命令 `pnpm validate:ios-build` 会检查本机 `xcodebuild`，并用 `AIEngineeringCode.xcodeproj`、scheme `AIEngineeringCode`、`generic/platform=iOS Simulator`、`CODE_SIGNING_ALLOWED=NO` 和仓库内 `.tmp/xcodebuild/AIEngineeringCode` DerivedData 执行 Debug simulator build。`validate:native-shells` 会检查该命令和脚本存在，避免原生壳只停留在静态文本门禁。本机 Xcode 16.4 下已通过真实编译，产物位于 `.tmp/xcodebuild/AIEngineeringCode/Build/Products/Debug-iphonesimulator/AIEngineeringCode.app`。
- 2026-05-28 已新增 iOS Simulator 运行级 smoke：根命令 `pnpm validate:ios-simulator-smoke` 会先执行 `validate:ios-build`，再选择 booted iPhone Simulator 优先，安装 `.tmp/xcodebuild/AIEngineeringCode/Build/Products/Debug-iphonesimulator/AIEngineeringCode.app`，启动 bundle id `com.aiengineeringcode.shell`，并通过 `simctl get_app_container` 验证安装成功。脚本默认不关闭用户原本 booted 的模拟器，不保持 App 常驻；可用 `AI_CODE_IOS_SIMULATOR_UDID`、`AI_CODE_IOS_SIMULATOR_SKIP_BUILD`、`AI_CODE_IOS_SIMULATOR_KEEP_BOOTED`、`AI_CODE_IOS_SIMULATOR_KEEP_APP_RUNNING` 覆盖。与此同时，`Info.plist` 的 `H5DevServerURL` 已改为 `$(H5_DEV_SERVER_URL)`，确保命令行 / Xcode Build Settings 覆盖的 H5 地址会进入构建产物。
- 2026-05-28 已新增 iOS v1 系统能力人工验收清单：`docs/qa/ios-v1-system-acceptance.md` 覆盖 H5 地址覆盖、会话持久 ID、键盘输入、语音输入、照片附件、文件附件、PDF 文本提取、本地通知、通知点击回流、系统日历写入 / 取消清理、后端事实确认和系统同步降级；每项都要求记录截图 / 录屏 / bridge debug / 后端接口摘要等验收证据。新增 `pnpm validate:ios-manual-acceptance` 检查清单覆盖关键项目和 marker，`validate:native-shells` 也会防止该清单或命令丢失。该命令不替代真实人工验收，只保证验收资产不缺项。
- 2026-05-28 已新增 v1 readiness 审计：`docs/qa/v1-readiness-audit.md` 明确当前第一版已经达到“自动化主路径基本可验收”，但 Goal 不能标记 complete，因为还缺少 iOS 系统能力人工验收真实证据。新增 `pnpm validate:v1-readiness` 检查审计文档和完成门槛不丢失。本轮已补跑 `pnpm validate:llm-smoke`、`pnpm validate:sdk-runtime`、`pnpm validate:v1-readiness` 和 `pnpm validate:factory`，其中 LLM smoke 使用 `deepseek` provider 通过。
- 2026-05-28 已新增 iOS v1 自动证据包采集器：根命令 `pnpm collect:ios-acceptance-evidence` 会采集 git 状态、本地 API / H5 可达性、构建产物 `H5DevServerURL`、iOS build、Simulator 安装启动、启动截图和人工验收清单形状，默认输出到 `.tmp/ios-acceptance-evidence/<timestamp>/`，包含 `manifest.json`、`acceptance-evidence.json`、`summary.md`、`manual-checklist.todo.md` 和 `simulator-launch.png`。manifest 固定声明 `acceptanceVerdict=not_evaluated`、`manualAcceptanceRequired=true`、`automationCanReplaceManualAcceptance=false`，用于防止把自动截图误认为系统权限 / 系统 App 人工验收。本轮已生成辅助证据包 `.tmp/ios-acceptance-evidence/2026-05-28T07-06-45Z/`，截图显示 iOS 原生壳已加载 H5 对话首页；语音、照片 / 文件、PDF、本地通知、通知点击回流、系统日历写入 / 清理和权限拒绝降级仍必须逐项人工留证。
- 2026-05-28 已结构化 iOS 自动证据包的人工补证清单：`manual-checklist.todo.md` 现在按每个必验项目生成 `bridge_marker`、`api_summary`、`screenshot` 和 `system_artifact` 提示；`manualEvidenceStillRequired` 补入“会话持久 ID”和“后端事实确认”，避免 manifest 漏掉这两个必验项。该清单仍只是补证模板，不代表人工验收已经完成。
- 2026-05-28 已把 iOS 会话持久 ID 纳入自动证据包辅助采集：`collect:ios-acceptance-evidence` 会读取 Simulator data container 中 `Library/Preferences/com.aiengineeringcode.shell.plist` 的 `ai-code.native.conversationId`，并在 `simctl terminate` / `simctl launch` 前后比对 `beforeRelaunch` 与 `afterRelaunch`。本轮 live 证据包 `.tmp/ios-acceptance-evidence/conversation-persistence-live/` 显示 `conversation_ios_15144b54eec0432d9409e133ea77dee7` 重启前后保持一致，`stableAcrossRelaunch=true`。该证据证明 Native 存储层稳定，但仍需要 H5 页面截图和历史 turn 接口摘要补齐用户可见验收。
- 2026-05-28 已把同会话后端事实摘要纳入自动证据包辅助采集：`collect:ios-acceptance-evidence` 会使用 Native conversationId 查询 `/calendar/events`、`/reminders`、`/expenses`、`/execution-ledger` 和 `/agent/conversations/{conversationId}/turns`，写入 `backendFactSnapshot.counts/previews/commands`。本轮 live 证据包 `.tmp/ios-acceptance-evidence/backend-fact-snapshot-live/` 统计到 `reminders=1`、`executionLedger=6`、`turns=4`、`calendarEvents=0`、`expenses=0`。该证据证明当前会话后端读模型可查，不替代 Timeline / 日程 / 提醒 / 费用 / 执行记录页面截图。
- 2026-05-28 已把 Native 系统诊断纳入 iOS 自动证据包辅助采集：iOS 会在 `notifications.reminders.sync` 和 `calendar.events.sync` 后把 `ai-code.native.systemDiagnostics` 写入 `UserDefaults`，包含通知权限、pending reminder notification 数量和标识、日历权限、EventKit stored identifier 数量和查回数量。采集器会读取同一个 preferences plist，把诊断写入 `ios.systemDiagnostics`、`summary.md` 的 “Native 系统诊断摘要” 和 manifest 的辅助证据信号；命令摘要默认不再保留后端 fact snapshot 的完整 stdout，避免证据文件塞入完整对话内容。本轮 live 证据包 `.tmp/ios-acceptance-evidence/native-system-diagnostics-live-4/` 显示 `notifications.authorizationStatus=authorized`、`notifications.pendingReminderCount=1`、`calendar.authorizationStatus=authorized`、`calendar.syncedCount=0`。该证据可证明当前提醒进入 iOS pending notification 层，但由于当前会话没有日程，系统日历写入 / 取消清理仍保持人工必验。
- 2026-05-28 已把 H5 同会话页面截图纳入 iOS 自动证据包辅助采集：`collect:ios-acceptance-evidence` 会打开 `?native=ios&bridgeDebug=1&conversationId=...`，通过 `native.viewChanged` 依次切换对话、Timeline、日程、费用、提醒、执行记录和设置页面，并把截图保存到 `h5-surfaces/*.png`。本轮 live 证据包 `.tmp/ios-acceptance-evidence/h5-page-screenshots-live/` 已生成 7 张截图，使用 `conversation_ios_15144b54eec0432d9409e133ea77dee7`，同会话后端摘要为 `reminders=1`、`executionLedger=6`、`turns=4`、`calendarEvents=0`、`expenses=0`。该证据证明 H5 用户可见页面能用同一会话渲染后端读模型，但不替代真实 iOS 系统控件、系统通知或系统日历 App 人工验收。
- 2026-05-28 已新增三领域验收事实种子采集：`collect:ios-acceptance-evidence` 支持显式 `--seed-acceptance-facts` / `AI_CODE_IOS_ACCEPTANCE_SEED_FACTS=1`，默认不写入业务事实；开启后会用当前 Native conversationId 通过真实 `/agent/turns` 和 `/execution-plans/{id}/confirm` 流分别写入日程、费用和提醒，记录 `seedRunId`、`seedNow`、planId 和 actionType，再重新拉起 Native 读取系统诊断。本轮 live 证据包 `.tmp/ios-acceptance-evidence/seeded-three-domain-live-final/` 显示 `seedRunId=seed_20260528081825`，三条 seed 均 succeeded，后端摘要为 `calendarEvents=2`、`reminders=4`、`expenses=3`、`executionLedger=30`、`turns=22`；Native 诊断显示 `calendar.syncedCount=1`、`calendar.storedEventIdentifierCount=1`、`calendar.foundStoredEventCount=1`、`notifications.pendingReminderCount=3`。该证据证明三领域事实、H5 页面和系统日历写入诊断可以闭环，但系统日历取消清理、系统通知点击、语音和附件仍保持人工必验。
- 2026-05-28 已新增系统日历取消清理自动辅助证据：`collect:ios-acceptance-evidence` 支持显式 `--seed-calendar-cleanup` / `AI_CODE_IOS_ACCEPTANCE_SEED_CALENDAR_CLEANUP=1`，必须配合 `--seed-acceptance-facts` 使用。采集器会定位 seed 日程的 `calendarEvent.id`，取消前等待 Native `storedEventBackendIds` 或 UserDefaults key 证明该 event 已写入系统日历标识符，再调用 `POST /calendar/events/{eventId}/cancel?conversationId=...`，重新拉起 Native 触发 H5 同步 canceled event，并记录 `calendarCleanupSeed`。iOS 诊断新增 `calendar.storedEventBackendIds`、`calendar.foundStoredEventBackendIds` 和 `calendar.removedEventIds`。本轮 live 证据包 `.tmp/ios-acceptance-evidence/calendar-cleanup-live/` 显示 `calendarCleanupSeed.available=true`、`targetEventId=calendar_event_e48b46c582224c6b9ab92af033e9d93d`、`preCancelStatus=scheduled`、`postCancelStatus=canceled`、`preCancelStoredIdentifierPresent=true`、`postCancelStoredIdentifierPresent=false`，且 `calendar.removedEventIds` 包含目标 event id；后端摘要为 `calendarEvents=6`、`reminders=8`、`expenses=7`、`executionLedger=68`、`turns=46`，H5 7 个页面截图均已生成。该证据仍不替代系统日历 App 中事件出现 / 消失的人工截图。
- 2026-05-28 已新增日历权限拒绝降级自动辅助证据：`collect:ios-acceptance-evidence` 支持显式 `--seed-calendar-permission-denial` / `AI_CODE_IOS_ACCEPTANCE_SEED_CALENDAR_PERMISSION_DENIAL=1`，只作用于本轮采证拿到的 Simulator UDID。采集器会记录当前日历权限、执行 `simctl privacy revoke calendar`、通过真实 Agent 确认流创建 seed 日程、重新拉起 Native 触发 H5 `calendar.events.sync`，再读取 `calendar.authorizationStatus`、`calendar.lastSyncStatus`、`calendar.lastError` 并截图；若运行前权限为授权状态，会尝试恢复日历权限。本轮 live 证据包 `.tmp/ios-acceptance-evidence/calendar-permission-denial-live/` 显示 `calendarPermissionDenialSeed.available=true`、`preAuthorizationStatus=authorized`、`postAuthorizationStatus=denied`、`backendFactPersisted=true`、`targetEventId=calendar_event_4119df75fd0b4ca08a56537414484935`、`calendar.lastSyncStatus=failed`、`calendar.lastError=未获得日历权限，日程已保存但不会写入系统日历`；后端摘要为 `calendarEvents=7`、`reminders=8`、`expenses=7`、`executionLedger=71`、`turns=48`。该证据仍不替代真机权限弹窗、H5 状态栏和系统设置截图。
- 2026-05-28 已新增通知点击回流自动辅助证据：`collect:ios-acceptance-evidence` 支持显式 `--seed-notification-click-backflow` / `AI_CODE_IOS_ACCEPTANCE_SEED_NOTIFICATION_CLICK_BACKFLOW=1`。采集器会通过真实 Agent 确认流创建 seed 提醒，重新拉起 Native 触发 `notifications.reminders.sync`，确认目标 `ai-code.reminder.{reminderId}` 出现在 `notifications.pendingReminderIds`，再用同形态 synthetic `native.viewChanged` 打开 H5 提醒页并截图高亮目标提醒。H5 Bridge Debug 入站摘要已补充 `reminderId=...`。本轮 live 证据包 `.tmp/ios-acceptance-evidence/notification-click-backflow-live/` 显示 `notificationClickBackflow.available=true`、`reminderId=reminder_c4d7343db0294b5185dbc405621f4551`、`notificationIdentifier=ai-code.reminder.reminder_c4d7343db0294b5185dbc405621f4551`、`pendingNotificationFound=true`、`h5StatusText=已从系统通知打开提醒`、`highlightedReminderFound=true`；后端摘要为 `calendarEvents=7`、`reminders=9`、`expenses=7`、`executionLedger=74`、`turns=50`，H5 7 个页面截图均已生成。该证据只证明 pending local notification 与 H5 回流处理两段链路，仍不替代系统通知真实展示和真实点击录屏。
- 2026-05-28 已新增短时间提醒解析并修复通知回流目标定位：`RuleParser` 现在支持“2分钟后提醒我喝水”“两分钟后提醒我喝水”“半小时后提醒我喝水”“1小时后提醒我喝水”等相对当前时间的提醒创建候选；H5 `remindersToBackendElements()` 新增 `selectRecentItemsWithFocus()`，Native 通知点击携带 `reminderId` 时，即使目标提醒不在最近 6 条里也会被纳入提醒列表并高亮。通知点击回流采集器的 seed 改为“3 分钟后提醒我...”，记录真实 `seedNow/seedDueAt`，并轮询 Native `notifications.pendingReminderIds` 避免读取旧 plist。本轮 live 证据包 `.tmp/ios-acceptance-evidence/notification-click-backflow-near-future-live-6/` 显示 `notificationClickBackflow.available=true`、`seedDueAt=2026-05-28T17:12:49+08:00`、`pendingNotificationFound=true`、`h5StatusText=已从系统通知打开提醒`、`highlightedReminderFound=true`，截图中本轮 seed 提醒处于高亮状态。该能力让真实系统通知验收可以用几分钟窗口继续补证，但仍不替代系统通知真实展示和点击录屏。
- 2026-05-28 iOS 自动证据包阶段收尾已通过本地门禁：本轮短时间提醒与通知回流目标稳定定位后，`PATH=.venv/bin:$PATH pytest python/backend/tests/test_agent_turns.py -q`、`pnpm validate:product-smoke`、`pnpm validate:ios-acceptance-evidence`、`pnpm validate:ios-manual-acceptance`、`pnpm validate:h5-runtime`、`pnpm --filter @ai-code/h5 typecheck`、`pnpm validate:native-shells`、`pnpm validate:v1-readiness`、`pnpm validate:context-sync`、`pnpm validate:factory` 和 `git diff --check` 均通过。该结果只证明仓库资产和自动证据采集链路可用，不替代 `docs/qa/ios-v1-system-acceptance.md` 的真实系统能力人工验收。
- 2026-05-28 真实 iOS 键盘验收暴露并修复客户端时区相对时间 bug：Simulator 中原生键盘输入“明天上午十点提醒我带电脑”时，旧逻辑因 H5 `now` 是 UTC 字符串而生成 `2026-05-29T10:00:00+00:00`，H5 显示为 `05/29 18:00`。已新增回归 `test_agent_turn_interprets_utc_now_in_client_timezone`，并修复 `RuleParser`、orchestrator `_parse_datetime()` 和 rule-based management 的相对时间入口：有 offset 的 `now` 也必须先转成 `ZoneInfo(clientContext.timezone)` 后再解释“今天 / 明天 / 上午 / 下午”。修复后运行中 API 返回 `due_at=2026-05-29T10:00:00+08:00`，Simulator 重新输入并确认后 H5 显示 `05/29 10:00 scheduled`，后端 `/reminders` 返回 `dueAt=2026-05-29T10:00:00+08:00`。辅助证据位于 `.tmp/ios-acceptance-evidence/manual-keyboard-timezone-fix/keyboard-reminder-confirmed.png` 和 `reminders-tail.json`。
- 2026-05-28 已为 iOS 原生输入控件补稳定 accessibility identifiers，支撑后续 Simulator / XCUITest / 可访问性半自动采证：`ai-code.composer.attachment-button`、`ai-code.composer.keyboard-text-field`、`ai-code.composer.submit-button`、`ai-code.composer.voice-button`、`ai-code.composer.mode-toggle-button`。本轮按 TDD 先让 `pnpm validate:native-shells` 因缺 marker 失败，再补 SwiftUI 标识和 label，随后 `pnpm validate:native-shells`、`pnpm validate:ios-build` 与 `AI_CODE_IOS_SIMULATOR_SKIP_BUILD=1 AI_CODE_IOS_SIMULATOR_KEEP_BOOTED=1 AI_CODE_IOS_SIMULATOR_KEEP_APP_RUNNING=1 pnpm validate:ios-simulator-smoke` 通过。Computer Use 重新读取 Simulator 后已能在 accessibility tree 中看到 attachment、voice、mode-toggle、keyboard text field 和 submit button 的新 ID。该能力只解决自动化定位真实原生控件的问题，不替代系统权限、语音识别质量、照片 / 文件选择器、通知或系统日历的人工验收。
- 2026-05-28 已修复运行中 API live smoke 的真实 provider 抖动问题：`llm_first` 现在会在 rule planner 已能给出单个确定性创建 / 管理动作时使用 `rule_safety_deterministic` 护栏，覆盖显式日程创建、提醒创建、费用草稿创建和单目标管理动作，避免 DeepSeek/OpenAI 对核心时间、金额或目标 patch 产生结构合法但语义漂移的候选；包含 `顺便`、情绪表达等 mixed 对话仍交给 LLM 保留自然回复。本轮 `AI_CODE_PRODUCT_SMOKE_TIMEOUT_SECONDS=45 pnpm validate:product-smoke:live` 已在当前 `127.0.0.1:8000` 服务上通过。
- 2026-05-28 已新增真实 LLM provider smoke：根命令 `pnpm validate:llm-smoke` 会自动读取 `.env.local` 中的 `DEEPSEEK_API_KEY` 或 `OPENAI_API_KEY`，默认优先 DeepSeek；随后锁定 in-memory runtime，避免本机 `DATABASE_URL` 影响 provider 验证。smoke 覆盖闲聊 `chat`、缺时间日程追问 `clarification`、自然回复 + 日程候选 `mixed`、只读查询结构化组件、多提醒创建确认，以及宽泛“完成提醒”的 rule safety clarification。LLM provider 调用新增 `AI_PLANNER_REQUEST_TIMEOUT_SECONDS`，默认 20 秒，避免真实模型调用无界挂起。
- 2026-05-28 已新增 Postgres 产品级 smoke：根命令 `pnpm validate:product-smoke:postgres` 会检测本地 Postgres、执行 migration runner，然后以 `DATABASE_URL` + `AI_CODE_LOAD_ENV_LOCAL=0` + `AI_PLANNER_MODE=rule` 运行与离线产品 smoke 相同的 TestClient 主路径。默认离线 `pnpm validate:product-smoke` 现在会强制 `DATABASE_URL=""`，保证它始终验证 in-memory runtime；Postgres smoke 单独验证 migration、真实 repository 和产品 API 主路径。为消除 Postgres `timestamptz` 与 in-memory 字符串差异，日程和提醒 Postgres repository 读回时按各自 timezone 输出带 offset ISO。
- 2026-05-28 已把 LLM provider 调用观测接入 DecisionTrace / debug / H5 设置页：`LlmPlanningEngine` 会把 provider、model、mode、status、durationMs、prompt/response 字符数和 `promptSha256` 挂到 `PlanningResult.llm_call`，`ExecutionPlanner` 写入 `DecisionTrace.llm_call`，Postgres 通过 `0009_decision_trace_llm_call` 持久化为 JSONB，`GET /agent/conversations/{conversationId}/debug` 透出 `llmCall`，H5 设置页展示 provider、model、耗时和 prompt hash 前缀。provider 调用异常触发 rule fallback 时也会保留 `status=failed`、`errorType`、耗时和 prompt hash。完整 prompt/response preview 默认不进入 trace，只有显式设置 `AI_PLANNER_TRACE_PROMPT=1` / `AI_PLANNER_TRACE_RESPONSE=1` 才会出现在 debug 快照。
- 2026-05-28 已为 iOS 自动证据包新增系统 Calendar App 辅助截图：`collect:ios-acceptance-evidence` 支持显式 `--capture-calendar-system-app` / `AI_CODE_IOS_ACCEPTANCE_CAPTURE_CALENDAR_APP=1`，必须配合 `--seed-acceptance-facts` 使用；采集器会根据 seed 日程 `startAt` 计算 `calshow:<seconds>`，用 `xcrun simctl openurl` 打开 Simulator 系统 Calendar 到对应日期并保存 `system-calendar-app.png`。本轮 live 证据包 `.tmp/ios-acceptance-evidence/system-calendar-app-live/` 显示 `calendarSystemAppEvidence.available=true`、`targetEventStartAt=2026-05-29T15:00:00+08:00`、`calshowUrl=calshow:801730800`，截图中 2026 年 5 月 29 日可见系统 Calendar 事件。该证据是辅助材料，仍不替代人工复核标题、日期、notes marker 和取消清理后的系统 App 截图。
- 2026-05-28 已为 iOS 自动证据包新增本地通知 delivered 诊断辅助证据：`collect:ios-acceptance-evidence` 支持显式 `--seed-notification-delivery` / `AI_CODE_IOS_ACCEPTANCE_SEED_NOTIFICATION_DELIVERY=1`。采集器会通过真实 Agent 确认流创建“2 分钟后”的 seed 提醒，轮询确认目标 `ai-code.reminder.{reminderId}` 进入 `notifications.pendingReminderIds`，等待到期和缓冲时间后轮询 `notifications.deliveredReminderIds`。本轮修复了 iOS reminder sync 清理 delivered notifications 的问题，并为采集器补充 delivered 诊断轮询。live 证据包 `.tmp/ios-acceptance-evidence/notification-delivery-live-4/` 显示 `notificationDelivery.available=true`、`pendingNotificationFound=true`、`deliveredNotificationFound=true`、`seedDueAt=2026-05-28T17:45:11+08:00`、`notificationIdentifier=ai-code.reminder.reminder_321fb33cc6e94939a1ed3949b8e1fe77`。该证据仍是辅助材料，不替代真实 banner、锁屏展示、声音、badge 或用户点击录屏。
- 2026-05-29 已扩展系统日历取消清理辅助证据：`calendarCleanupSeed` 现在包含 `systemCalendarAppScreenshots`，在取消 seed 日程前后分别通过 `calshow:` 打开系统 Calendar 日期页并保存 `calendar-cleanup-before.png`、`calendar-cleanup-after.png`。该能力把 EventKit identifier diagnostics 与系统 Calendar UI 辅助截图放进同一个 cleanup lifecycle 证据对象；截图仍不替代人工复核事件详情、notes marker、无重复事件和取消后消失。
- 2026-05-29 已收口系统日历取消清理采证稳定性：采集器新增 `h5NativeTargetMarkerFound`，避免本机 3000 端口被其他 dev server 占用时误判 H5 可用；`calendarCleanupSeed` 新增取消前 Native 诊断新鲜度、取消前 / 取消后轮询上限、`postCancelRemovedEventIdPresent` 和 H5 失败诊断文件。最终 live 证据包 `.tmp/ios-acceptance-evidence/calendar-cleanup-guard-live-5/` 显示 `calendarCleanupSeed.available=true`、`preCancelStoredIdentifierPresent=true`、`postCancelStoredIdentifierPresent=false`、`postCancelRemovedEventIdPresent=true`、顶层 `calendar.removedEventIds` 包含目标 event id，且 H5 7 个页面截图、`calendar-cleanup-before.png` 和 `calendar-cleanup-after.png` 均已生成。该证据仍不替代系统 Calendar App 事件详情、notes marker、无重复事件和取消后消失的人工复核。
- 2026-05-29 已把 App 包 `H5DevServerURL` 也纳入 iOS 自动证据包目标页面识别：采集器会读取构建产物 `Info.plist` 的 `H5DevServerURL`，并记录 `ios.h5DevServerTargetMarkerFound` / `ios.h5DevServerTargetUrl`，确认 Simulator 实际加载地址也指向当前 AI 时间管理 H5，而不只是默认 `127.0.0.1:3000` 可用。轻量 live 证据包 `.tmp/ios-acceptance-evidence/h5devserver-target-live/` 显示 `serviceHealth.h5NativeTargetMarkerFound=true`、`ios.h5DevServerUrl=http://127.0.0.1:3000/?native=ios`、`ios.h5DevServerTargetMarkerFound=true`，且 H5 7 页截图成功。
- 2026-05-29 已把 iOS 人工验收补证从 Markdown 清单升级为可机器读取的记录模板：`collect:ios-acceptance-evidence` 现在会生成 `manual-evidence-record.template.json`，每个必验项都有稳定 `id`、`status=pending`、允许状态 `passed/failed/blocked`、所需截图 / 录屏 / API / bridge marker / 系统证据字段和空证据占位；`manual-checklist.todo.md` 同步写入 `record_id`，manifest 记录 `manualEvidenceRecordTemplate`。该模板仍不代表人工验收完成，必须由人工补齐证据后才能用于 completion audit。
- 2026-05-29 已新增 iOS 人工验收记录校验器：`pnpm validate:ios-manual-evidence-record` 会先运行 validator 单元测试，再生成 dry-run 证据包并校验 `manual-evidence-record.template.json` 结构；最终验收时可运行 `node scripts/validate-ios-manual-evidence-record.mjs --record <path> --require-complete --report <report-path>`，要求 `acceptanceVerdict=passed`、所有必验项 `status=passed`，且每项必填截图 / API / bridge marker / 系统证据均已补齐；`--report` 会生成 Markdown 补证缺口报告。该命令已纳入 `docs/qa/v1-readiness-audit.md` 的完成判定门槛。
- 2026-05-29 已为 iOS 自动证据包新增人工补证草稿：除空模板外，采集器还会生成 `manual-evidence-record.draft.json`，把自动辅助信号预填到每项 `evidence.operatorNotes`，但保持 `status=pending`、`acceptanceVerdict=not_evaluated`，且不把辅助信号写成截图、录屏、系统证据或通过状态。dry-run 抽查 `.tmp/ios-acceptance-evidence/manual-record-draft-dry-run/` 显示 draft 有 13 项、`generatedFromTemplate=manual-evidence-record.template.json`、语音项仍为 `pending` 且提示“待人工补充”。
- 2026-05-29 已为 iOS 自动证据包新增人工复核 review 记录：采集器现在会生成 `manual-evidence-record.review.json`，把可客观映射的自动辅助截图、API 摘要、bridge marker 和系统 artifact 填入 `evidence` 字段，便于人工验收人员逐项复核；它不会自动把任何 item 改为 `passed`，也不会改变 `acceptanceVerdict=not_evaluated`。在完整 live 包 `.tmp/ios-acceptance-evidence/system-pregrant-denial-live-20260529-154919/` 上生成 review 后，补证报告缺失证据数从 draft 的 81 条降到 42 条；剩余缺口集中在键盘真实输入截图、语音权限 / 识别、照片 / 文件 / PDF 系统选择器、真实通知展示 / 点击录屏等必须人工操作的能力。
- 2026-05-29 已为 iOS 自动证据包新增键盘输入辅助证据开关：`collect-ios-acceptance-evidence` 支持 `--seed-keyboard-input` / `AI_CODE_IOS_ACCEPTANCE_SEED_KEYBOARD_INPUT=1`，根命令 `pnpm collect:ios-keyboard-evidence` 会向当前 Native 会话注入同形态 `native.inputSubmitted`，使用 `source=native.composer.keyboard` 走 H5 `/agent/turns`、确认卡、确认执行和 `/reminders` 读模型闭环，并保存 `native-keyboard-input.png`。`manual-evidence-record.review.json` 会把该辅助截图、reminder id 和 bridge marker 预填到 `keyboard_input` 项，但仍保持 `status=pending` 和 `supportingOnly=true`；真实 Native 输入框获得焦点、系统键盘弹出、用户输入和点击发送仍必须人工截图或录屏。
- 2026-05-29 已为 iOS 自动证据包新增附件输入辅助证据开关：`collect-ios-acceptance-evidence` 支持 `--seed-attachment-inputs` / `AI_CODE_IOS_ACCEPTANCE_SEED_ATTACHMENT_INPUTS=1`，根命令 `pnpm collect:ios-attachment-evidence` 会向当前 Native 会话注入同形态 `native.inputSubmitted` 附件消息，覆盖照片、文件和 PDF 三类来源，走 H5 `/attachments/upload`、附件摘要卡和 `/attachments` 读模型闭环，并保存 `native-attachment-inputs.png`。`manual-evidence-record.review.json` 会把该辅助截图、后端 attachment id 和 source marker 预填到 `photo_attachment`、`file_attachment`、`pdf_text_extraction` 项，但仍保持 `status=pending` 和 `supportingOnly=true`；真实 PhotosPicker、fileImporter、系统权限弹窗、安全作用域文件读取、Vision OCR 和 PDFKit 抽取质量仍必须人工截图或录屏。
- 2026-05-29 已升级 iOS 原生键盘 UI test 为后端提醒事实闭环门禁：`pnpm validate:ios-keyboard-ui-test` 默认运行 `NativeKeyboardInputUITests.testNativeKeyboardComposerConfirmsReminderThroughBackend`，真实点击 Native composer mode toggle、TextField、等待系统键盘、输入“明天上午十点提醒我带电脑”、点击发送，随后等待 H5 确认卡 `请确认执行计划`、点击 `确认`，并断言出现 `已确认执行`、`已创建提醒`、`scheduled` 和“带电脑”提醒事实。UI test 通过专用启动参数让通知 / 日历同步只回 ack、不请求系统权限，并通过 `AI_CODE_UI_TEST_CONVERSATION_ID` 为每次运行注入独立会话，避免旧待确认卡或旧提醒污染测试；脚本现在会检查 `xcodebuild` 实际执行至少 1 个 XCTest，防止 `-only-testing` 未命中却返回成功的 0-test 假阳性。本机 iPhone 16 Pro Max Simulator 已通过 1 个测试、0 个失败。它降低键盘、确认卡和提醒事实刷新路径的回归风险，但仍不替代最终人工验收记录里的截图、后端接口摘要和验收结论。
- 2026-05-29 已新增 iOS 原生语音 UI test 到后端提醒事实闭环门禁：`pnpm validate:ios-voice-ui-test` 默认运行 `NativeKeyboardInputUITests.testNativeVoiceComposerConfirmsReminderThroughBackend`，真实点击 `ai-code.composer.voice-button`，在 UI test 专用 `AI_CODE_UI_TEST_DISABLE_SYSTEM_PERMISSION_REQUESTS=1` 下通过 `AI_CODE_UI_TEST_VOICE_TRANSCRIPT` 注入“明天上午十点提醒我带电脑”，随后等待 H5 Bridge Debug 出现 `source=native.composer.voice`、点击 H5 确认卡 `确认`，并断言出现 `已确认执行`、`已创建提醒`、`scheduled` 和“带电脑”提醒事实。`AI_CODE_UI_TEST_VOICE_TRANSCRIPT` 不在普通 App 运行时生效，真实 Speech / Microphone 路径保持不变。本机 iPhone 16 Pro Max Simulator 已通过 1 个测试、0 个失败；该门禁降低语音入口、确认卡和提醒事实刷新路径的回归风险，但不替代麦克风权限弹窗、真实录音或中文识别质量的人工验收。
- 2026-05-29 已新增 iOS 原生附件菜单 UI test 门禁：`pnpm validate:ios-attachment-ui-test` 默认运行 `NativeKeyboardInputUITests.testNativeAttachmentButtonPresentsAttachmentChoices`，真实点击 `ai-code.composer.attachment-button`，并断言系统菜单展示“选择附件”“选择照片”“选择文件”和“取消”。本机 iPhone 16 Pro Max Simulator 已通过 1 个测试、0 个失败；该门禁降低纸夹入口和附件菜单选项回归风险，但不替代真实 PhotosPicker、fileImporter、系统权限弹窗、安全作用域文件读取、Vision OCR 或 PDFKit 抽取质量的人工验收。
- 2026-05-29 已新增 iOS 原生 Header / Drawer 导航 UI test 门禁：`pnpm validate:ios-navigation-ui-test` 默认运行 `NativeKeyboardInputUITests.testNativeHeaderAndDrawerNavigateH5Surfaces`，真实点击 Header 的 Timeline、执行记录、日历和菜单按钮，再点击 Drawer 中的对话、Timeline、日程、费用、提醒、执行记录和设置入口；每次都在 H5 Bridge Debug 中断言真实 `source=native.header.*` 或 `source=native.drawer.quick-switch` 以及 `view=<surface>`。`HybridShellView` 已为 Header、Drawer 和关闭按钮补稳定 accessibility identifiers。本机 iPhone 16 Pro Max Simulator 已通过 1 个测试、0 个失败；该门禁降低“原生按钮看得见但无法驱动 H5 页面切换”的回归风险，但不替代人工页面截图、长列表滚动和真实业务数据复核。
- 2026-05-29 已把原生导航 / 页面切换纳入结构化人工证据记录：`collect:ios-acceptance-evidence` 生成的 `manual-evidence-record.template.json` 新增稳定 `navigation_surfaces` 项，要求人工补 Header / Drawer 页面截图、`source=native.header.timeline`、`source=native.drawer.quick-switch`、`view=...` 和 `pnpm validate:ios-navigation-ui-test` 输出或 xcresult；`manual-evidence-record.review.json` 可预填 H5 七页面截图作为辅助候选证据，但仍保持 `pending`，不替代人工验收结论。
- 2026-05-29 已新增 v1 completion audit 统一归档入口：`pnpm collect:v1-completion-audit` 默认生成 `v1-completion-audit.json` / `.md`，汇总自动化门禁清单、人工证据记录 completion 校验和 goal 是否可 complete；正式收尾时使用 `pnpm collect:v1-completion-audit -- --run-automated-commands --manual-record <path>` 重新运行自动化命令并绑定补证后的人工记录。默认模式不跑重型命令，只把缺口显性化。
- 2026-05-29 已补齐 v1 completion audit 的自动化命令覆盖：正式审计清单现在包含 `pnpm validate:ios-acceptance-evidence` 和 `pnpm validate:native-shells`，避免最终收尾漏掉自动证据包 / review 预填逻辑和原生壳结构护栏；`validate:v1-readiness` 也会检查这两个命令在 readiness 文档中保留。
- 2026-05-29 已把 `collect:v1-completion-audit` 纳入 `validate:native-shells` 结构护栏：`pnpm validate:native-shells` 现在先运行 `scripts/validate-native-shells.test.mjs`，并检查 package script、`scripts/collect-v1-completion-audit.mjs` 和对应测试入口，避免 completion audit 根命令在后续原生壳收尾中被误删。
- 2026-05-29 已让 v1 completion audit 自动归档人工验收补证缺口报告：只要 `pnpm collect:v1-completion-audit -- --manual-record <path>` 或正式收尾命令绑定人工记录，审计输出目录会额外写入 `manual-evidence-gaps.md`，并在 `v1-completion-audit.json` / `.md` 的 `manualEvidence.reportPath` 中记录路径；`validate:native-shells` 也已守住 `manual-evidence-gaps.md` 和 `manualEvidenceReportPath`，避免后续误删。
- 2026-05-29 已把外部知识库同步状态纳入 v1 completion audit：审计 JSON 新增 `externalKnowledgeSync`，默认记录 `status=not_synced`、`sourceDraftPaths`、Feishu / Obsidian target 状态、`syncEvidence` 和最终披露文案“仓库已更新，外部知识库未同步”；如果后续真实执行飞书或 Obsidian 同步，可用 `--external-knowledge-status synced|partial`、`--feishu-sync-evidence <path>`、`--obsidian-sync-evidence <path>` 或 `--external-knowledge-synced` 把证据写入同一审计包。`validate:v1-readiness` 和 `validate:native-shells` 已守住该字段和参数。
- 2026-05-29 已让 v1 completion audit 支持自动选择人工证据记录：正式收尾可使用 `pnpm collect:v1-completion-audit -- --run-automated-commands --manual-record best --manual-record-root .tmp/ios-acceptance-evidence`，脚本会递归扫描 `manual-evidence-record.filled.json`、`manual-evidence-record.review.json` 和 `manual-evidence-record.draft.json`，优先选择 completion 校验通过的记录，其次选择缺口更少、类型优先级更高、更新时间更近的候选，并在 `manualEvidence.selection` 中记录策略、root、候选数量和选中路径。该能力只减少人工找路径成本，不会把 review / draft 自动视为验收通过。
- 2026-05-29 已让 v1 completion audit Markdown 展示人工证据记录选择依据：当使用 `--manual-record best|latest` 时，`v1-completion-audit.md` 会新增“人工证据记录选择”小节，展示 strategy、root、候选数量、有效候选数量、选中路径、缺口数和 `selectedRequireCompletePassed`；`validate:native-shells` 已守住该可读小节，避免最终审计只剩 JSON 字段而人工复查不方便。
- 2026-05-29 已把人工证据记录的 HEAD 新鲜度纳入 v1 completion audit：审计 JSON 新增 `manualEvidence.packageFreshness`，会读取人工记录或同目录 `manifest.json` 的 `headSha` 并和当前 `git rev-parse --short HEAD` 对比；如果记录来自旧 HEAD，最终 `verdict` 必须保持 `not_complete`，Markdown 也会展示 `packageFreshness`、`recordHeadSha` 和 `currentHeadSha`。这避免旧证据包在当前代码上被误当作完成验收。
- 2026-05-29 已在当前 HEAD `d474ea4` 重新生成 iOS 完整辅助证据包：`pnpm collect:ios-acceptance-evidence -- --seed-supported-system-evidence --seed-keyboard-input --seed-attachment-inputs --output-dir .tmp/ios-acceptance-evidence/current-head-full-supporting-20260529` 写出 `manual-evidence-record.review.json`、H5 七页面截图、系统 Calendar 截图、日历取消前后截图、日历权限拒绝截图、通知点击回流截图、键盘辅助截图和附件辅助截图。随后 `pnpm collect:v1-completion-audit -- --manual-record best --manual-record-root .tmp/ios-acceptance-evidence --output-dir .tmp/v1-completion-audit/current-best-after-current-head-20260529 --external-knowledge-status not_synced` 自动选中新包，`packageFreshness.status=current`、`missingEvidenceCount=33`、`verdict=not_complete`。这消除了旧 HEAD 证据阻塞，并把剩余缺口收敛为人工系统能力补证。
- 2026-05-29 已补齐人工 review 证据映射和 `best` 选择语义：`manual-evidence-review` 会把 H5 七页面截图汇总映射到“`H5 七页面切换截图或录屏`”，并把附件样本的 `kind` 映射为 `attachmentKind=image|text|pdf` bridge marker；同一份 `d474ea4` 证据包重算后缺口可从 33 降到 31。`collect:v1-completion-audit -- --manual-record best` 现在优先选择当前 HEAD 证据记录，再比较 completion 状态和缺口数，避免旧 HEAD 记录因为缺口更少而压过当前版本证据。已验证当前 HEAD `cb8aed5` 的 skip-build 包会被优先选中，`packageFreshness.status=current`，但因跳过 rebuild 缺少部分系统日历辅助材料，缺口为 39；提交后需要再跑完整当前 HEAD 采证包。
- 2026-05-29 已修复 iOS 验收事实种子的费用输入文案：原输入 `把昨天 58 元{seedRunId}验收打车票报销` 会把金额单位和 seed 标记粘在一起，真实 API 中可能被规划器识别成费用金额缺失并返回 `clarification_request`，进而导致 `acceptanceFactSeed.available=false`，阻断系统 Calendar App 截图和日历取消清理辅助证据。现在费用 seed 改为 `把昨天 {seedRunId} 验收打车票 58 元报销`，并用测试守住不再出现 `58 元seed_`。
- 2026-05-31 已修正 iOS 键盘辅助证据的 H5 定位路径：采集器在后端 `/reminders` 找到本轮 `reminderId` 后，会把该 `reminderId` 随 `native.viewChanged` 传回 H5 reminders 视图，复用现有高亮 / 滚动逻辑把目标提醒插入最近列表并截图。`nativeKeyboardInput.backendBridgeAvailable` 单独表示 `source=native.composer.keyboard` bridge marker、H5 确认卡和后端提醒事实已成立；`nativeKeyboardInput.available` 仍要求 `h5ReminderVisible=true` 且无错误，避免把没有展示目标提醒的截图预填为通过候选。该修复只增强自动辅助证据整理，真实 Native 输入框聚焦、系统键盘弹出、用户输入和点击发送仍必须人工截图或通过 UI test / 人工验收记录复核。已用 TDD 增加 `native keyboard evidence requires the backend fact to be visible in H5 reminders` 回归，并通过 `pnpm validate:ios-acceptance-evidence`、`pnpm validate:native-shells`。
- 2026-05-31 当前 HEAD 采证发现长期脏会话中可能残留旧确认卡，键盘辅助采集若全局点击最后一个“确认”按钮，可能确认旧卡而不是本轮 seed 卡。已改为只点击包含当前 `seedRunId` 的确认卡，并增加 `native keyboard evidence confirms the seed-specific card` 脚本护栏，避免旧 pending 确认卡污染键盘提醒事实采集。
- 2026-05-31 当前 HEAD 完整采证首次重跑时发现 H5 目标文档 `curl` 可能在本地 dev server 半开时无限挂起；已为 `collect-ios-acceptance-evidence` 的 service health / H5 document curl 增加 `--max-time` 超时参数，并用 dry-run 测试守住命令形状，避免 completion audit 前采证进程无期限卡住。
- 2026-05-31 当前 HEAD 采证还暴露了费用验收事实 seed 在长期脏会话里会被 LLM 理解成“提交报销草稿”并追问 `target_id`；已将费用 seed 文案从“报销”改为“新建一条昨天打车费 58 元的费用草稿”，并用 dry-run 测试守住包含 `费用草稿` 且不含 `报销`，降低旧费用草稿上下文对自动采证的干扰。
- 2026-05-31 已修正系统日历取消清理人工 review 证据分类：`manual-evidence-record.template.json` 中“后端 canceled 状态”现在归入 `apiSummaries` 而不是截图要求；`manual-evidence-review` 会从 `calendarCleanupSeed.canceledEvent.status` / `postCancelStatus` 预填 `后端 canceled 状态: eventId=..., status=canceled`。该改动只减少错误分类造成的补证噪音，不会把 `system_calendar_cleanup` 自动标记为通过，真实 H5 取消动作截图和人工复核仍是 completion 门槛。
- 2026-05-31 已补齐会话持久 ID 的重启前后截图辅助采证：`collect-ios-acceptance-evidence` 在读取 Native `ai-code.native.conversationId` 后、执行 `simctl terminate/launch` 前后分别保存 `conversation-before-relaunch.png` 和 `conversation-after-relaunch.png`；`manual-evidence-review` 会把这两张截图按“重启前 conversationId”“重启后 conversationId”预填到 `conversation_persistence`。该证据与 UserDefaults 前后值、`/agent/conversations/{conversationId}/turns` 摘要共同证明 Native 会话 ID 稳定，但 review 项仍保持 `pending`，需要人工复核后才可标记通过。
- 2026-05-31 已补齐验收事实种子的 H5 确认卡辅助采证：`acceptanceFactSeed` 仍保持 API 直提交流程写入三领域事实，但在 calendar / reminder seed 确认前会打开同会话 H5 native 页面，优先基于确认卡 DOM 的 `data-plan-id` 精确定位待确认卡，保留 `seedRunId` 作为 fallback，并保存 `acceptance-calendar-confirmation-card.png` 和 `acceptance-reminder-confirmation-card.png`；`manual-evidence-review` 会把它们分别预填到 `system_calendar_write` 的“日程确认卡”和 `local_notification` 的“提醒确认卡”。该能力只补候选截图，不证明真实键盘 / 语音输入来源，也不会把人工项自动标记为通过。
- 2026-05-31 本轮完整 iOS 辅助采证已验证：`acceptanceFactSeed.available=true`，`acceptance-calendar-confirmation-card.png` 和 `acceptance-reminder-confirmation-card.png` 均可真实生成；completion audit 的人工补证缺口已收敛到 26，`verdict=not_complete`。`system_calendar_write`、`conversation_persistence`、`backend_fact_confirmation` 和 `system_sync_degradation` 的 `missingEvidence` 已为“无”，但状态仍 pending，必须人工复核后才可通过。最终收尾仍需以最新 HEAD 重新生成的证据包和 audit 为准。
- 2026-05-31 已补齐 H5 日程取消动作辅助采证：H5 summary 行和行内动作暴露 `data-summary-item-id`、`data-summary-action-type` 和 `data-summary-action-target-id`；`calendarCleanupSeed` 不再只用 API 直取消 seed 日程，而是在同会话 H5 calendar surface 中点击目标行的 `calendar.cancel` 动作并保存 `calendar-cleanup-h5-cancel-action.png`。`manual-evidence-review` 会把该截图预填到 `system_calendar_cleanup` 的“`H5 日程取消动作`”，同时继续保留后端 canceled 状态和系统 Calendar App 消失截图作为独立证据。该证据仍是人工 review 候选材料，不自动把 `system_calendar_cleanup` 标记为 passed。
- 2026-05-31 live 采证暴露长期会话中 seed 日程可能被 H5 日程页 `slice(-6)` 隐藏，且 `native.hostContext` 初始刷新可能和带目标 eventId 的 `native.viewChanged` 竞态。已增强 H5 calendar focus：`native.viewChanged` 支持 `eventId` / `calendarEventId`，日程列表会把 `focusedCalendarEventId` 置入最近列表并高亮；采证器会最多 3 次发送带 `eventId` 的 calendar focus 后再点击取消。脏工作区 live 验证包 `.tmp/ios-acceptance-evidence/worktree-h5-calendar-focus-retry-20260531` 显示 `calendarCleanupSeed.available=true`、`h5CancelActionScreenshot.available=true`，audit 缺口降到 25；提交后仍需用最新 HEAD 重跑正式证据包和 audit。
- 2026-05-31 已补齐原生导航 / 页面切换 UI test 证据归档：`validate:ios-navigation-ui-test` 现在固定写出 `.tmp/ios-navigation-ui-test/ios-navigation-ui-test.log`、`.tmp/ios-navigation-ui-test/ios-navigation-ui-test.xcresult` 和 `navigation-ui-test.json` metadata；iOS UI test 会在 Header Timeline 和 Drawer 设置切换后保留 XCTest screenshot attachment。`collect-ios-acceptance-evidence` 会读取该 metadata 并把 `navigationUiTest` 写入证据包，`manual-evidence-review` 会预填 Header / Drawer 截图、`source=native.header.timeline`、`source=native.drawer.quick-switch` 和 UI test log / xcresult。已运行 `pnpm validate:ios-navigation-ui-test`，1 个 XCTest 通过，review 预检中 `navigation_surfaces.missingEvidence=无`，但状态仍 pending，需人工复核。
- 2026-06-01 已稳定原生导航和附件输入辅助证据归档：`manual-evidence-review` 现在用“`pnpm validate:ios-navigation-ui-test 输出或 xcresult`”完整短语归档 log / xcresult，匹配 `navigation_surfaces.requiredEvidence.systemArtifacts`；`seedNativeAttachmentInputs` 查询后端附件时改为 `limit=50` 且最多 5 次重试，吸收 H5 upload / 后端附件读模型的短暂延迟，避免 PDF seed 偶发未入库导致整包辅助采证降级。该改动仍只减少候选证据缺口，不替代人工验收。
- 2026-06-01 已用 HEAD `5c2ffba` 重跑正式辅助证据包和 completion audit：`pnpm validate:ios-navigation-ui-test` 通过 1 个 XCTest；`.tmp/ios-acceptance-evidence/current-head-final-20260601-5c2ffba` 显示 `navigationUiTest.available=true`、`nativeAttachmentInputs.available=true`、`calendarCleanupSeed.available=true`、`h5CancelActionScreenshot.available=true`；`.tmp/v1-completion-audit/current-best-final-20260601-5c2ffba` 选择了当前 HEAD review 记录，`missingEvidenceCount=20`、`verdict=not_complete`。`navigation_surfaces`、`conversation_persistence`、`system_calendar_write`、`system_calendar_cleanup`、`backend_fact_confirmation` 和 `system_sync_degradation` 的 `missingEvidence=无`，但所有人工项状态仍 pending，仍需真实人工 filled 记录后才能完成 goal。
- 2026-06-01 已补齐原生键盘 UI test 证据归档：`validate:ios-keyboard-ui-test` 现在固定写出 `.tmp/ios-keyboard-ui-test/ios-keyboard-ui-test.log`、`.tmp/ios-keyboard-ui-test/ios-keyboard-ui-test.xcresult` 和 `keyboard-ui-test.json` metadata；XCTest 在系统键盘输入中文后保留 `输入框文本` screenshot attachment。`collect-ios-acceptance-evidence` 会读取 `keyboardUiTest`，`manual-evidence-review` 会把“输入框文本”预填到 `keyboard_input`，同时原有 `nativeKeyboardInput` 继续提供 H5 确认卡、`/reminders` 摘要和 `source=native.composer.keyboard`。已运行 `pnpm validate:ios-keyboard-ui-test`，1 个 XCTest 通过；该证据仍是人工 review 候选材料，不自动把键盘验收标记为 passed。
- 2026-06-01 已用 HEAD `71aa8fe` 重跑正式辅助证据包和 completion audit：`.tmp/ios-acceptance-evidence/current-head-final-20260601-71aa8fe` 显示 `keyboardUiTest.available=true`、`nativeKeyboardInput.available=true`、`navigationUiTest.available=true`、`nativeAttachmentInputs.available=true`、`calendarCleanupSeed.available=true`；`.tmp/v1-completion-audit/current-best-final-20260601-71aa8fe` 选择了当前 HEAD review 记录，`missingEvidenceCount=19`、`verdict=not_complete`。`keyboard_input.missingEvidence=无`，但仍需人工把 item 状态改为 passed 后才能作为完成证据。
- 2026-06-01 已补齐 H5 局域网地址覆盖的人工 review 候选证据映射：`manual-evidence-review` 现在只在 `ios.h5DevServerUrl` 是私有局域网地址（10/8、172.16/12、192.168/16 或 169.254/16）且存在 App 启动截图时，才预填“局域网地址 App 启动截图”，避免把 `localhost` / `127.0.0.1` 误当成真机或局域网覆盖证据。TDD 红绿验证已覆盖 `h5_address_override` 的默认地址截图、局域网截图、`H5DevServerURL` marker、`h5NativeTargetMarkerFound=true` 和 Info.plist 构建产物摘要；该证据仍保持 `pending`，必须人工复核。
- 2026-06-01 已修正通知辅助证据 review 的部分可用映射：当 `notificationDelivery.available=false` 但提醒 seed 已生成 `reminderId` 时，`manual-evidence-review` 仍会预填 H5 提醒页 scheduled 截图和 `/reminders` 摘要；当 `notificationClickBackflow.available=false` 但 H5 synthetic `native.viewChanged` 已打开 reminders 并高亮目标提醒时，仍会预填“通知点击后 H5 reminders 视图”“高亮提醒行”、`/reminders` 摘要和 `source=native.notifications.reminders.opened`。系统 pending/delivered notification、`notifications.reminders.sync`、系统通知截图和真实点击录屏不会被这类部分证据冒充，仍保留为缺口。对 `.tmp/ios-acceptance-evidence/current-head-final-20260601-57c0cc0` 复算时，`missingEvidenceCount` 可从 25 回到 19。
- 2026-05-29 已为 iOS 自动证据包新增系统辅助证据批量开关：`collect:ios-acceptance-evidence` 支持 `--seed-supported-system-evidence` / `AI_CODE_IOS_ACCEPTANCE_SEED_SUPPORTED_SYSTEM_EVIDENCE=1`，一次性启用验收事实种子、系统 Calendar App 截图、系统日历取消清理、日历权限拒绝降级、通知点击回流和通知 delivered 诊断。该开关只减少采证参数成本，仍保持 `manualAcceptanceRequired=true` 和人工验收完成门槛。
- 2026-05-29 已新增系统辅助证据采集根命令：`pnpm collect:ios-system-evidence` 等价于 `collect:ios-acceptance-evidence --seed-supported-system-evidence`，用于 completion audit 前集中补齐当前可自动化的 iOS 系统辅助材料；采集器已兼容 `pnpm ... -- --dry-run --output-dir ...` 传入的单独 `--` 分隔符，并已纳入 `validate:native-shells` 根命令护栏。
- 2026-05-29 已增强 iOS 自动采证稳定性：采集器的后端 HTTP 调用现在通过 `fetchWithRetry()` 对 `ECONNRESET`、`ECONNREFUSED`、`EPIPE`、`ETIMEDOUT` 和 `UND_ERR_SOCKET` 做有限重试，避免本地 API 偶发连接重置直接中断整包采集；同时修复通知点击回流轮询里 `const refresh` 被重新赋值导致 live 路径崩溃的问题。`pnpm validate:ios-acceptance-evidence` 当前 14 个测试通过；live 证据包 `.tmp/ios-acceptance-evidence/system-live-fixed-20260529-152913/` 显示 H5 / App 目标识别、验收事实种子、系统 Calendar App 截图、日历权限拒绝降级、通知点击回流和通知 delivered 诊断可用，且补证缺口报告已写入 `manual-evidence-gaps.md`。同一证据包里 `calendarCleanupSeed.available=false`，原因是本轮 seed 日程取消前未被 Native EventKit 诊断看到；因此系统日历取消清理仍需继续人工补证或单独排查 Simulator 权限 / EventKit 同步状态，不能视为完成验收。
- 2026-05-29 已修复系统日历取消清理受旧权限拒绝状态污染的问题：`collect-ios-acceptance-evidence` 在系统 Calendar App 截图 / 日历取消清理前新增 `ios.calendarAccessPreparation`，会对目标 Simulator 执行 `xcrun simctl privacy <udid> grant calendar com.aiengineeringcode.shell` 并 relaunch，避免上一轮 `calendarPermissionDenialSeed` 留下的 TCC 状态导致 EventKit 写入前置失败；权限拒绝场景仍会在 cleanup 之后单独 revoke 验证降级路径。权限拒绝可用性判断也改为以 Native `calendar.lastSyncStatus=failed` 和“日历权限”错误原因为准，兼容部分 iOS / Simulator 组合中 `EKAuthorizationStatus` 仍显示 `authorized` 的情况。完整 live 证据包 `.tmp/ios-acceptance-evidence/system-pregrant-denial-live-20260529-154919/` 显示 `acceptanceFactSeed`、`calendarSystemAppEvidence`、`calendarCleanupSeed`、`calendarPermissionDenialSeed`、`notificationClickBackflow` 和 `notificationDelivery` 全部 `available=true`，且 manifest 仍保持 `acceptanceVerdict=not_evaluated`、`manualAcceptanceRequired=true`、`automationCanReplaceManualAcceptance=false`；人工补证缺口报告已写入同目录 `manual-evidence-gaps.md`。
- Postgres 本地容器已能运行，数据库名 `ai_code`，用户 `ai_code`。
- 第一版 migration 已建立：`conversation_turns`、`execution_plans`、`domain_actions`、`confirmations`、`execution_ledger`、`calendar_events`、`expense_records`、`reminders` 等表。
- 后端设置 `DATABASE_URL` 后使用 Postgres repository；未设置时仍可使用 in-memory repository 便于测试。
- H5 收到 iOS 的 `native.inputSubmitted` 后，通过 `@ai-code/sdk` 调用 `/agent/turns`；提交过程只追加用户消息，Timeline、日程、费用、提醒和执行记录都来自后端响应或持久化快照。
- H5 渲染后端返回的确认卡；点击确认后调用 `/execution-plans/{id}/confirm`。
- H5 取消确认卡会调用 `/execution-plans/{id}/reject`，拒绝成功后移除该确认卡。
- 确认成功后会刷新 `/calendar/events`、`/expenses`、`/reminders` 与 `/execution-ledger`，并移除已确认的确认卡，避免重复提交。
- H5 提醒列表中的 scheduled 提醒会显示“完成”和“取消”行内动作，点击后调用后端提醒状态接口并刷新 Timeline / reminders。
- 后端对“已成功计划 + 同一 confirmToken 的重复确认”做幂等返回，不再产生 `400 Bad Request`。
- 解析器已支持“明天下午三点安排一个新年业务规划会，时间一个半小时”，标题为“新年业务规划会”，时长 90 分钟。
- API 已允许本地和局域网 H5 origin 的 CORS 预检，适配 Xcode 真机/模拟器访问。
- 根目录 `pnpm dev:full` 现在同时启动 H5 `0.0.0.0:3000` 和 API `0.0.0.0:8000`，API 默认连接本地 Postgres。
- 新增 `pnpm validate:context-sync`，用于检查当前状态、记忆索引、阶段决策、知识同步清单和飞书页面源稿是否保留必要同步声明。
- `pnpm validate:factory` 已串联上下文同步检查，阶段收尾时会一起校验 AI 工厂结构和上下文同步规则。
- `phase-strategy.md` 已在 2026-05-23 复审：AI 时间管理 Agent 可以进入 Phase 2 前段的受控产品开发，但每个能力仍必须按 PRD、设计资产、工程规格、契约、SDK 和阶段记录推进。
- 费用草稿薄切片已完成：输入“把昨天 58 元打车票报销”会生成费用确认计划，确认后写入 `expense_records`，`GET /expenses` 可读取草稿。
- 后端新增 `expense` domain 的 model、repository、service 和 Postgres repository；确认执行由 orchestrator 分派到 `ExpenseDomainService`。
- 提醒闭环已完成：输入“明天上午九点提醒我带电脑”会生成提醒确认计划，确认后写入 `reminders`，`GET /reminders` 可读取提醒。
- H5 已扩展为 v1.0 页面集合：对话、Timeline、日程、费用、提醒、执行记录、设置；确认成功后会刷新三领域数据和执行记录。
- H5 原生嵌入模式不再预置 demo 确认卡；`?native=ios` 会从真实欢迎语和空状态开始，避免把开发预览 mock 误认为后端返回。
- 2026-05-28 已增强 H5 Bridge Debug 入站可观测性：调试面板的 `in=` 不再只显示 `native.inputSubmitted`，而会摘要展示 Native 入站消息的 `source`、`inputKind`、附件名、view 或 ack 类型；附件场景不会展示 `base64Content`。这让 Xcode / Simulator 手动验收键盘、语音和附件时，可以直接从 H5 截图证明真实 Native 输入来源进入了 Bridge。
- iOS Native Shell 已扩展 Header/Drawer 入口：对话、Timeline、日历、费用、提醒、执行记录、设置均会通过 `native.viewChanged` 驱动 H5；底部输入支持键盘提交、原生语音识别提交和真实照片 / 文件选择；已确认提醒会同步到 iOS 本地通知，通知点击会回到提醒视图并高亮对应提醒行。
- 日程事实会通过 `calendar.events.sync` 同步到 iOS；iOS 只做系统权限、去重、EventKit 写入和非 scheduled 清理，不解析业务语义。
- iOS 底部附件入口已接真实照片 / 文件选择器；原生 Bridge 会回传附件元数据和可读文本，并在原始内容不超过 5MB 时额外回传 `base64Content`。照片和 Files 图片附件会通过 iOS Vision best-effort 识别文本，PDF 会通过 PDFKit 抽取页面文本；后端已能 intake 元数据，也已提供 `POST /attachments/upload` 承接小文件内容上传、文本抽取和展示文本合并；后续重点是真机端到端体验验证和行内动作审计一致性。

## 当前本机服务状态

最近一次调试中：

- H5 可通过 `http://192.168.1.238:3000` 访问。
- API 可通过 `http://192.168.1.238:8000` 访问。
- API 可能运行在 `screen` 会话 `ai-code-api` 中；新窗口必须用 `screen -ls`、`lsof -nP -iTCP:8000 -sTCP:LISTEN` 和 `/health` 重新确认，不要假设仍然存活。
- 2026-05-23 现场发现旧 API 进程曾以无 `--reload` 方式占用 8000，导致提醒代码已通过测试但 Xcode 仍返回“未识别”。已停止旧进程并用 `pnpm dev:api` 重启；如果再次出现代码和接口行为不一致，先查 8000 进程是否是旧 uvicorn。
- Xcode 的 H5 地址由 `apps/ios/AIEngineeringCode/Info.plist` 的 `H5DevServerURL` 控制。该文件经常包含本地机器 IP，默认视为用户本地配置，不要随意提交。

## 当前已验证

全量验证曾在 2026-05-23 通过：

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests -v
PATH=.venv/bin:$PATH ruff check python
PATH=.venv/bin:$PATH mypy python
pnpm --filter @ai-code/h5 typecheck
pnpm --filter @ai-code/sdk typecheck
pnpm --filter @ai-code/shared-types typecheck
pnpm validate:contracts
```

费用草稿薄切片在 2026-05-23 通过：

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests -v
PATH=.venv/bin:$PATH ruff check python
PATH=.venv/bin:$PATH mypy python
pnpm --filter @ai-code/h5 typecheck
pnpm --filter @ai-code/sdk typecheck
pnpm --filter @ai-code/shared-types typecheck
pnpm validate:contracts
```

AI 时间管理 Agent v1.0 初版 App 在 2026-05-23 通过：

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests -v
PATH=.venv/bin:$PATH ruff check python
PATH=.venv/bin:$PATH mypy python
pnpm --filter @ai-code/h5 typecheck
pnpm --filter @ai-code/sdk typecheck
pnpm --filter @ai-code/shared-types typecheck
pnpm validate:contracts
pnpm validate:native-shells
pnpm validate:context-sync
pnpm validate:factory
git diff --check
```

浏览器验证已覆盖 H5 七个页面切换：`conversation`、`timeline`、`calendar`、`expenses`、`reminders`、`ledger`、`settings`。浏览器截图捕获命令超时，但 DOM 交互和页面标题检查已通过。

上下文同步验证新增：

```bash
pnpm validate:context-sync
pnpm validate:factory
```

AI Planning Runtime v1 后端架构实施在 2026-05-26 通过：

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests -q
PATH=.venv/bin:$PATH ruff check python
PATH=.venv/bin:$PATH mypy python
pnpm --filter @ai-code/h5 typecheck
pnpm --filter @ai-code/sdk typecheck
pnpm --filter @ai-code/shared-types typecheck
pnpm validate:contracts
pnpm validate:native-shells
pnpm validate:context-sync
pnpm validate:factory
git diff --check
```

结果：`54 passed, 6 skipped`；ruff、mypy、前端 typecheck、契约、原生壳、上下文同步、工厂验证和 diff 检查均通过。临时启动 `uvicorn` 到 `127.0.0.1:8010` 后，`POST /agent/turns` 验证默认 rule planner 对“明天上午九点提醒我带电脑”返回 `confirmation_required` 和 `reminder.create_reminder`。本机 Postgres 5432 当前 connection refused，因此未实际应用 `0002_agent_planning_runtime` migration；Postgres 相关新增测试按现有策略 skip。

Postman 接口文档在 2026-05-27 通过：

```bash
node -e "JSON.parse(require('fs').readFileSync('docs/postman/ai-code-backend.postman_collection.json','utf8')); JSON.parse(require('fs').readFileSync('docs/postman/ai-code-backend.postman_environment.json','utf8')); console.log('postman json ok')"
git diff --check -- docs/postman
```

`pnpm dev:full` 启动修复在 2026-05-27 通过：

```bash
pnpm --filter @ai-code/h5 typecheck
pnpm dev:full
curl -fsS http://127.0.0.1:8000/health
curl -fsS -o /dev/null -w "%{http_code}" 'http://127.0.0.1:3000/?native=ios&bridgeDebug=1'
```

结果：API `/health` 返回 `{"status":"ok"}`，H5 返回 `200`，启动日志无 `EADDRINUSE` 和 hydration mismatch。

Timeline 业务聚合在 2026-05-27 通过：

```bash
pnpm --filter @ai-code/h5 typecheck
pnpm validate:contracts
curl -fsS -o /dev/null -w "%{http_code}" 'http://127.0.0.1:3000/?native=ios&bridgeDebug=1'
```

现场 API 验证已通过：通过 `/agent/turns` 分别创建并确认日程、费用、提醒后，`/calendar/events`、`/expenses`、`/reminders` 均能读到最新事实；H5 页面返回 `200`。

生活类日程识别在 2026-05-27 通过：

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_agent_turns.py python/backend/tests/test_orchestrator_planner.py -q
PATH=.venv/bin:$PATH ruff check python/agent-runtime/agent_runtime/parsers/rule_parser.py python/backend/tests/test_agent_turns.py python/backend/tests/test_orchestrator_planner.py
```

现场 API 验证已通过：`POST /agent/turns` 输入“明天中午我要去跟老婆吃午饭”返回 `confirmation_required`，首个 action 为 `calendar.create_event`，payload 为 `title=跟老婆吃午饭`、`start_at=2026-05-28T12:00:00+08:00`、`end_at=2026-05-28T13:00:00+08:00`。

LLM-first 规划主路径在 2026-05-27 通过：

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests -q
PATH=.venv/bin:$PATH ruff check python
PATH=.venv/bin:$PATH mypy python
```

结果：`68 passed`，ruff 和 mypy 均通过。默认无 `OPENAI_API_KEY` 时，`create_planning_engine()` 返回 `LlmFirstPlanningEngine`，运行时会记录 `fallback_reason=llm_error: RuntimeError` 并回落到 rule planner；设置 `OPENAI_API_KEY` 后会优先调用真实 OpenAI provider。

多 provider LLM 架构在 2026-05-27 通过：

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_llm_planning_engine.py python/backend/tests/test_planner_mode_selection.py -q
PATH=.venv/bin:$PATH pytest python/backend/tests -q
PATH=.venv/bin:$PATH ruff check python
PATH=.venv/bin:$PATH mypy python
pnpm validate:context-sync
```

结果：目标测试 `17 passed`，后端全量测试 `75 passed`，ruff、mypy 和上下文同步检查均通过。已验证 `AI_PLANNER_PROVIDER=deepseek` 会创建 `DeepSeekLlmProvider`，默认 base URL 为 `https://api.deepseek.com`，调用 Chat Completions 时发送 system/user messages、`response_format={"type":"json_object"}` 和 `temperature=0`；`AI_PLANNER_PROVIDER=openai` 继续使用 OpenAI Responses API。

`.env.local` 本地密钥加载在 2026-05-27 通过：

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_planner_mode_selection.py -q
PATH=.venv/bin:$PATH pytest python/backend/tests -q
PATH=.venv/bin:$PATH ruff check python
PATH=.venv/bin:$PATH mypy python
pnpm validate:context-sync
```

结果：目标测试 `12 passed`，后端全量测试 `77 passed`，ruff、mypy 和上下文同步检查均通过。已验证 `.env.local` 可驱动 `AI_PLANNER_PROVIDER=deepseek` 和 `AI_PLANNER_MODEL`，且不会覆盖终端显式 `export` 的变量；随后补充测试隔离后，全量后端测试提升为 `79 passed`。

LLM 调用观测日志在 2026-05-27 通过：

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_llm_planning_engine.py -q
PATH=.venv/bin:$PATH pytest python/backend/tests -q
PATH=.venv/bin:$PATH ruff check python
PATH=.venv/bin:$PATH mypy python
pnpm validate:context-sync
```

结果：目标测试覆盖默认安全日志和 `AI_PLANNER_LOG_PROMPT=1` 完整 prompt 日志；后端全量测试 `79 passed`。后端日志可直接观察 `duration_ms`、`prompt_chars`、`response_chars` 和 `prompt_sha256`。

对话路由与追问补全设计在 2026-05-27 完成：

```text
docs/superpowers/specs/2026-05-27-conversation-routing-clarification-design.md
```

设计明确下一阶段优先补齐：自然闲聊、缺字段追问、pending clarification 保存与补全、H5 quick replies 渲染、以及“补充十点后生成确认卡”的多轮回归。

对话路由与追问补全实施计划在 2026-05-27 完成：

```text
docs/superpowers/plans/2026-05-27-conversation-routing-clarification.md
```

计划已按 TDD 拆为后端 schema、规则 fallback、pending clarification store、context 注入、orchestrator 多轮补全、H5 quick replies 和最终验证。下一步可按计划执行实现。

对话路由与追问补全 v1 在 2026-05-27 通过：

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests -q
PATH=.venv/bin:$PATH ruff check python
PATH=.venv/bin:$PATH mypy python
pnpm --filter @ai-code/h5 typecheck
pnpm --filter @ai-code/sdk typecheck
pnpm --filter @ai-code/shared-types typecheck
pnpm validate:contracts
pnpm validate:native-shells
pnpm validate:context-sync
pnpm validate:factory
git diff --check
```

结果：后端全量测试 `88 passed`，ruff、mypy、H5/SDK/shared-types typecheck、契约、原生壳、上下文同步、工厂校验和 diff 空白检查均通过；Postman collection JSON 解析通过。临时启动 `uvicorn` 到 `127.0.0.1:8011` 后，手动 API 验证通过：

- `POST /agent/turns` 输入“明天上午我要去开会”返回 `clarification_request`、`missingFields=["start_at"]` 和三条 `quickReplies`。
- 同一 `conversationId` 继续输入“十点”返回 `confirmation_required`，首个 action 为 `calendar.create_event`，`start_at=2026-05-22T10:00:00+08:00`。
- 输入“今天有点累”返回自然 `assistant_message`，不生成执行计划。

Postgres migration 与 pending 补全增强在 2026-05-27 通过：

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests -q
PATH=.venv/bin:$PATH ruff check scripts/db_migrate.py python/backend/tests/test_db_migrate_script.py python/orchestrator/orchestrator/planner.py python/agent-runtime/agent_runtime/parsers/rule_parser.py python/backend/backend/app/infrastructure/postgres/pending_clarification_repository.py
PATH=.venv/bin:$PATH mypy python
pnpm --filter @ai-code/h5 typecheck
pnpm --filter @ai-code/sdk typecheck
pnpm --filter @ai-code/shared-types typecheck
pnpm validate:contracts
pnpm validate:native-shells
pnpm validate:db-migrations
pnpm validate:context-sync
pnpm validate:factory
git diff --check
```

结果：后端全量测试 `95 passed`；已覆盖迁移计划、planner mode 约束、pending 不抢新提醒意图、下午日程补全、费用金额补全；ruff、mypy、H5/SDK/shared-types typecheck、契约、原生壳、迁移、上下文同步、工厂校验和 diff 空白检查均通过。`PATH=.venv/bin:$PATH python scripts/db_migrate.py --help` 也已验证迁移 runner CLI 可用。

Agent 对话调试接口在 2026-05-27 通过：

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_agent_turns.py::test_agent_debug_returns_events_and_decision_traces python/backend/tests/test_agent_turns.py::test_agent_debug_returns_pending_clarifications python/backend/tests/test_pending_clarifications.py -q
PATH=.venv/bin:$PATH ruff check python
PATH=.venv/bin:$PATH mypy python
pnpm --filter @ai-code/shared-types typecheck
pnpm validate:contracts
node -e "JSON.parse(require('fs').readFileSync('docs/postman/ai-code-backend.postman_collection.json','utf8')); console.log('postman json ok')"
```

结果：目标后端测试覆盖事件 + trace 查询、pending 查询、pending store 列表能力和 in-memory pending context 注入；ruff 和 mypy 通过，shared-types typecheck 通过，OpenAPI 契约校验通过，Postman collection JSON 解析通过。Postman 已新增 `Agent 对话 / 查看对话调试信息`，用于按 `conversationId` 查看事件、决策 trace 和 pending 追问。

LLM mixed 回复链路在 2026-05-27 通过：

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_llm_planning_engine.py::test_llm_planning_engine_returns_mixed_message_with_actions python/backend/tests/test_orchestrator_planner.py::test_planner_preserves_mixed_assistant_message_with_confirmation python/backend/tests/test_agent_turns.py::test_agent_turn_summary_prefers_mixed_confirmation_message -q
PATH=.venv/bin:$PATH ruff check python/backend/tests/test_llm_planning_engine.py python/backend/tests/test_orchestrator_planner.py python/backend/tests/test_agent_turns.py python/orchestrator/orchestrator/planner.py python/orchestrator/orchestrator/use_cases/submit_turn.py
pnpm --filter @ai-code/h5 typecheck
pnpm --filter @ai-code/shared-types typecheck
```

结果：目标测试 `3 passed`；已覆盖 LLM mixed 解析保留 `assistant_message`、orchestrator 确认响应保留 `message`、对话摘要优先保存 mixed 自然回复；H5 和 shared-types typecheck 通过。这个能力用于支持“用户一边闲聊一边提出可执行动作”时，前端既能展示自然回复，也能展示确认卡。

iOS 原生语音输入闭环在 2026-05-27 通过：

```bash
pnpm --filter @ai-code/h5 typecheck
pnpm validate:contracts
pnpm validate:native-shells
pnpm validate:context-sync
pnpm validate:factory
git diff --check
xcodebuild -project apps/ios/AIEngineeringCode.xcodeproj -scheme AIEngineeringCode -configuration Debug -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build
```

结果：H5 typecheck、契约校验、原生壳静态契约检查、上下文同步、工厂校验、diff 空白检查和 iOS Debug 模拟器构建均通过。静态检查已防止语音输入回退到 `startMockVoiceInput` 或固定 mock 文本，并要求 `Info.plist` 保留 `NSMicrophoneUsageDescription` 与 `NSSpeechRecognitionUsageDescription`。实际识别质量仍需在 Xcode 模拟器或真机授权后手动验证。

iOS 本地通知调度闭环在 2026-05-27 通过：

```bash
pnpm --filter @ai-code/h5 typecheck
pnpm validate:contracts
pnpm validate:native-shells
xcodebuild -project apps/ios/AIEngineeringCode.xcodeproj -scheme AIEngineeringCode -configuration Debug -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build
```

结果：H5 会在原生宿主下把已确认提醒同步给 Native；Bridge schema 和 H5 类型检查通过；原生壳静态检查已覆盖 `UserNotifications`、`UNUserNotificationCenter` 和 `notifications.reminders.sync`；iOS Debug 模拟器构建通过。系统通知弹窗授权和实际触发仍需在模拟器或真机上做手动运行验证。

iOS 系统日历写入闭环在 2026-05-27 通过：

```bash
pnpm --filter @ai-code/h5 typecheck
pnpm validate:contracts
pnpm validate:native-shells
xcodebuild -project apps/ios/AIEngineeringCode.xcodeproj -scheme AIEngineeringCode -configuration Debug -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build
```

结果：H5 会在原生宿主下把已确认日程同步给 Native；Bridge schema 和 H5 类型检查通过；原生壳静态检查已覆盖 `EventKit`、`EKEventStore`、`NativeCalendarEventSyncer`、`calendar.events.sync` 和日历权限 key；iOS Debug 模拟器构建通过。系统日历授权弹窗、实际写入和重复刷新去重仍需在模拟器或真机上做手动运行验证。

iOS 原生附件选择闭环在 2026-05-27 通过：

```bash
pnpm validate:native-shells
xcodebuild -project apps/ios/AIEngineeringCode.xcodeproj -scheme AIEngineeringCode -configuration Debug -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build
```

结果：原生壳静态检查已覆盖 `PhotosUI`、`UniformTypeIdentifiers`、`PhotosPickerItem`、`fileImporter` 和 `submitNativeAttachment`，并禁止固定费用 mock 文本回归；iOS Debug 模拟器构建通过。照片 / 文件选择器的取消、选择和 H5 收到 `native.inputSubmitted` 仍需在模拟器或真机上做手动运行验证。

iOS 原生小文件 base64 Bridge 契约在 2026-05-28 通过：

```bash
node - <<'NODE'
const fs = require('node:fs');
const source = fs.readFileSync('apps/ios/AIEngineeringCode/HybridShellView.swift', 'utf8');
const checks = [
  ['defines native attachment base64 limit', 'nativeAttachmentBase64LimitBytes'],
  ['payload can include base64Content', 'payload["base64Content"] = data.base64EncodedString()'],
  ['photo data is passed to attachment submitter', 'contentData: data'],
  ['file importer reads selected file data', 'try? Data(contentsOf: url)'],
];
let failed = false;
for (const [name, needle] of checks) {
  if (!source.includes(needle)) {
    console.error(`FAIL ${name}: missing ${needle}`);
    failed = true;
  }
}
if (!failed) console.log('native attachment base64 checks passed');
process.exit(failed ? 1 : 0);
NODE
pnpm validate:native-shells
xcodebuild -project apps/ios/AIEngineeringCode.xcodeproj -scheme AIEngineeringCode -destination 'generic/platform=iOS' CODE_SIGNING_ALLOWED=NO -quiet build
git diff --check -- apps/ios/AIEngineeringCode/HybridShellView.swift apps/ios/README.md contracts/hybrid-bridge/README.md
```

结果：红灯验证先证明 iOS 附件 payload 还没有 `base64Content`、没有 5MB 限制常量、照片 `Data` 未传入提交函数、文件选择器未读取 `Data`。补齐后，照片和文件在原始内容不超过 5MB 时会额外传 `base64Content`，大文件仍只传元数据；原生壳静态验证通过，禁用签名后的 iOS 构建通过。真实照片 / 文件选择和 H5 upload 调用仍需在模拟器或真机上做端到端验证。

H5 附件上传路径选择闭环在 2026-05-28 通过：

```bash
pnpm --filter @ai-code/h5 typecheck
pnpm --filter @ai-code/sdk typecheck
pnpm --filter @ai-code/shared-types typecheck
pnpm validate:contracts
pnpm validate:native-shells
```

结果：红灯验证先证明 H5 缺少附件 upload/intake 选择器；补齐后，`native.inputSubmitted` 附件 payload 带 `base64Content` 时会构造 `AttachmentUploadRequest` 并调用 `/attachments/upload`，不带内容时继续构造 `AttachmentIntakeRequest` 并调用 `/attachments/intake`。Bridge 契约样例已包含 `base64Content`，附件摘要卡和后续快捷回复链路保持不变。

iOS 照片附件原生 OCR 薄闭环在 2026-05-28 通过：

```bash
pnpm validate:native-shells
xcodebuild -project apps/ios/AIEngineeringCode.xcodeproj -scheme AIEngineeringCode -destination 'generic/platform=iOS' CODE_SIGNING_ALLOWED=NO -quiet build
```

结果：红灯验证先证明 iOS 壳层缺少 `Vision`、`VNRecognizeTextRequest` 和 `recognizedText`；补齐后，照片附件会 best-effort 识别中英文文本并追加到附件 `text` 字段，识别失败不阻断原有附件提交。原生壳静态验证通过，禁用签名后的 iOS 构建通过。

iOS 提醒通知点击回流在 2026-05-27 通过：

```bash
pnpm validate:native-shells
xcodebuild -project apps/ios/AIEngineeringCode.xcodeproj -scheme AIEngineeringCode -configuration Debug -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build
```

结果：原生壳静态检查已覆盖 `UNUserNotificationCenterDelegate`、`openReminderFromNotification`、`didReceive response` 和 `willPresent notification`；iOS Debug 模拟器构建通过。真实通知点击、前台 banner 展示和 H5 收到带 `reminderId` 的 `native.viewChanged` 仍需在模拟器或真机上手动运行验证。

H5 提醒通知点击高亮补齐在 2026-05-27 通过：

```bash
pnpm --filter @ai-code/h5 typecheck
pnpm validate:native-shells
pnpm validate:contracts
PATH=.venv/bin:$PATH pytest python/backend/tests/test_agent_turns.py python/backend/tests/test_orchestrator_planner.py -q
pnpm validate:context-sync
pnpm validate:factory
xcodebuild -project apps/ios/AIEngineeringCode.xcodeproj -scheme AIEngineeringCode -configuration Debug -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build
git diff --check
```

结果：H5 类型契约已覆盖 `remindersToBackendElements(reminders, { focusedReminderId })` 返回高亮项；原生壳、契约、关键后端测试、上下文同步、工厂检查、iOS Debug 模拟器构建和 diff 空白检查均通过。`native.viewChanged` 携带 `reminderId` 时会刷新提醒快照、切换提醒视图并渲染 `aria-current=true` / `ai-agent-backend-row-highlighted`。真实通知点击到高亮行的视觉效果仍需在模拟器或真机上手动运行验证。

H5 提醒通知目标定位滚动在 2026-05-28 通过：

```bash
pnpm validate:h5-runtime
pnpm --filter @ai-code/h5 typecheck
```

结果：红灯验证先证明 H5 只高亮提醒行，没有可定位标记，也没有 `scrollIntoView`；补齐后，summary-list 高亮项会带 `data-highlighted-summary-item`，reminders surface 在有 `focusedReminderId` 时会把高亮项滚动到视口中央。该能力服务系统通知点击后的目标定位，真实通知点击仍需在模拟器或真机上观察。

H5 运行时去 mock 与取消确认可信闭环在 2026-05-27 通过：

```bash
pnpm validate:h5-runtime
pnpm --filter @ai-code/h5 typecheck
```

结果：`validate:h5-runtime` 已覆盖 H5 运行时组件不再包含 `inferScheduleDraft`、`makeInteractionElements` 和“Mock 后端返回”；取消确认卡必须移除旧卡片且不能静默吞掉 reject 失败。H5 类型检查通过。

提醒完成 / 取消可点击闭环在 2026-05-27 通过：

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_agent_turns.py::test_reminder_status_endpoints_complete_and_cancel_reminders -q
PATH=.venv/bin:$PATH pytest python/backend/tests/test_agent_turns.py python/backend/tests/test_orchestrator_planner.py -q
PATH=.venv/bin:$PATH ruff check python/backend/backend/app/domains/reminder python/backend/backend/app/routes/reminder.py python/backend/tests/test_agent_turns.py
PATH=.venv/bin:$PATH mypy python
pnpm --filter @ai-code/h5 typecheck
pnpm --filter @ai-code/sdk typecheck
pnpm --filter @ai-code/shared-types typecheck
pnpm validate:contracts
pnpm validate:h5-runtime
node -e "JSON.parse(require('fs').readFileSync('docs/postman/ai-code-backend.postman_collection.json','utf8')); JSON.parse(require('fs').readFileSync('docs/postman/ai-code-backend.postman_environment.json','utf8')); console.log('postman json ok')"
```

结果：目标后端测试和关键后端测试通过；ruff、mypy、H5/SDK/shared-types typecheck、契约校验、H5 运行时校验和 Postman JSON 解析均通过。

附件元数据 intake 闭环在 2026-05-27 通过：

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_attachments.py -q
PATH=.venv/bin:$PATH pytest python/backend/tests -q
PATH=.venv/bin:$PATH pytest python/backend/tests/test_agent_turns.py python/backend/tests/test_orchestrator_planner.py python/backend/tests/test_attachments.py -q
PATH=.venv/bin:$PATH ruff check python
PATH=.venv/bin:$PATH mypy python
pnpm --filter @ai-code/h5 typecheck
pnpm --filter @ai-code/sdk typecheck
pnpm --filter @ai-code/shared-types typecheck
pnpm validate:contracts
pnpm validate:native-shells
pnpm validate:db-migrations
xcodebuild -project apps/ios/AIEngineeringCode.xcodeproj -scheme AIEngineeringCode -configuration Debug -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build
node -e "JSON.parse(require('fs').readFileSync('docs/postman/ai-code-backend.postman_collection.json','utf8')); JSON.parse(require('fs').readFileSync('docs/postman/ai-code-backend.postman_environment.json','utf8')); console.log('postman json ok')"
```

结果：附件 intake 后端测试通过；后端全量测试 `104 passed`；关键后端测试通过；ruff、mypy、H5/SDK/shared-types typecheck、契约校验、原生壳静态校验、migration 校验、iOS Debug 模拟器构建和 Postman JSON 解析均通过。真实照片 / 文件选择后的 H5 展示和后端 intake 仍需在模拟器或真机上手动运行验证。

附件票据金额追问闭环在 2026-05-27 通过：

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_context_assembler.py::test_context_assembler_includes_domain_summaries_and_tool_catalog -q
PATH=.venv/bin:$PATH pytest python/backend/tests/test_agent_turns.py::test_agent_turn_clarifies_attachment_receipt_amount_then_resolves -q
PATH=.venv/bin:$PATH pytest python/backend/tests/test_context_assembler.py python/backend/tests/test_agent_turns.py::test_agent_turn_clarifies_attachment_receipt_amount_then_resolves -q
PATH=.venv/bin:$PATH pytest python/backend/tests -q
PATH=.venv/bin:$PATH ruff check python
PATH=.venv/bin:$PATH mypy python
pnpm --filter @ai-code/h5 typecheck
pnpm --filter @ai-code/sdk typecheck
pnpm --filter @ai-code/shared-types typecheck
pnpm validate:contracts
pnpm validate:db-migrations
pnpm validate:context-sync
pnpm validate:factory
node -e "JSON.parse(require('fs').readFileSync('docs/postman/ai-code-backend.postman_collection.json','utf8')); JSON.parse(require('fs').readFileSync('docs/postman/ai-code-backend.postman_environment.json','utf8')); console.log('postman json ok')"
git diff --check
```

结果：新增测试先红后绿；附件摘要能进入 ContextPack；附件 intake 后的“作为费用票据处理”会追问金额，补金额后生成费用草稿确认计划并保留附件 ID；后端全量测试 `105 passed`，ruff、mypy、H5/SDK/shared-types typecheck、契约、migration、上下文同步、工厂校验、Postman JSON 解析和 diff 空白检查均通过。

附件票据可读文本金额提取在 2026-05-28 通过：

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_attachments.py::test_attachment_summary_includes_sanitized_readable_text python/backend/tests/test_agent_turns.py::test_agent_turn_creates_attachment_receipt_expense_when_text_has_amount python/backend/tests/test_agent_turns.py::test_agent_turn_clarifies_attachment_receipt_amount_then_resolves -q
PATH=.venv/bin:$PATH pytest python/backend/tests -q
PATH=.venv/bin:$PATH ruff check python
PATH=.venv/bin:$PATH mypy python
pnpm --filter @ai-code/h5 typecheck
pnpm --filter @ai-code/sdk typecheck
pnpm --filter @ai-code/shared-types typecheck
pnpm validate:contracts
pnpm validate:factory
pnpm validate:native-shells
pnpm validate:db-migrations
node -e "JSON.parse(require('fs').readFileSync('docs/postman/ai-code-backend.postman_collection.json','utf8')); JSON.parse(require('fs').readFileSync('docs/postman/ai-code-backend.postman_environment.json','utf8')); console.log('postman json ok')"
git diff --check
```

结果：红灯验证先证明附件 `text` 已包含“出租车发票 合计 88.5 元 日期 2026-05-20”时，后端仍追问金额；补齐附件摘要文本和规则规划提取后，含金额文本直接生成费用草稿确认卡，无金额附件仍保持金额追问；补充验证覆盖有金额但无日期时用客户端当前日期作为 `occurred_on`。后端全量测试 `151 passed`；ruff、mypy、H5/SDK/shared-types typecheck、契约、工厂、原生壳、migration、Postman JSON 解析和 diff 空白检查均通过。当前仍不上传二进制，也不做真实 OCR；该能力消费 Native 或后续 OCR 已经提供的可读文本。

附件资源查询与对话回看闭环在 2026-05-28 通过：

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_attachments.py -q
pnpm --filter @ai-code/h5 typecheck
pnpm --filter @ai-code/sdk typecheck
pnpm validate:contracts
node -e "JSON.parse(require('fs').readFileSync('docs/postman/ai-code-backend.postman_collection.json','utf8')); console.log('postman json ok')"
```

结果：新增 `GET /attachments` 后端测试先红后绿；H5 契约测试先因缺少 `getAttachments()` 和 `attachmentIntakesToBackendElements()` 失败，补齐后通过。当前 H5 不把附件放入 Timeline，而是在对话流里维护“本轮附件资源”摘要卡。

附件内容上传后端闭环在 2026-05-28 通过：

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_attachments.py -q
PATH=.venv/bin:$PATH ruff check python/backend/backend/app/domains/attachment python/backend/backend/app/routes/attachment.py python/backend/tests/test_attachments.py
PATH=.venv/bin:$PATH mypy python/backend/backend/app/domains/attachment python/backend/backend/app/routes/attachment.py python/backend/tests/test_attachments.py
pnpm --filter @ai-code/sdk typecheck
pnpm --filter @ai-code/shared-types typecheck
pnpm --filter @ai-code/h5 typecheck
```

结果：红灯验证先证明 `POST /attachments/upload` 为 404；补齐后，接口能接收 `base64Content`，计算 `contentSha256`，对 `text/plain` 附件抽取 UTF-8 文本，并通过 `GET /attachments` 读回同一会话附件。OpenAPI、SDK、shared-types 和 Postman 已同步该接口。当前只保存内容哈希、内容状态和可读文本，不保存原始二进制，也不绕过确认流程创建费用、日程或提醒。

H5 Agent 调试信息可视化在 2026-05-28 通过：

```bash
pnpm --filter @ai-code/h5 typecheck
pnpm --filter @ai-code/sdk typecheck
```

结果：H5 契约测试先因缺少 SDK debug 类型导出、`getAgentConversationDebug()` 和 `agentDebugToBackendElements()` 失败；补齐后，设置页可展示当前会话 planner mode、fallback、工具选择、缺失字段、打开的追问和事件数量。默认 UI 不展示完整 prompt 或 LLM response。

附件日程材料追问闭环在 2026-05-28 通过：

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_agent_turns.py::test_agent_turn_clarifies_attachment_calendar_material_then_resolves -q
```

结果：新增端到端测试先因返回 `assistant_message` 失败；补齐规则 planner 后，附件快捷回复“作为日程材料处理”会追问日程时间，补“明天上午10点”后生成日程确认计划，并在 action payload 中保留 `attachment_id` 和 `attachment_name`。

费用草稿提交 / 取消可点击闭环在 2026-05-28 通过：

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_agent_turns.py::test_expense_status_endpoints_submit_and_cancel_expense_drafts -q
PATH=.venv/bin:$PATH pytest python/backend/tests -q
PATH=.venv/bin:$PATH ruff check python
PATH=.venv/bin:$PATH mypy python
pnpm --filter @ai-code/h5 typecheck
pnpm --filter @ai-code/sdk typecheck
pnpm --filter @ai-code/shared-types typecheck
pnpm validate:contracts
pnpm validate:context-sync
pnpm validate:factory
node -e "JSON.parse(require('fs').readFileSync('docs/postman/ai-code-backend.postman_collection.json','utf8')); JSON.parse(require('fs').readFileSync('docs/postman/ai-code-backend.postman_environment.json','utf8')); console.log('postman json ok')"
git diff --check
```

结果：费用状态接口测试先红后绿；后端全量测试 `106 passed`；费用草稿确认写入后可通过 `/expenses/{id}/submit` 标记为 `submitted`，也可通过 `/expenses/{id}/cancel` 标记为 `canceled`；H5 费用列表会给 draft 草稿展示提交 / 取消动作，Postman 可自动提取 `expenseId` 继续测试状态接口。

日程取消可点击闭环在 2026-05-28 通过：

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_agent_turns.py::test_calendar_event_cancel_endpoint_cancels_scheduled_event -q
PATH=.venv/bin:$PATH pytest python/backend/tests -q
PATH=.venv/bin:$PATH ruff check python
PATH=.venv/bin:$PATH mypy python
pnpm --filter @ai-code/h5 typecheck
pnpm --filter @ai-code/sdk typecheck
pnpm --filter @ai-code/shared-types typecheck
pnpm validate:contracts
node -e "JSON.parse(require('fs').readFileSync('docs/postman/ai-code-backend.postman_collection.json','utf8')); JSON.parse(require('fs').readFileSync('docs/postman/ai-code-backend.postman_environment.json','utf8')); console.log('postman json ok')"
```

结果：日程取消接口测试先红后绿；后端全量测试 `107 passed`；已确认日程可通过 `/calendar/events/{id}/cancel` 标记为 `canceled`；H5 日程列表会给 scheduled 日程展示取消动作，Postman 可自动提取 `calendarEventId` 继续测试状态接口。

Timeline 行内动作闭环在 2026-05-28 通过：

```bash
pnpm --filter @ai-code/h5 typecheck
pnpm validate:contracts
pnpm validate:context-sync
pnpm validate:factory
git diff --check
```

结果：Timeline 的聚合列表 action 支持 `targetId`；日程、费用、提醒条目能在 Timeline 中直接触发各自领域的后端状态接口；H5 类型契约覆盖 `targetId`，避免把 `timeline-*` 展示 ID 误发给后端。

事项内容编辑闭环在 2026-05-28 通过：

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_agent_turns.py::test_calendar_event_update_endpoint_updates_editable_fields python/backend/tests/test_agent_turns.py::test_expense_update_endpoint_updates_editable_fields python/backend/tests/test_agent_turns.py::test_reminder_update_endpoint_updates_editable_fields -q
PATH=.venv/bin:$PATH pytest python/backend/tests -q
PATH=.venv/bin:$PATH ruff check python
PATH=.venv/bin:$PATH mypy python
pnpm --filter @ai-code/h5 typecheck
pnpm --filter @ai-code/sdk typecheck
pnpm --filter @ai-code/shared-types typecheck
pnpm validate:contracts
node -e "JSON.parse(require('fs').readFileSync('docs/postman/ai-code-backend.postman_collection.json','utf8')); JSON.parse(require('fs').readFileSync('docs/postman/ai-code-backend.postman_environment.json','utf8')); console.log('postman json ok')"
```

结果：三个编辑接口测试先红后绿；后端全量测试 `110 passed`；日程、费用、提醒可通过资源 `PATCH` 修改业务内容字段，H5 领域页和 Timeline 都能直接触发编辑动作。

H5 应用内编辑面板在 2026-05-28 通过：

```bash
pnpm validate:h5-runtime
pnpm --filter @ai-code/h5 typecheck
```

结果：新增运行时红灯先捕获 `window.prompt` 和缺少 `SummaryEditPanel`；实现应用内编辑面板后，运行时校验和 H5 类型检查均通过。H5 编辑不再依赖浏览器 prompt。

编辑输入校验与终态保护在 2026-05-28 通过：

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_agent_turns.py -q -k 'update_rejects or update_endpoint_updates_editable_fields'
PATH=.venv/bin:$PATH pytest python/backend/tests/test_postgres_repositories.py -q -k terminal_item_updates
PATH=.venv/bin:$PATH pytest python/backend/tests -q
PATH=.venv/bin:$PATH ruff check python
PATH=.venv/bin:$PATH mypy python
```

结果：新增 8 个接口拒绝用例先红后绿，编辑成功与拒绝用例 `11 passed`；Postgres repository 终态保护测试通过；后端全量测试 `119 passed`；ruff 和 mypy 均通过。编辑接口现在会拒绝完整或部分更新时间造成的时间倒挂、无效日期 / 时间、负金额、非数值金额，以及已取消日程、已提交费用、已完成提醒等终态事项的内容修改。

状态流转保护在 2026-05-28 通过：

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_agent_turns.py -q -k 'cancel_rejects_canceled_event or status_endpoints_reject_terminal'
PATH=.venv/bin:$PATH pytest python/backend/tests/test_postgres_repositories.py -q -k terminal_item_updates
PATH=.venv/bin:$PATH pytest python/backend/tests -q
PATH=.venv/bin:$PATH ruff check python
PATH=.venv/bin:$PATH mypy python
```

结果：新增 3 个状态接口拒绝用例先红后绿，目标用例 `3 passed`；Postgres repository 非法状态流转保护测试通过；后端全量测试 `122 passed`；ruff 和 mypy 均通过。状态接口现在拒绝日程重复取消、费用提交后取消 / 取消后提交、提醒完成后取消 / 取消后完成等终态反向改写。

审阅后补充状态动作 missing ID 回归在 2026-05-28 通过：

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_agent_turns.py -q -k 'return_not_found_for_missing or cancel_returns_not_found'
PATH=.venv/bin:$PATH pytest python/backend/tests -q
PATH=.venv/bin:$PATH ruff check python
PATH=.venv/bin:$PATH mypy python
```

结果：状态动作 missing ID 用例 `3 passed`，后端全量测试 `125 passed`；ruff 和 mypy 均通过。状态动作保持非法流转返回 `400`，不存在事项返回 `404`。

iOS 系统日历取消清理闭环在 2026-05-28 通过：

```bash
pnpm validate:native-shells
pnpm --filter @ai-code/h5 typecheck
xcodebuild -project apps/ios/AIEngineeringCode.xcodeproj -scheme AIEngineeringCode -destination 'generic/platform=iOS Simulator' build CODE_SIGNING_ALLOWED=NO
```

结果：新增 Native 校验先红后绿；H5 日程同步不再过滤 scheduled 并携带 `status`；iOS 对非 scheduled 日程执行删除，使用 `UserDefaults` 中的 `EKEvent.eventIdentifier` 优先清理，并以过去 1 年到未来 3 年宽窗口 marker 搜索兜底；H5 typecheck 和 iOS Simulator build 均通过。

iOS 键盘 Bridge 与假入口清理在 2026-05-28 通过：

```bash
pnpm validate:native-shells
pnpm --filter @ai-code/h5 typecheck
xcodebuild -project apps/ios/AIEngineeringCode.xcodeproj -scheme AIEngineeringCode -destination 'generic/platform=iOS Simulator' build CODE_SIGNING_ALLOWED=NO
```

结果：新增 Native 校验先红后绿；H5 设置页新增 `input.keyboard.open` 入口；iOS WebView 将该消息转为 `onKeyboardInputRequested`，Native Shell 切到底部文本输入并通过 `@FocusState` 聚焦输入框；Native 日历摘要不再包含空 `Button {}` 或误导性 chevron。H5 typecheck、Native shell validation 和 iOS Simulator build 均通过。

会话历史恢复 API 在 2026-05-28 通过：

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_agent_turns.py::test_agent_conversation_turns_return_recorded_user_and_assistant_messages python/backend/tests/test_postgres_repositories.py::test_agent_execution_flow_persists_to_postgres -q
pnpm --filter @ai-code/shared-types typecheck
pnpm --filter @ai-code/sdk typecheck
pnpm --filter @ai-code/h5 typecheck
pnpm validate:contracts
node -e "JSON.parse(require('fs').readFileSync('docs/postman/ai-code-backend.postman_collection.json','utf8')); console.log('postman json ok')"
```

结果：后端新增端到端测试先因 `/turns` 返回 `404` 失败；补齐 store 读取和路由后，in-memory / Postgres 读回测试通过。SDK、shared-types、H5 typecheck、OpenAPI 契约校验和 Postman JSON 解析均通过。H5 恢复历史时使用稳定元素 ID，并避免把 redacted 历史确认卡恢复成可点击动作。

会话范围业务读模型在 2026-05-28 通过：

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_agent_turns.py::test_domain_lists_can_be_scoped_to_conversation python/backend/tests/test_agent_turns.py::test_confirmation_executes_multi_action_plan -q
PATH=.venv/bin:$PATH pytest python/backend/tests/test_postgres_repositories.py::test_agent_execution_flow_persists_to_postgres python/backend/tests/test_postgres_repositories.py::test_expense_execution_flow_persists_to_postgres python/backend/tests/test_postgres_repositories.py::test_reminder_execution_flow_persists_to_postgres -q
PATH=.venv/bin:$PATH ruff check python/backend/backend/app/services/execution_store.py python/backend/backend/app/services/postgres_execution_store.py python/backend/backend/app/domains/calendar python/backend/backend/app/domains/expense python/backend/backend/app/domains/reminder python/backend/backend/app/routes/calendar.py python/backend/backend/app/routes/expense.py python/backend/backend/app/routes/reminder.py python/backend/backend/app/routes/execution.py python/backend/tests/test_agent_turns.py
node -e "JSON.parse(require('fs').readFileSync('docs/postman/ai-code-backend.postman_collection.json','utf8')); console.log('postman json ok')"
```

结果：红灯测试先证明两个不同会话确认后的领域列表会串数据；补齐 `conversationId` query、execution store action id 查询和三领域 sourceActionId 过滤后通过。Postgres 集成测试验证了按会话 action id、按会话 execution ledger 和三领域过滤路径。

会话范围 Agent 上下文摘要在 2026-05-28 通过：

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_postgres_repositories.py::test_postgres_domain_context_providers_are_scoped_to_conversation -q
```

结果：红灯测试先证明 Postgres expense summary provider 会把另一个 conversation 的 `99` 元费用带进目标会话上下文；补齐三领域 provider 的 `execution_plans.conversation_id` join 过滤后通过。摘要现在包含 `id` 和 `source_action_id`，用于后续自然语言管理已有事项时定位候选事实。

自然语言管理已有事项 v1 在 2026-05-28 通过：

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests -q
PATH=.venv/bin:$PATH ruff check python
PATH=.venv/bin:$PATH mypy python
pnpm --filter @ai-code/shared-types typecheck
pnpm --filter @ai-code/sdk typecheck
pnpm --filter @ai-code/h5 typecheck
pnpm validate:contracts
pnpm validate:h5-runtime
pnpm validate:native-shells
pnpm validate:factory
node -e "JSON.parse(require('fs').readFileSync('docs/postman/ai-code-backend.postman_collection.json','utf8')); JSON.parse(require('fs').readFileSync('docs/postman/ai-code-backend.postman_environment.json','utf8')); console.log('postman json ok')"
git diff --check
```

结果：后端 `140 passed`；8 个自然语言管理动作先红后绿；取消 / 完成 / 修改刚才的提醒、提交 / 取消 / 修改刚才的费用、取消 / 修改明天的会议都先生成带 `target_id` 的确认卡，确认后才改写业务事实。ToolCatalog、PolicyEngine、ExecutionRunner 专项测试通过；OpenAPI、shared-types、H5 契约、Postman collection 和 H5 runtime 均已覆盖 8 个管理动作；ruff、mypy、前端 typecheck、Native shell、factory/context sync 和 diff 检查通过。

自然语言只读查询 v1 在 2026-05-28 通过：

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_agent_turns.py::test_agent_turn_can_query_tomorrow_schedule_from_conversation_context python/backend/tests/test_agent_turns.py::test_agent_turn_can_query_expenses_from_conversation_context python/backend/tests/test_rule_based_planning_engine.py::test_rule_based_planner_answers_schedule_query_from_context -q
PATH=.venv/bin:$PATH ruff check python/agent-runtime/agent_runtime/planning/rule_based.py python/agent-runtime/agent_runtime/planning/prompts.py python/backend/tests/test_agent_turns.py python/backend/tests/test_rule_based_planning_engine.py
PATH=.venv/bin:$PATH mypy python
```

结果：红灯验证先证明同会话已有日程、提醒、费用后，询问“明天我有什么安排？”和“我有哪些费用？”仍只返回通用闲聊兜底；补齐规则查询分支后通过。后续补充验证保证“明天有什么提醒？”不会混入日程，“明天有什么日程？”不会混入提醒，“昨天有哪些费用？”会按 `occurred_on` 过滤。当前查询返回 `assistant_message` 文本和 `summary-list` 结构化元素，不创建执行计划、不要求确认、不写业务事实；H5 会把结构化元素渲染成对话里的查询结果列表。

待确认卡恢复闭环在 2026-05-28 通过：

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_agent_turns.py::test_agent_pending_confirmations_issue_recovery_token_for_conversation python/backend/tests/test_postgres_repositories.py::test_pending_confirmation_recovery_token_persists_to_postgres -q
pnpm --filter @ai-code/h5 typecheck
pnpm --filter @ai-code/sdk typecheck
pnpm --filter @ai-code/shared-types typecheck
pnpm validate:contracts
```

结果：红灯验证先证明 `GET /agent/conversations/{conversationId}/pending-confirmations` 不存在；补齐后端接口、in-memory / Postgres token 签发、`confirmation_token_sessions` migration、SDK/shared-types、H5 恢复合并和 Postman/OpenAPI 后通过。当前实现不改变后端 token 安全边界：历史 turn 和普通 plan 读取仍只返回 `redacted`；恢复确认必须通过 pending-confirmations 接口签发短期 token。

现场链路验证曾通过：

```text
POST /agent/turns -> 200
POST /execution-plans/{id}/confirm -> 200
重复 POST /confirm -> 200
Postgres: calendar_events=1, execution_ledger=3
```

LLM/DeepSeek 对话路由 prompt 合约在 2026-05-28 通过：

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_llm_prompt_contract.py python/backend/tests/test_llm_planning_engine.py python/backend/tests/test_orchestrator_planner.py::test_planner_handles_llm_chat_without_creating_plan python/backend/tests/test_orchestrator_planner.py::test_planner_saves_llm_clarification_pending_item python/backend/tests/test_orchestrator_planner.py::test_planner_blocks_llm_unknown_action_before_confirmation -q
```

结果：红灯验证先证明 system prompt 缺少固定 few-shot 和工具安全边界声明；补齐后，prompt 合约覆盖闲聊不出 action、缺时间日程追问、只读查询基于 summary 回答、mixed 自然回复 + 候选动作，以及“只能使用 `tool_catalog` action type / 不能声称已执行 / 写入动作必须等待确认”的安全边界。补充的 LLM 安全回归还覆盖：`response_type=chat` 即使携带 actions 也只按消息处理；LLM clarification 会保存 open pending item；LLM 返回未知 action 会被 Policy 拦截为安全追问且不会生成 execution plan 或 ledger；DeepSeek 空 choices / 空 content 会清晰报错。该验证不调用真实 DeepSeek API，但会保护多 provider 共用的 system prompt 和后端安全边界。

补充全量验证：后端测试 `160 passed`；ruff、mypy、H5/SDK/shared-types typecheck、契约、工厂、原生壳、migration、Postman JSON 解析和 diff 空白检查均通过。

LLM 只读查询结构化组件输出在 2026-05-28 通过：

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_llm_planning_engine.py::test_llm_planning_engine_returns_chat_structured_elements python/backend/tests/test_llm_prompt_contract.py::test_llm_system_prompt_contains_conversation_routing_examples python/backend/tests/test_orchestrator_planner.py::test_planner_returns_llm_chat_structured_elements_without_creating_plan -q
```

结果：红灯验证先证明 LLM chat payload 中的 `structured_elements` 被丢弃，prompt 也没有该字段示例；补齐后，LLM 可在只读查询里返回 `summary-list`，后端会把它映射到 `structuredElements` 响应给 H5，且不会创建 execution plan 或 ledger。

Policy 工具 schema 必填字段校验在 2026-05-28 通过：

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_policy_engine.py python/backend/tests/test_orchestrator_planner.py::test_planner_clarifies_llm_action_missing_required_payload_fields -q
```

结果：红灯验证先证明缺少 `start_at/end_at` 的 `calendar.create_event` 仍会被放进确认流程；补齐后，Policy 会合并 LLM 显式 `missing_fields` 和 ToolCatalog required payload 缺口，返回 `clarification_request`，并保证不创建 execution plan 或 ledger。全量回归还暴露并修复了两个正常路径：`今天 99 元午餐报销` 会写入今天日期，附件票据金额追问补“58 元”时如果 pending payload 缺日期，会使用补金额当日作为 `occurred_on`。

Policy 工具 schema 字段类型校验在 2026-05-28 通过：

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_policy_engine.py python/backend/tests/test_tool_catalog.py python/backend/tests/test_orchestrator_planner.py::test_planner_clarifies_llm_action_invalid_payload_field_types python/backend/tests/test_llm_prompt_contract.py::test_llm_system_prompt_keeps_action_safety_boundary -q
```

结果：红灯验证先证明 `amount: "58"` 这类 LLM 坏 payload 仍会进入确认流程，ToolCatalog 也没有 `properties` 类型声明，prompt 没提醒 JSON 类型约束；补齐后，Policy 会按 ToolCatalog 的轻量 `properties.{field}.type` 拦截明显类型错误，覆盖 `amount` 字符串、`amount` 布尔值和 update `patch` 非 object，并把错误转成追问，不创建 execution plan 或 ledger。该校验不启用 `additionalProperties: false`，因此不会误伤附件 `attachment_id` / `attachment_name` 或管理动作里的 `target_kind`、`resolution_reason` 等元数据。

LLM 工具目录 schema 注入在 2026-05-28 通过：

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_context_assembler.py::test_builtin_tool_catalog_provider_exposes_payload_contracts python/backend/tests/test_llm_prompt_contract.py::test_render_planning_prompt_exposes_tool_payload_contracts -q
```

结果：红灯验证先证明 `BuiltInToolCatalogProvider` 只返回 `action_type`，LLM prompt 虽能承载工具合约，但真实 ContextPack 里没有 `required` / `properties`；补齐后，provider 为每个工具输出一行 JSON 合约，包含 action、domain、description、required、properties、confirmation_required 和 risk_level。补充红绿验证还确保 `DecisionTrace.tools_considered` 不暴露整段 JSON，而是从合约里归一回 action type，保持调试 API 语义稳定。局部回归覆盖 context assembler、LLM prompt、planner trace 和 agent events。

ContextRedactor 工具目录保留边界在 2026-05-28 通过：

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_context_assembler.py::test_context_redactor_keeps_full_tool_catalog_contracts python/backend/tests/test_context_assembler.py::test_context_redactor_trims_large_sections -q
```

结果：红灯验证先证明 `ContextRedactor(max_items_per_section=1)` 会把 3 条工具合约裁到只剩最后 1 条；补齐后，普通上下文仍会被裁剪，但 `tool_catalog` 完整保留且不会追加 `tool_catalog:trimmed_to_*` redaction。这样后续新增工具后，LLM 仍能看到完整工具合约。

update patch 内层字段类型校验在 2026-05-28 通过：

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_context_assembler.py::test_builtin_tool_catalog_provider_exposes_payload_contracts python/backend/tests/test_orchestrator_planner.py::test_planner_clarifies_llm_update_action_invalid_patch_field_types python/backend/tests/test_policy_engine.py::test_policy_rejects_invalid_update_patch_field_types python/backend/tests/test_tool_catalog.py::test_builtin_tool_catalog_exposes_create_and_manage_tools -q
```

结果：红灯验证先证明 LLM 返回 `expense.update_reimbursement` 且 `patch.amount` 是字符串时仍会进入确认流程；补齐后，ToolCatalog 的 update 工具在 `patch.properties` 中声明内层字段类型，Policy 会递归校验对象字段，并把 `patch.amount` 类型错误转成追问，不生成 execution plan 或 ledger。

非执行路径 DecisionTrace 与 pending 补全增强在 2026-05-28 通过：

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_agent_turns.py::test_agent_debug_returns_pending_clarifications python/backend/tests/test_agent_turns.py::test_agent_debug_returns_decision_trace_for_chat_response -q
PATH=.venv/bin:$PATH pytest python/backend/tests/test_orchestrator_planner.py::test_planner_resolves_llm_chinese_tomorrow_date_hint python/backend/tests/test_orchestrator_planner.py::test_planner_resolves_pending_reminder_time -q
PATH=.venv/bin:$PATH pytest python/backend/tests/test_agent_turns.py python/backend/tests/test_orchestrator_planner.py python/backend/tests/test_pending_clarifications.py -q
```

结果：红灯验证先证明 `chat` 和纯 `clarification` 路径有 event `traceId` 但 debug 里没有可读 `DecisionTrace`；补齐后，闲聊、追问和无候选动作都会写入 trace，debug API 能看到 planner mode、工具目录、缺失字段和 policy notes。另一个红灯验证证明 LLM 返回中文 `partial_payload.date_hint="明天"` 时，用户补“十点”会被错误落到今天；补齐后 pending 日程支持中文/英文日期 hint，提醒 pending 也可以把“明天提醒我喝水”后的“十点”补全为提醒确认卡。

管理目标确认前 guard 在 2026-05-28 通过：

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_policy_engine.py::test_management_target_validator_rejects_unknown_target_id python/backend/tests/test_policy_engine.py::test_management_target_validator_rejects_stale_expected_status python/backend/tests/test_policy_engine.py::test_management_target_validator_allows_matching_target python/backend/tests/test_orchestrator_planner.py::test_planner_blocks_llm_target_outside_current_conversation python/backend/tests/test_orchestrator_planner.py::test_planner_blocks_llm_target_when_expected_status_is_stale -q
PATH=.venv/bin:$PATH pytest python/backend/tests/test_policy_engine.py python/backend/tests/test_orchestrator_planner.py python/backend/tests/test_tool_catalog.py -q
```

结果：红灯验证先证明 LLM 返回不在当前会话摘要里的 `target_id` 或 `expected_status` 已过期时，后端仍会生成确认卡；补齐后，`ManagementTargetValidator` 会按当前 `calendar_summary`、`expense_summary`、`reminder_summary` 做确认前校验。跨会话目标返回“我找不到当前会话中可操作的目标事项”，状态过期返回“目标事项状态已变化，请重新选择”，两者都不会创建 pending plan 或 ledger。ToolCatalog 回归还固定 8 个管理工具的 `target_id` / `expected_status` 必填契约。

SummaryMemory 执行事实生命周期在 2026-05-28 通过：

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_summary_memory.py::test_summary_memory_provider_returns_conversation_summaries python/backend/tests/test_summary_memory.py::test_in_memory_runtime_writes_summary_memory_into_next_context python/backend/tests/test_orchestrator_planner.py::test_executor_writes_summary_memory_for_succeeded_action -q
PATH=.venv/bin:$PATH ruff check python/agent-runtime/agent_runtime/memory/summary_memory.py python/orchestrator/orchestrator/executor.py python/backend/backend/app/bootstrap.py python/backend/backend/app/infrastructure/domain_context_providers.py python/backend/tests/test_summary_memory.py python/backend/tests/test_orchestrator_planner.py
PATH=.venv/bin:$PATH pytest python/backend/tests/test_summary_memory.py::test_postgres_runtime_writes_summary_memory_into_next_context python/backend/tests/test_orchestrator_planner.py::test_executor_writes_summary_memory_for_succeeded_action -q
```

结果：红灯验证先证明 in-memory runtime 没有可注入的 `SummaryMemoryProvider`，确认成功后的事实不能进入下一轮 `ContextPack.relevant_history`；补齐后，确认“明天上午九点提醒我带电脑”会写入 `创建提醒：带电脑；状态 scheduled` 的 `domain_fact` 记忆，并在下一轮上下文中可见。Postgres runtime 继续使用已有 `PostgresSummaryMemoryProvider`，执行写入则统一由 `ExecutionCoordinator` 接入 `SummaryMemoryRepository`。补充审计后，in-memory 与 Postgres provider 都只读取 `domain_fact`，且 `psycopg` 的跳过范围已下沉到 Postgres 专属测试，避免轻量环境漏跑 in-memory 记忆生命周期测试。后续红灯验证还固定了 `factId`、`factTitle`、`factStatus` 顶层 payload；Postgres runtime 端到端测试已覆盖 `create_runtime(settings)` 提交、确认、写表和下一轮上下文注入。最新补充验证固定 SummaryMemory 写入失败隔离：如果派生记忆 repository 抛错，确认接口仍返回 `execution_result`，plan/action 保持 `succeeded`，领域提醒已经写入，ledger 仍是 `action_executed/succeeded`，同时 `uvicorn.error` warning 日志包含 `conversation_id`、`plan_id`、`action_id` 和 `action_type`。

直接 UI 行内动作审计闭环在 2026-05-28 通过：

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_agent_turns.py::test_direct_reminder_action_writes_scoped_execution_ledger python/backend/tests/test_agent_turns.py::test_direct_action_rejects_target_from_another_conversation -q
PATH=.venv/bin:$PATH pytest python/backend/tests/test_agent_turns.py::test_direct_calendar_action_writes_scoped_execution_ledger python/backend/tests/test_agent_turns.py::test_direct_expense_actions_write_scoped_execution_ledger python/backend/tests/test_agent_turns.py::test_direct_edit_actions_write_scoped_execution_ledger -q
PATH=.venv/bin:$PATH pytest python/backend/tests/test_summary_memory.py::test_direct_action_auditor_writes_domain_fact_summary_memory -q
PATH=.venv/bin:$PATH pytest python/backend/tests/test_postgres_repositories.py::test_direct_action_audit_persists_to_postgres_runtime -q
PATH=.venv/bin:$PATH pytest python/backend/tests -q
PATH=.venv/bin:$PATH ruff check python
PATH=.venv/bin:$PATH mypy python
pnpm --filter @ai-code/h5 typecheck && pnpm --filter @ai-code/sdk typecheck && pnpm --filter @ai-code/shared-types typecheck
pnpm validate:contracts
pnpm validate:db-migrations
pnpm validate:factory
node -e "JSON.parse(require('fs').readFileSync('docs/postman/ai-code-backend.postman_collection.json','utf8')); JSON.parse(require('fs').readFileSync('docs/postman/ai-code-backend.postman_environment.json','utf8')); console.log('postman json ok')"
```

结果：红灯验证先证明直接完成提醒不会写入当前会话 execution ledger；补齐后，H5/SDK 会把当前 `conversationId` 带给直接领域动作，后端成功写入 `direct_action_executed/succeeded` 且带 `actionId`。后续覆盖扩展到日程取消、费用提交 / 取消、日程 / 费用 / 提醒编辑，都会生成对应 direct action plan，action type 分别保持 `calendar.cancel_event`、`expense.submit_reimbursement`、`expense.cancel_reimbursement`、`calendar.update_event`、`expense.update_reimbursement`、`reminder.update_reminder`。另一个红灯验证证明跨会话 direct action 会误改别的会话提醒；补齐后，路由在执行领域状态变更前读取目标事实并校验其 `sourceActionId` 归属当前会话，跨会话目标返回 404，不改状态、不写 direct ledger。SummaryMemory 单测固定 direct action 会写入 `完成提醒：带电脑；状态 done` 的 `domain_fact` 记忆。Postgres runtime 测试固定 `direct_plan_*`、`direct_action_*`、`direct_action_executed` ledger 和 `summary_memories` 均能真实落库。最新后端全量结果为 `197 passed`。

产品级 live smoke 在 2026-05-28 通过：

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_product_smoke_script.py -q
pnpm validate:product-smoke
PATH=.venv/bin:$PATH ruff check scripts/validate_product_smoke.py python/backend/tests/test_product_smoke_script.py
AI_CODE_API_BASE_URL=http://127.0.0.1:8012 pnpm validate:product-smoke:live
```

结果：红灯验证先证明 `scripts/validate_product_smoke.py` 不支持 `build_smoke_client(live=True)` 和 CLI `--live`；补齐后，脚本可在默认 TestClient / in-memory 模式与 live HTTP 模式之间切换。已临时启动 `uvicorn` 到 `127.0.0.1:8012`，用 `AI_CODE_API_BASE_URL=http://127.0.0.1:8012 pnpm validate:product-smoke:live` 实跑通过真实 HTTP 路径，随后关闭临时服务。`pnpm validate:product-smoke:live` 不在离线验证中自动运行，需要先启动 `pnpm dev:api` 或 `pnpm dev:full`，默认连接 `http://127.0.0.1:8000`，可用 `AI_CODE_API_BASE_URL` 覆盖。

产品级 smoke 附件资源覆盖在 2026-05-28 通过：

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_product_smoke_script.py -q
pnpm validate:product-smoke
PATH=.venv/bin:$PATH ruff check scripts/validate_product_smoke.py python/backend/tests/test_product_smoke_script.py
AI_CODE_API_BASE_URL=http://127.0.0.1:8013 pnpm validate:product-smoke:live
```

结果：新增测试先证明 `validate_attachment_smoke()` 不存在；补齐后，smoke 会用独立附件会话覆盖 `POST /attachments/upload`、`POST /attachments/intake` 和 `GET /attachments`。第一次把附件 smoke 放在主 Agent 会话开头时，后续普通费用句子被最近的无金额 `receipt.jpg` 附件上下文影响，返回“receipt.jpg 报销需要补充金额”；定位后改为 `conversationId + "_attachments"` 独立会话，既验证附件资源入口，又不污染日程 / 费用 / 提醒主路径。已临时启动 `uvicorn` 到 `127.0.0.1:8013`，用 live smoke 实跑通过附件 HTTP 路径，随后关闭临时服务。

live smoke 不可达错误提示在 2026-05-28 通过：

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_product_smoke_script.py -q
PATH=.venv/bin:$PATH ruff check scripts/validate_product_smoke.py python/backend/tests/test_product_smoke_script.py
```

结果：新增测试先证明 `--live` 模式下 `httpx.ConnectError` 会直接冒出；补齐后，CLI 会以退出码 1 输出“无法连接运行中的后端 API”、当前 base URL、`pnpm dev:api` / `pnpm dev:full` 和 `AI_CODE_API_BASE_URL` 覆盖建议。非 live 模式仍保留原异常行为，避免隐藏 in-memory 验证中的真实代码问题。

产品级 smoke 待确认卡恢复确认在 2026-05-28 通过：

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_product_smoke_script.py -q
pnpm validate:product-smoke
AI_CODE_API_BASE_URL=http://127.0.0.1:8014 pnpm validate:product-smoke:live
```

结果：新增测试先证明 `validate_pending_confirmation_recovery_smoke()` 不存在；补齐后，smoke 会用 `conversationId + "_pending_recovery"` 独立会话创建待确认提醒计划，通过 `GET /agent/conversations/{conversationId}/pending-confirmations` 获取新的恢复 token，再用该 token 调 `POST /execution-plans/{planId}/confirm`。验证会断言恢复 token 非 `redacted`、以 `confirm_` 开头且不同于原始 token，确认结果为 `execution_result/succeeded`，confirmation 变为 `confirmed`，action 变为 `succeeded`，确认后 pending 列表清空。`pnpm validate:product-smoke` 已通过，说明 TestClient / in-memory 产品路径包含刷新或重启后确认卡恢复执行能力。已临时启动 `uvicorn` 到 `127.0.0.1:8014`，用 live smoke 实跑通过 `_pending_recovery` HTTP 路径，随后关闭临时服务。

产品级 smoke 会话历史恢复在 2026-05-28 通过：

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_product_smoke_script.py -q
pnpm validate:product-smoke
PATH=.venv/bin:$PATH ruff check scripts/validate_product_smoke.py python/backend/tests/test_product_smoke_script.py
AI_CODE_API_BASE_URL=http://127.0.0.1:8015 pnpm validate:product-smoke:live
```

结果：新增测试先证明 `validate_conversation_history_recovery_smoke()` 不存在；补齐后，主产品 smoke 会调用 `GET /agent/conversations/{conversationId}/turns?limit=50`，断言历史里能恢复用户输入“明天上午我要去开会”“十点”“明天我有什么安排？”，assistant structured response 覆盖 `clarification_request`、`confirmation_required` 和 `assistant_message`，并递归检查历史 structured response 中所有 `confirmToken` 都是 `redacted`。`pnpm validate:product-smoke` 已通过，说明 TestClient / in-memory 产品路径包含 transcript restore 和历史 token redaction。已临时启动 `uvicorn` 到 `127.0.0.1:8015`，用 live smoke 实跑通过 `/turns?limit=50` HTTP 路径，随后关闭临时服务。

产品级 smoke 自然语言管理已有事项在 2026-05-28 通过：

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_product_smoke_script.py -q
pnpm validate:product-smoke
PATH=.venv/bin:$PATH ruff check scripts/validate_product_smoke.py python/backend/tests/test_product_smoke_script.py
AI_CODE_API_BASE_URL=http://127.0.0.1:8016 pnpm validate:product-smoke:live
```

结果：新增测试先证明 `validate_natural_language_management_smoke()` 只覆盖代表性管理动作，不足以覆盖三领域 8 个管理动作；补齐后，smoke 会用 `conversationId + "_management"` 独立会话覆盖：创建提醒 -> “把刚才的提醒改到明天上午十点” -> “完成刚才的提醒” -> 创建第二条提醒 -> “取消刚才的提醒”；创建费用 -> “把刚才的费用改成 88 元” -> “提交刚才的费用” -> 创建第二条费用 -> “取消刚才的费用”；创建日程 -> “把明天的会议改到十点” -> 创建第二条日程 -> “取消刚才的会议”。验证会断言管理 action 的 `target_id` 命中当前会话目标、`expected_status` 正确、确认后领域事实状态或时间变化，并检查该管理会话的 `execution-ledger` 至少包含 14 条 `action_executed`。`pnpm validate:product-smoke` 已通过，说明 TestClient / in-memory 产品路径包含完整自然语言管理已有事项。已临时启动 `uvicorn` 到 `127.0.0.1:8016`，用 live smoke 实跑通过 `_management` HTTP 路径，随后关闭临时服务。

自然语言管理目标歧义追问在 2026-05-28 通过：

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_rule_based_planning_engine.py python/backend/tests/test_agent_turns.py::test_agent_turn_clarifies_ambiguous_existing_reminder_target python/backend/tests/test_agent_turns.py::test_agent_turn_can_cancel_recent_reminder_by_conversation_context -q
```

结果：红灯测试先证明多条 scheduled 提醒、多条 draft 费用和同一天多条 scheduled 日程会被 rule planner 直接选最近目标；补齐后，宽泛“取消提醒 / 提交费用 / 取消明天的会议”会返回缺 `target_id` 的 clarification，并带候选目标 quick replies；“取消刚才的提醒”仍会按最近可操作提醒生成确认计划。API 层验证同会话两条提醒后输入“取消提醒”不会创建待确认计划，也不会新增 ledger。

多 provider 管理目标歧义安全闸在 2026-05-28 通过：

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_policy_engine.py python/backend/tests/test_llm_planning_engine.py python/backend/tests/test_llm_prompt_contract.py python/backend/tests/test_orchestrator_planner.py::test_planner_clarifies_llm_ambiguous_target_guess python/backend/tests/test_agent_turns.py::test_agent_turn_clarifies_ambiguous_existing_reminder_target python/backend/tests/test_agent_turns.py::test_agent_turn_clarifies_ambiguous_existing_expense_target python/backend/tests/test_agent_turns.py::test_agent_turn_clarifies_ambiguous_existing_calendar_target python/backend/tests/test_agent_turns.py::test_agent_turn_can_cancel_recent_reminder_by_conversation_context python/backend/tests/test_agent_turns.py::test_agent_turn_can_submit_recent_expense_by_conversation_context python/backend/tests/test_agent_turns.py::test_agent_turn_can_cancel_tomorrow_calendar_event_by_context python/backend/tests/test_product_smoke_script.py -q
pnpm validate:product-smoke
```

结果：红灯测试先证明 `llm_first` 会直接采用 LLM 返回的合法但武断目标，`ManagementTargetValidator` 也会放行多目标中的合法 `target_id`，目标歧义 quick reply 会被当成普通输入继续追问或误识别成新日程；补齐后，`llm_first` 先采用 rule safety precheck，policy 层再统一拦截多 provider 的目标猜测，pending clarification 能解析 quick reply / 序号选择并生成提交 / 取消 / 完成 / 更新类管理确认卡，更新类会保留原始 patch。API 层补齐提醒 / 费用 / 日程三类歧义追问，产品 smoke 补齐两条提醒、两条费用和同一天两条日程的宽泛管理更新追问、点选和确认执行路径。

多目标追问快捷回复候选一致性在 2026-05-28 通过：

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_agent_turns.py::test_agent_turn_target_selection_uses_displayed_quick_reply_order -q
PATH=.venv/bin:$PATH pytest python/backend/tests/test_agent_turns.py::test_agent_turn_target_selection_uses_displayed_quick_reply_order python/backend/tests/test_agent_turns.py::test_agent_turn_resolves_ambiguous_reminder_update_target_selection python/backend/tests/test_agent_turns.py::test_agent_turn_resolves_ambiguous_expense_target_selection python/backend/tests/test_agent_turns.py::test_agent_turn_resolves_ambiguous_calendar_target_selection python/backend/tests/test_product_smoke_script.py -q
PATH=.venv/bin:$PATH ruff check python/agent-runtime/agent_runtime/planning/rule_based.py python/backend/tests/test_agent_turns.py scripts/validate_product_smoke.py
pnpm validate:product-smoke
pnpm validate:context-sync && pnpm validate:factory && git diff --check
```

结果：红灯测试先证明 4 条 scheduled 提醒下，“完成提醒”只展示最近 3 条 quick replies，但点击第一条展示项会被解析成全量候选中的第一条 `target_id`；修复后，quick replies 与 `candidate_target_ids` 都来自同一个 `displayed_targets`，点击第一条展示项会生成命中展示目标的确认卡。聚焦测试 `11 passed`，ruff `All checks passed!`，`pnpm validate:product-smoke` 输出 `Product smoke validation passed.`，上下文同步、factory、H5 runtime、H5 datetime runtime、SDK runtime 和 `git diff --check` 均通过。

结构化快捷回复选择值在 2026-05-28 通过：

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_agent_turns.py::test_agent_turn_target_selection_exposes_stable_quick_reply_values python/backend/tests/test_agent_turns.py::test_agent_debug_returns_pending_clarifications python/backend/tests/test_product_smoke_script.py -q
pnpm --filter @ai-code/h5 typecheck
pnpm --filter @ai-code/shared-types typecheck && pnpm --filter @ai-code/sdk typecheck
pnpm validate:contracts
pnpm validate:product-smoke
```

结果：红灯测试先证明重复展示文案下响应缺少 `quickReplyOptions`，H5 typecheck 也证明类型和渲染元素缺少结构化提交值；补齐后，后端重复提醒目标选择、debug pending、产品 smoke helper、H5/shared-types/SDK typecheck、OpenAPI 契约和产品 smoke 均通过。H5 现在展示 `quickReplyOptions.label`，点击提交 `quickReplyOptions.value`。

快捷回复提交值与用户显示文本分离在 2026-05-28 通过：

```bash
pnpm validate:h5-runtime
pnpm --filter @ai-code/h5 typecheck
```

结果：红灯验证先证明 H5 runtime 缺少 `displayText ?? text` 和 `handleSubmittedText(reply.value, { displayText: reply.label })`；补齐后，quick reply 点击会提交稳定 `value`，但用户气泡显示自然语言 `label`。键盘、语音和附件输入仍沿用原有展示语义。

快捷回复会话历史 displayInput 闭环在 2026-05-28 通过：

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_agent_turns.py::test_agent_turn_history_records_display_input_for_structured_quick_reply -q
pnpm validate:h5-runtime
```

结果：红灯测试先证明 H5 提交 `quickReplyOptions.value` 后，后端会话历史会把 `reminder_xxx` 记录成用户输入；H5 runtime 红灯也证明提交请求缺少 `displayInput`。补齐后，`/agent/turns` 接收可选 `displayInput`，规划仍使用真实 `input`，历史 `inputText` / `summary` 保存展示 label，`rawContent.submittedInput` 保留真实稳定 value。

LLM / 只读查询负向回归补强在 2026-05-28 通过：

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_llm_planning_engine.py::test_llm_planning_engine_handles_non_json_provider_output python/backend/tests/test_agent_turns.py::test_agent_turn_can_query_tomorrow_schedule_from_conversation_context -q
```

结果：补充测试证明 LLM-compatible provider 返回非 JSON 文本时，`LlmPlanningEngine` 会返回 `assistant_message` 和 `deepseek-invalid-response` trace，而不是生成 plan；API 级只读查询在返回“明天的安排”结构化列表后，pending confirmations 仍为空，当前会话 execution ledger 与查询前一致。

多 provider LLM fenced JSON 兼容在 2026-05-28 通过：

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_llm_planning_engine.py::test_llm_planning_engine_parses_fenced_json_provider_output python/backend/tests/test_llm_planning_engine.py::test_llm_planning_engine_handles_non_json_provider_output -q
PATH=.venv/bin:$PATH pytest python/backend/tests/test_llm_planning_engine.py -q
PATH=.venv/bin:$PATH ruff check python/agent-runtime/agent_runtime/planning/llm.py python/backend/tests/test_llm_planning_engine.py
```

结果：红灯验证先证明 fenced JSON provider 输出会被判为 `claude-invalid-response`；补齐后，标准 Markdown JSON 代码块会被解析为正常 `chat` / `clarification` / `plan_candidate` payload。非 JSON 文本回归仍通过，说明兼容只放宽代码块包裹，不改变无效响应降级边界。

H5 可点击产品级 smoke 在 2026-05-28 通过：

```bash
pnpm validate:h5-click-smoke
```

结果：红灯验证先证明仓库没有 Playwright 可执行依赖，补依赖和浏览器后二次红灯暴露 H5 事件注入早于 bridge 订阅；调整为等待 H5 mount 后再发送 Native 消息。后续按 subagent 审计建议扩展为三领域可点击验收：真实浏览器中完成 Native 输入、追问 quick reply、确认卡、Timeline 切换、日程 / 费用 / 提醒三类编辑弹层保存、日程取消、费用提交、提醒完成，并回查后端状态，输出 `H5 click smoke validation passed.`。

真实 LLM provider smoke 在 2026-05-28 通过：

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_llm_smoke_script.py -q
PATH=.venv/bin:$PATH pytest python/backend/tests/test_llm_planning_engine.py python/backend/tests/test_llm_smoke_script.py -q
PATH=.venv/bin:$PATH ruff check python/agent-runtime/agent_runtime/planning/llm.py scripts/validate_llm_smoke.py python/backend/tests/test_llm_planning_engine.py python/backend/tests/test_llm_smoke_script.py
pnpm validate:llm-smoke
```

结果：红灯验证先证明 smoke 默认删除 `DATABASE_URL` 会被后续 `.env.local` 重新加载回 Postgres，导致 provider 验证被数据库认证污染；修复后脚本先读取 key，再显式设置 `DATABASE_URL=""` 和 `AI_CODE_LOAD_ENV_LOCAL=0`。第二轮红灯证明真实 provider 调用缺少请求超时，补齐 `AI_PLANNER_REQUEST_TIMEOUT_SECONDS` 后，DeepSeek smoke 输出 `LLM smoke validation passed with provider=deepseek.`。

Postgres 产品级 smoke 在 2026-05-28 通过：

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_product_smoke_script.py -q
PATH=.venv/bin:$PATH pytest python/backend/tests/test_postgres_repositories.py::test_calendar_postgres_row_uses_event_timezone_for_iso_output python/backend/tests/test_postgres_repositories.py::test_reminder_postgres_row_uses_reminder_timezone_for_iso_output python/backend/tests/test_product_smoke_script.py -q
PATH=.venv/bin:$PATH ruff check scripts/validate_product_smoke.py python/backend/tests/test_product_smoke_script.py python/backend/backend/app/domains/calendar/postgres_repository.py python/backend/backend/app/domains/reminder/postgres_repository.py python/backend/tests/test_postgres_repositories.py
pnpm validate:product-smoke
pnpm validate:product-smoke:postgres
```

结果：红灯验证先证明默认离线 smoke 会继承外层 `DATABASE_URL`，以及缺少 `--postgres` 入口；补齐后 Postgres smoke 真实执行 migration 并暴露 `timestamptz` 读回 UTC 的差异。日程和提醒 repository 改为按事实 timezone 输出 ISO，smoke 又暴露脚本依赖列表“最后一条”的排序假设；改为按标题或 structured quick reply value 定位目标后，Postgres 产品 smoke 输出 `Product smoke validation passed.`。

LLM provider 调用观测接入 debug 在 2026-05-28 通过：

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_llm_planning_engine.py python/backend/tests/test_orchestrator_planner.py::test_planner_decision_trace_records_llm_call_observation python/backend/tests/test_agent_turns.py::test_agent_debug_trace_exposes_llm_call_observation python/backend/tests/test_agent_events.py::test_decision_trace_repository_round_trips_trace python/backend/tests/test_db_migrate_script.py -q
PATH=.venv/bin:$PATH ruff check python/agent-runtime/agent_runtime/planning/types.py python/agent-runtime/agent_runtime/planning/llm.py python/agent-runtime/agent_runtime/tracing/decision_trace.py python/orchestrator/orchestrator/planner.py python/backend/backend/app/routes/agent.py python/backend/backend/app/infrastructure/postgres/decision_trace_repository.py python/backend/tests/test_llm_planning_engine.py python/backend/tests/test_orchestrator_planner.py python/backend/tests/test_agent_turns.py python/backend/tests/test_agent_events.py python/backend/tests/test_db_migrate_script.py
pnpm --filter @ai-code/shared-types typecheck && pnpm --filter @ai-code/sdk typecheck && pnpm --filter @ai-code/h5 typecheck
pnpm validate:contracts
pnpm validate:h5-runtime
```

结果：红灯验证先证明 `PlanningResult`、`DecisionTrace` 和 debug route 都没有 provider 调用观测字段，H5 runtime 也证明设置页没有展示 `latestTrace.llmCall` / `promptSha256`。补齐后，debug trace 默认只暴露安全摘要和 prompt hash，显式 `AI_PLANNER_TRACE_PROMPT=1` / `AI_PLANNER_TRACE_RESPONSE=1` 才会携带 preview；随后补充红灯证明 provider 异常 fallback 会丢失 failed observation，修复后 fallback result / trace 也能看到 `status=failed` 与 `errorType`。Postgres round-trip、OpenAPI、shared-types、SDK、H5 typecheck、契约和 runtime 校验均通过。

## 已知注意事项

- EasyQuery 必须连接 `ai_code` 数据库，不是默认 `postgres` 数据库。
- Postgres `timestamptz` 在 psql/EasyQuery 中可能按 UTC 显示，例如 `15:00+08:00` 会显示成 `07:00+00`，这不是写错时间。
- 如果 H5 底部状态栏出现 `API request failed: 400 Bad Request: ...`，优先看冒号后的后端 `detail`；若仍只有泛化状态码，再看 API 日志是否是旧 API 进程、非 JSON 错误或打到了未带 `DATABASE_URL` 的后端。
- 如果“数据库没有数据”，先确认 EasyQuery 连接信息、目标 database、schema 和当前 API 进程环境变量。
- 切换真实模型时优先改根目录 `.env.local` 或终端环境变量，不改业务代码：`AI_PLANNER_PROVIDER=deepseek`、`DEEPSEEK_API_KEY=...`、`AI_PLANNER_MODEL=deepseek-v4-flash`；OpenAI 则使用 `AI_PLANNER_PROVIDER=openai`、`OPENAI_API_KEY=...` 和对应模型名。
- 如果要确认当前运行中的后端是否能支持 Postman / iOS 测试，先启动 `pnpm dev:full`，再跑 `pnpm validate:product-smoke:live`；该命令会真实写入当前数据库测试数据，并覆盖自然语言管理已有事项的 8 个核心动作、会话历史恢复、待确认卡恢复确认和附件资源入口，不适合接生产库。
- 如果要验证 H5 本身的可点击产品链路，先确保本机已执行 `pnpm exec playwright install chromium`，再跑 `pnpm validate:h5-click-smoke`。该命令会临时启动 in-memory API 和 H5 dev server，并真实打开 Chromium 点击页面；当前覆盖日程、费用、提醒的创建确认、编辑保存和行内终态动作；它不使用 Postgres，也不调用真实 LLM。
- 如果要验证真实 DeepSeek/OpenAI provider，先在 `.env.local` 配置 `DEEPSEEK_API_KEY` 或 `OPENAI_API_KEY`，再跑 `pnpm validate:llm-smoke`。该命令默认不使用 Postgres；如果后续确实要让 smoke 使用数据库，需显式设置 `AI_CODE_LLM_SMOKE_USE_DATABASE=1`。
- 如果要验证 migration + Postgres repository + 产品 API 主路径，先启动本地 Postgres，再跑 `pnpm validate:product-smoke:postgres`。它会真实写入 `conversation_product_smoke_*` 测试数据，不串入离线 `validate:factory`。
- 查看 DeepSeek/OpenAI 调用耗时时，看后端日志中的 `LLM planner provider call completed ... duration_ms=...`；需要完整 prompt 时在 `.env.local` 临时设置 `AI_PLANNER_LOG_PROMPT=1` 并重启服务，调试结束后改回 `0`。
- 如果要在 H5 设置页或 Postman debug 响应里查看 LLM 调用信息，使用 `GET /agent/conversations/{conversationId}/debug` 的 `decisionTraces[].llmCall`。默认只包含 provider、model、耗时、字符数和 `promptSha256`；需要把完整 prompt/response preview 写入 debug 快照时才临时开启 `AI_PLANNER_TRACE_PROMPT=1` / `AI_PLANNER_TRACE_RESPONSE=1`。
- `apps/ios/AIEngineeringCode/Info.plist` 目前可能有未提交的本地 H5 地址改动，属于用户环境配置，默认不要还原；本轮只补充语音识别、麦克风和日历权限说明。

## 知识同步状态

- 仓库事实来源已更新到本文件。
- 仓库已新增上下文同步检查脚本，并复审阶段决策。
- Obsidian 已写入 `Projects/AI Engineering Code/阶段成果/2026-05-23 新窗口上下文恢复协议.md`。
- Obsidian 已写入 `Projects/AI Engineering Code/阶段成果/2026-05-23 上下文同步检查与阶段决策复审.md`。
- Obsidian 已写入 `Projects/AI Engineering Code/阶段成果/2026-05-23 费用草稿薄切片.md`。
- Obsidian 已写入 `Projects/AI Engineering Code/阶段成果/2026-05-23 AI 时间管理 Agent v1.0 初版 App.md`。
- Obsidian 已写入 `Projects/AI Engineering Code/阶段成果/2026-05-28 iOS 原生小文件 base64 Bridge 契约.md`。
- 飞书已同步 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并用 outline fetch 验证可读取。
- 本次“上下文同步检查与阶段决策复审”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“费用草稿薄切片”已更新飞书源稿 `03 阶段演进记录`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“AI 时间管理 Agent v1.0 初版 App”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“AI Planning Runtime v1 后端架构实施”已更新飞书源稿 `03 阶段演进记录`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“iOS 原生语音输入闭环”已更新飞书源稿 `03 阶段演进记录`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“iOS 本地通知调度闭环”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“iOS 提醒通知点击回流”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“H5 提醒通知点击高亮补齐”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“H5 提醒通知目标定位滚动”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“H5 运行时去 mock 与取消确认可信闭环”已更新飞书源稿 `03 阶段演进记录`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“提醒完成 / 取消可点击闭环”已更新飞书源稿 `03 阶段演进记录`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“附件元数据 intake 闭环”已更新飞书源稿 `03 阶段演进记录`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“附件票据金额追问闭环”已更新飞书源稿 `03 阶段演进记录`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“附件票据可读文本金额提取”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“附件资源查询与对话回看闭环”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“附件内容上传后端闭环”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“H5 Agent 调试信息可视化”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“附件日程材料追问闭环”已更新飞书源稿 `03 阶段演进记录`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“费用草稿提交 / 取消可点击闭环”已更新飞书源稿 `03 阶段演进记录`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“日程取消可点击闭环”已更新飞书源稿 `03 阶段演进记录`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“Timeline 行内动作闭环”已更新飞书源稿 `03 阶段演进记录`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“事项内容编辑闭环”已更新飞书源稿 `03 阶段演进记录`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“H5 应用内编辑面板”已更新飞书源稿 `03 阶段演进记录`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“编辑输入校验与终态保护”已更新飞书源稿 `03 阶段演进记录`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“状态流转保护”已更新飞书源稿 `03 阶段演进记录`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“iOS 系统日历写入闭环”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“iOS 原生附件选择闭环”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“iOS 原生小文件 base64 Bridge 契约”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“H5 附件上传路径选择闭环”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“iOS 照片附件原生 OCR 薄闭环”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“附件上传文本合并与 H5 端到端验证”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“iOS 原生会话持久 ID”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“Native 系统同步错误语义降级”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“H5 快照刷新核心 / 可选降级”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“iOS Files 图片 / PDF 可读内容提取”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“iOS 系统日历取消清理闭环”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“iOS 键盘 Bridge 与假入口清理”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“会话历史恢复 API”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“待确认卡恢复闭环”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“会话范围业务读模型”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“会话范围 Agent 上下文摘要”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“自然语言管理已有事项 v1”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“LLM/DeepSeek 对话路由 prompt 合约”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“LLM / 只读查询负向回归补强”只更新仓库当前状态；未新增飞书源稿阶段记录，后续如整理 LLM 验证专题再同步外部知识库。
- 本次“多 provider LLM fenced JSON 兼容”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“LLM 只读查询结构化组件输出”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“Policy 工具 schema 必填字段校验”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“Policy 工具 schema 字段类型校验”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“LLM 工具目录 schema 注入”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“ContextRedactor 工具目录保留边界”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“update patch 内层字段类型校验”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“非执行路径 trace 与 pending 补全增强”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“管理目标确认前 guard”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“SummaryMemory 执行事实生命周期”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“直接 UI 行内动作审计闭环”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“H5/SDK 可用性审计修复”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“H5 编辑日期时间输入本地化”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“产品级 smoke 验证门禁”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“运行中 API 产品级 live smoke”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“H5 可点击产品级 smoke”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“真实 LLM provider smoke”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“Postgres 产品级 smoke”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“LLM provider 调用观测接入 debug”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“产品级 smoke 覆盖附件资源入口”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“live smoke 不可达错误提示”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“产品级 smoke 覆盖待确认卡恢复确认”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“产品级 smoke 覆盖会话历史恢复”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“产品级 smoke 覆盖自然语言管理已有事项”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“自然语言管理目标歧义追问”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“多 provider 管理目标歧义安全闸”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“多目标追问快捷回复候选一致性修复”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“结构化快捷回复选择值”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新 Postman README；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“快捷回复提交值与用户显示文本分离”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“快捷回复会话历史 displayInput 闭环”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新 Postman README；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“H5 Bridge Debug 入站来源摘要”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“iOS 人工补证清单结构化”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“会话持久 ID 自动辅助证据”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“后端事实摘要自动辅助证据”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新 iOS v1 系统能力验收清单；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“Native 系统诊断辅助证据”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新 iOS v1 系统能力验收清单；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“H5 同会话页面截图辅助证据”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新 iOS v1 系统能力验收清单；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“三领域验收事实种子与系统日历写入辅助证据”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新 iOS v1 系统能力验收清单；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“系统日历取消清理自动辅助证据”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新 iOS v1 系统能力验收清单；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“日历权限拒绝降级自动辅助证据”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新 iOS v1 系统能力验收清单；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“通知点击回流自动辅助证据”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新 iOS v1 系统能力验收清单；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“短时间提醒与通知回流目标稳定定位”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新 iOS v1 系统能力验收清单；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“系统 Calendar App 辅助截图采集”已更新飞书源稿 `03 阶段演进记录`，并更新 iOS v1 系统能力验收清单；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“本地通知 delivered 诊断辅助证据”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新 iOS v1 系统能力验收清单；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“系统日历取消清理前后截图辅助证据”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新 iOS v1 系统能力验收清单；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“系统日历取消清理采证稳定性收口”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新 iOS v1 系统能力验收清单；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“App 包 H5DevServerURL 目标页面识别”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新 iOS v1 系统能力验收清单和当前项目状态；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“iOS 自动采证 HTTP 重试与 live 崩溃修复”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新当前项目状态；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“iOS 自动采证 Calendar 预授权与权限拒绝判定兼容”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新 iOS v1 系统能力验收清单、v1 readiness 审计和当前项目状态；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“iOS 人工复核证据 review 记录”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新 iOS v1 系统能力验收清单和当前项目状态；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“iOS 键盘输入辅助证据采集”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新 iOS v1 系统能力验收清单、v1 readiness 审计和当前项目状态；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“iOS 附件输入辅助证据采集”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新 iOS v1 系统能力验收清单、v1 readiness 审计和当前项目状态；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“iOS 原生键盘 UI test 门禁”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新 iOS README、iOS v1 系统能力验收清单、v1 readiness 审计和当前项目状态；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“iOS 原生语音 UI test 门禁”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新 iOS README、iOS v1 系统能力验收清单、v1 readiness 审计和当前项目状态；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“iOS 原生附件菜单 UI test 门禁”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新 iOS README、iOS v1 系统能力验收清单、v1 readiness 审计和当前项目状态；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“iOS 原生导航 UI test 门禁”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新 iOS README、iOS v1 系统能力验收清单、v1 readiness 审计和当前项目状态；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“iOS 原生导航结构化人工证据记录”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新 iOS v1 系统能力验收清单和当前项目状态；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“v1 completion audit 统一归档入口”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新 v1 readiness 审计和当前项目状态；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“v1 completion audit 覆盖证据工具与 native-shells 护栏”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新 v1 readiness 审计和当前项目状态；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“native-shells 守住 v1 completion audit 入口”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新当前项目状态；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“completion audit 归档人工补证缺口报告”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新 iOS v1 系统能力验收清单、v1 readiness 审计和当前项目状态；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“completion audit 结构化外部知识库同步状态”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新 iOS v1 系统能力验收清单、v1 readiness 审计和当前项目状态；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“completion audit 人工证据 HEAD 新鲜度”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新 iOS v1 系统能力验收清单、v1 readiness 审计和当前项目状态；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“当前 HEAD iOS 辅助证据包刷新”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新当前项目状态；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“completion audit 优先选择当前 HEAD 证据”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新当前项目状态；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“iOS 验收事实费用 seed 稳定化”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新当前项目状态；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“验收事实 H5 确认卡辅助采证”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新当前项目状态；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“H5 日程取消动作辅助采证”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新当前项目状态；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“H5 calendar focus 稳定化”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新当前项目状态；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“原生导航 UI test 证据归档”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新当前项目状态；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“导航与附件证据归档稳定化”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新当前项目状态；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“HEAD 5c2ffba 辅助证据包与 audit 刷新”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新当前项目状态；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“原生键盘 UI test 证据归档”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新当前项目状态；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“HEAD 71aa8fe 键盘证据 audit 刷新”已更新当前项目状态；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“H5 局域网地址覆盖 review 映射”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新当前项目状态；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 本次“通知辅助证据部分可用 review 映射”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新当前项目状态；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 2026-06-01 已补齐原生语音 UI test 证据归档：`validate:ios-voice-ui-test` 现在固定写出 `.tmp/ios-voice-ui-test/ios-voice-ui-test.log`、`.tmp/ios-voice-ui-test/ios-voice-ui-test.xcresult` 和 `voice-ui-test.json` metadata；`NativeKeyboardInputUITests.testNativeVoiceComposerConfirmsReminderThroughBackend` 会保存 `识别文本` 和 `H5 确认卡` screenshot attachment；`collect-ios-acceptance-evidence` 会读取 `voiceUiTest` 并加入 `ios_voice_ui_test_artifact`，`manual-evidence-review` 会预填语音输入的识别文本、H5 确认卡、`/reminders` 摘要、`source=native.composer.voice` 和 UI test log / xcresult。已在局域网 H5/API 存活状态下运行 `pnpm validate:ios-voice-ui-test`，1 个 XCTest 通过并生成 log / xcresult / metadata。该证据仍是 supporting-only，不替代真实麦克风 / 语音识别权限弹窗截图或人工 `passed` 记录。
- 本次“原生语音 UI test 证据归档”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新当前项目状态；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 2026-06-01 已用 HEAD `a7a2241` 重跑正式辅助证据包和 completion audit：`.tmp/ios-acceptance-evidence/current-head-final-20260601-a7a2241` 显示 `voiceUiTest.available=true`、`keyboardUiTest.available=true`、`navigationUiTest.available=true`、`nativeAttachmentInputs.available=true`；`.tmp/v1-completion-audit/current-best-final-20260601-a7a2241` 选择了当前 HEAD review 记录，`missingEvidenceCount=15`、`verdict=not_complete`。`voice_input` 已预填 `识别文本`、`H5 确认卡`、`/reminders`、`source=native.composer.voice` 和 UI test log / xcresult，缺口收敛到真实麦克风 / 语音识别权限弹窗截图或录屏；通知仍缺 `notifications.reminders.sync`、通知权限弹窗、系统通知截图和系统通知点击录屏；照片 / 文件 / PDF 仍缺真实系统选择器流程、权限截图和业务追问 / 确认卡等人工材料。所有人工项仍为 `pending`，不能把 goal 标记为 complete。
- 本次“HEAD a7a2241 语音证据 audit 刷新”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新当前项目状态；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 2026-06-01 已补齐照片附件后的费用业务辅助证据：`seedNativeAttachmentInputs` 在 photo seed 写入附件后会点击 H5 quick reply“作为费用票据处理”，保存 `native-attachment-photo-expense-follow-up.png`，确认计划后查询 `/expenses?conversationId=...` 并把 `expenseRecordId` 写入 `photo_attachment` review 候选证据。该能力只证明 H5 / 后端能基于照片附件可读文本生成费用确认卡并写入费用记录，不替代真实 `PhotosPicker` 系统选择流程和权限截图。
- 2026-06-01 已用 HEAD `09a35d1` 重跑正式辅助证据包和 completion audit：`.tmp/ios-acceptance-evidence/current-head-final-20260601-09a35d1` 显示 `nativeAttachmentInputs.available=true` 且 `photo.expenseFollowUp.available=true`，`expenseRecordId=expense_record_29dfc49936944013b8aa8f98d541021a`；`.tmp/v1-completion-audit/current-best-final-20260601-09a35d1` 显示 `missingEvidenceCount=13`、`verdict=not_complete`。`photo_attachment` 已不再缺“费用确认卡或金额追问”和 `/expenses?conversationId=...`，只剩真实 `PhotosPicker` 选择流程和权限 / 选择器截图；所有人工项仍为 `pending`。
- 本次“照片附件费用证据归档”和“HEAD 09a35d1 照片费用 audit 刷新”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新当前项目状态；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 2026-06-01 已补齐 PDF 附件后的日程业务辅助证据：`seedNativeAttachmentInputs` 现在在每个附件提交成功后立即处理该附件自己的 H5 quick reply，避免先提交 PDF 后再回头处理照片导致最近附件上下文漂移；PDF seed 会点击“作为日程材料处理”，保存 `native-attachment-pdf-schedule-follow-up.png`，并把 `scheduleFollowUp` 和 `textSummary=PDF 日程材料 明天上午十点项目会` 写入 `pdf_text_extraction` review 候选证据。该能力只证明 H5 / 后端能基于 PDF 可读文本生成日程追问或确认卡，不替代真实 Files / PDF 选择流程截图。
- 2026-06-01 已用 HEAD `ebb9eb2` 重跑正式辅助证据包和 completion audit：`.tmp/ios-acceptance-evidence/current-head-final-20260601-ebb9eb2` 显示 `nativeAttachmentInputs.available=true`、`photo.expenseFollowUp.available=true`、`pdf.scheduleFollowUp.available=true`、`pdf.textSummary=PDF 日程材料 明天上午十点项目会`；`.tmp/v1-completion-audit/current-best-final-20260601-ebb9eb2` 显示 `missingEvidenceCount=11`、`verdict=not_complete`。`pdf_text_extraction` 已不再缺“后续追问或确认卡”和“PDF 样本文本摘要截图”，剩余缺口聚焦到真实 `PDF 选择流程`；所有人工项仍为 `pending`。
- 本次“PDF 附件日程证据归档”和“HEAD ebb9eb2 PDF audit 刷新”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新当前项目状态；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 2026-06-01 已补齐附件选择器 UI test 证据归档：`validate:ios-attachment-ui-test` 现在固定写出 `.tmp/ios-attachment-ui-test/ios-attachment-ui-test.log`、`.tmp/ios-attachment-ui-test/ios-attachment-ui-test.xcresult` 和 `attachment-ui-test.json` metadata；XCTest 会真实打开附件菜单，并分别保留 `附件菜单`、`PhotosPicker 选择流程`、`fileImporter 选择流程` 和 `PDF 选择流程` screenshot attachment。`collect-ios-acceptance-evidence` 会读取 `attachmentUiTest` 并写入 `ios_attachment_ui_test_artifact`，`manual-evidence-review` 会把这些系统 UI 候选证据预填到 `photo_attachment`、`file_attachment` 和 `pdf_text_extraction`。该证据仍是 supporting-only，不代表真实选中文件内容、Vision OCR、PDFKit 抽取质量或人工验收已通过。
- 2026-06-01 已用 HEAD `180ce4c` 重跑正式辅助证据包和 completion audit：`.tmp/ios-acceptance-evidence/current-head-final-20260601-180ce4c` 显示 `attachmentUiTest.available=true`，自动证据包含 `ios_attachment_ui_test_artifact`、`ios_navigation_ui_test_artifact`、`ios_keyboard_ui_test_artifact`、`ios_voice_ui_test_artifact` 和 `native_attachment_inputs`；`.tmp/v1-completion-audit/current-best-final-20260601-180ce4c` 显示 `missingEvidenceCount=6`、`verdict=not_complete`。`photo_attachment`、`file_attachment` 和 `pdf_text_extraction` 的 `missingEvidence=无`，但所有人工项仍为 `pending`。剩余显式缺口聚焦到语音权限弹窗、本地通知 `notifications.reminders.sync`、通知权限弹窗、系统通知截图和系统通知点击录屏。
- 本次“附件选择器 UI test 证据归档”和“HEAD 180ce4c 附件选择器 audit 刷新”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新 iOS README、iOS v1 系统能力验收清单、v1 readiness 审计和当前项目状态；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 2026-06-01 已稳定通知同步 Bridge 辅助证据采集：`collectH5SurfaceScreenshots` 会在同一个已成功渲染七个 H5 surface 的 Playwright 页面中导出 `window.__AI_NATIVE_MESSAGES__` 摘要，只保留 outbound `type`、`reminderCount` 和 `reminderIds`；`collectNotificationSyncBridgeEvidence` 会优先复用这份 `bridgeOutboundMessages` 生成 `notificationSyncBridge`，避免再次打开独立 H5 页面时因快照刷新、Bridge Debug 文案或提醒同步时机导致 `notifications.reminders.sync` 偶发缺失。该证据仍是 supporting-only，不替代 iOS 通知权限弹窗、系统通知截图或真实通知点击录屏。
- 2026-06-01 已用 HEAD `36f786f` 重跑正式辅助证据包和 completion audit：`.tmp/ios-acceptance-evidence/current-head-final-20260601-36f786f` 显示 `notificationSyncBridge.available=true`、`targetReminderIncluded=true`，`bridgeOutboundLabel=notifications.reminders.sync · reminderId=reminder_044b3f887eec4165ae77d0d2da61b490 · reminders=48 · targetIncluded=true`，截图复用 `h5-surfaces/reminders.png`；`.tmp/v1-completion-audit/current-best-final-20260601-36f786f` 显示 `missingEvidenceCount=5`、`verdict=not_complete`。本地通知已不再缺 `notifications.reminders.sync`，剩余显式缺口为语音麦克风 / 语音识别权限弹窗、通知权限弹窗、系统通知截图和系统通知点击录屏；所有人工项仍为 `pending`，不能把 goal 标记为 complete。
- 本次“通知同步 Bridge 辅助证据稳定化”和“HEAD 36f786f 通知 Bridge audit 刷新”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新 iOS v1 系统能力验收清单、v1 readiness 审计和当前项目状态；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 2026-06-01 已补齐语音权限弹窗 UI test 证据归档：新增 `pnpm validate:ios-voice-permission-ui-test`，运行前通过 `xcrun simctl privacy booted reset microphone/all com.aiengineeringcode.shell` 重置目标 App 权限，再用 XCTest 真实点击 `ai-code.composer.voice-button`，从 SpringBoard 权限弹窗保存 `麦克风 / 语音识别权限弹窗` 和 `iOS 权限弹窗截图或录屏` screenshot attachment；命令固定写出 `.tmp/ios-voice-permission-ui-test/ios-voice-permission-ui-test.log`、`.tmp/ios-voice-permission-ui-test/ios-voice-permission-ui-test.xcresult` 和 `voice-permission-ui-test.json`。该证据仍是 supporting-only，不代表真实语音识别质量或人工验收已通过。
- 2026-06-01 已用 HEAD `e5f591b` 重跑正式辅助证据包和 completion audit：`.tmp/ios-acceptance-evidence/current-head-final-20260601-e5f591b` 显示 `voicePermissionUiTest.available=true`、`notificationSyncBridge.available=true` 且 `targetReminderIncluded=true`；`.tmp/v1-completion-audit/current-best-final-20260601-e5f591b` 选择当前 HEAD review 记录，`missingEvidenceCount=3`、`verdict=not_complete`。`voice_input` 已不再缺权限弹窗证据，剩余显式缺口集中到本地通知 `iOS 通知权限弹窗截图`、`系统通知截图` 和通知点击回流 `系统通知点击录屏`；所有人工项仍为 `pending`，不能把 goal 标记为 complete。
- 本次“语音权限弹窗 UI test 证据归档”和“HEAD e5f591b 语音权限 audit 刷新”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新 iOS README、iOS v1 系统能力验收清单、v1 readiness 审计和当前项目状态；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 2026-06-01 已补齐系统通知 UI test 证据归档：新增 `pnpm validate:ios-notification-ui-test`，通过 XCTest 创建“1 分钟后”的提醒确认卡，等待 iOS 系统通知 banner，归档 `系统通知截图`，点击通知后断言 H5 出现 `已从系统通知打开提醒` 并保存 `通知点击后 App 回流` screenshot attachment；脚本同时用 `simctl recordVideo` 固定写出 `.tmp/ios-notification-ui-test/system-notification-click.mp4`，并生成 `.tmp/ios-notification-ui-test/ios-notification-ui-test.log`、`.tmp/ios-notification-ui-test/ios-notification-ui-test.xcresult` 和 `notification-ui-test.json`。该证据证明系统通知展示和点击回流可归档，不把通知权限首弹当作必然产物，仍不自动把人工验收 item 改为 passed。
- 2026-06-01 本轮通知 UI test 调试中确认了两个真实失败点并已修复：H5 当前执行结果文案为 `已执行：创建提醒：...`，不是旧断言 `已确认执行`；SpringBoard 通知 banner 的 accessibility 结构需要优先轮询 button/staticText/`NotificationShortLookView`，不能只依赖一次 broad descendants wait。已运行 `H5_DEV_SERVER_URL='http://127.0.0.1:3000/?native=ios&bridgeDebug=1' pnpm validate:ios-notification-ui-test`，1 个 XCTest 通过并生成系统通知截图、点击回流截图和 mp4 录屏。
- 本次“系统通知 UI test 证据归档”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新 iOS README、iOS v1 系统能力验收清单、v1 readiness 审计和当前项目状态；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 2026-06-01 已用 HEAD `2018cc1` 重跑正式辅助证据包和 completion audit：`.tmp/ios-acceptance-evidence/current-head-final-20260601-2018cc1` 显示 `notificationUiTest.available=true`，`automatedEvidence` 包含 `ios_notification_ui_test_artifact`，并保留 `system-notification-click.mp4`、`ios-notification-ui-test.xcresult`、`系统通知截图` 和 `通知点击后 App 回流` attachment；`.tmp/v1-completion-audit/current-best-final-20260601-2018cc1` 选择当前 HEAD review 记录，`missingEvidenceCount=1`、`verdict=not_complete`。本地通知和通知点击回流已不再缺系统通知截图 / 点击录屏候选证据；剩余显式证据缺口是本轮使用 `127.0.0.1` 采证时没有“局域网地址 App 启动截图”。所有 14 个人工验收 item 仍为 `pending`，`acceptanceVerdict=not_evaluated`，不能把 goal 标记为 complete。
- 本次“HEAD 2018cc1 系统通知 audit 刷新”已更新当前项目状态；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 2026-06-01 已用 HEAD `eee802b` 和局域网地址 `http://192.168.1.238:3000/?native=ios&bridgeDebug=1` / `http://192.168.1.238:8000` 重跑正式辅助证据包和 completion audit：`.tmp/ios-acceptance-evidence/current-head-final-20260601-eee802b-lan` 显示 `ios.h5DevServerUrl` 为局域网地址、`ios.h5DevServerTargetMarkerFound=true`、`notificationUiTest.available=true`，`automatedEvidence` 包含 `ios_notification_ui_test_artifact`；`.tmp/v1-completion-audit/current-best-final-20260601-eee802b-lan` 选择当前 HEAD review 记录，`missingEvidenceCount=0`、`packageFreshness.status=current`、`verdict=not_complete`。这表示当前机器可见证据字段已全部预填候选材料；剩余阻塞是所有 14 个人工验收 item 仍为 `pending`，`acceptanceVerdict=not_evaluated`，且正式 audit 尚未使用 `--run-automated-commands` 跑全量最终门禁。
- 本次“HEAD eee802b LAN 证据 audit 刷新”已更新当前项目状态；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 2026-06-01 已修复语音权限 UI test 在 full audit 中受 Simulator TCC 状态污染的问题：`validate:ios-voice-permission-ui-test` 默认改用 `com.aiengineeringcode.shell.voicepermissionuitest.<run>` 临时 bundle id 构建 App，避免 Speech / Microphone 先前已授权时不再出现系统权限弹窗；metadata 会记录 `baseBundleId` 和本轮 `bundleId`。`pnpm validate:native-shells` 已新增护栏检查 run-scoped bundle id 逻辑，`pnpm validate:ios-voice-permission-ui-test` 连续两次通过。
- 2026-06-01 已用 HEAD `69af3fb` 和局域网地址重跑正式辅助证据包与 full completion audit：证据包 `.tmp/ios-acceptance-evidence/current-head-final-20260601-69af3fb-lan` 显示 `voicePermissionUiTest.available=true`、`keyboardUiTest.available=true`、`nativeKeyboardInput.available=true`、`nativeAttachmentInputs.available=true`、`calendarCleanupSeed.available=true`；full audit `.tmp/v1-completion-audit/current-full-final-20260601-69af3fb-lan` 使用 `--run-automated-commands` 后 21 个自动化命令全部 `passed`，`manualEvidence.missingEvidenceCount=0`、`packageFreshness.status=current`、`verdict=not_complete`。剩余阻塞已收敛为 14 个人工验收 item 仍为 `pending`、`acceptanceVerdict=not_evaluated`，且 `externalKnowledgeSync.status=not_synced`。不能把 goal 标记为 complete。
- 本次“语音权限 full audit 稳定化”和“HEAD 69af3fb full audit 刷新”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新 iOS README 和当前项目状态；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 2026-06-01 已新增人工验收 filled 草稿入口：`pnpm prepare:ios-manual-evidence-record` 会先运行 `scripts/fill-ios-manual-evidence-record.test.mjs`，再由 `scripts/fill-ios-manual-evidence-record.mjs` 从 `manual-evidence-record.review.json` 生成 `manual-evidence-record.filled.json` 草稿。默认模式保留 `acceptanceVerdict=not_evaluated` 和 14 个 item 的 `pending` 状态；只有显式传入 `--mark-passed --operator <name> --confirmed-at <iso8601>` 且证据完整性校验通过时，才会生成 passed filled 记录。该入口用于减少人工签署漏填，不替代真实人工验收。
- 本次“人工验收 filled 草稿入口”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新 iOS v1 系统能力验收清单、v1 readiness 审计和当前项目状态；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 2026-06-01 当前 HEAD `04c8a09` 重新生成局域网证据包时发现 `acceptanceFactSeed.available=false`，根因是费用 seed 文案 `新建一条昨天打车费 58 元的费用草稿，备注 ...` 在长期脏会话和真实 LLM provider 下返回 `assistant_message`，没有生成确认卡，连带系统 Calendar App 和日历取消清理辅助证据不可用。已将费用 seed 改为 `新增费用草稿，标题 <seedRunId> 验收打车费，金额 58 元，发生日期昨天`，并用 `pnpm validate:ios-acceptance-evidence` 和 `pnpm validate:native-shells` 验证脚本护栏通过。提交后必须重新生成当前 HEAD 证据包和 audit。
- 本次“验收事实费用 seed 再稳定化”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新当前项目状态；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 2026-06-01 已用 HEAD `44574d1` 和局域网地址重跑当前正式证据包与 full completion audit：证据包 `.tmp/ios-acceptance-evidence/current-head-final-20260601-44574d1-lan` 显示 `acceptanceFactSeed.available=true`、`calendarSystemAppEvidence.available=true`、`calendarCleanupSeed.available=true`、`notificationSyncBridge.available=true`、`notificationUiTest.available=true`、`keyboardUiTest.available=true`、`voicePermissionUiTest.available=true`、`nativeAttachmentInputs.available=true`，review 记录 `missingEvidenceCount=0`。full audit `.tmp/v1-completion-audit/current-full-final-20260601-44574d1-lan` 使用 `--run-automated-commands` 后 21 个自动化命令全部 `passed`，`packageFreshness.status=current`，`recordHeadSha=44574d1`，`currentHeadSha=44574d1`，最终仍为 `verdict=not_complete`。剩余阻塞只有 14 个人工验收 item 仍为 `pending`、`acceptanceVerdict=not_evaluated`，以及外部知识库 `not_synced`。不能把 goal 标记为 complete，且不能由 AI 自动签署 passed。
- 本次“HEAD 44574d1 full audit 刷新”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新当前项目状态；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 2026-06-01 已新增人工验收 Review Pack 入口：`pnpm prepare:ios-manual-review-pack -- --record <manual-evidence-record.review.json>` 会先运行 `scripts/generate-ios-manual-review-pack.test.mjs`，再生成 `manual-evidence-review-pack.md`。该 Markdown 汇总 record 路径、record/current HEAD、`packageFreshness`、`acceptanceVerdict`、manual flags、item 状态统计、每项缺少候选证据和已预填证据，并给出后续 filled 签署、`--require-complete` 校验和 full audit 命令。它是人工复核工作台，不代表验收通过；当前从 `.tmp/ios-acceptance-evidence/current-head-final-20260601-44574d1-lan/manual-evidence-record.review.json` 生成的 pack 因当前 HEAD 已是后续 docs/tool 提交，会标记 stale。
- 本次“人工验收 Review Pack 入口”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新 iOS v1 系统能力验收清单、v1 readiness 审计和当前项目状态；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 2026-06-01 已用 HEAD `0e25651` 和局域网地址重跑当前正式证据包、Review Pack 与 full completion audit：证据包 `.tmp/ios-acceptance-evidence/current-head-final-20260601-0e25651-lan` 显示 `manifest.headSha=0e25651`，review 记录 `headSha=0e25651`、14 个 item 全部 `pending`，且 `missingEvidenceCount=0`；Review Pack 已写入同目录 `manual-evidence-review-pack.md`。full audit `.tmp/v1-completion-audit/current-full-final-20260601-0e25651-lan` 使用 `--run-automated-commands` 后 21 个自动化命令全部 `passed`，`packageFreshness.status=current`，`recordHeadSha=0e25651`，`currentHeadSha=0e25651`，最终仍为 `verdict=not_complete`。剩余阻塞仍是 14 个人工验收 item 全部 `pending`、`acceptanceVerdict=not_evaluated`，以及外部知识库 `not_synced`。不能把 goal 标记为 complete。
- 本次“HEAD 0e25651 full audit 刷新”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新当前项目状态；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 2026-06-01 已新增 completion audit 的 docs-only 新鲜度规则：当人工记录 HEAD 与当前 HEAD 不一致时，`collect-v1-completion-audit` 会检查 `git diff --name-only <recordHead>..<currentHead>`；如果后续变更仅包含 `docs/`、`ai-factory/memory/` 或少量文档入口文件，则 `packageFreshness.status=current_with_docs_only_changes`，用于避免“记录 audit 结果”本身制造 stale 循环。触及 `scripts/`、`apps/`、`python/`、`packages/`、`package.json` 等产品或采证代码仍会保持 `stale`；该状态也不绕过人工验收，review / draft 记录仍不能被当作 passed。
- 本次“docs-only audit 新鲜度规则”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`、v1 readiness 审计和当前项目状态；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 2026-06-01 已用 HEAD `b9d4fc5` 和局域网地址重跑当前正式证据包、Review Pack 与 full completion audit：证据包 `.tmp/ios-acceptance-evidence/current-head-final-20260601-b9d4fc5-lan` 显示 `manifest.headSha=b9d4fc5`，review 记录 `headSha=b9d4fc5`、14 个 item 全部 `pending`，且 `missingEvidenceCount=0`；Review Pack 已写入同目录 `manual-evidence-review-pack.md`。full audit `.tmp/v1-completion-audit/current-full-final-20260601-b9d4fc5-lan` 使用 `--run-automated-commands` 后 21 个自动化命令全部 `passed`，`packageFreshness.status=current`，`recordHeadSha=b9d4fc5`，`currentHeadSha=b9d4fc5`，最终仍为 `verdict=not_complete`。剩余阻塞仍是 14 个人工验收 item 全部 `pending`、`acceptanceVerdict=not_evaluated`，以及外部知识库 `not_synced`。不能把 goal 标记为 complete。
- 本次“HEAD b9d4fc5 full audit 刷新”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新当前项目状态；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 2026-06-01 已增强人工验收 Review Pack：`pnpm prepare:ios-manual-review-pack -- --record <manual-evidence-record.review.json>` 现在会同时生成 `manual-evidence-review-pack.md` 和 `manual-evidence-review-pack.html`。HTML 版保留“不代表验收通过”的边界，展示 record/current HEAD、`packageFreshness`、`acceptanceVerdict`、statusCounts、逐项缺少候选证据和可点击证据路径，方便操作者打开截图、录屏、日志、JSON、xcresult 等材料逐项复核。该增强只降低人工操作成本，不会把 `pending` 或 `not_evaluated` 改成 passed。
- 本次“人工验收 HTML Review Pack”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新 iOS v1 系统能力验收清单、v1 readiness 审计和当前项目状态；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 2026-06-01 已用 HEAD `ca74628` 和局域网地址重跑当前正式证据包、Markdown / HTML Review Pack 与 full completion audit：证据包 `.tmp/ios-acceptance-evidence/current-head-final-20260601-ca74628-lan` 显示 `manifest.headSha=ca74628`，review 记录 `headSha=ca74628`、14 个 item 全部 `pending`、`acceptanceVerdict=not_evaluated`，且 `missingEvidenceCount=0`；Review Pack 已写入同目录 `manual-evidence-review-pack.md` 和 `manual-evidence-review-pack.html`。full audit `.tmp/v1-completion-audit/current-full-final-20260601-ca74628-lan` 使用 `--run-automated-commands` 后 21 个自动化命令全部 `passed`，`packageFreshness.status=current`，`recordHeadSha=ca74628`，`currentHeadSha=ca74628`，最终仍为 `verdict=not_complete`。剩余阻塞仍是 14 个人工验收 item 全部 `pending`、`acceptanceVerdict=not_evaluated`，以及外部知识库 `not_synced`。不能把 goal 标记为 complete。
- 本次“HEAD ca74628 full audit 刷新”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新当前项目状态；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 2026-06-01 已提交 `4ee284f feat(qa): 展示验收必需证据`：人工验收 Review Pack 的 Markdown / HTML 现在逐项展示“必需证据”和候选证据，避免操作者只看到已有文件路径而缺少签署依据；该增强不改变 `pending` / `not_evaluated` 的完成边界。
- 2026-06-01 已提交 `aad07e7 fix(ios): 稳定权限和通知UI门禁`：iOS 权限 UI test 可通过 `AI_CODE_UI_TEST_DISABLE_CALENDAR_PERMISSION_REQUESTS` 和 `AI_CODE_UI_TEST_DISABLE_NOTIFICATION_PERMISSION_REQUESTS` 隔离无关系统权限弹窗；本地通知调度保留 `.second`，避免“1 分钟后”类近未来提醒被截断到当前或过去分钟导致系统通知不稳定。提交前已运行 `pnpm validate:native-shells`、`pnpm validate:ios-voice-permission-ui-test`、`pnpm validate:ios-notification-ui-test` 和 `git diff --check`，均通过。
- 2026-06-01 已用 HEAD `aad07e7` 和局域网地址重跑当前正式证据包、Markdown / HTML Review Pack 与 full completion audit：证据包 `.tmp/ios-acceptance-evidence/current-head-final-20260601-aad07e7-lan` 绑定 `headSha=aad07e7`，review 记录 `acceptanceVerdict=not_evaluated`；Review Pack 已写入同目录 `manual-evidence-review-pack.md` 和 `manual-evidence-review-pack.html`。full audit `.tmp/v1-completion-audit/current-full-final-20260601-aad07e7-lan` 使用 `--run-automated-commands` 后 21 个自动化命令全部 `passed`，其中 `validate:ios-voice-permission-ui-test` 和 `validate:ios-notification-ui-test` 已在 audit 内恢复通过；`manualEvidence.missingEvidenceCount=0`、`packageFreshness.status=current`，最终仍为 `verdict=not_complete`。剩余阻塞只有 14 个人工验收 item 仍为 `pending`、`acceptanceVerdict=not_evaluated`，以及外部知识库 `not_synced`。不能把 goal 标记为 complete。
- 本次“Review Pack 必需证据展示”、“iOS 权限与通知 UI 门禁稳定化”和“HEAD aad07e7 full audit 刷新”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新当前项目状态；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 2026-06-01 已提交 `59c7bdb feat(qa): 对齐review pack文档新鲜度`：人工验收 Review Pack 的 `packageFreshness` 规则已与 completion audit 对齐，当 record HEAD 之后仅有 `docs/`、`ai-factory/memory/`、`README.md` 或 `AGENTS.md` 变更时，会显示 `current_with_docs_only_changes` 并列出 `postRecordChangedFiles`，避免“记录 audit 结果”这类文档提交让人工复核包误报 `stale`。已用 TDD 覆盖 Markdown / HTML 行为，并用 `validate:native-shells` 加护栏。
- 2026-06-01 已用 HEAD `59c7bdb` 和局域网地址重跑当前正式证据包、Markdown / HTML Review Pack 与 full completion audit：证据包 `.tmp/ios-acceptance-evidence/current-head-final-20260601-59c7bdb-lan` 绑定 `headSha=59c7bdb`，Review Pack 显示 `packageFreshness=current`；full audit `.tmp/v1-completion-audit/current-full-final-20260601-59c7bdb-lan` 使用 `--run-automated-commands` 后 21 个自动化命令全部 `passed`，`manualEvidence.missingEvidenceCount=0`、`packageFreshness.status=current`，最终仍为 `verdict=not_complete`。剩余阻塞仍是 14 个人工验收 item 全部 `pending`、`acceptanceVerdict=not_evaluated`，以及外部知识库 `not_synced`。不能把 goal 标记为 complete。
- 本次“Review Pack docs-only 新鲜度对齐”和“HEAD 59c7bdb full audit 刷新”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新当前项目状态；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 2026-06-01 已提交 `e91c303 feat(qa): 增加人工签署逐项确认`：`pnpm prepare:ios-manual-evidence-record -- --mark-passed` 现在必须显式传入完整 `--reviewed-item <item-id>` 列表，脚本会校验该列表与 `record.items[].id` 完全一致后才允许把 review 记录生成 passed filled 记录，并把 `reviewedItemIds` 写入 `operatorSignoff`。Review Pack 的 Markdown / HTML 签署命令会自动列出 14 个 item id，`validate:native-shells` 已加护栏防止该闸门回退。该能力只降低误签风险，不替代真实人工复核。
- 2026-06-01 已用 HEAD `e91c303` 和局域网地址重跑当前正式证据包、Markdown / HTML Review Pack 与 full completion audit：证据包 `.tmp/ios-acceptance-evidence/current-head-final-20260601-e91c303-lan` 绑定 `headSha=e91c303`，Review Pack 签署命令包含 `h5_address_override`、`conversation_persistence`、`navigation_surfaces`、`keyboard_input`、`voice_input`、`photo_attachment`、`file_attachment`、`pdf_text_extraction`、`local_notification`、`notification_click_backflow`、`system_calendar_write`、`system_calendar_cleanup`、`backend_fact_confirmation`、`system_sync_degradation` 14 个 `--reviewed-item`；full audit `.tmp/v1-completion-audit/current-full-final-20260601-e91c303-lan` 使用 `--run-automated-commands` 后 21 个自动化命令全部 `passed`，`manualEvidence.missingEvidenceCount=0`、`packageFreshness.status=current`，最终仍为 `verdict=not_complete`。剩余阻塞仍是 14 个人工验收 item 全部 `pending`、`acceptanceVerdict=not_evaluated`，以及外部知识库 `not_synced`。不能把 goal 标记为 complete。
- 本次“人工签署逐项确认闸门”和“HEAD e91c303 full audit 刷新”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新 iOS v1 系统能力验收清单、v1 readiness 审计和当前项目状态；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 2026-06-01 已提交 `754098e feat(qa): 支持签署确认列表文件`：`pnpm prepare:ios-manual-review-pack` 现在除 Markdown / HTML 外，会在同目录生成 `manual-evidence-reviewed-items.json`，内容为当前 record 的 14 个 item id；Review Pack 签署命令优先使用 `--reviewed-items-file <path>`，减少复制 14 个 `--reviewed-item` 参数时漏项或错项的风险。`fill-ios-manual-evidence-record` 支持从 JSON 数组、`reviewedItemIds` 对象或逐行文本读取确认列表，仍会按 record item id 完全一致规则校验。
- 2026-06-01 已用 HEAD `754098e` 和局域网地址重跑当前正式证据包、Markdown / HTML Review Pack、reviewed-items 文件与 full completion audit：证据包 `.tmp/ios-acceptance-evidence/current-head-final-20260601-754098e-lan` 绑定 `headSha=754098e`，`manual-evidence-reviewed-items.json` 包含 `h5_address_override` 到 `system_sync_degradation` 的 14 个 item id；full audit `.tmp/v1-completion-audit/current-full-final-20260601-754098e-lan` 使用 `--run-automated-commands` 后 21 个自动化命令全部 `passed`，`manualEvidence.missingEvidenceCount=0`、`packageFreshness.status=current`，最终仍为 `verdict=not_complete`。剩余阻塞仍是 14 个人工验收 item 全部 `pending`、`acceptanceVerdict=not_evaluated`，以及外部知识库 `not_synced`。不能把 goal 标记为 complete。
- 本次“签署确认列表文件”和“HEAD 754098e full audit 刷新”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新 iOS v1 系统能力验收清单、v1 readiness 审计和当前项目状态；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 2026-06-01 已提交 `a118819 feat(qa): 绑定签署确认列表HEAD`：`manual-evidence-reviewed-items.json` 现在写入 `schemaVersion`、`recordHeadSha` 和 `reviewedItemIds`；`fill-ios-manual-evidence-record` 在读取 `--reviewed-items-file` 时会校验 `recordHeadSha` 与当前人工记录 `headSha` 一致，避免操作者误用旧证据包生成的确认列表签署当前 HEAD。
- 2026-06-01 已用 HEAD `a118819` 和局域网地址重跑当前正式证据包、Markdown / HTML Review Pack、reviewed-items 文件与 full completion audit：证据包 `.tmp/ios-acceptance-evidence/current-head-final-20260601-a118819-lan` 绑定 `headSha=a118819`，`manual-evidence-reviewed-items.json` 写入 `recordHeadSha=a118819` 和 14 个 item id；full audit `.tmp/v1-completion-audit/current-full-final-20260601-a118819-lan` 使用 `--run-automated-commands` 后 21 个自动化命令全部 `passed`，`manualEvidence.missingEvidenceCount=0`、`packageFreshness.status=current`，最终仍为 `verdict=not_complete`。剩余阻塞仍是 14 个人工验收 item 全部 `pending`、`acceptanceVerdict=not_evaluated`，以及外部知识库 `not_synced`。不能把 goal 标记为 complete。
- 本次“签署确认列表 HEAD 绑定”和“HEAD a118819 full audit 刷新”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新 iOS v1 系统能力验收清单、v1 readiness 审计和当前项目状态；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 2026-06-01 已提交 `ad63244 feat(qa): 增加人工验收交接入口`：新增 `pnpm prepare:ios-manual-handoff`，会从指定或 best/latest 人工 evidence record 生成 `manual-acceptance-handoff.md`，同时刷新 Markdown / HTML Review Pack 和带 `recordHeadSha` 的 `manual-evidence-reviewed-items.json`。Handoff 集中展示当前状态、HTML 打开命令、签署 filled 记录命令、`--require-complete` 校验命令和正式 completion audit 命令；它仍只作为操作者交接入口，不会把 review 记录标记为 passed。
- 2026-06-01 已用 HEAD `ad63244` 和局域网地址重跑当前正式证据包、人工验收 Handoff 与 full completion audit：证据包 `.tmp/ios-acceptance-evidence/current-head-final-20260601-ad63244-lan` 绑定 `headSha=ad63244`，Handoff 路径为 `.tmp/ios-acceptance-evidence/current-head-final-20260601-ad63244-lan/manual-acceptance-handoff.md`；full audit `.tmp/v1-completion-audit/current-full-final-20260601-ad63244-lan` 使用 `--run-automated-commands` 后 21 个自动化命令全部 `passed`，`manualEvidence.missingEvidenceCount=0`、`packageFreshness.status=current`，最终仍为 `verdict=not_complete`。剩余阻塞仍是 14 个人工验收 item 全部 `pending`、`acceptanceVerdict=not_evaluated`，以及外部知识库 `not_synced`。不能把 goal 标记为 complete。
- 本次“人工验收 Handoff 入口”和“HEAD ad63244 full audit 刷新”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新 iOS v1 系统能力验收清单、v1 readiness 审计和当前项目状态；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 2026-06-01 已提交 `121a330 feat(qa): 生成HTML人工验收交接页`：`pnpm prepare:ios-manual-handoff` 现在除 Markdown 外会同时生成 `manual-acceptance-handoff.html`。HTML handoff 提供可点击的 HTML Review Pack 链接，并保留可从仓库根目录复制执行的签署、校验和正式 audit 命令；边界文案继续明确“本文件不代表验收通过”。
- 2026-06-01 已用 HEAD `121a330` 和局域网地址重跑当前正式证据包、Markdown / HTML Handoff 与 full completion audit：证据包 `.tmp/ios-acceptance-evidence/current-head-final-20260601-121a330-lan` 绑定 `headSha=121a330`，HTML Handoff 路径为 `.tmp/ios-acceptance-evidence/current-head-final-20260601-121a330-lan/manual-acceptance-handoff.html`；full audit `.tmp/v1-completion-audit/current-full-final-20260601-121a330-lan` 使用 `--run-automated-commands` 后 21 个自动化命令全部 `passed`，`manualEvidence.missingEvidenceCount=0`、`packageFreshness.status=current`，最终仍为 `verdict=not_complete`。剩余阻塞仍是 14 个人工验收 item 全部 `pending`、`acceptanceVerdict=not_evaluated`，以及外部知识库 `not_synced`。不能把 goal 标记为 complete。
- 本次“HTML 人工验收 Handoff”和“HEAD 121a330 full audit 刷新”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新 iOS v1 系统能力验收清单、v1 readiness 审计和当前项目状态；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 2026-06-01 已提交 `0750636 feat(qa): 增加HTML签署命令生成器`：`manual-acceptance-handoff.html` 现在包含“签署命令生成器”，会按 14 个人工验收 item 渲染逐项 checkbox，只有全部勾选并填写 `operator` / `confirmedAt` 后才生成 `pnpm prepare:ios-manual-evidence-record -- --mark-passed ... --reviewed-items-file ...` 命令。该生成器只降低人工签署漏项和误复制风险，不代表 AI 可以替代操作者复核。
- 2026-06-01 已用 HEAD `0750636` 和局域网地址重跑当前正式证据包、Markdown / HTML Handoff 与 full completion audit：证据包 `.tmp/ios-acceptance-evidence/current-head-final-20260601-0750636-lan` 绑定 `headSha=0750636`，HTML Handoff 路径为 `.tmp/ios-acceptance-evidence/current-head-final-20260601-0750636-lan/manual-acceptance-handoff.html`，包含签署命令生成器；full audit rerun `.tmp/v1-completion-audit/current-full-final-20260601-0750636-lan-rerun` 使用 `--run-automated-commands` 后 21 个自动化命令全部 `passed`，`manualEvidence.missingEvidenceCount=0`、`packageFreshness.status=current`，最终仍为 `verdict=not_complete`。首次 full audit 中 `validate:ios-navigation-ui-test` 曾因 Simulator / XCTest 偶发状态返回 65，单独重跑后通过，并已用 rerun audit 归档为自动化全绿。剩余阻塞仍是 14 个人工验收 item 全部 `pending`、`acceptanceVerdict=not_evaluated`，以及外部知识库 `not_synced`。不能把 goal 标记为 complete。
- 本次“HTML Handoff 签署命令生成器”和“HEAD 0750636 full audit 刷新”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新 iOS v1 系统能力验收清单、v1 readiness 审计和当前项目状态；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 2026-06-08 已提交 `8de7b4e feat(qa): 支持复制人工验收命令`：`manual-acceptance-handoff.html` 的固定命令块和签署命令生成器现在都有复制按钮；固定命令通过 `data-copy-text` 复制，生成命令通过 `data-copy-target="generated-sign-command"` 复制，并带 `copy-command-status` 状态反馈。该能力只减少人工操作者复制命令的摩擦，不改变逐项 checkbox、`operator`、`confirmedAt`、`manual-evidence-reviewed-items.json` HEAD 绑定和真实人工复核边界。
- 2026-06-08 已用 HEAD `8de7b4e` 和局域网地址重跑当前正式证据包、HTML Handoff 与 full completion audit：证据包 `.tmp/ios-acceptance-evidence/current-head-final-20260608-8de7b4e-lan` 绑定 `headSha=8de7b4e`，HTML Handoff 路径为 `.tmp/ios-acceptance-evidence/current-head-final-20260608-8de7b4e-lan/manual-acceptance-handoff.html`，包含命令复制按钮和签署命令生成器；full audit `.tmp/v1-completion-audit/current-full-final-20260608-8de7b4e-lan` 使用 `--run-automated-commands` 后 21 个自动化命令全部 `passed`，`manualEvidence.packageFreshness.status=current`、`recordHeadSha=8de7b4e`、`currentHeadSha=8de7b4e`，最终仍为 `verdict=not_complete`。本轮 review 记录仍是 14 个人工验收 item 全部 `pending`、`acceptanceVerdict=not_evaluated`；`manualEvidence.missingEvidenceCount=2`，剩余候选证据缺口为本地通知的“系统通知截图”和通知点击回流的“系统通知点击录屏”。不能把 goal 标记为 complete。
- 本次“HTML Handoff 命令复制”和“HEAD 8de7b4e full audit 刷新”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新 iOS v1 系统能力验收清单、v1 readiness 审计和当前项目状态；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 2026-06-08 已提交 `029fdf5 feat(qa): 聚焦通知人工补证入口`：HTML / Markdown Handoff 现在在首页展示“当前补证重点”，直接列出缺少候选证据的 item 和证据类型；如果缺口涉及 `local_notification` 或 `notification_click_backflow`，Handoff 会提供 `pnpm validate:ios-notification-ui-test`、`--attach-notification-ui-test-metadata .tmp/ios-notification-ui-test/notification-ui-test.json` 和重新生成 Handoff 的辅助命令。`prepare:ios-manual-evidence-record` 新增 `--attach-notification-ui-test-metadata`，只在 metadata `passed=true` 且 log / xcresult / video 文件都存在时，把系统通知截图和系统通知点击录屏追加到候选 `systemArtifacts`；该参数禁止和 `--mark-passed` 同用，仍保持 `pending` / `not_evaluated`。
- 2026-06-08 已用 HEAD `029fdf5` 和局域网地址重跑当前正式证据包、HTML Handoff 与 full completion audit：证据包 `.tmp/ios-acceptance-evidence/current-head-final-20260608-029fdf5-lan` 绑定 `headSha=029fdf5`，HTML Handoff 路径为 `.tmp/ios-acceptance-evidence/current-head-final-20260608-029fdf5-lan/manual-acceptance-handoff.html`，当前补证重点显示“当前没有缺少的候选证据；仍需真实操作者逐项复核后才能签署”；full audit `.tmp/v1-completion-audit/current-full-final-20260608-029fdf5-lan` 使用 `--run-automated-commands` 后 21 个自动化命令全部 `passed`，`manualEvidence.missingEvidenceCount=0`、`manualEvidence.packageFreshness.status=current`、`recordHeadSha=029fdf5`、`currentHeadSha=029fdf5`，最终仍为 `verdict=not_complete`。剩余阻塞已经收敛为 14 个人工验收 item 全部 `pending`、`acceptanceVerdict=not_evaluated`，以及外部知识库 `not_synced`。不能把 goal 标记为 complete。
- 本次“通知人工补证入口”和“HEAD 029fdf5 full audit 刷新”已更新飞书源稿 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并更新 iOS v1 系统能力验收清单、v1 readiness 审计和当前项目状态；实际飞书页面是否已更新必须以后续 `lark-cli docs +update --api-version v2` 执行记录为准。
- 飞书同步不是自动的；需要先更新 `docs/knowledge-sync/feishu-pages/` 源稿，再用 `lark-cli docs +update --api-version v2` 同步对应页面。
- 如果新窗口没有执行 Obsidian 或飞书写入，就不能声称外部知识库已经更新。

## 下一步建议

1. 用 `pnpm validate:product-smoke` 快速验证 in-memory 核心产品链路；用 `pnpm validate:product-smoke:postgres` 验证 migration + Postgres repository + 产品 API 主路径；启动 `pnpm dev:full` 后，再用 `pnpm validate:product-smoke:live` 验证当前运行中 API、Postgres 和 provider 配置。
2. 用 `pnpm validate:llm-smoke` 验证 DeepSeek/OpenAI 真实 provider 的 `chat`、`clarification`、`mixed`、只读查询和安全追问质量，必要时继续调 prompt 和 few-shot。
3. 用 `pnpm validate:ios-build` 验证 iOS 原生壳能真实编译；再结合 Xcode 模拟器或真机运行检查语音、附件、系统日历和本地通知权限弹窗。
4. 用 `pnpm validate:ios-simulator-smoke` 验证 iOS App 能安装并启动到 Simulator；再结合 Xcode 模拟器或真机运行检查语音、附件、系统日历和本地通知权限弹窗。
5. 用 `pnpm validate:ios-manual-acceptance` 检查人工验收清单完整性，并按 `docs/qa/ios-v1-system-acceptance.md` 在模拟器或真机逐项记录系统权限和系统 App 证据。
6. 用 `pnpm validate:ios-navigation-ui-test` 验证真实 Native Header / Drawer 到 H5 七页面切换；用 `pnpm validate:ios-keyboard-ui-test` 验证真实 Native 键盘输入框、系统键盘和发送按钮到 H5 / 后端提醒事实闭环；用 `pnpm validate:ios-voice-ui-test` 验证 Native 语音按钮、H5 确认卡和后端提醒事实闭环；用 `pnpm validate:ios-attachment-ui-test` 验证 Native 纸夹按钮和附件菜单选项可见；再用 `pnpm collect:ios-acceptance-evidence` 生成 iOS 辅助证据包，先确认 H5 地址、构建、安装、启动和截图证据齐全；需要集中补系统辅助材料时运行 `pnpm collect:ios-system-evidence`，需要单独补键盘输入 H5 / 后端辅助材料时运行 `pnpm collect:ios-keyboard-evidence`，需要单独补照片 / 文件 / PDF 附件 H5 / 后端辅助材料时运行 `pnpm collect:ios-attachment-evidence`，再把 `manual-checklist.todo.md`、`manual-evidence-record.template.json` 和 `manual-evidence-record.draft.json` 作为人工验收记录入口继续补真实系统能力证据。
7. 人工补证完成后，用 `node scripts/validate-ios-manual-evidence-record.mjs --record <path> --require-complete --report <report-path>` 检查补证文件并生成缺口报告，避免空模板、顶层结论未改或缺证据项被误当作完成。
8. 正式 completion audit 时，用 `pnpm collect:v1-completion-audit -- --run-automated-commands --manual-record best --manual-record-root .tmp/ios-acceptance-evidence --external-knowledge-status not_synced` 统一生成 `v1-completion-audit.json` / `.md` 和同目录 `manual-evidence-gaps.md`，把自动化门禁、自动选中的人工证据记录、`manualEvidence.selection`、`manualEvidence.packageFreshness`、补证缺口报告和外部知识库同步状态绑定到单一收尾产物；`best` 会优先选择当前 HEAD 证据，再比较 completion 状态和缺口数；如果已经明确知道补证后的 filled 记录路径，也可以把 `best` 替换为该路径；若人工记录来自旧 HEAD，audit 必须保持 `not_complete`；若已真实同步飞书或 Obsidian，改用 `synced|partial` 并补对应 evidence 参数。
9. 下一轮真实系统能力优先补：真实通知 banner / 锁屏 / 点击录屏、语音识别质量、照片 / 文件 / PDF 真实样本质量、系统 Calendar 事件详情 notes marker 人工复核，以及附件上传的真机质量与交互细节优化。
