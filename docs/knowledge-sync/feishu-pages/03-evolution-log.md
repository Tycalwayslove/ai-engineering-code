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
