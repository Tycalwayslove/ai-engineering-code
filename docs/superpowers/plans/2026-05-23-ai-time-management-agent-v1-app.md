# AI Time Management Agent v1 App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 交付一个可点击、可输入、可跳转、可查看三领域结果的 iOS Hybrid 初版 App。

**Architecture:** Native 负责 App 壳、Drawer、Header 和输入入口；H5 负责页面体系、对话组件和 API 数据展示；FastAPI/orchestrator 负责日程、费用、提醒三领域确认执行闭环。继续保持同步执行和 Postgres 持久化，不引入异步 worker。

**Tech Stack:** SwiftUI/WKWebView, Next.js React H5, TypeScript SDK/shared-types, FastAPI, psycopg, pytest.

---

### Task 1: 提醒领域后端闭环

**Files:**
- Modify: `python/agent-runtime/agent_runtime/parsers/rule_parser.py`
- Modify: `python/orchestrator/orchestrator/executor.py`
- Create: `python/backend/backend/app/domains/reminder/__init__.py`
- Create: `python/backend/backend/app/domains/reminder/models.py`
- Create: `python/backend/backend/app/domains/reminder/repository.py`
- Create: `python/backend/backend/app/domains/reminder/service.py`
- Create: `python/backend/backend/app/domains/reminder/postgres_repository.py`
- Modify: `python/backend/backend/app/routes/reminder.py`
- Modify: `python/backend/backend/app/runtime.py`
- Modify: `python/backend/tests/test_orchestrator_planner.py`
- Modify: `python/backend/tests/test_agent_turns.py`
- Modify: `python/backend/tests/test_postgres_repositories.py`

- [ ] 写失败测试：`RuleParser` 解析“明天上午九点提醒我带电脑”为 `reminder.create_reminder`。
- [ ] 写失败测试：确认提醒计划后 in-memory repository 有提醒。
- [ ] 写失败测试：`GET /reminders` 返回确认后的提醒。
- [ ] 写失败测试：Postgres `reminders` 持久化提醒。
- [ ] 实现 reminder domain、runtime wiring 和 execution 分派。
- [ ] 运行 `PATH=.venv/bin:$PATH pytest python/backend/tests -v`。

### Task 2: H5 页面和业务组件

**Files:**
- Modify: `apps/h5/src/app/ai-time-agent/types.ts`
- Modify: `apps/h5/src/app/ai-time-agent/backendApi.ts`
- Modify: `apps/h5/src/app/ai-time-agent/backendApi.contract.test.ts`
- Modify: `apps/h5/src/app/ai-time-agent/components.tsx`
- Modify: `apps/h5/src/app/globals.css`

- [ ] 扩展 `AgentSurface`：`expenses`、`reminders`、`settings`。
- [ ] 增加 `expensesToBackendElements()`、`remindersToBackendElements()`、`timelineToBackendElements()`。
- [ ] 确认成功后刷新 calendar、expenses、reminders、ledger。
- [ ] 对话中渲染日程、费用、提醒结果组件。
- [ ] 每个页面有空状态、数据态和可读标题。
- [ ] 运行 `pnpm --filter @ai-code/h5 typecheck`。

### Task 3: Native 导航和输入入口

**Files:**
- Modify: `apps/ios/AIEngineeringCode/HybridShellView.swift`
- Modify: `apps/ios/AIEngineeringCode/H5WebView.swift`
- Modify: `apps/h5/src/app/ai-time-agent/bridge.ts`
- Modify: `apps/h5/src/app/ai-time-agent/bridge.contract.test.ts`

- [ ] 扩展 `NativeSurface` 和 `NativeDrawerPanel`：conversation、expenses、reminders、settings。
- [ ] Header 和 Drawer 中所有入口可点击并发送 `native.viewChanged`。
- [ ] 语音按钮进入 mock 录音态，再提交提醒示例文本。
- [ ] 附件按钮显示可见 mock 提交或“即将支持”反馈，并发送 H5 可处理文本。
- [ ] H5 bridge 类型覆盖新增 surface。
- [ ] 运行 `pnpm validate:native-shells`。

### Task 4: 体验打磨和验证

**Files:**
- Modify: `apps/h5/src/app/globals.css`
- Modify: `ai-factory/memory/working/active-context/current-project-state.md`
- Modify: `docs/knowledge-sync/feishu-pages/03-evolution-log.md`
- Add: Obsidian 阶段记录

- [ ] 调整 H5 页面布局，保证 Native 输入栏不遮挡内容。
- [ ] 弱化或收起调试信息，不让它主导产品页面。
- [ ] 更新阶段记录和当前状态。
- [ ] 运行全量验证命令。
- [ ] 使用浏览器验证 H5 页面切换和主要状态。
