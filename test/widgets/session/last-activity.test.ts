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
import { WidgetInstance } from "../../../src/widgets/instance.js";
import { registry } from "../../../src/widgets/registry.js";
import { LastActivityWidget } from "../../../src/widgets/session/last-activity.js";
import { WidgetStore } from "../../../src/widgets/store.js";
import type { WidgetContext } from "../../../src/widgets/types.js";

const lastTimestampMs = Date.parse("2026-01-01T12:34:56.000Z");
const renderedLastActivityTime = new Date(lastTimestampMs).toLocaleTimeString([], {
  hour: "2-digit",
  minute: "2-digit",
});

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
  firstTimestampMs: lastTimestampMs - 120_000,
  lastTimestampMs,
  compactions: 0,
};

const statuslineData = makeStatuslineData({ metrics });

function lastActivity(options: WidgetOptions = {}) {
  return registry.createWidget("last-activity", options);
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

describe("LastActivityWidget", () => {
  it("owns metadata and default options", () => {
    expect(LastActivityWidget.type).toBe("last-activity");
    expect(LastActivityWidget.label).toBe("Last Activity");
    expect(LastActivityWidget.category).toBe("Session");
    expect(LastActivityWidget.description).toBe("Most recent session entry time");
    expect(LastActivityWidget.dependencies).toEqual(["metrics"]);
    expect(LastActivityWidget.baseOptionDefaults).toEqual({ text: "" });
    expect(LastActivityWidget.icons).toEqual({ emoji: "🕘", nerd: "󱑃", text: "last" });
    expect(LastActivityWidget.defaultStyle).toEqual({ fg: "yellow", bg: "default", bold: false });
    const widget = lastActivity();
    expect(widget.options).toEqual({
      raw: false,
      hideWhenEmpty: false,
      icon: "",
      text: "",
      fg: "yellow",
      bg: "default",
      bold: false,
    });
    expect(widget).toBeInstanceOf(WidgetInstance);
    expect(registry.spec(widget.type)).toBe(LastActivityWidget);
  });

  it("renders labels, raw output, custom icons, minimalist output, and missing timestamp behavior", () => {
    expect(lastActivity().render(ctx())).toBe(`last ${renderedLastActivityTime}`);
    expect(lastActivity({ raw: true }).render(ctx())).toBe(renderedLastActivityTime);
    expect(lastActivity({ icon: "L=" }).render(ctx())).toBe(`L=${renderedLastActivityTime}`);
    expect(lastActivity().render(ctx({ minimalist: true }))).toBe(renderedLastActivityTime);
    expect(
      lastActivity().render(ctx({ metrics: { ...metrics, lastTimestampMs: undefined } })),
    ).toBe("last ");
    expect(
      lastActivity({ text: "missing" }).render(
        ctx({ metrics: { ...metrics, lastTimestampMs: undefined } }),
      ),
    ).toBe("last missing");
    expect(
      lastActivity({ hideWhenEmpty: true }).render(
        ctx({ metrics: { ...metrics, lastTimestampMs: undefined } }),
      ),
    ).toBeUndefined();
  });

  it("exposes metadata fields and summaries", () => {
    expect(fieldsForWidget(lastActivity()).map((field) => field.id)).toEqual([
      "enabled",
      "raw",
      "hideWhenEmpty",
      "icon",
      "text",
    ]);
    expect(fieldsForWidget(lastActivity({ hideWhenEmpty: true })).map((field) => field.id)).toEqual(
      ["enabled", "raw", "hideWhenEmpty", "icon"],
    );
    expect(formatWidgetOptions(lastActivity())).toBe("");
    expect(formatWidgetOptions(lastActivity({ raw: true }))).toBe("raw");
    expect(formatWidgetOptions(lastActivity({ hideWhenEmpty: true }))).toBe("hide-empty");
    expect(formatWidgetOptions(lastActivity({ text: "missing" }))).toBe("text='missing'");
    expect(formatWidgetOptions(lastActivity({ icon: "L=" }))).toBe("icon='L='");
    expect(formatWidgetOptions(lastActivity({ raw: true, icon: "L=" }))).toBe("raw • icon='L='");
    expect(formatWidgetColorOptions(lastActivity({ fg: "red", bold: true }))).toBe("fg=Red • bold");
  });

  it("normalizes config through metadata", () => {
    expect(
      normalizeConfig({
        lines: [
          [{ type: "last-activity", options: { raw: true, hideWhenEmpty: true, icon: "L=" } }],
        ],
      }).lines[0]?.[0]?.options,
    ).toMatchObject({
      raw: true,
      hideWhenEmpty: true,
      icon: "L=",
    });
    expect(
      normalizeConfig({
        lines: [
          [
            {
              type: "last-activity",
              options: { raw: "yes", hideWhenEmpty: "no", hideWhenZero: true, text: 7, icon: 7 },
            },
          ],
        ],
      }).lines[0]?.[0]?.options,
    ).toEqual({
      raw: false,
      hideWhenEmpty: false,
      icon: "",
      text: "",
      fg: "yellow",
      bg: "default",
      bold: false,
    });
  });

  it("receives metrics through the production store render path", () => {
    const store = WidgetStore.fromConfig(
      normalizeConfig({
        terminal: { colorLevel: "none" },
        iconMode: "text",
        lines: [[{ type: "last-activity" }]],
      }),
    );

    expect(renderStatuslines(store, statuslineData, 200)).toEqual([
      `last ${renderedLastActivityTime}`,
    ]);
  });
});
