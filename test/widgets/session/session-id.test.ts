import { describe, expect, it } from "vitest";

import { normalizeConfig } from "../../../src/config.js";
import { renderStatuslines } from "../../../src/render.js";
import { makeStatuslineData } from "../../helpers/render.js";
import type { WidgetOptions } from "../../../src/types.js";
import {
  fieldsForWidget,
  formatWidgetColorOptions,
  formatWidgetOptions,
} from "../../../src/ui/fields.js";
import { WidgetInstance } from "../../../src/widgets/instance.js";
import { registry } from "../../../src/widgets/registry.js";
import { SessionIdWidget } from "../../../src/widgets/session/session-id.js";
import { WidgetStore } from "../../../src/widgets/store.js";
import type { WidgetContext } from "../../../src/widgets/types.js";

function sessionId(options: WidgetOptions = {}) {
  return registry.createWidget("session-id", options);
}

function ctx(overrides: Partial<WidgetContext<["sessionId"]>> = {}) {
  return {
    iconMode: "text",
    minimalist: false,
    colorLevel: "none",
    sessionId: "session-123",
    ...overrides,
  } satisfies WidgetContext<["sessionId"]>;
}

const statuslineData = makeStatuslineData();

describe("SessionIdWidget", () => {
  it("owns metadata and default options", () => {
    expect(SessionIdWidget.type).toBe("session-id");
    expect(SessionIdWidget.label).toBe("Session ID");
    expect(SessionIdWidget.category).toBe("Session");
    expect(SessionIdWidget.description).toBe("Current pi session id");
    expect(SessionIdWidget.dependencies).toEqual(["sessionId"]);
    expect(SessionIdWidget.baseOptionDefaults).toEqual({ text: "" });
    expect(SessionIdWidget.icons).toEqual({ emoji: "🆔", nerd: "󰈙", text: "session id" });
    expect(SessionIdWidget.defaultStyle).toEqual({ fg: "cyan", bg: "default", bold: false });
    const widget = sessionId();
    expect(widget.options).toEqual({
      raw: false,
      hideWhenEmpty: false,
      icon: "",
      text: "",
      fg: "cyan",
      bg: "default",
      bold: false,
    });
    expect(widget).toBeInstanceOf(WidgetInstance);
    expect(registry.spec(widget.type)).toBe(SessionIdWidget);
  });

  it("renders labels, raw output, custom icons, minimalist output, and empty fallbacks", () => {
    expect(sessionId().render(ctx())).toBe("session id session-123");
    expect(sessionId({ raw: true }).render(ctx())).toBe("session-123");
    expect(sessionId({ icon: "ID=" }).render(ctx())).toBe("ID=session-123");
    expect(sessionId().render(ctx({ minimalist: true }))).toBe("session-123");
    expect(sessionId().render(ctx({ sessionId: undefined }))).toBe("session id ");
    expect(sessionId({ text: "missing" }).render(ctx({ sessionId: undefined }))).toBe(
      "session id missing",
    );
    expect(
      sessionId({ hideWhenEmpty: true }).render(ctx({ sessionId: undefined })),
    ).toBeUndefined();
    expect(sessionId({ hideWhenEmpty: true }).render(ctx({ sessionId: "" }))).toBeUndefined();
  });

  it("exposes metadata fields and summaries", () => {
    expect(fieldsForWidget(sessionId()).map((field) => field.id)).toEqual([
      "enabled",
      "raw",
      "hideWhenEmpty",
      "icon",
      "text",
    ]);
    expect(fieldsForWidget(sessionId({ hideWhenEmpty: true })).map((field) => field.id)).toEqual([
      "enabled",
      "raw",
      "hideWhenEmpty",
      "icon",
    ]);
    expect(formatWidgetOptions(sessionId())).toBe("");
    expect(formatWidgetOptions(sessionId({ raw: true }))).toBe("raw");
    expect(formatWidgetOptions(sessionId({ hideWhenEmpty: true }))).toBe("hide-empty");
    expect(formatWidgetOptions(sessionId({ text: "missing" }))).toBe("text='missing'");
    expect(formatWidgetOptions(sessionId({ icon: "ID=" }))).toBe("icon='ID='");
    expect(formatWidgetOptions(sessionId({ raw: true, icon: "ID=" }))).toBe("raw • icon='ID='");
    expect(formatWidgetColorOptions(sessionId({ fg: "red", bold: true }))).toBe("fg=Red • bold");
  });

  it("normalizes config through metadata", () => {
    expect(
      normalizeConfig({
        lines: [
          [
            {
              type: "session-id",
              options: { raw: true, hideWhenEmpty: true, icon: "ID=", text: "missing" },
            },
          ],
        ],
      }).lines[0]?.[0]?.options,
    ).toMatchObject({
      raw: true,
      hideWhenEmpty: true,
      icon: "ID=",
      text: "missing",
    });
    expect(
      normalizeConfig({
        lines: [
          [
            {
              type: "session-id",
              options: { raw: "yes", hideWhenEmpty: "no", hideWhenZero: true, icon: 7, text: 8 },
            },
          ],
        ],
      }).lines[0]?.[0]?.options,
    ).toEqual({
      raw: false,
      hideWhenEmpty: false,
      icon: "",
      text: "",
      fg: "cyan",
      bg: "default",
      bold: false,
    });
  });

  it("receives sessionId through the production store render path", () => {
    const store = WidgetStore.fromConfig(
      normalizeConfig({
        terminal: { colorLevel: "none" },
        iconMode: "text",
        lines: [[{ type: "session-id" }]],
      }),
    );

    expect(renderStatuslines(store, statuslineData, 200)).toEqual(["session id session-123"]);
    expect(renderStatuslines(store, { ...statuslineData, sessionId: undefined }, 200)).toEqual([
      "session id ",
    ]);
    expect(
      renderStatuslines(
        WidgetStore.fromConfig(
          normalizeConfig({
            terminal: { colorLevel: "none" },
            iconMode: "text",
            lines: [[{ type: "session-id", options: { hideWhenEmpty: true } }]],
          }),
        ),
        { ...statuslineData, sessionId: undefined },
        200,
      ),
    ).toEqual([]);
  });
});
