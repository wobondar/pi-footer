import { defineWidget } from "../types.ts";
import { formatTokenCount, tokenFormatStyleProperty } from "../utils/token-format.ts";

export const TokensWidget = defineWidget({
  type: "tokens",
  label: "Input/Output Tokens",
  category: "Tokens",
  description: "Input and output token totals",
  dependencies: ["metrics"],
  baseOptions: ["raw", "icon"],
  baseOptionDefaults: {},
  properties: [tokenFormatStyleProperty()],
  icons: { emoji: "🔢", nerd: "󰓹", text: "tok" },
  defaultStyle: { fg: "cyan", bg: "default", bold: false },
  render({ ctx, options, renderWidget }) {
    return renderWidget(
      `↑${formatTokenCount(ctx.metrics.inputTokens, options.tokenFormatStyle)} ↓${formatTokenCount(ctx.metrics.outputTokens, options.tokenFormatStyle)}`,
    );
  },
});
