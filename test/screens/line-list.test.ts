import { describe, expect, it } from "vitest";
import { registry } from "../../src/widgets/registry.js";

import { DEFAULT_CONFIG } from "../../src/config.js";
import { LineListScreen } from "../../src/ui/screens/line-list.js";
import { key } from "../helpers/keys.js";
import { createScreenHarness } from "../helpers/screen.js";

describe("LineListScreen", () => {
  it("renders lines and mutates shared line selection", () => {
    const harness = createScreenHarness({
      config: {
        ...DEFAULT_CONFIG,
        lines: [[registry.createEntry("model")], [registry.createEntry("cost")]],
      },
    });
    const screen = new LineListScreen(harness.ctx, harness.render, "Edit lines", "widget-list");

    expect(screen.renderScreen(100).join("\n")).toContain("Line 1");

    screen.handleInput(key.down);
    expect(harness.ctx.state.selectedLine).toBe(1);

    screen.handleInput(key.enter);
    expect(harness.shown).toEqual(["widget-list"]);
  });

  it("pages, clones, moves, and deletes lines", () => {
    const harness = createScreenHarness({
      visibleRows: 2,
      config: {
        ...DEFAULT_CONFIG,
        lines: [
          [registry.createEntry("model")],
          [registry.createEntry("cost")],
          [registry.createEntry("context")],
          [registry.createEntry("cwd")],
        ],
      },
    });
    const screen = new LineListScreen(harness.ctx, harness.render, "Edit lines", "widget-list");

    screen.handleInput("\x1b[6~");
    expect(harness.ctx.state.selectedLine).toBe(2);
    screen.handleInput("\x1b[5~");
    expect(harness.ctx.state.selectedLine).toBe(0);
    screen.handleInput(key.up);
    expect(harness.ctx.state.selectedLine).toBe(3);

    screen.handleInput("c");
    expect(harness.ctx.state.store.lines).toHaveLength(5);
    screen.handleInput("w");
    expect(harness.ctx.state.selectedLine).toBe(3);
    screen.handleInput("s");
    expect(harness.ctx.state.selectedLine).toBe(4);
    screen.handleInput("d");
    expect(harness.ctx.state.store.lines).toHaveLength(4);
    expect(harness.changes).toBe(4);
  });

  it("adds lines", () => {
    const harness = createScreenHarness({
      config: { ...DEFAULT_CONFIG, lines: [[registry.createEntry("model")]] },
    });
    const screen = new LineListScreen(harness.ctx, harness.render, "Edit lines", "widget-list");

    screen.handleInput("a");

    expect(harness.ctx.state.store.lines).toHaveLength(2);
    expect(harness.changes).toBe(1);
  });
});
