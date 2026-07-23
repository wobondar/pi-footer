import { describe, expect, it } from "vitest";

import { normalizeConfig } from "../../../src/config.js";
import type { WidgetOptions } from "../../../src/types.js";
import {
  fieldsForWidget,
  formatWidgetColorOptions,
  formatWidgetOptions,
} from "../../../src/ui/fields.js";
import { WidgetInstance } from "../../../src/widgets/instance.js";
import { registry } from "../../../src/widgets/registry.js";
import { CacheHitRateWidget } from "../../../src/widgets/tokens/cache-hit-rate.js";
import type { WidgetContext } from "../../../src/widgets/types.js";
import { TOKEN_METRICS, TURN_METRICS } from "./fixtures.js";

function cacheHitRate(options: WidgetOptions = {}) {
  return registry.createWidget("cache-hit-rate", options);
}

function ctx(overrides: Partial<WidgetContext<["metrics", "turnMetrics"]>> = {}) {
  return {
    iconMode: "text",
    minimalist: false,
    colorLevel: "none",
    metrics: TOKEN_METRICS,
    turnMetrics: TURN_METRICS,
    ...overrides,
  } satisfies WidgetContext<["metrics", "turnMetrics"]>;
}

describe("CacheHitRateWidget", () => {
  it("owns metadata and default options", () => {
    const widget = cacheHitRate();
    expect(widget).toBeInstanceOf(WidgetInstance);
    expect(registry.spec(widget.type)).toBe(CacheHitRateWidget);
    expect(CacheHitRateWidget.label).toBe("Cache Hit Rate");
    expect(CacheHitRateWidget.dependencies).toEqual(["metrics", "turnMetrics"]);
    expect(CacheHitRateWidget.icons).toEqual({ emoji: "🎯", nerd: "󰓎", text: "cache hit" });
    expect(CacheHitRateWidget.defaultStyle).toEqual({ fg: "cyan", bg: "default", bold: false });
    expect(CacheHitRateWidget.baseOptionDefaults).toEqual({});
    expect(registry.createEntry("cache-hit-rate").options).toEqual({
      raw: false,
      hideWhenZero: false,
      icon: "",
      cacheHitSource: "session",
      style: "default",
      fg: "cyan",
      bg: "default",
      bold: false,
    });
  });

  it("renders session and last turn cache hit rates", () => {
    const metrics = {
      ...TOKEN_METRICS,
      inputTokens: 100,
      cacheReadTokens: 300,
      cacheWriteTokens: 100,
    };
    const turnMetrics = {
      ...TURN_METRICS,
      inputTokens: 50,
      cacheReadTokens: 400,
      cacheWriteTokens: 50,
    };

    expect(cacheHitRate().render(ctx({ metrics, turnMetrics }))).toBe("cache hit 60.0%");
    expect(cacheHitRate({ icon: "CH" }).render(ctx({ metrics, turnMetrics }))).toBe("CH60.0%");
    expect(cacheHitRate({ raw: true }).render(ctx({ metrics, turnMetrics }))).toBe("60.0%");
    expect(
      cacheHitRate({ raw: true, cacheHitSource: "turn" }).render(ctx({ metrics, turnMetrics })),
    ).toBe("80.0%");
    expect(
      cacheHitRate({ raw: true, cacheHitSource: "turn", style: "compact" }).render(
        ctx({ metrics, turnMetrics }),
      ),
    ).toBe("80%");
  });

  it("renders zero and optionally hides it", () => {
    const metrics = {
      ...TOKEN_METRICS,
      inputTokens: 100,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
    };

    expect(cacheHitRate().render(ctx({ metrics }))).toBe("cache hit 0.0%");
    expect(cacheHitRate({ hideWhenZero: true }).render(ctx({ metrics }))).toBeUndefined();
  });

  it("exposes metadata fields and summaries", () => {
    expect(fieldsForWidget(cacheHitRate()).map((field) => field.id)).toEqual([
      "enabled",
      "raw",
      "hideWhenZero",
      "icon",
      "cacheHitSource",
      "style",
    ]);
    expect(formatWidgetOptions(cacheHitRate())).toBe("");
    expect(formatWidgetOptions(cacheHitRate({ cacheHitSource: "turn" }))).toBe("source=Turn");
    expect(formatWidgetOptions(cacheHitRate({ style: "compact" }))).toBe("style=compact");
    expect(formatWidgetOptions(cacheHitRate({ hideWhenZero: true }))).toBe("hide-zero");
    expect(formatWidgetOptions(cacheHitRate({ raw: true, icon: "CH" }))).toBe("raw • icon='CH'");
    expect(formatWidgetColorOptions(cacheHitRate({ cacheHitSource: "turn" }))).toBe("source=Turn");
    expect(formatWidgetColorOptions(cacheHitRate({ fg: "red", bold: true }))).toBe("fg=Red • bold");
  });

  it("normalizes config through metadata", () => {
    expect(
      normalizeConfig({
        lines: [
          [
            {
              type: "cache-hit-rate",
              options: {
                raw: true,
                hideWhenZero: true,
                cacheHitSource: "turn",
                style: "compact",
              },
            },
          ],
        ],
      }).lines[0]?.[0]?.options,
    ).toMatchObject({
      raw: true,
      hideWhenZero: true,
      cacheHitSource: "turn",
      style: "compact",
    });
    expect(
      normalizeConfig({
        lines: [
          [
            {
              type: "cache-hit-rate",
              options: {
                hideWhenZero: "yes",
                cacheHitSource: "message",
                style: "wide",
                extra: true,
              },
            },
          ],
        ],
      }).lines[0]?.[0]?.options,
    ).toEqual({
      raw: false,
      hideWhenZero: false,
      icon: "",
      fg: "cyan",
      bg: "default",
      bold: false,
      cacheHitSource: "session",
      style: "default",
    });
  });
});
