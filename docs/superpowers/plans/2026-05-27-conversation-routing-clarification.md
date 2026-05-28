# Conversation Routing Clarification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 AI 时间管理 Agent 支持自然闲聊、缺字段追问和多轮补全，同时保留确认后才写业务事实的安全边界。

**Architecture:** 在 `agent_runtime.planning` 中扩展 LLM/规则规划结果，让 planner 能返回 `chat`、`clarification`、`plan_candidate` 和 `mixed`。在 backend/orchestrator 中新增 `PendingClarification` 存储与上下文注入，让“明天上午我要去开会”后续可以用“十点”补全为确认卡。H5 只负责渲染追问与快捷回复，继续把输入交给 `/agent/turns`。

**Tech Stack:** Python 3.12+、FastAPI、pytest、psycopg、TypeScript、Next.js、pnpm、现有 `@ai-code/sdk` 和 H5 contract tests。

---

## 文件结构

- Modify: `python/agent-runtime/agent_runtime/planning/types.py`
  - 增加 `PlanningResponseType`、`ClarificationCandidate`、扩展 `ClarificationRequest` 和 `PlanningResult`。
- Modify: `python/agent-runtime/agent_runtime/planning/prompts.py`
  - 要求 LLM 输出 `response_type`、`assistant_message`、`clarification` 和 `actions`。
- Modify: `python/agent-runtime/agent_runtime/planning/llm.py`
  - 解析 `chat`、`clarification`、`plan_candidate`、`mixed`。
- Modify: `python/agent-runtime/agent_runtime/planning/rule_based.py`
  - 让规则 fallback 对缺时间的日程返回 clarification，对纯闲聊返回 chat。
- Create: `python/agent-runtime/agent_runtime/clarifications/types.py`
  - 定义 `PendingClarification`。
- Create: `python/backend/backend/app/services/pending_clarification_store.py`
  - 定义 store 协议和 in-memory 实现。
- Create: `python/backend/backend/app/infrastructure/postgres/pending_clarification_repository.py`
  - Postgres 实现。
- Create: `infra/db/migrations/0003_pending_clarifications.up.sql`
- Create: `infra/db/migrations/0003_pending_clarifications.down.sql`
- Modify: `python/agent-runtime/agent_runtime/context/types.py`
  - 增加 `pending_clarifications: list[str]`。
- Modify: `python/agent-runtime/agent_runtime/context/assembler.py`
  - 注入 pending clarification provider。
- Modify: `python/backend/backend/app/bootstrap.py`
  - 装配 pending clarification store/provider。
- Modify: `python/orchestrator/orchestrator/planner.py`
  - 保存 clarification，处理 pending 补全，返回 chat/clarification/confirmation。
- Modify: `python/orchestrator/orchestrator/types.py`
  - API response 增加 `quickReplies`、`clarificationId`。
- Modify: `python/orchestrator/orchestrator/use_cases/submit_turn.py`
  - storage summary 支持 clarification/chat。
- Modify: `apps/h5/src/app/ai-time-agent/types.ts`
  - 增加 `quick-replies` rendered element。
- Modify: `apps/h5/src/app/ai-time-agent/backendApi.ts`
  - 把 clarification response 转成 message + quick replies。
- Modify: `apps/h5/src/app/ai-time-agent/components.tsx`
  - 渲染 quick replies，点击后复用 `handleSubmittedText`。
- Tests:
  - `python/backend/tests/test_llm_planning_engine.py`
  - `python/backend/tests/test_rule_based_planning_engine.py`
  - `python/backend/tests/test_pending_clarifications.py`
  - `python/backend/tests/test_orchestrator_planner.py`
  - `python/backend/tests/test_agent_turns.py`
  - `apps/h5/src/app/ai-time-agent/backendApi.contract.test.ts`
  - `apps/h5/src/app/ai-time-agent/agentWorkbench.contract.test.ts`

---

### Task 1: 扩展 Planning 类型和 LLM 输出解析

**Files:**
- Modify: `python/agent-runtime/agent_runtime/planning/types.py`
- Modify: `python/agent-runtime/agent_runtime/planning/prompts.py`
- Modify: `python/agent-runtime/agent_runtime/planning/llm.py`
- Test: `python/backend/tests/test_llm_planning_engine.py`

- [ ] **Step 1: 写失败测试，覆盖 chat 响应**

在 `python/backend/tests/test_llm_planning_engine.py` 增加：

```python
def test_llm_planning_engine_returns_chat_message() -> None:
    engine = LlmPlanningEngine(
        provider=StaticProvider(
            {
                "response_type": "chat",
                "assistant_message": "可以，我在。要不要一起整理明天的安排？",
                "clarification": None,
                "actions": [],
                "missing_information": [],
                "assumptions": [],
                "risk_notes": [],
            },
        ),
        mode="llm",
    )

    result = engine.plan(
        PlanningInput(
            conversation_id="conversation_chat_001",
            text="今天有点累",
            now="2026-05-21T09:00:00+08:00",
            timezone="Asia/Shanghai",
        ),
        ContextPack.empty(),
    )

    assert result.kind == "assistant_message"
    assert result.message == "可以，我在。要不要一起整理明天的安排？"
    assert result.planner_mode == "llm"
```

- [ ] **Step 2: 写失败测试，覆盖 clarification 响应**

在同一文件增加：

