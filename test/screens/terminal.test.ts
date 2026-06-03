import { describe, expect, it } from "vitest";
import { registry } from "../../src/widgets/registry.js";

import { DEFAULT_CONFIG } from "../../src/config.js";
import {
  ColorLevelConfirmScreen,
  TerminalScreen,
  TerminalState,
} from "../../src/ui/screens/terminal.js";
import { key } from "../helpers/keys.js";
import { createScreenHarness } from "../helpers/screen.js";

describe("TerminalScreen", () => {
  it("renders and changes width/color options directly", () => {
    const terminalState = new TerminalState();
    const harness = createScreenHarness();
    const screen = new TerminalScreen(harness.ctx, harness.render, terminalState);

    expect(screen.renderScreen(100).join("\n")).toContain("Terminal Options");

    screen.handleInput(key.right);
    expect(harness.ctx.state.store.settings.terminal.widthMode).toBe("full-minus-40");
    screen.handleInput(key.left);
    expect(harness.ctx.state.store.settings.terminal.widthMode).toBe("full");
    screen.handleInput(key.up);
    screen.handleInput(key.down);
    screen.handleInput(key.down);
    screen.handleInput(key.enter);
    expect(harness.ctx.state.store.settings.terminal.colorLevel).toBe("ansi16");
    expect(harness.changes).toBe(3);
  });

  it("routes custom ANSI color changes to confirmation", () => {
    const terminalState = new TerminalState();
    const harness = createScreenHarness({
      config: {
        ...DEFAULT_CONFIG,
        terminal: { ...DEFAULT_CONFIG.terminal, colorLevel: "truecolor" },
        lines: [[registry.createEntry("model", { fg: "ansi256:10" })]],
      },
    });
    const screen = new TerminalScreen(harness.ctx, harness.render, terminalState);

    expect(screen.renderScreen(100).join("\n")).toContain("Terminal Options");

    screen.handleInput(key.down);
    screen.handleInput(key.right);

    expect(terminalState.pendingColorLevel).toBeDefined();
    expect(harness.shown).toEqual(["confirm-color-level"]);
  });
});

describe("ColorLevelConfirmScreen", () => {
  it("cancels pending color changes", () => {
    const terminalState = new TerminalState();
    terminalState.pendingColorLevel = "ansi16";
    const harness = createScreenHarness();
    const screen = new ColorLevelConfirmScreen(harness.ctx, harness.render, terminalState);

    screen.handleInput(key.escape);

    expect(terminalState.pendingColorLevel).toBeUndefined();
    expect(harness.shown).toEqual(["terminal"]);
    expect(harness.changes).toBe(0);
  });

  it("confirms pending color changes", () => {
    const terminalState = new TerminalState();
    terminalState.pendingColorLevel = "ansi16";
    const harness = createScreenHarness();
    const screen = new ColorLevelConfirmScreen(harness.ctx, harness.render, terminalState);

    expect(screen.renderScreen(100).join("\n")).toContain("Basic");

    screen.handleInput(key.enter);

    expect(harness.ctx.state.store.settings.terminal.colorLevel).toBe("ansi16");
    expect(harness.shown).toEqual(["terminal"]);
    expect(harness.changes).toBe(1);
  });
});
