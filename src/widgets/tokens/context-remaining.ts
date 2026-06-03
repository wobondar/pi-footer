import { defineWidget } from "../types.js";
import { contextColors, contextColorProperties, contextPercent } from "../utils/context.js";
import { formatCount } from "../utils/token-format.js";

export const ContextRemainingWidget = defineWidget({
  type: "context-remaining",
  label: "Context Remaining",
  category: "Tokens",
  description: "Remaining context percentage",
  dependencies: ["contextTokens", "contextMaxTokens"],
  baseOptions: ["raw", "icon"],
  baseOptionDefaults: {},
  properties: contextColorProperties(),
  icons: { emoji: "🧩", nerd: "󰍛", text: "ctx left" },
  defaultStyle: { fg: "green", bg: "default", bold: false },
  render({ ctx, options, renderWidget }) {
    return renderWidget(contextRemaining(ctx.contextTokens, ctx.contextMaxTokens), {
      ...contextColors(options, ctx.contextTokens, ctx.contextMaxTokens),
    });
  },
});

function contextRemaining(tokens: number | undefined, maxTokens: number | undefined) {
  if (tokens === undefined) return "?";
  if (maxTokens === undefined || maxTokens <= 0) return `${formatCount(tokens)} ctx`;

  const percent = 100 - (contextPercent(tokens, maxTokens) ?? 0);
  return `${percent.toFixed(1).replace(/\.0$/, "")}%`;
}
