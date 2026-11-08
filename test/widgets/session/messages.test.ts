import { describe, expect, it } from "vitest";

import { normalizeConfig } from "../../../src/config.ts";
import { renderStatuslines } from "../../../src/render.ts";
import { makeStatuslineData } from "../../helpers/render.ts";
import type { SessionMetrics, WidgetOptions } from "../../../src/types.ts";
import {
  fieldsForWidget,
  formatWidgetColorOptions,
  formatWidgetOptions,
} from "../../../src/ui/fields.ts";
import { MessagesWidget } from "../../../src/widgets/session/messages.ts";
import { WidgetInstance } from "../../../src/widgets/instance.ts";
import { registry } from "../../../src/widgets/registry.ts";
import { WidgetStore } from "../../../src/widgets/store.ts";
import type { WidgetContext } from "../../../src/widgets/types.ts";

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

function messages(options: WidgetOptions = {}) {
  return registry.createWidget("messages", options);
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

describe("MessagesWidget", () => {
  it("owns metadata and default options", () => {
    expect(MessagesWidget.type).toBe("messages");
    expect(MessagesWidget.label).toBe("Message Counts");
    expect(MessagesWidget.category).toBe("Session");
    expect(MessagesWidget.description).toBe("User/assistant/tool message counts");
    expect(MessagesWidget.dependencies).toEqual(["metrics"]);
    expect(MessagesWidget.baseOptionDefaults).toEqual({});
    expect(MessagesWidget.icons).toEqual({ emoji: "💬", nerd: "󰭻", text: "msg" });
    expect(MessagesWidget.defaultStyle).toEqual({ fg: "cyan", bg: "default", bold: false });
    expect(registry.createEntry("messages").options).toEqual({
      raw: false,
      icon: "",
      fg: "cyan",
      bg: "default",
      bold: false,
    });
    const widget = messages();
    expect(widget).toBeInstanceOf(WidgetInstance);
    expect(registry.spec(widget.type)).toBe(MessagesWidget);
  });

  it("renders labels, raw output, custom icons, minimalist output, and zero counts", () => {
    expect(messages().render(ctx())).toBe("msg 2u/4a/3t");
    expect(messages({ raw: true }).render(ctx())).toBe("2u/4a/3t");
    expect(messages({ icon: "M=" }).render(ctx())).toBe("M=2u/4a/3t");
    expect(messages().render(ctx({ minimalist: true }))).toBe("2u/4a/3t");
    expect(
      messages().render(
        ctx({ metrics: { ...metrics, userMessages: 0, assistantMessages: 0, toolResults: 0 } }),
      ),
    ).toBe("msg 0u/0a/0t");
  });

  it("exposes metadata fields and summaries", () => {
    expect(fieldsForWidget(messages()).map((field) => field.id)).toEqual([
      "enabled",
      "raw",
      "icon",
    ]);
    expect(formatWidgetOptions(messages())).toBe("");
    expect(formatWidgetOptions(messages({ raw: true }))).toBe("raw");
    expect(formatWidgetOptions(messages({ icon: "M=" }))).toBe("icon='M='");
    expect(formatWidgetOptions(messages({ raw: true, icon: "M=" }))).toBe("raw • icon='M='");
    expect(formatWidgetColorOptions(messages({ fg: "red", bold: true }))).toBe("fg=Red • bold");
  });

  it("normalizes config through metadata", () => {
    expect(
      normalizeConfig({
        lines: [[{ type: "messages", options: { raw: true, icon: "M=" } }]],
      }).lines[0]?.[0]?.options,
    ).toMatchObject({
      raw: true,
      icon: "M=",
    });
    expect(
      normalizeConfig({
        lines: [[{ type: "messages", options: { raw: "yes", icon: 7, hideWhenZero: true } }]],
      }).lines[0]?.[0]?.options,
    ).toEqual({
      raw: false,
      icon: "",
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
        lines: [[{ type: "messages" }]],
      }),
    );

    expect(renderStatuslines(store, statuslineData, 200)).toEqual(["msg 2u/4a/3t"]);
  });
});
