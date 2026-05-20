import type { ExecutionStatus } from "@ai-code/shared-ui";

export type AgentTheme = "dark" | "light";

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
