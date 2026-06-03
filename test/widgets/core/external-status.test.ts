import { describe, expect, it } from "vitest";

import { normalizeConfig } from "../../../src/config.js";
import { renderStatuslines } from "../../../src/render.js";
import { makeStatuslineData } from "../../helpers/render.js";
import type { WidgetOptions } from "../../../src/types.js";
import { applyOptionField } from "../../../src/ui/option-edit.js";
import {
  fieldsForWidget,
  formatWidgetColorOptions,
  formatWidgetOptions,
} from "../../../src/ui/fields.js";
import { ExtensionStatusWidget } from "../../../src/widgets/core/external-status.js";
import { WidgetInstance } from "../../../src/widgets/instance.js";
import { registry } from "../../../src/widgets/registry.js";
import { WidgetStore } from "../../../src/widgets/store.js";
import type { WidgetContext } from "../../../src/widgets/types.js";

function extensionStatus(options: WidgetOptions = {}) {
  return registry.createWidget("external-status", options);
}

function ctx(overrides: Partial<WidgetContext<["getExtensionStatuses"]>> = {}) {
  return {
    iconMode: "text",
    minimalist: false,
    colorLevel: "none",
    getExtensionStatuses: () => new Map([["pi-codex-fast", "fast"]]),
    ...overrides,
  } satisfies WidgetContext<["getExtensionStatuses"]>;
}

const statuslineData = makeStatuslineData();

