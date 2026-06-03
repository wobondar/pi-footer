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
import { applyOptionField } from "../../../src/ui/option-edit.js";
import { WidgetInstance } from "../../../src/widgets/instance.js";
import { SeparatorWidget } from "../../../src/widgets/layout/separator.js";
import { registry } from "../../../src/widgets/registry.js";
import { WidgetStore } from "../../../src/widgets/store.js";
import type { WidgetContext } from "../../../src/widgets/types.js";

function separator(options: WidgetOptions = {}) {
  return registry.createWidget("separator", options);
}

function ctx(overrides: Partial<WidgetContext> = {}) {
  return {
    iconMode: "text",
    minimalist: false,
    colorLevel: "none",
    ...overrides,
  } satisfies WidgetContext;
}

function optionField(id: string, kind: "boolean" | "number" | "text" | "choice") {
  return { id, label: id, kind };
}

const statuslineData = makeStatuslineData();

describe("SeparatorWidget", () => {
  it("owns metadata and default options", () => {
    expect(SeparatorWidget.type).toBe("separator");
    expect(SeparatorWidget.label).toBe("Separator");
    expect(SeparatorWidget.category).toBe("Custom/Layout");
    expect(SeparatorWidget.description).toBe("Predefined or custom separator segment");
    expect(SeparatorWidget.dependencies).toEqual([]);
    expect(SeparatorWidget.baseOptions).toEqual([]);
    expect(SeparatorWidget.baseOptionDefaults).toEqual({});
    expect(SeparatorWidget.icons).toEqual({ emoji: "", nerd: "", text: "" });
    expect(SeparatorWidget.defaultStyle).toEqual({ fg: "default", bg: "default", bold: false });

    expect(registry.createEntry("separator").options).toMatchObject({
      hideWhenEmpty: true,
      separator: "pipe",
      text: "|",
      fg: "default",
      bg: "default",
      bold: false,
    });
    const widget = separator();
    expect(widget).toBeInstanceOf(WidgetInstance);
    expect(registry.spec(widget.type)).toBe(SeparatorWidget);
  });

  it("renders separator styles through the widget container", () => {
    expect(separator().render(ctx())).toBe(" | ");
    expect(separator({ separator: "comma" }).render(ctx())).toBe(", ");
    expect(separator({ separator: "dash" }).render(ctx())).toBe(" - ");
    expect(separator({ separator: "custom", text: " ~~ " }).render(ctx())).toBe(" ~~ ");
    expect(separator({ separator: "custom", text: "" }).render(ctx())).toBeUndefined();
    expect(separator({ separator: "none" }).render(ctx())).toBeUndefined();
  });

  it("exposes metadata fields and summaries", () => {
    expect(fieldsForWidget(separator()).map((field) => field.id)).toEqual(["enabled", "separator"]);
    expect(fieldsForWidget(separator({ separator: "custom" })).map((field) => field.id)).toEqual([
      "enabled",
      "separator",
      "text",
    ]);
    expect(formatWidgetOptions(separator())).toBe("");
    expect(formatWidgetOptions(separator({ separator: "comma" }))).toBe("separator=comma");
    expect(formatWidgetOptions(separator({ separator: "custom", text: "/" }))).toBe(
      "separator=custom • text='/'",
    );
    expect(formatWidgetOptions(separator({ separator: "custom", text: "" }))).toBe(
      "separator=custom",
    );
    expect(formatWidgetColorOptions(separator({ separator: "custom", text: "/" }))).toBe(
      "separator=custom • text='/'",
    );
  });

  it("normalizes config, edits choices, and hydrates store entries through metadata", () => {
    expect(
      normalizeConfig({
        lines: [[{ type: "separator", options: { separator: "custom", text: "/" } }]],
      }).lines[0]?.[0]?.options,
    ).toMatchObject({ hideWhenEmpty: true, separator: "custom", text: "/" });

    expect(
      normalizeConfig({ lines: [[{ type: "separator", options: { separator: "nope", text: 7 } }]] })
        .lines[0]?.[0]?.options,
    ).toMatchObject({ hideWhenEmpty: true, separator: "pipe", text: "|" });

    const editable = separator({ separator: "pipe" });
    expect(applyOptionField(editable, optionField("separator", "choice"), 1)).toBe("changed");
    expect(editable.options.separator).toBe("space");

    const store = WidgetStore.fromConfig(
      normalizeConfig({ lines: [[{ type: "separator", options: { separator: "dash" } }]] }),
    );
    expect(store.lines[0]?.[0]).toBeInstanceOf(WidgetInstance);
    expect(store.lines[0]?.[0]?.type).toBe(SeparatorWidget.type);
  });

  it("renders through the production store path without surrounding global separators", () => {
    const store = WidgetStore.fromConfig(
      normalizeConfig({
        separator: "dot",
        terminal: { colorLevel: "none" },
        lines: [
          [
            { type: "custom-text", options: { text: "A" } },
            { type: "separator", options: { separator: "custom", text: " ~~ " } },
            { type: "custom-text", options: { text: "B" } },
          ],
        ],
      }),
    );

    expect(renderStatuslines(store, statuslineData, 200)).toEqual(["A ~~ B"]);
  });
});
