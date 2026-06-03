import { defineWidget } from "../types.js";

export const TotalMessagesWidget = defineWidget({
  type: "total-messages",
  label: "Total Messages",
  category: "Session",
  description: "Total message count",
  dependencies: ["metrics"],
  baseOptions: ["raw", "hideWhenZero", "icon", "text"],
  baseOptionDefaults: {},
  properties: [],
  icons: { emoji: "💬", nerd: "󰭻", text: "messages" },
  defaultStyle: { fg: "cyan", bg: "default", bold: false },
  render({ ctx, renderWidget }) {
    return renderWidget(
      `${ctx.metrics.userMessages + ctx.metrics.assistantMessages + ctx.metrics.toolResults}`,
    );
  },
});
