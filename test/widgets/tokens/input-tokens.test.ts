import { describe, expect, it } from "vitest";

import { normalizeConfig } from "../../../src/config.js";
import type { WidgetOptions } from "../../../src/types.js";
import {
  fieldsForWidget,
  formatWidgetColorOptions,
  formatWidgetOptions,
} from "../../../src/ui/fields.js";
import { InputTokensWidget } from "../../../src/widgets/tokens/input-tokens.js";
import { WidgetInstance } from "../../../src/widgets/instance.js";
import { registry } from "../../../src/widgets/registry.js";
import type { WidgetContext } from "../../../src/widgets/types.js";
import { TOKEN_METRICS } from "./fixtures.js";

function inputTokens(options: WidgetOptions = {}) {
  return registry.createWidget("input-tokens", options);
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

describe("InputTokensWidget", () => {
  it("owns metadata and default options", () => {
    const widget = inputTokens();
    expect(widget).toBeInstanceOf(WidgetInstance);
    expect(registry.spec(widget.type)).toBe(InputTokensWidget);
    expect(InputTokensWidget.dependencies).toEqual(["metrics"]);
    expect(InputTokensWidget.icons).toEqual({ emoji: "⬆️", nerd: "󰌌", text: "in" });
    expect(InputTokensWidget.defaultStyle).toEqual({ fg: "blue", bg: "default", bold: false });
    expect(InputTokensWidget.baseOptionDefaults).toEqual({});
    expect(registry.createEntry("input-tokens").options).toEqual({
      raw: false,
      hideWhenZero: false,
      icon: "",
      tokenFormatStyle: "default",
      fg: "blue",
      bg: "default",
      bold: false,
    });
  });

  it("renders labels, custom icons, raw values, compact format, and zero hiding", () => {
    expect(inputTokens().render(ctx())).toBe("in 12.3k");
    expect(inputTokens({ icon: "In: " }).render(ctx())).toBe("In: 12.3k");
    expect(inputTokens({ raw: true }).render(ctx())).toBe("12.3k");
    expect(inputTokens({ raw: true, tokenFormatStyle: "compact" }).render(ctx())).toBe("12k");
    expect(inputTokens().render(ctx({ metrics: { ...TOKEN_METRICS, inputTokens: 0 } }))).toBe(
      "in 0",
    );
    expect(
      inputTokens({ hideWhenZero: true }).render(
        ctx({ metrics: { ...TOKEN_METRICS, inputTokens: 0 } }),
      ),
    ).toBeUndefined();
  });

  it("exposes metadata fields and summaries", () => {
    expect(fieldsForWidget(inputTokens()).map((field) => field.id)).toEqual([
      "enabled",
      "raw",
      "hideWhenZero",
      "icon",
      "tokenFormatStyle",
    ]);
    expect(formatWidgetOptions(inputTokens())).toBe("");
    expect(formatWidgetOptions(inputTokens({ tokenFormatStyle: "compact" }))).toContain(
      "format=Compact",
    );
    expect(formatWidgetOptions(inputTokens({ hideWhenZero: true }))).toBe("hide-zero");
    expect(formatWidgetOptions(inputTokens({ raw: true, icon: "I " }))).toBe("raw • icon='I '");
    expect(formatWidgetColorOptions(inputTokens({ fg: "red", bold: true }))).toBe("fg=Red • bold");
  });

  it("normalizes config through metadata", () => {
    expect(
      normalizeConfig({
        lines: [[{ type: "input-tokens", options: { tokenFormatStyle: "compact" } }]],
      }).lines[0]?.[0]?.options,
    ).toMatchObject({
      tokenFormatStyle: "compact",
    });
    expect(
      normalizeConfig({
        lines: [
          [
            {
              type: "input-tokens",
              options: { tokenFormatStyle: "wide", showProvider: true, hideWhenEmpty: true },
            },
          ],
        ],
      }).lines[0]?.[0]?.options,
    ).toEqual({
      raw: false,
      hideWhenZero: false,
      icon: "",
      fg: "blue",
      bg: "default",
      bold: false,
      tokenFormatStyle: "default",
    });
  });
});
