import { defineWidget } from "../types.ts";
import { contextColorProperties, contextColors } from "../utils/context.ts";
import { formatTokenCount, tokenFormatStyleProperty } from "../utils/token-format.ts";

export const ContextLengthWidget = defineWidget({
  type: "context-length",
  label: "Context Length",
  category: "Tokens",
  description: "Current context token count",
  dependencies: ["contextTokens", "contextMaxTokens"],
  baseOptions: ["raw", "hideWhenZero", "icon"],
  baseOptionDefaults: {},
  properties: [tokenFormatStyleProperty(), ...contextColorProperties()],
  icons: { emoji: "📏", nerd: "󰍛", text: "ctx len" },
  defaultStyle: { fg: "brightBlack", bg: "default", bold: false },
  render({ ctx, options, renderWidget }) {
    return renderWidget(
      ctx.contextTokens === undefined
        ? "?"
        : formatTokenCount(ctx.contextTokens, options.tokenFormatStyle),
      {
        ...contextColors(options, ctx.contextTokens, ctx.contextMaxTokens),
      },
    );
  },
});
