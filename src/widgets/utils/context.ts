import { normalizeColor, type ConditionalColorFields } from "../../colors.js";
import type { WidgetOptions } from "../../types.js";
import { colorPair } from "./colors.js";

export function contextPercent(tokens: number | undefined, maxTokens: number | undefined) {
  if (tokens === undefined || maxTokens === undefined || maxTokens <= 0) return undefined;
  return Math.min(100, Math.max(0, (tokens / maxTokens) * 100));
}

interface ContextColorOptions extends WidgetOptions, ConditionalColorFields {
  contextConditionalColors: boolean;
  contextWarningPercent: number;
  contextDangerPercent: number;
}

export function contextColors(
  options: ContextColorOptions,
  contextTokens: number | undefined,
  contextMaxTokens: number | undefined,
) {
  if (!options.contextConditionalColors) return colorPair(options.fg, options.bg);
  const percent = contextPercent(contextTokens, contextMaxTokens);
  if (percent === undefined) return colorPair(options.fg, options.bg);

  if (percent >= options.contextDangerPercent) {
    return colorPair(
      normalizeColor(options.dangerFg) ?? options.fg,
      normalizeColor(options.dangerBg) ?? options.bg,
    );
  }

  if (percent >= options.contextWarningPercent) {
    return colorPair(
      normalizeColor(options.warningFg) ?? options.fg,
      normalizeColor(options.warningBg) ?? options.bg,
    );
  }

  return colorPair(options.fg, options.bg);
}

export function contextColorProperties() {
  return [
    {
      id: "contextConditionalColors",
      label: "Conditional colors",
      kind: "boolean",
      description: "Use warning/danger colors based on context usage",
      default: false,
      options: {
        label: "with-colors",
        showInWidgets: true,
        showInColors: true,
        listProperty: "",
      },
    },
    {
      id: "contextWarningPercent",
      label: "Warning zone threshold",
      kind: "number",
      description: "Context usage percentage for warning colors",
      default: 70,
      showWhen: { property: "contextConditionalColors", equals: true },
      options: { min: 0, max: 100, showInWidgets: false, showInColors: false },
    },
    {
      id: "contextDangerPercent",
      label: "Danger zone threshold",
      kind: "number",
      description: "Context usage percentage for danger colors",
      default: 90,
      showWhen: { property: "contextConditionalColors", equals: true },
      options: { min: 0, max: 100, showInWidgets: false, showInColors: false },
    },
    {
      id: "warningFg",
      label: "Warning foreground",
      kind: "text",
      description: "Warning foreground",
      default: "yellow",
      showWhen: { property: "contextConditionalColors", equals: true },
      options: { showInFields: false, showInWidgets: false, showInColors: false },
    },
    {
      id: "warningBg",
      label: "Warning background",
      kind: "text",
      description: "Warning background",
      default: "default",
      showWhen: { property: "contextConditionalColors", equals: true },
      options: { showInFields: false, showInWidgets: false, showInColors: false },
    },
    {
      id: "dangerFg",
      label: "Danger foreground",
      kind: "text",
      description: "Danger foreground",
      default: "red",
      showWhen: { property: "contextConditionalColors", equals: true },
      options: { showInFields: false, showInWidgets: false, showInColors: false },
    },
    {
      id: "dangerBg",
      label: "Danger background",
      kind: "text",
      description: "Danger background",
      default: "default",
      showWhen: { property: "contextConditionalColors", equals: true },
      options: { showInFields: false, showInWidgets: false, showInColors: false },
    },
  ] as const;
}
