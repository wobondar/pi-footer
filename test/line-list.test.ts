import { describe, expect, it } from "vitest";

import { LINE_LIST_HINT, lineListCountLabel, lineListItemLabel } from "../src/ui/line-list.ts";

describe("line list UI", () => {
  it("formats count and visible range", () => {
    expect(lineListCountLabel(10, 0, 5)).toBe("10 line(s), showing 1-5");
    expect(lineListCountLabel(10, 5, 10)).toBe("10 line(s), showing 6-10");
    expect(lineListCountLabel(0, 0, 0)).toBe("0 line(s), showing 0-0");
  });

  it("formats line rows with pluralized widget counts", () => {
    expect(lineListItemLabel(0, 1, (text) => `<${text}>`)).toBe("☰ Line 1 <(1 widget)>");
    expect(lineListItemLabel(2, 3, (text) => `<${text}>`)).toBe("☰ Line 3 <(3 widgets)>");
  });

  it("documents line list controls", () => {
    expect(LINE_LIST_HINT).toContain("a add");
    expect(LINE_LIST_HINT).toContain("w/s move");
    expect(LINE_LIST_HINT).toContain("d delete");
  });
});
