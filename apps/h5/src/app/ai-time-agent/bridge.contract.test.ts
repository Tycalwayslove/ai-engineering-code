import type {
  H5ToNativeMessageType,
  NativeBridgeEnvelope,
  NativeToH5MessageType,
} from "./bridge";

const h5ToNativeMessages = [
  "h5.ready",
  "ui.openTimeline",
  "ui.openCalendar",
  "ui.openExecutionLedger",
  "input.voice.start",
  "input.keyboard.open",
] as const;

const nativeToH5Messages = [
  "native.hostContext",
  "native.ack",
  "native.error",
] as const;

h5ToNativeMessages satisfies readonly H5ToNativeMessageType[];
nativeToH5Messages satisfies readonly NativeToH5MessageType[];

const readyMessage = {
  id: "h5_ready_contract",
  payload: {
    route: "/",
  },
  sentAt: "2026-05-20T08:00:00.000Z",
  type: "h5.ready",
} satisfies NativeBridgeEnvelope;

readyMessage satisfies NativeBridgeEnvelope;
