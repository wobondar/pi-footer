import { colorDisplayName, normalizeColor } from "../colors.js";
import type { WidgetOptions } from "../types.js";
import { registry } from "../widgets/registry.js";
import type { Widget, WidgetProperty } from "../widgets/types.js";
import type { ColorOptionField, OptionField } from "./model.js";

export function fieldsForWidget(widget: Widget): OptionField[] {
  const spec = registry.spec(widget.type);
  const properties: readonly WidgetProperty[] = spec.properties;
  const fields: OptionField[] = [{ id: "enabled", label: "Enabled", kind: "boolean" }];

  for (const option of spec.baseOptions) {
    if (option === "raw") fields.push({ id: "raw", label: "Raw value only", kind: "boolean" });
    if (option === "hideWhenEmpty")
      fields.push({ id: "hideWhenEmpty", label: "Hide when empty", kind: "boolean" });
    if (option === "hideWhenZero")
      fields.push({ id: "hideWhenZero", label: "Hide when zero", kind: "boolean" });
    if (option === "icon") fields.push({ id: "icon", label: "Custom icon", kind: "text" });
    if (option === "text" && !widget.options.hideWhenEmpty)
      fields.push({ id: "text", label: "Text when empty", kind: "text" });
  }

  for (const property of properties) {
    if (property.options?.showInFields === false) continue;
    if (!isMetadataPropertyVisible(property, widget.options)) continue;
    fields.push(metadataField(property));
  }

  return fields;
}

export function colorFields(widget?: Widget): ColorOptionField[] {
  const fields: ColorOptionField[] = [
    { id: "fg", label: "Foreground", kind: "color" },
    { id: "bg", label: "Background", kind: "color" },
    { id: "bold", label: "Bold", kind: "boolean" },
    { id: "fgAnsi", label: "Custom ANSI256 foreground", kind: "ansi" },
    { id: "bgAnsi", label: "Custom ANSI256 background", kind: "ansi" },
  ];
  if (
    widget &&
    registry
      .spec(widget.type)
      .properties.find((property) => property.id === "contextConditionalColors") &&
    widget.options.contextConditionalColors
  ) {
    fields.push(
      { id: "warningFg", label: "Warning foreground", kind: "color" },
      { id: "warningBg", label: "Warning background", kind: "color" },
      { id: "warningFgAnsi", label: "Custom ANSI256 warning foreground", kind: "ansi" },
      { id: "warningBgAnsi", label: "Custom ANSI256 warning background", kind: "ansi" },
      { id: "dangerFg", label: "Danger foreground", kind: "color" },
      { id: "dangerBg", label: "Danger background", kind: "color" },
      { id: "dangerFgAnsi", label: "Custom ANSI256 danger foreground", kind: "ansi" },
      { id: "dangerBgAnsi", label: "Custom ANSI256 danger background", kind: "ansi" },
    );
  }
  return fields;
}

export function fieldValue(widget: Widget, field: OptionField): string {
  if (field.id === "enabled") return widget.enabled ? "on" : "off";
  if (field.kind === "boolean") return getBooleanField(widget, field.id) ? "on" : "off";
  if (field.kind === "number") return String(getNumberField(widget, field.id) ?? "");
  if (field.kind === "choice") {
    const value = getTextField(widget, field.id);
    return field.choices?.find((choice) => choice.id === value)?.label ?? value;
  }
  return getTextField(widget, field.id) || "(empty)";
}

export function colorFieldValue(widget: Widget, field: ColorOptionField): string {
  if (field.id === "bold") return widget.options.bold ? "on" : "off";
  if (field.id === "fg") return colorDisplayName(widget.options.fg);
  if (field.id === "bg") return colorDisplayName(widget.options.bg);
  if (field.id === "warningFg") return colorDisplayName(colorOption(widget, "warningFg"));
  if (field.id === "warningBg") return colorDisplayName(colorOption(widget, "warningBg"));
  if (field.id === "dangerFg") return colorDisplayName(colorOption(widget, "dangerFg"));
  if (field.id === "dangerBg") return colorDisplayName(colorOption(widget, "dangerBg"));
  if (field.id === "fgAnsi")
    return widget.options.fg?.startsWith("ansi256:") ? widget.options.fg.slice(8) : "0";
  if (field.id === "bgAnsi")
    return widget.options.bg?.startsWith("ansi256:") ? widget.options.bg.slice(8) : "0";
  if (field.id === "warningFgAnsi") {
    const color = colorOption(widget, "warningFg");
    return color?.startsWith("ansi256:") ? color.slice(8) : "0";
  }
  if (field.id === "warningBgAnsi") {
    const color = colorOption(widget, "warningBg");
    return color?.startsWith("ansi256:") ? color.slice(8) : "0";
  }
  if (field.id === "dangerFgAnsi") {
    const color = colorOption(widget, "dangerFg");
    return color?.startsWith("ansi256:") ? color.slice(8) : "0";
  }
  if (field.id === "dangerBgAnsi") {
    const color = colorOption(widget, "dangerBg");
    return color?.startsWith("ansi256:") ? color.slice(8) : "0";
  }
  return "";
}

export function getBooleanField(widget: Widget, id: string): boolean {
  const spec = registry.spec(widget.type);
  const property = spec.properties.find((item) => item.id === id);
  if (property?.kind === "boolean") return Boolean(widget.options[id] ?? property.default);
  if (spec.baseOptions.some((option) => option === id)) {
    if (id === "raw") return widget.options.raw ?? false;
    if (id === "hideWhenEmpty") return widget.options.hideWhenEmpty ?? false;
    if (id === "hideWhenZero") return widget.options.hideWhenZero ?? false;
  }
  return false;
}

