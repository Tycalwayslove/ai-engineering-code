import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";
import { aiTimeDesignTokens } from "../tokens";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  tone?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
};

const sizeStyles: Record<NonNullable<ButtonProps["size"]>, CSSProperties> = {
  sm: {
    minHeight: 36,
    padding: "0 12px",
    fontSize: aiTimeDesignTokens.font.size.sm,
  },
  md: {
    minHeight: 44,
    padding: "0 16px",
    fontSize: aiTimeDesignTokens.font.size.md,
  },
  lg: {
    minHeight: 52,
    padding: "0 20px",
    fontSize: aiTimeDesignTokens.font.size.md,
  },
};

const toneStyles: Record<NonNullable<ButtonProps["tone"]>, CSSProperties> = {
  primary: {
    background: aiTimeDesignTokens.color.primary,
    borderColor: aiTimeDesignTokens.color.primary,
    color: aiTimeDesignTokens.color.primaryText,
  },
  secondary: {
    background: aiTimeDesignTokens.color.surfaceRaised,
    borderColor: aiTimeDesignTokens.color.borderStrong,
    color: aiTimeDesignTokens.color.text,
  },
  danger: {
    background: aiTimeDesignTokens.color.dangerSoft,
    borderColor: "rgba(239, 95, 104, 0.32)",
    color: aiTimeDesignTokens.color.danger,
  },
  ghost: {
    background: "transparent",
    borderColor: "transparent",
    color: aiTimeDesignTokens.color.textMuted,
  },
};

export function Button({
  children,
  disabled,
  size = "md",
  style,
  tone = "secondary",
  type = "button",
  ...props
}: ButtonProps) {
  const buttonStyle: CSSProperties = {
    alignItems: "center",
    border: "1px solid",
    borderRadius: aiTimeDesignTokens.radius.pill,
    cursor: disabled ? "not-allowed" : "pointer",
    display: "inline-flex",
    fontFamily: aiTimeDesignTokens.font.family,
    fontWeight: aiTimeDesignTokens.font.weight.semibold,
    gap: aiTimeDesignTokens.space[2],
    justifyContent: "center",
    lineHeight: 1,
    opacity: disabled ? 0.48 : 1,
    transition: `background ${aiTimeDesignTokens.motion.fast}, border-color ${aiTimeDesignTokens.motion.fast}, transform ${aiTimeDesignTokens.motion.fast}`,
    ...sizeStyles[size],
    ...toneStyles[tone],
    ...style,
  };

  return (
    <button disabled={disabled} style={buttonStyle} type={type} {...props}>
      {children}
    </button>
  );
}
