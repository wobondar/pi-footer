import { describe, expect, it } from "vitest";

import { collectSessionMetrics, collectTurnMetrics } from "../src/metrics.js";

describe("collectSessionMetrics", () => {
  it("collects message counts, usage, cost, and timestamps", () => {
    const metrics = collectSessionMetrics([
      {
        type: "message",
        timestamp: "2026-01-01T00:00:00.000Z",
        message: { role: "user", timestamp: 1000 },
      },
      {
        type: "message",
        message: {
          role: "assistant",
          timestamp: 2000,
          usage: {
            input: 100,
            output: 50,
            cacheRead: 10,
            cacheWrite: 5,
            totalTokens: 165,
            cost: { total: 0.01 },
          },
        },
      },
      { type: "message", message: { role: "toolResult", timestamp: 3000 } },
      { type: "message", message: { role: "compactionSummary", timestamp: 4000 } },
    ]);

    expect(metrics).toMatchObject({
      inputTokens: 100,
      outputTokens: 50,
      cacheReadTokens: 10,
      cacheWriteTokens: 5,
      totalTokens: 165,
      costUsd: 0.01,
      userMessages: 1,
      assistantMessages: 1,
      toolResults: 1,
      firstTimestampMs: 1000,
      lastTimestampMs: 4000,
      compactions: 1,
    });
  });

  it("collects the latest assistant turn metrics", () => {
    expect(
      collectTurnMetrics([
        {
          message: {
            role: "assistant",
            usage: { input: 10, cacheRead: 20, cacheWrite: 30 },
          },
        },
        { message: { role: "toolResult" } },
        {
          message: {
            role: "assistant",
            usage: {
              input: 40,
              output: 70,
              cacheRead: 50,
              cacheWrite: 60,
              totalTokens: 0,
              cost: { total: 0.02 },
            },
          },
        },
      ]),
    ).toEqual({
      inputTokens: 40,
      outputTokens: 70,
      cacheReadTokens: 50,
      cacheWriteTokens: 60,
      totalTokens: 220,
      costUsd: 0.02,
    });
    expect(collectTurnMetrics([{ message: { role: "user" } }])).toEqual({
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
      totalTokens: 0,
      costUsd: 0,
    });
  });

  it("ignores malformed entries and falls back to derived totals", () => {
    const metrics = collectSessionMetrics([
      null,
      { message: null },
      { timestamp: "2026-01-01T00:00:01.000Z", message: { role: "user" } },
      { message: { role: "assistant", timestamp: "bad-date", usage: null } },
      {
        timestamp: "2026-01-01T00:00:02.000Z",
        message: {
          role: "assistant",
          usage: {
            input: 10,
            output: Number.NaN,
            cacheRead: 3,
            cacheWrite: 2,
            totalTokens: 0,
            cost: { total: Number.POSITIVE_INFINITY },
          },
        },
      },
    ]);

    expect(metrics).toMatchObject({
      inputTokens: 10,
      outputTokens: 0,
      cacheReadTokens: 3,
      cacheWriteTokens: 2,
      totalTokens: 15,
      costUsd: 0,
      userMessages: 1,
      assistantMessages: 2,
      firstTimestampMs: Date.parse("2026-01-01T00:00:01.000Z"),
      lastTimestampMs: Date.parse("2026-01-01T00:00:02.000Z"),
    });
  });
});
