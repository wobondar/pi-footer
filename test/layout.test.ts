import { describe, expect, it } from "vitest";
import { registry } from "../src/widgets/registry.js";

import {
  activeLineCount,
  CONFIG_UI_RESERVED_ROWS,
  MIN_VISIBLE_ROW_COUNT,
  visibleRowCount,
} from "../src/ui/layout.js";

describe("config UI layout", () => {
  it("counts non-empty status lines", () => {
    expect(
      activeLineCount([[registry.createEntry("model")], [], [registry.createEntry("cost")]]),
    ).toBe(2);
  });

  it("calculates visible row count with reserved rows and active lines", () => {
    expect(visibleRowCount(40, 1, 2)).toBe(40 - CONFIG_UI_RESERVED_ROWS - 2);
  });

  it("keeps a minimum visible row count", () => {
    expect(visibleRowCount(5, 1, 10)).toBe(MIN_VISIBLE_ROW_COUNT);
  });
});
