import type { ExecutionStatus } from "@ai-code/shared-ui";

export type AgentTheme = "dark" | "light";
export type AgentSurface = "conversation" | "timeline" | "calendar" | "ledger";

export type ConversationMessage = {
  id: string;
  role: "assistant" | "user" | "system";
  content: string;
};

export type QuickStat = {
  id: string;
  label: string;
  value: string;
  tone: "primary" | "success" | "warning" | "info";
};

export type ExecutionLedgerItem = {
  id: string;
  label: string;
  meta: string;
  action: "create" | "update" | "delete" | "query";
  completed: boolean;
};

export type DemoExecutionStatus = {
  status: ExecutionStatus;
  description: string;
};

export type BackendRenderedElement =
  | {
      id: string;
      kind: "message";
      role: ConversationMessage["role"];
      content: string;
    }
  | {
      actions: {
        id: string;
        label: string;
        meta: string;
      }[];
      confirmToken?: string;
      description: string;
      id: string;
      kind: "confirmation";
      planId?: string;
      title: string;
    }
  | {
      id: string;
      items: {
        id: string;
        label: string;
        meta: string;
        tone: "primary" | "success" | "warning" | "info";
      }[];
      kind: "summary-list";
      title: string;
    }
  | {
      id: string;
      items: {
        completed: boolean;
        id: string;
        label: string;
        meta: string;
      }[];
      kind: "ledger";
      title: string;
    };
