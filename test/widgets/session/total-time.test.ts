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
import { TotalTimeWidget } from "../../../src/widgets/session/total-time.js";
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

function totalTime(options: WidgetOptions = {}) {
  return registry.createWidget("total-time", options);
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

describe("TotalTimeWidget", () => {
  it("owns metadata and default options", () => {
    expect(TotalTimeWidget.type).toBe("total-time");
    expect(TotalTimeWidget.label).toBe("Session Total Time");
    expect(TotalTimeWidget.category).toBe("Session");
    expect(TotalTimeWidget.description).toBe("Live wall-clock time since first session entry");
    expect(TotalTimeWidget.dependencies).toEqual(["metrics"]);
    expect(TotalTimeWidget.baseOptionDefaults).toEqual({});
    expect(TotalTimeWidget.icons).toEqual({ emoji: "⏳", nerd: "󱎫", text: "total" });
    expect(TotalTimeWidget.defaultStyle).toEqual({ fg: "yellow", bg: "default", bold: false });
    const widget = totalTime();
    expect(widget.options).toEqual({
      raw: false,
      icon: "",
      fg: "yellow",
      bg: "default",
      bold: false,
    });
    expect(widget).toBeInstanceOf(WidgetInstance);
    expect(registry.spec(widget.type)).toBe(TotalTimeWidget);
  });

  it("renders labels, raw output, custom icons, minimalist output, and live timestamp fallbacks", () => {
    vi.useFakeTimers();
    vi.setSystemTime(3_900_000);

    expect(totalTime().render(ctx())).toBe("total 1h 5m");
    expect(totalTime({ raw: true }).render(ctx())).toBe("1h 5m");
    expect(totalTime({ icon: "T=" }).render(ctx())).toBe("T=1h 5m");
    expect(totalTime().render(ctx({ minimalist: true }))).toBe("1h 5m");
    expect(totalTime().render(ctx({ metrics: { ...metrics, firstTimestampMs: undefined } }))).toBe(
      "total 0m",
    );
    expect(
      totalTime().render(
        ctx({ metrics: { ...metrics, firstTimestampMs: 600_000, lastTimestampMs: 120_000 } }),
      ),
    ).toBe("total 55m");
    expect(totalTime().render(ctx({ metrics: { ...metrics, firstTimestampMs: 4_000_000 } }))).toBe(
      "total 0m",
    );
  });

  it("exposes metadata fields and summaries without hide/text options", () => {
    expect(fieldsForWidget(totalTime()).map((field) => field.id)).toEqual([
      "enabled",
      "raw",
      "icon",
    ]);
    expect(formatWidgetOptions(totalTime())).toBe("");
    expect(formatWidgetOptions(totalTime({ raw: true }))).toBe("raw");
    expect(formatWidgetOptions(totalTime({ icon: "T=" }))).toBe("icon='T='");
    expect(formatWidgetOptions(totalTime({ raw: true, icon: "T=" }))).toBe("raw • icon='T='");
    expect(formatWidgetColorOptions(totalTime({ fg: "red", bold: true }))).toBe("fg=Red • bold");
  });

  it("normalizes config through metadata", () => {
    expect(
      normalizeConfig({
        lines: [[{ type: "total-time", options: { raw: true, icon: "T=" } }]],
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
              type: "total-time",
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
    vi.useFakeTimers();
    vi.setSystemTime(3_900_000);

    const store = WidgetStore.fromConfig(
      normalizeConfig({
        terminal: { colorLevel: "none" },
        iconMode: "text",
        lines: [[{ type: "total-time" }]],
      }),
    );

    expect(renderStatuslines(store, statuslineData, 200)).toEqual(["total 1h 5m"]);
  });
});
