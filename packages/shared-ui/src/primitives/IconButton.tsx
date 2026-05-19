import type { ButtonHTMLAttributes, CSSProperties } from "react";
import { Icon, type IconName } from "../icons";
import { aiTimeDesignTokens } from "../tokens";

export type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: IconName;
  label: string;
  selected?: boolean;
  size?: "sm" | "md" | "lg";
};

const sizeStyles: Record<
  NonNullable<IconButtonProps["size"]>,
  CSSProperties
> = {
  sm: { height: 36, width: 36 },
  md: { height: 44, width: 44 },
  lg: { height: 52, width: 52 },
};

export function IconButton({
  disabled,
  icon,
  label,
  selected = false,
  size = "md",
  style,
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button
      aria-label={label}
      aria-pressed={selected}
      disabled={disabled}
      style={{
        alignItems: "center",
        background: selected
          ? aiTimeDesignTokens.color.primarySoft
          : aiTimeDesignTokens.color.surfaceGlass,
        border: `1px solid ${
          selected ? "rgba(8, 184, 148, 0.38)" : aiTimeDesignTokens.color.border
        }`,
        borderRadius: aiTimeDesignTokens.radius.pill,
        boxShadow: aiTimeDesignTokens.shadow.control,
        color: selected
          ? aiTimeDesignTokens.color.primary
          : aiTimeDesignTokens.color.text,
        cursor: disabled ? "not-allowed" : "pointer",
        display: "inline-flex",
        justifyContent: "center",
        opacity: disabled ? 0.48 : 1,
        transition: `background ${aiTimeDesignTokens.motion.fast}, transform ${aiTimeDesignTokens.motion.fast}`,
        ...sizeStyles[size],
        ...style,
      }}
      type={type}
      {...props}
    >
      <Icon name={icon} size={size === "lg" ? 22 : 20} />
    </button>
  );
}
