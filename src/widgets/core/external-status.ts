import type { WidgetOptions } from "../../types.js";
import { defineWidget } from "../types.js";

export const ExtensionStatusWidget = defineWidget({
  type: "external-status",
  label: "Extension Status",
  category: "Core",
  description: "Status value published by another pi extension through ctx.ui.setStatus",
  dependencies: ["getExtensionStatuses"],
  baseOptions: ["raw", "hideWhenEmpty", "icon", "text"],
  baseOptionDefaults: { hideWhenEmpty: true },
  properties: [
    {
      id: "externalStatusKey",
      label: "Status key",
      kind: "text",
      description: "Extension status key to render",
      default: "",
      options: {
        showInWidgets: true,
        showInColors: true,
        listProperty: "status",
        editAction: "external-status-key",
      },
    },
    {
      id: "trimValue",
      label: "Trim value",
      kind: "number",
      description: "Leading visible characters to trim from the status value",
      default: 0,
      options: {
        min: 0,
        max: 10,
        showInWidgets: true,
        showInColors: false,
        listProperty: "trim",
      },
    },
    {
      id: "preserveTrimStyles",
      label: "Preserve trim styles",
      kind: "boolean",
      description: "Replay ANSI styles from the trimmed prefix after labels or custom icons",
      default: true,
      options: {
        showInWidgets: false,
        showInColors: false,
      },
    },
  ],
  icons: { emoji: "", nerd: "", text: "" },
  defaultStyle: { fg: "default", bg: "default", bold: false },
  render({ ctx, options, renderWidget }) {
    const key = options.externalStatusKey.trim();
    const value = key ? ctx.getExtensionStatuses?.()?.get(key) : undefined;
    const rendered = value
      ? trimLeadingVisibleChars(value, options.trimValue, options.preserveTrimStyles)
      : { value: "" };
    return renderWidget(rendered.value, {
      ...(rendered.preservedTrimStyles
        ? { preservedTrimStyles: rendered.preservedTrimStyles }
        : {}),
      ...(shouldStripIncomingStyles(options) ? { stripIncomingStyles: true } : {}),
    });
  },
});

function shouldStripIncomingStyles(options: WidgetOptions) {
  return (
    (options.fg !== undefined && options.fg !== "default") ||
    (options.bg !== undefined && options.bg !== "default") ||
    options.bold === true
  );
}

function trimLeadingVisibleChars(text: string, count: number, preserveStyles: boolean) {
  if (count <= 0) return { value: text };

  let trimmed = 0;
  let index = 0;
  let preservedStyles = "";
  while (index < text.length && trimmed < count) {
    // ANSI sequences have zero visible width. Keep walking without counting them as trimmed chars.
    // oxlint-disable-next-line no-control-regex
    const ansiMatch = /^\x1b\[[0-?]*[ -/]*[@-~]/.exec(text.slice(index));
    if (ansiMatch) {
      if (preserveStyles) preservedStyles += ansiMatch[0];
      index += ansiMatch[0].length;
      continue;
    }

    // Advance by Unicode code point so surrogate-pair symbols count as one visible character.
    const codePoint = text.codePointAt(index);
    if (codePoint === undefined) break;
    index += codePoint > 0xffff ? 2 : 1;
    trimmed += 1;
  }

  const value = text.slice(index);
  return preservedStyles ? { value, preservedTrimStyles: preservedStyles } : { value };
}
