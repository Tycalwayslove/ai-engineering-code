# AI Factory Intake 需求点记录

## 记忆类型

- domain: product
- status: draft

## 元数据

- id: req-ai-factory-intake-001
- kind: requirement
- priority: p0
- source: ai-factory/specs/product-understanding/2026-05-18-ai-factory-intake-product-understanding.md
- linkedSpec:
- needsDesignInput: false
- prdCandidate: false

## 需求陈述

AI 工厂必须提供一套手动优先的 Intake 机制，用于接收用户原始想法、外部引用、竞品观察、用户反馈、技术判断、设计想法、流程改进和风险问题，并在进入 PRD、工程规格或产品开发前，先生成可确认的产品理解或相应流程判断。

## 子需求

### req-ai-factory-intake-001-a：Intake 分类

系统必须支持以下初始分类：

- 产品想法
- 技术想法
- 设计想法
- 流程改进
- 外部引用
- 竞品观察
- 用户反馈
- 风险/问题

### req-ai-factory-intake-001-b：Intake 元数据

每条 Intake 至少应记录：

- id
- category
- source
- created
- status
- summary
- next workflow

### req-ai-factory-intake-001-c：确认机制

AI 可以主动生成理解和推荐方案，但进入需求点记录、PRD、设计 brief、工程规格或 durable memory 前，必须等待用户确认。

### req-ai-factory-intake-001-d：外部引用处理

外部引用不得直接进入 durable memory 或开发任务。必须先记录来源、日期、摘要和使用目的，再由用户或流程确认其后续去向。

## 验收标准

- Intake 分类被写入产品理解或后续 intake 模板。
- 需求点记录能追溯到已确认产品理解。
- 需求点明确禁止直接进入产品功能开发。
- 需求点说明哪些内容需要用户确认。
- 需求点明确记录不进入 PRD 候选池。
- 需求点作为 AI 工厂流程基础设施保留，不触发产品功能开发。

## 验证方式

- 运行 `pnpm validate:factory`。
- 人工检查需求点是否只描述“必须满足什么”，没有写具体实现方案。
- 人工确认该需求点是否进入 Phase 1.2 PRD 候选；当前结论为不进入。

## 非目标

- 不开发 Admin Intake UI。
- 不创建 Intake 数据库。
- 不自动扫描外部资料。
- 不自动生成 PRD。
- 不自动写入 durable memory。
- 不进入 Phase 1.2 PRD 候选池。

## 确认状态

- status: confirmed
- confirmedBy: user
- confirmedAt: 2026-05-18
- decision: 需求陈述正确；分类增加“竞品观察”和“用户反馈”；不进入 PRD 候选池。
