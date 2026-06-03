import { defineWidget } from "../types.js";

export const SessionNameWidget = defineWidget({
  type: "session-name",
  label: "Session Name",
  category: "Core",
  description: "Pi session name",
  dependencies: ["sessionName"],
  baseOptions: ["raw", "hideWhenEmpty", "icon", "text"],
  baseOptionDefaults: { hideWhenEmpty: true },
  properties: [],
  icons: { emoji: "🏷️", nerd: "󰍹", text: "session" },
  defaultStyle: { fg: "cyan", bg: "default", bold: false },
  render({ ctx, renderWidget }) {
    return renderWidget(ctx.sessionName);
  },
});
