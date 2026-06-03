import { describe, expect, it } from "vitest";

import { normalizeConfig } from "../../../src/config.js";
import type { WidgetOptions } from "../../../src/types.js";
import {
  fieldsForWidget,
  formatWidgetColorOptions,
  formatWidgetOptions,
} from "../../../src/ui/fields.js";
import { GitAheadBehindWidget } from "../../../src/widgets/git/ahead-behind.js";
import { WidgetInstance } from "../../../src/widgets/instance.js";
import { registry } from "../../../src/widgets/registry.js";
import type { WidgetContext } from "../../../src/widgets/types.js";
import { GIT_INFO } from "./fixtures.js";

const git = { ...GIT_INFO, ahead: 2, behind: 5 };

function gitAheadBehind(options: WidgetOptions = {}) {
  return registry.createWidget("git-ahead-behind", options);
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

describe("GitAheadBehindWidget", () => {
  it("owns metadata and default options", () => {
    expect(GitAheadBehindWidget.dependencies).toEqual(["git"]);
    expect(GitAheadBehindWidget.icons).toEqual({ emoji: "↕️", nerd: "󰦻", text: "upstream" });
    expect(GitAheadBehindWidget.defaultStyle).toEqual({ fg: "cyan", bg: "default", bold: false });
    expect(GitAheadBehindWidget.baseOptions).toEqual(["raw", "hideWhenEmpty", "icon", "text"]);
    expect(GitAheadBehindWidget.baseOptionDefaults).toEqual({ text: "" });
    expect(registry.createEntry("git-ahead-behind").options).toEqual({
      raw: false,
      hideWhenEmpty: false,
      icon: "",
      text: "",
      fg: "cyan",
      bg: "default",
      bold: false,
    });
    const widget = gitAheadBehind();
    expect(widget).toBeInstanceOf(WidgetInstance);
    expect(registry.spec(widget.type)).toBe(GitAheadBehindWidget);
  });

  it("renders labels, custom icons, raw values, aggregate counts, fallback text, and non-repos", () => {
    expect(gitAheadBehind().render(ctx())).toBe("upstream ↑2 ↓5");
    expect(gitAheadBehind({ icon: "up=" }).render(ctx())).toBe("up=↑2 ↓5");
    expect(gitAheadBehind({ raw: true }).render(ctx())).toBe("↑2 ↓5");
    expect(gitAheadBehind().render(ctx({ git: { ...git, ahead: 0, behind: 0 } }))).toBe(
      "upstream ↑0 ↓0",
    );
    expect(gitAheadBehind().render(ctx({ git: { ...git, isRepo: false } }))).toBe("upstream ");
    expect(
      gitAheadBehind({ text: "no-upstream" }).render(ctx({ git: { ...git, isRepo: false } })),
    ).toBe("upstream no-upstream");
    expect(gitAheadBehind({ raw: true }).render(ctx({ git: { ...git, isRepo: false } }))).toBe("");
    expect(
      gitAheadBehind({ hideWhenEmpty: true }).render(ctx({ git: { ...git, isRepo: false } })),
    ).toBe(undefined);
  });

  it("exposes metadata fields and summaries", () => {
    expect(fieldsForWidget(gitAheadBehind()).map((field) => field.id)).toEqual([
      "enabled",
      "raw",
      "hideWhenEmpty",
      "icon",
      "text",
    ]);
    expect(
      fieldsForWidget(gitAheadBehind({ hideWhenEmpty: true })).map((field) => field.id),
    ).toEqual(["enabled", "raw", "hideWhenEmpty", "icon"]);
    expect(formatWidgetOptions(gitAheadBehind())).toBe("");
    expect(formatWidgetOptions(gitAheadBehind({ hideWhenEmpty: true }))).toBe("hide-empty");
    expect(formatWidgetOptions(gitAheadBehind({ raw: true, icon: "up=", text: "none" }))).toBe(
      "raw • icon='up=' • text='none'",
    );
    expect(formatWidgetColorOptions(gitAheadBehind({ fg: "red", bold: true }))).toBe(
      "fg=Red • bold",
    );
  });

  it("normalizes config and hydrates store entries through metadata", () => {
    expect(
      normalizeConfig({
        lines: [[{ type: "git-ahead-behind", options: { raw: true, text: "no-upstream" } }]],
      }).lines[0]?.[0]?.options,
    ).toMatchObject({
      raw: true,
      text: "no-upstream",
    });
    expect(
      normalizeConfig({
        lines: [
          [{ type: "git-ahead-behind", options: { hideWhenZero: true, showProvider: true } }],
        ],
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
  });
});
