import { describe, expect, it } from "vitest";
import { registry } from "../../src/widgets/registry.js";

import { DEFAULT_CONFIG } from "../../src/config.js";
import { EditWidgetScreen } from "../../src/ui/screens/edit-widget.js";
import { key } from "../helpers/keys.js";
import { createScreenHarness } from "../helpers/screen.js";

describe("EditWidgetScreen", () => {
  it("renders empty state without a selected widget", () => {
    const harness = createScreenHarness({ config: { ...DEFAULT_CONFIG, lines: [[]] } });
    const screen = new EditWidgetScreen(harness.ctx, harness.render);

    expect(screen.renderScreen(120).join("\n")).toContain("No widget selected");
    screen.handleInput(key.right);
    expect(harness.changes).toBe(0);
  });

  it("renders event usage and edits fields", () => {
    const harness = createScreenHarness({
      config: {
        ...DEFAULT_CONFIG,
        lines: [[registry.createEntry("event", { widgetId: "fast_mode" })]],
      },
    });
    const screen = new EditWidgetScreen(harness.ctx, harness.render);

    expect(screen.renderScreen(120).join("\n")).toContain("fast_mode");

    screen.handleInput(key.right);
    screen.handleInput(key.down);
    screen.handleInput(key.down);
    screen.handleInput(key.down);
    screen.handleInput(key.down);
    screen.handleInput("x");
    screen.handleInput(key.backspace);
    screen.handleInput(key.up);

    expect(harness.ctx.currentWidget()?.enabled).toBe(false);
    expect(harness.ctx.currentWidget()?.options.widgetId).toBe("fast_mode");
    expect(harness.changes).toBe(3);
  });

  it("clamps selected field when switching to a widget with fewer options", () => {
    const harness = createScreenHarness({
      config: {
        ...DEFAULT_CONFIG,
        lines: [
          [
            registry.createEntry("git-branch", { gitBranchDisplayStyle: "custom" }),
            registry.createEntry("separator"),
          ],
        ],
      },
    });
    const screen = new EditWidgetScreen(harness.ctx, harness.render);

    for (let index = 0; index < 7; index += 1) screen.handleInput(key.down);
    harness.ctx.state.selectedWidget = 1;

    expect(screen.renderScreen(120).join("\n")).toContain("<selected>›  Separator:");

    screen.handleInput(key.down);

    expect(screen.renderScreen(120).join("\n")).toContain("<selected>›  Enabled:");
  });

  it("edits runtime metadata fields", () => {
    const harness = createScreenHarness({
      config: { ...DEFAULT_CONFIG, lines: [[registry.createEntry("runtime")]] },
    });
    const screen = new EditWidgetScreen(harness.ctx, harness.render);

    for (let index = 0; index < 4; index += 1) screen.handleInput(key.down);
    screen.handleInput(key.right);
    screen.handleInput(key.down);
    screen.handleInput(key.right);

    expect(harness.ctx.currentWidget()?.options.style).toBe("default");
    expect(harness.ctx.currentWidget()?.options.displayVersion).toBe(false);
    expect(harness.changes).toBe(2);
  });

  it("edits choices and cycles external status keys", () => {
    const harness = createScreenHarness({
      getExtensionStatuses: () => new Map([["build", "ok"]]),
      config: {
        ...DEFAULT_CONFIG,
        extensionStatusRow: { hiddenKeys: [], knownKeys: [] },
        lines: [[registry.createEntry("external-status")]],
      },
    });
    const screen = new EditWidgetScreen(harness.ctx, harness.render);

    screen.handleInput(key.down);
    screen.handleInput(key.down);
    screen.handleInput(key.down);
    screen.handleInput(key.down);
    expect(screen.renderScreen(120).join("\n")).toContain("Available extension statuses");
    screen.handleInput(key.right);
    expect(harness.ctx.currentWidget()?.options.externalStatusKey).toBe("build");
    screen.handleInput(key.left);
    expect(harness.ctx.currentWidget()?.options.externalStatusKey).toBe("build");
    expect(harness.changes).toBe(2);
  });
});
