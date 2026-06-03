import { registry, type WidgetType } from "../widgets/registry.js";
import type { Widget } from "../widgets/types.js";

export function addLineAfter(lines: Widget[][], selectedLine: number): number {
  lines.splice(selectedLine + 1, 0, []);
  return selectedLine + 1;
}

export function cloneLineAfter(
  lines: Widget[][],
  selectedLine: number,
  cloneWidget: (widget: Widget) => Widget = (widget) => registry.cloneWidget(widget),
): number {
  const line = lines[selectedLine] ?? [];
  lines.splice(selectedLine + 1, 0, line.map(cloneWidget));
  return selectedLine + 1;
}

export function deleteLine(lines: Widget[][], selectedLine: number): number {
  if (lines.length <= 1) return selectedLine;
  lines.splice(selectedLine, 1);
  return Math.min(selectedLine, lines.length - 1);
}

export function moveLine(lines: Widget[][], selectedLine: number, delta: number): number {
  const next = selectedLine + delta;
  if (next < 0 || next >= lines.length) return selectedLine;
  const [line] = lines.splice(selectedLine, 1);
  if (!line) return selectedLine;
  lines.splice(next, 0, line);
  return next;
}

export function moveWidget(line: Widget[], selectedWidget: number, delta: number): number {
  const next = selectedWidget + delta;
  if (next < 0 || next >= line.length) return selectedWidget;
  const [widget] = line.splice(selectedWidget, 1);
  if (!widget) return selectedWidget;
  line.splice(next, 0, widget);
  return next;
}

export function cloneSelectedWidget(
  line: Widget[],
  selectedWidget: number,
  cloneWidget: (widget: Widget) => Widget = (widget) => registry.cloneWidget(widget),
): number {
  const widget = line[selectedWidget];
  if (!widget) return selectedWidget;
  line.splice(selectedWidget + 1, 0, cloneWidget(widget));
  return selectedWidget + 1;
}

export function deleteSelectedWidget(line: Widget[], selectedWidget: number): number {
  if (line.length === 0) return selectedWidget;
  line.splice(selectedWidget, 1);
  return Math.max(0, Math.min(selectedWidget, line.length - 1));
}

export function toggleWidgetEnabled(widget: Widget | undefined): boolean {
  if (!widget) return false;
  widget.toggle();
  return true;
}

export function toggleWidgetRaw(widget: Widget | undefined): boolean {
  if (!widget || isLayoutWidgetType(widget.type)) return false;
  widget.update({ raw: !(widget.options.raw ?? false) });
  return true;
}

function isLayoutWidgetType(type: WidgetType): boolean {
  return (
    type === "custom-text" || type === "separator" || type === "spacer" || type === "flex-separator"
  );
}
