# Context Sync And Phase Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 固化新窗口上下文同步检查，并复审项目阶段决策，避免旧治理记录和当前端到端薄切片状态冲突。

**Architecture:** 新增一个只读 Node.js 校验脚本，检查仓库内上下文源稿、记忆索引、飞书源稿和同步声明的一致性。阶段决策仍保存在 durable memory，当前状态仍以 working active-context 作为新窗口入口。

**Tech Stack:** Node.js `node:test`、pnpm scripts、Markdown 源稿。

---

### Task 1: 上下文同步检查脚本

**Files:**

- Create: `scripts/validate-context-sync.mjs`
- Create: `scripts/validate-context-sync.test.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write failing tests**

```js
import assert from "node:assert/strict";
import test from "node:test";

import { validateContextSync } from "./validate-context-sync.mjs";

test("validateContextSync accepts the current repository state", () => {
  const result = validateContextSync(process.cwd());
  assert.deepEqual(result.failures, []);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test scripts/validate-context-sync.test.mjs`

Expected: FAIL because `scripts/validate-context-sync.mjs` does not exist yet.

- [ ] **Step 3: Implement the script**

Add checks for required files, `current-project-state.md` being listed in `memory/index.md`, key recent source drafts existing in `docs/knowledge-sync/feishu-pages/`, and explicit wording that external knowledge bases are not automatic.

- [ ] **Step 4: Wire package scripts**

Add `validate:context-sync` and include it in `validate:factory` after the existing factory validator.

- [ ] **Step 5: Run targeted verification**

Run: `node --test scripts/validate-context-sync.test.mjs && pnpm validate:context-sync`

Expected: PASS.

### Task 2: 阶段决策复审

**Files:**

- Modify: `ai-factory/memory/durable/decisions/phase-strategy.md`
- Modify: `docs/conventions/phase-gates.md`
- Modify: `docs/knowledge-sync/sync-checklist.md`

- [ ] **Step 1: Update durable decision**

Record that Phase 1.1 and Phase 1.2 gates have effectively been exercised for the AI 时间管理 Agent, and that current work is controlled Phase 2 thin-slice development.

- [ ] **Step 2: Update phase gates**

Clarify that Phase 2 can proceed only through confirmed PRD, design, engineering spec, SDK/contract checks, and phase records.

- [ ] **Step 3: Update sync checklist**

Document the new local command for context sync checks and keep external sync as explicit manual evidence.

### Task 3: 当前状态更新和验证

**Files:**

- Modify: `ai-factory/memory/working/active-context/current-project-state.md`
- Modify if needed: `docs/knowledge-sync/feishu-pages/03-evolution-log.md`
- Modify if needed: `docs/knowledge-sync/feishu-pages/05-ai-workflow-collaboration.md`

- [ ] **Step 1: Update active context**

Add the context sync script and phase decision review as the latest current state.

- [ ] **Step 2: Run validation**

Run:

```bash
pnpm validate:context-sync
pnpm validate:factory
```

Expected: both pass.
