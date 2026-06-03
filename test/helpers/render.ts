// Test-only adapter for config-shaped fixtures. Production rendering accepts WidgetStore.
import type { StatuslineData } from "../../src/types.js";
import { renderStatuslines, type RenderStatuslineOptions } from "../../src/render.js";
import { WidgetStore } from "../../src/widgets/store.js";
import type { StatuslineConfig } from "../../src/types.js";

export function renderStatuslineForTest(
  config: StatuslineConfig,
  data: StatuslineData,
  width: number,
  options?: RenderStatuslineOptions,
): string {
  return renderStatuslines(WidgetStore.fromConfig(config), data, width, options)[0] ?? "";
}

export function renderStatuslinesForTest(
  config: StatuslineConfig,
  data: StatuslineData,
  width: number,
  options?: RenderStatuslineOptions,
): string[] {
  return renderStatuslines(WidgetStore.fromConfig(config), data, width, options);
}

// A neutral, all-zero StatuslineData fixture for tests that need valid data to drive
// behavior but do not assert on its values. Each call returns a fresh object (and a
// fresh eventWidgets Map). Pass overrides to vary individual top-level fields.
export function makeStatuslineData(overrides: Partial<StatuslineData> = {}): StatuslineData {
  return {
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
      staged: 0,
      unstaged: 0,
      untracked: 0,
      insertions: 0,
      deletions: 0,
      ahead: 0,
      behind: 0,
      remote: null,
      isRepo: true,
    },
    cwd: "/tmp/pi-footer",
    activeToolCount: 0,
    usingSubscription: false,
    contextTokens: 0,
    contextMaxTokens: 100,
    metrics: {
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
      totalTokens: 0,
      costUsd: 0,
      userMessages: 0,
      assistantMessages: 0,
      toolResults: 0,
      firstTimestampMs: 0,
      lastTimestampMs: 0,
      compactions: 0,
    },
    eventWidgets: new Map(),
    ...overrides,
  };
}
