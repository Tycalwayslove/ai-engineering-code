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
