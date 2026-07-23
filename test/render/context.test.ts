import { describe, expect, it } from "vitest";

import { contextForDependencies } from "../../src/widgets/context.js";
import { registry } from "../../src/widgets/registry.js";
import type { StatuslineData } from "../../src/types.js";
import type { BaseWidgetContext, WidgetDependency } from "../../src/widgets/types.js";

const baseCtx: BaseWidgetContext = {
  iconMode: "text",
  minimalist: false,
  colorLevel: "none",
};

const data: StatuslineData = {
  model: "claude",
  provider: "anthropic",
  sessionName: "demo",
  sessionId: "session-1",
  thinkingLevel: "high",
  textVerbosity: "low",
  git: {
    branch: "main",
    sha: "abc1234",
    root: "repo",
    staged: 1,
    unstaged: 2,
    untracked: 3,
    insertions: 4,
    deletions: 5,
    ahead: 6,
    behind: 7,
    remote: "origin",
    isRepo: true,
  },
  cwd: "/tmp/repo",
  activeToolCount: 2,
  usingSubscription: true,
  contextTokens: 100,
  contextMaxTokens: 200,
  metrics: {
    inputTokens: 1,
    outputTokens: 2,
    cacheReadTokens: 3,
    cacheWriteTokens: 4,
    totalTokens: 5,
    costUsd: 0.1,
    userMessages: 6,
    assistantMessages: 7,
    toolResults: 8,
    firstTimestampMs: 9,
    lastTimestampMs: 10,
    compactions: 11,
  },
  turnMetrics: {
    inputTokens: 12,
    outputTokens: 15,
    cacheReadTokens: 13,
    cacheWriteTokens: 14,
    totalTokens: 54,
    costUsd: 0.02,
  },
  eventWidgets: new Map([["flag", "on"]]),
};

describe("widget dependency context", () => {
  it("covers every dependency used by registered specs", () => {
    const usedDependencies = new Set<WidgetDependency>();

    for (const spec of registry.specs) {
      for (const dependency of spec.dependencies) {
        usedDependencies.add(dependency);
      }
    }

    const ctx = contextForDependencies(baseCtx, [...usedDependencies], data, {
      getExtensionStatuses() {
        return new Map();
      },
    });

    for (const dependency of usedDependencies) {
      expect(dependency in ctx).toBe(true);
    }
  });

  it("resolves eventWidgets", () => {
    const ctx = contextForDependencies(baseCtx, ["eventWidgets"], data, {});
    expect(ctx.eventWidgets.get("flag")).toBe("on");
  });

  it("resolves getExtensionStatuses", () => {
    const statuses = new Map([["build", "ok"]]);
    const ctx = contextForDependencies(baseCtx, ["getExtensionStatuses"], data, {
      getExtensionStatuses() {
        return statuses;
      },
    });

    expect(ctx.getExtensionStatuses?.()).toBe(statuses);
  });
});
