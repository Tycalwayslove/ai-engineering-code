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
