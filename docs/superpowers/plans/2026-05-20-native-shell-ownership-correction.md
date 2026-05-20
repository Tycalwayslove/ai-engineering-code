# Native Shell Ownership Correction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move app chrome ownership from H5 into the iOS native shell, leaving H5 as a backend element rendering surface with its own interface-driven execution status dock.

**Architecture:** iOS owns header, bottom input, menu drawer, and Timepage-style timeline. H5 receives native host/view messages and renders backend-provided content elements plus the page-level execution status dock for the active surface. The Hybrid Bridge contract becomes the source of truth for native-to-H5 view and input events.

**Tech Stack:** SwiftUI, WKWebView, Next.js, TypeScript, JSON Schema.

---

### Task 1: Update Hybrid Bridge Contract

**Files:**

- Modify: `contracts/hybrid-bridge/native-bridge-message.schema.json`
- Modify: `contracts/hybrid-bridge/README.md`
- Modify: `apps/h5/src/app/ai-time-agent/bridge.ts`
- Modify: `apps/h5/src/app/ai-time-agent/bridge.contract.test.ts`

- [ ] Add native-to-H5 message types `native.viewChanged` and `native.inputRequested`.
- [ ] Keep `h5.ready`, `native.hostContext`, `native.ack`, and `native.error` unchanged.
- [ ] Run `pnpm validate:contracts`.

### Task 2: Move App Chrome Into iOS

**Files:**

- Modify: `apps/ios/AIEngineeringCode/HybridShellView.swift`
- Modify: `apps/ios/AIEngineeringCode/H5WebView.swift`

- [ ] Add native header buttons for menu, execution ledger, and calendar.
- [ ] Keep page execution status inside H5; do not mirror it into Native.
- [ ] Add native composer with camera, voice, and keyboard controls.
- [ ] Add a SwiftUI drawer containing Timepage-style timeline, calendar summary, and execution ledger panels.
- [ ] Send `native.viewChanged` and `native.inputRequested` messages to H5 through the existing WebView dispatch path.
- [ ] Run `xcodebuild -project apps/ios/AIEngineeringCode.xcodeproj -scheme AIEngineeringCode -configuration Debug -destination 'platform=iOS Simulator,name=iPhone 16,OS=18.6' build`.

### Task 3: Reduce H5 To Backend Element Surface

**Files:**

- Modify: `apps/h5/src/app/ai-time-agent/types.ts`
- Modify: `apps/h5/src/app/ai-time-agent/demoData.ts`
- Modify: `apps/h5/src/app/ai-time-agent/components.tsx`
- Modify: `apps/h5/src/app/globals.css`

- [ ] Replace H5-owned header, composer, drawer, calendar, and ledger chrome with a backend element renderer.
- [ ] Keep an H5 execution status dock fixed at the bottom of the WebView content area.
- [ ] Keep demo data as a stand-in for backend returned elements.
- [ ] Let `native.viewChanged` choose which backend element set H5 renders.
- [ ] Run `pnpm --filter @ai-code/h5 typecheck` and `pnpm --filter @ai-code/h5 build`.

### Task 4: Document The Corrected Boundary

**Files:**

- Modify: `apps/ios/README.md`
- Modify: `apps/android/README.md`
- Modify: `docs/knowledge-sync/feishu-pages/03-evolution-log.md`
- Modify: `docs/knowledge-sync/feishu-pages/05-ai-workflow-collaboration.md`

- [ ] Document that iOS owns native app chrome and Timepage drawer.
- [ ] Document that H5 renders backend elements only.
- [ ] Document that Android will follow the iOS split later.
- [ ] Run formatting and validation.
