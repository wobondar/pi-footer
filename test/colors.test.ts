import { describe, expect, it } from "vitest";

import {
  ansi256Digits,
  appendAnsi256Digit,
  applyColors,
  colorDisplayName,
  deleteAnsi256Digit,
  normalizeColor,
  resetAnsi256Colors,
} from "../src/colors.js";
import { taggedPiTheme } from "./helpers/theme.js";

describe("colors", () => {
  it("normalizes and displays standard, ansi, pi, and invalid colors", () => {
    expect(normalizeColor(1)).toBeUndefined();
    expect(normalizeColor("red")).toBe("red");
    expect(normalizeColor("pi:dim")).toBe("pi:dim");
    expect(normalizeColor("pi:syntaxType")).toBe("pi:syntaxType");
    expect(normalizeColor("ansi256:255")).toBe("ansi256:255");
    expect(normalizeColor("ansi256:256")).toBeUndefined();
    expect(normalizeColor("ansi256:x")).toBeUndefined();
    expect(colorDisplayName(undefined)).toBe("Default");
    expect(colorDisplayName("pi:dim")).toBe("Pi Dim");
    expect(colorDisplayName("ansi256:7")).toBe("ANSI256 7");
    expect(ansi256Digits("red")).toBe("0");
    expect(appendAnsi256Digit("ansi256:99", "9")).toBe("ansi256:255");
    expect(deleteAnsi256Digit("ansi256:10")).toBe("ansi256:1");
  });

  it("applies colors across color levels", () => {
    expect(applyColors("x", "red", "blue", true, "none")).toBe("x");
    expect(applyColors("x", "pi:dim", undefined, false, "ansi16", taggedPiTheme)).toBe(
      "<dim>x</dim>",
    );
    expect(applyColors("x", "pi:dim", undefined, false, "ansi16")).toBe("x");
    expect(applyColors("x", "red", "blue", false, "ansi16")).toContain("\x1b[");
    expect(applyColors("x", "ansi256:10", "ansi256:11", false, "ansi256")).toContain("\x1b[");
    expect(applyColors("x", "ansi256:10", undefined, false, "ansi16")).toBe("x");
    expect(applyColors("x", undefined, undefined, false, "truecolor")).toBe("x");
  });

  it("resets every custom ansi option", () => {
    expect(
      resetAnsi256Colors({
        fg: "ansi256:1",
        bg: "ansi256:2",
        warningFg: "ansi256:3",
        warningBg: "ansi256:4",
        dangerFg: "ansi256:5",
        dangerBg: "ansi256:6",
      }),
    ).toEqual({
      fg: "default",
      bg: "default",
      warningFg: "default",
      warningBg: "default",
      dangerFg: "default",
      dangerBg: "default",
    });
  });
});
