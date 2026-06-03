import { visibleWidth } from "@earendil-works/pi-tui";
import { describe, expect, it } from "vitest";

import { normalizeConfig } from "../../../src/config.js";
import { renderStatuslines } from "../../../src/render.js";
import { makeStatuslineData } from "../../helpers/render.js";
import type { WidgetOptions } from "../../../src/types.js";
import { fieldsForWidget, formatWidgetOptions } from "../../../src/ui/fields.js";
import { WidgetInstance } from "../../../src/widgets/instance.js";
import { FlexSeparatorWidget } from "../../../src/widgets/layout/flex-separator.js";
import { registry } from "../../../src/widgets/registry.js";
import { WidgetStore } from "../../../src/widgets/store.js";
import type { WidgetContext } from "../../../src/widgets/types.js";

function flexSeparator(options: WidgetOptions = {}) {
  return registry.createWidget("flex-separator", options);
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

describe("FlexSeparatorWidget", () => {
  it("owns metadata and default options", () => {
    expect(FlexSeparatorWidget.type).toBe("flex-separator");
    expect(FlexSeparatorWidget.label).toBe("Flex Separator");
    expect(FlexSeparatorWidget.category).toBe("Custom/Layout");
    expect(FlexSeparatorWidget.description).toBe("Push following widgets to the right");
    expect(FlexSeparatorWidget.dependencies).toEqual([]);
    expect(FlexSeparatorWidget.baseOptions).toEqual([]);
    expect(FlexSeparatorWidget.baseOptionDefaults).toEqual({});
    expect(FlexSeparatorWidget.icons).toEqual({ emoji: "", nerd: "", text: "" });
    expect(FlexSeparatorWidget.defaultStyle).toEqual({
      fg: "default",
      bg: "default",
      bold: false,
    });

    expect(registry.createEntry("flex-separator").options).toEqual({
      hideWhenEmpty: true,
      fg: "default",
      bg: "default",
      bold: false,
    });
    const widget = flexSeparator();
    expect(widget).toBeInstanceOf(WidgetInstance);
    expect(registry.spec(widget.type)).toBe(FlexSeparatorWidget);
  });

  it("renders no visible segment through the widget container", () => {
    expect(flexSeparator().render(ctx())).toBeUndefined();

    const disabled = flexSeparator();
    disabled.toggle(false);
    expect(disabled.render(ctx())).toBeUndefined();
  });

  it("exposes only enabled in the UI and no widget summary", () => {
    expect(fieldsForWidget(flexSeparator()).map((field) => field.id)).toEqual(["enabled"]);
    expect(formatWidgetOptions(flexSeparator())).toBe("");
  });

  it("normalizes config and hydrates store entries through metadata", () => {
    expect(
      normalizeConfig({ lines: [[{ type: "flex-separator" }]] }).lines[0]?.[0]?.options,
    ).toEqual({ hideWhenEmpty: true, fg: "default", bg: "default", bold: false });

    const store = WidgetStore.fromConfig(
      normalizeConfig({ lines: [[{ type: "flex-separator" }]] }),
    );
    expect(store.lines[0]?.[0]).toBeInstanceOf(WidgetInstance);
    expect(store.lines[0]?.[0]?.type).toBe(FlexSeparatorWidget.type);
  });

  it("keeps right-side widgets aligned through the production store path", () => {
    const store = WidgetStore.fromConfig(
      normalizeConfig({
        terminal: { colorLevel: "none" },
        lines: [
          [
            { type: "custom-text", options: { text: "left" } },
            { type: "flex-separator" },
            { type: "custom-text", options: { text: "right" } },
          ],
        ],
      }),
    );

    const line = renderStatuslines(store, statuslineData, 20)[0] ?? "";
    expect(visibleWidth(line)).toBe(20);
    expect(line.startsWith("left")).toBe(true);
    expect(line.endsWith("right")).toBe(true);
  });
});
