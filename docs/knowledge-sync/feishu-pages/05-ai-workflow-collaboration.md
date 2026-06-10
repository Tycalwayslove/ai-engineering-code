# 05 工作流与 AI 协作体系

## 核心观点

AI 原生协作不是让模型无限自动执行，而是让人和 AI 在同一个可检查系统里协作。

本项目当前坚持 manual-first：

- 人触发阶段推进。
- AI 执行实现、整理、验证和记录。
- 关键阶段写入 Obsidian。
- 面向外部的成果同步到飞书。
- 架构变化需要 ADR 或约定文档承接。

## 规格驱动

功能推进前先写规格或计划，例如工厂状态面板 v1：

- 定义背景和目标。
- 明确非目标。
- 写出用户体验和数据契约。
- 写出后端边界和验收标准。

这样 AI 不会只根据上一轮聊天上下文随意实现。

## 显式注册

项目避免动态自动发现：

- Workflow 不自动扫描。
- Agent 不自动扫描。
- Prompt 不隐式注入。
- Memory 不允许任意模块直接读取。

显式注册牺牲了一点短期速度，但换来长期可解释性和可追踪性。

## UI 图到代码实现

当 UI 设计图已经确认后，项目不会直接进入页面开发，而是先启动 `ui-to-code-implementation` 工作流。

该工作流要求先明确：

- UI 来源：Figma 页面、节点、截图或本地 UI 规格。
- 设计系统来源：tokens、组件库、主题规则和图标规则。
- 产品来源：PRD、需求点记录或 design brief。
- 实现范围：本次落地哪些页面、状态和组件。
- 非目标：哪些业务能力、后端能力和集成能力暂不实现。
- 验证方式：类型检查、构建、factory validation、浏览器检查和知识同步。

这条工作流的核心价值是把“设计图”转换成“工程规格”和“实施计划”，避免 AI 直接根据视觉稿自由发挥。

当前 AI 时间管理 Agent 已经生成：

- UI 到代码工作流：`ai-factory/workflows/ui-to-code-implementation.md`
- H5 工程规格：`ai-factory/specs/engineering/2026-05-20-ai-time-management-agent-h5-ui-engineering-v0-1.md`
- H5 实施计划：`ai-factory/specs/active/2026-05-20-ai-time-management-agent-h5-ui-implementation-plan.md`

下一步会按计划实现 H5 首屏薄切片。第一版只做 UI 和演示状态，不直接接入真实 AI 解析、日程写入或 Native Bridge。

目前 H5 首屏薄切片已完成第一轮实现：

- `/` 首页展示 AI 时间管理 Agent 主界面。
- mock 数据集中在 H5 route-local `demoData.ts`。
- 深色 / 浅色主题通过 v0.7 token 系统切换。
- 固定执行状态栏保留在输入区上方。
- 真实 AI 解析、日程写入、Native Bridge 和外部日历仍未接入。

## 组件库维护工作流

组件库不是一次性资产。后续完善、调整或修复组件库时，项目使用 `component-library-maintenance` 工作流。

这条流程回答四个问题：

- 改什么：组件、token、图标、Figma 资产、示例页，还是文档。
- 为什么改：用户反馈、视觉回归、实现缺口、可访问性问题，还是设计系统演进。
- 影响哪里：shared-ui、Figma Gallery、Figma Changelog、H5 页面、主题系统、知识库记录。
- 怎么验证：组件示例页、深色 / 浅色模式、类型检查、构建、factory validation、截图或人工评审。

后续如果用户说“完善组件库”“修复组件样式”“调整主题 token”“同步 Figma 组件”，应先进入这条流程，而不是直接改代码或改 Figma。

该工作流的核心边界：

- 可复用 UI primitives、composites 和 layouts 才进入 `packages/shared-ui`。
- 产品特定组合、mock 数据和页面状态留在 app 内。
- token 修改必须说明影响主题和消费组件。
- Figma、代码、workflow run、Obsidian、飞书和 Git 提交需要形成同一条证据链。
- 不引入隐藏生成器、自动扫描或自动组件注册。

这让组件库的变化既能被设计侧看到，也能被工程侧验证，还能被后续面试讲解和项目复盘复用。

## Hybrid 布局实现

AI 时间管理 Agent 的第一段具体代码开发不是业务功能，而是先稳定 Hybrid 宿主布局。

当前实现把跨端界面拆成三层：

- Native Host Frame：由 `HybridHostShell` 表达 H5、iOS、Android 三种宿主预览，负责外框、安全区和宿主差异。
- H5 Agent Surface：由 H5 首页组合 AI 执行流、Timeline、执行状态栏和底部输入。
- Shared UI Components：由 `packages/shared-ui` 提供稳定组件，不写入业务编排。

这样做的原因是：真实 Native App 后续会提供系统能力、权限、日历接入和 Bridge，但 H5 页面不应该提前假装拥有这些能力。第一步先让页面在三类宿主下布局稳定，后续再接真实 Bridge 契约。

本阶段仍然保持非目标：

- 不创建真实 iOS / Android 工程。
- 不实现真实 Native Bridge。
- 不接真实后端。
- 不实现 AI 指令解析或日程写入。

## 原生壳启动

在用户进一步澄清后，项目补齐了真实 iOS / Android 原生壳，而不只是 H5 内部宿主预览。

当前 Native Shell 的职责非常克制：

- 启动原生 App。
- 加载 H5 产品层。
- 提供统一深色宿主背景。
- 提供加载态和错误态。
- 预留 `NativeBridge`。
- 为后续系统能力接入保留位置。

当前 Native Shell 明确不做：

- 不实现日程业务。
- 不实现 AI 指令解析。
- 不直接调用后端业务接口。
- 不直接读取工厂文档、记忆或服务边界。

这让项目的 Hybrid 架构更清楚：Native 是稳定壳和系统能力入口，H5 是产品体验和界面迭代层。后续接日历、通知、语音和图片能力前，应先写 Native Bridge 契约。

## iOS Bridge 与页面拆分

当前原生开发重心已经收敛到 iOS。Android 不再继续写运行时代码，只保留需求计划和迁移说明，避免双端同时推进导致边界漂移。

本阶段采用三层拆分。经过用户反馈后，边界进一步修正为：

- H5 页面层：负责渲染后端返回元素，例如对话消息、确认卡片、摘要列表和执行记录；同时负责接口驱动的页面内执行状态条。
- iOS 宿主层：负责 SwiftUI 壳、WKWebView、加载态、错误态、Header、底部输入、Timepage Drawer、宿主上下文和未来系统能力入口。
- Bridge 契约层：负责 H5 与 Native 的消息信封、动作类型、ACK 和错误事件。

当前 Bridge 的最小消息集：

- `h5.ready`：H5 告诉 Native 页面已准备好。
- `ui.openTimeline`：H5 请求 Native 记录或响应 Timeline 入口。
- `ui.openCalendar`：H5 请求 Native 记录或响应完整日历入口。
- `ui.openExecutionLedger`：H5 请求 Native 记录或响应执行记录入口。
- `input.voice.start`：H5 请求 Native 进入语音能力，当前 iOS 会启动 Speech 语音识别并返回 ACK。
- `input.voice.stop`：H5 请求 Native 停止语音能力，当前 iOS 会提交已识别文本并返回 ACK。
- `calendar.events.sync`：H5 将全部日程事实同步给 Native；Native 只写入 `scheduled` 日程，收到非 `scheduled` 日程时按后端 `event.id` 清理已写入的系统日历事件。
- `notifications.reminders.sync`：H5 将已确认的提醒事实同步给 Native，由 Native 调度本地通知。
- `input.keyboard.open`：H5 请求 Native 响应键盘入口；当前 iOS 会切到底部原生文本输入模式并聚焦输入框。
- `native.hostContext`：Native 向 H5 下发平台、版本、主题和安全区上下文。
- `native.viewChanged`：Native 告诉 H5 当前渲染哪一组后端元素；系统提醒通知点击时可携带 `reminderId`，H5 用它刷新、高亮对应提醒，并把高亮行滚动到视口中央。
- `native.inputRequested`：Native 告诉 H5 当前触发语音、键盘或附件输入入口。
- `native.inputSubmitted`：Native 把原生输入框文本、语音识别文本或附件元数据文本提交给 H5。
- `native.themeChanged`：Native 通知 H5 同步深色 / 浅色主题。
- `native.ack` / `native.error`：Native 返回处理结果或错误。

这条边界的原则是：H5 不拥有 App 壳层 UI，不直接访问系统能力，但页面内执行状态条归 H5，因为它由接口状态驱动；iOS 不承载产品业务状态机；后端后续负责指令解析、计划生成和日程执行。Bridge 只传递明确动作与结果，不变成隐藏业务总线。

附件资源的当前边界是：Native 负责系统照片 / 文件选择器、附件元数据和小文件内容回传；照片和 Files 中的图片会先用 iOS Vision 尝试 OCR，并把识别文本追加到 `native.inputSubmitted.payload.text`，PDF 文件会用 PDFKit 抽取页面文本，识别或抽取失败不阻断附件提交。当原始内容不超过 5MB 时，Native 会额外携带 `base64Content`，超过 5MB 时只回传元数据和可读文本。H5 根据 payload 选择资源写入入口：有 `base64Content` 时调用 `/attachments/upload`，否则调用 `/attachments/intake`，写入成功后在当前对话流里显示“本轮附件资源”摘要。附件 intake 可携带原生端或后续 OCR 已经得到的可读 `text`，后端会把它清理后放入 `attachment_summary`。后端 upload 接口接收 base64 内容，限制解码后 5MB，计算 `contentSha256`，并对文本附件抽取 UTF-8 文本；如果 H5 同时传入 Native 展示文本和可解码文本内容，后端会合并为“展示文本 + 识别文本”，避免真实票据内容被展示文案覆盖。当前只保存内容哈希、内容状态和可读文本，不保存原始二进制。当用户把附件作为费用票据处理时，Planner 可以从可读文本里提取金额和日期并生成费用草稿确认卡。附件不是 Timeline 事项，也不会在未确认时直接生成费用、日程或提醒；没有金额的票据附件仍通过 Agent 追问补字段。

会话恢复的当前边界是：后端通过 `conversation_turns` 保存用户和助手 turn，`GET /agent/conversations/{conversationId}/turns` 用于恢复 transcript；H5 启动时使用 URL 或本地存储中的稳定 `conversationId` 拉取历史。后端仍不在历史 turn 或普通 plan 读取中暴露明文 `confirmToken`，这些响应里的 token 保持 `redacted`；待确认计划恢复必须通过 `GET /agent/conversations/{conversationId}/pending-confirmations`，该接口只返回仍 `awaiting_confirmation` / `pending` 的计划，并为每个 confirmation 签发新的短期恢复 token。Postgres 只保存恢复 token hash 到 `confirmation_token_sessions`，H5 用服务端 pending 列表恢复可点击确认卡，确认或取消后该计划不再出现在 pending 列表中；本机 pending token 缓存只作为同机兜底，不能作为跨设备事实来源。

iOS 原生会话身份的边界是：Native 使用 `UserDefaults` 保存稳定 `conversation_ios_*`，并在 H5 URL 没有 `conversationId` 时追加该参数；H5 仍负责读取 URL / localStorage 并把会话 ID 带给后端。Native 不读取或改写对话历史，只保证 App 重启后 H5 能回到同一个后端会话视角。

系统能力同步错误的边界是：后端确认成功后的日程 / 提醒事实是业务结果；iOS 系统日历和本地通知只是附加同步层。`native.calendar.events.sync` 或 `native.notifications.reminders.sync` 因权限失败时，H5 应展示“后端事项已保存，系统同步未开启”，不能把整次业务执行标为 failed；语音、附件选择等输入能力失败仍按 Native 能力调用失败处理。

H5 快照刷新的边界是：日程、费用、提醒和 execution ledger 是第一版 App 的核心读模型，刷新失败应暴露为真实问题；附件列表、Agent debug、历史 turn 和待确认卡恢复是辅助快照，可以降级为空并写开发日志。辅助快照失败不能阻断 Timeline 刷新，也不能阻断 Native 日历 / 提醒同步。

会话范围业务读模型的当前边界是：Timeline、日程、费用、提醒和执行记录读取时可以带 `conversationId`，后端通过 `execution_plans -> domain_actions -> sourceActionId` 关联当前会话产生的业务事实。三类业务事实模型本身不直接持有会话上下文，避免把对话编排字段混进领域事实；H5 只传当前稳定会话 ID，不在前端猜测或过滤其他会话数据。

Agent 上下文摘要的当前边界是：LLM prompt 中的日程、费用和提醒摘要也必须按当前 `conversationId` 读取。Postgres provider 通过领域事实的 `source_action_id` 追溯到 `domain_actions` 和 `execution_plans`，并在摘要里带上 `id` / `source_action_id` 供后续工具定位；但模型仍只负责规划候选动作，不能直接改写这些事实。

SummaryMemory 的当前边界是：它记录确认执行成功后的摘要事实和后续可扩展记忆，不替代日程、费用、提醒三类领域事实表。`ExecutionCoordinator` 只在 action 成功后写入 `memory_type=domain_fact`，并把 `domain`、`actionType`、`actionId`、`planId`、`factId`、`factTitle`、`factStatus` 和执行结果写入 payload；in-memory 与 Postgres provider 只把 `domain_fact` 注入 `ContextPack.relevant_history`，避免 future preference 或其他记忆类型被误当成已确认业务事实。SummaryMemory 可以帮助 Agent 在后续对话里保持连续性，但不能成为绕过确认卡、Policy 或领域 service 的写入通道。SummaryMemory 写入失败只记录 warning 日志，不改写 plan/action/ledger 的业务执行结果；如果未来需要在 ledger 中展示这类派生记忆失败，应新增独立事件类型和迁移，而不是复用 `action_failed`。

直接 UI 行内动作的当前边界是：用户在 Timeline、日程、费用或提醒列表里显式点击完成、取消、提交或编辑时，H5/SDK 必须把当前 `conversationId` 传给后端。后端 route 必须先读取目标事实，并用 `sourceActionId` 校验它属于当前会话，再调用领域 service 改写状态或内容；缺少 `conversationId` 返回 400，跨会话目标返回 404，不写业务事实、不写 ledger、不写 SummaryMemory。direct action 成功后，`DirectActionAuditService` 会创建 `direct_plan_*` / `direct_action_*` 轻量执行记录，并写入 `direct_action_executed` ledger 与 `domain_fact` SummaryMemory。这不是 LLM 规划，也不创建 confirmation；它只记录用户已经在 UI 上明确选择的管理命令。SDK 直接变更方法以 `conversationId: string` 暴露，OpenAPI 对这些 mutation 标记 `required: true`，Postman 也按必填参数描述。AI 规划写入仍必须走确认卡、Policy、ExecutionRunner 和领域 service。

H5/SDK 可用性审计的当前边界是：默认运行态必须表现为真实 App，而不是 demo 展示页。H5 初始状态只展示真实空态和后端快照，demo fixtures 只能通过显式 `?demo=1` 开启；任何没有 `planId/confirmToken` 的确认卡都不能被当作可执行后端结果。SDK 是后端错误进入 H5 状态栏的唯一公共入口，失败响应应解析 FastAPI `{detail}`、validation detail array 和纯文本错误，避免用户只看到泛化 `400 Bad Request`。Native Bridge 的 `native.ack` 不是业务事实，但它必须收束键盘和语音等原生能力的 UI 状态；如果语音没有识别文本，H5 也不能无限停留在“正在提交”。OpenAPI 契约则必须检查 `content -> media type -> schema` 层级，新增端点必须同步到 operationId / SDK 方法一致性校验。

H5 编辑日期时间的当前边界是：业务事实仍然使用后端返回的带 offset ISO 字符串，编辑面板只在 UI 层把它转换成浏览器 `datetime-local` / `date` 控件需要的本地值。提交 PATCH 前，H5 必须把 `datetime-local` 的无时区值恢复为带 offset ISO；日程编辑用用户填写的 `timezone` 计算 offset，提醒编辑优先保留原 `dueAt` 的 offset，因为提醒事实没有独立 timezone 字段。`dateTimeInput.ts` 是这个转换边界的唯一入口，避免组件里散落 `new Date()` / `toISOString()` 导致 UTC 漂移。后端领域 service 仍负责最终日期格式、时间区间和终态保护；H5 的本地控件只改善输入体验，不替代业务校验。

产品级 smoke 验证的当前边界是：它验证第一版 App 的主业务链路是否连续可用，而不是替代所有单元测试、契约测试或真机测试。`pnpm validate:product-smoke` 使用 FastAPI TestClient、in-memory runtime 和 rule planner，在不依赖本地 LLM key 或 Postgres 的情况下模拟真实用户路径：日程追问补全、确认写入、日程直接编辑、费用确认与直接提交、提醒确认与直接完成、自然语言管理已有日程 / 费用 / 提醒的 8 个核心动作、宽泛多目标管理追问与点选、只读查询、ledger 审计、debug trace、会话历史恢复和 pending confirmations 清空。自然语言管理 smoke 使用独立会话创建提醒、费用和日程，再通过“把刚才的提醒改到明天上午十点”“完成刚才的提醒”“取消刚才的提醒”“把刚才的费用改成 88 元”“提交刚才的费用”“取消刚才的费用”“把明天的会议改到十点”“取消刚才的会议”验证 `target_id` / `expected_status` 命中、确认执行和领域状态变化；歧义 smoke 使用独立会话创建两条 scheduled 提醒、两条 draft 费用和同一天两条 scheduled 日程，断言“把提醒改到明天上午十一点”“把费用改成 99 元”“把明天的会议改到十点”“提交费用”“取消明天的会议”返回缺 `target_id` 的 `clarification_request`，且不会创建待确认计划，随后点选 quick reply 生成对应确认卡并确认执行；快捷回复候选一致性 smoke 使用独立会话创建 4 条 scheduled 提醒，验证 UI 只展示最近 3 条候选时，点击第一条展示 quick reply 会命中展示列表里的第一条 `target_id`，而不是内部全量候选的第一条。会话历史恢复会调用 `GET /agent/conversations/{conversationId}/turns`，断言用户输入、追问、确认卡和只读回答都能恢复，且历史 structured response 里的 `confirmToken` 只能是 `redacted`。待确认卡恢复也纳入 smoke：独立会话先创建待确认提醒，再通过 `GET /agent/conversations/{conversationId}/pending-confirmations` 获取恢复 token，用恢复 token 确认执行，并断言确认后 pending 列表清空。附件资源也纳入 smoke，但只覆盖稳定的 `POST /attachments/upload`、`POST /attachments/intake` 和 `GET /attachments`，并使用独立会话，避免无金额附件摘要影响主 Agent 对话路径。它应该保持快速、确定、聚焦主路径；真实 DeepSeek/OpenAI 行为、iOS 系统日历、通知权限、语音识别、照片选择器、PDFKit 和 Vision OCR 仍需要单独的 provider / Native / 真机验证。

