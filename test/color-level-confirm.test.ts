import { describe, expect, it } from "vitest";

import {
  colorLevelConfirmAction,
  COLOR_LEVEL_CONFIRM_HINT,
  COLOR_LEVEL_CONFIRM_WARNING,
  colorLevelConfirmValueLabel,
} from "../src/ui/color-level-confirm.ts";

describe("color level confirmation", () => {
  it("formats warning and value labels", () => {
    expect(COLOR_LEVEL_CONFIRM_WARNING).toContain("reset all custom ANSI256 widget colors");
    expect(colorLevelConfirmValueLabel("ansi256")).toBe("New color level: 256 Color");
    expect(colorLevelConfirmValueLabel(undefined)).toBe("New color level: unknown");
  });

  it("documents confirmation controls", () => {
    expect(COLOR_LEVEL_CONFIRM_HINT).toBe("Press enter/y to proceed, esc/n to go back.");
  });

  it("maps input to confirmation actions", () => {
    expect(colorLevelConfirmAction("", true, false)).toBe("cancel");
    expect(colorLevelConfirmAction("n", false, false)).toBe("cancel");
    expect(colorLevelConfirmAction("", false, true)).toBe("confirm");
    expect(colorLevelConfirmAction("y", false, false)).toBe("confirm");
    expect(colorLevelConfirmAction("q", false, false)).toBeUndefined();
  });
});
