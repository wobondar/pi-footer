import { defineWidget } from "../types.js";
import { contextColorProperties, contextColors, contextPercent } from "../utils/context.js";
import {
  formatTokenCount,
  tokenFormatStyleProperty,
  type TokenFormatStyle,
} from "../utils/token-format.js";

const CONTEXT_BAR_MODES = {
  default: {
    label: "Default bar",
    list: "Default bar",
    width: 32,
    filled: "█",
    empty: "░",
    bracketed: true,
    showUsage: true,
  },
  short: {
    label: "Short bar",
    list: "Short bar",
    width: 10,
    filled: "▓",
    empty: "░",
    bracketed: false,
    showUsage: true,
  },
  "short-only": {
    label: "Short bar only",
    list: "Short bar only",
    width: 10,
    filled: "▓",
    empty: "░",
    bracketed: false,
    showUsage: false,
  },
  medium: {
    label: "Medium bar",
    list: "Medium bar",
    width: 16,
    filled: "█",
    empty: "░",
    bracketed: true,
    showUsage: true,
  },
} as const;

type ContextBarMode = keyof typeof CONTEXT_BAR_MODES;

const CONTEXT_BAR_MODE_VALUES = Object.keys(CONTEXT_BAR_MODES) as ContextBarMode[];

const contextBarModeProperty = {
  id: "contextBarMode",
  label: "Display",
  kind: "choice",
  description: "Context bar display mode",
  default: "default",
  options: {
    choices: CONTEXT_BAR_MODE_VALUES.map((mode) => ({
      id: mode,
      label: CONTEXT_BAR_MODES[mode].label,
      list: CONTEXT_BAR_MODES[mode].list,
    })),
    showInWidgets: true,
    showInColors: false,
    listProperty: "display",
  },
} as const;

export const ContextBarWidget = defineWidget({
  type: "context-bar",
  label: "Context Bar",
  category: "Tokens",
  description: "Progress bar for context usage",
  dependencies: ["contextTokens", "contextMaxTokens"],
  baseOptions: ["raw", "hideWhenEmpty", "icon", "text"],
  baseOptionDefaults: { text: "" },
  properties: [tokenFormatStyleProperty(), contextBarModeProperty, ...contextColorProperties()],
  icons: { emoji: "📊", nerd: "󰍛", text: "Context:" },
  defaultStyle: { fg: "blue", bg: "default", bold: false },
  render({ ctx, options, renderWidget }) {
    const { contextBarMode, tokenFormatStyle } = options;
    return renderWidget(
      contextBar(ctx.contextTokens, ctx.contextMaxTokens, contextBarMode, tokenFormatStyle),
      {
        ...contextColors(options, ctx.contextTokens, ctx.contextMaxTokens),
      },
    );
  },
});

function contextBar(
  tokens: number | undefined,
  maxTokens: number | undefined,
  contextBarMode: ContextBarMode,
  tokenFormatStyle: TokenFormatStyle,
) {
  const percent = contextPercent(tokens, maxTokens);
  if (tokens === undefined || maxTokens === undefined || percent === undefined) return "?";

  const usage = `${formatTokenCount(tokens, tokenFormatStyle)}/${formatTokenCount(maxTokens, tokenFormatStyle)} (${Math.round(percent)}%)`;
  const mode = CONTEXT_BAR_MODES[contextBarMode];
  const filledWidth = Math.round((percent / 100) * mode.width);
  const meter = `${mode.filled.repeat(filledWidth)}${mode.empty.repeat(Math.max(0, mode.width - filledWidth))}`;
  const bar = mode.bracketed ? `[${meter}]` : meter;

  return mode.showUsage ? `${bar} ${usage}` : bar;
}