运行中 API live smoke 的当前边界是：`pnpm validate:product-smoke:live` 复用产品级 smoke 断言，但通过真实 HTTP 连接已启动的后端，默认 base URL 是 `http://127.0.0.1:8000`，也可用 `AI_CODE_API_BASE_URL` 指向局域网或其他端口。它不启动服务、不执行 migration、不改写 `.env.local` 或 planner mode，因此验证的是当前 API 进程、Postgres 连接和 provider 配置的真实组合。live smoke 会使用唯一 `conversation_product_live_smoke_*` 会话 ID，并为自然语言管理、待确认卡恢复和附件资源使用同前缀的独立会话；主会话还会覆盖 transcript restore 和历史 token redaction。它会真实写入测试数据，所以是本地验收 / 调试入口，不应加入 `validate:factory` 这类离线门禁。后端不可达时，CLI 应输出当前 base URL 和启动 / 覆盖地址建议，而不是暴露底层网络堆栈。

H5 可点击 smoke 的当前边界是：`pnpm validate:h5-click-smoke` 验证真实 H5 页面和后端 rule API 的可点击主链路，而不是替代所有视觉回归、真机测试或 Postgres live smoke。该命令会临时启动 in-memory API 与 H5 dev server，打开 Playwright Chromium，并用 mock iOS NativeBridge 注入 `native.inputSubmitted`、点击追问 quick reply、点击确认卡、通过 `native.viewChanged` 切到 Timeline，然后覆盖日程、费用和提醒三领域的编辑弹层保存与行内终态动作：日程编辑后取消，费用编辑后提交，提醒编辑后完成，最后分别回查后端同会话状态。它证明第一版 App 的 H5 对话组件、结构化 quick reply、确认卡、页面切换、编辑弹层和行内动作能在浏览器 DOM 中工作；但它不验证真实 iOS 键盘、语音识别、系统日历权限、本地通知权限、Postgres 持久化或真实 LLM provider。由于依赖本机 Playwright Chromium 和 dev server，它作为本地可点击验收入口，不串入 `validate:factory`。

H5 到 Native 系统同步 payload 验证的当前边界是：click smoke 会读取 mock `NativeBridge.postMessage` 收集的 outbound envelopes，检查日程确认 / 编辑 / 取消后都发送 `calendar.events.sync`，且目标 event 保留 `id/title/startAt/endAt/timezone/status/sourceActionId`。其中 canceled 日程必须仍然出现在 payload 中，因为 iOS 依赖非 `scheduled` 事实删除旧的系统日历事件。提醒路径会检查确认 / 编辑后发送 scheduled reminder，并且 `dueAt` 是未来时间；完成提醒后再次发送的 `notifications.reminders.sync` 不能再包含该 reminder，因为 iOS 会先清空同前缀 pending notifications，再按当前 scheduled 列表重建。Hybrid Bridge JSON Schema 对这两类 payload 增加条件约束，防止字段契约只停留在 README。该验证仍不等同于真机授权弹窗或系统 API 成功写入，只证明 H5 发给 Native 的数据足够让 iOS 进入正确分支。

iOS 真编译门禁的当前边界是：`pnpm validate:ios-build` 只验证 `AIEngineeringCode.xcodeproj` 的 Debug simulator build 能通过，不启动 H5、不启动后端、不打开模拟器，也不验证语音识别、通知权限、系统日历授权、PhotosPicker、Vision OCR 或 PDFKit 在真机上的运行质量。命令默认使用 `generic/platform=iOS Simulator`、`CODE_SIGNING_ALLOWED=NO` 和仓库内 `.tmp/xcodebuild/AIEngineeringCode` DerivedData，目的是让门禁不依赖具体模拟器名称、不污染用户全局 DerivedData，并避开真机签名配置。它应该和 `validate:native-shells`、`validate:h5-click-smoke` 分工使用：静态门禁检查 Bridge / 文件 / mock 清理，H5 click smoke 检查浏览器可点击主链路和 Native outbound payload，iOS build smoke 检查 Swift 工程真实可编译；系统权限和端到端用户体验仍需要 Xcode 模拟器或真机手测。

iOS Simulator 运行级 smoke 的当前边界是：`pnpm validate:ios-simulator-smoke` 验证 App 能构建、安装并启动到 iPhone Simulator。它默认先运行 `validate:ios-build`，再选择 booted iPhone 优先，安装构建产物，执行 `simctl launch com.aiengineeringcode.shell`，并用 `simctl get_app_container` 证明 bundle id 和安装包正确。它不启动 H5 / API，不检查 WebView 内容是否加载成功，不验证语音、附件、通知或日历权限弹窗，也不替代真机体验测试。它的价值是补上编译门禁和人工 Run 之间的空档：bundle id 错、Info.plist 展开错、安装包缺失、Simulator 无法安装或 App 启动即失败，都能在这个 smoke 中暴露。`H5DevServerURL` 必须从 `$(H5_DEV_SERVER_URL)` 展开，确保 Xcode Build Settings、命令行和真机局域网地址覆盖使用同一入口。

iOS v1 系统能力人工验收的当前边界是：`docs/qa/ios-v1-system-acceptance.md` 记录自动 smoke 无法证明的真实系统能力，包括 H5 地址覆盖、会话持久 ID、键盘输入、语音输入、照片附件、文件附件、PDF 文本提取、本地通知、通知点击回流、系统日历写入 / 取消清理、后端事实确认和系统同步降级。`pnpm validate:ios-manual-acceptance` 只检查这份清单是否保留关键项目、证据字段和 bridge / 系统 marker；它不是手动验收本身，也不会启动模拟器、请求权限或访问系统 App。真正发布前仍需要在 Xcode 模拟器或真机上按清单逐项记录截图、录屏、bridge debug、系统通知 / 系统日历截图和后端接口摘要。这个边界避免了两种误判：把自动 smoke 当成系统权限验收，或把手动验收要求散落在聊天记录里。

iOS v1 自动证据包的当前边界是：`pnpm collect:ios-acceptance-evidence` 负责把 CLI 可以稳定采集的证据打包，包括 git 状态、本地 API / H5 可达性、构建产物 `H5DevServerURL`、iOS build、Simulator 安装启动、启动截图、Native 会话 ID 存储、Native 系统诊断摘要、同会话后端事实摘要、H5 同会话页面截图和人工验收清单形状。证据包默认写入 `.tmp/ios-acceptance-evidence/<timestamp>/`，包含 `manifest.json`、`acceptance-evidence.json`、`summary.md`、`manual-checklist.todo.md`、`manual-evidence-record.template.json`、`manual-evidence-record.draft.json`、`simulator-launch.png` 和 `h5-surfaces/*.png`。manifest 必须声明 `acceptanceVerdict=not_evaluated`、`manualAcceptanceRequired=true`、`automationCanReplaceManualAcceptance=false`，因此它只能作为人工验收的辅助材料，不能替代语音、照片 / 文件、PDF、本地通知、通知点击回流、系统日历取消清理和权限拒绝降级的真实操作留证。对于会话持久 ID，采集器会读取 Simulator data container 中 `Library/Preferences/com.aiengineeringcode.shell.plist` 的 `ai-code.native.conversationId`，并在 `simctl terminate` / `simctl launch` 前后比对 `beforeRelaunch` 与 `afterRelaunch`；这证明 Native 存储层没有重建会话 ID。对于显式验收事实种子，只有设置 `AI_CODE_IOS_ACCEPTANCE_SEED_FACTS=1` 或传入 `--seed-acceptance-facts` 时，采集器才会用当前 Native conversationId 通过真实 `/agent/turns` 和 `/execution-plans/{id}/confirm` 流写入日程、费用和提醒各一条；结果写入 `acceptanceFactSeed`，包含 `seedRunId`、`seedNow`、输入文本、planId 和 actionType。默认不 seed，避免普通采集污染持久会话；seed 只作为后端事实和系统同步的辅助证据，不改变 manifest 的人工验收边界。对于 H5 同会话页面截图，采集器会打开 `?native=ios&bridgeDebug=1&conversationId=...`，通过 `native.viewChanged` 依次切到对话、Timeline、日程、费用、提醒、执行记录和设置页面并截图；这证明同一个会话下的用户可见读模型能被 H5 渲染，但不证明真实 iOS 系统控件或系统 App 能力。对于 Native 系统诊断，iOS 会把通知权限、pending reminder notification 数量、pending identifiers、日历权限和本地 EventKit identifier 计数写入 `ai-code.native.systemDiagnostics`；采集器会把这些字段写入 `ios.systemDiagnostics` 和 summary。该诊断可以证明“通知已进入 iOS pending notification 层”“日程已进入 EventKit 标识符追踪层”等系统状态，但不会证明用户肉眼看到权限弹窗、系统通知或 Calendar App UI；系统日历取消清理仍必须另行人工或专门采证。对于后端事实确认，采集器会用同一个 conversationId 查询日程、提醒、费用、执行记录和会话 turns，并把数量、预览和 curl 命令写入 `backendFactSnapshot`；这证明后端读模型可查，但不能替代真实设备上的页面操作留证。`manual-checklist.todo.md` 会为会话持久 ID、键盘、语音、附件、PDF、通知、系统日历、后端事实确认和系统同步降级生成逐项 `record_id`、`bridge_marker`、`api_summary`、`screenshot` 和 `system_artifact` 提示；`manual-evidence-record.template.json` 则为每项生成稳定 `id`、`status=pending`、允许状态 `passed/failed/blocked`、所需证据字段和空证据占位；`manual-evidence-record.draft.json` 在同样保持 `pending` 和 `not_evaluated` 的前提下，只把自动辅助信号写入 `evidence.operatorNotes`，帮助人工少翻文件。这些提示、模板和草稿都是补证入口，不是完成证据。推荐流程是先生成证据包确认 App 能加载，再按 draft 逐项补人工证据，最后在 completion audit 中读取每项状态和证据路径。

`pnpm collect:ios-system-evidence` 是上述自动证据包的系统辅助证据快捷入口，等价于 `collect:ios-acceptance-evidence --seed-supported-system-evidence`；也可以用 `AI_CODE_IOS_ACCEPTANCE_SEED_SUPPORTED_SYSTEM_EVIDENCE=1` 启用同一批量 opt-in 行为。它同时启用验收事实种子、系统 Calendar App 截图、系统日历取消清理、日历权限拒绝降级、通知点击回流和通知 delivered 诊断，适合在一次采证中集中准备所有已支持的系统辅助材料。该开关可能创建 / 取消 seed 事项、撤销并恢复日历权限，以及等待短提醒到期；它只减少执行成本，不改变人工验收和 completion audit 的边界。

iOS 人工验收记录校验器的当前边界是：`pnpm validate:ios-manual-evidence-record` 先验证 validator 单元测试，再生成 dry-run 证据包并校验 `manual-evidence-record.template.json` 的结构，因此它证明“模板可以被机器读取和校验”。真正完成验收时必须传入补证后的记录文件并开启 completion 模式：`node scripts/validate-ios-manual-evidence-record.mjs --record <path> --require-complete --report <report-path>`。该模式要求整体 `acceptanceVerdict=passed`、每个必验项 `status=passed`，并且每个非空的 `requiredEvidence` 类别都能在 `evidence` 中找到对应截图、录屏、接口摘要、bridge marker 或系统证据。`--report` 会额外生成 Markdown 缺口报告，列出未完成项目、当前状态、blocker 和缺少的证据类别，便于人工继续补证。它不会替代人工执行，也不会判断截图内容真假；它负责阻止空模板、`pending` 项、缺 API 摘要或缺系统截图的记录进入最终完成结论。

iOS 原生输入控件可访问性标识的当前边界是：Native composer 必须保留稳定 accessibility identifiers，作为后续 Simulator / XCUITest / 可访问性半自动采证的锚点。当前固定标识为 `ai-code.composer.attachment-button`、`ai-code.composer.keyboard-text-field`、`ai-code.composer.submit-button`、`ai-code.composer.voice-button` 和 `ai-code.composer.mode-toggle-button`。`validate:native-shells` 会防止这些标识丢失。它们只解决“如何稳定定位真实原生控件”的问题，不证明语音识别质量、PhotosPicker / fileImporter 体验、系统通知投递或 EventKit 写入成功；这些仍按 iOS 人工验收清单留证。

H5 Bridge Debug 入站来源摘要的当前边界是：调试面板可以展示最近一条 Native 入站消息的可读来源，例如消息类型、`source`、`inputKind`、附件名、view 或 ack 类型，用于人工验收截图和排查原生输入是否真正进入 H5 Bridge。它不改变业务执行路径，也不替代后端 `DecisionTrace`；附件场景只展示附件名等元数据，不展示 `base64Content` 或原始文件内容。键盘、语音、照片 / 文件和 PDF 的真实系统体验仍需要按 iOS 人工验收清单留证。

真实 LLM provider smoke 的当前边界是：`pnpm validate:llm-smoke` 验证 DeepSeek / OpenAI provider 在真实 API 调用下能否通过后端对话路由主路径，而不是替代规则 planner 产品 smoke 或 Postgres 持久化 smoke。该命令会读取 `.env.local` 里的 provider key，但默认锁定 in-memory runtime，避免本机 `DATABASE_URL` 把 provider 验证污染成数据库验证；只有显式设置 `AI_CODE_LLM_SMOKE_USE_DATABASE=1` 时才允许使用数据库。smoke 覆盖 `chat`、`clarification`、`mixed`、只读查询结构化组件和宽泛管理请求的 safety clarification。provider adapter 仍只返回模型文本，后端继续负责 schema 解析、Policy、目标 guard、确认卡和领域 service。`AI_PLANNER_REQUEST_TIMEOUT_SECONDS` 用于控制真实 provider 请求上限，避免验收命令无界挂起。

LLM provider 调用观测的当前边界是：后端可以把真实 provider 调用摘要写入 `DecisionTrace.llm_call` 并通过 debug 接口 / H5 设置页展示，但这仍然是调试信息，不是业务事实，也不参与 planner 决策。默认字段只包含 provider、model、mode、status、durationMs、prompt/response 字符数和 `promptSha256`，用于定位慢响应和关联日志；provider 调用失败并触发 rule fallback 时，也会保留 `status=failed`、`errorType`、耗时和 prompt hash，避免 debug 里只看到 fallback reason 而看不到 provider 失败本身。完整 prompt / response preview 默认不进入 trace。只有显式开启 `AI_PLANNER_TRACE_PROMPT=1` 或 `AI_PLANNER_TRACE_RESPONSE=1` 时，debug 快照才携带原文 preview；调试结束后应关闭，避免用户输入、上下文摘要或待确认计划长期保存在 trace 中。日志开关 `AI_PLANNER_LOG_PROMPT` / `AI_PLANNER_LOG_RESPONSE` 只影响服务日志，trace 开关只影响 debug 快照，二者边界保持分离。

Postgres 产品级 smoke 的当前边界是：`pnpm validate:product-smoke:postgres` 验证 migration、Postgres repository 和产品 API 主路径在真实数据库中的一致性，而不是替代离线 in-memory smoke 或运行中 API live smoke。该命令会检测本地 Postgres、执行 migration runner，然后用 TestClient 在同一进程里走完整产品 smoke；它不调用真实 LLM，也不启动外部 API 服务。默认离线 `pnpm validate:product-smoke` 必须强制 `DATABASE_URL=""`，保持快速、确定、无数据库依赖；Postgres smoke 则真实写入 `conversation_product_smoke_*` 测试数据，不串入 `validate:factory`。Postgres 读模型需要把 `timestamptz` 按业务事实 timezone 输出为带 offset ISO，避免 H5 和 Native 同步层看到 UTC 漂移；smoke 断言也不能依赖 repository 的排序细节，应按业务目标或 structured quick reply value 定位事项。

