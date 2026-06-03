import { defineWidget } from "../types.js";
import { formatTokenCount, tokenFormatStyleProperty } from "../utils/token-format.js";

export const InputTokensWidget = defineWidget({
  type: "input-tokens",
  label: "Input Tokens",
  category: "Tokens",
  description: "Input token total",
  dependencies: ["metrics"],
  baseOptions: ["raw", "hideWhenZero", "icon"],
  baseOptionDefaults: {},
  properties: [tokenFormatStyleProperty()],
  icons: { emoji: "⬆️", nerd: "󰌌", text: "in" },
  defaultStyle: { fg: "blue", bg: "default", bold: false },
  render({ ctx, options, renderWidget }) {
    return renderWidget(formatTokenCount(ctx.metrics.inputTokens, options.tokenFormatStyle));
  },
});
