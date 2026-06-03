import { defineWidget } from "../types.js";

export const ThinkingLevelWidget = defineWidget({
  type: "thinking-level",
  label: "Thinking Level",
  category: "Core",
  description: "Pi reasoning/thinking level for reasoning-capable models",
  dependencies: ["thinkingLevel"],
  baseOptions: ["raw", "hideWhenEmpty", "icon", "text"],
  baseOptionDefaults: { text: "" },
  properties: [],
  icons: { emoji: "🧠", nerd: "󰈈", text: "thinking" },
  defaultStyle: { fg: "magenta", bg: "default", bold: false },
  render({ ctx, renderWidget }) {
    return renderWidget(ctx.thinkingLevel);
  },
});
