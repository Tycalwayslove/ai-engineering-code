import type {
  AgentConversationDebug,
  AgentConversationTurns,
  AgentTurnRequest,
  AgentTurnResponse,
  AttachmentIntake,
  AttachmentIntakeRequest,
  AttachmentUploadRequest,
  CalendarEvent,
  DomainAction,
  ExecutionLedgerItem,
  ExpenseRecord,
  Reminder,
} from "@ai-code/sdk";
import { ApiClient } from "@ai-code/sdk";

import {
  agentDebugToBackendElements,
  agentResponseToConversationElements,
  attachmentIntakesToBackendElements,
  calendarEventsToBackendElements,
  conversationTurnsToConversationElements,
  executionLedgerToBackendElements,
  expensesToBackendElements,
  getDefaultApiBaseUrl,
  pendingConfirmationPlansToBackendElements,
  removeConfirmationElement,
  remindersToBackendElements,
  timelineToBackendElements,
} from "./backendApi";
import type { AgentSurface, BackendRenderedElement } from "./types";

const confirmationResponse = {
  conversationId: "conversation_e2e",
  kind: "confirmation_required",
  plan: {
    actions: [
      {
        actionType: "calendar.create_event",
        domain: "calendar",
        id: "action_create",
        payload: {
          end_at: "2026-05-24T16:00:00+08:00",
          start_at: "2026-05-24T15:00:00+08:00",
          timezone: "Asia/Shanghai",
          title: "开会",
        },
        planId: "plan_create",
        riskLevel: "medium",
        status: "awaiting_confirmation",
        summary: "创建日程：开会",
      },
    ],
    confirmation: {
      confirmToken: "confirm_token",
      description: "确认后将写入日历。",
      id: "confirmation_create",
      planId: "plan_create",
      requiredActionIds: ["action_create"],
      status: "pending",
      title: "确认 1 项日程操作",
    },
    conversationId: "conversation_e2e",
    decisionTraceId: "trace_create",
    id: "plan_create",
    riskLevel: "medium",
    status: "awaiting_confirmation",
    summary: "创建日程：开会",
  },
} satisfies AgentTurnResponse;

const executionResponse = {
  conversationId: "conversation_e2e",
  kind: "execution_result",
  plan: {
    ...confirmationResponse.plan,
    actions: [
      {
        ...confirmationResponse.plan.actions[0],
        result: {
          calendarEvent: {
            id: "calendar_event_create",
            sourceActionId: "action_create",
            status: "scheduled",
            timezone: "Asia/Shanghai",
            title: "开会",
          },
        },
        status: "succeeded",
      },
    ],
    status: "succeeded",
  },
} satisfies AgentTurnResponse;

const assistantQueryResponse = {
  conversationId: "conversation_e2e",
  kind: "assistant_message",
  message: "明天的安排：\n- 提醒：带电脑（09:00）\n- 日程：开会（15:00-16:00）",
  structuredElements: [
    {
      id: "query-schedule",
      items: [
        {
          id: "query-reminder",
          label: "带电脑",
          meta: "提醒｜09:00",
          tone: "info",
        },
        {
          id: "query-calendar",
          label: "开会",
          meta: "日程｜15:00-16:00",
          tone: "success",
        },
      ],
      kind: "summary-list",
      title: "明天的安排",
    },
  ],
} satisfies AgentTurnResponse;

