import { describe, expect, it } from "vitest";

import { DEFAULT_CONFIG, normalizeConfig } from "../../../src/config.js";
import { renderStatuslines } from "../../../src/render.js";
import { makeStatuslineData } from "../../helpers/render.js";
import type { WidgetOptions } from "../../../src/types.js";
import {
  fieldValue,
  fieldsForWidget,
  formatWidgetColorOptions,
  formatWidgetOptions,
  getTextField,
} from "../../../src/ui/fields.js";
import { ThinkingLevelWidget } from "../../../src/widgets/core/thinking-level.js";
import { WidgetInstance } from "../../../src/widgets/instance.js";
import { registry } from "../../../src/widgets/registry.js";
import { WidgetStore } from "../../../src/widgets/store.js";
import type { WidgetContext } from "../../../src/widgets/types.js";

function thinkingLevel(options: WidgetOptions = {}) {
  return registry.createWidget("thinking-level", options);
}

function ctx(overrides: Partial<WidgetContext<["thinkingLevel"]>> = {}) {
  return {
    iconMode: "text",
    minimalist: false,
    colorLevel: "none",
    thinkingLevel: "high",
    ...overrides,
  } satisfies WidgetContext<["thinkingLevel"]>;
}

const statuslineData = makeStatuslineData();