```python
def test_llm_planning_engine_returns_clarification_candidate() -> None:
    engine = LlmPlanningEngine(
        provider=StaticProvider(
            {
                "response_type": "clarification",
                "assistant_message": "明天上午几点开始开会？",
                "clarification": {
                    "intent_id": "pending_calendar_meeting",
                    "domain": "calendar",
                    "action_type": "calendar.create_event",
                    "question": "明天上午几点开始开会？",
                    "missing_fields": ["start_at"],
                    "quick_replies": ["明天上午9点", "明天上午10点", "我再说具体时间"],
                    "partial_payload": {
                        "title": "开会",
                        "date_hint": "2026-05-22",
                        "time_range_hint": "morning",
                        "timezone": "Asia/Shanghai",
                    },
                },
                "actions": [],
                "missing_information": ["start_at"],
                "assumptions": [],
                "risk_notes": [],
            },
        ),
        mode="llm",
    )

    result = engine.plan(
        PlanningInput(
            conversation_id="conversation_clarification_001",
            text="明天上午我要去开会",
            now="2026-05-21T09:00:00+08:00",
            timezone="Asia/Shanghai",
        ),
        ContextPack.empty(),
    )

    assert result.kind == "clarification"
    assert result.clarification is not None
    assert result.clarification.question == "明天上午几点开始开会？"
    assert result.clarification.quick_replies == [
        "明天上午9点",
        "明天上午10点",
        "我再说具体时间",
    ]
    assert result.clarification.partial_payload["title"] == "开会"
```

- [ ] **Step 3: 运行测试确认失败**

Run:

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_llm_planning_engine.py::test_llm_planning_engine_returns_chat_message python/backend/tests/test_llm_planning_engine.py::test_llm_planning_engine_returns_clarification_candidate -q
```

Expected: FAIL，因为 `response_type` 和 expanded `ClarificationRequest` 尚未实现。

- [ ] **Step 4: 扩展 planning 类型**

在 `python/agent-runtime/agent_runtime/planning/types.py` 中把相关定义调整为：

```python
PlanningResponseType = Literal["chat", "clarification", "plan_candidate", "mixed"]
PlanningResultKind = Literal["plan_candidate", "clarification", "assistant_message"]
```

并替换 `ClarificationRequest`：

```python
@dataclass(frozen=True)
class ClarificationRequest:
    question: str
    missing_fields: list[str]
    intent_id: str | None = None
    domain: str | None = None
    action_type: str | None = None
    quick_replies: list[str] = field(default_factory=list)
    partial_payload: dict[str, object] = field(default_factory=dict)
```

- [ ] **Step 5: 更新 LLM prompt**

在 `python/agent-runtime/agent_runtime/planning/prompts.py` 中把 JSON 说明改成要求：

```text
You must return JSON with:
- response_type: one of chat, clarification, plan_candidate, mixed
- assistant_message: short Chinese reply shown to the user
- clarification: null or an object with intent_id, domain, action_type, question, missing_fields, quick_replies, partial_payload
- actions: list of proposed actions; empty for chat and pure clarification
- missing_information: list of missing fields
- assumptions: list
- risk_notes: list

If the user expresses a scheduling/reminder/expense intent but misses required fields, return response_type=clarification instead of an empty action list.
If the user is only chatting, return response_type=chat and do not invent actions.
```

- [ ] **Step 6: 更新 LLM payload 解析**

在 `python/agent-runtime/agent_runtime/planning/llm.py` 的 `plan()` 中，在 `_candidate_from_payload` 前先读 `response_type`：

```python
response_type = str(payload.get("response_type", "plan_candidate"))
if response_type == "chat":
    return PlanningResult(
        kind="assistant_message",
        trace_id=f"{self._mode}-chat",
        message=self._required_str(payload, "assistant_message"),
        planner_mode=self._mode,
    )
if response_type == "clarification":
    return PlanningResult(
        kind="clarification",
        trace_id=f"{self._mode}-clarification",
        clarification=self._clarification_from_payload(payload.get("clarification")),
        message=str(payload.get("assistant_message", "")) or None,
        planner_mode=self._mode,
    )
if response_type not in ("plan_candidate", "mixed"):
    raise ValueError(f"unsupported response_type: {response_type}")
```

新增 helper：

```python
def _clarification_from_payload(self, payload: object) -> ClarificationRequest:
    if not isinstance(payload, dict):
        raise ValueError("clarification must be an object")
    partial_payload = payload.get("partial_payload", {})
    if not isinstance(partial_payload, dict):
        raise ValueError("clarification.partial_payload must be an object")
    return ClarificationRequest(
        intent_id=str(payload.get("intent_id") or ""),
        domain=str(payload.get("domain") or ""),
        action_type=str(payload.get("action_type") or ""),
        question=self._required_str(payload, "question"),
        missing_fields=self._string_list(payload.get("missing_fields", [])),
        quick_replies=self._string_list(payload.get("quick_replies", [])),
        partial_payload=partial_payload,
    )
```

- [ ] **Step 7: 运行目标测试**

Run:

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_llm_planning_engine.py -q
```

Expected: PASS。

- [ ] **Step 8: Commit**

```bash
git add python/agent-runtime/agent_runtime/planning/types.py \
  python/agent-runtime/agent_runtime/planning/prompts.py \
  python/agent-runtime/agent_runtime/planning/llm.py \
  python/backend/tests/test_llm_planning_engine.py
git commit -m "feat(backend): 支持 LLM 对话路由结果"
```

---

### Task 2: 规则 fallback 支持 chat 和缺时间追问

