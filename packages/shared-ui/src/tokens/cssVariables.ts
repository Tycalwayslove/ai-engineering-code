import { aiTimeDesignTokens } from "./designTokens";

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
    const name = `${prefix}-${key}`;

    if (typeof value === "object") {
      flattenTokens(value, name, output);
      continue;
    }

    output[`--${name}`] = String(value);
  }
}

export function createAiTimeCssVariables() {
  const variables: Record<string, string> = {};
  flattenTokens(aiTimeDesignTokens, "ai", variables);
  return variables;
}

export const aiTimeCssVariables = createAiTimeCssVariables();