const managementExecutionResponse = {
  conversationId: "conversation_e2e",
  kind: "execution_result",
  plan: {
    actions: [
      {
        actionType: "calendar.update_event",
        domain: "calendar",
        id: "action_update_calendar",
        payload: {
          expected_status: "scheduled",
          patch: {
            endAt: "2026-05-24T11:00:00+08:00",
            startAt: "2026-05-24T10:00:00+08:00",
          },
          target_id: "calendar_event_create",
          target_kind: "calendar_event",
        },
        planId: "plan_update_calendar",
        result: {
          calendarEvent: {
            endAt: "2026-05-24T11:00:00+08:00",
            id: "calendar_event_create",
            sourceActionId: "action_create",
            startAt: "2026-05-24T10:00:00+08:00",
            status: "scheduled",
            timezone: "Asia/Shanghai",
            title: "开会",
          },
        },
        riskLevel: "medium",
        status: "succeeded",
        summary: "更新日程：开会",
      },
      {
        actionType: "expense.submit_reimbursement",
        domain: "expense",
        id: "action_submit_expense",
        payload: {
          expected_status: "draft",
          target_id: "expense_record_create",
          target_kind: "expense",
        },
        planId: "plan_submit_expense",
        result: {
          expenseRecord: {
            amount: 58,
            currency: "CNY",
            id: "expense_record_create",
            occurredOn: "2026-05-22",
            sourceActionId: "action_expense",
            status: "submitted",
            title: "打车票报销",
          },
        },
        riskLevel: "medium",
        status: "succeeded",
        summary: "提交费用：打车票报销",
      },
      {
        actionType: "reminder.cancel_reminder",
        domain: "reminder",
        id: "action_cancel_reminder",
        payload: {
          expected_status: "scheduled",
          target_id: "reminder_create",
          target_kind: "reminder",
        },
        planId: "plan_cancel_reminder",
        result: {
          reminder: {
            dueAt: "2026-05-24T09:00:00+08:00",
            id: "reminder_create",
            sourceActionId: "action_reminder",
            status: "canceled",
            title: "带电脑",
          },
        },
        riskLevel: "medium",
        status: "succeeded",
        summary: "取消提醒：带电脑",
      },
    ],
    conversationId: "conversation_e2e",
    decisionTraceId: "trace_manage",
    id: "plan_manage",
    riskLevel: "medium",
    status: "succeeded",
    summary: "管理已有事项",
  },
} satisfies AgentTurnResponse;

const managementConfirmationActions = [
  {
    actionType: "calendar.cancel_event",
    domain: "calendar",
    id: "action_manage_0",
    payload: {
      expected_status: "scheduled",
      target_id: "target_0",
      target_kind: "calendar_event",
    },
    planId: "plan_manage_confirmation",
    riskLevel: "medium",
    status: "awaiting_confirmation",
    summary: "取消日程",
  },
  {
    actionType: "calendar.update_event",
    domain: "calendar",
    id: "action_manage_1",
    payload: {
      expected_status: "scheduled",
      patch: {
        endAt: "2026-05-24T11:00:00+08:00",
        startAt: "2026-05-24T10:00:00+08:00",
      },
      target_id: "target_1",
      target_kind: "calendar_event",
    },
    planId: "plan_manage_confirmation",
    riskLevel: "medium",
    status: "awaiting_confirmation",
    summary: "更新日程",
  },
  {
    actionType: "expense.cancel_reimbursement",
    domain: "expense",
    id: "action_manage_2",
    payload: {
      expected_status: "draft",
      target_id: "target_2",
      target_kind: "expense",
    },
    planId: "plan_manage_confirmation",
    riskLevel: "medium",
    status: "awaiting_confirmation",
    summary: "取消费用",
  },
  {
    actionType: "expense.submit_reimbursement",
    domain: "expense",
    id: "action_manage_3",
    payload: {
      expected_status: "draft",
      target_id: "target_3",
      target_kind: "expense",
    },
    planId: "plan_manage_confirmation",
    riskLevel: "medium",
    status: "awaiting_confirmation",
    summary: "提交费用",
  },
  {
    actionType: "expense.update_reimbursement",
    domain: "expense",
    id: "action_manage_4",
    payload: {
      expected_status: "draft",
      patch: { amount: 88 },
      target_id: "target_4",
      target_kind: "expense",
    },
    planId: "plan_manage_confirmation",
    riskLevel: "medium",
    status: "awaiting_confirmation",
    summary: "更新费用",
  },
  {
    actionType: "reminder.cancel_reminder",
    domain: "reminder",
    id: "action_manage_5",
    payload: {
      expected_status: "scheduled",
      target_id: "target_5",
      target_kind: "reminder",
    },
    planId: "plan_manage_confirmation",
    riskLevel: "medium",
    status: "awaiting_confirmation",
    summary: "取消提醒",
  },
  {
    actionType: "reminder.complete_reminder",
    domain: "reminder",
    id: "action_manage_6",
    payload: {
      expected_status: "scheduled",
      target_id: "target_6",
      target_kind: "reminder",
    },
    planId: "plan_manage_confirmation",
    riskLevel: "medium",
    status: "awaiting_confirmation",
    summary: "完成提醒",
  },
  {
    actionType: "reminder.update_reminder",
    domain: "reminder",
    id: "action_manage_7",
    payload: {
      expected_status: "scheduled",
      patch: { dueAt: "2026-05-24T10:00:00+08:00" },
      target_id: "target_7",
      target_kind: "reminder",
    },
    planId: "plan_manage_confirmation",
    riskLevel: "medium",
    status: "awaiting_confirmation",
    summary: "更新提醒",
  },
] satisfies DomainAction[];

