import { describe, expect, it } from "vitest";

import { createHydratedWidgetForTest } from "./helpers/widgets.js";
import {
  addLineAfter,
  cloneLineAfter,
  cloneSelectedWidget,
  deleteLine,
  deleteSelectedWidget,
  moveLine,
  moveWidget,
  toggleWidgetEnabled,
  toggleWidgetRaw,
} from "../src/ui/widget-actions.js";

describe("widget actions", () => {
  it("adds, clones, and deletes lines", () => {
    const lines = [[createHydratedWidgetForTest("model")], [createHydratedWidgetForTest("cost")]];

    expect(addLineAfter(lines, 0)).toBe(1);
    expect(lines[1]).toEqual([]);

    expect(cloneLineAfter(lines, 0)).toBe(1);
    expect(lines[1]?.[0]?.type).toBe("model");
    expect(lines[1]?.[0]?.id).not.toBe(lines[0]?.[0]?.id);

    expect(deleteLine(lines, 1)).toBe(1);
    expect(lines).toHaveLength(3);
  });

  it("does not delete the last remaining line", () => {
    const lines = [[createHydratedWidgetForTest("model")]];

    expect(deleteLine(lines, 0)).toBe(0);
    expect(lines).toHaveLength(1);
  });

  it("moves lines within bounds", () => {
    const lines = [[createHydratedWidgetForTest("model")], [createHydratedWidgetForTest("cost")]];

    expect(moveLine(lines, 0, 1)).toBe(1);
    expect(lines[0]?.[0]?.type).toBe("cost");
    expect(moveLine(lines, 0, -1)).toBe(0);
    expect(moveLine(lines, 99, 1)).toBe(99);
  });

  it("moves widgets within a line", () => {
    const line = [createHydratedWidgetForTest("model"), createHydratedWidgetForTest("cost")];

    expect(moveWidget(line, 0, 1)).toBe(1);
    expect(line.map((widget) => widget.type)).toEqual(["cost", "model"]);
    expect(moveWidget(line, 0, -1)).toBe(0);
    expect(moveWidget(line, 99, 1)).toBe(99);
  });

  it("clones selected widgets", () => {
    const line = [createHydratedWidgetForTest("model")];

    expect(cloneSelectedWidget(line, 0)).toBe(1);
    expect(line.map((widget) => widget.type)).toEqual(["model", "model"]);
    expect(line[0]?.id).not.toBe(line[1]?.id);
    expect(cloneSelectedWidget(line, 99)).toBe(99);
  });

  it("deletes selected widgets and clamps selection", () => {
    const line = [createHydratedWidgetForTest("model"), createHydratedWidgetForTest("cost")];

    expect(deleteSelectedWidget([], 1)).toBe(1);
    expect(deleteSelectedWidget(line, 1)).toBe(0);
    expect(line.map((widget) => widget.type)).toEqual(["model"]);
  });

  it("toggles enabled state", () => {
    const widget = createHydratedWidgetForTest("model");

    expect(toggleWidgetEnabled(widget)).toBe(true);
    expect(widget.enabled).toBe(false);
    expect(toggleWidgetEnabled(undefined)).toBe(false);
  });

  it("toggles raw only for non-layout widgets", () => {
    const model = createHydratedWidgetForTest("model");
    const separator = createHydratedWidgetForTest("separator");

    expect(toggleWidgetRaw(model)).toBe(true);
    expect(model.options.raw).toBe(true);
    expect(toggleWidgetRaw(separator)).toBe(false);
    expect(toggleWidgetRaw(undefined)).toBe(false);
  });

  it("operates on hydrated widgets", () => {
    const line = [createHydratedWidgetForTest("model")];

    expect(cloneSelectedWidget(line, 0)).toBe(1);
    expect(line[1]?.type).toBe("model");
    expect(line[1]).toHaveProperty("toEntry");
    expect(line[0]?.id).not.toBe(line[1]?.id);

    expect(toggleWidgetEnabled(line[0])).toBe(true);
    expect(line[0]?.enabled).toBe(false);
    expect(toggleWidgetRaw(line[0])).toBe(true);
    expect(line[0]?.options.raw).toBe(true);
  });
});
