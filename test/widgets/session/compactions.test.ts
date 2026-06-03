import { describe, expect, it } from "vitest";

import { normalizeConfig } from "../../../src/config.js";
import type { SessionMetrics, WidgetOptions } from "../../../src/types.js";
import {
  fieldsForWidget,
  formatWidgetColorOptions,
  formatWidgetOptions,
} from "../../../src/ui/fields.js";
import { WidgetInstance } from "../../../src/widgets/instance.js";
import { registry } from "../../../src/widgets/registry.js";
import { CompactionsWidget } from "../../../src/widgets/session/compactions.js";
import type { WidgetContext } from "../../../src/widgets/types.js";

const metrics: SessionMetrics = {
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
  compactions: 2,
};

function compactions(options: WidgetOptions = {}) {
  return registry.createWidget("compactions", options);
}

function ctx(overrides: Partial<WidgetContext<["metrics"]>> = {}): WidgetContext<["metrics"]> {
  return {
    iconMode: "text",
    minimalist: false,
    colorLevel: "none",
    metrics,
    ...overrides,
  };
}

describe("CompactionsWidget", () => {
  it("owns metadata and default options", () => {
    expect(CompactionsWidget.dependencies).toEqual(["metrics"]);
    expect(CompactionsWidget.icons).toEqual({ emoji: "🗜️", nerd: "󰁨", text: "compactions" });
    expect(CompactionsWidget.defaultStyle).toEqual({ fg: "yellow", bg: "default", bold: false });
    expect(CompactionsWidget.baseOptionDefaults).toEqual({});
    expect(registry.createWidget("compactions").options).toEqual({
      raw: false,
      icon: "",
      fg: "yellow",
      bg: "default",
      bold: false,
    });
    const widget = compactions();
    expect(widget).toBeInstanceOf(WidgetInstance);
    expect(registry.spec(widget.type)).toBe(CompactionsWidget);
  });

  it("renders labels, custom icons, raw values, and zero counts", () => {
    expect(compactions().render(ctx())).toBe("compactions 2");
    expect(compactions({ icon: "C=" }).render(ctx())).toBe("C=2");
    expect(compactions({ raw: true }).render(ctx())).toBe("2");
    expect(compactions().render(ctx({ metrics: { ...metrics, compactions: 0 } }))).toBe(
      "compactions 0",
    );
  });

  it("exposes metadata fields and summaries", () => {
    expect(fieldsForWidget(compactions()).map((field) => field.id)).toEqual([
      "enabled",
      "raw",
      "icon",
    ]);
    expect(formatWidgetOptions(compactions())).toBe("");
    expect(formatWidgetOptions(compactions({ raw: true, icon: "C=" }))).toBe("raw • icon='C='");
    expect(formatWidgetColorOptions(compactions({ fg: "red", bold: true }))).toBe("fg=Red • bold");
  });

  it("normalizes config through metadata", () => {
    expect(
      normalizeConfig({
        lines: [[{ type: "compactions", options: { raw: true, icon: "C=" } }]],
      }).lines[0]?.[0]?.options,
    ).toMatchObject({
      raw: true,
      icon: "C=",
    });
    expect(
      normalizeConfig({
        lines: [
          [{ type: "compactions", options: { hideWhenZero: true, tokenFormatStyle: "compact" } }],
        ],
      }).lines[0]?.[0]?.options,
    ).toEqual({
      raw: false,
      icon: "",
      fg: "yellow",
      bg: "default",
      bold: false,
    });
  });
});
