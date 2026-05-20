# 13 AI 时间管理 Agent：UI 设计图草案

## 当前阶段

AI 时间管理 Agent 已从 design brief 进入 UI 设计图草案阶段。

这一步的目标不是开始开发，而是把已经确认的需求和设计输入转成可审阅的界面资产。UI 图必须能追溯到 PRD、Design Brief、Hybrid 边界和人工确认记录。

## Figma 设计图

- 文件名：AI 时间管理 Agent - UI 设计图 v0.1
- 链接：<https://www.figma.com/design/HkZQagTFqRtGaoxwOGcriy>
- 当前页面：`AI 时间管理 Agent v0.4`
- v0.4 页面：<https://www.figma.com/design/HkZQagTFqRtGaoxwOGcriy?node-id=33-2>

## 覆盖画板

| 画板                              | 说明                                                             |
| --------------------------------- | ---------------------------------------------------------------- |
| 01 主界面 / iOS26 Liquid Glass    | 展示类似千问的主界面：顶部玻璃 header、中间内容区、底部输入栏。  |
| 02 侧滑面板 / iOS26 Liquid Glass  | 展示左上角按钮打开侧滑面板，承载对话、日程、收件箱、连接器入口。 |
| 03 创建日程 / 对话与确认          | 展示底部输入驱动 AI 创建日程、追问具体时间和执行前确认。         |
| 04 内容区 / 无底部 Tab            | 展示去掉底部 tab 后，中间内容区如何承载日程结果。                |
| 05 深色模式 / Liquid Glass        | 展示深色模式下 Liquid Glass 和内容卡片的可读性。                 |
| 06 对象详情 / 日程详情            | 展示已创建日程的详情页、来源、提醒、参与者和重复规则。           |
| 07 编辑 Sheet / 修改时间          | 展示轻量字段编辑，不跳转复杂表单。                               |
| 08 时间收件箱 / 待补充            | 展示自然语言输入不完整时的暂存、待补充、待确认和同步失败状态。   |
| 09 内部日历 / 周视图              | 展示第一版内部日历周视图。                                       |
| 10 待办与提醒 / 分组列表          | 展示待办和提醒的规则差异。                                       |
| 11 连接器与权限 / 后续扩展        | 展示系统日历、飞书会议、Things3 等后续连接器。                   |
| 12 通知授权 / 权限说明            | 展示通知权限申请前的解释页。                                     |
| 13 状态覆盖 / Loading Error Empty | 展示加载、同步失败、空状态和恢复路径。                           |

## v0.2 修订

v0.1 的问题是更像流程说明稿，真实 App 质感不足。

v0.2 使用 `ui-ux-pro-max` skill 重新校准移动端 UI，方向调整为“智能时间驾驶舱”：

- 采用 Soft UI Evolution 风格，轻阴影、清晰层级、可读性优先。
- 使用日历蓝和执行绿作为主色，贴合日程与行动管理。
- 首页强化 AI 计划建议、待确认卡片和三类时间对象指标。
- 保留 Hybrid 边界：H5 控制工作台、AI 输入、确认卡片和底部导航，原生层继续作为稳定容器。

## v0.3 修订

用户继续反馈 v0.2 未达到预期，并明确希望接近 iOS 26 / Liquid Glass 风格：

- 不要底部 tab。
- 底部保留输入栏。
- 顶部 header 增加功能按钮。
- 左上角有按钮可以划出面板。
- 中间是内容区，整体类似千问 App。

v0.3 因此调整为“对话式时间管理 Agent”：

- 顶部使用 Liquid Glass header，承载侧滑面板入口、标题、日历/更多功能按钮。
- 底部使用 Liquid Glass composer，只保留输入和快捷能力。
- 中间内容区承载 AI 回复、待确认卡片、日程结果和建议。
- 侧滑面板承载今天、时间收件箱、内部日历、待办列表和后续连接器。
- 内容层避免滥用玻璃材质，保证文字和卡片可读性。

