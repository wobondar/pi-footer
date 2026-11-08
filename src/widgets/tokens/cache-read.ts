import { defineWidget } from "../types.ts";
import { formatTokenCount, tokenFormatStyleProperty } from "../utils/token-format.ts";

export const CacheReadWidget = defineWidget({
  type: "cache-read",
  label: "Cache Read",
  category: "Tokens",
  description: "Cache read token total",
  dependencies: ["metrics"],
  baseOptions: ["raw", "hideWhenZero", "icon"],
  baseOptionDefaults: {},
  properties: [tokenFormatStyleProperty()],
  icons: { emoji: "📖", nerd: "󰆼", text: "cache read" },
  defaultStyle: { fg: "cyan", bg: "default", bold: false },
  render({ ctx, options, renderWidget }) {
    return renderWidget(formatTokenCount(ctx.metrics.cacheReadTokens, options.tokenFormatStyle));
  },
});
