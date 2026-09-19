import type { Theme, ThemeColor } from "@earendil-works/pi-coding-agent";

import type { ConfigState } from "./config-lifecycle.ts";

export type ThemeProvider = () => Theme;

export interface UiTheme {
  accent(text: string): string;
  dim(text: string): string;
  muted(text: string): string;
  success(text: string): string;
  warning(text: string): string;
  error(text: string): string;
  bold(text: string): string;
  selected(text: string): string;
  border(text: string, color?: ThemeColor): string;
  previewTitle(text: string): string;
  configStateLabel(state: ConfigState, label: string): string;
}

export function createUiTheme(getTheme: ThemeProvider): UiTheme {
  return {
    accent: (text) => getTheme().fg("accent", text),
    dim: (text) => getTheme().fg("dim", text),
    muted: (text) => getTheme().fg("muted", text),
    success: (text) => getTheme().fg("success", text),
    warning: (text) => getTheme().fg("warning", text),
    error: (text) => getTheme().fg("error", text),
    bold: (text) => getTheme().bold(text),
    selected: (text) => {
      const theme = getTheme();
      return theme.bg("selectedBg", theme.fg("accent", text));
    },
    border: (text, color = "border") => getTheme().fg(color, text),
    previewTitle: (text) => {
      const theme = getTheme();
      return theme.fg("accent", theme.bold(text));
    },
    configStateLabel: (state, label) => {
      const theme = getTheme();
      if (state === "saved") return theme.fg("accent", label);
      if (state === "dirty") return theme.bold(theme.fg("warning", label));
      if (state === "saving") return theme.fg("dim", label);
      if (state === "error") return theme.bold(theme.fg("error", label));
      return "";
    },
  };
}
