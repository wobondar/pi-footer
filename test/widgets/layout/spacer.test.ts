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
import { SpacerWidget } from "../../../src/widgets/layout/spacer.js";
import { registry } from "../../../src/widgets/registry.js";
import { WidgetStore } from "../../../src/widgets/store.js";
import type { WidgetContext } from "../../../src/widgets/types.js";

function spacer(options: WidgetOptions = {}) {
  return registry.createWidget("spacer", options);
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
  return { id, label: id, kind, min: 1, max: 40 };
}

const statuslineData = makeStatuslineData();

describe("SpacerWidget", () => {
  it("owns metadata and default options", () => {
    expect(SpacerWidget.type).toBe("spacer");
    expect(SpacerWidget.label).toBe("Spacer");
    expect(SpacerWidget.category).toBe("Custom/Layout");
    expect(SpacerWidget.description).toBe("Fixed-width blank spacer");
    expect(SpacerWidget.dependencies).toEqual([]);
    expect(SpacerWidget.baseOptions).toEqual([]);
    expect(SpacerWidget.baseOptionDefaults).toEqual({});
    expect(SpacerWidget.icons).toEqual({ emoji: "", nerd: "", text: "" });
    expect(SpacerWidget.defaultStyle).toEqual({ fg: "default", bg: "default", bold: false });

    expect(registry.createEntry("spacer").options).toEqual({
      width: 2,
      fg: "default",
      bg: "default",
      bold: false,
    });
    const widget = spacer();
    expect(widget).toBeInstanceOf(WidgetInstance);
    expect(registry.spec(widget.type)).toBe(SpacerWidget);
  });

  it("renders fixed-width spaces through the widget container", () => {
    expect(spacer().render(ctx())).toBe("  ");
    expect(spacer({ width: 4 }).render(ctx())).toBe("    ");

    const disabled = spacer({ width: 4 });
    disabled.toggle(false);
    expect(disabled.render(ctx())).toBeUndefined();
  });

  it("exposes metadata fields and summaries", () => {
    expect(fieldsForWidget(spacer()).map((field) => field.id)).toEqual(["enabled", "width"]);
    expect(fieldsForWidget(spacer())[1]).toMatchObject({ id: "width", min: 1, max: 40 });
    expect(formatWidgetOptions(spacer())).toBe("width=2");
    expect(formatWidgetOptions(spacer({ width: 3 }))).toBe("width=3");
    expect(formatWidgetColorOptions(spacer({ width: 3 }))).toBe("width=3");
  });

  it("normalizes config, edits width, and hydrates store entries through metadata", () => {
    expect(
      normalizeConfig({ lines: [[{ type: "spacer", options: { width: 4 } }]] }).lines[0]?.[0]
        ?.options,
    ).toEqual({ width: 4, fg: "default", bg: "default", bold: false });

    expect(
      normalizeConfig({ lines: [[{ type: "spacer", options: { width: 100 } }]] }).lines[0]?.[0]
        ?.options,
    ).toEqual({ width: 40, fg: "default", bg: "default", bold: false });

    const editable = spacer({ width: 2 });
    expect(applyOptionField(editable, optionField("width", "number"), -10)).toBe("changed");
    expect(editable.options.width).toBe(1);

    const store = WidgetStore.fromConfig(
      normalizeConfig({ lines: [[{ type: "spacer", options: { width: 4 } }]] }),
    );
    expect(store.lines[0]?.[0]).toBeInstanceOf(WidgetInstance);
    expect(store.lines[0]?.[0]?.type).toBe(SpacerWidget.type);
  });

  it("renders through the production store path", () => {
    const store = WidgetStore.fromConfig(
      normalizeConfig({
        terminal: { colorLevel: "none" },
        lines: [
          [
            { type: "custom-text", options: { text: "A" } },
            { type: "spacer" },
            { type: "custom-text", options: { text: "B" } },
          ],
        ],
      }),
    );

    expect(renderStatuslines(store, statuslineData, 200)).toEqual(["A •    • B"]);
  });
});
