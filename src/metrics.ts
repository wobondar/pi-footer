import { isRecord, type SessionMetrics } from "./types.js";

// Intentionally loose structural projection of the `usage` field on a pi session message entry.
// Fields stay `unknown` and are validated at runtime (see isRecord usage below) rather than being
// derived from pi's SDK types — keeps the defensive parsing robust to upstream shape changes.
interface UsageLike {
  input?: unknown;
  output?: unknown;
  cacheRead?: unknown;
  cacheWrite?: unknown;
  totalTokens?: unknown;
  cost?: {
    total?: unknown;
  };
}

// Intentionally loose structural projection of a pi session message entry (from
// sessionManager.getBranch()). Same rationale as UsageLike: `unknown` fields, runtime-validated.
interface MessageLike {
  role?: unknown;
  timestamp?: unknown;
  usage?: unknown;
}

export function collectSessionMetrics(entries: readonly unknown[]): SessionMetrics {
  const metrics: SessionMetrics = {
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    totalTokens: 0,
    costUsd: 0,
    userMessages: 0,
    assistantMessages: 0,
    toolResults: 0,
    firstTimestampMs: undefined,
    lastTimestampMs: undefined,
    compactions: 0,
  };

  for (const entry of entries) {
    const message = getMessage(entry);
    if (!message) continue;

    const timestampMs = normalizeTimestamp(message.timestamp ?? getEntryTimestamp(entry));
    if (timestampMs !== undefined) {
      metrics.firstTimestampMs =
        metrics.firstTimestampMs === undefined
          ? timestampMs
          : Math.min(metrics.firstTimestampMs, timestampMs);
      metrics.lastTimestampMs =
        metrics.lastTimestampMs === undefined
          ? timestampMs
          : Math.max(metrics.lastTimestampMs, timestampMs);
    }

    if (message.role === "user") metrics.userMessages += 1;
    if (message.role === "toolResult") metrics.toolResults += 1;
    if (message.role === "compactionSummary") metrics.compactions += 1;
    if (message.role !== "assistant") continue;

    metrics.assistantMessages += 1;
    const usage = getUsage(message.usage);
    if (!usage) continue;

    const input = numberOrZero(usage.input);
    const output = numberOrZero(usage.output);
    const cacheRead = numberOrZero(usage.cacheRead);
    const cacheWrite = numberOrZero(usage.cacheWrite);

    metrics.inputTokens += input;
    metrics.outputTokens += output;
    metrics.cacheReadTokens += cacheRead;
    metrics.cacheWriteTokens += cacheWrite;
    metrics.totalTokens +=
      numberOrZero(usage.totalTokens) || input + output + cacheRead + cacheWrite;
    metrics.costUsd += numberOrZero(usage.cost?.total);
  }

  return metrics;
}

function getMessage(entry: unknown): MessageLike | undefined {
  if (!isRecord(entry)) return undefined;
  const message = entry.message;
  return isRecord(message) ? message : undefined;
}

function getEntryTimestamp(entry: unknown): unknown {
  return isRecord(entry) ? entry.timestamp : undefined;
}

function getUsage(value: unknown): UsageLike | undefined {
  return isRecord(value) ? (value as UsageLike) : undefined;
}

function normalizeTimestamp(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return undefined;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function numberOrZero(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
