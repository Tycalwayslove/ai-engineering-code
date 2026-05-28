export type HealthStatus = {
  status: "ok";
};

export type VersionInfo = {
  name: string;
  version: string;
};

export type FactoryCapabilityStatus = "ready" | "planned";

export type FactoryCapability = {
  id: string;
  label: string;
  source: string;
  status: FactoryCapabilityStatus;
  summary: string;
};

export type FactoryStatus = {
  name: string;
  status: "ready" | "degraded";
  version: string;
  capabilities: FactoryCapability[];
  nextActions: string[];
};

export type RiskLevel = "low" | "medium" | "high";

export type ExecutionPlanStatus =
  | "input_received"
  | "planning"
  | "needs_clarification"
  | "awaiting_confirmation"
  | "executing"
  | "succeeded"
  | "failed"
  | "rejected";

export type DomainActionStatus =
  | "planned"
  | "awaiting_confirmation"
  | "executing"
  | "succeeded"
  | "failed"
  | "rejected";

export type DomainName = "calendar" | "expense" | "reminder";

export type DomainActionType =
  | "calendar.cancel_event"
  | "calendar.create_event"
  | "calendar.query_events"
  | "calendar.update_event"
  | "expense.cancel_reimbursement"
  | "expense.create_reimbursement_draft"
  | "expense.submit_reimbursement"
  | "expense.update_reimbursement"
  | "reminder.cancel_reminder"
  | "reminder.complete_reminder"
  | "reminder.create_reminder"
  | "reminder.update_reminder";

export type AgentTurnRequest = {
  conversationId?: string;
  displayInput?: string;
  input: string;
  clientContext?: {
    locale?: string;
    timezone?: string;
    now?: string;
  };
};

export type AttachmentIntakeRequest = {
  attachmentId: string;
  attachmentKind: string;
  attachmentName: string;
  attachmentSizeBytes?: number;
  attachmentType?: string;
  conversationId?: string;
  source?: string;
  text?: string;
};

export type AttachmentUploadRequest = {
  attachmentId: string;
  attachmentKind: string;
  attachmentName: string;
  attachmentType?: string;
  base64Content: string;
  conversationId?: string;
  source?: string;
  text?: string;
};

export type AttachmentIntake = {
  id: string;
  attachmentId: string;
  conversationId?: string;
  kind: string;
  name: string;
  sizeBytes?: number;
  source?: string;
  status: "received";
  contentSha256?: string;
  contentStatus?: "content_received";
  text?: string;
  type?: string;
  createdAt: string;
};

export type DomainAction = {
  id: string;
  planId: string;
  domain: DomainName;
  actionType: DomainActionType;
  status: DomainActionStatus;
  riskLevel: RiskLevel;
  summary: string;
  payload: Record<string, unknown>;
  result?: Record<string, unknown>;
};

export type ConfirmationCard = {
  id: string;
  planId: string;
  status: "pending" | "confirmed" | "rejected" | "expired";
  requiredActionIds: string[];
  title: string;
  description: string;
  confirmToken: string;
};

export type ExecutionPlan = {
  id: string;
  conversationId: string;
  status: ExecutionPlanStatus;
  riskLevel: RiskLevel;
  summary: string;
  decisionTraceId: string;
  actions: DomainAction[];
  confirmation?: ConfirmationCard;
};

export type ClarificationRequest = {
  kind: "clarification_request";
  conversationId: string;
  clarificationId: string;
  question: string;
  missingFields: string[];
  quickReplies: string[];
  quickReplyOptions?: QuickReplyOption[];
};

export type QuickReplyOption = {
  label: string;
  value: string;
};

export type ConfirmationRequiredResponse = {
  kind: "confirmation_required";
  conversationId: string;
  message?: string;
  plan: ExecutionPlan;
};

export type AssistantMessageResponse = {
  kind: "assistant_message";
  conversationId: string;
  message: string;
  structuredElements: Record<string, unknown>[];
};

export type ExecutionResultResponse = {
  kind: "execution_result";
  conversationId: string;
  plan: ExecutionPlan;
};

export type AgentTurnResponse =
  | AssistantMessageResponse
  | ClarificationRequest
  | ConfirmationRequiredResponse
  | ExecutionResultResponse;

export type AgentDebugEvent = {
  id: string;
  eventType: string;
  turnId?: string | null;
  planId?: string | null;
  traceId?: string | null;
  payload: Record<string, unknown>;
};

export type AgentDebugDecisionTrace = {
  id: string;
  plannerMode: string;
  contextSectionsUsed: string[];
  toolsConsidered: string[];
  toolsSelected: string[];
  missingInformation: string[];
  policyDecisions: string[];
  confirmationReason?: string | null;
  fallbackReason?: string | null;
  reasoningSummary: string[];
  llmCall?: {
    provider: string;
    model: string;
    mode: string;
    status: string;
    durationMs: number;
    promptChars: number;
    responseChars: number;
    promptSha256: string;
    errorType?: string;
    promptPreview?: string;
    responsePreview?: string;
  } | null;
};

export type AgentDebugPendingClarification = {
  id: string;
  domain: string;
  actionType: DomainActionType;
  question: string;
  missingFields: string[];
  partialPayload: Record<string, unknown>;
  quickReplies: string[];
  quickReplyOptions?: QuickReplyOption[];
  status: string;
  createdAt: string;
  expiresAt: string;
  resolvedAt?: string | null;
};

export type AgentConversationDebug = {
  conversationId: string;
  events: AgentDebugEvent[];
  decisionTraces: AgentDebugDecisionTrace[];
  pendingClarifications: AgentDebugPendingClarification[];
};

export type AgentConversationTurn = {
  id: string;
  role: "assistant" | "system" | "user";
  summary: string;
  inputText?: string | null;
  rawContent?: Record<string, unknown> | null;
  structuredResponse?: AgentTurnResponse | null;
  createdAt: string;
};

export type AgentConversationTurns = {
  conversationId: string;
  turns: AgentConversationTurn[];
};

export type AgentPendingConfirmations = {
  conversationId: string;
  plans: ExecutionPlan[];
};

export type ConfirmExecutionPlanRequest = {
  confirmToken: string;
  actionIds?: string[];
};

export type ExecutionLedgerItem = {
  id: string;
  planId: string;
  actionId?: string;
  eventType:
    | "plan_created"
    | "confirmation_created"
    | "action_executed"
    | "action_failed"
    | "plan_rejected"
    | "direct_action_executed";
  status: "info" | "succeeded" | "failed";
  message: string;
  createdAt: string;
};

export type CalendarEvent = {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  timezone: string;
  status: "scheduled" | "canceled";
  sourceActionId: string;
};

export type CalendarEventUpdate = {
  title?: string;
  startAt?: string;
  endAt?: string;
  timezone?: string;
};

export type ExpenseRecord = {
  id: string;
  title: string;
  amount?: number;
  currency: string;
  occurredOn?: string;
  status: "draft" | "submitted" | "canceled";
  sourceActionId: string;
};

export type ExpenseRecordUpdate = {
  title?: string;
  amount?: number;
  currency?: string;
  occurredOn?: string;
};

export type Reminder = {
  id: string;
  title: string;
  dueAt: string;
  status: "scheduled" | "done" | "canceled";
  sourceActionId: string;
};

export type ReminderUpdate = {
  title?: string;
  dueAt?: string;
};
