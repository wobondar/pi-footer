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
import { WidgetStore } from "../../../src/widgets/store.js";
import { TotalMessagesWidget } from "../../../src/widgets/session/total-messages.js";
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

function totalMessages(options: WidgetOptions = {}) {
  return registry.createWidget("total-messages", options);
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

describe("TotalMessagesWidget", () => {
  it("owns metadata and default options", () => {
    expect(TotalMessagesWidget.type).toBe("total-messages");
    expect(TotalMessagesWidget.label).toBe("Total Messages");
    expect(TotalMessagesWidget.category).toBe("Session");
    expect(TotalMessagesWidget.description).toBe("Total message count");
    expect(TotalMessagesWidget.dependencies).toEqual(["metrics"]);
    expect(TotalMessagesWidget.baseOptionDefaults).toEqual({});
    expect(TotalMessagesWidget.icons).toEqual({ emoji: "💬", nerd: "󰭻", text: "messages" });
    expect(TotalMessagesWidget.defaultStyle).toEqual({ fg: "cyan", bg: "default", bold: false });
    expect(registry.createEntry("total-messages").options).toEqual({
      raw: false,
      hideWhenZero: false,
      icon: "",
      text: "-",
      fg: "cyan",
      bg: "default",
      bold: false,
    });
    const widget = totalMessages();
    expect(widget).toBeInstanceOf(WidgetInstance);
    expect(registry.spec(widget.type)).toBe(TotalMessagesWidget);
  });

  it("renders labels, raw output, custom icons, minimalist output, text option, and zero counts", () => {
    const zeroMetrics = { ...metrics, userMessages: 0, assistantMessages: 0, toolResults: 0 };

    expect(totalMessages().render(ctx())).toBe("messages 9");
    expect(totalMessages({ raw: true }).render(ctx())).toBe("9");
    expect(totalMessages({ icon: "Σ=" }).render(ctx())).toBe("Σ=9");
    expect(totalMessages({ text: "none" }).render(ctx())).toBe("messages 9");
    expect(totalMessages().render(ctx({ minimalist: true }))).toBe("9");
    expect(totalMessages().render(ctx({ metrics: zeroMetrics }))).toBe("messages 0");
    expect(totalMessages({ text: "none" }).render(ctx({ metrics: zeroMetrics }))).toBe(
      "messages 0",
    );
    expect(totalMessages({ hideWhenZero: true }).render(ctx({ metrics: zeroMetrics }))).toBe(
      undefined,
    );
  });

  it("exposes metadata fields and summaries", () => {
    expect(fieldsForWidget(totalMessages()).map((field) => field.id)).toEqual([
      "enabled",
      "raw",
      "hideWhenZero",
      "icon",
      "text",
    ]);
    expect(formatWidgetOptions(totalMessages())).toBe("text='-'");
    expect(formatWidgetOptions(totalMessages({ raw: true }))).toBe("raw • text='-'");
    expect(formatWidgetOptions(totalMessages({ icon: "Σ=" }))).toBe("icon='Σ=' • text='-'");
    expect(formatWidgetOptions(totalMessages({ hideWhenZero: true }))).toBe("hide-zero • text='-'");
    expect(formatWidgetOptions(totalMessages({ text: "none" }))).toBe("text='none'");
    expect(formatWidgetOptions(totalMessages({ raw: true, icon: "Σ=" }))).toBe(
      "raw • icon='Σ=' • text='-'",
    );
    expect(formatWidgetColorOptions(totalMessages({ fg: "red", bold: true }))).toBe(
      "text='-' • fg=Red • bold",
    );
    expect(formatWidgetColorOptions(totalMessages({ text: "none", fg: "red" }))).toBe(
      "text='none' • fg=Red",
    );
  });

  it("normalizes config through metadata", () => {
    expect(
      normalizeConfig({
        lines: [
          [
            {
              type: "total-messages",
              options: { raw: true, hideWhenZero: true, icon: "Σ=", text: "none" },
            },
          ],
        ],
      }).lines[0]?.[0]?.options,
    ).toMatchObject({
      raw: true,
      hideWhenZero: true,
      icon: "Σ=",
      text: "none",
    });
    expect(
      normalizeConfig({
        lines: [
          [
            {
              type: "total-messages",
              options: { raw: "yes", hideWhenZero: "yes", icon: 7, text: 5 },
            },
          ],
        ],
      }).lines[0]?.[0]?.options,
    ).toEqual({
      raw: false,
      hideWhenZero: false,
      icon: "",
      text: "-",
      fg: "cyan",
      bg: "default",
      bold: false,
    });
  });

  it("receives metrics through the production store render path", () => {
    const store = WidgetStore.fromConfig(
      normalizeConfig({
        terminal: { colorLevel: "none" },
        iconMode: "text",
        lines: [[{ type: "total-messages" }]],
      }),
    );

    expect(renderStatuslines(store, statuslineData, 200)).toEqual(["messages 9"]);
  });
});
