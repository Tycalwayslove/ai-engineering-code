import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { aiTimeDesignTokens } from "../tokens";

export const hybridHostPlatforms = ["h5", "ios", "android"] as const;

export type HybridHostPlatform = (typeof hybridHostPlatforms)[number];

export type HybridHostShellProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  platform?: HybridHostPlatform;
  previewLabel?: string;
  showNativeChrome?: boolean;
};

const hostConfig: Record<
  HybridHostPlatform,
  {
    background: string;
    borderRadius: string;
    chrome: "none" | "ios" | "android";
    framePadding: string;
    safeBottom: string;
    safeTop: string;
  }
> = {
  android: {
    background: "#101513",
    borderRadius: "28px",
    chrome: "android",
    framePadding: "8px",
    safeBottom: "8px",
    safeTop: "8px",
  },
  h5: {
    background: aiTimeDesignTokens.color.backgroundElevated,
    borderRadius: "24px",
    chrome: "none",
    framePadding: "0",
    safeBottom: "0px",
    safeTop: "0px",
  },
  ios: {
    background: "#050706",
    borderRadius: "44px",
    chrome: "ios",
    framePadding: "10px",
    safeBottom: "18px",
    safeTop: "16px",
  },
};

function IosPreviewChrome() {
  return (
    <div
      aria-hidden="true"
      style={{
        alignItems: "center",
        color: "rgba(255, 255, 255, 0.82)",
        display: "grid",
        fontSize: 12,
        fontWeight: aiTimeDesignTokens.font.weight.semibold,
        gridTemplateColumns: "1fr auto 1fr",
        minHeight: 34,
        padding: "4px 16px 0",
      }}
    >
      <span>21:05</span>
      <span
        style={{
          background: "#020302",
          borderRadius: 999,
          display: "block",
          height: 22,
          width: 96,
        }}
      />
      <span style={{ justifySelf: "end" }}>5G 82%</span>
    </div>
  );
}

function AndroidPreviewChrome() {
  return (
    <div
      aria-hidden="true"
      style={{
        alignItems: "center",
        color: "rgba(255, 255, 255, 0.78)",
        display: "flex",
        fontSize: 12,
        fontWeight: aiTimeDesignTokens.font.weight.medium,
        justifyContent: "space-between",
        minHeight: 28,
        padding: "2px 14px 0",
      }}
    >
      <span>21:05</span>
      <span>LTE 82%</span>
    </div>
  );
}

function AndroidNavigationBar() {
  return (
    <div
      aria-hidden="true"
      style={{
        alignItems: "center",
        display: "flex",
        justifyContent: "center",
        minHeight: 22,
      }}
    >
      <span
        style={{
          background: "rgba(255, 255, 255, 0.42)",
          borderRadius: 999,
          display: "block",
          height: 3,
          width: 108,
        }}
      />
    </div>
  );
}

export function HybridHostShell({
  children,
  platform = "h5",
  previewLabel,
  showNativeChrome = true,
  style,
  ...props
}: HybridHostShellProps) {
  const config = hostConfig[platform];
  const hostStyle = {
    "--ai-host-safe-bottom": config.safeBottom,
    "--ai-host-safe-top": config.safeTop,
  } as CSSProperties;

  return (
    <section
      aria-label={previewLabel ?? `${platform} hybrid host`}
      data-hybrid-host-platform={platform}
      style={{
        ...hostStyle,
        background: config.background,
        border: `1px solid ${aiTimeDesignTokens.color.borderStrong}`,
        borderRadius: config.borderRadius,
        boxShadow: aiTimeDesignTokens.shadow.sheet,
        display: "grid",
        gridTemplateRows: showNativeChrome ? "auto minmax(0, 1fr) auto" : "1fr",
        height: "min(860px, calc(100vh - 2rem))",
        minHeight: 680,
        overflow: "hidden",
        padding: config.framePadding,
        width: "min(100%, 430px)",
        ...style,
      }}
      {...props}
    >
      {showNativeChrome && config.chrome === "ios" ? (
        <IosPreviewChrome />
      ) : null}
      {showNativeChrome && config.chrome === "android" ? (
        <AndroidPreviewChrome />
      ) : null}
      <div
        style={{
          borderRadius:
            platform === "ios"
              ? "34px"
              : platform === "android"
                ? "22px"
                : "inherit",
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {children}
      </div>
      {showNativeChrome && config.chrome === "android" ? (
        <AndroidNavigationBar />
      ) : null}
    </section>
  );
}
