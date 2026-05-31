# 03 阶段演进记录

## 阶段 0：架构设计

最初目标不是马上做产品功能，而是先定义 AI 原生软件工厂的基础结构。

关键决策：

- 采用 TypeScript + Python 双生态。
- 使用 pnpm workspace 和 Turborepo 管理前端生态。
- 使用 FastAPI 作为第一个 Python 后端入口。
- 暂缓 LangGraph、向量数据库和微服务拆分。
- 把 `ai-factory/` 作为一等基础设施。

## 阶段 1：仓库骨架

完成内容：

- 建立 `apps/`、`packages/`、`python/`、`contracts/`、`ai-factory/`、`services/`、`docs/`。
- 每个主要目录补充 README、用途、边界和演进路径。
- 建立 Docker Compose、CI、lint、typecheck、test 和 contract validation 基线。

阶段价值：

仓库从一开始就对 AI 可读。目录名称、边界和职责是显式的，不依赖隐性约定。

## 阶段 2：中文化与协作约定

完成内容：

- 将仓库 Markdown 文档改为中文。
- 增加中文 Conventional Commits 约定。
- 明确 AI 可读性、反模式、演进原则、命名规则和权威来源规则。

阶段价值：

项目不只服务代码运行，也服务长期协作、复盘和面试展示。

## 阶段 3：第一条端到端薄切片

完成内容：

- 实现 `/factory/status`。
- 增加后端显式能力注册表。
- 扩展 OpenAPI、shared-types 和 SDK。
- 在 Admin 页面展示工厂状态面板。
- 增强契约校验，防止 API、SDK、类型出现明显漂移。

阶段价值：

证明架构不是空文档，而是已经可以通过一个小能力贯穿契约、后端、SDK 和前端。

## 阶段 4：成果展示体系

完成内容：

- 使用 Obsidian 记录阶段成果。
- 连接个人飞书账号。
- 建立飞书面试展示知识库。
- 将项目演进从内部工作笔记提炼为外部读者可理解的叙事。

阶段价值：

项目形成 GitHub、Obsidian、飞书三层证据链：代码可验证，过程可追踪，成果可展示。

## 阶段 5：流程审计基线

完成内容：

- 给当前雏形状态打 tag：`v0.1.0-skeleton`。
- 将 AI 工厂流程拆成治理、规格、记忆、提示词、工作流、契约、运行时、设计系统、质量门禁和知识同步十个块。
- 逐块审计当前状态、问题和待完善点。
- 明确下一阶段应先做 `Phase 1.1：AI 工厂流程稳定化`，暂缓大规模产品功能开发。

阶段价值：

项目开始从“有雏形”进入“有稳定流程”的阶段。下一步重点不是堆功能，而是让 AI factory 的工作流、记忆、提示词和质量门禁更可靠。

## 阶段 6：Phase 1.1 流程稳定化

完成内容：

- 补齐 Phase Gate、规格生命周期、记忆生命周期、契约生命周期和发布规则。
- 补齐最小 Prompt 集、Agent 角色规范、核心 Workflow、Manifest 和 Run Record 模板。
- 补齐 feature-development、bugfix、review、release 四个 Playbook。
- 新增 requirements/design 契约入口。
- 新增 `pnpm validate:factory`，并接入 CI。
- 补齐设计系统最小规则和知识同步规则。

阶段价值：

AI 工厂从“文档化雏形”进入“流程可检查”的状态。下一步可以运行真实样例来验证流程，而不是直接进入产品功能开发。

## 阶段 7：第一条真实流程演练

完成内容：

- 选择 `AI Factory Intake：想法到产品理解入口` 作为第一条真实流程样例。
- 运行 `idea-to-product-understanding`，生成产品理解记录并停在人工确认点。
- 用户确认方向准确，并要求补充 Intake 分类。
- 运行 `requirement-capture`，生成需求点记录。
- 用户确认需求陈述正确，分类增加 `竞品观察` 和 `用户反馈`。
- 用户确认该需求不进入 PRD 候选池。

阶段价值：

这次演练证明 AI 工厂已经能处理“真实但不进入产品开发”的流程输入。它保留了产品理解、需求点记录、运行记录和人工决策，避免 AI 把一个流程基础设施误推进为产品功能。

## 阶段 8：第一个正式产品方向

完成内容：

- 确定第一个正式产品方向：`AI 时间管理 Agent`。
- 将原始想法从“AI 对话式日程管理”提升为“个人时间管理 Agent”。
- 明确第一版先跑通 App 内部日程、待办、提醒闭环。
- 明确 Hybrid 边界：Native 稳定壳、H5 产品层、Bridge Contract 显式通信。
- 明确账号体系、语音输入、手机系统日历、飞书会议和 Things3 后续开发。
- 完成产品理解与需求点记录，并确认进入 Phase 1.2 PRD 候选。

阶段价值：

项目开始从流程基础设施进入产品资产生产阶段。第一个产品方向已经具备可追溯的 Intake、产品理解、需求点记录和人工确认链路，为后续 PRD、设计 brief 和 UI 设计图提供输入。

## 阶段 9：第一个 PRD 草案

完成内容：

- 新增显式 `prd-draft` 工作流和 manifest。
- 将 `prd-draft` 纳入 `pnpm validate:factory` 校验。
- 基于已确认需求基线生成 `AI 时间管理 Agent` PRD 草案。
- 明确第一版 P0 范围、非目标、用户流程、Hybrid 边界、数据策略和待确认问题。
- 将 PRD 草案停在人工确认点，未进入设计或开发。

阶段价值：

项目完成了从产品想法到 PRD 草案的第一条主流程链路。下一步可以在用户确认 PRD 后进入 design brief 和 UI 设计图，而不是直接写功能代码。

## 阶段 10：第一个 Design Brief 草案

完成内容：

- 用户确认 AI 时间管理 Agent PRD 草案，允许进入下一阶段。
- 新增显式 `design-brief-draft` 工作流和 manifest。
- 新增 `ai-factory/specs/design/` 目录，保存设计规格。
- 将 `design-brief-draft` 纳入 `pnpm validate:factory` 校验。
- 生成 AI 时间管理 Agent 的 design brief 草案。
- 明确信息优先级、核心视图、状态覆盖、组件需求、响应式要求和 Hybrid 设计约束。

阶段价值：

项目完成了从 PRD 到设计输入的转换。后续 UI 设计图将有明确需求来源、信息架构、状态覆盖和组件层级，而不是凭直觉直接画页面。

## 阶段 11：第一个 UI 设计图草案

完成内容：

- 用户确认 design brief，允许进入 UI 设计图阶段。
- 新增显式 `ui-design-draft` 工作流和 manifest。
- 将 `ui-design-draft` 纳入 `pnpm validate:factory` 校验。
- 创建 Figma 文件：`AI 时间管理 Agent - UI 设计图 v0.1`。
- 生成 5 个核心画板：设计说明、工作台首页、AI 追问、确认卡片、时间对象列表。
- 新增 UI 设计图本地记录，保留 Figma 链接、覆盖范围、关键设计判断和待确认点。
- 用户反馈 v0.1 效果未达预期后，安装并使用 `ui-ux-pro-max` skill 重画 v0.2。
- v0.2 调整为“智能时间驾驶舱”，生成工作台首页、AI 创建、信息追问、执行确认、时间对象 5 个高保真移动端画板。
- 用户继续反馈 v0.2 未达到预期，并明确要求 iOS 26 风格、无底部 tab、底部输入、顶部 header、左侧面板和类似千问 App 的布局。
- v0.3 调整为“对话式时间管理 Agent”，生成主界面、侧滑面板、创建日程、无 tab 内容区、深色模式 5 个画板。
- 用户接受当前视觉方向后，继续补齐对象详情、编辑 sheet、时间收件箱、内部日历、待办与提醒、连接器与权限、通知授权、状态覆盖 8 个画板。
- 用户询问是否能在 Figma 上直接增加交互后，为 v0.3 补充可点击原型入口和 67 个交互热区。
- 当前原型可演示：打开侧滑面板、AI 创建日程、执行前确认、对象详情、编辑 sheet、侧栏导航、内部日历、待办提醒、连接器权限和状态恢复。

阶段价值：

项目完成了从 design brief 到 UI 设计图草案的转换，并验证了设计评审后的连续修订机制。UI 图不再是孤立视觉稿，而是可追溯到产品理解、需求点、PRD、设计输入、人工确认和修订记录的设计资产。补充原型交互后，它已经可以用于讲解第一条产品闭环，但仍不进入工程实现。

## 阶段 12：需求与 UI 方向重校准

完成内容：

- 用户认真评审 v0.3 后，指出顶部功能不清晰、跳转位置不清楚、侧栏用途不合理、特定日期创建事项需求表达不足。
- 用户提供参考产品截图和视频笔记，补充“聊天式执行、计划与执行流水线、DDD 领域边界、Smart Agent Dumb Tools、薄客户端”等关键启发。
- 将产品定位从“AI 时间管理工作台”修订为“AI 日程执行 Agent”。
- 确认 V1 只做日程管理领域，费用管理作为未来 DDD 独立领域预留。
- 确认首页默认是 AI 执行流，日历和 Timeline 是辅助检查与日期上下文工具。
- 确认 Timeline Drawer 参考 Timepage，展示今天 + 未来 7 天的日期轴和事项摘要。
- 确认实时执行状态固定在输入框上方，避免对话滚动后状态不可见。
- 新增需求修订方案、UI 修订方案和 workflow run 记录。

阶段价值：

这次没有把“不满意”理解成单纯视觉问题，而是通过流程回到需求、领域边界和信息架构。项目证明了 AI 工厂不只是生成文档和设计图，也能在评审反馈后保持同一目标连续性，回滚到正确层级重新修订。下一步应基于新修订文档重画 Figma v0.4，而不是直接进入工程开发。

## 阶段 13：Figma v0.4 重画

完成内容：

- 用户要求按已确认方案重画 Figma v0.4，并明确使用 `ui-ux-pro-max` skill。
- 创建 Figma 页面：`AI 时间管理 Agent v0.4`。
- 按“AI 执行流 + Timepage 风格 Timeline Drawer + 固定执行状态栏”重画 12 个画板。
- 覆盖首页、Timeline Drawer、信息补全、单项确认、批量确认、状态栏、执行结果、执行记录、完整日历、事项详情和交互关系。
- 绑定 16 个基础原型交互入口。
- 发现首页确认卡片与固定状态栏距离过近后，压缩为紧凑确认卡片，保持状态栏独立可见。
- 新增 Figma v0.4 workflow run 记录。

阶段价值：

v0.4 把上一阶段确认的产品判断落成可审阅视觉资产。它不再把日历当主入口，而是让 AI 执行流成为主舞台；Timeline 和日历都退回为辅助检查与日期上下文工具。这个阶段继续证明：AI 工厂流程可以把用户反馈、需求修订、设计约束和 Figma 资产串成一条可追溯链路。

## 阶段 14：本地设计系统与组件库规划

完成内容：

- 用户提出后续需要建立本地组件库，覆盖设计风格、代码组件库和可下载图标库。
- 将该事项独立规划为 `v0.5：本地设计系统与组件库基础版`。
- 明确 v0.5 不混入 Figma v0.4，也不直接进入产品功能开发。
- 新增本地设计系统规划文档，定义 tokens、Figma 组件、本地 `packages/shared-ui` 组件和图标库四层资产。
- 在 UI 设计图记录中补充 v0.5 组件库演进方向。
- 在 Obsidian 中记录阶段成果，方便后续回看为什么此事被单独拆版。
- 用户确认后，将 v0.5 规划落成可运行的本地组件库。
- 新增 `packages/shared-ui` 的 tokens、icons、primitives、composites、layouts 分层。
- 新增 H5 `/design-system` 示例页，用于查看组件库当前效果。
- 通过 TypeScript、H5 build、factory validation 和 HTTP 访问验证。
- 创建 Figma `AI 时间管理 Agent v0.5 Design System` 页面，沉淀本地组件、图标组件和代码映射区。
- 在 Figma 中补齐 Button、IconButton、StatusBadge、MessageBubble、ExecutionStatusBar、ComposerBar、ConfirmationCard、TimelineDrawer、MobileAgentShell 等组件。
- 在 Figma 中补齐 11 个本地 SVG 图标组件。
- 在 Figma 中补齐组件到 `packages/shared-ui` 源码路径的映射区。
- 补充 Figma `05 Component Gallery`，让非开发者可以直接查看组件当前样式。
- 补充 Figma `06 Design System Changelog`，固定后续组件库变化的可追踪路径。

阶段价值：

这个阶段把“好看的设计稿”继续推进为“可复用、可追踪的设计生产系统”。组件库不再只存在于代码或单张设计稿里，而是形成“Figma 可看、代码可用、流程可追、知识库可讲”的设计系统证据链。后续 AI 生成界面时，不应每次从零画风格，而应从稳定 tokens、组件、图标和映射关系中生成，减少视觉漂移和实现偏差。

## 阶段 15：基于组件库重画 v0.6 UI

完成内容：

- 用户要求基于当前设计规范绘制新的 UI。
- 使用 v0.5 设计系统作为输入，创建 Figma 页面 `AI 时间管理 Agent v0.6 Component-Based UI`。
- 绘制首页默认态、Timeline Drawer、单项确认、批量确认、执行记录、完整日历、事项详情和交互关系图。
- 将顶部入口、固定状态栏、底部输入、确认卡片和 Timeline 日期轴都按组件库规范重新组织。
- 验证 Figma metadata 和关键画板截图。
- 发现完整日历初版出现超过 31 的占位数字后，修正为下月日期并弱化显示。

阶段价值：

v0.6 是第一次用已经沉淀的设计系统反向生成产品 UI。它证明 v0.5 不只是组件陈列，而能约束真实界面的信息架构、状态表达和交互边界。下一步如果用户认可，应进入工程规格阶段，而不是直接补业务功能。

## 阶段 16：浅色模式与主题系统基础

完成内容：

- 用户指出 v0.6 基本只有深色模式，并希望增加浅色模式。
- 将该问题升级为 `v0.7：浅色模式与主题系统基础`，避免只做一次性浅色补图。
- 创建 Figma 页面：`AI 时间管理 Agent v0.7 Theme Modes`。
- 在 Figma 中生成浅色首页、浅色 Timeline Drawer、浅色确认页、主题 token 表和主题演进图。
- 新增 Figma 变量集合：`AI Time Theme Tokens`。
- 为 Figma 变量集合补充 `Dark` 和 `Light` 两个 mode。
- 将 `packages/shared-ui` 的 token 从固定深色值升级为语义 token + theme values。
- 新增 `createAiTimeThemeCssVariables(theme)`，支持按主题生成 CSS 变量。
- H5 `/design-system` 示例页新增深色与浅色并排预览。

阶段价值：

v0.7 让设计系统从“组件库”继续进化为“主题能力”。后续产品不再被锁死在深色视觉上，也不需要为每个主题复制组件。主题只替换 token values，组件仍保持稳定 API，这为未来高对比主题、品牌主题和系统主题跟随打下基础。

## 阶段 17：UI 图到代码实现准备

完成内容：

- 用户询问从 UI 图进入具体代码实现时，工作流应该如何执行。
- 新增显式 `ui-to-code-implementation` 工作流和 manifest。
- 明确 UI 图不能直接等同于代码任务，进入实现前必须先生成工程规格和实施计划。
- 生成 `AI 时间管理 Agent H5 UI 工程规格 v0.1`。
- 生成 `AI 时间管理 Agent H5 UI Thin Slice Implementation Plan`。
- 新增 workflow run，记录当前状态为 `implementation_plan_drafted`。
- 明确第一段代码实现只做 H5 首屏薄切片，不接真实 AI、真实日程写入、Native Bridge 或外部日历。

阶段价值：

这个阶段把“看着 UI 图写代码”升级为可审计的工程转换流程。它将 Figma、设计系统、PRD、需求修订和代码边界连接起来，先定义哪些是页面组合、哪些是共享组件、哪些是 mock、哪些能力必须留给后端和 SDK。下一步进入 H5 实现时，代码不会凭聊天上下文漂移，而是沿着工程规格、实施计划和验证清单推进。

## 阶段 18：H5 首屏薄切片实现

完成内容：

- 按 `ui-to-code-implementation` 工作流执行 H5 首屏薄切片。
- 将 `apps/h5` 首页从工厂状态占位页替换为 AI 时间管理 Agent 主界面。
- 新增 route-local 类型、demo 数据和轻量 TypeScript 契约测试。
- 新增 `AgentWorkbench`、Header、ThemeSwitcher、QuickStats、ConversationPanel、ExecutionLedgerPreview 和 TimelinePanel 页面组合。
- 复用 `packages/shared-ui` 的 MobileAgentShell、MessageBubble、ConfirmationCard、ExecutionStatusBar、ComposerBar、TimelineDrawer、IconButton 和 StatusBadge。
- 接入 v0.7 主题 token，支持深色 / 浅色主题切换。
- 固定执行状态栏位于底部输入栏上方，Timeline 在桌面预览区展示。
- 通过 H5 typecheck、H5 build 和 Chrome 本地页面检查。

阶段价值：

这是 AI 时间管理 Agent 从设计资产进入真实代码的第一步。实现仍然保持薄切片原则：页面只展示 UI、主题和演示状态，不承担 AI 指令解析、真实日程写入、后端编排或 Native Bridge。这样既能开始看到产品形态，又不会把前端变成业务编排层。

## 阶段 19：组件库维护工作流

完成内容：

- 用户询问组件库完善、调整和 bug 修复在工作流中如何操作，以及这些修改记录在哪里查看。
- 新增正式 `component-library-maintenance` 工作流和 manifest。
- 明确组件库维护的触发方式、输入、输出、状态转换、人工确认点和失败处理。
- 将 `ui-to-code-implementation` 与 `component-library-maintenance` 纳入 `pnpm validate:factory` 强制校验。
- 更新工作流 README、注册表 README 和 v0.5 设计系统计划。
- 在飞书 `05 工作流与 AI 协作体系` 中补充组件库维护说明。
- 新增 workflow run，记录本次流程补全的输入、影响范围和验证要求。

阶段价值：

这一步让组件库从“已经建立的资产”变成“可以持续维护的系统”。后续新增组件、修复浅色模式、调整 token、同步 Figma 或更新图标时，都有明确入口、影响面映射、验证要求和知识库记录。这样组件库不会随着页面开发逐渐漂移，也方便向外部说明项目如何把设计系统作为 AI 原生软件工厂的一部分来管理。

## 阶段 20：Hybrid H5 / iOS / Android 布局基础

完成内容：

- 用户确认进入具体代码开发，第一步先整合 Hybrid H5 / iOS / Android 对应布局和样式。
- 新增 shared-ui `HybridHostShell`，声明 `h5`、`ios`、`android` 三类宿主平台。
- `HybridHostShell` 负责宿主外框、安全区变量、iOS / Android 预览 chrome 和容器尺寸，不承载业务逻辑。
- `MobileAgentShell` 改为消费 `--ai-host-safe-top` 与 `--ai-host-safe-bottom`，让 H5 主界面适配不同宿主。
- H5 首页新增开发态宿主切换，可在 H5、iOS、Android 三种布局间切换。
- 主题切换从手机 header 移到开发预览控制区，保持真实 App 顶部更稳定。
- 设计系统示例页新增 Hybrid Host Shell 展示。
- 新增工程规格和 workflow run，记录宿主布局分层、非目标和验证结果。

阶段价值：

这一步把“Hybrid App”从口头架构落实到可运行的前端布局基础。Native 仍然保持稳定壳的定位，H5 负责产品界面，宿主差异被限制在布局层和安全区变量中。这样后续接入真实 iOS / Android Bridge 时，不需要推翻 H5 页面结构，也不会把平台判断散落到业务组件里。

## 阶段 21：原生 iOS / Android 壳启动

完成内容：

- 用户明确纠正方向：需要真实 iOS / Android 原生壳，而不是只在 H5 内做宿主预览。
- 新增 iOS SwiftUI + WKWebView 项目骨架，可用 Xcode 打开。
- 新增 Android Kotlin + WebView 项目骨架，可用 Android Studio 打开。
- 两端默认加载本地 H5 dev server：
  - iOS Simulator：`http://127.0.0.1:3000`
  - Android Emulator：`http://10.0.2.2:3000`
- 两端都提供 Native Shell 背景、加载态、错误态和 `NativeBridge` 占位。
- H5 增加 `viewport-fit=cover`，为 WebView 安全区适配做准备。
- 新增 `pnpm validate:native-shells` 静态校验脚本。
- 更新 iOS / Android README，写清 Xcode / Android Studio 调试方式。

阶段价值：

项目现在具备了真正的 Hybrid App 启动骨架。Native 层不再只是目录占位，而是可以承担稳定壳、WebView、加载态、错误态和未来系统能力入口。与此同时，业务界面仍保持在 H5，避免过早把日程逻辑、AI 执行流或后端调用写入原生层。下一步应先定义 Native Bridge 契约，再接系统日历、通知、语音等真实能力。

## 阶段 22：iOS Bridge 与 H5 页面拆分

完成内容：

- 用户确认原生 App 端当前只先开发 iOS，Android 仅保留需求计划和未来迁移路径。
- 新增 `contracts/hybrid-bridge/`，用 JSON Schema 固定 Native Bridge 消息信封。
- H5 新增 `apps/h5/src/app/ai-time-agent/bridge.ts`，统一封装向 Native 发送消息和接收 Native 事件。
- iOS `WKWebView` 接入 `NativeBridge` handler，支持 `native.hostContext`、`native.ack` 和 `native.error`。
- H5 页面按职责拆分为 AI 执行流、Timeline、完整日历和执行记录四个视图。
- 顶部按钮不再只做视觉占位，而是切换 H5 视图并向 iOS 壳发送显式消息。
- iOS 壳继续只负责 WebView、加载态、错误态、Bridge 和宿主上下文，不承载日程业务逻辑。
- Android README 明确当前不继续实现运行时代码，后续按 iOS Bridge 契约迁移。
- 新增 Hybrid Bridge 工程规格和 iOS Bridge 实施计划。

阶段价值：

这一步把 Hybrid 分层从“壳能打开 H5”推进到“壳和 H5 有可验证通信契约”。H5 负责产品页面和交互状态，iOS 负责稳定宿主与系统能力入口，Bridge 负责显式消息传递。后续接语音、通知、系统日历或图片识别时，不需要让 H5 直接碰系统能力，也不需要让 iOS 写产品业务。Android 暂缓实现后，工程重心更集中，后续迁移也有清晰参照。

## 阶段 23：Native 壳层 UI 归属修正

完成内容：

- 用户指出上一版分层仍不正确：Header、底部输入、菜单视图、Timepage Drawer 不应由 H5 承担。
- 修正 Hybrid 边界：iOS 原生壳拥有 Header、底部输入框、菜单 Drawer、Timepage 日期轴、完整日历入口和执行记录入口。
- H5 收敛为中间内容区，负责渲染后端返回元素；页面内执行状态条由 H5 根据接口状态渲染。
- 新增 `native.viewChanged` 和 `native.inputRequested` 两类 Native -> H5 消息。
- H5 新增 backend element renderer，用 mock 数据模拟后端返回的对话消息、确认卡片、摘要列表和执行记录。
- iOS 原生壳通过 Bridge 通知 H5 当前需要渲染的内容视图。
- Android 继续只保留计划，后续必须跟随 iOS 这套分层。

阶段价值：

这次修正让 Hybrid 架构更接近真实 App：Native 不再只是 WebView 容器，而是拥有稳定的原生交互外壳；H5 不再假装控制 App 框架，而是成为后端元素渲染表面。后续接入语音、键盘、系统日历、通知和相机时，可以从 Native 入口进入，再由后端决定业务结果，避免前端和原生层各自发展出一套业务逻辑。

补充修正：

- 用户进一步指出执行状态来自 H5 接口和后端返回，如果放进 Native 会造成状态同步问题。
- 因此页面内执行状态条重新归 H5，由 H5 根据接口状态渲染。
- 原生只负责把 WebView 布局在 Header 和输入框之间；H5 内部使用“可滚动内容 + 底部状态 Dock”的布局，让状态视觉上固定在输入框上方。
- Bridge 不同步页面执行状态，避免变成高频状态总线。

## 阶段 24：Hybrid 可交互 Mock Demo

完成内容：

- 用户要求先做一个“能动起来”的版本：没有后端，但按钮跳转、点击交互、页面切换、Timepage 展示和原生输入都要有效。
- iOS Header 支持菜单、执行记录、日历和深色 / 浅色主题切换。
- iOS Drawer 支持 Timeline、日历、执行记录三类面板切换，Timepage 日期轴支持日期选择和选中态。
- iOS 底部输入框支持语音态 / 文本态切换，文本提交后通过 `native.inputSubmitted` 发给 H5。
- H5 新增 mock 执行流：收到原生文本后，追加用户消息、AI 解析消息、确认卡片、执行状态变化、日程摘要和执行记录。
- H5 通过 `native.themeChanged` 同步黑白主题。
- 根据后续调试反馈修复 3 个 Bridge 可见性问题：
  - 主题切换时，iOS 端改为显式发送切换后的主题值，避免 SwiftUI state 更新时序导致 H5 收到旧主题。
  - Drawer 关闭按钮改为显式原生按钮和命中区域，确保关闭动作可触发。
  - H5 收到原生输入后立即追加“已收到：xxx”的 mock 回复，收到主题切换后也追加可见回执，方便确认 Bridge 消息已送达。

阶段价值：

这一步让产品从“静态架构样板”变成“可演示交互闭环”。它仍然不声称后端、AI 解析或真实日历写入已经完成，但已经能展示用户输入、原生壳操作、H5 渲染和 mock 执行流如何协同。后续接真实后端时，可以把 H5 的 mock 生成逻辑替换为 API 返回，而不需要推翻 Native / H5 的职责边界。

补充判断：

Bridge 调试不能只依赖控制台或内部状态。凡是用户可触发的 Native -> H5 消息，在 mock 阶段都应有可见回执，至少能让人判断“消息是否到达 H5”。这个规则后续应进入 Hybrid Bridge 调试约定。

二次修正：

- 用户反馈修改后仍像是没有生效。
- 排查后发现 H5 监听 Native 消息的注册时机过于依赖 `h5.ready` 是否成功投递。
- H5 已调整为“先注册 Native 消息监听，再尝试发送 `h5.ready`”，避免初始化阶段 Bridge 可用性判断失败后，后续 `native.inputSubmitted` 和 `native.themeChanged` 被忽略。

三次修正：

- 用户移除旧 Xcode 后，模拟器中仍然看不到最新交互，进一步排查确认不是旧 Xcode、旧 App 包或错误 H5 URL。
- iOS 原生层新增 `Native Debug` 标识和 WebView JS 探针，屏幕上直接显示当前 URL、H5 debug build、NativeBridge 可用性、是否存在开发预览控件、hydration 错误数量。
- 探针发现 H5 一度停留在服务端 HTML 状态：`debugBuild=null`、`hasBridgeDebug=false`、`hasPreviewControls=true`。
- 根因是 H5 首屏渲染直接读取 `window.location`，服务端与客户端首次渲染不一致，触发 React hydration mismatch。
- H5 已改为把 `bridgeDebugEnabled`、`nativePlatform`、`hostContext` 等浏览器相关状态延后到 `useEffect` 初始化，避免首屏不一致。
- `next.config.ts` 增加本地 `allowedDevOrigins`，提高 iOS WebView / 模拟器访问 Next dev 资源的稳定性。
- 验证结果：`debugBuild=bridge-debug-2026-05-20-01`、`hasBridgeDebug=true`、`hasPreviewControls=false`、`nativeEmbedded=true`、`errorCount=0`。
- 主题切换和原生键盘输入均已通过模拟器验证，H5 能收到 `native.themeChanged` 和 `native.inputSubmitted` 并渲染可见回执。

阶段补充价值：

这次问题把 Hybrid 调试规则补完整了：不要只猜 Xcode 缓存或 WebView 缓存，要同时验证“原生包是否更新、H5 bundle 是否更新、React 是否完成 hydration、Bridge 是否收发消息”。后续 Hybrid 问题应保留原生可见探针、H5 可见探针和控制台日志三层线索。

四次修正：

- 用户反馈主题切换时 Native 和 H5 的切换效果仍然卡顿、突兀，debugger 面板有闪烁感。
- 排查后判断主要原因不是单点 bug，而是视觉状态、执行状态和调试状态混在同一次更新里：
  - Native 先切主题，H5 后收到 `native.themeChanged`，两层视觉变化存在轻微时差。
  - H5 收到主题消息后曾追加可见聊天回执，并更新执行状态，导致滚动内容和底部状态 Dock 一起重绘。
  - Native Debug 曾直接显示完整探针 JSON，探针内容变化会撑开或重排面板。
  - H5 Bridge Debug 内容过长，且参与主题过渡动画，容易产生闪烁感。
- 修正方案：
  - Native 主题切换和 Bridge 事件发送放进同一个 320ms easeInOut 动画事务。
  - H5 主题切换只更新主题，不再写入聊天消息，也不再修改执行状态。
  - Native Debug 改成固定高度的结构化摘要：hydration、bridge、errors、H5 build、probe。
  - H5 Bridge Debug 改成固定高度摘要，并禁用自身过渡动画。
  - H5 业务界面保留柔和的背景、文字、边框和阴影过渡。
- 验证结果：
  - `pnpm --filter @ai-code/h5 typecheck` 通过。
  - `pnpm --filter @ai-code/h5 build` 通过。
  - `pnpm validate:native-shells` 通过。
  - iOS Simulator `xcodebuild` Debug 构建通过。
  - 模拟器截图确认 Native Debug 和 H5 Bridge Debug 均为固定摘要面板。

阶段补充价值：

这次修正明确了一个 Hybrid 交互规则：主题属于视觉状态，不属于执行状态。主题切换不应该生成聊天消息、执行状态或业务事件；debugger 也不应该参与产品级动画。这样后续继续调试 Bridge 时，可以保留诊断能力，同时不让调试面板破坏真实交互体验。

## 阶段 25：原生到数据库全链路打通

完成内容：

- 后端采用包边界优先的 V1 架构：`python/backend` 作为 FastAPI 网关，`python/orchestrator` 负责计划与确认执行，`python/agent-runtime` 负责规则解析器和 Agent 原语。
- 新增 Postgres 首版执行工作流迁移，覆盖 `conversation_turns`、`execution_plans`、`domain_actions`、`confirmations`、`execution_ledger`、`calendar_events` 等表。
- 后端设置 `DATABASE_URL` 后使用 Postgres repository；未设置时仍保留 in-memory repository，方便测试。
- H5 从 mock 后端切换为经 `@ai-code/sdk` 调用真实 API：提交 `/agent/turns`、确认 `/execution-plans/{id}/confirm`、刷新 `/calendar/events` 与 `/execution-ledger`。
- iOS 原生输入通过 `native.inputSubmitted` 进入 H5，再由 H5 调后端。原生层仍不解析日程语义、不直接写数据库。
- 解析器支持“明天下午三点安排一个新年业务规划会，时间一个半小时”，生成 90 分钟日程。
- API 支持局域网 CORS，`pnpm dev:full` 同时启动 H5 `0.0.0.0:3000` 和 API `0.0.0.0:8000`。
- 修复重复确认导致 H5 底部状态栏显示 `API request failed: 400 Bad Request` 的问题：后端对同一成功计划的重复确认做幂等返回，H5 成功确认后移除确认卡。

验证结果：

- `pytest python/backend/tests -v` 通过。
- `ruff check python` 通过。
- `mypy python` 通过。
- `pnpm --filter @ai-code/h5 typecheck` 通过。
- `pnpm --filter @ai-code/sdk typecheck` 通过。
- `pnpm --filter @ai-code/shared-types typecheck` 通过。
- `pnpm validate:contracts` 通过。
- 局域网现场验证：`POST /agent/turns -> 200`，`POST /confirm -> 200`，重复确认仍为 `200`；Postgres 中 `calendar_events=1`、`execution_ledger=3`。

阶段价值：

这一步把之前的 Hybrid mock 演示推进到真实业务闭环：用户在 Xcode 原生壳输入一句自然语言，H5 渲染确认卡，后端生成计划并写入 Postgres 日程事实。项目现在不再只是“App 壳 + Mock 后端元素”，而是拥有了可验证的原生到数据库链路。新的工程约束也更清晰：Native 提供输入和系统能力入口，H5 渲染后端元素并调用 SDK，后端拥有计划、确认、执行和审计，数据库保存业务事实。

## 阶段 26：新窗口上下文恢复协议

问题背景：

- 用户发现新开 Codex 窗口后，AI 不知道最新项目进展，飞书和 Obsidian 也没有自动更新。
- 排查后确认：项目虽已有 `AGENTS.md`、memory 目录和知识同步清单，但没有把“新窗口必须读取当前状态”写成强制入口。
- `ai-factory/memory/durable/architecture/current-state.md` 停留在 2026-05-18，未覆盖后端、Postgres、H5、Xcode 全链路进展。
- 飞书和 Obsidian 当前是人工同步流程，不存在自动触发器；如果没有实际执行写入，不能声称已同步。

修正内容：

- `AGENTS.md` 新增“新窗口启动协议”，要求先读 `current-project-state.md` 和 memory index，再查看 git 状态和最近提交。
- 新增 `ai-factory/memory/working/active-context/current-project-state.md`，作为新窗口恢复项目进展的第一入口。
- 更新 memory index 和架构 durable memory，把 2026-05-23 的端到端链路事实写入结构化记忆。
- 更新知识同步检查清单，明确 Obsidian/飞书不是自动同步，必须有实际写入证据。

阶段价值：

这次修正把“上下文连续性”从聊天里的隐性期待，变成仓库可审查的协作协议。后续任何新 Codex 窗口只要遵守 `AGENTS.md`，就能从当前状态文件恢复项目进展；如果外部知识库没有同步，也必须明确报告，而不是让用户误以为飞书或 Obsidian 会自动更新。

## 阶段 27：上下文同步检查与阶段决策复审

问题背景：

- 新窗口协议已经建立，但仍依赖人工记得检查 `current-project-state.md`、memory index、飞书源稿和阶段决策。
- `phase-strategy.md` 仍停留在 2026-05-18 的 Phase 1.1/1.2 前置判断，和当前已经打通原生到数据库薄切片的事实不一致。
- 项目需要一个命令级检查，提醒协作 Agent 不能把仓库源稿更新误说成外部知识库已同步。

修正内容：

- 新增 `pnpm validate:context-sync`，检查当前状态、记忆索引、阶段决策、知识同步清单和飞书页面源稿中的关键同步声明。
- `pnpm validate:factory` 已串联上下文同步检查，让阶段收尾时自动覆盖这条治理线。
- 复审 `phase-strategy.md`：AI 时间管理 Agent 可以进入 Phase 2 前段的受控产品开发，但仍必须按 PRD、设计资产、工程规格、契约、SDK 和阶段记录推进。
- 更新阶段门禁，明确 Phase 2 薄切片开发仍需要需求追溯、设计追溯、确认策略、幂等规则和同步证据。
- 更新飞书源稿 `05 工作流与 AI 协作体系`，补充上下文同步检查命令和“外部知识库不是自动同步”的说明。

阶段价值：

这一步把“下一步该做什么”的判断从聊天建议变成可检查规则。后续继续做费用、提醒或系统能力前，项目可以先用本地命令确认当前上下文和阶段决策没有漂移，再进入产品薄切片实现。

## 阶段 28：费用草稿薄切片

完成内容：

- 用户确认继续产品开发后，按阶段策略选择最小产品薄切片：先补费用草稿，而不是同时做提醒、系统日历或异步 worker。
- 新增费用草稿设计规格和实施计划。
- `RuleParser` 支持解析“把昨天 58 元打车票报销”，生成 `expense.create_reimbursement_draft` action。
- 缺少金额的报销请求继续返回 clarification request，不创建计划。
- 新增 `backend.app.domains.expense`：包含费用模型、in-memory repository、Postgres repository 和 domain service。
- `ExecutionCoordinator` 支持确认后执行费用草稿创建，并通过 `sourceActionId` 保持幂等。
- `/expenses` 从真实 `ExpenseDomainService` 返回草稿；Postgres 模式下写入 `expense_records`。
- 后端测试覆盖 parser、planner、confirm、API `/expenses` 和 Postgres 持久化。

验证结果：

- `PATH=.venv/bin:$PATH pytest python/backend/tests -v` 通过。
- `PATH=.venv/bin:$PATH ruff check python` 通过。
- `PATH=.venv/bin:$PATH mypy python` 通过。
- `pnpm --filter @ai-code/h5 typecheck` 通过。
- `pnpm --filter @ai-code/sdk typecheck` 通过。
- `pnpm --filter @ai-code/shared-types typecheck` 通过。
- `pnpm validate:contracts` 通过。

阶段价值：

这是 AI 时间管理 Agent 的第二个真实领域写入闭环。日程能力证明了自然语言到数据库日程事实的链路，费用草稿则证明 orchestrator 可以分派到不同领域 service，并把多领域架构从设计文档推进到可测试代码。下一步更适合补提醒领域或 Native Bridge 契约，而不是提前拆异步 worker。

## 阶段 29：AI 时间管理 Agent v1.0 初版 App

完成内容：

- 用户明确要求第一版不能只是薄切片，而应是“原生 App 上每个功能都能直接点击使用”的功能完善初版。
- 新增 v1.0 设计规格和实施计划，把迭代边界一次性确认，减少开发过程中的逐项确认。
- 补齐提醒领域后端闭环：`RuleParser` 支持“明天上午九点提醒我带电脑”，生成 `reminder.create_reminder` action。
- 新增 `backend.app.domains.reminder`：包含提醒模型、in-memory repository、Postgres repository 和 domain service。
- `ExecutionCoordinator` 支持确认后执行提醒创建，并通过 `sourceActionId` 保持幂等。
- `/reminders` 从真实 `ReminderDomainService` 返回提醒；Postgres 模式下写入 `reminders`。
- H5 扩展为七个页面：对话、Timeline、日程、费用、提醒、执行记录、设置。
- H5 确认成功后会刷新 `/calendar/events`、`/expenses`、`/reminders` 和 `/execution-ledger`，并把日程、费用、提醒结果渲染成领域结果卡。
- iOS Native Shell 扩展 Header 和 Drawer：对话、Timeline、日历、费用、提醒、执行记录、设置都可点击，并通过 `native.viewChanged` 驱动 H5。
- 原生底部输入支持键盘提交、语音演示录音态和附件演示提交；当时语音入口提交提醒示例，附件入口提交费用示例。
- H5 Bridge 显式补充 `NativeSurfaceName`，覆盖 v1.0 全部 surface。

验证结果：

- `PATH=.venv/bin:$PATH pytest python/backend/tests -v` 通过，34 个测试全部通过。
- `PATH=.venv/bin:$PATH ruff check python` 通过。
- `PATH=.venv/bin:$PATH mypy python` 通过。
- `pnpm --filter @ai-code/h5 typecheck` 通过。
- `pnpm --filter @ai-code/sdk typecheck` 通过。
- `pnpm --filter @ai-code/shared-types typecheck` 通过。
- `pnpm validate:contracts` 通过。
- `pnpm validate:native-shells` 通过。
- `pnpm validate:context-sync` 通过。
- `pnpm validate:factory` 通过。
- `git diff --check` 通过。
- 浏览器验证 H5 七个页面切换通过：对话、Timeline、日程、费用、提醒、执行记录、设置均能显示对应页面标题和说明。

阶段价值：

这一阶段把项目从“原生到数据库的单能力链路”推进到“可直接打开和点击的初版 Hybrid App”。用户当时可以在 iOS 原生壳中通过 Header、Drawer、键盘、语音演示入口和附件演示入口进入核心功能；H5 负责页面体系、对话组件、确认卡和数据展示；后端已经拥有日程、费用、提醒三个领域闭环。v1.0 当时仍不做真实语音识别、图片识别、系统通知或外部日历同步，但它已经给后续真实系统能力接入提供了可验证的 App 骨架。

## 阶段 30：AI Planning Runtime v1 后端架构设计

完成内容：

- 用户要求全力把后端架构做好，并选择“智能规划大脑优先”作为主线。
- 架构方向从普通业务 API 后端，调整为可解释、可扩展、可审计的 Agent Planning Runtime。
- 确认三项能力都进入目标范围：结构先行、多步骤计划能力升级、LLM-ready 接口与可选真实 provider。
- 确认 `LlmPlanningEngine` 通过环境变量开启，默认关闭；默认仍使用规则规划保证稳定。
- 确认真实 LLM provider 可使用完整上下文，但必须通过 `ContextPack` 组装和 `ContextRedactor` 控制，不能直接读取原始数据库全集。
- 确认长期上下文方案采用“事件日志 + 摘要记忆”，向量检索只预留接口。
- 新增设计规格：`docs/superpowers/specs/2026-05-26-ai-planning-runtime-v1-design.md`。
- 用户复审并确认设计规格后，新增实施计划：`docs/superpowers/plans/2026-05-26-ai-planning-runtime-v1.md`。
- 实施计划拆为 12 个任务：runtime 类型和工具目录、rule planner 与 compiler、policy、execution runner、context assembler、event/trace 持久化、summary memory、LLM mock、可选真实 LLM provider、use cases/bootstrap、多 action 回归和最终验证文档。

核心架构：

- `ContextAssembler`：组装当前输入、时间、最近对话、待确认计划、日程摘要、提醒摘要、费用摘要、用户偏好、摘要记忆和工具目录。
- `PlanningEngine`：统一规划入口，包含默认 `RuleBasedPlanningEngine` 和可选 `LlmPlanningEngine`。
- `PolicyEngine`：统一判断风险、缺字段、确认策略和 clarification。
- `ToolCatalog`：描述可规划工具及其 schema。
- `ExecutionRunner`：通过 action handler registry 执行已确认 action，移除领域 `if/elif` 分派。
- `DecisionTrace`：记录规划模式、上下文使用、候选工具、策略判断和 fallback 原因。
- `EventLog` 与 `SummaryMemory`：沉淀用户输入、计划、确认、执行结果和长期摘要。

阶段价值：

这一步把后端下一阶段目标从“继续增加业务功能”收敛为“建立智能规划内核”。后续日历、提醒、费用、飞书、Things3、系统通知等能力都应成为工具注册和 action handler，而不是继续堆进单个协调器。LLM 被设计为规划候选生成器，而不是直接执行者；业务写入仍必须经过策略、确认、执行 runner 和领域 handler。

## 阶段 31：AI Planning Runtime v1 后端架构实施

完成内容：

- 按已确认的实施计划批量完成 AI Planning Runtime v1 后端架构改造。
- 新增 `agent_runtime.context`：包含 `ContextPack`、`ContextAssembler`、`ContextProvider`、`ContextRedactor`，用于统一组装当前输入、最近对话、待确认计划、领域摘要、用户偏好、摘要记忆和工具目录。
- 新增 `agent_runtime.tools`：包含三个内置写入工具 `calendar.create_event`、`expense.create_reimbursement_draft`、`reminder.create_reminder` 的 schema 与 selector。
- 新增 `agent_runtime.planning`：包含 `PlanningEngine` 协议、默认 `RuleBasedPlanningEngine`、`PlanCompiler`、`LlmPlanningEngine`、`MockLlmProvider` 和显式开启的 `OpenAILlmProvider` 边界。
- 新增 `agent_runtime.policy`：统一缺字段、风险级别和确认策略判断。
- 新增 `agent_runtime.memory` 与 `agent_runtime.tracing`：包含 `AgentEvent`、`SummaryMemory`、`MemorySearchPort`、`DecisionTrace` 和 repository 协议。
- 新增 Postgres migration `0002_agent_planning_runtime`：创建 `agent_events`、`decision_traces`、`summary_memories`，为事件日志、决策轨迹和摘要记忆提供持久化表。
- 新增 Postgres 基础设施适配器：事件日志、决策轨迹、摘要记忆和上下文 provider。
- `ExecutionCoordinator` 改为通过 `ExecutionRunner` + `ActionHandlerRegistry` 执行已确认 action，领域分派从协调器主体中拆出。
- 后端启动收拢到 `backend.app.bootstrap.create_runtime()`；默认 `AI_PLANNER_MODE=rule`，可通过 `AI_PLANNER_MODE=llm_mock` 使用 mock LLM planner，通过 `AI_PLANNER_MODE=llm` 显式加载真实 LLM provider。
- FastAPI 路由委托 `SubmitTurnUseCase`、`ConfirmPlanUseCase`、`RejectPlanUseCase`，保持当前 API 响应兼容。
- 增加多 action 回归：同一句“明天下午三点开会，顺便把昨天 58 元打车票报销，再提醒我带电脑”会生成一个确认计划，确认后分别写入日程、费用和提醒，并记录三条执行 ledger。

验证结果：

- `PATH=.venv/bin:$PATH pytest python/backend/tests -q` 通过：`54 passed, 6 skipped`。
- `PATH=.venv/bin:$PATH ruff check python` 通过。
- `PATH=.venv/bin:$PATH mypy python` 通过。

阶段价值：

这一阶段把后端从“能解析和执行三个领域动作”推进到“具备 Agent Planning Runtime 的清晰内核”。规则 planner 继续保证默认稳定性，LLM planner 被限制在候选计划生成环节；所有业务事实写入仍必须经过 policy、confirmation、execution runner 和领域 handler。事件日志、决策轨迹和摘要记忆为后续调试、解释、长期记忆和真实 LLM 接入留下了可审计基础。

## 阶段 32：LLM 多 Provider 架构

完成内容：

- 将真实 LLM provider 选择从 `AI_PLANNER_MODE` 中拆出，新增 `AI_PLANNER_PROVIDER=openai|deepseek`。
- 保留 `LlmProvider` 协议，规划层仍只依赖 `complete(prompt) -> str`，不感知具体厂商 SDK。
- OpenAI provider 继续使用 Responses API，默认模型为 `gpt-4.1-mini`。
- 新增 OpenAI-compatible Chat provider 基类，DeepSeek provider 基于该基类实现，默认 base URL 为 `https://api.deepseek.com`，默认模型为 `deepseek-v4-flash`。
- DeepSeek 调用使用 Chat Completions messages 结构，并显式传入 `response_format={"type":"json_object"}` 和 `temperature=0`，保证规划器继续收到 JSON 候选计划。
- `AI_PLANNER_MODEL` 保持为 provider 级模型名覆盖项，模型名作为字符串透传，便于后续替换 DeepSeek、ChatGPT 或其他模型版本。
- `create_llm_provider()` 成为 backend bootstrap 的真实 provider 工厂，`llm_first` 和 `llm` 模式都复用该工厂。
- 未支持的 provider 会明确抛出 `unsupported AI_PLANNER_PROVIDER`，后续 Claude、OpenRouter 或其他厂商需要新增 adapter 后再开放配置。

验证结果：

- `PATH=.venv/bin:$PATH pytest python/backend/tests/test_llm_planning_engine.py python/backend/tests/test_planner_mode_selection.py -q` 通过：`17 passed`。
- `PATH=.venv/bin:$PATH pytest python/backend/tests -q` 通过：`75 passed`。
- `PATH=.venv/bin:$PATH ruff check python` 通过。
- `PATH=.venv/bin:$PATH mypy python` 通过。
- `pnpm validate:context-sync` 通过。

阶段价值：

这一阶段把“模型选择”从规划、确认和业务写入链路中隔离出来。后续切换低成本模型、升级 OpenAI 模型、接入 Claude Opus 或走 OpenAI-compatible 网关时，优先新增 provider adapter 或改环境变量；LLM 仍只负责生成候选计划，业务事实仍必须经过 Policy、确认、PlanCompiler、ExecutionRunner 和领域 handler。

## 阶段 33：本地 `.env.local` 密钥加载

完成内容：

- 新增后端本地环境加载器，自动查找并读取仓库根目录 `.env.local`。
- `create_planning_engine()`、`create_llm_provider()` 和 `get_database_settings()` 在读取环境变量前都会加载 `.env.local`。
- `.env.local` 使用 `setdefault` 语义，不覆盖终端中已经显式 `export` 的变量。
- 支持常见 `KEY=value`、`export KEY=value`、单引号和双引号包裹值。
- `.env.example` 补充 `AI_PLANNER_MODE`、`AI_PLANNER_PROVIDER`、`AI_PLANNER_MODEL`、`DEEPSEEK_API_KEY` 和 `OPENAI_API_KEY` 模板。
- 更新本地开发文档和后端 README，说明 DeepSeek 与 OpenAI 的 `.env.local` 配置方式。
- `.env.local` 已被 `.gitignore` 的 `.env.*` 规则忽略，真实密钥不会进入 git。
- 测试进程默认设置 `AI_CODE_LOAD_ENV_LOCAL=0`，避免开发者本机 `.env.local` 中的 `DATABASE_URL` 或 key 影响单元测试。

验证结果：

- `PATH=.venv/bin:$PATH pytest python/backend/tests/test_planner_mode_selection.py -q` 通过：`12 passed`。
- `PATH=.venv/bin:$PATH pytest python/backend/tests -q` 通过：`79 passed`。
- `PATH=.venv/bin:$PATH ruff check python` 通过。
- `PATH=.venv/bin:$PATH mypy python` 通过。
- `pnpm validate:context-sync` 通过。

阶段价值：

这一阶段把真实模型密钥配置从启动命令中移到本机私有文件。后续开发者只需在 `.env.local` 中保存 DeepSeek/OpenAI key，然后运行 `pnpm dev:full`；需要临时切换 provider 或模型时，终端环境变量仍然可以覆盖本地文件。

## 阶段 34：LLM 调用观测日志

问题背景：

- DeepSeek 真实调用比规则解析慢，开发者需要看到每次 LLM 调用的 prompt 大小、耗时和响应大小。
- 当前 DecisionTrace 只记录 planner mode、fallback 和工具选择，不能定位 provider 调用耗时。
- 完整 prompt 可能包含用户输入和上下文，不能默认写入日志。

完成内容：

- `LlmPlanningEngine` 为每次 provider 调用增加安全摘要日志。
- 默认日志字段包含 provider、model、planner mode、`duration_ms`、`prompt_chars`、`response_chars` 和 `prompt_sha256`。
- provider 调用失败时同样记录耗时和 `error_type`，再交给 `llm_first` fallback。
- 新增 `AI_PLANNER_LOG_PROMPT=1` 调试开关，显式开启后输出完整 prompt。
- 新增 `AI_PLANNER_LOG_RESPONSE=1` 调试开关，显式开启后输出模型原始响应。
- `.env.example`、本地开发文档和后端 README 已补充日志开关说明。

验证结果：

- `PATH=.venv/bin:$PATH pytest python/backend/tests/test_llm_planning_engine.py -q` 通过。
- `PATH=.venv/bin:$PATH pytest python/backend/tests -q` 通过：`79 passed`。
- `PATH=.venv/bin:$PATH ruff check python` 通过。
- `PATH=.venv/bin:$PATH mypy python` 通过。
- `pnpm validate:context-sync` 通过。

阶段价值：

这一阶段让真实模型调用从“黑盒等待”变成可观察链路。开发者可以先用默认安全日志判断慢在 provider 调用、prompt 过大还是响应过长；只有需要深入排查时再临时打开完整 prompt/response 日志。

## 阶段 35：对话路由与追问补全设计

问题背景：

- 当前对话体验仍像动作解析器，主要判断用户输入能不能转成日程、提醒或费用。
- 用户闲聊时，系统不能自然回应。
- 用户表达明确计划意图但缺少关键字段时，系统不会追问。例如“明天上午我要去开会”应该追问“几点开始”，而不是返回未识别。
- 用户后续补充“十点”这类短句时，系统没有 pending intent 可以承接。

完成内容：

- 新增设计规格：`docs/superpowers/specs/2026-05-27-conversation-routing-clarification-design.md`。
- 设计将 LLM 规划输出升级为四类响应：`chat`、`clarification`、`plan_candidate`、`mixed`。
- 设计新增 `PendingClarification`，用于保存缺字段的待补全意图。
- 明确 `ContextAssembler` 后续需要注入最近 pending clarification，让用户短句补充可以和上一轮意图合并。
- 明确 H5 后续需要渲染 clarification message 和 quick replies。
- 保持执行安全边界：LLM 仍只生成候选回复、追问和候选计划；字段完整并经用户确认后，才能通过 `ExecutionRunner` 写业务事实。

验收方向：

- “明天上午我要去开会”返回追问，而不是“未识别”。
- 用户补充“十点”后生成日程确认卡。
- “今天有点累”返回自然聊天，不生成 action。
- 完整日程、提醒、费用输入仍走确认卡。

阶段价值：

这一阶段把下一轮体验问题从“继续堆规则”收敛为“对话路由 + 槽位补全 + 安全确认”的产品与架构设计。后续实现应先打通闲聊和追问补全，再继续扩展真实系统能力。

## 阶段 36：对话路由与追问补全实施计划

完成内容：

- 用户确认对话路由与追问补全设计后，新增实施计划：`docs/superpowers/plans/2026-05-27-conversation-routing-clarification.md`。
- 计划拆成 7 个任务：规划类型和 LLM schema、规则 fallback、PendingClarification 存储、ContextPack 注入、orchestrator 保存与补全、H5 quick replies、全链路验证和文档同步。
- 计划明确保持安全边界：LLM 可以生成闲聊回复、追问和候选计划，但业务事实仍必须经过确认后才写入领域表。
- 计划要求用测试先覆盖 chat、clarification、多轮补全和 H5 quick replies，再实现后端与前端改动。

验收方向：

- “今天有点累”返回自然聊天消息，不生成 action。
- “明天上午我要去开会”返回追问和 quick replies。
- 用户补充“十点”后生成日程确认卡。
- 完整日程、提醒、费用输入仍走确认卡，Timeline 仍只展示已确认事实。

阶段价值：

这一阶段把设计规格转成可批量执行的工程迭代计划，为后续减少频繁确认、提升开发速度提供任务边界。

## 阶段 37：对话路由与追问补全实施

完成内容：

- LLM planner schema 支持 `chat`、`clarification`、`plan_candidate` 和 `mixed` 响应。
- 规则 fallback 支持两类体验：纯闲聊返回自然 assistant message；缺少具体时间的会议意图返回追问。
- 新增 `PendingClarification` 类型、内存 store、Postgres repository 和 `0003_pending_clarifications` migration。
- `ContextPack` 增加 `pending_clarifications`，Postgres context provider 会把最近未完成追问注入规划上下文。
- Orchestrator 会保存追问，并支持用户用“十点”补全最近一条缺时间日程，再生成确认卡。
- H5 支持渲染 `quick-replies` 元素，点击快捷回复会复用原有输入提交流程。
- Postman 集合新增“缺少日程时间”和“补全日程时间”两个连续测试请求。

验证结果：

- `PATH=.venv/bin:$PATH pytest python/backend/tests -q` 通过：`88 passed`。
- `PATH=.venv/bin:$PATH ruff check python` 通过。
- `PATH=.venv/bin:$PATH mypy python` 通过。
- `pnpm --filter @ai-code/h5 typecheck`、`pnpm --filter @ai-code/sdk typecheck`、`pnpm --filter @ai-code/shared-types typecheck` 通过。
- `pnpm validate:contracts` 和 `pnpm validate:native-shells` 通过。
- `pnpm validate:context-sync`、`pnpm validate:factory` 和 `git diff --check` 通过。
- Postman collection JSON 解析通过。
- 临时 API 验证通过：“明天上午我要去开会”返回追问，“十点”生成日程确认卡，“今天有点累”返回自然聊天消息。

阶段价值：

这一阶段把第一版对话体验从“识别不到就失败”推进到“能聊天、会追问、能承接补充信息”。业务事实写入仍然保持确认边界，Timeline 仍只展示已确认事项。

## 阶段 38：Postgres 迁移闭环与追问补全增强

问题背景：

- 本地真实 Postgres 需要手动依次应用 `0001/0002/0003`，Postman 和 iOS 测试容易因为漏跑 migration 而失败。
- `decision_traces.planner_mode` 旧约束不允许 `llm_first` 和 `pending_clarification`，真实数据库保存 trace 时会出错。
- 日程 pending 补全会抢占新意图，例如“十点提醒我喝水”可能被当成上一轮会议时间。
- 下午/晚上缺时间追问的快捷回复和补全时间没有按时段归一化。
- 费用缺金额只会追问，不能用“58 元”继续补全成确认卡。

完成内容：

- 新增 `scripts/db_migrate.py`，提供 `pnpm db:migrate` 和 `pnpm validate:db-migrations`。
- `pnpm dev:api` 和 `pnpm dev:full` 会在启动 API 前自动执行迁移。
- 迁移 runner 维护 `schema_migrations`，支持发现已手动创建旧表时 baseline 对应版本。
- 修正 `0002_agent_planning_runtime` 的 planner mode 约束，并新增 `0004_decision_trace_planner_modes` 兼容已应用旧 `0002` 的数据库。
- 日程 pending 只接受纯时间回复；如果用户输入新提醒等完整意图，会交还 planner 生成新动作。
- 下午、晚上、中午的快捷回复和补全时间按 `time_range_hint` 归一化。
- Policy 触发的费用金额追问也会保存 pending；用户补“58 元”后生成费用确认卡，并保留上一轮“昨天”的发生日期。
- Postman 集合补充费用金额追问和补全金额的连续测试请求。

验证结果：

- `PATH=.venv/bin:$PATH pytest python/backend/tests -q` 通过：`95 passed`。
- `PATH=.venv/bin:$PATH ruff check python scripts/db_migrate.py` 通过。
- `PATH=.venv/bin:$PATH mypy python` 通过。
- `pnpm --filter @ai-code/h5 typecheck`、`pnpm --filter @ai-code/sdk typecheck`、`pnpm --filter @ai-code/shared-types typecheck` 通过。
- `pnpm validate:contracts`、`pnpm validate:native-shells`、`pnpm validate:db-migrations`、`pnpm validate:context-sync`、`pnpm validate:factory` 和 `git diff --check` 通过。
- `package.json` 和 Postman collection JSON 解析通过。
- `PATH=.venv/bin:$PATH python scripts/db_migrate.py --help` 通过。

阶段价值：

这一阶段让“用真实 Postgres + Postman/iOS 做业务验证”更接近一键闭环，同时修复了追问补全的几个真实用户风险：不会抢新意图，下午/晚上时间不再落错，费用也能完成多轮补全。

## 阶段 39：Agent 对话调试接口

问题背景：

- 用户需要在 Postman 和本地调试时直接看到一次对话的规划过程，而不是只依赖终端日志。
- LLM-first、fallback、追问补全和执行计划创建已经分布在多个后端边界中，需要一个只读诊断面把事件和决策串起来。
- 测试环境默认走 in-memory runtime，之前没有挂载事件和 trace repository，导致无数据库模式下也不容易观察规划过程。

完成内容：

- 新增 `GET /agent/conversations/{conversationId}/debug`。
- 响应返回 `events`、`decisionTraces` 和 `pendingClarifications` 三组信息。
- `events` 可查看 `planning_started`、`planning_clarification_requested`、`execution_plan_created` 等事件。
- `decisionTraces` 可查看 planner mode、上下文分段、候选工具、选中工具、缺失字段、策略结论、fallback reason 和 reasoning summary。
- `pendingClarifications` 可查看日程缺时间、费用缺金额等追问上下文。
- in-memory runtime 新增事件日志和决策 trace repository，Postgres runtime 继续复用持久化 repository。
- in-memory ContextPack 会注入 open pending clarification，避免无数据库测试模式和 Postgres 模式在 LLM 上下文上不一致。
- OpenAPI、shared-types 和 Postman 集合已补充调试接口；Postman 新增 `Agent 对话 / 查看对话调试信息` 请求。

验证结果：

- 目标后端测试覆盖事件 + trace 查询、pending clarification 查询、pending store 列表能力和 in-memory pending context 注入。
- `PATH=.venv/bin:$PATH ruff check python` 通过。
- `PATH=.venv/bin:$PATH mypy python` 通过。
- `pnpm --filter @ai-code/shared-types typecheck` 通过。
- `pnpm validate:contracts` 通过。
- Postman collection JSON 解析通过。

阶段价值：

这一阶段把后端规划过程从“只能看日志猜”推进到“可以按会话查询结构化调试结果”。后续用户在 iOS 或 Postman 输入一句话后，可以直接查看是否调用了 LLM、是否 fallback、缺了哪些字段、当前 pending 追问是什么，以及是否生成了执行计划。

## 阶段 40：LLM mixed 回复链路打通

问题背景：

- 对话路由设计已经允许 LLM 返回 `mixed`：一边自然回复用户，一边给出候选执行动作。
- LLM 解析层已经能把 `assistant_message` 放入 `PlanningResult.message`，但确认响应分支没有把它返回给前端。
- H5 对 `confirmation_required` 固定展示 `plan.summary`，因此用户一边闲聊一边提出动作时，真实自然回复会被摘要吞掉。

完成内容：

- 后端 `confirmation_required` 响应在存在 `PlanningResult.message` 时携带可选 `message`。
- 对话摘要 `response_summary()` 对确认响应优先保存 mixed 自然回复，避免后续上下文只剩计划摘要。
- shared-types 给 `ConfirmationRequiredResponse` 增加 `message?: string`。
- H5 对确认响应展示 `response.message ?? plan.summary`，并保留原确认卡渲染。
- 新增测试覆盖 LLM mixed 解析、orchestrator 确认响应保留 message、对话摘要优先保存 message，以及 H5 mixed confirmation 类型渲染。

验证结果：

- 目标后端测试通过：`3 passed`。
- Python 相关 ruff 检查通过。
- `pnpm --filter @ai-code/h5 typecheck` 通过。
- `pnpm --filter @ai-code/shared-types typecheck` 通过。

阶段价值：

这一阶段让“能聊天、能追问、能执行”之间不再互斥。用户输入类似“好的，帮我安排明天下午三点开会”时，App 可以先自然回应，再展示确认卡，体验更接近一个真正的对话型原生 Agent。

## 阶段 41：iOS 原生语音输入闭环

问题背景：

- v1.0 初版 App 的底部语音入口仍是 mock 文本，不能代表真实用户语音输入。
- 第一版产品目标要求用户能在原生 App 内直接点击并使用核心功能，语音入口不能长期停留在演示态。
- H5 已有 `input.voice.start` 消息，但此前没有真正桥接到 iOS 系统语音能力，也缺少停止并提交的桥接动作。

完成内容：

- iOS `HybridShellView` 接入 `Speech` 与 `AVFoundation`。
- 新增 `NativeSpeechInputController`，使用 `SFSpeechRecognizer`、`SFSpeechAudioBufferRecognitionRequest` 和 `AVAudioEngine` 采集并识别中文语音。
- 底部语音按钮改为点击开始、再次点击停止并提交；识别中的文本会同步展示在输入框。
- 停止语音输入后，iOS 复用既有 `native.inputSubmitted` 把识别文本提交给 H5，由 H5 调用后端 `/agent/turns`。
- H5 发起的 `input.voice.start` / `input.voice.stop` 已桥接到原生语音入口，并返回 `native.ack`。
- 语音授权拒绝、识别不可用或录音失败时，Native 会通过 `native.error` 把失败原因回传给 H5。
- `Info.plist` 补充 `NSMicrophoneUsageDescription` 和 `NSSpeechRecognitionUsageDescription`。
- `validate:native-shells` 增加静态检查，防止语音入口回退到 mock 文本或缺少系统权限说明。

验证结果：

- `pnpm --filter @ai-code/h5 typecheck` 通过。
- `pnpm validate:contracts` 通过。
- `pnpm validate:native-shells` 通过。
- `pnpm validate:context-sync` 通过。
- `pnpm validate:factory` 通过。
- `git diff --check` 通过。
- `xcodebuild -project apps/ios/AIEngineeringCode.xcodeproj -scheme AIEngineeringCode -configuration Debug -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build` 通过。

阶段价值：

这一阶段把原生输入从“键盘可用、语音演示”推进到“键盘和语音都走真实输入链路”。Native 仍只负责系统能力和输入提交，不解析业务语义；H5 继续负责后端交互和元素渲染；后端继续负责意图规划、追问、确认和事实写入。后续重点应放在真机识别质量、异常提示、图片 / 文件选择、系统通知调度和系统日历权限。

## 阶段 42：iOS 本地通知调度闭环

问题背景：

- 后端已经可以确认并写入提醒，但提醒只存在于数据库和 H5 页面里。
- 对时间管理 App 来说，“提醒到点触发系统通知”是第一版可用性的关键能力。
- Native 不能自行决定业务语义，通知调度必须基于 H5 从后端读取到的已确认提醒事实。

完成内容：

- Hybrid Bridge 新增 `notifications.reminders.sync`。
- H5 在原生宿主下刷新到 `reminders` 后，会把 `id`、`title`、`dueAt`、`status` 同步给 Native。
- iOS 接入 `UserNotifications` 和 `UNUserNotificationCenter`。
- iOS 使用 `ai-code.reminder.{id}` 作为本地通知标识；重复同步时先清理同前缀 pending notification，再按最新提醒事实重建。
- iOS 只调度 `status=scheduled` 且 `dueAt` 在未来的提醒；过期、取消或解析失败的提醒不会生成系统通知。
- 通知权限拒绝或调度失败会通过 `native.error` 回传 H5。
- 原生壳静态检查补充 `UserNotifications`、`UNUserNotificationCenter` 和 `notifications.reminders.sync` 校验。

验证结果：

- `pnpm --filter @ai-code/h5 typecheck` 通过。
- `pnpm validate:contracts` 通过。
- `pnpm validate:native-shells` 通过。
- `xcodebuild -project apps/ios/AIEngineeringCode.xcodeproj -scheme AIEngineeringCode -configuration Debug -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build` 通过。

阶段价值：

这一阶段把提醒从“数据库事实 + 页面展示”推进到“系统可感知的本地通知”。边界仍然清楚：后端负责创建提醒事实，H5 负责读取事实并同步给 Native，iOS 只负责系统权限与本地通知调度。后续可以继续补通知点击回流到提醒详情、系统日历写入和图片 / 文件选择。

## 阶段 43：iOS 系统日历写入闭环

问题背景：

- 后端已经可以确认并写入日程，但日程只存在于数据库和 H5 页面中。
- 时间管理 App 的第一版需要让用户在原生 App 内看到真实系统能力，而不是只看 H5 内部列表。
- Native 仍不能自行解析业务语义，系统日历写入必须基于 H5 从后端读取到的已确认日程事实。

完成内容：

- Hybrid Bridge 新增并落地 `calendar.events.sync`。
- H5 在原生宿主下刷新到 `calendar_events` 后，会把 `id`、`title`、`startAt`、`endAt`、`timezone`、`status` 和 `sourceActionId` 同步给 Native。
- iOS 接入 `EventKit` 和 `EKEventStore`。
- iOS 使用 `requestFullAccessToEvents` 请求系统日历权限，以便读取已有事件并做幂等去重。
- iOS 使用后端 `event.id` 写入 `AI_CODE_EVENT_ID:{id}` notes marker；重复同步时先查找并删除同 marker 的旧事件，再写入最新系统日历事件。
- iOS 只写入 `status=scheduled` 且时间解析有效、结束时间晚于开始时间的日程；取消、解析失败或无效时间不会写入系统日历。
- 日历权限拒绝或写入失败会通过 `native.error` 回传 H5。
- 原生壳静态检查补充 `EventKit`、`EKEventStore`、`NativeCalendarEventSyncer`、`calendar.events.sync` 和日历权限 key 校验。

验证结果：

- `pnpm --filter @ai-code/h5 typecheck` 通过。
- `pnpm validate:contracts` 通过。
- `pnpm validate:native-shells` 通过。
- `xcodebuild -project apps/ios/AIEngineeringCode.xcodeproj -scheme AIEngineeringCode -configuration Debug -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build` 通过。

阶段价值：

这一阶段把日程从“数据库事实 + 页面展示”推进到“系统日历可见”。边界继续保持：后端负责创建日程事实，H5 负责读取事实并同步给 Native，iOS 只负责系统权限、去重和 EventKit 写入。后续可以补通知点击回流、系统日历事件更新策略优化、图片 / 文件选择和真机权限体验打磨。

## 阶段 44：iOS 原生附件选择闭环

问题背景：

- v1.0 初版 App 的底部附件入口仍是固定 mock 文本，会直接提交“把昨天 58 元打车票报销”。
- 用户希望第一版原生 App 内每个入口都能真实点击使用，附件入口不能长期停留在演示态。
- 当前后端还没有附件上传、OCR 或票据解析接口，因此这一阶段必须只做原生选择和元数据回传，不假装后端已经理解文件内容。

完成内容：

- iOS 纸夹入口改为原生 `confirmationDialog`，用户可选择“照片”或“文件”。
- 照片选择使用 SwiftUI `PhotosPicker`，文件选择使用 `fileImporter`。
- 选择完成后复用 `native.inputSubmitted`，提交 `inputKind=attachment`、附件 ID、名称、类型、大小和可读 `text`。
- Bridge 不传输文件二进制或 base64，避免 WKWebView 消息、日志和内存变脆。
- 原固定 mock 文本和 Drawer 中“附件 mock”文案已移除。
- 原生壳静态检查补充 `PhotosUI`、`UniformTypeIdentifiers`、`PhotosPickerItem`、`fileImporter` 和 `submitNativeAttachment` 校验，并禁止固定费用 mock 文本回归。

验证结果：

- `pnpm --filter @ai-code/h5 typecheck` 通过。
- `pnpm validate:native-shells` 通过。
- `xcodebuild -project apps/ios/AIEngineeringCode.xcodeproj -scheme AIEngineeringCode -configuration Debug -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build` 通过。

阶段价值：

这一阶段把附件入口从“固定文本演示”推进到“真实系统选择器”。边界仍然清楚：Native 负责系统选择器和附件元数据，H5 负责对话提交，后端后续需要单独设计附件上传、OCR 和票据解析能力后，才处理真实文件内容。

## 阶段 45：iOS 提醒通知点击回流

问题背景：

- iOS 已能把已确认提醒调度为本地通知，但用户点击通知后还不会回到 App 的提醒上下文。
- 对时间管理 App 来说，通知不只是弹出提示，还应该能把用户带回对应功能面。
- Native 仍不承载业务状态机，通知点击只负责路由到提醒视图，不直接修改提醒事实。

完成内容：

- `NativeReminderNotificationScheduler` 改为 `UNUserNotificationCenterDelegate`。
- 调度器初始化时设置 `UNUserNotificationCenter.current().delegate`。
- App 前台收到提醒时通过 `willPresent notification` 展示 banner 和声音。
- 用户点击通知后通过 `didReceive response` 读取 `userInfo.reminderId`。
- iOS 打开 Reminders Drawer，并通过 `native.viewChanged` 向 H5 发送 `view=reminders`、`source=native.notifications.reminders.opened` 和 `reminderId`。
- H5 收到带 `reminderId` 的 reminders 视图切换后，状态栏显示“已从系统通知打开提醒”，刷新提醒快照并高亮对应提醒行。
- 原生壳静态检查补充 `UNUserNotificationCenterDelegate`、`openReminderFromNotification`、`didReceive response` 和 `willPresent notification` 校验。

验证结果：

- `pnpm validate:native-shells` 通过。
- `xcodebuild -project apps/ios/AIEngineeringCode.xcodeproj -scheme AIEngineeringCode -configuration Debug -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build` 通过。

阶段价值：

这一阶段把提醒通知从“只会弹出”推进到“能回到提醒视图并定位对应提醒”。后续如果 H5 增加提醒详情页，可以继续利用 `reminderId` 打开对应提醒详情。

## 阶段 46：H5 运行时去 mock 与取消确认可信闭环

问题背景：

- H5 已经接入真实 `/agent/turns`、确认接口和数据库快照，但提交文本时仍会先用 `makeInteractionElements()` 生成一条“Mock 后端返回：Timeline 更新”。
- 这会让 Timeline 在后端确认前出现伪造事项，和“第一版功能都能直接点击使用”的真实产品边界冲突。
- 用户点击确认卡“取消”后，H5 之前会静默吞掉 reject 失败，并且不移除旧确认卡，用户可能继续点击一个已经取消意图的操作。

完成内容：

- 新增 `pnpm validate:h5-runtime`，静态检查 H5 运行时组件不能出现 `inferScheduleDraft`、`makeInteractionElements` 或“Mock 后端返回”。
- H5 `handleSubmittedText` 不再向 Timeline 注入本地推断事项，只追加用户消息并等待真实后端响应。
- 确认等待状态改为使用后端 `plan.summary`，不再使用前端自行推断的标题。
- H5 `handleCancel` 改为先调用后端 `rejectExecutionPlan`；成功后移除对应确认卡并追加取消消息，失败则保留确认卡并显示错误状态。
- `validate:factory` 已串联 `validate:h5-runtime`，阶段收尾会默认覆盖这条运行时约束。

验证结果：

- `pnpm validate:h5-runtime` 通过。
- `pnpm --filter @ai-code/h5 typecheck` 通过。

阶段价值：

这一阶段把 H5 从“真实 API 外面还包一层演示推断”推进到“运行时只展示用户输入、真实后端响应和持久化快照”。取消确认也从“前端口头说已取消”变成“后端拒绝成功后才移除可执行卡片”，减少误操作和数据状态错觉。

## 阶段 47：提醒完成 / 取消可点击闭环

问题背景：

- 提醒已经能通过对话创建、写入数据库、展示在 H5、同步为 iOS 本地通知，并支持通知点击回到提醒列表。
- 但提醒列表本身还不能直接完成或取消提醒，用户只能“看到提醒”，不能在 App 内处理提醒。
- `reminders.status` 已有 `scheduled`、`done`、`canceled`，适合先补一个小而完整的状态更新闭环。

完成内容：

- Reminder repository 协议新增 `update_reminder_status()`，in-memory 和 Postgres repository 都支持按提醒 ID 更新状态。
- `ReminderDomainService` 新增 `complete_reminder()` 和 `cancel_reminder()`。
- FastAPI 新增 `POST /reminders/{id}/complete` 和 `POST /reminders/{id}/cancel`。
- OpenAPI、SDK 和 Postman 集合补齐完成 / 取消提醒接口；Postman 环境新增 `reminderId`，查询提醒列表会自动提取最近一条 scheduled 提醒。
- H5 `remindersToBackendElements()` 会给 `scheduled` 提醒渲染“完成”和“取消”行内动作。
- H5 点击行内动作后调用 SDK 更新状态，刷新 reminders / timeline，并通过既有通知同步逻辑让 Native 不再调度非 scheduled 提醒。

验证结果：

- `PATH=.venv/bin:$PATH pytest python/backend/tests/test_agent_turns.py::test_reminder_status_endpoints_complete_and_cancel_reminders -q` 通过。
- `PATH=.venv/bin:$PATH pytest python/backend/tests/test_agent_turns.py python/backend/tests/test_orchestrator_planner.py -q` 通过。
- `PATH=.venv/bin:$PATH ruff check python/backend/backend/app/domains/reminder python/backend/backend/app/routes/reminder.py python/backend/tests/test_agent_turns.py` 通过。
- `PATH=.venv/bin:$PATH mypy python` 通过。
- `pnpm --filter @ai-code/h5 typecheck` 通过。
- `pnpm --filter @ai-code/sdk typecheck` 通过。
- `pnpm --filter @ai-code/shared-types typecheck` 通过。
- `pnpm validate:contracts` 通过。
- `pnpm validate:h5-runtime` 通过。
- Postman collection / environment JSON 解析通过。

阶段价值：

这一阶段让提醒从“系统可感知”推进到“用户可处理”。提醒列表不再只是展示后端事实，而是成为一个可操作的任务面；同时仍保持边界清楚：H5 只调用后端状态接口，后端更新事实，Native 通过已确认事实同步结果更新系统通知。

## 阶段 48：附件元数据 intake 闭环

问题背景：

- iOS 已经能真实选择照片和文件，并通过 Bridge 回传附件 ID、名称、类型、大小和可读文本。
- H5 之前仍会把“已选择附件：...”当作普通自然语言提交给 `/agent/turns`，容易让规划器把附件描述误判为业务意图。
- 当前还没有 OCR、票据解析或文件上传能力，因此第一版应先把附件作为资源元数据接收，不假装理解文件内容。

完成内容：

- 后端新增 `attachment` domain，包含 model、repository、service、in-memory repository 和 Postgres repository。
- FastAPI 新增 `POST /attachments/intake`，用于接收 `attachmentId`、`attachmentKind`、`attachmentName`、`attachmentSizeBytes`、`attachmentType`、`conversationId`、`source` 和 `text`。
- 新增 migration `0005_attachment_intakes`，只存附件元数据，不保存二进制或 base64。
- OpenAPI、SDK、shared-types 和 Postman 集合补齐附件 intake 契约。
- H5 收到 `native.inputSubmitted` 且 `inputKind=attachment` 时，先调用 `apiClient.intakeAttachment()`，在对话中展示“已接收附件”和后续处理快捷回复。
- H5 不再把附件描述文本直接提交到 `/agent/turns`；只有用户继续选择“作为费用票据处理”等快捷回复后，才进入普通对话和追问流程。
- Hybrid Bridge 文档已更新附件边界：Native 只传元数据，H5 调 intake，后端不假装 OCR 或文件理解已经完成。

验证结果：

- `PATH=.venv/bin:$PATH pytest python/backend/tests/test_attachments.py -q` 通过。
- `PATH=.venv/bin:$PATH pytest python/backend/tests -q` 通过。
- `PATH=.venv/bin:$PATH pytest python/backend/tests/test_agent_turns.py python/backend/tests/test_orchestrator_planner.py python/backend/tests/test_attachments.py -q` 通过。
- `PATH=.venv/bin:$PATH ruff check python` 通过。
- `PATH=.venv/bin:$PATH mypy python` 通过。
- `pnpm --filter @ai-code/h5 typecheck` 通过。
- `pnpm --filter @ai-code/sdk typecheck` 通过。
- `pnpm --filter @ai-code/shared-types typecheck` 通过。
- `pnpm validate:contracts` 通过。
- `pnpm validate:native-shells` 通过。
- `pnpm validate:db-migrations` 通过。
- `xcodebuild -project apps/ios/AIEngineeringCode.xcodeproj -scheme AIEngineeringCode -configuration Debug -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build` 通过。
- Postman collection / environment JSON 解析通过。

阶段价值：

这一阶段把附件入口从“原生能选，但 H5 仍当文本理解”推进到“原生选择 -> 后端资源元数据 intake -> 对话快捷处理”的可信闭环。边界继续清楚：附件资源事实和业务执行计划分离，后续 OCR、票据解析、文件上传可以在资源层扩展，再把解析结果交给 Agent 规划和用户确认。

## 阶段 49：附件票据金额追问闭环

问题背景：

- 附件元数据已经能进入后端资源层，H5 也会给用户展示“作为费用票据处理”等快捷回复。
- 但快捷回复进入 `/agent/turns` 后，如果规划器没有附件上下文，只能把它当作普通聊天或无效输入。
- 第一版还没有 OCR，因此不能直接从图片中读取金额；合理行为应该是基于最近附件识别“费用票据处理”意图，并追问金额。

完成内容：

- `ContextPack` 新增 `attachment_summary`，`ContextAssembler`、`ContextRedactor` 和 LLM prompt 都会携带附件摘要。
- `AttachmentIntakeRepository` 新增 `list_for_conversation()`，in-memory 和 Postgres repository 都可按会话读取最近附件。
- 新增 `AttachmentSummaryProvider`，把最近附件格式化为规划上下文。
- 后端 bootstrap 在 in-memory 与 Postgres runtime 中都注入附件摘要 provider。
- `RuleBasedPlanningEngine` 支持“把 receipt.jpg 作为费用票据处理”这类输入：如果当前会话有最近附件，会返回费用金额追问。
- 用户继续补“58 元”后，沿用 existing pending clarification 机制生成 `expense.create_reimbursement_draft` 确认计划，payload 保留 `attachment_id` 和 `attachment_name`。
- Postman 新增 `Agent 对话 / 提交对话 - 附件票据追问`，可配合 `附件资源 / 接收附件元数据` 和 `提交对话 - 补全费用金额` 验证。

验证结果：

- 红灯验证：新增 context 和附件票据追问测试在实现前分别失败，失败原因分别为 `ContextAssembler` 不接受 `attachment_provider`、Agent 返回 `assistant_message`。
- 绿灯验证：`PATH=.venv/bin:$PATH pytest python/backend/tests/test_context_assembler.py python/backend/tests/test_agent_turns.py::test_agent_turn_clarifies_attachment_receipt_amount_then_resolves -q` 通过。
- `PATH=.venv/bin:$PATH pytest python/backend/tests -q` 通过，结果 `105 passed`。
- `PATH=.venv/bin:$PATH ruff check python` 通过。
- `PATH=.venv/bin:$PATH mypy python` 通过。
- `pnpm --filter @ai-code/h5 typecheck` 通过。
- `pnpm --filter @ai-code/sdk typecheck` 通过。
- `pnpm --filter @ai-code/shared-types typecheck` 通过。
- `pnpm validate:contracts` 通过。
- `pnpm validate:db-migrations` 通过。
- `pnpm validate:context-sync` 通过。
- `pnpm validate:factory` 通过。
- Postman collection / environment JSON 解析通过。
- `git diff --check` 通过。

阶段价值：

这一阶段把附件快捷回复从“只是 UI 上能点”推进到“能进入后端多轮业务流”。即使没有 OCR，用户也能先选择票据附件，再通过金额追问创建费用草稿；同时仍保持业务事实写入必须经过确认，不把资源接收误当成费用创建。

## 阶段 50：费用草稿提交 / 取消可点击闭环

问题背景：

- 费用草稿已经能通过对话创建、确认写入数据库，并展示在 H5 费用列表和 Timeline 中。
- 但费用列表仍偏只读，用户无法在第一版 App 内把草稿推进为已提交，或主动取消误建的草稿。
- `expense_records.status` 已有 `draft`、`submitted`、`canceled`，适合沿用提醒状态闭环的方式补齐费用可操作面。

完成内容：

- Expense repository 协议新增 `update_record_status()`，in-memory 和 Postgres repository 都支持按费用 ID 更新状态。
- `ExpenseDomainService` 新增 `submit_record()` 和 `cancel_record()`。
- FastAPI 新增 `POST /expenses/{id}/submit` 和 `POST /expenses/{id}/cancel`，找不到费用时返回 `404`。
- OpenAPI 和 SDK 补齐 `submitExpense()`、`cancelExpense()`，H5 可通过统一 API client 调用。
- H5 `expensesToBackendElements()` 会给 `draft` 费用草稿渲染“提交”和“取消”行内动作。
- H5 点击费用行内动作后调用后端状态接口，刷新 expenses / timeline，并在对话底部状态中显示提交或取消结果。
- Postman 集合和环境新增 `expenseId`，查询费用草稿列表会自动提取最近一条 draft 费用，方便继续测试提交 / 取消接口。

验证结果：

- 红灯验证：新增 `test_expense_status_endpoints_submit_and_cancel_expense_drafts` 后，`POST /expenses/{id}/submit` 在实现前返回 `404`。
- 绿灯验证：目标后端测试通过；后端全量测试 `106 passed`；ruff、mypy、H5/SDK/shared-types typecheck、OpenAPI 契约、上下文同步、工厂校验、Postman JSON 解析和 diff 空白检查均通过。

阶段价值：

这一阶段让费用从“可创建的草稿事实”推进到“用户可处理的费用事项”。费用列表不再只是数据库快照，而是能直接完成第一版产品所需的提交 / 取消操作；同时保持业务边界清晰：H5 只触发状态接口，后端负责事实更新，后续真正接入报销系统时可以在 `submitted` 状态之后扩展外部审批或报销同步。

## 阶段 51：日程取消可点击闭环

问题背景：

- 日程已经能通过对话创建、确认写入数据库，并同步到 iOS 系统日历。
- 但 App 内还不能取消已创建日程，用户一旦误建或计划变更，只能看到数据库事实，不能处理它。
- `calendar_events.status` 已有 `scheduled`、`canceled`，可以先补齐取消状态闭环，并让 Native 系统日历同步只保留 scheduled 日程。

完成内容：

- Calendar repository 协议新增 `update_event_status()`，in-memory 和 Postgres repository 都支持按日程 ID 更新状态。
- `CalendarDomainService` 新增 `cancel_event()`。
- FastAPI 新增 `POST /calendar/events/{id}/cancel`，找不到日程时返回 `404`。
- OpenAPI 和 SDK 补齐 `cancelCalendarEvent()`。
- H5 `calendarEventsToBackendElements()` 会给 `scheduled` 日程渲染“取消”行内动作。
- H5 点击日程取消后调用后端状态接口，刷新 calendar / timeline，并通过既有系统日历同步逻辑让 Native 不再同步非 scheduled 日程。
- Postman 集合和环境新增 `calendarEventId`，查询日程列表会自动提取最近一条 scheduled 日程，方便继续测试取消接口。

验证结果：

- 红灯验证：新增 `test_calendar_event_cancel_endpoint_cancels_scheduled_event` 后，`POST /calendar/events/{id}/cancel` 在实现前返回 `404`。
- 绿灯验证：目标后端测试通过；后端全量测试 `107 passed`；ruff、mypy、H5/SDK/shared-types typecheck、OpenAPI 契约、Postman JSON 解析均通过。

阶段价值：

这一阶段让日程从“可创建、可同步”推进到“App 内可处理”。到这里，日程、费用、提醒三类核心事项都具备了至少一个可点击状态操作：日程可取消，费用可提交 / 取消，提醒可完成 / 取消；后续可以继续补详情页、编辑和外部系统同步。

## 阶段 52：Timeline 行内动作闭环

问题背景：

- Timeline 已经能合并展示已确认的日程、费用和提醒，是用户查看全部事项的主视图。
- 但可点击操作只出现在各自领域页面：日程页可取消、费用页可提交 / 取消、提醒页可完成 / 取消。
- 用户在 Timeline 看到事项时，还需要切换到对应页面才能处理，第一版操作效率不够直接。

完成内容：

- H5 summary-list action 新增可选 `targetId`，用于 Timeline 这类展示 ID 与真实领域 ID 不同的聚合列表。
- `handleSummaryAction()` 优先使用 `action.targetId` 调用后端状态接口，保留原有领域页直接使用 item ID 的行为。
- Timeline 中 scheduled 日程会渲染“取消”动作，调用 `cancelCalendarEvent()`。
- Timeline 中 draft 费用会渲染“提交”和“取消”动作，调用 `submitExpense()` 或 `cancelExpense()`。
- Timeline 中 scheduled 提醒会渲染“完成”和“取消”动作，调用 `completeReminder()` 或 `cancelReminder()`。
- H5 类型契约测试覆盖 Timeline action 的 `targetId`，避免聚合列表误把 `timeline-*` 展示 ID 发给后端。

验证结果：

- `pnpm --filter @ai-code/h5 typecheck` 通过。
- `pnpm validate:contracts` 通过。
- 上下文同步、工厂校验和 diff 空白检查在阶段记录更新后通过。

阶段价值：

这一阶段把 Timeline 从“统一查看面”推进到“统一操作面”。用户不需要先判断事项属于日程、费用还是提醒，也不需要切换页面；在总时间线上看到事项后即可直接处理，第一版 App 的可用性更接近真实产品。

## 阶段 53：事项内容编辑闭环

问题背景：

- 日程、费用、提醒已经能创建、确认、展示和做状态流转。
- 第一版真实使用时，用户还会需要修正标题、时间、金额或日期；如果只能取消重建，体验不完整，也容易产生重复记录。
- 状态流转和内容编辑应分开：`cancel` / `complete` / `submit` 继续处理状态，`PATCH` 只修改业务内容字段。

完成内容：

- FastAPI 新增 `PATCH /calendar/events/{id}`、`PATCH /expenses/{id}` 和 `PATCH /reminders/{id}`。
- Calendar、Expense、Reminder 三个 domain 都新增 `*Update` 类型，repository / Postgres repository / service 都支持按 ID 更新可编辑字段。
- 日程可编辑 `title`、`startAt`、`endAt`、`timezone`；费用可编辑 `title`、`amount`、`currency`、`occurredOn`；提醒可编辑 `title`、`dueAt`。
- 编辑接口不会修改 `status` 或 `sourceActionId`，避免把业务事实修正和状态推进混在一起。
- OpenAPI、shared-types、SDK 和 Postman 集合同步新增编辑契约。
- H5 日程、费用、提醒和 Timeline 行内动作都新增“编辑”；点击后用当前值作为默认值，提交 PATCH 后刷新领域页和 Timeline。
- H5 类型契约测试覆盖领域页编辑动作、Timeline `targetId` 编辑动作，以及 SDK `updateCalendarEvent()`、`updateExpense()`、`updateReminder()` 方法。

验证结果：

- 红灯验证：新增三个编辑接口测试后，`PATCH /calendar/events/{id}`、`PATCH /expenses/{id}`、`PATCH /reminders/{id}` 在实现前均返回 `404`。
- 绿灯验证：三个目标测试通过；后端全量测试 `110 passed`；ruff、mypy、H5/SDK/shared-types typecheck、OpenAPI 契约和 Postman JSON 解析均通过。

阶段价值：

这一阶段让三类核心事项从“可处理”推进到“可修正”。用户不必为了改时间、金额或标题重新创建事项；同时后端仍保持清晰边界：内容编辑是资源 `PATCH`，状态流转是明确动作接口，后续接详情页或更正式的编辑表单时可以复用同一套契约。

## 阶段 54：H5 应用内编辑面板

问题背景：

- 阶段 53 已经打通三类事项的 `PATCH` 编辑接口，H5 行内“编辑”也能触发更新。
- 但最初实现使用浏览器 `window.prompt` 逐项收集字段，在 iOS WebView 里体验粗糙，也不像一个原生 App 内的功能。
- 第一版应让用户在应用内完成编辑，而不是跳出浏览器系统弹窗。

完成内容：

- 新增 `SummaryEditPanel`，作为 H5 内部编辑面板渲染日程、费用、提醒的编辑字段。
- `handleSummaryAction()` 点击 `calendar.edit`、`expense.edit`、`reminder.edit` 时只打开编辑面板，不再直接弹 `window.prompt`。
- 编辑面板根据 action 类型渲染对应字段：日程标题/开始/结束/时区，费用标题/金额/币种/日期，提醒标题/时间。
- 提交后仍复用现有 `updateCalendarEvent()`、`updateExpense()`、`updateReminder()` SDK 方法，成功后刷新领域页和 Timeline。
- `validate:h5-runtime` 新增防回归检查：禁止运行时出现 `window.prompt`，并要求存在 `SummaryEditPanel`。

验证结果：

- 红灯验证：新增运行时校验后，`pnpm validate:h5-runtime` 因 `window.prompt` 和缺少 `SummaryEditPanel` 失败。
- 绿灯验证：移除 prompt 并实现应用内编辑面板后，`pnpm validate:h5-runtime` 和 `pnpm --filter @ai-code/h5 typecheck` 均通过。

阶段价值：

这一阶段把编辑从“技术上能更新”推进到“用户在 App 内能完成”。它不改变后端事实边界，不新增业务写入路径，只把 H5 的编辑交互从浏览器弹窗升级为可持续扩展的应用内面板。

## 阶段 55：编辑输入校验与终态保护

问题背景：

- 阶段 53 和 54 已经让用户可以在 App 内编辑日程、费用和提醒。
- 但后端编辑接口还偏“能写入”：日程可能被改成结束早于开始，提醒时间可能不是 ISO 时间，费用负金额虽然会抛错但路由没有映射为明确 `400`。
- 更重要的是，已经取消的日程、已提交的费用、已完成或取消的提醒仍可能被内容编辑接口再次修改，这会混淆“业务事实修正”和“终态事项历史记录”。

完成内容：

- Calendar domain 在创建和编辑时校验 `start_at/startAt`、`end_at/endAt` 必须是带 timezone 的 ISO datetime，并要求结束时间晚于开始时间；即使 PATCH 只修改开始或结束其中一个字段，也会结合现有记录校验完整时间区间。
- Expense domain 在创建和编辑时校验 `occurred_on/occurredOn` 必须是 ISO date，`amount` 继续要求非负。
- Expense 编辑请求保留 `amount` 的原始 JSON 类型，由 domain service 严格拒绝 `bool` 和字符串金额，避免 Pydantic 宽松转换把 `true` 或 `"88.5"` 写成有效金额。
- Reminder domain 在创建和编辑时校验 `due_at/dueAt` 必须是带 timezone 的 ISO datetime。
- 三个编辑路由捕获 `ValueError` 并返回 `400`，避免无效输入在 FastAPI 中冒成未处理异常。
- In-memory repository 增加终态保护：日程只有 `scheduled` 可编辑，费用只有 `draft` 可编辑，提醒只有 `scheduled` 可编辑。
- Postgres repository 的内容编辑 SQL 增加状态条件；当 `update ... returning` 没有行时，再查询当前状态区分 `KeyError` 的不存在记录和 `ValueError` 的终态不可编辑记录。
- 新增后端回归覆盖：时间倒挂、部分更新时间导致倒挂、负金额、非数值金额、无效提醒时间、取消日程不可编辑、已提交费用不可编辑、已完成提醒不可编辑，以及 Postgres repository 中 `ValueError` / `KeyError` 的区分。

验证结果：

- 红灯验证：6 个新增接口拒绝用例先失败，其中时间倒挂和终态编辑返回 `200`，负金额冒出未捕获 `ValueError`。
- 绿灯验证：编辑成功和拒绝用例 `11 passed`；Postgres 终态保护测试通过；后端全量测试 `119 passed`；ruff 和 mypy 均通过。

阶段价值：

这一阶段把编辑能力从“可用”推进到“可信”。用户仍可修正未完成事项的内容，但已经进入终态的事项不会被静默改写；后续即使接入外部日历、报销系统或通知系统，后端也能保持事实状态和内容修正的边界清晰。

## 阶段 56：状态流转保护

问题背景：

- 日程、费用、提醒已经能通过行内动作取消、提交、完成或取消。
- 编辑接口已经保护了终态事项，但状态动作接口仍然只是“设置目标状态”，没有校验当前状态是否允许进入目标状态。
- 这会让费用出现 `submitted -> canceled` 或 `canceled -> submitted`，提醒出现 `done -> canceled` 或 `canceled -> done`，从而把历史事实反向改写。

完成内容：

- Calendar 状态流转收紧为仅允许 `scheduled -> canceled`，重复取消返回 `400`。
- Expense 状态流转收紧为仅允许 `draft -> submitted` 或 `draft -> canceled`，已提交或已取消费用不能再切换到另一个终态。
- Reminder 状态流转收紧为仅允许 `scheduled -> done` 或 `scheduled -> canceled`，已完成或已取消提醒不能再切换到另一个终态。
- In-memory repository 的 `update_*_status()` 内置转移表保护，避免绕过 service 直接写坏状态。
- Postgres repository 的状态更新 SQL 改为带当前状态条件的原子更新；`returning` 为空时再查当前状态，区分不存在记录的 `KeyError` 和非法状态流转的 `ValueError`。
- 状态动作路由捕获 `ValueError` 并返回 `400`，保留不存在 ID 返回 `404`。
- 新增后端回归覆盖：日程重复取消、费用提交后取消、费用取消后提交、提醒完成后取消、提醒取消后完成、状态动作 missing ID 仍返回 `404`，以及 Postgres repository 非法状态流转。

验证结果：

- 红灯验证：新增 3 个状态接口拒绝用例先失败，当前实现会把终态继续覆盖并返回 `200`。
- 绿灯验证：目标状态接口用例 `6 passed`；Postgres 终态状态保护测试通过；后端全量测试 `125 passed`；ruff 和 mypy 均通过。

阶段价值：

这一阶段把三类事项的状态动作从“按钮可点”推进到“状态机可信”。用户可以处理待办事项，但一旦事项进入终态，后端不会再允许反向改写；后续接入系统日历、报销审批或通知回执时，外部系统同步可以依赖更稳定的领域状态。

## 阶段 57：iOS 系统日历取消清理闭环

问题背景：

- 已确认日程会通过 `calendar.events.sync` 写入 iOS 系统日历，并用后端 `event.id` 写入 notes marker 防重复。
- 但取消日程后，如果 H5 只同步 scheduled 快照，Native 无法知道要删除已经写入的旧系统日历事件。
- 即使同步 canceled 状态，如果删除逻辑只按当前 payload 的开始 / 结束时间前后 1 天搜索，日程大幅改期后再取消也可能留下旧日期的系统日历残留。

完成内容：

- H5 `syncNativeCalendarEvents()` 改为同步全部日程事实，包含 `scheduled` 和 `canceled` 等状态，不再只发送 scheduled 日程。
- iOS `NativeCalendarEventSyncer` 收到 `status != "scheduled"` 时会按后端 `event.id` marker 删除旧系统日历事件，不再写入系统日历。
- iOS 保存 EKEvent 成功后，将后端 `event.id -> EKEvent.eventIdentifier` 存入 `UserDefaults`；后续更新或取消优先用稳定 identifier 删除旧事件。
- marker 搜索兜底从当前事件前后 1 天扩展为覆盖当前事件窗口，并额外覆盖相对当前时间过去 1 年到未来 3 年，降低大幅改期后取消漏删旧事件的风险。
- `validate-native-shells` 增加防回归检查：H5 日程同步不得过滤 scheduled，payload 必须包含 `status`；iOS 必须存在非 scheduled 删除分支、稳定 `eventIdentifier` 映射和宽窗口 marker fallback。
- 桥接契约文档明确：非 scheduled 日程不得写入系统日历，并且必须删除已有同 marker 的系统日历事件。

验证结果：

- 红灯验证：新增 Native 校验后，当前实现因 H5 过滤 scheduled、iOS 缺少非 scheduled 删除分支而失败；补强稳定 identifier 校验后，旧实现因缺少 `UserDefaults` / `eventIdentifier` / 宽窗口 fallback 失败。
- 绿灯验证：`pnpm validate:native-shells` 通过；`pnpm --filter @ai-code/h5 typecheck` 通过；`xcodebuild -project apps/ios/AIEngineeringCode.xcodeproj -scheme AIEngineeringCode -destination 'generic/platform=iOS Simulator' build CODE_SIGNING_ALLOWED=NO` 通过。

阶段价值：

这一阶段把系统日历同步从“创建和覆盖”推进到“完整生命周期同步”。用户在 App 内取消日程后，iOS 系统日历不会继续保留旧日程；即使日程先被改期，再取消，也有稳定 identifier 和宽窗口 marker 搜索两层清理策略兜底。

## 阶段 58：附件资源查询与对话回看闭环

问题背景：

- iOS 附件入口已经能真实选择照片或文件，并通过 Bridge 把附件元数据提交给 H5。
- 后端已经能通过 `POST /attachments/intake` 接收元数据，规划上下文也能读取最近附件，用于“作为费用票据处理”后的金额追问。
- 但附件 intake 后缺少公开查询接口，Postman 和 H5 都无法稳定回看当前会话已接收的附件资源；用户只能在一次对话消息里看到接收结果。

完成内容：

- 后端 `AttachmentIntakeService` 新增 `list_for_conversation()`，复用已有 repository 的 `list_for_conversation()` 能力。
- FastAPI 新增 `GET /attachments?conversationId=...&limit=...`，按当前会话返回最近附件元数据；`limit` 会限制在 1 到 50 之间。
- SDK 新增 `getAttachments(conversationId, limit?)`，H5 可直接读取当前会话附件资源。
- H5 新增 `attachmentIntakesToBackendElements()`，将附件元数据渲染为对话页中的“本轮附件资源”摘要卡；附件不是 Timeline 事项，也不新增独立导航页。
- H5 在刷新后端快照和附件 intake 成功后，会查询当前 `conversationId` 下附件列表，并在对话流中维护一个固定 ID 的附件资源卡，避免重复堆叠。
- OpenAPI 和 Postman 集合补齐 `GET /attachments`；Postman 的“附件资源”分组现在可以先接收附件元数据，再查询当前会话附件列表。

验证结果：

- 红灯验证：新增 `GET /attachments` 后端测试先返回 `404`；H5 契约测试先因缺少 `getAttachments()` 和 `attachmentIntakesToBackendElements()` 失败。
- 绿灯验证：`PATH=.venv/bin:$PATH pytest python/backend/tests/test_attachments.py -q` 通过；`pnpm --filter @ai-code/h5 typecheck` 通过；`pnpm --filter @ai-code/sdk typecheck` 通过；`pnpm validate:contracts` 通过；Postman collection JSON 解析通过。

阶段价值：

这一阶段把附件入口从“已接收但难回看”推进到“资源层可查询、对话内可追踪”。它仍然不做文件上传、OCR 或票据自动解析，但为后续附件归档、识别和费用凭证处理提供了稳定的读取接口和前端展示位置。

## 阶段 58.5：附件内容上传后端闭环

问题背景：

- iOS/H5 附件入口此前只能提交附件元数据和调用端已经提供的可读文本。
- 后端可以 intake 元数据，也可以把 `text` 放进 `attachment_summary`，但缺少一个明确的内容上传入口。
- 第一版 App 需要附件能力继续向“真实可用”靠近，至少后端要能承接小文件内容、计算内容标识，并把文本附件转成 Agent 可读上下文。

完成内容：

- 后端新增 `POST /attachments/upload`，接收 JSON 格式的 `base64Content`，解码后限制在 5MB 内。
- 上传接口复用附件 intake 边界，创建当前会话下的 `AttachmentIntake`。
- 文本附件会按 UTF-8 抽取 `text`；调用端显式提供 `text` 时优先使用调用端文本。
- 返回结果新增 `contentStatus=content_received` 和 `contentSha256`，用于排查重复内容和上传结果。
- Postgres 新增 `0007_attachment_content_metadata`，在 `attachment_intakes` 上保存 `content_sha256` 和 `content_status`。
- SDK、shared-types、OpenAPI 和 Postman 新增上传接口契约。

验证结果：

- 红灯验证：`POST /attachments/upload` 最初返回 404。
- 绿灯验证：上传 `text/plain` 附件后，响应包含 `contentStatus`、`contentSha256`、`sizeBytes` 和抽取出的 `text`。
- 回归验证：`GET /attachments?conversationId=...` 能读回上传后的文本，后续 `AttachmentSummaryProvider` 可继续把它注入 `attachment_summary`。

阶段价值：

这一阶段把附件资源从“只有元数据”推进到“后端能承接内容并产生可读上下文”。它仍然不直接 OCR 图片、不保存原始二进制，也不会绕过确认卡创建费用、日程或提醒；它为后续 H5/iOS 上传链路和 OCR / 票据解析接入预留了稳定后端入口。

## 阶段 59：H5 Agent 调试信息可视化

问题背景：

- 后端已经提供 `GET /agent/conversations/{conversationId}/debug`，可以查看事件、决策 trace 和 pending clarification。
- 但这个能力主要在 Postman 和后端日志里使用；用户在 iOS/H5 App 内对话测试时，无法直接看到当前会话是否走了 LLM、是否 fallback、缺了哪些字段或正在等待哪条追问。
- 用户此前明确关心 DeepSeek / OpenAI 调用时的 prompt、速度和对话质量。第一版 App 至少应能展示安全的规划摘要，而不是要求用户每次切到终端或 Postman。

完成内容：

- SDK 导出 `AgentConversationDebug`、`AgentDebugEvent`、`AgentDebugDecisionTrace` 和 `AgentDebugPendingClarification` 类型。
- SDK 新增 `getAgentConversationDebug(conversationId)`，直接调用已有只读调试接口。
- H5 新增 `agentDebugToBackendElements()`，把当前会话 debug 信息转换为设置页摘要卡。
- 设置页现在会展示 `Planner`、fallback reason、工具选择、缺失信息、当前打开的追问和事件记录数量。
- H5 刷新后端快照时会读取当前 `conversationId` 的 debug 信息，并用固定 ID 更新设置页调试卡，避免重复堆叠。
- 调试卡只展示后端已经持久化的摘要字段，不展示完整 prompt 或完整 LLM response，避免把敏感提示词默认暴露在 App UI。

验证结果：

- 红灯验证：H5 契约测试先因缺少 `AgentConversationDebug` SDK 导出、`getAgentConversationDebug()` 和 `agentDebugToBackendElements()` 失败。
- 绿灯验证：补齐 SDK 与 H5 转换后，`pnpm --filter @ai-code/h5 typecheck` 和 `pnpm --filter @ai-code/sdk typecheck` 通过。

阶段价值：

这一阶段把 Agent 调试从“开发者工具外部查看”推进到“App 内可观察”。用户测试自然语言对话时，可以直接在设置页看到规划器模式、fallback、缺失字段和追问状态，后续调 prompt、模型 provider 和多轮体验时会更快定位问题。

## 阶段 60：附件日程材料追问闭环

问题背景：

- H5 附件 intake 成功后会给出“作为费用票据处理”和“作为日程材料处理”两个快捷回复。
- “作为费用票据处理”已经能进入金额追问，再生成费用草稿确认卡。
- 但“作为日程材料处理”仍会被规则 planner 当作普通聊天，用户点击后不会进入可执行的日程流程，违背第一版“每个可点击入口都能用”的目标。

完成内容：

- Rule planner 新增附件日程材料识别：当用户在已有附件上下文里输入“把 agenda.pdf 作为日程材料处理”这类表达时，返回 `calendar.create_event` 的追问。
- 追问问题为“agenda.pdf 要关联到哪个时间的日程？”，缺失字段为 `start_at`，快捷回复包含“明天上午9点”和“明天上午10点”。
- Pending clarification 的 partial payload 保留 `attachment_id`、`attachment_name`、默认标题和时间提示。
- Pending calendar 解析完成后，生成的 `calendar.create_event` action payload 会保留附件引用，同时仍然需要用户确认后才写入日程事实。
- Postman 新增“提交对话 - 附件日程材料追问”，可与附件 intake 和“补全日程时间”组合验证。

验证结果：

- 红灯验证：新增端到端测试先失败，当前返回 `assistant_message`。
- 绿灯验证：`PATH=.venv/bin:$PATH pytest python/backend/tests/test_agent_turns.py::test_agent_turn_clarifies_attachment_calendar_material_then_resolves -q` 通过。

阶段价值：

这一阶段把附件快捷回复从“部分可用”推进到“两条都可进入业务流”。附件仍不直接生成事实，也不做 OCR；它只作为上下文进入日程追问和确认流程，保持资源接收、推理规划和业务写入之间的边界清楚。

## 阶段 61：iOS 键盘 Bridge 与假入口清理

问题背景：

- H5 与 Bridge 契约已经包含 `input.keyboard.open`，设置页也需要成为可点击的原生输入入口。
- 但 iOS WebView 收到 `input.keyboard.open` 时只返回 ACK，没有切到底部键盘输入，也没有聚焦输入框。
- Native Drawer 的日历摘要里还有空 `Button {}` 和 chevron，用户看起来可以点击，但实际没有任何动作，不符合第一版“可见入口都能直接使用”的目标。

完成内容：

- H5 设置页新增“键盘输入”动作，点击后发送 `input.keyboard.open`，状态栏显示“正在打开键盘输入”。
- H5 类型把 `bridgeAction` 扩展为支持 `input.keyboard.open`，避免只有语音入口可被设置页触发。
- iOS `H5WebView` 新增 `onKeyboardInputRequested` 回调；收到 `input.keyboard.open` 后调用 Native Shell 并返回带 `status=opened` 的 ACK。
- iOS `HybridShellView` 新增 `@FocusState`，`openKeyboardInput()` 会关闭 Drawer、切换到底部文本输入模式、停止正在录制的语音并聚焦输入框。
- Native 日历摘要去掉空按钮和误导性 chevron，改为静态摘要行；后续如果要点击，必须接入真实路由或真实数据动作。
- `validate-native-shells` 新增键盘聚焦和“禁止空按钮 / chevron 假入口”检查，防止这类体验倒退。

验证结果：

- 红灯验证：新增 Native 校验后，当前实现因缺少 `@FocusState`、`onKeyboardInputRequested`、H5 `input.keyboard.open` 入口，以及仍存在 `Button {}` / `chevron.right` 而失败。
- 绿灯验证：`pnpm validate:native-shells` 通过；`pnpm --filter @ai-code/h5 typecheck` 通过；`xcodebuild -project apps/ios/AIEngineeringCode.xcodeproj -scheme AIEngineeringCode -destination 'generic/platform=iOS Simulator' build CODE_SIGNING_ALLOWED=NO` 通过。

阶段价值：

这一阶段把键盘输入从“契约存在但原生没动作”推进到“App 内设置入口可直接拉起原生输入框”，并清理了原生 Drawer 中看起来可点但没有动作的假入口。它继续保持边界清楚：Native 只负责输入能力和壳层交互，H5 负责触发 Bridge 和渲染状态，后端仍负责业务理解与事实写入。

## 阶段 62：会话历史恢复 API

问题背景：

- 后端已经把用户 turn 和助手 turn 写入 `conversation_turns`，但此前只有写入能力，没有公开读取接口。
- iOS/H5 重新打开后，对话气泡只能依赖前端运行时状态；一旦刷新或重启，用户会觉得 Agent “失忆”。
- 第一版 App 需要能恢复 transcript，至少让用户看到上一轮说了什么、助手追问了什么，以及后端当时返回过什么摘要。

完成内容：

- `ConversationTurnStore` 新增 `list_for_conversation(conversation_id, limit)`，in-memory 与 Postgres 都支持按会话读取历史 turn。
- 后端新增 `GET /agent/conversations/{conversationId}/turns?limit=50`，返回 `conversationId` 和按时间排序的 `turns`。
- 返回字段包含 `id`、`role`、`summary`、`inputText`、`rawContent`、`structuredResponse` 和 `createdAt`；助手结构化响应沿用已 redacted 的存储版本，确认令牌不会泄露。
- SDK 和 shared-types 新增 `AgentConversationTurn`、`AgentConversationTurns` 和 `getAgentConversationTurns()`。
- H5 启动时使用稳定 `conversationId`：优先 URL `conversationId`，其次 `localStorage`，最后才生成新 ID；初始刷新会读取历史 turns 并恢复到 conversation surface。
- H5 恢复历史时使用稳定元素 ID，不使用 `Date.now()`；用户 turn 恢复为用户气泡，助手普通消息和追问可恢复为消息 / quick replies。
- 对 `confirmation_required` 历史响应只恢复摘要消息，不恢复可点击确认卡，避免 redacted `confirmToken` 生成无法确认的坏按钮；当前会话内刚返回的确认卡仍按实时响应保留。
- OpenAPI 和 Postman 新增“查看对话历史”，Postman README 补充使用说明。

验证结果：

- 红灯验证：新增后端端到端测试后，`GET /agent/conversations/{conversationId}/turns` 返回 `404`。
- 绿灯验证：`PATH=.venv/bin:$PATH pytest python/backend/tests/test_agent_turns.py::test_agent_conversation_turns_return_recorded_user_and_assistant_messages python/backend/tests/test_postgres_repositories.py::test_agent_execution_flow_persists_to_postgres -q` 通过；`pnpm --filter @ai-code/shared-types typecheck`、`pnpm --filter @ai-code/sdk typecheck`、`pnpm --filter @ai-code/h5 typecheck`、`pnpm validate:contracts` 和 Postman JSON 解析通过。

阶段价值：

这一阶段把对话从“只在当前前端内存里存在”推进到“可以从后端恢复 transcript”。它没有绕过确认安全边界：历史确认卡不会带可用 token 重新执行，业务事实仍必须通过实时确认流程写入；但用户重开 App 后已经能看回当前会话上下文，为后续恢复待确认计划、跨设备会话和更完整的多轮记忆打基础。

## 阶段 63：会话范围业务读模型

问题背景：

- H5 已经用稳定 `conversationId` 提交对话、读取附件、debug 和 turns。
- 但 Timeline、日程、费用、提醒和执行记录仍然调用全局列表接口。
- 多轮测试或 Postman/iOS 并行测试时，当前会话的 Timeline 可能混入其他会话已确认事项，用户会觉得 Agent 把不相关的日程、费用或提醒带进来了。

完成内容：

- 四个读取接口新增可选 `conversationId` query：`GET /calendar/events`、`GET /expenses`、`GET /reminders` 和 `GET /execution-ledger`。
- 不传 `conversationId` 时保持全局列表行为，兼容既有调试方式；传入时只返回该会话产生的事项和流水。
- `ExecutionStore` 新增按会话列出 action id 的能力，读侧通过 `execution_plans -> domain_actions -> sourceActionId` 关联领域事实，不把 `conversationId` 强塞进三类业务事实模型。
- in-memory 和 Postgres execution store 都支持按会话查询 action id 与 execution ledger。
- 日程、费用、提醒 repository/service 新增按 `sourceActionId` 集合过滤能力；Postgres 路径使用同样的 action id 过滤执行。
- SDK 的 `getCalendarEvents()`、`getExpenses()`、`getReminders()` 和 `getExecutionLedger()` 支持可选 `conversationId`。
- H5 刷新后端快照时会把当前 `conversationIdRef.current` 传给四个列表接口，Timeline 因此只展示当前会话确认写入的事项。
- OpenAPI 和 Postman 同步新增 query 参数说明，Postman 的领域查询默认带当前 `conversationId`。

验证结果：

- 红灯验证：创建两个不同 conversation 的多动作计划并确认后，`/calendar/events?conversationId=目标会话` 仍返回两个会话的日程，测试失败。
- 绿灯验证：补齐执行存储和领域列表过滤后，同一测试通过；Postgres repository 覆盖 `list_action_ids_for_conversation()`、`list_ledger(conversation_id)` 和三领域按 `sourceActionId` 过滤路径。

阶段价值：

这一阶段把 App 的业务视图从“全局数据库快照”推进到“当前会话读模型”。它保持了后端架构边界：业务事实仍只知道自己的 `sourceActionId`，会话归属由执行计划和领域 action 的读侧关联提供。后续要做自然语言取消、编辑、补充或跨设备恢复时，可以基于当前会话的事实集合继续构建，而不是在前端临时筛数据。

## 阶段 64：会话范围 Agent 上下文摘要

问题背景：

- 阶段 63 已经让 H5 和 API 列表按 `conversationId` 读取当前会话事项。
- 但 Postgres `ContextAssembler` 使用的日程、费用、提醒摘要 provider 仍然是全局查询。
- 这会导致 LLM prompt 里可能混入其他会话的事项，即使 UI Timeline 已经不串数据；后续做“取消刚才的提醒”“提交刚才的费用”时会放大误操作风险。

完成内容：

- `PostgresCalendarSummaryProvider`、`PostgresExpenseSummaryProvider` 和 `PostgresReminderSummaryProvider` 改为按 `execution_plans.conversation_id` 过滤。
- 三个 provider 都通过 `business_fact.source_action_id -> domain_actions.id -> execution_plans.id` 关联会话归属，保持业务事实模型不直接持有对话字段。
- 摘要文本新增 `id` 和 `source_action_id`，为后续自然语言管理已有事项提供可定位的候选目标。
- `current_input` 在这三个 provider 中不参与 SQL 过滤，已显式丢弃，避免误以为有语义检索。

验证结果：

- 红灯验证：创建两个会话，各自确认一组日程 / 费用 / 提醒后，目标会话的 expense summary 仍包含另一个会话的 `99` 元费用。
- 绿灯验证：补齐 join 过滤后，目标会话摘要只包含自己的 `目标会`、`58` 元费用和“带电脑”提醒，不包含干扰会话的“干扰会”、`99` 元和“带资料”。

阶段价值：

这一阶段把“当前会话”从 UI 读模型推进到 Agent prompt 上下文。它降低了 LLM 在多会话、多测试数据场景中拿错事项的概率，并为下一步自然语言修改 / 取消 / 提交已有事项打基础：模型可以看到当前会话内的事实 ID，但执行写入仍需要走工具、确认和状态流转保护。

## 阶段 65：自然语言管理已有事项

问题背景：

- 日程、费用、提醒已经有按钮式编辑 / 取消 / 完成 / 提交能力。
- 但用户直接在对话里说“取消刚才的提醒”“提交刚才的费用”“把明天的会议改到十点”时，Agent 还不能可靠转换成管理已有事项的执行计划。
- 更危险的是，“把明天的会议改到十点”此前会被规则路径识别成新建日程，而不是更新已有日程。

完成内容：

- ToolCatalog 从 3 个创建工具扩展为创建 + 管理工具，新增 8 个管理 action type：`calendar.cancel_event`、`calendar.update_event`、`expense.submit_reimbursement`、`expense.cancel_reimbursement`、`expense.update_reimbursement`、`reminder.cancel_reminder`、`reminder.complete_reminder`、`reminder.update_reminder`。
- PolicyEngine 新增工具白名单校验，未知 action 不会进入确认卡，避免 LLM 幻觉工具先展示给用户再执行失败。
- ExecutionCoordinator 注册新增管理动作 handler；handler 仍通过领域 service 执行，复用已有状态流转保护和内容校验。
- RuleBasedPlanningEngine 新增确定性目标解析：从当前会话的日程 / 费用 / 提醒摘要中选择 `scheduled` 或 `draft` 目标，生成带 `target_id`、`target_kind`、`expected_status` 和 `resolution_reason` 的候选 action。
- “刚才的提醒”解析为最近同会话 scheduled reminder，支持取消、完成和改时间；“刚才的费用”解析为最近同会话 draft expense，支持提交、取消和改金额；“明天的会议”解析为同会话明天 scheduled calendar event，支持取消和改时间，改时间时保持原日程时长。
- in-memory runtime 也接入会话范围领域摘要 provider，测试环境和本地无数据库模式不再缺少事项上下文。
- OpenAPI、shared-types、H5 confirmation / result 映射和 Postman collection 已补齐 8 个管理动作的契约覆盖；确认卡可展示管理已有事项的目标，执行结果会显示已取消 / 已完成 / 已提交 / 已更新等业务结果。

验证结果：

- 红灯验证：管理类验收最初分别返回普通聊天、新建日程或缺少目标 action。
- 绿灯验证：8 个自然语言管理动作都生成带 `target_id` 的确认计划；确认后可分别取消 / 完成 / 更新提醒，提交 / 取消 / 更新费用，以及取消 / 更新日程。
- 额外验证：ToolCatalog、PolicyEngine 和 ExecutionRunner 专项测试覆盖新增工具、未知工具拦截和管理 handler 执行；契约脚本校验 OpenAPI 与 shared-types 的 action type 枚举一致性，H5 runtime 校验管理结果文案映射。

阶段价值：

这一阶段让对话从“只能创建事项”推进到“可以管理当前会话里的已有事项”。关键边界没有放松：LLM 或规则 planner 只生成候选动作，真实目标必须来自当前会话摘要，所有修改仍经过确认卡、ToolCatalog 白名单、PolicyEngine、ExecutionRunner 和领域层状态机。

## 阶段 66：自然语言只读查询

问题背景：

- 阶段 63 到 65 已经让当前会话的事项可以被列表读取、被 Agent prompt 摘要使用，并能通过自然语言管理。
- 但用户直接问“明天我有什么安排？”“我有哪些费用？”时，后端仍返回通用闲聊兜底。
- 这会让第一版 App 像一个只会执行命令的工具，而不像能围绕当前事项对话的时间管理 Agent。

完成内容：

- RuleBasedPlanningEngine 新增只读查询分支，识别“有什么”“有哪些”“查一下”“看看”“列表”“要做什么”等查询表达。
- 查询分支直接读取当前 `ContextPack` 里的 `calendar_summary`、`reminder_summary` 和 `expense_summary`，不生成 `ProposedAction`。
- 查询结果同时返回 `assistant_message` 文本和 `summary-list` 结构化元素，H5 会把结构化元素渲染为对话里的结果列表。
- “明天我有什么安排？”会按目标日期过滤 scheduled 日程和提醒，并按时间排序返回摘要；不会把昨天费用混入明天安排。
- “明天有什么提醒？”只返回提醒，不混入日程；“明天有什么日程？”只返回日程，不混入提醒。
- “我有哪些费用？”会返回当前会话里的费用标题、金额、日期和状态；“昨天有哪些费用？”会按 `occurred_on` 过滤费用。
- LLM planner prompt 明确只读查询应基于上下文摘要返回 `chat`，actions 为空，不要生成写入 action、不要要求确认、不要声称已创建或同步事项。
- Postman 新增 `提交对话 - 查询明天安排` 和 `提交对话 - 查询费用` 两个请求，README 说明这类请求返回 `assistant_message` 与 `summary-list`，不会生成确认卡。

验证结果：

- 红灯验证：同一会话先确认写入日程、提醒、费用后，查询仍返回“我在。你可以继续聊，也可以让我帮你安排日程、提醒或费用。”
- 绿灯验证：查询明天安排返回日程和提醒，不包含费用；查询提醒 / 日程时按领域过滤；查询费用返回费用标题和金额，并支持按相对日期过滤。
- 额外验证：规则 planner 单测覆盖从 `ContextPack` 摘要直接回答安排查询。

阶段价值：

这一阶段把对话能力从“创建 / 修改事项”扩展到“围绕当前会话事项做只读问答”。它保持了执行安全边界：查询不进入 ToolCatalog、不创建执行计划、不需要确认，也不会写入业务事实。结构化列表只服务展示，不代表执行动作。

## 阶段 67：待确认卡恢复闭环

问题背景：

- 阶段 62 已经能恢复 transcript，但历史里的 `confirmation_required` 只能恢复成摘要消息。
- 后端出于安全考虑只保存 `confirmToken` hash，历史 turn 和 Postgres plan 读取都会返回 `redacted`，不能直接恢复可执行确认按钮。
- 第一版 App 如果用户刚生成确认卡后刷新 H5、重开 iOS 或换一个前端入口，应该能恢复“继续确认 / 取消”的操作能力，同时不能把明文 token 写入历史。

完成内容：

- 后端新增 `GET /agent/conversations/{conversationId}/pending-confirmations`，只返回仍 `awaiting_confirmation` 且 confirmation 为 `pending` 的计划。
- 每次查询 pending confirmations 时，后端会为每个 pending confirmation 签发新的恢复用 `confirmToken`；这个 token 可直接调用现有确认接口。
- Postgres 新增 `confirmation_token_sessions`，只保存恢复 token hash、状态和过期时间，不保存明文 token；原 `confirmations.confirm_token_hash` 仍兼容首次实时确认和重复确认幂等。
- in-memory execution store 也支持多 token 校验，测试模式和 Postgres 模式行为一致。
- SDK/shared-types 新增 `AgentPendingConfirmations` 和 `getAgentPendingConfirmations()`。
- H5 刷新后端快照时会读取 pending confirmations，把服务端返回的 pending plan 合并为可点击确认卡；历史 turn 仍用于恢复 transcript。
- `conversationTurnsToConversationElements()` 新增恢复选项，可在调用方提供 `confirmationTokensByPlanId` 时把仍 `awaiting_confirmation` 且 `pending` 的历史确认响应恢复为确认卡。
- H5 在实时收到 `confirmation_required` 时，仍会把 `plan.id -> confirmToken` 按当前 `conversationId` 缓存在本机 `localStorage`，作为同机刷新时的兜底。
- 用户点击确认或取消后，H5 会立即清理该 `planId` 的本机 token 缓存，避免已处理计划在后续刷新时重新出现可点击卡。
- 后端 token 安全边界保持不变：`conversation_turns` 不保存明文 token，Postgres `GET /execution-plans/{id}` 仍返回 `redacted`。
- OpenAPI 和 Postman 新增“查看待确认计划”，接口会自动保存恢复 token 到 `confirmToken` 变量。

验证结果：

- 红灯验证：新增后端端到端测试后，`GET /agent/conversations/{conversationId}/pending-confirmations` 返回 `404`。
- 绿灯验证：in-memory 端到端测试可查询 pending plan、使用恢复 token 确认执行，并在确认后不再返回 pending；Postgres 集成测试验证恢复 token hash 持久化后可确认执行。
- 额外验证：H5/SDK/shared-types typecheck、OpenAPI 契约校验和 Postman JSON 解析通过。

阶段价值：

这一阶段让“重开 App 后还能继续处理未确认计划”从同机前端缓存推进到服务端可恢复能力。它仍然不把明文确认令牌写入历史或数据库，只通过短期 token session 支持恢复确认卡，继续保持“业务事实必须经过确认”的执行边界。

## 阶段 68：附件票据可读文本金额提取

问题背景：

- 附件 intake 已能保存原生选择器传来的元数据和可读 `text`。
- 附件票据处理此前无论 `text` 是否已经包含金额，都会追问“需要补充金额”。
- 第一版 App 需要利用 Native 或后续 OCR 已经提供的可读文本，减少用户重复输入。

完成内容：

- `AttachmentSummaryProvider` 将附件 `text` 经过换行 / 分号清理后写入 `attachment_summary`，供规划器读取。
- RuleBasedPlanningEngine 在附件票据处理路径中优先读取最近附件的 `text`。
- 如果附件文本里包含金额，例如 `88.5 元`，则直接生成 `expense.create_reimbursement_draft` 确认计划。
- 如果附件文本里包含 `YYYY-MM-DD` 日期，则写入 `occurred_on`；金额、币种、标题、附件 ID 和附件名称一起进入 action payload。
- 如果附件文本有金额但没有日期，则用客户端当前日期兜底为 `occurred_on`，避免费用草稿 payload 在确认执行时无效。
- 无金额的附件文本仍保持原有金额追问流程，不降低补字段体验。
- 当前能力只消费已存在的可读文本，不上传图片二进制，也不在后端执行 OCR。

验证结果：

- 红灯验证：附件 `text` 包含“出租车发票 合计 88.5 元 日期 2026-05-20”时，处理票据仍返回金额追问。
- 绿灯验证：补齐文本摘要和金额提取后，同一输入直接返回费用草稿确认卡；原“无金额附件 -> 追问 -> 补金额”的流程仍通过；有金额但无日期的附件文本会使用客户端当前日期。
- 全量验证：后端测试 `151 passed`；ruff、mypy、H5/SDK/shared-types typecheck、OpenAPI 契约、工厂校验、原生壳校验、migration 校验、Postman JSON 解析和 diff 空白检查均通过。

阶段价值：

这一阶段把附件票据链路从“附件只是上下文线索”推进到“附件可读文本可以直接参与规划”。它仍保持安全边界：提取结果只生成确认计划，费用事实必须经用户确认后写入；OCR、文件上传和票据结构化解析可以在后续沿着同一 `attachment_summary` 边界继续扩展。

## 阶段 69：LLM/DeepSeek 对话路由 prompt 合约

问题背景：

- DeepSeek 等 OpenAI-compatible provider 已接入，但真实模型输出质量会受到 prompt 明确程度影响。
- 对话路由已经支持 `chat`、`clarification`、`plan_candidate` 和 `mixed`，但 prompt 之前主要是规则描述，缺少可回归的 few-shot 合约。
- 第一版 App 需要同时支持闲聊、追问、只读查询和确认执行，不能让 LLM 把查询误生成写入动作，也不能让未知 action 越过工具目录和确认边界。

完成内容：

- 新增 `test_llm_prompt_contract.py`，把 prompt 中必须存在的四类 few-shot 固化为测试：闲聊 `chat`、缺时间日程 `clarification`、已有事项只读查询 `chat`、自然回复 + 候选动作 `mixed`。
- system prompt 明确写入安全边界：只能使用 `tool_catalog` 中出现的 `action_type`；不能声称已经创建、修改、同步或提醒；所有写入类动作都只是候选计划，必须等待用户确认后才执行。
- LLM 解析层新增安全回归：即使 `response_type=chat` 携带 actions，也只按普通消息处理，不生成 `PlanCandidate`。
- Orchestrator 层新增回归：LLM chat 不创建 execution plan 或 ledger；LLM clarification 会保存 open pending item；LLM 返回未知 action 会被 Policy 拦截为安全追问，不生成确认卡。
- DeepSeek provider 新增异常回归：空 choices、空 content 会清晰报错，便于 `llm_first` fallback 或日志定位。

验证结果：

- 红灯验证：prompt 合约最初失败，原因是 system prompt 缺少固定 few-shot 和明确的工具安全边界声明。
- 绿灯验证：补齐 prompt 后，目标用例 `21 passed`，覆盖 prompt 合约、LLM 解析、DeepSeek provider 和 Orchestrator 安全边界。
- 全量验证：后端测试 `160 passed`；ruff、mypy、H5/SDK/shared-types typecheck、OpenAPI 契约、工厂校验、原生壳校验、migration 校验、Postman JSON 解析和 diff 空白检查均通过。
- 当前验证不调用真实 DeepSeek API，只保护多 provider 共用的 prompt 合约和后端执行安全边界。

阶段价值：

这一阶段把“调 prompt”从手感优化推进到可回归资产。后续无论换 DeepSeek 模型、Claude adapter 还是 OpenAI 新模型，都可以先跑这组合约，保证模型输出仍然沿着闲聊、追问、只读查询和确认执行四条安全路径进入系统。

## 阶段 70：LLM 只读查询结构化组件输出

问题背景：

- 规则路径已经能在只读查询中返回 `summary-list`，H5 会把它渲染成对话内列表组件。
- LLM 路径此前只解析 `assistant_message`，即使模型返回结构化列表也会被后端丢弃。
- 当 DeepSeek/OpenAI 接管“明天我有什么安排？”这类查询时，如果只返回纯文本，会削弱第一版 App 的组件化对话体验。

完成内容：

- LLM system prompt 的输出格式新增 `structured_elements`，并在只读查询示例中给出 `summary-list` 格式。
- `LlmPlanningEngine` 在 `response_type=chat` 时解析 `structured_elements`，写入 `PlanningResult.structured_elements`。
- `ExecutionPlanner` 已有的 assistant message 返回路径会把 `structured_elements` 映射为 `/agent/turns` 响应里的 `structuredElements`，H5 可继续复用现有组件渲染逻辑。
- 新增回归保证 LLM structured chat 不创建 execution plan、不写 ledger、不进入确认流程。

验证结果：

- 红灯验证：LLM chat payload 中的 `structured_elements` 最初被丢弃，prompt 合约也没有该字段示例。
- 绿灯验证：目标用例通过，覆盖 LLM 解析、prompt 合约和 Orchestrator 返回路径。

阶段价值：

这一阶段让 LLM-first 查询路径和规则查询路径在前端展示能力上对齐。后续真实 DeepSeek 或 OpenAI 在回答只读问题时，可以返回文本加结构化列表，而不是让用户只能看一段自然语言。

## 阶段 71：Policy 工具 schema 必填字段校验

问题背景：

- ToolCatalog 已经声明了每个 action 的 `input_schema.required`。
- PolicyEngine 此前只检查未知 action 和 LLM 自己填的 `missing_fields`，没有再次校验 payload 是否真的满足工具必填字段。
- 真实 LLM 可能返回 `calendar.create_event`，但 payload 只包含 `title/timezone`，漏掉 `start_at/end_at`；这种情况下如果生成确认卡，用户确认后才失败，体验和审计都不好。

完成内容：

- PolicyEngine 会先解析 ToolCatalog，拒绝未知 action。
- 对已知 action，PolicyEngine 会读取 `input_schema.required` 并检查 payload 中缺失或空字符串字段。
- schema 缺口会和 LLM 显式 `missing_fields` 合并去重，再统一返回 `clarification_request`。
- Orchestrator 回归覆盖：LLM 返回缺 `start_at/end_at` 的 `calendar.create_event` 时，后端保存 open pending clarification，不创建 execution plan，不写 ledger。
- 为保持正常费用路径顺畅，规则费用解析补齐“今天”的 `occurred_on`；pending 费用补金额时如果之前没有日期，会使用补金额当日作为 `occurred_on`。

验证结果：

- 红灯验证：缺少 `start_at/end_at` 的 `calendar.create_event` 最初仍会进入确认流程。
- 绿灯验证：Policy 单测与 Orchestrator 目标测试通过，缺字段 action 会被转成追问；全量回归发现并修复“今天费用”和“附件票据补金额”两条日期兜底路径。

阶段价值：

这一阶段把执行安全边界从“相信模型报告自己缺什么”推进到“以后端工具目录为准”。后续模型即使输出不完整 action，用户也会先看到补字段追问，而不是拿到一个看似可确认、实际不可执行的计划。

## 阶段 72：Policy 工具 schema 字段类型校验

问题背景：

- ToolCatalog 已经开始成为 LLM action 的后端安全目录，但上一阶段只使用了 `required`。
- 真实模型可能把费用金额输出成字符串 `"58"`，或把管理工具的 `patch` 输出成自然语言字符串。
- 如果这些 payload 进入确认卡，用户看到的是一个可确认计划，但确认后会在执行或领域层失败。

完成内容：

- ToolCatalog 的 `input_schema` 增加 `properties` 类型声明，先覆盖轻量 JSON schema 子集。
- PolicyEngine 在生成确认计划前读取 `properties.{field}.type`，校验顶层 payload 字段类型。
- 当前支持 `string`、`number`、`object`、`array`、`boolean`；其中 `number` 接受 `int` / `float`，但明确拒绝 Python `bool`。
- 费用创建的 `amount` 必须是 JSON number，不能是字符串或布尔值。
- 日程 / 费用 / 提醒更新工具的 `patch` 必须是 JSON object。
- LLM system prompt 明确提示 `amount` 必须是 JSON number、`patch` 必须是 JSON object，减少 DeepSeek/OpenAI 输出坏 payload 的概率。
- 类型错误会被转换成 `clarification_request`，不会创建 execution plan，不会写 ledger。
- 校验不启用 `additionalProperties: false`，保留附件元数据和目标解析来源元数据的扩展空间。

验证结果：

- 红灯验证：`amount: "58"` 最初仍会进入确认流程；ToolCatalog 没有 `properties`；prompt 中也没有 JSON 类型约束。
- 绿灯验证：Policy 单测覆盖字符串金额、布尔金额、非 object patch；ToolCatalog 单测覆盖 amount 和 patch 类型声明；Orchestrator 目标测试验证坏 payload 不创建 pending plan 和 ledger。

阶段价值：

这一阶段把 LLM 写入动作的前置门禁从“必填字段完整”推进到“字段形状可信”。它不替代领域 service 的日期、状态流转和业务规则校验，而是在确认卡之前挡住明显不安全的模型输出，让用户看到的是可执行概率更高的候选计划。

## 阶段 73：LLM 工具目录 schema 注入

问题背景：

- ToolCatalog 已有 `required` 和 `properties`，Policy 也已经能按它们做后端兜底。
- 但 LLM prompt 中的 `tool_catalog` 此前只包含 action type 列表，模型并不能直接看到每个工具需要哪些字段、字段类型是什么。
- 这会增加 DeepSeek/OpenAI 生成坏 payload 的概率，例如把费用 `amount` 写成字符串，或把更新 `patch` 写成自然语言。

完成内容：

- `BuiltInToolCatalogProvider` 改为为每个工具输出一行 JSON 合约。
- 合约包含 `action_type`、`domain`、`description`、`required`、`properties`、`confirmation_required` 和 `risk_level`。
- LLM system prompt 明确说明 `tool_catalog` 每项是 JSON 工具合约，生成 payload 前必须读取其中的 `required` 和 `properties`。
- `render_planning_prompt()` 会把这些 JSON 合约放入 prompt，真实 LLM provider 可以看到字段要求。
- 为避免调试语义漂移，`DecisionTrace.tools_considered` 会从 JSON 合约中归一回 action type 列表，debug API 仍保持易读。

验证结果：

- 红灯验证：工具目录 provider 最初只返回 action type，prompt 中没有真实 payload contract。
- 绿灯验证：provider 输出包含费用创建 required、`amount` number、提醒更新 `patch` object；prompt 合约能看到这些字段。
- 补充验证：planner trace 在 tool catalog 变成 JSON 合约后，`tools_considered` 仍记录 `reminder.create_reminder` 这类 action type。

阶段价值：

这一阶段让“工具目录是唯一写入合约”不只存在于后端 Policy，也进入 LLM 规划上下文。模型更容易生成符合执行层的候选计划；即使模型仍然犯错，Policy 和领域 service 继续作为兜底边界。

## 阶段 74：ContextRedactor 工具目录保留边界

问题背景：

- LLM 工具目录已经从 action type 列表升级为 JSON 合约。
- `ContextRedactor` 默认按条目数裁剪各个上下文段，当前默认上限是 12。
- 如果后续新增工具数量超过上限，工具目录可能被裁掉前面的工具，导致 LLM 只看到部分 action schema。

完成内容：

- `ContextRedactor` 继续裁剪会话、pending、领域摘要、附件摘要、用户偏好和历史摘要。
- `tool_catalog` 作为执行工具合约完整保留，不再走普通上下文裁剪。
- redaction 记录不会再出现 `tool_catalog:trimmed_to_*`。
- 新增回归测试：当 `max_items_per_section=1` 时，普通会话上下文仍裁剪为最后 1 条，但 3 条工具合约全部保留。

验证结果：

- 红灯验证：3 条工具合约最初会被裁成只剩最后 1 条。
- 绿灯验证：补齐后，`tool_catalog` 完整保留，普通上下文裁剪行为不变。

阶段价值：

这一阶段防止“工具 schema 注入”在工具数量增长后失效。工具目录是 LLM 规划写入动作的能力边界，不应该像普通上下文记忆一样被截断；真正需要控制 prompt 体积时，应该优化工具 schema 摘要，而不是静默丢失部分工具。

## 阶段 75：update patch 内层字段类型校验

问题背景：

- Policy 已经能校验顶层 payload 类型，例如 `patch` 必须是 object。
- 但 update 工具的真实业务字段都在 `patch` 内部，例如费用 `amount`、提醒 `dueAt`、日程 `startAt`。
- 如果 LLM 返回 `patch.amount: "88"` 这种错误类型，用户会先看到确认卡，确认后才被领域 service 拒绝。

完成内容：

- ToolCatalog 的三类 update 工具在 `patch.properties` 中声明可编辑字段类型。
- 费用更新 patch 支持 `title`、`amount`、`currency`、`occurredOn`，其中 `amount` 必须是 number。
- 提醒更新 patch 支持 `title`、`dueAt`，均为 string。
- 日程更新 patch 支持 `title`、`startAt`、`endAt`、`timezone`，均为 string。
- PolicyEngine 对 object 类型字段递归执行轻量 JSON schema 类型校验。
- 类型错误以路径形式返回，例如 `patch.amount`。
- Orchestrator 回归覆盖：坏的 LLM update patch 返回追问，不创建 execution plan，不写 ledger。

验证结果：

- 红灯验证：`expense.update_reimbursement` 的 `patch.amount` 是字符串时，最初仍会进入确认流程。
- 绿灯验证：补齐后，Policy 返回 `需要修正字段类型：patch.amount。`；ToolCatalog provider 输出的 JSON 合约也包含 patch 内层字段。

阶段价值：

这一阶段把“可确认计划”的质量再往前推了一层。更新类动作通常更容易被模型输出成自然语言或错类型字段，把 patch 内部字段纳入 ToolCatalog / Policy 后，可以在确认卡之前拦住更多不可执行候选计划。

## 阶段 76：非执行路径 trace 与 pending 补全增强

问题背景：

- Debug 接口此前依赖 event 里的 `traceId` 反查 `DecisionTrace`。
- 但 `chat`、纯 `clarification` 和无候选动作路径只写 event，不写 trace；用户查看 H5 设置页或 Postman debug 时，只能看到发生过追问/闲聊，看不到 planner mode、工具目录、缺失字段和 fallback 信息。
- PendingClarification 已持久化，但补全器只覆盖日程的英文/标准日期 hint 和费用金额；真实 LLM 更可能返回中文 `date_hint="明天"`，提醒缺时间的追问也不能直接补全成确认卡。

完成内容：

- `ExecutionPlanner` 在 `assistant_message`、纯 `clarification` 和无候选动作路径都会保存非执行类 `DecisionTrace`。
- 非执行 trace 的 `tools_selected` 为空，`confirmation_reason` 为空，但保留 `planner_mode`、`fallback_reason`、`reasoning_summary`、`context_sections_used`、`tools_considered` 和 `missing_information`。
- Pending 日程补全支持中文/英文日期 hint：`今天` / `today`、`明天` / `tomorrow`、`后天` / `day_after_tomorrow`，也继续支持 ISO 日期。
- 新增 `reminder.create_reminder` pending 补全：用户先说“明天提醒我喝水”，LLM/规则追问时间后，用户补“十点”会生成提醒确认卡，而不是再次进入追问。

验证结果：

- 红灯验证：`chat` 和 `clarification` 路径最初 debug 中 `decisionTraces` 为空。
- 绿灯验证：补齐后，闲聊 debug 能看到非执行 trace；缺时间日程追问 debug 能看到 `missingInformation=["start_at"]`。
- 红灯验证：中文 `date_hint="明天"` 最初会把“十点”落到当天。
- 绿灯验证：补齐后，日程补全落到明天 10:00-11:00；提醒 pending 补“十点”生成 `reminder.create_reminder` 确认卡。

阶段价值：

这一阶段把“没有执行计划”的路径也纳入可观测架构，方便排查 DeepSeek/OpenAI 为什么闲聊、为什么追问、为什么没有生成候选动作。同时把 pending clarification 从只服务日程/费用的窄规则，推进到更贴近真实多轮对话的补全能力。

## 阶段 77：管理目标确认前 guard

问题背景：

- 自然语言管理已有事项 v1 已经能生成取消、完成、提交和修改类候选 action。
- 这些 action 依赖模型或规则给出的 `target_id` 和 `expected_status`。
- 如果 LLM 引用了其他会话的目标，或目标状态已经从 `scheduled/draft` 变成 `done/submitted/canceled`，旧逻辑仍会生成确认卡，直到执行阶段才暴露问题。

完成内容：

- 新增 `ManagementTargetValidator`，归属 `agent_runtime.policy` 边界。
- 在确认卡生成前读取当前 `ContextPack` 的 `calendar_summary`、`expense_summary`、`reminder_summary`。
- 管理动作 payload 中的 `target_id` 必须能在对应领域摘要中找到。
- `expected_status` 必须与摘要中的真实 `status` 一致。
- 跨会话或不存在目标会返回“我找不到当前会话中可操作的目标事项。”
- 状态过期目标会返回“目标事项状态已变化，请重新选择。”
- 两类拦截都不创建 confirmation、execution plan 或 ledger。
- ToolCatalog 回归固定 8 个管理工具都必须保留 `target_id` / `expected_status` 必填契约。

验证结果：

- 红灯验证：LLM 返回不在当前会话摘要里的 `target_id` 时，最初仍会生成确认卡。
- 红灯验证：LLM 返回 `expected_status=scheduled`，但当前摘要状态已经是 `done` 时，最初仍会生成确认卡。
- 绿灯验证：补齐后，跨会话目标和状态过期目标都会进入安全追问，不生成待确认计划。
- 单元验证：`ManagementTargetValidator` 允许当前会话内且状态匹配的目标继续进入确认流程。

阶段价值：

这一阶段把“已有事项管理”的安全边界从执行期前移到确认卡之前。用户不会再被要求确认一个不属于当前会话或状态已经过期的目标，LLM 规划错误也更容易通过 debug trace 和 policy notes 定位。

## 阶段 78：SummaryMemory 执行事实生命周期

问题背景：

- AI Planning Runtime v1 已经预留 `SummaryMemory` 和 Postgres 表，但确认执行成功后的业务事实还没有统一写入摘要记忆。
- in-memory runtime 的 ContextAssembler 仍使用空 summary memory provider，测试模式下下一轮 `ContextPack.relevant_history` 看不到上一轮已确认事项。
- 后续如果把偏好、长期记忆和执行事实都放入同一张 SummaryMemory 表，需要先明确哪类记忆能进入“已确认业务事实”上下文。

完成内容：

- `ExecutionCoordinator` 在 action 执行成功并写入 ledger 后，写入 `memory_type=domain_fact` 的 `SummaryMemory`。
- memory payload 保留 `domain`、`actionType`、`actionId`、`planId`、`factId`、`factTitle`、`factStatus` 和执行结果，便于后续排查、去重和事实追溯。
- 新增 in-memory `SummaryMemoryRepository`，并把它接入 `create_runtime(settings=None)`。
- 新增 `SummaryMemoryProvider`，将当前会话的 `domain_fact` 摘要注入下一轮 `ContextPack.relevant_history`。
- Postgres `PostgresSummaryMemoryProvider` 同步过滤 `memory_type='domain_fact'`，避免未来 preference 等记忆类型混入执行事实上下文。
- `test_summary_memory.py` 将 `psycopg` 跳过范围下沉到 Postgres 专属测试，保证没有 Postgres 依赖的环境仍会跑 in-memory 生命周期测试。
- SummaryMemory 写入失败时只记录 warning 日志，保留已完成的领域事实、ledger 和确认结果，不把派生记忆层故障升级成业务执行失败。

验证结果：

- 红灯验证：in-memory runtime 确认提醒后，下一轮上下文没有任何 relevant history。
- 绿灯验证：确认“明天上午九点提醒我带电脑”后，会写入 `创建提醒：带电脑；状态 scheduled` 的 `domain_fact` 记忆，并在下一轮上下文中可见。
- 回归验证：SummaryMemory provider 不返回其他会话记忆，也不返回 `preference` 类型记忆。
- 补充红灯验证：执行事实 payload 缺少顶层 `factId`、`factTitle`、`factStatus`，不利于后续去重和排查；补齐后，提醒执行结果会把事实 ID、标题和状态提取到 payload 顶层。
- Postgres runtime 验证：通过 `create_runtime(settings)` 完整走提交、确认、写入 `summary_memories` 和下一轮 `ContextPack.relevant_history` 注入，证明生产分支不是只测 repository round trip。
- 失败隔离验证：当 `summary_memory_repository.save()` 抛错时，`confirm_plan()` 仍返回 `execution_result`，plan/action 持久化为 `succeeded`，提醒事实真实写入，ledger 仍记录 `action_executed/succeeded`，日志包含 `conversation_id`、`plan_id`、`action_id` 和 `action_type`。

阶段价值：

这一阶段让“确认执行后的事实”正式成为 Agent 下一轮推理上下文的一部分。它不同于领域摘要：领域摘要服务于当前事实读模型，SummaryMemory 则服务于对话连续性和长期上下文演进；二者都按会话隔离，并且都不能绕过确认流程写入业务事实。SummaryMemory 是业务事实的派生记忆，不是事实来源本身，因此它可以失败降级，但不能反向改变确认执行结果。

## 阶段 79：iOS 原生小文件 base64 Bridge 契约

问题背景：

- 后端已经新增 `POST /attachments/upload`，可以接收 base64 编码的小文件内容，并限制解码后 5MB。
- H5 将按 `native.inputSubmitted` payload 中的可选 `base64Content` 调用 uploadAttachment。
- iOS 之前只回传附件元数据和可读文本，照片 / 文件内容无法进入后端 upload 链路。

完成内容：

- `HybridShellView` 新增 `nativeAttachmentBase64LimitBytes = 5 * 1024 * 1024`。
- `submitNativeAttachment()` 保持现有 `message/type/inputKind/text/attachment*` 字段不变，新增可选 `contentData` 入参。
- 当 `contentData.count <= 5MB` 时，payload 额外写入 `base64Content`。
- `PhotosPicker` 选择图片后把已加载的 `Data` 传给附件提交函数。
- `fileImporter` 在安全作用域内读取文件 `Data`，已知文件大小超过 5MB 时跳过读取；大小未知时读取后仍由 5MB guard 决定是否传 base64。
- 超过 5MB、读取失败或没有可用数据时，仍按现有元数据和可读文本提交，不传 `base64Content`。
- Hybrid Bridge 契约和 iOS README 已说明 `base64Content` 是小文件可选字段。

验证结果：

- 红灯验证：静态检查先证明 iOS 附件 payload 没有 `base64Content`、没有 5MB 限制常量、照片 `Data` 未传入提交函数、文件选择器未读取 `Data`。
- 绿灯验证：补齐后静态检查通过，`pnpm validate:native-shells` 通过。
- iOS 构建验证：首次 `xcodebuild` 被本机签名团队配置拦截；使用 `CODE_SIGNING_ALLOWED=NO` 后，`xcodebuild -project apps/ios/AIEngineeringCode.xcodeproj -scheme AIEngineeringCode -destination 'generic/platform=iOS' -quiet build` 通过，仅保留既有方向 / Preview warning。

阶段价值：

这一阶段把原生附件选择器和后端小文件上传能力之间的 Bridge 缺口补上，同时没有把 iOS 变成业务接口调用方。Native 只负责读取系统选择器结果并按大小安全地传递可选内容；H5 和后端继续决定资源登记、文本抽取和后续 Agent 追问 / 确认流程。

## 阶段 80：H5 附件上传路径选择闭环

问题背景：

- iOS 已经可以在小文件场景下把 `base64Content` 放进 `native.inputSubmitted`。
- 后端已经提供 `/attachments/upload`，但 H5 仍只调用 `/attachments/intake` 时，小文件内容不会真正进入后端文本抽取和 `attachment_summary` 链路。
- 第一版 App 需要用户从原生附件入口选择文本票据或材料后，后续费用 / 日程处理能直接利用可读内容。

完成内容：

- H5 `NativeAttachmentSubmission` 增加可选 `base64Content`。
- `getSubmittedAttachmentFromNativeMessage()` 会解析附件 payload 中的 `base64Content`。
- 新增 `getAttachmentPersistenceRequest()`，把附件持久化选择收口为一个明确边界：有 `base64Content` 时生成 upload 请求，没有内容时生成 intake 请求。
- `handleSubmittedAttachment()` 根据该选择器调用 `apiClient.uploadAttachment()` 或 `apiClient.intakeAttachment()`。
- Bridge 契约样例补充 `base64Content` 字段，H5 契约测试固定两条路径的类型：`AttachmentUploadRequest` 和 `AttachmentIntakeRequest`。

验证结果：

- 红灯验证：H5 typecheck 先证明缺少 `getAttachmentPersistenceRequest()` 且没有 upload/intake 选择器。
- 绿灯验证：补齐后 `pnpm --filter @ai-code/h5 typecheck` 通过。
- 回归验证：`pnpm validate:contracts`、`pnpm validate:native-shells`、`pnpm --filter @ai-code/sdk typecheck` 和 `pnpm --filter @ai-code/shared-types typecheck` 均通过。

阶段价值：

这一阶段把“iOS 小文件内容回传”和“后端附件内容上传”真正接成前端运行时闭环。Native 仍不直接调用后端；H5 也不解析票据业务含义，只负责把资源写入后端正确入口，后续费用、日程或提醒仍由 Agent 追问、确认卡和领域 service 决定。

## 阶段 81：iOS 照片附件原生 OCR 薄闭环

问题背景：

- 小文件图片已经可以通过 Bridge 上传到后端，但后端当前不会对图片做 OCR。
- 第一版 App 的照片票据入口如果只上传图片 bytes，费用金额提取仍缺少可读文本。
- iOS 系统能力已经能在本地做文字识别，适合作为当前阶段的薄闭环，不需要先引入后端 OCR 服务。

完成内容：

- `HybridShellView` 引入 `Vision`。
- 新增 `recognizeText(inImageData:)`，使用 `VNRecognizeTextRequest` 识别中文和英文文本。
- `PhotosPicker` 选中图片并加载 `Data` 后，会先尝试 OCR，再调用 `submitNativeAttachment()`。
- `submitNativeAttachment()` 新增可选 `recognizedText`，有识别结果时追加到附件 `text` 字段，格式为 `识别文本：...`。
- OCR 失败、图片没有文字或读取失败时，仍按原附件元数据 / 小文件 base64 流程提交，不阻断用户操作。
- Native 不解析金额、日期或日程语义，后续仍由 H5 写入附件资源，后端 Agent 基于可读文本生成追问或确认卡。

验证结果：

- 红灯验证：`pnpm validate:native-shells` 先证明 iOS 壳层缺少 `import Vision`、`VNRecognizeTextRequest` 和 `recognizedText`。
- 绿灯验证：补齐后 `pnpm validate:native-shells` 通过。
- 构建验证：`xcodebuild -project apps/ios/AIEngineeringCode.xcodeproj -scheme AIEngineeringCode -destination 'generic/platform=iOS' CODE_SIGNING_ALLOWED=NO -quiet build` 通过。

阶段价值：

这一阶段让“拍票据 -> 可读文本 -> 附件上下文 -> 费用草稿确认卡”更接近真实可用。OCR 仍是 best-effort 的输入增强，不是业务事实来源；识别结果必须经过后端规划、Policy 和用户确认后，才可能生成费用、日程或提醒。

## 阶段 82：附件上传文本合并与 H5 端到端验证

问题背景：

- H5 上传附件时会把 Native 展示文本放进 `text` 字段，例如“已选择附件...”。后端原逻辑只在 `text` 为空时才从 `text/plain` 内容中抽取文本。
- 这会导致 `/attachments/upload` 虽然记录了 `contentSha256/contentStatus`，但真实票据内容没有进入 `attachment_summary`，金额提取链路退化。

完成内容：

- `AttachmentIntakeService.upload_attachment()` 改为同时考虑调用方提供的 `text` 和附件内容抽取文本。
- 当二者都存在且内容文本不在展示文本中时，后端保存为“展示文本 + `识别文本：...`”。
- 如果调用方未提供文本，仍保持原行为：文本附件内容直接成为 `text`。
- 如果内容文本已经包含在调用方文本里，不重复追加。
- 新增后端测试覆盖 Native 展示文本与文本附件内容合并。

验证结果：

- 红灯验证：新增测试先证明带 `text` 的 upload 只保存展示文本，不含金额。
- 绿灯验证：`PATH=.venv/bin:$PATH pytest python/backend/tests/test_attachments.py -q` 通过。
- 浏览器端到端验证：用 Playwright headless 打开本地 H5，模拟 `native.inputSubmitted` 附件消息，确认 H5 调用 `/attachments/upload` 后，`GET /attachments` 能读回 `contentStatus=content_received`、`contentSha256` 和包含 `识别文本：发票 金额 88.5 元` 的 `text`。

阶段价值：

这一阶段把“Native/H5 展示文本”和“附件真实可读内容”从互斥关系改成可合并关系。用户选择文本票据或 OCR 后的照片票据时，后端既保留选择上下文，也能把金额、日期等可读文本交给 Agent 继续规划。

## 阶段 83：iOS 原生会话持久 ID

问题背景：

- H5 使用 URL 或 `localStorage` 的 `conversationId` 恢复会话。
- iOS `WKWebView` 使用 non-persistent data store，App 重启后 `localStorage` 不可靠，可能导致对话历史、Timeline 和待确认卡换到新会话视角。

完成内容：

- 新增 `NativeConversationIdentity`。
- iOS 使用 `UserDefaults` 保存稳定的 `conversation_ios_*`。
- `HybridShellConfiguration.development` 创建 H5 URL 时，如果 URL 没有 `conversationId`，自动追加 Native 持久会话 ID。
- 如果开发者显式在 `H5DevServerURL` 中配置了 `conversationId`，Native 不覆盖。

验证结果：

- 红灯验证：`pnpm validate:native-shells` 先证明缺少 Native 会话持久标识、UserDefaults key 和 URL query 注入。
- 绿灯验证：补齐后 `pnpm validate:native-shells` 通过。
- 构建验证：`xcodebuild -project apps/ios/AIEngineeringCode.xcodeproj -scheme AIEngineeringCode -destination 'generic/platform=iOS' CODE_SIGNING_ALLOWED=NO -quiet build` 通过。

阶段价值：

这一阶段让原生 App 的会话身份不再依赖 WebView 的本地存储生命周期。后端会话范围读模型、历史恢复和待确认卡恢复都能在 App 重启后继续指向同一个会话。

## 阶段 84：Native 系统同步错误语义降级

问题背景：

- 日程 / 提醒确认成功后，后端业务事实已经写入数据库。
- H5 随后同步系统日历或本地通知；如果用户拒绝 iOS 权限，Native 会回传 `native.error`。
- 原 H5 对所有 `native.error` 都标记为 failed，容易让用户误以为日程或提醒创建失败。

完成内容：

- H5 新增 `getNativeErrorExecutionStatus()`。
- `native.calendar.events.sync` 和 `native.notifications.reminders.sync` 失败时，状态显示为 completed，文案为“后端事项已保存，系统同步未开启：...”。
- `native.composer.voice`、`native.composer.attachment` 等输入能力错误仍标记为 failed。
- H5 contract 测试固定系统同步错误和语音权限错误的不同状态语义。

验证结果：

- 红灯验证：H5 typecheck 先证明缺少 `getNativeErrorExecutionStatus()`。
- 绿灯验证：补齐后 `pnpm --filter @ai-code/h5 typecheck` 通过。

阶段价值：

这一阶段把“业务事实写入成功”和“系统能力同步失败”分开表达。第一版 App 即使用户暂时拒绝日历或通知权限，也不会把后端已确认事项误报成失败。

## 阶段 85：H5 快照刷新核心 / 可选降级

问题背景：

- H5 每次刷新后端快照时，会同时读取日程、费用、提醒、execution ledger、附件、Agent debug、历史 turn 和待确认卡。
- 原实现用一个 `Promise.all` 读取全部接口，任一辅助接口失败都会导致核心 Timeline 和 Native 同步不刷新。
- 第一版 App 中，debug、附件或 pending confirmations 的局部问题不应该影响已确认事项展示。

完成内容：

- `refreshBackendSnapshots()` 拆分核心读模型和可选快照。
- 日程、费用、提醒和 execution ledger 保持硬失败，避免隐藏业务事实读写问题。
- 附件列表、Agent debug、历史 turn 和待确认卡恢复通过 `withSnapshotFallback()` 降级。
- 可选快照失败时返回空列表 / 空 debug，同时输出 `optional snapshot refresh failed` 开发日志。
- `validate:h5-runtime` 增加静态门禁，防止后续把可选快照重新混回阻塞式刷新。

验证结果：

- 红灯验证：`pnpm validate:h5-runtime` 先证明缺少 `withSnapshotFallback` 和可选快照失败日志。
- 绿灯验证：补齐后 `pnpm --filter @ai-code/h5 typecheck && pnpm validate:h5-runtime` 通过。

阶段价值：

这一阶段提高了第一版 App 的局部故障韧性。只要核心业务事实接口可用，Timeline、日程、费用、提醒和 Native 同步就能继续工作；辅助调试或附件回看失败只降级对应区域。

## 阶段 86：iOS Files 图片 / PDF 可读内容提取

问题背景：

- 照片入口已经通过 Vision OCR 把图片文字追加到附件 `text`。
- 但用户从 Files 选择图片或 PDF 发票时，原生端只上传元数据 / base64 内容；后端当前不会对 PDF 或图片文件做 OCR。
- 第一版 App 需要常见文件票据也尽量进入“可读文本 -> 费用草稿确认卡”链路。

完成内容：

- `HybridShellView` 引入 `PDFKit`。
- 新增 `recognizeText(inImportedFileData:typeIdentifier:)`，按 UTType 分流 Files 附件：
  - 图片文件复用 Vision `recognizeText(inImageData:)`。
  - PDF 文件用 `PDFDocument(data:)` 抽取每页文本。
  - 其他类型返回 `nil`，不阻断提交。
- `handleImportedFile()` 在读取小文件内容后，异步提取可读文本，并作为 `recognizedText` 传给 `submitNativeAttachment()`。
- 超过 5MB、读取失败或没有可读文本时，仍保留原元数据提交路径。

验证结果：

- 红灯验证：`pnpm validate:native-shells` 先证明缺少 `import PDFKit`、`PDFDocument(data:)` 和 Files 文本识别入口。
- 绿灯验证：补齐后 `pnpm validate:native-shells` 通过。
- iOS 构建验证：`xcodebuild -project apps/ios/AIEngineeringCode.xcodeproj -scheme AIEngineeringCode -destination 'generic/platform=iOS' CODE_SIGNING_ALLOWED=NO -quiet build` 通过。

阶段价值：

这一阶段把附件可读内容能力从照片入口扩展到 Files 入口。用户选择 PDF 发票或图片发票时，系统有机会直接拿到金额、日期等文本，减少后续手动补字段；但 Native 仍不解析业务语义，所有费用、日程或提醒写入仍必须经过后端 Agent 和确认卡。

## 阶段 87：直接 UI 行内动作审计闭环

问题背景：

- Timeline、日程、费用、提醒列表已经支持直接点击完成、取消、提交和编辑。
- 这些 direct action 之前只调用领域接口，虽然会改写业务事实，但不会创建 execution plan / domain action，也不会写入 execution ledger。
- 执行记录页、会话范围 ledger 和 SummaryMemory 因此只能看到 Agent 确认卡执行结果，看不到用户在 UI 上直接点击的后续管理动作。
- 如果只给 direct action 补 `conversationId`，还会有跨会话误改风险：用户知道目标 ID 时，可能把别的会话事项改掉并审计到当前会话。

完成内容：

- 新增 `DirectActionAuditService`，作为 route 与领域 service 之间的应用层审计边界。
- H5/SDK 在日程取消、费用提交 / 取消、提醒完成 / 取消和三类 PATCH 编辑时传入当前 `conversationId`。
- 后端 route 在状态变更前读取目标事实，校验目标 `sourceActionId` 属于当前会话；跨会话目标返回 404，不执行领域状态变更。
- direct action 成功后创建 `direct_plan_*` 和 `direct_action_*` 轻量执行记录，不伪装成 LLM 规划，也不创建 confirmation。
- `execution_ledger` 新增 `direct_action_executed` 事件类型，记录直接 UI 操作成功结果并关联 actionId。
- direct action 同步写入 `memory_type=domain_fact` 的 SummaryMemory，让后续 Agent 对话能看到用户在 UI 中完成、取消、提交或编辑后的事实变化。
- Postgres 新增 `0008_direct_action_ledger_events` 迁移；OpenAPI、shared-types、SDK 和 Postman collection 已同步 `conversationId` 参数与 direct ledger 事件类型。

验证结果：

- 红灯验证：直接点击完成提醒后，`/execution-ledger?conversationId=...` 没有 direct action 记录。
- 绿灯验证：补齐后 direct action 会写入 `direct_action_executed/succeeded`，并带有 `actionId`。
- 覆盖补强：日程取消、费用提交、费用取消、日程编辑、费用编辑、提醒编辑都会生成 direct action plan，并保留对应 action type 和 result payload。
- 红灯验证：用另一个会话的 `conversationId` 调用提醒完成接口时，原实现会把目标提醒改成 done。
- 绿灯验证：补齐会话归属 guard 后，跨会话 direct action 返回 404，目标提醒仍保持 scheduled，另一个会话也不会新增 direct ledger。
- SDK/H5 契约验证：direct action 方法都支持传入 `conversationId`，`ExecutionLedgerItem.eventType` 支持 `direct_action_executed`。
- SummaryMemory 验证：direct action auditor 会写入 `完成提醒：带电脑；状态 done` 的 `domain_fact` 记忆。
- Postgres runtime 验证：`direct_plan_*`、`direct_action_*`、`direct_action_executed` ledger 和 `summary_memories` 均能真实落库。
- 回归验证：后端全量测试 `197 passed`，ruff、mypy、H5/SDK/shared-types typecheck、OpenAPI 契约、migration 验证、factory 验证和 Postman JSON 校验均通过。

阶段价值：

这一阶段让“用户点击按钮直接管理事项”也进入执行审计和记忆链路。第一版 App 的执行记录不再只反映 Agent 确认卡，还能反映 Timeline 或各领域页上的显式用户操作；同时会话归属 guard 避免 direct endpoint 成为绕过当前会话边界的后门。确认卡仍是 AI 规划写入的安全边界，direct action 只表示用户已经在 UI 上显式选择了某个已存在事项的管理命令。

## 阶段 88：H5/SDK 可用性审计修复

问题背景：

- subagent 只读审计发现，H5 非 Native 模式仍会默认展示 demo 确认卡；该卡没有真实 `planId/confirmToken`，点击确认不会执行，容易被误认为真实后端结果。
- SDK 对失败响应只抛 `API request failed: status statusText`，H5 状态栏看不到后端 `detail`，用户测试非法状态流转或字段校验时难以定位。
- H5 发起 `input.keyboard.open`、`input.voice.start`、`input.voice.stop` 后没有消费 `native.ack`，在语音无识别文本等场景下状态栏可能停留在“正在启动 / 提交”。
- OpenAPI 新增端点中有 response `schema` 缩进到 `application/json` 同级，轻量校验脚本没有覆盖这类结构错误。

完成内容：

- H5 默认初始元素改为真实空态；只有 URL 显式携带 `?demo=1` 时才展示 demo fixtures。
- `validate:h5-runtime` 增加默认空态、显式 demo 和 `native.ack` 消费的静态门禁。
- SDK `request()` 在失败时解析 FastAPI `{detail}`、validation detail array 和纯文本响应，并把具体原因拼入错误信息。
- 新增 `validate:sdk-runtime`，覆盖 `400 detail`、`422 detail[]` 和纯文本 `500` 三类失败响应，并串入 `validate:factory`。
- H5 新增 `getNativeAckExecutionStatus()`，对键盘和语音 bridge ack 设置完成态，避免状态栏卡住。
- OpenAPI 修复 `/attachments/intake` 与 `/agent/conversations/{conversationId}/debug` 的 response schema 层级。
- `validate:contracts` 增加 response content media type schema 检查，并把附件列表、附件上传、会话 debug、会话 turns 和待确认卡恢复端点纳入 operationId / SDK 方法一致性检查。

验证结果：

- 红灯验证：`pnpm validate:sdk-runtime` 先证明 SDK 没有透传 `reminder status cannot transition`。
- 绿灯验证：补齐后 `pnpm validate:sdk-runtime` 通过。
- 回归验证：`pnpm validate:h5-runtime`、`pnpm validate:contracts`、`pnpm --filter @ai-code/h5 typecheck`、`pnpm --filter @ai-code/sdk typecheck`、`pnpm --filter @ai-code/shared-types typecheck`、`pnpm validate:factory`、后端 `197 passed`、ruff 和 mypy 均通过。

阶段价值：

这一阶段把第一版 App 的几个“看起来能点但不可信 / 出错但看不懂”的体验问题收掉。默认 H5 不再把 demo 数据伪装成真实后端结果；iOS 键盘和语音入口有明确 ack 收束；后端详细错误能从 FastAPI 透到 SDK/H5；OpenAPI 契约也开始检查 media type 下是否真的有 schema，减少后续接口文档漂移。

## 阶段 89：H5 编辑日期时间输入本地化

问题背景：

- H5 应用内编辑面板已经替代 `window.prompt`，但日程开始 / 结束、提醒时间和费用日期仍是普通文本框。
- 真实用户容易输入“明天上午十点”或无时区 ISO，后端会拒绝或产生不清晰错误。
- 如果直接把控件改成 `datetime-local`，浏览器提交的是 `YYYY-MM-DDTHH:mm`，不带 timezone/offset；后端、Native 系统日历和本地通知都要求带 offset 的 ISO。

完成内容：

- 日程开始 / 结束和提醒时间输入改为 `type=datetime-local`。
- 费用发生日期输入改为 `type=date`。
- 新增 `apps/h5/src/app/ai-time-agent/dateTimeInput.ts`，作为 H5 编辑面板的日期时间转换边界：
  - `dateTimeIsoToLocalInputValue()` 把后端 `2026-05-24T09:30:00+08:00` 显示为 `2026-05-24T09:30`。
  - `dateTimeLocalValueToIso()` 把 `datetime-local` 的无时区值恢复成带 offset ISO。
- 日程编辑用用户填写的 `timezone` 计算 offset；提醒编辑没有独立 timezone 字段，因此优先沿用原 `dueAt` 的 offset。
- 新增 `validate:h5-datetime-runtime`，覆盖 ISO -> local input、Asia/Shanghai local input -> `+08:00` ISO、提醒编辑保留原 offset 三类转换，并串入 `validate:factory`。
- `validate:h5-runtime` 保留静态门禁，要求编辑面板继续使用原生 date/datetime-local 控件和 ISO 转换函数。

验证结果：

- 红灯验证：`pnpm validate:h5-runtime` 先证明编辑面板仍是 plain input，且缺少 `dateTimeLocalValueToIso`。
- 红灯验证：`node scripts/validate-h5-datetime-runtime.mjs` 先证明纯转换模块不存在。
- 绿灯验证：补齐后 `pnpm validate:h5-runtime`、`pnpm validate:h5-datetime-runtime`、`pnpm --filter @ai-code/h5 typecheck` 和 `pnpm validate:factory` 均通过。

阶段价值：

这一阶段把事项编辑从“能提交但容易输错”推进到更接近原生 App 的可用状态。用户编辑日程、提醒和费用时会看到系统日期时间选择控件；H5 仍把业务事实写回后端要求的带 offset ISO，避免 `datetime-local` 静默丢失时区，继而污染系统日历和本地通知同步。

## 阶段 90：产品级 smoke 验证门禁

问题背景：

- 后端、H5、SDK、Postman、Native Bridge 已经有大量单点测试，但第一版 App 的核心价值是多接口组合能像真实用户路径一样连续跑通。
- 单元测试能证明局部逻辑，仍不足以快速回答“现在我能不能从一句话输入一路到读模型、直接操作和 debug 都可用？”。
- 真机或 Postman 手动验证成本高，且容易漏掉 ledger、debug、pending confirmations 这类隐性链路。

完成内容：

- 新增 `scripts/validate_product_smoke.py`。
- 新增根命令 `pnpm validate:product-smoke`，默认设置 `AI_CODE_LOAD_ENV_LOCAL=0 AI_PLANNER_MODE=rule`，不依赖本地 `.env.local`、LLM key 或 Postgres。
- smoke 使用 FastAPI `TestClient` 模拟产品级路径：
  - “明天上午我要去开会”返回追问。
  - “十点”补全为日程确认卡并确认写入。
  - 日程通过直接 PATCH 编辑为“产品评审会”。
  - “把昨天 58 元打车票报销”生成费用草稿确认卡，确认后直接提交费用。
  - “明天上午九点提醒我带电脑”生成提醒确认卡，确认后直接完成提醒。
  - “明天我有什么安排？”返回只读结构化列表，并包含已编辑日程。
  - 当前会话 execution ledger 同时包含 `action_executed` 和 `direct_action_executed`。
  - Agent debug 有 decision traces，pending confirmations 在确认后为空。

验证结果：

- 红灯验证：`pnpm validate:product-smoke` 先失败，提示命令不存在。
- 绿灯验证：补齐脚本和 package 命令后，`pnpm validate:product-smoke` 通过。
- 脚本质量：`PATH=.venv/bin:$PATH ruff check scripts/validate_product_smoke.py` 通过。
- 回归验证：`pnpm validate:factory` 和后端全量测试 `197 passed` 通过。

阶段价值：

这一阶段给第一版 App 增加了一条产品级自动门禁。它不替代细粒度单元测试，但能用一个快速命令验证“用户输入 -> Agent 规划 / 追问 -> 确认执行 -> 领域读模型 -> 直接 UI 动作审计 -> 只读查询 -> debug / pending 状态”这条主路径没有断。后续每次继续打磨真机体验或 LLM prompt 前，都可以先跑这条 smoke，确认核心链路仍站得住。

## 阶段 91：运行中 API 产品级 live smoke

问题背景：

- `pnpm validate:product-smoke` 已经能在 in-memory + rule planner 中验证核心产品链路，但它不验证当前 `pnpm dev:full` / `pnpm dev:api` 进程、Postgres、`.env.local` provider 配置和真实 HTTP 边界。
- 用户在 Postman 或 iOS 中测试前，需要一个比手动逐条接口更快的判断：当前本机后端是否真的按第一版产品路径工作。
- live 验证不能塞进 `validate:factory`，否则没有运行服务的离线开发和 CI 会变脆。

完成内容：

- 复用 `scripts/validate_product_smoke.py`，新增 `--live` 模式。
- 新增根命令 `pnpm validate:product-smoke:live`。
- live 模式默认连接 `AI_CODE_API_BASE_URL`，未设置时使用 `http://127.0.0.1:8000`。
- live 模式不启动服务、不执行 migration、不强制设置 `AI_CODE_LOAD_ENV_LOCAL=0` 或 `AI_PLANNER_MODE=rule`，因此会验证当前已运行 API 的真实配置。
- 产品断言复用离线 smoke 的同一套主路径：探活、追问补全、确认写入、日程编辑、费用提交、提醒完成、只读查询、ledger、debug 和 pending confirmations 清空。
- live 模式使用 `conversation_product_live_smoke_<uuid>` 作为唯一会话 ID，接受测试数据真实写入当前后端连接的存储。

验证结果：

- 红灯验证：`PATH=.venv/bin:$PATH pytest python/backend/tests/test_product_smoke_script.py -q` 先失败，证明 `build_smoke_client()` / `--live` 不存在。
- 绿灯验证：补齐后 `python/backend/tests/test_product_smoke_script.py` 通过。
- HTTP 验证：临时启动 `uvicorn` 到 `127.0.0.1:8012` 后，`AI_CODE_API_BASE_URL=http://127.0.0.1:8012 pnpm validate:product-smoke:live` 通过，并在验证后关闭临时服务。

阶段价值：

这一阶段把“我能不能直接在 iOS / Postman 上测？”前面加了一个更快的后端自检入口。离线 smoke 继续保证稳定、确定的产品主路径；live smoke 则面向已经运行的真实 API，帮助确认 dev server、数据库、provider 配置和 HTTP 契约是否一起站得住。它会写入测试数据，所以适合作为本地验收和调试命令，而不是通用 factory 门禁。

## 阶段 92：产品级 smoke 覆盖附件资源入口

问题背景：

- 第一版 App 的附件入口已经从原生照片 / 文件选择器一路接到 H5，再由后端保存元数据或小文件内容，但产品级 smoke 只覆盖了日程、费用、提醒和调试链路。
- 用户会直接点击纸夹、照片和文件入口；如果 `/attachments/upload`、`/attachments/intake` 或 `/attachments` 断掉，Postman / iOS 手动测试前缺少快速反馈。
- 附件摘要会进入 Agent 上下文，如果把无金额附件写在主对话会话里，再继续跑普通费用句子，Planner 会优先尝试处理最近附件并发起金额追问，污染原有主路径断言。

完成内容：

- `scripts/validate_product_smoke.py` 新增 `validate_attachment_smoke()`。
- smoke 覆盖 `POST /attachments/upload`：上传固定 `text/plain` base64 小文本，断言 `contentStatus=content_received`、`contentSha256` 存在、`text=出租金额 88.5 元`。
- smoke 覆盖 `POST /attachments/intake`：登记固定图片元数据，断言 `status=received`、`kind/name/source/conversationId` 正确。
- smoke 覆盖 `GET /attachments`：按会话读回刚创建的 `receipt.txt` 和 `receipt.jpg`。
- 附件 smoke 使用 `conversationId + "_attachments"` 独立会话，避免附件上下文影响日程 / 费用 / 提醒主 Agent 对话。

验证结果：

- 红灯验证：`python/backend/tests/test_product_smoke_script.py` 先失败，证明 `validate_attachment_smoke()` 不存在。
- 绿灯验证：补齐 helper 后目标测试通过。
- 回归验证：第一次把附件 smoke 放在主路径前会导致 `pnpm validate:product-smoke` 失败，返回“receipt.jpg 报销需要补充金额”；定位后改为独立附件会话，`pnpm validate:product-smoke` 恢复通过。
- 脚本质量：`PATH=.venv/bin:$PATH ruff check scripts/validate_product_smoke.py python/backend/tests/test_product_smoke_script.py` 通过。
- HTTP 验证：临时启动 `uvicorn` 到 `127.0.0.1:8013` 后，`AI_CODE_API_BASE_URL=http://127.0.0.1:8013 pnpm validate:product-smoke:live` 通过，日志确认已覆盖 `/attachments/upload`、`/attachments/intake` 和 `/attachments`。

阶段价值：

这一阶段把附件资源入口纳入产品级门禁，同时保留了 Agent 主路径的稳定性。smoke 现在能在一个命令里验证第一版的核心对话执行、直接 UI 动作审计、只读查询、debug/pending 状态，以及照片 / 文件入口对应的后端资源写入与回看。真实 iOS 选择器、Vision OCR、PDFKit 和大文件路径仍属于真机专项验证，不放进快速 smoke。

## 阶段 93：live smoke 不可达错误提示

问题背景：

- `pnpm validate:product-smoke:live` 面向已启动的本地 API，但如果后端没启动、端口错或局域网地址填错，之前会直接抛出底层 `httpx.ConnectError` 堆栈。
- 这条命令常用于 Postman / iOS 测试前自检，失败信息应该直接告诉开发者下一步做什么。

完成内容：

- `scripts/validate_product_smoke.py` 在 `--live` 模式下捕获 `ConnectError`、`ConnectTimeout`、`NetworkError` 和 `TimeoutException`。
- 失败时输出中文提示：无法连接运行中的后端 API、当前 `base URL`、先启动 `pnpm dev:api` / `pnpm dev:full`，或设置 `AI_CODE_API_BASE_URL=http://<host>:<port>`。
- 非 live 模式仍保留原异常行为，避免隐藏 TestClient / in-memory 验证里的真实代码问题。

验证结果：

- 红灯验证：`test_cli_live_mode_reports_clear_error_when_api_is_unreachable` 先失败，证明 `ConnectError` 直接冒出。
- 绿灯验证：补齐错误边界后，目标测试 `4 passed`。
- 脚本质量：`PATH=.venv/bin:$PATH ruff check scripts/validate_product_smoke.py python/backend/tests/test_product_smoke_script.py` 通过。

阶段价值：

这一阶段不改变业务能力，但把本地验收命令变得更可操作。开发者现在能从一条明确错误里知道是“服务没起来 / 地址错”，而不是从 Python 堆栈里猜问题来源。

## 阶段 94：产品级 smoke 覆盖待确认卡恢复确认

问题背景：

- 后端已经提供 `GET /agent/conversations/{conversationId}/pending-confirmations`，H5 刷新或 iOS 重启后可以重新拉取仍待确认的计划。
- 之前产品级 smoke 只在主路径末尾断言 pending confirmations 为空，没有真实验证“拉取恢复 token 后还能确认执行”。
- 这个链路直接关系到第一版 App 的可靠性：用户看到恢复出来的确认卡时，按钮必须继续能写入领域事实，而不是只有视觉恢复。

完成内容：

- `scripts/validate_product_smoke.py` 新增 `validate_pending_confirmation_recovery_smoke()`。
- smoke 使用 `conversationId + "_pending_recovery"` 独立会话，先提交“明天上午九点提醒我带雨伞”创建待确认提醒计划。
- 随后调用 `GET /agent/conversations/{conversationId}/pending-confirmations`，断言返回当前会话、对应 `plan.id`、`awaiting_confirmation` 状态、`pending` confirmation，以及非 `redacted`、以 `confirm_` 开头且不同于原始 token 的恢复 token。
- 再用恢复 token 调用 `POST /execution-plans/{planId}/confirm`，断言返回 `execution_result`、计划 `succeeded`、confirmation `confirmed`、action `succeeded`。
- 最后再次查询 pending confirmations，断言该独立会话下 `plans == []`。

验证结果：

- 红灯验证：`test_pending_confirmation_recovery_smoke_confirms_with_recovered_token` 先失败，证明 smoke helper 不存在。
- 绿灯验证：补齐 helper 后 `PATH=.venv/bin:$PATH pytest python/backend/tests/test_product_smoke_script.py -q` 通过。
- 回归验证：`pnpm validate:product-smoke` 通过，证明 TestClient / in-memory 产品路径已包含恢复 token 确认。
- HTTP 验证：临时启动 `uvicorn` 到 `127.0.0.1:8014` 后，`AI_CODE_API_BASE_URL=http://127.0.0.1:8014 pnpm validate:product-smoke:live` 通过，日志确认覆盖 `_pending_recovery` 会话的 pending 查询、恢复 token 确认和 pending 清空，随后关闭临时服务。

阶段价值：

这一阶段把“确认卡恢复”从单点接口能力推进到产品级验收路径。后续在 Postman 或 iOS 中遇到刷新、重启、WebView 会话恢复时，可以先用 smoke 判断后端恢复 token、确认执行和 pending 清理是否仍然可靠。

## 阶段 95：产品级 smoke 覆盖会话历史恢复

问题背景：

- H5 启动时已经会调用 `GET /agent/conversations/{conversationId}/turns` 恢复 transcript。
- 之前产品级 smoke 覆盖了待确认卡恢复 token，但没有覆盖 transcript restore 本身。
- 历史 turn 里必须保持安全边界：确认卡历史只能用于展示，不能暴露明文 `confirmToken`，可点击恢复必须走 pending confirmations。

完成内容：

- `scripts/validate_product_smoke.py` 新增 `validate_conversation_history_recovery_smoke()`。
- 主产品 smoke 在完成日程、费用、提醒、只读查询和 pending 清空后，调用 `GET /agent/conversations/{conversationId}/turns?limit=50`。
- 断言历史响应 `conversationId` 正确，用户输入包含“明天上午我要去开会”“十点”“明天我有什么安排？”。
- 断言 assistant 历史结构化响应至少覆盖 `clarification_request`、`confirmation_required` 和 `assistant_message` 三类。
- 递归检查历史 structured response 中出现的所有 `confirmToken`，要求全部为 `redacted`，避免历史接口泄露明文确认 token。

验证结果：

- 红灯验证：`test_conversation_history_recovery_smoke_requires_redacted_tokens` 先失败，证明 smoke helper 不存在。
- 绿灯验证：补齐 helper 后 `PATH=.venv/bin:$PATH pytest python/backend/tests/test_product_smoke_script.py -q` 通过。
- 回归验证：`pnpm validate:product-smoke` 通过，证明 TestClient / in-memory 产品路径已包含 transcript restore 和历史 token redaction。
- HTTP 验证：临时启动 `uvicorn` 到 `127.0.0.1:8015` 后，`AI_CODE_API_BASE_URL=http://127.0.0.1:8015 pnpm validate:product-smoke:live` 通过，日志确认主会话覆盖 `/turns?limit=50`，随后关闭临时服务。

阶段价值：

这一阶段把 App 重启可靠性继续前移到产品级门禁。现在 smoke 同时覆盖 transcript 恢复、待确认卡恢复 token、确认执行和 pending 清理，能更快发现 H5 / iOS 会话恢复链路中“看得到历史但不能安全继续操作”的问题。

## 阶段 96：产品级 smoke 覆盖自然语言管理已有事项

问题背景：

- 自然语言管理已有事项 v1 已支持提醒、费用和日程的管理动作，但之前主要靠单元测试和接口测试覆盖。
- 第一版 App 的目标是用户能直接在对话里输入“改到十点”“提交刚才的费用”“取消刚才的会议”并得到确认卡；如果同一天有多场会议，宽泛的“取消明天的会议”应先追问目标。
- 产品级 smoke 如果只覆盖创建、直接 UI 动作和只读查询，仍不能快速证明“对话管理已有事项”这条产品路径没有断。

完成内容：

- `scripts/validate_product_smoke.py` 新增 `validate_natural_language_management_smoke()`。
- smoke 使用 `conversationId + "_management"` 独立会话，避免影响主会话的只读查询和附件上下文。
- 提醒路径：创建并确认“明天上午九点提醒我带水杯”，再输入“把刚才的提醒改到明天上午十点”，断言 `reminder.update_reminder` 的 `target_id` 命中、`expected_status=scheduled`、`patch.dueAt=2026-05-22T10:00:00+08:00`，确认后提醒时间更新；继续输入“完成刚才的提醒”，确认后状态变为 `done`；再创建一条“带雨伞”提醒并输入“取消刚才的提醒”，确认后状态变为 `canceled`。
- 费用路径：创建并确认“把昨天 58 元打车票报销”，再输入“把刚才的费用改成 88 元”，断言 `expense.update_reimbursement` 命中同一费用草稿并更新金额；继续输入“提交刚才的费用”，确认后状态变为 `submitted`；再创建一条 66 元费用并输入“取消刚才的费用”，确认后状态变为 `canceled`。
- 日程路径：创建并确认“明天下午三点开会”，再输入“把明天的会议改到十点”，断言 `calendar.update_event` 命中同一日程并保留原时长；再创建一条 16:00 会议并输入“取消刚才的会议”，确认后状态变为 `canceled`。
- 最后查询当前会话 `execution-ledger`，断言 14 个自然语言创建和管理动作都产生 `action_executed` 记录。

验证结果：

- 红灯验证：`test_natural_language_management_smoke_covers_three_domains` 先失败，证明 smoke helper 只覆盖代表性管理动作，没有覆盖完整 8 个管理动作。
- 绿灯验证：补齐 helper 后 `PATH=.venv/bin:$PATH pytest python/backend/tests/test_product_smoke_script.py::test_natural_language_management_smoke_covers_three_domains -q` 通过。
- 回归验证：`pnpm validate:product-smoke` 通过，证明 TestClient / in-memory 产品路径已包含自然语言管理已有事项。
- HTTP 验证：临时启动 `uvicorn` 到 `127.0.0.1:8016` 后，`AI_CODE_API_BASE_URL=http://127.0.0.1:8016 pnpm validate:product-smoke:live` 通过，日志确认 `_management` 会话覆盖提醒更新 / 完成 / 取消、费用更新 / 提交 / 取消和日程更新 / 取消，随后关闭临时服务。

阶段价值：

这一阶段把“对话里管理已有事项”从内部能力推进到产品级验收路径。现在 smoke 不仅能验证用户创建事项，也能验证用户继续用自然语言更新 / 完成 / 取消提醒，更新 / 提交 / 取消费用，以及更新 / 取消日程，并且仍然通过确认卡和领域状态机执行。

## 阶段 97：自然语言管理目标歧义追问

问题背景：

- 自然语言管理已有事项已经能执行 8 个核心动作，但 rule planner 之前会在多条同类可操作事项中直接选择最近一条。
- 对“刚才的提醒”这种明确近指，选择最近目标符合用户预期；但对“取消提醒”“提交费用”“取消明天的会议”这种宽泛表达，如果当前会话有多条候选，自动选择会带来误改、误取消或误提交风险。
- Policy 层的 `ManagementTargetValidator` 只能校验已选 `target_id` 是否属于当前会话、状态是否匹配，无法判断 planner 原本面对了多个候选。

完成内容：

- `RuleBasedPlanningEngine` 在生成已有事项管理候选前增加多目标歧义判断。
- 提醒和费用按可操作状态过滤：多条 `scheduled` 提醒或多条 `draft` 费用时，宽泛管理请求返回 `clarification`，缺失字段为 `target_id`，并给出候选事项 quick replies。
- 日程按相对日期过滤：同一天多条 `scheduled` 日程时，“取消明天的会议”“把明天的会议改到十点”返回目标选择追问。
- “刚才 / 刚刚”近指保留快速路径：如果用户明确说“取消刚才的提醒”，planner 仍按当前会话摘要中的最近可操作目标生成确认卡，避免打断顺序式操作体验。
- API 层新增回归：同一会话创建两条 scheduled 提醒后输入“取消提醒”，后端返回 `clarification_request`，不创建待确认计划，也不新增 execution ledger。

验证结果：

- 红灯验证：`test_rule_based_planner_clarifies_ambiguous_*_management_target` 先失败，证明 planner 会直接返回 `plan_candidate`。
- 绿灯验证：补齐歧义判断后 `PATH=.venv/bin:$PATH pytest python/backend/tests/test_rule_based_planning_engine.py python/backend/tests/test_agent_turns.py::test_agent_turn_clarifies_ambiguous_existing_reminder_target python/backend/tests/test_agent_turns.py::test_agent_turn_can_cancel_recent_reminder_by_conversation_context -q` 通过。

阶段价值：

这一阶段把自然语言管理从“能执行”继续推进到“不会在目标不唯一时替用户猜”。用户连续操作时仍然顺手；一旦当前会话中存在多个可能目标，系统会先要求用户选择，保持确认卡之前的安全边界。

## 阶段 98：多 provider 管理目标歧义安全闸

问题背景：

- 阶段 97 已经让 rule planner 在多目标管理请求中先追问目标。
- 但 `llm_first` / `llm` 模式下，真实模型仍可能在“提交费用”“取消明天的会议”这类宽泛请求中，自行选择一个当前会话内合法且状态匹配的 `target_id`。
- 原有 `ManagementTargetValidator` 能拦截跨会话目标和状态过期目标，但不能判断“上下文里存在多个合法目标，模型不应替用户猜”。

完成内容：

- `LlmFirstPlanningEngine` 增加 rule safety precheck：当规则规划器能明确返回缺 `target_id` 的目标歧义追问时，`llm_first` 直接采用追问，不再调用 LLM 生成猜测式确认卡。
- `ManagementTargetValidator` 增加统一多目标 guard：对日程取消 / 更新、费用提交 / 取消 / 更新、提醒完成 / 取消 / 更新等管理类 action，如果当前输入没有“刚才 / 刚刚”近指，且当前会话中存在多条同状态可操作目标，则返回缺 `target_id` 的安全追问。
- LLM system prompt 补充明确约束：当前会话中存在多个可操作目标且用户未明确近指时，必须返回 `clarification`，不要替用户猜测 `target_id`。
- API 层补齐费用和日程歧义回归：同会话两条 draft 费用后输入“提交费用”、同一天两条 scheduled 日程后输入“取消明天的会议”，都必须返回 `clarification_request`，不创建待确认计划，不新增 ledger。
- Pending clarification 补齐目标选择解析：用户点击歧义追问 quick reply，或回复“第一个 / 第二个 / 第三个”时，会解析到 `candidate_target_ids` 中的目标并生成对应管理确认卡；该 action 带 `resolution_reason=selected_pending_clarification_target`，避免 validator 再按宽泛请求拦回去。
- 更新类追问会保留原始 patch：费用“把费用改成 99 元”、提醒“把提醒改到明天上午十一点”、日程“把明天的会议改到十点”遇到多目标时，先追问目标；用户选择目标后，确认卡会继续携带金额、提醒时间或日程开始 / 结束时间 patch。
- 产品级 smoke 新增 `validate_ambiguous_management_smoke()`，覆盖提醒 / 费用 / 日程的宽泛多目标更新点选，以及费用提交、日程取消的宽泛多目标点选，确保真实用户路径不会退回到猜测式确认卡，也不会卡在追问之后。

验证结果：

- 红灯验证：新增 `test_llm_first_planning_engine_prefers_rule_target_clarification_over_llm_guess` 先失败，证明 `llm_first` 会直接接受 LLM 返回的合法但武断目标。
- 红灯验证：新增 `test_management_target_validator_clarifies_ambiguous_expense_target_guess` 先失败，证明 validator 原本会放行多目标中的合法 `target_id`。
- 绿灯验证：补齐 precheck、validator guard、prompt contract、pending 目标选择解析、更新 patch 保留和产品 smoke 后，相关后端回归与 `pnpm validate:product-smoke` 均通过。

阶段价值：

这一阶段把“目标不唯一时先问用户”从 rule planner 的局部能力下沉为多 provider 共享安全边界，并补齐追问后的点选闭环。无论后续使用 DeepSeek、OpenAI、Claude 还是其他 provider，只要模型试图在多目标场景里猜测 `target_id`，后端都会在确认卡生成前拦截并转成追问；用户明确选择后，系统再回到确认卡和领域状态机。

## 阶段 99：多目标追问快捷回复候选一致性修复

问题背景：

- 阶段 98 已经支持多目标管理追问后的 quick reply 点选和“第一个 / 第二个 / 第三个”序号选择。
- 但追问 UI 只展示最近 3 个候选事项，而 pending clarification 中的 `candidate_target_ids` 仍可能保存全部候选 ID。
- 当同一会话中存在 4 个以上同类可操作目标时，用户点击展示出来的第一条 quick reply，后端可能按全量候选的第一个 ID 解析，造成展示目标和实际确认卡目标不一致。

完成内容：

- `RuleBasedPlanningEngine._target_clarification()` 改为先计算 `displayed_targets = targets[-3:]`。
- quick replies 和 `partial_payload.candidate_target_ids` 都来自同一个 `displayed_targets`，保证展示顺序、点击文本和序号选择共享同一候选集合。
- 新增 API 回归 `test_agent_turn_target_selection_uses_displayed_quick_reply_order`：同会话创建 4 条 scheduled 提醒后输入“完成提醒”，点击第一条展示 quick reply，确认卡必须命中展示列表里的第一条提醒，而不是全量候选里的第一条。
- 产品级 smoke 新增 `validate_displayed_target_selection_smoke()`，用独立会话覆盖 4 条提醒候选、只展示 3 条、选择第一条展示 quick reply、确认后目标状态变为 `done` 的完整路径。
- 记录中期契约风险：当前 H5 / SDK 仍把 quick reply 当纯文本回传，如果两个候选展示文案完全相同，仍可能被 `index()` 解析到第一条同名候选。后续应把 quick replies 升级为结构化 `{label, value}`，H5 展示 `label`、提交稳定 `value`。

验证结果：

- 红灯验证：新增回归先失败，错误显示第一条展示 quick reply 被解析为全量候选中的第一条 `target_id`。
- 绿灯验证：修复后该回归通过。
- 回归验证：聚焦后端测试和产品 smoke 脚本测试通过，`pnpm validate:product-smoke` 通过。
- 收尾验证：ruff、`pnpm validate:context-sync`、`pnpm validate:factory` 和 `git diff --check` 均通过。

阶段价值：

这一阶段修复了“追问看起来选 A，确认卡实际操作 B”的高风险错位问题。目标歧义追问不仅要阻止模型猜测，还必须保证用户点选后的目标绑定可信；否则安全追问本身会变成新的误操作入口。

## 阶段 100：结构化快捷回复选择值

问题背景：

- 阶段 99 已保证 quick replies 和 `candidate_target_ids` 同源同序。
- 但 API / H5 仍主要依赖 `quickReplies: string[]`。如果两个候选的展示文案完全相同，例如两条“带电脑（明天 09:00）”提醒，H5 点击第二个按钮时只能把同一段展示文本发回后端。
- 后端旧解析逻辑会用 `quick_replies.index(text)` 找第一个匹配项，导致重复文案下永远选中第一条。

完成内容：

- `/agent/turns` 的 `clarification_request` 响应新增兼容字段 `quickReplyOptions`，每项包含 `label` 和 `value`。
- 旧字段 `quickReplies` 保留不变，旧客户端和现有 Postman 断言仍可工作。
- 普通补字段追问中，`label` 与 `value` 相同；管理目标选择追问中，`label` 是展示文案，`value` 是稳定 `target_id`。
- H5 的 quick-replies 元素新增 `replyValues`，渲染仍展示 `label`，点击时提交 `value`；按钮 key 也改为 `value + index`，避免重复 label 触发 React key 冲突。
- 会话历史恢复会保留 `quickReplyOptions`，因此刷新后恢复出的追问按钮也能提交稳定值。
- debug pending response 会派生返回 `quickReplyOptions`，便于在 Postman / 设置页排查追问候选绑定。
- OpenAPI、shared-types、SDK 导出、H5 类型和 Postman README 已同步。
- 产品级 smoke 在重复提醒文案场景下使用 `quickReplyOptions[1].value` 选择第二个候选，确认卡必须命中第二条提醒。

验证结果：

- 红灯验证：后端重复提醒测试先失败，响应缺少 `quickReplyOptions`；H5 typecheck 也先失败，类型中没有 `quickReplyOptions` 和 `replyValues`。
- 绿灯验证：补齐后端、契约和 H5 点击链路后，重复提醒目标选择测试通过，H5 / shared-types / SDK typecheck 通过。
- 回归验证：后端聚焦测试、产品 smoke 脚本测试、`pnpm validate:contracts` 和 `pnpm validate:product-smoke` 均通过。

阶段价值：

这一阶段把“用户看到的按钮”和“系统实际提交的选择值”解耦。第一版 App 仍保持旧 `quickReplies` 兼容，但新 H5 可以在候选重名时提交稳定目标 ID，降低自然语言管理已有事项的误操作风险。

## 阶段 101：快捷回复提交值与用户显示文本分离

问题背景：

- 阶段 100 让 H5 点击 quick reply 时提交稳定 `value`，例如目标选择场景中的 `target_id`。
- 但 H5 的 `handleSubmittedText()` 原本直接用提交文本生成用户消息气泡。
- 如果按钮展示“带电脑（明天 09:00）”，实际提交 `reminder_xxx`，用户就会在对话里看到内部 ID，破坏第一版 App 的自然交互体验，也会暴露实现细节。

完成内容：

- `handleSubmittedText()` 增加可选 `displayText` 参数：提交给后端的 `text` 和展示在用户气泡里的 `displayText` 分离。
- quick reply 点击路径改为 `handleSubmittedText(reply.value, { displayText: reply.label })`。
- 普通键盘、语音和附件输入仍按原路径显示用户实际输入文本，不受影响。
- `BackendElementCard` / `BackendElementSurface` 的 `onQuickReply` 类型改为 `{label, value}`，让 UI 层显式表达“展示文本”和“提交值”两个语义。
- `pnpm validate:h5-runtime` 新增静态防回归检查，要求 quick reply 点击必须提交稳定 value，同时用户气泡必须使用 `displayText ?? text`。

验证结果：

- 红灯验证：新增 H5 runtime 校验后先失败，指出缺少 `displayText ?? text` 和 `handleSubmittedText(reply.value, { displayText: reply.label })`。
- 绿灯验证：补齐 H5 点击链路后 `pnpm validate:h5-runtime` 通过。
- 类型验证：`pnpm --filter @ai-code/h5 typecheck` 通过。

阶段价值：

这一阶段补齐了结构化 quick reply 的最后一段产品体验闭环：后端收到稳定 ID，用户看到自然语言。这样既能避免目标选择误操作，也不会让内部 `target_id` 混进用户对话。

## 阶段 102：快捷回复会话历史 displayInput 闭环

问题背景：

- 阶段 101 只修复了当前页面里的即时用户气泡。
- H5 点击 quick reply 后仍只把稳定 `value` 作为 `/agent/turns.input` 发给后端。
- 后端会话历史接口 `GET /agent/conversations/{conversationId}/turns` 会把该 `input` 记录成用户 turn，因此刷新或重启后 transcript 仍可能显示 `reminder_xxx` / `target_id`。

完成内容：

- `/agent/turns` 请求新增可选 `displayInput` 字段。
- H5 quick reply 点击时继续把 `quickReplyOptions.value` 作为 `input`，同时把 `quickReplyOptions.label` 作为 `displayInput`。
- `SubmitTurnUseCase` 规划和目标选择仍使用真实 `input`，不改变执行语义。
- `conversation_turns.inputText` 和 `summary` 保存 `displayInput`，用于恢复用户可读 transcript。
- `rawContent.submittedInput` 保留真实稳定 `value`，`rawContent.displayInput` 保留展示 label，便于后端日志、Postman 和调试页排查。
- OpenAPI、shared-types、H5 runtime 校验、产品 smoke 和 Postman README 已同步。

验证结果：

- 红灯验证：新增后端回归先失败，历史最后一条用户 turn 显示 `reminder_xxx` 而不是“带电脑（09:00）”；H5 runtime 校验也先失败，提交请求缺少 `displayInput`。
- 绿灯验证：补齐 API 契约和 H5 提交字段后，后端回归和 `pnpm validate:h5-runtime` 通过。
- 产品验证：产品级 smoke 中重复 quick reply 文案场景会提交 `displayInput`，并断言历史 `inputText` 是 label、`rawContent.submittedInput` 是稳定 value。

阶段价值：

这一阶段把“当前屏幕显示正确”推进到“会话恢复后仍正确”。结构化快捷回复现在同时满足三件事：执行使用稳定值、用户即时气泡显示自然语言、历史 transcript 也显示自然语言，内部 ID 只留在审计 rawContent 中。

## 阶段 103：H5 提醒通知目标定位滚动

问题背景：

- 阶段 45 已经让 iOS 点击系统提醒通知后切到 H5 的提醒视图，并用 `reminderId` 高亮对应提醒。
- 但如果提醒列表较长，只切换视图和高亮还不够，目标提醒可能在当前视口之外。
- 第一版原生 App 的通知体验需要做到“点击通知后直接看见目标事项”，而不是让用户再手动寻找。

完成内容：

- H5 summary-list 高亮行增加 `data-highlighted-summary-item` 标记。
- `AgentWorkbench` 在 active surface 为 `reminders` 且存在 `focusedReminderId` 时，查找高亮行并调用 `scrollIntoView({ behavior: "smooth", block: "center" })`。
- 该滚动只绑定提醒 surface 和当前 focused reminder，不影响普通对话自动滚到底部，也不改变日程、费用、提醒事实本身。
- `pnpm validate:h5-runtime` 增加静态防回归检查，要求通知打开提醒时有可定位标记和滚动行为。

验证结果：

- 红灯验证：新增 H5 runtime 校验先失败，指出缺少 `data-highlighted-summary-item` 和 `scrollIntoView`。
- 绿灯验证：补齐 H5 定位标记和滚动逻辑后，`pnpm validate:h5-runtime` 通过。
- 类型验证：`pnpm --filter @ai-code/h5 typecheck` 通过。

阶段价值：

这一阶段把提醒通知点击从“回到提醒页并高亮”推进到“回到提醒页并把目标提醒带到视野里”。这让本地通知、Native Bridge 和 H5 事项列表形成更完整的原生体验闭环。

## 阶段 104：多 provider LLM fenced JSON 兼容

问题背景：

- 当前多 provider 架构已经支持 OpenAI 与 DeepSeek，并为后续 Claude、OpenRouter 或其它 OpenAI-compatible provider 预留 adapter 边界。
- 虽然 system prompt 要求“只输出 JSON”，真实模型或新 provider 偶尔仍会把 JSON 包在 Markdown 代码块中。
- 旧解析逻辑直接 `json.loads(provider_output)`，这会把内容正确但带代码块包裹的输出降级为 `*-invalid-response`，影响真实 provider 调试效率。

完成内容：

- `LlmPlanningEngine` 新增 provider JSON 读取边界：先识别标准 Markdown JSON 代码块，抽出内部 JSON，再进入原有 schema 解析。
- 兼容范围限定为带 `json` 语言标记或无语言标记的完整代码块。
- 普通非 JSON 文本仍按 invalid response 降级为 `assistant_message`，不会生成候选 action。
- 后续 schema 校验、PolicyEngine、ManagementTargetValidator、确认卡和领域写入链路保持不变。

验证结果：

- 红灯验证：新增 fenced JSON provider 输出测试先失败，trace 为 `claude-invalid-response`。
- 绿灯验证：补齐解析边界后，同一输出能解析为正常 `chat` response。
- 回归验证：非 JSON provider 输出仍保持 invalid-response 降级；完整 LLM planning engine 测试和 ruff 均通过。

阶段价值：

这一阶段提升了多 provider 架构的真实模型兼容性，同时没有放松后端安全边界。模型可以在输出格式有轻微包裹时被正确解析，但所有写入类动作仍必须通过 schema、Policy 和用户确认后才会落到业务事实。

## 阶段 105：H5 可点击产品级 smoke

问题背景：

- 产品级 smoke 已覆盖后端主路径，但它通过 FastAPI TestClient / HTTP 客户端直接调用接口。
- H5 侧仍主要依赖 typecheck、契约文件和源码字符串检查，无法证明“用户在原生 App/H5 中真的能点完整个流程”。
- 第一版 App 的目标是原生输入、对话组件、确认卡、Timeline 和行内动作都能直接使用，因此需要一个真实浏览器级 smoke。

完成内容：

- 根命令新增 `pnpm validate:h5-click-smoke`。
- 新增脚本 `scripts/validate-h5-click-smoke.mjs`，会自动分配端口并临时启动：
  - in-memory rule planner API。
  - H5 Next dev server，并通过 `NEXT_PUBLIC_API_BASE_URL` 指向临时 API。
  - Playwright Chromium 页面。
- smoke 打开 `?native=ios&bridgeDebug=1&conversationId=...`，注入 iOS NativeBridge mock。
- smoke 通过 `native.inputSubmitted` 输入“明天上午我要去开会”。
- 页面必须展示追问“明天上午几点开始开会？”。
- smoke 点击 quick reply“明天上午10点”，随后点击确认卡“确认”。
- smoke 通过 `native.viewChanged` 切到 Timeline，点击已确认日程的“编辑”，保存为“产品评审会”并回查开始时间，再点击行内“取消”并回查状态为 `canceled`。
- smoke 继续通过 Native 输入创建费用草稿，确认后在 Timeline 点击费用“编辑”，保存标题、金额和发生日期，再点击“提交”并回查状态为 `submitted`。
- smoke 继续通过 Native 输入创建提醒，确认后在 Timeline 点击提醒“编辑”，保存标题和提醒时间，再点击“完成”并回查状态为 `done`。

验证结果：

- 红灯验证：首次运行证明缺少 `@playwright/test`，仓库没有可执行浏览器 smoke 依赖。
- 环境红灯：补依赖和 Chromium 后，脚本证明 H5 input 事件如果在 bridge effect 订阅前发送，会停在欢迎语。
- 绿灯验证：调整为等待 H5 mount 后发送 Native 消息，`pnpm validate:h5-click-smoke` 通过，输出 `H5 click smoke validation passed.`。
- 扩展红灯：按 subagent 审计建议加入三领域编辑弹层后，费用日期和提醒时间断言暴露了浏览器运行时日期 / 本机时区与后端固定测试日期的差异。
- 扩展绿灯：费用编辑显式设置固定发生日期，提醒编辑断言用户输入的 `09:30` 时间被保存，最终 `pnpm validate:h5-click-smoke` 再次通过。

阶段价值：

这一阶段把“接口能跑”推进到“真实 H5 页面能点”。它覆盖了 Native Bridge 输入、多轮追问、结构化 quick reply、确认卡、Timeline 切换、日程 / 费用 / 提醒三领域编辑弹层、行内终态动作和后端状态回查，是第一版 App 可点击可用性的重要门禁。该命令依赖本机 Playwright Chromium，不串入离线 `validate:factory`。

## 阶段 106：真实 LLM provider smoke

问题背景：

- 项目已经接入 DeepSeek / OpenAI 多 provider，但之前的主验证多为 mock、规则或 provider adapter 单测。
- `.env.local` 自动加载后，本机 `DATABASE_URL` 可能污染真实 LLM smoke，让 provider 验证变成数据库认证错误。
- DeepSeek 真实调用有时较慢，缺少明确请求超时会让 smoke 卡住，降低调试效率。

完成内容：

- 根命令新增 `pnpm validate:llm-smoke`。
- 脚本会先读取 `.env.local` 中的 `DEEPSEEK_API_KEY` 或 `OPENAI_API_KEY`，默认优先 DeepSeek。
- 读取 key 后默认锁定 in-memory runtime：`DATABASE_URL=""`、`AI_CODE_LOAD_ENV_LOCAL=0`、`AI_PLANNER_MODE=llm_first`。
- smoke 覆盖闲聊 `chat`、缺时间日程 `clarification`、自然回复 + 日程候选 `mixed`、只读查询结构化组件、多提醒创建确认，以及宽泛“完成提醒”的 rule safety clarification。
- LLM provider 新增 `AI_PLANNER_REQUEST_TIMEOUT_SECONDS`，默认 20 秒，避免真实 provider 调用无界等待。

验证结果：

- 红灯验证：先证明删除 `DATABASE_URL` 会被后续 `.env.local` 重新加载，导致 smoke 连接错误数据库；再证明 provider client 没有传 timeout。
- 绿灯验证：补齐环境隔离和 timeout 后，`pnpm validate:llm-smoke` 输出 `LLM smoke validation passed with provider=deepseek.`。
- 回归验证：LLM planning engine 测试、LLM smoke script 测试和 ruff 均通过。

阶段价值：

这一阶段把“provider 可以配置”推进到“真实模型可被一键验收”。它仍不绕过确认卡、Policy、目标 guard 或领域写入边界，只验证模型返回质量和后端路由能否在真实调用下稳定穿过。

## 阶段 107：Postgres 产品级 smoke

问题背景：

- `pnpm validate:product-smoke` 使用 in-memory runtime，速度快、确定性强，但不能证明 migration、Postgres repository 和 API 读模型在真实数据库中一致。
- 运行中 API live smoke 可以验证当前服务组合，但不会执行 migration，也不适合作为本地数据库门禁。
- Postgres 的 `timestamptz` 会按 instant 存储并可能以 UTC 读回，容易与 in-memory 字符串行为产生差异。

完成内容：

- 根命令新增 `pnpm validate:product-smoke:postgres`。
- `scripts/validate_product_smoke.py` 新增 `--postgres` 模式：检测本地 Postgres、运行 migration runner、设置 `DATABASE_URL` 和 rule planner，再复用产品级 smoke 主路径。
- 默认离线 `pnpm validate:product-smoke` 强制 `DATABASE_URL=""`，确保它始终验证 in-memory runtime。
- 日程和提醒 Postgres repository 读回时按事实 timezone 输出带 offset ISO，保持 API 与 H5 / in-memory 行为一致。
- 产品 smoke 去掉对列表“最后一条”的隐式排序依赖：按标题或 structured quick reply value 定位目标，避免 Postgres 按时间排序时误判。

验证结果：

- 红灯验证：先证明离线 smoke 会继承外层 `DATABASE_URL`，以及 CLI 缺少 `--postgres`；真实 Postgres smoke 又暴露 `timestamptz` UTC 输出和 smoke 排序假设问题。
- 绿灯验证：补齐隔离、Postgres 入口、timezone 输出和目标定位后，`pnpm validate:product-smoke:postgres` 通过。
- 回归验证：`pnpm validate:product-smoke`、产品 smoke script 测试、Postgres repository timezone 测试和 ruff 均通过。

阶段价值：

这一阶段把产品级验收拆成三层：离线 in-memory smoke 快速验证主链路，Postgres smoke 验证 migration + repository + API 一致性，live smoke 验证当前运行中服务组合。三者边界清楚，后续排查 iOS / Postman / API 问题时可以更快定位是哪一层出错。

## 阶段 108：LLM provider 调用观测接入 debug

问题背景：

- DeepSeek / OpenAI 调用耗时、prompt 大小和 prompt hash 已经写入后端日志，但这些信息没有进入 `DecisionTrace`。
- 用户在 H5 设置页或 Postman debug 接口里只能看到 planner mode、fallback、工具选择和缺失字段，看不到真实 provider 调用本身。
- 调 prompt 或排查慢响应时，需要把日志里的调用摘要和具体会话 trace 关联起来。

完成内容：

- `LlmPlanningEngine` 将 provider、model、mode、status、durationMs、prompt/response 字符数和 `promptSha256` 写入 `PlanningResult.llm_call`。
- provider 调用异常并触发 rule fallback 时，`llm_call` 也会保留 `status=failed`、`errorType`、耗时和 prompt hash，便于排查真实 DeepSeek / OpenAI 失败原因。
- `ExecutionPlanner` 把该字段复制到 `DecisionTrace.llm_call`。
- Postgres 新增 `0009_decision_trace_llm_call` migration，将该字段持久化为 nullable JSONB。
- `GET /agent/conversations/{conversationId}/debug` 的 `decisionTraces[]` 新增 `llmCall`。
- H5 设置页的 Agent 调试卡新增“LLM 调用”行，展示 provider、model、耗时和 prompt hash 前缀。
- `.env.example` 和后端 README 新增 `AI_PLANNER_TRACE_PROMPT`、`AI_PLANNER_TRACE_RESPONSE` 与 `AI_PLANNER_REQUEST_TIMEOUT_SECONDS` 说明。

验证结果：

- 红灯验证：先证明 `PlanningResult` 没有 `llm_call`，`DecisionTrace` 没有该字段，debug route 不透出 `llmCall`，H5 runtime 没有展示 `latestTrace.llmCall` / `promptSha256`。
- 绿灯验证：补齐 planning、trace、Postgres repository、debug route、OpenAPI、shared-types 和 H5 设置页后，对应 Python 测试、ruff、TypeScript typecheck、契约和 H5 runtime 均通过；随后补充 provider 失败 fallback 红灯并修复，确保 fallback trace 也保留 failed observation。
- 安全验证：默认 debug trace 不包含完整 prompt/response，只有显式 `AI_PLANNER_TRACE_PROMPT=1` / `AI_PLANNER_TRACE_RESPONSE=1` 时才写入 preview。

阶段价值：

这一阶段把 LLM 可观测性从“只能看后端日志”推进到“每个会话 debug 都能看到真实 provider 调用摘要”。后续调 DeepSeek 速度、模型输出质量或 prompt hash 对齐时，可以直接在 H5 设置页 / Postman debug 里定位调用，再按需打开完整 preview。

## 阶段 109：追问生命周期与直接动作强审计

问题背景：

- Pending clarification 已能承接缺字段多轮补全，但旧 open pending 如果没有被关闭，可能在用户已经开启新意图后继续等待短回复。
- 直接 UI 行内动作虽然会校验 `conversationId`，但后端接口仍允许调用方不传该参数；这会让 mutation 绕过会话归属审计。
- SDK、OpenAPI 和 Postman 如果仍把 `conversationId` 表达为可选，调用方会在运行时才发现审计失败。

完成内容：

- Pending clarification store 新增 `abandoned` 关闭路径；当旧 pending 没有被本轮补全，而本轮输入已经生成新的追问或候选计划时，旧 pending 会标记为 abandoned。
- 新增回归覆盖：“明天上午我要去开会”触发旧日程追问后，用户输入“十点提醒我喝水”会进入新的提醒确认卡，再输入“十点”不会重新唤醒旧会议 pending。
- `DirectActionAuditService` 要求直接 UI mutation 必须带非空 `conversationId`；缺失参数返回 400，跨会话目标仍返回 404。
- 后端 direct mutation 回归覆盖日程取消、费用提交和提醒完成在缺少 `conversationId` 时都会返回 `conversationId is required`。
- SDK 的日程编辑 / 取消、费用编辑 / 提交 / 取消、提醒编辑 / 完成 / 取消方法改为必传 `conversationId: string`，并在运行时对空字符串提前报错。
- OpenAPI 将上述 8 个直接 mutation 的 query `conversationId` 标记为 `required: true`；契约验证脚本新增防回归检查，避免后续退回可选。
- Postman collection 与 README 同步说明这些直接变更请求必须带 `conversationId={{conversationId}}`。

验证结果：

- 红灯验证：新增缺 `conversationId` direct action 测试时，旧实现会直接返回 200 并改写业务事实。
- 绿灯验证：补齐审计后，`python/backend/tests/test_agent_turns.py` 全量通过，直接动作缺会话 ID 返回 400。
- 契约验证：`pnpm validate:contracts` 通过，确认直接 mutation 的 OpenAPI 参数和 SDK 方法签名保持强约束。
- 产品验证：`pnpm validate:product-smoke` 与 `pnpm validate:h5-click-smoke` 均通过，真实 H5 点击路径仍会携带 `conversationId` 并完成三领域编辑 / 终态动作。

阶段价值：

这一阶段把“追问补字段”和“用户直接点击管理按钮”两条高风险路径都收紧了。旧追问不会在新意图之后偷跑，直接 UI 写入也不能绕过会话审计；第一版 App 后续继续扩展更多行内动作时，应沿用同样的 required conversation boundary 和 abandoned pending lifecycle。

## 阶段 110：H5 到 Native 系统同步 payload 验证

问题背景：

- H5 click smoke 已经证明用户能点完整个日程 / 费用 / 提醒主路径，但之前只回查后端状态，没有检查 H5 发给 Native 的系统同步 payload。
- iOS 系统日历依赖 `calendar.events.sync` 的非 `scheduled` 日程来删除旧 `EKEvent`；如果 H5 只发 scheduled，后端已取消的日程可能残留在系统日历。
- iOS 本地通知同步会先清空所有 `ai-code.reminder.` 前缀通知，再按当前 scheduled 提醒重建；如果完成后的提醒仍出现在 payload，旧通知可能被重新调度。
- Hybrid Bridge JSON Schema 只约束 envelope，没有约束 `calendar.events.sync` / `notifications.reminders.sync` 的 payload 字段。

完成内容：

- `scripts/validate-h5-click-smoke.mjs` 新增 Native outbound message helper，读取 mock `NativeBridge.postMessage` 收集到的 envelopes。
- 日程路径新增 payload 断言：
  - 确认日程后，`calendar.events.sync` 包含 scheduled event，并具备 `id/title/startAt/endAt/timezone/status/sourceActionId`。
  - 编辑日程后，`calendar.events.sync` 包含更新后的 scheduled event，时间为带 offset ISO。
  - 取消日程后，`calendar.events.sync` 仍包含同一个 event，`status=canceled`，用于 iOS 清理系统日历。
- 提醒路径新增 payload 断言：
  - 确认提醒后，`notifications.reminders.sync` 包含 scheduled reminder，并具备 `id/title/dueAt/status`。
  - 编辑提醒后，`notifications.reminders.sync` 包含更新后的 scheduled reminder，且 `dueAt` 是未来时间。
  - 完成提醒后，`notifications.reminders.sync` 不再包含该 reminder。
- reminder 编辑 smoke 不再写固定过去日期，而是基于刚创建的未来提醒日期改到 09:30，覆盖 iOS `dueAt > Date()` 的真实调度前置条件。
- `contracts/hybrid-bridge/native-bridge-message.schema.json` 为 `calendar.events.sync` 和 `notifications.reminders.sync` 增加条件 payload schema。
- `scripts/validate-contracts.mjs` 新增 Hybrid Bridge payload schema 防回归检查；`scripts/validate-h5-runtime.mjs` 新增 click smoke marker 检查。

验证结果：

- 红灯验证：先更新 `validate:h5-runtime` 要求 click smoke 包含 Native sync payload 断言，旧脚本失败。
- 契约红灯：先更新 `validate:contracts` 要求 Hybrid Bridge schema 声明两类 sync payload 必填字段，旧 schema 失败。
- 绿灯验证：补齐 click smoke 断言和 schema 后，`pnpm validate:h5-runtime`、`pnpm validate:h5-click-smoke`、`pnpm validate:contracts` 均通过。

阶段价值：

这一阶段把第一版 App 的可点击验收从“后端事实正确”推进到“发给 Native 系统能力层的数据也正确”。它仍不替代真机日历 / 通知权限验证，但已经能自动防住最危险的两类系统残留：取消日程没有同步给 iOS 删除、完成提醒仍被本地通知重建。

## 阶段 111：iOS 真编译门禁

问题背景：

- `validate:native-shells` 只能检查 Swift / Info.plist / Bridge 关键字，不能证明 Xcode 项目真实可编译。
- README 中的 `xcodebuild` 示例绑定具体模拟器 `iPhone 16,OS=18.6`，本机可用，但作为长期门禁不够稳定。
- 最近 iOS 已接入语音识别、通知、EventKit、PhotosPicker、Vision、PDFKit 和附件 base64 Bridge，Swift 编译风险已经高于纯静态检查。

完成内容：

- 新增 `scripts/validate-ios-build.mjs`，封装真实 `xcodebuild build`。
- 新增根命令 `pnpm validate:ios-build`。
- 默认使用 `generic/platform=iOS Simulator`、`CODE_SIGNING_ALLOWED=NO` 和仓库内 `.tmp/xcodebuild/AIEngineeringCode` DerivedData，降低对具体模拟器和全局 DerivedData 的依赖。
- 支持通过 `AI_CODE_IOS_PROJECT`、`AI_CODE_IOS_SCHEME`、`AI_CODE_IOS_CONFIGURATION`、`AI_CODE_IOS_DESTINATION`、`AI_CODE_IOS_DERIVED_DATA_PATH`、`AI_CODE_IOS_BUILD_TIMEOUT_MS` 和 `H5_DEV_SERVER_URL` 覆盖构建参数。
- `validate:native-shells` 增加对 `validate:ios-build` 命令和脚本关键构建参数的检查，避免真编译门禁被无意删除。
- iOS README 增加推荐门禁命令、默认参数和覆盖方式说明。

验证结果：

- `xcodebuild -list -project apps/ios/AIEngineeringCode.xcodeproj` 确认 project、scheme 和 target 均为 `AIEngineeringCode`。
- `pnpm validate:native-shells` 通过。
- `pnpm validate:ios-build` 在 Xcode 16.4 下通过，日志包含 `** BUILD SUCCEEDED **`。
- 构建产物位于 `.tmp/xcodebuild/AIEngineeringCode/Build/Products/Debug-iphonesimulator/AIEngineeringCode.app`。

阶段价值：

这一阶段把原生壳验收从“文本契约没有明显断裂”推进到“Swift 工程真实可编译”。后续改 iOS 语音、附件、通知和系统日历时，可以先跑 `pnpm validate:ios-build` 快速发现编译层问题，再进入模拟器或真机做权限和系统 API 行为验证。

## 阶段 112：iOS Simulator 运行级 smoke

问题背景：

- iOS 真编译门禁已经能证明 Swift 工程可编译，但不能证明 App 可以安装并启动到模拟器。
- 第一版原生壳依赖系统能力较多，后续改语音、附件、通知或日历时，需要一个比手动 Xcode Run 更快的运行级检查。
- 只读审计发现 `Info.plist` 的 `H5DevServerURL` 仍是硬编码局域网地址，导致 `xcodebuild H5_DEV_SERVER_URL=...` 覆盖并不会进入构建产物。

完成内容：

- 新增 `scripts/validate-ios-simulator-smoke.mjs`。
- 新增根命令 `pnpm validate:ios-simulator-smoke`。
- simulator smoke 默认先运行 `pnpm validate:ios-build`，再安装 `.tmp/xcodebuild/AIEngineeringCode/Build/Products/Debug-iphonesimulator/AIEngineeringCode.app`。
- 脚本优先复用 booted iPhone Simulator；如果没有 booted iPhone，则从 available devices 中选择 iPhone，并只在自己 boot 的情况下默认 shutdown。
- 安装后用 bundle id `com.aiengineeringcode.shell` 执行 `simctl launch`，再用 `simctl get_app_container` 验证安装成功。
- `Info.plist` 的 `H5DevServerURL` 改为 `$(H5_DEV_SERVER_URL)`，让 Xcode Build Settings / 命令行覆盖真实进入构建产物。
- `validate:native-shells` 增加对 simulator smoke 命令、脚本、bundle id、`simctl launch` 和 `get_app_container` 的检查。
- iOS README 增加 simulator smoke 的用法、边界和环境变量覆盖说明。

验证结果：

- 红灯验证：先让 `validate:native-shells` 要求 simulator smoke 命令和脚本，旧状态失败。
- 配置红灯：再让 `validate:native-shells` 要求 `Info.plist` 包含 `$(H5_DEV_SERVER_URL)`，旧硬编码地址失败。
- 绿灯验证：补齐脚本和 plist 后，`pnpm validate:native-shells` 通过。
- 运行验证：`pnpm validate:ios-simulator-smoke` 在 booted 的 `iPhone 16 Pro Max` 上安装并启动成功，`simctl launch` 返回 `com.aiengineeringcode.shell: 87887`，`get_app_container` 返回已安装 App 容器路径。
- 构建产物校验：`.tmp/xcodebuild/AIEngineeringCode/Build/Products/Debug-iphonesimulator/AIEngineeringCode.app/Info.plist` 中 `H5DevServerURL` 展开为 `http://127.0.0.1:3000/?native=ios`。

阶段价值：

这一阶段把 iOS 验收从“可编译”推进到“可安装、可启动”。它仍不替代真机权限、语音识别、PhotosPicker、系统通知或 EventKit 的人工体验验证，但能自动发现 bundle id、Info.plist、安装包、模拟器安装和 App 启动层面的断裂。

## 阶段 113：iOS v1 系统能力人工验收清单

问题背景：

- 自动门禁已经覆盖 Swift 编译、Simulator 安装启动、H5 可点击主链路、后端产品 smoke 和 H5 到 Native payload，但不能证明真实 iOS 权限弹窗和系统 App 行为。
- 第一版原生壳包含语音识别、照片选择、文件 / PDF 选择、本地通知、通知点击回流和系统日历写入 / 清理，这些都需要人工在模拟器或真机上确认。
- 如果人工验收只留在聊天里，后续新窗口或新设备调试容易遗漏关键证据。

完成内容：

- 新增 `docs/qa/ios-v1-system-acceptance.md`。
- 清单覆盖 H5 地址覆盖、会话持久 ID、键盘输入、语音输入、照片附件、文件附件、PDF 文本提取、本地通知、通知点击回流、系统日历写入、系统日历取消清理、后端事实确认和系统同步降级。
- 每项都写明验收步骤、预期结果和验收证据，例如权限弹窗截图、bridge/debug 日志、`source=native.composer.voice`、`source=native.composer.keyboard`、`inputKind=attachment`、`ai-code.reminder.{id}`、`source=native.notifications.reminders.opened`、`AI_CODE_EVENT_ID:{id}`、`AI_CODE_ACTION_ID:{sourceActionId}` 和后端接口摘要。
- 新增 `scripts/validate-ios-manual-acceptance.mjs` 和根命令 `pnpm validate:ios-manual-acceptance`。
- `validate:native-shells` 增加对验收清单和手动验收命令的 marker 检查，避免清单丢失或退化。
- iOS README 增加手动验收清单入口，并明确该命令只检查验收资产完整性，不替代真实人工验收。

验证结果：

- 红灯验证：先让 `validate:native-shells` 要求 `docs/qa/ios-v1-system-acceptance.md`，旧状态失败。
- 细节红灯：新增 `validate:ios-manual-acceptance` 后，子代理补充的 bridge source、附件 payload、通知标识和日历 marker 缺失导致 validator 失败。
- 绿灯验证：补齐清单细节后，`pnpm validate:ios-manual-acceptance` 与 `pnpm validate:native-shells` 均通过。

阶段价值：

这一阶段把“还需要真机 / 模拟器手测”的事项从口头提醒变成仓库资产。后续发布第一版前，可以按清单逐项留证；后续扩展原生能力时，也可以继续把自动门禁无法覆盖的系统行为沉淀到同一验收入口。

## 阶段 114：v1 readiness 审计与收口边界

问题背景：

- 第一版 App 的后端、H5、契约、iOS 编译、Simulator 安装启动和 LLM provider 都已经有自动化门禁，但长时间开发后需要一个明确的 readiness 结论，避免把“自动化主路径通过”误说成“系统能力完整发布就绪”。
- iOS 语音、照片 / 文件选择、PDF 文本提取、本地通知、通知点击回流和系统日历写入 / 清理仍需要真实模拟器或真机证据，自动脚本不能替代系统权限和系统 App 行为验收。
- Goal 模式需要有一个可复用的完成判定：什么已经能展示，什么仍不能标记 complete。

完成内容：

- 新增 `docs/qa/v1-readiness-audit.md`，把自动化证据、人工证据缺口、未完成证据和完成判定门槛写成仓库资产。
- 新增 `scripts/validate-v1-readiness.mjs` 和根命令 `pnpm validate:v1-readiness`，检查 readiness 文档保留关键命令、人工验收缺口和“Goal 不能标记 complete”的结论。
- `validate:native-shells` 增加对 readiness 命令和审计脚本的检查，避免收口边界被后续修改冲掉。
- 本轮补跑真实 LLM provider、SDK runtime、readiness 和 factory 总闸门，其中 `pnpm validate:llm-smoke` 使用 `deepseek` provider 通过。

验证结果：

- `pnpm validate:llm-smoke` 通过，输出 `LLM smoke validation passed with provider=deepseek`。
- `pnpm validate:sdk-runtime` 通过。
- `pnpm validate:v1-readiness` 通过。
- `pnpm validate:factory` 通过，并串联 `validate:h5-runtime`、`validate:h5-datetime-runtime`、`validate:sdk-runtime` 和 `validate:context-sync`。
- `pnpm validate:product-smoke` 通过，证明离线 rule 主路径可用。
- `AI_CODE_PRODUCT_SMOKE_TIMEOUT_SECONDS=45 pnpm validate:product-smoke:live` 当前通过：针对此前 DeepSeek/live 组合在提醒创建、费用创建、日程创建和单目标管理动作中可能出现的时间 / 金额 / patch 语义漂移，已在 `llm_first` 前置 `rule_safety_deterministic` 护栏。rule 能确定的单个执行动作先用 rule 结果保证业务事实稳定；包含 `顺便`、情绪表达等 mixed 输入仍交给 LLM，以保留自然回复和对话体验。

阶段价值：

这一阶段把当前成果收束为一句话：第一版已经具备自动化主路径验收入口，用户现在可以看见并测试后端、H5、Postman、LLM provider 和 iOS build / simulator smoke 的成果；但在没有按人工验收清单留存系统能力证据前，不能把 Goal 标记为 complete。这个边界能帮助后续继续快速开发，同时不牺牲发布判断的诚实性。

## 阶段 115：iOS v1 自动证据包采集器

问题背景：

- iOS 系统能力验收有两类证据：一类是 CLI 能稳定采集的构建、安装、启动、H5 地址和服务可达性；另一类是必须人工操作的语音、照片 / 文件、PDF、本地通知、通知点击回流、系统日历和权限拒绝降级。
- 仅靠人工清单会让每次复验都从零开始；仅靠自动 smoke 又容易误判为已经完成系统权限和系统 App 验收。
- v1 收口需要一个中间层：把可自动采集的证据打包，同时在包内明确声明它不能替代人工验收。

完成内容：

- 新增 `scripts/collect-ios-acceptance-evidence.mjs` 和根命令 `pnpm collect:ios-acceptance-evidence`。
- 证据包默认输出到 `.tmp/ios-acceptance-evidence/<timestamp>/`，包含 `manifest.json`、`acceptance-evidence.json`、`summary.md`、`manual-checklist.todo.md` 和 `simulator-launch.png`。
- 采集内容包括 git 状态、本地 API / H5 可达性、构建产物 `H5DevServerURL`、iOS build、Simulator 安装启动、启动截图和人工验收清单形状。
- 支持 `AI_CODE_IOS_ACCEPTANCE_SKIP_BUILD=1`、`AI_CODE_IOS_ACCEPTANCE_RESET_APP=1`、`AI_CODE_IOS_ACCEPTANCE_SCREENSHOT_DELAY_MS`、`--output-dir`、`--skip-build`、`--reset-app` 和 `--dry-run`。
- manifest 固定声明 `acceptanceVerdict=not_evaluated`、`manualAcceptanceRequired=true`、`automationCanReplaceManualAcceptance=false`，并列出不能自动覆盖的人工验收项目。
- 新增 `scripts/collect-ios-acceptance-evidence.test.mjs` 和根命令 `pnpm validate:ios-acceptance-evidence`，`validate:native-shells` 增加对采集器、命令和边界 marker 的检查。
- 本轮已生成辅助证据包 `.tmp/ios-acceptance-evidence/2026-05-28T07-06-45Z/`；截图显示 iOS 原生壳已加载 H5 对话首页，API health 与 H5 native 页面均返回 HTTP 200。

验证结果：

- `node --test scripts/collect-ios-acceptance-evidence.test.mjs` 通过。
- `pnpm validate:native-shells` 通过。
- `AI_CODE_IOS_ACCEPTANCE_SKIP_BUILD=1 AI_CODE_IOS_ACCEPTANCE_RESET_APP=1 AI_CODE_IOS_ACCEPTANCE_SCREENSHOT_DELAY_MS=8000 pnpm collect:ios-acceptance-evidence` 成功生成证据包和 Simulator 启动截图。

阶段价值：

这一阶段把 iOS v1 验收从“自动 smoke + 人工清单”补强为“自动证据包 + 人工清单”。团队可以快速看到当前 App 是否能构建、安装、启动并加载 H5，同时不会把这份证据误说成语音、照片、通知或系统日历已经人工验收完成。

## 阶段 116：客户端时区相对时间修复与键盘实测证据

问题背景：

- 在 Simulator 中真实点击原生键盘输入“明天上午十点提醒我带电脑”后，确认卡显示 `05/29 18:00`，而用户语义应为北京时间 `05/29 10:00`。
- H5 运行时会用浏览器常见的 UTC `now` 字符串提交给后端，同时带上 `timezone=Asia/Shanghai`。规则解析器看到 `now` 已经有时区后没有再转换到客户端时区，导致“明天上午十点”被落到 UTC 十点。
- 这个问题不会被只传 `+08:00` 的单元测试发现，必须用真实 iOS/H5 输入链路或 UTC `now` 回归覆盖。

完成内容：

- 新增回归 `test_agent_turn_interprets_utc_now_in_client_timezone`，用 `now=2026-05-28T07:13:00.000Z` 和 `timezone=Asia/Shanghai` 复现错误，先看到返回 `2026-05-29T10:00:00+00:00` 的红灯。
- 修复 `RuleParser.parse()`：对有时区的 `now` 也先 `astimezone(ZoneInfo(timezone))`，再计算“今天 / 明天 / 后天”和中文时段。
- 同步修复 orchestrator 和 rule-based management 中的相对时间入口，避免 pending clarification、自然语言管理已有事项、只读日期过滤等路径继续基于 UTC 日期计算。
- 用真实 Simulator 重新操作：原生键盘输入“明天上午十点提醒我带电脑”，确认卡显示 `05/29 10:00`，点击确认后 `/reminders` 返回 `dueAt=2026-05-29T10:00:00+08:00`。
- 本轮本地辅助证据保存到 `.tmp/ios-acceptance-evidence/manual-keyboard-timezone-fix/`，包含 `keyboard-reminder-confirmed.png` 和 `reminders-tail.json`。该证据证明键盘输入主路径和时区修复有效，但不替代语音、附件、通知、系统日历等人工验收。

验证结果：

- 红灯：`PATH=.venv/bin:$PATH pytest python/backend/tests/test_agent_turns.py::test_agent_turn_interprets_utc_now_in_client_timezone -q` 初始失败，实际值为 `2026-05-29T10:00:00+00:00`。
- 绿灯：同一命令修复后通过。
- `PATH=.venv/bin:$PATH pytest python/backend/tests/test_agent_turns.py python/backend/tests/test_orchestrator_planner.py python/backend/tests/test_rule_based_planning_engine.py -q` 通过，结果 `127 passed`。
- `pnpm validate:product-smoke` 通过。
- `pnpm validate:h5-datetime-runtime` 通过。
- 运行中 API live check 返回 `reminder.create_reminder` payload `due_at=2026-05-29T10:00:00+08:00`。

阶段价值：

这一阶段把“真实 iOS 键盘输入能跑通”推进为带证据的验收项，同时修掉一个会直接损害用户信任的时间漂移问题。后续所有“相对日期 + 客户端时区”的规则路径都应按这个边界处理：`now` 的原始 offset 只是传输事实，业务解释必须落在 `clientContext.timezone`。

## 阶段 117：iOS 原生输入控件可访问性标识

问题背景：

- iOS v1 剩余验收缺口集中在真实系统能力：键盘、语音、照片 / 文件、PDF、通知和系统日历。
- 其中键盘输入已经通过人工操作拿到一次证据，但后续如果继续靠坐标、图标文字或截图位置采证，会受到 Simulator 尺寸、语言、主题和键盘状态影响。
- 子代理只读审计建议先给 Native composer 补稳定 accessibility identifiers，再逐步扩展半自动证据采集。

完成内容：

- 为 `NativeComposerBar` 中的附件按钮、键盘输入框、发送按钮、语音按钮和输入模式切换按钮补稳定可访问性标识：
  - `ai-code.composer.attachment-button`
  - `ai-code.composer.keyboard-text-field`
  - `ai-code.composer.submit-button`
  - `ai-code.composer.voice-button`
  - `ai-code.composer.mode-toggle-button`
- 同步补充 accessibility label，保证自动化定位和人工辅助功能语义一致。
- `validate:native-shells` 增加上述 marker 检查，避免后续 UI 调整时把半自动采证锚点删掉。
- iOS README 和 iOS v1 系统能力验收清单已记录这些标识的用途和边界。

验证结果：

- 红灯：先让 `pnpm validate:native-shells` 要求这些 marker，旧 Swift 代码失败。
- 绿灯：补齐标识后 `pnpm validate:native-shells` 通过。
- `pnpm validate:ios-build` 通过，证明 SwiftUI 标识改动不破坏真实 iOS simulator build。

阶段价值：

这一阶段没有把语音、照片、通知或系统日历误说成已自动验收，而是补上了后续真实验收的稳定抓手。下一步可以基于这些 identifier 做更可靠的半自动键盘输入、附件入口打开和语音入口触达证据，而不是继续依赖脆弱坐标。

## 阶段 118：H5 Bridge Debug 入站来源摘要

问题背景：

- iOS 键盘、语音和附件入口都已经走 `native.inputSubmitted` 进入 H5，但旧 Bridge Debug 面板只显示 `in=native.inputSubmitted`。
- 在人工验收截图里，单靠消息类型无法证明这次输入来自键盘、语音还是照片 / 文件附件，也无法看到附件名。
- 同时附件 payload 可能携带小文件 `base64Content`，调试 UI 不能为了可观测性把大内容或敏感内容直接展示出来。

完成内容：

- H5 新增 `getNativeInboundDebugLabel()`，把 Native 入站消息摘要为 `type + source + inputKind + attachmentName + view + ack`。
- Bridge Debug 面板的 `in=` 现在使用该摘要，例如可以显示 `native.inputSubmitted · source=native.composer.attachment.file · input=attachment · attachment=receipt.txt`。
- 摘要逻辑不读取或展示 `base64Content`，附件内容仍只走上传 / intake 链路。
- H5 契约测试新增对该 helper 的类型消费，`validate:h5-runtime` 增加 marker，防止后续退回只显示消息类型。

验证结果：

- 红灯：`pnpm --filter @ai-code/h5 typecheck` 初始失败，提示缺少 `getNativeInboundDebugLabel` 导出。
- 绿灯：补实现后同一命令通过。

阶段价值：

这一阶段提升的是验收可观测性，不改变业务写入路径。后续在 Simulator / 真机里验证键盘、语音、照片、文件或 PDF 附件时，截图可以直接证明 Native 来源、输入类型和附件名进入 H5 Bridge，同时避免把 base64 内容暴露在调试面板中。

## 阶段 119：iOS 人工补证清单结构化

问题背景：

- 自动证据包已经能采集构建、安装、启动、H5 地址和服务可达性，但生成的 `manual-checklist.todo.md` 只有空的 `evidence_placeholder`。
- 人工验收人员仍需要回到长文档里查每一项应该记录哪些 bridge marker、接口摘要、系统截图或页面截图，容易漏掉证据。
- 子代理只读审计还发现证据包未把“会话持久 ID”和“后端事实确认”列入 `manualEvidenceStillRequired`，这两个是 iOS v1 系统能力验收清单里的必验项。

完成内容：

- `collect-ios-acceptance-evidence.mjs` 新增 `manualEvidenceGuides`，为每个人工项目生成具体补证提示。
- 生成的 `manual-checklist.todo.md` 现在会包含：
  - `bridge_marker`
  - `api_summary`
  - `screenshot`
  - `system_artifact`
- `manualEvidenceStillRequired` 补入“会话持久 ID”和“后端事实确认”，manifest 的未覆盖项不再漏掉这两项。
- 证据包仍保持 `acceptanceVerdict=not_evaluated`、`manualAcceptanceRequired=true`、`automationCanReplaceManualAcceptance=false`，不把结构化清单误当成人工验收完成。

验证结果：

- 红灯：`pnpm validate:ios-acceptance-evidence` 先因缺少 `bridge_marker`、`api_summary`、`system_artifact` 失败。
- 第二个红灯：补字段模板后，同一命令因缺少“会话持久 ID”失败。
- 绿灯：补齐未覆盖项和对应指南后，`pnpm validate:ios-acceptance-evidence` 通过。

阶段价值：

这一阶段把 iOS v1 人工验收从“读长文档自行整理证据”推进到“证据包直接生成逐项补证模板”。它仍不替代真实语音、附件、通知或系统日历验收，但能显著降低漏证和返工成本。

## 阶段 120：会话持久 ID 自动辅助证据

问题背景：

- iOS v1 验收清单要求证明 App 重启后仍使用同一个 `conversationId`。
- 旧证据包只提示人工截图，没有自动读取 Native `UserDefaults`，因此“会话持久 ID”仍完全依赖人工观察。
- 该能力适合半自动采集：Native 会把 `conversation_ios_*` 写入 `UserDefaults`，CLI 可以读取 Simulator data container 中的 preferences plist，并在重启前后比对。

完成内容：

- `collect-ios-acceptance-evidence.mjs` 新增 `native_conversation_id_storage` 自动证据项。
- 证据采集器会读取：
  - data container
  - `Library/Preferences/com.aiengineeringcode.shell.plist`
  - `ai-code.native.conversationId`
- 采集器会执行一次 `simctl terminate` / `simctl launch`，再读取同一个 key，写入 `ios.conversationPersistence.beforeRelaunch`、`afterRelaunch` 和 `stableAcrossRelaunch`。
- dry-run 模式只展示字段形状，不给出 `stableAcrossRelaunch=true`，避免把预览误当成真实证据。
- iOS v1 人工验收清单补充该 JSON 字段作为“会话持久 ID”的辅助证据入口。

验证结果：

- 红灯：`pnpm validate:ios-acceptance-evidence` 先因 `ios.conversationPersistence` 缺失失败。
- 修复 dry-run 边界后，`pnpm validate:ios-acceptance-evidence` 通过。
- 在当前运行环境执行 live 采集：
  - 输出目录：`.tmp/ios-acceptance-evidence/conversation-persistence-live/`
  - `beforeRelaunch=conversation_ios_15144b54eec0432d9409e133ea77dee7`
  - `afterRelaunch=conversation_ios_15144b54eec0432d9409e133ea77dee7`
  - `stableAcrossRelaunch=true`

阶段价值：

这一阶段把“会话持久 ID”从纯手工观察推进为可复查的 CLI 辅助证据。它仍不替代 H5 页面截图和历史 turn 接口摘要，但已经能证明 Native 层不会在 App 重启时重建会话 ID。

## 阶段 121：后端事实摘要自动辅助证据

问题背景：

- iOS v1 验收清单要求证明 Timeline、日程、提醒、费用和执行记录都来自后端事实，而不是前端 demo。
- 旧流程需要人工分别调用 `/calendar/events`、`/reminders`、`/expenses`、`/execution-ledger` 和会话历史接口，再手动整理摘要。
- 证据包已经能拿到 Native 持久 `conversationId`，因此可以自动查询同一会话的核心读模型，作为后端事实确认的辅助证据。

完成内容：

- `collect-ios-acceptance-evidence.mjs` 新增 `backend_fact_snapshot` 自动证据项。
- live 模式下，采集器会使用 Native conversationId 查询：
  - `/calendar/events?conversationId=...`
  - `/reminders?conversationId=...`
  - `/expenses?conversationId=...`
  - `/execution-ledger?conversationId=...`
  - `/agent/conversations/{conversationId}/turns`
- 结果写入 `backendFactSnapshot.counts`、`previews` 和每个 curl 命令摘要。
- 计数逻辑同时支持根数组响应和 `{field: [...]}` 响应，避免 reminders / ledger 这类数组接口被误计为 0。
- iOS v1 人工验收清单补充 `backendFactSnapshot.counts` 作为“后端事实确认”的辅助证据入口。

验证结果：

- 红灯：`pnpm validate:ios-acceptance-evidence` 先因 `backendFactSnapshot` 缺失失败。
- 绿灯：补 shape 后同一命令通过。
- live 采集输出目录：`.tmp/ios-acceptance-evidence/backend-fact-snapshot-live/`
- 真实摘要：
  - `conversationId=conversation_ios_15144b54eec0432d9409e133ea77dee7`
  - `reminders=1`
  - `executionLedger=6`
  - `turns=4`
  - `calendarEvents=0`
  - `expenses=0`

阶段价值：

这一阶段把“后端事实确认”从纯手工接口截图推进为证据包自动摘要。它不替代五个页面截图，也不会证明所有三类事项都已人工创建完毕，但能快速暴露当前会话后端读模型是否存在、是否可查询、执行记录是否可追溯。

## 阶段 122：Native 系统诊断辅助证据

问题背景：

- iOS v1 收口真正薄弱的是系统能力证据：本地通知、系统日历写入 / 清理和权限拒绝降级。
- 旧证据包只能看到 H5 启动截图、会话 ID 和后端事实摘要；Native 层只通过 `native.ack` / `native.error` 临时回传状态，不能稳定归档系统权限、pending notification 或 EventKit 标识符情况。
- 需要增加一层可重复采集的系统诊断，但仍不能把它当成人工系统 UI 验收。

完成内容：

- iOS Native Shell 新增 `ai-code.native.systemDiagnostics` 持久诊断快照。
- `notifications.reminders.sync` 后会记录：
  - `notifications.authorizationStatus`
  - `notifications.pendingReminderCount`
  - `notifications.pendingReminderIds`
  - `notifications.deliveredReminderCount`
  - `notifications.scheduledCount`
  - `notifications.skippedCount`
- `calendar.events.sync` 后会记录：
  - `calendar.authorizationStatus`
  - `calendar.inputEventCount`
  - `calendar.syncedCount`
  - `calendar.skippedCount`
  - `calendar.storedEventIdentifierCount`
  - `calendar.foundStoredEventCount`
- `collect-ios-acceptance-evidence.mjs` 会从 Simulator preferences plist 读取该诊断快照，并写入 `ios.systemDiagnostics`、`summary.md` 的 “Native 系统诊断摘要” 和 manifest 的辅助证据信号。
- 证据逻辑保持克制：通知 pending 数量可作为“本地通知”的辅助信号；当前会话没有日程时，仅有日历权限不算“系统日历写入 / 取消清理”完成证据。

验证结果：

- 红灯：`pnpm validate:ios-acceptance-evidence` 先因 `ios.systemDiagnostics` 缺失失败。
- 红灯：`pnpm validate:native-shells` 先因缺少 `ai-code.native.systemDiagnostics` 和 `recordNativeSystemDiagnostics` 失败。
- 绿灯：补齐采集器、Native 诊断持久化和门禁 marker 后，两条命令通过。
- iOS 真编译通过：`pnpm validate:ios-build`。
- live 采集输出目录：`.tmp/ios-acceptance-evidence/native-system-diagnostics-live-4/`
- 真实诊断摘要：
  - `notifications.authorizationStatus=authorized`
  - `notifications.pendingReminderCount=1`
  - `notifications.pendingReminderIds=ai-code.reminder.reminder_d7d3555ab7d3461b879624960b45ad4c`
  - `calendar.authorizationStatus=authorized`
  - `calendar.syncedCount=0`
  - `calendar.storedEventIdentifierCount=0`

阶段价值：

这一阶段把“本地通知是否真的进入 iOS 系统调度层”从弱 ACK 推进为可归档系统诊断。它仍不替代权限弹窗截图、系统通知截图、通知点击录屏或系统日历 App 截图，但让 v1 收口多了一层可重复、可核查的系统状态证据。

## 阶段 123：H5 同会话页面截图辅助证据

问题背景：

- 后端事实摘要已经能证明同一个 Native `conversationId` 下的读模型可查询，但用户仍需要看到 H5 对话、Timeline、日程、费用、提醒和执行记录页面是否真的能渲染。
- `?native=ios` 模式下页面内预览切换控件会隐藏，不能依赖开发态 segmented control 截图。
- 证据包需要保持真实嵌入形态，通过 Native Bridge 入站消息切换页面，而不是临时打开 demo 或前端预览模式。

完成内容：

- `collect-ios-acceptance-evidence.mjs` 新增 `h5_surface_screenshots` 自动证据项。
- live 模式会打开 `http://127.0.0.1:3000/?native=ios&bridgeDebug=1&conversationId=...`，注入最小 NativeBridge mock，并通过 `native.viewChanged` 依次切换：
  - `conversation`
  - `timeline`
  - `calendar`
  - `expenses`
  - `reminders`
  - `ledger`
  - `settings`
- 截图输出到证据包 `h5-surfaces/*.png`，并写入 `acceptance-evidence.json`、`summary.md` 和 manifest 辅助证据信号。
- dry-run 模式保留完整字段形状，但 `available=false`，避免把预览结果误判为真实截图。

验证结果：

- 红灯：`pnpm validate:ios-acceptance-evidence` 先因 `h5SurfaceScreenshots` 缺失失败。
- 绿灯：补齐采集器和 dry-run shape 后，同一命令通过。
- live 采集输出目录：`.tmp/ios-acceptance-evidence/h5-page-screenshots-live/`
- 当前 live 结果：
  - `conversationId=conversation_ios_15144b54eec0432d9409e133ea77dee7`
  - 7 个 H5 surface 截图均已生成。
  - 同会话后端事实摘要为 `reminders=1`、`executionLedger=6`、`turns=4`、`calendarEvents=0`、`expenses=0`。

阶段价值：

这一阶段把“后端事实能查到”进一步推进为“同会话 H5 页面能被用户看见”。它仍不替代真实 iOS 键盘、语音、照片 / 文件、PDF、本地通知、通知点击回流和系统日历 App 的人工验收；当前会话没有日程和费用，因此系统日历写入 / 取消清理仍必须单独补证。

## 阶段 124：三领域验收事实种子与系统日历写入辅助证据

问题背景：

- H5 同会话页面截图阶段只能展示当前会话已有事实；如果当前会话只有提醒，就无法证明日程、费用和系统日历写入链路。
- 普通证据采集不能默认写入业务事实，否则会污染用户持久会话。
- 需要一个显式 opt-in 的采证模式，通过真实 Agent 提交 / 确认流创建三领域事实，再让 H5 / Native 刷新同步并采集证据。

完成内容：

- `collect-ios-acceptance-evidence.mjs` 新增 `--seed-acceptance-facts` 参数和 `AI_CODE_IOS_ACCEPTANCE_SEED_FACTS=1` 环境变量。
- 默认模式下 `acceptanceFactSeed.enabled=false`，`automatedEvidence` 不包含 `acceptance_fact_seed`。
- 显式开启 seed 时，采集器会为当前 Native `conversationId` 分别提交并确认：
  - 日程：`calendar.create_event`
  - 费用：`expense.create_reimbursement_draft`
  - 提醒：`reminder.create_reminder`
- 每次 seed 都生成唯一 `seedRunId`，并把 `seedNow`、输入、planId、actionType 和执行结果写入 `acceptanceFactSeed`。
- seed 后采集器会重新拉起 Native App，等待 H5 读取同会话后端事实并触发 `calendar.events.sync` / `notifications.reminders.sync`，再读取 `ai-code.native.systemDiagnostics`。
- API base URL 统一使用 `AI_CODE_API_BASE_URL`，不再硬编码 `127.0.0.1:8000`。
- `backendFactSnapshot`、H5 页面截图和 seed 都统一使用 `beforeRelaunch ?? afterRelaunch` 得到的 Native conversationId。

验证结果：

- 红灯：`pnpm validate:ios-acceptance-evidence` 先因缺少 `acceptanceFactSeed`、`--seed-acceptance-facts`、`seedNow` 和 `seedRunId` 失败。
- 绿灯：补齐 opt-in seed、动态 `seedRunId` 和 API base URL 后，同一命令通过。
- live 采集输出目录：`.tmp/ios-acceptance-evidence/seeded-three-domain-live-final/`
- 本轮真实结果：
  - `seedRunId=seed_20260528081825`
  - 三条 seed 均 `succeeded`。
  - 后端事实摘要：`calendarEvents=2`、`reminders=4`、`expenses=3`、`executionLedger=30`、`turns=22`。
  - Native 诊断：`calendar.syncedCount=1`、`calendar.storedEventIdentifierCount=1`、`calendar.foundStoredEventCount=1`、`notifications.pendingReminderCount=3`。
  - H5 7 个页面截图均已生成。

阶段价值：

这一阶段把 v1 证据从“当前有什么就展示什么”推进为“显式生成三领域验收事实后再采证”。它证明后端 Agent 确认流、H5 同会话页面、提醒通知 pending 和系统日历写入诊断可以形成闭环。它仍不替代真实语音、照片 / 文件、PDF、通知点击回流、系统日历 App UI 和系统日历取消清理的人工验收。

## 阶段 125：系统日历取消清理自动辅助证据

问题背景：

- 三领域验收事实种子已经能证明日程 seed 可进入 EventKit 写入诊断，但无法证明取消后 Native 会删除对应系统日历事件。
- 只看聚合字段 `storedEventIdentifierCount` / `foundStoredEventCount` 不足以定位某一个 seed event，因为当前会话可能已经有其他日程保留在系统日历中。
- 取消采证必须保持 opt-in，不能在普通证据包里默认修改用户日程事实。

完成内容：

- `collect-ios-acceptance-evidence.mjs` 新增 `--seed-calendar-cleanup` 参数和 `AI_CODE_IOS_ACCEPTANCE_SEED_CALENDAR_CLEANUP=1` 环境变量。
- 该能力依赖显式 `--seed-acceptance-facts`，先通过真实 Agent 提交 / 确认流创建 seed 日程，再定位 confirm result 中的 `calendarEvent.id`。
- 取消前采集器会重新拉起 Native，并等待目标 seed event 出现在 Native `storedEventBackendIds` 或对应 UserDefaults key 中，避免只证明“取消消息到达”，却没有证明“先写入系统日历”。
- 取消动作直接调用后端 `POST /calendar/events/{eventId}/cancel?conversationId=...`，再重新拉起 Native 触发 H5 刷新和 `calendar.events.sync`。
- iOS `NativeCalendarEventSyncer` 诊断新增：
  - `calendar.storedEventBackendIds`
  - `calendar.foundStoredEventBackendIds`
  - `calendar.removedEventIds`
- 证据包新增 `calendarCleanupSeed`，记录目标 event、取消前 / 取消后状态、取消前 / 取消后 EventKit identifier 是否存在，以及 Native removed ids。
- 后续增强：`calendarCleanupSeed` 进一步记录取消前 / 取消后系统 Calendar App 日期页截图路径，用于把 identifier diagnostics 和系统 UI 辅助材料放在同一 lifecycle 证据对象里；截图仍不替代人工打开事件详情和核对 notes marker。

验证结果：

- 红灯：`pnpm validate:ios-acceptance-evidence` 先因缺少 `calendarCleanupSeed` 和 `--seed-calendar-cleanup` 失败；`pnpm validate:native-shells` 先因缺少 Native 诊断 marker 失败。
- 绿灯：补齐采集器、Swift 诊断字段和取消前等待后，上述命令通过。
- live 采集输出目录：`.tmp/ios-acceptance-evidence/calendar-cleanup-live/`
- 本轮真实结果：
  - `calendarCleanupSeed.available=true`
  - `targetEventId=calendar_event_e48b46c582224c6b9ab92af033e9d93d`
  - `preCancelStatus=scheduled`
  - `postCancelStatus=canceled`
  - `preCancelStoredIdentifierPresent=true`
  - `postCancelStoredIdentifierPresent=false`
  - `calendar.removedEventIds` 包含目标 event id。
  - H5 7 个页面截图均已生成。
  - 后端事实摘要：`calendarEvents=6`、`reminders=8`、`expenses=7`、`executionLedger=68`、`turns=46`。

阶段价值：

这一阶段把系统日历证据从“写入诊断可见”推进为“目标 seed event 先写入、再取消、再从 Native EventKit identifier 存储移除”的可重复辅助证据。它仍不替代用户在系统日历 App 中看到事件消失的人工截图，也不替代语音、附件、通知点击和权限拒绝降级的人工验收。

## 阶段 126：日历权限拒绝降级自动辅助证据

问题背景：

- v1 需要证明系统权限拒绝时，后端业务事实仍然成功保存，H5 不能把系统同步失败误报成业务失败。
- 人工验收仍要保留权限弹窗和 H5 状态栏截图，但 Simulator 可以用 `simctl privacy` 稳定制造日历拒绝状态，形成可重复辅助证据。
- 当前 `simctl privacy` 支持 `calendar`，但不支持 notifications，因此本阶段只自动化日历拒绝，通知拒绝继续人工验收。

完成内容：

- `collect-ios-acceptance-evidence.mjs` 新增 `--seed-calendar-permission-denial` 参数和 `AI_CODE_IOS_ACCEPTANCE_SEED_CALENDAR_PERMISSION_DENIAL=1` 环境变量。
- 显式开启后，采集器会：
  - 记录当前 Native 日历授权状态。
  - 对本轮目标 Simulator 执行 `xcrun simctl privacy <udid> revoke calendar com.aiengineeringcode.shell`。
  - 通过真实 `/agent/turns` + `/execution-plans/{planId}/confirm` 创建一条 seed 日程。
  - 重新拉起 Native，让 H5 刷新后触发 `calendar.events.sync`。
  - 读取 `calendar.authorizationStatus`、`calendar.lastSyncStatus`、`calendar.lastError` 等 Native 诊断。
  - 截取 `calendar-permission-denial.png` 作为辅助画面。
  - 如果运行前权限为 `authorized` 或 `fullAccess`，采集结束后尝试 `simctl privacy grant calendar` 恢复权限。
- 证据包新增 `calendarPermissionDenialSeed`，记录 target event、权限前后状态、后端事实是否写入、Native error source/reason、预期 H5 降级文案和恢复命令。

验证结果：

- 红灯：`pnpm validate:ios-acceptance-evidence` 先因缺少 `calendarPermissionDenialSeed` 和 `--seed-calendar-permission-denial` 失败。
- 绿灯：补齐 opt-in 参数、dry-run shape 和 summary 后，同一命令通过。
- live 采集输出目录：`.tmp/ios-acceptance-evidence/calendar-permission-denial-live/`
- 本轮真实结果：
  - `calendarPermissionDenialSeed.available=true`
  - `preAuthorizationStatus=authorized`
  - `postAuthorizationStatus=denied`
  - `backendFactPersisted=true`
  - `targetEventId=calendar_event_4119df75fd0b4ca08a56537414484935`
  - `calendar.lastSyncStatus=failed`
  - `calendar.lastError=未获得日历权限，日程已保存但不会写入系统日历`
  - 后端事实摘要：`calendarEvents=7`、`reminders=8`、`expenses=7`、`executionLedger=71`、`turns=48`。

阶段价值：

这一阶段把“系统同步降级”从纯人工观察推进为可重复的 Simulator 辅助证据：权限被拒绝时，后端日程事实仍然写入，Native 把同步失败记录为系统能力降级，H5 的既有契约会把该类 `native.error` 展示为 completed 语义。它仍不替代真机权限弹窗、用户可见状态栏和系统 App 截图。

## 阶段 127：通知点击回流自动辅助证据

问题背景：

- iOS 本地通知点击本身需要真实系统通知投递和用户点击，不能用 `simctl push` 直接替代本地通知。
- 但 v1 收尾仍需要尽量缩小人工验收范围，自动证明“提醒已进入 Native pending notification 层”和“H5 收到同形态打开事件后能切到提醒页并高亮目标”这两段可重复链路。
- 证据包必须明确这只是辅助证据，不把 synthetic bridge message 伪装成真实系统通知点击。

完成内容：

- `collect-ios-acceptance-evidence.mjs` 新增 `--seed-notification-click-backflow` 参数和 `AI_CODE_IOS_ACCEPTANCE_SEED_NOTIFICATION_CLICK_BACKFLOW=1` 环境变量。
- 显式开启后，采集器会：
  - 通过真实 `/agent/turns` + `/execution-plans/{planId}/confirm` 创建一条 seed 提醒。
  - 重新拉起 Native，让 H5 同步提醒并触发 `notifications.reminders.sync`。
  - 从 `ai-code.native.systemDiagnostics` 中读取 `notifications.pendingReminderIds`，确认目标 `ai-code.reminder.{reminderId}` 已进入 pending local notification。
  - 打开 H5 `?native=ios&bridgeDebug=1&conversationId=...`，发送同形态 synthetic `native.viewChanged`：`source=native.notifications.reminders.opened`、`view=reminders`、`reminderId=...`。
  - 截取 `notification-click-backflow.png`，并断言 H5 状态文案为“已从系统通知打开提醒”、目标提醒行带 `data-highlighted-summary-item="true"`。
- 证据包新增 `notificationClickBackflow`，包含 `supportingOnly=true`、seed 提醒、pending notification identifier、H5 入站摘要、状态文案、高亮结果和截图路径。
- H5 Bridge Debug 入站摘要补充 `reminderId=...`，让通知点击人工截图和自动辅助截图都能看到目标提醒 ID。

验证结果：

- 红灯：`pnpm validate:ios-acceptance-evidence` 先因缺少 `notificationClickBackflow` 和 `--seed-notification-click-backflow` 失败。
- 绿灯：补齐 opt-in 参数、dry-run shape、summary 和 live 采集逻辑后，同一命令通过。
- live 采集输出目录：`.tmp/ios-acceptance-evidence/notification-click-backflow-live/`
- 本轮真实结果：
  - `notificationClickBackflow.available=true`
  - `reminderId=reminder_c4d7343db0294b5185dbc405621f4551`
  - `notificationIdentifier=ai-code.reminder.reminder_c4d7343db0294b5185dbc405621f4551`
  - `pendingNotificationFound=true`
  - `h5StatusText=已从系统通知打开提醒`
  - `highlightedReminderFound=true`
  - H5 7 个页面截图均已生成。
  - 后端事实摘要：`calendarEvents=7`、`reminders=9`、`expenses=7`、`executionLedger=74`、`turns=50`。

阶段价值：

这一阶段把通知点击回流从“只能等人工点击系统通知”拆成两段可自动复查的辅助证据：Native 已经调度目标提醒通知，H5 对真实 Native 点击同形态事件能够打开提醒页并定位目标提醒。它仍不替代系统通知到点展示、锁屏 / 后台点击和真实用户点击录屏；manifest 必须继续保留 `manualAcceptanceRequired=true` 和 `automationCanReplaceManualAcceptance=false`。

## 阶段 128：短时间提醒与通知回流目标稳定定位

问题背景：

- 真实系统通知验收需要能快速创建几分钟后的提醒，不能每次都等到“明天上午九点”。
- 首次把通知回流 seed 改成短提醒后，后端和 Native pending notification 都成功了，但 H5 回流高亮暴露出一个产品问题：提醒列表只渲染最后 6 条，短提醒按时间排序在列表前部时会被裁掉。
- 采集器也暴露出一个异步边界：seed 刚确认后立即读取 Native plist，可能读到上一次 `notifications.reminders.sync` 的旧诊断。

完成内容：

- `RuleParser` 支持相对时间提醒：
  - `2分钟后提醒我喝水`
  - `两分钟后提醒我喝水`
  - `半小时后提醒我喝水`
  - `1小时后提醒我喝水`
- `remindersToBackendElements()` 新增 `selectRecentItemsWithFocus()`：当 Native 通知点击携带 `reminderId` 时，即使目标提醒不在最近 6 条里，也必须进入 H5 提醒列表并高亮。
- `collect-ios-acceptance-evidence --seed-notification-click-backflow` 的 seed 改为“3 分钟后提醒我...”，并记录真实北京时间 `seedNow` 和解析后的 `seedDueAt`。
- 通知点击回流采集器会在 seed 后轮询 Native 诊断，直到目标 `ai-code.reminder.{reminderId}` 出现在 `notifications.pendingReminderIds`，避免用旧 plist 误判 pending 不存在。
- H5 synthetic 回流截图现在会校验高亮行包含本轮 seed 标题，并在截图前把高亮 locator 滚到可见位置。

验证结果：

- 红灯 1：新增 `test_confirmation_executes_relative_minute_reminder` 后，`PATH=.venv/bin:$PATH pytest python/backend/tests/test_agent_turns.py::test_confirmation_executes_relative_minute_reminder -q` 先失败，旧逻辑把 `2分钟后` 落到默认 `09:00`。
- 绿灯 1：补齐相对分钟 / 小时解析后，同一测试通过。
- 红灯 2：`pnpm validate:h5-runtime` 先因 `reminders.slice(-6).map` 和缺少 focused reminder 保留逻辑失败。
- 绿灯 2：补齐 `selectRecentItemsWithFocus()` 后，`pnpm validate:h5-runtime` 和 `pnpm --filter @ai-code/h5 typecheck` 通过。
- live 采集输出目录：`.tmp/ios-acceptance-evidence/notification-click-backflow-near-future-live-6/`
- 本轮真实结果：
  - `notificationClickBackflow.available=true`
  - `seedInput=3分钟后提醒我seed_20260528090949通知点击回流验收带电脑`
  - `seedDueAt=2026-05-28T17:12:49+08:00`
  - `pendingNotificationFound=true`
  - `h5StatusText=已从系统通知打开提醒`
  - `highlightedReminderFound=true`
  - 截图中目标 seed 提醒处于高亮状态。

阶段价值：

这一阶段把通知验收从“长期提醒的辅助证明”推进到“几分钟后即可到点的真实提醒”。产品上，用户现在可以自然输入短时间提醒；验收上，可以继续用该能力补真实系统通知展示和点击录屏。H5 目标定位也更稳：通知点击打开的提醒不会因为列表裁剪而不可见。

## 阶段 129：系统 Calendar App 辅助截图采集

问题背景：

- 之前 iOS 自动证据包已经能证明 EventKit 写入诊断，例如 `calendar.syncedCount`、`calendar.storedEventIdentifierCount` 和 `calendar.foundStoredEventCount`，也能生成 H5 日程页截图。
- 但系统 Calendar App 真实 UI 截图仍完全依赖人工，导致“系统日历写入”验收缺少一份可重复的辅助材料。
- Simulator 可以通过 `calshow:<seconds since 2001-01-01>` 打开系统 Calendar 到指定日期，但该 URL scheme 不是稳定机器断言，必须明确只作为 supporting evidence。

完成内容：

- `collect-ios-acceptance-evidence.mjs` 新增 `--capture-calendar-system-app` 参数和 `AI_CODE_IOS_ACCEPTANCE_CAPTURE_CALENDAR_APP=1` 环境变量。
- 该能力必须配合 `--seed-acceptance-facts` 使用：采集器先通过真实 Agent 提交 / 确认流写入 seed 日程，再读取 seed 日程的 `startAt`。
- 顶层 `calendarSystemAppEvidence` 只表示“写入后打开 seed 日期并截图”；系统日历取消清理的取消前 / 取消后截图归属 `calendarCleanupSeed`，两者证明目的不同。
- 采集器根据 `startAt` 计算 Apple reference date seconds，执行：
  - `xcrun simctl openurl <udid> calshow:<seconds>`
  - `xcrun simctl io <udid> screenshot system-calendar-app.png`
- 证据包新增 `calendarSystemAppEvidence`，记录 `supportingOnly=true`、目标 event id、标题、开始时间、`calshowUrl`、截图路径和命令结果。
- `docs/qa/ios-v1-system-acceptance.md` 已补充新参数说明，并强调截图仍需人工复核标题、日期和事件是否匹配。

验证结果：

- `pnpm validate:ios-acceptance-evidence` 通过，dry-run schema 覆盖 `calendarSystemAppEvidence` 和 `system_calendar_app_screenshot`。
- live 采集输出目录：`.tmp/ios-acceptance-evidence/system-calendar-app-live/`
- 本轮真实结果：
  - `acceptanceFactSeed.available=true`
  - `calendarSystemAppEvidence.available=true`
  - `targetEventId=calendar_event_04b03d48ddf147f8b4911d90fc6966f5`
  - `targetEventStartAt=2026-05-29T15:00:00+08:00`
  - `calshowUrl=calshow:801730800`
  - 截图：`.tmp/ios-acceptance-evidence/system-calendar-app-live/system-calendar-app.png`
  - 后端事实摘要：`calendarEvents=8`、`reminders=16`、`expenses=8`、`executionLedger=101`、`turns=50`。

阶段价值：

这一阶段把系统日历写入验收从“只有 EventKit 诊断 + H5 截图”推进到“附带系统 Calendar App 日期页截图”。它降低人工复核成本，但仍不替代人工打开事件详情、核对 notes marker、确认无重复事件，以及取消清理后的系统 App 消失截图。

## 阶段 130：本地通知 delivered 诊断辅助证据

问题背景：

- 通知点击回流辅助证据已经能证明目标提醒进入 pending local notification，并能验证 H5 对通知点击同形态事件的回流处理。
- 但“到点后系统是否把提醒投递到通知中心”仍缺自动辅助材料，人工验收只能依赖真实 banner / 锁屏截图。
- 首次采证暴露出两个真实边界：Native reminder sync 会清理 delivered notifications，导致通知中心历史提醒被擦掉；采集器在到点后立即读取 plist，可能早于 Native 写入 delivered diagnostics。

完成内容：

- iOS `NativeReminderNotificationScheduler.sync()` 不再在每次提醒同步时清理 `removeDeliveredNotifications(withIdentifiers:)`，避免 App 重启或 H5 刷新时擦掉已投递的提醒通知。
- `collect-ios-acceptance-evidence --seed-notification-delivery` 新增通知投递诊断辅助证据：
  - 创建“2 分钟后提醒我...” seed 提醒。
  - 轮询确认目标 `ai-code.reminder.{reminderId}` 进入 `notifications.pendingReminderIds`。
  - 等待 `seedDueAt + waitAfterDueMs`。
  - 重新启动 Native App 后轮询读取 `notifications.deliveredReminderIds`。
- 证据包新增 `notificationDelivery`，记录 `supportingOnly=true`、`pendingNotificationFound`、`deliveredNotificationFound`、`seedInput`、`seedDueAt`、等待窗口、目标 reminder id 和 notification identifier。
- `validate:native-shells` 新增静态护栏，防止 reminder sync 再次清理 delivered notifications。
- `docs/qa/ios-v1-system-acceptance.md` 补充 `--seed-notification-delivery` 参数说明，并明确该证据不替代真实 banner、锁屏展示、声音、badge 或用户点击。

验证结果：

- 红灯 1：更新 `collect-ios-acceptance-evidence.test.mjs` 后，`pnpm validate:ios-acceptance-evidence` 先失败，旧 seed 仍是“1 分钟后”且缺少 pending / delivered 轮询上限字段。
- 绿灯 1：改为“2 分钟后” seed、pending 最多 8 次轮询、到期后 15 秒缓冲后，`pnpm validate:ios-acceptance-evidence` 通过。
- 红灯 2：给 `validate-native-shells` 加入 delivered 清理禁用断言后，`pnpm validate:native-shells` 先失败，指出 `HybridShellView.swift` 仍包含 `removeDeliveredNotifications(withIdentifiers: existingIdentifiers)`。
- 绿灯 2：移除 Native sync 对 delivered notifications 的清理后，`pnpm validate:native-shells` 通过。
- 红灯 3：live 采证 `.tmp/ios-acceptance-evidence/notification-delivery-live-3/` 显示目标已进入 pending，但 delivered 读取过早，`deliveredNotificationFound=false`。
- 绿灯 3：采集器补充 delivered diagnostics 轮询后，live 采证输出 `.tmp/ios-acceptance-evidence/notification-delivery-live-4/`：
  - `notificationDelivery.available=true`
  - `pendingNotificationFound=true`
  - `deliveredNotificationFound=true`
  - `seedInput=2分钟后提醒我seed_20260528094311通知投递验收喝水`
  - `seedDueAt=2026-05-28T17:45:11+08:00`
  - `notificationIdentifier=ai-code.reminder.reminder_321fb33cc6e94939a1ed3949b8e1fe77`
  - `deliveredUpdatedAt=2026-05-28T09:45:28Z`
- 同轮证据包仍保留 `acceptanceVerdict=not_evaluated`、`manualAcceptanceRequired=true` 和 `automationCanReplaceManualAcceptance=false`。

阶段价值：

这一阶段把本地通知验收从“只证明 pending 和 H5 synthetic 回流”推进到“能自动证明目标提醒到点后进入系统 delivered diagnostics”。这是一份更强的辅助证据，但仍不代表用户已经看到了 banner、锁屏通知、声音、badge 或真实点击回流；发布前仍必须补人工截图或录屏。

## 阶段 131：系统日历取消清理采证稳定性收口

问题背景：

- live 采证一度出现 `calendarCleanupSeed.available=false`，原因不是后端业务事实失败，而是本机 3000 端口被其他 Vite 应用占用，H5 页面空白，Native 没有加载当前 AI 时间管理 H5，也就不会触发本轮 `calendar.events.sync`。
- 原采集器只检查 H5 HTTP 200，无法识别“端口可达但不是当前产品页面”。
- 取消后 Native 诊断原本只刷新一次，真实系统同步稍慢时会出现后端已 `canceled`、但 EventKit identifier 尚未清理的短暂不一致。

完成内容：

- `collect-ios-acceptance-evidence` 的服务健康检查新增 `h5NativeTargetMarkerFound`，要求 H5 文档同时包含 `AI 时间管理 Agent` 和 `/_next/`，避免把其他 dev server 的 HTTP 200 当作本产品 H5。
- `calendarCleanupSeed` 新增取消前诊断新鲜度字段：`preCancelDiagnosticsUpdatedAt` 和 `preCancelDiagnosticsFresh`。如果 Native plist 仍是旧 `updatedAt`，采集器会明确记录 stale error，并且不会继续取消目标 seed 日程。
- 取消前 EventKit identifier 不存在时，采集器会停止取消和系统 Calendar before 截图，避免生成语义不成立的 cleanup 证据。
- 取消后清理新增最多 8 次轮询，只有 `postCancelStoredIdentifierPresent=false` 且 `postCancelRemovedEventIdPresent=true` 时才认定 cleanup 可用。
- H5 surface 截图失败时新增 `h5-surface-error.png`、`h5-surface-error.html`、页面 URL、title 和正文片段，便于定位空白页、错误页、hydration 失败或端口指错。
- 最终一次 post-cancel Native diagnostics 会同步回顶层 `ios.systemDiagnostics`，避免 summary 中 cleanup 局部结果和 Native 诊断摘要不一致。

验证结果：

- 红灯 / 绿灯按 TDD 覆盖新增字段：`preCancelRefreshMaxAttempts`、`postCancelRefreshMaxAttempts`、`preCancelDiagnosticsFresh`、`postCancelRemovedEventIdPresent`、H5 失败诊断和 `h5NativeTargetMarkerFound`。
- 发现并处理本机环境问题：`127.0.0.1:3000` 原本是 `/Users/mac/company_code/mall4vs-bbc` 的 Vite 进程，已停止该进程并启动当前项目 `pnpm dev:h5:host`。
- 最终 live 证据包：`.tmp/ios-acceptance-evidence/calendar-cleanup-guard-live-5/`
  - `serviceHealth.h5NativeTargetMarkerFound=true`
  - `calendarCleanupSeed.available=true`
  - `targetEventId=calendar_event_51c6533d803347e19c23ec88b8ae65a4`
  - `preCancelStoredIdentifierPresent=true`
  - `postCancelStoredIdentifierPresent=false`
  - `postCancelRemovedEventIdPresent=true`
  - `calendar.removedEventIds` 包含目标 event id
  - `calendar-cleanup-before.png` 和 `calendar-cleanup-after.png` 均已生成
  - H5 7 个页面截图均已生成

阶段价值：

这一阶段把系统日历取消清理采证从“能跑通但容易被本机环境和同步时序误导”推进到“先识别正确 H5、再证明本轮 Native 诊断新鲜、最后等待系统清理完成”。它提高了自动辅助证据可信度，但仍不替代系统 Calendar App 事件详情、notes marker、无重复事件和用户肉眼确认消失的人工复核。

## 阶段 132：App 包 H5DevServerURL 目标页面识别

问题背景：

- 上一阶段已经能判断默认 H5 地址是否是当前 AI 时间管理 H5，但 iOS 真正加载的是 App 包 `Info.plist` 中的 `H5DevServerURL`。
- 如果构建产物里的 `H5DevServerURL` 指向旧 IP、旧端口或其他本机服务，Native 仍可能加载错误页面，导致系统日历、通知和 Bridge 采证失败。

完成内容：

- `collect-ios-acceptance-evidence` 读取构建产物 `Info.plist` 的 `H5DevServerURL` 后，会对该实际 URL 进行目标页面识别。
- 证据包新增 `ios.h5DevServerTargetMarkerFound` 和 `ios.h5DevServerTargetUrl`，summary 新增 “H5DevServerURL 目标页面识别”。
- 目标识别只接受真实 `http(s)` URL；dry-run 不访问网络，并记录 `[dry-run] curl -fsS <h5-url>`，避免把 plutil dry-run 文本误当作 URL。

验证结果：

- `pnpm validate:ios-acceptance-evidence` 通过，dry-run 覆盖 `ios.h5DevServerTargetMarkerFound=false`、`ios.h5DevServerTargetUrl=null` 和 dry-run curl 命令。
- 轻量 live 证据包：`.tmp/ios-acceptance-evidence/h5devserver-target-live/`
  - `serviceHealth.h5NativeTargetMarkerFound=true`
  - `ios.h5DevServerUrl=http://127.0.0.1:3000/?native=ios`
  - `ios.h5DevServerTargetMarkerFound=true`
  - H5 7 个页面截图均已生成。

阶段价值：

这一阶段把 H5 环境验收从“默认端口是对的”推进到“App 包实际加载地址也是对的”。它能更早发现 Xcode / Simulator 使用旧 H5 地址的问题，减少系统能力联调时被环境误导。

## 阶段 133：iOS 人工验收记录模板结构化

问题背景：

- 自动证据包已经能生成 `manual-checklist.todo.md`，但它主要服务人读，缺少机器可读取的人工验收记录结构。
- v1 completion audit 需要知道每个系统能力是 `passed`、`failed` 还是 `blocked`，以及对应截图、录屏、接口摘要、bridge marker 和系统证据路径。
- 如果只靠 Markdown 勾选，后续很难自动检查人工证据是否覆盖所有必验项，也难以把同一份证据包传递给下一轮 Agent。

完成内容：

- `collect:ios-acceptance-evidence` 新增 `manual-evidence-record.template.json` 输出。
- 每条人工记录包含稳定 `id`、`title`、`status=pending`、允许状态 `pending/passed/failed/blocked`、`requiredEvidence`、`supportingAutomationSignals` 和空的 `evidence` 占位。
- `manual-checklist.todo.md` 每个必验项新增 `record_id`，与 JSON 模板中的记录 id 对齐。
- `manifest.json` 新增 `manualEvidenceRecordTemplate=manual-evidence-record.template.json`，但继续保持 `acceptanceVerdict=not_evaluated`、`manualAcceptanceRequired=true` 和 `automationCanReplaceManualAcceptance=false`。
- `docs/qa/ios-v1-system-acceptance.md` 和 `docs/qa/v1-readiness-audit.md` 补充模板使用说明：人工验收后才能把项目状态改为 `passed`、`failed` 或 `blocked`，空模板不代表通过。

验证结果：

- 红灯 1：`pnpm validate:ios-acceptance-evidence` 先因缺少 `manual-evidence-record.template.json` 失败。
- 绿灯 1：补充模板生成后，`pnpm validate:ios-acceptance-evidence` 通过。
- 红灯 2：加入 `record_id=voice_input` 和 JSON `id/title` 断言后，测试先失败。
- 绿灯 2：补充稳定记录 id 后，`pnpm validate:ios-acceptance-evidence` 通过。
- 红灯 3：`pnpm validate:ios-manual-acceptance` 先因清单文档缺少 `manual-evidence-record.template.json`、`passed` 和 `blocked` 说明失败。
- 绿灯 3：补充人工验收文档后，`pnpm validate:ios-manual-acceptance` 通过。

阶段价值：

这一阶段把 iOS v1 手工补证从“清单提示”推进到“可结构化记录”。它仍不替代语音、附件、通知、系统日历等真实系统能力人工验收，但能让后续 completion audit 明确读取每个必验项的状态和证据路径，减少人工补证遗漏。

## 阶段 134：iOS 人工验收记录校验器

问题背景：

- 上一阶段已经生成 `manual-evidence-record.template.json`，但还缺少一个可以在补证完成后读取该 JSON 并判断是否完整的命令。
- 如果只有模板没有校验器，completion audit 仍可能靠人眼检查，容易把 `pending` 空模板或缺截图 / API 摘要的记录误判为完成。
- 校验器需要区分“模板结构有效”和“最终人工验收完成”两个模式，避免普通模板生成阶段被强制要求真实证据。

完成内容：

- 新增 `scripts/validate-ios-manual-evidence-record.mjs`，导出 `validateManualEvidenceRecord()` 并提供 CLI。
- 新增 `scripts/validate-ios-manual-evidence-record.test.mjs`，覆盖三类场景：
  - `pending` 模板在普通结构模式下通过。
  - `--require-complete` 模式会拒绝 `acceptanceVerdict=not_evaluated`、`status=pending` 和缺失证据。
  - 所有必填证据齐全且状态为 `passed` 时通过。
- 新增根命令 `pnpm validate:ios-manual-evidence-record`，它会先跑单元测试，再生成 dry-run 证据包并校验模板结构。
- CLI 支持 `--record <path>` 和 `--require-complete`；最终验收可使用 `node scripts/validate-ios-manual-evidence-record.mjs --record <path> --require-complete` 检查补证后的真实记录。
- `docs/qa/ios-v1-system-acceptance.md`、`docs/qa/v1-readiness-audit.md` 和文档门禁都已补充新命令；readiness 完成门槛要求补证记录通过 completion 模式校验。

验证结果：

- 红灯 1：新增测试后，`node --test scripts/validate-ios-manual-evidence-record.test.mjs` 因缺少 validator 文件失败。
- 绿灯 1：实现 validator 后，单元测试通过。
- 红灯 2：更新 `validate-ios-manual-acceptance` 和 `validate-v1-readiness` 要求文档包含新命令后，两条门禁先失败。
- 绿灯 2：补充验收清单和 readiness 文档后，`pnpm validate:ios-manual-acceptance` 与 `pnpm validate:v1-readiness` 通过。
- `pnpm validate:ios-manual-evidence-record` 通过，证明测试和 dry-run 模板结构校验都可运行。

阶段价值：

这一阶段把“人工验收记录模板”推进为“可校验的人工验收记录”。后续真正手动执行语音、附件、通知、系统日历等验收后，可以把证据填回 JSON，并用 completion 模式阻止空模板、pending 项或缺证据项进入完成结论。

## 阶段 135：iOS 人工补证草稿预填

问题背景：

- `manual-evidence-record.template.json` 是干净模板，但自动证据包已经能采集一部分辅助信号，例如会话持久 ID、后端事实摘要、通知 delivered 诊断、日历写入诊断和系统日历取消清理诊断。
- 如果人工验收人员只看空模板，需要在 summary / manifest / evidence JSON 间来回查辅助材料。
- 但这些自动信号不能被误写成人工截图、录屏、系统 App 证据或通过状态。

完成内容：

- `collect:ios-acceptance-evidence` 新增 `manual-evidence-record.draft.json`。
- draft 与 template 保持同结构，新增 `generatedFromTemplate=manual-evidence-record.template.json`。
- 每项仍保持 `status=pending`，顶层仍保持 `acceptanceVerdict=not_evaluated`、`manualAcceptanceRequired=true` 和 `automationCanReplaceManualAcceptance=false`。
- 自动辅助信号只写入 `evidence.operatorNotes`，没有信号的项写“待人工补充。”。
- draft 不预填 `screenshots`、`recordings`、`systemArtifacts`，也不把 `supportingAutomationSignals` 伪装成人工证据。

验证结果：

- 红灯：`pnpm validate:ios-acceptance-evidence` 先因缺少 `manual-evidence-record.draft.json` 失败。
- 绿灯：补充 draft 生成后，`pnpm validate:ios-acceptance-evidence` 通过。
- `pnpm validate:ios-manual-evidence-record` 通过，证明模板结构校验未被 draft 影响。
- dry-run 抽查 `.tmp/ios-acceptance-evidence/manual-record-draft-dry-run/`：
  - `generatedFromTemplate=manual-evidence-record.template.json`
  - `items.length=13`
  - `voice_input.status=pending`
  - `voice_input.evidence.operatorNotes=待人工补充。`

阶段价值：

这一阶段把人工补证入口从“空模板”推进到“带辅助信号的草稿”。它能减少人工查找证据的成本，同时继续守住边界：自动辅助信号不等于人工验收通过，最终仍必须补真实截图、录屏、接口摘要和系统证据，并通过 completion 模式校验。

## 阶段 136：iOS 系统辅助证据批量采集开关

问题背景：

- iOS 自动证据包已经支持多种系统辅助材料，但每次集中采证都需要手动组合 `--seed-acceptance-facts`、`--capture-calendar-system-app`、`--seed-calendar-cleanup`、`--seed-calendar-permission-denial`、`--seed-notification-click-backflow` 和 `--seed-notification-delivery`。
- 这些能力之间存在依赖，例如系统 Calendar App 截图和日历取消清理都需要验收事实种子；人工拼参数容易漏开依赖项。
- 第一版完成验收前，需要降低重复采证成本，同时不能改变“自动辅助证据不等于人工验收通过”的边界。

完成内容：

- `collect-ios-acceptance-evidence` 新增 `--seed-supported-system-evidence` 参数。
- 同步新增环境变量 `AI_CODE_IOS_ACCEPTANCE_SEED_SUPPORTED_SYSTEM_EVIDENCE=1`。
- 批量开关会一次性启用：
  - 三领域验收事实种子。
  - 系统 Calendar App 辅助截图。
  - 系统日历取消清理辅助证据。
  - 日历权限拒绝降级辅助证据。
  - 通知点击回流辅助证据。
  - 通知 delivered 诊断辅助证据。
- `docs/qa/ios-v1-system-acceptance.md`、`docs/qa/v1-readiness-audit.md`、当前项目状态和工作流边界源稿已同步说明该开关的执行成本和人工验收边界。

验证结果：

- 红灯：`pnpm validate:ios-acceptance-evidence` 先因 `Unsupported argument: --seed-supported-system-evidence` 失败。
- 绿灯：实现 CLI / env 批量开关后，`pnpm validate:ios-acceptance-evidence` 通过，10 个测试全部通过。
- 旁路 subagent 审查未发现阻塞问题；建议补充验收清单文档，本阶段已完成。

阶段价值：

这一阶段把 iOS 系统辅助证据采集从“人工拼多个 opt-in 参数”推进到“一键打开当前全部支持的系统辅助材料”。它减少后续 completion audit 前的采证操作成本，但仍保持 `manualAcceptanceRequired=true`，真实语音、附件、通知展示 / 点击和系统 Calendar 事件详情仍必须人工补证。

## 阶段 137：iOS 系统辅助证据采集根命令

问题背景：

- 上一阶段已经有 `--seed-supported-system-evidence`，但实际执行仍需要记住较长命令 `pnpm collect:ios-acceptance-evidence -- --seed-supported-system-evidence`。
- completion audit 前会多次补采系统辅助材料，命令越短越不容易漏参数。

完成内容：

- 根 `package.json` 新增 `pnpm collect:ios-system-evidence`。
- 该命令等价于 `node scripts/collect-ios-acceptance-evidence.mjs --seed-supported-system-evidence`。
- 采集器参数解析会忽略单独的 `--`，支持 `pnpm collect:ios-system-evidence -- --dry-run --output-dir ...` 这类追加参数形式。
- `validate:native-shells` 已把 `collect:ios-system-evidence` 和 `--seed-supported-system-evidence` 纳入根命令护栏，防止后续误删。
- `docs/qa/ios-v1-system-acceptance.md`、`docs/qa/v1-readiness-audit.md`、当前项目状态和工作流边界源稿已同步推荐新命令。

验证结果：

- 红灯：`pnpm validate:ios-acceptance-evidence` 先因 `packageJson.scripts["collect:ios-system-evidence"]` 缺失失败。
- 红灯：直接运行 `pnpm collect:ios-system-evidence -- --dry-run --output-dir ...` 暴露出 `Unsupported argument: --`。
- 绿灯：补充 `--` 分隔符回归测试和解析兼容后，`pnpm validate:ios-acceptance-evidence` 通过，11 个测试全部通过；新命令 dry-run 成功写出 `.tmp/ios-acceptance-evidence/system-command-dry-run/`；`pnpm validate:native-shells` 通过。

阶段价值：

这一阶段把系统辅助证据集中采集入口从“长参数组合”收束成一个明确命令，方便后续在真实模拟器或真机验收前快速生成同一形态的辅助证据包。

## 阶段 138：iOS 人工补证缺口报告

问题背景：

- `validate-ios-manual-evidence-record` 已经可以阻止空模板或未补齐证据的记录通过 completion 校验。
- 但失败输出主要是逐条错误，人工补证时还需要自己归纳“哪些项目没完成、每项缺什么证据”。
- v1 completion audit 前需要更直接的补证清单，减少在 JSON、summary 和终端错误之间来回查找。

完成内容：

- `validate-ios-manual-evidence-record.mjs` 新增 `buildManualEvidenceRecordReport()`。
- CLI 新增 `--report <path>` 和 `AI_CODE_IOS_MANUAL_EVIDENCE_REPORT=<path>`。
- 报告会生成 Markdown，包含：
  - `acceptanceVerdict`、总项目数、各状态数量、缺失证据总数。
  - 顶层结论缺口，例如 `acceptanceVerdict` 尚未改为 `passed`。
  - 每个未完成项目的 `id`、标题、状态、blocker。
  - 按 `screenshots`、`recordings`、`apiSummaries`、`bridgeMarkers`、`systemArtifacts` 列出的缺失证据。
- `docs/qa/ios-v1-system-acceptance.md`、`docs/qa/v1-readiness-audit.md`、当前项目状态和工作流边界源稿已同步说明 `--report`。

验证结果：

- 红灯：`pnpm validate:ios-manual-evidence-record` 先因缺少 `buildManualEvidenceRecordReport` 导出失败。
- 红灯：旁路审查发现当所有 item 已通过但顶层 `acceptanceVerdict` 未改时，报告会显示“未完成项目：无”，容易误读。
- 绿灯：报告新增“全局缺口”区块后，`node --test scripts/validate-ios-manual-evidence-record.test.mjs` 通过，6 个测试全部通过。
- CLI 实测：`node scripts/validate-ios-manual-evidence-record.mjs --record .tmp/ios-acceptance-evidence/manual-report-dry-run/manual-evidence-record.draft.json --require-complete --report .tmp/ios-acceptance-evidence/manual-report-dry-run/manual-evidence-gaps.md` 会按预期拒绝 pending 草稿，同时写出缺口报告。

阶段价值：

这一阶段把人工补证从“校验失败后看错误列表”推进到“可生成稳定 Markdown 缺口报告”。它不替代人工验收，但能让验收人员按项目补齐证据，并让后续 Agent 从报告中快速判断剩余缺口。

## 阶段 139：iOS 自动采证 HTTP 重试与 live 崩溃修复

问题背景：

- 集中运行 `pnpm collect:ios-system-evidence` 时，真实本地 API 调用曾因 `ECONNRESET` 中断整包采集，但 API `/health` 随后仍正常，属于本地采证链路的瞬时连接抖动。
- 重跑后又暴露通知点击回流 live 路径里的 `Assignment to constant variable`：采集器首次读取 Native 诊断时把 `refresh` 声明为 `const`，随后轮询 pending notification 时需要重新赋值。
- 这两类问题都会让辅助证据包在人工补证前提前失败，降低 completion audit 的采证效率。

完成内容：

- 新增 `scripts/http-retry.mjs`，封装 `fetchWithRetry()`。
- 后端采证脚本中的 `postJson()`、`postEmpty()` 和 `getJson()` 改为通过有限重试访问本地 API。
- 重试只覆盖瞬时连接错误：`ECONNRESET`、`ECONNREFUSED`、`EPIPE`、`ETIMEDOUT` 和 `UND_ERR_SOCKET`；非瞬时错误仍立即抛出。
- 通知点击回流诊断轮询改用可变 `let refresh`，避免真实 live 路径在 pending notification 轮询时崩溃。
- `validate:ios-acceptance-evidence` 新增 HTTP retry 测试，并补充通知点击回流重复刷新回归。

验证结果：

- 红灯：`node --test scripts/http-retry.test.mjs` 先因缺少 `scripts/http-retry.mjs` 失败。
- 红灯：通知点击回流重复刷新回归先捕获 `const refresh = refreshNativeSystemDiagnostics`。
- 绿灯：`pnpm validate:ios-acceptance-evidence` 通过，14 个测试全部通过。
- live 验证：`.tmp/ios-acceptance-evidence/system-live-fixed-20260529-152913/` 已成功写出证据包，H5 / App 目标识别、验收事实种子、系统 Calendar App 截图、日历权限拒绝降级、通知点击回流和通知 delivered 诊断可用，并生成 `manual-evidence-gaps.md`。
- 限制：同一 live 证据包中 `calendarCleanupSeed.available=false`，错误为 seed 日程取消前未被 Native EventKit 诊断看到；这说明系统日历取消清理仍不能视为本轮自动验收完成，后续需继续人工补证或单独排查 Simulator 权限 / EventKit 同步状态。

阶段价值：

这一阶段把自动辅助采证从“本地瞬时网络抖动或 live 分支变量错误就整包失败”推进到“可容忍短暂 API 连接抖动，并能稳定穿过通知回流轮询”。它提升了补证效率，但仍保持人工验收边界：自动证据包不是系统能力验收通过。

## 阶段 140：iOS 自动采证 Calendar 预授权与权限拒绝判定兼容

问题背景：

- `pnpm collect:ios-system-evidence -- --reset-app ...` 仍可能让 `calendarCleanupSeed` 失败，错误为 seed 日程取消前未同步到 EventKit。
- 根因是 Simulator 的 Calendar privacy / TCC 状态不会随 App uninstall / install 自动重置；上一轮 `calendarPermissionDenialSeed` 或手动权限拒绝可能让后续 EventKit 写入保持 denied。
- 同时部分 iOS / Simulator 组合中，即使 Native 已返回“未获得日历权限”的同步错误，`EKAuthorizationStatus` 仍可能显示 `authorized`，导致权限拒绝辅助证据被误判不可用。

完成内容：

- `collect-ios-acceptance-evidence` 新增 `ios.calendarAccessPreparation`。
- 当启用系统 Calendar App 截图或系统日历取消清理时，采集器会先执行 `xcrun simctl privacy <udid> grant calendar com.aiengineeringcode.shell` 并 relaunch App，再创建 seed 事实。
- 权限拒绝场景仍在 cleanup 后单独执行 revoke，验证“后端事实已保存、系统同步降级失败”的路径。
- 新增 `scripts/ios-acceptance-predicates.mjs`，把 `calendarPermissionDenialSeed.available` 的判定调整为以 Native `calendar.lastSyncStatus=failed` 和“日历权限”错误原因为准，不再强依赖 `calendar.authorizationStatus=denied`。
- `docs/qa/ios-v1-system-acceptance.md` 和 `docs/qa/v1-readiness-audit.md` 已补充 Calendar 预授权和权限状态差异说明。

验证结果：

- 红灯：`node --test --test-name-pattern "calendar cleanup seed" scripts/collect-ios-acceptance-evidence.test.mjs` 先因 `ios.calendarAccessPreparation` 缺失失败。
- 红灯：`node --test scripts/ios-acceptance-predicates.test.mjs` 先因缺少 `scripts/ios-acceptance-predicates.mjs` 失败。
- 绿灯：`pnpm validate:ios-acceptance-evidence` 通过，16 个测试全部通过。
- 短 live 验证：`.tmp/ios-acceptance-evidence/calendar-cleanup-pregrant-live-20260529-154310/` 显示 `calendarAccessPreparation.available=true`、`calendarSystemAppEvidence.available=true`、`calendarCleanupSeed.available=true`、取消前 EventKit identifier 存在、取消后 identifier 清除且 `postCancelRemovedEventIdPresent=true`。
- 完整 live 验证：`.tmp/ios-acceptance-evidence/system-pregrant-denial-live-20260529-154919/` 显示 `acceptanceFactSeed`、`calendarSystemAppEvidence`、`calendarCleanupSeed`、`calendarPermissionDenialSeed`、`notificationClickBackflow` 和 `notificationDelivery` 全部 `available=true`；manifest 仍保持 `acceptanceVerdict=not_evaluated`、`manualAcceptanceRequired=true`、`automationCanReplaceManualAcceptance=false`。
- 人工补证报告：同一完整 live 包已写出 `manual-evidence-gaps.md`，继续明确真实系统能力仍需人工补截图、录屏、API 摘要和 bridge marker。

阶段价值：

这一阶段把系统辅助证据根命令从“受旧 Simulator 权限状态影响”推进到“先恢复 Calendar 写入前置条件，再单独验证权限拒绝降级”。它让自动辅助材料更适合作为 completion audit 的输入，同时不改变人工验收门槛。

## 阶段 141：iOS 人工复核证据 review 记录

问题背景：

- 自动证据包已经能生成 `manual-evidence-record.template.json` 和 `manual-evidence-record.draft.json`。
- draft 只把自动辅助信号写进 `operatorNotes`，不会填充 `screenshots`、`apiSummaries`、`bridgeMarkers` 或 `systemArtifacts`。
- 在完整 live 包里，辅助证据已经覆盖 H5 页面截图、后端事实摘要、系统 Calendar App 截图、系统日历取消清理、权限拒绝降级、通知点击回流和通知 delivered 诊断；如果这些材料不进入结构化 evidence 字段，人工复核时仍要手工复制大量路径和摘要。

完成内容：

- 新增 `scripts/manual-evidence-review.mjs`。
- `collect-ios-acceptance-evidence` 现在会额外生成 `manual-evidence-record.review.json`。
- review 文件会把可客观映射的自动辅助材料填入：
  - H5 / Native 启动与地址 marker。
  - 会话 ID、后端事实 API 摘要。
  - H5 七页面截图。
  - 系统 Calendar App 截图、取消清理截图与 bridge marker。
  - 日历权限拒绝截图、Native error marker。
  - 通知 pending / delivered / synthetic 回流相关摘要。
- review 文件不会自动把任何 item 改为 `passed`，也不会改变 `acceptanceVerdict=not_evaluated`。

验证结果：

- 红灯：`node --test scripts/manual-evidence-review.test.mjs` 先因缺少 `scripts/manual-evidence-review.mjs` 失败。
- 绿灯：实现 review 生成后，`pnpm validate:ios-acceptance-evidence` 通过，17 个测试全部通过。
- dry-run 验证：`.tmp/ios-acceptance-evidence/review-dry-run-20260529-155942/` 成功生成 `manual-evidence-record.review.json`，首个 item 仍为 `pending`。
- 既有完整 live 包复用：在 `.tmp/ios-acceptance-evidence/system-pregrant-denial-live-20260529-154919/` 上生成 `manual-evidence-record.review.json` 和 `manual-evidence-review-gaps.md` 后，缺失证据数从 draft 的 81 条降到 42 条；剩余缺口仍集中在必须人工操作的键盘、语音、照片 / 文件 / PDF、真实通知展示和真实通知点击录屏。

阶段价值：

这一阶段把“自动辅助证据已经齐”推进到“人工验收人员可以直接复核结构化 evidence 字段”。它减少复制整理成本，但仍不越过人工验收边界：review 是复核草稿，不是通过结论。

## 阶段 142：iOS 键盘输入辅助证据采集

问题背景：

- `manual-evidence-record.review.json` 已经能整理多类自动辅助材料，但键盘输入项仍基本停留在纯人工补证。
- 真实 Native 输入框、系统键盘弹出和用户实际点击发送仍必须人工截图或录屏；但 H5 / 后端处理 `source=native.composer.keyboard` 的链路可以被自动整理为候选证据。

完成内容：

- `collect-ios-acceptance-evidence` 新增 `--seed-keyboard-input` 和 `AI_CODE_IOS_ACCEPTANCE_SEED_KEYBOARD_INPUT=1`。
- 新增根命令 `pnpm collect:ios-keyboard-evidence`。
- 采集器会向当前 Native 会话注入同形态 `native.inputSubmitted`，payload 使用 `source=native.composer.keyboard`，随后走 H5 `/agent/turns`、确认卡、确认执行和 `/reminders` 读模型闭环。
- 证据包新增 `nativeKeyboardInput`，记录 seed 输入、bridge 入站摘要、确认卡状态、reminder id、截图路径和 `supportingOnly=true`。
- `manual-evidence-record.review.json` 会把 `native-keyboard-input.png`、`reminderId` 和 `source=native.composer.keyboard` 候选 marker 预填到 `keyboard_input` 项，但 item 仍保持 `pending`。
- `docs/qa/ios-v1-system-acceptance.md` 和 `docs/qa/v1-readiness-audit.md` 已补充命令、边界和人工证据要求。

验证结果：

- 红灯：`node --test scripts/collect-ios-acceptance-evidence.test.mjs` 先因 `--seed-keyboard-input` 不支持失败。
- 绿灯：`node --test scripts/manual-evidence-review.test.mjs scripts/collect-ios-acceptance-evidence.test.mjs` 通过，14 个测试全部通过。

阶段价值：

这一阶段把键盘输入从“只能手工整理所有证据”推进到“自动整理 H5 / 后端处理原生键盘来源输入的候选证据”。它减少人工复核成本，但不替代真实 Native 输入框、系统键盘和用户实际发送动作的人工留证。

## 阶段 143：iOS 附件输入辅助证据采集

问题背景：

- 照片、文件和 PDF 附件仍是 iOS v1 人工验收的重要缺口。
- 真实 PhotosPicker、fileImporter、系统权限弹窗、安全作用域文件读取、Vision OCR 和 PDFKit 抽取质量必须人工留证；但 H5 / 后端处理 Native 附件 payload 的链路可以自动整理为候选证据。

完成内容：

- `collect-ios-acceptance-evidence` 新增 `--seed-attachment-inputs` 和 `AI_CODE_IOS_ACCEPTANCE_SEED_ATTACHMENT_INPUTS=1`。
- 新增根命令 `pnpm collect:ios-attachment-evidence`。
- 采集器会向当前 Native 会话注入同形态 `native.inputSubmitted` 附件消息，覆盖：
  - `photo_attachment`：`source=native.composer.attachment.photo`。
  - `file_attachment`：`source=native.composer.attachment.file`。
  - `pdf_text_extraction`：PDF 文本样例。
- H5 会按既有路径调用 `/attachments/upload`，后端写入附件读模型，证据包保存 `native-attachment-inputs.png`。
- `manual-evidence-record.review.json` 会把截图、后端 attachment id 和 source marker 预填到照片、文件、PDF 三个 item，但仍保持 `pending`。
- `docs/qa/ios-v1-system-acceptance.md` 和 `docs/qa/v1-readiness-audit.md` 已补充命令、边界和人工证据要求。

验证结果：

- 红灯：`node --test scripts/manual-evidence-review.test.mjs scripts/collect-ios-acceptance-evidence.test.mjs` 先因 `--seed-attachment-inputs`、根命令和 review 映射缺失失败。
- 绿灯：实现后同一命令通过，15 个测试全部通过。

阶段价值：

这一阶段把照片 / 文件 / PDF 附件从“人工复核前必须手工整理所有 H5 / 后端证据”推进到“自动整理附件 payload、后端读模型和 H5 摘要卡候选证据”。它减少补证整理成本，但不替代真实系统选择器和原生文本抽取质量验收。

## 阶段 144：iOS 原生键盘 UI test 门禁

问题背景：

- `collect:ios-keyboard-evidence` 已经能证明 H5 / 后端处理 `source=native.composer.keyboard` 的辅助链路。
- 但键盘输入的真实 Native TextField、系统键盘弹出、用户输入和发送按钮此前仍只能靠人工截图或录屏，缺少可重复的工程门禁。

完成内容：

- 新增 `AIEngineeringCodeUITests` UI test target，并在共享 scheme 中纳入 TestAction。
- 新增 `NativeKeyboardInputUITests.testNativeKeyboardComposerSubmitsThroughH5Bridge`：
  - 启动 App。
  - 点击 `ai-code.composer.mode-toggle-button`。
  - 聚焦 `ai-code.composer.keyboard-text-field`。
  - 等待系统键盘出现。
  - 输入“明天上午十点提醒我带电脑”。
  - 点击 `ai-code.composer.submit-button`。
  - 在 H5 Bridge Debug 中断言 `source=native.composer.keyboard` 和提交文本。
- 新增根命令 `pnpm validate:ios-keyboard-ui-test`，统一封装 `xcodebuild test`。
- 为 UI test 增加启动参数 `--ai-code-ui-test-disable-system-permission-requests`，让通知 / 日历同步在该测试里只回 ack、不请求系统权限，避免键盘路径被系统弹窗污染。
- `docs/qa/ios-v1-system-acceptance.md`、`docs/qa/v1-readiness-audit.md` 和 `apps/ios/README.md` 已补充命令、覆盖范围和边界。

验证结果：

- 红灯：`pnpm validate:native-shells` 先因缺少 UI test target、脚本、共享 scheme 和测试文件失败。
- 红灯：补入 readiness / manual acceptance 校验后，`pnpm validate:v1-readiness` 和 `pnpm validate:ios-manual-acceptance` 先因文档未包含新命令失败。
- 首次 live UI test 失败在系统通知权限弹窗，证明测试会真实进入 Simulator 交互路径。
- 绿灯：加入 UI test 专用系统权限请求旁路后，`pnpm validate:ios-keyboard-ui-test` 通过，XCTest 执行 1 个测试、0 个失败。

阶段价值：

这一阶段把键盘输入从“synthetic bridge 辅助证据 + 人工截图”推进到“真实 Native 输入框、系统键盘和发送动作可由 Xcode UI test 自动验证”。它仍不替代最终人工验收记录里的截图、接口摘要和验收结论，但显著降低了键盘路径回归风险。

## 阶段 145：iOS 原生键盘到后端提醒事实门禁

问题背景：

- 阶段 144 的 UI test 已能证明真实 Native 输入框、系统键盘和发送按钮把文本送到 H5 Bridge。
- 但第一版 App 的用户价值不止是“Bridge 收到消息”，而是输入后能得到 H5 确认卡、点击确认，并看到后端写入的提醒事实。
- 复用持久 `conversationId` 会让旧待确认卡或旧提醒干扰 UI test；同时 `xcodebuild -only-testing` 在未命中测试时可能返回成功但执行 0 个测试，需要脚本防假阳性。

完成内容：

- `NativeConversationIdentity` 支持 UI test 通过 `AI_CODE_UI_TEST_CONVERSATION_ID` 注入独立会话 ID；普通运行仍使用原来的 `ai-code.native.conversationId` 持久会话。
- `NativeKeyboardInputUITests` 升级为 `testNativeKeyboardComposerConfirmsReminderThroughBackend`：
  - 真实点击 Native composer mode toggle、TextField、系统键盘和发送按钮。
  - 等待 H5 Bridge Debug 出现 `source=native.composer.keyboard` 和提交文本。
  - 等待 H5 确认卡 `请确认执行计划`，点击 `确认`。
  - 断言确认后出现 `已确认执行`、`已创建提醒`、`scheduled` 和“带电脑”提醒事实。
- `pnpm validate:ios-keyboard-ui-test` 默认运行新测试名，并捕获 `xcodebuild` 输出；如果输出里没有实际执行至少 1 个 XCTest，即使命令退出码为 0 也会失败。
- `validate:native-shells` 新增结构护栏，防止测试退回 Bridge-only 断言或移除独立会话注入。
- `apps/ios/README.md`、`docs/qa/ios-v1-system-acceptance.md` 和 `docs/qa/v1-readiness-audit.md` 已更新覆盖范围与边界。

验证结果：

- 红灯：`pnpm validate:native-shells` 先因缺少 `AI_CODE_UI_TEST_CONVERSATION_ID`、新 XCTest 名称和确认后事实断言失败。
- 绿灯：补齐代码后 `pnpm validate:native-shells` 通过。
- live UI test：`pnpm validate:ios-keyboard-ui-test` 在本机 iPhone 16 Pro Max Simulator 上执行 1 个 XCTest、0 个失败，覆盖真实 Native 输入、H5 确认卡点击和后端提醒事实可见。
- 过程中发现一次 `xcodebuild` “成功但 Executed 0 tests”的假阳性；脚本已改为检测实际执行测试数。

阶段价值：

这一阶段把键盘自动门禁从“原生输入进入 H5”推进到“原生输入驱动后端提醒事实闭环”。它仍不替代人工验收中对截图、接口摘要和最终结论的记录，但已经能在工程上防住键盘路径、确认卡路径和提醒事实刷新路径的关键回归。

## 阶段 146：iOS 原生语音到后端提醒事实门禁

问题背景：

- iOS 已经接入真实 `SFSpeechRecognizer` 和麦克风录音路径，但工程门禁此前只能覆盖键盘输入到后端提醒事实闭环。
- 真实麦克风、系统权限弹窗和中文识别质量仍必须人工验收；不过 Native 语音按钮、H5 Bridge、确认卡和后端提醒读模型之间的工程链路可以用 UI test 自动防回归。
- 语音 UI test 需要避免通知 / 日历系统权限弹窗污染输入路径，同时不能让测试注入在普通 App 运行时生效。

完成内容：

- `HybridShellView` 新增 UI test 专用 `AI_CODE_UI_TEST_VOICE_TRANSCRIPT`，且只在 `AI_CODE_UI_TEST_DISABLE_SYSTEM_PERMISSION_REQUESTS=1` 时生效。
- 语音按钮被点击后，UI test 模式会短暂进入录音状态，把 transcript 通过既有 `submitNativeText(..., source: "native.composer.voice")` 提交给 H5；普通运行仍走真实 Speech / Microphone 路径。
- `NativeKeyboardInputUITests` 新增 `testNativeVoiceComposerConfirmsReminderThroughBackend`：
  - 启动独立 `AI_CODE_UI_TEST_CONVERSATION_ID`。
  - 点击 `ai-code.composer.voice-button`。
  - 等待 H5 Bridge Debug 出现 `source=native.composer.voice` 和提交文本。
  - 等待 H5 确认卡 `请确认执行计划`，点击 `确认`。
  - 断言确认后出现 `已确认执行`、`已创建提醒`、`scheduled` 和“带电脑”提醒事实。
- 新增根命令 `pnpm validate:ios-voice-ui-test`，封装 `xcodebuild test` 并检查实际执行至少 1 个 XCTest，避免 0-test 假阳性。
- `validate:native-shells` 新增结构护栏，要求 package script、voice UI test 脚本、环境变量、XCTest 名称、语音按钮标识和 `source=native.composer.voice` 断言都存在。
- `apps/ios/README.md`、iOS 系统能力验收清单、v1 readiness 审计和工作流边界源稿已更新覆盖范围与边界。

验证结果：

- 红灯：`pnpm validate:native-shells` 先因缺少 `validate:ios-voice-ui-test`、脚本文件、`AI_CODE_UI_TEST_VOICE_TRANSCRIPT`、XCTest 名称和语音来源断言失败。
- 绿灯：补齐实现后，`pnpm validate:native-shells` 通过。
- live UI test：`pnpm validate:ios-voice-ui-test` 在本机 iPhone 16 Pro Max Simulator 上执行 1 个 XCTest、0 个失败，覆盖 Native 语音按钮、UI test transcript、H5 确认卡点击和后端提醒事实可见。
- 收紧安全边界后再次验证：`AI_CODE_UI_TEST_VOICE_TRANSCRIPT` 只在 UI test 系统权限旁路开启时生效，重新运行 `pnpm validate:native-shells` 和 `pnpm validate:ios-voice-ui-test` 均通过。

阶段价值：

这一阶段把语音自动门禁从“真实 Speech 路径只能人工验收”推进到“Native 语音入口、H5 确认卡和后端提醒事实闭环可由 Xcode UI test 自动防回归”。它刻意不声称证明真实麦克风权限、真实录音或中文识别质量；这些仍保留在 iOS 人工验收记录中。

## 阶段 147：iOS 原生附件菜单 UI test 门禁

问题背景：

- iOS 附件入口已经接入真实 `PhotosPicker` 和 `fileImporter`，并且 H5 / 后端已有 synthetic 附件 payload 证据。
- 但“用户点击纸夹后是否真的看到选择照片 / 选择文件入口”此前仍主要依赖人工截图，缺少可重复的 Xcode UI test 门禁。
- 真实照片选择、文件选择、安全作用域读取、Vision OCR 和 PDFKit 抽取质量仍必须人工验收；本阶段只自动证明入口和菜单选项可见。

完成内容：

- `NativeKeyboardInputUITests` 新增 `testNativeAttachmentButtonPresentsAttachmentChoices`：
  - 启动独立 `AI_CODE_UI_TEST_CONVERSATION_ID`。
  - 点击 `ai-code.composer.attachment-button`。
  - 断言系统菜单展示“选择附件”“选择照片”“选择文件”和“取消”。
- 新增根命令 `pnpm validate:ios-attachment-ui-test`，封装 `xcodebuild test` 并检查实际执行至少 1 个 XCTest，避免 0-test 假阳性。
- `validate:native-shells` 新增结构护栏，要求 package script、attachment UI test 脚本、XCTest 名称、附件按钮标识和菜单文案断言都存在。
- `apps/ios/README.md`、iOS 系统能力验收清单、v1 readiness 审计和当前项目状态已更新覆盖范围与边界。

验证结果：

- 红灯：`pnpm validate:native-shells` 先因缺少 `validate:ios-attachment-ui-test`、脚本文件、XCTest 名称、附件按钮标识和菜单文案断言失败。
- 绿灯：补齐实现后，`pnpm validate:native-shells` 通过。
- live UI test：`pnpm validate:ios-attachment-ui-test` 在本机 iPhone 16 Pro Max Simulator 上执行 1 个 XCTest、0 个失败，覆盖 Native 纸夹按钮点击和附件菜单选项可见。

阶段价值：

这一阶段把附件入口验收从“只靠人工确认纸夹能打开菜单”推进到“纸夹按钮与照片 / 文件菜单选项可由 Xcode UI test 自动防回归”。它不替代真实 PhotosPicker、fileImporter、权限弹窗、OCR 或 PDFKit 样本质量验收；这些仍保留在 iOS 人工验收记录中。

## 阶段 148：iOS 原生导航 UI test 门禁

问题背景：

- 第一版要求用户能在原生 App 上直接点击使用每个功能页面，现有 H5 七页面截图主要来自 synthetic `native.viewChanged` 注入。
- iOS Header / Drawer 已能发送 `native.viewChanged`，但此前缺少 Xcode UI test 证明真实原生按钮可以驱动 H5 页面切换。
- 如果不补这条门禁，容易出现“按钮存在、截图存在，但真实用户点击无法切到对应 H5 surface”的回归。

完成内容：

- `HybridShellView` 为 Header 菜单、Timeline、执行记录、日历、主题按钮，以及 Drawer 七个 quick-switch 和关闭按钮补稳定 accessibility identifiers。
- `NativeKeyboardInputUITests` 新增 `testNativeHeaderAndDrawerNavigateH5Surfaces`：
  - 真实点击 Header 的 Timeline、执行记录、日历和菜单按钮。
  - 打开 Drawer 后依次点击对话、Timeline、日程、费用、提醒、执行记录和设置入口。
  - 每次都断言 Native Drawer 标题可见，并在 H5 Bridge Debug 中看到真实 `source=native.header.*` 或 `source=native.drawer.quick-switch` 与 `view=<surface>`。
- 新增根命令 `pnpm validate:ios-navigation-ui-test`，封装 `xcodebuild test` 并检查实际执行至少 1 个 XCTest，避免 0-test 假阳性。
- `validate:native-shells` 新增结构护栏，要求 package script、navigation UI test 脚本、XCTest 名称、Header / Drawer 可访问性标识和 drawer quick-switch 来源断言都存在。
- `apps/ios/README.md`、iOS 系统能力验收清单、v1 readiness 审计和当前项目状态已更新覆盖范围与边界。

验证结果：

- 红灯：`pnpm validate:native-shells` 先因缺少 `validate:ios-navigation-ui-test`、脚本文件、Header / Drawer accessibility identifiers、XCTest 名称和 drawer 来源断言失败。
- 绿灯：补齐实现后，`pnpm validate:native-shells` 通过。
- live UI test：`pnpm validate:ios-navigation-ui-test` 在本机 iPhone 16 Pro Max Simulator 上执行 1 个 XCTest、0 个失败，覆盖真实 Native Header / Drawer 点击到 H5 七页面切换。

阶段价值：

这一阶段把“原生 App 每个功能入口可点击”的验收从 H5 synthetic 截图推进到真实 iOS UI test 门禁。它不替代人工页面截图、长列表滚动、真实业务数据和最终验收结论，但能防住原生导航按钮、WKWebView Bridge 和 H5 surface 切换之间的关键回归。

## 阶段 149：iOS 原生导航结构化人工证据记录

问题背景：

- 阶段 148 已经把真实 Header / Drawer 点击纳入 Xcode UI test 门禁，但自动证据包里的结构化人工补证记录还没有独立的导航条目。
- 如果 `manual-evidence-record.template.json` 不要求补原生导航截图、Bridge marker 和 UI test 输出，最终验收时容易只看到 H5 七页面截图，却漏掉“真实原生入口是否可点击”的证据。
- 这类证据必须保持人工复核边界：自动脚本可以整理候选截图和 marker，但不能自动把页面体验判定为通过。

完成内容：

- `collect:ios-acceptance-evidence` 的 `manualEvidenceStillRequired` 新增“原生导航 / 页面切换”。
- `manual-evidence-record.template.json` 和 `manual-checklist.todo.md` 新增稳定 `record_id: navigation_surfaces`。
- `navigation_surfaces` 要求补充：
  - Header Timeline 切换截图。
  - Drawer 设置切换截图。
  - H5 七页面切换截图或录屏。
  - `source=native.header.timeline`、`source=native.drawer.quick-switch`、`view=timeline`、`view=settings`。
  - `pnpm validate:ios-navigation-ui-test` 输出或 xcresult。
- `manual-evidence-record.review.json` 会把已采集的 H5 七页面截图预填为候选证据，并保留 `status=pending` 与“候选证据不等于人工验收通过”的结论提醒。
- iOS 系统能力验收清单已补充 `navigation_surfaces` 的结构化记录说明。

验证结果：

- 红灯：新增测试先因找不到 `navigation_surfaces` 失败。
- 绿灯：补齐采证模板和 review 预填后，`node --test scripts/collect-ios-acceptance-evidence.test.mjs` 通过。

阶段价值：

这一阶段把“原生导航 UI test 已存在”推进到“最终人工验收记录也会强制收集对应证据”。它让自动门禁、证据包和 completion audit 的字段对齐，降低 iOS v1 收尾时漏补原生导航证据的风险。

## 阶段 150：v1 completion audit 统一归档入口

问题背景：

- v1 readiness audit 已经列出自动化门禁、人工证据缺口和完成判定门槛，但此前缺少一个固定命令把这些结果沉淀成单一收尾产物。
- 如果最终验收只靠聊天记录或零散命令输出，很容易出现“部分命令跑过、人工记录未绑定、goal 是否 complete 缺少证据”的问题。
- completion audit 必须严格区分自动化命令、人工证据记录和外部知识库同步状态，不能因为生成了报告就把目标标记为完成。

完成内容：

- 新增 `scripts/collect-v1-completion-audit.mjs`。
- 新增根命令 `pnpm collect:v1-completion-audit`。
- 默认模式生成 `v1-completion-audit.json` 和 `v1-completion-audit.md`，列出必跑自动化命令、人工证据记录状态、缺口和 goal 是否可 complete；默认不跑重型命令。
- 正式收尾模式支持 `--run-automated-commands --manual-record <path>`，会重新运行自动化命令，并用 `validateManualEvidenceRecord(..., requireComplete=true)` 校验补证后的人工记录。
- v1 readiness audit 已把该命令纳入完成判定门槛，要求正式收尾时归档同一份 completion audit 产物。

验证结果：

- 红灯：`node --test scripts/collect-v1-completion-audit.test.mjs` 先因缺少模块失败。
- 绿灯：实现脚本和 package 命令后，`node --test scripts/collect-v1-completion-audit.test.mjs` 通过。

阶段价值：

这一阶段把“完成标准写在文档里”推进到“完成审计有固定机器产物”。它不会替代人工证据，也不会默认执行耗时门禁；它的价值是让最终收尾时的证据路径、命令状态和 complete 判定可复查、可归档。

## 阶段 151：v1 completion audit 覆盖证据工具与 native-shells 护栏

问题背景：

- 阶段 150 已经新增 completion audit 统一归档入口，但初版自动化命令清单更偏产品主链路，尚未显式覆盖 iOS 自动证据包测试和 `validate:native-shells` 总护栏。
- 最终 completion audit 如果漏掉 `validate:ios-acceptance-evidence`，可能无法发现证据包、人工 review 预填、HTTP retry 或权限判定逻辑回归。
- 如果漏掉 `validate:native-shells`，可能无法发现原生壳关键入口、UI test 根命令或采证命令结构被误删。

完成内容：

- `collect-v1-completion-audit` 的 `requiredAutomatedCommands` 新增：
  - `pnpm validate:ios-acceptance-evidence`
  - `pnpm validate:native-shells`
- `docs/qa/v1-readiness-audit.md` 的自动化证据表新增对应两行，并把它们加入下一步最终门禁清单。
- `scripts/validate-v1-readiness.mjs` 增加对这两个命令的文本护栏。
- `collect-v1-completion-audit.test.mjs` 先以失败测试暴露命令缺口，再补实现。

验证结果：

- 红灯：`node --test scripts/collect-v1-completion-audit.test.mjs` 先因缺少 `validate:ios-acceptance-evidence` 失败。
- 绿灯：补齐 audit 命令清单后，同一测试通过。

阶段价值：

这一阶段让 completion audit 更接近真实收尾需要：不仅验证产品主链路，也验证“证据生成工具”和“原生壳结构护栏”本身仍可信，降低最终验收时工具链悄悄退化的风险。

## 阶段 152：native-shells 守住 v1 completion audit 入口

问题背景：

- v1 completion audit 已经成为最终收尾的统一归档入口，但 `validate:native-shells` 还没有直接检查这个根命令和脚本文件。
- 如果后续整理 package scripts 或采证脚本时误删 `collect:v1-completion-audit`，只靠人工阅读 readiness 文档不够稳。
- 原生壳收尾相关的总护栏应该同时守住 UI test、采证脚本和 completion audit 入口。

完成内容：

- 新增 `scripts/validate-native-shells.test.mjs`。
- `pnpm validate:native-shells` 改为先运行该测试，再运行原有 `scripts/validate-native-shells.mjs`。
- `validate-native-shells.mjs` 新增对以下内容的结构检查：
  - `collect:v1-completion-audit`
  - `scripts/collect-v1-completion-audit.mjs`
  - `scripts/collect-v1-completion-audit.test.mjs`

验证结果：

- 红灯：新增测试先因 `validate:native-shells` 未包含测试命令而失败。
- 绿灯：补齐 package script 和 validator 检查后，`node --test scripts/validate-native-shells.test.mjs` 通过。

阶段价值：

这一阶段把 completion audit 从“有命令”推进到“被原生壳总护栏守住”。后续如果有人删掉审计入口或测试入口，`pnpm validate:native-shells` 会直接失败，减少 v1 收尾工具链被误拆的风险。

## 阶段 153：completion audit 归档人工补证缺口报告

问题背景：

- v1 completion audit 已经能绑定人工证据记录，但初版只把缺口摘要写进 `v1-completion-audit.md`，没有把完整 `buildManualEvidenceRecordReport()` 输出作为同包 artifact 保存。
- 最终补证时，人工验收记录、completion audit 和 `manual-evidence-gaps.md` 如果分散在不同命令输出里，后续复查容易漏掉当时仍缺哪些截图、录屏、API 摘要、bridge marker 或系统证据。
- 收尾工具链需要做到“一个审计目录能解释为什么还不能 complete，或为什么可以 complete”。

完成内容：

- `writeV1CompletionAudit()` 在提供 `manualRecord` 或 `--manual-record <path>` 时，会在审计输出目录额外写入 `manual-evidence-gaps.md`。
- `v1-completion-audit.json` / `.md` 的 `manualEvidence.reportPath` 记录该报告路径。
- `collect-v1-completion-audit.test.mjs` 新增断言，覆盖人工记录输入时自动归档缺口报告。
- `validate:native-shells` 的结构护栏新增 `manual-evidence-gaps.md` 和 `manualEvidenceReportPath` 检查，避免后续误删该归档能力。
- `docs/qa/ios-v1-system-acceptance.md` 和 `docs/qa/v1-readiness-audit.md` 已补充 completion audit 同目录归档说明。

验证结果：

- 红灯：`node --test scripts/collect-v1-completion-audit.test.mjs` 先因缺少 `manualEvidenceReportPath` 失败。
- 绿灯：补齐报告写入和路径记录后，同一测试通过。
- 红灯：`node --test scripts/validate-native-shells.test.mjs` 先因 validator 未守住 `manual-evidence-gaps.md` 失败。
- 绿灯：补齐 validator 检查后，同一测试通过。

阶段价值：

这一阶段把 completion audit 从“能指出缺口”推进到“能把完整补证缺口报告随审计包归档”。后续正式收尾时，自动化命令结果、人工证据记录、缺口报告和 goal complete 判定会更容易一起复查。

## 阶段 154：completion audit 结构化外部知识库同步状态

问题背景：

- 项目协议要求：如果未实际执行飞书或 Obsidian 同步，最终回复必须明确“仓库已更新，外部知识库未同步”。
- readiness 文档和当前项目状态已经有中文声明，但 completion audit JSON 还没有机器可读字段表达外部知识库同步状态。
- 如果最终审计包只记录自动化命令和人工验收，容易把“仓库源稿已更新”和“外部知识库已同步”混在一起。

完成内容：

- `collect-v1-completion-audit` 新增 `externalKnowledgeSync` 字段，默认记录：
  - `status=not_synced`
  - `sourceDraftsUpdated=true`
  - `sourceDraftPaths`
  - Feishu / Obsidian target 状态
  - `syncEvidence`
  - 最终披露文案“仓库已更新，外部知识库未同步”
- CLI 新增：
  - `--external-knowledge-status not_synced|synced|partial|unknown`
  - `--source-draft <path>`
  - `--feishu-sync-evidence <path-or-command-log>`
  - `--obsidian-sync-evidence <path-or-note>`
  - `--external-knowledge-synced`
  - `--external-knowledge-note <text>`
- `validate:native-shells` 守住 `externalKnowledgeSync` 和 `--external-knowledge-status`。
- `validate:v1-readiness` 守住 readiness 文档中的 `externalKnowledgeSync` 和 `--external-knowledge-status`。

验证结果：

- 红灯：`node --test scripts/collect-v1-completion-audit.test.mjs` 先因缺少 `externalKnowledgeSync` 失败。
- 绿灯：补齐字段、默认状态和 CLI 参数后，同一测试通过。
- 红灯：`node --test scripts/validate-native-shells.test.mjs` 先因 validator 未守住 `externalKnowledgeSync` 失败。
- 绿灯：补齐 validator 检查后，同一测试通过。
- 红灯：`pnpm validate:v1-readiness` 先因 readiness 文档未包含新字段失败。
- 绿灯：补齐 readiness 文档后重新通过。

阶段价值：

这一阶段把“外部知识库是否同步”从最终回复里的人工提醒，推进到 completion audit 的结构化证据字段。后续收尾时，即使没有实际同步飞书或 Obsidian，审计包也会明确记录未同步状态和必须披露的文案，避免把仓库源稿更新误说成外部知识库已同步。

## 阶段 155：completion audit 自动选择人工证据记录

问题背景：

- iOS 自动证据包会生成多轮 `manual-evidence-record.review.json`、`manual-evidence-record.draft.json`，最终人工补证还可能生成 `manual-evidence-record.filled.json`。
- 旧的 completion audit 必须手动传入精确 `<path>`，在 `.tmp/ios-acceptance-evidence` 多个 run 并存时容易选错记录或误用旧缺口报告。
- 需要让正式收尾命令能自动选择当前最合适的人工记录，同时仍保持“review / draft 不能替代人工验收”的完成门槛。

完成内容：

- `collect-v1-completion-audit` 新增 `--manual-record best|latest` 和 `--manual-record-root <dir>`。
- `best` 会递归扫描 root 下的 `manual-evidence-record.filled.json`、`manual-evidence-record.review.json` 和 `manual-evidence-record.draft.json`，优先选择 `--require-complete` 校验通过的记录；未通过时按缺口更少、类型优先级更高、更新时间更近选择候选。
- 审计 JSON 的 `manualEvidence.selection` 记录策略、root、候选数量、选中路径、选中记录缺口数和 completion 校验状态。
- `validate:native-shells` 增加 `manual-record-root`、`manualRecordStrategies` 和 `manual-record best` 结构护栏，防止自动选择入口被误删。
- `docs/qa/v1-readiness-audit.md` 和 `docs/qa/ios-v1-system-acceptance.md` 已把正式收尾示例更新为可使用 `--manual-record best --manual-record-root .tmp/ios-acceptance-evidence`。

验证结果：

- 红灯：`node --test scripts/collect-v1-completion-audit.test.mjs` 先因 CLI 不支持 `--manual-record-root` / 无法生成 audit 失败。
- 绿灯：补齐递归扫描、排序选择和 `manualEvidence.selection` 后，同一测试通过。
- 红灯：`node --test scripts/validate-native-shells.test.mjs` 先因 validator 未守住 `manual-record-root` 失败。
- 绿灯：补齐 validator 检查后，同一测试通过。

阶段价值：

这一阶段把 completion audit 从“必须手动找记录路径”推进到“可以自动选出当前证据最完整的人工记录”。它减少了最终收尾的人为操作成本，但不降低完成门槛：只有自动化命令全部通过且选中的人工记录通过 completion 校验时，audit 才能给出 `passed`。

## 阶段 156：completion audit Markdown 展示选择依据

问题背景：

- `manualEvidence.selection` 已经写入 `v1-completion-audit.json`，但 Markdown 报告只展示人工证据记录状态，没有展示 `best` / `latest` 为什么选中某个记录。
- 最终收尾时，人通常先读 `v1-completion-audit.md`，如果选择依据只在 JSON 里，复查成本仍然偏高。
- 需要让审计包的人读入口也明确记录候选数量、选中路径和选中记录是否通过 completion 校验。

完成内容：

- `markdownForAudit()` 在存在 `manualEvidence.selection` 时新增“人工证据记录选择”小节。
- 小节展示 `strategy`、`root`、`candidateCount`、`validCandidateCount`、`selectedRecordPath`、`selectedMissingEvidenceCount` 和 `selectedRequireCompletePassed`。
- 下一步提示补充 `--manual-record best --manual-record-root .tmp/ios-acceptance-evidence`。
- `validate:native-shells` 守住“人工证据记录选择”字符串，防止 Markdown 可读入口被误删。

验证结果：

- 红灯：`node --test scripts/collect-v1-completion-audit.test.mjs` 先因 Markdown 缺少“人工证据记录选择”失败。
- 绿灯：补齐 Markdown 小节后，同一测试通过。
- 红灯：`node --test scripts/validate-native-shells.test.mjs` 先因 validator 未守住“人工证据记录选择”失败。
- 绿灯：补齐 validator 检查后，同一测试通过。

阶段价值：

这一阶段把自动选择记录的证据从“机器可读”推进到“人可复查”。最终 completion audit 不仅能在 JSON 里说明选了哪份记录，也能在 Markdown 报告里直接展示选择依据，减少收尾沟通和人工复查成本。

## 阶段 157：completion audit 人工证据 HEAD 新鲜度

问题背景：

- `manual-evidence-record.review.json`、`manual-evidence-record.draft.json` 和后续人工 filled 记录都来自某一次 iOS 证据包采集。
- 如果当前代码已经继续变化，旧 HEAD 下采到的人工记录即使字段齐全，也不能证明当前代码状态已经通过验收。
- 自动选择 `--manual-record best` 降低了找文件成本，但也必须防止选中旧 run 后让 completion audit 误判完成。

完成内容：

- `collect-v1-completion-audit` 新增 `manualEvidence.packageFreshness`。
- 审计会读取人工记录自身的 `headSha`，必要时读取同目录 `manifest.json` 的 `headSha`，并与当前 `git rev-parse --short HEAD` 对比。
- 当记录 HEAD 和当前 HEAD 不一致时，`packageFreshness.status=stale`，最终 `verdict` 必须保持 `not_complete`。
- Markdown 报告会展示 `packageFreshness`、`recordHeadSha` 和 `currentHeadSha`，完成判定区也会明确说明旧 HEAD 证据不能证明当前代码状态。
- `validate:native-shells` 和 `validate:v1-readiness` 已守住 `packageFreshness` 与旧 HEAD 判定说明。

验证结果：

- 红灯：`node --test scripts/collect-v1-completion-audit.test.mjs` 先用旧 `headSha=old1234` 的人工记录验证 audit 仍错误返回 `passed`。
- 绿灯：补齐 `packageFreshness` 和 stale 阻断后，同一测试通过。
- 红灯：`node --test scripts/validate-native-shells.test.mjs` 先因 validator 未守住 `packageFreshness` 失败。
- 绿灯：补齐 validator 检查后，同一测试通过。
- 红灯：`pnpm validate:v1-readiness` 先因 readiness 文档未声明旧 HEAD 门槛失败。
- 绿灯：补齐 readiness 文档后重新通过。

阶段价值：

这一阶段把 completion audit 从“证据字段齐全即可复查”推进到“证据必须属于当前代码状态”。后续正式收尾时，即使自动选择找到了缺口最少的记录，只要它来自旧 HEAD，audit 也会保持 `not_complete`，迫使我们重新采证或明确补证当前版本。

## 阶段 158：当前 HEAD iOS 辅助证据包刷新

问题背景：

- 上一轮 completion audit 已经能识别旧 HEAD 证据包，并把 `.tmp/ios-acceptance-evidence/system-pregrant-denial-live-20260529-154919/` 标记为 `packageFreshness.status=stale`。
- 如果继续用旧包，审计会被版本新鲜度阻塞，无法准确反映当前代码 `d474ea4` 的真实剩余缺口。
- 需要在当前 HEAD 下重新采集自动辅助证据，并确认 `--manual-record best` 会选择新包。

完成内容：

- 运行 `pnpm collect:ios-acceptance-evidence -- --seed-supported-system-evidence --seed-keyboard-input --seed-attachment-inputs --output-dir .tmp/ios-acceptance-evidence/current-head-full-supporting-20260529`。
- 新证据包写出：
  - `manifest.json`
  - `manual-evidence-record.review.json`
  - H5 七页面截图
  - 系统 Calendar App 截图
  - 系统日历取消前后截图
  - 日历权限拒绝截图
  - 通知点击回流截图
  - 键盘输入辅助截图
  - 附件输入辅助截图
- `manifest.headSha` 和 `manual-evidence-record.review.json.headSha` 均为 `d474ea4`。
- 运行 `node scripts/validate-ios-manual-evidence-record.mjs --record .tmp/ios-acceptance-evidence/current-head-full-supporting-20260529/manual-evidence-record.review.json --require-complete --report .tmp/ios-acceptance-evidence/current-head-full-supporting-20260529/manual-evidence-gaps.md` 生成当前包缺口报告。
- 运行 `pnpm collect:v1-completion-audit -- --manual-record best --manual-record-root .tmp/ios-acceptance-evidence --output-dir .tmp/v1-completion-audit/current-best-after-current-head-20260529 --external-knowledge-status not_synced`，确认自动选择新包。

验证结果：

- 新 completion audit 的 `manualEvidence.selection.selectedRecordPath` 指向 `.tmp/ios-acceptance-evidence/current-head-full-supporting-20260529/manual-evidence-record.review.json`。
- `manualEvidence.packageFreshness.status=current`，`recordHeadSha=currentHeadSha=d474ea4`。
- `manualEvidence.missingEvidenceCount=33`，比上一轮旧包的 42 条缺口少 9 条。
- `verdict=not_complete`，原因是 review 记录仍保持 `acceptanceVerdict=not_evaluated`，且真实系统能力人工证据仍未全部补齐。

阶段价值：

这一阶段把收尾状态从“旧 HEAD 证据不能用”推进到“当前 HEAD 有最新自动辅助证据，剩余缺口明确为人工系统能力补证”。后续重点不再是重新采自动辅助材料，而是补真实语音、通知、Photos / Files / PDF 选择器、系统 Calendar 详情等人工验收记录，并生成通过 `--require-complete` 的 filled 记录。

## 阶段 159：completion audit 优先选择当前 HEAD 证据

问题背景：

- `manualEvidence.packageFreshness` 已经能阻止旧 HEAD 证据让 audit 通过。
- 但 `--manual-record best` 的排序仍先看 completion 状态和缺口数，导致旧包如果缺口更少，会被选中后再因 stale 阻塞。
- 对正式收尾来说，`best` 应该先回答“哪份证据属于当前代码”，再回答“哪份证据缺口最少”。

完成内容：

- `manual-evidence-review` 增强客观证据映射：
  - H5 七页面截图会汇总映射到“`H5 七页面切换截图或录屏`”。
  - 附件样本 `kind` 会映射为 `attachmentKind=image|text|pdf` bridge marker。
- `collect-v1-completion-audit` 的候选记录会记录：
  - `recordHeadSha`
  - `freshnessStatus`
  - `freshnessRank`
- `best` 排序现在优先选择当前 HEAD 证据；只有新鲜度相同时，才比较 completion 是否通过、缺口数、文件类型优先级和更新时间。
- `manualEvidence.selection` 新增 `selectedRecordFreshnessStatus` 和 `selectedRecordHeadSha`，便于 Markdown / JSON 复查为什么选中某个记录。

验证结果：

- 红灯：新增单测先证明“旧 HEAD passed 记录”会压过“当前 HEAD pending 记录”。
- 绿灯：补齐 freshness rank 后，同一测试通过。
- `pnpm validate:ios-acceptance-evidence` 通过 19 项测试。
- `pnpm collect:v1-completion-audit -- --manual-record best --manual-record-root .tmp/ios-acceptance-evidence --output-dir .tmp/v1-completion-audit/current-best-prefers-current-head-20260529 --external-knowledge-status not_synced` 显示当前 HEAD 记录被优先选中，`packageFreshness.status=current`。

阶段价值：

这一阶段把 `best` 从“全局缺口最少”修正为“当前代码下最适合收尾”。旧证据包仍可作为历史参考，但不会再因为缺口更少而遮住当前版本的真实验收状态。

## 阶段 160：iOS 验收事实费用 seed 稳定化

问题背景：

- 当前 HEAD 完整采证时，`acceptanceFactSeed.available=false`。
- 进一步检查发现 calendar / reminder seed 都成功，expense seed 返回了 `clarification_request`。
- 根因是费用输入被拼成 `把昨天 58 元seed_...验收打车票报销`，金额单位和 seed 标记粘在一起，规划器可能无法稳定识别金额。
- acceptance fact seed 不可用会连带阻断系统 Calendar App 截图和日历取消清理辅助证据，因为它们依赖 seed 日程。

完成内容：

- 将费用 seed 输入改为 `把昨天 {seedRunId} 验收打车票 58 元报销`。
- 新增测试，守住 `acceptanceFactSeed.inputs` 中不再出现 `58 元seed_` 这类粘连格式。

验证结果：

- 红灯：`node --test scripts/collect-ios-acceptance-evidence.test.mjs` 先因费用 seed 仍包含 `58 元seed_` 失败。
- 绿灯：调整文案后，同一测试通过。

阶段价值：

这一阶段修复了自动采证链路的一个隐性不稳定点。后续完整当前 HEAD 采证时，三领域验收事实 seed 更可能全部成功，系统日历相关辅助证据也能继续生成，而不是被费用 seed 的追问路径误伤。

## 阶段 161：系统日历取消清理 review 证据分类修正

问题背景：

- 最新 current HEAD 证据包中，`calendarCleanupSeed.available=true`，且已记录 `canceledEvent.status=canceled`、`postCancelStatus=canceled`、`calendar.removedEventIds` 和系统 Calendar 取消后截图。
- 但 `manual-evidence-record.template.json` 把“后端 canceled 状态”放在 `screenshots` 要求里，导致 completion audit 的缺口报告把一个 API / 后端读模型事实误报为截图缺口。
- 这会增加人工补证噪音，也让 `system_calendar_cleanup` 的剩余真实缺口不够清晰。

完成内容：

- 将“后端 canceled 状态”从 `system_calendar_cleanup.requiredEvidence.screenshots` 移到 `apiSummaries`。
- `manual-evidence-review` 现在会从 `calendarCleanupSeed.canceledEvent.status` 或 `postCancelStatus` 预填 `后端 canceled 状态: eventId=..., status=canceled`。
- `systemArtifacts` 仍保留 `iOS 系统日历事件消失截图`，`screenshots` 仍保留 `H5 日程取消动作`，避免把自动辅助证据误当作人工验收通过。

验证结果：

- 红灯：新增 `manual-evidence-review.test.mjs` 断言后，同一测试先因缺少 `后端 canceled 状态` API 摘要失败。
- 绿灯：补齐 review 映射和模板分类后，`node --test scripts/manual-evidence-review.test.mjs` 通过。
- 回归：`node --test scripts/collect-ios-acceptance-evidence.test.mjs` 通过 16 项测试。

阶段价值：

这一阶段没有改变人工验收边界，但把 completion audit 的缺口分类拉回真实语义：后端 canceled 是 API 摘要，H5 取消动作才是截图缺口。后续补证时可以更快聚焦真实需要人工操作的材料。

## 阶段 162：会话持久 ID 重启前后截图辅助采证

问题背景：

- `conversation_persistence` 已经通过 Native `UserDefaults` 读取到 `beforeRelaunch` 和 `afterRelaunch`，并能证明二者相同。
- 但人工证据记录仍缺“重启前 conversationId”和“重启后 conversationId”截图，导致 completion audit 把该项保留为缺证据。
- 采证器本来就在同一流程中执行 `simctl terminate` / `simctl launch`，可以在真实重启前后顺手保存 Simulator 截图，减少人工找时机截图的成本。

完成内容：

- `collectConversationPersistence()` 新增：
  - `beforeRelaunchScreenshotPath`
  - `afterRelaunchScreenshotPath`
  - `screenshotBeforeRelaunch` 命令
  - `screenshotAfterRelaunch` 命令
- 真实采证时会写出：
  - `conversation-before-relaunch.png`
  - `conversation-after-relaunch.png`
- dry-run 也会展示将执行的 `simctl io ... screenshot` 命令，便于测试和命令形状复查。
- `manual-evidence-review` 会把这两张截图预填为：
  - `重启前 conversationId: ...`
  - `重启后 conversationId: ...`

验证结果：

- 红灯：新增测试后，`manual-evidence-review.test.mjs` 先因截图未映射失败，`collect-ios-acceptance-evidence.test.mjs` 先因截图路径和命令不存在失败。
- 绿灯：实现采证字段、截图命令和 review 映射后，两组测试通过。

阶段价值：

这一阶段把会话持久 ID 从“只有 plist/API 文本证据”推进为“重启前后也有可归档截图”。它仍不自动把人工项标记为 `passed`，但能让人工复核人员直接看到当前 run 的重启前后截图路径和同一个 `conversation_ios_*` 值。

## 阶段 163：验收事实 H5 确认卡辅助采证

问题背景：

- 三领域 `acceptanceFactSeed` 已经能通过真实后端 `/agent/turns` 和 `/execution-plans/{id}/confirm` 写入日程、费用和提醒事实。
- 但该 seed 是 API 直提交，不经过 H5 确认卡渲染，导致 `system_calendar_write` 缺“日程确认卡”，`local_notification` 缺“提醒确认卡”。
- 这些确认卡是用户可见执行前确认的关键证据；如果只保留确认后的日历 / 提醒页截图，会缺少“用户看到并确认了什么”的上下文。

完成内容：

- `acceptanceFactSeed` 新增 `confirmationScreenshots.calendar` 和 `confirmationScreenshots.reminder`：
  - `acceptance-calendar-confirmation-card.png`
  - `acceptance-reminder-confirmation-card.png`
- 采证语义保持克制：
  - API seed 仍负责创建 pending plan 和最终确认写入事实。
  - calendar / reminder seed 在确认前打开同一 `conversationId` 的 H5 native 页面。
  - H5 通过 pending confirmation 恢复渲染确认卡。
  - H5 确认卡 DOM 暴露 `data-plan-id` 和 `data-confirmation-id`。
  - Playwright 优先使用 `data-plan-id` 定位目标卡，保留 `article` + `seedRunId` + “确认”按钮作为 fallback，避免误截长期脏会话中的旧 pending 卡，也兼容日程标题被规划器归一化后不显示 seed 标记的情况。
- `manual-evidence-review` 会把：
  - calendar 截图预填到 `system_calendar_write.evidence.screenshots` 的“日程确认卡”。
  - reminder 截图预填到 `local_notification.evidence.screenshots` 的“提醒确认卡”。
- review item 仍保持 `pending`，不会因为自动候选证据存在而自动通过。

验证结果：

- 红灯：`node --test scripts/manual-evidence-review.test.mjs scripts/collect-ios-acceptance-evidence.test.mjs` 先因缺少 `confirmationScreenshots` 字段和 review 映射失败。
- 绿灯：补齐字段、H5 截图 helper 和 review 映射后，同一测试通过。
- 回归：`pnpm validate:ios-acceptance-evidence` 通过 21 项测试。
- 回归：`pnpm validate:native-shells` 通过。
- 静态检查：`node --check scripts/manual-evidence-review.mjs && node --check scripts/collect-ios-acceptance-evidence.mjs && git diff --check` 通过。
- live 采证验证：`acceptanceFactSeed.available=true`，`acceptance-calendar-confirmation-card.png` 和 `acceptance-reminder-confirmation-card.png` 均真实生成。
- completion audit 验证：新证据包可被 `--manual-record best` 选中，人工补证缺口收敛到 26，`verdict=not_complete`。

阶段价值：

这一阶段把三领域 seed 从“后端事实写入可证”推进到“关键确认卡也有 H5 可见截图”。它减少了日程写入和本地通知两项的人工补证噪音，但边界不变：这些截图不能证明真实 Native 键盘或语音输入，也不能替代通知权限弹窗、系统通知截图、系统 Calendar 事件详情和人工复核结论。

## 阶段 164：H5 日程取消动作辅助采证

问题背景：

- `system_calendar_cleanup` 已经能通过后端 canceled 状态和系统 Calendar App 前后截图证明取消结果。
- 但此前自动流程主要是直接调用取消 API，不能证明用户在 H5 日程行内点击了“取消”。
- 页面里还有确认卡、编辑弹层、提醒和费用等多个同名“取消”按钮，需要稳定定位到目标日程行，避免长期脏会话误点旧按钮。

完成内容：

- H5 summary row 新增 `data-summary-item-id={item.id}`。
- H5 行内 action 新增：
  - `data-summary-action-type={action.type}`
  - `data-summary-action-target-id={action.targetId ?? item.id}`
- `calendarCleanupSeed` 改为打开同一 `conversationId` 的 H5 native 页面，切到 calendar surface，按 seed 日程 ID 定位目标行，再点击 `calendar.cancel`。
- 点击成功后采证器保存 `calendar-cleanup-h5-cancel-action.png`，并继续校验后端 canceled 状态。
- `manual-evidence-review` 会把截图预填到 `system_calendar_cleanup` 的“`H5 日程取消动作`”。

验证结果：

- 红灯：新增测试后，`manual-evidence-review.test.mjs` 先因缺少 H5 取消动作映射失败，`collect-ios-acceptance-evidence.test.mjs` 先因缺少 H5 selector 和截图字段失败。
- 绿灯：补齐 H5 data 属性、H5 点击采证 helper 和 review 映射后，同一测试通过。
- 回归：`pnpm validate:ios-acceptance-evidence` 通过。
- 回归：`pnpm validate:native-shells` 通过。
- 静态检查：`pnpm --filter @ai-code/h5 typecheck`、`node --check scripts/manual-evidence-review.mjs && node --check scripts/collect-ios-acceptance-evidence.mjs && git diff --check` 通过。

阶段价值：

这一阶段把“日程取消结果可证”推进到“用户可见 H5 行内取消动作也可证”。它仍只生成 review 候选证据，不自动把 `system_calendar_cleanup` 改为 `passed`；人工仍需复核截图质量、系统 Calendar App 消失结果和最终验收结论。

## 阶段 165：H5 calendar focus 稳定化

问题背景：

- 当前长期会话中可能残留大量历史日程，H5 日程页为了保持紧凑只展示最近 6 条。
- `calendarCleanupSeed` 的 seed 日程虽然已写入后端并同步到系统日历，但可能不在最近 6 条中，导致采证器按 `data-summary-item-id` 找不到目标行。
- H5 初始化时 `native.hostContext` 会触发一次无焦点的快照刷新；紧接着发送带目标的 `native.viewChanged` 时，两次刷新可能竞态，目标行短暂出现后又被无焦点列表覆盖。

完成内容：

- H5 `native.viewChanged` 支持读取 `eventId` / `calendarEventId`。
- `calendarEventsToBackendElements()` 增加 `focusedCalendarEventId` 选项，复用 `selectRecentItemsWithFocus()` 把目标日程置入可见列表并标记 `highlighted`。
- calendar surface 复用 `data-highlighted-summary-item` 滚动逻辑，让目标行进入截图视野。
- `calendarCleanupSeed` 的 H5 cancel helper 会最多 3 次发送带 `eventId` 的 calendar focus 消息，等待目标行出现后再点击 `calendar.cancel`。

验证结果：

- 红灯：新增 source test 后，`node --test --test-name-pattern "calendar cleanup evidence" scripts/collect-ios-acceptance-evidence.test.mjs` 先因缺少 calendar focus retry 失败。
- 绿灯：补齐 H5 focused calendar event 和采证重试后，同一测试通过。
- 回归：`node --test scripts/collect-ios-acceptance-evidence.test.mjs` 通过 18 项测试。
- 回归：`pnpm --filter @ai-code/h5 typecheck` 通过。
- live 验证：`.tmp/ios-acceptance-evidence/worktree-h5-calendar-focus-retry-20260531` 中 `calendarCleanupSeed.available=true`、`h5CancelActionScreenshot.available=true`，`system_calendar_cleanup` 已预填 H5 取消动作截图、后端 canceled 状态和系统 Calendar App 消失截图。
- audit 预检：`.tmp/v1-completion-audit/worktree-h5-calendar-focus-retry-20260531` 显示 `missingEvidenceCount=25`、`verdict=not_complete`。该包来自脏工作区，只作为修复验证；提交后仍需按最新 HEAD 重跑正式证据包。

阶段价值：

这一阶段把 H5 行内动作采证从“依赖目标刚好在最近 6 条”改为“可按 Native 目标 ID 聚焦业务对象”。这不仅修复系统日历取消清理，也为后续从 Native 通知、日历详情或深链接打开特定日程提供了稳定 UI 路径。

## 阶段 166：原生导航 UI test 证据归档

问题背景：

- `navigation_surfaces` 的真实 Header / Drawer 点击已经有 `pnpm validate:ios-navigation-ui-test` 负责验证。
- 但该命令此前只把结果打印到终端，没有稳定落盘 log、xcresult metadata 和截图 attachment 名称，导致自动证据包无法把这条真实 UI test 结果预填进 `manual-evidence-record.review.json`。
- completion audit 仍会提示缺 Header Timeline 截图、Drawer 设置截图、两个 source marker 和 UI test 输出或 xcresult。

完成内容：

- `validate-ios-navigation-ui-test.mjs` 新增稳定产物：
  - `.tmp/ios-navigation-ui-test/ios-navigation-ui-test.log`
  - `.tmp/ios-navigation-ui-test/ios-navigation-ui-test.xcresult`
  - `.tmp/ios-navigation-ui-test/navigation-ui-test.json`
- XCTest 在两个关键点保留 screenshot attachment：
  - `Header Timeline 切换截图`
  - `Drawer 设置切换截图`
- `collect-ios-acceptance-evidence` 会读取 `navigation-ui-test.json`，写入 `navigationUiTest` 证据对象。
- `manual-evidence-review` 会把 `navigationUiTest` 映射到：
  - Header Timeline / Drawer 设置截图候选
  - `source=native.header.timeline`
  - `source=native.drawer.quick-switch`
  - UI test log 和 xcresult system artifact

验证结果：

- 红灯：新增 `manual-evidence-review.test.mjs` 断言后，先因缺少 Header / Drawer 导航证据映射失败；新增 collect dry-run 断言后，先因缺少 `navigationUiTest` 字段失败。
- 绿灯：补齐 UI test metadata、collect 读取和 review 映射后，`node --test scripts/manual-evidence-review.test.mjs scripts/collect-ios-acceptance-evidence.test.mjs` 通过 19 项测试。
- 真实 UI test：`pnpm validate:ios-navigation-ui-test` 通过 1 个 XCTest，输出 log、xcresult 和 metadata。
- 预检：dry-run 采证读取 metadata 后，`navigation_surfaces.missingEvidence=无`，但状态仍保持 `pending`。

阶段价值：

这一阶段把“真实 Native Header / Drawer 点击验证”从终端瞬时输出变成可归档、可被 completion audit 绑定的证据。它仍不自动把导航验收改成 `passed`，但人工复核时可以直接看到 UI test log、xcresult 和两个关键截图 attachment 名称。

## 阶段 167：导航与附件证据归档稳定化

问题背景：

- `navigation_surfaces` 的人工模板要求 system artifact 中出现“`pnpm validate:ios-navigation-ui-test 输出或 xcresult`”，而上一阶段自动预填把 log 与 xcresult 拆成两条文案，导致 audit 仍可能把该项判为缺证据。
- `nativeAttachmentInputs` 在 live 长会话采证中出现过照片 / 文件 seed 已写入、PDF seed 查询未命中的情况。根因更像 H5 upload、后端附件读模型刷新和采证查询之间的短暂竞态，而不是业务路径本身不可用。

完成内容：

- `manual-evidence-review` 把导航 UI test 产物合并为一条 system artifact：`pnpm validate:ios-navigation-ui-test 输出或 xcresult: log=..., xcresult=...`，直接匹配人工模板要求。
- `seedNativeAttachmentInputs` 查询 `/attachments` 时把 `limit` 从 20 提升到 50，降低长期会话历史附件挤出本轮 seed 的概率。
- 附件 seed 查询增加最多 5 次重试，每次重新读取后端附件列表并重建 `nativeAttachmentInputs.samples`，只有三类 seed 全部找到才结束。
- `commands` 会记录每次 `queryAttachments{n}`，便于后续从证据包里复核是哪一次查询拿到了完整结果。

验证结果：

- 红灯：新增测试后，`node --test --test-name-pattern "native attachment inputs|manual evidence" scripts/collect-ios-acceptance-evidence.test.mjs scripts/manual-evidence-review.test.mjs` 先因缺少 `attachmentQueryAttempt <= 5` 和“输出或 xcresult”文案失败。
- 绿灯：补齐重试与合并文案后，同一测试通过。
- 回归：`node --test scripts/manual-evidence-review.test.mjs scripts/collect-ios-acceptance-evidence.test.mjs` 通过 19 项测试。
- 回归：`pnpm validate:context-sync`、`pnpm validate:native-shells` 通过。
- 静态检查：`node --check scripts/validate-ios-navigation-ui-test.mjs && node --check scripts/collect-ios-acceptance-evidence.mjs && node --check scripts/manual-evidence-review.mjs && git diff --check` 通过。

阶段价值：

这一阶段不是新增用户能力，而是把 completion audit 的证据归档路径打磨得更贴近真实运行。导航证据现在能被 requiredEvidence 精确识别，附件采证能吸收异步写入延迟；两者仍然只生成人工 review 候选材料，不会自动把系统能力验收置为 `passed`。

## 阶段 168：HEAD 5c2ffba 辅助证据包与 audit 刷新

完成内容：

- 在提交 `5c2ffba test(ios): 稳定导航与附件证据归档` 后，重新运行 `pnpm validate:ios-navigation-ui-test`，1 个 XCTest 通过，并刷新 `.tmp/ios-navigation-ui-test/ios-navigation-ui-test.log`、`.tmp/ios-navigation-ui-test/ios-navigation-ui-test.xcresult` 和 metadata。
- 运行正式证据包：

```bash
pnpm collect:ios-acceptance-evidence -- --seed-supported-system-evidence --seed-keyboard-input --seed-attachment-inputs --output-dir .tmp/ios-acceptance-evidence/current-head-final-20260601-5c2ffba
```

- 运行 completion audit：

```bash
pnpm collect:v1-completion-audit -- --manual-record best --manual-record-root .tmp/ios-acceptance-evidence --output-dir .tmp/v1-completion-audit/current-best-final-20260601-5c2ffba --external-knowledge-status not_synced
```

结果摘要：

- 正式证据包绑定 HEAD `5c2ffba`。
- `navigationUiTest.available=true`。
- `nativeAttachmentInputs.available=true`，照片、文件、PDF 三类 seed 均有后端 attachment ID。
- `calendarCleanupSeed.available=true`，并包含 `calendar-cleanup-h5-cancel-action.png`。
- completion audit 自动选择当前 HEAD 的 `manual-evidence-record.review.json`，`missingEvidenceCount=20`、`verdict=not_complete`。
- `navigation_surfaces`、`conversation_persistence`、`system_calendar_write`、`system_calendar_cleanup`、`backend_fact_confirmation` 和 `system_sync_degradation` 的 `missingEvidence=无`，但状态仍为 `pending`。

当前剩余缺口：

- 全局 `acceptanceVerdict` 仍需人工改为 `passed`。
- H5 地址覆盖仍缺“局域网地址 App 启动截图”。
- 键盘输入仍缺“输入框文本”截图。
- 语音输入仍缺权限弹窗、识别文本、H5 确认卡、`/reminders` 摘要、`source=native.composer.voice` 和系统权限截图。
- 附件输入仍缺真实 PhotosPicker / Files / PDF 选择流程、费用确认或追问、`/expenses` 摘要和系统选择器截图。
- 本地通知和通知点击回流仍缺系统通知截图 / 点击录屏等系统级人工材料。

阶段价值：

这一阶段把最新 HEAD 的自动候选证据状态钉住：工程辅助证据已经明显收敛，但 completion audit 仍正确阻止 goal 被标为完成。后续重点不再是补自动脚本花活，而是补真实系统交互截图 / 录屏并生成人工 filled 记录。

## 阶段 169：原生键盘 UI test 证据归档

问题背景：

- `keyboard_input` 的自动辅助证据已经能通过 H5 synthetic `native.inputSubmitted` 证明后端提醒事实、确认卡和 `source=native.composer.keyboard`。
- 但 completion audit 仍缺“输入框文本”截图，因为真实 XCTest 键盘路径此前只在终端输出通过结果，没有稳定落盘 log、xcresult metadata 和输入框截图 attachment。

完成内容：

- `validate-ios-keyboard-ui-test.mjs` 新增稳定产物：
  - `.tmp/ios-keyboard-ui-test/ios-keyboard-ui-test.log`
  - `.tmp/ios-keyboard-ui-test/ios-keyboard-ui-test.xcresult`
  - `.tmp/ios-keyboard-ui-test/keyboard-ui-test.json`
- `NativeKeyboardInputUITests.testNativeKeyboardComposerConfirmsReminderThroughBackend` 在系统键盘输入中文后保存 `输入框文本` screenshot attachment。
- `collect-ios-acceptance-evidence` 新增 `keyboardUiTest` 证据对象，并在 metadata 可用时加入 `ios_keyboard_ui_test_artifact`。
- `manual-evidence-review` 会把 `keyboardUiTest.screenshotAttachments.inputText` 预填到 `keyboard_input.evidence.screenshots`；原有 `nativeKeyboardInput` 继续负责 H5 确认卡、提醒页、`/reminders` 和 bridge marker。

验证结果：

- 红灯：新增测试后，`node --test --test-name-pattern "dry-run output|manual evidence" scripts/collect-ios-acceptance-evidence.test.mjs scripts/manual-evidence-review.test.mjs` 先因缺少 `keyboardUiTest` 字段和“输入框文本”截图映射失败。
- 绿灯：补齐 keyboard UI test metadata、collect 读取和 review 映射后，同一测试通过。
- 回归：`node --test scripts/manual-evidence-review.test.mjs scripts/collect-ios-acceptance-evidence.test.mjs` 通过 19 项测试。
- 回归：`pnpm validate:native-shells` 通过。
- 静态检查：`node --check scripts/validate-ios-keyboard-ui-test.mjs && node --check scripts/collect-ios-acceptance-evidence.mjs && node --check scripts/manual-evidence-review.mjs && git diff --check` 通过。
- 真实 UI test：`pnpm validate:ios-keyboard-ui-test` 通过 1 个 XCTest，输出 log、xcresult 和 metadata，并在 xcodebuild 日志中看到 `Added attachment named '输入框文本'`。

阶段价值：

这一阶段把键盘输入从“真实 UI test 已能跑通”推进到“真实输入框文本可被证据包引用”。它仍不自动把键盘输入验收改为 `passed`，但能减少人工整理截图和 completion audit 缺口。

补充审计：

- 提交 `71aa8fe test(ios): 归档原生键盘证据` 后，重新生成 `.tmp/ios-acceptance-evidence/current-head-final-20260601-71aa8fe`。
- 对应 audit `.tmp/v1-completion-audit/current-best-final-20260601-71aa8fe` 显示 `missingEvidenceCount=19`、`verdict=not_complete`。
- `keyboard_input.missingEvidence=无`，review 中包含“输入框文本” xcresult attachment、H5 确认卡和提醒页截图、`/reminders` 摘要以及 `source=native.composer.keyboard`。
- 所有人工项仍为 `pending`，不能把 goal 标记为 complete。

## 阶段 170：H5 局域网地址覆盖 review 映射

问题背景：

- `h5_address_override` 的人工模板要求同时提供“默认地址 App 启动截图”和“局域网地址 App 启动截图”。
- 既有证据包已经能读取 `Info.plist` 的 `H5DevServerURL`、App 启动截图和 H5 native marker，但 review 整理脚本此前只把启动截图归为“默认地址”，不会在地址确实为局域网 IP 时预填局域网截图。
- 这个缺口不能用 `localhost` 或 `127.0.0.1` 冒充，因为目标是证明 iOS 壳能按构建配置访问局域网 H5 地址。

完成内容：

- `manual-evidence-review` 新增局域网地址判断：只有 `ios.h5DevServerUrl` 是私有局域网 IPv4（`10.*`、`172.16.*` 到 `172.31.*`、`192.168.*` 或 `169.254.*`）且有 App 启动截图时，才预填“局域网地址 App 启动截图”。
- `h5_address_override` 仍会记录 `H5DevServerURL` bridge marker、`h5NativeTargetMarkerFound=true` 和“构建产物 Info.plist 的 H5DevServerURL”系统摘要。
- 自动 review 仍保持 item `status=pending`，只减少人工整理缺口，不替代人工验收。

验证结果：

- 红灯：新增 `h5_address_override` 测试后，`node --test --test-name-pattern "manual evidence" scripts/manual-evidence-review.test.mjs` 因缺少“局域网地址 App 启动截图”预填失败。
- 绿灯：补齐局域网地址映射后，同一测试通过。
- 回归：`node --test scripts/manual-evidence-review.test.mjs scripts/collect-ios-acceptance-evidence.test.mjs` 通过 19 项测试。
- 静态检查：`node --check scripts/manual-evidence-review.mjs` 通过。

阶段价值：

这一阶段把 H5 地址覆盖从“只看到构建地址”推进到“能区分默认地址和局域网地址候选截图”。后续正式采证时仍必须用局域网 `H5_DEV_SERVER_URL` / `AI_CODE_H5_NATIVE_BASE_URL` 重新生成当前 HEAD 证据包，completion audit 才能确认 `h5_address_override.missingEvidence` 是否收敛。

## 阶段 171：通知辅助证据部分可用 review 映射

问题背景：

- HEAD `57c0cc0` 的局域网正式证据包 `.tmp/ios-acceptance-evidence/current-head-final-20260601-57c0cc0` 中，`h5_address_override.missingEvidence=无`。
- 但该包使用 `--reset-app` 后，Simulator 通知 pending / delivered 诊断没有抓到目标本地通知，`notificationDelivery.available=false`、`notificationClickBackflow.available=false`，导致 review 把部分已经存在的 H5 / API / Bridge 候选证据也丢掉。
- 根因不是 H5 回流截图不存在：证据包里已有 `notification-click-backflow.png`、`h5StatusText=已从系统通知打开提醒`、`highlightedReminderFound=true` 和 `source=native.notifications.reminders.opened`，只是 `available=false` 包含了“系统 pending notification 未找到”这个更严格条件。

完成内容：

- `manual-evidence-review` 对 `local_notification` 改为分层预填：
  - 只要 `notificationDelivery` 已生成 `reminderId`，就可预填 H5 提醒页 scheduled 截图和 `/reminders` 摘要。
  - 只有 `notificationDelivery.available=true`、`pendingNotificationFound=true` 或 `deliveredNotificationFound=true` 时，才预填 `notifications.reminders.sync`。
- `manual-evidence-review` 对 `notification_click_backflow` 改为保留部分有效证据：
  - 只要有 `h5OpenedScreenshotPath`，就预填“通知点击后 H5 reminders 视图”。
  - 只有 `highlightedReminderFound=true` 时，才预填“高亮提醒行”。
  - 只要有 `bridgeInboundLabel` 或 `reminderId`，就预填 `source=native.notifications.reminders.opened` 和 `/reminders` 摘要。
  - 系统通知点击录屏仍不自动生成，继续作为人工缺口。

验证结果：

- 红灯：新增 `manual evidence review keeps partial notification evidence when system delivery is missing` 后，测试先因缺少“H5 提醒页 scheduled 结果”失败。
- 绿灯：补齐分层映射后，同一测试通过。
- 回归：`node --test scripts/manual-evidence-review.test.mjs scripts/collect-ios-acceptance-evidence.test.mjs` 通过 20 项测试。
- 静态检查：`node --check scripts/manual-evidence-review.mjs` 通过。
- 对现有 `.tmp/ios-acceptance-evidence/current-head-final-20260601-57c0cc0` 做无写入复算，`missingEvidenceCount` 从 25 回到 19；真实系统通知权限、系统通知截图、`notifications.reminders.sync` 和系统通知点击录屏仍保留为缺口。

阶段价值：

这一阶段没有把系统通知失败伪装成成功，而是把“后端提醒事实 / H5 reminders 展示 / synthetic backflow UI 行为”和“真实系统通知 pending / delivered / 点击录屏”拆开记录。completion audit 的缺口因此更准确：自动可证明的部分不会丢，必须人工补的系统层材料也不会被吞掉。

## 阶段 172：原生语音 UI test 证据归档

问题背景：

- `voice_input` 已有 Native 语音按钮到 H5 / 后端提醒事实的 UI test，但校验命令此前没有固定归档 log、xcresult 和 metadata。
- `collect-ios-acceptance-evidence` 不能读取语音 UI test 结果，`manual-evidence-review` 也不能把“识别文本”“H5 确认卡”和 `source=native.composer.voice` 作为候选证据预填。
- 这会让 completion audit 把可自动证明的 Native 语音输入链路和必须人工补的系统麦克风 / 语音权限弹窗混在一起。

完成内容：

- `validate:ios-voice-ui-test` 固定写出 `.tmp/ios-voice-ui-test/ios-voice-ui-test.log`、`.tmp/ios-voice-ui-test/ios-voice-ui-test.xcresult` 和 `voice-ui-test.json`。
- `NativeKeyboardInputUITests.testNativeVoiceComposerConfirmsReminderThroughBackend` 在识别文本展示后保存 `识别文本` screenshot attachment，并在语音来源确认卡出现时保存 `H5 确认卡` attachment。
- `collect-ios-acceptance-evidence` 新增 `voiceUiTest` 证据对象，并在 metadata 可用时加入 `ios_voice_ui_test_artifact`。
- `manual-evidence-review` 会把语音 UI test metadata 预填到 `voice_input` 的候选证据：识别文本、H5 确认卡、`/reminders` 摘要、`source=native.composer.voice` 以及 UI test log / xcresult。
- `validate-native-shells` 新增护栏，要求语音 UI test 脚本保留 result bundle、log 和 metadata 输出。

验证结果：

- 红灯：新增 `voice UI test metadata` 测试后，`node --test --test-name-pattern "voice UI test metadata|dry-run output" scripts/collect-ios-acceptance-evidence.test.mjs` 先因缺少 `voiceUiTest` 字段失败。
- 绿灯：补齐 voice UI test metadata、collect 读取和 review 映射后，同一测试通过。
- 回归：`node --test scripts/manual-evidence-review.test.mjs scripts/collect-ios-acceptance-evidence.test.mjs` 通过 21 项测试。
- 静态检查：`node --check scripts/validate-ios-voice-ui-test.mjs`、`node --check scripts/collect-ios-acceptance-evidence.mjs`、`node --check scripts/manual-evidence-review.mjs` 和 `git diff --check` 通过。
- 护栏：`pnpm validate:native-shells`、`pnpm validate:context-sync` 通过。
- 真实 UI test：`pnpm validate:ios-voice-ui-test` 通过 1 个 XCTest，生成 `.tmp/ios-voice-ui-test/ios-voice-ui-test.log`、`.tmp/ios-voice-ui-test/ios-voice-ui-test.xcresult` 和 `voice-ui-test.json`，并在 xcodebuild 日志中看到 `Added attachment named '识别文本'` 与 `Added attachment named 'H5 确认卡'`。

阶段价值：

这一阶段把语音输入从“UI test 能证明部分链路”推进到“证据包能引用这部分链路”。它仍不替代真实麦克风 / 语音识别权限弹窗、真实语音质量和人工验收记录；completion audit 仍必须保持未完成，直到人工 filled 记录和系统层证据补齐。

## 阶段 173：HEAD a7a2241 语音证据 audit 刷新

执行背景：

- 提交 `a7a2241 test(ios): 归档原生语音证据` 后，需要用当前 HEAD 重跑正式辅助证据包，确认 completion audit 不再选择旧证据。
- 本轮目标不是宣布 v1 完成，而是验证语音 UI test metadata 是否能真实收敛 `voice_input` 缺口。

执行命令：

```bash
H5_DEV_SERVER_URL='http://192.168.1.238:3000/?native=ios&bridgeDebug=1' \
AI_CODE_H5_NATIVE_BASE_URL='http://192.168.1.238:3000' \
AI_CODE_API_BASE_URL='http://192.168.1.238:8000' \
AI_CODE_IOS_ACCEPTANCE_SCREENSHOT_DELAY_MS=5000 \
pnpm collect:ios-acceptance-evidence -- --seed-supported-system-evidence --seed-keyboard-input --seed-attachment-inputs --output-dir .tmp/ios-acceptance-evidence/current-head-final-20260601-a7a2241

pnpm collect:v1-completion-audit -- --manual-record best --manual-record-root .tmp/ios-acceptance-evidence --output-dir .tmp/v1-completion-audit/current-best-final-20260601-a7a2241 --external-knowledge-status not_synced
```

结果：

- 证据包路径：`.tmp/ios-acceptance-evidence/current-head-final-20260601-a7a2241`。
- audit 路径：`.tmp/v1-completion-audit/current-best-final-20260601-a7a2241`。
- `verdict=not_complete`，`missingEvidenceCount=15`。
- `voiceUiTest.available=true`，并被 review 预填为 `识别文本`、`H5 确认卡`、`/reminders?conversationId=...`、`source=native.composer.voice` 和 `pnpm validate:ios-voice-ui-test 输出或 xcresult`。
- `voice_input` 的缺口收敛到 2 项：`麦克风 / 语音识别权限弹窗` 和 `iOS 权限弹窗截图或录屏`。

仍未完成：

- 所有 14 个人工验收 item 仍是 `pending`，`acceptanceVerdict` 仍是 `not_evaluated`。
- 照片 / 文件 / PDF 仍缺真实系统选择器流程、权限截图和业务追问 / 确认卡等人工材料。
- 本地通知仍缺 `notifications.reminders.sync`、通知权限弹窗、系统通知截图和系统通知点击录屏。
- 外部知识库状态仍为 `not_synced`。

阶段价值：

这一阶段证明语音 UI test 证据归档确实减少了 completion audit 缺口，但也再次确认自动化证据不能替代系统权限弹窗、系统通知和人工验收结论。下一步应优先处理仍可自动化的系统选择器 / 附件业务确认证据，同时保留真实系统权限和通知录屏的人工门槛。

## 阶段 174：照片附件费用证据归档

问题背景：

- HEAD `a7a2241` 的 audit 中，`photo_attachment` 仍缺“费用确认卡或金额追问”和 `/expenses?conversationId=...`。
- 这两项属于 H5 / 后端业务链路证据，不是系统 PhotosPicker 层证据，可以继续自动化补齐。
- 既有 `nativeAttachmentInputs` 只证明 synthetic `native.inputSubmitted` 附件能写入 `/attachments`，没有继续点击 H5 附件 quick reply，也没有确认费用计划。

完成内容：

- `seedNativeAttachmentInputs` 在 photo seed 写入附件后，会点击 H5 quick reply `把 {receipt.jpg} 作为费用票据处理`。
- H5 出现费用确认卡时，采证脚本保存 `native-attachment-photo-expense-follow-up.png`。
- 采证脚本随后点击确认，等待 H5 状态栏显示执行完成，再查询 `/expenses?conversationId=...`，把 `expenseRecordId` 写入 photo sample 的 `expenseFollowUp`。
- `manual-evidence-review` 在 `photo_attachment` 中预填“费用确认卡或金额追问”和 `/expenses?conversationId=...` 摘要。
- dry-run 也会暴露 `photo.expenseFollowUp` 结构，避免证据 schema 在无 live 环境时缺字段。

验证结果：

- 红灯：新增测试后，`node --test --test-name-pattern "native attachment inputs|manual evidence" scripts/collect-ios-acceptance-evidence.test.mjs scripts/manual-evidence-review.test.mjs` 先因缺少 `expenseFollowUp` 和 review 映射失败。
- 绿灯：补齐采证和 review 映射后，同一测试通过。
- 回归：`node --test scripts/manual-evidence-review.test.mjs scripts/collect-ios-acceptance-evidence.test.mjs` 通过 21 项测试。
- 护栏：`pnpm validate:native-shells`、`git diff --check` 通过。
- live 采证：`.tmp/ios-acceptance-evidence/worktree-photo-expense-followup-20260601` 显示 `nativeAttachmentInputs.available=true`、`photo.expenseFollowUp.available=true`，并生成 `expenseRecordId=expense_record_29dfc49936944013b8aa8f98d541021a`。

阶段价值：

这一阶段把照片附件从“附件已入库”推进到“附件可读文本能驱动费用确认卡并写入费用记录”。它仍不替代真实 PhotosPicker 选择流程和权限截图；这些系统层证据继续保留为人工验收门槛。

## 阶段 175：HEAD 09a35d1 照片费用 audit 刷新

执行命令：

```bash
H5_DEV_SERVER_URL='http://192.168.1.238:3000/?native=ios&bridgeDebug=1' \
AI_CODE_H5_NATIVE_BASE_URL='http://192.168.1.238:3000' \
AI_CODE_API_BASE_URL='http://192.168.1.238:8000' \
AI_CODE_IOS_ACCEPTANCE_SCREENSHOT_DELAY_MS=5000 \
pnpm collect:ios-acceptance-evidence -- --seed-supported-system-evidence --seed-keyboard-input --seed-attachment-inputs --output-dir .tmp/ios-acceptance-evidence/current-head-final-20260601-09a35d1

pnpm collect:v1-completion-audit -- --manual-record best --manual-record-root .tmp/ios-acceptance-evidence --output-dir .tmp/v1-completion-audit/current-best-final-20260601-09a35d1 --external-knowledge-status not_synced
```

结果：

- 证据包路径：`.tmp/ios-acceptance-evidence/current-head-final-20260601-09a35d1`。
- audit 路径：`.tmp/v1-completion-audit/current-best-final-20260601-09a35d1`。
- `verdict=not_complete`，`missingEvidenceCount=13`。
- `photo_attachment` 已预填 `H5 附件摘要卡`、`费用确认卡或金额追问`、`/attachments?conversationId=...`、`/expenses?conversationId=...`、`source=native.composer.attachment.photo` 和 `attachmentKind=image`。
- `photo_attachment` 剩余缺口只剩 `PhotosPicker 选择流程` 和 `PhotosPicker 权限与选择器截图`。

仍未完成：

- 所有 14 个人工验收 item 仍是 `pending`，`acceptanceVerdict` 仍是 `not_evaluated`。
- 语音仍缺真实麦克风 / 语音识别权限弹窗截图或录屏。
- 文件 / PDF 仍缺真实系统选择器流程；PDF 还缺后续追问或确认卡和文本摘要截图。
- 本地通知仍缺 `notifications.reminders.sync`、通知权限弹窗、系统通知截图和系统通知点击录屏。
- 外部知识库状态仍为 `not_synced`。

阶段价值：

这一阶段把自动可证明的照片附件业务链路从 completion audit 缺口中移出，使剩余 `photo_attachment` 缺口更准确地聚焦到系统 PhotosPicker 层。下一步同类高收益任务是补 PDF 后续追问 / 确认卡和 PDF 文本摘要候选证据。

## 阶段 176：PDF 附件日程证据归档

问题背景：

- HEAD `09a35d1` 的 audit 中，`pdf_text_extraction` 仍缺“后续追问或确认卡”和“PDF 样本文本摘要截图”。
- 这两项属于 PDF 可读文本进入 H5 / 后端业务链路后的候选证据，可以用 synthetic Native bridge + Playwright 自动化整理。
- live 采证还发现一个上下文稳定性问题：如果先连续提交照片、文件、PDF，再回头点击照片 quick reply，最近附件上下文可能已经漂移到 PDF，导致费用 follow-up 偶发被 LLM / planner 理解偏。

完成内容：

- `seedNativeAttachmentInputs` 改为在每个附件提交成功后立即处理该附件自己的 quick reply。
- 照片附件提交后立刻点击“作为费用票据处理”，避免被后续 PDF 附件污染最近附件上下文。
- PDF 附件提交后立刻点击“作为日程材料处理”，保存 `native-attachment-pdf-schedule-follow-up.png`。
- PDF sample 新增 `scheduleFollowUp` 和 `textSummary`，dry-run 下也会暴露默认结构。
- `manual-evidence-review` 会为 `pdf_text_extraction` 预填“后续追问或确认卡”和“PDF 样本文本摘要截图”候选证据。

验证结果：

- targeted：`node --test --test-name-pattern "native attachment inputs|manual evidence" scripts/collect-ios-acceptance-evidence.test.mjs scripts/manual-evidence-review.test.mjs` 通过。
- 语法：`node --check scripts/collect-ios-acceptance-evidence.mjs`、`node --check scripts/manual-evidence-review.mjs` 通过。
- 回归：`node --test scripts/manual-evidence-review.test.mjs scripts/collect-ios-acceptance-evidence.test.mjs` 通过 21 项测试。
- 护栏：`pnpm validate:native-shells`、`git diff --check` 通过。
- live 采证：`.tmp/ios-acceptance-evidence/worktree-pdf-followup-20260601-rerun` 显示 `nativeAttachmentInputs.available=true`、`photo.expenseFollowUp.available=true`、`pdf.scheduleFollowUp.available=true`，且 `pdf.textSummary=PDF 日程材料 明天上午十点项目会`。

阶段价值：

这一阶段把 PDF 附件从“可被 intake / upload 记录”推进到“PDF 可读文本能驱动日程追问或确认卡”。同时修正了附件 follow-up 的处理顺序，让照片和 PDF 都围绕自己的附件上下文执行。真实 Files / PDF 选择器流程仍必须由系统 UI 截图或人工录屏补齐。

## 阶段 177：HEAD ebb9eb2 PDF audit 刷新

执行命令：

```bash
H5_DEV_SERVER_URL='http://192.168.1.238:3000/?native=ios&bridgeDebug=1' \
AI_CODE_H5_NATIVE_BASE_URL='http://192.168.1.238:3000' \
AI_CODE_API_BASE_URL='http://192.168.1.238:8000' \
AI_CODE_IOS_ACCEPTANCE_SCREENSHOT_DELAY_MS=5000 \
pnpm collect:ios-acceptance-evidence -- --seed-supported-system-evidence --seed-keyboard-input --seed-attachment-inputs --output-dir .tmp/ios-acceptance-evidence/current-head-final-20260601-ebb9eb2

pnpm collect:v1-completion-audit -- --manual-record best --manual-record-root .tmp/ios-acceptance-evidence --output-dir .tmp/v1-completion-audit/current-best-final-20260601-ebb9eb2 --external-knowledge-status not_synced
```

结果：

- 证据包路径：`.tmp/ios-acceptance-evidence/current-head-final-20260601-ebb9eb2`。
- audit 路径：`.tmp/v1-completion-audit/current-best-final-20260601-ebb9eb2`。
- `verdict=not_complete`，`missingEvidenceCount=11`。
- `nativeAttachmentInputs.available=true`，并且 `photo.expenseFollowUp.available=true`、`pdf.scheduleFollowUp.available=true`。
- `pdf_text_extraction` 已预填 `H5 附件摘要卡`、`后续追问或确认卡`、`PDF 样本文本摘要截图`、`/attachments?conversationId=...`、`source=native.composer.attachment.file` 和 `attachmentKind=pdf`。
- `pdf_text_extraction` 剩余缺口只剩 `PDF 选择流程`。

仍未完成：

- 所有 14 个人工验收 item 仍是 `pending`，`acceptanceVerdict` 仍是 `not_evaluated`。
- 语音仍缺真实麦克风 / 语音识别权限弹窗截图或录屏。
- 照片仍缺真实 `PhotosPicker` 选择流程和权限 / 选择器截图。
- 文件仍缺真实 `fileImporter` 选择流程和 Files 选择器截图。
- PDF 仍缺真实 PDF 选择流程。
- 本地通知仍缺 `notifications.reminders.sync`、通知权限弹窗、系统通知截图和系统通知点击录屏。
- 外部知识库状态仍为 `not_synced`。

阶段价值：

这一阶段把 PDF 的业务后续证据从 completion audit 缺口中移出，使附件类剩余缺口更准确地聚焦到真实系统选择器层。下一步应优先补真实 PhotosPicker / fileImporter / PDF 选择流程，以及通知和语音权限弹窗这类系统 UI 证据。

## 阶段 178：附件选择器 UI test 证据归档

问题背景：

- HEAD `ebb9eb2` 的 audit 中，照片 / 文件 / PDF 附件业务链路已经有 H5 / 后端候选证据，但系统选择器流程仍是显式缺口。
- 既有 `pnpm validate:ios-attachment-ui-test` 只证明纸夹入口和菜单选项可见，没有把运行日志、xcresult 和截图 attachment 结构化沉淀给 completion audit。
- 为了减少人工整理成本，需要把附件菜单、PhotosPicker 入口、fileImporter 入口和 PDF 选择入口按人工验收证据名归档。

完成内容：

- `validate:ios-attachment-ui-test` 固定写出 `.tmp/ios-attachment-ui-test/ios-attachment-ui-test.log`、`.tmp/ios-attachment-ui-test/ios-attachment-ui-test.xcresult` 和 `attachment-ui-test.json`。
- iOS UI test 会打开附件菜单并保存 `附件菜单` screenshot attachment。
- UI test 会分别点击“选择照片”和“选择文件”，保存 `PhotosPicker 选择流程`、`fileImporter 选择流程` 和 `PDF 选择流程` screenshot attachment。
- `collect-ios-acceptance-evidence` 新增 `attachmentUiTest` 读取路径，并把 `ios_attachment_ui_test_artifact` 写入自动证据。
- `manual-evidence-review` 会把附件 UI test metadata 预填到 `photo_attachment`、`file_attachment` 和 `pdf_text_extraction` 的系统 UI 候选证据里。

验证结果：

- 红灯：新增测试后，`collect iOS acceptance evidence reads attachment UI test metadata` 先因 `attachmentUiTest` 缺失失败；manual review 断言也因缺少 `PhotosPicker 选择流程` 失败。
- 绿灯：补齐 metadata 读取和 review 映射后，targeted 测试通过。
- 回归：`node --test scripts/manual-evidence-review.test.mjs scripts/collect-ios-acceptance-evidence.test.mjs` 通过 22 项测试。
- 语法：`node --check scripts/collect-ios-acceptance-evidence.mjs && node --check scripts/manual-evidence-review.mjs && node --check scripts/validate-ios-attachment-ui-test.mjs` 通过。
- 护栏：`pnpm validate:native-shells`、`git diff --check` 通过。
- live UI test：`H5_DEV_SERVER_URL='http://192.168.1.238:3000/?native=ios&bridgeDebug=1' pnpm validate:ios-attachment-ui-test` 通过 1 个 XCTest，并生成 `附件菜单`、`PhotosPicker 选择流程`、`fileImporter 选择流程` 和 `PDF 选择流程` attachment。

阶段价值：

这一阶段把附件类剩余缺口从“缺少选择器流程截图”推进到“已有 UI test 候选证据，等待人工复核”。它仍不证明真实选中文件内容、PhotosPicker 权限弹窗、Files 安全作用域读取、Vision OCR 或 PDFKit 质量；completion audit 也不会因为 UI test metadata 自动把人工项改为 `passed`。

## 阶段 179：HEAD 180ce4c 附件选择器 audit 刷新

执行命令：

```bash
H5_DEV_SERVER_URL='http://192.168.1.238:3000/?native=ios&bridgeDebug=1' \
AI_CODE_H5_NATIVE_BASE_URL='http://192.168.1.238:3000' \
AI_CODE_API_BASE_URL='http://192.168.1.238:8000' \
AI_CODE_IOS_ACCEPTANCE_SCREENSHOT_DELAY_MS=5000 \
pnpm collect:ios-acceptance-evidence -- --seed-supported-system-evidence --seed-keyboard-input --seed-attachment-inputs --output-dir .tmp/ios-acceptance-evidence/current-head-final-20260601-180ce4c

pnpm collect:v1-completion-audit -- --manual-record best --manual-record-root .tmp/ios-acceptance-evidence --output-dir .tmp/v1-completion-audit/current-best-final-20260601-180ce4c --external-knowledge-status not_synced
```

结果：

- 证据包路径：`.tmp/ios-acceptance-evidence/current-head-final-20260601-180ce4c`。
- audit 路径：`.tmp/v1-completion-audit/current-best-final-20260601-180ce4c`。
- `attachmentUiTest.available=true`，自动证据包含 `ios_attachment_ui_test_artifact`。
- `verdict=not_complete`，`missingEvidenceCount=6`。
- `photo_attachment.missingEvidence=无`，已预填 `PhotosPicker 选择流程`、`PhotosPicker 权限与选择器截图`、业务费用确认和 `/expenses?conversationId=...` 候选证据。
- `file_attachment.missingEvidence=无`，已预填 `fileImporter 选择流程`、`Files 选择器截图`、`/attachments?conversationId=...` 和附件来源摘要。
- `pdf_text_extraction.missingEvidence=无`，已预填 `PDF 选择流程`、PDF 文本摘要和日程 follow-up 候选证据。

仍未完成：

- 所有 14 个人工验收 item 仍是 `pending`，`acceptanceVerdict` 仍是 `not_evaluated`。
- 语音仍缺真实麦克风 / 语音识别权限弹窗截图或录屏。
- 本地通知仍缺 `notifications.reminders.sync`、通知权限弹窗、系统通知截图和系统通知点击录屏。
- 外部知识库状态仍为 `not_synced`。

阶段价值：

这一阶段把附件类可自动整理的系统 UI 候选证据从 completion audit 缺口中移出，当前剩余缺口已经集中到语音权限与通知系统链路。下一步应优先补通知 sync / 权限 / banner / 点击录屏，或者补真实语音权限弹窗截图，而不是继续在附件 synthetic bridge 上堆证据。

## 阶段 180：通知同步 Bridge 辅助证据稳定化

问题背景：

- HEAD `180ce4c` 的正式 audit 中，本地通知仍缺 `notifications.reminders.sync`、通知权限弹窗、系统通知截图和系统通知点击录屏。
- 此前 `notificationSyncBridge` 会重新打开一个独立 H5 页面采集 outbound bridge marker；live 运行中多次出现第二个页面没有及时观测到 `notifications.reminders.sync`，但同一会话的 H5 surface 页面实际已经发出了该消息。
- 这类缺口属于采证时机问题，不应通过降低本地通知验收门槛解决。

完成内容：

- `collectH5SurfaceScreenshots` 在已成功渲染对话、Timeline、日程、费用、提醒、执行记录和设置 7 个页面后，导出 `window.__AI_NATIVE_MESSAGES__` 中的 outbound message 摘要。
- 导出的 `bridgeOutboundMessages` 只保留 `type`、`reminderCount` 和 `reminderIds`，不把完整提醒 payload 写入证据包。
- `collectNotificationSyncBridgeEvidence` 优先复用 `h5SurfaceScreenshots.bridgeOutboundMessages` 生成 `notificationSyncBridge`，并在 label 中记录 `reminderId`、提醒数量和 `targetIncluded=true/false/null`。
- 如果 H5 surface 没有捕获到 `notifications.reminders.sync`，仍保留原 standalone H5 fallback。
- 新增测试守住：通知同步 Bridge 可以复用 H5 surface outbound messages，且 `supportingOnly=true`，不会写成系统通知通过证据。

验证结果：

- 目标测试：`node --test --test-name-pattern "notification delivery diagnostics|notification sync bridge can reuse|partial notification evidence" scripts/collect-ios-acceptance-evidence.test.mjs scripts/manual-evidence-review.test.mjs` 通过。
- 回归：`node --test scripts/manual-evidence-review.test.mjs scripts/collect-ios-acceptance-evidence.test.mjs` 通过 23 项测试。
- 采证工具：`pnpm validate:ios-acceptance-evidence` 通过 27 项测试。
- 护栏：`pnpm validate:native-shells`、`git diff --check` 通过。

阶段价值：

这一阶段把本地通知缺口中的 H5 -> Native outbound bridge marker 从偶发不可见推进到可稳定归档。边界仍然不变：`notificationSyncBridge.available=true` 只证明 H5 已把已确认 scheduled 提醒通过 `notifications.reminders.sync` 同步给 Native，不证明用户看到通知权限弹窗、系统通知 banner / 锁屏通知，也不证明真实系统通知点击回流。

## 阶段 181：HEAD 36f786f 通知 Bridge audit 刷新

执行命令：

```bash
H5_DEV_SERVER_URL='http://192.168.1.238:3000/?native=ios&bridgeDebug=1' \
AI_CODE_H5_NATIVE_BASE_URL='http://192.168.1.238:3000' \
AI_CODE_API_BASE_URL='http://192.168.1.238:8000' \
AI_CODE_IOS_ACCEPTANCE_SCREENSHOT_DELAY_MS=5000 \
pnpm collect:ios-acceptance-evidence -- --seed-supported-system-evidence --seed-keyboard-input --seed-attachment-inputs --output-dir .tmp/ios-acceptance-evidence/current-head-final-20260601-36f786f

pnpm collect:v1-completion-audit -- --manual-record best --manual-record-root .tmp/ios-acceptance-evidence --output-dir .tmp/v1-completion-audit/current-best-final-20260601-36f786f --external-knowledge-status not_synced
```

结果：

- 证据包路径：`.tmp/ios-acceptance-evidence/current-head-final-20260601-36f786f`。
- audit 路径：`.tmp/v1-completion-audit/current-best-final-20260601-36f786f`。
- `notificationSyncBridge.available=true`，`targetReminderIncluded=true`。
- `bridgeOutboundLabel=notifications.reminders.sync · reminderId=reminder_044b3f887eec4165ae77d0d2da61b490 · reminders=48 · targetIncluded=true`。
- `notificationSyncBridge.screenshotPath` 复用 `.tmp/ios-acceptance-evidence/current-head-final-20260601-36f786f/h5-surfaces/reminders.png`。
- `verdict=not_complete`，`missingEvidenceCount=5`。
- `local_notification` 已不再缺 `notifications.reminders.sync`，仍缺 `iOS 通知权限弹窗截图` 和 `系统通知截图`。

仍未完成：

- 所有 14 个人工验收 item 仍是 `pending`，`acceptanceVerdict` 仍是 `not_evaluated`。
- 语音仍缺真实麦克风 / 语音识别权限弹窗截图或录屏。
- 本地通知仍缺通知权限弹窗和系统通知截图。
- 通知点击回流仍缺系统通知点击录屏。
- 外部知识库状态仍为 `not_synced`。

阶段价值：

这一阶段把剩余自动可补的通知 Bridge marker 从 completion audit 缺口中移出，使 v1 收口剩余项更清楚地聚焦到真实系统 UI 证据。下一步应优先补真实语音权限弹窗、通知权限弹窗、系统通知截图和系统通知点击录屏；不能把 H5 outbound bridge 截图冒充系统通知投递或点击完成。

## 阶段 182：语音权限弹窗 UI test 证据归档

问题背景：

- HEAD `36f786f` 的 audit 中，语音输入只剩麦克风 / 语音识别权限弹窗和系统权限截图这类系统 UI 证据。
- 既有 `validate:ios-voice-ui-test` 为了稳定验证语音入口到后端事实闭环，使用 UI test transcript 并关闭系统权限请求；它不能证明真实权限弹窗。
- 这类证据可以由 XCTest + SpringBoard 截图归档，但仍不能替代人工对真实语音质量的判断。

完成内容：

- 新增 `pnpm validate:ios-voice-permission-ui-test`。
- 命令运行前对目标 App 执行 `xcrun simctl privacy booted reset microphone com.aiengineeringcode.shell` 和 `xcrun simctl privacy booted reset all com.aiengineeringcode.shell`，尽量恢复权限弹窗。
- 新增 XCTest `testNativeVoicePermissionPromptCanBeCaptured`，不使用 `--ai-code-ui-test-disable-system-permission-requests`，真实点击 `ai-code.composer.voice-button` 后从 SpringBoard alert 保存截图。
- XCTest attachment 使用人工验收证据名：`麦克风 / 语音识别权限弹窗` 和 `iOS 权限弹窗截图或录屏`。
- 命令固定写出 `.tmp/ios-voice-permission-ui-test/ios-voice-permission-ui-test.log`、`.tmp/ios-voice-permission-ui-test/ios-voice-permission-ui-test.xcresult` 和 `voice-permission-ui-test.json`。
- `collect-ios-acceptance-evidence` 新增 `voicePermissionUiTest` 读取路径，并把 `ios_voice_permission_ui_test_artifact` 写入自动证据。
- `manual-evidence-review` 会把权限弹窗截图和 xcresult 预填到 `voice_input` 的截图 / 系统证据字段，但仍保持 `status=pending`。
- `collect-v1-completion-audit` 的自动化命令清单加入 `validate:ios-voice-permission-ui-test`，避免正式 completion audit 漏跑这条新门禁。

验证结果：

- 红灯：新增 `collect iOS acceptance evidence reads voice permission UI test metadata` 后，证据包读取 `voicePermissionUiTest.available` 失败。
- 绿灯：补齐 metadata 读取、review 映射、package script、native-shells 护栏和 completion audit 命令清单后，targeted 测试通过。
- live UI test：`H5_DEV_SERVER_URL='http://192.168.1.238:3000/?native=ios&bridgeDebug=1' pnpm validate:ios-voice-permission-ui-test` 通过 1 个 XCTest，并生成 `麦克风 / 语音识别权限弹窗` 与 `iOS 权限弹窗截图或录屏` attachment。
- 回归：`node --test scripts/manual-evidence-review.test.mjs scripts/collect-ios-acceptance-evidence.test.mjs` 通过 24 项测试。
- 采证工具：`pnpm validate:ios-acceptance-evidence` 通过 28 项测试。
- 护栏：`pnpm validate:native-shells`、`git diff --check` 通过。

阶段价值：

这一阶段把语音输入的系统权限弹窗从纯人工缺口推进到可归档 UI test 候选证据。边界仍然清楚：它证明系统权限弹窗可被触发和截图，不证明真实用户语音质量、识别准确率或人工验收结论。

## 阶段 183：HEAD e5f591b 语音权限 audit 刷新

执行命令：

```bash
H5_DEV_SERVER_URL='http://192.168.1.238:3000/?native=ios&bridgeDebug=1' pnpm validate:ios-voice-permission-ui-test

H5_DEV_SERVER_URL='http://192.168.1.238:3000/?native=ios&bridgeDebug=1' \
AI_CODE_H5_NATIVE_BASE_URL='http://192.168.1.238:3000' \
AI_CODE_API_BASE_URL='http://192.168.1.238:8000' \
AI_CODE_IOS_ACCEPTANCE_SCREENSHOT_DELAY_MS=5000 \
pnpm collect:ios-acceptance-evidence -- --seed-supported-system-evidence --seed-keyboard-input --seed-attachment-inputs --output-dir .tmp/ios-acceptance-evidence/current-head-final-20260601-e5f591b

pnpm collect:v1-completion-audit -- --manual-record best --manual-record-root .tmp/ios-acceptance-evidence --output-dir .tmp/v1-completion-audit/current-best-final-20260601-e5f591b --external-knowledge-status not_synced
```

结果：

- 证据包路径：`.tmp/ios-acceptance-evidence/current-head-final-20260601-e5f591b`。
- audit 路径：`.tmp/v1-completion-audit/current-best-final-20260601-e5f591b`。
- `voicePermissionUiTest.available=true`，并记录 `ios-voice-permission-ui-test.log`、`ios-voice-permission-ui-test.xcresult` 和 `麦克风 / 语音识别权限弹窗` attachment。
- `notificationSyncBridge.available=true`，`targetReminderIncluded=true`。
- `verdict=not_complete`，`missingEvidenceCount=3`。
- `voice_input` 已不再缺权限弹窗证据。

仍未完成：

- 所有 14 个人工验收 item 仍是 `pending`，`acceptanceVerdict` 仍是 `not_evaluated`。
- 本地通知仍缺 `iOS 通知权限弹窗截图` 和 `系统通知截图`。
- 通知点击回流仍缺 `系统通知点击录屏`。
- 外部知识库状态仍为 `not_synced`。

阶段价值：

这一阶段把 v1 收口的显式缺口从 5 个降到 3 个。剩余缺口已经非常集中：通知权限弹窗、系统通知展示截图和系统通知点击录屏。后续应继续围绕真实系统通知 UI 采证推进，而不是再扩展 H5 synthetic 或普通业务链路证据。

## 阶段 184：系统通知 UI test 证据归档

问题背景：

- HEAD `e5f591b` 的 audit 中，本地通知与通知点击回流还缺系统通知截图和真实点击录屏。
- 既有 `notificationSyncBridge` 只能证明 H5 已通过 `notifications.reminders.sync` 把 scheduled 提醒同步给 Native，不能证明用户可见系统通知或点击回流。
- iOS Simulator 在当前环境中不会稳定弹出通知权限首弹，因此本阶段不把权限弹窗作为这条 UI test 的必然产物。

完成内容：

- 新增 `pnpm validate:ios-notification-ui-test`。
- 新增 XCTest `testNativeNotificationDeliveryAndClickCanBeCaptured`：创建“1 分钟后”的提醒确认卡，确认后等待 iOS 系统通知 banner，保存 `系统通知截图`，点击通知，再断言 H5 显示 `已从系统通知打开提醒` 并保存 `通知点击后 App 回流`。
- 新脚本运行前用独立 bundle id `com.aiengineeringcode.shell.notificationuitest` 隔离通知测试状态，并用 `simctl recordVideo` 固定生成 `.tmp/ios-notification-ui-test/system-notification-click.mp4`。
- 每次运行固定写出 `.tmp/ios-notification-ui-test/ios-notification-ui-test.log`、`.tmp/ios-notification-ui-test/ios-notification-ui-test.xcresult` 和 `notification-ui-test.json`。
- `collect-ios-acceptance-evidence` 新增 `notificationUiTest` 读取路径，并把 `ios_notification_ui_test_artifact` 写入自动证据。
- `manual-evidence-review` 会把 `系统通知截图`、`系统通知点击录屏`、log / xcresult 预填到本地通知和通知点击回流 review 候选证据，但仍保持 item `status=pending`。
- `collect-v1-completion-audit` 的自动化命令清单加入 `validate:ios-notification-ui-test`。
- 本地通知人工证据模板不再把“通知权限弹窗截图”列为这条自动链路的必填系统产物，改为以系统通知截图、通知权限状态诊断和人工复核结合判断。

调试修复：

- H5 当前真实执行结果文案是 `已执行：创建提醒：...`，原 UI test 等待旧文案 `已确认执行` 会误失败。
- SpringBoard 系统通知 banner 的 accessibility 结构以 button/staticText/`NotificationShortLookView` 为主，不能只依赖一次 broad descendants wait；已改为按实际结构轮询。
- 可选通知权限 alert 不再使用会产生失败记录的 `waitForExistence`，改为非断言式短轮询；如果权限弹窗出现就截图并允许，不出现则继续验证系统通知展示和点击回流。

验证结果：

- live UI test：`H5_DEV_SERVER_URL='http://127.0.0.1:3000/?native=ios&bridgeDebug=1' pnpm validate:ios-notification-ui-test` 通过 1 个 XCTest，生成系统通知截图、点击回流截图和 mp4 录屏。
- 回归：`node --test scripts/manual-evidence-review.test.mjs scripts/collect-ios-acceptance-evidence.test.mjs` 通过 25 项测试。
- 采证工具：`pnpm validate:ios-acceptance-evidence` 通过 29 项测试。
- 护栏：`pnpm validate:native-shells`、`git diff --check` 通过。

阶段价值：

这一阶段把系统通知展示和真实通知点击回流从纯人工缺口推进到可归档 UI test 候选证据。边界仍然清楚：它证明系统通知 banner 和点击回流可被自动捕获，不证明通知权限首弹一定出现，也不自动代表人工验收已通过。

## 阶段 185：HEAD 2018cc1 系统通知 audit 刷新

执行命令：

```bash
H5_DEV_SERVER_URL='http://127.0.0.1:3000/?native=ios&bridgeDebug=1' pnpm validate:ios-notification-ui-test

H5_DEV_SERVER_URL='http://127.0.0.1:3000/?native=ios&bridgeDebug=1' \
AI_CODE_H5_NATIVE_BASE_URL='http://127.0.0.1:3000' \
AI_CODE_API_BASE_URL='http://127.0.0.1:8000' \
AI_CODE_IOS_ACCEPTANCE_SCREENSHOT_DELAY_MS=5000 \
pnpm collect:ios-acceptance-evidence -- --seed-supported-system-evidence --seed-keyboard-input --seed-attachment-inputs --output-dir .tmp/ios-acceptance-evidence/current-head-final-20260601-2018cc1

pnpm collect:v1-completion-audit -- --manual-record best --manual-record-root .tmp/ios-acceptance-evidence --output-dir .tmp/v1-completion-audit/current-best-final-20260601-2018cc1 --external-knowledge-status not_synced
```

结果：

- 证据包路径：`.tmp/ios-acceptance-evidence/current-head-final-20260601-2018cc1`。
- audit 路径：`.tmp/v1-completion-audit/current-best-final-20260601-2018cc1`。
- `notificationUiTest.available=true`，并记录 `ios-notification-ui-test.log`、`ios-notification-ui-test.xcresult`、`system-notification-click.mp4`、`系统通知截图` 和 `通知点击后 App 回流` attachment。
- `automatedEvidence` 包含 `ios_notification_ui_test_artifact`。
- `verdict=not_complete`，`missingEvidenceCount=1`。
- 本地通知和通知点击回流已不再缺系统通知截图 / 点击录屏候选证据。

仍未完成：

- 所有 14 个人工验收 item 仍是 `pending`，`acceptanceVerdict` 仍是 `not_evaluated`。
- 本轮证据包使用 `127.0.0.1`，因此 `h5_address_override` 仍缺“局域网地址 App 启动截图”。
- completion audit 未使用 `--run-automated-commands` 跑全量最终门禁，自动化命令状态仍是 `not_run`。
- 外部知识库状态仍为 `not_synced`。

阶段价值：

这一阶段把 v1 收口的显式证据缺口从 3 个降到 1 个，通知系统链路的自动候选证据已齐：Bridge 同步、系统通知截图、点击录屏和 H5 回流截图都能归档。后续如果要继续向 complete 推进，应补局域网地址 App 启动截图，并由人工把 14 个验收 item 逐项复核为 `passed`，再运行带 `--run-automated-commands` 的正式 completion audit。

## 阶段 186：HEAD eee802b LAN 证据 audit 刷新

执行命令：

```bash
H5_DEV_SERVER_URL='http://192.168.1.238:3000/?native=ios&bridgeDebug=1' \
AI_CODE_H5_NATIVE_BASE_URL='http://192.168.1.238:3000' \
AI_CODE_API_BASE_URL='http://192.168.1.238:8000' \
AI_CODE_IOS_ACCEPTANCE_SCREENSHOT_DELAY_MS=5000 \
pnpm collect:ios-acceptance-evidence -- --seed-supported-system-evidence --seed-keyboard-input --seed-attachment-inputs --output-dir .tmp/ios-acceptance-evidence/current-head-final-20260601-eee802b-lan

pnpm collect:v1-completion-audit -- --manual-record best --manual-record-root .tmp/ios-acceptance-evidence --output-dir .tmp/v1-completion-audit/current-best-final-20260601-eee802b-lan --external-knowledge-status not_synced
```

结果：

- 证据包路径：`.tmp/ios-acceptance-evidence/current-head-final-20260601-eee802b-lan`。
- audit 路径：`.tmp/v1-completion-audit/current-best-final-20260601-eee802b-lan`。
- `ios.h5DevServerUrl=http://192.168.1.238:3000/?native=ios&bridgeDebug=1`，`ios.h5DevServerTargetMarkerFound=true`。
- `notificationUiTest.available=true`，`automatedEvidence` 包含 `ios_notification_ui_test_artifact`。
- `packageFreshness.status=current`，`recordHeadSha=eee802b`，`currentHeadSha=eee802b`。
- `missingEvidenceCount=0`，`verdict=not_complete`。

仍未完成：

- 所有 14 个人工验收 item 仍是 `pending`，`acceptanceVerdict` 仍是 `not_evaluated`。
- 本轮 audit 未使用 `--run-automated-commands`，自动化命令清单仍显示 `not_run`。
- 外部知识库状态仍为 `not_synced`。

阶段价值：

这一阶段把 v1 收口的机器可见证据缺口从 1 个降到 0 个：当前 HEAD 的 review 记录已经有所有 required evidence 的候选材料。真正剩余的发布门槛不再是采证脚本缺字段，而是人工验收结论、全量最终门禁和外部同步状态。

## 阶段 187：语音权限 full audit 稳定化

背景：

- HEAD `692ce4d` 后，`pnpm validate:ios-voice-permission-ui-test` 单独运行曾通过，但 full completion audit 中该命令失败。
- 审计 JSON 显示失败不是 Markdown 呈现问题，而是 XCTest `testNativeVoicePermissionPromptCanBeCaptured` 真正 exit code 65。
- 进一步复现发现语音按钮进入 `正在听...`，说明权限不是被拒绝，而是 Speech / Microphone 已经授权，系统不会再次弹窗；`simctl privacy` 可列出的服务没有 Speech Recognition，单纯 reset `microphone/all` 不足以保证权限回到未决定状态。

实现：

- `validate:ios-voice-permission-ui-test` 默认改用 `com.aiengineeringcode.shell.voicepermissionuitest.<run>` 临时 bundle id 构建 App，让每次测试对 TCC 来说都是新 App。
- 保留 `AI_CODE_IOS_VOICE_PERMISSION_UI_TEST_BUNDLE_ID` 精确覆盖，并新增 `AI_CODE_IOS_VOICE_PERMISSION_UI_TEST_BASE_BUNDLE_ID` 作为默认前缀。
- metadata 新增 `baseBundleId` 和 `bundleId`，便于审计时确认本轮权限弹窗来自哪个测试 bundle。
- `validate:native-shells` 新增 `voicePermissionRunId`、`baseBundleId` 和 `bundleId` 脚本护栏。
- iOS README 更新为“临时 bundle id + 本轮 reset”的真实行为说明。

验证：

- 红灯：新增 native-shells 护栏后，`pnpm validate:native-shells` 先因缺少 `voicePermissionRunId` / `baseBundleId` 失败。
- 绿灯：补齐 run-scoped bundle id 后，`pnpm validate:native-shells` 通过。
- live UI test：`pnpm validate:ios-voice-permission-ui-test` 连续两次通过，日志中分别使用不同 `com.aiengineeringcode.shell.voicepermissionuitest.run...` bundle id，并保存 `麦克风 / 语音识别权限弹窗` 和 `iOS 权限弹窗截图或录屏` attachment。

阶段价值：

这一阶段修复的是验收门禁稳定性，而不是降低验收门槛。语音权限弹窗仍必须真实出现并被 xcresult 归档；只是通过临时 bundle id 避免 Simulator 旧授权状态让测试误以为“没有弹窗”。

## 阶段 188：HEAD 69af3fb full audit 刷新

执行命令：

```bash
H5_DEV_SERVER_URL='http://192.168.1.238:3000/?native=ios&bridgeDebug=1' \
AI_CODE_H5_NATIVE_BASE_URL='http://192.168.1.238:3000' \
AI_CODE_API_BASE_URL='http://192.168.1.238:8000' \
AI_CODE_IOS_ACCEPTANCE_SCREENSHOT_DELAY_MS=5000 \
pnpm collect:ios-acceptance-evidence -- --seed-supported-system-evidence --seed-keyboard-input --seed-attachment-inputs --output-dir .tmp/ios-acceptance-evidence/current-head-final-20260601-69af3fb-lan

pnpm collect:v1-completion-audit -- --run-automated-commands \
  --manual-record .tmp/ios-acceptance-evidence/current-head-final-20260601-69af3fb-lan/manual-evidence-record.review.json \
  --output-dir .tmp/v1-completion-audit/current-full-final-20260601-69af3fb-lan \
  --external-knowledge-status not_synced
```

结果：

- 证据包路径：`.tmp/ios-acceptance-evidence/current-head-final-20260601-69af3fb-lan`。
- full audit 路径：`.tmp/v1-completion-audit/current-full-final-20260601-69af3fb-lan`。
- `headSha=69af3fb`，`packageFreshness.status=current`，`recordHeadSha=69af3fb`。
- `voicePermissionUiTest.available=true`，语音权限弹窗 UI test 已重新进入证据包。
- 21 个自动化命令全部 `passed`。
- `manualEvidence.missingEvidenceCount=0`，但 `manualEvidence.status=failed`、`incompleteItemCount=14`，14 个 item 全部仍为 `pending`。
- `externalKnowledgeSync.status=not_synced`。
- 最终 `verdict=not_complete`。

仍未完成：

- 机器可见证据和自动门禁已经齐，但 review 记录不是人工 filled 记录，不能代表真实验收结论。
- 下一步必须由人工逐项复核 14 个验收 item，生成 `manual-evidence-record.filled.json` 或等价记录，并把状态改为真实 `passed/failed/blocked`。
- filled 记录通过 `--require-complete` 后，还要再次运行带 `--run-automated-commands` 的 completion audit。
- 未真实执行飞书 / Obsidian 同步前，外部同步状态必须保持 `not_synced`。

阶段价值：

这一阶段把“自动化门禁是否稳定”从未证明推进到已证明：当前 HEAD 的 full audit 自动命令全部通过。v1 仍不能完成，是因为人工验收结论和外部同步尚未完成，而不是因为工程门禁或机器证据缺口。

## 阶段 189：人工验收 filled 草稿入口

背景：

- HEAD `69af3fb` 的 full audit 已经证明 21 个自动化命令全部通过，`manualEvidence.missingEvidenceCount=0`。
- 剩余阻塞不是机器缺证据，而是 14 个人工验收 item 仍为 `pending`，`acceptanceVerdict=not_evaluated`。
- 直接手工编辑 JSON 容易漏掉顶层结论、item 状态、操作者说明或证据完整性校验，因此需要一个明确的 operator sign-off 入口。

实现：

- 新增 `scripts/fill-ios-manual-evidence-record.mjs` 和测试，根命令为 `pnpm prepare:ios-manual-evidence-record`。
- 默认模式从 `manual-evidence-record.review.json` 生成 `manual-evidence-record.filled.json` 草稿，只补 `generatedFromReview`、`operatorSignoff.mode=draft` 和操作说明，不改变 `acceptanceVerdict=not_evaluated`，也不把 item 从 `pending` 改成 `passed`。
- `--mark-passed` 模式必须显式传入 `--operator <name>` 和 `--confirmed-at <iso8601>`，并会先用 `--require-complete` 校验证据字段；缺证据时拒绝生成通过记录。
- 通过记录会统一把 14 个 item 标记为 `passed`、清空 blockers，并追加人工复核备注，方便后续 completion audit 使用。

验证：

- `node --test scripts/fill-ios-manual-evidence-record.test.mjs` 通过。
- `pnpm prepare:ios-manual-evidence-record` 通过，并在无参数时只输出用法。
- 针对 `.tmp/ios-acceptance-evidence/current-head-final-20260601-69af3fb-lan/manual-evidence-record.review.json` 生成 filled 草稿后，普通结构校验通过；`--require-complete` 仍按预期失败，说明草稿不会被误判为人工验收通过。

阶段价值：

这一阶段把最后的人工作业从“手改 JSON”收拢成可审计的签署流程：默认先生成安全草稿，只有操作者显式签名和时间戳、且证据字段完整时，才允许生成 completion audit 可消费的 passed 记录。它不降低人工验收门槛，只减少人为漏填和误填。

## 阶段 190：验收事实费用 seed 再稳定化

背景：

- HEAD `04c8a09` 重新生成局域网证据包时，manifest 已经绑定当前 HEAD，但 `acceptanceFactSeed.available=false`。
- 失败点是费用 seed 文案 `新建一条昨天打车费 58 元的费用草稿，备注 ...` 在长期脏会话和真实 LLM provider 下返回了 `assistant_message`，没有生成 `confirmation_required`。
- 费用 seed 失败会连带阻断系统 Calendar App 截图和系统日历取消清理，因为这些证据依赖三领域验收事实 seed 成功。

实现：

- 将费用 seed 改为更结构化的命令式输入：`新增费用草稿，标题 <seedRunId> 验收打车费，金额 58 元，发生日期昨天`。
- 测试护栏要求费用 seed 包含 `费用草稿`、`标题 seed_`、`金额 58 元` 和 `发生日期昨天`，同时不含 `备注` 或 `报销`。
- 同一真实会话探针验证该文案能返回 `confirmation_required` 和 `expense.create_reimbursement_draft`，避免旧草稿上下文把输入误导成管理已有费用或普通闲聊。

验证：

- `pnpm validate:ios-acceptance-evidence` 通过，29 个测试全部 pass。
- `pnpm validate:native-shells` 通过。

阶段价值：

这一阶段修的是自动采证稳定性，不是产品语义让步。用户真实输入仍可以自然表达费用；采证 seed 则应尽量结构化、可重复，避免真实 LLM 在长期会话上下文中漂移，影响 completion audit 对系统日历写入和取消清理辅助证据的判断。

## 阶段 191：HEAD 44574d1 full audit 刷新

执行命令：

```bash
H5_DEV_SERVER_URL='http://192.168.1.238:3000/?native=ios&bridgeDebug=1' \
AI_CODE_H5_NATIVE_BASE_URL='http://192.168.1.238:3000' \
AI_CODE_API_BASE_URL='http://192.168.1.238:8000' \
AI_CODE_IOS_ACCEPTANCE_SCREENSHOT_DELAY_MS=5000 \
pnpm collect:ios-acceptance-evidence -- --seed-supported-system-evidence --seed-keyboard-input --seed-attachment-inputs --output-dir .tmp/ios-acceptance-evidence/current-head-final-20260601-44574d1-lan

pnpm prepare:ios-manual-evidence-record -- \
  --record .tmp/ios-acceptance-evidence/current-head-final-20260601-44574d1-lan/manual-evidence-record.review.json \
  --output .tmp/ios-acceptance-evidence/current-head-final-20260601-44574d1-lan/manual-evidence-record.filled.json

pnpm collect:v1-completion-audit -- --run-automated-commands \
  --manual-record .tmp/ios-acceptance-evidence/current-head-final-20260601-44574d1-lan/manual-evidence-record.filled.json \
  --output-dir .tmp/v1-completion-audit/current-full-final-20260601-44574d1-lan \
  --external-knowledge-status not_synced
```

结果：

- 证据包路径：`.tmp/ios-acceptance-evidence/current-head-final-20260601-44574d1-lan`。
- full audit 路径：`.tmp/v1-completion-audit/current-full-final-20260601-44574d1-lan`。
- `acceptanceFactSeed.available=true`，费用 seed 已恢复为 `expense.create_reimbursement_draft` 确认 / 执行链路。
- `calendarSystemAppEvidence.available=true`、`calendarCleanupSeed.available=true`、`notificationSyncBridge.available=true`、`notificationUiTest.available=true`、`voicePermissionUiTest.available=true`、`nativeAttachmentInputs.available=true`。
- `manualEvidence.missingEvidenceCount=0`，`packageFreshness.status=current`，`recordHeadSha=44574d1`，`currentHeadSha=44574d1`。
- 21 个自动化命令全部 `passed`，包括 product smoke、Postgres smoke、H5 click smoke、iOS build / simulator smoke、6 条 iOS UI test、LLM smoke、SDK / contract / native-shells / context-sync / v1-readiness 和 `git diff --check`。
- 最终 `verdict=not_complete`，因为 `acceptanceVerdict=not_evaluated`，14 个人工验收 item 仍全部为 `pending`。
- `externalKnowledgeSync.status=not_synced`。

阶段价值：

这一阶段把最新代码 HEAD 的工程侧收尾重新证明为“自动化全绿、机器证据齐、证据包新鲜”。v1 仍不能完成的唯一产品验收阻塞已经收敛为人工 operator sign-off：必须由真实操作者逐项复核 14 个 item 后，再用 filled 记录标记 `passed` 并重跑 completion audit。AI 不能代替这一步。

## 阶段 192：人工验收 Review Pack 入口

背景：

- HEAD `44574d1` 的 full audit 已经证明自动化命令全绿、机器证据缺口为 0，但 14 个人工验收 item 仍是 `pending`。
- `manual-evidence-record.review.json` 是结构化 JSON，适合机器校验，但不适合操作者快速浏览每个 item 的证据、缺口和签署边界。
- filled 草稿入口已经能生成签署文件，但签署前还需要一个只读复核包，避免操作者直接面对 JSON 漏看 `packageFreshness`、`acceptanceVerdict` 或 stale HEAD 风险。

实现：

- 新增 `scripts/generate-ios-manual-review-pack.mjs` 和测试，根命令为 `pnpm prepare:ios-manual-review-pack`。
- 命令输入 `--record <manual-evidence-record.review.json>`，默认在同目录写出 `manual-evidence-review-pack.md`。
- Review Pack 汇总 record 路径、输出路径、record HEAD、当前 HEAD、`packageFreshness`、`acceptanceVerdict`、manual flags、item 状态统计、每个 item 的缺少候选证据和已预填证据。
- 当 record HEAD 与当前 HEAD 不一致时，pack 会标记 `packageFreshness: stale`，提醒不能把旧 HEAD 证据当成当前代码验收。
- `validate:native-shells` 已新增护栏，确保根命令、脚本、测试、`packageFreshness` 和“本文件不代表验收通过”等边界文案不会被移除。

验证：

- `node --test scripts/generate-ios-manual-review-pack.test.mjs` 通过，3 个测试全部 pass。
- `pnpm prepare:ios-manual-review-pack -- --record .tmp/ios-acceptance-evidence/current-head-final-20260601-44574d1-lan/manual-evidence-record.review.json` 通过，并生成 `.tmp/ios-acceptance-evidence/current-head-final-20260601-44574d1-lan/manual-evidence-review-pack.md`。
- `pnpm validate:native-shells`、`pnpm validate:context-sync` 和 `git diff --check` 通过。

阶段价值：

这一阶段没有降低验收门槛，而是把最后的人工 operator sign-off 变得可读、可检查、可追踪。Review Pack 是签署前的复核工作台，不是通过证明；只有真实操作者生成 passed filled 记录，并通过 `--require-complete` 和 full completion audit，v1 goal 才能继续收口。
