import { describe, expect, it } from "vitest";

import { normalizeConfig } from "../../../src/config.js";
import type { WidgetOptions } from "../../../src/types.js";
import {
  colorFields,
  fieldsForWidget,
  formatWidgetColorOptions,
  formatWidgetOptions,
} from "../../../src/ui/fields.js";
import { WidgetInstance } from "../../../src/widgets/instance.js";
import { registry } from "../../../src/widgets/registry.js";
import { WidgetStore } from "../../../src/widgets/store.js";
import { ContextWidget } from "../../../src/widgets/tokens/context.js";
import type { WidgetContext } from "../../../src/widgets/types.js";

function contextWidget(options: WidgetOptions = {}) {
  return registry.createWidget("context", options);
}

function ctx(
  overrides: Partial<WidgetContext<["contextTokens", "contextMaxTokens"]>> = {},
): WidgetContext<["contextTokens", "contextMaxTokens"]> {
  return {
    iconMode: "text",
    minimalist: false,
    colorLevel: "none",
    contextTokens: 25_000,
    contextMaxTokens: 100_000,
    ...overrides,
  };
}

describe("ContextWidget", () => {
  it("owns metadata and default options", () => {
    expect(ContextWidget.type).toBe("context");
    expect(ContextWidget.label).toBe("Context %");
    expect(ContextWidget.category).toBe("Tokens");
    expect(ContextWidget.description).toBe("Current context usage percentage");
    expect(ContextWidget.dependencies).toEqual(["contextTokens", "contextMaxTokens"]);
    expect(ContextWidget.icons).toEqual({ emoji: "🧩", nerd: "󰍛", text: "ctx" });
    expect(ContextWidget.defaultStyle).toEqual({ fg: "blue", bg: "default", bold: false });
    const widget = contextWidget();
    expect(widget.options).toEqual({
      raw: false,
      icon: "",
      contextConditionalColors: false,
      contextWarningPercent: 70,
      contextDangerPercent: 90,
      warningFg: "yellow",
      warningBg: "default",
      dangerFg: "red",
      dangerBg: "default",
      fg: "blue",
      bg: "default",
      bold: false,
    });
    expect(widget).toBeInstanceOf(WidgetInstance);
    expect(registry.spec(widget.type)).toBe(ContextWidget);
    const hydrated = WidgetStore.fromConfig(normalizeConfig({ lines: [[{ type: "context" }]] }))
      .lines[0]?.[0];
    expect(hydrated).toBeInstanceOf(WidgetInstance);
    expect(hydrated?.type).toBe(ContextWidget.type);
  });

  it("renders labels, raw values, custom icons, unknown context, and invalid max context", () => {
    expect(contextWidget().render(ctx())).toBe("ctx 25%");
    expect(contextWidget({ raw: true }).render(ctx())).toBe("25%");
    expect(contextWidget({ icon: "C=" }).render(ctx())).toBe("C=25%");
    expect(contextWidget({ raw: true }).render(ctx({ contextTokens: 12_500 }))).toBe("12.5%");
    expect(contextWidget({ raw: true }).render(ctx({ contextTokens: undefined }))).toBe("?");
    expect(contextWidget({ raw: true }).render(ctx({ contextMaxTokens: 0 }))).toBe("25k ctx");
    expect(contextWidget({ raw: true }).render(ctx({ contextMaxTokens: undefined }))).toBe(
      "25k ctx",
    );
  });

  it("uses conditional warning and danger colors over user colors while preserving bold", () => {
    const widget = contextWidget({
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
        ctx({ colorLevel: "ansi16", contextTokens: 50_000, contextMaxTokens: 100_000 }),
      ),
    ).toBe("\x1b[1m\x1b[44m\x1b[32m50%\x1b[39m\x1b[49m\x1b[22m");
    expect(
      widget.render(
        ctx({ colorLevel: "ansi16", contextTokens: 80_000, contextMaxTokens: 100_000 }),
      ),
    ).toBe("\x1b[1m\x1b[45m\x1b[33m80%\x1b[39m\x1b[49m\x1b[22m");
    expect(
      widget.render(
        ctx({ colorLevel: "ansi16", contextTokens: 95_000, contextMaxTokens: 100_000 }),
      ),
    ).toBe("\x1b[1m\x1b[41m\x1b[31m95%\x1b[39m\x1b[49m\x1b[22m");
  });

  it("exposes metadata fields and summaries", () => {
    expect(fieldsForWidget(contextWidget()).map((field) => field.id)).toEqual([
      "enabled",
      "raw",
      "icon",
      "contextConditionalColors",
    ]);
    expect(
      fieldsForWidget(contextWidget({ contextConditionalColors: true })).map((field) => field.id),
    ).toEqual([
      "enabled",
      "raw",
      "icon",
      "contextConditionalColors",
      "contextWarningPercent",
      "contextDangerPercent",
    ]);
    expect(
      colorFields(contextWidget({ contextConditionalColors: true })).map((field) => field.id),
    ).toContain("dangerBgAnsi");
    expect(
      formatWidgetOptions(contextWidget({ raw: true, icon: "C=", contextConditionalColors: true })),
    ).toBe("raw • icon='C=' • with-colors");
    expect(
      formatWidgetColorOptions(
        contextWidget({
          raw: true,
          icon: "C=",
          contextConditionalColors: true,
          fg: "green",
          bg: "blue",
          bold: true,
        }),
      ),
    ).toBe("raw • icon='C=' • with-colors • fg=Green • bg=Blue • bold");
  });

  it("normalizes config through metadata", () => {
    expect(
      normalizeConfig({
        lines: [
          [
            {
              type: "context",
              options: {
                raw: true,
                icon: "C=",
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
      icon: "C=",
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
              type: "context",
              options: {
                raw: "yes",
                icon: 7,
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
    ).toMatchObject({
      raw: false,
      icon: "",
      contextConditionalColors: false,
      contextWarningPercent: 100,
      contextDangerPercent: 0,
      warningFg: "yellow",
      dangerBg: "default",
    });
  });
});
