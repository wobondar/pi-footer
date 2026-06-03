import { describe, expect, it } from "vitest";

import { normalizeConfig } from "../../../src/config.js";
import type { WidgetOptions } from "../../../src/types.js";
import {
  fieldsForWidget,
  formatWidgetColorOptions,
  formatWidgetOptions,
} from "../../../src/ui/fields.js";
import { GitCleanStatusWidget } from "../../../src/widgets/git/clean.js";
import { WidgetInstance } from "../../../src/widgets/instance.js";
import { registry } from "../../../src/widgets/registry.js";
import type { WidgetContext } from "../../../src/widgets/types.js";
import { GIT_INFO } from "./fixtures.js";

const git = { ...GIT_INFO, staged: 0, unstaged: 0, untracked: 0 };

function gitCleanStatus(options: WidgetOptions = {}) {
  return registry.createWidget("git-clean", options);
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

describe("GitCleanStatusWidget", () => {
  it("owns metadata and default options", () => {
    expect(GitCleanStatusWidget.dependencies).toEqual(["git"]);
    expect(GitCleanStatusWidget.icons).toEqual({ emoji: "✅", nerd: "󰄬", text: "git" });
    expect(GitCleanStatusWidget.defaultStyle).toEqual({
      fg: "green",
      bg: "default",
      bold: false,
    });
    expect(GitCleanStatusWidget.baseOptions).toEqual(["raw", "hideWhenEmpty", "icon", "text"]);
    expect(GitCleanStatusWidget.baseOptionDefaults).toEqual({ text: "" });
    expect(registry.createEntry("git-clean").options).toEqual({
      raw: false,
      hideWhenEmpty: false,
      icon: "",
      text: "",
      fg: "green",
      bg: "default",
      bold: false,
    });
    const widget = gitCleanStatus();
    expect(widget).toBeInstanceOf(WidgetInstance);
    expect(registry.spec(widget.type)).toBe(GitCleanStatusWidget);
  });

  it("renders labels, custom icons, raw values, clean repos, dirty repos, and non-repos", () => {
    expect(gitCleanStatus().render(ctx())).toBe("git clean");
    expect(gitCleanStatus({ icon: "status=" }).render(ctx())).toBe("status=clean");
    expect(gitCleanStatus({ raw: true }).render(ctx())).toBe("clean");
    expect(gitCleanStatus().render(ctx({ git: { ...git, staged: 1 } }))).toBe("git dirty");
    expect(gitCleanStatus().render(ctx({ git: { ...git, unstaged: 1 } }))).toBe("git dirty");
    expect(gitCleanStatus().render(ctx({ git: { ...git, untracked: 1 } }))).toBe("git dirty");
    // Outside a repo the widget renders empty (icon-only), never "dirty".
    expect(gitCleanStatus().render(ctx({ git: { ...git, isRepo: false } }))).toBe("git ");
    expect(
      gitCleanStatus({ hideWhenEmpty: true }).render(ctx({ git: { ...git, isRepo: false } })),
    ).toBeUndefined();
  });

  it("exposes metadata fields and summaries", () => {
    expect(fieldsForWidget(gitCleanStatus()).map((field) => field.id)).toEqual([
      "enabled",
      "raw",
      "hideWhenEmpty",
      "icon",
      "text",
    ]);
    expect(
      fieldsForWidget(gitCleanStatus({ hideWhenEmpty: true })).map((field) => field.id),
    ).toEqual(["enabled", "raw", "hideWhenEmpty", "icon"]);
    expect(formatWidgetOptions(gitCleanStatus())).toBe("");
    expect(formatWidgetOptions(gitCleanStatus({ hideWhenEmpty: true }))).toBe("hide-empty");
    expect(formatWidgetOptions(gitCleanStatus({ raw: true, icon: "status=" }))).toBe(
      "raw • icon='status='",
    );
    expect(formatWidgetOptions(gitCleanStatus({ text: "fallback" }))).toBe("text='fallback'");
    expect(formatWidgetColorOptions(gitCleanStatus({ fg: "red", bold: true }))).toBe(
      "fg=Red • bold",
    );
  });

  it("normalizes config and hydrates store entries through metadata", () => {
    expect(
      normalizeConfig({
        lines: [[{ type: "git-clean", options: { raw: true, text: "fallback" } }]],
      }).lines[0]?.[0]?.options,
    ).toMatchObject({
      raw: true,
      text: "fallback",
    });
    expect(
      normalizeConfig({
        lines: [[{ type: "git-clean", options: { hideWhenZero: true, showProvider: true } }]],
      }).lines[0]?.[0]?.options,
    ).toEqual({
      raw: false,
      hideWhenEmpty: false,
      icon: "",
      text: "",
      fg: "green",
      bg: "default",
      bold: false,
    });
  });
});
