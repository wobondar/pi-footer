import { defineWidget } from "../types.js";

export const UserMessagesWidget = defineWidget({
  type: "user-messages",
  label: "User Messages",
  category: "Session",
  description: "User message count",
  dependencies: ["metrics"],
  baseOptions: ["raw", "hideWhenZero", "icon", "text"],
  baseOptionDefaults: {},
  properties: [],
  icons: { emoji: "👤", nerd: "", text: "user" },
  defaultStyle: { fg: "blue", bg: "default", bold: false },
  render({ ctx, renderWidget }) {
    return renderWidget(`${ctx.metrics.userMessages}`);
  },
});
