import { describe, expect, it } from "vitest";

import { normalizeConfig } from "../../../src/config.ts";
import type { WidgetOptions } from "../../../src/types.ts";
import {
  fieldsForWidget,
  formatWidgetColorOptions,
  formatWidgetOptions,
} from "../../../src/ui/fields.ts";
import { TokensWidget } from "../../../src/widgets/tokens/tokens.ts";
import { WidgetInstance } from "../../../src/widgets/instance.ts";
import { registry } from "../../../src/widgets/registry.ts";
import type { WidgetContext } from "../../../src/widgets/types.ts";
import { TOKEN_METRICS } from "./fixtures.ts";

function tokens(options: WidgetOptions = {}) {
  return registry.createWidget("tokens", options);
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

describe("TokensWidget", () => {
  it("owns metadata and default options", () => {
    expect(TokensWidget.dependencies).toEqual(["metrics"]);
    expect(TokensWidget.icons).toEqual({ emoji: "🔢", nerd: "󰓹", text: "tok" });
    expect(TokensWidget.defaultStyle).toEqual({ fg: "cyan", bg: "default", bold: false });
    expect(TokensWidget.baseOptionDefaults).toEqual({});
    const widget = tokens();
    expect(widget).toBeInstanceOf(WidgetInstance);
    expect(registry.spec(widget.type)).toBe(TokensWidget);
    expect(registry.createEntry("tokens").options).toEqual({
      raw: false,
      icon: "",
      tokenFormatStyle: "default",
      fg: "cyan",
      bg: "default",
      bold: false,
    });
  });

  it("renders labels, custom icons, raw values, compact format, and zero counts", () => {
    expect(tokens().render(ctx())).toBe("tok ↑12.3k ↓6.8k");
    expect(tokens({ icon: "T " }).render(ctx())).toBe("T ↑12.3k ↓6.8k");
    expect(tokens({ raw: true }).render(ctx())).toBe("↑12.3k ↓6.8k");
    expect(tokens({ raw: true, tokenFormatStyle: "compact" }).render(ctx())).toBe("↑12k ↓6.8k");
    expect(
      tokens().render(
        ctx({ metrics: { ...TOKEN_METRICS, inputTokens: 0, outputTokens: 0, totalTokens: 0 } }),
      ),
    ).toBe("tok ↑0 ↓0");
  });

  it("exposes metadata fields and summaries", () => {
    expect(fieldsForWidget(tokens()).map((field) => field.id)).toEqual([
      "enabled",
      "raw",
      "icon",
      "tokenFormatStyle",
    ]);
    expect(formatWidgetOptions(tokens())).toBe("");
    expect(formatWidgetOptions(tokens({ tokenFormatStyle: "compact" }))).toContain(
      "format=Compact",
    );
    expect(formatWidgetOptions(tokens({ raw: true, icon: "T " }))).toBe("raw • icon='T '");
    expect(formatWidgetColorOptions(tokens({ fg: "red", bold: true }))).toBe("fg=Red • bold");
  });

  it("normalizes config through metadata", () => {
    expect(
      normalizeConfig({
        lines: [[{ type: "tokens", options: { tokenFormatStyle: "compact" } }]],
      }).lines[0]?.[0]?.options,
    ).toMatchObject({
      tokenFormatStyle: "compact",
    });
    expect(
      normalizeConfig({
        lines: [[{ type: "tokens", options: { tokenFormatStyle: "wide", showProvider: true } }]],
      }).lines[0]?.[0]?.options,
    ).toEqual({
      raw: false,
      icon: "",
      fg: "cyan",
      bg: "default",
      bold: false,
      tokenFormatStyle: "default",
    });
  });
});
