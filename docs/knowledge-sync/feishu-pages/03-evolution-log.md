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
