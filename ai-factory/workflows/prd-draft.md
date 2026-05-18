# PRD 草案工作流

## 目的

将已确认的产品理解和需求点记录整理为可人工审阅的 PRD 草案，为设计 brief、用户流程和 UI 设计图提供输入。

该工作流不进入产品开发，不生成工程实施计划。

## 工作流声明

- id: `prd-draft`
- owner: 当前任务负责人
- trigger: 人工触发
- execution: 手动运行，不得自动执行
- discovery: 不得动态扫描需求、记忆或外部资料
- source: Markdown

## 输入

必需输入：

- 已确认产品理解。
- 已确认需求点记录。
- PRD 模板。
- 用户对范围、非目标和 PRD 候选状态的确认。

可选输入：

- 明确指定的设计系统规则。
- 明确指定的竞品观察、用户反馈或外部引用。
- 明确指定的 durable memory 或 working memory。

## 输出

- PRD 草案。
- 用户流程草案。
- 设计输入清单。
- 待确认问题。
- 是否进入 design brief 的建议。

## 状态转换

- `not_started` -> `intake`
- `intake` -> `requirements_checked`
- `requirements_checked` -> `prd_drafted`
- `prd_drafted` -> `waiting_for_human`
- `waiting_for_human` -> `accepted`
- `waiting_for_human` -> `needs_revision`
- `needs_revision` -> `prd_drafted`
- `accepted` -> `archived`

## 人工确认点

- 用户确认 PRD 是否准确表达产品目标。
- 用户确认第一版范围和非目标。
- 用户确认用户流程是否符合预期。
- 用户确认是否进入 design brief 和 UI 设计图阶段。

## 失败处理

- 产品理解未确认：退回 `idea-to-product-understanding`。
- 需求点记录未确认：退回 `requirement-capture`。
- 范围过大：拆分 PRD，不进入设计。
- 出现长期架构判断：提示需要 ADR 或 durable memory 候选。
- 用户未确认：不得进入 design brief、UI 设计图或工程规格。

## 使用的记忆领域

- `ai-factory/memory/working/tasks/`
- `ai-factory/memory/working/active-context/`
- `ai-factory/memory/durable/product/`
- `ai-factory/memory/durable/design/`
- `ai-factory/memory/durable/architecture/`

## 检查清单

- PRD 是否引用已确认产品理解和需求点记录。
- PRD 是否区分目标、非目标和待确认问题。
- PRD 是否避免写工程实现方案。
- PRD 是否包含设计输入。
- PRD 是否等待用户确认。
