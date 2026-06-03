import { defineWidget } from "../types.js";

export const ModelWidget = defineWidget({
  type: "model",
  label: "Model",
  category: "Core",
  description: "Active model id",
  dependencies: ["model", "provider"],
  baseOptions: ["raw", "icon"],
  baseOptionDefaults: {},
  properties: [
    {
      id: "showProvider",
      label: "Show provider",
      kind: "boolean",
      description: "Show provider name before the model id",
      default: false,
      options: {
        label: "with-provider",
        showInWidgets: true,
        showInColors: true,
        listProperty: "",
      },
    },
  ],
  icons: { emoji: "🤖", nerd: "󰚩", text: "model" },
  defaultStyle: { fg: "cyan", bg: "default", bold: false },
  render({ ctx, options, renderWidget }) {
    const value =
      options.showProvider && ctx.provider
        ? `${ctx.provider}/${ctx.model ?? "no-model"}`
        : (ctx.model ?? "no-model");
    return renderWidget(value);
  },
});
