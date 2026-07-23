import { defineWidget } from "../types.js";

export const CacheHitRateWidget = defineWidget({
  type: "cache-hit-rate",
  label: "Cache Hit Rate",
  category: "Tokens",
  description: "Session or latest turn cache hit percentage",
  dependencies: ["metrics", "turnMetrics"],
  baseOptions: ["raw", "hideWhenZero", "icon"],
  baseOptionDefaults: {},
  properties: [
    {
      id: "cacheHitSource",
      label: "Source",
      kind: "choice",
      description: "Cache hit rate source",
      default: "session",
      options: {
        choices: [
          { id: "session", label: "Session", list: "Session" },
          { id: "turn", label: "Last Turn", list: "Turn" },
        ],
        showInWidgets: true,
        showInColors: true,
        listProperty: "source",
      },
    },
    {
      id: "style",
      label: "Style",
      kind: "choice",
      description: "Display style",
      default: "default",
      options: {
        choices: [
          { id: "default", label: "Default", list: "default" },
          { id: "compact", label: "Compact", list: "compact" },
        ],
        showInWidgets: true,
        showInColors: false,
        listProperty: "style",
      },
    },
  ],
  icons: { emoji: "🎯", nerd: "󰓎", text: "cache hit" },
  defaultStyle: { fg: "cyan", bg: "default", bold: false },
  render({ ctx, options, renderWidget }) {
    const source = options.cacheHitSource === "turn" ? ctx.turnMetrics : ctx.metrics;
    const { inputTokens, cacheReadTokens, cacheWriteTokens } = source;
    const promptTokens = inputTokens + cacheReadTokens + cacheWriteTokens;
    const hitRate = promptTokens > 0 ? (cacheReadTokens / promptTokens) * 100 : 0;
    if (hitRate === 0 && options.hideWhenZero) return undefined;
    return renderWidget(`${hitRate.toFixed(options.style === "compact" ? 0 : 1)}%`);
  },
});
