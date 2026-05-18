# AI 原生软件工厂单体仓库设计

日期：2026-05-18
状态：已批准进入实施计划

## 目的

本仓库是 AI 原生软件工厂的长期基础。 它必须支持产品应用、后端与 AI 运行时、持久记忆、工作流编排、设计系统基础设施，以及稳定的跨运行时契约。

第一阶段有意只启动一个轻量骨架。目标是稳定、可运行、可检查的基础，而不是生产级复杂度或自主 agent 行为。

## 设计原则

- 优化 AI 可读性、确定性导航、可预测所有权和低认知负担。
- 优先显式结构，而不是隐藏抽象。
- 保持本地开发简单透明。
- 第一阶段中工作流以手动优先。
- 将规格、记忆、提示词、工作流、契约和设计系统文件视为一等基础设施。
- 先实现再抽象。没有真实压力前，不添加插件系统、生成器、事件系统、框架适配器、基础设施层或超出必要的注册表。
- 保持人类可检查性。人必须能检查契约、提示词、记忆、编排路径和工作流状态。
- 重大架构变化必须记录 ADR、迁移理由、单一事实来源更新和依赖影响评审。

## 顶层结构

```text
/
  apps/
  services/
  python/
  packages/
  contracts/
  ai-factory/
  infra/
  docs/
  scripts/
  .github/
```

`apps/` 包含面向用户的客户端。

`services/` 包含服务边界定义；第一阶段中不是独立运行时。

`python/` 包含可执行后端和 AI 运行时基础。

`packages/` 包含前端应用和工具共享的 TypeScript 包。

`contracts/` 包含机器可读的跨运行时协议。

`ai-factory/` 包含 AI 原生运行基础设施。

`infra/` 包含本地开发和部署脚手架。

`docs/` 包含面向人的架构、约定、上手指南和 ADR。

`scripts/` 包含显式自动化入口。

`.github/` 包含 CI/CD 工作流基线。

每个主要目录都必须包含 `README.md`，说明所有权目的、运行时职责、依赖边界和预期演进路径。

## 工作区与运行时设置

仓库在一个 monorepo 下使用两个清晰生态。

TypeScript 工作区：

```text
package.json
pnpm-workspace.yaml
turbo.json
tsconfig.base.json
```

Python 工作区：

```text
pyproject.toml
.python-version
```

`uv.lock` 只应在依赖解析完成后生成。

本地开发必须保持透明：

```bash
pnpm dev
pnpm dev:h5
pnpm dev:admin
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm format
```

Python 运行时命令保持可见：

```bash
uvicorn backend.app.main:app --app-dir python/backend --reload
ruff check python
ruff format python
mypy python
pytest python
```

`pnpm dev` 启动前端工作区。Python 运行时命令保持显式可见。早期启动应避免隐藏式编排包装器。

## 应用

```text
apps/
  README.md
  h5/
    README.md
    src/
    public/
  admin/
    README.md
    src/
    public/
  ios/
    README.md
  android/
    README.md
```

`apps/h5` 是移动优先的 Web 界面。

`apps/admin` 是内部运营/管理界面。

`apps/ios` 和 `apps/android` 在第一阶段中仅作为所有权占位。

前端应用必须保持很薄。业务逻辑应逐步移动到 `packages/sdk`、后端服务、编排器接口和工作流驱动的后端行为中。应用不得包含前端编排逻辑、重复状态机、散落业务逻辑、直接端点调用、服务导入或直接读取 AI 工厂。

## TypeScript 包

```text
packages/
  README.md
  shared-ui/
    README.md
    src/
      primitives/
      composites/
      layouts/
  shared-types/
    README.md
    src/
  config/
    README.md
    eslint/
    typescript/
  sdk/
    README.md
    src/
```

`packages/shared-ui` 拥有可复用 UI 基础组件、组合组件和布局。

`packages/shared-types` 拥有面向 TypeScript 的类型。它可以镜像 `/contracts`，但不是跨运行时单一事实来源。

