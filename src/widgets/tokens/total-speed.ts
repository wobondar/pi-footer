import { defineWidget } from "../types.ts";
import { formatTokenSpeed, tokenFormatStyleProperty } from "../utils/token-format.ts";

export const TotalSpeedWidget = defineWidget({
  type: "total-speed",
  label: "Total Speed",
  category: "Tokens",
  description: "Average total tokens per minute",
  dependencies: ["metrics"],
  baseOptions: ["raw", "hideWhenZero", "icon"],
  baseOptionDefaults: {},
  properties: [tokenFormatStyleProperty()],
  icons: { emoji: "⚡", nerd: "↕", text: "tok/min" },
  defaultStyle: { fg: "brightGreen", bg: "default", bold: false },
  render({ ctx, options, renderWidget }) {
    return renderWidget(
      formatTokenSpeed(
        ctx.metrics.totalTokens,
        ctx.metrics.firstTimestampMs,
        ctx.metrics.lastTimestampMs,
        options.tokenFormatStyle,
      ),
    );
  },
});
