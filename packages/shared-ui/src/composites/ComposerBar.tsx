import type { CSSProperties, FormHTMLAttributes, ReactNode } from "react";
import { IconButton } from "../primitives";
import { aiTimeDesignTokens } from "../tokens";

export type ComposerBarProps = FormHTMLAttributes<HTMLFormElement> & {
  cameraLabel?: string;
  keyboardLabel?: string;
  placeholder?: string;
  submitLabel?: string;
  trailing?: ReactNode;
};

export function ComposerBar({
  cameraLabel = "添加图片",
  keyboardLabel = "切换键盘输入",
  placeholder = "按住说话",
  style,
  submitLabel = "发送语音指令",
  trailing,
  ...props
}: ComposerBarProps) {
  const inputStyle: CSSProperties = {
    alignItems: "center",
    background: "#080a09",
    border: `1px solid ${aiTimeDesignTokens.color.border}`,
    borderRadius: aiTimeDesignTokens.radius.pill,
    color: aiTimeDesignTokens.color.text,
    display: "flex",
    flex: 1,
    fontFamily: aiTimeDesignTokens.font.family,
    fontSize: aiTimeDesignTokens.font.size.md,
    fontWeight: aiTimeDesignTokens.font.weight.semibold,
    justifyContent: "center",
    minHeight: 52,
    padding: "0 18px",
  };

  return (
    <form
      aria-label="AI 指令输入"
      style={{
        alignItems: "center",
        display: "flex",
        gap: aiTimeDesignTokens.space[3],
        width: "100%",
        ...style,
      }}
      {...props}
    >
      <IconButton icon="plus" label={cameraLabel} />
      <button aria-label={submitLabel} style={inputStyle} type="submit">
        {placeholder}
      </button>
      {trailing ?? <IconButton icon="keyboard" label={keyboardLabel} />}
    </form>
  );
}
