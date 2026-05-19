import {
  Button,
  ComposerBar,
  ConfirmationCard,
  ExecutionStatusBar,
  Icon,
  IconButton,
  MessageBubble,
  MobileAgentShell,
  StatusBadge,
  TimelineDrawer,
  aiTimeDesignTokens,
  iconNames,
  type TimelineDay,
} from "@ai-code/shared-ui";

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

export default function DesignSystemPage() {
  return (
    <main className="design-system-page">
      <section className="design-system-hero">
        <p>AI Time Management Agent</p>
        <h1>本地组件库 v0.5</h1>
        <span>
          设计令牌、基础组件、组合组件、移动端布局和本地 SVG 图标资产。
        </span>
      </section>

      <section className="design-system-section">
        <div className="section-heading">
          <h2>Tokens</h2>
          <p>组件默认使用统一令牌，避免每个页面散落原始颜色和间距。</p>
        </div>
        <div className="token-grid">
          {Object.entries(aiTimeDesignTokens.color)
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
          <h2>Mobile Shell</h2>
          <p>Hybrid H5 主内容区固定 header、滚动对话区、状态栏和输入区。</p>
        </div>
        <div className="phone-frame">
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
              <ExecutionStatusBar description="后台处理中" status="executing" />
            }
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
        </div>
      </section>
    </main>
  );
}
