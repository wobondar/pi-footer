import { describe, expect, it } from "vitest";

import { normalizeConfig } from "../../../src/config.js";
import { renderStatuslines } from "../../../src/render.js";
import { makeStatuslineData } from "../../helpers/render.js";
import type { WidgetOptions } from "../../../src/types.js";
import {
  colorFields,
  fieldsForWidget,
  formatWidgetColorOptions,
  formatWidgetOptions,
} from "../../../src/ui/fields.js";
import { ContextWindowWidget } from "../../../src/widgets/core/context-window.js";
import { WidgetInstance } from "../../../src/widgets/instance.js";
import { registry } from "../../../src/widgets/registry.js";
import { WidgetStore } from "../../../src/widgets/store.js";
import type { WidgetContext } from "../../../src/widgets/types.js";

function contextWindow(options: WidgetOptions = {}) {
  return registry.createWidget("context-window", options);
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

const statuslineData = makeStatuslineData({
  contextTokens: 1_000_000,
  contextMaxTokens: 2_000_000,
});

describe("ContextWindowWidget", () => {
  it("owns metadata and default options", () => {
    expect(ContextWindowWidget.type).toBe("context-window");
    expect(ContextWindowWidget.label).toBe("Context Window");
    expect(ContextWindowWidget.category).toBe("Core");
    expect(ContextWindowWidget.description).toBe("Model context window size");
    expect(ContextWindowWidget.dependencies).toEqual(["contextTokens", "contextMaxTokens"]);
    expect(ContextWindowWidget.baseOptionDefaults).toEqual({});
    expect(ContextWindowWidget.icons).toEqual({ emoji: "🪟", nerd: "󰍛", text: "window" });
    expect(ContextWindowWidget.defaultStyle).toEqual({
      fg: "brightBlack",
      bg: "default",
      bold: false,
    });
    expect(registry.createEntry("context-window").options).toEqual({
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
    const widget = contextWindow();
    expect(widget).toBeInstanceOf(WidgetInstance);
    expect(registry.spec(widget.type)).toBe(ContextWindowWidget);
  });

  it("exposes metadata fields and option summaries", () => {
    expect(fieldsForWidget(contextWindow()).map((field) => field.id)).toEqual([
      "enabled",
      "raw",
      "hideWhenZero",
      "icon",
      "tokenFormatStyle",
      "contextConditionalColors",
    ]);
    expect(
      fieldsForWidget(contextWindow({ contextConditionalColors: true })).map((field) => field.id),
    ).toContain("contextWarningPercent");
    expect(
      colorFields(contextWindow({ contextConditionalColors: true })).map((field) => field.id),
    ).toContain("dangerBgAnsi");
    expect(formatWidgetOptions(contextWindow({ raw: true }))).toBe("raw");
    expect(formatWidgetOptions(contextWindow({ hideWhenZero: true }))).toBe("hide-zero");
    expect(formatWidgetOptions(contextWindow({ icon: "W=" }))).toBe("icon='W='");
    expect(formatWidgetOptions(contextWindow({ tokenFormatStyle: "compact" }))).toContain(
      "format=Compact",
    );
    expect(formatWidgetOptions(contextWindow({ contextConditionalColors: true }))).toContain(
      "with-colors",
    );
    expect(
      formatWidgetColorOptions(
        contextWindow({
          raw: true,
          icon: "W=",
          contextConditionalColors: true,
          fg: "green",
          bg: "blue",
          bold: true,
        }),
      ),
    ).toBe("raw • icon='W=' • with-colors • fg=Green • bg=Blue • bold");
  });

  it("renders labels, raw output, custom icons, minimalist output, and token formats", () => {
    expect(contextWindow().render(ctx())).toBe("window 200k");
    expect(contextWindow({ raw: true }).render(ctx())).toBe("200k");
    expect(contextWindow({ icon: "W=" }).render(ctx())).toBe("W=200k");
    expect(contextWindow().render(ctx({ minimalist: true }))).toBe("200k");
    expect(contextWindow({ raw: true }).render(ctx({ contextMaxTokens: 2_000_000 }))).toBe("2m");
    expect(
      contextWindow({ raw: true, tokenFormatStyle: "compact" }).render(
        ctx({ contextMaxTokens: 2_000_000 }),
      ),
    ).toBe("2.0M");
  });

  it("preserves legacy question-mark behavior for missing, zero, and invalid context windows", () => {
    expect(contextWindow({ raw: true }).render(ctx({ contextMaxTokens: undefined }))).toBe("?");
    expect(contextWindow({ raw: true }).render(ctx({ contextMaxTokens: 0 }))).toBe("?");
    expect(contextWindow({ raw: true }).render(ctx({ contextMaxTokens: Number.NaN }))).toBe("?");
    expect(
      contextWindow({ raw: true, hideWhenZero: true }).render(ctx({ contextMaxTokens: 0 })),
    ).toBe("?");
  });

  it("uses user colors below thresholds or when usage percent is unavailable", () => {
    const widget = contextWindow({
      raw: true,
      fg: "green",
      bg: "blue",
      contextConditionalColors: true,
    });

    expect(
      widget.render(
        ctx({ colorLevel: "ansi16", contextTokens: 50_000, contextMaxTokens: 100_000 }),
      ),
    ).toBe("\x1b[44m\x1b[32m100k\x1b[39m\x1b[49m");
    expect(
      widget.render(
        ctx({ colorLevel: "ansi16", contextTokens: undefined, contextMaxTokens: 100_000 }),
      ),
    ).toBe("\x1b[44m\x1b[32m100k\x1b[39m\x1b[49m");
  });

  it("uses conditional warning and danger colors over user colors while preserving bold", () => {
    const widget = contextWindow({
      raw: true,
      fg: "green",
      bg: "blue",
      bold: true,
      contextConditionalColors: true,
      warningBg: "magenta",
      dangerBg: "red",
    });

    expect(
      widget.render(
        ctx({ colorLevel: "ansi16", contextTokens: 80_000, contextMaxTokens: 100_000 }),
      ),
    ).toBe("\x1b[1m\x1b[45m\x1b[33m100k\x1b[39m\x1b[49m\x1b[22m");
    expect(
      widget.render(
        ctx({ colorLevel: "ansi16", contextTokens: 95_000, contextMaxTokens: 100_000 }),
      ),
    ).toBe("\x1b[1m\x1b[41m\x1b[31m100k\x1b[39m\x1b[49m\x1b[22m");
  });

  it("normalizes config through metadata and strips unsupported tolerated options", () => {
    expect(
      normalizeConfig({
        lines: [
          [
            {
              type: "context-window",
              options: {
                raw: true,
                hideWhenZero: true,
                icon: "W=",
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
      raw: true,
      hideWhenZero: true,
      icon: "W=",
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
              type: "context-window",
              options: {
                raw: "yes",
                hideWhenZero: "yes",
                hideWhenEmpty: true,
                text: "fallback",
                icon: 7,
                tokenFormatStyle: "verbose",
                contextConditionalColors: "yes",
                contextWarningPercent: 200,
                contextDangerPercent: -5,
                warningFg: "not-a-color",
                dangerBg: "also-bad",
              },
            },
          ],
        ],
      }).lines[0]?.[0]?.options,
    ).toEqual({
      raw: false,
      hideWhenZero: false,
      icon: "",
      fg: "brightBlack",
      bg: "default",
      bold: false,
      contextConditionalColors: false,
      contextWarningPercent: 100,
      contextDangerPercent: 0,
      tokenFormatStyle: "default",
      warningFg: "yellow",
      warningBg: "default",
      dangerFg: "red",
      dangerBg: "default",
    });
  });

  it("receives context dependencies through the production store render path", () => {
    const store = WidgetStore.fromConfig(
      normalizeConfig({
        terminal: { colorLevel: "none" },
        lines: [[{ type: "context-window", options: { raw: true, tokenFormatStyle: "compact" } }]],
      }),
    );

    expect(renderStatuslines(store, statuslineData, 200)).toEqual(["2.0M"]);
  });
});
