import {
  Button,
  ComposerBar,
  ConfirmationCard,
  createAiTimeThemeCssVariables,
  ExecutionStatusBar,
  HybridHostShell,
  Icon,
  IconButton,
  MessageBubble,
  MobileAgentShell,
  StatusBadge,
  TimelineDrawer,
  aiTimeDesignTokens,
  aiTimeThemeNames,
  aiTimeThemeValues,
  iconNames,
  type AiTimeThemeName,
  type TimelineDay,
} from "@ai-code/shared-ui";
import type { CSSProperties } from "react";

const timelineDays: TimelineDay[] = [
  {
    date: "19",
    events: [
      {
        id: "daily",
        time: "09:30 -> 10:00",
        title: "团队站会",
        tone: "info",
      },
      {
        id: "review",
        time: "16:00 -> 17:00",
        title: "设计 Review",
        tone: "primary",
      },
    ],
    id: "2026-05-19",
    selected: true,
    weekday: "周二",
    yearLabel: "2026 五月",
  },
  {
    date: "20",
    events: [
      {
        id: "planning",
        time: "18:00 -> 19:30",
        title: "新年业务规划会议",
        tone: "warning",
      },
    ],
    id: "2026-05-20",
    weekday: "周三",
  },
  {
    date: "21",
    events: [
      {
        id: "focus",
        time: "14:00 -> 16:00",
        title: "深度工作",
        tone: "success",
      },
    ],
    id: "2026-05-21",
    weekday: "周四",
  },
];

const themeLabels: Record<AiTimeThemeName, string> = {
  dark: "深色模式",
  light: "浅色模式",
};

const themeDescriptions: Record<AiTimeThemeName, string> = {
  dark: "适合沉浸式对话、夜间使用和高专注执行流。",
  light: "适合白天、办公场景和面试展示时的长时间阅读。",
};

function asStyleVariables(theme: AiTimeThemeName): CSSProperties {
  return createAiTimeThemeCssVariables(theme) as CSSProperties;
}

function ThemePhonePreview({ theme }: { theme: AiTimeThemeName }) {
  return (
    <article className="theme-preview" style={asStyleVariables(theme)}>
      <div className="theme-preview-header">
        <div>
          <strong>{themeLabels[theme]}</strong>
          <span>{themeDescriptions[theme]}</span>
        </div>
        <StatusBadge tone={theme === "dark" ? "primary" : "info"}>
          {theme}
        </StatusBadge>
      </div>
      <MobileAgentShell
        bottom={<ComposerBar />}
        header={
          <div className="mobile-header-demo">
            <IconButton icon="menu" label="打开 Timeline" />
            <div>
              <strong>AI 日程执行</strong>
              <span>主题预览</span>
            </div>
            <IconButton icon="calendar" label="打开完整日历" />
          </div>
        }
        status={
          <ExecutionStatusBar
            description="主题不改变执行语义"
            status="executing"
          />
        }
      >
        <MessageBubble roleTone="assistant">
          我会先补齐缺失信息，再让你确认是否写入日程。
        </MessageBubble>
        <MessageBubble roleTone="user">
          明天下午三点安排一个业务规划会。
        </MessageBubble>
        <ConfirmationCard
          actions={[
            {
              id: `${theme}-planning`,
              label: "业务规划会",
              meta: "明天 15:00 -> 16:00，默认提醒 30 分钟",
            },
          ]}
          description="组件只消费语义 token，主题只替换变量值。"
          title="确认 1 项操作"
        />
      </MobileAgentShell>
    </article>
  );
}