**Files:**
- Modify: `python/agent-runtime/agent_runtime/planning/rule_based.py`
- Modify: `python/agent-runtime/agent_runtime/parsers/rule_parser.py`
- Test: `python/backend/tests/test_rule_based_planning_engine.py`
- Test: `python/backend/tests/test_orchestrator_planner.py`

- [ ] **Step 1: 写失败测试，缺时间日程返回 clarification**

在 `python/backend/tests/test_rule_based_planning_engine.py` 增加：

```python
def test_rule_based_planner_clarifies_calendar_time_when_missing() -> None:
    result = RuleBasedPlanningEngine().plan(
        PlanningInput(
            conversation_id="conversation_missing_time",
            text="明天上午我要去开会",
            now="2026-05-21T09:00:00+08:00",
            timezone="Asia/Shanghai",
        ),
        ContextPack.empty(),
    )

    assert result.kind == "clarification"
    assert result.clarification is not None
    assert result.clarification.question == "明天上午几点开始开会？"
    assert result.clarification.missing_fields == ["start_at"]
    assert result.clarification.quick_replies == [
        "明天上午9点",
        "明天上午10点",
        "我再说具体时间",
    ]
    assert result.clarification.partial_payload["title"] == "开会"
```

- [ ] **Step 2: 写失败测试，闲聊返回 chat**

在同一文件增加：

```python
def test_rule_based_planner_returns_chat_for_non_action_input() -> None:
    result = RuleBasedPlanningEngine().plan(
        PlanningInput(
            conversation_id="conversation_chat",
            text="今天有点累",
            now="2026-05-21T09:00:00+08:00",
            timezone="Asia/Shanghai",
        ),
        ContextPack.empty(),
    )

    assert result.kind == "assistant_message"
    assert result.message == "我在。你可以继续聊，也可以让我帮你安排日程、提醒或费用。"
```

- [ ] **Step 3: 运行测试确认失败**

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_rule_based_planning_engine.py -q
```

Expected: FAIL，当前规则 planner 对无 action 输入仍返回旧文案。

- [ ] **Step 4: 在 RuleParser 增加缺时间日程 hint**

在 `python/agent-runtime/agent_runtime/parsers/rule_parser.py` 中新增一个方法：

```python
def parse_calendar_clarification(self, text: str, now: str, timezone: str) -> dict[str, object] | None:
    if "开会" not in text and "会议" not in text:
        return None
    if not any(token in text for token in ("上午", "下午", "晚上", "明天", "后天", "今天")):
        return None
    parsed = self.parse(text=text, now=now, timezone=timezone)
    if parsed.actions:
        return None
    return {
        "question": "明天上午几点开始开会？" if "明天上午" in text else "这个日程几点开始？",
        "missing_fields": ["start_at"],
        "quick_replies": ["明天上午9点", "明天上午10点", "我再说具体时间"],
        "partial_payload": {
            "title": "开会",
            "date_hint": "tomorrow" if "明天" in text else "",
            "time_range_hint": "morning" if "上午" in text else "",
            "timezone": timezone,
        },
    }
```

- [ ] **Step 5: 在 RuleBasedPlanningEngine 使用 clarification**

在 `python/agent-runtime/agent_runtime/planning/rule_based.py` 中，`not parsed.actions` 前加入：

```python
calendar_clarification = self._parser.parse_calendar_clarification(
    text=planning_input.text,
    now=planning_input.now,
    timezone=planning_input.timezone,
)
if calendar_clarification is not None:
    return PlanningResult(
        kind="clarification",
        trace_id="rule-calendar-clarification",
        clarification=ClarificationRequest(
            question=str(calendar_clarification["question"]),
            missing_fields=[str(item) for item in calendar_clarification["missing_fields"]],
            intent_id="pending_calendar_meeting",
            domain="calendar",
            action_type="calendar.create_event",
            quick_replies=[str(item) for item in calendar_clarification["quick_replies"]],
            partial_payload=dict(calendar_clarification["partial_payload"]),
        ),
        planner_mode="rule",
    )
```

无 action 旧分支改为：

```python
return PlanningResult(
    kind="assistant_message",
    trace_id="rule-chat",
    message="我在。你可以继续聊，也可以让我帮你安排日程、提醒或费用。",
    planner_mode="rule",
)
```

- [ ] **Step 6: 运行规则 planner 测试**

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_rule_based_planning_engine.py -q
```

Expected: PASS。

- [ ] **Step 7: Commit**

```bash
git add python/agent-runtime/agent_runtime/parsers/rule_parser.py \
  python/agent-runtime/agent_runtime/planning/rule_based.py \
  python/backend/tests/test_rule_based_planning_engine.py
git commit -m "feat(backend): 规则规划支持闲聊和追问"
```

---

### Task 3: 新增 PendingClarification 存储

**Files:**
- Create: `python/agent-runtime/agent_runtime/clarifications/types.py`
- Create: `python/agent-runtime/agent_runtime/clarifications/__init__.py`
- Create: `python/backend/backend/app/services/pending_clarification_store.py`
- Create: `python/backend/backend/app/infrastructure/postgres/pending_clarification_repository.py`
- Create: `infra/db/migrations/0003_pending_clarifications.up.sql`
- Create: `infra/db/migrations/0003_pending_clarifications.down.sql`
- Test: `python/backend/tests/test_pending_clarifications.py`

- [ ] **Step 1: 写 in-memory store 失败测试**

创建 `python/backend/tests/test_pending_clarifications.py`：

