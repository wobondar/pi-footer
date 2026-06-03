import { describe, expect, it } from "vitest";

import { DEFAULT_CONFIG, normalizeConfig } from "../../../src/config.js";
import type { WidgetOptions } from "../../../src/types.js";
import {
  fieldValue,
  fieldsForWidget,
  formatWidgetColorOptions,
  formatWidgetOptions,
  getTextField,
} from "../../../src/ui/fields.js";
import { ModelProviderWidget } from "../../../src/widgets/core/model-provider.js";
import { WidgetInstance } from "../../../src/widgets/instance.js";
import { registry } from "../../../src/widgets/registry.js";
import { WidgetStore } from "../../../src/widgets/store.js";
import type { WidgetContext } from "../../../src/widgets/types.js";

function modelProvider(options: WidgetOptions = {}) {
  return registry.createWidget("model-provider", options);
}

function ctx(overrides: Partial<WidgetContext<["model", "provider"]>> = {}) {
  return {
    iconMode: "text",
    minimalist: false,
    colorLevel: "none",
    model: "claude-sonnet-4-5",
    provider: "anthropic",
    ...overrides,
  } satisfies WidgetContext<["model", "provider"]>;
}

describe("ModelProviderWidget", () => {
  it("owns metadata and default options", () => {
    expect(ModelProviderWidget.dependencies).toEqual(["model", "provider"]);
    expect(ModelProviderWidget.icons).toEqual({ emoji: "🤖", nerd: "󰚩", text: "model" });
    expect(ModelProviderWidget.defaultStyle).toEqual({ fg: "cyan", bg: "default", bold: false });
    expect(ModelProviderWidget.baseOptionDefaults).toEqual({});
    expect(registry.createEntry("model-provider").options).toEqual({
      raw: false,
      icon: "",
      fg: "cyan",
      bg: "default",
      bold: false,
    });
    const widget = modelProvider();
    expect(widget).toBeInstanceOf(WidgetInstance);
    expect(registry.spec(widget.type)).toBe(ModelProviderWidget);
  });

  it("renders labels, provider/model values, custom icons, raw values, minimalist values, and fallbacks", () => {
    expect(modelProvider().render(ctx())).toBe("model anthropic/claude-sonnet-4-5");
    expect(modelProvider().render(ctx({ iconMode: "emoji" }))).toBe(
      "🤖 anthropic/claude-sonnet-4-5",
    );
    expect(modelProvider({ icon: "M=" }).render(ctx())).toBe("M=anthropic/claude-sonnet-4-5");
    expect(modelProvider({ raw: true }).render(ctx())).toBe("anthropic/claude-sonnet-4-5");
    expect(modelProvider().render(ctx({ minimalist: true }))).toBe("anthropic/claude-sonnet-4-5");
    expect(modelProvider().render(ctx({ provider: undefined }))).toBe("model claude-sonnet-4-5");
    expect(modelProvider().render(ctx({ model: undefined }))).toBe("model anthropic/no-model");
    expect(modelProvider().render(ctx({ model: undefined, provider: undefined }))).toBe(
      "model no-model",
    );
    expect(
      modelProvider({ raw: true, fg: "red", bold: true }).render(ctx({ colorLevel: "ansi16" })),
    ).toBe("\u001b[1m\u001b[31manthropic/claude-sonnet-4-5\u001b[39m\u001b[22m");
  });

  it("exposes metadata fields and summaries", () => {
    const fields = fieldsForWidget(modelProvider());
    expect(fields.map((field) => field.id)).toEqual(["enabled", "raw", "icon"]);
    expect(fieldValue(modelProvider({ raw: true }), fields[1]!)).toBe("on");
    expect(getTextField(modelProvider({ icon: "M=" }), "icon")).toBe("M=");
    expect(formatWidgetOptions(modelProvider())).toBe("");

    const summary = formatWidgetOptions(modelProvider({ raw: true, icon: "M=" }));
    expect(summary).toContain("raw");
    expect(summary).toContain("icon='M='");
    expect(
      formatWidgetColorOptions(modelProvider({ raw: true, icon: "M=", fg: "red", bold: true })),
    ).toBe("raw • icon='M=' • fg=Red • bold");
  });

  it("normalizes config through metadata and hydrates through the store", () => {
    const normalized = normalizeConfig({
      ...DEFAULT_CONFIG,
      lines: [
        [
          {
            id: "model-provider-1",
            type: "model-provider",
            enabled: false,
            options: {
              raw: true,
              icon: "M=",
              fg: "pi:dim",
              bg: "ansi256:236",
              bold: true,
            },
          },
        ],
      ],
    });

    expect(normalized.lines[0]?.[0]).toEqual({
      id: "model-provider-1",
      type: "model-provider",
      enabled: false,
      options: {
        raw: true,
        icon: "M=",
        fg: "pi:dim",
        bg: "ansi256:236",
        bold: true,
      },
    });
    const widget = WidgetStore.fromConfig(normalized).lines[0]?.[0];
    expect(widget).toBeInstanceOf(WidgetInstance);
    expect(widget?.type).toBe(ModelProviderWidget.type);

    expect(
      normalizeConfig({
        lines: [
          [
            {
              type: "model-provider",
              options: {
                raw: "yes",
                icon: false,
                hideWhenEmpty: true,
                hideWhenZero: true,
                text: "missing",
                showProvider: true,
                tokenFormatStyle: "compact",
                fg: "not-a-color",
                bg: 123,
                bold: "true",
              },
            },
          ],
        ],
      }).lines[0]?.[0]?.options,
    ).toEqual({
      raw: false,
      icon: "",
      bold: false,
    });
  });
});
