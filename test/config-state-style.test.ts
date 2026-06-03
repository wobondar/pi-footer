import { registry } from "../src/widgets/registry.js";
import { describe, expect, it } from "vitest";

import { DEFAULT_CONFIG } from "../src/config.js";
import { EMPTY_EXTENSION_STATUSES } from "../src/extension-statuses.js";
import type { StatuslineConfig } from "../src/types.js";
import { StatuslineConfigScreen } from "../src/ui.js";
import { makeStatuslineData } from "./helpers/render.js";
import { taggedPiTheme } from "./helpers/theme.js";

const data = makeStatuslineData();

function screenHarness(
  onSave: (config: StatuslineConfig) => Promise<void> = async () => {},
): StatuslineConfigScreen {
  return new StatuslineConfigScreen(
    { ...DEFAULT_CONFIG, lines: [[registry.createEntry("model")]] },
    data,
    () => EMPTY_EXTENSION_STATUSES,
    () => {},
    () => 20,
    {
      onChange: () => {},
      onSave,
      onClose: () => {},
      getTheme: () => taggedPiTheme,
    },
  );
}

describe("config state styling", () => {
  it("renders unsaved status as bold warning", () => {
    const screen = screenHarness();
    try {
      screen.handleInput("\r");
      screen.handleInput("a");

      expect(screen.render(120).join("\n")).toContain("<bold><warning>Unsaved</warning></bold>");
    } finally {
      screen.dispose();
    }
  });

  it("renders saved status as accent", async () => {
    const screen = screenHarness();
    try {
      screen.handleInput("\x13");
      await Promise.resolve();
      await Promise.resolve();

      expect(screen.render(120).join("\n")).toContain("<accent>Saved</accent>");
    } finally {
      screen.dispose();
    }
  });

  it("renders failed saves as bold error", async () => {
    const screen = screenHarness(async () => {
      throw new Error("boom");
    });
    try {
      screen.handleInput("\x13");
      await Promise.resolve();
      await Promise.resolve();

      expect(screen.render(120).join("\n")).toContain("<bold><error>Save failed</error></bold>");
    } finally {
      screen.dispose();
    }
  });
});
