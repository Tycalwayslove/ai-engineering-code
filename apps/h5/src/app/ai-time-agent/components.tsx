"use client";

import {
  ComposerBar,
  ConfirmationCard,
  createAiTimeThemeCssVariables,
  ExecutionStatusBar,
  HybridHostShell,
  hybridHostPlatforms,
  IconButton,
  MessageBubble,
  MobileAgentShell,
  StatusBadge,
  TimelineDrawer,
  type AiTimeThemeName,
  type HybridHostPlatform,
} from "@ai-code/shared-ui";
import type { CSSProperties, FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";

import {
  getNativeHostContext,
  postNativeBridgeMessage,
  subscribeNativeBridge,
  type NativeHostContext,
} from "./bridge";
import {
  demoConfirmationActions,
  demoConversation,
  demoExecutionStatus,
  demoLedgerItems,
  demoQuickStats,
  demoTimelineDays,
} from "./demoData";
import type {
  AgentTheme,
  ConversationMessage,
  ExecutionLedgerItem,
  QuickStat,
} from "./types";

type AgentView = "conversation" | "timeline" | "calendar" | "ledger";

const themeLabels: Record<AgentTheme, string> = {
  dark: "深色",
  light: "浅色",
};

const hostLabels: Record<HybridHostPlatform, string> = {
  android: "Android",
  h5: "H5",
  ios: "iOS",
};

const hostDescriptions: Record<HybridHostPlatform, string> = {
  android: "Android 原生壳后续计划",
  h5: "浏览器 / WebView 通用布局",
  ios: "iOS 原生壳 + H5 WebView",
};

const viewLabels: Record<AgentView, string> = {
  calendar: "完整日历",
  conversation: "AI 执行流",
  ledger: "执行记录",
  timeline: "Timeline",
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

function AgentHeader({
  activeView,
  onViewChange,
}: {
  activeView: AgentView;
  onViewChange: (view: AgentView, source: string) => void;
}) {
  return (
    <div className="ai-agent-header">
      <IconButton
        icon="menu"
        label="打开 Timeline"
        onClick={() => onViewChange("timeline", "header.menu")}
        selected={activeView === "timeline"}
      />
      <div className="ai-agent-header-copy">
        <strong>{viewLabels[activeView]}</strong>
        <span>对话中完成时间管理</span>
      </div>
      <div className="ai-agent-header-actions">
        <IconButton
          icon="clock"
          label="查看执行记录"
          onClick={() => onViewChange("ledger", "header.ledger")}
          selected={activeView === "ledger"}
        />
        <IconButton
          icon="calendar"
          label="打开完整日历"
          onClick={() => onViewChange("calendar", "header.calendar")}
          selected={activeView === "calendar"}
        />
      </div>
    </div>
  );
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

function HostSwitcher({
  activePlatform,
  onPlatformChange,
}: {
  activePlatform: HybridHostPlatform;
  onPlatformChange: (platform: HybridHostPlatform) => void;
}) {
  return (
    <div className="ai-agent-segmented-control" aria-label="宿主环境切换">
      {hybridHostPlatforms.map((platform) => (
        <button
          aria-pressed={activePlatform === platform}
          className="ai-agent-segmented-button"
          key={platform}
          onClick={() => onPlatformChange(platform)}
          type="button"
        >
          {hostLabels[platform]}
        </button>
      ))}
    </div>
  );
}

function PreviewControls({
  hostContext,
  hostPlatform,
  onHostPlatformChange,
  onThemeChange,
  theme,
}: {
  hostContext?: NativeHostContext;
  hostPlatform: HybridHostPlatform;
  onHostPlatformChange: (platform: HybridHostPlatform) => void;
  onThemeChange: (theme: AgentTheme) => void;
  theme: AgentTheme;
}) {
  return (
    <section className="ai-agent-preview-controls" aria-label="开发预览控制">
      <div>
        <strong>{hostLabels[hostPlatform]} Hybrid Layout</strong>
        <span>
          {hostContext
            ? `NativeBridge ${hostContext.bridgeVersion} 已连接`
            : hostDescriptions[hostPlatform]}
        </span>
      </div>
      <div className="ai-agent-control-stack">
        <HostSwitcher
          activePlatform={hostPlatform}
          onPlatformChange={onHostPlatformChange}
        />
        <ThemeSwitcher activeTheme={theme} onThemeChange={onThemeChange} />
      </div>
    </section>
  );
}

function QuickStats({ stats }: { stats: QuickStat[] }) {
  return (
    <section className="ai-agent-quick-stats" aria-label="日程概览">
      {stats.map((stat) => (
        <article className="ai-agent-quick-stat" key={stat.id}>
          <StatusBadge tone={stat.tone}>{stat.label}</StatusBadge>
          <strong>{stat.value}</strong>
        </article>
      ))}
    </section>
  );
}

function ConversationView({ messages }: { messages: ConversationMessage[] }) {
  return (
    <section className="ai-agent-conversation" aria-label="AI 执行流">
      <QuickStats stats={demoQuickStats} />
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          roleTone={message.role === "user" ? "user" : "assistant"}
        >
          {message.content}
        </MessageBubble>
      ))}
      <ConfirmationCard
        actions={demoConfirmationActions}
        description="执行前由你确认。真实写入会在后端日程领域完成。"
        title="确认 1 项操作"
      />
    </section>
  );
}

