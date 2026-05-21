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
  | "calendar.create_event"
  | "calendar.query_events"
  | "expense.create_reimbursement_draft"
  | "reminder.create_reminder";

export type AgentTurnRequest = {
  conversationId?: string;
  input: string;
  clientContext?: {
    locale?: string;
    timezone?: string;
    now?: string;
  };
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
  question: string;
  missingFields: string[];
};

export type ConfirmationRequiredResponse = {
  kind: "confirmation_required";
  conversationId: string;
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
    | "plan_rejected";
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

export type ExpenseRecord = {
  id: string;
  title: string;
  amount?: number;
  currency: string;
  occurredOn?: string;
  status: "draft" | "submitted" | "canceled";
  sourceActionId: string;
};

export type Reminder = {
  id: string;
  title: string;
  dueAt: string;
  status: "scheduled" | "done" | "canceled";
  sourceActionId: string;
};
