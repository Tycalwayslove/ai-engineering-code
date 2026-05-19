import type { HTMLAttributes } from "react";
import { Icon } from "../icons";
import { aiTimeDesignTokens } from "../tokens";

export type ExecutionStatus =
  | "idle"
  | "understanding"
  | "searching"
  | "planning"
  | "confirming"
  | "executing"
  | "completed"
  | "failed";

export type ExecutionStatusBarProps = HTMLAttributes<HTMLDivElement> & {
  description?: string;
  status: ExecutionStatus;
};

const statusMeta: Record<
  ExecutionStatus,
  { label: string; icon: "check" | "clock" | "sparkles"; color: string }
> = {
  idle: {
    color: aiTimeDesignTokens.color.textMuted,
    icon: "sparkles",
    label: "等待指令",
  },
  understanding: {
    color: aiTimeDesignTokens.color.info,
    icon: "sparkles",
    label: "理解中",
  },
  searching: {
    color: aiTimeDesignTokens.color.info,
    icon: "clock",
    label: "查询中",
  },
  planning: {
    color: aiTimeDesignTokens.color.warning,
    icon: "clock",
    label: "规划中",
  },
  confirming: {
    color: aiTimeDesignTokens.color.warning,
    icon: "clock",
    label: "等待确认",
  },
  executing: {
    color: aiTimeDesignTokens.color.primary,
    icon: "sparkles",
    label: "执行中",
  },
  completed: {
    color: aiTimeDesignTokens.color.success,
    icon: "check",
    label: "已完成",
  },
  failed: {
    color: aiTimeDesignTokens.color.danger,
    icon: "clock",
    label: "需要处理",
  },
};

export function ExecutionStatusBar({
  description,
  status,
  style,
  ...props
}: ExecutionStatusBarProps) {
  const meta = statusMeta[status];

  return (
    <div
      role="status"
      style={{
        alignItems: "center",
        background: aiTimeDesignTokens.color.surfaceGlass,
        border: `1px solid ${aiTimeDesignTokens.color.border}`,
        borderRadius: aiTimeDesignTokens.radius.pill,
        boxShadow: aiTimeDesignTokens.shadow.control,
        color: aiTimeDesignTokens.color.text,
        display: "flex",
        gap: aiTimeDesignTokens.space[2],
        justifyContent: "space-between",
        minHeight: 44,
        padding: "0 14px",
        width: "100%",
        ...style,
      }}
      {...props}
    >
      <span
        style={{
          alignItems: "center",
          color: meta.color,
          display: "inline-flex",
          fontFamily: aiTimeDesignTokens.font.family,
          fontSize: aiTimeDesignTokens.font.size.sm,
          fontWeight: aiTimeDesignTokens.font.weight.semibold,
          gap: aiTimeDesignTokens.space[2],
          lineHeight: 1,
        }}
      >
        <Icon name={meta.icon} size={18} />
        {meta.label}
      </span>
      {description ? (
        <span
          style={{
            color: aiTimeDesignTokens.color.textMuted,
            fontFamily: aiTimeDesignTokens.font.family,
            fontSize: aiTimeDesignTokens.font.size.xs,
            lineHeight: 1.3,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {description}
        </span>
      ) : null}
    </div>
  );
}
