import { describe, expect, it } from "vitest";

import { DEFAULT_CONFIG, normalizeConfig } from "../../../src/config.js";
import { renderStatuslines } from "../../../src/render.js";
import { makeStatuslineData } from "../../helpers/render.js";
import type { WidgetOptions } from "../../../src/types.js";
import {
  fieldsForWidget,
  formatWidgetColorOptions,
  formatWidgetOptions,
} from "../../../src/ui/fields.js";
import { ActiveToolsWidget } from "../../../src/widgets/core/active-tools.js";
import { WidgetInstance } from "../../../src/widgets/instance.js";
import { registry } from "../../../src/widgets/registry.js";
import { WidgetStore } from "../../../src/widgets/store.js";
import type { WidgetContext } from "../../../src/widgets/types.js";

function activeTools(options: WidgetOptions = {}) {
  return registry.createWidget("active-tools", options);
}

function ctx(overrides: Partial<WidgetContext<["activeToolCount"]>> = {}) {
  return {
    iconMode: "text",
    minimalist: false,
    colorLevel: "none",
    activeToolCount: 4,
    ...overrides,
  } satisfies WidgetContext<["activeToolCount"]>;
}

const data = makeStatuslineData({ activeToolCount: 4 });

describe("ActiveToolsWidget", () => {
  it("owns metadata and default options", () => {
    expect(ActiveToolsWidget.dependencies).toEqual(["activeToolCount"]);
    expect(ActiveToolsWidget.icons).toEqual({ emoji: "🛠️", nerd: "󰒓", text: "tools" });
    expect(ActiveToolsWidget.defaultStyle).toEqual({ fg: "yellow", bg: "default", bold: false });
    expect(ActiveToolsWidget.baseOptionDefaults).toEqual({ hideWhenZero: true });
    expect(registry.createEntry("active-tools").options).toEqual({
      raw: false,
      hideWhenZero: true,
      icon: "",
      text: "-",
      fg: "yellow",
      bg: "default",
      bold: false,
    });
    const widget = activeTools();
    expect(widget).toBeInstanceOf(WidgetInstance);
    expect(registry.spec(widget.type)).toBe(ActiveToolsWidget);
  });

  it("renders labels, custom icons, raw/minimalist values, zero counts, and styles", () => {
    expect(activeTools().render(ctx())).toBe("tools 4");
    expect(activeTools().render(ctx({ iconMode: "emoji" }))).toBe("🛠️ 4");
    expect(activeTools().render(ctx({ iconMode: "nerd" }))).toBe("󰒓 4");
    expect(activeTools({ icon: "T=" }).render(ctx())).toBe("T=4");
    expect(activeTools({ raw: true }).render(ctx())).toBe("4");
    expect(activeTools().render(ctx({ minimalist: true }))).toBe("4");
    expect(activeTools().render(ctx({ activeToolCount: 0 }))).toBeUndefined();
    expect(activeTools({ hideWhenZero: false }).render(ctx({ activeToolCount: 0 }))).toBe(
      "tools 0",
    );
    expect(
      activeTools({ hideWhenZero: false, text: "no tools" }).render(ctx({ activeToolCount: 0 })),
    ).toBe("tools 0");
    expect(
      activeTools({ raw: true, fg: "red", bold: true }).render(ctx({ colorLevel: "ansi16" })),
    ).toBe("\u001b[1m\u001b[31m4\u001b[39m\u001b[22m");
  });

  it("exposes metadata fields and base option summaries", () => {
    expect(fieldsForWidget(activeTools()).map((field) => field.id)).toEqual([
      "enabled",
      "raw",
      "hideWhenZero",
      "icon",
      "text",
    ]);
    expect(formatWidgetOptions(activeTools())).toBe("hide-zero • text='-'");
    expect(formatWidgetOptions(activeTools({ raw: true }))).toBe("raw • hide-zero • text='-'");
    expect(formatWidgetOptions(activeTools({ hideWhenZero: false }))).toBe("text='-'");
    expect(formatWidgetOptions(activeTools({ icon: "T=", text: "no tools" }))).toBe(
      "icon='T=' • hide-zero • text='no tools'",
    );
    expect(formatWidgetColorOptions(activeTools({ raw: true, icon: "T=" }))).toBe(
      "raw • icon='T=' • text='-'",
    );
    expect(formatWidgetColorOptions(activeTools({ fg: "red", bg: "blue", bold: true }))).toBe(
      "text='-' • fg=Red • bg=Blue • bold",
    );
  });

  it("normalizes config through metadata and hydrates through the store", () => {
    const normalized = normalizeConfig({
      ...DEFAULT_CONFIG,
      lines: [
        [
          {
            id: "active-tools-1",
            type: "active-tools",
            enabled: false,
            options: {
              raw: true,
              icon: "T=",
              fg: "pi:dim",
              bg: "ansi256:236",
              bold: true,
              text: "unused",
              hideWhenZero: false,
            },
          },
        ],
      ],
    });

    expect(normalized.lines[0]?.[0]).toEqual({
      id: "active-tools-1",
      type: "active-tools",
      enabled: false,
      options: {
        raw: true,
        hideWhenZero: false,
        icon: "T=",
        text: "unused",
        fg: "pi:dim",
        bg: "ansi256:236",
        bold: true,
      },
    });
    const widget = WidgetStore.fromConfig(normalized).lines[0]?.[0];
    expect(widget).toBeInstanceOf(WidgetInstance);
    expect(widget?.type).toBe(ActiveToolsWidget.type);

    expect(
      normalizeConfig({
        lines: [
          [
            {
              type: "active-tools",
              options: {
                raw: "yes",
                icon: false,
                fg: "not-a-color",
                bg: 123,
                bold: "true",
                text: 123,
                hideWhenEmpty: true,
                hideWhenZero: "yes",
              },
            },
          ],
        ],
      }).lines[0]?.[0]?.options,
    ).toEqual({
      raw: false,
      hideWhenZero: true,
      icon: "",
      text: "-",
      bold: false,
    });
  });

  it("renders through production statusline hydration with active tool data", () => {
    const store = WidgetStore.fromConfig({
      ...DEFAULT_CONFIG,
      iconMode: "text",
      terminal: { ...DEFAULT_CONFIG.terminal, colorLevel: "none" },
      lines: [[registry.createEntry("active-tools")]],
    });

    expect(renderStatuslines(store, data, 200)).toEqual(["tools 4"]);
    expect(renderStatuslines(store, { ...data, activeToolCount: 0 }, 200)).toEqual([]);

    const zeroVisibleStore = WidgetStore.fromConfig({
      ...DEFAULT_CONFIG,
      iconMode: "text",
      terminal: { ...DEFAULT_CONFIG.terminal, colorLevel: "none" },
      lines: [[registry.createEntry("active-tools", { hideWhenZero: false })]],
    });
    expect(renderStatuslines(zeroVisibleStore, { ...data, activeToolCount: 0 }, 200)).toEqual([
      "tools 0",
    ]);
  });
});
