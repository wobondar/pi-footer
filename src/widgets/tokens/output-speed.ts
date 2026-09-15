import { defineWidget } from "../types.js";
import {
  formatTokenSpeed,
  speedUnitProperty,
  speedUnitSuffix,
  tokenFormatStyleProperty,
} from "../utils/token-format.js";

export const OutputSpeedWidget = defineWidget({
  type: "output-speed",
  label: "Output Speed",
  category: "Tokens",
  description: "Average output token speed",
  dependencies: ["metrics"],
  baseOptions: ["raw", "hideWhenZero", "icon"],
  baseOptionDefaults: {},
  properties: [tokenFormatStyleProperty(), speedUnitProperty()],
  icons: { emoji: "⏬", nerd: "", text: "out/min" },
  defaultStyle: { fg: "brightCyan", bg: "default", bold: false },
  render({ ctx, options, renderWidget }) {
    const value = formatTokenSpeed(
      ctx.metrics.outputTokens,
      ctx.metrics.firstTimestampMs,
      ctx.metrics.lastTimestampMs,
      options.tokenFormatStyle,
      options.speedUnit,
    );
    // Only the text icon embeds the unit; emoji/nerd glyphs come from the static set.
    if (ctx.iconMode !== "text") return renderWidget(value);
    return renderWidget(value, {
      icons: { emoji: "", nerd: "", text: `out${speedUnitSuffix(options.speedUnit)}` },
    });
  },
});
