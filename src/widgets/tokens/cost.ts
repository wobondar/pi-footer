import { defineWidget } from "../types.js";

export const CostWidget = defineWidget({
  type: "cost",
  label: "Session Cost",
  category: "Tokens",
  description: "Estimated session cost",
  dependencies: ["metrics", "usingSubscription"],
  baseOptions: ["raw", "icon"],
  baseOptionDefaults: {},
  properties: [
    {
      id: "costFormatStyle",
      label: "Cost format",
      kind: "choice",
      description: "Session cost display format",
      default: "default",
      options: {
        choices: [
          { id: "default", label: "Default", list: "Default" },
          { id: "compact", label: "Compact", list: "Compact" },
        ],
        showInWidgets: true,
        showInColors: false,
        listProperty: "format",
      },
    },
    {
      id: "showSubscription",
      label: "Show subscription",
      kind: "boolean",
      description: "Append subscription marker when subscription usage is active",
      default: false,
      options: {
        label: "show-sub",
        showInWidgets: true,
        showInColors: false,
      },
    },
  ],
  icons: { emoji: "💸", nerd: "󱐋", text: "cost" },
  defaultStyle: { fg: "green", bg: "default", bold: false },
  render({ ctx, options, renderWidget }) {
    const cost =
      options.costFormatStyle === "compact"
        ? `$${ctx.metrics.costUsd.toFixed(3)}`
        : `$${ctx.metrics.costUsd.toFixed(ctx.metrics.costUsd < 1 ? 4 : 2)}`;
    const suffix = options.showSubscription && ctx.usingSubscription ? " (sub)" : "";
    return renderWidget(`${cost}${suffix}`);
  },
});
