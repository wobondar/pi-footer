import { describe, expect, it } from "vitest";

import { normalizeConfig } from "../../../src/config.js";
import type { WidgetOptions } from "../../../src/types.js";
import {
  fieldsForWidget,
  formatWidgetColorOptions,
  formatWidgetOptions,
} from "../../../src/ui/fields.js";
import { GitDiffWidget } from "../../../src/widgets/git/diff.js";
import { WidgetInstance } from "../../../src/widgets/instance.js";
import { registry } from "../../../src/widgets/registry.js";
import type { WidgetContext } from "../../../src/widgets/types.js";
import { GIT_INFO as git } from "./fixtures.js";

function gitDiff(options: WidgetOptions = {}) {
  return registry.createWidget("git-diff", options);
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

describe("GitDiffWidget", () => {
  it("owns metadata and default options", () => {
    const widget = gitDiff();
    expect(widget).toBeInstanceOf(WidgetInstance);
    expect(registry.spec(widget.type)).toBe(GitDiffWidget);
    expect(GitDiffWidget.dependencies).toEqual(["git"]);
    expect(GitDiffWidget.icons).toEqual({ emoji: "📈", nerd: "", text: "diff" });
    expect(GitDiffWidget.defaultStyle).toEqual({ fg: "yellow", bg: "default", bold: false });
    expect(GitDiffWidget.baseOptionDefaults).toEqual({ text: "" });
    expect(registry.createEntry("git-diff").options).toEqual({
      raw: false,
      hideWhenEmpty: false,
      icon: "",
      text: "",
      gitDiffMode: "plain",
      fg: "yellow",
      bg: "default",
      bold: false,
    });
  });

  it("renders labels, custom icons, raw values, compact mode, and zero diffs", () => {
    expect(gitDiff().render(ctx())).toBe("diff +10/-4");
    expect(gitDiff({ icon: "Δ " }).render(ctx())).toBe("Δ +10/-4");
    expect(gitDiff({ raw: true }).render(ctx())).toBe("+10/-4");
    expect(gitDiff({ raw: true, gitDiffMode: "compact" }).render(ctx())).toBe("(+10,-4)");
    expect(gitDiff().render(ctx({ git: { ...git, insertions: 0, deletions: 0 } }))).toBe(
      "diff +0/-0",
    );
  });

  it("exposes metadata fields and summaries", () => {
    expect(fieldsForWidget(gitDiff()).map((field) => field.id)).toEqual([
      "enabled",
      "raw",
      "hideWhenEmpty",
      "icon",
      "text",
      "gitDiffMode",
    ]);
    expect(formatWidgetOptions(gitDiff())).toBe("");
    expect(formatWidgetOptions(gitDiff({ gitDiffMode: "compact" }))).toContain(
      "display=Compact (+n,-n)",
    );
    expect(formatWidgetOptions(gitDiff({ raw: true, icon: "Δ " }))).toBe("raw • icon='Δ '");
    expect(formatWidgetColorOptions(gitDiff({ fg: "red", bold: true }))).toBe("fg=Red • bold");
  });

  it("normalizes config through metadata", () => {
    expect(
      normalizeConfig({
        lines: [[{ type: "git-diff", options: { gitDiffMode: "compact" } }]],
      }).lines[0]?.[0]?.options,
    ).toMatchObject({
      gitDiffMode: "compact",
    });
    expect(
      normalizeConfig({
        lines: [[{ type: "git-diff", options: { gitDiffMode: "wide", showProvider: true } }]],
      }).lines[0]?.[0]?.options,
    ).toEqual({
      raw: false,
      hideWhenEmpty: false,
      icon: "",
      text: "",
      fg: "yellow",
      bg: "default",
      bold: false,
      gitDiffMode: "plain",
    });
  });
});
