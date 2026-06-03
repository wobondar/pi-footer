import { afterEach, describe, expect, it } from "vitest";

import { normalizeConfig } from "../../../src/config.js";
import { renderStatuslines } from "../../../src/render.js";
import { makeStatuslineData } from "../../helpers/render.js";
import type { WidgetOptions } from "../../../src/types.js";
import {
  fieldValue,
  fieldsForWidget,
  formatWidgetColorOptions,
  formatWidgetOptions,
} from "../../../src/ui/fields.js";
import { CwdWidget } from "../../../src/widgets/core/cwd.js";
import { WidgetInstance } from "../../../src/widgets/instance.js";
import { registry } from "../../../src/widgets/registry.js";
import { WidgetStore } from "../../../src/widgets/store.js";
import type { WidgetContext } from "../../../src/widgets/types.js";

function cwd(options: WidgetOptions = {}) {
  return registry.createWidget("cwd", options);
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

const originalHome = process.env.HOME;

const statuslineData = makeStatuslineData({ cwd: "/Users/example/projects/pi-footer" });

afterEach(() => {
  process.env.HOME = originalHome;
});

describe("CwdWidget", () => {
  it("owns metadata and default options", () => {
    expect(CwdWidget.type).toBe("cwd");
    expect(CwdWidget.label).toBe("Working Dir");
    expect(CwdWidget.category).toBe("Core");
    expect(CwdWidget.description).toBe("Current working directory");
    expect(CwdWidget.dependencies).toEqual(["cwd"]);
    expect(CwdWidget.baseOptionDefaults).toEqual({});
    expect(CwdWidget.icons).toEqual({ emoji: "📁", nerd: "", text: "cwd" });
    expect(CwdWidget.defaultStyle).toEqual({ fg: "blue", bg: "default", bold: false });
    expect(registry.createEntry("cwd").options).toEqual({
      raw: false,
      icon: "",
      cwdDisplayStyle: "default",
      segments: 2,
      fg: "blue",
      bg: "default",
      bold: false,
    });
    const widget = cwd();
    expect(widget).toBeInstanceOf(WidgetInstance);
    expect(registry.spec(widget.type)).toBe(CwdWidget);
  });

  it("exposes metadata fields and summaries", () => {
    const fields = fieldsForWidget(cwd());
    const displayField = fields.find((field) => field.id === "cwdDisplayStyle");

    expect(fields.map((field) => field.id)).toEqual([
      "enabled",
      "raw",
      "icon",
      "cwdDisplayStyle",
      "segments",
    ]);
    if (!displayField) throw new Error("Missing cwd display style field");
    expect(fieldValue(cwd({ cwdDisplayStyle: "fish" }), displayField)).toBe(
      "Fish-style abbreviations",
    );
    expect(formatWidgetOptions(cwd())).toBe("segments=2");
    expect(formatWidgetOptions(cwd({ raw: true }))).toBe("raw • segments=2");
    expect(formatWidgetOptions(cwd({ icon: "D=" }))).toBe("icon='D=' • segments=2");
    expect(formatWidgetOptions(cwd({ cwdDisplayStyle: "full-home" }))).toBe(
      "display=full-path • segments=2",
    );
    expect(formatWidgetOptions(cwd({ cwdDisplayStyle: "fish", segments: 1 }))).toBe(
      "display=fish-style • segments=1",
    );
    expect(formatWidgetColorOptions(cwd({ raw: true, icon: "D=", fg: "green" }))).toBe(
      "raw • icon='D=' • fg=Green",
    );
  });

  it("renders labels, raw output, custom icons, minimalist output, and display styles", () => {
    process.env.HOME = "/Users/example";

    expect(cwd().render(ctx())).toBe("cwd ~/…/projects/pi-footer");
    expect(cwd({ raw: true }).render(ctx())).toBe("~/…/projects/pi-footer");
    expect(cwd({ icon: "D=" }).render(ctx())).toBe("D=~/…/projects/pi-footer");
    expect(cwd().render(ctx({ minimalist: true }))).toBe("~/…/projects/pi-footer");
    expect(cwd({ raw: true, cwdDisplayStyle: "full-home" }).render(ctx())).toBe(
      "~/projects/pi-footer",
    );
    expect(cwd({ raw: true, cwdDisplayStyle: "fish", segments: 1 }).render(ctx())).toBe(
      "~/p/pi-footer",
    );
    expect(cwd({ raw: true, segments: 3 }).render(ctx())).toBe("~/projects/pi-footer");
  });

  it("preserves edge path formatting behavior", () => {
    process.env.HOME = "/Users/example";

    expect(cwd({ raw: true }).render(ctx({ cwd: "/" }))).toBe("/");
    expect(
      cwd({ raw: true, cwdDisplayStyle: "fish", segments: 1 }).render(ctx({ cwd: "/a/b/c" })),
    ).toBe("/a/b/c");
  });

  it("normalizes config through metadata", () => {
    expect(
      normalizeConfig({
        lines: [
          [
            {
              type: "cwd",
              options: { raw: true, icon: "D=", cwdDisplayStyle: "fish", segments: 4 },
            },
          ],
        ],
      }).lines[0]?.[0]?.options,
    ).toMatchObject({
      raw: true,
      icon: "D=",
      cwdDisplayStyle: "fish",
      segments: 4,
    });
    expect(
      normalizeConfig({
        lines: [
          [
            {
              type: "cwd",
              options: {
                raw: "yes",
                hideWhenEmpty: true,
                hideWhenZero: true,
                text: "fallback",
                icon: 7,
                cwdDisplayStyle: "verbose",
                segments: 99,
              },
            },
          ],
        ],
      }).lines[0]?.[0]?.options,
    ).toEqual({
      raw: false,
      icon: "",
      fg: "blue",
      bg: "default",
      bold: false,
      cwdDisplayStyle: "default",
      segments: 8,
    });
  });

  it("receives cwd through the production store render path", () => {
    process.env.HOME = "/Users/example";
    const store = WidgetStore.fromConfig(
      normalizeConfig({
        terminal: { colorLevel: "none" },
        lines: [[{ type: "cwd", options: { raw: true, cwdDisplayStyle: "full-home" } }]],
      }),
    );

    expect(renderStatuslines(store, statuslineData, 200)).toEqual(["~/projects/pi-footer"]);
  });
});
