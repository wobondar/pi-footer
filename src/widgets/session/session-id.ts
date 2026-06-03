import { defineWidget } from "../types.js";

export const SessionIdWidget = defineWidget({
  type: "session-id",
  label: "Session ID",
  category: "Session",
  description: "Current pi session id",
  dependencies: ["sessionId"],
  baseOptions: ["raw", "hideWhenEmpty", "icon", "text"],
  baseOptionDefaults: { text: "" },
  properties: [],
  icons: { emoji: "🆔", nerd: "󰈙", text: "session id" },
  defaultStyle: { fg: "cyan", bg: "default", bold: false },
  render({ ctx, renderWidget }) {
    return renderWidget(ctx.sessionId);
  },
});
