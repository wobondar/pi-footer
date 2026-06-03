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
import { ContextRemainingWidget } from "../../../src/widgets/tokens/context-remaining.js";
import type { WidgetContext } from "../../../src/widgets/types.js";

function contextRemaining(options: WidgetOptions = {}) {
  return registry.createWidget("context-remaining", options);
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

describe("ContextRemainingWidget", () => {
  it("owns metadata and default options", () => {
    expect(ContextRemainingWidget.type).toBe("context-remaining");
    expect(ContextRemainingWidget.label).toBe("Context Remaining");
    expect(ContextRemainingWidget.category).toBe("Tokens");
    expect(ContextRemainingWidget.description).toBe("Remaining context percentage");
    expect(ContextRemainingWidget.dependencies).toEqual(["contextTokens", "contextMaxTokens"]);
    expect(ContextRemainingWidget.icons).toEqual({ emoji: "🧩", nerd: "󰍛", text: "ctx left" });
    expect(ContextRemainingWidget.defaultStyle).toEqual({
      fg: "green",
      bg: "default",
      bold: false,
    });
    const widget = contextRemaining();
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
      fg: "green",
      bg: "default",
      bold: false,
    });
    expect(widget).toBeInstanceOf(WidgetInstance);
    expect(registry.spec(widget.type)).toBe(ContextRemainingWidget);
    const hydrated = WidgetStore.fromConfig(
      normalizeConfig({ lines: [[{ type: "context-remaining" }]] }),
    ).lines[0]?.[0];
    expect(hydrated).toBeInstanceOf(WidgetInstance);
    expect(hydrated?.type).toBe(ContextRemainingWidget.type);
  });

  it("renders labels, raw values, custom icons, unknown context, and invalid max context", () => {
    expect(contextRemaining().render(ctx())).toBe("ctx left 75%");
    expect(contextRemaining({ raw: true }).render(ctx())).toBe("75%");
    expect(contextRemaining({ icon: "L=" }).render(ctx())).toBe("L=75%");
    expect(contextRemaining({ raw: true }).render(ctx({ contextTokens: 12_500 }))).toBe("87.5%");
    expect(contextRemaining({ raw: true }).render(ctx({ contextTokens: undefined }))).toBe("?");
    expect(contextRemaining({ raw: true }).render(ctx({ contextMaxTokens: 0 }))).toBe("25k ctx");
    expect(contextRemaining({ raw: true }).render(ctx({ contextTokens: 125_000 }))).toBe("0%");
  });

  it("uses conditional warning and danger colors over user colors while preserving bold", () => {
    const widget = contextRemaining({
      raw: true,
      fg: "blue",
      bg: "green",
      bold: true,
      contextConditionalColors: true,
      warningBg: "magenta",
      dangerBg: "red",
    });

    expect(
      widget.render(
        ctx({ colorLevel: "ansi16", contextTokens: 50_000, contextMaxTokens: 100_000 }),
      ),
    ).toBe("\x1b[1m\x1b[42m\x1b[34m50%\x1b[39m\x1b[49m\x1b[22m");
    expect(
      widget.render(
        ctx({ colorLevel: "ansi16", contextTokens: 80_000, contextMaxTokens: 100_000 }),
      ),
    ).toBe("\x1b[1m\x1b[45m\x1b[33m20%\x1b[39m\x1b[49m\x1b[22m");
    expect(
      widget.render(
        ctx({ colorLevel: "ansi16", contextTokens: 95_000, contextMaxTokens: 100_000 }),
      ),
    ).toBe("\x1b[1m\x1b[41m\x1b[31m5%\x1b[39m\x1b[49m\x1b[22m");
  });

  it("exposes metadata fields and summaries", () => {
    expect(fieldsForWidget(contextRemaining()).map((field) => field.id)).toEqual([
      "enabled",
      "raw",
      "icon",
      "contextConditionalColors",
    ]);
    expect(
      fieldsForWidget(contextRemaining({ contextConditionalColors: true })).map(
        (field) => field.id,
      ),
    ).toEqual([
      "enabled",
      "raw",
      "icon",
      "contextConditionalColors",
      "contextWarningPercent",
      "contextDangerPercent",
    ]);
    expect(
      colorFields(contextRemaining({ contextConditionalColors: true })).map((field) => field.id),
    ).toContain("dangerBgAnsi");
    expect(
      formatWidgetOptions(
        contextRemaining({ raw: true, icon: "L=", contextConditionalColors: true }),
      ),
    ).toBe("raw • icon='L=' • with-colors");
    expect(
      formatWidgetColorOptions(
        contextRemaining({
          raw: true,
          icon: "L=",
          contextConditionalColors: true,
          fg: "blue",
          bg: "magenta",
          bold: true,
        }),
      ),
    ).toBe("raw • icon='L=' • with-colors • fg=Blue • bg=Magenta • bold");
  });

  it("normalizes config through metadata", () => {
    expect(
      normalizeConfig({
        lines: [
          [
            {
              type: "context-remaining",
              options: {
                raw: true,
                icon: "L=",
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
      icon: "L=",
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
              type: "context-remaining",
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
