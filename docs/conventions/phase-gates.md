# 阶段门禁

## 目的

阶段门禁用于防止项目在需求、设计、记忆和工作流尚未稳定时过早进入产品功能开发。

## 阶段定义

| 阶段      | 名称               | 目标                                                         | 禁止事项                             |
| --------- | ------------------ | ------------------------------------------------------------ | ------------------------------------ |
| Phase 1   | AI 工厂雏形骨架    | 建立 monorepo、运行时基础、契约和第一条薄切片                | 不做复杂产品功能                     |
| Phase 1.1 | AI 工厂流程稳定化  | 稳定想法、需求、记忆、提示词、工作流、质量门禁和知识同步流程 | 不做正式产品功能开发                 |
| Phase 1.2 | 需求与设计资产成型 | 生成并确认 PRD、用户流程、设计 brief、UI 设计图和设计评审    | 不做未经设计确认的功能开发           |
| Phase 2   | 受控产品开发       | 按已确认 PRD、设计和工程规格开发产品功能                     | 不绕过 SDK、契约、质量门禁和阶段记录 |

## Phase 1.1 进入条件

- `v0.1.0-skeleton` 基线已打 tag。
- 流程审计报告已形成。
- 用户已确认先稳定流程，不急于产品开发。

## Phase 1.1 退出条件

- Phase Gate、规格生命周期、记忆生命周期、知识同步规则已写入仓库。
- `idea-to-product-understanding`、`requirement-capture`、`memory-review`、`process-audit`、`spec-to-implementation-plan` 工作流具备文档和 manifest。
- workflow run 模板可用。
- 四个核心 playbook 可用：feature development、bugfix、review、release。
- 最小 prompt 集可用。
- Agent 角色规范可用，但没有自动化执行。
- `contracts/requirements` 和 `contracts/design` 入口存在。
- `pnpm validate:factory` 通过。
- 阶段成果同步到 Obsidian 和飞书。

## 功能开发门槛

在 PRD 和 UI 设计资产稳定前，任何产品功能开发都属于过早开发。

进入 Phase 2 前必须满足：

- 原始想法已经被整理为你确认过的产品理解。
- 核心需求点已记录，并进入 PRD 候选。
- PRD 已确认。
- 用户流程和核心 UI 设计图已确认。
- 设计 brief 和工程规格能互相追溯。
- AI 工厂流程至少跑通过一轮真实样例。

## 阶段结束证据

每个阶段结束时必须留下：

- 仓库中的源稿、报告或模板。
- Obsidian 阶段记录。
- 面向外部读者的飞书展示更新。
- 中文 Conventional Commit。
- 必要时创建 tag。
