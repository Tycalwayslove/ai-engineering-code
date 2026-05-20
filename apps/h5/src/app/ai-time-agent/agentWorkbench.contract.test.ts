import type { ConfirmationAction, TimelineDay } from "@ai-code/shared-ui";

import {
  demoConfirmationActions,
  demoConversation,
  demoExecutionStatus,
  demoLedgerItems,
  demoQuickStats,
  demoTimelineDays,
} from "./demoData";
import type {
  ConversationMessage,
  ExecutionLedgerItem,
  QuickStat,
} from "./types";

demoConversation satisfies ConversationMessage[];
demoTimelineDays satisfies TimelineDay[];
demoConfirmationActions satisfies ConfirmationAction[];
demoQuickStats satisfies QuickStat[];
demoLedgerItems satisfies ExecutionLedgerItem[];
demoExecutionStatus satisfies {
  status:
    | "idle"
    | "understanding"
    | "searching"
    | "planning"
    | "confirming"
    | "executing"
    | "completed"
    | "failed";
  description: string;
};