const managementConfirmationResponse = {
  conversationId: "conversation_e2e",
  kind: "confirmation_required",
  plan: {
    actions: managementConfirmationActions,
    confirmation: {
      confirmToken: "confirm_manage",
      description: "确认后将管理已有事项。",
      id: "confirmation_manage",
      planId: "plan_manage_confirmation",
      requiredActionIds: [
        "action_manage_0",
        "action_manage_1",
        "action_manage_2",
        "action_manage_3",
        "action_manage_4",
        "action_manage_5",
        "action_manage_6",
        "action_manage_7",
      ],
      status: "pending",
      title: "确认管理已有事项",
    },
    conversationId: "conversation_e2e",
    decisionTraceId: "trace_manage_confirmation",
    id: "plan_manage_confirmation",
    riskLevel: "medium",
    status: "awaiting_confirmation",
    summary: "管理已有事项",
  },
} satisfies AgentTurnResponse;

const clarificationResponse = {
  clarificationId: "pending_001",
  conversationId: "conversation_001",
  kind: "clarification_request",
  missingFields: ["start_at"],
  question: "明天上午几点开始开会？",
  quickReplyOptions: [
    { label: "明天上午9点", value: "target_reminder_1" },
    { label: "明天上午9点", value: "target_reminder_2" },
  ],
  quickReplies: ["明天上午9点", "明天上午9点"],
} satisfies AgentTurnResponse;

const structuredQuickReplyRequest = {
  clientContext: {
    locale: "zh-CN",
    now: "2026-05-21T09:06:00+08:00",
    timezone: "Asia/Shanghai",
  },
  conversationId: "conversation_001",
  displayInput: "带电脑（09:00）",
  input: "target_reminder_2",
} satisfies AgentTurnRequest;

const mixedConfirmationResponse = {
  ...confirmationResponse,
  message: "当然可以，我先把明天下午三点的会议列出来，确认后写入日程。",
} satisfies AgentTurnResponse;

const calendarEvents = [
  {
    endAt: "2026-05-24T16:00:00+08:00",
    id: "calendar_event_create",
    sourceActionId: "action_create",
    startAt: "2026-05-24T15:00:00+08:00",
    status: "scheduled",
    timezone: "Asia/Shanghai",
    title: "开会",
  },
] satisfies CalendarEvent[];

const ledger = [
  {
    createdAt: "2026-05-23T09:01:00+08:00",
    eventType: "action_executed",
    id: "ledger_create",
    planId: "plan_create",
    status: "succeeded",
    message: "Action executed.",
  },
  {
    actionId: "direct_action_complete",
    createdAt: "2026-05-23T09:05:00+08:00",
    eventType: "direct_action_executed",
    id: "ledger_direct_complete",
    planId: "direct_plan_complete",
    status: "succeeded",
    message: "Direct UI action executed.",
  },
] satisfies ExecutionLedgerItem[];

