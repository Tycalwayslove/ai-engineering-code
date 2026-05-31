"use client";

import {
  ConfirmationCard,
  createAiTimeThemeCssVariables,
  MessageBubble,
  StatusBadge,
  type AiTimeThemeName,
  type ExecutionStatus,
} from "@ai-code/shared-ui";
import type {
  AttachmentIntake,
  AttachmentIntakeRequest,
  AttachmentUploadRequest,
  CalendarEvent,
  CalendarEventUpdate,
  ExpenseRecordUpdate,
  Reminder,
  ReminderUpdate,
} from "@ai-code/sdk";
import type { CSSProperties, FormEvent, RefObject } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  agentResponseToConversationElements,
  agentDebugToBackendElements,
  attachmentIntakesToBackendElements,
  calendarEventsToBackendElements,
  conversationTurnsToConversationElements,
  createAgentApiClient,
  executionLedgerToBackendElements,
  expensesToBackendElements,
  pendingConfirmationPlansToBackendElements,
  removeConfirmationElement,
  remindersToBackendElements,
  timelineToBackendElements,
} from "./backendApi";
import {
  getNativeHostContext,
  postNativeBridgeMessage,
  subscribeNativeBridge,
  type NativeBridgeEnvelope,
  type NativeHostContext,
} from "./bridge";
import {
  demoBackendElementsBySurface,
  nativeInitialBackendElementsBySurface,
} from "./demoData";
import {
  dateTimeIsoToLocalInputValue,
  dateTimeLocalValueToIso,
} from "./dateTimeInput";
import type { AgentSurface, AgentTheme, BackendRenderedElement } from "./types";

type BridgeActionType =
  | "input.keyboard.open"
  | "input.voice.start"
  | "input.voice.stop";

type SummaryItemAction = NonNullable<
  Extract<BackendRenderedElement, { kind: "summary-list" }>["items"][number]["actions"]
>[number];

type RuntimeExecutionStatus = {
  description: string;
  status: ExecutionStatus;
};

type NativeAttachmentSubmission = AttachmentIntakeRequest & {
  base64Content?: string;
  displayText: string;
};

type AttachmentPersistenceRequest =
  | {
      kind: "intake";
      request: AttachmentIntakeRequest;
    }
  | {
      kind: "upload";
      request: AttachmentUploadRequest;
    };

type SummaryEditDraft = {
  action: SummaryItemAction;
  itemId: string;
  targetItemId: string;
};

type SummaryEditPayload =
  | { type: "calendar.edit"; value: CalendarEventUpdate }
  | { type: "expense.edit"; value: ExpenseRecordUpdate }
  | { type: "reminder.edit"; value: ReminderUpdate };

const attachmentElementsId = "attachments-from-api";
const agentDebugElementsId = "agent-debug-from-api";
const pendingConfirmationTokensStoragePrefix =
  "ai-code.pendingConfirmationTokens.";

const surfaceLabels: Record<AgentSurface, string> = {
  calendar: "日程",
  conversation: "对话",
  expenses: "费用",
  ledger: "执行记录",
  reminders: "提醒",
  settings: "设置",
  timeline: "Timeline",
};

const surfaceDescriptions: Record<AgentSurface, string> = {
  calendar: "已确认写入数据库的日程",
  conversation: "自然语言输入、确认卡和执行结果",
  expenses: "由对话创建的费用草稿",
  ledger: "每次计划、确认和执行的审计记录",
  reminders: "由键盘或语音创建的提醒",
  settings: "当前 API、Bridge 和调试状态",
  timeline: "日程、提醒和费用合并后的时间线",
};

const allSurfaces: AgentSurface[] = [
  "conversation",
  "timeline",
  "calendar",
  "expenses",
  "reminders",
  "ledger",
  "settings",
];

const themeLabels: Record<AgentTheme, string> = {
  dark: "深色",
  light: "浅色",
};

const executionStatusLabels: Record<ExecutionStatus, string> = {
  completed: "已完成",
  confirming: "待确认",
  executing: "执行中",
  failed: "需处理",
  idle: "等待输入",
  planning: "规划中",
  searching: "查询中",
  understanding: "理解中",
};

const initialExecutionStatus: RuntimeExecutionStatus = {
  description: "等待你的下一条日程指令",
  status: "idle",
};

const bridgeDebugBuild = "bridge-debug-2026-05-20-01";

type BridgeDebugState = {
  bridgeAvailable: boolean;
  h5ReadyDelivered: boolean;
  lastInbound?: string;
  lastOutbound?: string;
  messageCount: number;
  mountedAt: string;
};

function themeVariables(theme: AiTimeThemeName): CSSProperties {
  return createAiTimeThemeCssVariables(theme) as CSSProperties;
}

function requiredFormString(formData: FormData, key: string, label: string) {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${label}不能为空`);
  }
  return value.trim();
}

function requiredFormNumber(formData: FormData, key: string, label: string) {
  const raw = requiredFormString(formData, key, label);
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label}必须是非负数字`);
  }
  return value;
}

function requiredFormZonedDateTime(
  formData: FormData,
  key: string,
  label: string,
  timeZone?: string,
  previousIsoValue?: string,
) {
  return dateTimeLocalValueToIso(
    requiredFormString(formData, key, label),
    timeZone,
    previousIsoValue,
  );
}

function buildSummaryEditPayload(
  draft: SummaryEditDraft,
  formData: FormData,
): SummaryEditPayload {
  const type = draft.action.type;

  if (type === "calendar.edit") {
    const timeZone = requiredFormString(formData, "timezone", "时区");
    return {
      type,
      value: {
        endAt: requiredFormZonedDateTime(
          formData,
          "endAt",
          "结束时间",
          timeZone,
          draft.action.editValues?.endAt,
        ),
        startAt: requiredFormZonedDateTime(
          formData,
          "startAt",
          "开始时间",
          timeZone,
          draft.action.editValues?.startAt,
        ),
        timezone: timeZone,
        title: requiredFormString(formData, "title", "日程标题"),
      },
    };
  }

  if (type === "expense.edit") {
    return {
      type,
      value: {
        amount: requiredFormNumber(formData, "amount", "金额"),
        currency: requiredFormString(formData, "currency", "币种"),
        occurredOn: requiredFormString(formData, "occurredOn", "发生日期"),
        title: requiredFormString(formData, "title", "费用标题"),
      },
    };
  }

  if (type === "reminder.edit") {
    return {
      type,
      value: {
        dueAt: requiredFormZonedDateTime(
          formData,
          "dueAt",
          "提醒时间",
          undefined,
          draft.action.editValues?.dueAt,
        ),
        title: requiredFormString(formData, "title", "提醒标题"),
      },
    };
  }

  throw new Error("不支持的编辑类型");
}