自然语言管理已有事项的当前边界是：用户可以说“取消刚才的提醒”“完成刚才的提醒”“把刚才的提醒改到明天上午十点”“提交刚才的费用”“取消刚才的费用”“把刚才的费用改成 88 元”“取消明天的会议”“把明天的会议改到十点”。Planner 只生成候选 action；真实 `target_id` 必须来自当前会话的领域摘要，并随 payload 写入 `expected_status` 与 `resolution_reason`。规则路径在目标不唯一时必须先追问：多条 `scheduled` 提醒、多条 `draft` 费用，或同一天多条 `scheduled` 日程命中宽泛管理请求时，返回缺 `target_id` 的 clarification，不创建确认计划；“刚才 / 刚刚”近指仍可按当前会话最近可操作目标生成确认卡。目标歧义追问会保存 pending clarification，用户点击 quick reply 或回复“第一个 / 第二个 / 第三个”后，后端会解析 `candidate_target_ids` 并生成对应管理确认卡；quick replies 与 `candidate_target_ids` 必须来自同一个展示候选集合，当前最多展示最近 3 条，避免用户点选展示项后命中未展示的历史目标。API 保留 `quickReplies` 兼容旧客户端，同时新增 `quickReplyOptions: [{label, value}]`；普通补时间 / 补金额场景中 `label=value`，目标选择场景中 `value` 是稳定 `target_id`。H5 展示 `label`、点击把 `value` 作为 `/agent/turns.input`，并把 `label` 作为 `/agent/turns.displayInput`；后端规划仍使用真实 `input`，会话历史 `inputText` / `summary` 使用 `displayInput` 恢复自然 transcript，`rawContent.submittedInput` 保留内部稳定值用于审计。因此重复展示文案不会再靠文本 `index()` 误选目标，也不会在即时气泡或刷新后的历史里把 `target_id` 暴露给用户。如果原请求是更新类动作，pending payload 会保留金额、提醒时间或日程时间 patch，选择目标后继续带入确认卡。确认执行仍然由用户显式点击确认触发。LLM 路径也必须遵守同一边界：system prompt 要求多目标时返回 `clarification`，`llm_first` 会在调用模型前采用 rule safety precheck，`ManagementTargetValidator` 还会在确认卡生成前统一拦截合法但武断的 `target_id` 猜测。PolicyEngine 先做工具白名单和 payload schema 校验，`ManagementTargetValidator` 再确认 `target_id` 存在于当前会话对应领域摘要、`expected_status` 与当前真实状态一致，并判断当前输入是否宽泛且存在多个同状态可操作目标；跨会话目标、状态过期目标或多目标猜测都会在确认卡生成前转成安全追问。ExecutionRunner 再调用领域 service，最终状态转换仍由日程 / 费用 / 提醒领域层保护。OpenAPI、shared-types、H5 契约和 Postman 都需要同步这 8 个 action type，避免模型能规划但前端或调试工具不能识别。v1 覆盖范围限定为当前会话内已有日程、费用和提醒的 8 个管理动作；不支持跨会话目标、批量修改、模糊多目标自动执行或绕过确认直接写入。

自然语言只读查询的当前边界是：用户可以问“明天我有什么安排？”“明天有什么提醒？”“明天有什么日程？”“昨天有哪些费用？”这类问题。后端基于当前会话的日程、提醒和费用摘要组织 `assistant_message`，并附带 `summary-list` 结构化元素供 H5 渲染为列表；泛化“安排”合并日程和提醒，专问“日程 / 提醒 / 费用”时按领域过滤，费用可按相对日期过滤。这不是执行动作，不进入 ToolCatalog，不生成确认卡，不写业务事实；因此它和“取消 / 修改 / 提交”类管理动作保持分层，避免把只读问答误建模成需要确认的计划。

LLM/DeepSeek 对话路由的当前边界是：system prompt 用合约测试固定四条路径，闲聊返回 `chat`，缺字段事项返回 `clarification`，已有事项查询返回只读 `chat`，自然回应加可执行意图返回 `mixed`。只读 `chat` 可以附带 `structured_elements`，当前用于把 `summary-list` 透传给 H5 渲染为对话内列表组件；这仍然不是执行动作，不创建计划、不写 ledger、不要求确认。模型只能使用 `tool_catalog` 中出现的 `action_type`；`tool_catalog` 每项是 JSON 工具合约，包含 `required` 和 `properties`，模型生成 payload 前必须读取这些约束。`ContextRedactor` 会裁剪普通上下文，但不会裁剪 `tool_catalog`，避免工具数量增长后模型只看到部分 action schema。所有写入类动作都是候选计划，不能声称已经创建、修改、同步或提醒；已有事项管理类动作还必须在多个可操作目标时追问 `target_id`，不能替用户猜测。即使模型输出矛盾内容，后端也保持兜底：`chat` 携带 actions 不会生成计划，未知 action 会被 Policy 拦截为安全追问，clarification 才会保存 pending item，合法但武断的多目标 `target_id` 也会被 `ManagementTargetValidator` 转为追问。Policy 不只依赖模型填写的 `missing_fields`，还会按 ToolCatalog 的 `input_schema.required` 校验 payload，缺少必填字段时先追问；同时读取 `input_schema.properties` 做轻量字段类型校验，例如费用 `amount` 必须是 JSON number、更新 `patch` 必须是 JSON object，并递归校验 update patch 内层字段，例如 `patch.amount` 必须是 number、`patch.dueAt` 必须是 string。Policy 不禁止额外元数据，避免误伤附件和目标解析来源字段；更深的日期格式、状态流转和业务合法性仍由领域 service 兜底。调试侧 `DecisionTrace.tools_considered` 仍归一展示 action type，避免把整段工具合约暴露成难读的调试列表。`chat`、纯 `clarification` 和无候选动作也会写入非执行类 `DecisionTrace`，因此 debug 不再只覆盖确认计划；用户排查“为什么只是闲聊 / 为什么追问 / 为什么没有识别成动作”时，也能看到 planner mode、工具目录、缺失字段和 fallback 信息。

LLM-first 确定性护栏的当前边界是：真实 provider 用于理解更自然的表达、闲聊、追问和 mixed 回复，但核心业务事实不能依赖模型随机重算。`LlmFirstPlanningEngine` 会先运行 rule planner；如果 rule 已经能生成单个确定性创建 / 管理动作，例如显式日程创建、提醒创建、费用草稿创建，或当前会话内单目标更新 / 完成 / 取消 / 提交，就直接返回 `rule_safety_deterministic:*` 结果，避免 DeepSeek/OpenAI 把“明天上午九点”“昨天 58 元”“把明天会议改到十点”等核心时间、金额或 patch 算偏。多目标管理仍优先转为 `target_id` 追问；包含 `顺便` 或情绪表达的 mixed 输入不走该护栏，继续交给 LLM 保留自然回复。这个护栏不是回到纯硬解析，而是把“模型理解”和“业务事实归一化”分层：模型负责扩展语义入口，rule 负责已知高确定性事实的稳定落点。

相对时间解释的当前边界是：`clientContext.now` 可以是浏览器 `toISOString()` 产生的 UTC 字符串，也可以是带本地 offset 的 ISO 字符串；业务解释必须以 `clientContext.timezone` 为准。后端在计算“今天 / 明天 / 后天”“上午 / 下午 / 晚上”以及自然语言管理 patch 前，需要先把 `now` 转成 `ZoneInfo(timezone)`，再 replace hour/minute。否则真实 iOS/H5 运行态会把“明天上午十点提醒我带电脑”落到 UTC 十点，并在 H5 中显示成北京时间 18:00。v1 的稳定边界是：传输时区不等于业务时区，所有用户可见相对时间都以客户端声明的 timezone 解释；Postgres 或 H5 展示再按事实 ISO offset 渲染。

多 provider 输出解析的当前边界是：provider adapter 只负责调用模型并返回文本，`LlmPlanningEngine` 负责把文本解析为统一 planner payload。解析层可以兼容标准 Markdown JSON 代码块，解决 Claude、OpenRouter 或其它 provider 偶发 fenced JSON 输出的问题；但它不会把普通自然语言或非 JSON 文本猜成计划，非 JSON 仍降级为 `*-invalid-response` 的 `assistant_message`。因此 provider 兼容只发生在格式剥壳层，安全边界仍由 schema 校验、Policy、ManagementTargetValidator、确认卡和领域 service 共同承担。

PendingClarification 的当前边界是：pending item 是多轮补字段的暂存状态，不是业务事实。补全成功后才会重新生成候选 action，并继续走确认卡、Policy 和 ExecutionRunner。日程 pending 支持中文/英文日期 hint 和 ISO 日期，提醒 pending 支持缺 `due_at` 的时间补全，费用 pending 支持缺 `amount` 的金额补全；管理目标 pending 支持从 quick replies、`quickReplyOptions.value` 或“第一个 / 第二个 / 第三个”中选择 `target_id`，并生成提交 / 取消 / 完成 / 更新类管理确认卡。管理目标 pending 的 `candidate_target_ids` 必须与实际展示的 quick replies 同源同序，当前最多保留最近 3 个展示目标；debug pending 会派生展示 `quickReplyOptions` 方便排查。更新类 pending 会保留原始 patch：费用金额、提醒 `dueAt`、日程 `startAt`，日程选择具体目标后再按该目标原时长补齐 `endAt`。如果用户补充内容不能解析为当前 pending 所需字段，系统不会强行套用上一轮 pending，而是让新的输入回到正常 planner 路径。

Agent 调试信息的当前边界是：后端只提供只读 debug 快照，H5 设置页只展示 planner mode、fallback reason、工具选择、缺失字段、打开的追问和事件数量等摘要字段。完整 prompt、完整 LLM response 和 API key 不进入默认 UI；需要进一步排查时，仍通过后端日志和显式环境变量控制。

v1 readiness 审计的当前边界是：自动化主路径通过不等于原生系统能力发布完成。`docs/qa/v1-readiness-audit.md` 作为当前收口判定来源，要求区分后端 / H5 / 契约 / LLM provider / iOS build / simulator smoke 这类自动化证据，和语音识别、照片 / 文件选择、PDF 文本提取、本地通知、通知点击回流、系统日历写入 / 删除这类必须人工留证的系统能力。`pnpm validate:v1-readiness` 只检查审计资产和完成门槛不丢失；它不能替代 `docs/qa/ios-v1-system-acceptance.md` 的真实模拟器或真机验收。因此在人工证据缺失前，Goal 必须保持 active，最终回复也必须明确外部知识库是否真实同步。

iOS 自动证据包的当前边界是：采集器可以在显式 opt-in 下创建三领域 seed，并进一步取消刚创建的 seed 日程来形成系统日历取消清理辅助证据。`calendarCleanupSeed.available=true` 的含义限定为：seed 日程先通过真实 Agent 确认流写入后端，Native 诊断在取消前能看到目标 event 对应的 EventKit identifier，且 `preCancelDiagnosticsFresh=true` 证明诊断来自本轮采证而不是旧 plist；后端 cancel 后 H5 / Native 会继续轮询 canceled event 的系统清理结果，直到取消后 identifier 不再存在、`postCancelRemovedEventIdPresent=true` 且 `calendar.removedEventIds` 包含目标 event id。采集器还会记录 `h5NativeTargetMarkerFound` 和 `ios.h5DevServerTargetMarkerFound`，分别防止默认 H5 地址和 App 包 `H5DevServerURL` 被其他 dev server 或错误地址污染但 HTTP 200 被误判为当前 H5。`calendarCleanupSeed.systemCalendarAppScreenshots` 会在取消前和取消后分别用 `calshow:` 打开系统 Calendar 日期页并截图，作为 EventKit identifier diagnostics 之外的 UI 辅助材料；`calshow:` 只能打开日期视图，机器不判断事件标题是否肉眼可见或已消失。H5 页面截图失败时会保存 `h5-surface-error.png` 和 `h5-surface-error.html` 便于追空白页、错误页或 hydration 问题。它仍然只是辅助证据，不等价于用户在系统日历 App 中亲眼看到事件出现和消失；manifest 必须继续保留 `acceptanceVerdict=not_evaluated`、`manualAcceptanceRequired=true` 和 `automationCanReplaceManualAcceptance=false`。

系统同步降级的当前边界是：采集器可以在显式 opt-in 下对目标 Simulator 撤销日历权限，创建 seed 日程，并证明后端事实仍写入、Native 诊断记录 `calendar.authorizationStatus=denied`、`calendar.lastSyncStatus=failed` 和日历权限错误原因。该证据说明“业务事实写入”和“系统 App 同步”已经分层，权限拒绝不会污染业务成功状态；但它仍不替代用户亲眼看到权限弹窗、H5 状态栏文案和真机系统设置状态。当前 `simctl privacy` 不支持通知权限，因此通知拒绝继续保留为人工验收项。

通知点击回流辅助证据的当前边界是：采集器可以在显式 opt-in 下创建 seed 提醒，刷新 Native 后确认目标 `ai-code.reminder.{reminderId}` 出现在 `notifications.pendingReminderIds`，再向 H5 注入同形态 synthetic `native.viewChanged`，验证提醒页打开、状态文案为“已从系统通知打开提醒”，并且目标提醒行被 `data-highlighted-summary-item="true"` 标记。`notificationClickBackflow.supportingOnly=true` 的含义是：这只证明 pending local notification 与 H5 回流处理两段链路，不证明系统通知真实展示、锁屏 / 后台点击或用户实际点击通知。真实通知点击仍必须按 iOS 人工验收清单保留截图或录屏。

本地通知 delivered 诊断辅助证据的当前边界是：采集器可以在显式 opt-in 下创建“2 分钟后”的 seed 提醒，先轮询确认目标 `ai-code.reminder.{reminderId}` 进入 `notifications.pendingReminderIds`，再等待到期和缓冲时间，最后轮询 `notifications.deliveredReminderIds`，确认系统通知中心 delivered diagnostics 包含目标 identifier。Native reminder sync 不应清理已 delivered 的 `ai-code.reminder.*` 通知，否则重启或刷新会擦掉用户可见的通知历史，也会破坏验收证据。`notificationDelivery.supportingOnly=true` 的含义是：这只证明系统 delivered diagnostics 层已出现目标通知，不证明 banner、锁屏、声音、badge 或用户真实点击；这些仍必须按 iOS 人工验收清单保留截图或录屏。

自动采证稳定性的当前边界是：采集器可以对本地 API 的瞬时连接错误做有限重试，避免 `ECONNRESET`、`ECONNREFUSED`、`EPIPE`、`ETIMEDOUT` 或 `UND_ERR_SOCKET` 这类本机联调抖动直接中断整包证据；但它不会吞掉非瞬时错误，也不会把某个辅助项失败改写为通过。2026-05-29 的 live 证据包显示通知点击回流和通知 delivered 诊断已经能穿过重试与轮询路径，但系统日历取消清理仍可能因为 Simulator 权限或 EventKit 同步诊断未出现而不可用。此时正确处理方式是把失败原因写入证据包和当前状态，而不是把自动采证结果等同于人工验收完成。

Calendar 写入类辅助证据的当前边界是：系统 Calendar App 截图和系统日历取消清理依赖 EventKit 写入能力，因此采集器在这些步骤前会通过 `simctl privacy grant calendar` 对目标 Simulator 做预授权并 relaunch App，避免上一轮权限拒绝采证留下的 TCC 状态污染后续 seed 写入。权限拒绝降级证据仍必须在 cleanup 之后单独 revoke 并验证 Native 返回日历权限错误。不同 iOS / Simulator 组合中 `EKAuthorizationStatus` 可能显示为 `denied`，也可能在 Native 同步失败时仍显示 `authorized`；因此权限拒绝辅助证据以 `calendar.lastSyncStatus=failed` 和 Native “日历权限”错误原因为准，而不是把某个授权状态字符串当作唯一事实。

人工复核 review 记录的当前边界是：`manual-evidence-record.review.json` 可以把自动辅助材料客观映射到 `screenshots`、`apiSummaries`、`bridgeMarkers` 和 `systemArtifacts` 字段，减少人工复核前的复制整理成本；但它必须保持所有 item 为 `pending`，并保持 `acceptanceVerdict=not_evaluated`。只有人工真正复核截图、录屏、接口摘要、系统 App 状态和 Bridge marker 后，才允许把对应 item 改为 `passed`、`failed` 或 `blocked`。review 不是 completion audit，它只是把“证据在哪里”整理清楚。

短时间提醒的当前边界是：规则解析器可以把“2 分钟后提醒我喝水”“半小时后提醒我喝水”这类输入解释为相对 `clientContext.now` 的提醒创建候选，并继续走确认卡、Policy 和领域 service。它用于补真实本地通知验收窗口，也改善真实用户的短提醒体验。H5 提醒列表为了保持扫描密度仍默认展示最近 6 条，但当 Native 通知点击携带 `reminderId` 时，focused reminder 必须被强制纳入渲染列表并高亮，不能被最近项裁剪丢掉。采集器读 Native pending notification 诊断时要轮询目标 identifier，因为 seed 确认、H5 刷新、Native 同步和 plist 写入是异步链路。

当前可交互 mock 版的协作方式是：

- iOS 负责真实点击、Drawer、主题切换和原生输入。
- H5 负责把原生输入转换成 mock 后端元素，并展示对话、确认卡片、执行状态和记录变化。
- 这只是前端交互闭环，不代表真实后端解析或日历写入已经完成。

## v1.0 整体迭代执行方式

在用户确认希望第一版成为“功能完善的初版 App”后，项目采用了一次性确认迭代计划的方式推进，而不是每补一个小功能都重新确认。

本次 v1.0 迭代把工作拆成四个边界：

- 后端领域闭环：补齐提醒，与已完成的日程、费用一起形成三领域写入链路。
- H5 页面体系：对话、Timeline、日程、费用、提醒、执行记录、设置全部可展示，有空状态和数据态。
- Native App 壳：Header、Drawer、键盘、原生语音识别、系统日历同步、提醒本地通知、真实照片 / 文件选择入口都能点击，并通过 Bridge 驱动 H5。
- 阶段记录与验证：通过后端测试、类型检查、契约检查、Native shell 检查、factory/context 检查和浏览器页面检查。

这次协作方式的价值是：用户先确认一整个迭代边界，AI 在边界内自主执行、测试和记录，减少反复等待确认；但所有真实写入仍然保留确认卡、幂等执行和测试覆盖，不把速度建立在隐式修改业务事实上。

## 阶段记录

每个阶段完成后沉淀三类内容：

- Obsidian：过程、判断、问题和下一步。
- 飞书：可对外展示的成果叙事。
- 仓库：长期有效的规则、规格和源稿。

## 后续演进

下一步可以逐步加入：

- 工作流注册表的最小运行时。
- 记忆加载接口和 repository 层。
- 更严格的 OpenAPI 校验。
- Admin 工作台中的 workflow / memory / spec 状态视图。

但这些能力都应该由真实使用压力推动，而不是提前堆砌。

## 新窗口上下文恢复

2026-05-23 的全链路开发暴露了一个协作问题：新的 Codex 窗口不会自动继承旧窗口对话，也不会自动更新 Obsidian 或飞书。如果项目进展只留在聊天里，下一次打开窗口时 AI 很容易回到旧状态。

因此项目新增固定启动协议：

- 新窗口先读 `AGENTS.md`。
- 再读 `ai-factory/memory/index.md` 和 `ai-factory/memory/working/active-context/current-project-state.md`。
- 涉及代码、服务、数据库或调试时，先看 `git status --short --branch` 和最近提交。
- 阶段结束必须更新 `current-project-state.md`。
- Obsidian 和飞书不是自动同步；只有实际写入后才能说“已同步”。

