export const SEPARATOR_VALUES = [
  "none",
  "dot",
  "pipe",
  "space",
  "powerline",
  "chevron",
  "chevron-circle",
  "arrow-circle",
  "dash",
  "comma",
] as const;

export type SeparatorStyle = (typeof SEPARATOR_VALUES)[number];

export const WIDGET_SEPARATOR_VALUES = [
  ...SEPARATOR_VALUES,
  "powerline-right",
  "powerline-right-spaced",
  "powerline-left",
  "powerline-left-spaced",
  "powerline-soft-right",
  "powerline-soft-left",
  "powerline-start",
  "powerline-end",
  "custom",
] as const;

export type WidgetSeparatorStyle = (typeof WIDGET_SEPARATOR_VALUES)[number];

export function separatorText(separator: SeparatorStyle): string {
  if (separator === "none") return "";
  if (separator === "space") return " ";
  if (separator === "pipe") return " | ";
  if (separator === "powerline") return "  ";
  if (separator === "dash") return " - ";
  if (separator === "comma") return ", ";
  if (separator === "chevron") return " \uf460 ";
  if (separator === "chevron-circle") return " \uf138 ";
  if (separator === "arrow-circle") return " \uf0a9 ";
  return " • ";
}

export function widgetSeparatorText(
  separator: WidgetSeparatorStyle | undefined,
  customText: string,
): string {
  if (separator === "custom") return customText;
  if (separator === "powerline" || separator === "powerline-right-spaced") return " ";
  if (separator === "powerline-right") return "";
  if (separator === "powerline-left-spaced") return " ";
  if (separator === "powerline-left") return "";
  if (separator === "powerline-soft-right") return "";
  if (separator === "powerline-soft-left") return "";
  if (separator === "powerline-start") return "";
  if (separator === "powerline-end") return "";
  return separatorText(separator ?? "pipe");
}
