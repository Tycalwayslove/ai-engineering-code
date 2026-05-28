import assert from "node:assert/strict";
import test from "node:test";

import { validateContextSync } from "./validate-context-sync.mjs";

test("validateContextSync accepts the current repository context sources", () => {
  const result = validateContextSync(process.cwd());

  assert.deepEqual(result.failures, []);
});

test("validateContextSync reports missing active context index entry", () => {
  const files = new Map([
    [
      "ai-factory/memory/working/active-context/current-project-state.md",
      "# 当前项目状态\n\n## 知识同步状态\n\n- 外部知识库不是自动同步。\n",
    ],
    [
      "ai-factory/memory/index.md",
      "# 记忆索引\n\nai-factory/memory/durable/decisions/phase-strategy.md\n",
    ],
    [
      "ai-factory/memory/durable/decisions/phase-strategy.md",
      "# 阶段策略\n\n- status: current\n- lastReviewed: 2026-05-23\n\n## 稳定决策\n\n- 进入受控产品开发。\n",
    ],
    [
      "docs/knowledge-sync/sync-checklist.md",
      "# 知识同步检查清单\n\n## 新窗口上下文检查\n\npnpm validate:context-sync\n\n不能说“外部知识库已同步”。\n",
    ],
    [
      "docs/knowledge-sync/feishu-pages/03-evolution-log.md",
      "# 03 阶段演进记录\n\n## 阶段 26：新窗口上下文恢复协议\n",
    ],
    [
      "docs/knowledge-sync/feishu-pages/05-ai-workflow-collaboration.md",
      "# 05 工作流与 AI 协作体系\n\n外部知识库不是自动同步。\n",
    ],
  ]);

  const result = validateContextSync("/virtual", {
    exists: (relativePath) => files.has(relativePath),
    readText: (relativePath) => files.get(relativePath),
  });

  assert.deepEqual(result.failures, [
    "ai-factory/memory/index.md: missing active context entry for current-project-state.md",
  ]);
});