```python
from datetime import UTC, datetime, timedelta

from agent_runtime.clarifications.types import PendingClarification
from backend.app.services.pending_clarification_store import (
    InMemoryPendingClarificationStore,
)


def test_pending_clarification_store_returns_latest_open_item() -> None:
    store = InMemoryPendingClarificationStore()
    now = datetime(2026, 5, 21, 9, 0, tzinfo=UTC)
    pending = PendingClarification(
        id="pending_001",
        conversation_id="conversation_001",
        domain="calendar",
        action_type="calendar.create_event",
        question="明天上午几点开始开会？",
        missing_fields=["start_at"],
        partial_payload={"title": "开会", "date_hint": "tomorrow"},
        quick_replies=["明天上午9点", "明天上午10点"],
        status="open",
        created_at=now,
        expires_at=now + timedelta(hours=24),
        resolved_at=None,
    )

    store.save(pending)

    assert store.latest_open("conversation_001", now) == pending


def test_pending_clarification_store_ignores_expired_items() -> None:
    store = InMemoryPendingClarificationStore()
    now = datetime(2026, 5, 21, 9, 0, tzinfo=UTC)
    pending = PendingClarification(
        id="pending_expired",
        conversation_id="conversation_001",
        domain="calendar",
        action_type="calendar.create_event",
        question="明天上午几点开始开会？",
        missing_fields=["start_at"],
        partial_payload={"title": "开会"},
        quick_replies=[],
        status="open",
        created_at=now - timedelta(days=2),
        expires_at=now - timedelta(days=1),
        resolved_at=None,
    )

    store.save(pending)

    assert store.latest_open("conversation_001", now) is None
```

- [ ] **Step 2: 运行测试确认失败**

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_pending_clarifications.py -q
```

Expected: FAIL，模块尚不存在。

- [ ] **Step 3: 定义 PendingClarification 类型**

创建 `python/agent-runtime/agent_runtime/clarifications/types.py`：

```python
from dataclasses import dataclass
from datetime import datetime
from typing import Literal

PendingClarificationStatus = Literal["open", "resolved", "abandoned"]


@dataclass(frozen=True)
class PendingClarification:
    id: str
    conversation_id: str
    domain: str
    action_type: str
    question: str
    missing_fields: list[str]
    partial_payload: dict[str, object]
    quick_replies: list[str]
    status: PendingClarificationStatus
    created_at: datetime
    expires_at: datetime
    resolved_at: datetime | None
```

创建 `python/agent-runtime/agent_runtime/clarifications/__init__.py`：

```python
from agent_runtime.clarifications.types import PendingClarification

__all__ = ["PendingClarification"]
```

- [ ] **Step 4: 实现 in-memory store**

创建 `python/backend/backend/app/services/pending_clarification_store.py`：

```python
from datetime import datetime
from typing import Protocol

from agent_runtime.clarifications.types import PendingClarification


class PendingClarificationStore(Protocol):
    def save(self, pending: PendingClarification) -> None:
        raise NotImplementedError

    def latest_open(self, conversation_id: str, now: datetime) -> PendingClarification | None:
        raise NotImplementedError

    def mark_resolved(self, pending_id: str, resolved_at: datetime) -> None:
        raise NotImplementedError


class InMemoryPendingClarificationStore:
    def __init__(self) -> None:
        self._items: list[PendingClarification] = []

    def save(self, pending: PendingClarification) -> None:
        self._items = [item for item in self._items if item.id != pending.id]
        self._items.append(pending)

    def latest_open(self, conversation_id: str, now: datetime) -> PendingClarification | None:
        matches = [
            item
            for item in self._items
            if item.conversation_id == conversation_id
            and item.status == "open"
            and item.expires_at > now
        ]
        return max(matches, key=lambda item: item.created_at) if matches else None

    def mark_resolved(self, pending_id: str, resolved_at: datetime) -> None:
        self._items = [
            PendingClarification(
                id=item.id,
                conversation_id=item.conversation_id,
                domain=item.domain,
                action_type=item.action_type,
                question=item.question,
                missing_fields=item.missing_fields,
                partial_payload=item.partial_payload,
                quick_replies=item.quick_replies,
                status="resolved",
                created_at=item.created_at,
                expires_at=item.expires_at,
                resolved_at=resolved_at,
            )
            if item.id == pending_id
            else item
            for item in self._items
        ]
```

- [ ] **Step 5: 增加 Postgres migration**

创建 `infra/db/migrations/0003_pending_clarifications.up.sql`：

```sql
create table if not exists pending_clarifications (
  id text primary key,
  conversation_id text not null references conversations(id),
  domain text not null,
  action_type text not null,
  question text not null,
  missing_fields jsonb not null default '[]'::jsonb,
  partial_payload jsonb not null default '{}'::jsonb,
  quick_replies jsonb not null default '[]'::jsonb,
  status text not null,
  created_at timestamptz not null,
  expires_at timestamptz not null,
  resolved_at timestamptz
);

create index if not exists idx_pending_clarifications_open
  on pending_clarifications (conversation_id, status, expires_at, created_at desc);
```

创建 `infra/db/migrations/0003_pending_clarifications.down.sql`：

```sql
drop table if exists pending_clarifications;
```

- [ ] **Step 6: 实现 Postgres repository**

创建 `python/backend/backend/app/infrastructure/postgres/pending_clarification_repository.py`，使用 `psycopg.rows.dict_row`。保存时把 list/dict 用 `json.dumps(value, ensure_ascii=False)` 写入 jsonb；读取时转换回 `PendingClarification`。该 repository 必须实现 `save()`、`latest_open()` 和 `mark_resolved()` 三个方法。

- [ ] **Step 7: 运行 pending store 测试**

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_pending_clarifications.py -q
```

