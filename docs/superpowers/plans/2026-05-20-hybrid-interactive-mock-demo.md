# Hybrid Interactive Mock Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a no-backend interactive demo where the iOS native shell controls app chrome and H5 renders mock backend responses.

**Architecture:** Native owns header, drawer, theme switching, and input. H5 listens to explicit Bridge messages and renders mock backend elements, confirmation cards, and execution status. The mock code is intentionally replaceable by backend API results later.

**Tech Stack:** SwiftUI, WKWebView, Next.js, TypeScript, JSON Schema.

---

### Task 1: Bridge Contract

**Files:**

- Modify: `contracts/hybrid-bridge/native-bridge-message.schema.json`
- Modify: `apps/h5/src/app/ai-time-agent/bridge.ts`
- Modify: `apps/h5/src/app/ai-time-agent/bridge.contract.test.ts`

- [x] Add `native.inputSubmitted` for native text / voice / image mock submissions.
- [x] Add `native.themeChanged` for native theme synchronization.
- [x] Keep all messages explicit; no hidden global state reads.

### Task 2: iOS Shell Interaction

**Files:**

- Modify: `apps/ios/AIEngineeringCode/HybridShellView.swift`

- [x] Add native dark / light theme state.
- [x] Add Header theme toggle.
- [x] Add real text input mode to the bottom composer.
- [x] Send `native.inputSubmitted` when users submit text.
- [x] Send mock text from voice and camera buttons.
- [x] Keep Native free of schedule parsing logic.

### Task 3: H5 Mock Response Loop

**Files:**

- Modify: `apps/h5/src/app/ai-time-agent/components.tsx`
- Modify: `apps/h5/src/app/globals.css`

- [x] Listen for `native.inputSubmitted`.
- [x] Append user message, AI response, confirmation card, ledger, calendar, and timeline mock elements.
- [x] Animate execution status through understanding, planning, confirming, and completed.
- [x] Listen for `native.themeChanged` and update theme tokens.
- [x] Auto-scroll conversation after new mock messages.

### Task 4: Documentation And Knowledge Sync

**Files:**

- Modify: `contracts/hybrid-bridge/README.md`
- Modify: `apps/ios/README.md`
- Modify: `apps/android/README.md`
- Create: `ai-factory/specs/engineering/2026-05-20-ai-time-management-agent-interactive-mock-v0-1.md`
- Modify: `docs/knowledge-sync/feishu-pages/03-evolution-log.md`
- Modify: `docs/knowledge-sync/feishu-pages/05-ai-workflow-collaboration.md`
- Modify: `docs/knowledge-sync/feishu-index.md`

- [x] Record that this version is a frontend interaction mock, not real backend capability.
- [x] Record the new Bridge messages.
- [x] Sync phase results to Obsidian and Feishu.

### Task 5: Verification

- [x] Run H5 typecheck.
- [x] Run iOS simulator build.
- [x] Run full repository quality gates.
- [ ] Commit and push with Chinese Conventional Commit.
