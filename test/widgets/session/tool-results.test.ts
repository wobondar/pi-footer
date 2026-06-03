import { describe, expect, it } from "vitest";

import { normalizeConfig } from "../../../src/config.js";
import { renderStatuslines } from "../../../src/render.js";
import { makeStatuslineData } from "../../helpers/render.js";
import type { SessionMetrics, WidgetOptions } from "../../../src/types.js";
import {
  fieldsForWidget,
  formatWidgetColorOptions,
  formatWidgetOptions,
} from "../../../src/ui/fields.js";
import { ToolResultsWidget } from "../../../src/widgets/session/tool-results.js";
import { WidgetInstance } from "../../../src/widgets/instance.js";
import { registry } from "../../../src/widgets/registry.js";
import { WidgetStore } from "../../../src/widgets/store.js";
import type { WidgetContext } from "../../../src/widgets/types.js";

const metrics: SessionMetrics = {
  inputTokens: 12_345,
  outputTokens: 6789,
  cacheReadTokens: 0,
  cacheWriteTokens: 0,
  totalTokens: 19_134,
  costUsd: 0.1234,
  userMessages: 2,
  assistantMessages: 4,
  toolResults: 3,
  firstTimestampMs: 0,
  lastTimestampMs: 120_000,
  compactions: 0,
};

const statuslineData = makeStatuslineData({ metrics });

function toolResults(options: WidgetOptions = {}) {
  return registry.createWidget("tool-results", options);
}

function ctx(overrides: Partial<WidgetContext<["metrics"]>> = {}) {
  return {
    iconMode: "text",
    minimalist: false,
    colorLevel: "none",
    metrics,
    ...overrides,
  } satisfies WidgetContext<["metrics"]>;
}

describe("ToolResultsWidget", () => {
  it("owns metadata and default options", () => {
    expect(ToolResultsWidget.type).toBe("tool-results");
    expect(ToolResultsWidget.label).toBe("Tool Results");
    expect(ToolResultsWidget.category).toBe("Session");
    expect(ToolResultsWidget.description).toBe("Tool result count");
    expect(ToolResultsWidget.dependencies).toEqual(["metrics"]);
    expect(ToolResultsWidget.baseOptionDefaults).toEqual({});
    expect(ToolResultsWidget.icons).toEqual({ emoji: "🛠️", nerd: "󰒓", text: "tools" });
    expect(ToolResultsWidget.defaultStyle).toEqual({ fg: "green", bg: "default", bold: false });
    expect(registry.createEntry("tool-results").options).toEqual({
      raw: false,
      hideWhenZero: false,
      icon: "",
      text: "-",
      fg: "green",
      bg: "default",
      bold: false,
    });
    const widget = toolResults();
    expect(widget).toBeInstanceOf(WidgetInstance);
    expect(registry.spec(widget.type)).toBe(ToolResultsWidget);
  });

  it("renders labels, raw output, custom icons, minimalist output, and zero counts", () => {
    expect(toolResults().render(ctx())).toBe("tools 3");
    expect(toolResults({ raw: true }).render(ctx())).toBe("3");
    expect(toolResults({ icon: "T=" }).render(ctx())).toBe("T=3");
    expect(toolResults().render(ctx({ minimalist: true }))).toBe("3");
    expect(toolResults().render(ctx({ metrics: { ...metrics, toolResults: 0 } }))).toBe("tools 0");
    expect(
      toolResults({ text: "none" }).render(ctx({ metrics: { ...metrics, toolResults: 0 } })),
    ).toBe("tools 0");
    expect(
      toolResults({ hideWhenZero: true }).render(ctx({ metrics: { ...metrics, toolResults: 0 } })),
    ).toBeUndefined();
  });

  it("exposes metadata fields and summaries", () => {
    expect(fieldsForWidget(toolResults()).map((field) => field.id)).toEqual([
      "enabled",
      "raw",
      "hideWhenZero",
      "icon",
      "text",
    ]);
    expect(formatWidgetOptions(toolResults())).toBe("text='-'");
    expect(formatWidgetOptions(toolResults({ raw: true }))).toBe("raw • text='-'");
    expect(formatWidgetOptions(toolResults({ icon: "T=" }))).toBe("icon='T=' • text='-'");
    expect(formatWidgetOptions(toolResults({ hideWhenZero: true }))).toBe("hide-zero • text='-'");
    expect(formatWidgetOptions(toolResults({ text: "none" }))).toBe("text='none'");
    expect(formatWidgetOptions(toolResults({ raw: true, icon: "T=" }))).toBe(
      "raw • icon='T=' • text='-'",
    );
    expect(formatWidgetColorOptions(toolResults({ fg: "red", bold: true }))).toBe(
      "text='-' • fg=Red • bold",
    );
  });

  it("normalizes config through metadata", () => {
    expect(
      normalizeConfig({
        lines: [
          [
            {
              type: "tool-results",
              options: { raw: true, hideWhenZero: true, icon: "T=", text: "none" },
            },
          ],
        ],
      }).lines[0]?.[0]?.options,
    ).toMatchObject({
      raw: true,
      hideWhenZero: true,
      icon: "T=",
      text: "none",
    });
    expect(
      normalizeConfig({
        lines: [
          [
            {
              type: "tool-results",
              options: { raw: "yes", icon: 7, hideWhenZero: "yes", text: 5 },
            },
          ],
        ],
      }).lines[0]?.[0]?.options,
    ).toEqual({
      raw: false,
      hideWhenZero: false,
      icon: "",
      text: "-",
      fg: "green",
      bg: "default",
      bold: false,
    });
  });

  it("receives metrics through the production store render path", () => {
    const store = WidgetStore.fromConfig(
      normalizeConfig({
        terminal: { colorLevel: "none" },
        iconMode: "text",
        lines: [[{ type: "tool-results" }]],
      }),
    );

    expect(renderStatuslines(store, statuslineData, 200)).toEqual(["tools 3"]);
  });
});
