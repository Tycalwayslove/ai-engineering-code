import type { HTMLAttributes, ReactNode } from "react";
import { aiTimeDesignTokens } from "../tokens";

export type MobileAgentShellProps = HTMLAttributes<HTMLDivElement> & {
  bottom?: ReactNode;
  header?: ReactNode;
  status?: ReactNode;
  children: ReactNode;
};

export function MobileAgentShell({
  bottom,
  children,
  header,
  status,
  style,
  ...props
}: MobileAgentShellProps) {
  return (
    <div
      style={{
        background: aiTimeDesignTokens.color.background,
        color: aiTimeDesignTokens.color.text,
        display: "grid",
        fontFamily: aiTimeDesignTokens.font.family,
        gridTemplateRows: "auto 1fr auto auto",
        height: "100dvh",
        minHeight: 640,
        overflow: "hidden",
        position: "relative",
        width: "100%",
        ...style,
      }}
      {...props}
    >
      {header ? (
        <div
          style={{
            padding:
              "calc(var(--ai-host-safe-top, env(safe-area-inset-top, 0px)) + 14px) 16px 8px",
            zIndex: aiTimeDesignTokens.zIndex.sticky,
          }}
        >
          {header}
        </div>
      ) : null}
      <main
        style={{
          display: "flex",
          flexDirection: "column",
          gap: aiTimeDesignTokens.space[4],
          overflowY: "auto",
          padding: "12px 16px",
        }}
      >
        {children}
      </main>
      {status ? (
        <div
          style={{
            padding: "8px 16px 0",
            zIndex: aiTimeDesignTokens.zIndex.sticky,
          }}
        >
          {status}
        </div>
      ) : null}
      {bottom ? (
        <div
          style={{
            padding:
              "12px 16px calc(var(--ai-host-safe-bottom, env(safe-area-inset-bottom, 0px)) + 12px)",
            zIndex: aiTimeDesignTokens.zIndex.sticky,
          }}
        >
          {bottom}
        </div>
      ) : null}
    </div>
  );
}
