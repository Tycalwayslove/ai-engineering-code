"use client";

import {
  ConfirmationCard,
  createAiTimeThemeCssVariables,
  MessageBubble,
  StatusBadge,
  type AiTimeThemeName,
  type ExecutionStatus,
} from "@ai-code/shared-ui";
import type { CSSProperties, RefObject } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  getNativeHostContext,
  postNativeBridgeMessage,
  subscribeNativeBridge,
  type NativeBridgeEnvelope,
  type NativeHostContext,
} from "./bridge";
import { demoBackendElementsBySurface } from "./demoData";
import type { AgentSurface, AgentTheme, BackendRenderedElement } from "./types";

type RuntimeExecutionStatus = {
  description: string;
  status: ExecutionStatus;
};

const surfaceLabels: Record<AgentSurface, string> = {
  calendar: "日程元素",
  conversation: "执行流元素",
  ledger: "执行记录元素",
  timeline: "Timeline 元素",
};

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
  return params.get("bridgeDebug") === "1" || params.get("native") === "ios";
}

function getSurfaceFromNativeMessage(message: NativeBridgeEnvelope) {
  if (message.type !== "native.viewChanged") {
    return undefined;
  }

  const view = message.payload?.view;

  return view === "calendar" ||
    view === "conversation" ||
    view === "ledger" ||
    view === "timeline"
    ? view
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

  const text = message.payload?.text;

  return typeof text === "string" && text.trim().length > 0
    ? text.trim()
    : undefined;
}

function inferScheduleDraft(text: string) {
  const title = text.includes("规划")
    ? "新年业务规划会"
    : text.includes("站会")
      ? "团队站会"
      : text.includes("截图") || text.includes("图片")
        ? "截图识别出的日程"
        : text.includes("会")
          ? "会议安排"
          : "新的日程安排";

  const time =
    text.includes("三点") || text.includes("15")
      ? "明天 15:00 -> 16:30"
      : text.includes("今晚")
        ? "今晚 20:00 -> 21:00"
        : text.includes("上午")
          ? "明天 10:00 -> 11:00"
          : "明天 15:00 -> 16:00";

  return {
    reminder: "提前 30 分钟提醒",
    time,
    title,
  };
}

