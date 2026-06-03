import { describe, expect, it } from "vitest";
import { registry } from "../../src/widgets/registry.js";

import { DEFAULT_CONFIG } from "../../src/config.js";
import type { StatuslineConfig, StatuslineSettings, WidgetEntry } from "../../src/types.js";
import { ModelWidget } from "../../src/widgets/core/model.js";
import { GitBranchWidget } from "../../src/widgets/git/branch.js";
import { GitDiffWidget } from "../../src/widgets/git/diff.js";
import { WidgetInstance } from "../../src/widgets/instance.js";
import { SpacerWidget } from "../../src/widgets/layout/spacer.js";
import { RuntimeWidget } from "../../src/widgets/project/runtime.js";
import { CompactionsWidget } from "../../src/widgets/session/compactions.js";
import { WidgetStore } from "../../src/widgets/store.js";
import { ContextBarWidget } from "../../src/widgets/tokens/context-bar.js";
import { TokensWidget } from "../../src/widgets/tokens/tokens.js";

function runtimeEntry(): WidgetEntry {
  return {
    id: "runtime-1",
    type: "runtime",
    enabled: true,
    options: { hideWhenEmpty: true, icon: "", text: "-", displayVersion: true, style: "compact" },
  };
}

function modelEntry(): WidgetEntry {
  return {
    id: "model-1",
    type: "model",
    enabled: true,
    options: { raw: false, showProvider: true, fg: "green" },
  };
}

function tokensEntry(): WidgetEntry {
  return {
    id: "tokens-1",
    type: "tokens",
    enabled: true,
    options: { raw: false, tokenFormatStyle: "compact", fg: "cyan" },
  };
}

function contextBarEntry(): WidgetEntry {
  return {
    id: "context-bar-1",
    type: "context-bar",
    enabled: true,
    options: { raw: false, contextBarMode: "medium", fg: "blue" },
  };
}

function compactionsEntry(): WidgetEntry {
  return {
    id: "compactions-1",
    type: "compactions",
    enabled: true,
    options: { raw: false, fg: "yellow" },
  };
}

function gitBranchEntry(): WidgetEntry {
  return {
    id: "git-branch-1",
    type: "git-branch",
    enabled: true,
    options: { raw: false, gitBranchDisplayStyle: "round-brackets", fg: "magenta" },
  };
}

function gitDiffEntry(): WidgetEntry {
  return {
    id: "git-diff-1",
    type: "git-diff",
    enabled: true,
    options: { raw: false, gitDiffMode: "compact", fg: "yellow" },
  };
}

function spacerEntry(): WidgetEntry {
  return {
    id: "spacer-1",
    type: "spacer",
    enabled: true,
    options: { width: 2, fg: "green" },
  };
}

function makeConfig(): StatuslineConfig {
  return {
    ...DEFAULT_CONFIG,
    terminal: { ...DEFAULT_CONFIG.terminal },
    extensionStatusRow: {
      hiddenKeys: ["hidden.extension"],
      knownKeys: ["hidden.extension", "visible.extension"],
    },
    lines: [
      [
        runtimeEntry(),
        modelEntry(),
        tokensEntry(),
        contextBarEntry(),
        compactionsEntry(),
        gitBranchEntry(),
        gitDiffEntry(),
        spacerEntry(),
      ],
    ],
  };
}

function settingsWithPossibleLines(settings: StatuslineSettings): StatuslineSettings & {
  lines?: unknown;
} {
  return settings as StatuslineSettings & { lines?: unknown };
}

