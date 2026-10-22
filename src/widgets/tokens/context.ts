import { defineWidget } from "../types.ts";
import { contextColors, contextColorProperties, contextPercent } from "../utils/context.ts";
import { formatCount } from "../utils/token-format.ts";

export const ContextWidget = defineWidget({
  type: "context",
  label: "Context %",
  category: "Tokens",
  description: "Current context usage percentage",
  dependencies: ["contextTokens", "contextMaxTokens"],
  baseOptions: ["raw", "icon"],
  baseOptionDefaults: {},
  properties: contextColorProperties(),
  icons: { emoji: "🧩", nerd: "󰍛", text: "ctx" },
  defaultStyle: { fg: "blue", bg: "default", bold: false },
  render({ ctx, options, renderWidget }) {
    return renderWidget(contextUsage(ctx.contextTokens, ctx.contextMaxTokens), {
      ...contextColors(options, ctx.contextTokens, ctx.contextMaxTokens),
    });
  },
});

function contextUsage(tokens: number | undefined, maxTokens: number | undefined) {
  if (tokens === undefined) return "?";
  if (maxTokens === undefined || maxTokens <= 0) return `${formatCount(tokens)} ctx`;

  const percent = contextPercent(tokens, maxTokens) ?? 0;
  return `${percent.toFixed(1).replace(/\.0$/, "")}%`;
}
