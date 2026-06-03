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
import { CacheReadWidget } from "../../../src/widgets/tokens/cache-read.js";
import type { WidgetContext } from "../../../src/widgets/types.js";
import { TOKEN_METRICS } from "./fixtures.js";

function cacheRead(options: WidgetOptions = {}) {
  return registry.createWidget("cache-read", options);
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

describe("CacheReadWidget", () => {
  it("owns metadata and default options", () => {
    const widget = cacheRead();
    expect(widget).toBeInstanceOf(WidgetInstance);
    expect(registry.spec(widget.type)).toBe(CacheReadWidget);
    expect(CacheReadWidget.dependencies).toEqual(["metrics"]);
    expect(CacheReadWidget.icons).toEqual({ emoji: "📖", nerd: "󰆼", text: "cache read" });
    expect(CacheReadWidget.defaultStyle).toEqual({ fg: "cyan", bg: "default", bold: false });
    expect(CacheReadWidget.baseOptionDefaults).toEqual({});
    expect(registry.createEntry("cache-read").options).toEqual({
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
    expect(cacheRead().render(ctx())).toBe("cache read 12.3k");
    expect(cacheRead({ icon: "R: " }).render(ctx())).toBe("R: 12.3k");
    expect(cacheRead({ raw: true }).render(ctx())).toBe("12.3k");
    expect(
      cacheRead({ raw: true, tokenFormatStyle: "compact" }).render(
        ctx({ metrics: { ...TOKEN_METRICS, cacheReadTokens: 12_345 } }),
      ),
    ).toBe("12k");
    expect(cacheRead().render(ctx({ metrics: { ...TOKEN_METRICS, cacheReadTokens: 0 } }))).toBe(
      "cache read 0",
    );
    expect(
      cacheRead({ hideWhenZero: true }).render(
        ctx({ metrics: { ...TOKEN_METRICS, cacheReadTokens: 0 } }),
      ),
    ).toBeUndefined();
  });

  it("exposes metadata fields and summaries", () => {
    expect(fieldsForWidget(cacheRead()).map((field) => field.id)).toEqual([
      "enabled",
      "raw",
      "hideWhenZero",
      "icon",
      "tokenFormatStyle",
    ]);
    expect(formatWidgetOptions(cacheRead())).toBe("");
    expect(formatWidgetOptions(cacheRead({ tokenFormatStyle: "compact" }))).toBe("format=Compact");
    expect(formatWidgetOptions(cacheRead({ hideWhenZero: true }))).toBe("hide-zero");
    expect(formatWidgetOptions(cacheRead({ raw: true, icon: "C " }))).toBe("raw • icon='C '");
    expect(formatWidgetColorOptions(cacheRead({ fg: "red", bold: true }))).toBe("fg=Red • bold");
  });

  it("normalizes config through metadata", () => {
    expect(
      normalizeConfig({
        lines: [[{ type: "cache-read", options: { tokenFormatStyle: "compact" } }]],
      }).lines[0]?.[0]?.options,
    ).toMatchObject({
      tokenFormatStyle: "compact",
    });
    expect(
      normalizeConfig({
        lines: [
          [
            {
              type: "cache-read",
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
