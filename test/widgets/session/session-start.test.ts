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
import { SessionStartWidget } from "../../../src/widgets/session/session-start.js";
import { WidgetStore } from "../../../src/widgets/store.js";
import type { WidgetContext } from "../../../src/widgets/types.js";

const firstTimestampMs = Date.parse("2026-01-01T12:34:56.000Z");
const renderedStartTime = new Date(firstTimestampMs).toLocaleTimeString([], {
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
  firstTimestampMs,
  lastTimestampMs: firstTimestampMs + 120_000,
  compactions: 0,
};

const statuslineData = makeStatuslineData({ metrics });

function sessionStart(options: WidgetOptions = {}) {
  return registry.createWidget("session-start", options);
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

describe("SessionStartWidget", () => {
  it("owns metadata and default options", () => {
    expect(SessionStartWidget.type).toBe("session-start");
    expect(SessionStartWidget.label).toBe("Session Start");
    expect(SessionStartWidget.category).toBe("Session");
    expect(SessionStartWidget.description).toBe("First session entry time");
    expect(SessionStartWidget.dependencies).toEqual(["metrics"]);
    expect(SessionStartWidget.baseOptionDefaults).toEqual({ text: "" });
    expect(SessionStartWidget.icons).toEqual({ emoji: "🚀", nerd: "󱑂", text: "started" });
    expect(SessionStartWidget.defaultStyle).toEqual({ fg: "yellow", bg: "default", bold: false });
    const widget = sessionStart();
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
    expect(registry.spec(widget.type)).toBe(SessionStartWidget);
  });

  it("renders labels, raw output, custom icons, minimalist output, and empty timestamp behavior", () => {
    expect(sessionStart().render(ctx())).toBe(`started ${renderedStartTime}`);
    expect(sessionStart({ raw: true }).render(ctx())).toBe(renderedStartTime);
    expect(sessionStart({ icon: "S=" }).render(ctx())).toBe(`S=${renderedStartTime}`);
    expect(sessionStart().render(ctx({ minimalist: true }))).toBe(renderedStartTime);
    expect(
      sessionStart().render(ctx({ metrics: { ...metrics, firstTimestampMs: undefined } })),
    ).toBe("started ");
    expect(
      sessionStart({ text: "missing" }).render(
        ctx({ metrics: { ...metrics, firstTimestampMs: undefined } }),
      ),
    ).toBe("started missing");
    expect(
      sessionStart({ hideWhenEmpty: true }).render(
        ctx({ metrics: { ...metrics, firstTimestampMs: undefined } }),
      ),
    ).toBeUndefined();
  });

  it("exposes metadata fields and summaries", () => {
    expect(fieldsForWidget(sessionStart()).map((field) => field.id)).toEqual([
      "enabled",
      "raw",
      "hideWhenEmpty",
      "icon",
      "text",
    ]);
    expect(fieldsForWidget(sessionStart({ hideWhenEmpty: true })).map((field) => field.id)).toEqual(
      ["enabled", "raw", "hideWhenEmpty", "icon"],
    );
    expect(formatWidgetOptions(sessionStart())).toBe("");
    expect(formatWidgetOptions(sessionStart({ raw: true }))).toBe("raw");
    expect(formatWidgetOptions(sessionStart({ hideWhenEmpty: true }))).toBe("hide-empty");
    expect(formatWidgetOptions(sessionStart({ text: "missing" }))).toBe("text='missing'");
    expect(formatWidgetOptions(sessionStart({ icon: "S=" }))).toBe("icon='S='");
    expect(formatWidgetOptions(sessionStart({ raw: true, icon: "S=" }))).toBe("raw • icon='S='");
    expect(formatWidgetColorOptions(sessionStart({ fg: "red", bold: true }))).toBe("fg=Red • bold");
  });

  it("normalizes config through metadata", () => {
    expect(
      normalizeConfig({
        lines: [
          [{ type: "session-start", options: { raw: true, hideWhenEmpty: true, icon: "S=" } }],
        ],
      }).lines[0]?.[0]?.options,
    ).toMatchObject({
      raw: true,
      hideWhenEmpty: true,
      icon: "S=",
    });
    expect(
      normalizeConfig({
        lines: [
          [
            {
              type: "session-start",
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
        lines: [[{ type: "session-start" }]],
      }),
    );

    expect(renderStatuslines(store, statuslineData, 200)).toEqual([`started ${renderedStartTime}`]);
  });
});
