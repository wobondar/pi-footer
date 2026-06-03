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
import { CwdBasenameWidget } from "../../../src/widgets/core/cwd-basename.js";
import { WidgetInstance } from "../../../src/widgets/instance.js";
import { registry } from "../../../src/widgets/registry.js";
import { WidgetStore } from "../../../src/widgets/store.js";
import type { WidgetContext } from "../../../src/widgets/types.js";

function cwdBasename(options: WidgetOptions = {}) {
  return registry.createWidget("cwd-basename", options);
}

function ctx(overrides: Partial<WidgetContext<["cwd"]>> = {}): WidgetContext<["cwd"]> {
  return {
    iconMode: "text",
    minimalist: false,
    colorLevel: "none",
    cwd: "/Users/example/projects/pi-footer",
    ...overrides,
  };
}

const statuslineData = makeStatuslineData({ cwd: "/Users/example/projects/pi-footer" });

describe("CwdBasenameWidget", () => {
  it("owns metadata and default options", () => {
    expect(CwdBasenameWidget.type).toBe("cwd-basename");
    expect(CwdBasenameWidget.label).toBe("Working Dir Name");
    expect(CwdBasenameWidget.category).toBe("Core");
    expect(CwdBasenameWidget.description).toBe("Current directory name");
    expect(CwdBasenameWidget.dependencies).toEqual(["cwd"]);
    expect(CwdBasenameWidget.baseOptionDefaults).toEqual({ text: "" });
    expect(CwdBasenameWidget.icons).toEqual({ emoji: "📂", nerd: "", text: "dir" });
    expect(CwdBasenameWidget.defaultStyle).toEqual({ fg: "blue", bg: "default", bold: false });
    expect(registry.createEntry("cwd-basename").options).toEqual({
      raw: false,
      hideWhenEmpty: false,
      icon: "",
      text: "",
      fg: "blue",
      bg: "default",
      bold: false,
    });
    const widget = cwdBasename();
    expect(widget).toBeInstanceOf(WidgetInstance);
    expect(registry.spec(widget.type)).toBe(CwdBasenameWidget);
  });

  it("exposes metadata fields and summaries", () => {
    expect(fieldsForWidget(cwdBasename()).map((field) => field.id)).toEqual([
      "enabled",
      "raw",
      "hideWhenEmpty",
      "icon",
      "text",
    ]);
    expect(fieldsForWidget(cwdBasename({ hideWhenEmpty: true })).map((field) => field.id)).toEqual([
      "enabled",
      "raw",
      "hideWhenEmpty",
      "icon",
    ]);
    expect(formatWidgetOptions(cwdBasename())).toBe("");
    expect(formatWidgetOptions(cwdBasename({ raw: true }))).toBe("raw");
    expect(formatWidgetOptions(cwdBasename({ hideWhenEmpty: true }))).toBe("hide-empty");
    expect(formatWidgetOptions(cwdBasename({ text: "root" }))).toBe("text='root'");
    expect(formatWidgetOptions(cwdBasename({ icon: "D=" }))).toBe("icon='D='");
    expect(formatWidgetColorOptions(cwdBasename({ raw: true, icon: "D=", fg: "green" }))).toBe(
      "raw • icon='D=' • fg=Green",
    );
  });

  it("renders labels, raw output, custom icons, minimalist output, and icon modes", () => {
    expect(cwdBasename().render(ctx())).toBe("dir pi-footer");
    expect(cwdBasename({ raw: true }).render(ctx())).toBe("pi-footer");
    expect(cwdBasename({ icon: "D=" }).render(ctx())).toBe("D=pi-footer");
    expect(cwdBasename().render(ctx({ minimalist: true }))).toBe("pi-footer");
    expect(cwdBasename().render(ctx({ iconMode: "emoji" }))).toBe("📂 pi-footer");
    expect(cwdBasename().render(ctx({ iconMode: "nerd" }))).toBe(" pi-footer");
  });

  it("renders the basename from different cwd shapes", () => {
    expect(cwdBasename({ raw: true }).render(ctx({ cwd: "/tmp/workspace" }))).toBe("workspace");
    expect(cwdBasename().render(ctx({ cwd: "/" }))).toBe("dir ");
    expect(cwdBasename({ raw: true }).render(ctx({ cwd: "/" }))).toBe("");
    expect(cwdBasename({ icon: "D=" }).render(ctx({ cwd: "/" }))).toBe("D=");
    expect(cwdBasename({ hideWhenEmpty: true }).render(ctx({ cwd: "/" }))).toBeUndefined();
    expect(cwdBasename({ text: "root" }).render(ctx({ cwd: "/" }))).toBe("dir root");
  });

  it("normalizes config through metadata", () => {
    expect(
      normalizeConfig({
        lines: [
          [
            {
              type: "cwd-basename",
              options: { raw: true, hideWhenEmpty: true, icon: "D=", text: "root" },
            },
          ],
        ],
      }).lines[0]?.[0]?.options,
    ).toMatchObject({
      raw: true,
      hideWhenEmpty: true,
      icon: "D=",
      text: "root",
    });
    expect(
      normalizeConfig({
        lines: [
          [
            {
              type: "cwd-basename",
              options: {
                raw: "yes",
                hideWhenEmpty: true,
                hideWhenZero: true,
                text: "fallback",
                icon: 7,
                cwdDisplayStyle: "fish",
              },
            },
          ],
        ],
      }).lines[0]?.[0]?.options,
    ).toEqual({
      raw: false,
      hideWhenEmpty: true,
      icon: "",
      text: "fallback",
      fg: "blue",
      bg: "default",
      bold: false,
    });
  });

  it("receives cwd through the production store render path", () => {
    const store = WidgetStore.fromConfig(
      normalizeConfig({
        terminal: { colorLevel: "none" },
        iconMode: "text",
        lines: [[{ type: "cwd-basename", options: { raw: true } }]],
      }),
    );

    expect(renderStatuslines(store, statuslineData, 200)).toEqual(["pi-footer"]);
  });
});
