import { describe, expect, it } from "vitest";

import { ExtensionStatusRowScreen } from "../../src/ui/screens/extension-status-row.js";
import { key } from "../helpers/keys.js";
import { createScreenHarness } from "../helpers/screen.js";

describe("ExtensionStatusRowScreen", () => {
  it("renders and toggles extension status visibility", () => {
    const harness = createScreenHarness({
      getExtensionStatuses: () => new Map([["other-extension", "ready"]]),
    });
    const screen = new ExtensionStatusRowScreen(harness.ctx, harness.render);

    expect(screen.renderScreen(120).join("\n")).toContain("other-extension");

    screen.handleInput(key.down);
    screen.handleInput(key.up);
    screen.handleInput("\x1b[6~");
    screen.handleInput("\x1b[5~");
    screen.handleInput(key.enter);
    screen.handleInput(key.left);
    screen.handleInput(key.right);
    screen.handleInput(" ");

    expect(harness.ctx.state.store.settings.extensionStatusRow.hiddenKeys).not.toContain(
      "other-extension",
    );
    expect(harness.changes).toBe(4);
  });
});
