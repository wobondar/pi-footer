import { describe, expect, it } from "vitest";

import { MainScreen } from "../../src/ui/screens/main.js";
import { key } from "../helpers/keys.js";
import { createScreenHarness } from "../helpers/screen.js";

describe("MainScreen", () => {
  it("renders and applies selected view actions", () => {
    const harness = createScreenHarness();
    const screen = new MainScreen(harness.ctx, harness.render);

    const rendered = screen.renderScreen(100).join("\n");
    expect(rendered).toContain("Main Menu");
    expect(rendered).toContain("↑/↓ select • enter option • ctrl+s save • esc exit");
    expect(rendered).toContain("Edit lines");
    expect(rendered).toContain("Manage status lines and line widgets");
    expect(rendered).toContain("Edit colors");
    expect(rendered).toContain("Configure per-widget foreground/background/bold");
    expect(rendered).toContain("Terminal Options");
    expect(rendered).toContain("Terminal width and color level");
    expect(rendered).toContain("Global Overrides");
    expect(rendered).toContain("Global presets, separators, icons, minimalist mode");
    expect(rendered).toContain("Pi extensions");
    expect(rendered).toContain("Published statuses and extension status row visibility");
    expect(rendered).toContain("Save & Exit");
    expect(rendered).toContain("Persist changes and close the configuration UI");
    expect(rendered).toContain("Exit without saving");
    expect(rendered).toContain("Discard unsaved changes and close immediately");

    screen.handleInput(key.up);
    screen.handleInput(key.down);
    screen.handleInput(key.down);
    screen.handleInput(key.enter);
    expect(harness.shown).toEqual(["color-line-list"]);
  });

  it("saves from save action", () => {
    const harness = createScreenHarness();
    const screen = new MainScreen(harness.ctx, harness.render);

    for (let index = 0; index < 5; index += 1) screen.handleInput(key.down);
    screen.handleInput(key.enter);

    expect(harness.saves).toEqual([true]);
  });
});