## v0.3 细节补充

主视觉方向暂时冻结后，又补齐了 8 类辅助页面和交互状态：

- 对象详情：用于查看 AI 创建后的日程、来源、提醒和重复规则。
- 编辑 sheet：用于轻量修改时间等关键字段。
- 时间收件箱：用于承接待补充、待确认和同步失败的输入。
- 内部日历：先跑通 App 内部周视图。
- 待办与提醒：明确待办和提醒的规则差异。
- 连接器与权限：为系统日历、飞书会议、Things3 保留后续入口。
- 通知授权：先解释用途，再触发系统权限。
- 状态覆盖：加载、错误、空状态都提供反馈和恢复路径。

## v0.3 原型交互

用户确认当前视觉方向后，又进一步询问 Figma 是否可以直接增加点击跳转和切换效果。因此这次在 Figma v0.3 页面上补充了可点击原型。

当前原型入口为：`AI 时间管理 Agent v0.3 原型入口`。

已覆盖的演示链路：

- 左上角按钮进入侧滑面板。
- 主界面待确认卡片进入对象详情。
- 底部输入框或发送按钮进入创建日程流程。
- 创建日程确认后进入内容区。
- 创建日程修改进入编辑 sheet 状态。
- 对象详情可修改、完成或继续对话。
- 侧滑面板可进入今天、时间收件箱、内部日历、待办列表和连接器。
- 时间收件箱条目可进入补全确认或详情。
- 内容区、内部日历、待办与提醒中的事项可进入详情。
- 连接器进入通知/权限说明，权限说明可回到连接器或主界面。
- 状态页重试按钮回到内容区。
- 深色模式参考页也补了基础入口，方便演示时不中断。

这一步的价值是：设计图从静态说明稿升级为可演示原型。面试或评审时，可以顺着一条真实路径讲清楚“用户输入 -> AI 追问 -> 执行前确认 -> 事项详情 -> 编辑/连接器/权限”的产品闭环。

当前仍不是最终工程交互规范。侧滑面板和编辑 sheet 先用状态画板跳转表达，暂不引入复杂 overlay 变量或组件状态。

## 关键设计判断

### 对话式内容区优先

v0.3 不再是传统工作台，也不再使用底部 tab。首页以对话式内容区为主，底部输入始终可达，AI 回复、确认卡片和时间对象结果在中间区域展开。

### H5 承载产品变化

工作台、AI 输入、确认卡片、时间对象列表和底部导航都由 H5 控制。原生层主要负责稳定容器、safe area、通知授权、本地能力和未来系统日历桥接。

### 确认卡片建立信任

AI 不静默创建或修改事项。所有执行动作都先转成确认卡片，用户检查后再确认、修改或取消。

### 时间收件箱承接不完整输入

自然语言输入经常缺信息。时间收件箱用于保存待补充、待确认和待同步的事项，避免信息在对话里丢失。

## 面试讲解重点

这个阶段展示的是 AI 原生软件工厂的不同点：设计图不是凭感觉生成的，而是流程化地产生，并且可以根据评审反馈进入同一流程内的修订。

从想法到产品理解、需求点、PRD、Design Brief，再到 UI 设计图，每一步都有人工确认、源文件和运行记录。面试官可以看到这个项目不仅是在写代码，而是在搭建一套可追溯的 AI 协作生产流程。

## 当前状态

UI 设计图已经生成，并补充了可点击原型交互。2026-05-19 用户进一步评审后确认：v0.3 仍不能作为下一步工程输入，因为问题不只是视觉风格，而是产品主路径和信息架构仍偏“日历工作台 + AI 输入”。

因此当前状态已从“等待确认 v0.3”调整为“进入 v0.4 重画前的需求与 UI 修订”。下一版 Figma 应按“AI 执行流 + Timepage 风格 Timeline Drawer”重画，而不是在 v0.3 上继续微调样式。

## 2026-05-19 方向修订

用户提供参考产品截图和 AI 笔记后，确认了新的产品与 UI 判断：

