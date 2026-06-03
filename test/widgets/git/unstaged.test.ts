import { describe, expect, it } from "vitest";

import { normalizeConfig } from "../../../src/config.js";
import type { WidgetOptions } from "../../../src/types.js";
import {
  fieldsForWidget,
  formatWidgetColorOptions,
  formatWidgetOptions,
} from "../../../src/ui/fields.js";
import { GitUnstagedWidget } from "../../../src/widgets/git/unstaged.js";
import { WidgetInstance } from "../../../src/widgets/instance.js";
import { registry } from "../../../src/widgets/registry.js";
import type { WidgetContext } from "../../../src/widgets/types.js";
import { GIT_INFO as git } from "./fixtures.js";

function gitUnstaged(options: WidgetOptions = {}) {
  return registry.createWidget("git-unstaged", options);
}

function ctx(overrides: Partial<WidgetContext<["git"]>> = {}) {
  return {
    iconMode: "text",
    minimalist: false,
    colorLevel: "none",
    git,
    ...overrides,
  } satisfies WidgetContext<["git"]>;
}

describe("GitUnstagedWidget", () => {
  it("owns metadata and default options", () => {
    expect(GitUnstagedWidget.dependencies).toEqual(["git"]);
    expect(GitUnstagedWidget.icons).toEqual({ emoji: "📝", nerd: "±", text: "unstaged" });
    expect(GitUnstagedWidget.defaultStyle).toEqual({ fg: "yellow", bg: "default", bold: false });
    expect(GitUnstagedWidget.baseOptions).toEqual(["raw", "hideWhenZero", "icon", "text"]);
    expect(GitUnstagedWidget.baseOptionDefaults).toEqual({ text: "" });
    expect(registry.createEntry("git-unstaged").options).toEqual({
      raw: false,
      hideWhenZero: false,
      icon: "",
      text: "",
      fg: "yellow",
      bg: "default",
      bold: false,
    });
    const widget = gitUnstaged();
    expect(widget).toBeInstanceOf(WidgetInstance);
    expect(registry.spec(widget.type)).toBe(GitUnstagedWidget);
  });

  it("renders labels, custom icons, raw values, zero counts, and hide-when-zero", () => {
    expect(gitUnstaged().render(ctx())).toBe("unstaged 2");
    expect(gitUnstaged({ icon: "U=" }).render(ctx())).toBe("U=2");
    expect(gitUnstaged({ raw: true }).render(ctx())).toBe("2");
    expect(gitUnstaged().render(ctx({ git: { ...git, unstaged: 4, isRepo: false } }))).toBe(
      "unstaged 4",
    );
    expect(gitUnstaged().render(ctx({ git: { ...git, unstaged: 0 } }))).toBe("unstaged 0");
    expect(gitUnstaged({ hideWhenZero: true }).render(ctx({ git: { ...git, unstaged: 0 } }))).toBe(
      undefined,
    );
    expect(gitUnstaged({ text: "none" }).render(ctx())).toBe("unstaged 2");
  });

  it("exposes metadata fields and summaries", () => {
    expect(fieldsForWidget(gitUnstaged()).map((field) => field.id)).toEqual([
      "enabled",
      "raw",
      "hideWhenZero",
      "icon",
      "text",
    ]);
    expect(formatWidgetOptions(gitUnstaged())).toBe("");
    expect(formatWidgetOptions(gitUnstaged({ raw: true }))).toBe("raw");
    expect(formatWidgetOptions(gitUnstaged({ hideWhenZero: true }))).toBe("hide-zero");
    expect(formatWidgetOptions(gitUnstaged({ icon: "U=" }))).toBe("icon='U='");
    expect(formatWidgetOptions(gitUnstaged({ text: "none" }))).toBe("text='none'");
    expect(
      formatWidgetOptions(gitUnstaged({ raw: true, hideWhenZero: true, icon: "U=", text: "none" })),
    ).toBe("raw • icon='U=' • hide-zero • text='none'");
    expect(formatWidgetColorOptions(gitUnstaged({ fg: "red", bold: true }))).toBe("fg=Red • bold");
  });

  it("normalizes config and hydrates store entries through metadata", () => {
    expect(
      normalizeConfig({
        lines: [[{ type: "git-unstaged", options: { raw: true, hideWhenZero: true } }]],
      }).lines[0]?.[0]?.options,
    ).toMatchObject({
      raw: true,
      hideWhenZero: true,
    });
    expect(
      normalizeConfig({
        lines: [
          [
            {
              type: "git-unstaged",
              options: { hideWhenZero: "yes", hideWhenEmpty: true, showProvider: true },
            },
          ],
        ],
      }).lines[0]?.[0]?.options,
    ).toEqual({
      raw: false,
      hideWhenZero: false,
      icon: "",
      text: "",
      fg: "yellow",
      bg: "default",
      bold: false,
    });
  });
});
