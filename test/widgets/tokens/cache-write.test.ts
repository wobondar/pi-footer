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
import { CacheWriteWidget } from "../../../src/widgets/tokens/cache-write.js";
import type { WidgetContext } from "../../../src/widgets/types.js";
import { TOKEN_METRICS } from "./fixtures.js";

function cacheWrite(options: WidgetOptions = {}) {
  return registry.createWidget("cache-write", options);
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

describe("CacheWriteWidget", () => {
  it("owns metadata and default options", () => {
    const widget = cacheWrite();
    expect(widget).toBeInstanceOf(WidgetInstance);
    expect(registry.spec(widget.type)).toBe(CacheWriteWidget);
    expect(CacheWriteWidget.dependencies).toEqual(["metrics"]);
    expect(CacheWriteWidget.icons).toEqual({ emoji: "✍️", nerd: "󰆼", text: "cache write" });
    expect(CacheWriteWidget.defaultStyle).toEqual({ fg: "cyan", bg: "default", bold: false });
    expect(CacheWriteWidget.baseOptionDefaults).toEqual({});
    expect(registry.createEntry("cache-write").options).toEqual({
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
    expect(cacheWrite().render(ctx())).toBe("cache write 6.8k");
    expect(cacheWrite({ icon: "W: " }).render(ctx())).toBe("W: 6.8k");
    expect(cacheWrite({ raw: true }).render(ctx())).toBe("6.8k");
    expect(
      cacheWrite({ raw: true, tokenFormatStyle: "compact" }).render(
        ctx({ metrics: { ...TOKEN_METRICS, cacheWriteTokens: 12_345 } }),
      ),
    ).toBe("12k");
    expect(cacheWrite().render(ctx({ metrics: { ...TOKEN_METRICS, cacheWriteTokens: 0 } }))).toBe(
      "cache write 0",
    );
    expect(
      cacheWrite({ hideWhenZero: true }).render(
        ctx({ metrics: { ...TOKEN_METRICS, cacheWriteTokens: 0 } }),
      ),
    ).toBeUndefined();
  });

  it("exposes metadata fields and summaries", () => {
    expect(fieldsForWidget(cacheWrite()).map((field) => field.id)).toEqual([
      "enabled",
      "raw",
      "hideWhenZero",
      "icon",
      "tokenFormatStyle",
    ]);
    expect(formatWidgetOptions(cacheWrite())).toBe("");
    expect(formatWidgetOptions(cacheWrite({ tokenFormatStyle: "compact" }))).toBe("format=Compact");
    expect(formatWidgetOptions(cacheWrite({ hideWhenZero: true }))).toBe("hide-zero");
    expect(formatWidgetOptions(cacheWrite({ raw: true, icon: "C " }))).toBe("raw • icon='C '");
    expect(formatWidgetColorOptions(cacheWrite({ fg: "red", bold: true }))).toBe("fg=Red • bold");
  });

  it("normalizes config through metadata", () => {
    expect(
      normalizeConfig({
        lines: [[{ type: "cache-write", options: { tokenFormatStyle: "compact" } }]],
      }).lines[0]?.[0]?.options,
    ).toMatchObject({
      tokenFormatStyle: "compact",
    });
    expect(
      normalizeConfig({
        lines: [
          [
            {
              type: "cache-write",
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