这个协议把“上下文恢复”从对话默契变成仓库规则。它不会让运行时代码自动加载 AI 工厂文档，但会让协作 Agent 在新窗口中先读取明确的项目状态，从而减少重复解释、旧判断和知识库漏同步。

## 上下文同步检查

项目新增 `pnpm validate:context-sync` 作为本地检查命令。它不负责写入 Obsidian 或飞书，只检查仓库内的当前状态、记忆索引、阶段决策和飞书页面源稿是否保留必要同步声明。

外部知识库不是自动同步。阶段结束后，如果只更新了仓库源稿而没有实际执行 Obsidian 或飞书写入，最终说明必须明确“仓库已更新，外部知识库未同步”。

## iOS 键盘输入辅助证据采集

2026-05-29 的补证推进新增了 `pnpm collect:ios-keyboard-evidence`。它通过 `--seed-keyboard-input` 向当前 Native 会话注入同形态 `native.inputSubmitted`，使用 `source=native.composer.keyboard` 走 H5、后端确认卡、确认执行和 `/reminders` 读模型闭环，并把截图、reminder id 和 bridge marker 预填进 `manual-evidence-record.review.json` 的 `keyboard_input` 项。

这项能力的协作边界是：

- 自动脚本负责整理 H5 / 后端处理原生键盘来源输入的候选证据。
- 采集器会在后端 `/reminders` 找到本轮 `reminderId` 后，把该 `reminderId` 随 `native.viewChanged` 传回 H5 reminders 视图，复用 H5 高亮 / 滚动逻辑把目标提醒展示出来再截图。
- 在脏会话里可能残留旧确认卡，因此键盘辅助采集必须只点击包含当前 `seedRunId` 的确认卡，不能使用全局最后一个“确认”按钮。
- `nativeKeyboardInput.backendBridgeAvailable` 只表示 `source=native.composer.keyboard` bridge marker、H5 确认卡和后端 `/reminders` 的 `reminderId` 已形成闭环；`nativeKeyboardInput.available` 仍要求 `h5ReminderVisible=true` 且无错误，避免把没有展示目标提醒的截图预填为通过候选。
- 人工验收仍负责真实 Native 输入框获得焦点、系统键盘弹出、用户实际输入和点击发送的截图或录屏。
- review 文件仍保持 `status=pending` 和 `acceptanceVerdict=not_evaluated`，不能把候选证据自动改成通过。

这延续了当前 iOS 验收策略：尽量把可客观采集的材料自动整理到结构化记录里，但不让自动化越过真实系统能力验收边界。

2026-05-31 的采证稳定性修复还给 service health 和 H5 document `curl` 增加了 `--max-time` 超时参数。它解决的是本地 H5 dev server 端口半开或页面请求无响应时，`collect:ios-acceptance-evidence` 可能无限挂起的问题；超时失败会进入证据包命令结果和后续缺口报告，而不是让 goal 收尾停在无输出进程里。

同一轮也把费用验收事实 seed 从“报销”语义改成“新建费用草稿”语义。原因是在长期脏会话里，真实 LLM 可能根据已有费用草稿把“报销”理解为提交某条草稿，进而追问 `target_id`；自动采证需要稳定创建新的费用草稿，所以 seed 文案固定为“新建一条昨天打车费 58 元的费用草稿，备注 seed 验收”。

## iOS 附件输入辅助证据采集

2026-05-29 的补证推进新增了 `pnpm collect:ios-attachment-evidence`。它通过 `--seed-attachment-inputs` 向当前 Native 会话注入同形态 `native.inputSubmitted` 附件消息，覆盖照片、文件和 PDF 三类来源，走 H5 `/attachments/upload`、附件摘要卡和 `/attachments` 读模型闭环，并把截图、后端 attachment id 和 source marker 预填进 `manual-evidence-record.review.json` 的 `photo_attachment`、`file_attachment`、`pdf_text_extraction` 项。

这项能力的协作边界是：

- 自动脚本负责整理 H5 / 后端处理 Native 附件 payload 的候选证据。
- 人工验收仍负责真实 PhotosPicker、fileImporter、系统权限弹窗、安全作用域文件读取、Vision OCR 和 PDFKit 抽取质量的截图或录屏。
- review 文件仍保持 `status=pending` 和 `acceptanceVerdict=not_evaluated`，不能把候选证据自动改成通过。

这让 iOS 附件验收从“所有证据都靠手工复制”变成“系统选择器和抽取质量由人复核，H5 / 后端链路由自动证据包辅助整理”。

## iOS 原生键盘 UI test 门禁

2026-05-29 的补证推进新增并升级了 `pnpm validate:ios-keyboard-ui-test`。它通过 Xcode UI test 真实点击 Native composer 的 mode toggle、TextField、系统键盘和发送按钮，在 H5 Bridge Debug 中断言 `source=native.composer.keyboard` 与提交文本；随后继续点击 H5 确认卡，并断言确认完成后能看到 `已创建提醒`、`scheduled` 和“带电脑”提醒事实。

这项能力的协作边界是：

- UI test 负责把“真实 Native 输入框 + 系统键盘 + 发送按钮 + H5 确认卡 + 提醒事实可见”变成可重复运行的工程门禁。
- `collect:ios-keyboard-evidence` 继续负责把同类 H5 / 后端链路整理进证据包，方便人工复核时补截图和 API 摘要。
- UI test 使用专用启动参数跳过通知 / 日历权限请求，并通过 `AI_CODE_UI_TEST_CONVERSATION_ID` 注入独立会话，避免系统同步弹窗或旧会话数据污染键盘路径；它不代表通知、日历、语音或附件系统能力已经通过。
- UI test 脚本会检查 `xcodebuild` 输出中至少实际执行 1 个 XCTest，避免 `-only-testing` 未命中时出现 0 tests 假阳性。
- 最终 completion audit 仍需要人工验收记录，把截图、接口摘要、bridge marker 和结论补齐后再运行 `--require-complete` 校验。

这让键盘输入验收从“完全依赖人工操作”推进到“真实原生输入和后端提醒事实闭环自动防回归，人工验收负责最终留证和结论”。

## iOS 原生语音 UI test 门禁

2026-05-29 的补证推进新增了 `pnpm validate:ios-voice-ui-test`。它通过 Xcode UI test 真实点击 Native composer 的 `ai-code.composer.voice-button`，在 UI test 专用权限旁路开启时使用 `AI_CODE_UI_TEST_VOICE_TRANSCRIPT` 注入识别文本，并断言 H5 Bridge Debug 出现 `source=native.composer.voice`；随后继续点击 H5 确认卡，并断言确认完成后能看到 `已创建提醒`、`scheduled` 和“带电脑”提醒事实。

这项能力的协作边界是：

- UI test 负责把“Native 语音按钮 + H5 Bridge + H5 确认卡 + 后端提醒事实可见”变成可重复运行的工程门禁。
- transcript 注入只在 `AI_CODE_UI_TEST_DISABLE_SYSTEM_PERMISSION_REQUESTS=1` 时生效，普通 App 运行仍走真实 `SFSpeechRecognizer`、麦克风权限和录音路径。
- UI test 不证明系统麦克风权限弹窗、真实录音、识别延迟、嘈杂环境下准确率或中文识别质量；这些仍必须按 iOS 人工验收清单保留截图、录屏和结论。
- 最终 completion audit 仍需要人工验收记录，把真实语音权限、识别文本、失败文案、接口摘要和 bridge marker 补齐后再运行 `--require-complete` 校验。

这让语音输入验收从“只能人工点击观察整条链路”推进到“语音入口到后端提醒事实闭环自动防回归，真实 Speech 质量由人工验收负责”。

## iOS 原生附件菜单 UI test 门禁

2026-05-29 的补证推进新增了 `pnpm validate:ios-attachment-ui-test`。它通过 Xcode UI test 真实点击 Native composer 的 `ai-code.composer.attachment-button`，并断言系统菜单展示“选择附件”“选择照片”“选择文件”和“取消”。

这项能力的协作边界是：

- UI test 负责把“Native 纸夹按钮 + 附件菜单 + 照片 / 文件入口可见”变成可重复运行的工程门禁。
- `collect:ios-attachment-evidence` 继续负责把同形态 Native 附件 payload 的 H5 / 后端处理结果整理进证据包。
- UI test 不进入真实 PhotosPicker 或 fileImporter，不证明照片权限弹窗、安全作用域文件读取、Vision OCR、PDFKit 抽取质量、5MB 边界或用户真实选择流程；这些仍必须按 iOS 人工验收清单保留截图、录屏和接口摘要。
- 最终 completion audit 仍需要人工验收记录，把真实照片 / 文件 / PDF 样本、bridge marker、后端附件摘要和结论补齐后再运行 `--require-complete` 校验。

这让附件入口验收从“菜单是否打开也靠人工观察”推进到“入口与菜单选项自动防回归，真实系统选择器和内容抽取质量由人工验收负责”。

## iOS 原生导航 UI test 门禁

2026-05-29 的补证推进新增了 `pnpm validate:ios-navigation-ui-test`。它通过 Xcode UI test 真实点击 Native Header 的 Timeline、执行记录、日历和菜单按钮，再点击 Drawer 中的对话、Timeline、日程、费用、提醒、执行记录和设置入口，并在 H5 Bridge Debug 中断言真实 `native.viewChanged` 来源和 `view=<surface>`。

这项能力的协作边界是：

- UI test 负责把“原生 Header / Drawer 按钮 + WKWebView Bridge + H5 七页面切换”变成可重复运行的工程门禁。
- H5 synthetic 页面截图仍用于证据包辅助整理，但不能再被误当成真实原生点击链路的证明；真实点击链路由 navigation UI test 覆盖。
- UI test 只断言页面切换和 Bridge 来源，不证明每个页面在真实业务数据下的视觉完整性、长列表滚动、系统权限弹窗或人工验收结论。
- 最终 completion audit 仍需要人工验收记录，把页面截图、bridge marker、后端事实摘要和结论补齐后再运行 `--require-complete` 校验。

这让“第一版原生 App 每个功能都能直接点击使用”的验收更接近真实用户路径：自动化负责防住原生导航链路回归，人工验收负责最终体验和系统能力留证。

## iOS 原生导航结构化人工证据记录

2026-05-29 的补证推进把原生导航 / 页面切换纳入 `manual-evidence-record.template.json`，稳定记录项为 `navigation_surfaces`。该记录项要求人工补 Header / Drawer 页面截图、真实 Bridge marker、H5 七页面切换截图或录屏，以及 `pnpm validate:ios-navigation-ui-test` 输出或 xcresult。

这项能力的协作边界是：

- 自动采证器负责生成 `navigation_surfaces` 模板项，确保人工验收不会漏掉原生导航链路。
- `manual-evidence-record.review.json` 可以把 H5 七页面截图预填为候选证据，帮助人工复核页面切换结果。
- 候选截图和 UI test 输出仍不自动改变 `status=pending`；页面内容完整性、长列表滚动、真实业务数据和最终结论必须由人工验收补齐。
- completion audit 前必须用 `node scripts/validate-ios-manual-evidence-record.mjs --record <path> --require-complete --report <report-path>` 校验补证后的记录，而不是只看自动证据包生成成功。

这让 iOS v1 收尾链路更连贯：工程门禁证明真实原生入口能驱动 H5 surface，结构化人工记录负责把该证据沉淀到最终验收材料中。

## v1 completion audit 统一归档入口

2026-05-29 的收尾治理新增了 `pnpm collect:v1-completion-audit`。默认运行时，它只生成 `v1-completion-audit.json` 和 `v1-completion-audit.md`，把必跑自动化命令、人工证据记录状态、缺口和 goal 是否可 complete 汇总到一个地方。

这项能力的协作边界是：

- 默认模式只生成缺口审计，不运行耗时自动化命令，适合随时查看当前离完成还差什么。
- 正式收尾时必须显式运行 `pnpm collect:v1-completion-audit -- --run-automated-commands --manual-record <path>`，并提供已经补证的人工记录。
- 审计脚本只有在自动化命令全部通过、人工证据记录 `--require-complete` 校验通过时，才会给出 `passed` 结论。
- 它不会同步飞书或 Obsidian；外部知识库是否同步仍以实际同步命令为准。

这让 goal 模式的最终判断更稳：不是靠“我记得这些命令跑过”，而是用单一审计产物把命令、人工证据和完成结论绑定在一起。

## v1 completion audit 命令覆盖补强

2026-05-29 的收尾治理继续补强了 `pnpm collect:v1-completion-audit` 的命令清单，把 `pnpm validate:ios-acceptance-evidence` 和 `pnpm validate:native-shells` 纳入正式 completion audit。

这项能力的协作边界是：

- `validate:ios-acceptance-evidence` 用来证明自动证据包、人工 review 预填、HTTP retry 和权限判定等采证工具仍可用。
- `validate:native-shells` 用来证明原生壳关键入口、UI test 根命令、采证根命令和结构护栏没有被误删。
- readiness 文档和 `validate:v1-readiness` 会同时守住这两个命令，避免完成审计入口和文档门槛再次漂移。
- 这仍不代表 goal complete；它只让最终审计的自动化证据范围更完整。

这让收尾流程更抗回归：最终不是只验证 App 功能本身，也验证用于证明 App 功能的证据工具链仍然可靠。

## native-shells 守住 completion audit

2026-05-29 的收尾治理把 `collect:v1-completion-audit` 纳入 `pnpm validate:native-shells`。这个总护栏现在不仅检查 iOS 原生壳、UI test 和采证脚本，也检查 v1 completion audit 根命令和测试入口。

这项能力的协作边界是：

- `validate-native-shells.test.mjs` 负责守住 validator 自身是否包含 completion audit 检查。
- `validate-native-shells.mjs` 负责检查 package script 和脚本文件引用没有被误删。
- 它不执行正式 completion audit，也不证明人工验收完成；它只保证最终审计入口仍然存在。

这让原生壳收尾更像一个闭环：功能入口、证据入口和最终审计入口都被同一个结构护栏覆盖。

## completion audit 归档人工补证缺口报告

2026-05-29 的收尾治理继续增强了 `pnpm collect:v1-completion-audit`。当命令传入 `--manual-record <path>` 时，除了 `v1-completion-audit.json` 和 `v1-completion-audit.md`，还会在同一个输出目录写入 `manual-evidence-gaps.md`，并把路径记录到 `manualEvidence.reportPath`。

这项能力的协作边界是：

- completion audit 负责把自动化命令状态、人工证据记录状态和完整补证缺口报告放进同一个审计目录。
- `manual-evidence-gaps.md` 来自 `buildManualEvidenceRecordReport()`，会列出未完成项目、当前状态和缺少的截图 / 录屏 / API 摘要 / bridge marker / 系统证据。
- 即使缺口报告生成成功，也不代表人工验收完成；只有自动化命令全部通过且人工记录 completion 校验通过，audit 才能给出 `passed`。
- `validate:native-shells` 现在守住 `manual-evidence-gaps.md` 和 `manualEvidenceReportPath`，防止最终收尾报告归档能力被误删。

这让 goal 模式的收尾更少依赖聊天记忆：一个 completion audit 输出目录就能说明还差哪些人工证据，或者证明补证报告在最终审计时已经随包保存。

## completion audit 结构化外部知识库同步状态

2026-05-29 的收尾治理把外部知识库同步状态也纳入了 `pnpm collect:v1-completion-audit`。审计 JSON 现在包含 `externalKnowledgeSync`，默认状态是 `not_synced`，并记录飞书源稿路径、Feishu / Obsidian target 状态、同步证据列表，以及最终回复必须披露的“仓库已更新，外部知识库未同步”。

这项能力的协作边界是：

- completion audit 可以记录外部同步状态，但不会自动执行飞书或 Obsidian 同步。
- 仓库内 `docs/knowledge-sync/feishu-pages/` 是源稿更新；只有实际执行同步命令并留下证据，才能把对应 target 标记为 `synced`。
- 如果只同步了一个外部目标，可以用 `--external-knowledge-status partial` 并补 `--feishu-sync-evidence` 或 `--obsidian-sync-evidence`。
- 如果未同步，审计包会保留 `finalDisclosureRequired=true`，最终回复仍必须明确“仓库已更新，外部知识库未同步”。

这让收尾判断更稳：产品完成证据、人工验收证据和知识库同步状态都在同一份 audit JSON 中可查，而不是散落在对话记忆里。

## completion audit 自动选择人工证据记录

2026-05-29 的收尾治理继续减少人工路径摩擦：`pnpm collect:v1-completion-audit` 支持 `--manual-record best --manual-record-root .tmp/ios-acceptance-evidence`。脚本会递归扫描证据包下的 `manual-evidence-record.filled.json`、`manual-evidence-record.review.json` 和 `manual-evidence-record.draft.json`，自动选择当前最适合绑定到 audit 的人工记录，并把选择依据写入 `manualEvidence.selection`。

这项能力的协作边界是：

- `best` 会优先选择 `--require-complete` 校验通过的记录；如果都没通过，则选择补证缺口更少、文件类型优先级更高、更新时间更近的候选。
- `latest` 可用于选择最新候选，但正式收尾默认建议使用 `best`。
- 自动选择只解决“从多个 `.tmp/ios-acceptance-evidence` run 里找哪份记录”的问题，不会把 `review` 或 `draft` 自动视为人工验收通过。
- 选中记录后，completion audit 仍会在自己的输出目录重新生成 `manual-evidence-gaps.md`，避免复用源证据包里可能指向旧 draft 的缺口报告。

这让 goal 模式的最终收尾更顺手：自动化可以帮忙挑出当前证据最完整的人工记录，但 completion 的判定仍只认自动化命令全通过和人工记录 completion 校验通过。

## completion audit Markdown 选择依据

2026-05-29 的收尾治理继续补齐了审计包的人读入口。此前 `manualEvidence.selection` 已经写入 JSON，但 `v1-completion-audit.md` 只展示人工证据记录状态，没有展示为什么选中这份记录。现在当使用 `--manual-record best|latest` 时，Markdown 会新增“人工证据记录选择”小节。

