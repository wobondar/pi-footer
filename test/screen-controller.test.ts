import { describe, expect, it } from "vitest";

import type { ScreenContext } from "../src/ui/screen-context.js";
import { ScreenController } from "../src/ui/screen-controller.js";
import { ScreenRender } from "../src/ui/screen-render.js";
import { Controller } from "../src/ui/screens/controller.js";
import { createTestScreenState, testTheme } from "./helpers/screen.js";

function context(): ScreenContext {
  return {
    state: createTestScreenState(),
    theme: testTheme,
    getExtensionStatuses: () => new Map(),
    currentLine: () => [],
    currentWidget: () => undefined,
    visibleRowCount: () => 10,
    show(view) {
      this.state.view = view;
    },
    emitChange: () => {},
    save: () => {},
    exitWithoutSaving: () => {},
  };
}

describe("ScreenController", () => {
  it("delegates render and input to current screen", () => {
    class TestScreen extends Controller {
      input = "";

      renderScreen(width: number): string[] {
        return [`${this.input}:${width}`];
      }

      handleInput(data: string): void {
        this.input = data;
      }
    }

    const ctx = context();
    const controller = new ScreenController(ctx);
    controller.register("main", new TestScreen(ctx, new ScreenRender(testTheme)));

    controller.handleInput("a");

    expect(controller.renderScreen(80)).toEqual(["a:80"]);
  });

  it("throws for missing screens", () => {
    const ctx = context();
    const controller = new ScreenController(ctx);

    expect(() => controller.renderScreen(80)).toThrow("No screen registered for view: main");
  });
});
