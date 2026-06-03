import { defineWidget } from "../types.js";
import { formatElapsed } from "../utils/session.js";

export const ElapsedWidget = defineWidget({
  type: "elapsed",
  label: "Transcript Span",
  category: "Session",
  description: "Time between first and last recorded session entry",
  dependencies: ["metrics"],
  baseOptions: ["raw", "icon"],
  baseOptionDefaults: {},
  properties: [],
  icons: { emoji: "⏱️", nerd: "󱎫", text: "span" },
  defaultStyle: { fg: "yellow", bg: "default", bold: false },
  render({ ctx, renderWidget }) {
    return renderWidget(formatElapsed(ctx.metrics.firstTimestampMs, ctx.metrics.lastTimestampMs));
  },
});
