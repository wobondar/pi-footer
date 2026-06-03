import { defineWidget } from "../types.js";

export const CompactionsWidget = defineWidget({
  type: "compactions",
  label: "Compactions",
  category: "Session",
  description: "Compaction summary count",
  dependencies: ["metrics"],
  baseOptions: ["raw", "icon"],
  baseOptionDefaults: {},
  properties: [],
  icons: { emoji: "🗜️", nerd: "󰁨", text: "compactions" },
  defaultStyle: { fg: "yellow", bg: "default", bold: false },
  render({ ctx, renderWidget }) {
    return renderWidget(`${ctx.metrics.compactions}`);
  },
});