`packages/config` 拥有共享 TypeScript 工具配置。

`packages/sdk` 拥有前端 API 访问能力。它是前端访问后端能力的唯一批准路径。

SDK 拥有请求处理、重试策略、认证 token 处理、API 类型和传输抽象。应用不得实现自定义网络行为。

依赖方向：

```text
apps/* -> packages/sdk
apps/* -> packages/shared-ui
apps/* -> packages/shared-types
apps/* -> packages/config
packages/sdk -> packages/shared-types
packages/shared-ui -> packages/shared-types when needed
```

任何包都不应从应用导入。

## Python 运行时

```text
python/
  README.md
  backend/
    README.md
    app/
      routes/
      services/
  agent-runtime/
    README.md
    agent_runtime/
  orchestrator/
    README.md
    orchestrator/
```

`python/backend` 拥有第一个可运行的 FastAPI 应用。启动阶段暴露健康检查和版本路由。

`python/agent-runtime` 拥有 agent 执行基础能力。在真实工作流需求证明 LangGraph 或类似工具合理之前，保持轻框架。

`python/orchestrator` 拥有显式工作流执行、具名注册、声明式输入和可见状态转换。

后端分层：

```text
routes
  -> services
    -> orchestrator interfaces
      -> agent-runtime or memory interfaces
```

路由不得直接调用工作流、直接加载提示词或直接访问记忆文件。

Python 依赖方向：

```text
backend -> orchestrator
orchestrator -> agent-runtime
orchestrator -> explicit workflow definitions
agent-runtime -> explicit prompt and memory inputs
```

避免循环导入、运行时魔法、隐式依赖注入、深继承和动态发现。

## 服务边界

```text
services/
  README.md
  api-gateway/
    README.md
  conversation-service/
    README.md
  memory-service/
    README.md
  profile-service/
    README.md
```

`services/*` 在第一阶段中是所有权和契约边界。它们不是独立运行时，也不得重复配置、基础设施、Dockerfile、依赖树或隐藏服务脚手架。

每个服务 README 必须定义：

- 边界存在的原因
- 职责
- 非职责
- 它拥有或消费的契约
- 足以证明拆分合理的压力
- 不应证明拆分合理的压力

初始边界：

- `api-gateway`：公共后端入口边界
- `conversation-service`：会话和会话状态领域边界
- `memory-service`：持久记忆和工作记忆访问边界
- `profile-service`：用户、画像和上下文边界

只有出现明确运营压力后才允许拆分，例如独立扩缩容需求、独立数据所有权、独立部署节奏、成熟契约或真实运营要求。

## 契约

```text
contracts/
  README.md
  openapi/
    README.md
    api-gateway.yaml
  events/
    README.md
  memory/
    README.md
    memory-document.schema.json
  workflow/
    README.md
    workflow-manifest.schema.json
```

`contracts/` 拥有机器可读的跨运行时协议。

单一事实来源规则：

- `/contracts/openapi` 定义 HTTP API 形态。
- `/contracts/events` 在事件存在时定义事件载荷。
- `/contracts/memory` 定义持久记忆和工作记忆元数据。
- `/contracts/workflow` 定义工作流 manifest 形态。
- `packages/shared-types` 可以为 TypeScript 使用镜像契约。
- Python 模型可以为后端使用镜像契约。
- 运行时代码不得静默重定义契约。

契约应从最小且可读开始。强制执行可以稍后增长。

## AI 工厂

```text
ai-factory/
  README.md
  agents/
    README.md
    registry.md
  workflows/
    README.md
    registries/
    states/
    templates/
  memory/
    README.md
    durable/
      architecture/
      product/
      design/
      decisions/
      api/
    working/
      tasks/
      iterations/
      active-context/
      retrospectives/
  specs/
    README.md
    active/
    archived/
    templates/
  prompts/
    README.md
    system/
    roles/
    workflows/
    tasks/
    evaluation/
    goal-mode/
  design-system/
    README.md
    tokens/
    components/
    patterns/
    figma/
    prompts/
  playbooks/
    README.md
    feature-development/
    bugfix/
    review/
    release/
```

