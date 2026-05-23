import { ApiClient } from "@ai-code/sdk";
import type {
  AgentTurnResponse,
  CalendarEvent,
  DomainAction,
  ExecutionLedgerItem,
} from "@ai-code/sdk";

import type { BackendRenderedElement } from "./types";

const envApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

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
    return [
      {
        content: response.question,
        id: `assistant-${response.conversationId}-${Date.now()}`,
        kind: "message",
        role: "assistant",
      },
    ];
  }

  if (response.kind === "assistant_message") {
    return [
      {
        content: response.message,
        id: `assistant-${response.conversationId}-${Date.now()}`,
        kind: "message",
        role: "assistant",
      },
    ];
  }

  const plan = response.plan;
  const elements: BackendRenderedElement[] = [
    {
      content:
        response.kind === "execution_result"
          ? `已执行：${plan.summary}`
          : plan.summary,
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

  return elements;
}

export function calendarEventsToBackendElements(
  events: CalendarEvent[],
): BackendRenderedElement[] {
  return [
    {
      id: "calendar-events-from-api",
      items: events.slice(-6).map((event) => ({
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

function actionToConfirmationAction(action: DomainAction) {
  return {
    id: action.id,
    label: action.summary,
    meta: actionMeta(action),
  };
}

function actionMeta(action: DomainAction) {
  const title =
    typeof action.payload.title === "string" ? action.payload.title : action.actionType;
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
