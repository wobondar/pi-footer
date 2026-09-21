import { defineWidget } from "../types.js";
import {
  formatTokenSpeed,
  speedUnitProperty,
  speedUnitSuffix,
  tokenFormatStyleProperty,
} from "../utils/token-format.js";

export const TotalSpeedWidget = defineWidget({
  type: "total-speed",
  label: "Total Speed",
  category: "Tokens",
  description: "Average total token speed",
  dependencies: ["metrics"],
  baseOptions: ["raw", "hideWhenZero", "icon"],
  baseOptionDefaults: {},
  properties: [tokenFormatStyleProperty(), speedUnitProperty()],
  icons: { emoji: "⚡", nerd: "↕", text: "tok/min" },
  defaultStyle: { fg: "brightGreen", bg: "default", bold: false },
  render({ ctx, options, renderWidget }) {
    const value = formatTokenSpeed(
      ctx.metrics.totalTokens,
      ctx.metrics.firstTimestampMs,
      ctx.metrics.lastTimestampMs,
      options.tokenFormatStyle,
      options.speedUnit,
    );
    // Only the text icon embeds the unit; emoji/nerd glyphs come from the static set.
    if (ctx.iconMode !== "text") return renderWidget(value);
    return renderWidget(value, {
      icons: { emoji: "", nerd: "", text: `tok${speedUnitSuffix(options.speedUnit)}` },
    });
  },
});
