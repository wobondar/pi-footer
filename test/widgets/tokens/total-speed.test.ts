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
import { TotalSpeedWidget } from "../../../src/widgets/tokens/total-speed.js";
import type { WidgetContext } from "../../../src/widgets/types.js";
import { TOKEN_METRICS } from "./fixtures.js";

function totalSpeed(options: WidgetOptions = {}) {
  return registry.createWidget("total-speed", options);
}

function ctx(overrides: Partial<WidgetContext<["metrics"]>> = {}) {
  return {
    iconMode: "text",
    minimalist: false,
    colorLevel: "none",
    metrics: TOKEN_METRICS,
    ...overrides,
  } satisfies WidgetContext<["metrics"]>;
}

describe("TotalSpeedWidget", () => {
  it("owns metadata and default options", () => {
    const widget = totalSpeed();
    expect(widget).toBeInstanceOf(WidgetInstance);
    expect(registry.spec(widget.type)).toBe(TotalSpeedWidget);
    expect(TotalSpeedWidget.dependencies).toEqual(["metrics"]);
    expect(TotalSpeedWidget.icons).toEqual({ emoji: "⚡", nerd: "↕", text: "tok/min" });
    expect(TotalSpeedWidget.defaultStyle).toEqual({
      fg: "brightGreen",
      bg: "default",
      bold: false,
    });
    expect(TotalSpeedWidget.baseOptionDefaults).toEqual({});
    expect(registry.createEntry("total-speed").options).toEqual({
      raw: false,
      hideWhenZero: false,
      icon: "",
      tokenFormatStyle: "default",
      fg: "brightGreen",
      bg: "default",
      bold: false,
    });
  });

  it("renders labels, custom icons, raw values, and compact format", () => {
    expect(totalSpeed().render(ctx())).toBe("tok/min 9.6k/min");
    expect(totalSpeed({ icon: "Total: " }).render(ctx())).toBe("Total: 9.6k/min");
    expect(totalSpeed({ raw: true }).render(ctx())).toBe("9.6k/min");
    expect(
      totalSpeed({ raw: true, tokenFormatStyle: "compact" }).render(
        ctx({ metrics: { ...TOKEN_METRICS, totalTokens: 12_345, lastTimestampMs: 60_000 } }),
      ),
    ).toBe("12k/min");
  });

  it("renders zero speed when timestamps are missing, reversed, or invalid", () => {
    expect(
      totalSpeed().render(
        ctx({
          metrics: { ...TOKEN_METRICS, firstTimestampMs: undefined, lastTimestampMs: 120_000 },
        }),
      ),
    ).toContain("0/min");
    expect(
      totalSpeed().render(
        ctx({ metrics: { ...TOKEN_METRICS, firstTimestampMs: 120_000, lastTimestampMs: 0 } }),
      ),
    ).toContain("0/min");
    expect(
      totalSpeed().render(
        ctx({
          metrics: { ...TOKEN_METRICS, firstTimestampMs: Number.NaN, lastTimestampMs: 120_000 },
        }),
      ),
    ).toContain("0/min");
    expect(
      totalSpeed({ hideWhenZero: true }).render(
        ctx({
          metrics: { ...TOKEN_METRICS, firstTimestampMs: undefined, lastTimestampMs: undefined },
        }),
      ),
    ).toContain("0/min");
  });

  it("exposes metadata fields and summaries", () => {
    expect(fieldsForWidget(totalSpeed()).map((field) => field.id)).toEqual([
      "enabled",
      "raw",
      "hideWhenZero",
      "icon",
      "tokenFormatStyle",
    ]);
    expect(formatWidgetOptions(totalSpeed())).toBe("");
    expect(formatWidgetOptions(totalSpeed({ tokenFormatStyle: "compact" }))).toBe("format=Compact");
    expect(formatWidgetOptions(totalSpeed({ hideWhenZero: true }))).toBe("hide-zero");
    expect(formatWidgetOptions(totalSpeed({ raw: true, icon: "S " }))).toBe("raw • icon='S '");
    expect(formatWidgetColorOptions(totalSpeed({ fg: "red", bold: true }))).toBe("fg=Red • bold");
  });

  it("normalizes config through metadata", () => {
    expect(
      normalizeConfig({
        lines: [[{ type: "total-speed", options: { tokenFormatStyle: "compact" } }]],
      }).lines[0]?.[0]?.options,
    ).toMatchObject({ tokenFormatStyle: "compact" });
    expect(
      normalizeConfig({
        lines: [
          [
            {
              type: "total-speed",
              options: { tokenFormatStyle: "wide", showProvider: true, hideWhenEmpty: true },
            },
          ],
        ],
      }).lines[0]?.[0]?.options,
    ).toEqual({
      raw: false,
      hideWhenZero: false,
      icon: "",
      fg: "brightGreen",
      bg: "default",
      bold: false,
      tokenFormatStyle: "default",
    });
  });
});
