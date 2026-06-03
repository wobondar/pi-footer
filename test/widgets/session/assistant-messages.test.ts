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
import { AssistantMessagesWidget } from "../../../src/widgets/session/assistant-messages.js";
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

function assistantMessages(options: WidgetOptions = {}) {
  return registry.createWidget("assistant-messages", options);
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

describe("AssistantMessagesWidget", () => {
  it("owns metadata and default options", () => {
    expect(AssistantMessagesWidget.type).toBe("assistant-messages");
    expect(AssistantMessagesWidget.label).toBe("Assistant Messages");
    expect(AssistantMessagesWidget.category).toBe("Session");
    expect(AssistantMessagesWidget.description).toBe("Assistant message count");
    expect(AssistantMessagesWidget.dependencies).toEqual(["metrics"]);
    expect(AssistantMessagesWidget.baseOptionDefaults).toEqual({});
    expect(AssistantMessagesWidget.icons).toEqual({ emoji: "🤖", nerd: "󰚩", text: "assistant" });
    expect(AssistantMessagesWidget.defaultStyle).toEqual({
      fg: "white",
      bg: "default",
      bold: false,
    });
    expect(registry.createEntry("assistant-messages").options).toEqual({
      raw: false,
      hideWhenZero: false,
      icon: "",
      text: "-",
      fg: "white",
      bg: "default",
      bold: false,
    });
    const widget = assistantMessages();
    expect(widget).toBeInstanceOf(WidgetInstance);
    expect(registry.spec(widget.type)).toBe(AssistantMessagesWidget);
  });

  it("renders labels, raw output, custom icons, minimalist output, and zero counts", () => {
    expect(assistantMessages().render(ctx())).toBe("assistant 4");
    expect(assistantMessages({ raw: true }).render(ctx())).toBe("4");
    expect(assistantMessages({ icon: "A=" }).render(ctx())).toBe("A=4");
    expect(assistantMessages().render(ctx({ minimalist: true }))).toBe("4");
    expect(assistantMessages().render(ctx({ metrics: { ...metrics, assistantMessages: 0 } }))).toBe(
      "assistant 0",
    );
    expect(
      assistantMessages({ text: "none" }).render(
        ctx({ metrics: { ...metrics, assistantMessages: 0 } }),
      ),
    ).toBe("assistant 0");
    expect(
      assistantMessages({ hideWhenZero: true }).render(
        ctx({ metrics: { ...metrics, assistantMessages: 0 } }),
      ),
    ).toBeUndefined();
  });

  it("exposes metadata fields and summaries", () => {
    expect(fieldsForWidget(assistantMessages()).map((field) => field.id)).toEqual([
      "enabled",
      "raw",
      "hideWhenZero",
      "icon",
      "text",
    ]);
    expect(formatWidgetOptions(assistantMessages())).toBe("text='-'");
    expect(formatWidgetOptions(assistantMessages({ raw: true }))).toBe("raw • text='-'");
    expect(formatWidgetOptions(assistantMessages({ icon: "A=" }))).toBe("icon='A=' • text='-'");
    expect(formatWidgetOptions(assistantMessages({ hideWhenZero: true }))).toBe(
      "hide-zero • text='-'",
    );
    expect(formatWidgetOptions(assistantMessages({ text: "none" }))).toBe("text='none'");
    expect(formatWidgetOptions(assistantMessages({ raw: true, icon: "A=" }))).toBe(
      "raw • icon='A=' • text='-'",
    );
    expect(formatWidgetColorOptions(assistantMessages({ fg: "red", bold: true }))).toBe(
      "text='-' • fg=Red • bold",
    );
    expect(formatWidgetColorOptions(assistantMessages({ text: "none", fg: "red" }))).toBe(
      "text='none' • fg=Red",
    );
  });

  it("normalizes config through metadata", () => {
    expect(
      normalizeConfig({
        lines: [
          [
            {
              type: "assistant-messages",
              options: { raw: true, hideWhenZero: true, icon: "A=", text: "none" },
            },
          ],
        ],
      }).lines[0]?.[0]?.options,
    ).toMatchObject({
      raw: true,
      hideWhenZero: true,
      icon: "A=",
      text: "none",
    });
    expect(
      normalizeConfig({
        lines: [
          [
            {
              type: "assistant-messages",
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
      fg: "white",
      bg: "default",
      bold: false,
    });
  });

  it("receives metrics through the production store render path", () => {
    const store = WidgetStore.fromConfig(
      normalizeConfig({
        terminal: { colorLevel: "none" },
        iconMode: "text",
        lines: [[{ type: "assistant-messages" }]],
      }),
    );

    expect(renderStatuslines(store, statuslineData, 200)).toEqual(["assistant 4"]);
  });
});
