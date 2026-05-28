import type {
  H5ToNativeMessageType,
  NativeBridgeEnvelope,
  NativeSurfaceName,
  NativeToH5MessageType,
} from "./bridge";

const h5ToNativeMessages = [
  "h5.ready",
  "ui.openTimeline",
  "ui.openCalendar",
  "ui.openExecutionLedger",
  "input.voice.start",
  "input.voice.stop",
  "calendar.events.sync",
  "notifications.reminders.sync",
  "input.keyboard.open",
] as const;

const nativeToH5Messages = [
  "native.hostContext",
  "native.viewChanged",
  "native.inputRequested",
  "native.inputSubmitted",
  "native.themeChanged",
  "native.ack",
  "native.error",
] as const;

h5ToNativeMessages satisfies readonly H5ToNativeMessageType[];
nativeToH5Messages satisfies readonly NativeToH5MessageType[];

const nativeSurfaces = [
  "conversation",
  "timeline",
  "calendar",
  "expenses",
  "reminders",
  "ledger",
  "settings",
] as const;

nativeSurfaces satisfies readonly NativeSurfaceName[];

const readyMessage = {
  id: "h5_ready_contract",
  payload: {
    route: "/",
  },
  sentAt: "2026-05-20T08:00:00.000Z",
  type: "h5.ready",
} satisfies NativeBridgeEnvelope;

const nativeAttachmentMessage = {
  id: "native_attachment_contract",
  payload: {
    attachmentId: "native_attachment_001",
    attachmentKind: "image",
    attachmentName: "receipt.jpg",
    attachmentSizeBytes: "245678",
    attachmentType: "public.jpeg",
    base64Content: "5Ye656ef6YeR6aKdIDg4LjUg5YWD",
    inputKind: "attachment",
    source: "native.composer.attachment.photo",
    text: "已选择附件：receipt.jpg（image，245678 bytes）。",
  },
  sentAt: "2026-05-27T08:00:00.000Z",
  type: "native.inputSubmitted",
} satisfies NativeBridgeEnvelope;

readyMessage satisfies NativeBridgeEnvelope;
nativeAttachmentMessage satisfies NativeBridgeEnvelope;
