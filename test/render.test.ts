import { visibleWidth } from "@earendil-works/pi-tui";
import { afterEach, describe, expect, it } from "vitest";

import { configWithPreset, DEFAULT_CONFIG, normalizeConfig } from "../src/config.js";
import { renderStatuslines as renderStatuslinesFromStore } from "../src/render.js";
import type { StatuslineData, WidgetEntry } from "../src/types.js";
import { asyncCache } from "../src/cache.js";
import { registry, type WidgetType } from "../src/widgets/registry.js";
import { WidgetStore } from "../src/widgets/store.js";
import { formatCount, formatPiTokenCount } from "../src/widgets/utils/token-format.js";
import { renderStatuslineForTest, renderStatuslinesForTest } from "./helpers/render.js";
import { taggedPiTheme } from "./helpers/theme.js";

const plainConfig = {
  ...DEFAULT_CONFIG,
  terminal: { ...DEFAULT_CONFIG.terminal, colorLevel: "none" },
} satisfies typeof DEFAULT_CONFIG;

const originalHome = process.env.HOME;

afterEach(() => {
  process.env.HOME = originalHome;
  asyncCache.clear();
});

const renderStatusline = renderStatuslineForTest;
const renderStatuslines = renderStatuslinesForTest;
const data: StatuslineData = {
  model: "claude-sonnet-4-5",
  provider: "anthropic",
  sessionName: "demo",
  sessionId: "session-123",
  thinkingLevel: "high",
  textVerbosity: "low",
  git: {
    branch: "main",
    sha: "abc1234",
    root: "pi-footer",
    staged: 1,
    unstaged: 2,
    untracked: 3,
    insertions: 10,
    deletions: 4,
    ahead: 1,
    behind: 0,
    remote: "git@github.com:example/pi-footer.git",
    isRepo: true,
  },
  cwd: "/Users/example/projects/pi-footer",
  activeToolCount: 4,
  usingSubscription: false,
  contextTokens: 25_000,
  contextMaxTokens: 100_000,
  metrics: {
    inputTokens: 12_345,
    outputTokens: 6789,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    totalTokens: 19_134,
    costUsd: 0.1234,
    userMessages: 2,
    assistantMessages: 2,
    toolResults: 3,
    firstTimestampMs: 0,
    lastTimestampMs: 120_000,
    compactions: 0,
  },
  turnMetrics: {
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    totalTokens: 0,
    costUsd: 0,
  },
  eventWidgets: new Map(),
};

