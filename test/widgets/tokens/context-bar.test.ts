import { describe, expect, it } from "vitest";

import { normalizeConfig } from "../../../src/config.js";
import { colorFields, fieldsForWidget, formatWidgetOptions } from "../../../src/ui/fields.js";
import type { WidgetOptions } from "../../../src/types.js";
import { WidgetInstance } from "../../../src/widgets/instance.js";
import { registry } from "../../../src/widgets/registry.js";
import { ContextBarWidget } from "../../../src/widgets/tokens/context-bar.js";
import type { WidgetContext } from "../../../src/widgets/types.js";

function contextBar(options: WidgetOptions = {}) {
  return registry.createWidget("context-bar", options);
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

describe("ContextBarWidget", () => {
  it("owns metadata and default options", () => {
    const widget = contextBar();
    expect(widget).toBeInstanceOf(WidgetInstance);
    expect(registry.spec(widget.type)).toBe(ContextBarWidget);
    expect(ContextBarWidget.dependencies).toEqual(["contextTokens", "contextMaxTokens"]);
    expect(ContextBarWidget.icons).toEqual({ emoji: "📊", nerd: "󰍛", text: "Context:" });
    expect(ContextBarWidget.defaultStyle).toEqual({ fg: "blue", bg: "default", bold: false });
    expect(widget.options).toEqual({
      raw: false,
      hideWhenEmpty: false,
      icon: "",
      text: "",
      contextConditionalColors: false,
      contextWarningPercent: 70,
      contextDangerPercent: 90,
      tokenFormatStyle: "default",
      contextBarMode: "default",
      warningFg: "yellow",
      warningBg: "default",
      dangerFg: "red",
      dangerBg: "default",
      fg: "blue",
      bg: "default",
      bold: false,
    });
  });

  it("renders display modes", () => {
    expect(contextBar({ raw: true }).render(ctx())).toBe(
      "[████████░░░░░░░░░░░░░░░░░░░░░░░░] 50k/200k (25%)",
    );
    expect(contextBar({ raw: true, contextBarMode: "short" }).render(ctx())).toBe(
      "▓▓▓░░░░░░░ 50k/200k (25%)",
    );
    expect(contextBar({ raw: true, contextBarMode: "short-only" }).render(ctx())).toBe(
      "▓▓▓░░░░░░░",
    );
    expect(contextBar({ raw: true, contextBarMode: "medium" }).render(ctx())).toBe(
      "[████░░░░░░░░░░░░] 50k/200k (25%)",
    );
  });

  it("renders labels, compact token format, and unknown context", () => {
    expect(contextBar().render(ctx())).toBe(
      "Context: [████████░░░░░░░░░░░░░░░░░░░░░░░░] 50k/200k (25%)",
    );
    expect(
      contextBar({ raw: true, tokenFormatStyle: "compact" }).render(
        ctx({ contextTokens: 123_456, contextMaxTokens: 2_000_000 }),
      ),
    ).toContain("123k/2.0M");
    expect(contextBar({ raw: true }).render(ctx({ contextTokens: undefined }))).toBe("?");
    expect(contextBar({ raw: true }).render(ctx({ contextMaxTokens: 0 }))).toBe("?");
  });

  it("uses conditional warning and danger colors when enabled", () => {
    expect(
      contextBar({ raw: true, contextConditionalColors: true }).render(
        ctx({ colorLevel: "ansi16", contextTokens: 80_000, contextMaxTokens: 100_000 }),
      ),
    ).toBe("\x1b[33m[██████████████████████████░░░░░░] 80k/100k (80%)\x1b[39m");
    expect(
      contextBar({ raw: true, contextConditionalColors: true }).render(
        ctx({ colorLevel: "ansi16", contextTokens: 95_000, contextMaxTokens: 100_000 }),
      ),
    ).toBe("\x1b[31m[██████████████████████████████░░] 95k/100k (95%)\x1b[39m");
  });

  it("uses widget colors below thresholds and keeps bold with threshold colors", () => {
    const widget = contextBar({
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
    ).toBe(
      "\x1b[1m\x1b[44m\x1b[36m[████████████████░░░░░░░░░░░░░░░░] 50k/100k (50%)\x1b[39m\x1b[49m\x1b[22m",
    );
    expect(
      widget.render(
        ctx({ colorLevel: "ansi16", contextTokens: 80_000, contextMaxTokens: 100_000 }),
      ),
    ).toBe(
      "\x1b[1m\x1b[45m\x1b[33m[██████████████████████████░░░░░░] 80k/100k (80%)\x1b[39m\x1b[49m\x1b[22m",
    );
    expect(
      widget.render(
        ctx({ colorLevel: "ansi16", contextTokens: 95_000, contextMaxTokens: 100_000 }),
      ),
    ).toBe(
      "\x1b[1m\x1b[41m\x1b[31m[██████████████████████████████░░] 95k/100k (95%)\x1b[39m\x1b[49m\x1b[22m",
    );
  });

  it("exposes metadata fields and summaries", () => {
    expect(fieldsForWidget(contextBar()).map((field) => field.id)).toEqual([
      "enabled",
      "raw",
      "hideWhenEmpty",
      "icon",
      "text",
      "tokenFormatStyle",
      "contextBarMode",
      "contextConditionalColors",
    ]);
    expect(
      fieldsForWidget(contextBar({ contextConditionalColors: true })).map((field) => field.id),
    ).toContain("contextWarningPercent");
    expect(
      colorFields(contextBar({ contextConditionalColors: true })).map((field) => field.id),
    ).toContain("dangerBgAnsi");
    expect(formatWidgetOptions(contextBar({ contextBarMode: "short" }))).toContain(
      "display=Short bar",
    );
    expect(formatWidgetOptions(contextBar({ tokenFormatStyle: "compact" }))).toContain(
      "format=Compact",
    );
    expect(formatWidgetOptions(contextBar({ contextConditionalColors: true }))).toContain(
      "with-colors",
    );
  });

  it("normalizes config through metadata", () => {
    expect(
      normalizeConfig({
        lines: [
          [
            {
              type: "context-bar",
              options: {
                contextBarMode: "medium",
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
      contextBarMode: "medium",
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
              type: "context-bar",
              options: {
                contextBarMode: "wide",
                tokenFormatStyle: "verbose",
                contextWarningPercent: 200,
                warningFg: "not-a-color",
              },
            },
          ],
        ],
      }).lines[0]?.[0]?.options,
    ).toMatchObject({
      contextBarMode: "default",
      tokenFormatStyle: "default",
      contextWarningPercent: 100,
      warningFg: "yellow",
    });
  });
});
