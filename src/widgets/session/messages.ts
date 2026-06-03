import { defineWidget } from "../types.js";

export const MessagesWidget = defineWidget({
  type: "messages",
  label: "Message Counts",
  category: "Session",
  description: "User/assistant/tool message counts",
  dependencies: ["metrics"],
  baseOptions: ["raw", "icon"],
  baseOptionDefaults: {},
  properties: [],
  icons: { emoji: "💬", nerd: "󰭻", text: "msg" },
  defaultStyle: { fg: "cyan", bg: "default", bold: false },
  render({ ctx, renderWidget }) {
    return renderWidget(
      `${ctx.metrics.userMessages}u/${ctx.metrics.assistantMessages}a/${ctx.metrics.toolResults}t`,
    );
  },
});
