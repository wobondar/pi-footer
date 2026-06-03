import { defineWidget } from "../types.js";
import { formatElapsed } from "../utils/session.js";

export const TotalTimeWidget = defineWidget({
  type: "total-time",
  label: "Session Total Time",
  category: "Session",
  description: "Live wall-clock time since first session entry",
  dependencies: ["metrics"],
  baseOptions: ["raw", "icon"],
  baseOptionDefaults: {},
  properties: [],
  icons: { emoji: "⏳", nerd: "󱎫", text: "total" },
  defaultStyle: { fg: "yellow", bg: "default", bold: false },
  render({ ctx, renderWidget }) {
    return renderWidget(formatElapsed(ctx.metrics.firstTimestampMs, Date.now()));
  },
});
