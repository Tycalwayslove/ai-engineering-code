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
