import { defineWidget } from "../types.js";
import { formatTime } from "../utils/session.js";

export const LastActivityWidget = defineWidget({
  type: "last-activity",
  label: "Last Activity",
  category: "Session",
  description: "Most recent session entry time",
  dependencies: ["metrics"],
  baseOptions: ["raw", "hideWhenEmpty", "icon", "text"],
  baseOptionDefaults: { text: "" },
  properties: [],
  icons: { emoji: "🕘", nerd: "󱑃", text: "last" },
  defaultStyle: { fg: "yellow", bg: "default", bold: false },
  render({ ctx, renderWidget }) {
    return renderWidget(formatTime(ctx.metrics.lastTimestampMs));
  },
});
