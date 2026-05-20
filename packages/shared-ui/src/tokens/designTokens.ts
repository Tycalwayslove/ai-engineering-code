export const aiTimeThemeNames = ["dark", "light"] as const;

export type AiTimeThemeName = (typeof aiTimeThemeNames)[number];

export const aiTimeThemeValues = {
  dark: {
    color: {
      background: "#0e1110",
      backgroundElevated: "#171b19",
      backgroundInset: "#080a09",
      surface: "#1d2220",
      surfaceRaised: "#252b28",
      surfaceGlass: "rgba(37, 43, 40, 0.82)",
      border: "rgba(255, 255, 255, 0.1)",
      borderStrong: "rgba(255, 255, 255, 0.18)",
      text: "#f4f7f5",
      textMuted: "#a5aea9",
      textSubtle: "#707a75",
      primary: "#08b894",
      primaryPressed: "#079f82",
      primaryText: "#ffffff",
      primarySoft: "rgba(8, 184, 148, 0.14)",
      success: "#24c293",
      successSoft: "rgba(36, 194, 147, 0.14)",
      warning: "#f5b84b",
      warningSoft: "rgba(245, 184, 75, 0.16)",
      danger: "#ef5f68",
      dangerSoft: "rgba(239, 95, 104, 0.16)",
      info: "#4b9bff",
      infoSoft: "rgba(75, 155, 255, 0.16)",
      dateSelected: "#ffffff",
      dateSelectedText: "#111412",
    },
    shadow: {
      control: "0 10px 24px rgba(0, 0, 0, 0.28)",
      sheet: "0 24px 80px rgba(0, 0, 0, 0.42)",
      focus: "0 0 0 3px rgba(8, 184, 148, 0.24)",
    },
  },
  light: {
    color: {
      background: "#f6f7f4",
      backgroundElevated: "#ffffff",
      backgroundInset: "#eef2ee",
      surface: "#ffffff",
      surfaceRaised: "#f4f7f4",
      surfaceGlass: "rgba(255, 255, 255, 0.82)",
      border: "rgba(20, 35, 30, 0.1)",
      borderStrong: "rgba(20, 35, 30, 0.18)",
      text: "#14211d",
      textMuted: "#5c6862",
      textSubtle: "#8b9690",
      primary: "#087f6d",
      primaryPressed: "#066b5c",
      primaryText: "#ffffff",
      primarySoft: "rgba(8, 127, 109, 0.12)",
      success: "#0b8f68",
      successSoft: "rgba(11, 143, 104, 0.12)",
      warning: "#a96800",
      warningSoft: "rgba(169, 104, 0, 0.13)",
      danger: "#c93645",
      dangerSoft: "rgba(201, 54, 69, 0.12)",
      info: "#256fc9",
      infoSoft: "rgba(37, 111, 201, 0.12)",
      dateSelected: "#14211d",
      dateSelectedText: "#ffffff",
    },
    shadow: {
      control: "0 10px 26px rgba(20, 35, 30, 0.1)",
      sheet: "0 24px 70px rgba(20, 35, 30, 0.16)",
      focus: "0 0 0 3px rgba(8, 127, 109, 0.2)",
    },
  },
} as const;

function createCssVariableMap<T extends Record<string, string>>(
  group: string,
  values: T,
): T {
  const variables: Record<string, string> = {};

  for (const [key, value] of Object.entries(values)) {
    const variableName = key.replace(
      /[A-Z]/g,
      (match) => `-${match.toLowerCase()}`,
    );
    variables[key] = `var(--ai-${group}-${variableName}, ${value})`;
  }

  return variables as T;
}

const coreTokens = {
  color: {
    ...createCssVariableMap("color", aiTimeThemeValues.dark.color),
  },
  radius: {
    xs: "6px",
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "22px",
    pill: "999px",
  },
  space: {
    0: "0",
    1: "4px",
    2: "8px",
    3: "12px",
    4: "16px",
    5: "20px",
    6: "24px",
    8: "32px",
    10: "40px",
    12: "48px",
  },
  font: {
    family:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    size: {
      xs: "12px",
      sm: "14px",
      md: "16px",
      lg: "18px",
      xl: "22px",
      "2xl": "28px",
    },
    lineHeight: {
      tight: "1.2",
      normal: "1.45",
      relaxed: "1.6",
    },
    weight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  shadow: {
    ...createCssVariableMap("shadow", aiTimeThemeValues.dark.shadow),
  },
  motion: {
    fast: "150ms ease",
    normal: "220ms ease",
    slow: "320ms ease",
  },
  zIndex: {
    base: 0,
    sticky: 20,
    overlay: 40,
    modal: 80,
  },
} as const;

export const aiTimeDesignTokens = coreTokens;

export type AiTimeDesignTokens = typeof aiTimeDesignTokens;
export type AiTimeThemeValues = typeof aiTimeThemeValues;
