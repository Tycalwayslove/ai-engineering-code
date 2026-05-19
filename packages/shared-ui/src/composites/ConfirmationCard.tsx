import type { HTMLAttributes, ReactNode } from "react";
import { Button, StatusBadge } from "../primitives";
import { aiTimeDesignTokens } from "../tokens";

export type ConfirmationAction = {
  id: string;
  label: string;
  meta: string;
  tone?: "primary" | "warning" | "danger";
};

export type ConfirmationCardProps = HTMLAttributes<HTMLElement> & {
  actions: ConfirmationAction[];
  cancelLabel?: string;
  confirmLabel?: string;
  description?: string;
  title: string;
  onCancel?: () => void;
  onConfirm?: () => void;
};

export function ConfirmationCard({
  actions,
  cancelLabel = "取消",
  confirmLabel = "确认",
  description,
  onCancel,
  onConfirm,
  style,
  title,
  ...props
}: ConfirmationCardProps) {
  return (
    <article
      style={{
        background: aiTimeDesignTokens.color.surface,
        border: `1px solid ${aiTimeDesignTokens.color.border}`,
        borderRadius: aiTimeDesignTokens.radius.lg,
        boxShadow: aiTimeDesignTokens.shadow.sheet,
        color: aiTimeDesignTokens.color.text,
        display: "grid",
        gap: aiTimeDesignTokens.space[4],
        padding: aiTimeDesignTokens.space[4],
        ...style,
      }}
      {...props}
    >
      <div style={{ display: "grid", gap: aiTimeDesignTokens.space[2] }}>
        <h3
          style={{
            fontFamily: aiTimeDesignTokens.font.family,
            fontSize: aiTimeDesignTokens.font.size.lg,
            lineHeight: aiTimeDesignTokens.font.lineHeight.tight,
            margin: 0,
          }}
        >
          {title}
        </h3>
        {description ? (
          <p
            style={{
              color: aiTimeDesignTokens.color.textMuted,
              fontFamily: aiTimeDesignTokens.font.family,
              fontSize: aiTimeDesignTokens.font.size.sm,
              lineHeight: aiTimeDesignTokens.font.lineHeight.relaxed,
              margin: 0,
            }}
          >
            {description}
          </p>
        ) : null}
      </div>

      <div style={{ display: "grid", gap: aiTimeDesignTokens.space[3] }}>
        {actions.map((action) => (
          <div
            key={action.id}
            style={{
              alignItems: "center",
              display: "grid",
              gap: aiTimeDesignTokens.space[3],
              gridTemplateColumns: "auto 1fr",
            }}
          >
            <StatusBadge tone={action.tone ?? "primary"}>创建</StatusBadge>
            <div style={{ display: "grid", gap: 2 }}>
              <strong
                style={{
                  fontFamily: aiTimeDesignTokens.font.family,
                  fontSize: aiTimeDesignTokens.font.size.md,
                  lineHeight: aiTimeDesignTokens.font.lineHeight.normal,
                }}
              >
                {action.label}
              </strong>
              <span
                style={{
                  color: aiTimeDesignTokens.color.textMuted,
                  fontFamily: aiTimeDesignTokens.font.family,
                  fontSize: aiTimeDesignTokens.font.size.sm,
                  lineHeight: aiTimeDesignTokens.font.lineHeight.normal,
                }}
              >
                {action.meta}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gap: aiTimeDesignTokens.space[3],
          gridTemplateColumns: "1fr 1fr",
        }}
      >
        <Button onClick={onCancel} tone="secondary">
          {cancelLabel}
        </Button>
        <Button onClick={onConfirm} tone="primary">
          {confirmLabel}
        </Button>
      </div>
    </article>
  );
}
