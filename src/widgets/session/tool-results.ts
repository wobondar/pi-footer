import { defineWidget } from "../types.js";

export const ToolResultsWidget = defineWidget({
  type: "tool-results",
  label: "Tool Results",
  category: "Session",
  description: "Tool result count",
  dependencies: ["metrics"],
  baseOptions: ["raw", "hideWhenZero", "icon", "text"],
  baseOptionDefaults: {},
  properties: [],
  icons: { emoji: "🛠️", nerd: "󰒓", text: "tools" },
  defaultStyle: { fg: "green", bg: "default", bold: false },
  render({ ctx, renderWidget }) {
    return renderWidget(`${ctx.metrics.toolResults}`);
  },
});
