import type { HTMLAttributes } from "react";
import { Icon } from "../icons";
import { StatusBadge } from "../primitives";
import { aiTimeDesignTokens } from "../tokens";

export type TimelineEvent = {
  id: string;
  title: string;
  time: string;
  tone?: "primary" | "success" | "warning" | "danger" | "info";
};

export type TimelineDay = {
  id: string;
  date: string;
  weekday: string;
  yearLabel?: string;
  selected?: boolean;
  events: TimelineEvent[];
};

export type TimelineDrawerProps = HTMLAttributes<HTMLElement> & {
  days: TimelineDay[];
  title?: string;
};

export function TimelineDrawer({
  days,
  style,
  title = "Timeline",
  ...props
}: TimelineDrawerProps) {
  return (
    <aside
      aria-label={title}
      style={{
        background: aiTimeDesignTokens.color.backgroundElevated,
        borderRight: `1px solid ${aiTimeDesignTokens.color.border}`,
        color: aiTimeDesignTokens.color.text,
        display: "grid",
        gridTemplateColumns: "72px 1fr",
        maxWidth: 380,
        minHeight: 620,
        overflow: "hidden",
        ...style,
      }}
      {...props}
    >
      <div
        style={{
          alignItems: "center",
          background: aiTimeDesignTokens.color.backgroundInset,
          display: "grid",
          justifyItems: "center",
          padding: "18px 0",
        }}
      >
        <Icon name="timeline" size={22} />
        <span
          style={{
            color: aiTimeDesignTokens.color.primary,
            fontFamily: aiTimeDesignTokens.font.family,
            fontSize: aiTimeDesignTokens.font.size.xs,
            fontWeight: aiTimeDesignTokens.font.weight.semibold,
            letterSpacing: 0,
            writingMode: "vertical-rl",
          }}
        >
          {days[0]?.yearLabel ?? "2026"}
        </span>
      </div>
      <div style={{ overflowY: "auto" }}>
        {days.map((day) => (
          <section
            key={day.id}
            style={{
              borderBottom: `1px solid ${aiTimeDesignTokens.color.border}`,
              display: "grid",
              gridTemplateColumns: "70px 1fr",
              minHeight: 112,
            }}
          >
            <div
              style={{
                alignItems: "center",
                color: day.selected
                  ? aiTimeDesignTokens.color.text
                  : aiTimeDesignTokens.color.textMuted,
                display: "grid",
                justifyItems: "center",
                padding: "16px 0",
              }}
            >
              <span
                style={{
                  fontFamily: aiTimeDesignTokens.font.family,
                  fontSize: aiTimeDesignTokens.font.size.xs,
                  lineHeight: 1,
                }}
              >
                {day.weekday}
              </span>
              <strong
                style={{
                  alignItems: "center",
                  background: day.selected
                    ? aiTimeDesignTokens.color.dateSelected
                    : "transparent",
                  borderRadius: aiTimeDesignTokens.radius.md,
                  color: day.selected
                    ? aiTimeDesignTokens.color.dateSelectedText
                    : "inherit",
                  display: "inline-flex",
                  fontFamily: aiTimeDesignTokens.font.family,
                  fontSize: aiTimeDesignTokens.font.size["2xl"],
                  justifyContent: "center",
                  lineHeight: 1,
                  minHeight: 54,
                  minWidth: 46,
                }}
              >
                {day.date}
              </strong>
            </div>
            <div
              style={{
                display: "grid",
                gap: aiTimeDesignTokens.space[2],
                padding: "16px 14px",
              }}
            >
              {day.events.slice(0, 3).map((event) => (
                <div
                  key={event.id}
                  style={{
                    borderLeft: `4px solid ${aiTimeDesignTokens.color[event.tone ?? "info"]}`,
                    display: "grid",
                    gap: 2,
                    paddingLeft: aiTimeDesignTokens.space[3],
                  }}
                >
                  <strong
                    style={{
                      fontFamily: aiTimeDesignTokens.font.family,
                      fontSize: aiTimeDesignTokens.font.size.md,
                      lineHeight: aiTimeDesignTokens.font.lineHeight.normal,
                    }}
                  >
                    {event.title}
                  </strong>
                  <span
                    style={{
                      color: aiTimeDesignTokens.color.textMuted,
                      fontFamily: aiTimeDesignTokens.font.family,
                      fontSize: aiTimeDesignTokens.font.size.sm,
                    }}
                  >
                    {event.time}
                  </span>
                </div>
              ))}
              {day.events.length > 3 ? (
                <StatusBadge tone="info">
                  +{day.events.length - 3} 更多
                </StatusBadge>
              ) : null}
            </div>
          </section>
        ))}
      </div>
    </aside>
  );
}
