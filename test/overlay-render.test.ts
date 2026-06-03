import { registry } from "../src/widgets/registry.js";
import { describe, expect, it, vi } from "vitest";

import { DEFAULT_CONFIG } from "../src/config.js";
import { OverlayRender } from "../src/ui/overlay-render.js";
import { ScreenRender } from "../src/ui/screen-render.js";
import { WidgetStore } from "../src/widgets/store.js";
import { stripAnsi } from "../src/colors.js";
import { makeStatuslineData } from "./helpers/render.js";
import { testTheme } from "./helpers/screen.js";
import { identityPiTheme } from "./helpers/theme.js";

function previewStore(): WidgetStore {
  return WidgetStore.fromConfig({ ...DEFAULT_CONFIG, lines: [[registry.createEntry("model")]] });
}

const previewData = makeStatuslineData();

describe("OverlayRender", () => {
  it("renders preview, title, body, fill, and bottom border", () => {
    const overlay = new OverlayRender(testTheme, new ScreenRender(testTheme));
    const lines = overlay.render({
      width: 100,
      terminalRows: 12,
      activeLineCount: 1,
      visibleRowCount: 5,
      store: previewStore(),
      previewData,
      getExtensionStatuses: () => new Map(),
      theme: identityPiTheme,
      configStateText: "Saved",
      body: ["body line"],
    });
    const rendered = lines.join("\n");
    const plain = stripAnsi(rendered);

    expect(plain).toContain("Preview");
    expect(plain).toContain("claude-sonnet-4-5");
    expect(plain).toContain("pi-footer configuration");
    expect(plain).toContain("Saved");
    expect(plain).toContain("body line");
    expect(lines).toHaveLength(12);
    expect(lines.at(-1)).toContain("╰");
  });

  it("does not fill when the overlay already exceeds the terminal rows", () => {
    const overlay = new OverlayRender(testTheme, new ScreenRender(testTheme));
    const lines = overlay.render({
      width: 80,
      terminalRows: 2,
      activeLineCount: 1,
      visibleRowCount: 5,
      store: previewStore(),
      previewData,
      getExtensionStatuses: () => new Map(),
      theme: identityPiTheme,
      configStateText: "",
      body: ["body line"],
    });

    expect(lines.length).toBeGreaterThan(2);
    expect(lines.at(-1)).toContain("╰");
  });

  it("renders preview from the existing store without rehydrating", () => {
    const overlay = new OverlayRender(testTheme, new ScreenRender(testTheme));
    const store = previewStore();
    const fromConfig = vi.spyOn(WidgetStore, "fromConfig");

    overlay.render({
      width: 80,
      terminalRows: 8,
      activeLineCount: 1,
      visibleRowCount: 5,
      store,
      previewData,
      getExtensionStatuses: () => new Map(),
      theme: identityPiTheme,
      configStateText: "",
      body: ["body line"],
    });

    expect(fromConfig).not.toHaveBeenCalled();
    fromConfig.mockRestore();
  });
});
