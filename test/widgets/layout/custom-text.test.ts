import { describe, expect, it } from "vitest";

import { normalizeConfig } from "../../../src/config.js";
import { renderStatuslines } from "../../../src/render.js";
import { makeStatuslineData } from "../../helpers/render.js";
import type { WidgetOptions } from "../../../src/types.js";
import {
  fieldsForWidget,
  formatWidgetColorOptions,
  formatWidgetOptions,
} from "../../../src/ui/fields.js";
import { WidgetInstance } from "../../../src/widgets/instance.js";
import { CustomTextWidget } from "../../../src/widgets/layout/custom-text.js";
import { registry } from "../../../src/widgets/registry.js";
import { WidgetStore } from "../../../src/widgets/store.js";
import type { WidgetContext } from "../../../src/widgets/types.js";

function customText(options: WidgetOptions = {}) {
  return registry.createWidget("custom-text", options);
}

function ctx(overrides: Partial<WidgetContext> = {}) {
  return {
    iconMode: "text",
    minimalist: false,
    colorLevel: "none",
    ...overrides,
  } satisfies WidgetContext;
}

const statuslineData = makeStatuslineData();

describe("CustomTextWidget", () => {
  it("owns metadata and default options", () => {
    expect(CustomTextWidget.type).toBe("custom-text");
    expect(CustomTextWidget.label).toBe("Custom Text");
    expect(CustomTextWidget.category).toBe("Custom/Layout");
    expect(CustomTextWidget.description).toBe("User-defined text segment");
    expect(CustomTextWidget.dependencies).toEqual([]);
    expect(CustomTextWidget.baseOptions).toEqual(["text"]);
    expect(CustomTextWidget.baseOptionDefaults).toEqual({ text: "custom" });
    expect(CustomTextWidget.icons).toEqual({ emoji: "", nerd: "", text: "" });
    expect(CustomTextWidget.defaultStyle).toEqual({ fg: "default", bg: "default", bold: false });

    expect(registry.createEntry("custom-text").options).toEqual({
      text: "custom",
      fg: "default",
      bg: "default",
      bold: false,
    });
    const widget = customText();
    expect(widget).toBeInstanceOf(WidgetInstance);
    expect(registry.spec(widget.type)).toBe(CustomTextWidget);
  });

  it("renders custom text through the widget container", () => {
    expect(customText().render(ctx())).toBe("custom");
    expect(customText({ text: "hello" }).render(ctx())).toBe("hello");
    expect(customText({ text: "" }).render(ctx())).toBe("");
    expect(customText({ text: "hello", icon: "X" }).render(ctx())).toBe("hello");

    const disabled = customText({ text: "hidden" });
    disabled.toggle(false);
    expect(disabled.render(ctx())).toBeUndefined();
  });

  it("exposes metadata fields and summaries", () => {
    expect(fieldsForWidget(customText()).map((field) => field.id)).toEqual(["enabled", "text"]);
    expect(formatWidgetOptions(customText())).toBe("text='custom'");
    expect(formatWidgetOptions(customText({ text: "hello" }))).toBe("text='hello'");
    expect(formatWidgetColorOptions(customText({ text: "hello" }))).toBe("text='hello'");
    expect(formatWidgetColorOptions(customText({ text: "hello", fg: "green", bold: true }))).toBe(
      "text='hello' • fg=Green • bold",
    );
  });

  it("normalizes config and hydrates store entries through metadata", () => {
    expect(
      normalizeConfig({
        lines: [[{ type: "custom-text", options: { text: "hello", fg: "green" } }]],
      }).lines[0]?.[0]?.options,
    ).toEqual({ text: "hello", fg: "green", bg: "default", bold: false });

    expect(
      normalizeConfig({ lines: [[{ type: "custom-text", options: { text: 7, raw: true } }]] })
        .lines[0]?.[0]?.options,
    ).toEqual({ text: "custom", fg: "default", bg: "default", bold: false });

    const store = WidgetStore.fromConfig(
      normalizeConfig({ lines: [[{ type: "custom-text", options: { text: "hello" } }]] }),
    );
    expect(store.lines[0]?.[0]).toBeInstanceOf(WidgetInstance);
    expect(store.lines[0]?.[0]?.type).toBe(CustomTextWidget.type);
  });

  it("renders through the production store path", () => {
    const store = WidgetStore.fromConfig(
      normalizeConfig({
        terminal: { colorLevel: "none" },
        lines: [[{ type: "custom-text", options: { text: "hello" } }]],
      }),
    );

    expect(renderStatuslines(store, statuslineData, 200)).toEqual(["hello"]);
  });
});