describe("ThinkingLevelWidget", () => {
  it("owns metadata and default options", () => {
    expect(ThinkingLevelWidget.dependencies).toEqual(["thinkingLevel"]);
    expect(ThinkingLevelWidget.baseOptions).toEqual(["raw", "hideWhenEmpty", "icon", "text"]);
    expect(ThinkingLevelWidget.icons).toEqual({ emoji: "🧠", nerd: "󰈈", text: "thinking" });
    expect(ThinkingLevelWidget.defaultStyle).toEqual({
      fg: "magenta",
      bg: "default",
      bold: false,
    });
    expect(ThinkingLevelWidget.baseOptionDefaults).toEqual({ text: "" });
    expect(registry.createEntry("thinking-level").options).toEqual({
      raw: false,
      hideWhenEmpty: false,
      icon: "",
      text: "",
      fg: "magenta",
      bg: "default",
      bold: false,
    });
    const widget = thinkingLevel();
    expect(widget).toBeInstanceOf(WidgetInstance);
    expect(registry.spec(widget.type)).toBe(ThinkingLevelWidget);
  });

  it("renders labels, icons, raw/minimalist values, fallbacks, hiding, and styles", () => {
    expect(thinkingLevel().render(ctx())).toBe("thinking high");
    expect(thinkingLevel().render(ctx({ iconMode: "emoji" }))).toBe("🧠 high");
    expect(thinkingLevel({ raw: true }).render(ctx())).toBe("high");
    expect(thinkingLevel().render(ctx({ minimalist: true }))).toBe("high");
    expect(thinkingLevel({ icon: "T=" }).render(ctx())).toBe("T=high");
    expect(thinkingLevel().render(ctx({ thinkingLevel: undefined }))).toBe("thinking ");
    expect(thinkingLevel().render(ctx({ thinkingLevel: "" }))).toBe("thinking ");
    expect(thinkingLevel({ raw: true }).render(ctx({ thinkingLevel: undefined }))).toBe("");
    expect(thinkingLevel({ hideWhenEmpty: true }).render(ctx({ thinkingLevel: undefined }))).toBe(
      undefined,
    );
    expect(thinkingLevel({ hideWhenEmpty: true }).render(ctx({ thinkingLevel: "" }))).toBe(
      undefined,
    );
    expect(thinkingLevel({ text: "unknown" }).render(ctx({ thinkingLevel: undefined }))).toBe(
      "thinking unknown",
    );
    expect(thinkingLevel({ text: "unknown" }).render(ctx({ thinkingLevel: "" }))).toBe(
      "thinking unknown",
    );
    expect(
      thinkingLevel({ raw: true, fg: "red", bold: true }).render(ctx({ colorLevel: "ansi16" })),
    ).toBe("\x1b[1m\x1b[31mhigh\x1b[39m\x1b[22m");
  });

  it("receives thinkingLevel through production store rendering", () => {
    const normalized = normalizeConfig({
      ...DEFAULT_CONFIG,
      terminal: { ...DEFAULT_CONFIG.terminal, colorLevel: "none" },
      iconMode: "text",
      lines: [[{ id: "thinking-level-1", type: "thinking-level", options: { raw: true } }]],
    });
    const store = WidgetStore.fromConfig(normalized);

    expect(store.lines[0]?.[0]).toBeInstanceOf(WidgetInstance);
    expect(store.lines[0]?.[0]?.type).toBe(ThinkingLevelWidget.type);
    expect(renderStatuslines(store, statuslineData, 200)[0]).toBe("high");
  });

  it("exposes metadata fields and summaries for supported base options", () => {
    const fields = fieldsForWidget(thinkingLevel());
    expect(fields.map((field) => field.id)).toEqual([
      "enabled",
      "raw",
      "hideWhenEmpty",
      "icon",
      "text",
    ]);
    expect(
      fieldsForWidget(thinkingLevel({ hideWhenEmpty: true })).map((field) => field.id),
    ).toEqual(["enabled", "raw", "hideWhenEmpty", "icon"]);
    expect(fieldValue(thinkingLevel({ raw: true }), fields[1]!)).toBe("on");
    expect(getTextField(thinkingLevel({ text: "unknown" }), "text")).toBe("unknown");
    expect(formatWidgetOptions(thinkingLevel())).toBe("");
    expect(formatWidgetOptions(thinkingLevel({ raw: true }))).toBe("raw");
    expect(formatWidgetOptions(thinkingLevel({ hideWhenEmpty: true }))).toBe("hide-empty");
    expect(formatWidgetOptions(thinkingLevel({ icon: "T=" }))).toBe("icon='T='");
    expect(formatWidgetOptions(thinkingLevel({ text: "unknown" }))).toBe("text='unknown'");
    expect(formatWidgetOptions(thinkingLevel({ hideWhenZero: true }))).toBe("");
    expect(
      formatWidgetColorOptions(
        thinkingLevel({ text: "unknown", fg: "red", bg: "blue", bold: true }),
      ),
    ).toBe("text='unknown' • fg=Red • bg=Blue • bold");
  });

  it("normalizes config through metadata and hydrates through the store", () => {
    const normalized = normalizeConfig({
      ...DEFAULT_CONFIG,
      lines: [
        [
          {
            id: "thinking-level-1",
            type: "thinking-level",
            enabled: false,
            options: {
              raw: true,
              hideWhenEmpty: true,
              hideWhenZero: true,
              text: "unknown",
              icon: "T=",
              fg: "pi:dim",
              bg: "ansi256:236",
              bold: true,
            },
          },
        ],
      ],
    });

    expect(normalized.lines[0]?.[0]).toEqual({
      id: "thinking-level-1",
      type: "thinking-level",
      enabled: false,
      options: {
        raw: true,
        hideWhenEmpty: true,
        icon: "T=",
        text: "unknown",
        fg: "pi:dim",
        bg: "ansi256:236",
        bold: true,
      },
    });
    const widget = WidgetStore.fromConfig(normalized).lines[0]?.[0];
    expect(widget).toBeInstanceOf(WidgetInstance);
    expect(widget?.type).toBe(ThinkingLevelWidget.type);

    expect(
      normalizeConfig({
        lines: [
          [
            {
              type: "thinking-level",
              options: {
                raw: "yes",
                hideWhenEmpty: "yes",
                hideWhenZero: true,
                text: 12,
                icon: false,
                fg: "not-a-color",
                bg: 123,
                bold: "true",
                showProvider: true,
              },
            },
          ],
        ],
      }).lines[0]?.[0]?.options,
    ).toEqual({
      raw: false,
      hideWhenEmpty: false,
      icon: "",
      text: "",
      bold: false,
    });
  });
});
