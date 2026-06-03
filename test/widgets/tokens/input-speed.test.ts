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
import { InputSpeedWidget } from "../../../src/widgets/tokens/input-speed.js";
import type { WidgetContext } from "../../../src/widgets/types.js";
import { TOKEN_METRICS } from "./fixtures.js";

function inputSpeed(options: WidgetOptions = {}) {
  return registry.createWidget("input-speed", options);
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

describe("InputSpeedWidget", () => {
  it("owns metadata and default options", () => {
    const widget = inputSpeed();
    expect(widget).toBeInstanceOf(WidgetInstance);
    expect(registry.spec(widget.type)).toBe(InputSpeedWidget);
    expect(InputSpeedWidget.dependencies).toEqual(["metrics"]);
    expect(InputSpeedWidget.icons).toEqual({ emoji: "⏫", nerd: "", text: "in/min" });
    expect(InputSpeedWidget.defaultStyle).toEqual({
      fg: "brightMagenta",
      bg: "default",
      bold: false,
    });
    expect(InputSpeedWidget.baseOptionDefaults).toEqual({});
    expect(registry.createEntry("input-speed").options).toEqual({
      raw: false,
      hideWhenZero: false,
      icon: "",
      tokenFormatStyle: "default",
      fg: "brightMagenta",
      bg: "default",
      bold: false,
    });
  });

  it("renders labels, custom icons, raw values, and compact format", () => {
    expect(inputSpeed().render(ctx())).toBe("in/min 6.2k/min");
    expect(inputSpeed({ icon: "In: " }).render(ctx())).toBe("In: 6.2k/min");
    expect(inputSpeed({ raw: true }).render(ctx())).toBe("6.2k/min");
    expect(
      inputSpeed({ raw: true, tokenFormatStyle: "compact" }).render(
        ctx({ metrics: { ...TOKEN_METRICS, lastTimestampMs: 60_000 } }),
      ),
    ).toBe("12k/min");
  });

  it("renders zero speed when timestamps are missing, reversed, or invalid", () => {
    expect(
      inputSpeed().render(
        ctx({
          metrics: { ...TOKEN_METRICS, firstTimestampMs: undefined, lastTimestampMs: 120_000 },
        }),
      ),
    ).toContain("0/min");
    expect(
      inputSpeed().render(
        ctx({ metrics: { ...TOKEN_METRICS, firstTimestampMs: 120_000, lastTimestampMs: 0 } }),
      ),
    ).toContain("0/min");
    expect(
      inputSpeed().render(
        ctx({
          metrics: { ...TOKEN_METRICS, firstTimestampMs: Number.NaN, lastTimestampMs: 120_000 },
        }),
      ),
    ).toContain("0/min");
    expect(
      inputSpeed({ hideWhenZero: true }).render(
        ctx({
          metrics: { ...TOKEN_METRICS, firstTimestampMs: undefined, lastTimestampMs: undefined },
        }),
      ),
    ).toContain("0/min");
  });

  it("exposes metadata fields and summaries", () => {
    expect(fieldsForWidget(inputSpeed()).map((field) => field.id)).toEqual([
      "enabled",
      "raw",
      "hideWhenZero",
      "icon",
      "tokenFormatStyle",
    ]);
    expect(formatWidgetOptions(inputSpeed())).toBe("");
    expect(formatWidgetOptions(inputSpeed({ tokenFormatStyle: "compact" }))).toBe("format=Compact");
    expect(formatWidgetOptions(inputSpeed({ hideWhenZero: true }))).toBe("hide-zero");
    expect(formatWidgetOptions(inputSpeed({ raw: true, icon: "S " }))).toBe("raw • icon='S '");
    expect(formatWidgetColorOptions(inputSpeed({ fg: "red", bold: true }))).toBe("fg=Red • bold");
  });

  it("normalizes config through metadata", () => {
    expect(
      normalizeConfig({
        lines: [[{ type: "input-speed", options: { tokenFormatStyle: "compact" } }]],
      }).lines[0]?.[0]?.options,
    ).toMatchObject({ tokenFormatStyle: "compact" });
    expect(
      normalizeConfig({
        lines: [
          [
            {
              type: "input-speed",
              options: { tokenFormatStyle: "wide", showProvider: true, hideWhenEmpty: true },
            },
          ],
        ],
      }).lines[0]?.[0]?.options,
    ).toEqual({
      raw: false,
      hideWhenZero: false,
      icon: "",
      fg: "brightMagenta",
      bg: "default",
      bold: false,
      tokenFormatStyle: "default",
    });
  });
});
