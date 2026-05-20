import type { HTMLAttributes, ReactNode } from "react";
import { aiTimeDesignTokens } from "../tokens";

export type MessageBubbleProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  roleTone?: "user" | "assistant" | "system";
};

export function MessageBubble({
  children,
  roleTone = "assistant",
  style,
  ...props
}: MessageBubbleProps) {
  const isUser = roleTone === "user";
  const isSystem = roleTone === "system";

  return (
    <div
      style={{
        alignSelf: isUser ? "flex-end" : "flex-start",
        background: isUser
          ? aiTimeDesignTokens.color.primary
          : isSystem
            ? aiTimeDesignTokens.color.primarySoft
            : aiTimeDesignTokens.color.surfaceRaised,
        border: isUser
          ? "1px solid transparent"
          : `1px solid ${aiTimeDesignTokens.color.border}`,
        borderRadius: isUser ? "20px 20px 6px 20px" : "20px 20px 20px 6px",
        color: isUser
          ? aiTimeDesignTokens.color.primaryText
          : aiTimeDesignTokens.color.text,
        fontFamily: aiTimeDesignTokens.font.family,
        fontSize: aiTimeDesignTokens.font.size.md,
        lineHeight: aiTimeDesignTokens.font.lineHeight.relaxed,
        maxWidth: "82%",
        padding: "14px 16px",
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
