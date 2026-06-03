import { defineWidget } from "../types.js";
import { formatTime } from "../utils/session.js";

export const SessionStartWidget = defineWidget({
  type: "session-start",
  label: "Session Start",
  category: "Session",
  description: "First session entry time",
  dependencies: ["metrics"],
  baseOptions: ["raw", "hideWhenEmpty", "icon", "text"],
  baseOptionDefaults: { text: "" },
  properties: [],
  icons: { emoji: "🚀", nerd: "󱑂", text: "started" },
  defaultStyle: { fg: "yellow", bg: "default", bold: false },
  render({ ctx, renderWidget }) {
    return renderWidget(formatTime(ctx.metrics.firstTimestampMs));
  },
});
