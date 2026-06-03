import { describe, expect, it } from "vitest";

import { normalizeConfig } from "../../../src/config.js";
import type { WidgetOptions } from "../../../src/types.js";
import { colorFields, fieldsForWidget, formatWidgetOptions } from "../../../src/ui/fields.js";
import { WidgetInstance } from "../../../src/widgets/instance.js";
import { registry } from "../../../src/widgets/registry.js";
import { ContextLengthWidget } from "../../../src/widgets/tokens/context-length.js";
import type { WidgetContext } from "../../../src/widgets/types.js";

function contextLength(options: WidgetOptions = {}) {
  return registry.createWidget("context-length", options);
}

function ctx(
  overrides: Partial<WidgetContext<["contextTokens", "contextMaxTokens"]>> = {},
): WidgetContext<["contextTokens", "contextMaxTokens"]> {
  return {
    iconMode: "text",
    minimalist: false,
    colorLevel: "none",
    contextTokens: 50_000,
    contextMaxTokens: 200_000,
    ...overrides,
  };
}

describe("ContextLengthWidget", () => {
  it("owns metadata and default options", () => {
    const widget = contextLength();
    expect(widget).toBeInstanceOf(WidgetInstance);
    expect(registry.spec(widget.type)).toBe(ContextLengthWidget);
    expect(ContextLengthWidget.dependencies).toEqual(["contextTokens", "contextMaxTokens"]);
    expect(ContextLengthWidget.icons).toEqual({ emoji: "📏", nerd: "󰍛", text: "ctx len" });
    expect(ContextLengthWidget.defaultStyle).toEqual({
      fg: "brightBlack",
      bg: "default",
      bold: false,
    });
    expect(widget.options).toEqual({
      raw: false,
      hideWhenZero: false,
      icon: "",
      contextConditionalColors: false,
      contextWarningPercent: 70,
      contextDangerPercent: 90,
      tokenFormatStyle: "default",
      warningFg: "yellow",
      warningBg: "default",
      dangerFg: "red",
      dangerBg: "default",
      fg: "brightBlack",
      bg: "default",
      bold: false,
    });
  });

  it("renders labels, compact token format, unknown context, and zero hiding", () => {
    expect(contextLength().render(ctx())).toBe("ctx len 50k");
    expect(
      contextLength({ raw: true, tokenFormatStyle: "compact" }).render(
        ctx({ contextTokens: 123_456 }),
      ),
    ).toBe("123k");
    expect(contextLength({ raw: true }).render(ctx({ contextTokens: undefined }))).toBe("?");
    expect(contextLength({ hideWhenZero: true }).render(ctx({ contextTokens: 0 }))).toBeUndefined();
  });

  it("uses conditional warning and danger colors when enabled", () => {
    expect(
      contextLength({ raw: true, contextConditionalColors: true }).render(
        ctx({ colorLevel: "ansi16", contextTokens: 80_000, contextMaxTokens: 100_000 }),
      ),
    ).toBe("\x1b[33m80k\x1b[39m");
    expect(
      contextLength({ raw: true, contextConditionalColors: true }).render(
        ctx({ colorLevel: "ansi16", contextTokens: 95_000, contextMaxTokens: 100_000 }),
      ),
    ).toBe("\x1b[31m95k\x1b[39m");
  });

  it("uses widget colors below thresholds and keeps bold with threshold colors", () => {
    const widget = contextLength({
      raw: true,
      fg: "cyan",
      bg: "blue",
      bold: true,
      contextConditionalColors: true,
      warningBg: "magenta",
      dangerBg: "red",
    });

    expect(
      widget.render(
        ctx({ colorLevel: "ansi16", contextTokens: 50_000, contextMaxTokens: 100_000 }),
      ),
    ).toBe("\x1b[1m\x1b[44m\x1b[36m50k\x1b[39m\x1b[49m\x1b[22m");
    expect(
      widget.render(
        ctx({ colorLevel: "ansi16", contextTokens: 80_000, contextMaxTokens: 100_000 }),
      ),
    ).toBe("\x1b[1m\x1b[45m\x1b[33m80k\x1b[39m\x1b[49m\x1b[22m");
    expect(
      widget.render(
        ctx({ colorLevel: "ansi16", contextTokens: 95_000, contextMaxTokens: 100_000 }),
      ),
    ).toBe("\x1b[1m\x1b[41m\x1b[31m95k\x1b[39m\x1b[49m\x1b[22m");
  });

  it("exposes metadata fields and summaries", () => {
    expect(fieldsForWidget(contextLength()).map((field) => field.id)).toEqual([
      "enabled",
      "raw",
      "hideWhenZero",
      "icon",
      "tokenFormatStyle",
      "contextConditionalColors",
    ]);
    expect(
      fieldsForWidget(contextLength({ contextConditionalColors: true })).map((field) => field.id),
    ).toContain("contextWarningPercent");
    expect(
      colorFields(contextLength({ contextConditionalColors: true })).map((field) => field.id),
    ).toContain("dangerBgAnsi");
    expect(formatWidgetOptions(contextLength({ tokenFormatStyle: "compact" }))).toContain(
      "format=Compact",
    );
    expect(formatWidgetOptions(contextLength({ hideWhenZero: true }))).toBe("hide-zero");
    expect(formatWidgetOptions(contextLength({ contextConditionalColors: true }))).toContain(
      "with-colors",
    );
  });

  it("normalizes config through metadata", () => {
    expect(
      normalizeConfig({
        lines: [
          [
            {
              type: "context-length",
              options: {
                tokenFormatStyle: "compact",
                contextConditionalColors: true,
                contextWarningPercent: 60,
                contextDangerPercent: 80,
                warningFg: "pi:warning",
                dangerBg: "red",
              },
            },
          ],
        ],
      }).lines[0]?.[0]?.options,
    ).toMatchObject({
      tokenFormatStyle: "compact",
      contextConditionalColors: true,
      contextWarningPercent: 60,
      contextDangerPercent: 80,
      warningFg: "pi:warning",
      dangerBg: "red",
    });
    expect(
      normalizeConfig({
        lines: [
          [
            {
              type: "context-length",
              options: {
                tokenFormatStyle: "verbose",
                contextWarningPercent: 200,
                warningFg: "not-a-color",
              },
            },
          ],
        ],
      }).lines[0]?.[0]?.options,
    ).toMatchObject({
      tokenFormatStyle: "default",
      contextWarningPercent: 100,
      warningFg: "yellow",
    });
  });
});
