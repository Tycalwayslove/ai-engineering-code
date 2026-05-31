import { ApiClient } from "@ai-code/sdk";
import type {
  AgentConversationDebug,
  AgentConversationTurn,
  AgentTurnResponse,
  AttachmentIntake,
  CalendarEvent,
  DomainAction,
  ExecutionPlan,
  ExecutionLedgerItem,
  ExpenseRecord,
  Reminder,
} from "@ai-code/sdk";

import type { BackendRenderedElement } from "./types";

const envApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

type ConversationTurnsRestoreOptions = {
  confirmationTokensByPlanId?: Record<string, string>;
};

export function getDefaultApiBaseUrl(currentHref?: string) {
  if (envApiBaseUrl && envApiBaseUrl.trim().length > 0) {
    return envApiBaseUrl.replace(/\/+$/, "");
  }

  if (currentHref) {
    const url = new URL(currentHref);
    return `${url.protocol}//${url.hostname}:8000`;
  }

  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:8000`;
  }

  return "http://localhost:8000";
}

export function createAgentApiClient(currentHref?: string) {
  return new ApiClient({
    baseUrl: getDefaultApiBaseUrl(currentHref),
  });
}

export function agentResponseToConversationElements(
  response: AgentTurnResponse,
): BackendRenderedElement[] {
  if (response.kind === "clarification_request") {
    const quickReplies = quickReplyLabels(response);
    const replyValues = quickReplyValues(response);
    const elements: BackendRenderedElement[] = [
      {
        content: response.question,
        id: `assistant-${response.conversationId}-${Date.now()}`,
        kind: "message",
        role: "assistant",
      },
    ];
    if (quickReplies.length > 0) {
      elements.push({
        id: `quick-replies-${response.clarificationId ?? response.conversationId}`,
        kind: "quick-replies",
        replies: quickReplies,
        replyValues,
      });
    }
    return elements;
  }

  if (response.kind === "assistant_message") {
    return [
      {
        content: response.message,
        id: `assistant-${response.conversationId}-${Date.now()}`,
        kind: "message",
        role: "assistant",
      },
      ...structuredElementsToBackendElements(response.structuredElements),
    ];
  }

  const plan = response.plan;
  const elements: BackendRenderedElement[] = [
    {
      content:
        response.kind === "execution_result"
          ? `已执行：${plan.summary}`
          : response.message ?? plan.summary,
      id: `${plan.id}-summary-${response.kind}`,
      kind: "message",
      role: "assistant",
    },
  ];

  if (response.kind === "confirmation_required" && plan.confirmation) {
    elements.push({
      actions: plan.actions.map(actionToConfirmationAction),
      confirmToken: plan.confirmation.confirmToken,
      description: plan.confirmation.description,
      id: plan.confirmation.id,
      kind: "confirmation",
      planId: plan.id,
      title: plan.confirmation.title,
    });
  }

  if (response.kind === "execution_result") {
    elements.push(...plan.actions.flatMap(actionToResultElements));
  }

  return elements;
}

export function conversationTurnsToConversationElements(
  turns: AgentConversationTurn[],
  options: ConversationTurnsRestoreOptions = {},
): BackendRenderedElement[] {
  return turns.flatMap((turn) => {
    if (turn.role === "user") {
      return [
        {
          content: turn.inputText ?? turn.summary,
          id: `history-turn-${turn.id}`,
          kind: "message" as const,
          role: "user" as const,
        },
      ];
    }

    const response = turn.structuredResponse;
    if (response?.kind === "assistant_message") {
      return [
        {
          content: response.message,
          id: `history-turn-${turn.id}`,
          kind: "message" as const,
          role: "assistant" as const,
        },
        ...structuredElementsToBackendElements(response.structuredElements),
      ];
    }

    if (response?.kind === "clarification_request") {
      const quickReplies = quickReplyLabels(response);
      const replyValues = quickReplyValues(response);
      const elements: BackendRenderedElement[] = [
        {
          content: response.question,
          id: `history-turn-${turn.id}`,
          kind: "message",
          role: "assistant",
        },
      ];
      if (quickReplies.length > 0) {
        elements.push({
          id: `history-quick-replies-${turn.id}`,
          kind: "quick-replies",
          replies: quickReplies,
          replyValues,
        });
      }
      return elements;
    }

    if (response?.kind === "confirmation_required") {
      const restored = restorePendingConfirmationResponse(response, options);
      if (restored) {
        return agentResponseToConversationElements(restored);
      }
    }

    return [
      {
        content: turn.summary,
        id: `history-turn-${turn.id}`,
        kind: "message" as const,
        role: turn.role === "system" ? "system" : "assistant",
      },
    ];
  });
}

function quickReplyLabels(
  response: Extract<AgentTurnResponse, { kind: "clarification_request" }>,
) {
  if (response.quickReplyOptions && response.quickReplyOptions.length > 0) {
    return response.quickReplyOptions.map((option) => option.label);
  }
  return response.quickReplies;
}

function quickReplyValues(
  response: Extract<AgentTurnResponse, { kind: "clarification_request" }>,
) {
  if (response.quickReplyOptions && response.quickReplyOptions.length > 0) {
    return response.quickReplyOptions.map((option) => option.value);
  }
  return response.quickReplies;
}

export function pendingConfirmationPlansToBackendElements(
  plans: ExecutionPlan[],
): BackendRenderedElement[] {
  return plans.flatMap((plan) => {
    if (
      plan.status !== "awaiting_confirmation" ||
      !plan.confirmation ||
      plan.confirmation.status !== "pending" ||
      !plan.confirmation.confirmToken ||
      plan.confirmation.confirmToken === "redacted"
    ) {
      return [];
    }

    return [
      {
        actions: plan.actions.map(actionToConfirmationAction),
        confirmToken: plan.confirmation.confirmToken,
        description: plan.confirmation.description,
        id: plan.confirmation.id,
        kind: "confirmation" as const,
        planId: plan.id,
        title: plan.confirmation.title,
      },
    ];
  });
}

function restorePendingConfirmationResponse(
  response: AgentTurnResponse,
  options: ConversationTurnsRestoreOptions,
): AgentTurnResponse | null {
  if (response.kind !== "confirmation_required") {
    return null;
  }
  const confirmation = response.plan.confirmation;
  if (
    response.plan.status !== "awaiting_confirmation" ||
    !confirmation ||
    confirmation.status !== "pending"
  ) {
    return null;
  }

  const confirmToken =
    options.confirmationTokensByPlanId?.[response.plan.id] ??
    options.confirmationTokensByPlanId?.[confirmation.planId];
  if (!confirmToken || confirmToken === "redacted") {
    return null;
  }

  return {
    ...response,
    plan: {
      ...response.plan,
      confirmation: {
        ...confirmation,
        confirmToken,
      },
    },
  };
}

function structuredElementsToBackendElements(
  elements: Record<string, unknown>[] | undefined,
): BackendRenderedElement[] {
  if (!elements) {
    return [];
  }
  return elements.flatMap((element) => {
    const converted = structuredElementToBackendElement(element);
    return converted ? [converted] : [];
  });
}

function structuredElementToBackendElement(
  element: Record<string, unknown>,
): BackendRenderedElement | null {
  if (element.kind !== "summary-list") {
    return null;
  }
  const id = typeof element.id === "string" ? element.id : "assistant-summary-list";
  const title = typeof element.title === "string" ? element.title : "查询结果";
  const items = Array.isArray(element.items)
    ? element.items.flatMap((item) => {
        if (!isRecord(item)) {
          return [];
        }
        const label = typeof item.label === "string" ? item.label : undefined;
        if (!label) {
          return [];
        }
        return [
          {
            id: typeof item.id === "string" ? item.id : label,
            label,
            meta: typeof item.meta === "string" ? item.meta : "",
            tone: toSummaryTone(item.tone),
          },
        ];
      })
    : [];

  return {
    id,
    items,
    kind: "summary-list",
    title,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toSummaryTone(value: unknown): "primary" | "success" | "warning" | "info" {
  if (
    value === "primary" ||
    value === "success" ||
    value === "warning" ||
    value === "info"
  ) {
    return value;
  }
  return "info";
}

export function calendarEventsToBackendElements(
  events: CalendarEvent[],
  options: {
    focusedCalendarEventId?: string;
  } = {},
): BackendRenderedElement[] {
  return [
    {
      id: "calendar-events-from-api",
      items:
        events.length === 0
          ? [
              {
                id: "calendar-empty",
                label: "暂无日程",
                meta: "确认一条日程创建指令后会显示在这里",
                tone: "info",
              },
            ]
          : selectRecentItemsWithFocus(
              events,
              options.focusedCalendarEventId,
            ).map((event) => ({
              actions:
                event.status === "scheduled"
                  ? [
                      {
                        editValues: {
                          endAt: event.endAt,
                          startAt: event.startAt,
                          timezone: event.timezone,
                          title: event.title,
                        },
                        label: "编辑",
                        type: "calendar.edit" as const,
                      },
                      {
                        label: "取消",
                        type: "calendar.cancel" as const,
                      },
                    ]
                  : undefined,
              highlighted:
                event.id === options.focusedCalendarEventId ? true : undefined,
              id: event.id,
              label: event.title,
              meta: `${formatDateTime(event.startAt)} -> ${formatTime(event.endAt)}｜${event.timezone}`,
              tone: event.status === "scheduled" ? "success" : "warning",
            })),
      kind: "summary-list",
      title: "数据库日程",
    },
  ];
}

export function expensesToBackendElements(
  expenses: ExpenseRecord[],
): BackendRenderedElement[] {
  return [
    {
      id: "expenses-from-api",
      items:
        expenses.length === 0
          ? [
              {
                id: "expenses-empty",
                label: "暂无费用草稿",
                meta: "输入“把昨天 58 元打车票报销”并确认后会显示草稿",
                tone: "info",
              },
            ]
          : expenses.slice(-6).map((expense) => ({
              actions:
                expense.status === "draft"
                  ? [
                      {
                        editValues: {
                          amount: expense.amount,
                          currency: expense.currency,
                          occurredOn: expense.occurredOn,
                          title: expense.title,
                        },
                        label: "编辑",
                        type: "expense.edit" as const,
                      },
                      {
                        label: "提交",
                        type: "expense.submit" as const,
                      },
                      {
                        label: "取消",
                        type: "expense.cancel" as const,
                      },
                    ]
                  : undefined,
              id: expense.id,
              label: expense.title,
              meta: `${formatAmount(expense.amount, expense.currency)}｜${expense.occurredOn ?? "待补发生日期"}｜${expense.status}`,
              tone: expense.status === "draft" ? "warning" : "success",
            })),
      kind: "summary-list",
      title: "费用草稿",
    },
  ];
}

function selectRecentItemsWithFocus<T extends { id: string }>(
  items: T[],
  focusedId: string | undefined,
  limit = 6,
) {
  const recentItems = items.slice(-limit);
  if (
    !focusedId ||
    recentItems.some((item) => item.id === focusedId)
  ) {
    return recentItems;
  }

  const focusedItem = items.find((item) => item.id === focusedId);
  if (!focusedItem) {
    return recentItems;
  }

  return [
    focusedItem,
    ...recentItems.filter((item) => item.id !== focusedId),
  ].slice(0, limit);
}

export function remindersToBackendElements(
  reminders: Reminder[],
  options: {
    focusedReminderId?: string;
  } = {},
): BackendRenderedElement[] {
  return [
    {
      id: "reminders-from-api",
      items:
        reminders.length === 0
          ? [
              {
                id: "reminders-empty",
                label: "暂无提醒",
                meta: "语音或键盘提交“明天上午九点提醒我带电脑”后会显示提醒",
                tone: "info",
              },
            ]
          : selectRecentItemsWithFocus(
              reminders,
              options.focusedReminderId,
            ).map((reminder) => ({
              actions:
                reminder.status === "scheduled"
                  ? [
                      {
                        editValues: {
                          dueAt: reminder.dueAt,
                          title: reminder.title,
                        },
                        label: "编辑",
                        type: "reminder.edit" as const,
                      },
                      {
                        label: "完成",
                        type: "reminder.complete" as const,
                      },
                      {
                        label: "取消",
                        type: "reminder.cancel" as const,
                      },
                    ]
                  : undefined,
              highlighted:
                reminder.id === options.focusedReminderId ? true : undefined,
              id: reminder.id,
              label: reminder.title,
              meta: `${formatDateTime(reminder.dueAt)}｜${reminder.status}`,
              tone: reminder.status === "scheduled" ? "success" : "warning",
            })),
      kind: "summary-list",
      title: "提醒列表",
    },
  ];
}

export function attachmentIntakesToBackendElements(
  attachments: AttachmentIntake[],
): BackendRenderedElement[] {
  return [
    {
      id: "attachments-from-api",
      items:
        attachments.length === 0
          ? [
              {
                id: "attachments-empty",
                label: "暂无附件",
                meta: "点击原生附件按钮选择照片或文件后会显示在这里",
                tone: "info",
              },
            ]
          : attachments.slice(-6).map((attachment) => ({
              id: attachment.id,
              label: attachment.name,
              meta: `${attachment.kind}｜${formatAttachmentSize(attachment.sizeBytes)}｜${formatDateTime(attachment.createdAt)}`,
              tone: "info" as const,
            })),
      kind: "summary-list",
      title: "本轮附件资源",
    },
  ];
}

export function agentDebugToBackendElements(
  debug: AgentConversationDebug,
): BackendRenderedElement[] {
  const latestTrace = debug.decisionTraces.at(-1);
  const latestEvent = debug.events.at(-1);
  const openPending = debug.pendingClarifications.find(
    (pending) => pending.status === "open",
  );

  return [
    {
      id: "agent-debug-from-api",
      items: [
        {
          id: "agent-debug-planner",
          label: "Planner",
          meta: latestTrace
            ? `${latestTrace.plannerMode}${latestTrace.fallbackReason ? `｜fallback: ${latestTrace.fallbackReason}` : ""}`
            : "暂无决策 trace",
          tone: latestTrace?.fallbackReason ? "warning" : "success",
        },
        {
          id: "agent-debug-llm-call",
          label: "LLM 调用",
          meta: latestTrace?.llmCall
            ? `${latestTrace.llmCall.provider}｜${latestTrace.llmCall.model}｜${latestTrace.llmCall.durationMs}ms｜${latestTrace.llmCall.promptSha256.slice(0, 12)}`
            : "暂无 provider 调用",
          tone:
            latestTrace?.llmCall?.status === "failed"
              ? "warning"
              : latestTrace?.llmCall
                ? "success"
                : "info",
        },
        {
          id: "agent-debug-tools",
          label: "工具选择",
          meta: latestTrace
            ? formatListOrEmpty(latestTrace.toolsSelected, "未选择工具")
            : "暂无工具记录",
          tone: "info",
        },
        {
          id: "agent-debug-missing",
          label: "缺失信息",
          meta: latestTrace
            ? formatListOrEmpty(latestTrace.missingInformation, "无缺失字段")
            : "暂无缺失字段记录",
          tone: latestTrace?.missingInformation.length ? "warning" : "success",
        },
        {
          id: "agent-debug-pending",
          label: "当前追问",
          meta: openPending
            ? `${openPending.question}｜${openPending.missingFields.join(", ")}`
            : "暂无打开的追问",
          tone: openPending ? "warning" : "success",
        },
        {
          id: "agent-debug-events",
          label: "事件记录",
          meta: latestEvent
            ? `${debug.events.length} 条｜最新：${latestEvent.eventType}`
            : "暂无事件",
          tone: "info",
        },
      ],
      kind: "summary-list",
      title: "Agent 调试",
    },
  ];
}

export function timelineToBackendElements(
  events: CalendarEvent[],
  reminders: Reminder[],
  expenses: ExpenseRecord[],
): BackendRenderedElement[] {
  const items = [
    ...events.map((event) => ({
      actions:
        event.status === "scheduled"
          ? [
              {
                editValues: {
                  endAt: event.endAt,
                  startAt: event.startAt,
                  timezone: event.timezone,
                  title: event.title,
                },
                label: "编辑",
                targetId: event.id,
                type: "calendar.edit" as const,
              },
              {
                label: "取消",
                targetId: event.id,
                type: "calendar.cancel" as const,
              },
            ]
          : undefined,
      id: `timeline-event-${event.id}`,
      label: event.title,
      meta: `${formatDateTime(event.startAt)} -> ${formatTime(event.endAt)}｜日程｜${event.status}`,
      sortAt: event.startAt,
      tone: "success" as const,
    })),
    ...reminders.map((reminder) => ({
      actions:
        reminder.status === "scheduled"
          ? [
              {
                editValues: {
                  dueAt: reminder.dueAt,
                  title: reminder.title,
                },
                label: "编辑",
                targetId: reminder.id,
                type: "reminder.edit" as const,
              },
              {
                label: "完成",
                targetId: reminder.id,
                type: "reminder.complete" as const,
              },
              {
                label: "取消",
                targetId: reminder.id,
                type: "reminder.cancel" as const,
              },
            ]
          : undefined,
      id: `timeline-reminder-${reminder.id}`,
      label: reminder.title,
      meta: `${formatDateTime(reminder.dueAt)}｜提醒｜${reminder.status}`,
      sortAt: reminder.dueAt,
      tone: "info" as const,
    })),
    ...expenses.map((expense) => ({
      actions:
        expense.status === "draft"
          ? [
              {
                editValues: {
                  amount: expense.amount,
                  currency: expense.currency,
                  occurredOn: expense.occurredOn,
                  title: expense.title,
                },
                label: "编辑",
                targetId: expense.id,
                type: "expense.edit" as const,
              },
              {
                label: "提交",
                targetId: expense.id,
                type: "expense.submit" as const,
              },
              {
                label: "取消",
                targetId: expense.id,
                type: "expense.cancel" as const,
              },
            ]
          : undefined,
      id: `timeline-expense-${expense.id}`,
      label: expense.title,
      meta: `${formatExpenseTimelineDate(expense.occurredOn)}｜${formatAmount(expense.amount, expense.currency)}｜费用｜${expense.status}`,
      sortAt: expense.occurredOn
        ? `${expense.occurredOn}T23:59:59`
        : "9999-12-31T23:59:59",
      tone: "warning" as const,
    })),
  ].sort((left, right) => left.sortAt.localeCompare(right.sortAt));

  return [
    {
      id: "timeline-from-api",
      items:
        items.length === 0
          ? [
              {
                id: "timeline-empty",
                label: "暂无时间线事项",
                meta: "日程、提醒和费用确认后会合并展示",
                tone: "info",
              },
            ]
          : items.slice(0, 8).map(({ sortAt: _sortAt, ...item }) => item),
      kind: "summary-list",
      title: "时间线",
    },
  ];
}

function formatExpenseTimelineDate(occurredOn?: string) {
  return occurredOn ?? "待补发生日期";
}

export function executionLedgerToBackendElements(
  ledger: ExecutionLedgerItem[],
): BackendRenderedElement[] {
  return [
    {
      id: "execution-ledger-from-api",
      items: ledger.slice(-8).map((item) => ({
        completed: item.status !== "failed",
        id: item.id,
        label: eventTypeLabel(item.eventType),
        meta: `${item.message}｜${formatDateTime(item.createdAt)}`,
      })),
      kind: "ledger",
      title: "数据库执行记录",
    },
  ];
}

export function removeConfirmationElement(
  elements: BackendRenderedElement[],
  planId: string,
) {
  return elements.filter(
    (element) => element.kind !== "confirmation" || element.planId !== planId,
  );
}

function actionToConfirmationAction(action: DomainAction) {
  return {
    id: action.id,
    label: action.summary,
    meta: actionMeta(action),
  };
}

function actionToResultElements(action: DomainAction): BackendRenderedElement[] {
  if (action.result?.calendarEvent && typeof action.result.calendarEvent === "object") {
    const event = action.result.calendarEvent as Partial<CalendarEvent>;
    return [
      {
        id: `${action.id}-calendar-result`,
        items: [
          {
            id: `${action.id}-calendar-result-row`,
            label: event.title ?? action.summary,
            meta:
              typeof event.startAt === "string" && typeof event.endAt === "string"
                ? `${formatDateTime(event.startAt)} -> ${formatTime(event.endAt)}`
                : "日程已写入",
            tone: "success",
          },
        ],
        kind: "summary-list",
        title: calendarResultTitle(action.actionType),
      },
    ];
  }

  if (action.result?.expenseRecord && typeof action.result.expenseRecord === "object") {
    const expense = action.result.expenseRecord as Partial<ExpenseRecord>;
    return [
      {
        id: `${action.id}-expense-result`,
        items: [
          {
            id: `${action.id}-expense-result-row`,
            label: expense.title ?? action.summary,
            meta: `${formatAmount(expense.amount, expense.currency)}｜${expense.occurredOn ?? "待补日期"}`,
            tone: "warning",
          },
        ],
        kind: "summary-list",
        title: expenseResultTitle(action.actionType),
      },
    ];
  }

  if (action.result?.reminder && typeof action.result.reminder === "object") {
    const reminder = action.result.reminder as Partial<Reminder>;
    return [
      {
        id: `${action.id}-reminder-result`,
        items: [
          {
            id: `${action.id}-reminder-result-row`,
            label: reminder.title ?? action.summary,
            meta:
              typeof reminder.dueAt === "string"
                ? `${formatDateTime(reminder.dueAt)}｜${reminder.status ?? "待提醒"}`
                : "提醒已写入",
            tone: reminder.status === "canceled" ? "warning" : "success",
          },
        ],
        kind: "summary-list",
        title: reminderResultTitle(action.actionType),
      },
    ];
  }

  return [];
}

function calendarResultTitle(actionType: DomainAction["actionType"]) {
  if (actionType === "calendar.cancel_event") {
    return "已取消日程";
  }
  if (actionType === "calendar.update_event") {
    return "已更新日程";
  }
  return "已创建日程";
}

function expenseResultTitle(actionType: DomainAction["actionType"]) {
  if (actionType === "expense.submit_reimbursement") {
    return "已提交费用";
  }
  if (actionType === "expense.cancel_reimbursement") {
    return "已取消费用";
  }
  if (actionType === "expense.update_reimbursement") {
    return "已更新费用";
  }
  return "已创建费用草稿";
}

function reminderResultTitle(actionType: DomainAction["actionType"]) {
  if (actionType === "reminder.complete_reminder") {
    return "已完成提醒";
  }
  if (actionType === "reminder.cancel_reminder") {
    return "已取消提醒";
  }
  if (actionType === "reminder.update_reminder") {
    return "已更新提醒";
  }
  return "已创建提醒";
}

function actionMeta(action: DomainAction) {
  const title =
    typeof action.payload.title === "string" ? action.payload.title : action.actionType;
  if (
    action.actionType === "calendar.cancel_event" ||
    action.actionType === "calendar.update_event" ||
    action.actionType === "expense.submit_reimbursement" ||
    action.actionType === "expense.cancel_reimbursement" ||
    action.actionType === "expense.update_reimbursement" ||
    action.actionType === "reminder.complete_reminder" ||
    action.actionType === "reminder.cancel_reminder" ||
    action.actionType === "reminder.update_reminder"
  ) {
    const targetId =
      typeof action.payload.target_id === "string"
        ? action.payload.target_id
        : "待定位目标";
    return `${targetId}｜${action.riskLevel}`;
  }
  if (action.actionType === "expense.create_reimbursement_draft") {
    const amount =
      typeof action.payload.amount === "number"
        ? formatAmount(action.payload.amount, "CNY")
        : "待补金额";
    return `${title}｜${amount}｜${action.riskLevel}`;
  }
  if (action.actionType === "reminder.create_reminder") {
    const dueAt =
      typeof action.payload.due_at === "string"
        ? formatDateTime(action.payload.due_at)
        : "待后端解析时间";
    return `${title}｜${dueAt}｜${action.riskLevel}`;
  }
  const startAt =
    typeof action.payload.start_at === "string"
      ? formatDateTime(action.payload.start_at)
      : "待后端解析时间";

  return `${title}｜${startAt}｜${action.riskLevel}`;
}

function eventTypeLabel(eventType: ExecutionLedgerItem["eventType"]) {
  switch (eventType) {
    case "action_executed":
      return "执行领域操作";
    case "direct_action_executed":
      return "直接操作事项";
    case "action_failed":
      return "执行失败";
    case "confirmation_created":
      return "创建确认卡";
    case "plan_created":
      return "生成执行计划";
    case "plan_rejected":
      return "拒绝执行计划";
  }
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
  }).format(date);
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatAmount(amount: number | undefined, currency: string | undefined) {
  if (amount === undefined) {
    return "待补金额";
  }
  return `${amount.toLocaleString("zh-CN")} ${currency ?? "CNY"}`;
}

function formatListOrEmpty(values: string[], emptyLabel: string) {
  return values.length > 0 ? values.join(", ") : emptyLabel;
}

function formatAttachmentSize(sizeBytes: number | undefined) {
  if (sizeBytes === undefined) {
    return "未知大小";
  }
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }
  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  }
  return `${(sizeBytes / 1024 / 1024).toFixed(1)} MB`;
}