export function getNumberField(widget: Widget, id: string): number | undefined {
  const property = registry.spec(widget.type).properties.find((item) => item.id === id);
  if (property?.kind === "number") {
    const value = widget.options[id];
    return typeof value === "number" ? value : Number(property.default);
  }
  return undefined;
}

export function getTextField(widget: Widget, id: string): string {
  const spec = registry.spec(widget.type);
  const property = spec.properties.find((item) => item.id === id);
  if (property && (property.kind === "text" || property.kind === "choice")) {
    const value = widget.options[id];
    return typeof value === "string" ? value : String(property.default);
  }
  if (spec.baseOptions.some((option) => option === id)) {
    if (id === "icon") return widget.options.icon ?? "";
    if (id === "text") return widget.options.text ?? "";
  }
  return "";
}

export function formatWidgetOptions(widget: Widget): string {
  const spec = registry.spec(widget.type);
  const properties: readonly WidgetProperty[] = spec.properties;
  const parts = baseSummaryParts(widget);
  if (spec.baseOptions.some((option) => option === "hideWhenZero") && widget.options.hideWhenZero)
    parts.push("hide-zero");
  if (
    spec.baseOptions.some((option) => option === "text") &&
    !widget.options.hideWhenEmpty &&
    widget.options.text
  )
    parts.push(`text='${widget.options.text}'`);
  for (const property of properties) {
    if (!isMetadataPropertyVisible(property, widget.options)) continue;
    if (property.options?.showInWidgets === false) continue;
    addMetadataSummaryPart(parts, widget, property);
  }
  return parts.join(" • ");
}

export function formatWidgetColorOptions(widget: Widget): string {
  const summary = formatMetadataWidgetColorOptions(widget);
  const colorSummary = formatColorStyleSummary(widget);
  if (!summary) return colorSummary;
  if (!colorSummary) return summary;
  return `${summary} • ${colorSummary}`;
}

export function isMetadataPropertyVisible(
  property: WidgetProperty,
  options: WidgetOptions,
): boolean {
  const condition = property.showWhen;
  if (!condition) return true;
  return options[condition.property] === condition.equals;
}

function colorOption(widget: Widget, key: string) {
  return normalizeColor(widget.options[key]);
}

function formatMetadataWidgetColorOptions(widget: Widget): string {
  const spec = registry.spec(widget.type);
  const properties: readonly WidgetProperty[] = spec.properties;
  const parts = baseSummaryParts(widget);
  if (
    spec.baseOptions.some((option) => option === "text") &&
    !widget.options.hideWhenEmpty &&
    widget.options.text
  )
    parts.push(`text='${widget.options.text}'`);
  for (const property of properties) {
    if (!isMetadataPropertyVisible(property, widget.options)) continue;
    if (!property.options?.showInColors) continue;
    addMetadataSummaryPart(parts, widget, property);
  }
  return parts.join(" • ");
}

function metadataField(property: WidgetProperty): OptionField {
  const field: OptionField = {
    id: property.id,
    label: property.label,
    kind: property.kind,
  };
  if (property.options?.min !== undefined) field.min = property.options.min;
  if (property.options?.max !== undefined) field.max = property.options.max;
  if (property.options?.choices !== undefined) field.choices = property.options.choices;
  if (property.options?.editAction !== undefined) field.editAction = property.options.editAction;
  return field;
}

function addMetadataSummaryPart(parts: string[], widget: Widget, property: WidgetProperty): void {
  const value = widget.options[property.id] ?? property.default;
  if (property.kind === "boolean") {
    if (value === true) parts.push(property.options?.label ?? property.id);
    return;
  }
  if (property.kind === "choice") {
    if (value === property.default) return;
    const choice = property.options?.choices?.find((item) => item.id === value);
    const label = choice?.list ?? String(value);
    const prefix = property.options?.listProperty || property.id;
    if (prefix) parts.push(`${prefix}=${label}`);
    else parts.push(label);
    return;
  }
  if (property.kind === "number" || property.kind === "text") {
    const prefix = property.options?.listProperty || property.id;
    const renderedValue = property.options?.quoteValue ? `'${String(value)}'` : String(value);
    if (value !== undefined && value !== "") parts.push(`${prefix}=${renderedValue}`);
  }
}

function baseSummaryParts(widget: Widget): string[] {
  const { options } = widget;
  const spec = registry.spec(widget.type);
  const parts: string[] = [];
  if (spec.baseOptions.some((option) => option === "raw") && options.raw) parts.push("raw");
  if (spec.baseOptions.some((option) => option === "hideWhenEmpty") && options.hideWhenEmpty)
    parts.push("hide-empty");
  if (spec.baseOptions.some((option) => option === "icon") && options.icon)
    parts.push(`icon='${options.icon}'`);
  return parts;
}

function formatColorStyleSummary(widget: Widget): string {
  const { options } = widget;
  const defaultFg = registry.spec(widget.type).defaultStyle.fg ?? "default";
  const parts: string[] = [];
  if (options.fg && options.fg !== defaultFg) parts.push(`fg=${colorDisplayName(options.fg)}`);
  if (options.bg && options.bg !== "default") parts.push(`bg=${colorDisplayName(options.bg)}`);
  if (options.bold) parts.push("bold");
  return parts.join(" • ");
}
