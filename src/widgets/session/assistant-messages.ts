import { defineWidget } from "../types.js";

export const AssistantMessagesWidget = defineWidget({
  type: "assistant-messages",
  label: "Assistant Messages",
  category: "Session",
  description: "Assistant message count",
  dependencies: ["metrics"],
  baseOptions: ["raw", "hideWhenZero", "icon", "text"],
  baseOptionDefaults: {},
  properties: [],
  icons: { emoji: "🤖", nerd: "󰚩", text: "assistant" },
  defaultStyle: { fg: "white", bg: "default", bold: false },
  render({ ctx, renderWidget }) {
    return renderWidget(`${ctx.metrics.assistantMessages}`);
  },
});
