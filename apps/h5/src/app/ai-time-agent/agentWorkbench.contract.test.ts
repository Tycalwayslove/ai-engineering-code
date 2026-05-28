import type { ConfirmationAction, TimelineDay } from "@ai-code/shared-ui";
import type {
  AttachmentIntakeRequest,
  AttachmentUploadRequest,
} from "@ai-code/sdk";

import {
  demoConfirmationActions,
  demoConversation,
  demoExecutionStatus,
  demoLedgerItems,
  demoQuickStats,
  demoTimelineDays,
  nativeInitialBackendElementsBySurface,
} from "./demoData";
import {
  getAttachmentPersistenceRequest,
  getHydrationSafeInitialElementsBySurface,
  getNativeInboundDebugLabel,
  getNativeAckExecutionStatus,
  getNativeErrorExecutionStatus,
} from "./components";
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

const hydrationSafeInitialElements = getHydrationSafeInitialElementsBySurface();
hydrationSafeInitialElements satisfies typeof nativeInitialBackendElementsBySurface;

const nativeAttachmentWithoutContent = {
  attachmentId: "native_attachment_metadata",
  attachmentKind: "image",
  attachmentName: "receipt.jpg",
  attachmentSizeBytes: 245678,
  displayText: "已选择附件：receipt.jpg",
  source: "native.composer.attachment.photo",
  text: "已选择附件：receipt.jpg（image，245678 bytes）。",
};
const intakeAttachmentPersistence = getAttachmentPersistenceRequest(
  nativeAttachmentWithoutContent,
  "conversation_attachment",
);
intakeAttachmentPersistence.kind satisfies "intake";
intakeAttachmentPersistence.request satisfies AttachmentIntakeRequest;

const nativeAttachmentWithContent = {
  attachmentId: "native_attachment_upload",
  attachmentKind: "file",
  attachmentName: "receipt.txt",
  attachmentType: "text/plain",
  base64Content: "5Ye656ef6YeR6aKdIDg4LjUg5YWD",
  displayText: "已选择附件：receipt.txt",
  source: "native.composer.attachment.file",
};
const uploadAttachmentPersistence = getAttachmentPersistenceRequest(
  nativeAttachmentWithContent,
  "conversation_attachment",
);
uploadAttachmentPersistence.kind satisfies "upload";
uploadAttachmentPersistence.request satisfies AttachmentUploadRequest;

const nativeAttachmentDebugLabel = getNativeInboundDebugLabel({
  id: "native_attachment_debug",
  payload: {
    attachmentId: "native_attachment_upload",
    attachmentKind: "file",
    attachmentName: "receipt.txt",
    base64Content: "5Ye656ef6YeR6aKdIDg4LjUg5YWD",
    inputKind: "attachment",
    source: "native.composer.attachment.file",
  },
  sentAt: "2026-05-28T08:00:00.000Z",
  type: "native.inputSubmitted",
});
if (nativeAttachmentDebugLabel.includes("base64Content")) {
  throw new Error("native inbound debug label must not expose base64 content");
}

const calendarSyncPermissionStatus = getNativeErrorExecutionStatus({
  id: "native_calendar_permission_denied",
  payload: {
    reason: "未获得日历权限，日程已保存但不会写入系统日历",
    source: "native.calendar.events.sync",
  },
  sentAt: "2026-05-28T08:00:00.000Z",
  type: "native.error",
});
calendarSyncPermissionStatus.status satisfies "completed";

const voicePermissionStatus = getNativeErrorExecutionStatus({
  id: "native_voice_permission_denied",
  payload: {
    reason: "未获得语音识别权限",
    source: "native.composer.voice",
  },
  sentAt: "2026-05-28T08:00:00.000Z",
  type: "native.error",
});
voicePermissionStatus.status satisfies "failed";

const keyboardAckStatus = getNativeAckExecutionStatus({
  id: "native_keyboard_ack",
  payload: {
    receivedType: "input.keyboard.open",
    source: "h5.input.keyboard.open",
    status: "opened",
  },
  sentAt: "2026-05-28T08:00:00.000Z",
  type: "native.ack",
});
if (keyboardAckStatus?.status !== "completed") {
  throw new Error("keyboard native ack should complete the bridge status");
}