Expected: PASS。

- [ ] **Step 8: Commit**

```bash
git add python/agent-runtime/agent_runtime/clarifications \
  python/backend/backend/app/services/pending_clarification_store.py \
  python/backend/backend/app/infrastructure/postgres/pending_clarification_repository.py \
  infra/db/migrations/0003_pending_clarifications.up.sql \
  infra/db/migrations/0003_pending_clarifications.down.sql \
  python/backend/tests/test_pending_clarifications.py
git commit -m "feat(backend): 增加待追问意图存储"
```

---

### Task 4: ContextPack 注入 pending clarification

**Files:**
- Modify: `python/agent-runtime/agent_runtime/context/types.py`
- Modify: `python/agent-runtime/agent_runtime/context/assembler.py`
- Modify: `python/backend/backend/app/infrastructure/postgres/context_providers.py`
- Modify: `python/backend/backend/app/bootstrap.py`
- Test: `python/backend/tests/test_context_assembler.py`

- [ ] **Step 1: 写失败测试**

在 `python/backend/tests/test_context_assembler.py` 增加：

```python
def test_context_assembler_includes_pending_clarifications() -> None:
    provider = StaticContextProvider(
        [
            "pending_id=pending_001; action=calendar.create_event; question=明天上午几点开始开会？; partial_payload={\"title\":\"开会\"}",
        ]
    )
    assembler = ContextAssembler(
        conversation_provider=StaticContextProvider([]),
        pending_plan_provider=StaticContextProvider([]),
        pending_clarification_provider=provider,
        calendar_provider=StaticContextProvider([]),
        reminder_provider=StaticContextProvider([]),
        expense_provider=StaticContextProvider([]),
        preference_provider=StaticContextProvider([]),
        summary_memory_provider=StaticContextProvider([]),
        tool_catalog_provider=StaticContextProvider([]),
    )

    context = assembler.assemble(
        conversation_id="conversation_001",
        current_input="十点",
        current_time="2026-05-21T09:00:00+08:00",
        timezone="Asia/Shanghai",
    )

    assert context.pending_clarifications == [
        "pending_id=pending_001; action=calendar.create_event; question=明天上午几点开始开会？; partial_payload={\"title\":\"开会\"}",
    ]
```

- [ ] **Step 2: 运行测试确认失败**

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_context_assembler.py::test_context_assembler_includes_pending_clarifications -q
```

Expected: FAIL，因为 `pending_clarification_provider` 尚不存在。

- [ ] **Step 3: 扩展 ContextPack**

在 `python/agent-runtime/agent_runtime/context/types.py` 添加字段：

```python
pending_clarifications: list[str] = field(default_factory=list)
```

- [ ] **Step 4: 扩展 ContextAssembler constructor**

在 `ContextAssembler.__init__` 中增加参数：

```python
pending_clarification_provider: ContextProvider[list[str]],
```

赋值：

```python
self._pending_clarification_provider = pending_clarification_provider
```

组装 `ContextPack` 时增加：

```python
pending_clarifications=self._pending_clarification_provider.get(
    conversation_id,
    current_input,
),
```

- [ ] **Step 5: 更新所有 ContextAssembler 调用点**

在 `python/backend/backend/app/bootstrap.py` 的 in-memory 和 Postgres assembler 创建处都传入 pending clarification provider。

in-memory 先用：

```python
pending_clarification_provider=empty_list_provider,
```

Postgres provider 在下一步实现后接入。

- [ ] **Step 6: 更新 context sections used**

在 `python/orchestrator/orchestrator/planner.py` 的 `_context_sections_used()` tuple 中加入：

```python
"pending_clarifications",
```

- [ ] **Step 7: 运行 context 测试**

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_context_assembler.py -q
```

Expected: PASS。

- [ ] **Step 8: Commit**

```bash
git add python/agent-runtime/agent_runtime/context/types.py \
  python/agent-runtime/agent_runtime/context/assembler.py \
  python/backend/backend/app/bootstrap.py \
  python/orchestrator/orchestrator/planner.py \
  python/backend/tests/test_context_assembler.py
git commit -m "feat(backend): 将待追问意图注入上下文"
```

---

### Task 5: Orchestrator 保存追问并支持补全

**Files:**
- Modify: `python/backend/backend/app/bootstrap.py`
- Modify: `python/backend/backend/app/infrastructure/postgres/context_providers.py`
- Modify: `python/orchestrator/orchestrator/planner.py`
- Modify: `python/orchestrator/orchestrator/types.py`
- Modify: `python/orchestrator/orchestrator/use_cases/submit_turn.py`
- Test: `python/backend/tests/test_orchestrator_planner.py`
- Test: `python/backend/tests/test_agent_turns.py`

- [ ] **Step 1: 写 API clarification DTO 失败测试**

在 `python/backend/tests/test_agent_turns.py` 增加：

