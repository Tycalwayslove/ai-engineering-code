"use client";

import {
  ConfirmationCard,
  createAiTimeThemeCssVariables,
  MessageBubble,
  StatusBadge,
  type AiTimeThemeName,
} from "@ai-code/shared-ui";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";

import {
  getNativeHostContext,
  postNativeBridgeMessage,
  subscribeNativeBridge,
  type NativeBridgeEnvelope,
  type NativeHostContext,
} from "./bridge";
import { demoBackendElementsBySurface } from "./demoData";
import type { AgentSurface, AgentTheme, BackendRenderedElement } from "./types";

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

function BackendElementCard({ element }: { element: BackendRenderedElement }) {
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
  surface,
}: {
  elements: BackendRenderedElement[];
  surface: AgentSurface;
}) {
  return (
    <section className="ai-agent-backend-surface" aria-label="后端元素渲染区">
      <div className="ai-agent-backend-heading">
        <span>{surfaceLabels[surface]}</span>
        <strong>Backend-rendered elements</strong>
      </div>
      {elements.map((element) => (
        <BackendElementCard element={element} key={element.id} />
      ))}
    </section>
  );
}

function ExecutionStatusDock({ surface }: { surface: AgentSurface }) {
  const statusCopy =
    surface === "conversation"
      ? {
          description: "已解析 1 项创建操作，等待确认",
          label: "confirming",
          title: "接口状态",
        }
      : {
          description: `正在同步 ${surfaceLabels[surface]} 的后端元素`,
          label: "synced",
          title: "接口状态",
        };

  return (
    <section className="ai-agent-status-dock" aria-label="当前执行状态">
      <span className="ai-agent-status-dot" />
      <div>
        <strong>{statusCopy.title}</strong>
        <span>{statusCopy.description}</span>
      </div>
      <em>{statusCopy.label}</em>
    </section>
  );
}

export function AgentWorkbench() {
  const [activeSurface, setActiveSurface] =
    useState<AgentSurface>("conversation");
  const [hostContext, setHostContext] = useState<NativeHostContext | undefined>(
    getNativeHostContext(),
  );
  const [nativePlatform, setNativePlatform] = useState<"ios" | undefined>();
  const [theme, setTheme] = useState<AgentTheme>("dark");
  const style = useMemo(() => themeVariables(theme), [theme]);
  const showPreviewControls = nativePlatform === undefined;
  const elements = demoBackendElementsBySurface[activeSurface];

  useEffect(() => {
    const detectedNativePlatform = getInitialNativePlatform();
    setNativePlatform(detectedNativePlatform);

    const result = postNativeBridgeMessage("h5.ready", {
      route: window.location.pathname,
      surface: "conversation",
    });

    if (!result.delivered) {
      return undefined;
    }

    return subscribeNativeBridge((message) => {
      if (message.type === "native.hostContext") {
        const context = message.payload as NativeHostContext;
        setHostContext(context);
        setNativePlatform(context.platform);
        return;
      }

      const nextSurface = getSurfaceFromNativeMessage(message);

      if (nextSurface) {
        setActiveSurface(nextSurface);
      }
    });
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
        <BackendElementSurface elements={elements} surface={activeSurface} />
        <ExecutionStatusDock surface={activeSurface} />
      </div>
    </main>
  );
}
