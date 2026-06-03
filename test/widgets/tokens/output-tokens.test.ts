import { describe, expect, it } from "vitest";

import { normalizeConfig } from "../../../src/config.js";
import type { WidgetOptions } from "../../../src/types.js";
import {
  fieldsForWidget,
  formatWidgetColorOptions,
  formatWidgetOptions,
} from "../../../src/ui/fields.js";
import { OutputTokensWidget } from "../../../src/widgets/tokens/output-tokens.js";
import { WidgetInstance } from "../../../src/widgets/instance.js";
import { registry } from "../../../src/widgets/registry.js";
import type { WidgetContext } from "../../../src/widgets/types.js";
import { TOKEN_METRICS } from "./fixtures.js";

function outputTokens(options: WidgetOptions = {}) {
  return registry.createWidget("output-tokens", options);
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

describe("OutputTokensWidget", () => {
  it("owns metadata and default options", () => {
    const widget = outputTokens();
    expect(widget).toBeInstanceOf(WidgetInstance);
    expect(registry.spec(widget.type)).toBe(OutputTokensWidget);
    expect(OutputTokensWidget.dependencies).toEqual(["metrics"]);
    expect(OutputTokensWidget.icons).toEqual({ emoji: "⬇️", nerd: "󰧚", text: "out" });
    expect(OutputTokensWidget.defaultStyle).toEqual({ fg: "white", bg: "default", bold: false });
    expect(OutputTokensWidget.baseOptionDefaults).toEqual({});
    expect(registry.createEntry("output-tokens").options).toEqual({
      raw: false,
      hideWhenZero: false,
      icon: "",
      tokenFormatStyle: "default",
      fg: "white",
      bg: "default",
      bold: false,
    });
  });

  it("renders labels, custom icons, raw values, compact format, and zero hiding", () => {
    expect(outputTokens().render(ctx())).toBe("out 6.8k");
    expect(outputTokens({ icon: "Out: " }).render(ctx())).toBe("Out: 6.8k");
    expect(outputTokens({ raw: true }).render(ctx())).toBe("6.8k");
    expect(
      outputTokens({ raw: true, tokenFormatStyle: "compact" }).render(
        ctx({ metrics: { ...TOKEN_METRICS, outputTokens: 12_345 } }),
      ),
    ).toBe("12k");
    expect(outputTokens().render(ctx({ metrics: { ...TOKEN_METRICS, outputTokens: 0 } }))).toBe(
      "out 0",
    );
    expect(
      outputTokens({ hideWhenZero: true }).render(
        ctx({ metrics: { ...TOKEN_METRICS, outputTokens: 0 } }),
      ),
    ).toBeUndefined();
  });

  it("exposes metadata fields and summaries", () => {
    expect(fieldsForWidget(outputTokens()).map((field) => field.id)).toEqual([
      "enabled",
      "raw",
      "hideWhenZero",
      "icon",
      "tokenFormatStyle",
    ]);
    expect(formatWidgetOptions(outputTokens())).toBe("");
    expect(formatWidgetOptions(outputTokens({ tokenFormatStyle: "compact" }))).toContain(
      "format=Compact",
    );
    expect(formatWidgetOptions(outputTokens({ hideWhenZero: true }))).toBe("hide-zero");
    expect(formatWidgetOptions(outputTokens({ raw: true, icon: "O " }))).toBe("raw • icon='O '");
    expect(formatWidgetColorOptions(outputTokens({ fg: "red", bold: true }))).toBe("fg=Red • bold");
  });

  it("normalizes config through metadata", () => {
    expect(
      normalizeConfig({
        lines: [[{ type: "output-tokens", options: { tokenFormatStyle: "compact" } }]],
      }).lines[0]?.[0]?.options,
    ).toMatchObject({
      tokenFormatStyle: "compact",
    });
    expect(
      normalizeConfig({
        lines: [
          [
            {
              type: "output-tokens",
              options: { tokenFormatStyle: "wide", showProvider: true, hideWhenEmpty: true },
            },
          ],
        ],
      }).lines[0]?.[0]?.options,
    ).toEqual({
      raw: false,
      hideWhenZero: false,
      icon: "",
      fg: "white",
      bg: "default",
      bold: false,
      tokenFormatStyle: "default",
    });
  });
});