- 产品主定位从“AI 时间管理工作台”改为“AI 日程执行 Agent”。
- 首页默认展示 AI 执行流，而不是日历/周视图。
- 用户只输入意图，后端负责解析、补全、计划、风险分级、确认和执行。
- 前端只负责展示对话、状态、确认卡片、结果卡片和检查入口。
- 左侧按钮打开 Timeline Drawer，不再是普通菜单。
- Timeline Drawer 参考 Timepage，展示今天 + 未来 7 天的日期轴和事项摘要。
- 右上角保留执行记录和完整日历两个入口。
- 实时执行状态固定在输入框上方，不随对话滚动消失。
- 费用管理只做 DDD 架构预留，不进入 V1。

## 下一版 Figma 画板要求

v0.4 至少需要覆盖：

| 画板            | 目的                                        |
| --------------- | ------------------------------------------- |
| 首页默认态      | AI 执行流、顶部三入口、底部输入和固定状态栏 |
| Timeline Drawer | Timepage 风格日期轴，展示今天 + 未来 7 天   |
| 信息补全态      | 缺日期、缺时间或缺目标对象时的追问          |
| 单项确认卡片    | 创建或修改单个日程前的复述确认              |
| 批量确认卡片    | 清空、批量创建、批量删除等高风险操作        |
| 执行结果卡片    | 完成、部分失败、可撤销的结果呈现            |
| 执行记录视图    | AI 操作账本，不是聊天历史                   |
| 完整日历视图    | 日/周/月检查结果，不作为主要创建入口        |
| 事项详情页      | 主动点开某个事项后的查看和编辑入口          |

## 当前状态

v0.3 作为历史设计证据保留。下一步建议进入 Figma v0.4 重画，并在重画前以以下两份文档作为权威输入：

- `ai-factory/specs/requirements/2026-05-19-ai-time-management-agent-execution-workbench-revision.md`
- `ai-factory/specs/design/2026-05-19-ai-time-management-agent-ui-revision.md`

## v0.4 重画结果

2026-05-19 已使用 `ui-ux-pro-max` 的移动端 UI 规则重画 Figma v0.4。

v0.4 的重点不是继续追求玻璃视觉，而是解决 v0.3 的信息架构问题：

- 顶部按钮语义固定：左侧 Timeline Drawer，右侧执行记录和完整日历。
- 首页默认是 AI 执行流，不再是日历工作台。
- Timeline Drawer 参考 Timepage，只做日期上下文，不放连接器或设置。
- 固定执行状态栏放在输入框上方，不随对话滚动消失。
- 高风险操作用结构化确认卡片列出影响范围。
- 日历只作为结果检查工具，不承担主要创建入口。

覆盖画板：

| 画板                               | 说明                             |
| ---------------------------------- | -------------------------------- |
| 00 v0.4 Design System & Flow       | 设计约束、设计令牌和执行流水线。 |
| 01 首页默认态 / AI 执行流          | 首页主舞台。                     |
| 02 Timeline Drawer / Timepage 风格 | 日期上下文抽屉。                 |
| 03 信息补全 / 缺日期               | AI 追问缺失字段。                |
| 04 单项确认 / 中风险               | 单项写入前确认。                 |
| 05 批量确认 / 高风险               | 批量或清空操作确认。             |
| 06 固定状态栏 / 多状态             | 展示实时执行状态。               |
| 07 执行结果 / 已完成               | 完成结果卡片。                   |
| 08 执行记录 / AI 操作账本          | 审计 AI 操作。                   |
| 09 完整日历 / 结果检查             | 检查与定位。                     |
| 10 事项详情 / 主动点开             | 主动查看详情。                   |
| 11 v0.4 Interaction Map            | 页面关系和交互规则。             |

已补充 16 个基础可点击原型入口，可演示从首页到 Timeline、执行记录、完整日历、信息补全、确认、结果和详情的主路径。

当前状态：v0.4 已生成，等待用户评审。