```python
def test_agent_turn_clarifies_missing_calendar_time() -> None:
    client = TestClient(app)

    response = client.post(
        "/agent/turns",
        json={
            "conversationId": "conversation_missing_calendar_time",
            "input": "明天上午我要去开会",
            "clientContext": {
                "now": "2026-05-21T09:00:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["kind"] == "clarification_request"
    assert body["question"] == "明天上午几点开始开会？"
    assert body["missingFields"] == ["start_at"]
    assert body["quickReplies"] == ["明天上午9点", "明天上午10点", "我再说具体时间"]
    assert body["clarificationId"].startswith("pending_")
```

- [ ] **Step 2: 写多轮补全失败测试**

在同一文件增加：

```python
def test_agent_turn_resolves_pending_calendar_time() -> None:
    client = TestClient(app)
    first = client.post(
        "/agent/turns",
        json={
            "conversationId": "conversation_resolve_calendar_time",
            "input": "明天上午我要去开会",
            "clientContext": {
                "now": "2026-05-21T09:00:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    ).json()
    assert first["kind"] == "clarification_request"

    second = client.post(
        "/agent/turns",
        json={
            "conversationId": "conversation_resolve_calendar_time",
            "input": "十点",
            "clientContext": {
                "now": "2026-05-21T09:01:00+08:00",
                "timezone": "Asia/Shanghai",
            },
        },
    ).json()

    assert second["kind"] == "confirmation_required"
    action = second["plan"]["actions"][0]
    assert action["actionType"] == "calendar.create_event"
    assert action["payload"]["title"] == "开会"
    assert action["payload"]["start_at"] == "2026-05-22T10:00:00+08:00"
    assert action["payload"]["end_at"] == "2026-05-22T11:00:00+08:00"
```

- [ ] **Step 3: 运行 API 测试确认失败**

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_agent_turns.py::test_agent_turn_clarifies_missing_calendar_time python/backend/tests/test_agent_turns.py::test_agent_turn_resolves_pending_calendar_time -q
```

Expected: FAIL，因为 orchestrator 尚未保存 pending clarification，也不会解析“十点”。

- [ ] **Step 4: 扩展 AgentTurnResponse**

在 `python/orchestrator/orchestrator/types.py` 增加字段：

```python
clarificationId: str
quickReplies: list[str]
```

- [ ] **Step 5: ExecutionPlanner 注入 pending store**

在 `ExecutionPlanner.__init__` 增加：

```python
pending_clarification_store: PendingClarificationStore | None = None,
```

保存为：

```python
self._pending_clarification_store = pending_clarification_store
```

- [ ] **Step 6: 保存 clarification**

在 `planning_result.kind == "clarification"` 分支中生成 pending id 并保存：

```python
pending_id = f"pending_{uuid4().hex}"
created_at = datetime.fromisoformat(now)
pending = PendingClarification(
    id=pending_id,
    conversation_id=conversation_id,
    domain=planning_result.clarification.domain or "",
    action_type=planning_result.clarification.action_type or "",
    question=planning_result.clarification.question,
    missing_fields=planning_result.clarification.missing_fields,
    partial_payload=planning_result.clarification.partial_payload,
    quick_replies=planning_result.clarification.quick_replies,
    status="open",
    created_at=created_at,
    expires_at=created_at + timedelta(hours=24),
    resolved_at=None,
)
self._save_pending_clarification(pending)
```

返回：

```python
return {
    "kind": "clarification_request",
    "conversationId": conversation_id,
    "question": planning_result.clarification.question,
    "missingFields": planning_result.clarification.missing_fields,
    "quickReplies": planning_result.clarification.quick_replies,
    "clarificationId": pending_id,
}
```

- [ ] **Step 7: 实现短句补全最小逻辑**

在 `ExecutionPlanner.submit_turn()` 组装 context 前检查 pending：

```python
resolved_candidate = self._try_resolve_pending_clarification(
    conversation_id=conversation_id,
    text=text,
    now=now,
    timezone=timezone,
)
if resolved_candidate is not None:
    planning_result = PlanningResult(
        kind="plan_candidate",
        trace_id=f"pending-clarification-{resolved_candidate[0]}",
        candidate=resolved_candidate[1],
        planner_mode="pending_clarification",
    )
else:
    # existing planning flow
```

第一版只支持 calendar start time：

```python
def _try_resolve_pending_clarification(
    self,
    conversation_id: str,
    text: str,
    now: str,
    timezone: str,
) -> tuple[str, PlanCandidate] | None:
    pending = self._latest_pending_clarification(conversation_id, now)
    if pending is None or pending.action_type != "calendar.create_event":
        return None
    hour = self._hour_from_short_time(text)
    if hour is None:
        return None
    start_at = self._datetime_from_pending(pending, hour, timezone)
    end_at = start_at + timedelta(hours=1)
    candidate = PlanCandidate(
        goal="创建日程：开会",
        proposed_actions=[
            ProposedAction(
                domain="calendar",
                action_type="calendar.create_event",
                summary="创建日程：开会",
                payload={
                    "title": str(pending.partial_payload.get("title", "开会")),
                    "start_at": start_at.isoformat(),
                    "end_at": end_at.isoformat(),
                    "timezone": timezone,
                },
                risk_level="medium",
                missing_fields=[],
            )
        ],
        missing_information=[],
        assumptions=["用户补充了开始时间，未说明时长，默认 1 小时。"],
        risk_notes=[],
    )
    self._mark_pending_resolved(pending.id, now)
    return pending.id, candidate