export default function DesignSystemPage() {
  return (
    <main className="design-system-page">
      <section className="design-system-hero">
        <p>AI Time Management Agent</p>
        <h1>本地组件库 v0.7</h1>
        <span>
          设计令牌、主题系统、基础组件、组合组件、移动端布局和本地 SVG
          图标资产。
        </span>
      </section>

      <section className="design-system-section">
        <div className="section-heading">
          <h2>Theme Modes</h2>
          <p>
            组件只依赖语义
            token。当前先支持深色和浅色，后续新增主题时只扩展主题值，不改组件层级。
          </p>
        </div>
        <div className="theme-grid">
          {aiTimeThemeNames.map((theme) => (
            <ThemePhonePreview key={theme} theme={theme} />
          ))}
        </div>
      </section>

      <section className="design-system-section">
        <div className="section-heading">
          <h2>Tokens</h2>
          <p>色彩 token 按主题分层，间距、圆角、字体、动效保持跨主题稳定。</p>
        </div>
        <div className="token-grid">
          {Object.entries(aiTimeThemeValues.dark.color)
            .slice(0, 12)
            .map(([name, value]) => (
              <article key={name}>
                <span style={{ background: value }} />
                <strong>{name}</strong>
                <code>{value}</code>
              </article>
            ))}
        </div>
      </section>

      <section className="design-system-section">
        <div className="section-heading">
          <h2>Primitives</h2>
          <p>低层组件只负责可访问性、触控尺寸、状态和视觉一致性。</p>
        </div>
        <div className="component-row">
          <Button tone="primary">确认</Button>
          <Button tone="secondary">取消</Button>
          <Button tone="danger">删除</Button>
          <Button tone="ghost">更多</Button>
          <IconButton icon="menu" label="打开 Timeline" />
          <IconButton icon="calendar" label="打开日历" selected />
          <StatusBadge tone="success">已完成</StatusBadge>
          <StatusBadge tone="warning">待确认</StatusBadge>
        </div>
      </section>

      <section className="design-system-section">
        <div className="section-heading">
          <h2>Icons</h2>
          <p>
            图标以 React 组件和本地 SVG 双形态存在，后续可替换为 Lucide 子集。
          </p>
        </div>
        <div className="icon-grid">
          {iconNames.map((name) => (
            <article key={name}>
              <Icon name={name} />
              <span>{name}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="design-system-section">
        <div className="section-heading">
          <h2>Composites</h2>
          <p>组合组件承载产品稳定模式，但不拥有后端、SDK 或业务流程。</p>
        </div>
        <div className="component-grid">
          <div className="demo-surface">
            <MessageBubble roleTone="assistant">
              我理解为：明天 18:00 到 19:30 创建“新年业务规划会议”。
            </MessageBubble>
            <MessageBubble roleTone="user">
              对，帮我记一下，并提前 30 分钟提醒。
            </MessageBubble>
            <ExecutionStatusBar
              description="将写入 1 个日程"
              status="confirming"
            />
            <ConfirmationCard
              actions={[
                {
                  id: "planning-meeting",
                  label: "新年业务规划会议",
                  meta: "周三 18:00 -> 19:30，提前 30 分钟提醒",
                },
              ]}
              description="执行前由用户显式确认，后端再写入日程领域。"
              title="确认 1 项操作"
            />
            <ComposerBar />
          </div>
          <TimelineDrawer days={timelineDays} />
        </div>
      </section>

      <section className="design-system-section">
        <div className="section-heading">
          <h2>Hybrid Host Shell</h2>
          <p>
            H5、iOS 和 Android 共用同一套 Agent
            Surface，宿主差异只进入安全区和外壳样式。
          </p>
        </div>
        <div className="phone-frame">
          <HybridHostShell
            platform="ios"
            previewLabel="iOS Hybrid H5 preview"
            style={{ height: 760, minHeight: 0 }}
          >
            <MobileAgentShell
              bottom={<ComposerBar />}
              header={
                <div className="mobile-header-demo">
                  <IconButton icon="menu" label="打开 Timeline" />
                  <div>
                    <strong>AI 日程执行</strong>
                    <span>日程领域</span>
                  </div>
                  <IconButton icon="calendar" label="打开完整日历" />
                </div>
              }
              status={
                <ExecutionStatusBar
                  description="后台处理中"
                  status="executing"
                />
              }
              style={{ height: "100%", minHeight: 0 }}
            >
              <MessageBubble roleTone="assistant">
                你可以直接说时间和事项，我会在确认后创建日程。
              </MessageBubble>
              <MessageBubble roleTone="user">
                明天下午三点和张伟开会。
              </MessageBubble>
              <MessageBubble roleTone="assistant">
                还缺少会议时长，我建议默认 1 小时。是否确认？
              </MessageBubble>
            </MobileAgentShell>
          </HybridHostShell>
        </div>
      </section>
    </main>
  );
}
