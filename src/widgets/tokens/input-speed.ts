import { defineWidget } from "../types.js";
import { formatTokenSpeed, tokenFormatStyleProperty } from "../utils/token-format.js";

export const InputSpeedWidget = defineWidget({
  type: "input-speed",
  label: "Input Speed",
  category: "Tokens",
  description: "Average input tokens per minute",
  dependencies: ["metrics"],
  baseOptions: ["raw", "hideWhenZero", "icon"],
  baseOptionDefaults: {},
  properties: [tokenFormatStyleProperty()],
  icons: { emoji: "⏫", nerd: "", text: "in/min" },
  defaultStyle: { fg: "brightMagenta", bg: "default", bold: false },
  render({ ctx, options, renderWidget }) {
    return renderWidget(
      formatTokenSpeed(
        ctx.metrics.inputTokens,
        ctx.metrics.firstTimestampMs,
        ctx.metrics.lastTimestampMs,
        options.tokenFormatStyle,
      ),
    );
  },
});
