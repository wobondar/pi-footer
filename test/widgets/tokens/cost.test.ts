import { describe, expect, it } from "vitest";

import { normalizeConfig } from "../../../src/config.js";
import type { SessionMetrics, WidgetOptions } from "../../../src/types.js";
import {
  fieldValue,
  fieldsForWidget,
  formatWidgetColorOptions,
  formatWidgetOptions,
} from "../../../src/ui/fields.js";
import type { OptionField } from "../../../src/ui/model.js";
import { applyOptionField } from "../../../src/ui/option-edit.js";
import { WidgetInstance } from "../../../src/widgets/instance.js";
import { registry } from "../../../src/widgets/registry.js";
import { CostWidget } from "../../../src/widgets/tokens/cost.js";
import type { WidgetContext } from "../../../src/widgets/types.js";

const metrics: SessionMetrics = {
  inputTokens: 12_345,
  outputTokens: 6789,
  cacheReadTokens: 0,
  cacheWriteTokens: 0,
  totalTokens: 19_134,
  costUsd: 1.2345,
  userMessages: 2,
  assistantMessages: 2,
  toolResults: 3,
  firstTimestampMs: 0,
  lastTimestampMs: 120_000,
  compactions: 0,
};

const optionField = (id: string, kind: OptionField["kind"]) => ({
  id,
  label: id,
  kind,
});

function cost(options: WidgetOptions = {}) {
  return registry.createWidget("cost", options);
}

function ctx(overrides: Partial<WidgetContext<["metrics", "usingSubscription", "provider"]>> = {}) {
  return {
    iconMode: "text",
    minimalist: false,
    colorLevel: "none",
    metrics,
    usingSubscription: false,
    provider: "anthropic",
    ...overrides,
  } satisfies WidgetContext<["metrics", "usingSubscription", "provider"]>;
}

describe("CostWidget", () => {
  it("owns metadata and default options", () => {
    const widget = cost();
    expect(widget).toBeInstanceOf(WidgetInstance);
    expect(registry.spec(widget.type)).toBe(CostWidget);
    expect(CostWidget.dependencies).toEqual(["metrics", "usingSubscription", "provider"]);
    expect(CostWidget.icons).toEqual({ emoji: "💸", nerd: "󱐋", text: "cost" });
    expect(CostWidget.defaultStyle).toEqual({ fg: "green", bg: "default", bold: false });
    expect(CostWidget.baseOptionDefaults).toEqual({});
    expect(registry.createEntry("cost").options).toEqual({
      raw: false,
      icon: "",
      costFormatStyle: "default",
      showSubscription: false,
      hideForProviders: "",
      fg: "green",
      bg: "default",
      bold: false,
    });
  });

  it("renders labels, custom icons, raw values, compact format, and subscription suffixes", () => {
    expect(cost().render(ctx())).toBe("cost $1.23");
    expect(cost({ icon: "Cost: " }).render(ctx())).toBe("Cost: $1.23");
    expect(cost({ raw: true }).render(ctx())).toBe("$1.23");
    expect(cost({ raw: true, costFormatStyle: "compact" }).render(ctx())).toBe("$1.234");
    expect(cost({ raw: true }).render(ctx({ metrics: { ...metrics, costUsd: 0.1234 } }))).toBe(
      "$0.1234",
    );
    expect(
      cost({ raw: true, costFormatStyle: "compact" }).render(
        ctx({ metrics: { ...metrics, costUsd: 0.1234 } }),
      ),
    ).toBe("$0.123");
    expect(cost({ raw: true, showSubscription: true }).render(ctx())).toBe("$1.23");
    expect(
      cost({ raw: true, showSubscription: true }).render(ctx({ usingSubscription: true })),
    ).toBe("$1.23 (sub)");
  });

  it("hides the cost for configured provider IDs", () => {
    const widget = cost({ hideForProviders: " openai-codex, github-copilot " });
    expect(widget.render(ctx({ provider: "openai-codex" }))).toBeUndefined();
    expect(widget.render(ctx({ provider: "github-copilot" }))).toBeUndefined();
    expect(widget.render(ctx({ provider: "anthropic" }))).toBe("cost $1.23");
    expect(widget.render(ctx({ provider: undefined }))).toBe("cost $1.23");
  });

  it("exposes metadata fields, values, summaries, and generic metadata editing", () => {
    const costFields = fieldsForWidget(cost());
    expect(costFields.map((field) => field.id)).toEqual([
      "enabled",
      "raw",
      "icon",
      "costFormatStyle",
      "showSubscription",
      "hideForProviders",
    ]);
    const costFormatField = costFields.find((field) => field.id === "costFormatStyle");
    const subscriptionField = costFields.find((field) => field.id === "showSubscription");
    const hiddenProvidersField = costFields.find((field) => field.id === "hideForProviders");
    if (!costFormatField || !subscriptionField || !hiddenProvidersField) {
      throw new Error("Missing cost metadata fields");
    }
    expect(fieldValue(cost({ costFormatStyle: "compact" }), costFormatField)).toBe("Compact");
    expect(fieldValue(cost({ showSubscription: true }), subscriptionField)).toBe("on");
    expect(fieldValue(cost({ hideForProviders: "openai-codex" }), hiddenProvidersField)).toBe(
      "openai-codex",
    );
    expect(formatWidgetOptions(cost())).toBe("");
    expect(formatWidgetOptions(cost({ costFormatStyle: "compact" }))).toBe("format=Compact");
    expect(formatWidgetOptions(cost({ showSubscription: true }))).toBe("show-sub");
    expect(formatWidgetOptions(cost({ hideForProviders: "openai-codex" }))).toBe(
      "hide-for='openai-codex'",
    );
    expect(formatWidgetOptions(cost({ raw: true, icon: "Cost: " }))).toBe("raw • icon='Cost: '");
    expect(formatWidgetColorOptions(cost({ fg: "red", bold: true }))).toBe("fg=Red • bold");

    const editable = cost();
    applyOptionField(editable, optionField("costFormatStyle", "choice"), 1);
    applyOptionField(editable, optionField("showSubscription", "boolean"), 1);
    expect(editable.options.costFormatStyle).toBe("compact");
    expect(editable.options.showSubscription).toBe(true);
  });

  it("normalizes config through metadata", () => {
    expect(
      normalizeConfig({
        lines: [
          [
            {
              type: "cost",
              options: {
                costFormatStyle: "compact",
                showSubscription: true,
                hideForProviders: "openai-codex,github-copilot",
              },
            },
          ],
        ],
      }).lines[0]?.[0]?.options,
    ).toMatchObject({
      costFormatStyle: "compact",
      showSubscription: true,
      hideForProviders: "openai-codex,github-copilot",
    });
    expect(
      normalizeConfig({
        lines: [
          [
            {
              type: "cost",
              options: {
                costFormatStyle: "wide",
                showSubscription: "yes",
                hideForProviders: 42,
                hideWhenEmpty: true,
              },
            },
          ],
        ],
      }).lines[0]?.[0]?.options,
    ).toEqual({
      raw: false,
      icon: "",
      fg: "green",
      bg: "default",
      bold: false,
      costFormatStyle: "default",
      showSubscription: false,
      hideForProviders: "",
    });
  });
});