```

`_hour_from_short_time()` 支持：

```python
mapping = {"九点": 9, "9点": 9, "上午9点": 9, "十点": 10, "10点": 10, "上午10点": 10}
```

- [ ] **Step 8: Bootstrap 装配 store**

在 `python/backend/backend/app/bootstrap.py`：

in-memory:

```python
pending_clarification_store = InMemoryPendingClarificationStore()
```

Postgres:

```python
pending_clarification_store = PostgresPendingClarificationRepository(settings=database_settings)
```

传给 `ExecutionPlanner` constructor。

- [ ] **Step 9: 运行后端 API 测试**

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests/test_agent_turns.py python/backend/tests/test_orchestrator_planner.py -q
```

Expected: PASS。

- [ ] **Step 10: Commit**

```bash
git add python/orchestrator/orchestrator/planner.py \
  python/orchestrator/orchestrator/types.py \
  python/orchestrator/orchestrator/use_cases/submit_turn.py \
  python/backend/backend/app/bootstrap.py \
  python/backend/backend/app/infrastructure/postgres/context_providers.py \
  python/backend/tests/test_agent_turns.py \
  python/backend/tests/test_orchestrator_planner.py
git commit -m "feat(backend): 支持追问保存与多轮补全"
```

---

### Task 6: H5 渲染 clarification quick replies

**Files:**
- Modify: `apps/h5/src/app/ai-time-agent/types.ts`
- Modify: `apps/h5/src/app/ai-time-agent/backendApi.ts`
- Modify: `apps/h5/src/app/ai-time-agent/components.tsx`
- Test: `apps/h5/src/app/ai-time-agent/backendApi.contract.test.ts`
- Test: `apps/h5/src/app/ai-time-agent/agentWorkbench.contract.test.ts`

- [ ] **Step 1: 写 backendApi contract 失败测试**

在 `apps/h5/src/app/ai-time-agent/backendApi.contract.test.ts` 增加：

```ts
test("agentResponseToConversationElements renders clarification quick replies", () => {
  const elements = agentResponseToConversationElements({
    clarificationId: "pending_001",
    conversationId: "conversation_001",
    kind: "clarification_request",
    missingFields: ["start_at"],
    question: "明天上午几点开始开会？",
    quickReplies: ["明天上午9点", "明天上午10点", "我再说具体时间"],
  });

  expect(elements).toEqual([
    expect.objectContaining({
      content: "明天上午几点开始开会？",
      kind: "message",
      role: "assistant",
    }),
    {
      id: "quick-replies-pending_001",
      kind: "quick-replies",
      replies: ["明天上午9点", "明天上午10点", "我再说具体时间"],
    },
  ]);
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
pnpm --filter @ai-code/h5 test -- backendApi.contract.test.ts
```

If the package has no direct test script, run:

```bash
pnpm validate:contracts
```

Expected: FAIL，因为 `quick-replies` element 未定义。

- [ ] **Step 3: 扩展 BackendRenderedElement**

在 `apps/h5/src/app/ai-time-agent/types.ts` union 中加入：

```ts
| {
    id: string;
    kind: "quick-replies";
    replies: string[];
  }
```

- [ ] **Step 4: 更新 backendApi 转换**

在 `agentResponseToConversationElements()` 的 clarification 分支中返回 message + quick replies：

```ts
const elements: BackendRenderedElement[] = [
  {
    content: response.question,
    id: `assistant-${response.conversationId}-${Date.now()}`,
    kind: "message",
    role: "assistant",
  },
];
if (response.quickReplies && response.quickReplies.length > 0) {
  elements.push({
    id: `quick-replies-${response.clarificationId ?? response.conversationId}`,
    kind: "quick-replies",
    replies: response.quickReplies,
  });
}
return elements;
```

- [ ] **Step 5: 渲染 quick replies**

在 `apps/h5/src/app/ai-time-agent/components.tsx` 渲染 backend element 的地方增加：

```tsx
if (element.kind === "quick-replies") {
  return (
    <div className="quickReplies" key={element.id}>
      {element.replies.map((reply) => (
        <button
          className="quickReplyButton"
          key={reply}
          onClick={() => {
            void handleSubmittedText(reply);
          }}
          type="button"
        >
          {reply}
        </button>
      ))}
    </div>
  );
}
```

在 `apps/h5/src/app/globals.css` 增加：

```css
.quickReplies {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 8px 0 12px 52px;
}

.quickReplyButton {
  border: 1px solid var(--border-subtle);
  border-radius: 999px;
  background: var(--surface-muted);
  color: var(--text-primary);
  cursor: pointer;
  font-size: 13px;
  line-height: 1.2;
  padding: 8px 12px;
}
```

- [ ] **Step 6: 运行 H5 类型和契约测试**

```bash
pnpm --filter @ai-code/h5 typecheck
pnpm validate:contracts
```

Expected: PASS。

- [ ] **Step 7: Commit**

```bash
git add apps/h5/src/app/ai-time-agent/types.ts \
  apps/h5/src/app/ai-time-agent/backendApi.ts \
  apps/h5/src/app/ai-time-agent/components.tsx \
  apps/h5/src/app/globals.css \
  apps/h5/src/app/ai-time-agent/backendApi.contract.test.ts \
  apps/h5/src/app/ai-time-agent/agentWorkbench.contract.test.ts
git commit -m "feat(h5): 渲染追问快捷回复"
```

---

### Task 7: 全链路验证和文档同步

**Files:**
- Modify: `docs/knowledge-sync/feishu-pages/03-evolution-log.md`
- Modify: `ai-factory/memory/working/active-context/current-project-state.md`
- Modify: `docs/postman/ai-code-backend.postman_collection.json`