const expenses = [
  {
    amount: 58,
    currency: "CNY",
    id: "expense_record_create",
    occurredOn: "2026-05-22",
    sourceActionId: "action_expense",
    status: "draft",
    title: "打车票报销",
  },
] satisfies ExpenseRecord[];

const reminders = [
  {
    dueAt: "2026-05-24T09:00:00+08:00",
    id: "reminder_create",
    sourceActionId: "action_reminder",
    status: "scheduled",
    title: "带电脑",
  },
] satisfies Reminder[];

const allSurfaces = [
  "conversation",
  "timeline",
  "calendar",
  "expenses",
  "reminders",
  "ledger",
  "settings",
] satisfies AgentSurface[];

const confirmationElements =
  agentResponseToConversationElements(confirmationResponse);
const mixedConfirmationElements =
  agentResponseToConversationElements(mixedConfirmationResponse);
const confirmationCard = confirmationElements.find(
  (element) => element.kind === "confirmation",
);
const mixedConfirmationMessage = mixedConfirmationElements.find(
  (element) => element.kind === "message",
);
const mixedConfirmationCard = mixedConfirmationElements.find(
  (element) => element.kind === "confirmation",
);

confirmationElements satisfies BackendRenderedElement[];
mixedConfirmationMessage?.kind satisfies "message" | undefined;
mixedConfirmationMessage?.content satisfies string | undefined;
mixedConfirmationCard?.kind satisfies "confirmation" | undefined;
confirmationCard?.kind satisfies "confirmation" | undefined;
confirmationCard?.planId satisfies string | undefined;
confirmationCard?.confirmToken satisfies string | undefined;

agentResponseToConversationElements(executionResponse) satisfies BackendRenderedElement[];
const assistantQueryElements =
  agentResponseToConversationElements(assistantQueryResponse);
const assistantQueryList = assistantQueryElements.find(
  (element) => element.kind === "summary-list",
);
assistantQueryList?.kind satisfies "summary-list" | undefined;
assistantQueryList?.title satisfies string | undefined;
assistantQueryList?.items[0]?.label satisfies string | undefined;
agentResponseToConversationElements(managementExecutionResponse) satisfies BackendRenderedElement[];
agentResponseToConversationElements(managementConfirmationResponse) satisfies BackendRenderedElement[];
agentResponseToConversationElements(clarificationResponse) satisfies BackendRenderedElement[];
calendarEventsToBackendElements(calendarEvents) satisfies BackendRenderedElement[];
const calendarList = calendarEventsToBackendElements(calendarEvents).find(
  (element) => element.kind === "summary-list",
);
const calendarActions =
  calendarList?.kind === "summary-list"
    ? (calendarList.items.find((item) => item.id === "calendar_event_create")
        ?.actions ?? [])
    : [];
calendarActions.some((action) => action.type === "calendar.cancel") satisfies boolean;
calendarActions.some(
  (action) =>
    action.type === "calendar.edit" &&
    action.editValues?.title === "开会",
) satisfies boolean;
expensesToBackendElements(expenses) satisfies BackendRenderedElement[];
const expenseList = expensesToBackendElements(expenses).find(
  (element) => element.kind === "summary-list",
);
const expenseActions =
  expenseList?.kind === "summary-list"
    ? (expenseList.items.find((item) => item.id === "expense_record_create")
        ?.actions ?? [])
    : [];