这项能力的协作边界是：

- Markdown 会展示 strategy、root、候选数量、有效候选数量、选中路径、选中记录缺口数和 `selectedRequireCompletePassed`。
- 该小节只解释自动选择依据，不改变 completion 判定。
- `validate:native-shells` 已守住“人工证据记录选择”小节，防止后续只保留 JSON 字段、删掉人工复查入口。

这让最终审计更容易复盘：不打开 JSON，也能在 Markdown 里看到 completion audit 绑定了哪份人工记录，以及这份记录是否真正通过了 completion 校验。

## completion audit 人工证据 HEAD 新鲜度

2026-05-29 的收尾治理继续补强了人工证据记录和当前代码状态之间的绑定。`manualEvidence.packageFreshness` 会读取人工记录自身的 `headSha`，必要时读取同目录 `manifest.json` 的 `headSha`，并和当前 `git rev-parse --short HEAD` 做对比。

关键边界：

- `packageFreshness.status=current` 表示人工记录和当前代码 HEAD 一致。
- `packageFreshness.status=current_with_docs_only_changes` 表示人工记录之后只有 `docs/` 或 `ai-factory/memory/` 这类文档 / 记忆源稿变更；它可以避免“记录 audit 结果的文档提交”反复制造 stale 循环。
- `packageFreshness.status=stale` 表示人工记录来自旧 HEAD；即使自动化命令通过、人工记录本身通过 completion 校验，`v1-completion-audit` 也必须保持 `not_complete`。
- Markdown 报告会展示 `packageFreshness`、`recordHeadSha` 和 `currentHeadSha`，让人工复查时不用打开 JSON 也能看见证据版本是否匹配。
- `validate:native-shells` 和 `validate:v1-readiness` 会守住这个字段和旧 HEAD 判定说明，避免后续误删。

这让 goal 模式的收尾更贴近真实发布判断：证据不只是“存在”和“齐全”，还必须证明当前这版代码。旧证据包可以帮助定位缺口，但不能让当前迭代完成。

`current_with_docs_only_changes` 不是绕过验收的后门：只要后续变更触及 `scripts/`、`apps/`、`python/`、`packages/`、`package.json` 或其他产品 / 采证代码，状态仍必须是 `stale`。即使是 docs-only 状态，completion 也仍然要求人工 evidence record 已经 `passed`，不能把 review / draft 记录当成通过。

## 当前 HEAD iOS 辅助证据包刷新

2026-05-29 的收尾推进在 `d474ea4` 上重新生成了一份当前 HEAD 的 iOS 辅助证据包：

```bash
pnpm collect:ios-acceptance-evidence -- --seed-supported-system-evidence --seed-keyboard-input --seed-attachment-inputs --output-dir .tmp/ios-acceptance-evidence/current-head-full-supporting-20260529
```

这份包包含 H5 七页面截图、系统 Calendar App 截图、日历取消前后截图、日历权限拒绝截图、通知点击回流截图、键盘辅助截图、附件辅助截图和 `manual-evidence-record.review.json`。`manifest.headSha` 与 review 记录的 `headSha` 均为 `d474ea4`。

随后运行：

```bash
pnpm collect:v1-completion-audit -- --manual-record best --manual-record-root .tmp/ios-acceptance-evidence --output-dir .tmp/v1-completion-audit/current-best-after-current-head-20260529 --external-knowledge-status not_synced
```

结果显示：

- `manualEvidence.selection.selectedRecordPath` 自动选中当前 HEAD 新包。
- `manualEvidence.packageFreshness.status=current`。
- `manualEvidence.missingEvidenceCount=33`。
- `verdict=not_complete`。

这说明自动辅助材料已经刷新到当前代码状态，旧 HEAD 阻塞已消除；但 review 记录仍不能替代人工验收。下一步需要把 33 条缺口中的真实系统操作证据补进 filled 记录，再让 completion audit 通过。

## completion audit 当前 HEAD 优先选择

2026-05-29 的收尾治理继续修正了 `--manual-record best` 的语义。此前 `best` 会优先选择 completion 通过或缺口更少的记录；如果旧 HEAD 记录缺口更少，它会先被选中，然后 audit 再因 `packageFreshness.status=stale` 保持 `not_complete`。这虽然安全，但不利于复查当前版本真实剩余缺口。

现在 `best` 的排序先看证据新鲜度：

- 当前 HEAD 记录优先。
- 新鲜度相同时，再比较 completion 是否通过。
- 再比较缺口数、文件类型优先级和更新时间。

审计 JSON 的 `manualEvidence.selection` 也会记录 `selectedRecordFreshnessStatus` 和 `selectedRecordHeadSha`。这样最终收尾时，`best` 会优先绑定当前代码的证据包，而不是被历史缺口更少的旧包吸走。

同一阶段还补强了 review 候选证据映射：H5 七页面截图会补到“`H5 七页面切换截图或录屏`”，附件样本 `kind` 会补到 `attachmentKind=image|text|pdf`。这些仍只是候选证据，不会改变 item 的 `pending` 状态，也不会替代真实系统选择器和人工验收。

## iOS 验收事实 seed 稳定性

自动证据包里的验收事实 seed 是系统 Calendar App 截图、系统日历取消清理等辅助证据的前置条件。它必须稳定写入日程、费用和提醒三类事实；任一领域失败，`acceptanceFactSeed.available` 都会保持 false，后续依赖 seed 日程的系统辅助证据也会被跳过。

2026-05-29 修复了费用 seed 的文案粘连问题：旧输入把金额写成 `58 元{seedRunId}`，可能让规划器进入费用金额追问；新输入把 seed 标记移到票据描述前，把金额保留为独立 `58 元`。测试已守住不再出现 `58 元seed_`。

这个规则也适用于后续新增 seed 文案：可读标记应该放在标题或描述里，不要插入金额、日期、时间这类解析器依赖的结构中间。

## 系统日历取消清理 review 分类

2026-05-31 的补证治理把 `system_calendar_cleanup` 的“后端 canceled 状态”从截图要求修正为 API 摘要要求。原因是 canceled 状态来自后端取消接口、`calendarCleanupSeed.canceledEvent.status` 或 `postCancelStatus`，它证明的是业务读模型 / API 状态，不是用户界面截图。

当前边界是：

- `manual-evidence-record.template.json` 中，`system_calendar_cleanup.requiredEvidence.apiSummaries` 包含 `/calendar/events?conversationId=...` 和“后端 canceled 状态”。
- `manual-evidence-review` 会自动预填 `后端 canceled 状态: eventId=..., status=canceled`，便于人工复核。
- `screenshots` 仍只保留“`H5 日程取消动作`”，因为现有自动采证是直接 POST 取消，不证明用户真的在 H5 行内点击取消。
- `systemArtifacts` 仍保留“`iOS 系统日历事件消失截图`”，来自 Calendar App 取消后辅助截图。
- 该修正只减少错误分类造成的补证噪音，不会把 `system_calendar_cleanup` 自动标为 `passed`，也不会改变 completion audit 必须绑定人工通过记录的规则。

## 会话持久 ID 重启截图

2026-05-31 的补证治理把会话持久 ID 的自动辅助材料从 plist / API 摘要扩展到重启前后截图。`collect:ios-acceptance-evidence` 在读取 Native `ai-code.native.conversationId` 后，会先保存 `conversation-before-relaunch.png`，再执行 `simctl terminate` / `simctl launch`，等待 App 重新加载后保存 `conversation-after-relaunch.png`，最后再次读取 preferences 并比对 `beforeRelaunch` 和 `afterRelaunch`。

当前边界是：

- 这两张图会进入 `manual-evidence-record.review.json` 的 `conversation_persistence.evidence.screenshots`。
- review 文案会带上具体 `conversation_ios_*` 值，便于人工把截图、UserDefaults 和 `/agent/conversations/{conversationId}/turns` 摘要对齐复核。
- 该证据仍是候选证据；`conversation_persistence.status` 必须保持 `pending`，直到人工确认截图、API 摘要和 bridge marker 后再改为 `passed`。
- 如果截图未显示足够上下文，人工仍可以补录屏或额外截图；completion audit 只负责暴露缺口，不替代人工判断截图质量。

## 验收事实确认卡截图

2026-05-31 的 iOS v1 收口继续把自动辅助证据靠近真实用户路径。`acceptanceFactSeed` 仍通过 API 提交三领域 seed，保证写事实的主语义不变；但 calendar / reminder seed 在确认前会额外打开同会话 H5 native 页面，等待 pending confirmation 恢复渲染，并保存两张确认卡截图：

- `acceptance-calendar-confirmation-card.png`
- `acceptance-reminder-confirmation-card.png`

协作边界：

- H5 确认卡必须带 `data-plan-id` 和 `data-confirmation-id`，Playwright 优先按当前后端 `planId` 定位；`seedRunId` 只作为 fallback，用于避免旧 pending 卡污染本轮采证。
- 截图只作为 `system_calendar_write` 和 `local_notification` 的候选辅助证据进入 `manual-evidence-record.review.json`。
- 自动 review 只预填证据，不改 item 状态；人工仍需判断截图质量并把 filled 记录改为 `passed`。
- 这些截图不能证明真实 Native 输入来源，键盘 / 语音仍要依赖原生 UI test、人工截图或真实录屏。
- 本地通知仍需要权限弹窗、系统通知截图和必要的点击回流证据；系统日历仍需要 Calendar App 详情、notes marker、无重复和取消后消失等人工复核。

这类补证改动的优先级判断是：优先补“自动能稳定采到、且能减少人工整理成本”的证据；不要为了让 audit 看起来更绿，把候选证据误升级为完成证据。

## H5 行内动作辅助采证协作规则

2026-05-31 的“日程取消动作”补证把一个重要规则固化下来：凡是 completion audit 要求证明“用户在 H5 中点击了某个业务行内动作”，采证器应优先通过稳定 DOM 契约定位目标业务对象，而不是全局点击同名按钮。

本阶段形成的协作约定：

- H5 summary row 使用 `data-summary-item-id` 标识业务对象。
- H5 行内 action 使用 `data-summary-action-type` 标识动作类型，例如 `calendar.cancel`。
- H5 行内 action 使用 `data-summary-action-target-id` 标识动作目标。
- Playwright 采证应先限定在 `后端元素渲染区`，再按 item id 和 action type 定位，避免旧 pending 卡、确认弹层或其它领域的同名“取消”按钮污染证据。
- 采证脚本可以把截图预填到 `manual-evidence-record.review.json`，但不得把 item 状态自动改成 `passed`。

这条规则后续也适用于费用提交 / 取消、提醒完成 / 取消、编辑保存等可点击业务动作。证据分层仍保持不变：H5 点击截图证明用户界面动作，API summary 证明后端事实状态，Native / 系统 App 截图证明系统集成结果。

## Native 目标聚焦与采证重试

2026-05-31 的 H5 calendar focus 修复补充了另一条协作规则：当 Native 或采证脚本要证明某个具体业务对象的可见动作时，`native.viewChanged` 不应只传 `view`，还应传目标对象 ID。

当前约定：

- 日程目标使用 `eventId` 或 `calendarEventId`。
- 提醒目标继续使用 `reminderId`。
- H5 surface 应把目标对象置入可见列表并设置 `highlighted`，即使它不在默认最近列表里。
- 自动采证允许对目标 focus 做有限重试，用于吸收 H5 初始快照刷新、后端读模型刷新和 Native bridge 消息到达顺序的竞态。
- 重试只能用于稳定采证，不得绕过真实 UI 动作；最终仍要点击 H5 行内按钮并读取后端 / 系统结果。

这个规则把“页面切换”和“目标定位”分开：`view` 决定用户进入哪个 surface，`eventId` / `reminderId` 决定该 surface 应该展示并滚动到哪个业务对象。

## UI Test 证据归档约定

2026-05-31 的原生导航补证把 UI test 从“只在终端证明通过”升级为“可被证据包引用的产物”。后续凡是用 XCTest 证明 Native 壳层能力，都应遵守同一约定：

- 校验脚本固定写出 log 文件，便于人工复查完整 xcodebuild 输出。
- 校验脚本固定写出 xcresult，保存 XCTest attachment、失败上下文和执行元数据。
- 校验脚本写出 JSON metadata，至少包含 `passed`、`logPath`、`resultBundlePath` 和关键 attachment 名称。
- `collect-ios-acceptance-evidence` 只读取 metadata 并预填 review 候选证据，不把 UI test 结果自动升级为人工验收通过。
- XCTest 中关键业务断言点应添加 `.keepAlways` screenshot attachment，名称使用人工验收清单里的中文证据名。

这个模式后续可复用到键盘输入、语音输入、附件选择器和 H5 地址覆盖等项目：UI test 证明 Native 操作路径存在，review 记录承接证据，人工最终判断截图 / 录屏 / 系统权限材料是否足够。

## 证据文案与异步读模型稳定化

2026-06-01 的导航与附件采证修复补充了两条协作规则：

1. 自动预填的证据文案必须包含人工模板里的关键短语。比如 `navigation_surfaces.requiredEvidence.systemArtifacts` 要求“`pnpm validate:ios-navigation-ui-test 输出或 xcresult`”，review 记录就应保留完整短语，而不是拆成“输出”和“xcresult”两条近似文案。completion audit 按 requiredEvidence 做证据匹配，近似可读不等于可验证。
2. 采证脚本读取后端异步写入结果时，应给短暂读模型延迟留出有限重试窗口。附件输入 seed 现在最多查询 5 次 `/attachments?conversationId=...&limit=50`，每次都重新映射三类 seed 的后端附件 ID；只有全部命中才认为候选证据可用。

这两条规则的边界也要保持清楚：

- 重试只用于吸收本地 H5 / API / DB 之间的短暂延迟，不得掩盖真实业务失败。
- 查询范围可以适度放宽，例如从 `limit=20` 调整到 `limit=50`，但最终仍必须按本轮 seed 的 `attachmentId` 精确匹配。
- 自动化只能减少人工整理成本；系统能力是否通过仍以人工 filled 记录、截图质量和 completion audit 为准。

## completion audit 后的状态记录

2026-06-01 的 HEAD `5c2ffba` 证据包刷新确认了当前协作边界：

- 自动辅助证据可以把 `missingEvidence` 收敛到更少、更准确的人工缺口；本轮从上一包 33 个缺口降到 20 个。
- `missingEvidence=无` 不代表该项完成。只要人工记录里 item `status` 仍是 `pending`，completion audit 就必须保持 `not_complete`。
- 证据包、manual review 和 audit 必须绑定当前 HEAD。若为了记录阶段结果再提交文档，就需要重新生成证据包或在最终说明中明确当前证据对应的 commit。
- 外部知识库同步状态必须显式记录。若只更新仓库源稿、没有真实执行飞书或 Obsidian 同步，最终回复必须说明“仓库已更新，外部知识库未同步”。

后续执行顺序建议：

1. 先补真实系统交互截图 / 录屏和 API 摘要。
2. 再复制 `manual-evidence-record.review.json` 为 filled 记录，并由人工把可通过项改为 `passed`。
3. 最后用该 filled 记录跑 `collect:v1-completion-audit`，不要用自动 review 记录冒充人工完成记录。

## 原生输入 UI test 证据归档

2026-06-01 的键盘输入补证把导航 UI test 的归档模式推广到原生输入：

- 每个能够证明真实 Native 操作路径的 UI test 命令，都应固定输出 log、xcresult 和 JSON metadata。
- XCTest 应在关键用户可见状态保存 screenshot attachment，例如键盘输入后的 `输入框文本`。
- `collect-ios-acceptance-evidence` 只读取 metadata，把它作为 `supportingOnly` 证据写进证据包。
- `manual-evidence-review` 只预填人工 review 候选证据，不修改 item status。
- H5 synthetic seed 和真实 UI test 各自证明不同层面：synthetic seed 证明 H5 / 后端能处理 Native 来源消息；真实 UI test 证明 Native 输入控件、系统键盘和发送按钮可用。completion audit 需要两类证据共同缩小缺口。

这个模式后续可以继续用于语音：语音 UI test 证明 `source=native.composer.voice`、识别文本和 H5 确认卡；系统麦克风 / 语音权限弹窗仍必须由人工截图或录屏补齐。

## H5 地址覆盖证据分层

2026-06-01 的 H5 局域网地址 review 映射补充了一个容易混淆的证据规则：构建产物里的 `H5DevServerURL`、H5 marker 和 App 启动截图各证明不同层面，不能互相替代。

当前协作约定：

- `H5DevServerURL` marker 证明 iOS 构建产物读取到了目标 H5 地址。
- `h5NativeTargetMarkerFound=true` 证明该目标地址能返回 H5 native 页面，并包含必要页面 marker。
- “默认地址 App 启动截图”证明 App 能在当前配置下启动。
- “局域网地址 App 启动截图”只有在 `H5DevServerURL` 是私有局域网地址时才可预填；`localhost`、`127.0.0.1` 和无效地址不能冒充。
- 自动 review 只能预填候选证据，不得把 `h5_address_override.status` 改成 `passed`。

正式局域网采证建议同时设置：

```bash
H5_DEV_SERVER_URL="http://${MAC_LAN_IP}:3000/?native=ios&bridgeDebug=1"
AI_CODE_H5_NATIVE_BASE_URL="http://${MAC_LAN_IP}:3000"
AI_CODE_API_BASE_URL="http://${MAC_LAN_IP}:8000"
```

采证前需要先确认 H5 / API 已监听到局域网地址，且 `curl "${AI_CODE_H5_NATIVE_BASE_URL}/?native=ios&bridgeDebug=1"` 能看到 H5 页面 marker。completion audit 仍以最新 HEAD 的证据包和人工 filled 记录为准。

## 通知证据的部分可用规则

2026-06-01 的局域网正式采证暴露了一个 notification 证据整理问题：系统 pending / delivered notification 没被 Native 诊断捕获时，`notificationDelivery.available=false` 和 `notificationClickBackflow.available=false` 是正确结论；但这不等于同一轮里所有 H5 / API / Bridge 证据都无效。

