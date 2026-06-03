import { describe, expect, it } from "vitest";
import { registry } from "../../src/widgets/registry.js";

import { DEFAULT_CONFIG } from "../../src/config.js";
import { WidgetListScreen } from "../../src/ui/screens/widget-list.js";
import { key } from "../helpers/keys.js";
import { createScreenHarness } from "../helpers/screen.js";

describe("WidgetListScreen", () => {
  it("renders widgets and toggles enabled state", () => {
    const harness = createScreenHarness({
      config: {
        ...DEFAULT_CONFIG,
        lines: [[registry.createEntry("runtime", { style: "default", displayVersion: true })]],
      },
    });
    const screen = new WidgetListScreen(harness.ctx, harness.render, false);

    const rendered = screen.renderScreen(100).join("\n");
    expect(rendered).toContain("Edit widgets");
    expect(rendered).toContain("Runtime");
    expect(rendered).toContain("style=default");
    expect(rendered).toContain("with-version");

    screen.handleInput(" ");

    expect(harness.ctx.currentWidget()?.enabled).toBe(false);
    expect(harness.changes).toBe(1);
  });

  it("handles edit-list navigation and widget actions", () => {
    const harness = createScreenHarness({
      visibleRows: 2,
      config: {
        ...DEFAULT_CONFIG,
        lines: [
          [
            registry.createEntry("model"),
            registry.createEntry("cost"),
            registry.createEntry("context"),
          ],
        ],
      },
    });
    const screen = new WidgetListScreen(harness.ctx, harness.render, false);

    screen.handleInput(key.down);
    expect(harness.ctx.state.selectedWidget).toBe(1);
    screen.handleInput("\x1b[6~");
    expect(harness.ctx.state.selectedWidget).toBe(2);
    screen.handleInput("\x1b[5~");
    expect(harness.ctx.state.selectedWidget).toBe(0);

    screen.handleInput("e");
    screen.handleInput(key.enter);
    screen.handleInput("a");
    expect(harness.shown).toEqual(["edit-widget", "edit-widget", "add-widget"]);

    screen.handleInput("c");
    expect(harness.ctx.currentLine()).toHaveLength(4);
    screen.handleInput("s");
    expect(harness.ctx.state.selectedWidget).toBe(2);
    screen.handleInput("w");
    expect(harness.ctx.state.selectedWidget).toBe(1);
    screen.handleInput("r");
    expect(harness.ctx.currentWidget()?.options.raw).toBe(true);
    screen.handleInput("d");
    expect(harness.ctx.currentLine()).toHaveLength(3);
    expect(harness.changes).toBeGreaterThanOrEqual(5);
  });

  it("renders empty lines", () => {
    const harness = createScreenHarness({ config: { ...DEFAULT_CONFIG, lines: [[]] } });
    const screen = new WidgetListScreen(harness.ctx, harness.render, false);

    expect(screen.renderScreen(100).join("\n")).toContain("Empty line. Press a to add a widget.");
    screen.handleInput(key.down);
    expect(harness.ctx.state.selectedWidget).toBe(0);
  });

  it("opens color editor when configured for colors", () => {
    const harness = createScreenHarness({
      config: { ...DEFAULT_CONFIG, lines: [[registry.createEntry("model")]] },
    });
    const screen = new WidgetListScreen(harness.ctx, harness.render, true);

    expect(screen.renderScreen(100).join("\n")).toContain("Edit widget colors");
    screen.handleInput("a");
    screen.handleInput(key.enter);

    expect(harness.shown).toEqual(["edit-colors"]);
  });

  it("does not emit changes when widget actions cannot mutate", () => {
    const harness = createScreenHarness({
      config: { ...DEFAULT_CONFIG, lines: [[registry.createEntry("custom-text")]] },
    });
    const screen = new WidgetListScreen(harness.ctx, harness.render, false);

    screen.handleInput("w");
    screen.handleInput("s");
    screen.handleInput("r");
    harness.ctx.state.selectedWidget = 9;
    screen.handleInput("c");
    screen.handleInput("d");

    expect(harness.changes).toBe(0);
  });
});
