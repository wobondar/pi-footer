import { defineWidget } from "../types.js";

export const TextVerbosityWidget = defineWidget({
  type: "text-verbosity",
  label: "Text Verbosity",
  category: "Core",
  description: "Text verbosity for models/providers that support it",
  dependencies: ["textVerbosity"],
  baseOptions: ["raw", "hideWhenEmpty", "icon", "text"],
  baseOptionDefaults: { text: "" },
  properties: [],
  icons: { emoji: "📝", nerd: "󰉿", text: "verbosity" },
  defaultStyle: { fg: "cyan", bg: "default", bold: false },
  render({ ctx, renderWidget }) {
    return renderWidget(ctx.textVerbosity);
  },
});