function getInitialConversationId() {
  if (typeof window === "undefined") {
    return `conversation_h5_${Date.now()}`;
  }

  const currentUrl = new URL(window.location.href);
  const fromUrl = currentUrl.searchParams.get("conversationId");
  if (fromUrl && fromUrl.trim().length > 0) {
    window.localStorage.setItem("ai-code.conversationId", fromUrl);
    return fromUrl;
  }

  const fromStorage = window.localStorage.getItem("ai-code.conversationId");
  if (fromStorage && fromStorage.trim().length > 0) {
    return fromStorage;
  }

  const generated = `conversation_h5_${Date.now()}`;
  window.localStorage.setItem("ai-code.conversationId", generated);
  return generated;
}

function pendingConfirmationTokensStorageKey(conversationId: string) {
  return `${pendingConfirmationTokensStoragePrefix}${conversationId}`;
}

function loadPendingConfirmationTokens(conversationId: string) {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(
      pendingConfirmationTokensStorageKey(conversationId),
    );
    if (!raw) {
      return {};
    }
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) {
      return {};
    }
    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, string] =>
          typeof entry[1] === "string" &&
          entry[1].length > 0 &&
          entry[1] !== "redacted",
      ),
    );
  } catch {
    return {};
  }
}

function savePendingConfirmationTokens(
  conversationId: string,
  tokensByPlanId: Record<string, string>,
) {
  if (typeof window === "undefined") {
    return;
  }

  const storageKey = pendingConfirmationTokensStorageKey(conversationId);
  const entries = Object.entries(tokensByPlanId).filter(
    ([, token]) => token.length > 0 && token !== "redacted",
  );
  if (entries.length === 0) {
    window.localStorage.removeItem(storageKey);
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(Object.fromEntries(entries)));
}

function cachePendingConfirmationToken(
  conversationId: string,
  planId: string,
  confirmToken: string | undefined,
) {
  if (!confirmToken || confirmToken === "redacted") {
    return;
  }

  savePendingConfirmationTokens(conversationId, {
    ...loadPendingConfirmationTokens(conversationId),
    [planId]: confirmToken,
  });
}

function clearPendingConfirmationToken(conversationId: string, planId: string) {
  const tokensByPlanId = loadPendingConfirmationTokens(conversationId);
  delete tokensByPlanId[planId];
  savePendingConfirmationTokens(conversationId, tokensByPlanId);
}

function getInitialNativePlatform() {
  if (typeof window === "undefined") {
    return undefined;
  }

  const native = new URLSearchParams(window.location.search).get("native");

  return native === "ios" ? "ios" : undefined;
}

function isBridgeDebugEnabled() {
  if (typeof window === "undefined") {
    return false;
  }

  const params = new URLSearchParams(window.location.search);
  return params.get("bridgeDebug") === "1";
}

function isDemoModeEnabled() {
  if (typeof window === "undefined") {
    return false;
  }

  return new URLSearchParams(window.location.search).get("demo") === "1";
}

export function getHydrationSafeInitialElementsBySurface() {
  return nativeInitialBackendElementsBySurface;
}

function getElementsBySurfaceForRuntime(demoMode: boolean) {
  return demoMode
    ? demoBackendElementsBySurface
    : nativeInitialBackendElementsBySurface;
}

function conversationWithAttachmentElements(
  conversation: BackendRenderedElement[],
  attachments: AttachmentIntake[],
) {
  const withoutAttachmentElements = conversation.filter(
    (element) => element.id !== attachmentElementsId,
  );
  if (attachments.length === 0) {
    return withoutAttachmentElements;
  }
  return [
    ...withoutAttachmentElements,
    ...attachmentIntakesToBackendElements(attachments),
  ];
}

function conversationWithHistoryElements(
  conversation: BackendRenderedElement[],
  history: BackendRenderedElement[],
) {
  if (history.length === 0) {
    return conversation;
  }

  const historyIds = new Set(history.map((element) => element.id));
  const withoutPreviousHistory = conversation.filter(
    (element) => !element.id.startsWith("history-") && !historyIds.has(element.id),
  );
  return [...withoutPreviousHistory, ...history];
}

function conversationWithPendingConfirmationElements(
  conversation: BackendRenderedElement[],
  pendingConfirmations: BackendRenderedElement[],
) {
  if (pendingConfirmations.length === 0) {
    return conversation.filter((element) => element.kind !== "confirmation");
  }

  const pendingIds = new Set(pendingConfirmations.map((element) => element.id));
  const pendingPlanIds = new Set(
    pendingConfirmations.flatMap((element) =>
      element.kind === "confirmation" && element.planId ? [element.planId] : [],
    ),
  );
  const withoutPreviousPending = conversation.filter((element) => {
    if (element.kind !== "confirmation") {
      return true;
    }
    if (pendingIds.has(element.id)) {
      return false;
    }
    return !element.planId || !pendingPlanIds.has(element.planId);
  });
  return [...withoutPreviousPending, ...pendingConfirmations];
}

function settingsWithAgentDebugElements(
  settings: BackendRenderedElement[],
  debugElements: BackendRenderedElement[],
) {
  return [
    ...settings.filter((element) => element.id !== agentDebugElementsId),
    ...debugElements,
  ];
}

function getSurfaceFromNativeMessage(message: NativeBridgeEnvelope) {
  if (message.type !== "native.viewChanged") {
    return undefined;
  }

  const view = message.payload?.view;

  return allSurfaces.includes(view as AgentSurface)
    ? (view as AgentSurface)
    : undefined;
}

function getThemeFromNativeMessage(message: NativeBridgeEnvelope) {
  if (message.type !== "native.themeChanged") {
    return undefined;
  }

  const theme = message.payload?.theme;

  return theme === "dark" || theme === "light" ? theme : undefined;
}

function getSubmittedTextFromNativeMessage(message: NativeBridgeEnvelope) {
  if (message.type !== "native.inputSubmitted") {
    return undefined;
  }

  if (message.payload?.inputKind === "attachment") {
    return undefined;
  }

  const text = message.payload?.text;

  return typeof text === "string" && text.trim().length > 0
    ? text.trim()
    : undefined;
}

function getOptionalPayloadString(
  payload: NativeBridgeEnvelope["payload"],
  key: string,
) {
  const value = payload?.[key];

  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

export function getNativeInboundDebugLabel(message: NativeBridgeEnvelope) {
  const parts: string[] = [message.type];
  const source = getOptionalPayloadString(message.payload, "source");
  const inputKind = getOptionalPayloadString(message.payload, "inputKind");
  const attachmentName = getOptionalPayloadString(
    message.payload,
    "attachmentName",
  );
  const view = getOptionalPayloadString(message.payload, "view");
  const reminderId = getOptionalPayloadString(message.payload, "reminderId");
  const receivedType = getOptionalPayloadString(
    message.payload,
    "receivedType",
  );

  if (source) {
    parts.push(`source=${source}`);
  }
  if (inputKind) {
    parts.push(`input=${inputKind}`);
  }
  if (attachmentName) {
    parts.push(`attachment=${attachmentName}`);
  }
  if (view) {
    parts.push(`view=${view}`);
  }
  if (reminderId) {
    parts.push(`reminderId=${reminderId}`);
  }
  if (receivedType) {
    parts.push(`ack=${receivedType}`);
  }

  return parts.join(" · ");
}

function getOptionalPayloadSizeBytes(payload: NativeBridgeEnvelope["payload"]) {
  const value = payload?.attachmentSizeBytes;
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
  }

  return undefined;
}

