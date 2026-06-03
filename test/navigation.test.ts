import { describe, expect, it } from "vitest";

import { createHydratedWidgetForTest } from "./helpers/widgets.js";
import { fieldsForWidget } from "../src/ui/fields.js";
import { adjustAnsi, clamp, cycle, escapeTarget, isPrintable, wrap } from "../src/ui/helpers.js";
import { pageSelection, rangeLabel, scrollWindow } from "../src/ui/navigation.js";

describe("pi-footer UI fields", () => {
  it("hides raw, empty, and icon options for separator widgets", () => {
    expect(
      fieldsForWidget(createHydratedWidgetForTest("separator")).map((field) => field.id),
    ).toEqual(["enabled", "separator"]);
    expect(
      fieldsForWidget(createHydratedWidgetForTest("separator", { separator: "custom" })).map(
        (field) => field.id,
      ),
    ).toEqual(["enabled", "separator", "text"]);
  });

  it("hides raw, empty, and icon options for flex separator widgets", () => {
    expect(
      fieldsForWidget(createHydratedWidgetForTest("flex-separator")).map((field) => field.id),
    ).toEqual(["enabled"]);
  });

  it("keeps raw toggle available for value widgets", () => {
    expect(
      fieldsForWidget(createHydratedWidgetForTest("model")).map((field) => field.id),
    ).toContain("raw");
  });
});

describe("pi-footer UI navigation helpers", () => {
  it("pages selections within bounds", () => {
    expect(pageSelection(5, 10, 4, -1)).toBe(1);
    expect(pageSelection(5, 10, 4, 1)).toBe(9);
    expect(pageSelection(1, 10, 4, -1)).toBe(0);
    expect(pageSelection(9, 10, 4, 1)).toBe(9);
    expect(pageSelection(0, 0, 4, 1)).toBe(0);
  });

  it("calculates centered scroll windows", () => {
    expect(scrollWindow(20, 10, 5)).toEqual({ start: 8, end: 13 });
    expect(scrollWindow(20, 0, 5)).toEqual({ start: 0, end: 5 });
    expect(scrollWindow(20, 19, 5)).toEqual({ start: 15, end: 20 });
    expect(scrollWindow(3, 1, 5)).toEqual({ start: 0, end: 3 });
  });

  it("formats visible ranges", () => {
    expect(rangeLabel(0, 5, 10)).toBe("1-5");
    expect(rangeLabel(5, 10, 10)).toBe("6-10");
    expect(rangeLabel(0, 0, 0)).toBe("0-0");
  });
});

describe("pi-footer UI navigation", () => {
  it("returns from widget editing to line selection", () => {
    expect(escapeTarget("widget-list")).toBe("line-list");
    expect(escapeTarget("edit-widget")).toBe("widget-list");
    expect(escapeTarget("add-widget")).toBe("widget-list");
  });

  it("returns from color editing to color line selection", () => {
    expect(escapeTarget("color-widget-list")).toBe("color-line-list");
    expect(escapeTarget("edit-colors")).toBe("color-widget-list");
  });

  it("handles top-level and confirmation escape targets", () => {
    expect(escapeTarget("main")).toBe("close");
    expect(escapeTarget("line-list")).toBe("main");
    expect(escapeTarget("color-line-list")).toBe("main");
    expect(escapeTarget("terminal")).toBe("main");
    expect(escapeTarget("global")).toBe("main");
    expect(escapeTarget("extension-status-row")).toBe("main");
    expect(escapeTarget("confirm-color-level")).toBe("terminal");
    expect(escapeTarget("confirm-exit")).toBe("main");
  });

  it("covers basic helper utilities", () => {
    expect(cycle(["a", "b"], "a", 1)).toBe("b");
    expect(cycle(["a", "b"], "x", 1)).toBe("a");
    expect(adjustAnsi(undefined, -1)).toBe("ansi256:255");
    expect(wrap(1, 0)).toBe(0);
    expect(wrap(-1, 3)).toBe(2);
    expect(clamp(10, 0, 5)).toBe(5);
    expect(isPrintable("a")).toBe(true);
    expect(isPrintable("\x7f")).toBe(false);
    expect(isPrintable("\x1b[A")).toBe(false);
  });
});