- [ ] **Step 1: 运行后端全量测试**

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests -q
```

Expected: PASS。

- [ ] **Step 2: 运行 Python 静态检查**

```bash
PATH=.venv/bin:$PATH ruff check python
PATH=.venv/bin:$PATH mypy python
```

Expected: both PASS。

- [ ] **Step 3: 运行前端检查**

```bash
pnpm --filter @ai-code/h5 typecheck
pnpm --filter @ai-code/sdk typecheck
pnpm --filter @ai-code/shared-types typecheck
pnpm validate:contracts
pnpm validate:native-shells
```

Expected: all PASS。

- [ ] **Step 4: 手动 API 验证 clarification**

Run:

```bash
curl -fsS http://127.0.0.1:8000/agent/turns \
  -H 'Content-Type: application/json' \
  -d '{
    "conversationId":"manual_clarification_001",
    "input":"明天上午我要去开会",
    "clientContext":{"now":"2026-05-21T09:00:00+08:00","timezone":"Asia/Shanghai"}
  }' | jq .
```

Expected:

```json
{
  "kind": "clarification_request",
  "question": "明天上午几点开始开会？",
  "missingFields": ["start_at"],
  "quickReplies": ["明天上午9点", "明天上午10点", "我再说具体时间"]
}
```

- [ ] **Step 5: 手动 API 验证多轮补全**

Run:

```bash
curl -fsS http://127.0.0.1:8000/agent/turns \
  -H 'Content-Type: application/json' \
  -d '{
    "conversationId":"manual_clarification_001",
    "input":"十点",
    "clientContext":{"now":"2026-05-21T09:01:00+08:00","timezone":"Asia/Shanghai"}
  }' | jq .
```

Expected: `kind` is `confirmation_required` and first action payload has `start_at=2026-05-22T10:00:00+08:00`。

- [ ] **Step 6: 手动 API 验证 chat**

Run:

```bash
curl -fsS http://127.0.0.1:8000/agent/turns \
  -H 'Content-Type: application/json' \
  -d '{
    "conversationId":"manual_chat_001",
    "input":"今天有点累",
    "clientContext":{"now":"2026-05-21T09:00:00+08:00","timezone":"Asia/Shanghai"}
  }' | jq .
```

Expected: `kind` is `assistant_message` and there is no `plan`。

- [ ] **Step 7: 更新项目状态**

在 `ai-factory/memory/working/active-context/current-project-state.md` 增加：

```markdown
- 2026-05-27 已实现对话路由与追问补全 v1：支持 chat、clarification、plan_candidate 和 mixed schema；“明天上午我要去开会”会追问具体时间，用户补充“十点”后生成日程确认卡；H5 渲染 quick replies。
```

在验证区增加实际命令结果。

- [ ] **Step 8: 更新飞书源稿**

在 `docs/knowledge-sync/feishu-pages/03-evolution-log.md` 增加阶段记录：

```markdown
## 阶段 36：对话路由与追问补全实施

完成内容：
- LLM 和规则 planner 支持 `chat`、`clarification`、`plan_candidate`、`mixed` 响应。
- 后端保存 pending clarification，并支持用户用“十点”补全最近一条缺时间日程。
- H5 渲染追问 quick replies。

验证结果：
- 后端、前端、契约、原生壳和上下文同步验证均通过。
```

- [ ] **Step 9: 运行上下文同步检查**

```bash
pnpm validate:context-sync
pnpm validate:factory
git diff --check
```

Expected: all PASS。

- [ ] **Step 10: Commit**

```bash
git add ai-factory/memory/working/active-context/current-project-state.md \
  docs/knowledge-sync/feishu-pages/03-evolution-log.md \
  docs/postman/ai-code-backend.postman_collection.json
git commit -m "docs(ai-factory): 记录对话路由追问补全实施"
```

---

## Final Verification

Run:

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests -q
PATH=.venv/bin:$PATH ruff check python
PATH=.venv/bin:$PATH mypy python
pnpm --filter @ai-code/h5 typecheck
pnpm --filter @ai-code/sdk typecheck
pnpm --filter @ai-code/shared-types typecheck
pnpm validate:contracts
pnpm validate:native-shells
pnpm validate:context-sync
pnpm validate:factory
git diff --check
```

Expected:

- Python tests pass.
- Ruff and mypy pass.
- H5, SDK, shared types pass.
- Contract and native shell validation pass.
- Context sync and factory validation pass.
- Diff check has no whitespace errors.

Manual iOS/H5 scenarios:

- 输入“明天上午我要去开会”显示追问和快捷回复。
- 点击“明天上午10点”或输入“十点”生成日程确认卡。
- 输入“今天有点累”显示自然聊天，不生成确认卡。
- 输入“明天上午九点提醒我带电脑”仍生成提醒确认卡。
- 输入“把昨天 58 元打车票报销”仍生成费用确认卡。

---

## Self-Review

- Spec coverage: 覆盖了四类 response type、pending clarification、H5 quick replies、错误降级、测试策略和验收标准。
- Placeholder scan: 本计划不包含空泛任务；每个任务都有文件、测试、命令和提交点。
- Type consistency: `ClarificationRequest.quick_replies` 对应 API `quickReplies`，H5 渲染元素使用 `kind: "quick-replies"`；后端 pending model 使用 `PendingClarification`。
- Scope check: 计划只做对话路由、追问补全和 quick replies，不扩展外部日历、通知、语音或长期人格记忆。
