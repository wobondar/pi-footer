import type { ColorLevel } from "../colors.js";
import type { IconMode, TerminalWidthMode } from "../types.js";
import type { WidgetProperty } from "../widgets/types.js";

export const CONFIG_UI_HEIGHT_RATIO = 1;

export const WIDTH_MODE_LABELS: Record<TerminalWidthMode, string> = {
  full: "Full width always",
  "full-minus-40": "Full width minus 40",
};

export const COLOR_LEVEL_LABELS: Record<ColorLevel, string> = {
  truecolor: "Truecolor",
  ansi256: "256 Color",
  ansi16: "Basic (Standard 16-color)",
  none: "No Color",
};

export const ICON_MODE_LABELS: Record<IconMode, string> = {
  emoji: "Emoji",
  nerd: "Nerd Font icons",
  text: "Text labels",
};

export type ScreenView =
  | "main"
  | "line-list"
  | "widget-list"
  | "add-widget"
  | "edit-widget"
  | "color-line-list"
  | "color-widget-list"
  | "edit-colors"
  | "terminal"
  | "confirm-color-level"
  | "confirm-exit"
  | "global"
  | "extension-status-row";

type ColorField =
  | "fg"
  | "bg"
  | "bold"
  | "fgAnsi"
  | "bgAnsi"
  | "warningFg"
  | "warningBg"
  | "warningFgAnsi"
  | "warningBgAnsi"
  | "dangerFg"
  | "dangerBg"
  | "dangerFgAnsi"
  | "dangerBgAnsi";

// Flattened, UI-facing projection of WidgetProperty: id/label/kind plus the editable bits
// hoisted out of WidgetProperty.options. Derived structurally so it can't drift from the source.
export type OptionField = Pick<WidgetProperty, "id" | "label" | "kind"> &
  Pick<NonNullable<WidgetProperty["options"]>, "min" | "max" | "choices" | "editAction">;

export interface ColorOptionField {
  id: ColorField;
  label: string;
  kind: "color" | "boolean" | "ansi";
}
