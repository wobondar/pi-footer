import { defineWidget } from "../types.js";

export const ModelProviderWidget = defineWidget({
  type: "model-provider",
  label: "Provider/Model",
  category: "Core",
  description: "Provider and model together",
  dependencies: ["model", "provider"],
  baseOptions: ["raw", "icon"],
  baseOptionDefaults: {},
  properties: [],
  icons: { emoji: "🤖", nerd: "󰚩", text: "model" },
  defaultStyle: { fg: "cyan", bg: "default", bold: false },
  render({ ctx, renderWidget }) {
    const value = ctx.provider
      ? `${ctx.provider}/${ctx.model ?? "no-model"}`
      : (ctx.model ?? "no-model");
    return renderWidget(value);
  },
});