function makeInteractionElements(text: string, sequence: number) {
  const draft = inferScheduleDraft(text);
  const idPrefix = `mock-${sequence}`;

  const conversationElements: BackendRenderedElement[] = [
    {
      content: text,
      id: `${idPrefix}-user`,
      kind: "message",
      role: "user",
    },
    {
      content: `已收到：${text}`,
      id: `${idPrefix}-received`,
      kind: "message",
      role: "assistant",
    },
    {
      content: `我已解析你的指令：创建“${draft.title}”，时间为 ${draft.time}，${draft.reminder}。你可以确认写入，也可以继续补充地点、参会人或备注。`,
      id: `${idPrefix}-assistant`,
      kind: "message",
      role: "assistant",
    },
    {
      actions: [
        {
          id: `${idPrefix}-action`,
          label: draft.title,
          meta: `${draft.time}，${draft.reminder}`,
        },
      ],
      description:
        "这是无后端 mock 执行流：确认后会在 H5 内更新执行记录和日程摘要。",
      id: `${idPrefix}-confirmation`,
      kind: "confirmation",
      title: "确认 1 项日程操作",
    },
  ];

  const calendarElement: BackendRenderedElement = {
    id: `${idPrefix}-calendar`,
    items: [
      {
        id: `${idPrefix}-calendar-row`,
        label: draft.title,
        meta: `${draft.time}，待确认`,
        tone: "warning",
      },
      {
        id: `${idPrefix}-calendar-free`,
        label: "可用时间",
        meta: "确认后将写入内部日历",
        tone: "success",
      },
    ],
    kind: "summary-list",
    title: "Mock 后端返回：日程候选",
  };

  const ledgerElement: BackendRenderedElement = {
    id: `${idPrefix}-ledger`,
    items: [
      {
        completed: true,
        id: `${idPrefix}-understand`,
        label: "理解用户指令",
        meta: text,
      },
      {
        completed: true,
        id: `${idPrefix}-plan`,
        label: "生成日程草案",
        meta: `${draft.title}｜${draft.time}`,
      },
      {
        completed: false,
        id: `${idPrefix}-confirm`,
        label: "等待用户确认",
        meta: "确认后写入内部日历 mock store",
      },
    ],
    kind: "ledger",
    title: "Mock 后端返回：执行步骤",
  };

  const timelineElement: BackendRenderedElement = {
    id: `${idPrefix}-timeline`,
    items: [
      {
        id: `${idPrefix}-timeline-row`,
        label: draft.title,
        meta: `${draft.time}｜${draft.reminder}`,
        tone: "warning",
      },
      {
        id: `${idPrefix}-timeline-context`,
        label: "上下文关联",
        meta: "由对话指令生成，等待确认",
        tone: "info",
      },
    ],
    kind: "summary-list",
    title: "Mock 后端返回：Timeline 更新",
  };

  return {
    calendarElement,
    conversationElements,
    draft,
    ledgerElement,
    timelineElement,
  };
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
      {(["conversation", "timeline", "calendar", "ledger"] as const).map(
        (surface) => (
          <button
            aria-pressed={activeSurface === surface}
            className="ai-agent-segmented-button"
            key={surface}
            onClick={() => onSurfaceChange(surface)}
            type="button"
          >
            {surfaceLabels[surface]}
          </button>
        ),
      )}
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
}: {
  element: BackendRenderedElement;
  onCancel: () => void;
  onConfirm: () => void;
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
        description={element.description}
        onCancel={onCancel}
        onConfirm={onConfirm}
        title={element.title}
      />
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
          <div className="ai-agent-backend-row" key={item.id}>
            <StatusBadge tone={item.tone}>{item.label}</StatusBadge>
            <span>{item.meta}</span>
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
  surfaceRef,
  surface,
}: {
  elements: BackendRenderedElement[];
  onCancel: () => void;
  onConfirm: () => void;
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
        <strong>Backend-rendered elements</strong>
      </div>
      {elements.map((element) => (
        <BackendElementCard
          element={element}
          key={element.id}
          onCancel={onCancel}
          onConfirm={onConfirm}
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
  const [elementsBySurface, setElementsBySurface] = useState(
    demoBackendElementsBySurface,
  );
  const [executionStatus, setExecutionStatus] =
    useState<RuntimeExecutionStatus>(initialExecutionStatus);
  const [hostContext, setHostContext] = useState<NativeHostContext>();
  const [nativePlatform, setNativePlatform] = useState<"ios" | undefined>();
  const [theme, setTheme] = useState<AgentTheme>("dark");
  const interactionSequenceRef = useRef(0);
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

  function handleSubmittedText(text: string) {
    interactionSequenceRef.current += 1;
    const sequence = interactionSequenceRef.current;
    const {
      calendarElement,
      conversationElements,
      draft,
      ledgerElement,
      timelineElement,
    } = makeInteractionElements(text, sequence);

    setActiveSurface("conversation");
    setExecutionStatus({
      description: "正在理解你的自然语言指令",
      status: "understanding",
    });

    setElementsBySurface((current) => ({
      calendar: [calendarElement, ...current.calendar].slice(0, 4),
      conversation: [...current.conversation, ...conversationElements],
      ledger: [ledgerElement, ...current.ledger].slice(0, 4),
      timeline: [timelineElement, ...current.timeline].slice(0, 4),
    }));

    scheduleStatus(
      {
        description: `已生成“${draft.title}”的日程草案`,
        status: "planning",
      },
      420,
    );
    scheduleStatus(
      {
        description: `等待确认：${draft.time}，${draft.reminder}`,
        status: "confirming",
      },
      900,
    );
  }

  function handleConfirm() {
    setExecutionStatus({
      description: "已写入内部日历 mock store，并更新执行记录",
      status: "completed",
    });

    setElementsBySurface((current) => ({
      ...current,
      conversation: [
        ...current.conversation,
        {
          content:
            "已确认并完成 1 项操作。现在你可以打开日历、Timeline 或执行记录查看 mock 结果。",
          id: `completed-${Date.now()}`,
          kind: "message",
          role: "assistant",
        },
      ],
      ledger: current.ledger.map((element) =>
        element.kind === "ledger"
          ? {
              ...element,
              items: element.items.map((item) => ({
                ...item,
                completed: true,
              })),
            }
          : element,
      ),
    }));
  }

  function handleCancel() {
    setExecutionStatus({
      description: "已取消本次 mock 操作，没有写入日程",
      status: "idle",
    });

    setElementsBySurface((current) => ({
      ...current,
      conversation: [
        ...current.conversation,
        {
          content: "已取消。你可以继续输入新的日程指令。",
          id: `cancelled-${Date.now()}`,
          kind: "message",
          role: "assistant",
        },
      ],
    }));
  }

  useEffect(() => {
    const detectedNativePlatform = getInitialNativePlatform();
    setNativePlatform(detectedNativePlatform);
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
        lastInbound: message.type,
        messageCount: current.messageCount + 1,
      }));

      if (message.type === "native.hostContext") {
        const context = message.payload as NativeHostContext;
        setHostContext(context);
        setNativePlatform(context.platform);
        return;
      }

      const nextTheme = getThemeFromNativeMessage(message);

      if (nextTheme) {
        setTheme(nextTheme);
        return;
      }

      const submittedText = getSubmittedTextFromNativeMessage(message);

      if (submittedText) {
        handleSubmittedText(submittedText);
        return;
      }

      const nextSurface = getSurfaceFromNativeMessage(message);

      if (nextSurface) {
        setActiveSurface(nextSurface);
        setExecutionStatus({
          description: `已切换到${surfaceLabels[nextSurface]}`,
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
          onConfirm={handleConfirm}
          surfaceRef={surfaceRef}
          surface={activeSurface}
        />
        <ExecutionStatusDock status={executionStatus} />
      </div>
    </main>
  );
}
