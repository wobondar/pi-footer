import { describe, expect, it } from "vitest";

import { DEFAULT_CONFIG } from "../../src/config.js";
import { AddWidgetScreen } from "../../src/ui/screens/add-widget.js";
import { key } from "../helpers/keys.js";
import { createScreenHarness } from "../helpers/screen.js";

describe("AddWidgetScreen", () => {
  it("filters and inserts widgets", () => {
    const harness = createScreenHarness({
      config: { ...DEFAULT_CONFIG, lines: [[]] },
    });
    const screen = new AddWidgetScreen(harness.ctx, harness.render);

    for (const char of "runtime") screen.handleInput(char);
    expect(screen.renderScreen(100).join("\n")).toContain("Project / Runtime");
    for (let index = 0; index < "runtime".length; index += 1) screen.handleInput(key.backspace);

    screen.handleInput(key.down);
    screen.handleInput(key.up);
    screen.handleInput("\x1b[6~");
    screen.handleInput("\x1b[5~");
    screen.handleInput("c");
    screen.handleInput("o");
    screen.handleInput(key.backspace);
    screen.handleInput("o");
    expect(screen.renderScreen(100).join("\n")).toContain("filter: co");

    screen.handleInput(key.enter);

    expect(harness.ctx.currentLine()).toHaveLength(1);
    expect(harness.shown).toEqual(["widget-list"]);
    expect(harness.changes).toBe(1);
  });
});
