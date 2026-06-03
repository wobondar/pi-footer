import { describe, expect, it } from "vitest";

import { normalizeConfig } from "../../../src/config.js";
import type { WidgetOptions } from "../../../src/types.js";
import {
  fieldsForWidget,
  formatWidgetColorOptions,
  formatWidgetOptions,
} from "../../../src/ui/fields.js";
import { GitDeletionsWidget } from "../../../src/widgets/git/deletions.js";
import { WidgetInstance } from "../../../src/widgets/instance.js";
import { registry } from "../../../src/widgets/registry.js";
import type { WidgetContext } from "../../../src/widgets/types.js";
import { GIT_INFO as git } from "./fixtures.js";

function gitDeletions(options: WidgetOptions = {}) {
  return registry.createWidget("git-deletions", options);
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

describe("GitDeletionsWidget", () => {
  it("owns metadata and default options", () => {
    expect(GitDeletionsWidget.dependencies).toEqual(["git"]);
    expect(GitDeletionsWidget.icons).toEqual({ emoji: "➖", nerd: "-", text: "del" });
    expect(GitDeletionsWidget.defaultStyle).toEqual({ fg: "red", bg: "default", bold: false });
    expect(GitDeletionsWidget.baseOptions).toEqual(["raw", "hideWhenZero", "icon", "text"]);
    expect(GitDeletionsWidget.baseOptionDefaults).toEqual({ text: "" });
    expect(registry.createEntry("git-deletions").options).toEqual({
      raw: false,
      hideWhenZero: false,
      icon: "",
      text: "",
      fg: "red",
      bg: "default",
      bold: false,
    });
    const widget = gitDeletions();
    expect(widget).toBeInstanceOf(WidgetInstance);
    expect(registry.spec(widget.type)).toBe(GitDeletionsWidget);
  });

  it("renders labels, custom icons, raw values, zero counts, and hide-when-zero", () => {
    expect(gitDeletions().render(ctx())).toBe("del 4");
    expect(gitDeletions({ icon: "D=" }).render(ctx())).toBe("D=4");
    expect(gitDeletions({ raw: true }).render(ctx())).toBe("4");
    expect(gitDeletions().render(ctx({ git: { ...git, deletions: 12, isRepo: false } }))).toBe(
      "del 12",
    );
    expect(gitDeletions().render(ctx({ git: { ...git, deletions: 0 } }))).toBe("del 0");
    expect(
      gitDeletions({ hideWhenZero: true }).render(ctx({ git: { ...git, deletions: 0 } })),
    ).toBe(undefined);
    expect(gitDeletions({ text: "none" }).render(ctx())).toBe("del 4");
  });

  it("exposes metadata fields and summaries", () => {
    expect(fieldsForWidget(gitDeletions()).map((field) => field.id)).toEqual([
      "enabled",
      "raw",
      "hideWhenZero",
      "icon",
      "text",
    ]);
    expect(formatWidgetOptions(gitDeletions())).toBe("");
    expect(formatWidgetOptions(gitDeletions({ raw: true }))).toBe("raw");
    expect(formatWidgetOptions(gitDeletions({ hideWhenZero: true }))).toBe("hide-zero");
    expect(formatWidgetOptions(gitDeletions({ icon: "D=" }))).toBe("icon='D='");
    expect(formatWidgetOptions(gitDeletions({ text: "none" }))).toBe("text='none'");
    expect(
      formatWidgetOptions(
        gitDeletions({ raw: true, hideWhenZero: true, icon: "D=", text: "none" }),
      ),
    ).toBe("raw • icon='D=' • hide-zero • text='none'");
    expect(formatWidgetColorOptions(gitDeletions({ fg: "green", bold: true }))).toBe(
      "fg=Green • bold",
    );
  });

  it("normalizes config and hydrates store entries through metadata", () => {
    expect(
      normalizeConfig({
        lines: [
          [{ type: "git-deletions", options: { raw: true, hideWhenZero: true, icon: "D=" } }],
        ],
      }).lines[0]?.[0]?.options,
    ).toMatchObject({
      raw: true,
      hideWhenZero: true,
      icon: "D=",
    });
    expect(
      normalizeConfig({
        lines: [
          [
            {
              type: "git-deletions",
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
      fg: "red",
      bg: "default",
      bold: false,
    });
  });
});
