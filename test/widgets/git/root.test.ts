import { describe, expect, it } from "vitest";

import { normalizeConfig } from "../../../src/config.ts";
import type { WidgetOptions } from "../../../src/types.ts";
import {
  fieldsForWidget,
  formatWidgetColorOptions,
  formatWidgetOptions,
} from "../../../src/ui/fields.ts";
import { GitRootDirWidget } from "../../../src/widgets/git/root.ts";
import { WidgetInstance } from "../../../src/widgets/instance.ts";
import { registry } from "../../../src/widgets/registry.ts";
import { WidgetStore } from "../../../src/widgets/store.ts";
import type { WidgetContext } from "../../../src/widgets/types.ts";
import { GIT_INFO as git } from "./fixtures.ts";

function gitRootDir(options: WidgetOptions = {}) {
  return registry.createWidget("git-root", options);
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

describe("GitRootDirWidget", () => {
  it("owns metadata and default options", () => {
    const widget = gitRootDir();
    expect(widget).toBeInstanceOf(WidgetInstance);
    expect(registry.spec(widget.type)).toBe(GitRootDirWidget);
    expect(GitRootDirWidget.dependencies).toEqual(["git"]);
    expect(GitRootDirWidget.icons).toEqual({ emoji: "📦", nerd: "", text: "repo" });
    expect(GitRootDirWidget.defaultStyle).toEqual({ fg: "cyan", bg: "default", bold: false });
    expect(GitRootDirWidget.baseOptions).toEqual(["raw", "hideWhenEmpty", "icon", "text"]);
    expect(GitRootDirWidget.baseOptionDefaults).toEqual({ text: "" });
    expect(registry.createEntry("git-root").options).toEqual({
      raw: false,
      hideWhenEmpty: false,
      icon: "",
      text: "",
      fg: "cyan",
      bg: "default",
      bold: false,
    });
  });

  it("renders labels, custom icons, raw values, fallback text, and missing root dirs", () => {
    expect(gitRootDir().render(ctx())).toBe("repo pi-footer");
    expect(gitRootDir({ icon: "repo=" }).render(ctx())).toBe("repo=pi-footer");
    expect(gitRootDir({ raw: true }).render(ctx())).toBe("pi-footer");
    expect(gitRootDir({ text: "no-repo" }).render(ctx({ git: { ...git, root: null } }))).toBe(
      "repo no-repo",
    );
    expect(gitRootDir({ raw: true }).render(ctx({ git: { ...git, root: null } }))).toBe("");
    expect(gitRootDir({ hideWhenEmpty: true }).render(ctx({ git: { ...git, root: null } }))).toBe(
      undefined,
    );
  });

  it("exposes metadata fields and summaries", () => {
    expect(fieldsForWidget(gitRootDir()).map((field) => field.id)).toEqual([
      "enabled",
      "raw",
      "hideWhenEmpty",
      "icon",
      "text",
    ]);
    expect(fieldsForWidget(gitRootDir({ hideWhenEmpty: true })).map((field) => field.id)).toEqual([
      "enabled",
      "raw",
      "hideWhenEmpty",
      "icon",
    ]);
    expect(formatWidgetOptions(gitRootDir())).toBe("");
    expect(formatWidgetOptions(gitRootDir({ hideWhenEmpty: true }))).toBe("hide-empty");
    expect(formatWidgetOptions(gitRootDir({ raw: true, icon: "repo=", text: "no-repo" }))).toBe(
      "raw • icon='repo=' • text='no-repo'",
    );
    expect(formatWidgetColorOptions(gitRootDir({ fg: "red", bold: true }))).toBe("fg=Red • bold");
  });

  it("normalizes config and hydrates store entries through metadata", () => {
    expect(
      normalizeConfig({
        lines: [[{ type: "git-root", options: { raw: true, text: "no-repo" } }]],
      }).lines[0]?.[0]?.options,
    ).toMatchObject({
      raw: true,
      text: "no-repo",
    });
    expect(
      normalizeConfig({
        lines: [[{ type: "git-root", options: { hideWhenZero: true, showProvider: true } }]],
      }).lines[0]?.[0]?.options,
    ).toEqual({
      raw: false,
      hideWhenEmpty: false,
      icon: "",
      text: "",
      fg: "cyan",
      bg: "default",
      bold: false,
    });

    const store = WidgetStore.fromConfig(
      normalizeConfig({ lines: [[{ type: "git-root", options: { icon: "repo=" } }]] }),
    );
    expect(store.lines[0]?.[0]).toBeInstanceOf(WidgetInstance);
    expect(store.lines[0]?.[0]?.type).toBe(GitRootDirWidget.type);
  });
});
