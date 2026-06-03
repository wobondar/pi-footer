import { highlightCode } from "@earendil-works/pi-coding-agent";

import { UPDATE_EVENT_WIDGET_EVENT } from "../event-widgets.js";
import type { Widget } from "../widgets/types.js";

export function eventWidgetUsageLines(
  widget: Widget,
  width: number,
  line: (content: string, width: number) => string,
  dim: (text: string) => string,
): string[] {
  return [
    line("", width),
    line(dim("Send events with a value:"), width),
    line(eventWidgetUsageCode(widgetId(widget), "Value"), width),
    line("", width),
    line(dim("Send events to remove status:"), width),
    line(eventWidgetUsageCode(widgetId(widget), "NULL"), width),
  ];
}

function widgetId(widget: Widget) {
  const value = widget.options.widgetId;
  return typeof value === "string" ? value : "";
}

function eventWidgetUsageCode(widgetId: string, value: string): string {
  const v = value === "NULL" ? "null" : `"${value}"`;
  return (
    highlightCode(
      `pi.events.emit(${JSON.stringify(UPDATE_EVENT_WIDGET_EVENT)}, { "widgetId": ${JSON.stringify(widgetId)}, "value": ${v} });`,
      "typescript",
    )[0] ?? ""
  );
}
