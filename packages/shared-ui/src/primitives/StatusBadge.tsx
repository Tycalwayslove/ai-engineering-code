import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { aiTimeDesignTokens } from "../tokens";

export type StatusBadgeTone =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info";

export type StatusBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  tone?: StatusBadgeTone;
};

const toneStyles: Record<StatusBadgeTone, CSSProperties> = {
  default: {
    background: aiTimeDesignTokens.color.surfaceRaised,
    color: aiTimeDesignTokens.color.textMuted,
  },
  primary: {
    background: aiTimeDesignTokens.color.primarySoft,
    color: aiTimeDesignTokens.color.primary,
  },
  success: {
    background: aiTimeDesignTokens.color.successSoft,
    color: aiTimeDesignTokens.color.success,
  },
  warning: {
    background: aiTimeDesignTokens.color.warningSoft,
    color: aiTimeDesignTokens.color.warning,
  },
  danger: {
    background: aiTimeDesignTokens.color.dangerSoft,
    color: aiTimeDesignTokens.color.danger,
  },
  info: {
    background: aiTimeDesignTokens.color.infoSoft,
    color: aiTimeDesignTokens.color.info,
  },
};

export function StatusBadge({
  children,
  style,
  tone = "default",
  ...props
}: StatusBadgeProps) {
  return (
    <span
      style={{
        alignItems: "center",
        borderRadius: aiTimeDesignTokens.radius.pill,
        display: "inline-flex",
        fontFamily: aiTimeDesignTokens.font.family,
        fontSize: aiTimeDesignTokens.font.size.xs,
        fontWeight: aiTimeDesignTokens.font.weight.semibold,
        lineHeight: 1,
        minHeight: 24,
        padding: "0 9px",
        whiteSpace: "nowrap",
        ...toneStyles[tone],
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  );
}