`ai-factory/` 是 AI 原生开发的结构化运行上下文。

`agents/` 存放显式 agent 定义：目的、输入、输出、允许工具、记忆访问规则和升级路径。

`workflows/` 存放工作流定义、模板、状态和注册表。工作流必须声明输入、输出、状态转换和使用的记忆领域。

`memory/` 分离持久记忆和工作记忆。

持久记忆存放稳定项目知识：

```text
memory/durable/architecture
memory/durable/product
memory/durable/design
memory/durable/decisions
memory/durable/api
```

工作记忆存放临时执行上下文：

```text
memory/working/tasks
memory/working/iterations
memory/working/active-context
memory/working/retrospectives
```

`specs/` 存放实施意图。

`prompts/` 存放分层提示词基础设施。避免巨型万能提示词。系统提示词、角色提示词、工作流提示词、任务提示词、评估提示词和 Goal Mode 提示词应分开使用。

`design-system/` 存放 UI 生成规则、设计理由、令牌、组件指南、模式、Figma 引用和设计提示词。

`playbooks/` 存放人和 agent 的运营指南。

第一阶段中 Markdown 保持单一事实来源。没有运营压力前，不引入数据库、注册表、向量基础设施、schema 引擎或自动化。

运行时代码只能通过显式路径、加载器或注册表读取 AI 工厂文件。不得动态自动加载 agent、工作流、提示词、工具或记忆。

## 单一事实来源

```text
contracts/                  runtime agreements
ai-factory/specs            implementation intent
ai-factory/memory           historical and execution memory
ai-factory/prompts          prompt infrastructure
ai-factory/workflows        workflow operating model
ai-factory/design-system    UI generation rules
ai-factory/playbooks        operational guidance
packages/                   TypeScript implementation
python/                     backend and AI runtime implementation
services/                   service ownership boundaries
docs/adr                    architectural reasoning
```

运行时代码不得静默重定义单一事实来源内容。

## 工作流纪律

第一阶段工作流以手动优先。不存在自主循环、自修改工作流、自动执行 agent、隐藏提示词注入、魔法式运行时扫描或不可见工作流行为。

工作流执行最终应支持日志、状态检查、可重放性和确定性追踪。启动阶段只需要目录和约定基础。

## 记忆纪律

记忆访问最终应通过显式接口、仓储和加载器流动。避免系统内任意文件访问。

人类可读 Markdown 保持单一事实来源。索引记忆或 RAG 系统只有需要时才出现。

## 设计系统纪律

`ai-factory/design-system` 拥有设计意图和 AI 生成规则。

`packages/shared-ui` 拥有已实现 UI 代码。

设计令牌未来可以输出 CSS 变量、Tailwind 配置或平台令牌，但启动阶段应保持可读且显式。

## 本地开发基础设施

```text
docker-compose.yml
infra/
  README.md
  docker/
    README.md
    backend.Dockerfile
    frontend.Dockerfile
```

初始 Docker Compose 服务：

- `frontend`
- `backend`
- `postgres`
- `redis`

不包含 Kubernetes。直到记忆/RAG 实现需要前，不添加向量数据库。第一阶段中不为 `services/*` 添加独立服务容器。

## CI/CD 基线

```text
.github/
  workflows/
    ci.yml
```

初始 CI 质量门禁：

- 安装 pnpm 依赖
- TypeScript lint
- TypeScript typecheck
- TypeScript 测试占位
- Python ruff 检查
- Python 格式检查
- Python mypy
- Python pytest 占位
- 可行时检查 Docker Compose 语法

CI 验证骨架健康度，不模拟生产环境。

## 文档

