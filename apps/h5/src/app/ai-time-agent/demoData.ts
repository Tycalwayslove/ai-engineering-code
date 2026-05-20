import type { ConfirmationAction, TimelineDay } from "@ai-code/shared-ui";

import type {
  ConversationMessage,
  DemoExecutionStatus,
  ExecutionLedgerItem,
  QuickStat,
} from "./types";

export const demoConversation: ConversationMessage[] = [
  {
    content:
      "你好，我是你的 AI 日程执行助手。你只要说清楚目标，我会先解析、补齐缺失信息，再让你确认是否写入日程。",
    id: "assistant-intro",
    role: "assistant",
  },
  {
    content: "明天下午三点安排一个新年业务规划会，时间一个半小时。",
    id: "user-create-meeting",
    role: "user",
  },
  {
    content:
      "我理解为：明天 15:00 到 16:30 创建“新年业务规划会”，默认提前 30 分钟提醒。你可以直接点确认，也可以继续补充参会人或地点。",
    id: "assistant-confirm",
    role: "assistant",
  },
];

export const demoTimelineDays: TimelineDay[] = [
  {
    date: "20",
    events: [
      {
        id: "standup",
        time: "09:30 -> 10:00",
        title: "团队站会",
        tone: "info",
      },
      {
        id: "design-review",
        time: "16:00 -> 17:00",
        title: "设计 Review",
        tone: "primary",
      },
    ],
    id: "2026-05-20",
    selected: true,
    weekday: "周三",
    yearLabel: "2026 五月",
  },
  {
    date: "21",
    events: [
      {
        id: "planning-meeting",
        time: "15:00 -> 16:30",
        title: "新年业务规划会",
        tone: "warning",
      },
      {
        id: "focus-block",
        time: "19:30 -> 20:30",
        title: "复盘整理",
        tone: "success",
      },
    ],
    id: "2026-05-21",
    weekday: "周四",
  },
  {
    date: "22",
    events: [
      {
        id: "one-on-one",
        time: "14:00 -> 14:30",
        title: "1:1 沟通",
        tone: "info",
      },
    ],
    id: "2026-05-22",
    weekday: "周五",
  },
  {
    date: "23",
    events: [
      {
        id: "free-arrange",
        time: "全天",
        title: "自由安排",
        tone: "success",
      },
    ],
    id: "2026-05-23",
    weekday: "周六",
  },
];

export const demoConfirmationActions: ConfirmationAction[] = [
  {
    id: "create-planning-meeting",
    label: "新年业务规划会",
    meta: "明天 15:00 -> 16:30，提前 30 分钟提醒",
  },
];

export const demoExecutionStatus: DemoExecutionStatus = {
  description: "已解析 1 项创建操作，等待确认",
  status: "confirming",
};

export const demoQuickStats: QuickStat[] = [
  {
    id: "today",
    label: "今天事项",
    tone: "info",
    value: "4",
  },
  {
    id: "created",
    label: "待确认",
    tone: "warning",
    value: "1",
  },
  {
    id: "free",
    label: "可用时间",
    tone: "success",
    value: "3.5h",
  },
];

export const demoLedgerItems: ExecutionLedgerItem[] = [
  {
    action: "query",
    completed: true,
    id: "understand-time",
    label: "解析时间表达",
    meta: "明天下午三点 -> 周四 15:00",
  },
  {
    action: "create",
    completed: false,
    id: "create-calendar-event",
    label: "等待创建日程",
    meta: "确认后写入内部日历",
  },
];
