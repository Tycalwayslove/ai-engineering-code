# 流程审计工作流

## 目的

按流程块审计 AI 工厂是否足以支撑下一阶段工作，并输出待完善清单。

## 工作流声明

- id: `process-audit`
- owner: 当前任务负责人
- trigger: 人工触发
- execution: 手动运行，不得自动执行
- discovery: 不得自动扫描后直接推进实施
- source: Markdown

## 输入

- 当前阶段目标。
- 仓库关键目录。
- workflow、memory、prompt、playbook、contracts 状态。
- 用户反馈和阶段判断。

## 输出

- 流程审计报告。
- P0/P1/P2 待完善清单。
- 是否允许进入下一阶段的建议。
- 需要同步到 Obsidian 和飞书的摘要。

## 状态转换

- `not_started` -> `intake`
- `intake` -> `evidence_loaded`
- `evidence_loaded` -> `audit_drafted`
- `audit_drafted` -> `waiting_for_human`
- `waiting_for_human` -> `accepted`
- `waiting_for_human` -> `needs_revision`
- `accepted` -> `archived`

## 人工确认点

- 用户确认审计分块是否符合当前目标。
- 用户确认 P0 待完善项。
- 用户确认是否进入实施阶段。

## 失败处理

- 证据不足：标记 `insufficient_evidence`。
- 发现阶段门禁不满足：阻断下一阶段。
- 审计范围过大：拆分为多个审计主题。
- 出现架构方向变化：提示需要 ADR。

## 使用的记忆领域

- `ai-factory/memory/durable/architecture/`
- `ai-factory/memory/durable/decisions/`
- `ai-factory/memory/working/retrospectives/`

## 检查清单

- 是否列出当前状态、问题和待完善点。
- 是否区分 P0/P1/P2。
- 是否避免目录存在即流程稳定的误判。
- 是否同步阶段成果。