## 后续版本：v0.5 本地组件库

用户补充提出：后续需要建立本地组件库，从设计风格到代码侧组件库，再到可下载 icon 图标库，都应该纳入体系。

因此 v0.5 作为一个独立设计系统版本，不新增产品功能，专门沉淀 v0.4 中已经稳定的 UI 模式。

当前已完成第一版实施：

- `packages/shared-ui/src/tokens`：设计令牌与 CSS 变量映射。
- `packages/shared-ui/src/icons`：React Icon 组件与本地 SVG 图标资产。
- `packages/shared-ui/src/primitives`：Button、IconButton、StatusBadge。
- `packages/shared-ui/src/composites`：ComposerBar、ExecutionStatusBar、MessageBubble、ConfirmationCard、TimelineDrawer。
- `packages/shared-ui/src/layouts`：MobileAgentShell。
- `apps/h5/src/app/design-system/page.tsx`：组件库示例页。
- Figma 页面：`AI 时间管理 Agent v0.5 Design System`
- Figma 链接：<https://www.figma.com/design/HkZQagTFqRtGaoxwOGcriy?node-id=46-27>
- Figma 本地组件：Button、IconButton、StatusBadge、MessageBubble、ExecutionStatusBar、ComposerBar、ConfirmationCard、TimelineDrawer、MobileAgentShell。
- Figma 图标组件：11 个本地 SVG 图标组件。
- Figma 映射区：列出 Figma Component 到 `packages/shared-ui` 源码路径的对应关系。

2026-05-20 又补充了两个面向后续维护的区域：

- `05 Component Gallery`：直接展示 Button、IconButton、StatusBadge、ExecutionStatusBar、MessageBubble、ComposerBar、ConfirmationCard、TimelineDrawer、MobileAgentShell 的当前样式、用途和代码来源。
- `06 Design System Changelog`：记录组件库视觉与代码变更，说明每次组件库更新应同步到 Figma、仓库、Obsidian、飞书和 Git 提交。

后续如果组件库发生修改，查看路径固定为：

| 位置                 | 用途                               |
| -------------------- | ---------------------------------- |
| Figma v0.5 Gallery   | 直接看组件当前样式。               |
| Figma v0.5 Changelog | 看组件库视觉和代码变更摘要。       |
| `packages/shared-ui` | 看真实代码实现。                   |
| workflow run         | 看这次修改为什么发生、范围是什么。 |
| Obsidian 阶段成果    | 看过程记录和内部复盘。             |
| 飞书 UI 设计页       | 给外部读者和面试官看项目演进。     |
| Git 提交             | 看可验证的变更边界和中文提交说明。 |

仍保留为下一步的设计资产建设：

- 后续 Code Connect 候选计划。
- 更完整的 Figma 变量绑定。
- Lucide 图标子集替换策略。

这一步的价值是让后续 AI 生成 UI 时优先复用设计系统资产，而不是每次重新画一套临时组件。

## 仓库证据

- `ai-factory/specs/design/2026-05-18-ai-time-management-agent-ui-design.md`
- `ai-factory/specs/requirements/2026-05-19-ai-time-management-agent-execution-workbench-revision.md`
- `ai-factory/specs/design/2026-05-19-ai-time-management-agent-ui-revision.md`
- `ai-factory/specs/design/2026-05-19-ai-time-management-agent-design-system-v0-5-plan.md`
- `ai-factory/workflows/runs/2026-05-19-design-system-v0-5-implementation.md`
- `ai-factory/workflows/ui-design-draft.md`
- `ai-factory/workflows/registries/ui-design-draft.manifest.json`
- `ai-factory/workflows/runs/2026-05-18-ui-design-draft-ai-time-management-agent.md`
- `ai-factory/workflows/runs/2026-05-19-ai-time-management-agent-requirement-ui-revision.md`
- `ai-factory/workflows/runs/2026-05-19-ui-redraw-ai-time-management-agent-v0-4.md`
