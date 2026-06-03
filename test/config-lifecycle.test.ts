import { describe, expect, it } from "vitest";
import { registry } from "../src/widgets/registry.js";

import { DEFAULT_CONFIG } from "../src/config.js";
import { ConfigLifecycle } from "../src/ui/config-lifecycle.js";

describe("ConfigLifecycle", () => {
  it("starts clean and closes with the initial saved config", () => {
    const lifecycle = new ConfigLifecycle(DEFAULT_CONFIG);

    expect(lifecycle.dirty).toBe(false);
    expect(lifecycle.state).toBe("clean");
    expect(lifecycle.label).toBeUndefined();
    expect(lifecycle.closeResult(false)).toEqual({ config: DEFAULT_CONFIG, saved: false });
  });

  it("tracks unsaved changes and returns the last saved config for discard", () => {
    const lifecycle = new ConfigLifecycle(DEFAULT_CONFIG);
    lifecycle.markChanged();

    expect(lifecycle.dirty).toBe(true);
    expect(lifecycle.state).toBe("dirty");
    expect(lifecycle.label).toBe("Unsaved");
    expect(lifecycle.closeResult(false).config.lines).toEqual(DEFAULT_CONFIG.lines);
  });

  it("updates the saved config only when marked saved", () => {
    const lifecycle = new ConfigLifecycle(DEFAULT_CONFIG);
    const saved = { ...DEFAULT_CONFIG, lines: [[registry.createEntry("model")]] };

    lifecycle.markChanged();
    lifecycle.markSaved(saved);

    expect(lifecycle.dirty).toBe(false);
    expect(lifecycle.state).toBe("saved");
    expect(lifecycle.label).toBe("Saved");
    expect(lifecycle.closeResult(true)).toEqual({ config: saved, saved: true });
  });

  it("tracks saving and failed save states", () => {
    const lifecycle = new ConfigLifecycle(DEFAULT_CONFIG);

    lifecycle.beginSave();
    expect(lifecycle.dirty).toBe(false);
    expect(lifecycle.state).toBe("saving");
    expect(lifecycle.label).toBe("Saving…");

    lifecycle.markSaveFailed();
    expect(lifecycle.dirty).toBe(true);
    expect(lifecycle.state).toBe("error");
    expect(lifecycle.label).toBe("Save failed");
  });

  it("does not expose mutable saved config references", () => {
    const lifecycle = new ConfigLifecycle(DEFAULT_CONFIG);
    const saved = { ...DEFAULT_CONFIG, lines: [[registry.createEntry("model")]] };

    lifecycle.markSaved(saved);
    saved.lines = [];
    const firstResult = lifecycle.closeResult(true);
    firstResult.config.lines = [];

    expect(lifecycle.closeResult(true).config.lines[0]?.[0]?.type).toBe("model");
  });
});