当前协作约定：

- `notificationDelivery.available=false` 时，如果后端已经生成并确认了提醒 `reminderId`，review 可以预填 `/reminders` 摘要和 H5 提醒页 scheduled 截图。
- 只有观测到 `pendingNotificationFound=true`、`deliveredNotificationFound=true` 或整体 `notificationDelivery.available=true`，review 才能预填 `notifications.reminders.sync`。
- `notificationClickBackflow.available=false` 时，如果 H5 synthetic `native.viewChanged` 已经打开 reminders、目标提醒已高亮、bridge label 包含 `source=native.notifications.reminders.opened`，review 可以预填这些 H5 回流候选证据。
- 真实系统通知截图、通知权限弹窗和系统通知点击录屏仍必须由人工或系统级采证补齐，不能由 synthetic H5 回流代替。

这个分层让 completion audit 更准确：系统层失败不会吞掉 H5 层已成立的证据，H5 层成立也不会冒充系统通知已投递或已点击。若局域网模式下持续无法观测 pending notification，下一步应修采证脚本的 Native notification sync 等待和诊断，而不是降低验收门槛。

## 通知 Bridge outbound 采证复用规则

2026-06-01 的通知同步 Bridge 辅助证据稳定化补充了一个更具体的采证规则：如果同一轮 `collectH5SurfaceScreenshots` 已经打开当前 `conversationId` 的 H5 native 页面，并成功切过 7 个 H5 surface，那么这一个页面上的 NativeBridge outbound message 比另起一个 H5 页面更适合作为 `notifications.reminders.sync` 的采证来源。

当前协作约定：

- H5 surface 采证可以导出 `bridgeOutboundMessages`，但只保留 `type`、`reminderCount` 和 `reminderIds`，避免把完整提醒 payload 写进人工证据包。
- `notificationSyncBridge` 优先复用 `h5SurfaceScreenshots.bridgeOutboundMessages`；只有没捕获到 `notifications.reminders.sync` 时，才走 standalone H5 fallback。
- `bridgeOutboundLabel` 必须写清 `reminderId`、reminders 数量和 `targetIncluded=true/false/null`，这样人工复核时能区分“发出了通知同步消息”和“是否包含本轮目标提醒”。
- 复用 `h5-surfaces/reminders.png` 作为截图是允许的，因为它证明同一会话 reminders surface 可见；但这仍只是 H5 / Bridge 辅助证据。
- `notificationSyncBridge.supportingOnly=true` 必须保持。即使 `available=true` 且 `targetReminderIncluded=true`，也不能替代 iOS 通知权限弹窗、系统通知截图、delivered diagnostics 或真实通知点击录屏。

HEAD `36f786f` 的正式证据包显示 `notificationSyncBridge.available=true`、`targetReminderIncluded=true`，completion audit 的 `missingEvidenceCount=5`。这代表 `notifications.reminders.sync` 这项 Bridge marker 已经从缺口中移出；剩余通知缺口必须继续在系统 UI 层补证，不能继续用 synthetic H5 或 outbound bridge 证据稀释验收标准。

## 原生语音 UI test 证据归档

2026-06-01 的语音 UI test 证据归档把键盘输入的模式扩展到语音输入，但边界必须更严格：

- `validate:ios-voice-ui-test` 的 log、xcresult 和 `voice-ui-test.json` 只证明 UI test 路径下 Native 语音按钮、识别文本、H5 确认卡、后端提醒事实和 `source=native.composer.voice` bridge marker 可串起来。
- XCTest attachment 应使用人工验收清单中的证据名，例如 `识别文本` 和 `H5 确认卡`，这样 `manual-evidence-review` 可以直接按 requiredEvidence 预填候选证据。
- `collect-ios-acceptance-evidence` 只把语音 UI test 写为 `supportingOnly` 自动证据，不能把 `voice_input.status` 改成 `passed`。
- 真实麦克风权限弹窗、语音识别权限弹窗、真实用户说话录屏和识别质量仍属于系统层 / 人工层证据，不能由 UI test 注入 transcript 代替。
- completion audit 的语音项应同时看两类材料：UI test 证明链路，人工截图 / 录屏证明系统权限和真实语音体验。

后续如果继续补语音采证，应优先增加真实权限弹窗截图 / 录屏的采集入口，而不是放宽 `voice_input.requiredEvidence.systemArtifacts`。这能保持“自动化降低整理成本，人工验收决定发布结论”的边界。

## 语音权限弹窗 UI test 采证规则

2026-06-01 的语音权限弹窗 UI test 把语音证据拆成两条互补链路：

- `validate:ios-voice-ui-test` 继续负责业务闭环：Native 语音按钮、UI test transcript、`source=native.composer.voice`、H5 确认卡和后端提醒事实。
- `validate:ios-voice-permission-ui-test` 只负责系统权限弹窗：重置目标 App 权限，真实点击语音按钮，从 SpringBoard alert 归档 `麦克风 / 语音识别权限弹窗` 和 `iOS 权限弹窗截图或录屏`。

协作边界：

- 权限弹窗 UI test 不能注入 transcript，也不应该点击确认卡或创建后端事实；它只证明权限弹窗可触发、可截图、可在 xcresult 中复查。
- `voicePermissionUiTest.available=true` 可以预填 `voice_input` 的截图和系统证据，但 item status 仍必须保持 `pending`，由人工最终判断是否通过。
- 正式 completion audit 的自动化命令清单应包含 `pnpm validate:ios-voice-permission-ui-test`，否则“自动命令全通过”这句话不完整。
- HEAD `e5f591b` 的 audit 显示 `missingEvidenceCount=3`，说明语音权限弹窗已从显式缺口中移出；剩余缺口应继续聚焦系统通知 UI。

## audit 刷新后的下一步选择

HEAD `a7a2241` 的 audit 把 `missingEvidenceCount` 收敛到 15 后，后续协作要按证据类型分流：

- 已经能由 UI test 或 synthetic H5 bridge 证明的链路，不再重复堆同类证据。例如语音的 `识别文本`、`H5 确认卡`、`/reminders` 和 `source=native.composer.voice` 已经归档，下一步不应继续在这些字段上打转。
- 仍缺真实系统选择器流程的附件项，可以继续尝试自动化或半自动化：PhotosPicker、Files picker、PDF 样本文本展示、附件后的费用确认卡 / 金额追问。这些缺口和 H5 / Native UI test 有明确落点。
- 系统权限弹窗、系统通知 banner、通知点击录屏这类 OS 层证据，除非采证脚本能真实触发并截图 / 录屏，否则必须保持人工门槛。
- 每次新增辅助证据后，都必须重新生成当前 HEAD 证据包和 completion audit，不能沿用旧 HEAD 的 review 记录。

这个分流能避免两种偏差：一是把 synthetic bridge 截图冒充系统能力；二是在已有证据的字段上重复优化，却没有减少真正阻塞 v1 完成的缺口。

## 附件证据的两层边界

2026-06-01 的照片费用证据归档明确了附件验收的两层边界：

- 业务链路层可以自动化：H5 收到附件、附件写入 `/attachments`、点击“作为费用票据处理”、出现费用确认卡、确认后写入 `/expenses`，这些都属于产品业务闭环，可以由 Playwright + API 摘要生成候选证据。
- 系统选择器层不能被 synthetic bridge 替代：PhotosPicker / Files picker 的选择流程、系统权限弹窗、系统选择器截图必须来自真实 iOS 系统 UI 或人工录屏。

因此，review 映射可以为 `photo_attachment` 预填 `费用确认卡或金额追问` 和 `/expenses?conversationId=...`，但不能因此预填 `PhotosPicker 选择流程` 或 `PhotosPicker 权限与选择器截图`。后续补文件和 PDF 时也应沿用这个原则：能自动化业务后续链路，但不能把 synthetic `native.inputSubmitted` 当成真实系统选择器。

## PDF 附件 follow-up 与上下文顺序

2026-06-01 的 PDF 附件证据归档补了两个协作规则：

- 附件 follow-up 应尽量贴着附件提交立即执行。照片、文件、PDF 连续提交后再回头点旧 quick reply，会让“最近附件”上下文漂移，LLM 或规则 planner 可能围绕错误附件生成候选计划。
- 自动采证可以证明 PDF 可读文本进入业务链路：点击“作为日程材料处理”、出现日程追问或确认卡、保存 `native-attachment-pdf-schedule-follow-up.png`、把 `PDF 日程材料 明天上午十点项目会` 作为文本摘要候选证据。
- 这些证据仍只属于业务链路层，不能代替真实 Files / PDF 选择器截图。`PDF 选择流程` 必须来自系统 UI、UI test 或人工录屏。
- `manual-evidence-review` 只能预填 `pdf_text_extraction` 的“后续追问或确认卡”和“PDF 样本文本摘要截图”，不得把 item status 改成 `passed`。

正式 audit 使用 HEAD `ebb9eb2` 的证据包后，`missingEvidenceCount=11`，说明 PDF 业务后续证据已经从缺口中移出；但 v1 completion 仍阻塞在人工验收状态和系统 UI 证据上。后续协作应把精力放到真实 PhotosPicker / fileImporter / PDF 选择器、语音权限弹窗、通知权限弹窗和系统通知点击录屏，而不是继续堆 synthetic bridge 截图。

## 附件选择器 UI test 证据归档边界

2026-06-01 的附件选择器 UI test 证据归档把“真实 Native 控件路径”继续向系统选择器入口推进：

- `validate:ios-attachment-ui-test` 必须固定输出 log、xcresult 和 `attachment-ui-test.json`，让 completion audit 可以按路径引用证据，而不是依赖临时终端输出。
- XCTest screenshot attachment 名称要贴合人工验收清单：`附件菜单`、`PhotosPicker 选择流程`、`fileImporter 选择流程` 和 `PDF 选择流程`。
- `collect-ios-acceptance-evidence` 只把这些材料记录为 `supportingOnly` 自动证据；`manual-evidence-review` 只预填候选材料，不修改 `photo_attachment`、`file_attachment` 或 `pdf_text_extraction` 的 item status。
- UI test 点击选择器入口可以减少“流程截图”类缺口，但不能证明用户真实选中文件、授权权限、Vision OCR 质量、PDFKit 文本抽取质量或业务确认质量。
- 附件业务链路证据和系统 UI 证据仍要分开看：`nativeAttachmentInputs` / H5 follow-up 证明 H5 与后端能处理附件 payload；`attachmentUiTest` 证明 Native 菜单和系统选择器入口可达。

HEAD `180ce4c` 的正式 audit 后，`missingEvidenceCount=6`，附件三项的 `missingEvidence=无`。这代表候选材料已经齐，不代表人工验收完成；所有 item 仍为 `pending` 时，completion audit 必须保持 `not_complete`。下一步协作重点应转向语音权限弹窗和通知系统链路，尤其是 `notifications.reminders.sync`、通知权限弹窗、系统通知截图和系统通知点击录屏。

## 系统通知 UI test 证据归档边界

2026-06-01 的系统通知 UI test 把通知系统证据拆成三层：

- `notificationSyncBridge` 证明 H5 已向 Native 发送 `notifications.reminders.sync`，并且目标 reminder 包含在同步 payload 中。
- `notificationDelivery` / Native diagnostics 证明 pending / delivered notification 标识进入系统诊断。
- `validate:ios-notification-ui-test` 证明系统通知 banner 可见、可截图，且用户点击通知后能回到 H5 reminders 视图并显示 `已从系统通知打开提醒`。

协作边界：

- `validate:ios-notification-ui-test` 不把通知权限首弹当作必然产物。当前 Simulator 环境可能在独立 bundle id 下直接得到通知授权或不展示首弹；如果首弹出现，XCTest 可以截图，但 review 不应要求 metadata 一定包含 `notificationPermissionPrompt`。
- 系统通知截图和通知点击录屏可以由 UI test 预填到 `local_notification` 和 `notification_click_backflow`，但 item status 必须保持 `pending`，由人工最终复核。
- H5 synthetic `native.viewChanged` 仍只能证明 H5 回流处理；只有系统通知 UI test 的 `system-notification-click.mp4` 和 xcresult 才能作为真实点击候选证据。
- SpringBoard 通知 banner 的定位应优先按 button/staticText/`NotificationShortLookView` 查询，并用轮询重新获取元素；不要依赖一次性的 broad descendants `firstMatch`。
- H5 执行结果文案可能随产品 UI 演进变化，通知 UI test 应等待用户可见事实文案（例如 `已执行：创建提醒`、`scheduled`、提醒标题），不要绑定旧的通用状态文案。

后续 completion audit 仍要重新生成当前 HEAD 证据包，并绑定 `notificationUiTest.available=true` 的 review 记录；没有人工 `passed` 记录时，即使通知截图和录屏都齐，goal 也不能标记为 complete。

## 系统通知 audit 刷新后的下一步选择

HEAD `2018cc1` 的 audit 显示 `missingEvidenceCount=1`，说明系统通知 UI test 已经把本地通知和通知点击回流的显式材料补齐。后续协作要避免继续在通知链路上重复堆证据，应转向两个更明确的收尾动作：

- 如果目标是继续减少机器可见缺口，下一步应在局域网 H5/API 地址下重新跑证据包，补 `h5_address_override` 的“局域网地址 App 启动截图”。本轮用 `127.0.0.1` 跑包，所以这个缺口仍合理存在。
- 如果目标是接近 v1 complete，必须由人工复核 `manual-evidence-record.review.json`，把 14 个 item 从 `pending` 改成真实的 `passed/failed/blocked`，并补操作者说明。自动 review 记录只能预填证据，不能自己变成验收结论。
- 正式收尾必须运行 `pnpm collect:v1-completion-audit -- --run-automated-commands ...`，否则 audit 中自动化命令仍是 `not_run`，不能作为 complete 证据。
- 外部知识库同步仍需要真实执行飞书或 Obsidian 同步命令；只更新 `docs/knowledge-sync/feishu-pages/` 源稿时，最终回复仍必须说明“仓库已更新，外部知识库未同步”。

## 机器证据缺口归零后的收尾规则

HEAD `eee802b` 的 LAN 证据包把 `missingEvidenceCount` 降到 0 后，后续协作重心需要切换：

- 不再把“补 required evidence 字段”当作主要开发目标；当前 review 记录已经有候选材料。
- 不能把 `manual-evidence-record.review.json` 自动改成 `passed`。它是候选证据集合，不是人工验收结论。
- 如果要继续推进 goal complete，必须进入人工复核或 operator sign-off：逐项检查 14 个 item 的截图、录屏、API 摘要、bridge marker 和系统 artifact，然后生成 `manual-evidence-record.filled.json`。
- 只有 filled 记录通过 `node scripts/validate-ios-manual-evidence-record.mjs --record <path> --require-complete`，并且 `pnpm collect:v1-completion-audit -- --run-automated-commands --manual-record <path>` 通过，才可以考虑把 goal 标记 complete。
- 若没有真实执行飞书 / Obsidian 同步，外部知识库必须继续记录为 `not_synced`，不能为了 completion 修改成 synced。

## 语音权限 UI test 的 TCC 隔离规则

2026-06-01 的 full audit 复查暴露了一个 Simulator TCC 细节：`simctl privacy reset microphone/all <bundleId>` 不能可靠证明 Speech Recognition 权限也回到“未决定”。当同一个 bundle id 先前已经被授权时，App 点击语音按钮会直接进入录音状态，系统不会再出现语音 / 麦克风权限弹窗，导致 `validate:ios-voice-permission-ui-test` 在 full audit 中失败。

新的协作规则：

- 权限弹窗 UI test 默认使用 run-scoped bundle id，例如 `com.aiengineeringcode.shell.voicepermissionuitest.run...`。
- metadata 必须记录 `baseBundleId` 和实际 `bundleId`，方便审计判断权限弹窗来自本轮新 App。
- `AI_CODE_IOS_VOICE_PERMISSION_UI_TEST_BUNDLE_ID` 只作为显式覆盖使用；正式门禁默认不应固定复用一个容易被 TCC 污染的 bundle id。
- `validate:native-shells` 要守住 run-scoped bundle id 逻辑，避免未来回退到固定 bundle id。

这个规则不改变验收边界：语音权限弹窗仍必须真实触发并归档，不能用 mock transcript 或 synthetic bridge 代替。

## full audit 自动门禁通过后的收尾规则

HEAD `69af3fb` 的 full completion audit 已经证明 21 个自动化命令全部 `passed`，并且当前 HEAD 证据包的 `missingEvidenceCount=0`。这意味着工程门禁和机器可见候选证据已齐，但它仍不是 v1 complete。

后续收尾要按以下规则推进：

- `manual-evidence-record.review.json` 即使证据字段齐全，也只是 review 候选材料。只要 14 个 item 仍是 `pending`，`manualEvidence.status` 就必须是 `failed`，`verdict` 必须是 `not_complete`。
- 下一步不是继续补同类自动证据，而是人工复核并生成 filled 记录：逐项检查截图、录屏、API 摘要、bridge marker、系统 artifact 和操作者说明。
- filled 记录必须通过 `node scripts/validate-ios-manual-evidence-record.mjs --record <path> --require-complete`。
- 正式完成前必须再次运行 `pnpm collect:v1-completion-audit -- --run-automated-commands --manual-record <filled-path> ...`，并确认自动门禁、人工证据和外部同步状态都符合完成条件。
- 外部知识库同步不能由源稿更新自动推断；未执行真实同步命令时，completion audit 和最终回复都必须保留 `not_synced` / “仓库已更新，外部知识库未同步”。

## 人工验收 filled 记录签署规则

2026-06-01 起，人工验收 filled 记录应优先通过 `pnpm prepare:ios-manual-evidence-record` 生成，而不是直接复制和批量替换 JSON：

