import { describe, expect, it } from "vitest";

import { createHydratedWidgetForTest } from "./helpers/widgets.js";
import { DEFAULT_CONFIG, normalizeConfig, STATUS_KEY } from "../src/config.js";
import {
  allExtensionStatusEntries,
  EMPTY_STATUS_LABEL,
  extensionStatusEntries,
  toggleExtensionStatusRowKey,
  visibleExtensionStatusRowEntries,
} from "../src/extension-statuses.js";
import { cycleExternalStatusKey, statusKeyPickerLines } from "../src/ui/extension-status-picker.js";
import {
  extensionStatusRowLines,
  toggleExtensionStatusRowSelection,
} from "../src/ui/extension-statuses.js";

describe("extension status helpers", () => {
  it("returns sorted non-empty extension statuses except the pi-footer itself", () => {
    expect(
      extensionStatusEntries(
        new Map([
          ["z-extension", "z"],
          [STATUS_KEY, "ours"],
          ["empty-extension", ""],
          ["a-extension", "a"],
        ]),
        STATUS_KEY,
      ),
    ).toEqual([
      { key: "a-extension", value: "a", published: true },
      { key: "z-extension", value: "z", published: true },
    ]);
  });

  it("filters hidden extension status row keys", () => {
    expect(
      visibleExtensionStatusRowEntries(
        new Map([
          ["visible", "on"],
          ["hidden", "off"],
        ]),
        ["hidden"],
        STATUS_KEY,
      ),
    ).toEqual([{ key: "visible", value: "on", published: true }]);
  });

  it("includes hidden unpublished keys in complete status lists", () => {
    expect(
      allExtensionStatusEntries(
        new Map([
          ["visible", "on"],
          [STATUS_KEY, "ours"],
        ]),
        { hiddenKeys: ["hidden"], knownKeys: [] },
        STATUS_KEY,
      ),
    ).toEqual([
      { key: "hidden", value: EMPTY_STATUS_LABEL, published: false },
      { key: "visible", value: "on", published: true },
    ]);
  });

  it("toggles hidden extension status row keys and remembers interacted keys", () => {
    expect(toggleExtensionStatusRowKey({ hiddenKeys: ["b"], knownKeys: [] }, "a")).toEqual({
      hiddenKeys: ["a", "b"],
      knownKeys: ["a"],
    });
    expect(toggleExtensionStatusRowKey({ hiddenKeys: ["a", "b"], knownKeys: ["a"] }, "a")).toEqual({
      hiddenKeys: ["b"],
      knownKeys: ["a"],
    });
  });

  it("normalizes extension status row config", () => {
    const config = normalizeConfig({
      extensionStatusRow: { hiddenKeys: ["z", "", "a", "z", 1], knownKeys: ["k", "", "k"] },
    });
    expect(config.extensionStatusRow).toEqual({ hiddenKeys: ["a", "z"], knownKeys: ["k"] });
  });
});
describe("extension status UI helpers", () => {
  const line = (content: string) => content;
  const menuLine = (selected: boolean, content: string) => `${selected ? "> " : "  "}${content}`;
  const identity = (text: string) => text;

  it("renders Pi extensions menu with title, hint, aligned states, and hidden empty keys", () => {
    const lines = extensionStatusRowLines(
      {
        ...DEFAULT_CONFIG,
        extensionStatusRow: { hiddenKeys: ["hidden"], knownKeys: [] },
      },
      () =>
        new Map([
          ["visible", "on"],
          [STATUS_KEY, "ours"],
        ]),
      0,
      120,
      (title, subtitle) => `${title} ${subtitle}`,
      line,
      menuLine,
      identity,
      identity,
      identity,
    );

    expect(lines[0]).toBe("Pi extensions Published statuses and extension status row visibility");
    expect(lines[1]).toBe("↑/↓ select • pgup/pgdn jump • ←/→ or enter toggle • esc back");
    expect(lines).toContain(`> off hidden ${EMPTY_STATUS_LABEL}`);
    expect(lines).toContain("  on  visible on");
    expect(lines.join("\n")).not.toContain(STATUS_KEY);
    expect(lines.find((entry) => entry.includes("hidden"))?.indexOf("hidden")).toBe(
      lines.find((entry) => entry.includes("visible"))?.indexOf("visible"),
    );
  });

  it("renders empty extension status menus and ignores invalid selections", () => {
    const config = { ...DEFAULT_CONFIG, extensionStatusRow: { hiddenKeys: [], knownKeys: [] } };

    expect(
      extensionStatusRowLines(
        config,
        () => new Map(),
        0,
        80,
        (title, subtitle) => `${title} ${subtitle}`,
        line,
        menuLine,
        identity,
        identity,
        identity,
      ).join("\n"),
    ).toContain("No extension statuses are currently available.");
    expect(toggleExtensionStatusRowSelection(config, () => new Map(), 0)).toBe(false);
    expect(
      statusKeyPickerLines(
        () => new Map(),
        { hiddenKeys: [], knownKeys: [] },
        80,
        line,
        identity,
      ).join("\n"),
    ).toContain("Type a key manually");
    expect(
      cycleExternalStatusKey(
        createHydratedWidgetForTest("external-status"),
        () => new Map(),
        { hiddenKeys: [], knownKeys: [] },
        1,
      ),
    ).toBe(false);
  });

  it("keeps an unpublished status visible after toggling it back on", () => {
    const config = {
      ...DEFAULT_CONFIG,
      extensionStatusRow: { hiddenKeys: ["hidden"], knownKeys: ["hidden"] },
    };

    expect(toggleExtensionStatusRowSelection(config, () => new Map(), 0)).toBe(true);
    expect(config.extensionStatusRow).toEqual({ hiddenKeys: [], knownKeys: ["hidden"] });

    const lines = extensionStatusRowLines(
      config,
      () => new Map(),
      0,
      120,
      (title, subtitle) => `${title} ${subtitle}`,
      line,
      menuLine,
      identity,
      identity,
      identity,
    );

    expect(lines).toContain(`> on  hidden ${EMPTY_STATUS_LABEL}`);
  });

  it("shows hidden unpublished keys in the status key picker and filters our own key", () => {
    const lines = statusKeyPickerLines(
      () =>
        new Map([
          ["visible", "on"],
          [STATUS_KEY, "ours"],
        ]),
      { hiddenKeys: ["hidden"], knownKeys: [] },
      120,
      line,
      identity,
    );

    expect(lines).toContain(`hidden ${EMPTY_STATUS_LABEL}`);
    expect(lines).toContain("visible on");
    expect(lines.join("\n")).not.toContain(STATUS_KEY);
  });

  it("cycles status picker keys through current and hidden remembered statuses", () => {
    const missing = createHydratedWidgetForTest("external-status", {
      externalStatusKey: "missing",
    });
    expect(
      cycleExternalStatusKey(
        missing,
        () => new Map([["visible", "on"]]),
        { hiddenKeys: ["hidden"], knownKeys: [] },
        -1,
      ),
    ).toBe(true);
    expect(missing.options.externalStatusKey).toBe("visible");

    const widget = createHydratedWidgetForTest("external-status", { externalStatusKey: "visible" });

    expect(
      cycleExternalStatusKey(
        widget,
        () =>
          new Map([
            ["visible", "on"],
            [STATUS_KEY, "ours"],
          ]),
        { hiddenKeys: ["hidden"], knownKeys: [] },
        1,
      ),
    ).toBe(true);
    expect(widget.options.externalStatusKey).toBe("hidden");
  });
});
