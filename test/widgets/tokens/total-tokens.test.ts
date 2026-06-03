import { describe, expect, it } from "vitest";

import { normalizeConfig } from "../../../src/config.js";
import type { WidgetOptions } from "../../../src/types.js";
import {
  fieldsForWidget,
  formatWidgetColorOptions,
  formatWidgetOptions,
} from "../../../src/ui/fields.js";
import { TotalTokensWidget } from "../../../src/widgets/tokens/total-tokens.js";
import { WidgetInstance } from "../../../src/widgets/instance.js";
import { registry } from "../../../src/widgets/registry.js";
import type { WidgetContext } from "../../../src/widgets/types.js";
import { TOKEN_METRICS } from "./fixtures.js";

function totalTokens(options: WidgetOptions = {}) {
  return registry.createWidget("total-tokens", options);
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

describe("TotalTokensWidget", () => {
  it("owns metadata and default options", () => {
    const widget = totalTokens();
    expect(widget).toBeInstanceOf(WidgetInstance);
    expect(registry.spec(widget.type)).toBe(TotalTokensWidget);
    expect(TotalTokensWidget.dependencies).toEqual(["metrics"]);
    expect(TotalTokensWidget.icons).toEqual({ emoji: "🔢", nerd: "󰓹", text: "tok" });
    expect(TotalTokensWidget.defaultStyle).toEqual({ fg: "cyan", bg: "default", bold: false });
    expect(TotalTokensWidget.baseOptionDefaults).toEqual({});
    expect(registry.createEntry("total-tokens").options).toEqual({
      raw: false,
      hideWhenZero: false,
      icon: "",
      tokenFormatStyle: "default",
      fg: "cyan",
      bg: "default",
      bold: false,
    });
  });

  it("renders labels, custom icons, raw values, compact format, and zero hiding", () => {
    expect(totalTokens().render(ctx())).toBe("tok 19.1k");
    expect(totalTokens({ icon: "Total: " }).render(ctx())).toBe("Total: 19.1k");
    expect(totalTokens({ raw: true }).render(ctx())).toBe("19.1k");
    expect(totalTokens({ raw: true, tokenFormatStyle: "compact" }).render(ctx())).toBe("19k");
    expect(totalTokens().render(ctx({ metrics: { ...TOKEN_METRICS, totalTokens: 0 } }))).toBe(
      "tok 0",
    );
    expect(
      totalTokens({ hideWhenZero: true }).render(
        ctx({ metrics: { ...TOKEN_METRICS, totalTokens: 0 } }),
      ),
    ).toBeUndefined();
  });

  it("exposes metadata fields and summaries", () => {
    expect(fieldsForWidget(totalTokens()).map((field) => field.id)).toEqual([
      "enabled",
      "raw",
      "hideWhenZero",
      "icon",
      "tokenFormatStyle",
    ]);
    expect(formatWidgetOptions(totalTokens())).toBe("");
    expect(formatWidgetOptions(totalTokens({ tokenFormatStyle: "compact" }))).toContain(
      "format=Compact",
    );
    expect(formatWidgetOptions(totalTokens({ hideWhenZero: true }))).toBe("hide-zero");
    expect(formatWidgetOptions(totalTokens({ raw: true, icon: "T " }))).toBe("raw • icon='T '");
    expect(formatWidgetColorOptions(totalTokens({ fg: "red", bold: true }))).toBe("fg=Red • bold");
  });

  it("normalizes config through metadata", () => {
    expect(
      normalizeConfig({
        lines: [[{ type: "total-tokens", options: { tokenFormatStyle: "compact" } }]],
      }).lines[0]?.[0]?.options,
    ).toMatchObject({
      tokenFormatStyle: "compact",
    });
    expect(
      normalizeConfig({
        lines: [
          [
            {
              type: "total-tokens",
              options: { tokenFormatStyle: "wide", showProvider: true, hideWhenEmpty: true },
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
      tokenFormatStyle: "default",
    });
  });
});
