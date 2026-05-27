# 对话路由与追问补全设计

## 背景

当前 AI 时间管理 Agent 已经具备日程、提醒、费用三类确认执行闭环，也已经把规划主路径切到 `llm_first`。但当前体验仍像“动作解析器”：用户输入如果不能直接转成日程、提醒或费用 action，就容易得到“未识别到可执行动作”的回复。

这会带来三个问题：

- 用户闲聊时，系统不能自然回应。
- 用户表达了明确意图但缺少字段时，系统不会追问。
- 用户后续补充“十点”“明天上午九点”等短句时，系统没有 pending intent 可以承接。

目标是把对话从“只识别三类具体实现”升级为“先理解对话类型，再决定闲聊、追问或生成确认计划”。

## 目标

- 支持自然闲聊，不把所有输入都强行映射到工具。
- 对缺少关键信息的计划意图返回 clarification，而不是失败文案。
- 保存待补全意图，允许用户用短句补充字段。
- 保持执行安全：LLM 只能生成候选回复、追问和候选计划，不能直接写业务事实。
- 保持当前日程、提醒、费用确认卡和幂等执行链路不变。

## 非目标

- 不在本轮实现长期人格记忆。
- 不接入外部日历、系统通知或真实语音识别。
- 不让 LLM 直接调用工具或写数据库。
- 不做复杂多轮任务管理器；本轮只支持最近一个或少量 pending clarification 的补全。

## 核心设计

新增对话路由结果类型，规划引擎输出不再只有 `PlanCandidate` 或 assistant message，而是先归类为四种响应：

```text
chat
clarification
plan_candidate
mixed
```

`chat` 表示用户没有明确执行动作，系统自然回复。

`clarification` 表示用户有明确意图，但缺少执行所需字段。例如“明天上午我要去开会”缺少具体开始时间，应追问“明天上午几点开始？”。

`plan_candidate` 表示信息完整，可以生成现有确认卡。

`mixed` 表示同一句中同时包含闲聊、追问或可执行动作。例如“明天可能会很忙，上午去开会，下午提醒我交材料”。

## LLM 输出 Schema

真实 LLM provider 和 mock provider 都应返回统一 JSON：

```json
{
  "response_type": "chat",
  "assistant_message": "可以，我在。你想先整理明天的安排，还是只是聊聊？",
  "clarification": null,
  "actions": [],
  "missing_information": [],
  "assumptions": [],
  "risk_notes": []
}
```

Clarification 示例：

```json
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
      "date_hint": "2026-05-28",
      "time_range_hint": "morning",
      "timezone": "Asia/Shanghai"
    }
  },
  "actions": [],
  "missing_information": ["start_at"],
  "assumptions": [],
  "risk_notes": []
}
```

Plan candidate 示例保持现有 action 结构：

```json
{
  "response_type": "plan_candidate",
  "assistant_message": "我识别到一个日程，确认后会写入 Timeline。",
  "clarification": null,
  "actions": [
    {
      "domain": "calendar",
      "action_type": "calendar.create_event",
      "summary": "创建日程：开会",
      "payload": {
        "title": "开会",
        "start_at": "2026-05-28T09:00:00+08:00",
        "end_at": "2026-05-28T10:00:00+08:00",
        "timezone": "Asia/Shanghai"
      },
      "risk_level": "medium",
      "missing_fields": []
    }
  ],
  "missing_information": [],
  "assumptions": ["未说明时长，默认 1 小时。"],
  "risk_notes": []
}
```

## Pending Clarification

新增 `PendingClarification` 概念，用于保存待补字段：

```text
id
conversation_id
domain
action_type
question
missing_fields
partial_payload
quick_replies
status
created_at
expires_at
resolved_at
```

第一版可先用现有 repository 模式实现 in-memory 和 Postgres 两套存储。生命周期如下：

