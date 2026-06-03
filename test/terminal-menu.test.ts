import { describe, expect, it } from "vitest";

import { DEFAULT_CONFIG } from "../src/config.js";
import {
  nextTerminalColorLevel,
  nextTerminalWidthMode,
  TERMINAL_MENU_ACTIONS,
  TERMINAL_MENU_HINT,
  terminalMenuAction,
  terminalMenuFields,
} from "../src/ui/terminal-menu.js";

describe("terminal menu", () => {
  it("keeps actions in field order", () => {
    expect(TERMINAL_MENU_ACTIONS).toEqual(["width-mode", "color-level"]);
  });

  it("renders fields from config", () => {
    expect(terminalMenuFields(DEFAULT_CONFIG)).toEqual([
      "Terminal Width: Full width always",
      "Color Level: 256 Color",
    ]);
  });

  it("maps menu selections to actions", () => {
    expect(terminalMenuAction(0)).toBe("width-mode");
    expect(terminalMenuAction(1)).toBe("color-level");
  });

  it("uses color level as a safe action for invalid indexes", () => {
    expect(terminalMenuAction(-1)).toBe("color-level");
    expect(terminalMenuAction(99)).toBe("color-level");
  });

  it("applies terminal width mode changes", () => {
    expect(nextTerminalWidthMode(DEFAULT_CONFIG, 1)).toBe("full-minus-40");
  });

  it("calculates and applies terminal color level changes", () => {
    expect(nextTerminalColorLevel(DEFAULT_CONFIG, 1)).toBe("ansi16");
  });

  it("documents terminal menu controls", () => {
    expect(TERMINAL_MENU_HINT).toContain("←/→ change");
  });
});
