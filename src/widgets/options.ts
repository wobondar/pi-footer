import { normalizeColor } from "../colors.js";
import type { WidgetOptions } from "../types.js";
import type { WidgetProperty, WidgetPropertyDefault, WidgetSpec } from "./types.js";

const SYSTEM_BASE_OPTION_DEFAULTS = {
  raw: false,
  hideWhenEmpty: false,
  hideWhenZero: false,
  text: "-",
  icon: "",
} as const;

// The options-relevant slice of a spec, derived from WidgetSpec (excludes render so concrete
// widget specs stay assignable — render's generic params make the full spec invariant).
type WidgetOptionsSpec = Pick<
  WidgetSpec,
  "baseOptions" | "baseOptionDefaults" | "properties" | "defaultStyle" | "createOptionDefaults"
>;

export function defaultOptionsFromSpec(spec: WidgetOptionsSpec): WidgetOptions {
  const base: WidgetOptions = {};

  for (const option of spec.baseOptions) {
    const optionId: string = option;
    base[optionId] = SYSTEM_BASE_OPTION_DEFAULTS[option];
  }
  Object.assign(base, spec.baseOptionDefaults ?? {});

  for (const property of spec.properties) {
    base[property.id] = property.default;
  }

  const dynamicDefaults = spec.createOptionDefaults?.();
  if (dynamicDefaults) Object.assign(base, dynamicDefaults);

  if (spec.defaultStyle.fg !== undefined) base.fg = spec.defaultStyle.fg;
  if (spec.defaultStyle.bg !== undefined) base.bg = spec.defaultStyle.bg;
  if (spec.defaultStyle.bold !== undefined) base.bold = spec.defaultStyle.bold;

  return base;
}

export function sanitizeOptionsFromSpec(
  spec: WidgetOptionsSpec,
  input: Record<string, unknown>,
): WidgetOptions {
  const defaults = defaultOptionsFromSpec(spec);
  const merged: Record<string, unknown> = { ...defaults, ...input };
  const next: WidgetOptions = {};

  for (const option of spec.baseOptions) {
    if (!(option in defaults)) continue;
    const optionId: string = option;
    next[optionId] = sanitizeMetadataValue(merged[optionId], defaults[optionId]);
  }

  const fg = normalizeColor(merged.fg);
  if (fg) next.fg = fg;
  const bg = normalizeColor(merged.bg);
  if (bg) next.bg = bg;
  next.bold = typeof merged.bold === "boolean" ? merged.bold : Boolean(defaults.bold);

  for (const property of spec.properties) {
    next[property.id] = sanitizeWidgetProperty(property, merged[property.id]);
  }

  return next;
}

function sanitizeWidgetProperty(
  property: WidgetProperty,
  value: unknown,
): string | number | boolean {
  switch (property.kind) {
    case "boolean":
      return typeof value === "boolean" ? value : property.default;
    case "number":
      return sanitizeMetadataNumber(
        value,
        property.default,
        property.options?.min,
        property.options?.max,
      );
    case "text":
      if (
        property.id === "warningFg" ||
        property.id === "warningBg" ||
        property.id === "dangerFg" ||
        property.id === "dangerBg"
      )
        return normalizeColor(value) ?? property.default;
      return typeof value === "string" ? value : property.default;
    case "choice": {
      const choices = property.options?.choices ?? [];
      return typeof value === "string" && choices.some((choice) => choice.id === value)
        ? value
        : property.default;
    }
  }
}

function sanitizeMetadataValue(
  value: unknown,
  defaultValue: WidgetOptions[keyof WidgetOptions],
): WidgetOptions[keyof WidgetOptions] {
  if (typeof defaultValue === "boolean") return typeof value === "boolean" ? value : defaultValue;
  if (typeof defaultValue === "number")
    return typeof value === "number" && Number.isInteger(value) ? value : defaultValue;
  if (typeof defaultValue === "string") return typeof value === "string" ? value : defaultValue;
  return defaultValue;
}

function sanitizeMetadataNumber(
  value: unknown,
  defaultValue: WidgetPropertyDefault,
  min = Number.NEGATIVE_INFINITY,
  max = Number.POSITIVE_INFINITY,
): number {
  const numberValue = typeof value === "number" && Number.isInteger(value) ? value : defaultValue;
  const safeNumber = typeof numberValue === "number" ? numberValue : 0;
  return Math.min(max, Math.max(min, safeNumber));
}
