import type { ColorName } from "../colors.ts";
import type { ScreenView } from "./model.ts";

export function escapeTarget(view: ScreenView): ScreenView | "close" {
  if (view === "main") return "close";
  if (
    view === "line-list" ||
    view === "color-line-list" ||
    view === "terminal" ||
    view === "global" ||
    view === "extension-status-row"
  )
    return "main";
  if (view === "widget-list") return "line-list";
  if (view === "color-widget-list") return "color-line-list";
  if (view === "edit-colors") return "color-widget-list";
  if (view === "add-widget" || view === "edit-widget") return "widget-list";
  if (view === "confirm-color-level") return "terminal";
  if (view === "confirm-exit") return "main";
  return "main";
}

export function cycle<T>(values: readonly T[], current: T, delta: number): T {
  const index = values.indexOf(current);
  return values[(index + delta + values.length) % values.length] ?? current;
}

export function adjustAnsi(current: ColorName | undefined, delta: number): ColorName {
  const currentCode = current?.startsWith("ansi256:") ? Number(current.slice(8)) : 0;
  return `ansi256:${wrap(currentCode + delta, 256)}` as ColorName;
}

export function wrap(value: number, length: number): number {
  if (length <= 0) return 0;
  return (value + length) % length;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function isPrintable(data: string): boolean {
  return data.length === 1 && data.charCodeAt(0) >= 32 && data.charCodeAt(0) !== 127;
}