function getSubmittedAttachmentFromNativeMessage(
  message: NativeBridgeEnvelope,
): NativeAttachmentSubmission | undefined {
  if (
    message.type !== "native.inputSubmitted" ||
    message.payload?.inputKind !== "attachment"
  ) {
    return undefined;
  }

  const attachmentId = getOptionalPayloadString(message.payload, "attachmentId");
  const attachmentKind = getOptionalPayloadString(
    message.payload,
    "attachmentKind",
  );
  const attachmentName = getOptionalPayloadString(
    message.payload,
    "attachmentName",
  );

  if (!attachmentId || !attachmentKind || !attachmentName) {
    return undefined;
  }

  const text = getOptionalPayloadString(message.payload, "text");
  const request: NativeAttachmentSubmission = {
    attachmentId,
    attachmentKind,
    attachmentName,
    displayText: text ?? `已选择附件：${attachmentName}`,
  };
  const attachmentSizeBytes = getOptionalPayloadSizeBytes(message.payload);
  const attachmentType = getOptionalPayloadString(
    message.payload,
    "attachmentType",
  );
  const base64Content = getOptionalPayloadString(
    message.payload,
    "base64Content",
  );
  const source = getOptionalPayloadString(message.payload, "source");

  if (attachmentSizeBytes !== undefined) {
    request.attachmentSizeBytes = attachmentSizeBytes;
  }
  if (attachmentType) {
    request.attachmentType = attachmentType;
  }
  if (source) {
    request.source = source;
  }
  if (text) {
    request.text = text;
  }
  if (base64Content) {
    request.base64Content = base64Content;
  }

  return request;
}

export function getAttachmentPersistenceRequest(
  attachment: NativeAttachmentSubmission & { base64Content: string },
  conversationId: string,
): Extract<AttachmentPersistenceRequest, { kind: "upload" }>;
export function getAttachmentPersistenceRequest(
  attachment: NativeAttachmentSubmission & { base64Content?: undefined },
  conversationId: string,
): Extract<AttachmentPersistenceRequest, { kind: "intake" }>;
export function getAttachmentPersistenceRequest(
  attachment: NativeAttachmentSubmission,
  conversationId: string,
): AttachmentPersistenceRequest;
export function getAttachmentPersistenceRequest(
  attachment: NativeAttachmentSubmission,
  conversationId: string,
): AttachmentPersistenceRequest {
  const shared = {
    attachmentId: attachment.attachmentId,
    attachmentKind: attachment.attachmentKind,
    attachmentName: attachment.attachmentName,
    attachmentType: attachment.attachmentType,
    conversationId,
    source: attachment.source,
    text: attachment.text,
  };

  if (attachment.base64Content) {
    return {
      kind: "upload",
      request: {
        ...shared,
        base64Content: attachment.base64Content,
      },
    };
  }

  return {
    kind: "intake",
    request: {
      ...shared,
      attachmentSizeBytes: attachment.attachmentSizeBytes,
    },
  };
}

export function getNativeErrorExecutionStatus(
  message: NativeBridgeEnvelope & {
    payload: {
      reason?: unknown;
      source:
        | "native.calendar.events.sync"
        | "native.notifications.reminders.sync";
    };
  },
): RuntimeExecutionStatus & { status: "completed" };
export function getNativeErrorExecutionStatus(
  message: NativeBridgeEnvelope & {
    payload: {
      reason?: unknown;
      source: "native.composer.voice" | "native.composer.attachment";
    };
  },
): RuntimeExecutionStatus & { status: "failed" };
export function getNativeErrorExecutionStatus(
  message: NativeBridgeEnvelope,
): RuntimeExecutionStatus;
export function getNativeErrorExecutionStatus(
  message: NativeBridgeEnvelope,
): RuntimeExecutionStatus {
  const reason = message.payload?.reason;
  const source = message.payload?.source;
  const description =
    typeof reason === "string" ? reason : "Native 能力调用失败";
  const isSystemSyncError =
    source === "native.calendar.events.sync" ||
    source === "native.notifications.reminders.sync";

  return {
    description: isSystemSyncError
      ? `后端事项已保存，系统同步未开启：${description}`
      : description,
    status: isSystemSyncError ? "completed" : "failed",
  };
}

export function getNativeAckExecutionStatus(
  message: NativeBridgeEnvelope,
): RuntimeExecutionStatus | undefined {
  if (message.type !== "native.ack") {
    return undefined;
  }

  const receivedType = message.payload?.receivedType;
  const source = message.payload?.source;
  const type = typeof receivedType === "string" ? receivedType : source;

  switch (type) {
    case "input.keyboard.open":
    case "h5.input.keyboard.open":
      return {
        description: "已打开原生键盘输入",
        status: "completed",
      };
    case "input.voice.start":
    case "h5.input.voice.start":
      return {
        description: "已启动原生语音输入",
        status: "completed",
      };
    case "input.voice.stop":
    case "h5.input.voice.stop":
      return {
        description: "已提交语音输入",
        status: "completed",
      };
    default:
      return undefined;
  }
}

async function withSnapshotFallback<T>(
  label: string,
  promise: Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    console.warn("[AIH5] optional snapshot refresh failed", {
      error,
      label,
    });
    return fallback;
  }
}

function getReminderIdFromNativeMessage(message: NativeBridgeEnvelope) {
  const reminderId = message.payload?.reminderId;

  return typeof reminderId === "string" && reminderId.trim().length > 0
    ? reminderId.trim()
    : undefined;
}

function ThemeSwitcher({
  activeTheme,
  onThemeChange,
}: {
  activeTheme: AgentTheme;
  onThemeChange: (theme: AgentTheme) => void;
}) {
  return (
    <div className="ai-agent-theme-switcher" aria-label="主题切换">
      {(["dark", "light"] as const).map((theme) => (
        <button
          aria-pressed={activeTheme === theme}
          className="ai-agent-theme-button"
          key={theme}
          onClick={() => onThemeChange(theme)}
          type="button"
        >
          {themeLabels[theme]}
        </button>
      ))}
    </div>
  );
}

function DevelopmentSurfaceSwitcher({
  activeSurface,
  onSurfaceChange,
}: {
  activeSurface: AgentSurface;
  onSurfaceChange: (surface: AgentSurface) => void;
}) {
  return (
    <div className="ai-agent-segmented-control" aria-label="后端元素视图切换">
      {allSurfaces.map((surface) => (
        <button
          aria-pressed={activeSurface === surface}
          className="ai-agent-segmented-button"
          key={surface}
          onClick={() => onSurfaceChange(surface)}
          type="button"
        >
          {surfaceLabels[surface]}
        </button>
      ))}
    </div>
  );
}

