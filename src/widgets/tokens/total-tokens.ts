import { defineWidget } from "../types.ts";
import { formatTokenCount, tokenFormatStyleProperty } from "../utils/token-format.ts";

export const TotalTokensWidget = defineWidget({
  type: "total-tokens",
  label: "Total Tokens",
  category: "Tokens",
  description: "Total token count",
  dependencies: ["metrics"],
  baseOptions: ["raw", "hideWhenZero", "icon"],
  baseOptionDefaults: {},
  properties: [tokenFormatStyleProperty()],
  icons: { emoji: "🔢", nerd: "󰓹", text: "tok" },
  defaultStyle: { fg: "cyan", bg: "default", bold: false },
  render({ ctx, options, renderWidget }) {
    return renderWidget(formatTokenCount(ctx.metrics.totalTokens, options.tokenFormatStyle));
  },
});
