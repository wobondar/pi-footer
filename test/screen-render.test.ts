import { visibleWidth } from "@earendil-works/pi-tui";
import { describe, expect, it } from "vitest";

import { ScreenRender } from "../src/ui/screen-render.js";
import { stripAnsi } from "../src/colors.js";

const screenRender = new ScreenRender({
  accent: (text: string) => `<a>${text}</a>`,
  dim: (text: string) => `<d>${text}</d>`,
  muted: (text: string) => text,
  success: (text: string) => `<s>${text}</s>`,
  warning: (text: string) => text,
  error: (text: string) => text,
  bold: (text: string) => text,
  selected: (text: string) => `<sel>${text}</sel>`,
  border: (text: string) => `|${text}|`,
  previewTitle: (text: string) => text,
  configStateLabel: (_status, label) => label,
});

describe("ScreenRender", () => {
  it("formats menu titles", () => {
    expect(screenRender.menuTitle("Main", "")).toBe("<a>Main</a>");
    expect(screenRender.menuTitle("Main", "Description")).toBe("<s>•Main</s> <d>Description</d>");
  });

  it("pads and truncates lines", () => {
    expect(stripAnsi(screenRender.padLine(6, "abcdef"))).toBe("abc…");
    expect(visibleWidth(screenRender.lineW("abc", 8))).toBe(8);
  });

  it("adds borders", () => {
    expect(screenRender.line("abc", 8)).toBe("|│|abc   |│|");
  });

  it("formats menu rows", () => {
    expect(screenRender.menuLine(false, "Item", 20)).toContain("   Item");
    expect(screenRender.menuLine(true, "Item", 20)).toContain("<sel>›  Item</sel>");
  });
});