expenseActions.some((action) => action.type === "expense.submit") satisfies boolean;
expenseActions.some((action) => action.type === "expense.cancel") satisfies boolean;
expenseActions.some(
  (action) =>
    action.type === "expense.edit" &&
    action.editValues?.amount === 58,
) satisfies boolean;
remindersToBackendElements(reminders) satisfies BackendRenderedElement[];
const focusedReminderElements = remindersToBackendElements(reminders, {
  focusedReminderId: "reminder_create",
});
focusedReminderElements satisfies BackendRenderedElement[];
const focusedReminderList = focusedReminderElements.find(
  (element) => element.kind === "summary-list",
);
const focusedReminderItem = focusedReminderList?.items.find(
  (item) => item.id === "reminder_create",
);
focusedReminderItem?.highlighted satisfies true | undefined;
const reminderActions = focusedReminderItem?.actions ?? [];
reminderActions.some((action) => action.type === "reminder.complete") satisfies boolean;
reminderActions.some((action) => action.type === "reminder.cancel") satisfies boolean;
reminderActions.some(
  (action) =>
    action.type === "reminder.edit" &&
    action.editValues?.dueAt === "2026-05-24T09:00:00+08:00",
) satisfies boolean;
timelineToBackendElements(calendarEvents, reminders, expenses) satisfies BackendRenderedElement[];
const timelineList = timelineToBackendElements(
  calendarEvents,
  reminders,
  expenses,
).find((element) => element.kind === "summary-list");
const timelineCalendarActions =
  timelineList?.kind === "summary-list"
    ? (timelineList.items.find(
        (item) => item.id === "timeline-event-calendar_event_create",
      )?.actions ?? [])
    : [];
timelineCalendarActions.some(
  (action) =>
    action.type === "calendar.cancel" &&
    action.targetId === "calendar_event_create",
) satisfies boolean;
timelineCalendarActions.some(
  (action) =>
    action.type === "calendar.edit" &&
    action.targetId === "calendar_event_create",
) satisfies boolean;
const timelineExpenseActions =
  timelineList?.kind === "summary-list"
    ? (timelineList.items.find(
        (item) => item.id === "timeline-expense-expense_record_create",
      )?.actions ?? [])
    : [];
timelineExpenseActions.some(
  (action) =>
    action.type === "expense.submit" &&
    action.targetId === "expense_record_create",
) satisfies boolean;
timelineExpenseActions.some(
  (action) =>
    action.type === "expense.edit" &&
    action.targetId === "expense_record_create",
) satisfies boolean;
const timelineReminderActions =
  timelineList?.kind === "summary-list"
    ? (timelineList.items.find(
        (item) => item.id === "timeline-reminder-reminder_create",
      )?.actions ?? [])
    : [];
timelineReminderActions.some(
  (action) =>
    action.type === "reminder.complete" && action.targetId === "reminder_create",
) satisfies boolean;
timelineReminderActions.some(
  (action) =>
    action.type === "reminder.edit" && action.targetId === "reminder_create",
) satisfies boolean;
executionLedgerToBackendElements(ledger) satisfies BackendRenderedElement[];
allSurfaces satisfies AgentSurface[];

const apiClient = new ApiClient({ baseUrl: "http://127.0.0.1:8000" });
apiClient.updateCalendarEvent(
  "calendar_event_create",
  {
    title: "业务规划会",
  },
  "conversation_e2e",
) satisfies Promise<CalendarEvent>;
apiClient.getCalendarEvents("conversation_e2e") satisfies Promise<CalendarEvent[]>;
apiClient.cancelCalendarEvent(
  "calendar_event_create",
  "conversation_e2e",
) satisfies Promise<CalendarEvent>;
apiClient.updateExpense(
  "expense_record_create",
  {
    amount: 88.5,
  },
  "conversation_e2e",
) satisfies Promise<ExpenseRecord>;
apiClient.getExpenses("conversation_e2e") satisfies Promise<ExpenseRecord[]>;
apiClient.completeReminder(
  "reminder_create",
  "conversation_e2e",
) satisfies Promise<Reminder>;
apiClient.cancelReminder(
  "reminder_create",
  "conversation_e2e",
) satisfies Promise<Reminder>;
apiClient.updateReminder(
  "reminder_create",
  {
    dueAt: "2026-05-24T10:00:00+08:00",
  },
  "conversation_e2e",
) satisfies Promise<Reminder>;
apiClient.getReminders("conversation_e2e") satisfies Promise<Reminder[]>;
apiClient.getExecutionLedger("conversation_e2e") satisfies Promise<
  ExecutionLedgerItem[]