- 默认命令只生成草稿：`acceptanceVerdict` 必须保持 `not_evaluated`，所有 item 必须保持 `pending`，`operatorSignoff.mode` 必须是 `draft`。
- 草稿可以作为人工复核工作台，帮助操作者逐项检查 review 记录中的截图、录屏、API 摘要、bridge marker 和系统 artifact。
- 只有真实人工复核完成后，才允许使用 `--mark-passed --operator <name> --confirmed-at <iso8601>` 生成通过记录。
- `--mark-passed` 不是跳过验收的快捷方式；它必须先通过 `validate-ios-manual-evidence-record --require-complete` 的证据完整性校验，缺任何 required evidence 都要失败。
- 生成 passed filled 记录后，仍需再次运行 `node scripts/validate-ios-manual-evidence-record.mjs --record <filled-path> --require-complete --report <report-path>`，再把该记录交给 `pnpm collect:v1-completion-audit -- --run-automated-commands --manual-record <filled-path>`。

协作原则不变：AI 可以整理候选证据、生成草稿和运行校验，但不能代替操作者确认系统权限、系统 App、通知、语音、附件和业务事实是否真实通过。

## 人工验收 Review Pack 规则

2026-06-01 起，人工验收签署前应优先运行 `pnpm prepare:ios-manual-review-pack -- --record <review-path>`，把 `manual-evidence-record.review.json` 转成 `manual-evidence-review-pack.md` 和 `manual-evidence-review-pack.html`：

- Review Pack 只负责把操作者需要看的内容聚合到 Markdown / HTML：record 路径、输出路径、record HEAD、当前 HEAD、`packageFreshness`、`acceptanceVerdict`、manual flags、item 状态统计、每个 item 的 required evidence、缺少候选证据和已预填证据。
- 每个 item 必须同时展示“必需证据”和“候选证据”，让操作者能对照判断该项是否真的满足签署条件，而不是只看到已有文件路径。
- HTML 版应把截图、录屏、日志、JSON、xcresult、Markdown 等候选证据路径渲染为可点击链接，方便操作者逐项打开材料复核。
- 如果 record HEAD 和当前 HEAD 不一致，pack 必须标记 `packageFreshness: stale`，并提醒不要把旧 HEAD 证据当作当前代码验收。
- Pack 必须明确写出“本文件不代表验收通过”；`pending`、`not_evaluated` 或 stale 记录只能用于复核，不能进入 passed 结论。
- Pack 可以给出后续命令，包括 `pnpm prepare:ios-manual-evidence-record -- --mark-passed --operator <name> --confirmed-at <iso8601>`、`validate-ios-manual-evidence-record --require-complete` 和 `collect:v1-completion-audit --run-automated-commands`。
- native-shells 护栏要检查 review pack 入口、required evidence 汇总、HTML 生成函数、HTML CLI 日志和 HTML 行为测试，避免未来重构时把人工复核工作台从根命令或脚本中移除。

这个入口解决的是“人工看什么、按什么顺序签署”的操作成本，不改变验收边界。AI 仍不能自行把 review 记录改成 passed，也不能用 Review Pack 替代操作者签名。

## 验收事实 seed 文案规则

自动采证中的 seed 文案要优先选择结构化、单义、抗历史上下文污染的表达：

- 创建类 seed 要明确写出“新增”或“创建”，避免在长期会话中被 LLM 理解成管理已有事项。
- 费用 seed 要写出 `新增费用草稿`、`标题 <seedRunId> ...`、`金额 ...`、`发生日期 ...`，不要依赖“备注”承载 seed，也不要使用容易触发“提交报销 / 选择已有费用”的 `报销`。
- seed 文案的目标不是覆盖用户自然语言能力，而是为 completion audit 生成可重复的辅助证据；自然语言能力仍由 product smoke、LLM smoke 和真实 App 验收覆盖。
- 如果证据包出现 `acceptanceFactSeed.available=false`，要先检查三领域 seed 哪一项没有 `confirmation_required`，再考虑是否是文案歧义、脏会话历史或服务状态问题。

## 自动化全绿后的停线边界

HEAD `b9d4fc5` 的 full audit 给出一个清晰边界：自动化命令全部 `passed`、机器证据缺口为 0、证据包 HEAD 新鲜，但 v1 仍是 `not_complete`。后续为了记录审计结果产生的 docs-only 提交，可以由 `current_with_docs_only_changes` 表示“产品代码未变”，但不能改变人工验收结论。

HEAD `ca74628` 的 full audit 再次确认 HTML Review Pack 增强没有降低验收门槛：`.tmp/ios-acceptance-evidence/current-head-final-20260601-ca74628-lan` 已生成当前 HEAD 证据包，Markdown / HTML Review Pack 均已生成，`.tmp/v1-completion-audit/current-full-final-20260601-ca74628-lan` 中 21 个自动化命令全部 `passed`，`packageFreshness.status=current`，`manualEvidence.missingEvidenceCount=0`。但 14 个 item 仍是 `pending`，`acceptanceVerdict=not_evaluated`，所以 `verdict=not_complete`。

后续协作必须遵守：

- 不再用“继续补自动截图”替代人工验收。当前缺口报告已经显示 14 个 item 的 `missingEvidence=无`，问题是 `status=pending` 和顶层 `acceptanceVerdict=not_evaluated`。
- HTML Review Pack 只用于点击打开候选证据，帮助操作者逐项复核截图、录屏、API 摘要、bridge marker、系统 artifact 和操作者备注。
- AI 可以继续帮助生成 filled 草稿、运行 `--require-complete`、整理 audit 产物和解释缺口，但不能自行把 item 标为 `passed`。
- 如果操作者已经真实复核，可以使用 `pnpm prepare:ios-manual-evidence-record -- --record <review> --output <filled> --mark-passed --operator <name> --confirmed-at <iso8601>` 生成签署记录；随后必须运行 `node scripts/validate-ios-manual-evidence-record.mjs --record <filled> --require-complete --report <report>` 和 `pnpm collect:v1-completion-audit -- --run-automated-commands --manual-record <filled>`。
- 未执行飞书 / Obsidian 真实同步前，外部同步状态必须继续是 `not_synced`，最终回复继续披露“仓库已更新，外部知识库未同步”。

## iOS 权限专项 UI test 隔离规则

权限专项测试要验证目标系统权限弹窗，而不是被其他系统能力同步抢占：

- 语音 / 麦克风权限测试可以设置 `AI_CODE_UI_TEST_DISABLE_CALENDAR_PERMISSION_REQUESTS=1` 和 `AI_CODE_UI_TEST_DISABLE_NOTIFICATION_PERMISSION_REQUESTS=1`，隔离日历同步和通知同步触发的无关系统弹窗。
- 通知系统测试可以设置 `AI_CODE_UI_TEST_DISABLE_CALENDAR_PERMISSION_REQUESTS=1`，避免日历权限弹窗抢在通知授权或通知 banner 前出现。
- 这些 env 只用于 UI test 隔离，不代表产品运行时关闭系统能力；正式 App 手动验收仍要覆盖日历、通知、语音和附件的真实系统权限路径。
- `AI_CODE_UI_TEST_DISABLE_SYSTEM_PERMISSION_REQUESTS` 仍是更粗粒度的测试开关；新增分域开关优先用于专项测试，避免把目标权限链路也一并关闭。
- native-shells 护栏必须检查这些 env 是否仍存在于 iOS shell 和 UI test 中，防止未来重构让 full audit 重新受到无关权限弹窗污染。

## 近未来本地通知调度规则

通知调度要保留秒级信息：

- `UNCalendarNotificationTrigger` 的 date components 必须包含 `.second`，不能只保留到分钟。
- “1 分钟后提醒我...”这类采证或测试用例常常落在当前分钟边界附近；如果秒被截断，触发时间可能变成当前或过去分钟，导致系统通知不出现或不稳定。
- 通知 UI test 的职责是验证真实系统通知 banner、系统通知截图和点击回流；不能通过延长等待或放宽断言掩盖调度时间被截断的问题。

## aad07e7 full audit 后的协作边界

HEAD `aad07e7` 的 full audit 显示 21 个自动化命令全部 `passed`，`validate:ios-voice-permission-ui-test` 和 `validate:ios-notification-ui-test` 已在 full audit 内恢复通过，当前 HEAD 证据包 `missingEvidenceCount=0` 且 `packageFreshness.status=current`。

后续协作边界：

- 不再把当前 v1 阻塞归因于代码门禁失败；当前阻塞是人工验收签署尚未完成。
- Review Pack 的“必需证据”展示只能帮助操作者核对材料，不能把 review 记录自动升级为 filled / passed。
- 如果继续推进 completion，下一步应让真实操作者打开 `.tmp/ios-acceptance-evidence/current-head-final-20260601-aad07e7-lan/manual-evidence-review-pack.html` 逐项复核，再生成 filled 记录。
- 未执行飞书 / Obsidian 真实同步前，外部同步仍必须保持 `not_synced`，最终回复继续披露“仓库已更新，外部知识库未同步”。

## Review Pack 新鲜度规则

Review Pack 的 `packageFreshness` 必须与 completion audit 保持一致：

- `recordHeadSha === currentHeadSha` 时显示 `current`。
- record HEAD 之后如果仅包含 `docs/`、`ai-factory/memory/`、`README.md` 或 `AGENTS.md` 变更，显示 `current_with_docs_only_changes`，并列出 `postRecordChangedFiles`。
- record HEAD 之后只要触及 `scripts/`、`apps/`、`python/`、`packages/`、`package.json` 等产品、采证或门禁代码，仍必须显示 `stale`，并要求重新采证 / 审计。
- `current_with_docs_only_changes` 只说明“文档记录提交没有让证据失效”，不说明人工验收已经完成；`pending` / `not_evaluated` 仍然不能进入 complete 结论。
- native-shells 护栏要检查 Review Pack 的 docs-only freshness 行为，避免 Review Pack 和 completion audit 后续再次出现 freshness 判断分裂。

## 人工签署逐项确认规则

2026-06-01 起，人工验收 passed filled 记录必须带逐项确认闸门。这个规则的目标是防止“候选证据齐了，所以直接一键全绿”的误签，而不是替代操作者判断。

- `pnpm prepare:ios-manual-evidence-record -- --mark-passed` 必须同时传入完整 `--reviewed-item <item-id>` 列表。
- `pnpm prepare:ios-manual-review-pack` 会生成 `manual-evidence-reviewed-items.json`，签署时可以用 `--reviewed-items-file <path>` 代替 14 个重复参数，降低复制漏项风险。
- `manual-evidence-reviewed-items.json` 默认必须带 `recordHeadSha`；签署脚本读取该文件时会与当前人工记录 `headSha` 比较，防止拿旧证据包的确认列表签当前 HEAD。
- 脚本必须校验确认列表与 `record.items[].id` 完全一致后，才允许全量 passed；缺项、未知项或重复项都应失败。
- `operatorSignoff.reviewedItemIds` 必须写入最终签署记录，draft 模式保留空数组。
- Review Pack 的 Markdown / HTML 签署命令必须引用确认列表文件或自动展开全部 item id，方便操作者逐项打开截图、录屏、API 摘要、bridge marker 和系统 artifact 后再复制运行。
- `validate:native-shells` 必须守住 `reviewedItemIds`、`--reviewed-item`、`--reviewed-items-file`、`manual-evidence-reviewed-items.json` 和 `recordHeadSha` 护栏，避免未来重构把逐项确认退化成单按钮全绿或跨 HEAD 误签。
- 即使 21 个自动化命令全部通过、`missingEvidenceCount=0`、`packageFreshness=current`，只要 14 个 item 仍是 `pending` 或 `acceptanceVerdict=not_evaluated`，completion audit 就必须保持 `not_complete`。

HEAD `e91c303` 的 full audit 已按该规则重新归档：`.tmp/v1-completion-audit/current-full-final-20260601-e91c303-lan` 中 21 个自动化命令全部 `passed`，`manualEvidence.missingEvidenceCount=0`，但 14 个人工验收 item 仍全部为 `pending`，所以 goal 仍不能标记 complete。

HEAD `754098e` 在此基础上增加确认列表文件入口：`.tmp/ios-acceptance-evidence/current-head-final-20260601-754098e-lan/manual-evidence-reviewed-items.json` 包含 14 个 item id，Review Pack 的签署命令使用 `--reviewed-items-file`；full audit `.tmp/v1-completion-audit/current-full-final-20260601-754098e-lan` 中 21 个自动化命令全部 `passed`，`manualEvidence.missingEvidenceCount=0`，但 14 个人工验收 item 仍全部为 `pending`，所以 goal 仍不能标记 complete。

HEAD `a118819` 进一步把确认列表文件绑定到人工记录 HEAD：`.tmp/ios-acceptance-evidence/current-head-final-20260601-a118819-lan/manual-evidence-reviewed-items.json` 写入 `recordHeadSha=a118819` 和 14 个 item id，签署脚本会拒绝 `recordHeadSha` 与当前 review 记录不一致的文件；full audit `.tmp/v1-completion-audit/current-full-final-20260601-a118819-lan` 中 21 个自动化命令全部 `passed`，`manualEvidence.missingEvidenceCount=0`，但 14 个人工验收 item 仍全部为 `pending`，所以 goal 仍不能标记 complete。

## 人工验收 Handoff 规则

2026-06-01 起，人工验收收口可以优先使用 `pnpm prepare:ios-manual-handoff`。这个入口解决的是“操作者从哪里开始、按什么顺序签署和复验”的问题，不改变验收标准。

- `pnpm prepare:ios-manual-handoff -- --record <path|best|latest>` 会生成 `manual-acceptance-handoff.md`，并刷新同目录的 Markdown / HTML Review Pack 和 `manual-evidence-reviewed-items.json`。
- 同一命令也会生成 `manual-acceptance-handoff.html`；HTML Handoff 应提供可点击的 Review Pack 链接，并保留可从仓库根目录复制执行的签署、校验和 audit 命令。
- Handoff 文件必须集中展示 HTML Review Pack 打开命令、`--mark-passed` 签署命令、`validate-ios-manual-evidence-record --require-complete` 命令和正式 `collect:v1-completion-audit --run-automated-commands` 命令。
- Handoff 必须明确写出“本文件不代表验收通过”，并继续要求真实操作者逐项复核。
- `manual-evidence-reviewed-items.json` 仍必须带 `recordHeadSha`，签署脚本仍必须拒绝跨 HEAD 文件。
- `validate:native-shells` 必须守住 handoff 根命令、Markdown / HTML 生成函数、测试和关键边界文案，防止验收入口回退为散落命令。

HEAD `ad63244` 已按该规则重新归档：`.tmp/ios-acceptance-evidence/current-head-final-20260601-ad63244-lan/manual-acceptance-handoff.md` 是当前人工收口入口，`.tmp/v1-completion-audit/current-full-final-20260601-ad63244-lan` 中 21 个自动化命令全部 `passed`，`manualEvidence.missingEvidenceCount=0`，但 14 个人工验收 item 仍全部为 `pending`，所以 goal 仍不能标记 complete。

HEAD `121a330` 在此基础上生成 HTML Handoff：`.tmp/ios-acceptance-evidence/current-head-final-20260601-121a330-lan/manual-acceptance-handoff.html` 可直接打开并跳转到同目录的 HTML Review Pack；full audit `.tmp/v1-completion-audit/current-full-final-20260601-121a330-lan` 中 21 个自动化命令全部 `passed`，`manualEvidence.missingEvidenceCount=0`，但 14 个人工验收 item 仍全部为 `pending`，所以 goal 仍不能标记 complete。

## HTML Handoff 签署命令生成器规则

2026-06-01 起，`manual-acceptance-handoff.html` 可以作为人工验收签署的主入口。HTML Handoff 的职责是降低操作者复核成本，而不是降低 completion 标准。

- HTML Handoff 必须展示 14 个人工验收 item 的逐项 checkbox，并把 item id 写入 `data-item-id`。
- 只有全部 checkbox 勾选，且填写 `operator` 与 `confirmedAt` 后，页面才生成 `pnpm prepare:ios-manual-evidence-record -- --mark-passed ... --reviewed-items-file ...` 命令。
- 生成器必须引用同目录 `manual-evidence-reviewed-items.json`，该文件仍必须带 `recordHeadSha`，签署脚本仍必须拒绝跨 HEAD 文件。
- 页面默认填入当前 ISO 时间只是减少录入成本，不代表签署已经发生；真实操作者仍必须逐项打开 HTML Review Pack 中的截图、录屏、API 摘要、bridge marker 和系统 artifact 后再运行命令。
- `validate:native-shells` 必须守住 `reviewedItemChecklistHtml`、`data-item-id`、`operator-name`、`confirmed-at`、`generated-sign-command`、`updateSignCommand` 和 `allItemsReviewed`，防止后续重构把逐项确认生成器退化成无门槛签署按钮。

HEAD `0750636` 已按该规则重新归档：`.tmp/ios-acceptance-evidence/current-head-final-20260601-0750636-lan/manual-acceptance-handoff.html` 包含签署命令生成器；full audit rerun `.tmp/v1-completion-audit/current-full-final-20260601-0750636-lan-rerun` 中 21 个自动化命令全部 `passed`，`manualEvidence.missingEvidenceCount=0`，但 14 个人工验收 item 仍全部为 `pending`，所以 goal 仍不能标记 complete。

## HTML Handoff 命令复制规则

2026-06-08 起，`manual-acceptance-handoff.html` 的命令块必须支持复制。该规则解决的是人工交接过程中的误复制风险，不改变验收边界。

- 固定命令块用 `.copy-command` 按钮和 `data-copy-text` 保存完整命令，避免操作者拖选长命令时漏选。
- 签署命令生成器用 `#copy-generated-sign-command` 和 `data-copy-target="generated-sign-command"` 复制当前生成命令。
- `#copy-command-status` 必须反馈复制成功、无可复制命令或复制失败。
- 复制失败时页面只能提示手动选择命令文本，不能绕过逐项 checkbox、`operator`、`confirmedAt` 或 `manual-evidence-reviewed-items.json` 的 HEAD 校验。
- `validate:native-shells` 必须守住 `copy-command`、`copy-generated-sign-command` 和 `function copyCommand`，防止 Handoff 回退为只能手动拖选命令。

