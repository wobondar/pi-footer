import { registry } from "../src/widgets/registry.js";
import { describe, expect, it } from "vitest";

import { DEFAULT_CONFIG } from "../src/config.js";
import { EMPTY_EXTENSION_STATUSES } from "../src/extension-statuses.js";
import type { StatuslineConfig } from "../src/types.js";
import { StatuslineConfigScreen } from "../src/ui.js";
import { makeStatuslineData } from "./helpers/render.js";
import { identityPiTheme } from "./helpers/theme.js";

const data = makeStatuslineData();

function screenHarness(
  config: StatuslineConfig = { ...DEFAULT_CONFIG, lines: [[registry.createEntry("model")]] },
) {
  const changes: StatuslineConfig[] = [];
  const saves: StatuslineConfig[] = [];
  const closes: Array<{ config: StatuslineConfig; saved: boolean }> = [];
  const screen = new StatuslineConfigScreen(
    config,
    data,
    () => EMPTY_EXTENSION_STATUSES,
    () => {},
    () => 40,
    {
      onChange: (next) => changes.push(next),
      onSave: async (next) => {
        saves.push(next);
      },
      onClose: (result) => closes.push(result),
      getTheme: () => identityPiTheme,
    },
  );
  return { screen, changes, saves, closes };
}

describe("StatuslineConfigScreen", () => {
  it("closes immediately on escape when unchanged", () => {
    const { screen, closes } = screenHarness();
    try {
      screen.handleInput("\x1b");

      expect(closes).toHaveLength(1);
      expect(closes[0]?.saved).toBe(false);
    } finally {
      screen.dispose();
    }
  });

  it("saves on ctrl+s without closing", async () => {
    const { screen, saves, closes } = screenHarness();
    try {
      screen.handleInput("\x13");
      screen.handleInput("\x13");
      await Promise.resolve();
      await Promise.resolve();

      expect(saves).toHaveLength(1);
      expect(closes).toHaveLength(0);
    } finally {
      screen.dispose();
    }
  });

  it("renders with an invalid selected line fallback", () => {
    const { screen } = screenHarness({ ...DEFAULT_CONFIG, lines: [] });
    try {
      screen.handleInput("\r");
      screen.handleInput("\r");
      expect(screen.render(100).join("\n")).toContain("Empty line");
    } finally {
      screen.dispose();
    }
  });

  it("opens unsaved changes confirmation on escape", () => {
    const { screen } = screenHarness();
    try {
      screen.handleInput("\r");
      screen.handleInput("a");
      screen.handleInput("\x1b");
      screen.handleInput("\x1b");
      const rendered = screen.render(100).join("\n");

      expect(rendered).toContain("Unsaved changes");
      expect(rendered).toContain("Return to config UI");
    } finally {
      screen.dispose();
    }
  });

  it("saves and exits from main menu", async () => {
    const { screen, saves, closes } = screenHarness();
    try {
      for (let index = 0; index < 5; index += 1) screen.handleInput("\x1b[B");
      screen.handleInput("\r");
      await Promise.resolve();
      await Promise.resolve();

      expect(saves).toHaveLength(1);
      expect(closes).toHaveLength(1);
      expect(closes[0]?.saved).toBe(true);
    } finally {
      screen.dispose();
    }
  });

  it("exits without saving from main menu", () => {
    const { screen, saves, closes } = screenHarness();
    try {
      for (let index = 0; index < 6; index += 1) screen.handleInput("\x1b[B");
      screen.handleInput("\r");

      expect(saves).toHaveLength(0);
      expect(closes).toHaveLength(1);
      expect(closes[0]?.saved).toBe(false);
    } finally {
      screen.dispose();
    }
  });

  it("exits without saving from confirmation", () => {
    const { screen, closes } = screenHarness();
    try {
      screen.handleInput("\r");
      screen.handleInput("a");
      screen.handleInput("\x1b");
      screen.handleInput("\x1b");
      screen.handleInput("x");

      expect(closes).toHaveLength(1);
      expect(closes[0]?.saved).toBe(false);
    } finally {
      screen.dispose();
    }
  });
});
