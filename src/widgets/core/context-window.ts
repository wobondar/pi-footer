import { defineWidget } from "../types.ts";
import { contextColorProperties, contextColors } from "../utils/context.ts";
import { formatTokenCount, tokenFormatStyleProperty } from "../utils/token-format.ts";

export const ContextWindowWidget = defineWidget({
  type: "context-window",
  label: "Context Window",
  category: "Core",
  description: "Model context window size",
  dependencies: ["contextTokens", "contextMaxTokens"],
  baseOptions: ["raw", "hideWhenZero", "icon"],
  baseOptionDefaults: {},
  properties: [tokenFormatStyleProperty(), ...contextColorProperties()],
  icons: { emoji: "🪟", nerd: "󰍛", text: "window" },
  defaultStyle: { fg: "brightBlack", bg: "default", bold: false },
  render({ ctx, options, renderWidget }) {
    return renderWidget(
      ctx.contextMaxTokens ? formatTokenCount(ctx.contextMaxTokens, options.tokenFormatStyle) : "?",
      {
        ...contextColors(options, ctx.contextTokens, ctx.contextMaxTokens),
      },
    );
  },
});
