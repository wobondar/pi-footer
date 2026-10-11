import { defineWidget } from "../types.ts";
import { formatTokenSpeed, tokenFormatStyleProperty } from "../utils/token-format.ts";

export const OutputSpeedWidget = defineWidget({
  type: "output-speed",
  label: "Output Speed",
  category: "Tokens",
  description: "Average output tokens per minute",
  dependencies: ["metrics"],
  baseOptions: ["raw", "hideWhenZero", "icon"],
  baseOptionDefaults: {},
  properties: [tokenFormatStyleProperty()],
  icons: { emoji: "⏬", nerd: "", text: "out/min" },
  defaultStyle: { fg: "brightCyan", bg: "default", bold: false },
  render({ ctx, options, renderWidget }) {
    return renderWidget(
      formatTokenSpeed(
        ctx.metrics.outputTokens,
        ctx.metrics.firstTimestampMs,
        ctx.metrics.lastTimestampMs,
        options.tokenFormatStyle,
      ),
    );
  },
});
