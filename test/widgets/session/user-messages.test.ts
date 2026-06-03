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
import { UserMessagesWidget } from "../../../src/widgets/session/user-messages.js";
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

function userMessages(options: WidgetOptions = {}) {
  return registry.createWidget("user-messages", options);
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

describe("UserMessagesWidget", () => {
  it("owns metadata and default options", () => {
    expect(UserMessagesWidget.type).toBe("user-messages");
    expect(UserMessagesWidget.label).toBe("User Messages");
    expect(UserMessagesWidget.category).toBe("Session");
    expect(UserMessagesWidget.description).toBe("User message count");
    expect(UserMessagesWidget.dependencies).toEqual(["metrics"]);
    expect(UserMessagesWidget.baseOptionDefaults).toEqual({});
    expect(UserMessagesWidget.icons).toEqual({ emoji: "👤", nerd: "", text: "user" });
    expect(UserMessagesWidget.defaultStyle).toEqual({ fg: "blue", bg: "default", bold: false });
    expect(registry.createEntry("user-messages").options).toEqual({
      raw: false,
      hideWhenZero: false,
      text: "-",
      icon: "",
      fg: "blue",
      bg: "default",
      bold: false,
    });
    const widget = userMessages();
    expect(widget).toBeInstanceOf(WidgetInstance);
    expect(registry.spec(widget.type)).toBe(UserMessagesWidget);
  });

  it("renders labels, raw output, custom icons, minimalist output, text option, and zero counts", () => {
    expect(userMessages().render(ctx())).toBe("user 2");
    expect(userMessages({ raw: true }).render(ctx())).toBe("2");
    expect(userMessages({ icon: "U=" }).render(ctx())).toBe("U=2");
    expect(userMessages({ text: "none" }).render(ctx())).toBe("user 2");
    expect(userMessages().render(ctx({ minimalist: true }))).toBe("2");
    expect(userMessages().render(ctx({ metrics: { ...metrics, userMessages: 0 } }))).toBe("user 0");
    expect(
      userMessages({ text: "none" }).render(ctx({ metrics: { ...metrics, userMessages: 0 } })),
    ).toBe("user 0");
    expect(
      userMessages({ hideWhenZero: true }).render(
        ctx({ metrics: { ...metrics, userMessages: 0 } }),
      ),
    ).toBeUndefined();
  });

  it("exposes metadata fields and summaries", () => {
    expect(fieldsForWidget(userMessages()).map((field) => field.id)).toEqual([
      "enabled",
      "raw",
      "hideWhenZero",
      "icon",
      "text",
    ]);
    expect(formatWidgetOptions(userMessages())).toBe("text='-'");
    expect(formatWidgetOptions(userMessages({ raw: true }))).toBe("raw • text='-'");
    expect(formatWidgetOptions(userMessages({ icon: "U=" }))).toBe("icon='U=' • text='-'");
    expect(formatWidgetOptions(userMessages({ hideWhenZero: true }))).toBe("hide-zero • text='-'");
    expect(formatWidgetOptions(userMessages({ text: "none" }))).toBe("text='none'");
    expect(formatWidgetOptions(userMessages({ raw: true, icon: "U=" }))).toBe(
      "raw • icon='U=' • text='-'",
    );
    expect(formatWidgetColorOptions(userMessages({ fg: "red", bold: true }))).toBe(
      "text='-' • fg=Red • bold",
    );
    expect(formatWidgetColorOptions(userMessages({ text: "none", fg: "red" }))).toBe(
      "text='none' • fg=Red",
    );
  });

  it("normalizes config through metadata", () => {
    expect(
      normalizeConfig({
        lines: [
          [
            {
              type: "user-messages",
              options: { raw: true, hideWhenZero: true, text: "none", icon: "U=" },
            },
          ],
        ],
      }).lines[0]?.[0]?.options,
    ).toMatchObject({
      raw: true,
      hideWhenZero: true,
      text: "none",
      icon: "U=",
    });
    expect(
      normalizeConfig({
        lines: [
          [
            {
              type: "user-messages",
              options: { raw: "yes", hideWhenZero: "yes", text: 5, icon: 7 },
            },
          ],
        ],
      }).lines[0]?.[0]?.options,
    ).toEqual({
      raw: false,
      hideWhenZero: false,
      text: "-",
      icon: "",
      fg: "blue",
      bg: "default",
      bold: false,
    });
  });

  it("receives metrics through the production store render path", () => {
    const store = WidgetStore.fromConfig(
      normalizeConfig({
        terminal: { colorLevel: "none" },
        iconMode: "text",
        lines: [[{ type: "user-messages" }]],
      }),
    );

    expect(renderStatuslines(store, statuslineData, 200)).toEqual(["user 2"]);
  });
});