function PreviewControls({
  activeSurface,
  hostContext,
  onSurfaceChange,
  onThemeChange,
  theme,
}: {
  activeSurface: AgentSurface;
  hostContext?: NativeHostContext;
  onSurfaceChange: (surface: AgentSurface) => void;
  onThemeChange: (theme: AgentTheme) => void;
  theme: AgentTheme;
}) {
  return (
    <section className="ai-agent-preview-controls" aria-label="开发预览控制">
      <div>
        <strong>H5 Backend Element Surface</strong>
        <span>
          {hostContext
            ? `NativeBridge ${hostContext.bridgeVersion} 已连接`
            : "开发态仅预览 H5 对后端元素的渲染结果"}
        </span>
      </div>
      <div className="ai-agent-control-stack">
        <DevelopmentSurfaceSwitcher
          activeSurface={activeSurface}
          onSurfaceChange={onSurfaceChange}
        />
        <ThemeSwitcher activeTheme={theme} onThemeChange={onThemeChange} />
      </div>
    </section>
  );
}

function BackendElementCard({
  element,
  onCancel,
  onConfirm,
  onBridgeAction,
  onQuickReply,
  onSummaryAction,
}: {
  element: BackendRenderedElement;
  onCancel: (element: BackendRenderedElement) => void;
  onConfirm: (element: BackendRenderedElement) => void;
  onBridgeAction: (type: BridgeActionType) => void;
  onQuickReply: (reply: { label: string; value: string }) => void;
  onSummaryAction: (itemId: string, action: SummaryItemAction) => void;
}) {
  if (element.kind === "message") {
    return (
      <MessageBubble roleTone={element.role === "user" ? "user" : "assistant"}>
        {element.content}
      </MessageBubble>
    );
  }

  if (element.kind === "confirmation") {
    return (
      <ConfirmationCard
        actions={element.actions}
        data-confirmation-id={element.id}
        data-plan-id={element.planId}
        description={element.description}
        onCancel={() => onCancel(element)}
        onConfirm={() => onConfirm(element)}
        title={element.title}
      />
    );
  }

  if (element.kind === "quick-replies") {
    return (
      <div className="ai-agent-quick-replies" role="list">
        {element.replies.map((reply, index) => {
          const value = element.replyValues?.[index] ?? reply;
          return (
            <button
              className="ai-agent-quick-reply-button"
              key={`${value}-${index}`}
              onClick={() => onQuickReply({ label: reply, value })}
              type="button"
            >
              {reply}
            </button>
          );
        })}
      </div>
    );
  }

  if (element.kind === "ledger") {
    return (
      <article className="ai-agent-backend-card">
        <div className="ai-agent-section-heading">
          <strong>{element.title}</strong>
          <span>H5 只渲染结果，不决定执行逻辑</span>
        </div>
        <div className="ai-agent-backend-list">
          {element.items.map((item) => (
            <div className="ai-agent-backend-row" key={item.id}>
              <StatusBadge tone={item.completed ? "success" : "warning"}>
                {item.completed ? "完成" : "待确认"}
              </StatusBadge>
              <div>
                <strong>{item.label}</strong>
                <span>{item.meta}</span>
              </div>
            </div>
          ))}
        </div>
      </article>
    );
  }

  return (
    <article className="ai-agent-backend-card">
      <div className="ai-agent-section-heading">
        <strong>{element.title}</strong>
        <span>由后端日程域返回，Native 只负责壳层入口</span>
      </div>
      <div className="ai-agent-backend-list">
          {element.items.map((item) => (
            <div
              aria-current={item.highlighted ? "true" : undefined}
              className={`ai-agent-backend-row${
                item.highlighted ? " ai-agent-backend-row-highlighted" : ""
              }`}
              data-highlighted-summary-item={
                item.highlighted ? "true" : undefined
              }
              key={item.id}
            >
            <StatusBadge tone={item.tone}>{item.label}</StatusBadge>
            <div>
              {item.bridgeAction ? (
                <button
                  className="ai-agent-inline-action"
                  onClick={() => {
                    if (item.bridgeAction) {
                      onBridgeAction(item.bridgeAction);
                    }
                  }}
                  type="button"
                >
                  {item.meta}
                </button>
              ) : (
                <span>{item.meta}</span>
              )}
              {item.actions && item.actions.length > 0 ? (
                <div className="ai-agent-backend-row-actions">
                  {item.actions.map((action) => (
                    <button
                      className="ai-agent-inline-action"
                      key={action.type}
                      onClick={() => onSummaryAction(item.id, action)}
                      type="button"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function BackendElementSurface({
  elements,
  onCancel,
  onConfirm,
  onBridgeAction,
  onQuickReply,
  onSummaryAction,
  surfaceRef,
  surface,
}: {
  elements: BackendRenderedElement[];
  onCancel: (element: BackendRenderedElement) => void;
  onConfirm: (element: BackendRenderedElement) => void;
  onBridgeAction: (type: BridgeActionType) => void;
  onQuickReply: (reply: { label: string; value: string }) => void;
  onSummaryAction: (itemId: string, action: SummaryItemAction) => void;
  surfaceRef: RefObject<HTMLElement | null>;
  surface: AgentSurface;
}) {
  return (
    <section
      className="ai-agent-backend-surface"
      ref={surfaceRef}
      aria-label="后端元素渲染区"
    >
      <div className="ai-agent-backend-heading">
        <span>{surfaceLabels[surface]}</span>
        <strong>{surfaceDescriptions[surface]}</strong>
      </div>
      {elements.map((element) => (
        <BackendElementCard
          element={element}
          key={element.id}
          onCancel={onCancel}
          onConfirm={onConfirm}
          onBridgeAction={onBridgeAction}
          onQuickReply={onQuickReply}
          onSummaryAction={onSummaryAction}
        />
      ))}
    </section>
  );
}

function ExecutionStatusDock({ status }: { status: RuntimeExecutionStatus }) {
  return (
    <section
      className="ai-agent-status-dock"
      data-status={status.status}
      aria-label="当前执行状态"
    >
      <span className="ai-agent-status-dot" />
      <div>
        <strong>{executionStatusLabels[status.status]}</strong>
        <span>{status.description}</span>
      </div>
      <em>{status.status}</em>
    </section>
  );
}

function SummaryEditPanel({
  draft,
  onCancel,
  onSubmit,
}: {
  draft?: SummaryEditDraft;
  onCancel: () => void;
  onSubmit: (draft: SummaryEditDraft, formData: FormData) => void;
}) {
  if (!draft) {
    return null;
  }

  const values = draft.action.editValues ?? {};
  const title =
    draft.action.type === "calendar.edit"
      ? "编辑日程"
      : draft.action.type === "expense.edit"
        ? "编辑费用"
        : "编辑提醒";

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(draft as SummaryEditDraft, new FormData(event.currentTarget));
  }

  return (
    <div className="ai-agent-edit-backdrop" role="presentation">
      <section
        aria-label={title}
        aria-modal="true"
        className="ai-agent-edit-panel"
        role="dialog"
      >
        <div className="ai-agent-edit-heading">
          <strong>{title}</strong>
          <button
            aria-label="关闭编辑"
            className="ai-agent-icon-button"
            onClick={onCancel}
            type="button"
          >
            ×
          </button>
        </div>
        <form className="ai-agent-edit-form" onSubmit={submitForm}>
          <label>
            <span>标题</span>
            <input
              autoFocus
              defaultValue={values.title ?? ""}
              name="title"
              required
            />
          </label>

          {draft.action.type === "calendar.edit" ? (
            <>
              <label>
                <span>开始</span>
                <input
                  defaultValue={dateTimeIsoToLocalInputValue(values.startAt)}
                  name="startAt"
                  required
                  step={60}
                  type="datetime-local"
                />
              </label>
              <label>
                <span>结束</span>
                <input
                  defaultValue={dateTimeIsoToLocalInputValue(values.endAt)}
                  name="endAt"
                  required
                  step={60}
                  type="datetime-local"
                />
              </label>
              <label>
                <span>时区</span>
                <input defaultValue={values.timezone ?? ""} name="timezone" required />
              </label>
            </>
          ) : null}

          {draft.action.type === "expense.edit" ? (
            <>
              <label>
                <span>金额</span>
                <input
                  defaultValue={values.amount ?? ""}
                  inputMode="decimal"
                  min="0"
                  name="amount"
                  required
                  step="0.01"
                  type="number"
                />
              </label>
              <label>
                <span>币种</span>
                <input defaultValue={values.currency ?? "CNY"} name="currency" required />
              </label>
              <label>
                <span>日期</span>
                <input
                  defaultValue={values.occurredOn ?? ""}
                  name="occurredOn"
                  required
                  type="date"
                />
              </label>
            </>
          ) : null}

          {draft.action.type === "reminder.edit" ? (
            <label>
              <span>时间</span>
              <input
                defaultValue={dateTimeIsoToLocalInputValue(values.dueAt)}
                name="dueAt"
                required
                step={60}
                type="datetime-local"
              />
            </label>
          ) : null}

          <div className="ai-agent-edit-actions">
            <button className="ai-agent-secondary-button" onClick={onCancel} type="button">
              取消
            </button>
            <button className="ai-agent-primary-button" type="submit">
              保存
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function BridgeDebugPanel({
  activeSurface,
  debug,
  enabled,
  hostContext,
  nativePlatform,
  theme,
}: {
  activeSurface: AgentSurface;
  debug: BridgeDebugState;
  enabled: boolean;
  hostContext?: NativeHostContext;
  nativePlatform?: "ios";
  theme: AgentTheme;
}) {
  if (!enabled) {
    return null;
  }

  return (
    <aside className="ai-agent-bridge-debug" aria-label="Bridge 调试信息">
      <strong>Bridge Debug</strong>
      <span>
        {bridgeDebugBuild} · {nativePlatform ?? "unknown"} · {theme}
      </span>
      <span>
        ready={debug.h5ReadyDelivered ? "yes" : "no"} · bridge=
        {debug.bridgeAvailable ? "yes" : "no"} · surface={activeSurface}
      </span>
      <span>
        in={debug.lastInbound ?? "none"} · out={debug.lastOutbound ?? "none"} ·
        count={debug.messageCount}
      </span>
      {hostContext?.h5URL ? <span>host={hostContext.h5URL}</span> : null}
    </aside>
  );
}

export function AgentWorkbench() {
  const [activeSurface, setActiveSurface] =
    useState<AgentSurface>("conversation");
  const [bridgeDebug, setBridgeDebug] = useState<BridgeDebugState>(() => ({
    bridgeAvailable: false,
    h5ReadyDelivered: false,
    messageCount: 0,
    mountedAt: "pending",
  }));
  const [bridgeDebugEnabled, setBridgeDebugEnabled] = useState(false);
  const [elementsBySurface, setElementsBySurface] = useState(() =>
    getHydrationSafeInitialElementsBySurface(),
  );
  const [executionStatus, setExecutionStatus] =
    useState<RuntimeExecutionStatus>(initialExecutionStatus);
  const [focusedReminderId, setFocusedReminderId] = useState<
    string | undefined
  >();
  const [hostContext, setHostContext] = useState<NativeHostContext>();
  const [nativePlatform, setNativePlatform] = useState<"ios" | undefined>();
  const [summaryEditDraft, setSummaryEditDraft] = useState<
    SummaryEditDraft | undefined
  >();
  const [theme, setTheme] = useState<AgentTheme>("dark");
  const interactionSequenceRef = useRef(0);
  const apiClient = useMemo(
    () =>
      createAgentApiClient(
        typeof window === "undefined" ? undefined : window.location.href,
      ),
    [],
  );
  const conversationIdRef = useRef(getInitialConversationId());
  const hasSubmittedInSessionRef = useRef(false);
  const surfaceRef = useRef<HTMLElement | null>(null);
  const timeoutRefs = useRef<number[]>([]);
  const style = useMemo(() => themeVariables(theme), [theme]);
  const showPreviewControls = nativePlatform === undefined;
  const elements = elementsBySurface[activeSurface];

  useEffect(() => {
    if (activeSurface !== "conversation") {
      return;
    }

    surfaceRef.current?.scrollTo({
      behavior: "smooth",
      top: surfaceRef.current.scrollHeight,
    });
  }, [activeSurface, elements.length]);

  useEffect(() => {
    if (activeSurface !== "reminders" || !focusedReminderId) {
      return;
    }

    surfaceRef.current
      ?.querySelector('[data-highlighted-summary-item="true"]')
      ?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
  }, [activeSurface, elements.length, focusedReminderId]);

  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach((timeoutId) =>
        window.clearTimeout(timeoutId),
      );
      timeoutRefs.current = [];
    };
  }, []);

  function scheduleStatus(status: RuntimeExecutionStatus, delay: number) {
    const timeoutId = window.setTimeout(() => {
      setExecutionStatus(status);
    }, delay);
    timeoutRefs.current.push(timeoutId);
  }

  async function refreshBackendSnapshots(
    options: {
      focusedReminderId?: string;
      syncConversationTurns?: boolean;
      syncNativeCalendarEvents?: boolean;
      syncNativeReminders?: boolean;
    } = {},
  ) {
    const [calendarEvents, expenses, reminders, ledger] = await Promise.all([
      apiClient.getCalendarEvents(conversationIdRef.current),
      apiClient.getExpenses(conversationIdRef.current),
      apiClient.getReminders(conversationIdRef.current),
      apiClient.getExecutionLedger(conversationIdRef.current),
    ]);
    const [attachments, debug, turnHistory, pendingConfirmations] =
      await Promise.all([
        withSnapshotFallback(
          "attachments",
          apiClient.getAttachments(conversationIdRef.current),
          [],
        ),
        withSnapshotFallback(
          "agent-debug",
          apiClient.getAgentConversationDebug(conversationIdRef.current),
          {
            conversationId: conversationIdRef.current,
            decisionTraces: [],
            events: [],
            pendingClarifications: [],
          },
        ),
        withSnapshotFallback(
          "conversation-turns",
          apiClient.getAgentConversationTurns(conversationIdRef.current),
          {
            conversationId: conversationIdRef.current,
            turns: [],
          },
        ),
        withSnapshotFallback(
          "pending-confirmations",
          apiClient.getAgentPendingConfirmations(conversationIdRef.current),
          {
            conversationId: conversationIdRef.current,
            plans: [],
          },
        ),
      ]);
    const nextFocusedReminderId =
      options.focusedReminderId ?? focusedReminderId;
    const shouldSyncConversationTurns =
      options.syncConversationTurns ?? !hasSubmittedInSessionRef.current;
    const historyElements = shouldSyncConversationTurns
      ? conversationTurnsToConversationElements(turnHistory.turns, {
          confirmationTokensByPlanId: loadPendingConfirmationTokens(
            conversationIdRef.current,
          ),
        })
      : [];
    const pendingConfirmationElements = pendingConfirmationPlansToBackendElements(
      pendingConfirmations.plans,
    );
    setElementsBySurface((current) => ({
      ...current,
      calendar: calendarEventsToBackendElements(calendarEvents),
      conversation: conversationWithAttachmentElements(
        conversationWithPendingConfirmationElements(
          conversationWithHistoryElements(current.conversation, historyElements),
          pendingConfirmationElements,
        ),
        attachments,
      ),
      expenses: expensesToBackendElements(expenses),
      ledger: executionLedgerToBackendElements(ledger),
      reminders: remindersToBackendElements(reminders, {
        focusedReminderId: nextFocusedReminderId,
      }),
      settings: settingsWithAgentDebugElements(
        current.settings,
        agentDebugToBackendElements(debug),
      ),
      timeline: timelineToBackendElements(calendarEvents, reminders, expenses),
    }));

    const shouldSyncNativeReminders =
      options.syncNativeReminders ?? nativePlatform === "ios";
    const shouldSyncNativeCalendarEvents =
      options.syncNativeCalendarEvents ?? nativePlatform === "ios";

    if (shouldSyncNativeCalendarEvents) {
      syncNativeCalendarEvents(calendarEvents);
    }
    if (shouldSyncNativeReminders) {
      syncNativeReminderNotifications(reminders);
    }
  }

  function syncNativeCalendarEvents(events: CalendarEvent[]) {
    const result = postNativeBridgeMessage("calendar.events.sync", {
      events: events.map((event) => ({
        endAt: event.endAt,
        id: event.id,
        sourceActionId: event.sourceActionId,
        startAt: event.startAt,
        status: event.status,
        timezone: event.timezone,
        title: event.title,
      })),
    });

    setBridgeDebug((current) => ({
      ...current,
      bridgeAvailable: result.delivered,
      lastOutbound: result.envelope.type,
    }));
  }

  function syncNativeReminderNotifications(reminders: Reminder[]) {
    const result = postNativeBridgeMessage("notifications.reminders.sync", {
      reminders: reminders
        .filter((reminder) => reminder.status === "scheduled")
        .map((reminder) => ({
          dueAt: reminder.dueAt,
          id: reminder.id,
          status: reminder.status,
          title: reminder.title,
        })),
    });

    setBridgeDebug((current) => ({
      ...current,
      bridgeAvailable: result.delivered,
      lastOutbound: result.envelope.type,
    }));
  }

  async function handleSubmittedText(
    text: string,
    options?: { displayText?: string },
  ) {
    interactionSequenceRef.current += 1;
    hasSubmittedInSessionRef.current = true;
    const sequence = interactionSequenceRef.current;
    const displayText = options?.displayText;
    const userElement: BackendRenderedElement = {
      content: displayText ?? text,
      id: `user-${sequence}-${Date.now()}`,
      kind: "message",
      role: "user",
    };

    setActiveSurface("conversation");
    setExecutionStatus({
      description: "正在理解你的自然语言指令",
      status: "understanding",
    });

    setElementsBySurface((current) => ({
      ...current,
      conversation: [...current.conversation, userElement],
    }));

    try {
      const response = await apiClient.submitAgentTurn({
        clientContext: {
          locale: "zh-CN",
          now: new Date().toISOString(),
          timezone:
            Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Shanghai",
        },
        conversationId: conversationIdRef.current,
        displayInput: displayText,
        input: text,
      });
      if (response.kind === "confirmation_required") {
        cachePendingConfirmationToken(
          conversationIdRef.current,
          response.plan.id,
          response.plan.confirmation?.confirmToken,
        );
      }
      const responseElements = agentResponseToConversationElements(response);
      setElementsBySurface((current) => ({
        ...current,
        conversation: [...current.conversation, ...responseElements],
      }));
      await refreshBackendSnapshots({
        syncConversationTurns: false,
      });
      if (response.kind === "confirmation_required") {
        setExecutionStatus({
          description: `等待确认：${response.plan.summary}`,
          status: "confirming",
        });
        return;
      }
      if (response.kind === "clarification_request") {
        setExecutionStatus({
          description: response.question,
          status: "idle",
        });
        return;
      }
      setExecutionStatus({
        description: "后端已返回执行结果",
        status: response.kind === "execution_result" ? "completed" : "idle",
      });
    } catch (error) {
      setExecutionStatus({
        description: error instanceof Error ? error.message : "后端请求失败",
        status: "failed",
      });
      setElementsBySurface((current) => ({
        ...current,
        conversation: [
          ...current.conversation,
          {
            content:
              "后端暂时不可用。请确认 `pnpm dev:full` 已启动，并且 iOS 访问的是同一台 Mac 的 H5 地址。",
            id: `api-error-${Date.now()}`,
            kind: "message",
            role: "assistant",
          },
        ],
      }));
    }
  }

  async function handleSubmittedAttachment(attachment: NativeAttachmentSubmission) {
    interactionSequenceRef.current += 1;
    hasSubmittedInSessionRef.current = true;
    const sequence = interactionSequenceRef.current;
    const userElement: BackendRenderedElement = {
      content: attachment.displayText,
      id: `user-attachment-${sequence}-${Date.now()}`,
      kind: "message",
      role: "user",
    };

    setActiveSurface("conversation");
    setExecutionStatus({
      description: attachment.base64Content
        ? "正在上传附件内容"
        : "正在接收附件元数据",
      status: "understanding",
    });
    setElementsBySurface((current) => ({
      ...current,
      conversation: [...current.conversation, userElement],
    }));

    try {
      const persistenceRequest = getAttachmentPersistenceRequest(
        attachment,
        conversationIdRef.current,
      );
      const intake =
        persistenceRequest.kind === "upload"
          ? await apiClient.uploadAttachment(persistenceRequest.request)
          : await apiClient.intakeAttachment(persistenceRequest.request);
      const sizeText =
        intake.sizeBytes === undefined ? "未知大小" : `${intake.sizeBytes} bytes`;
      setElementsBySurface((current) => ({
        ...current,
        conversation: [
          ...current.conversation,
          {
            content: `已接收附件：${intake.name}（${intake.kind}，${sizeText}）。请选择后续处理方式。`,
            id: `attachment-intake-${intake.id}`,
            kind: "message",
            role: "assistant",
          },
          {
            id: `attachment-quick-replies-${intake.id}`,
            kind: "quick-replies",
            replies: [
              `把 ${intake.name} 作为费用票据处理`,
              `把 ${intake.name} 作为日程材料处理`,
              "稍后再处理",
            ],
          },
        ],
      }));
      await refreshBackendSnapshots({
        syncConversationTurns: false,
        syncNativeCalendarEvents: false,
        syncNativeReminders: false,
      });
      setExecutionStatus({
        description: `已接收附件：${intake.name}`,
        status: "completed",
      });
    } catch (error) {
      setExecutionStatus({
        description: error instanceof Error ? error.message : "附件接收失败",
        status: "failed",
      });
      setElementsBySurface((current) => ({
        ...current,
        conversation: [
          ...current.conversation,
          {
            content: "附件暂时无法写入后端，请确认 API 服务已启动。",
            id: `attachment-error-${Date.now()}`,
            kind: "message",
            role: "assistant",
          },
        ],
      }));
    }
  }

  function handleBridgeAction(type: BridgeActionType) {
    const result = postNativeBridgeMessage(type, {
      surface: activeSurface,
    });

    setBridgeDebug((current) => ({
      ...current,
      bridgeAvailable: result.delivered,
      lastOutbound: result.envelope.type,
    }));

    setExecutionStatus({
      description:
        type === "input.keyboard.open"
          ? "正在打开键盘输入"
          : type === "input.voice.start"
            ? "正在启动语音输入"
            : "正在提交语音输入",
      status: "understanding",
    });
  }

  async function handleSummaryAction(
    itemId: string,
    action: SummaryItemAction,
  ) {
    const targetItemId = action.targetId ?? itemId;
    const isCalendarAction = action.type.startsWith("calendar.");
    const isEditAction = action.type.endsWith(".edit");
    const isExpenseAction = action.type.startsWith("expense.");

    try {
      if (isEditAction) {
        setSummaryEditDraft({
          action,
          itemId,
          targetItemId,
        });
        setExecutionStatus({
          description: "正在编辑事项",
          status: "idle",
        });
        return;
      }

      setExecutionStatus({
        description:
          action.type === "calendar.cancel"
            ? "正在取消日程"
            : action.type === "reminder.complete"
              ? "正在完成提醒"
              : action.type === "reminder.cancel"
                ? "正在取消提醒"
                : action.type === "expense.submit"
                  ? "正在提交费用草稿"
                  : "正在取消费用草稿",
        status: "executing",
      });

      if (isCalendarAction) {
        const event = await apiClient.cancelCalendarEvent(
          targetItemId,
          conversationIdRef.current,
        );
        await refreshBackendSnapshots();
        setExecutionStatus({
          description: `已取消日程：${event.title}`,
          status: "completed",
        });
        return;
      }

      if (isExpenseAction) {
        const expense =
          action.type === "expense.submit"
            ? await apiClient.submitExpense(targetItemId, conversationIdRef.current)
            : await apiClient.cancelExpense(targetItemId, conversationIdRef.current);
        await refreshBackendSnapshots();
        setExecutionStatus({
          description:
            expense.status === "submitted"
              ? `已提交费用草稿：${expense.title}`
              : `已取消费用草稿：${expense.title}`,
          status: "completed",
        });
        return;
      }

      const reminder =
        action.type === "reminder.complete"
          ? await apiClient.completeReminder(targetItemId, conversationIdRef.current)
          : await apiClient.cancelReminder(targetItemId, conversationIdRef.current);
      await refreshBackendSnapshots();
      setExecutionStatus({
        description:
          reminder.status === "done"
            ? `已完成提醒：${reminder.title}`
            : `已取消提醒：${reminder.title}`,
        status: "completed",
      });
    } catch (error) {
      setExecutionStatus({
        description: error instanceof Error ? error.message : "状态更新失败",
        status: "failed",
      });
    }
  }

  async function handleSubmitSummaryEdit(
    draft: SummaryEditDraft,
    formData: FormData,
  ) {
    try {
      const editPayload = buildSummaryEditPayload(draft, formData);
      setExecutionStatus({
        description:
          editPayload.type === "calendar.edit"
            ? "正在更新日程"
            : editPayload.type === "expense.edit"
              ? "正在更新费用"
              : "正在更新提醒",
        status: "executing",
      });

      if (editPayload.type === "calendar.edit") {
        const event = await apiClient.updateCalendarEvent(
          draft.targetItemId,
          editPayload.value,
          conversationIdRef.current,
        );
        setSummaryEditDraft(undefined);
        await refreshBackendSnapshots();
        setExecutionStatus({
          description: `已更新日程：${event.title}`,
          status: "completed",
        });
        return;
      }

      if (editPayload.type === "expense.edit") {
        const expense = await apiClient.updateExpense(
          draft.targetItemId,
          editPayload.value,
          conversationIdRef.current,
        );
        setSummaryEditDraft(undefined);
        await refreshBackendSnapshots();
        setExecutionStatus({
          description: `已更新费用：${expense.title}`,
          status: "completed",
        });
        return;
      }

      const reminder = await apiClient.updateReminder(
        draft.targetItemId,
        editPayload.value,
        conversationIdRef.current,
      );
      setSummaryEditDraft(undefined);
      await refreshBackendSnapshots();
      setExecutionStatus({
        description: `已更新提醒：${reminder.title}`,
        status: "completed",
      });
    } catch (error) {
      setExecutionStatus({
        description: error instanceof Error ? error.message : "编辑失败",
        status: "failed",
      });
    }
  }

  async function handleConfirm(element: BackendRenderedElement) {
    if (element.kind !== "confirmation" || !element.planId || !element.confirmToken) {
      return;
    }
    const planId = element.planId;
    const confirmToken = element.confirmToken;

    setExecutionStatus({
      description: "正在提交确认并写入数据库",
      status: "executing",
    });

    try {
      const response = await apiClient.confirmExecutionPlan(planId, {
        confirmToken,
      });
      clearPendingConfirmationToken(conversationIdRef.current, planId);
      setElementsBySurface((current) => ({
        ...current,
        conversation: [
          ...removeConfirmationElement(current.conversation, planId),
          ...agentResponseToConversationElements(response),
        ],
      }));
      await refreshBackendSnapshots();
      setExecutionStatus({
        description: "已确认执行，数据库视图和执行记录已刷新",
        status: "completed",
      });
    } catch (error) {
      setExecutionStatus({
        description: error instanceof Error ? error.message : "确认执行失败",
        status: "failed",
      });
    }
  }

  async function handleCancel(element: BackendRenderedElement) {
    if (element.kind !== "confirmation" || !element.planId) {
      return;
    }
    const planId = element.planId;

    setExecutionStatus({
      description: "正在取消本次计划",
      status: "executing",
    });

    try {
      await apiClient.rejectExecutionPlan(planId);
      clearPendingConfirmationToken(conversationIdRef.current, planId);
      await refreshBackendSnapshots();
      setElementsBySurface((current) => ({
        ...current,
        conversation: [
          ...removeConfirmationElement(current.conversation, planId),
          {
            content: "已取消。你可以继续输入新的指令。",
            id: `cancelled-${Date.now()}`,
            kind: "message",
            role: "assistant",
          },
        ],
      }));
      setExecutionStatus({
        description: "已取消本次操作，没有写入数据库",
        status: "idle",
      });
    } catch (error) {
      setExecutionStatus({
        description: error instanceof Error ? error.message : "取消执行失败",
        status: "failed",
      });
    }
  }

  useEffect(() => {
    const detectedNativePlatform = getInitialNativePlatform();
    const demoMode = isDemoModeEnabled();
    setNativePlatform(detectedNativePlatform);
    setElementsBySurface(getElementsBySurfaceForRuntime(demoMode));
    setHostContext(getNativeHostContext());
    setBridgeDebugEnabled(isBridgeDebugEnabled());
    setBridgeDebug((current) => ({
      ...current,
      mountedAt: new Date().toLocaleTimeString(),
    }));
    (
      window as typeof window & {
        __AI_H5_DEBUG_BUILD__?: string;
      }
    ).__AI_H5_DEBUG_BUILD__ = bridgeDebugBuild;

    console.info("[AIH5Bridge] mounted", {
      bridgeDebugBuild,
      nativePlatform: detectedNativePlatform,
      search: window.location.search,
    });

    const unsubscribe = subscribeNativeBridge((message) => {
      setBridgeDebug((current) => ({
        ...current,
        bridgeAvailable: true,
        lastInbound: getNativeInboundDebugLabel(message),
        messageCount: current.messageCount + 1,
      }));

      if (message.type === "native.hostContext") {
        const context = message.payload as NativeHostContext;
        setHostContext(context);
        setNativePlatform(context.platform);
        setElementsBySurface(getElementsBySurfaceForRuntime(demoMode));
        void refreshBackendSnapshots({
          syncNativeCalendarEvents: context.platform === "ios",
          syncNativeReminders: context.platform === "ios",
        }).catch((error: unknown) => {
          console.warn("[AIH5Bridge] initial backend refresh failed", error);
        });
        return;
      }

      if (message.type === "native.error") {
        setExecutionStatus(getNativeErrorExecutionStatus(message));
        return;
      }

      const ackStatus = getNativeAckExecutionStatus(message);
      if (ackStatus) {
        setExecutionStatus(ackStatus);
        return;
      }

      const nextTheme = getThemeFromNativeMessage(message);

      if (nextTheme) {
        setTheme(nextTheme);
        return;
      }

      const submittedAttachment = getSubmittedAttachmentFromNativeMessage(message);

      if (submittedAttachment) {
        handleSubmittedAttachment(submittedAttachment);
        return;
      }

      const submittedText = getSubmittedTextFromNativeMessage(message);

      if (submittedText) {
        handleSubmittedText(submittedText);
        return;
      }

      const nextSurface = getSurfaceFromNativeMessage(message);

      if (nextSurface) {
        const reminderId = getReminderIdFromNativeMessage(message);
        if (reminderId) {
          setFocusedReminderId(reminderId);
          void refreshBackendSnapshots({
            focusedReminderId: reminderId,
            syncNativeCalendarEvents: false,
            syncNativeReminders: false,
          }).catch((error: unknown) => {
            console.warn(
              "[AIH5Bridge] notification reminder refresh failed",
              error,
            );
          });
        }
        setActiveSurface(nextSurface);
        setExecutionStatus({
          description:
            nextSurface === "reminders" && reminderId
              ? "已从系统通知打开提醒"
              : `已切换到${surfaceLabels[nextSurface]}`,
          status: nextSurface === "conversation" ? "idle" : "completed",
        });
      }
    });

    const readyResult = postNativeBridgeMessage("h5.ready", {
      route: window.location.pathname,
      surface: "conversation",
    });
    console.info("[AIH5Bridge] h5.ready result", readyResult);
    setBridgeDebug((current) => ({
      ...current,
      bridgeAvailable: readyResult.delivered,
      h5ReadyDelivered: readyResult.delivered,
      lastOutbound: readyResult.envelope.type,
    }));
    void refreshBackendSnapshots().catch((error: unknown) => {
      console.warn("[AIH5Bridge] initial backend refresh failed", error);
    });

    return unsubscribe;
  }, []);

  return (
    <main
      className="ai-agent-page"
      data-native-embedded={nativePlatform === "ios"}
      style={style}
    >
      {showPreviewControls ? (
        <PreviewControls
          activeSurface={activeSurface}
          hostContext={hostContext}
          onSurfaceChange={setActiveSurface}
          onThemeChange={setTheme}
          theme={theme}
        />
      ) : null}
      <div className="ai-agent-webview-surface">
        <BridgeDebugPanel
          activeSurface={activeSurface}
          debug={bridgeDebug}
          enabled={bridgeDebugEnabled}
          hostContext={hostContext}
          nativePlatform={nativePlatform}
          theme={theme}
        />
        <BackendElementSurface
          elements={elements}
          onCancel={handleCancel}
          onBridgeAction={handleBridgeAction}
          onConfirm={handleConfirm}
          onQuickReply={(reply) => {
            void handleSubmittedText(reply.value, { displayText: reply.label });
          }}
          onSummaryAction={(itemId, action) => {
            void handleSummaryAction(itemId, action);
          }}
          surfaceRef={surfaceRef}
          surface={activeSurface}
        />
        <ExecutionStatusDock status={executionStatus} />
      </div>
      <SummaryEditPanel
        draft={summaryEditDraft}
        onCancel={() => {
          setSummaryEditDraft(undefined);
          setExecutionStatus({
            description: "已取消编辑",
            status: "idle",
          });
        }}
        onSubmit={(draft, formData) => {
          void handleSubmitSummaryEdit(draft, formData);
        }}
      />
    </main>
  );
}