>;
apiClient.submitExpense(
  "expense_record_create",
  "conversation_e2e",
) satisfies Promise<ExpenseRecord>;
apiClient.cancelExpense(
  "expense_record_create",
  "conversation_e2e",
) satisfies Promise<ExpenseRecord>;
const attachmentRequest = {
  attachmentId: "native_attachment_001",
  attachmentKind: "image",
  attachmentName: "receipt.jpg",
  attachmentSizeBytes: 245678,
  attachmentType: "public.jpeg",
  conversationId: "conversation_attachment_001",
  source: "native.composer.attachment.photo",
  text: "已选择附件：receipt.jpg（image，245678 bytes）。",
} satisfies AttachmentIntakeRequest;
apiClient.intakeAttachment(attachmentRequest) satisfies Promise<AttachmentIntake>;
const attachmentUploadRequest = {
  attachmentId: "native_attachment_upload_001",
  attachmentKind: "file",
  attachmentName: "receipt.txt",
  attachmentType: "text/plain",
  base64Content: "5Ye656ef6YeR6aKdIDg4LjUg5YWD",
  conversationId: "conversation_attachment_001",
  source: "h5.composer.attachment.upload",
} satisfies AttachmentUploadRequest;
apiClient.uploadAttachment(attachmentUploadRequest) satisfies Promise<AttachmentIntake>;
apiClient.getAttachments("conversation_attachment_001") satisfies Promise<
  AttachmentIntake[]
>;
apiClient.getAgentConversationDebug("conversation_debug_001") satisfies Promise<
  AgentConversationDebug
>;
apiClient.getAgentConversationTurns("conversation_debug_001") satisfies Promise<
  AgentConversationTurns
>;
const attachmentElements = attachmentIntakesToBackendElements([
  {
    attachmentId: "native_attachment_001",
    conversationId: "conversation_attachment_001",
    createdAt: "2026-05-28T10:00:00+08:00",
    id: "attachment_intake_001",
    kind: "image",
    name: "receipt.jpg",
    sizeBytes: 245678,
    source: "native.composer.attachment.photo",
    status: "received",
    type: "public.jpeg",
  },
]);
attachmentElements satisfies BackendRenderedElement[];
attachmentElements.some(
  (element) => element.kind === "summary-list",
) satisfies boolean;
const debugElements = agentDebugToBackendElements({
  conversationId: "conversation_debug_001",
  decisionTraces: [
    {
      contextSectionsUsed: ["current_turn", "pending_clarifications"],
      fallbackReason: "llm_error: RuntimeError",
      id: "trace_debug_001",
      llmCall: {
        durationMs: 321,
        mode: "llm",
        model: "deepseek-v4-flash",
        promptChars: 1000,
        promptSha256: "abc123def456",
        provider: "DeepSeekLlmProvider",
        responseChars: 120,
        status: "completed",
      },
      missingInformation: ["start_at"],
      plannerMode: "llm_first",
      policyDecisions: ["confirmation_required"],
      reasoningSummary: ["用户给出了日程意图，但缺少具体时间。"],
      toolsConsidered: ["calendar.create_event"],
      toolsSelected: [],
    },
  ],
  events: [
    {
      eventType: "planning_started",
      id: "event_debug_001",
      payload: { traceId: "trace_debug_001" },
      traceId: "trace_debug_001",
    },
  ],
  pendingClarifications: [
    {
      actionType: "calendar.create_event",
      createdAt: "2026-05-28T10:00:00+08:00",
      domain: "calendar",
      expiresAt: "2026-05-28T10:10:00+08:00",
      id: "clarification_debug_001",
      missingFields: ["start_at"],
      partialPayload: { title: "开会" },
      question: "明天上午几点开会？",
      quickReplies: ["09:00", "10:00"],
      status: "open",
    },
  ],
});
debugElements satisfies BackendRenderedElement[];
debugElements.some((element) => element.kind === "summary-list") satisfies boolean;