describe("ExtensionStatusWidget", () => {
  it("owns metadata and default options", () => {
    expect(ExtensionStatusWidget.type).toBe("external-status");
    expect(ExtensionStatusWidget.label).toBe("Extension Status");
    expect(ExtensionStatusWidget.category).toBe("Core");
    expect(ExtensionStatusWidget.description).toBe(
      "Status value published by another pi extension through ctx.ui.setStatus",
    );
    expect(ExtensionStatusWidget.dependencies).toEqual(["getExtensionStatuses"]);
    expect(ExtensionStatusWidget.baseOptions).toEqual(["raw", "hideWhenEmpty", "icon", "text"]);
    expect(ExtensionStatusWidget.baseOptionDefaults).toEqual({ hideWhenEmpty: true });
    expect(ExtensionStatusWidget.icons).toEqual({ emoji: "", nerd: "", text: "" });
    expect(ExtensionStatusWidget.defaultStyle).toEqual({
      fg: "default",
      bg: "default",
      bold: false,
    });
    const widget = extensionStatus();
    expect(widget.options).toEqual({
      raw: false,
      hideWhenEmpty: true,
      icon: "",
      text: "-",
      externalStatusKey: "",
      trimValue: 0,
      preserveTrimStyles: true,
      fg: "default",
      bg: "default",
      bold: false,
    });
    expect(widget).toBeInstanceOf(WidgetInstance);
    expect(registry.spec(widget.type)).toBe(ExtensionStatusWidget);
  });

  it("renders values, missing fallbacks, custom icons, raw values, and empty keys", () => {
    expect(extensionStatus({ externalStatusKey: "pi-codex-fast" }).render(ctx())).toBe("fast");
    expect(extensionStatus({ externalStatusKey: "pi-codex-fast", icon: "⚡" }).render(ctx())).toBe(
      "⚡fast",
    );
    expect(
      extensionStatus({ externalStatusKey: "pi-codex-fast", raw: true, icon: "⚡" }).render(ctx()),
    ).toBe("fast");
    expect(extensionStatus({ externalStatusKey: "missing" }).render(ctx())).toBeUndefined();
    expect(
      extensionStatus({
        externalStatusKey: "missing",
        hideWhenEmpty: false,
        text: "not set",
      }).render(ctx()),
    ).toBe("not set");
    expect(
      extensionStatus({ externalStatusKey: "  ", hideWhenEmpty: false }).render(
        ctx({
          getExtensionStatuses: () => {
            throw new Error("should not read statuses for an empty key");
          },
        }),
      ),
    ).toBe("-");
  });

  it("trims leading visible characters and preserves ANSI styles", () => {
    const statuses = new Map([
      ["enabled", "● Enabled"],
      ["styled", "\x1b[33m● Enabled\x1b[39m"],
      ["split", "\x1b[31m●\x1b[39m \x1b[32mEnabled\x1b[39m"],
    ]);

    expect(
      extensionStatus({ externalStatusKey: "enabled", trimValue: 2 }).render(
        ctx({ getExtensionStatuses: () => statuses }),
      ),
    ).toBe("Enabled");
    expect(
      extensionStatus({ externalStatusKey: "styled", trimValue: 2 }).render(
        ctx({ getExtensionStatuses: () => statuses }),
      ),
    ).toBe("\x1b[33mEnabled\x1b[39m");
    expect(
      extensionStatus({ externalStatusKey: "styled", trimValue: 2, icon: "⚔︎ " }).render(
        ctx({ getExtensionStatuses: () => statuses }),
      ),
    ).toBe("\x1b[33m⚔︎ Enabled\x1b[39m");
    expect(
      extensionStatus({
        externalStatusKey: "styled",
        trimValue: 2,
        preserveTrimStyles: false,
      }).render(ctx({ getExtensionStatuses: () => statuses })),
    ).toBe("Enabled\x1b[39m");
    expect(
      extensionStatus({ externalStatusKey: "split", trimValue: 2 }).render(
        ctx({ getExtensionStatuses: () => statuses }),
      ),
    ).toContain("\x1b[32mEnabled\x1b[39m");
  });

  it("preserves incoming styling unless widget colors override it", () => {
    const statuses = new Map([["styled", "\x1b[31mfast\x1b[39m"]]);

    expect(
      extensionStatus({ externalStatusKey: "styled" }).render(
        ctx({ getExtensionStatuses: () => statuses, colorLevel: "ansi16" }),
      ),
    ).toBe("\x1b[31mfast\x1b[39m");
    expect(
      extensionStatus({ externalStatusKey: "styled", fg: "blue" }).render(
        ctx({ getExtensionStatuses: () => statuses, colorLevel: "ansi16" }),
      ),
    ).toBe("\x1b[34mfast\x1b[39m");
  });

  it("exposes metadata fields, summaries, and edit actions", () => {
    expect(fieldsForWidget(extensionStatus({ externalStatusKey: "pi-codex-fast" }))).toMatchObject([
      { id: "enabled" },
      { id: "raw" },
      { id: "hideWhenEmpty" },
      { id: "icon" },
      { id: "externalStatusKey", editAction: "external-status-key" },
      { id: "trimValue" },
      { id: "preserveTrimStyles" },
    ]);
    expect(
      fieldsForWidget(
        extensionStatus({ externalStatusKey: "pi-codex-fast", hideWhenEmpty: false }),
      ).map((field) => field.id),
    ).toEqual([
      "enabled",
      "raw",
      "hideWhenEmpty",
      "icon",
      "text",
      "externalStatusKey",
      "trimValue",
      "preserveTrimStyles",
    ]);
    expect(formatWidgetOptions(extensionStatus({ externalStatusKey: "pi-codex-fast" }))).toBe(
      "hide-empty • status=pi-codex-fast • trim=0",
    );
    expect(
      formatWidgetOptions(
        extensionStatus({
          externalStatusKey: "pi-codex-fast",
          raw: true,
          icon: "S=",
          trimValue: 2,
        }),
      ),
    ).toBe("raw • hide-empty • icon='S=' • status=pi-codex-fast • trim=2");
    expect(
      formatWidgetColorOptions(extensionStatus({ externalStatusKey: "pi-codex-fast", fg: "red" })),
    ).toBe("hide-empty • status=pi-codex-fast • fg=Red");
    expect(
      applyOptionField(
        extensionStatus({ externalStatusKey: "pi-codex-fast" }),
        {
          id: "externalStatusKey",
          label: "Status key",
          kind: "text",
          editAction: "external-status-key",
        },
        1,
      ),
    ).toBe("external-status-key");
  });

  it("normalizes config and hydrates store entries through metadata", () => {
    expect(
      normalizeConfig({
        lines: [
          [
            {
              type: "external-status",
              options: { externalStatusKey: "build", trimValue: 20, preserveTrimStyles: false },
            },
          ],
        ],
      }).lines[0]?.[0]?.options,
    ).toMatchObject({ externalStatusKey: "build", trimValue: 10, preserveTrimStyles: false });
    expect(
      normalizeConfig({
        lines: [
          [
            {
              type: "external-status",
              options: { externalStatusKey: 1, trimValue: "2", preserveTrimStyles: "no" },
            },
          ],
        ],
      }).lines[0]?.[0]?.options,
    ).toEqual({
      raw: false,
      hideWhenEmpty: true,
      icon: "",
      text: "-",
      fg: "default",
      bg: "default",
      bold: false,
      externalStatusKey: "",
      trimValue: 0,
      preserveTrimStyles: true,
    });

    const store = WidgetStore.fromConfig(
      normalizeConfig({
        lines: [[{ type: "external-status", options: { externalStatusKey: "build" } }]],
      }),
    );
    expect(store.lines[0]?.[0]).toBeInstanceOf(WidgetInstance);
    expect(store.lines[0]?.[0]?.type).toBe(ExtensionStatusWidget.type);
  });

  it("receives getExtensionStatuses through the production store render path", () => {
    const store = WidgetStore.fromConfig(
      normalizeConfig({
        terminal: { colorLevel: "none" },
        lines: [[{ type: "external-status", options: { externalStatusKey: "pi-codex-fast" } }]],
      }),
    );

    expect(
      renderStatuslines(store, statuslineData, 200, {
        getExtensionStatuses: () => new Map([["pi-codex-fast", "fast"]]),
      }),
    ).toEqual(["fast"]);
    expect(
      renderStatuslines(store, statuslineData, 200, { getExtensionStatuses: () => new Map() }),
    ).toEqual([]);
  });
});
