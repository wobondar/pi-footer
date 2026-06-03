import {
  appendAnsi256Digit,
  deleteAnsi256Digit,
  FOREGROUND_COLORS,
  normalizeColor,
  resetAnsi256Colors,
  STANDARD_COLORS,
} from "../colors.js";
import type { WidgetOptions } from "../types.js";
import type { Widget } from "../widgets/types.js";
import { adjustAnsi, cycle } from "./helpers.js";
import type { ColorOptionField } from "./model.js";

export const EDIT_COLORS_HINT =
  "↑/↓ field • ←/→ cycle/change • enter toggle • type digits for ANSI256 • backspace delete • esc back";

export function hasCustomAnsiColors(lines: readonly (readonly Widget[])[]): boolean {
  return lines.some((line) =>
    line.some(
      (widget) =>
        colorOption(widget, "fg")?.startsWith("ansi256:") ||
        colorOption(widget, "bg")?.startsWith("ansi256:") ||
        colorOption(widget, "warningFg")?.startsWith("ansi256:") ||
        colorOption(widget, "warningBg")?.startsWith("ansi256:") ||
        colorOption(widget, "dangerFg")?.startsWith("ansi256:") ||
        colorOption(widget, "dangerBg")?.startsWith("ansi256:"),
    ),
  );
}

export function resetCustomAnsiColors(lines: readonly (readonly Widget[])[]): void {
  for (const line of lines) {
    for (const widget of line) {
      widget.update(resetAnsi256Colors(widget.options));
    }
  }
}

export function applyColorDigit(widget: Widget, field: ColorOptionField, digit: string): boolean {
  if (!/^\d$/.test(digit)) return false;
  if (field.id === "fgAnsi")
    return updateColorOption(widget, "fg", appendAnsi256Digit(colorOption(widget, "fg"), digit));
  if (field.id === "bgAnsi")
    return updateColorOption(widget, "bg", appendAnsi256Digit(colorOption(widget, "bg"), digit));
  if (field.id === "warningFgAnsi")
    return updateColorOption(
      widget,
      "warningFg",
      appendAnsi256Digit(colorOption(widget, "warningFg"), digit),
    );
  if (field.id === "warningBgAnsi")
    return updateColorOption(
      widget,
      "warningBg",
      appendAnsi256Digit(colorOption(widget, "warningBg"), digit),
    );
  if (field.id === "dangerFgAnsi")
    return updateColorOption(
      widget,
      "dangerFg",
      appendAnsi256Digit(colorOption(widget, "dangerFg"), digit),
    );
  if (field.id === "dangerBgAnsi")
    return updateColorOption(
      widget,
      "dangerBg",
      appendAnsi256Digit(colorOption(widget, "dangerBg"), digit),
    );
  return false;
}

export function deleteColorDigit(widget: Widget, field: ColorOptionField): boolean {
  if (field.id === "fgAnsi")
    return updateColorOption(widget, "fg", deleteAnsi256Digit(colorOption(widget, "fg")));
  if (field.id === "bgAnsi")
    return updateColorOption(widget, "bg", deleteAnsi256Digit(colorOption(widget, "bg")));
  if (field.id === "warningFgAnsi")
    return updateColorOption(
      widget,
      "warningFg",
      deleteAnsi256Digit(colorOption(widget, "warningFg")),
    );
  if (field.id === "warningBgAnsi")
    return updateColorOption(
      widget,
      "warningBg",
      deleteAnsi256Digit(colorOption(widget, "warningBg")),
    );
  if (field.id === "dangerFgAnsi")
    return updateColorOption(
      widget,
      "dangerFg",
      deleteAnsi256Digit(colorOption(widget, "dangerFg")),
    );
  if (field.id === "dangerBgAnsi")
    return updateColorOption(
      widget,
      "dangerBg",
      deleteAnsi256Digit(colorOption(widget, "dangerBg")),
    );
  return false;
}

export function applyColorOptionField(
  widget: Widget,
  field: ColorOptionField,
  delta: number,
): void {
  if (field.id === "bold") widget.update({ bold: !widget.options.bold });
  else if (field.id === "fg")
    updateColorOption(
      widget,
      "fg",
      cycle(
        FOREGROUND_COLORS.map((color) => color.value),
        widget.options.fg ?? "default",
        delta,
      ),
    );
  else if (field.id === "bg")
    updateColorOption(
      widget,
      "bg",
      cycle(
        STANDARD_COLORS.map((color) => color.value),
        widget.options.bg ?? "default",
        delta,
      ),
    );
  else if (field.id === "warningFg")
    updateColorOption(
      widget,
      "warningFg",
      cycle(
        FOREGROUND_COLORS.map((color) => color.value),
        colorOption(widget, "warningFg") ?? "default",
        delta,
      ),
    );
  else if (field.id === "warningBg")
    updateColorOption(
      widget,
      "warningBg",
      cycle(
        STANDARD_COLORS.map((color) => color.value),
        colorOption(widget, "warningBg") ?? "default",
        delta,
      ),
    );
  else if (field.id === "dangerFg")
    updateColorOption(
      widget,
      "dangerFg",
      cycle(
        FOREGROUND_COLORS.map((color) => color.value),
        colorOption(widget, "dangerFg") ?? "default",
        delta,
      ),
    );
  else if (field.id === "dangerBg")
    updateColorOption(
      widget,
      "dangerBg",
      cycle(
        STANDARD_COLORS.map((color) => color.value),
        colorOption(widget, "dangerBg") ?? "default",
        delta,
      ),
    );
  else if (field.id === "fgAnsi")
    updateColorOption(widget, "fg", adjustAnsi(colorOption(widget, "fg"), delta));
  else if (field.id === "bgAnsi")
    updateColorOption(widget, "bg", adjustAnsi(colorOption(widget, "bg"), delta));
  else if (field.id === "warningFgAnsi")
    updateColorOption(widget, "warningFg", adjustAnsi(colorOption(widget, "warningFg"), delta));
  else if (field.id === "warningBgAnsi")
    updateColorOption(widget, "warningBg", adjustAnsi(colorOption(widget, "warningBg"), delta));
  else if (field.id === "dangerFgAnsi")
    updateColorOption(widget, "dangerFg", adjustAnsi(colorOption(widget, "dangerFg"), delta));
  else if (field.id === "dangerBgAnsi")
    updateColorOption(widget, "dangerBg", adjustAnsi(colorOption(widget, "dangerBg"), delta));
}

function colorOption(widget: Widget, key: string) {
  return normalizeColor(widget.options[key]);
}

function updateColorOption(
  widget: Widget,
  key: string,
  value: WidgetOptions[keyof WidgetOptions],
): true {
  widget.update({ [key]: value });
  return true;
}
