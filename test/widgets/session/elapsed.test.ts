import { afterEach, describe, expect, it, vi } from "vitest";

import { normalizeConfig } from "../../../src/config.js";
import { renderStatuslines } from "../../../src/render.js";
import { makeStatuslineData } from "../../helpers/render.js";
import type { SessionMetrics, WidgetOptions } from "../../../src/types.js";
import {
  fieldsForWidget,
  formatWidgetColorOptions,
  formatWidgetOptions,
} from "../../../src/ui/fields.js";
import { WidgetInstance } from "../../../src/widgets/instance.js";
import { registry } from "../../../src/widgets/registry.js";
import { ElapsedWidget } from "../../../src/widgets/session/elapsed.js";
import { WidgetStore } from "../../../src/widgets/store.js";
import type { WidgetContext } from "../../../src/widgets/types.js";

const metrics: SessionMetrics = {
  inputTokens: 12_345,
  outputTokens: 6789,
  cacheReadTokens: 0,
  cacheWriteTokens: 0,
  totalTokens: 19_134,
  costUsd: 0.1234,
  userMessages: 2,
  assistantMessages: 4,
  toolResults: 3,
  firstTimestampMs: 0,
  lastTimestampMs: 120_000,
  compactions: 0,
};

const statuslineData = makeStatuslineData({ metrics });

function elapsed(options: WidgetOptions = {}) {
  return registry.createWidget("elapsed", options);
}

function ctx(overrides: Partial<WidgetContext<["metrics"]>> = {}) {
  return {
    iconMode: "text",
    minimalist: false,
    colorLevel: "none",
    metrics,
    ...overrides,
  } satisfies WidgetContext<["metrics"]>;
}

afterEach(() => {
  vi.useRealTimers();
});

describe("ElapsedWidget", () => {
  it("owns metadata and default options", () => {
    expect(ElapsedWidget.type).toBe("elapsed");
    expect(ElapsedWidget.label).toBe("Transcript Span");
    expect(ElapsedWidget.category).toBe("Session");
    expect(ElapsedWidget.description).toBe("Time between first and last recorded session entry");
    expect(ElapsedWidget.dependencies).toEqual(["metrics"]);
    expect(ElapsedWidget.baseOptionDefaults).toEqual({});
    expect(ElapsedWidget.icons).toEqual({ emoji: "⏱️", nerd: "󱎫", text: "span" });
    expect(ElapsedWidget.defaultStyle).toEqual({ fg: "yellow", bg: "default", bold: false });
    const widget = elapsed();
    expect(widget.options).toEqual({
      raw: false,
      icon: "",
      fg: "yellow",
      bg: "default",
      bold: false,
    });
    expect(widget).toBeInstanceOf(WidgetInstance);
    expect(registry.spec(widget.type)).toBe(ElapsedWidget);
  });

  it("renders labels, raw output, custom icons, minimalist output, and timestamp fallbacks", () => {
    vi.useFakeTimers();
    vi.setSystemTime(3_900_000);

    expect(elapsed().render(ctx())).toBe("span 2m");
    expect(elapsed().render(ctx({ metrics: { ...metrics, lastTimestampMs: 30_000 } }))).toBe(
      "span 1m",
    );
    expect(elapsed().render(ctx({ metrics: { ...metrics, lastTimestampMs: 3_600_000 } }))).toBe(
      "span 1h",
    );
    expect(elapsed({ raw: true }).render(ctx())).toBe("2m");
    expect(elapsed({ icon: "T=" }).render(ctx())).toBe("T=2m");
    expect(elapsed().render(ctx({ minimalist: true }))).toBe("2m");
    expect(elapsed().render(ctx({ metrics: { ...metrics, firstTimestampMs: undefined } }))).toBe(
      "span 0m",
    );
    expect(elapsed().render(ctx({ metrics: { ...metrics, lastTimestampMs: undefined } }))).toBe(
      "span 1h 5m",
    );
    expect(
      elapsed().render(
        ctx({ metrics: { ...metrics, firstTimestampMs: 10_000, lastTimestampMs: 0 } }),
      ),
    ).toBe("span 1h 4m");
  });

  it("exposes metadata fields and summaries without hide/text options", () => {
    expect(fieldsForWidget(elapsed()).map((field) => field.id)).toEqual(["enabled", "raw", "icon"]);
    expect(formatWidgetOptions(elapsed())).toBe("");
    expect(formatWidgetOptions(elapsed({ raw: true }))).toBe("raw");
    expect(formatWidgetOptions(elapsed({ icon: "T=" }))).toBe("icon='T='");
    expect(formatWidgetOptions(elapsed({ raw: true, icon: "T=" }))).toBe("raw • icon='T='");
    expect(formatWidgetColorOptions(elapsed({ fg: "red", bold: true }))).toBe("fg=Red • bold");
  });

  it("normalizes config through metadata", () => {
    expect(
      normalizeConfig({
        lines: [[{ type: "elapsed", options: { raw: true, icon: "T=" } }]],
      }).lines[0]?.[0]?.options,
    ).toMatchObject({
      raw: true,
      icon: "T=",
    });
    expect(
      normalizeConfig({
        lines: [
          [
            {
              type: "elapsed",
              options: { raw: "yes", icon: 7, hideWhenEmpty: true, hideWhenZero: true, text: "-" },
            },
          ],
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

  it("receives metrics through the production store render path", () => {
    const store = WidgetStore.fromConfig(
      normalizeConfig({
        terminal: { colorLevel: "none" },
        iconMode: "text",
        lines: [[{ type: "elapsed" }]],
      }),
    );

    expect(renderStatuslines(store, statuslineData, 200)).toEqual(["span 2m"]);
  });
});
