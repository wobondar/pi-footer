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
import { TextVerbosityWidget } from "../../../src/widgets/core/text-verbosity.js";
import { WidgetInstance } from "../../../src/widgets/instance.js";
import { registry } from "../../../src/widgets/registry.js";
import { WidgetStore } from "../../../src/widgets/store.js";
import type { WidgetContext } from "../../../src/widgets/types.js";

function textVerbosity(options: WidgetOptions = {}) {
  return registry.createWidget("text-verbosity", options);
}

function ctx(overrides: Partial<WidgetContext<["textVerbosity"]>> = {}) {
  return {
    iconMode: "text",
    minimalist: false,
    colorLevel: "none",
    textVerbosity: "medium",
    ...overrides,
  } satisfies WidgetContext<["textVerbosity"]>;
}

const statuslineData = makeStatuslineData({ textVerbosity: "verbose" });

describe("TextVerbosityWidget", () => {
  it("owns metadata and default options", () => {
    expect(TextVerbosityWidget.dependencies).toEqual(["textVerbosity"]);
    expect(TextVerbosityWidget.baseOptions).toEqual(["raw", "hideWhenEmpty", "icon", "text"]);
    expect(TextVerbosityWidget.icons).toEqual({ emoji: "📝", nerd: "󰉿", text: "verbosity" });
    expect(TextVerbosityWidget.defaultStyle).toEqual({
      fg: "cyan",
      bg: "default",
      bold: false,
    });
    expect(TextVerbosityWidget.baseOptionDefaults).toEqual({ text: "" });
    expect(registry.createEntry("text-verbosity").options).toEqual({
      raw: false,
      hideWhenEmpty: false,
      icon: "",
      text: "",
      fg: "cyan",
      bg: "default",
      bold: false,
    });
    const widget = textVerbosity();
    expect(widget).toBeInstanceOf(WidgetInstance);
    expect(registry.spec(widget.type)).toBe(TextVerbosityWidget);
  });

  it("renders labels, icons, raw/minimalist values, fallbacks, hiding, and styles", () => {
    expect(textVerbosity().render(ctx())).toBe("verbosity medium");
    expect(textVerbosity().render(ctx({ iconMode: "emoji" }))).toBe("📝 medium");
    expect(textVerbosity({ raw: true }).render(ctx())).toBe("medium");
    expect(textVerbosity().render(ctx({ minimalist: true }))).toBe("medium");
    expect(textVerbosity({ icon: "V=" }).render(ctx())).toBe("V=medium");
    expect(textVerbosity().render(ctx({ textVerbosity: undefined }))).toBe("verbosity ");
    expect(textVerbosity().render(ctx({ textVerbosity: "" }))).toBe("verbosity ");
    expect(textVerbosity({ raw: true }).render(ctx({ textVerbosity: undefined }))).toBe("");
    expect(textVerbosity({ hideWhenEmpty: true }).render(ctx({ textVerbosity: undefined }))).toBe(
      undefined,
    );
    expect(textVerbosity({ hideWhenEmpty: true }).render(ctx({ textVerbosity: "" }))).toBe(
      undefined,
    );
    expect(textVerbosity({ text: "auto" }).render(ctx({ textVerbosity: undefined }))).toBe(
      "verbosity auto",
    );
    expect(textVerbosity({ text: "auto" }).render(ctx({ textVerbosity: "" }))).toBe(
      "verbosity auto",
    );
    expect(
      textVerbosity({ raw: true, fg: "red", bold: true }).render(ctx({ colorLevel: "ansi16" })),
    ).toBe("\x1b[1m\x1b[31mmedium\x1b[39m\x1b[22m");
  });

  it("receives textVerbosity through production store rendering", () => {
    const normalized = normalizeConfig({
      ...DEFAULT_CONFIG,
      terminal: { ...DEFAULT_CONFIG.terminal, colorLevel: "none" },
      iconMode: "text",
      lines: [[{ id: "text-verbosity-1", type: "text-verbosity", options: { raw: true } }]],
    });
    const store = WidgetStore.fromConfig(normalized);

    expect(store.lines[0]?.[0]).toBeInstanceOf(WidgetInstance);
    expect(store.lines[0]?.[0]?.type).toBe(TextVerbosityWidget.type);
    expect(renderStatuslines(store, statuslineData, 200)[0]).toBe("verbose");
  });

  it("exposes metadata fields and summaries for supported base options", () => {
    const fields = fieldsForWidget(textVerbosity());
    expect(fields.map((field) => field.id)).toEqual([
      "enabled",
      "raw",
      "hideWhenEmpty",
      "icon",
      "text",
    ]);
    expect(
      fieldsForWidget(textVerbosity({ hideWhenEmpty: true })).map((field) => field.id),
    ).toEqual(["enabled", "raw", "hideWhenEmpty", "icon"]);
    expect(fieldValue(textVerbosity({ raw: true }), fields[1]!)).toBe("on");
    expect(getTextField(textVerbosity({ text: "auto" }), "text")).toBe("auto");
    expect(formatWidgetOptions(textVerbosity())).toBe("");
    expect(formatWidgetOptions(textVerbosity({ raw: true }))).toBe("raw");
    expect(formatWidgetOptions(textVerbosity({ hideWhenEmpty: true }))).toBe("hide-empty");
    expect(formatWidgetOptions(textVerbosity({ icon: "V=" }))).toBe("icon='V='");
    expect(formatWidgetOptions(textVerbosity({ text: "auto" }))).toBe("text='auto'");
    expect(formatWidgetOptions(textVerbosity({ hideWhenZero: true }))).toBe("");
    expect(
      formatWidgetColorOptions(textVerbosity({ text: "auto", fg: "red", bg: "blue", bold: true })),
    ).toBe("text='auto' • fg=Red • bg=Blue • bold");
  });

  it("normalizes config through metadata and hydrates through the store", () => {
    const normalized = normalizeConfig({
      ...DEFAULT_CONFIG,
      lines: [
        [
          {
            id: "text-verbosity-1",
            type: "text-verbosity",
            enabled: false,
            options: {
              raw: true,
              hideWhenEmpty: true,
              hideWhenZero: true,
              text: "auto",
              icon: "V=",
              fg: "pi:dim",
              bg: "ansi256:236",
              bold: true,
            },
          },
        ],
      ],
    });

    expect(normalized.lines[0]?.[0]).toEqual({
      id: "text-verbosity-1",
      type: "text-verbosity",
      enabled: false,
      options: {
        raw: true,
        hideWhenEmpty: true,
        icon: "V=",
        text: "auto",
        fg: "pi:dim",
        bg: "ansi256:236",
        bold: true,
      },
    });
    const widget = WidgetStore.fromConfig(normalized).lines[0]?.[0];
    expect(widget).toBeInstanceOf(WidgetInstance);
    expect(widget?.type).toBe(TextVerbosityWidget.type);

    expect(
      normalizeConfig({
        lines: [
          [
            {
              type: "text-verbosity",
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
