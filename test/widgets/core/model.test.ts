import { describe, expect, it } from "vitest";

import { normalizeConfig } from "../../../src/config.js";
import type { WidgetOptions } from "../../../src/types.js";
import {
  fieldsForWidget,
  formatWidgetColorOptions,
  formatWidgetOptions,
} from "../../../src/ui/fields.js";
import { ModelWidget } from "../../../src/widgets/core/model.js";
import { WidgetInstance } from "../../../src/widgets/instance.js";
import { registry } from "../../../src/widgets/registry.js";
import type { WidgetContext } from "../../../src/widgets/types.js";

function model(options: WidgetOptions = {}) {
  return registry.createWidget("model", options);
}

function ctx(
  overrides: Partial<WidgetContext<["model", "provider"]>> = {},
): WidgetContext<["model", "provider"]> {
  return {
    iconMode: "text",
    minimalist: false,
    colorLevel: "none",
    model: "claude-sonnet-4-5",
    provider: "anthropic",
    ...overrides,
  };
}

describe("ModelWidget", () => {
  it("owns metadata and default options", () => {
    const widget = model();
    expect(widget).toBeInstanceOf(WidgetInstance);
    expect(registry.spec(widget.type)).toBe(ModelWidget);
    expect(ModelWidget.dependencies).toEqual(["model", "provider"]);
    expect(ModelWidget.icons).toEqual({ emoji: "🤖", nerd: "󰚩", text: "model" });
    expect(ModelWidget.defaultStyle).toEqual({ fg: "cyan", bg: "default", bold: false });
    expect(ModelWidget.baseOptionDefaults).toEqual({});
    expect(widget.options).toEqual({
      raw: false,
      icon: "",
      showProvider: false,
      fg: "cyan",
      bg: "default",
      bold: false,
    });
  });

  it("renders model labels, custom icons, raw values, providers, and fallbacks", () => {
    expect(model().render(ctx())).toBe("model claude-sonnet-4-5");
    expect(model({ icon: "M " }).render(ctx())).toBe("M claude-sonnet-4-5");
    expect(model({ raw: true }).render(ctx())).toBe("claude-sonnet-4-5");
    expect(model({ showProvider: true }).render(ctx())).toBe("model anthropic/claude-sonnet-4-5");
    expect(model({ showProvider: true }).render(ctx({ provider: undefined }))).toBe(
      "model claude-sonnet-4-5",
    );
    expect(model().render(ctx({ model: undefined }))).toBe("model no-model");
    expect(model({ showProvider: true }).render(ctx({ model: undefined }))).toBe(
      "model anthropic/no-model",
    );
  });

  it("exposes metadata fields and summaries", () => {
    expect(fieldsForWidget(model()).map((field) => field.id)).toEqual([
      "enabled",
      "raw",
      "icon",
      "showProvider",
    ]);
    expect(formatWidgetOptions(model())).toBe("");
    expect(formatWidgetOptions(model({ showProvider: true }))).toContain("with-provider");
    expect(formatWidgetColorOptions(model({ showProvider: true }))).toContain("with-provider");
  });

  it("normalizes config through metadata", () => {
    expect(
      normalizeConfig({
        lines: [[{ type: "model", options: { showProvider: true } }]],
      }).lines[0]?.[0]?.options,
    ).toMatchObject({
      showProvider: true,
    });
    expect(
      normalizeConfig({
        lines: [
          [
            {
              type: "model",
              options: {
                showProvider: "yes",
                hideWhenEmpty: true,
                tokenFormatStyle: "compact",
              },
            },
          ],
        ],
      }).lines[0]?.[0]?.options,
    ).toEqual({
      raw: false,
      icon: "",
      fg: "cyan",
      bg: "default",
      bold: false,
      showProvider: false,
    });
  });
});
