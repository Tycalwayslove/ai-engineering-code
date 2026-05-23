# 项目 Agent 指令

## 新窗口启动协议

- 每次进入本项目的新 Codex 窗口，先读取 `ai-factory/memory/working/active-context/current-project-state.md` 和 `ai-factory/memory/index.md`，再回答项目进展、下一步或执行类问题。
- 如果当前问题涉及代码、服务、数据库或调试，还必须先查看 `git status --short --branch` 和最近 5 条提交，避免基于旧对话记忆行动。
- 不要假设飞书、Obsidian 或其他外部知识库会自动同步。只有实际执行同步命令或写入文件后，才可以说“已同步”。
- 阶段性工作结束时，必须更新 `current-project-state.md`；如果影响项目理解，还要同步 Obsidian 阶段记录和 `docs/knowledge-sync/feishu-pages/` 源稿。
- 如果无法完成飞书或 Obsidian 同步，必须在最终回复中明确说明“仓库已更新，外部知识库未同步”，不能模糊带过。

## 文档语言

- 面向人的项目文档默认使用中文，包括规格、实施计划、README、架构说明、评审记录和工作流说明。
- 代码标识符、文件路径、命令、API 字段、类型名、第三方库名称和协议关键字保留原文。
- 如果用户没有明确要求英文，不要把计划文档或架构文档写成英文。
- 生成实施计划时，标题、目标、架构说明、任务解释、预期结果和自检说明使用中文；代码块和命令保持可直接复制执行。

## Git 提交

- Git 提交必须遵循 [docs/conventions/git-commits.md](docs/conventions/git-commits.md)。
- 提交标题使用 `<type>(<scope>): <中文摘要>` 或 `<type>: <中文摘要>`。
- `type` 使用 `feat`、`fix`、`docs`、`style`、`refactor`、`test`、`chore`、`ci`、`build`、`perf`、`revert`。
- `scope` 使用稳定边界名，例如 `backend`、`sdk`、`contracts`、`ai-factory`、`conventions`；不确定时可省略。
- 摘要、正文和 footer 默认使用中文；需要被工具识别的关键字保留英文，例如 `BREAKING CHANGE:`。
- 一个提交只表达一个阶段性变化，摘要描述结果，不写“更新代码”这类泛泛表述。
- 已推送到远端的提交历史默认不改写，除非用户明确要求整理历史。

## 协作偏好

- 先对齐边界和长期演进代价，再追求最短实现路径。
- 后端架构设计优先保持清晰包边界，避免为了快速跑通而把未来必拆的职责混在一起。
- 讨论 Agent、编排、工具和领域层时，要区分“推理规划”和“业务事实写入”。
