import { describe, expect, it } from "vitest";

import { normalizeConfig } from "../../../src/config.js";
import type { WidgetOptions } from "../../../src/types.js";
import {
  fieldsForWidget,
  formatWidgetColorOptions,
  formatWidgetOptions,
} from "../../../src/ui/fields.js";
import { GitStatusWidget } from "../../../src/widgets/git/status.js";
import { WidgetInstance } from "../../../src/widgets/instance.js";
import { registry } from "../../../src/widgets/registry.js";
import type { WidgetContext } from "../../../src/widgets/types.js";
import { GIT_INFO as git } from "./fixtures.js";

function gitStatus(options: WidgetOptions = {}) {
  return registry.createWidget("git-status", options);
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

describe("GitStatusWidget", () => {
  it("owns metadata and default options", () => {
    expect(GitStatusWidget.dependencies).toEqual(["git"]);
    expect(GitStatusWidget.icons).toEqual({ emoji: "🔀", nerd: "", text: "git" });
    expect(GitStatusWidget.defaultStyle).toEqual({ fg: "yellow", bg: "default", bold: false });
    expect(GitStatusWidget.baseOptions).toEqual(["raw", "hideWhenEmpty", "icon", "text"]);
    expect(GitStatusWidget.baseOptionDefaults).toEqual({ text: "" });
    expect(registry.createEntry("git-status").options).toEqual({
      raw: false,
      hideWhenEmpty: false,
      icon: "",
      text: "",
      fg: "yellow",
      bg: "default",
      bold: false,
    });
    const widget = gitStatus();
    expect(widget).toBeInstanceOf(WidgetInstance);
    expect(registry.spec(widget.type)).toBe(GitStatusWidget);
  });

  it("renders labels, custom icons, raw values, repo status, fallback text, and non-repos", () => {
    expect(gitStatus().render(ctx())).toBe("git +1 ±2 ?3");
    expect(gitStatus({ icon: "status=" }).render(ctx())).toBe("status=+1 ±2 ?3");
    expect(gitStatus({ raw: true }).render(ctx())).toBe("+1 ±2 ?3");
    expect(gitStatus().render(ctx({ git: { ...git, staged: 0, unstaged: 0, untracked: 0 } }))).toBe(
      "git +0 ±0 ?0",
    );
    expect(gitStatus().render(ctx({ git: { ...git, isRepo: false } }))).toBe("git ");
    expect(gitStatus({ text: "no-repo" }).render(ctx({ git: { ...git, isRepo: false } }))).toBe(
      "git no-repo",
    );
    expect(gitStatus({ raw: true }).render(ctx({ git: { ...git, isRepo: false } }))).toBe("");
    expect(gitStatus({ hideWhenEmpty: true }).render(ctx({ git: { ...git, isRepo: false } }))).toBe(
      undefined,
    );
  });

  it("exposes metadata fields and summaries", () => {
    expect(fieldsForWidget(gitStatus()).map((field) => field.id)).toEqual([
      "enabled",
      "raw",
      "hideWhenEmpty",
      "icon",
      "text",
    ]);
    expect(fieldsForWidget(gitStatus({ hideWhenEmpty: true })).map((field) => field.id)).toEqual([
      "enabled",
      "raw",
      "hideWhenEmpty",
      "icon",
    ]);
    expect(formatWidgetOptions(gitStatus())).toBe("");
    expect(formatWidgetOptions(gitStatus({ hideWhenEmpty: true }))).toBe("hide-empty");
    expect(formatWidgetOptions(gitStatus({ raw: true, icon: "status=", text: "no-repo" }))).toBe(
      "raw • icon='status=' • text='no-repo'",
    );
    expect(formatWidgetColorOptions(gitStatus({ fg: "red", bold: true }))).toBe("fg=Red • bold");
  });

  it("normalizes config and hydrates store entries through metadata", () => {
    expect(
      normalizeConfig({
        lines: [[{ type: "git-status", options: { raw: true, text: "no-repo" } }]],
      }).lines[0]?.[0]?.options,
    ).toMatchObject({
      raw: true,
      text: "no-repo",
    });
    expect(
      normalizeConfig({
        lines: [[{ type: "git-status", options: { hideWhenZero: true, showProvider: true } }]],
      }).lines[0]?.[0]?.options,
    ).toEqual({
      raw: false,
      hideWhenEmpty: false,
      icon: "",
      text: "",
      fg: "yellow",
      bg: "default",
      bold: false,
    });
  });
});
