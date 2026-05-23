import type {
  AgentTurnResponse,
  CalendarEvent,
  ExecutionLedgerItem,
} from "@ai-code/sdk";

import {
  agentResponseToConversationElements,
  calendarEventsToBackendElements,
  executionLedgerToBackendElements,
  getDefaultApiBaseUrl,
  removeConfirmationElement,
} from "./backendApi";
import type { BackendRenderedElement } from "./types";

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
] satisfies ExecutionLedgerItem[];

const confirmationElements =
  agentResponseToConversationElements(confirmationResponse);
const confirmationCard = confirmationElements.find(
  (element) => element.kind === "confirmation",
);

confirmationElements satisfies BackendRenderedElement[];
confirmationCard?.kind satisfies "confirmation" | undefined;
confirmationCard?.planId satisfies string | undefined;
confirmationCard?.confirmToken satisfies string | undefined;

agentResponseToConversationElements(executionResponse) satisfies BackendRenderedElement[];
calendarEventsToBackendElements(calendarEvents) satisfies BackendRenderedElement[];
executionLedgerToBackendElements(ledger) satisfies BackendRenderedElement[];

const nextElements = removeConfirmationElement(confirmationElements, "plan_create");
nextElements satisfies BackendRenderedElement[];
nextElements.some((element) => element.kind === "confirmation") satisfies boolean;

getDefaultApiBaseUrl("http://192.168.1.238:3000/?native=ios") satisfies
  | "http://192.168.1.238:8000"
  | string;
