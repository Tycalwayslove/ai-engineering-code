# AI 时间管理 Agent 需求点记录

## 记忆类型

- domain: product
- status: draft

## 元数据

- id: req-ai-time-management-agent-001
- kind: requirement
- priority: p0
- source: ai-factory/specs/product-understanding/2026-05-18-ai-time-management-agent-product-understanding.md
- linkedSpec:
- needsDesignInput: true
- prdCandidate: true

## 需求陈述

AI 时间管理 Agent 第一版必须让用户通过文字对话创建、查询、修改和取消 App 内部的日程、待办和提醒。AI 必须能识别用户的时间管理意图，在信息不足时追问，在执行前展示确认卡片，并在用户确认后写入内部时间对象。

第一版必须采用 Hybrid 产品边界：原生 App 提供稳定容器和设备能力，H5 承担主要产品界面与 AI 时间管理流程，二者通过显式 Bridge Contract 通信。第一版先跑通 App 内部闭环，账号体系、手机系统日历、飞书会议、Things3 等外部连接器后续开发。

## 子需求

### req-ai-time-management-agent-001-a：时间对象

第一版必须支持三类内部时间对象：

- 日程：具有明确日期和开始时间，可包含结束时间、地点、备注和提醒。
- 待办：具有目标描述，可包含截止时间、优先级、备注和状态。
- 提醒：具有提醒时间和提醒内容。

### req-ai-time-management-agent-001-b：AI 对话入口

用户必须可以通过文字对话表达时间安排、待办、提醒或查询意图。第一版不支持语音输入。

### req-ai-time-management-agent-001-c：意图识别与结构化 action

AI 必须将用户输入转成明确 action。第一版至少包含：

- 创建日程
- 创建待办
- 创建提醒
- 查询今日或本周安排
- 修改事项
- 取消事项
- 补充缺失信息
- 生成确认卡片

### req-ai-time-management-agent-001-d：缺失信息追问

当创建或修改事项缺少关键信息时，AI 不得擅自执行，必须先追问。创建日程至少需要标题、日期和开始时间。

### req-ai-time-management-agent-001-e：确认卡片

创建、修改、取消日程、待办或提醒前，系统必须展示确认卡片。用户确认后才允许写入或变更内部时间对象。

### req-ai-time-management-agent-001-f：内部闭环

第一版必须先在 App 内部日历、待办和提醒中完成写入、展示、查询、修改和取消闭环。

### req-ai-time-management-agent-001-g：Hybrid 边界

原生层必须保持稳定，主要负责容器、安全区、权限、通知、本地能力和未来系统桥接。H5 层负责工作台、AI 对话、确认卡片、日程/待办/提醒视图和产品流程。

### req-ai-time-management-agent-001-h：Bridge Contract

Native 与 H5 之间必须通过显式 Bridge Contract 通信。H5 不得依赖隐式原生能力，原生层也不得承载高频变化的业务 UI。

### req-ai-time-management-agent-001-i：数据策略

第一版采用本地优先 + 关键结构同步后端。时间对象必须预留同步状态、来源和外部引用字段，以支持后续多端同步和外部连接器。

### req-ai-time-management-agent-001-j：外部连接器预留

第一版不接手机系统日历、飞书会议、Things3，但内部时间对象和 Bridge Contract 必须为这些外部连接器保留扩展边界。

## 验收标准

- 用户可以通过文字对话创建日程、待办和提醒。
- 信息不足时，AI 能追问缺失字段，而不是直接创建模糊事项。
- 执行创建、修改或取消前，系统展示确认卡片。
- 用户确认后，事项能写入 App 内部时间对象。
- 用户可以查询今日或本周安排。
- 用户可以修改或取消已创建事项。
- 第一版范围明确排除语音输入、账号体系、手机系统日历、飞书会议、Things3 和复杂多端冲突合并。
- PRD 和设计 brief 能追溯到本需求点记录。
- Hybrid 边界在 PRD 或工程规格中被显式保留。

## 验证方式

- 人工检查需求是否只描述必须满足什么，没有提前写实现方案。
- 人工确认需求优先级和非目标。
- 后续 PRD 生成时检查每个 P0 能力是否可追溯到本需求点。
- 后续设计 brief 生成时检查是否覆盖工作台、AI 输入、确认卡片和时间对象视图。
- 后续工程规格生成时检查是否覆盖 Native/H5/Bridge 边界。

## 非目标

- 不直接进入产品功能开发。
- 不在第一版实现完整账号体系。
- 不在第一版支持语音输入。
- 不在第一版接入手机系统日历。
- 不在第一版接入飞书会议、Things3 或其他外部工具。
- 不在第一版实现复杂多端冲突合并。
- 不让原生层承担高频变化的业务 UI。

## 确认状态

- status: needs-confirmation
- confirmedBy:
- confirmedAt:
