import type { ConfirmationAction, TimelineDay } from "@ai-code/shared-ui";

import type {
  AgentSurface,
  BackendRenderedElement,
  ConversationMessage,
  DemoExecutionStatus,
  ExecutionLedgerItem,
  QuickStat,
} from "./types";

function toBackendElementTone(tone: TimelineDay["events"][number]["tone"]) {
  return tone === "primary" ||
    tone === "success" ||
    tone === "warning" ||
    tone === "info"
    ? tone
    : "info";
}

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

export const demoBackendElementsBySurface: Record<
  AgentSurface,
  BackendRenderedElement[]
> = {
  calendar: [
    {
      id: "calendar-summary",
      items: [
        {
          id: "today-standup",
          label: "团队站会",
          meta: "今天 09:30 -> 10:00",
          tone: "info",
        },
        {
          id: "tomorrow-planning",
          label: "新年业务规划会",
          meta: "明天 15:00 -> 16:30，待确认",
          tone: "warning",
        },
        {
          id: "friday-focus",
          label: "复盘整理",
          meta: "周五 19:30 -> 20:30",
          tone: "success",
        },
      ],
      kind: "summary-list",
      title: "后端返回：日程列表元素",
    },
  ],
  conversation: [
    ...demoConversation.map((message) => ({
      content: message.content,
      id: message.id,
      kind: "message" as const,
      role: message.role,
    })),
    {
      actions: demoConfirmationActions,
      description: "执行前由你确认。真实写入会在后端日程领域完成。",
      id: "confirm-create-meeting",
      kind: "confirmation",
      title: "后端返回：确认 1 项操作",
    },
  ],
  ledger: [
    {
      id: "ledger-summary",
      items: demoLedgerItems,
      kind: "ledger",
      title: "后端返回：执行记录元素",
    },
  ],
  timeline: [
    {
      id: "timeline-summary",
      items: demoTimelineDays.flatMap((day) =>
        day.events.map((event) => ({
          id: `${day.id}-${event.id}`,
          label: event.title,
          meta: `${day.weekday} ${day.date}｜${event.time}`,
          tone: toBackendElementTone(event.tone),
        })),
      ),
      kind: "summary-list",
      title: "后端返回：Timeline 摘要元素",
    },
  ],
};
