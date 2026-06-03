import { defineWidget } from "../types.js";

export const ActiveToolsWidget = defineWidget({
  type: "active-tools",
  label: "Active Tools",
  category: "Core",
  description: "Active tool count",
  dependencies: ["activeToolCount"],
  baseOptions: ["raw", "hideWhenZero", "icon", "text"],
  baseOptionDefaults: { hideWhenZero: true },
  properties: [],
  icons: { emoji: "🛠️", nerd: "󰒓", text: "tools" },
  defaultStyle: { fg: "yellow", bg: "default", bold: false },
  render({ ctx, renderWidget }) {
    return renderWidget(String(ctx.activeToolCount));
  },
});
