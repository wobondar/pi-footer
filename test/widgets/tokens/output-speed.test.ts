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
import { OutputSpeedWidget } from "../../../src/widgets/tokens/output-speed.js";
import type { WidgetContext } from "../../../src/widgets/types.js";
import { TOKEN_METRICS } from "./fixtures.js";

function outputSpeed(options: WidgetOptions = {}) {
  return registry.createWidget("output-speed", options);
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

describe("OutputSpeedWidget", () => {
  it("owns metadata and default options", () => {
    const widget = outputSpeed();
    expect(widget).toBeInstanceOf(WidgetInstance);
    expect(registry.spec(widget.type)).toBe(OutputSpeedWidget);
    expect(OutputSpeedWidget.dependencies).toEqual(["metrics"]);
    expect(OutputSpeedWidget.icons).toEqual({ emoji: "⏬", nerd: "", text: "out/min" });
    expect(OutputSpeedWidget.defaultStyle).toEqual({
      fg: "brightCyan",
      bg: "default",
      bold: false,
    });
    expect(OutputSpeedWidget.baseOptionDefaults).toEqual({});
    expect(registry.createEntry("output-speed").options).toEqual({
      raw: false,
      hideWhenZero: false,
      icon: "",
      tokenFormatStyle: "default",
      fg: "brightCyan",
      bg: "default",
      bold: false,
    });
  });

  it("renders labels, custom icons, raw values, and compact format", () => {
    expect(outputSpeed().render(ctx())).toBe("out/min 3.4k/min");
    expect(outputSpeed({ icon: "Out: " }).render(ctx())).toBe("Out: 3.4k/min");
    expect(outputSpeed({ raw: true }).render(ctx())).toBe("3.4k/min");
    expect(
      outputSpeed({ raw: true, tokenFormatStyle: "compact" }).render(
        ctx({ metrics: { ...TOKEN_METRICS, outputTokens: 12_345, lastTimestampMs: 60_000 } }),
      ),
    ).toBe("12k/min");
  });

  it("renders zero speed when timestamps are missing, reversed, or invalid", () => {
    expect(
      outputSpeed().render(
        ctx({
          metrics: { ...TOKEN_METRICS, firstTimestampMs: undefined, lastTimestampMs: 120_000 },
        }),
      ),
    ).toContain("0/min");
    expect(
      outputSpeed().render(
        ctx({ metrics: { ...TOKEN_METRICS, firstTimestampMs: 120_000, lastTimestampMs: 0 } }),
      ),
    ).toContain("0/min");
    expect(
      outputSpeed().render(
        ctx({
          metrics: { ...TOKEN_METRICS, firstTimestampMs: Number.NaN, lastTimestampMs: 120_000 },
        }),
      ),
    ).toContain("0/min");
    expect(
      outputSpeed({ hideWhenZero: true }).render(
        ctx({
          metrics: { ...TOKEN_METRICS, firstTimestampMs: undefined, lastTimestampMs: undefined },
        }),
      ),
    ).toContain("0/min");
  });

  it("exposes metadata fields and summaries", () => {
    expect(fieldsForWidget(outputSpeed()).map((field) => field.id)).toEqual([
      "enabled",
      "raw",
      "hideWhenZero",
      "icon",
      "tokenFormatStyle",
    ]);
    expect(formatWidgetOptions(outputSpeed())).toBe("");
    expect(formatWidgetOptions(outputSpeed({ tokenFormatStyle: "compact" }))).toBe(
      "format=Compact",
    );
    expect(formatWidgetOptions(outputSpeed({ hideWhenZero: true }))).toBe("hide-zero");
    expect(formatWidgetOptions(outputSpeed({ raw: true, icon: "S " }))).toBe("raw • icon='S '");
    expect(formatWidgetColorOptions(outputSpeed({ fg: "red", bold: true }))).toBe("fg=Red • bold");
  });

  it("normalizes config through metadata", () => {
    expect(
      normalizeConfig({
        lines: [[{ type: "output-speed", options: { tokenFormatStyle: "compact" } }]],
      }).lines[0]?.[0]?.options,
    ).toMatchObject({ tokenFormatStyle: "compact" });
    expect(
      normalizeConfig({
        lines: [
          [
            {
              type: "output-speed",
              options: { tokenFormatStyle: "wide", showProvider: true, hideWhenEmpty: true },
            },
          ],
        ],
      }).lines[0]?.[0]?.options,
    ).toEqual({
      raw: false,
      hideWhenZero: false,
      icon: "",
      fg: "brightCyan",
      bg: "default",
      bold: false,
      tokenFormatStyle: "default",
    });
  });
});
