import { describe, expect, it } from "vitest";

import { separatorText, widgetSeparatorText } from "../src/separators.ts";

describe("separators", () => {
  it("formats global separator styles", () => {
    expect(separatorText("none")).toBe("");
    expect(separatorText("space")).toBe(" ");
    expect(separatorText("pipe")).toBe(" | ");
    expect(separatorText("powerline")).toBe("  ");
    expect(separatorText("dash")).toBe(" - ");
    expect(separatorText("comma")).toBe(", ");
    expect(separatorText("dot")).toBe(" • ");
  });

  it("formats widget-only separator styles", () => {
    expect(widgetSeparatorText("custom", "/")).toBe("/");
    expect(widgetSeparatorText("powerline", "")).toBe(" ");
    expect(widgetSeparatorText("powerline-right-spaced", "")).toBe(" ");
    expect(widgetSeparatorText("powerline-right", "")).toBe("");
    expect(widgetSeparatorText("powerline-left-spaced", "")).toBe(" ");
    expect(widgetSeparatorText("powerline-left", "")).toBe("");
    expect(widgetSeparatorText("powerline-soft-right", "")).toBe("");
    expect(widgetSeparatorText("powerline-soft-left", "")).toBe("");
    expect(widgetSeparatorText("powerline-start", "")).toBe("");
    expect(widgetSeparatorText("powerline-end", "")).toBe("");
    expect(widgetSeparatorText(undefined, "")).toBe(" | ");
  });
});
