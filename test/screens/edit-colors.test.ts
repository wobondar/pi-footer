import { describe, expect, it } from "vitest";
import { registry } from "../../src/widgets/registry.js";

import { DEFAULT_CONFIG } from "../../src/config.js";
import { EditColorsScreen } from "../../src/ui/screens/edit-colors.js";
import { key } from "../helpers/keys.js";
import { createScreenHarness } from "../helpers/screen.js";

describe("EditColorsScreen", () => {
  it("renders empty state without a selected widget", () => {
    const harness = createScreenHarness({ config: { ...DEFAULT_CONFIG, lines: [[]] } });
    const screen = new EditColorsScreen(harness.ctx, harness.render);

    expect(screen.renderScreen(100).join("\n")).toContain("No widget selected");
    screen.handleInput(key.right);
    expect(harness.changes).toBe(0);
  });

  it("renders and edits color fields", () => {
    const harness = createScreenHarness({
      config: { ...DEFAULT_CONFIG, lines: [[registry.createEntry("runtime")]] },
    });
    const screen = new EditColorsScreen(harness.ctx, harness.render);

    const rendered = screen.renderScreen(100).join("\n");
    expect(rendered).toContain("Colors / Runtime");
    expect(rendered).toContain("Foreground");

    screen.handleInput(key.right);
    screen.handleInput(key.left);
    screen.handleInput(key.down);
    screen.handleInput(key.up);
    screen.handleInput(key.enter);
    screen.handleInput("x");
    screen.handleInput(key.backspace);

    expect(harness.changes).toBe(3);
  });

  it("clamps selected field when switching to a widget with fewer color options", () => {
    const harness = createScreenHarness({
      config: {
        ...DEFAULT_CONFIG,
        lines: [
          [
            registry.createEntry("context", { contextConditionalColors: true }),
            registry.createEntry("model"),
          ],
        ],
      },
    });
    const screen = new EditColorsScreen(harness.ctx, harness.render);

    for (let index = 0; index < 12; index += 1) screen.handleInput(key.down);
    harness.ctx.state.selectedWidget = 1;

    expect(screen.renderScreen(120).join("\n")).toContain(
      "<selected>›  Custom ANSI256 background:",
    );

    screen.handleInput(key.down);

    expect(screen.renderScreen(120).join("\n")).toContain("<selected>›  Foreground:");
  });

  it("renders context warning and danger color fields only when conditional colors are enabled", () => {
    const disabledHarness = createScreenHarness({
      config: { ...DEFAULT_CONFIG, lines: [[registry.createEntry("context")]] },
    });
    const enabledHarness = createScreenHarness({
      config: {
        ...DEFAULT_CONFIG,
        lines: [[registry.createEntry("context", { contextConditionalColors: true })]],
      },
    });
    const disabledScreen = new EditColorsScreen(disabledHarness.ctx, disabledHarness.render);
    const enabledScreen = new EditColorsScreen(enabledHarness.ctx, enabledHarness.render);

    expect(disabledScreen.renderScreen(120).join("\n")).not.toContain("Warning foreground");

    const rendered = enabledScreen.renderScreen(120).join("\n");
    expect(rendered).toContain("Warning foreground");
    expect(rendered).toContain("Danger background");
  });

  it("edits ANSI fields with digits and backspace", () => {
    const harness = createScreenHarness({
      config: { ...DEFAULT_CONFIG, lines: [[registry.createEntry("model")]] },
    });
    const screen = new EditColorsScreen(harness.ctx, harness.render);

    for (let index = 0; index < 3; index += 1) screen.handleInput(key.down);
    screen.handleInput("9");
    screen.handleInput("9");
    screen.handleInput("9");

    expect(harness.ctx.currentWidget()?.options.fg).toBe("ansi256:255");

    screen.handleInput(key.backspace);

    expect(harness.ctx.currentWidget()?.options.fg).toBe("ansi256:25");
  });
});
