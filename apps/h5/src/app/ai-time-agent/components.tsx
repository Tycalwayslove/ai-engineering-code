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
import type { CSSProperties } from "react";
import { useMemo, useState } from "react";

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
  android: "Android 原生壳 + H5 WebView",
  h5: "浏览器 / WebView 通用布局",
  ios: "iOS 原生壳 + H5 WebView",
};

function themeVariables(theme: AiTimeThemeName): CSSProperties {
  return createAiTimeThemeCssVariables(theme) as CSSProperties;
}

function AgentHeader() {
  return (
    <div className="ai-agent-header">
      <IconButton icon="menu" label="打开 Timeline" />
      <div className="ai-agent-header-copy">
        <strong>AI 日程执行</strong>
        <span>对话中完成时间管理</span>
      </div>
      <div className="ai-agent-header-actions">
        <IconButton icon="clock" label="查看执行记录" />
        <IconButton icon="calendar" label="打开完整日历" />
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
  hostPlatform,
  onHostPlatformChange,
  onThemeChange,
  theme,
}: {
  hostPlatform: HybridHostPlatform;
  onHostPlatformChange: (platform: HybridHostPlatform) => void;
  onThemeChange: (theme: AgentTheme) => void;
  theme: AgentTheme;
}) {
  return (
    <section className="ai-agent-preview-controls" aria-label="开发预览控制">
      <div>
        <strong>{hostLabels[hostPlatform]} Hybrid Layout</strong>
        <span>{hostDescriptions[hostPlatform]}</span>
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

function ConversationPanel({ messages }: { messages: ConversationMessage[] }) {
  return (
    <section className="ai-agent-conversation" aria-label="AI 执行流">
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

function ExecutionLedgerPreview({ items }: { items: ExecutionLedgerItem[] }) {
  return (
    <section className="ai-agent-ledger" aria-label="执行记录预览">
      <div className="ai-agent-section-heading">
        <strong>执行记录</strong>
        <span>当前只是演示状态</span>
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

export function AgentWorkbench() {
  const [hostPlatform, setHostPlatform] = useState<HybridHostPlatform>("ios");
  const [theme, setTheme] = useState<AgentTheme>("dark");
  const style = useMemo(() => themeVariables(theme), [theme]);

  return (
    <main
      className="ai-agent-page"
      data-hybrid-platform={hostPlatform}
      style={style}
    >
      <PreviewControls
        hostPlatform={hostPlatform}
        onHostPlatformChange={setHostPlatform}
        onThemeChange={setTheme}
        theme={theme}
      />
      <div className="ai-agent-stage">
        <div className="ai-agent-device">
          <HybridHostShell
            platform={hostPlatform}
            previewLabel={`${hostLabels[hostPlatform]} Hybrid H5 preview`}
            style={{ height: "100%", minHeight: 0 }}
          >
            <MobileAgentShell
              bottom={<ComposerBar placeholder="按住说话" />}
              header={<AgentHeader />}
              status={
                <ExecutionStatusBar
                  description={demoExecutionStatus.description}
                  status={demoExecutionStatus.status}
                />
              }
              style={{ height: "100%", minHeight: 0 }}
            >
              <QuickStats stats={demoQuickStats} />
              <ConversationPanel messages={demoConversation} />
              <ExecutionLedgerPreview items={demoLedgerItems} />
            </MobileAgentShell>
          </HybridHostShell>
        </div>
        <TimelinePanel />
      </div>
    </main>
  );
}