const conversationHistoryElements = conversationTurnsToConversationElements([
  {
    createdAt: "2026-05-28T10:00:00+08:00",
    id: "turn_user_001",
    inputText: "明天上午我要去开会",
    role: "user",
    summary: "明天上午我要去开会",
  },
  {
    createdAt: "2026-05-28T10:00:01+08:00",
    id: "turn_assistant_001",
    role: "assistant",
    structuredResponse: clarificationResponse,
    summary: "明天上午几点开始开会？",
  },
]);
conversationHistoryElements satisfies BackendRenderedElement[];
conversationHistoryElements.some(
  (element) => element.kind === "quick-replies",
) satisfies boolean;

const redactedConfirmationHistory = {
  ...confirmationResponse,
  plan: {
    ...confirmationResponse.plan,
    confirmation: {
      ...confirmationResponse.plan.confirmation,
      confirmToken: "redacted",
    },
  },
} satisfies AgentTurnResponse;

const restoredPendingConfirmationHistory = conversationTurnsToConversationElements(
  [
    {
      createdAt: "2026-05-28T10:00:02+08:00",
      id: "turn_assistant_confirmation_001",
      role: "assistant",
      structuredResponse: redactedConfirmationHistory,
      summary: "创建日程：开会",
    },
  ],
  {
    confirmationTokensByPlanId: {
      plan_create: "confirm_token",
    },
  },
);
const restoredPendingConfirmation = restoredPendingConfirmationHistory.find(
  (element) => element.kind === "confirmation",
);
restoredPendingConfirmationHistory satisfies BackendRenderedElement[];
restoredPendingConfirmation?.kind satisfies "confirmation" | undefined;
restoredPendingConfirmation?.confirmToken satisfies string | undefined;

const serverPendingConfirmationElements = pendingConfirmationPlansToBackendElements([
  confirmationResponse.plan,
]);
const serverPendingConfirmation = serverPendingConfirmationElements.find(
  (element) => element.kind === "confirmation",
);
serverPendingConfirmationElements satisfies BackendRenderedElement[];
serverPendingConfirmation?.kind satisfies "confirmation" | undefined;
serverPendingConfirmation?.confirmToken satisfies string | undefined;

const nextElements = removeConfirmationElement(confirmationElements, "plan_create");
nextElements satisfies BackendRenderedElement[];
nextElements.some((element) => element.kind === "confirmation") satisfies boolean;

getDefaultApiBaseUrl("http://192.168.1.238:3000/?native=ios") satisfies
  | "http://192.168.1.238:8000"
  | string;

const clarificationElements =
  agentResponseToConversationElements(clarificationResponse);
const clarificationQuickReplies = clarificationElements.find(
  (element) => element.kind === "quick-replies",
);

clarificationElements[0] satisfies BackendRenderedElement;
clarificationQuickReplies?.kind satisfies "quick-replies" | undefined;
if (clarificationQuickReplies?.kind === "quick-replies") {
  clarificationQuickReplies.replies[0] satisfies "明天上午9点" | string;
  const replyValues = clarificationQuickReplies.replyValues ?? [];
  replyValues[0] satisfies "target_reminder_1" | string | undefined;
  replyValues[1] satisfies "target_reminder_2" | string | undefined;
}
structuredQuickReplyRequest.displayInput satisfies "带电脑（09:00）" | string;
structuredQuickReplyRequest.input satisfies "target_reminder_2" | string;
