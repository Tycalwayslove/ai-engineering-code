import { aiTimeThemeValues, type AiTimeThemeName } from "./designTokens";

type TokenValue = string | number | TokenBranch;

interface TokenBranch {
  [key: string]: TokenValue;
}

function flattenTokens(
  branch: TokenBranch,
  prefix: string,
  output: Record<string, string>,
) {
  for (const [key, value] of Object.entries(branch)) {
    const variableKey = key.replace(
      /[A-Z]/g,
      (match) => `-${match.toLowerCase()}`,
    );
    const name = `${prefix}-${variableKey}`;

    if (typeof value === "object") {
      flattenTokens(value, name, output);
      continue;
    }

    output[`--${name}`] = String(value);
  }
}

export function createAiTimeThemeCssVariables(theme: AiTimeThemeName = "dark") {
  const variables: Record<string, string> = {};
  flattenTokens(aiTimeThemeValues[theme], "ai", variables);
  return variables;
}

export const createAiTimeCssVariables = createAiTimeThemeCssVariables;

export const aiTimeCssVariables = createAiTimeThemeCssVariables("dark");
export const aiTimeLightCssVariables = createAiTimeThemeCssVariables("light");
