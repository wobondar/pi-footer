import { describe, expect, it } from "vitest";

import { GlobalScreen } from "../../src/ui/screens/global.ts";
import { key } from "../helpers/keys.ts";
import { createScreenHarness } from "../helpers/screen.ts";

describe("GlobalScreen", () => {
  it("renders and applies global options", () => {
    const harness = createScreenHarness();
    const screen = new GlobalScreen(harness.ctx, harness.render);

    expect(screen.renderScreen(100).join("\n")).toContain("Global Overrides");

    screen.handleInput(key.right);
    screen.handleInput(key.left);
    screen.handleInput(key.down);
    screen.handleInput(key.enter);
    for (let index = 0; index < 4; index += 1) screen.handleInput(key.down);
    screen.handleInput("9");
    screen.handleInput(key.backspace);
    screen.handleInput(key.up);
    screen.handleInput("x");
    screen.handleInput(key.backspace);

    expect(harness.changes).toBeGreaterThanOrEqual(3);
  });
});
