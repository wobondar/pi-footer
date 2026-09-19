import { describe, expect, it } from "vitest";

import { normalizeConfig } from "../../../src/config.ts";
import type { WidgetOptions } from "../../../src/types.ts";
import {
  fieldsForWidget,
  formatWidgetColorOptions,
  formatWidgetOptions,
} from "../../../src/ui/fields.ts";
import { GitStagedWidget } from "../../../src/widgets/git/staged.ts";
import { WidgetInstance } from "../../../src/widgets/instance.ts";
import { registry } from "../../../src/widgets/registry.ts";
import type { WidgetContext } from "../../../src/widgets/types.ts";
import { GIT_INFO as git } from "./fixtures.ts";

function gitStaged(options: WidgetOptions = {}) {
  return registry.createWidget("git-staged", options);
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

describe("GitStagedWidget", () => {
  it("owns metadata and default options", () => {
    expect(GitStagedWidget.dependencies).toEqual(["git"]);
    expect(GitStagedWidget.icons).toEqual({ emoji: "➕", nerd: "+", text: "staged" });
    expect(GitStagedWidget.defaultStyle).toEqual({ fg: "green", bg: "default", bold: false });
    expect(GitStagedWidget.baseOptions).toEqual(["raw", "hideWhenZero", "icon", "text"]);
    expect(GitStagedWidget.baseOptionDefaults).toEqual({ text: "" });
    expect(registry.createEntry("git-staged").options).toEqual({
      raw: false,
      hideWhenZero: false,
      icon: "",
      text: "",
      fg: "green",
      bg: "default",
      bold: false,
    });
    const widget = gitStaged();
    expect(widget).toBeInstanceOf(WidgetInstance);
    expect(registry.spec(widget.type)).toBe(GitStagedWidget);
  });

  it("renders labels, custom icons, raw values, zero counts, and hide-when-zero", () => {
    expect(gitStaged().render(ctx())).toBe("staged 1");
    expect(gitStaged({ icon: "S=" }).render(ctx())).toBe("S=1");
    expect(gitStaged({ raw: true }).render(ctx())).toBe("1");
    expect(gitStaged().render(ctx({ git: { ...git, staged: 2, isRepo: false } }))).toBe("staged 2");
    expect(gitStaged().render(ctx({ git: { ...git, staged: 0 } }))).toBe("staged 0");
    expect(gitStaged({ hideWhenZero: true }).render(ctx({ git: { ...git, staged: 0 } }))).toBe(
      undefined,
    );
    expect(gitStaged({ text: "none" }).render(ctx())).toBe("staged 1");
  });

  it("exposes metadata fields and summaries", () => {
    expect(fieldsForWidget(gitStaged()).map((field) => field.id)).toEqual([
      "enabled",
      "raw",
      "hideWhenZero",
      "icon",
      "text",
    ]);
    expect(formatWidgetOptions(gitStaged())).toBe("");
    expect(formatWidgetOptions(gitStaged({ hideWhenZero: true }))).toBe("hide-zero");
    expect(
      formatWidgetOptions(gitStaged({ raw: true, hideWhenZero: true, icon: "S=", text: "none" })),
    ).toBe("raw • icon='S=' • hide-zero • text='none'");
    expect(formatWidgetColorOptions(gitStaged({ fg: "red", bold: true }))).toBe("fg=Red • bold");
  });

  it("normalizes config and hydrates store entries through metadata", () => {
    expect(
      normalizeConfig({
        lines: [[{ type: "git-staged", options: { raw: true, hideWhenZero: true } }]],
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
              type: "git-staged",
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
      fg: "green",
      bg: "default",
      bold: false,
    });
  });
});