describe("renderStatusline", () => {
  it("renders configured widgets", () => {
    const line = renderStatusline({ ...plainConfig, iconMode: "text" }, data, 200);
    expect(line).toContain("model anthropic/claude-sonnet-4-5");
    expect(line).toContain("ctx len 25k");
    expect(line).toContain("git main");
    expect(line).toContain("diff (+10,-4)");
    expect(line).toContain("cost $0.1234");
  });

  it("renders pi-footer preset", () => {
    process.env.HOME = "/Users/example";
    const lines = renderStatuslines(
      {
        ...configWithPreset(plainConfig, "pi-footer"),
        terminal: { ...plainConfig.terminal, colorLevel: "none" },
      },
      data,
      100,
    );

    expect(lines[0]).toBe("~/projects/pi-footer (main) • demo");
    expect(lines[1]).toContain("↑12k ↓6.8k $0.123 25%/100k");
    expect(lines[1]).toContain("claude-sonnet-4-5");
    expect(visibleWidth(lines[1] ?? "")).toBe(100);

    const linesWithCache = renderStatuslines(
      {
        ...configWithPreset(plainConfig, "pi-footer"),
        terminal: { ...plainConfig.terminal, colorLevel: "none" },
      },
      {
        ...data,
        metrics: { ...data.metrics, cacheReadTokens: 533_000, cacheWriteTokens: 1200 },
        turnMetrics: {
          inputTokens: 100,
          outputTokens: 50,
          cacheReadTokens: 300,
          cacheWriteTokens: 100,
          totalTokens: 550,
          costUsd: 0.01,
        },
      },
      120,
    );
    expect(linesWithCache[1]).toContain("↑12k ↓6.8k R533k W1.2k CH60.0% $0.123 25%/100k");
  });

  it("supports pi foreground colors", () => {
    expect(
      renderStatusline(
        {
          ...plainConfig,
          terminal: { ...plainConfig.terminal, colorLevel: "ansi16" },
          lines: [[registry.createEntry("model", { fg: "pi:dim" })]],
        },
        data,
        200,
        { theme: taggedPiTheme },
      ),
    ).toBe("<dim>🤖 claude-sonnet-4-5</dim>");
  });

  it("renders every widget type", () => {
    const widgets = registry.definitions.map((definition) =>
      registry.createEntry(definition.type, {
        hideWhenEmpty: false,
        externalStatusKey: "build",
        widgetId: "flag",
        ...(definition.type === "custom-text" ? { text: "hello" } : {}),
      }),
    );
    const line = renderStatusline(
      { ...plainConfig, separator: "space", lines: [widgets] },
      { ...data, eventWidgets: new Map([["flag", "on"]]) },
      2000,
      { getExtensionStatuses: () => new Map([["build", "ok"]]) },
    );

    expect(line).toContain("anthropic/claude-sonnet-4-5");
    expect(line).toContain("git@github.com:example/pi-footer.git");
    expect(line).toContain("hello");
    expect(line).toContain("+10/-4");
    expect(line).toContain("2u/2a/3t");
  });

  it("renders widgets with missing optional options", () => {
    const bare = (type: WidgetType): WidgetEntry => ({
      id: `bare-${type}`,
      type,
      enabled: true,
      options: {},
    });
    // TODO(widget-spec): replace this broad malformed-config smoke test with individual widget tests.
    // Keep these intentionally sparse entries routed through the same WidgetStore path production uses.
    const store = WidgetStore.fromConfig(
      normalizeConfig({
        ...plainConfig,
        separator: "space",
        lines: [
          [
            bare("model"),
            bare("model-provider"),
            bare("context-window"),
            bare("cwd"),
            bare("session-name"),
            bare("event"),
            bare("external-status"),
            bare("tokens"),
            bare("input-tokens"),
            bare("output-tokens"),
            bare("total-tokens"),
            bare("cache-read"),
            bare("cache-write"),
            bare("cache-hit-rate"),
            bare("context-length"),
            bare("context-bar"),
            bare("cost"),
            bare("input-speed"),
            bare("output-speed"),
            bare("total-speed"),
            bare("session-id"),
            bare("git-branch"),
            bare("git-sha"),
            bare("git-root"),
            bare("git-diff"),
            bare("git-remote"),
            bare("custom-text"),
            bare("separator"),
            bare("spacer"),
          ],
        ],
      }),
    );
    const line =
      renderStatuslinesFromStore(
        store,
        {
          ...data,
          model: undefined,
          provider: undefined,
          sessionName: undefined,
          sessionId: undefined,
          git: { ...data.git, branch: null, sha: null, root: null, remote: null },
          eventWidgets: new Map(),
        },
        2000,
      )[0] ?? "";

    expect(line).toContain("🤖 no-model");
    expect(line).toContain(" | ");
  });

  it("covers context, timing, and fallback formatting branches", () => {
    expect(formatPiTokenCount(1000)).toBe("1.0k");
    expect(formatPiTokenCount(10_000_000)).toBe("10M");

    const unknownContext = renderStatusline(
      {
        ...plainConfig,
        lines: [[registry.createEntry("context-length"), registry.createEntry("context-bar")]],
      },
      {
        ...data,
        contextTokens: undefined,
        contextMaxTokens: undefined,
        metrics: { ...data.metrics, firstTimestampMs: 10_000, lastTimestampMs: 1000 },
      },
      200,
    );
    expect(unknownContext).toContain("? • 📊 ?");
  });

  it("supports emoji, nerd icon, and text label modes", () => {
    expect(
      renderStatusline(
        { ...plainConfig, iconMode: "emoji", lines: [[registry.createEntry("model")]] },
        data,
        200,
      ),
    ).toContain("🤖 claude-sonnet-4-5");
    expect(
      renderStatusline(
        { ...plainConfig, iconMode: "nerd", lines: [[registry.createEntry("model")]] },
        data,
        200,
      ),
    ).toContain("󰚩 claude-sonnet-4-5");
    expect(
      renderStatusline(
        { ...plainConfig, iconMode: "text", lines: [[registry.createEntry("model")]] },
        data,
        200,
      ),
    ).toContain("model claude-sonnet-4-5");
  });

  it("uses custom icons before icon mode labels", () => {
    expect(
      renderStatusline(
        {
          ...plainConfig,
          iconMode: "emoji",
          lines: [[registry.createEntry("model", { icon: "M" })]],
        },
        data,
        200,
      ),
    ).toContain("Mclaude-sonnet-4-5");
  });

  it("supports duplicate widget instances", () => {
    const line = renderStatusline(
      {
        ...plainConfig,
        iconMode: "text",
        lines: [[registry.createEntry("model"), registry.createEntry("model")]],
      },
      data,
      200,
    );
    expect(line.match(/model claude-sonnet-4-5/g)).toHaveLength(2);
  });

  it("supports no global separator", () => {
    const line = renderStatusline(
      {
        ...plainConfig,
        separator: "none",
        iconMode: "text",
        lines: [[registry.createEntry("model"), registry.createEntry("cost")]],
      },
      data,
      200,
    );
    expect(line).toBe("model claude-sonnet-4-5cost $0.1234");
  });

  it("applies global separator colors only to global separators", () => {
    const globalLine = renderStatusline(
      {
        ...DEFAULT_CONFIG,
        separatorFg: "red",
        lines: [
          [
            registry.createEntry("custom-text", { text: "A" }),
            registry.createEntry("custom-text", { text: "B" }),
          ],
        ],
      },
      data,
      200,
    );
    expect(globalLine).toBe("A\x1b[31m • \x1b[39mB");

    const widgetLine = renderStatusline(
      {
        ...DEFAULT_CONFIG,
        separatorFg: "red",
        lines: [
          [
            registry.createEntry("custom-text", { text: "A" }),
            registry.createEntry("separator"),
            registry.createEntry("custom-text", { text: "B" }),
          ],
        ],
      },
      data,
      200,
    );
    expect(widgetLine).toBe("A | B");
  });

  it("does not add global separators around separator widgets", () => {
    const line = renderStatusline(
      {
        ...plainConfig,
        separator: "dot",
        iconMode: "text",
        lines: [
          [
            registry.createEntry("model"),
            registry.createEntry("separator"),
            registry.createEntry("cost"),
          ],
        ],
      },
      data,
      200,
    );
    expect(line).toContain("model claude-sonnet-4-5 | cost $0.1234");
    expect(line).not.toContain("• | ");
    expect(line).not.toContain(" |  •");
  });

  it("supports custom separator widgets", () => {
    const line = renderStatusline(
      {
        ...plainConfig,
        separator: "dot",
        iconMode: "text",
        lines: [
          [
            registry.createEntry("model"),
            registry.createEntry("separator", { separator: "custom", text: " ~~ " }),
            registry.createEntry("cost"),
          ],
        ],
      },
      data,
      200,
    );
    expect(line).toContain("model claude-sonnet-4-5 ~~ cost $0.1234");
  });

  it("supports dash and comma separator widgets", () => {
    const commaLine = renderStatusline(
      {
        ...plainConfig,
        separator: "dot",
        iconMode: "text",
        lines: [
          [
            registry.createEntry("model"),
            registry.createEntry("separator", { separator: "comma" }),
            registry.createEntry("cost"),
          ],
        ],
      },
      data,
      200,
    );
    expect(commaLine).toBe("model claude-sonnet-4-5, cost $0.1234");

    const dashLine = renderStatusline(
      {
        ...plainConfig,
        separator: "dot",
        iconMode: "text",
        lines: [
          [
            registry.createEntry("model"),
            registry.createEntry("separator", { separator: "dash" }),
            registry.createEntry("cost"),
          ],
        ],
      },
      data,
      200,
    );
    expect(dashLine).toBe("model claude-sonnet-4-5 - cost $0.1234");
  });

  it("supports dash and comma separators", () => {
    const commaLine = renderStatusline(
      {
        ...plainConfig,
        separator: "comma",
        iconMode: "text",
        lines: [[registry.createEntry("model"), registry.createEntry("cost")]],
      },
      data,
      200,
    );
    expect(commaLine).toBe("model claude-sonnet-4-5, cost $0.1234");

    const dashLine = renderStatusline(
      {
        ...plainConfig,
        separator: "dash",
        iconMode: "text",
        lines: [[registry.createEntry("model"), registry.createEntry("cost")]],
      },
      data,
      200,
    );
    expect(dashLine).toBe("model claude-sonnet-4-5 - cost $0.1234");
  });

  it("supports flex layout", () => {
    const line = renderStatusline(
      {
        ...plainConfig,
        iconMode: "text",
        lines: [
          [
            registry.createEntry("model"),
            registry.createEntry("flex-separator"),
            registry.createEntry("cost"),
          ],
        ],
      },
      data,
      80,
    );
    expect(visibleWidth(line)).toBe(80);
    expect(line).toContain("cost $0.1234");
  });

  it("respects width", () => {
    const line = renderStatusline(plainConfig, data, 20);
    expect(visibleWidth(line)).toBeLessThanOrEqual(20);
  });

  it("returns empty when disabled", () => {
    expect(renderStatusline({ ...plainConfig, enabled: false }, data, 200)).toBe("");
  });

  it("drops a blank line unless styling leaves escape codes", () => {
    expect(
      renderStatuslines(
        { ...plainConfig, lines: [[registry.createEntry("custom-text", { text: "" })]] },
        data,
        80,
      ),
    ).toEqual([]);
    expect(
      renderStatuslines(
        {
          ...plainConfig,
          terminal: { ...plainConfig.terminal, colorLevel: "ansi256" },
          lines: [[registry.createEntry("custom-text", { text: "", fg: "red" })]],
        },
        data,
        80,
      ),
    ).toHaveLength(1);
  });
});

describe("format helpers", () => {
  it("formats large counts", () => {
    expect(formatCount(999)).toBe("999");
    expect(formatCount(1500)).toBe("1.5k");
    expect(formatCount(2_000_000)).toBe("2m");
    expect(formatPiTokenCount(9999)).toBe("10.0k");
    expect(formatPiTokenCount(12_345)).toBe("12k");
    expect(formatPiTokenCount(2_000_000)).toBe("2.0M");
  });
});
