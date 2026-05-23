# 知识同步检查清单

## 目的

阶段结束时，用本清单确保仓库、Obsidian 和飞书保持一致的证据链。

## 顺序

1. 更新仓库源稿、报告、模板或索引。
2. 写 Obsidian 阶段记录。
3. 提炼飞书展示内容。
4. 更新飞书索引。
5. 运行本地校验。
6. 提交并推送。
7. 必要时创建并推送 tag。

## 新窗口上下文检查

- 新 Codex 窗口必须读取 `AGENTS.md`、`ai-factory/memory/index.md` 和 `ai-factory/memory/working/active-context/current-project-state.md`。
- 开始执行前必须查看 `git status --short --branch` 和最近提交，避免基于旧对话继续工作。
- 如果阶段结束但没有更新 `current-project-state.md`，视为上下文同步未完成。
- 如果没有实际写入 Obsidian 或飞书，只能说“仓库源稿已更新”，不能说“外部知识库已同步”。

## 仓库检查

- 是否更新了权威源稿。
- 是否避免把飞书作为唯一权威。
- 是否更新相关索引。
- 是否运行 `pnpm validate:factory`。

## Obsidian 检查

- 是否记录阶段最重要结论。
- 是否写明验证证据。
- 是否记录下一步建议。
- 是否避免把临时猜测写成长期事实。
- 是否把阶段记录放入固定路径 `Projects/AI Engineering Code/阶段成果/`。

## 飞书检查

- 是否只同步外部读者能理解的成果叙事。
- 是否更新对应页面源稿。
- 是否更新 `docs/knowledge-sync/feishu-index.md`。
- 是否用 `docs +fetch --scope outline` 做轻量验证。
- 是否明确记录实际执行过的 `lark-cli docs +update --api-version v2` 命令。

## Git 检查

- 是否使用中文 Conventional Commit。
- 工作区是否干净。
- tag 是否符合阶段含义。
