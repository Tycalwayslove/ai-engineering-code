"use client";

export type H5ToNativeMessageType =
  | "h5.ready"
  | "ui.openTimeline"
  | "ui.openCalendar"
  | "ui.openExecutionLedger"
  | "input.voice.start"
  | "input.keyboard.open";

export type NativeToH5MessageType =
  | "native.hostContext"
  | "native.viewChanged"
  | "native.inputRequested"
  | "native.inputSubmitted"
  | "native.themeChanged"
  | "native.ack"
  | "native.error";

export type NativeBridgeMessageType =
  | H5ToNativeMessageType
  | NativeToH5MessageType;

export type NativeBridgePayload = Record<string, unknown>;

export type NativeBridgeEnvelope = {
  id: string;
  payload?: NativeBridgePayload;
  replyTo?: string;
  sentAt: string;
  type: NativeBridgeMessageType;
};

export type NativeHostContext = {
  bridgeVersion: string;
  h5URL?: string;
  platform: "ios";
};

type NativeBridgeHandler = {
  postMessage: (message: NativeBridgeEnvelope) => void;
};

declare global {
  interface Window {
    __AI_NATIVE_HOST__?: NativeHostContext;
    webkit?: {
      messageHandlers?: {
        NativeBridge?: NativeBridgeHandler;
      };
    };
  }
}

const nativeMessageEventName = "ai-native-message";

function bridgeLog(message: string, detail?: unknown) {
  if (typeof console === "undefined") {
    return;
  }

  console.info(`[AIH5Bridge] ${message}`, detail ?? "");
}

function createMessageId(type: NativeBridgeMessageType) {
  const randomPart =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  return `${type.replaceAll(".", "_")}_${randomPart}`;
}

export function isNativeBridgeAvailable() {
  if (typeof window === "undefined") {
    return false;
  }

  return Boolean(window.webkit?.messageHandlers?.NativeBridge);
}

export function getNativeHostContext() {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.__AI_NATIVE_HOST__;
}

export function postNativeBridgeMessage(
  type: H5ToNativeMessageType,
  payload: NativeBridgePayload = {},
) {
  const envelope: NativeBridgeEnvelope = {
    id: createMessageId(type),
    payload,
    sentAt: new Date().toISOString(),
    type,
  };

  if (!isNativeBridgeAvailable()) {
    bridgeLog("outbound skipped: NativeBridge unavailable", envelope);
    return {
      delivered: false,
      envelope,
      reason: "NativeBridge is not available in this host.",
    } as const;
  }

  bridgeLog("outbound", envelope);
  window.webkit?.messageHandlers?.NativeBridge?.postMessage(envelope);

  return {
    delivered: true,
    envelope,
  } as const;
}

export function subscribeNativeBridge(
  onMessage: (message: NativeBridgeEnvelope) => void,
) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const listener = (event: Event) => {
    const customEvent = event as CustomEvent<NativeBridgeEnvelope>;
    bridgeLog("inbound", customEvent.detail);
    onMessage(customEvent.detail);
  };

  window.addEventListener(nativeMessageEventName, listener);

  return () => {
    window.removeEventListener(nativeMessageEventName, listener);
  };
}
