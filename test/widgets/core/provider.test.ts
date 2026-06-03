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
import { ProviderWidget } from "../../../src/widgets/core/provider.js";
import { registry } from "../../../src/widgets/registry.js";
import { WidgetStore } from "../../../src/widgets/store.js";
import { WidgetInstance } from "../../../src/widgets/instance.js";
import type { WidgetContext } from "../../../src/widgets/types.js";

function provider(options: WidgetOptions = {}) {
  return registry.createWidget("provider", options);
}

function ctx(overrides: Partial<WidgetContext<["provider"]>> = {}) {
  return {
    iconMode: "text",
    minimalist: false,
    colorLevel: "none",
    provider: "anthropic",
    ...overrides,
  } satisfies WidgetContext<["provider"]>;
}

describe("ProviderWidget", () => {
  it("owns metadata and default options", () => {
    expect(ProviderWidget.dependencies).toEqual(["provider"]);
    expect(ProviderWidget.icons).toEqual({ emoji: "☁️", nerd: "󰒋", text: "provider" });
    expect(ProviderWidget.defaultStyle).toEqual({ fg: "cyan", bg: "default", bold: false });
    expect(ProviderWidget.baseOptionDefaults).toEqual({});
    expect(registry.createEntry("provider").options).toEqual({
      raw: false,
      hideWhenEmpty: false,
      icon: "",
      text: "-",
      fg: "cyan",
      bg: "default",
      bold: false,
    });
    const widget = provider();
    expect(widget).toBeInstanceOf(WidgetInstance);
    expect(registry.spec(widget.type)).toBe(ProviderWidget);
  });

  it("renders labels, custom icons, raw/minimalist values, styles, and fallbacks", () => {
    expect(provider().render(ctx())).toBe("provider anthropic");
    expect(provider().render(ctx({ iconMode: "emoji" }))).toBe("☁️ anthropic");
    expect(provider({ icon: "P=" }).render(ctx())).toBe("P=anthropic");
    expect(provider({ raw: true }).render(ctx())).toBe("anthropic");
    expect(provider().render(ctx({ minimalist: true }))).toBe("anthropic");
    expect(provider().render(ctx({ provider: undefined }))).toBe("provider -");
    expect(provider().render(ctx({ provider: "" }))).toBe("provider -");
    expect(provider({ text: "missing" }).render(ctx({ provider: undefined }))).toBe(
      "provider missing",
    );
    expect(provider({ text: "missing" }).render(ctx({ provider: "" }))).toBe("provider missing");
    expect(provider({ hideWhenEmpty: true }).render(ctx({ provider: undefined }))).toBeUndefined();
    expect(provider({ hideWhenEmpty: true }).render(ctx({ provider: "" }))).toBeUndefined();
    expect(provider({ hideWhenZero: true }).render(ctx({ provider: "0" }))).toBe("provider 0");
    expect(
      provider({ raw: true, fg: "red", bold: true }).render(ctx({ colorLevel: "ansi16" })),
    ).toBe("\u001b[1m\u001b[31manthropic\u001b[39m\u001b[22m");
  });

  it("exposes metadata fields and summaries", () => {
    const fields = fieldsForWidget(provider());
    expect(fields.map((field) => field.id)).toEqual([
      "enabled",
      "raw",
      "hideWhenEmpty",
      "icon",
      "text",
    ]);
    expect(fieldValue(provider({ raw: true }), fields[1]!)).toBe("on");
    expect(getTextField(provider({ text: "missing" }), "text")).toBe("missing");
    expect(formatWidgetOptions(provider())).toBe("text='-'");
    const summary = formatWidgetOptions(
      provider({ raw: true, hideWhenEmpty: true, hideWhenZero: true, icon: "P=" }),
    );
    expect(summary).toContain("raw");
    expect(summary).toContain("hide-empty");
    expect(summary).toContain("icon='P='");
    expect(summary).not.toContain("hide-zero");
    expect(formatWidgetOptions(provider({ text: "missing" }))).toContain("text='missing'");
    expect(formatWidgetColorOptions(provider({ fg: "red", bg: "blue", bold: true }))).toBe(
      "text='-' • fg=Red • bg=Blue • bold",
    );
  });

  it("normalizes config through metadata and hydrates through the store", () => {
    const normalized = normalizeConfig({
      ...DEFAULT_CONFIG,
      lines: [
        [
          {
            id: "provider-1",
            type: "provider",
            enabled: false,
            options: {
              raw: true,
              hideWhenEmpty: true,
              hideWhenZero: true,
              text: "missing",
              icon: "P=",
              fg: "pi:dim",
              bg: "ansi256:236",
              bold: true,
            },
          },
        ],
      ],
    });

    expect(normalized.lines[0]?.[0]).toEqual({
      id: "provider-1",
      type: "provider",
      enabled: false,
      options: {
        raw: true,
        hideWhenEmpty: true,
        icon: "P=",
        text: "missing",
        fg: "pi:dim",
        bg: "ansi256:236",
        bold: true,
      },
    });
    const widget = WidgetStore.fromConfig(normalized).lines[0]?.[0];
    expect(widget).toBeInstanceOf(WidgetInstance);
    expect(widget?.type).toBe(ProviderWidget.type);

    expect(
      normalizeConfig({
        lines: [
          [
            {
              type: "provider",
              options: {
                raw: "yes",
                hideWhenEmpty: "yes",
                hideWhenZero: 1,
                text: 12,
                icon: false,
                fg: "not-a-color",
                bg: 123,
                bold: "true",
                showProvider: true,
              },
            },
          ],
        ],
      }).lines[0]?.[0]?.options,
    ).toEqual({
      raw: false,
      hideWhenEmpty: false,
      icon: "",
      text: "-",
      bold: false,
    });
  });
});
