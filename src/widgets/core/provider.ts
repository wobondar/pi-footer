import { defineWidget } from "../types.js";

export const ProviderWidget = defineWidget({
  type: "provider",
  label: "Provider",
  category: "Core",
  description: "Active model provider",
  dependencies: ["provider"],
  baseOptions: ["raw", "hideWhenEmpty", "icon", "text"],
  baseOptionDefaults: {},
  properties: [],
  icons: { emoji: "☁️", nerd: "󰒋", text: "provider" },
  defaultStyle: { fg: "cyan", bg: "default", bold: false },
  render({ ctx, renderWidget }) {
    return renderWidget(ctx.provider);
  },
});
