import { registry } from "../widgets/registry.js";
import type { Widget } from "../widgets/types.js";
import { colorFields, colorFieldValue } from "./fields.js";

const EDIT_COLORS_TITLE_PREFIX = "Colors /";

export function editColorsTitle(widget: Widget): string {
  return `${EDIT_COLORS_TITLE_PREFIX} ${registry.spec(widget.type).label}`;
}

export function editColorsFieldRows(widget: Widget): string[] {
  return colorFields(widget).map((field) => `${field.label}: ${colorFieldValue(widget, field)}`);
}