```text
docs/
  README.md
  architecture/
    README.md
    overview.md
  adr/
    README.md
    0001-polyglot-ai-native-monorepo.md
  conventions/
    README.md
    ai-readability.md
    naming.md
    source-of-truth.md
    anti-patterns.md
    evolution.md
  onboarding/
    README.md
    local-development.md
```

`docs/architecture` 解释系统形态。

`docs/adr` 记录架构决策和理由。

`docs/conventions` 定义人和 agent 的稳定规则。

`docs/onboarding` 解释如何运行仓库。

`docs/conventions/anti-patterns.md` 必须禁止过早微服务化、隐藏式运行时发现、提示词重复、上下文重复、魔法式抽象、前端业务编排，以及任意模块直接访问记忆。

`docs/conventions/evolution.md` 必须定义何时允许拆分、何时抽象合理、何时工作流成为运行时、何时记忆可被索引，以及何时强制执行契约。

## 反模式

避免：

- 过早微服务化
- 隐藏式运行时发现
- 提示词重复
- 上下文重复
- 魔法式抽象
- 前端业务编排
- 任意模块直接访问记忆
- 动态自动加载 agent、工作流、提示词、工具或记忆
- 产品压力出现前的生产基础设施
- 在第一个真实工作流前集成 LangGraph
- 真实事件压力出现前的事件系统
- 深继承和元编程
- 隐藏式依赖注入
- 重复的单一事实来源定义

## 演进规则

只有实现呈现重复且稳定的模式时，抽象才合理。

只有运营压力和成熟契约能证明服务拆分合理。

只有真实工作流需要执行、状态、日志、重放或人工评审后，工作流定义才成为运行时。

只有基于文件的记忆不足以支撑真实检索任务后，记忆才应被索引。

只有手工维护契约开始造成漂移或集成风险后，才强制执行契约。

每次重大架构变化都需要 ADR、迁移理由、单一事实来源更新和依赖影响评审。

## 实施范围

第一阶段应产出：

- 稳定的仓库骨架
- 可运行的前端基础
- 可运行的 FastAPI 基础
- 显式 AI 工厂目录
- 显式服务边界 README
- 最小契约
- Docker Compose 基线
- CI 基线
- 架构和约定文档

第一阶段不应产出：

- 生产级分布式系统
- Kubernetes
- 自主 agent
- 自修改工作流
- 向量记忆基础设施
- 工作流自动化
- 过早微服务运行时
- 没有真实工作流时集成 LangGraph

## 需要关注的风险

该设计包含许多一等目录。实施必须让每个目录保持浅层且目的明确，以保证骨架可读。

如果文件没有清楚说明所有权和演进路径，AI 工厂结构可能变成仪式化目录。

如果后续不添加有意的校验或生成流程，契约层可能与实现漂移。

如果服务 README 没有明确非触发条件，服务边界层可能诱发过早拆分。

如果允许应用添加临时网络逻辑，SDK 边界会被侵蚀。

## 自检发现

该规格中没有遗留占位内容。

服务边界模型与第一阶段运行时模型之间不再存在矛盾。`services/*` 只定义所有权和契约；`python/backend` 保持集中式可运行后端。

工作流就绪性与轻框架实现之间不再存在矛盾。仓库预留工作流、状态和注册表位置，但在真实工作流出现前不安装编排框架。

机器可读契约与 Markdown 优先运行方式之间不再存在矛盾。`/contracts` 保存最小 schema 和 OpenAPI 文件；AI 工厂记忆、提示词、作战手册和规格保持为可读的 Markdown 单一事实来源。

最大的过度工程化风险是目录数量。实施计划必须创建浅层 README 和最小占位文件，而不是深层脚手架。

第二个过度工程化风险是意外的运行时重复。实施计划必须避免独立服务依赖树、逐服务 Dockerfile 和过早框架适配器。

第三个过度工程化风险是仪式化 AI 基础设施。每个 AI 工厂 README 必须说明该目录何时使用，以及什么不应放在其中。