function ExecutionLedgerView({ items }: { items: ExecutionLedgerItem[] }) {
  return (
    <section
      className="ai-agent-ledger ai-agent-view-card"
      aria-label="执行记录"
    >
      <div className="ai-agent-section-heading">
        <strong>执行记录</strong>
        <span>Native 只接收状态，不编排业务</span>
      </div>
      <div className="ai-agent-ledger-list">
        {items.map((item) => (
          <article className="ai-agent-ledger-item" key={item.id}>
            <StatusBadge tone={item.completed ? "success" : "warning"}>
              {item.completed ? "完成" : "待确认"}
            </StatusBadge>
            <div>
              <strong>{item.label}</strong>
              <span>{item.meta}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function TimelineView() {
  return (
    <section className="ai-agent-timeline-view" aria-label="Timeline Drawer">
      <TimelineDrawer days={demoTimelineDays} title="本周 Timeline" />
    </section>
  );
}

function CalendarView() {
  return (
    <section className="ai-agent-calendar-view" aria-label="完整日历">
      <div className="ai-agent-section-heading">
        <strong>五月</strong>
        <span>H5 内部日历，后续由后端日程域驱动</span>
      </div>
      <div className="ai-agent-calendar-grid">
        {["一", "二", "三", "四", "五", "六", "日"].map((weekday) => (
          <span className="ai-agent-calendar-weekday" key={weekday}>
            {weekday}
          </span>
        ))}
        {Array.from({ length: 35 }, (_, index) => {
          const date = index - 2;
          const isCurrentMonth = date >= 1 && date <= 31;
          const isSelected = date === 20;
          const hasEvent = [20, 21, 22, 23].includes(date);

          return (
            <button
              className="ai-agent-calendar-day"
              data-current-month={isCurrentMonth}
              data-has-event={hasEvent}
              data-selected={isSelected}
              key={`${date}-${index}`}
              type="button"
            >
              <strong>{isCurrentMonth ? date : ""}</strong>
              {hasEvent ? <span /> : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function TimelinePanel() {
  return (
    <section className="ai-agent-timeline-panel" aria-label="Timeline Drawer">
      <div className="ai-agent-section-heading">
        <strong>Timeline</strong>
        <span>参考 Timepage 的日期轴辅助检查</span>
      </div>
      <TimelineDrawer days={demoTimelineDays} title="本周 Timeline" />
    </section>
  );
}

function AgentViewRouter({ activeView }: { activeView: AgentView }) {
  if (activeView === "timeline") {
    return <TimelineView />;
  }

  if (activeView === "calendar") {
    return <CalendarView />;
  }

  if (activeView === "ledger") {
    return <ExecutionLedgerView items={demoLedgerItems} />;
  }

  return <ConversationView messages={demoConversation} />;
}

export function AgentWorkbench() {
  const [activeView, setActiveView] = useState<AgentView>("conversation");
  const [hostContext, setHostContext] = useState<NativeHostContext | undefined>(
    getNativeHostContext(),
  );
  const [nativePlatform, setNativePlatform] = useState<"ios" | undefined>();
  const [hostPlatform, setHostPlatform] = useState<HybridHostPlatform>("ios");
  const [theme, setTheme] = useState<AgentTheme>("dark");
  const style = useMemo(() => themeVariables(theme), [theme]);
  const showPreviewControls = nativePlatform === undefined;

  useEffect(() => {
    const detectedNativePlatform = getInitialNativePlatform();
    setNativePlatform(detectedNativePlatform);

    if (detectedNativePlatform === "ios") {
      setHostPlatform("ios");
    }

    const result = postNativeBridgeMessage("h5.ready", {
      route: window.location.pathname,
    });

    if (!result.delivered) {
      return undefined;
    }

    return subscribeNativeBridge((message) => {
      if (message.type === "native.hostContext") {
        const context = message.payload as NativeHostContext;
        setHostContext(context);
        setNativePlatform(context.platform);
        setHostPlatform(context.platform);
      }
    });
  }, []);

  function openView(view: AgentView, source: string) {
    setActiveView(view);

    const messageType =
      view === "calendar"
        ? "ui.openCalendar"
        : view === "ledger"
          ? "ui.openExecutionLedger"
          : "ui.openTimeline";

    if (view !== "conversation") {
      postNativeBridgeMessage(messageType, { source, view });
    }
  }

  function submitVoiceIntent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    postNativeBridgeMessage("input.voice.start", {
      source: "composer",
    });
  }

  return (
    <main
      className="ai-agent-page"
      data-hybrid-platform={hostPlatform}
      data-native-embedded={nativePlatform === "ios"}
      style={style}
    >
      {showPreviewControls ? (
        <PreviewControls
          hostContext={hostContext}
          hostPlatform={hostPlatform}
          onHostPlatformChange={setHostPlatform}
          onThemeChange={setTheme}
          theme={theme}
        />
      ) : null}
      <div className="ai-agent-stage">
        <div className="ai-agent-device">
          <HybridHostShell
            platform={hostPlatform}
            previewLabel={`${hostLabels[hostPlatform]} Hybrid H5 preview`}
            style={{ height: "100%", minHeight: 0 }}
          >
            <MobileAgentShell
              bottom={
                <ComposerBar
                  onSubmit={submitVoiceIntent}
                  placeholder="按住说话"
                  trailing={
                    <IconButton
                      icon="keyboard"
                      label="切换键盘输入"
                      onClick={() =>
                        postNativeBridgeMessage("input.keyboard.open", {
                          source: "composer",
                        })
                      }
                    />
                  }
                />
              }
              header={
                <AgentHeader activeView={activeView} onViewChange={openView} />
              }
              status={
                <ExecutionStatusBar
                  description={
                    hostContext
                      ? "NativeBridge 已连接，等待后端执行域接入"
                      : demoExecutionStatus.description
                  }
                  status={demoExecutionStatus.status}
                />
              }
              style={{ height: "100%", minHeight: 0 }}
            >
              <AgentViewRouter activeView={activeView} />
            </MobileAgentShell>
          </HybridHostShell>
        </div>
        {showPreviewControls ? <TimelinePanel /> : null}
      </div>
    </main>
  );
}