describe("WidgetStore", () => {
  it("hydrates spec-backed widgets from config", () => {
    const store = WidgetStore.fromConfig(makeConfig());

    expect(store.lines[0]?.[0]).toBeInstanceOf(WidgetInstance);
    expect(store.lines[0]?.[0]?.type).toBe(RuntimeWidget.type);
    expect(store.lines[0]?.[1]).toBeInstanceOf(WidgetInstance);
    expect(store.lines[0]?.[1]?.type).toBe(ModelWidget.type);
    expect(store.lines[0]?.[2]).toBeInstanceOf(WidgetInstance);
    expect(store.lines[0]?.[2]?.type).toBe(TokensWidget.type);
    expect(store.lines[0]?.[3]).toBeInstanceOf(WidgetInstance);
    expect(store.lines[0]?.[3]?.type).toBe(ContextBarWidget.type);
    expect(store.lines[0]?.[4]).toBeInstanceOf(WidgetInstance);
    expect(store.lines[0]?.[4]?.type).toBe(CompactionsWidget.type);
    expect(store.lines[0]?.[5]).toBeInstanceOf(WidgetInstance);
    expect(store.lines[0]?.[5]?.type).toBe(GitBranchWidget.type);
    expect(store.lines[0]?.[6]).toBeInstanceOf(WidgetInstance);
    expect(store.lines[0]?.[6]?.type).toBe(GitDiffWidget.type);
    expect(store.lines[0]?.[7]).toBeInstanceOf(WidgetInstance);
    expect(store.lines[0]?.[7]?.type).toBe(SpacerWidget.type);
    expect(store.lines[0]?.[0]?.id).toBe("runtime-1");
    expect(store.lines[0]?.[1]?.id).toBe("model-1");
    expect(store.lines[0]?.[2]?.id).toBe("tokens-1");
    expect(store.lines[0]?.[3]?.id).toBe("context-bar-1");
    expect(store.lines[0]?.[4]?.id).toBe("compactions-1");
    expect(store.lines[0]?.[5]?.id).toBe("git-branch-1");
    expect(store.lines[0]?.[6]?.id).toBe("git-diff-1");
    expect(store.lines[0]?.[7]?.id).toBe("spacer-1");
  });

  it("serializes to cloned plain JSON", () => {
    const config = makeConfig();
    const store = WidgetStore.fromConfig(config);
    const serialized = store.toConfig();

    expect(serialized).toEqual(config);
    expect(JSON.parse(JSON.stringify(serialized))).toEqual(serialized);
    expect(serialized).not.toBe(config);
    expect(serialized.terminal).not.toBe(config.terminal);
    expect(serialized.extensionStatusRow.hiddenKeys).not.toBe(config.extensionStatusRow.hiddenKeys);
    expect(serialized.lines).not.toBe(config.lines);
    expect(serialized.lines[0]).not.toBe(config.lines[0]);
    expect(serialized.lines[0]?.[0]).not.toBe(store.lines[0]?.[0]?.entry);
    expect(serialized.lines[0]?.[0]?.options).not.toBe(store.lines[0]?.[0]?.options);
    expect(Object.getPrototypeOf(serialized.lines[0]?.[0])).toBe(Object.prototype);

    serialized.lines[0]![0]!.options.displayVersion = false;
    serialized.extensionStatusRow.knownKeys.push("serialized-only");

    expect(store.toConfig().lines[0]?.[0]?.options.displayVersion).toBe(true);
    expect(store.settings.extensionStatusRow.knownKeys).toEqual([
      "hidden.extension",
      "visible.extension",
    ]);
  });

  it("mutates hydrated widgets with toggle and update and serializes changes", () => {
    const store = WidgetStore.fromConfig(makeConfig());
    const widget = store.lines[0]![0]!;

    widget.toggle(false);
    widget.update({ raw: true, displayVersion: false, style: "default" });

    expect(store.lines[0]?.[0]?.enabled).toBe(false);
    expect(store.lines[0]?.[0]?.options).toMatchObject({
      raw: true,
      displayVersion: false,
      style: "default",
    });
    expect(store.toConfig().lines[0]?.[0]).toMatchObject({
      id: "runtime-1",
      type: "runtime",
      enabled: false,
      options: { raw: true, displayVersion: false, style: "default" },
    });
  });

  it("does not share mutable config, store, or cloned widget entries", () => {
    const config = makeConfig();
    const store = WidgetStore.fromConfig(config);

    expect(settingsWithPossibleLines(store.settings).lines).toBeUndefined();

    config.lines[0]![0]!.enabled = false;
    config.lines[0]![0]!.options.displayVersion = false;
    config.terminal.colorLevel = "none";
    config.extensionStatusRow.hiddenKeys.push("mutated-original");

    expect(store.toConfig().lines[0]?.[0]?.enabled).toBe(true);
    expect(store.toConfig().lines[0]?.[0]?.options.displayVersion).toBe(true);
    expect(store.settings.terminal.colorLevel).toBe(DEFAULT_CONFIG.terminal.colorLevel);
    expect(store.settings.extensionStatusRow.hiddenKeys).toEqual(["hidden.extension"]);

    const clonedStore = WidgetStore.fromConfig(store.toConfig());
    clonedStore.lines[0]![0]!.update({ displayVersion: false });
    clonedStore.settings.extensionStatusRow.knownKeys.push("clone-only");

    expect(store.toConfig().lines[0]?.[0]?.options.displayVersion).toBe(true);
    expect(store.settings.extensionStatusRow.knownKeys).toEqual([
      "hidden.extension",
      "visible.extension",
    ]);
    expect(settingsWithPossibleLines(clonedStore.settings).lines).toBeUndefined();

    const clonedWidget = registry.cloneWidget(store.lines[0]![0]!);
    clonedWidget.update({ displayVersion: false });

    expect(clonedWidget.id).not.toBe(store.lines[0]?.[0]?.id);
    expect(clonedWidget.options.displayVersion).toBe(false);
    expect(store.lines[0]?.[0]?.options.displayVersion).toBe(true);
  });
});
