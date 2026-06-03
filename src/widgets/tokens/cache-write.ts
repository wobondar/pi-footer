import { defineWidget } from "../types.js";
import { formatTokenCount, tokenFormatStyleProperty } from "../utils/token-format.js";

export const CacheWriteWidget = defineWidget({
  type: "cache-write",
  label: "Cache Write",
  category: "Tokens",
  description: "Cache write token total",
  dependencies: ["metrics"],
  baseOptions: ["raw", "hideWhenZero", "icon"],
  baseOptionDefaults: {},
  properties: [tokenFormatStyleProperty()],
  icons: { emoji: "✍️", nerd: "󰆼", text: "cache write" },
  defaultStyle: { fg: "cyan", bg: "default", bold: false },
  render({ ctx, options, renderWidget }) {
    return renderWidget(formatTokenCount(ctx.metrics.cacheWriteTokens, options.tokenFormatStyle));
  },
});