1. 用户说“明天上午我要去开会”。
2. LLM 返回 `clarification`，后端保存 pending clarification。
3. H5 展示追问和快捷选项。
4. 用户回复“十点”或点击“明天上午10点”。
5. ContextAssembler 把最近 pending clarification 放入 `ContextPack`。
6. LLM 或规则补全器把短句合并到 `partial_payload`。
7. 信息完整后生成确认卡。
8. 用户确认后，原有 `ExecutionRunner` 写入领域事实。

过期策略：默认 pending clarification 保留 24 小时；如果用户明确换话题，可以标记为 `abandoned`。

## 后端边界

`agent_runtime.planning` 新增对话路由类型和 schema 校验：

- `ConversationResponse`
- `ClarificationCandidate`
- `PlanningResponseType`

`orchestrator` 负责把 `clarification` 转成 API 响应，并保存 pending clarification。

`backend` 只负责 HTTP DTO 转换和 repository adapter，不把追问逻辑写进路由。

`PolicyEngine` 继续负责执行安全。缺字段时不能生成待确认执行计划；只有字段完整的 `PlanCandidate` 才能进入 `PlanCompiler`。

## 前端与原生表现

H5 对话流新增一种 clarification message：

- 显示 assistant 追问。
- 渲染 quick replies。
- 用户点击 quick reply 时，按普通输入再次提交。
- 用户直接输入短句时，同样走 `/agent/turns`。

iOS 原生输入不需要新增复杂能力。第一版只要继续把键盘或语音文本发给 H5，H5 再发给后端即可。

## 示例场景

### 缺时间的日程

用户：明天上午我要去开会

系统：明天上午几点开始？我可以按 9 点、10 点，或你指定的时间来安排。

用户：十点

系统：生成确认卡：明天 10:00-11:00 开会。

### 闲聊

用户：今天有点累

系统：听起来今天消耗挺大。要不要我帮你看一下明天的安排，留一点缓冲？

不生成 action，不写数据库。

### 混合输入

用户：明天有点忙，上午去开会，下午提醒我交材料

系统：下午提醒交材料可以确认；上午会议还缺具体时间。你希望上午几点开始？

如果提醒时间也缺失，则两个动作都进入追问，不生成执行计划。

## 错误与降级

- LLM 返回无效 JSON：记录 provider 日志，回落 rule planner。
- LLM 返回未知 `response_type`：作为无效响应处理，并回落规则。
- Rule fallback 识别到缺字段：也应返回 clarification，不再返回“未识别”。
- Pending clarification 过期：系统提示“这个安排已经过期了，你可以重新说一下完整需求。”
- 用户补充无法匹配 pending：系统先自然回应，再提示可以重新描述。

## 测试策略

- LLM schema 测试：覆盖 `chat`、`clarification`、`plan_candidate`、`mixed`。
- Planner 测试：缺少时间的 calendar 输入返回 clarification。
- Pending clarification 测试：保存、读取、过期、resolve。
- API 测试：`POST /agent/turns` 返回 clarification DTO 和 quick replies。
- 多轮测试：“明天上午我要去开会” -> “十点” -> confirmation card。
- H5 契约测试：clarification message 和 quick reply 渲染。
- 回归测试：已完整的日程、提醒、费用仍走确认卡；确认执行和幂等不变。

## 实施顺序建议

1. 扩展 planning 类型和 LLM prompt/schema。
2. 让 `LlmPlanningEngine` 能返回 `clarification` 和 `chat`。
3. 增加 `PendingClarification` repository 和 ContextAssembler provider。
4. 更新 orchestrator 用例和 API DTO。
5. 更新 H5 clarification 渲染和 quick reply 交互。
6. 补多轮端到端测试。

## 验收标准

- “明天上午我要去开会”返回追问，而不是“未识别”。
- 用户补充“十点”后生成确认卡。
- “今天有点累”返回自然聊天，不生成 action。
- 完整输入“明天上午九点提醒我带电脑”仍生成提醒确认卡。
- 完整输入“把昨天 58 元打车票报销”仍生成费用确认卡。
- LLM 调用日志仍能显示 provider、model、耗时、prompt 长度和响应长度。
- 所有业务事实写入仍必须经过确认。
