import { defineWidget } from "../types.js";
import { formatTokenCount, tokenFormatStyleProperty } from "../utils/token-format.js";

export const OutputTokensWidget = defineWidget({
  type: "output-tokens",
  label: "Output Tokens",
  category: "Tokens",
  description: "Output token total",
  dependencies: ["metrics"],
  baseOptions: ["raw", "hideWhenZero", "icon"],
  baseOptionDefaults: {},
  properties: [tokenFormatStyleProperty()],
  icons: { emoji: "⬇️", nerd: "󰧚", text: "out" },
  defaultStyle: { fg: "white", bg: "default", bold: false },
  render({ ctx, options, renderWidget }) {
    return renderWidget(formatTokenCount(ctx.metrics.outputTokens, options.tokenFormatStyle));
  },
});