HEAD `8de7b4e` 已按该规则重新归档：`.tmp/ios-acceptance-evidence/current-head-final-20260608-8de7b4e-lan/manual-acceptance-handoff.html` 包含固定命令复制按钮和生成签署命令复制按钮；full audit `.tmp/v1-completion-audit/current-full-final-20260608-8de7b4e-lan` 中 21 个自动化命令全部 `passed`，`manualEvidence.packageFreshness.status=current`，但 14 个人工验收 item 仍全部为 `pending`，`acceptanceVerdict=not_evaluated`，所以 goal 仍不能标记 complete。

## 通知候选证据导入规则

2026-06-08 起，Handoff 可以辅助导入通知 UI test 产物，但该能力只补候选 evidence，不做人工验收签署。

- Handoff 的“当前补证重点”必须从 `requiredEvidence` 与 `evidence` 的实际差异生成，帮助操作者优先补缺少的候选材料。
- 当缺口涉及 `local_notification` 或 `notification_click_backflow` 时，Handoff 可以展示 `pnpm validate:ios-notification-ui-test` 和 `--attach-notification-ui-test-metadata` 辅助命令。
- `--attach-notification-ui-test-metadata` 只允许读取 `passed=true` 且 log / xcresult / video 文件都存在的 `notification-ui-test.json`。
- 导入后只能追加 `systemArtifacts` 和 operator note，不能修改 item `status`、顶层 `acceptanceVerdict`、`manualAcceptanceRequired` 或 `automationCanReplaceManualAcceptance`。
- `--attach-notification-ui-test-metadata` 必须拒绝和 `--mark-passed` 同次使用，强制操作者先生成 pending draft，再人工复核签署。
- 即使 `manualEvidence.missingEvidenceCount=0`，只要 14 个 item 仍是 `pending`，completion audit 必须继续 `not_complete`。

HEAD `029fdf5` 已按该规则重新归档：`.tmp/ios-acceptance-evidence/current-head-final-20260608-029fdf5-lan/manual-acceptance-handoff.html` 的当前补证重点显示没有缺少候选证据；full audit `.tmp/v1-completion-audit/current-full-final-20260608-029fdf5-lan` 中 21 个自动化命令全部 `passed`，`manualEvidence.missingEvidenceCount=0`，`manualEvidence.packageFreshness.status=current`，但 14 个人工验收 item 仍全部为 `pending`，`acceptanceVerdict=not_evaluated`，所以 goal 仍不能标记 complete。

## Handoff 到 Review Pack 的逐项证据链接

2026-06-08 起，HTML Handoff 的逐项确认清单必须能直接跳转到 HTML Review Pack 中对应证据段。这个规则继续服务人工复核，不改变人工验收边界。

- HTML Review Pack 中每个验收 item 必须有稳定锚点 `item-<itemId>`。
- HTML Handoff 中每个 checkbox item 必须提供“查看证据”链接，指向同目录 `manual-evidence-review-pack.html#item-<itemId>`。
- 操作者应先通过“查看证据”打开对应段落，复核截图、录屏、API 摘要、Bridge marker、system artifact 和备注，再决定是否勾选该 item。
- `validate:native-shells` 必须守住 `itemAnchorId`、HTML item id、`查看证据` 和 `#item-*` 字符串，防止后续重构让清单和证据包重新脱节。
- 该链接只减少人工查找成本；即使全部链接存在、候选证据完整，`status=pending` 和 `acceptanceVerdict=not_evaluated` 仍必须保持 `not_complete`。

HEAD `ed0b281` 已提交该规则：`manual-acceptance-handoff.html` 的 14 个 checkbox item 均可跳到 `manual-evidence-review-pack.html#item-...`。同 HEAD 生成的 lightweight audit `.tmp/v1-completion-audit/current-full-final-20260608-ed0b281-lan` 由于未运行 `--run-automated-commands` 且本机 `H5DevServerURL` 为 `127.0.0.1`，显示 `manualEvidence.missingEvidenceCount=11`；它只证明新链接能力可生成，不代表正式 full audit 已完成。

## Handoff 缺证防误签规则

2026-06-08 起，人工验收 Handoff 必须区分“候选证据补证模式”和“人工签署模式”。这个规则用于防止缺候选证据时误运行 `--mark-passed`，不改变真实人工验收标准。

- Handoff 必须从 `requiredEvidence` 与 `evidence` 的实际差异计算 `missingEvidenceFocusItems`。
- 如果仍有候选证据缺口，Markdown / HTML Handoff 只能展示补证路径：
  - 打开 HTML Review Pack。
  - 展示当前补证重点。
  - 必要时展示通知 UI test metadata 导入辅助命令。
  - 展示重新生成 Handoff 的命令。
- 如果仍有候选证据缺口，Handoff 不能输出包含 `--mark-passed` 的可执行签署命令。
- 如果仍有候选证据缺口，HTML Handoff 必须显示“签署命令生成器已停用”，且不能渲染 `generated-sign-command` 或 `copy-generated-sign-command`。
- 只有候选证据缺口为 0 时，HTML Handoff 才能渲染签署命令生成器；即便如此，仍必须要求逐项 checkbox、`operator`、`confirmedAt` 和 HEAD 绑定的 `manual-evidence-reviewed-items.json`。
- 该规则只防止误签；即使候选证据缺口为 0，只要 14 个人工验收 item 仍是 `pending`，completion audit 仍必须 `not_complete`。

当前实现已用正式 LAN record 复核：`.tmp/ios-acceptance-evidence/current-head-final-20260608-d9618d8-lan/manual-acceptance-handoff.html` 因 `missingEvidenceCount=0` 继续保留签署命令生成器；测试 fixture 中存在缺口时，Handoff 会进入“签署命令生成器已停用”状态。

HEAD `1bb9d83` 已按该规则重新归档：`.tmp/ios-acceptance-evidence/current-head-final-20260608-1bb9d83-lan/manual-acceptance-handoff.html` 因候选证据缺口为 0，继续保留签署命令生成器；full audit `.tmp/v1-completion-audit/current-full-final-20260608-1bb9d83-lan` 中 21 个自动化命令全部 `passed`，`manualEvidence.missingEvidenceCount=0`，`packageFreshness.status=current`，但 14 个人工验收 item 仍全部为 `pending`，所以 goal 仍不能标记 complete。

## LAN Full Audit 的测试环境隔离规则

正式 LAN full audit 会把局域网 URL 注入父进程环境，供 iOS build、Simulator smoke 和 UI test 使用。采证脚本自身的 dry-run 单测必须隔离这些外部 URL，避免“默认值测试”被正式 audit 环境污染。

- `collect-ios-acceptance-evidence.test.mjs` 的子进程测试必须通过 `testEnv()` 或同等 helper 传入环境。
- `testEnv()` 必须删除 `H5_DEV_SERVER_URL`、`AI_CODE_H5_NATIVE_BASE_URL` 和 `AI_CODE_API_BASE_URL`，再合并测试需要的 metadata / seed override。
- 如果某个测试是在验证默认 URL，就不能隐式继承 full audit 的 LAN URL。
- 如果某个测试是在验证 env override 行为，必须只注入该测试明确需要的变量。
- `validate:ios-acceptance-evidence` 必须能在 LAN full audit 环境下通过，不能要求调用者先手动 unset URL 变量。

HEAD `d9618d8` 已按该规则修复并归档：在 LAN 环境下单独运行 `pnpm validate:ios-acceptance-evidence` 通过 29 个测试；full audit `.tmp/v1-completion-audit/current-full-final-20260608-d9618d8-lan` 中 21 个自动化命令全部 `passed`，`manualEvidence.missingEvidenceCount=0`，但 14 个人工验收 item 仍全部为 `pending`，所以 goal 仍不能标记 complete。

## 正式 iOS 采证 LAN 前置校验规则

2026-06-08 起，正式 iOS 验收证据包应在采集入口显式要求局域网 H5 地址，避免用 loopback 环境生成看似完整但不满足正式验收条件的证据包。

- 正式 LAN full audit 前的 `collect:ios-acceptance-evidence` 命令应带 `--require-lan-h5`，或设置 `AI_CODE_IOS_ACCEPTANCE_REQUIRE_LAN_H5=1`。
- 采证脚本必须记录 `serviceHealth.h5NativeUrlKind`、`ios.h5DevServerUrlKind`、`ios.formalReadiness` 和 `manifest.formalReadiness`。
- `loopback` 包括 `localhost`、`127.*` 和 `::1`，不能用于正式 LAN 采证。
- `private_lan` 包括 `10/8`、`172.16/12`、`192.168/16` 和 `169.254/16`。
- 开启 `--require-lan-h5` 后，如果 `H5DevServerURL` 不是 `private_lan`，采证脚本必须快速失败并写出 `acceptance-evidence.json` / `manifest.json`，便于定位错误环境。
- 快速失败不能生成 passed 或人工签署材料；它只说明采证入口配置不满足正式验收条件。
- `validate:native-shells` 必须守住 `--require-lan-h5`、`AI_CODE_IOS_ACCEPTANCE_REQUIRE_LAN_H5`、`formalReadiness`、`h5NativeUrlKind`、`h5DevServerUrlKind`、`private_lan` 和失败文案，防止该门禁被移除。

已验证：

```bash
node --test scripts/collect-ios-acceptance-evidence.test.mjs
node --check scripts/collect-ios-acceptance-evidence.mjs
node --test scripts/validate-native-shells.test.mjs
pnpm validate:ios-acceptance-evidence
pnpm validate:native-shells
```

该规则只前移环境校验，不改变 completion 结论：即使正式 LAN 采证通过，14 个人工验收 item 仍必须由真实操作者逐项复核并签署后，completion audit 才可能进入 complete。

HEAD `9e3c418` 已按该规则重新归档：正式证据包 `.tmp/ios-acceptance-evidence/current-head-final-20260608-9e3c418-lan` 使用 `--require-lan-h5` 生成，`serviceHealth.h5NativeUrlKind=private_lan`、`ios.h5DevServerUrlKind=private_lan`、`formalReadiness.ready=true`；full audit `.tmp/v1-completion-audit/current-full-final-20260608-9e3c418-lan` 中 21 个自动化命令全部 `passed`，`manualEvidence.missingEvidenceCount=0`，`packageFreshness.status=current`，但 14 个人工验收 item 仍全部为 `pending`，所以 goal 仍不能标记 complete。

## Best 人工证据选择规则

2026-06-08 起，`--manual-record best` 必须把 docs-only 新鲜度纳入候选排序，避免默认 Handoff 或 completion audit 在多证据包并存时误选旧 HEAD 的 filled 记录。

- `best` 的 freshness 优先级是：`current`、`current_with_docs_only_changes`、`missing_record_head/unknown`、`stale`。
- freshness 相同时，才比较 `requireCompletePassed`、`missingEvidenceCount`、文件优先级和 mtime。
- freshness 相同且候选都不是 exact current 时，优先选择 `selectedPostRecordChangedFiles` 更少的记录，避免所有候选都 stale 后旧 filled 包压过更接近当前 HEAD 的 review 包。
- `latest` 仍保持纯 mtime 语义，只用于操作者明确想看最新写入记录时。
- `selection.selectedPostRecordChangedFiles` 必须记录被选中候选相对当前 HEAD 的变更文件，并传入最终 `packageFreshness`，避免候选排序与最终报告不一致。
- 旧 filled 包不能压过 docs-only 新鲜的当前 review 包；真实人工签署状态仍由 `requireCompletePassed` 和 item status 决定。
- 旧 stale 包不能仅凭 filled 文件名压过距离当前 HEAD 更近的 stale review 包；若二者同为 stale，先按变更文件数量衡量“离当前 HEAD 更近”。
- dry-run 记录中的占位 `headSha`（例如包含命令文本的字符串）必须标记为 `invalid_record_head`，排在真实 stale 记录之后，避免干扰正式 best 选择。

HEAD `a00ae87` 已按该规则重新归档：`best-selection-check-20260608-a00ae87` 和 full audit `.tmp/v1-completion-audit/current-full-final-20260608-a00ae87-lan` 都选择 `.tmp/ios-acceptance-evidence/current-head-final-20260608-a00ae87-lan/manual-evidence-record.review.json`；21 个自动化命令全部 `passed`，`manualEvidence.missingEvidenceCount=0`，`packageFreshness.status=current`，但 14 个人工验收 item 仍全部为 `pending`，所以 goal 仍不能标记 complete。

## 人工验收 Completion 签署强校验

2026-06-08 起，`--require-complete` 不再只看 `acceptanceVerdict=passed`、item `status=passed` 和证据字段，还必须校验人工签署元数据。这个规则用于防止直接手改 JSON 绕过 Handoff / Review Pack 的逐项复核流程。

- passed filled 记录必须包含 `operatorSignoff.mode=mark-passed`。
- `operatorSignoff.operator` 必须非空。
- `operatorSignoff.confirmedAt` 必须是可解析的 ISO 8601 时间。
- `operatorSignoff.reviewedItemIds` 必须与 `record.items[].id` 完全一致，不能漏项、重复或混入未知 item。
- 如果记录包含 `headSha`，`operatorSignoff.recordHeadSha` 必须与记录 `headSha` 相同。
- `pnpm prepare:ios-manual-evidence-record -- --mark-passed` 会写入 `recordHeadSha`；默认 draft 模式不写 passed 签署字段，也不会改变 `pending` / `not_evaluated`。
- 机器预填候选证据和 future machine precheck 不能替代 `operatorSignoff`；没有真实操作者签署的记录必须保持 `not_complete`。

已验证：

```bash
node --test scripts/validate-ios-manual-evidence-record.test.mjs scripts/fill-ios-manual-evidence-record.test.mjs scripts/collect-v1-completion-audit.test.mjs
pnpm validate:ios-manual-evidence-record
pnpm validate:native-shells
pnpm collect:v1-completion-audit -- --manual-record best --manual-record-root .tmp/ios-acceptance-evidence --output-dir .tmp/v1-completion-audit/signoff-gate-check-20260608 --external-knowledge-status not_synced
```

轻量 audit `.tmp/v1-completion-audit/signoff-gate-check-20260608` 仍选择 `a00ae87` review 记录，`missingEvidenceCount=0`，但现在明确列出缺少 `operatorSignoff` 和 14 个 item 仍 pending；结论保持 `verdict=not_complete`。

## 当前 HEAD 人工复核入口刷新规则

2026-06-08 HEAD `4281375` 已重新生成当前 LAN 辅助证据包和人工复核入口。以后继续推进 v1 completion 时，默认应优先使用当前 HEAD 的 Handoff / Review Pack，而不是旧 HEAD 的历史 full audit 包。

- 当前证据包：`.tmp/ios-acceptance-evidence/current-head-final-20260608-4281375-lan`。
- 当前 HTML Handoff：`.tmp/ios-acceptance-evidence/current-head-final-20260608-4281375-lan/manual-acceptance-handoff.html`。
- 当前 HTML Review Pack：`.tmp/ios-acceptance-evidence/current-head-final-20260608-4281375-lan/manual-evidence-review-pack.html`。
- 当前 HEAD 绑定确认列表：`.tmp/ios-acceptance-evidence/current-head-final-20260608-4281375-lan/manual-evidence-reviewed-items.json`。
- 当前 lightweight audit：`.tmp/v1-completion-audit/current-lightweight-20260608-4281375-lan`。
- 当前 full audit：`.tmp/v1-completion-audit/current-full-final-20260608-a4b9385-lan`。

本轮 `4281375` 证据包使用 `--require-lan-h5` 生成，`formalReadiness.ready=true`，H5 native URL 和构建产物 `H5DevServerURL` 都是 `private_lan`。lightweight audit 中 `manualEvidence.packageFreshness.status=current`、`recordHeadSha=4281375`、`currentHeadSha=4281375`、`manualEvidence.missingEvidenceCount=0`。

HEAD `a4b9385` 已补跑 full audit：21 个自动化命令全部 `passed`，`--manual-record best` 选择 `4281375` 的 review record，`manualEvidence.missingEvidenceCount=0`，`manualEvidence.packageFreshness.status=current_with_docs_only_changes`。后续变更只包含 `ai-factory/memory/` 与 `docs/` 源稿，因此不构成产品代码旧 HEAD 阻塞。

边界必须保持清楚：

- `4281375` 的 lightweight audit 没有使用 `--run-automated-commands`；`a4b9385` 的 full audit 已补齐 21 项自动化基线。
- 因为当前人工记录仍是 review 记录，14 个 item 全部 `pending`，且缺少 `operatorSignoff`，所以 goal 仍不能标记 complete。
- 正式 completion 必须由真实操作者基于 `4281375` Review Pack 逐项复核，生成 signed filled record，再用该 filled record 重跑 `pnpm collect:v1-completion-audit -- --run-automated-commands --manual-record <filled-path> --external-knowledge-status ...`。
- 本轮只更新仓库源稿，未执行飞书或 Obsidian 真实同步；最终回复仍必须说明“仓库已更新，外部知识库未同步”。

## 人工验收机器预检规则

2026-06-10 起，Handoff / Review Pack 需要把“候选证据完整性”和“人工验收通过”分开展示。

- 机器预检字段统一命名为 `machinePrecheck`。
- 格式为 `candidateEvidenceComplete=<n>/<total>, incomplete=<m>, requiresHumanSignoff=true`。
- `candidateEvidenceComplete` 只统计 `requiredEvidence` 是否能在对应 `evidence` 中找到候选材料。
- `requiresHumanSignoff=true` 必须始终保留，避免被误解成自动验收。
- Review Pack 逐项展示候选证据齐备或缺口数量。
- Handoff 在第一屏展示机器预检摘要；当缺口为 0 时，仍必须提示“这仍不代表验收通过”。
- 机器预检不能修改 `acceptanceVerdict`、item `status`、`operatorSignoff` 或 completion audit 结论。
- 即使 `machinePrecheck=14/14`，最终完成仍必须依赖真实操作者 signed filled record 和 `--run-automated-commands` full audit。

已重新生成当前 `4281375` LAN Handoff / Review Pack，当前机器预检为 `candidateEvidenceComplete=14/14, incomplete=0, requiresHumanSignoff=true`。该结果用于减少人工复核定位成本，不改变 goal 未完成状态。
