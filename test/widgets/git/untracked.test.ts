import { describe, expect, it } from "vitest";

import { normalizeConfig } from "../../../src/config.js";
import type { WidgetOptions } from "../../../src/types.js";
import {
  fieldsForWidget,
  formatWidgetColorOptions,
  formatWidgetOptions,
} from "../../../src/ui/fields.js";
import { GitUntrackedWidget } from "../../../src/widgets/git/untracked.js";
import { WidgetInstance } from "../../../src/widgets/instance.js";
import { registry } from "../../../src/widgets/registry.js";
import type { WidgetContext } from "../../../src/widgets/types.js";
import { GIT_INFO as git } from "./fixtures.js";

function gitUntracked(options: WidgetOptions = {}) {
  return registry.createWidget("git-untracked", options);
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

describe("GitUntrackedWidget", () => {
  it("owns metadata and default options", () => {
    expect(GitUntrackedWidget.dependencies).toEqual(["git"]);
    expect(GitUntrackedWidget.icons).toEqual({ emoji: "❓", nerd: "?", text: "untracked" });
    expect(GitUntrackedWidget.defaultStyle).toEqual({ fg: "red", bg: "default", bold: false });
    expect(GitUntrackedWidget.baseOptions).toEqual(["raw", "hideWhenZero", "icon", "text"]);
    expect(GitUntrackedWidget.baseOptionDefaults).toEqual({ text: "" });
    expect(registry.createEntry("git-untracked").options).toEqual({
      raw: false,
      hideWhenZero: false,
      icon: "",
      text: "",
      fg: "red",
      bg: "default",
      bold: false,
    });
    const widget = gitUntracked();
    expect(widget).toBeInstanceOf(WidgetInstance);
    expect(registry.spec(widget.type)).toBe(GitUntrackedWidget);
  });

  it("renders labels, custom icons, raw values, zero values, and hideWhenZero", () => {
    expect(gitUntracked().render(ctx())).toBe("untracked 3");
    expect(gitUntracked({ icon: "? " }).render(ctx())).toBe("? 3");
    expect(gitUntracked({ raw: true }).render(ctx())).toBe("3");
    expect(gitUntracked().render(ctx({ git: { ...git, untracked: 0 } }))).toBe("untracked 0");
    expect(
      gitUntracked({ hideWhenZero: true }).render(ctx({ git: { ...git, untracked: 0 } })),
    ).toBe(undefined);
  });

  it("exposes metadata fields and summaries", () => {
    expect(fieldsForWidget(gitUntracked()).map((field) => field.id)).toEqual([
      "enabled",
      "raw",
      "hideWhenZero",
      "icon",
      "text",
    ]);
    expect(formatWidgetOptions(gitUntracked())).toBe("");
    expect(
      formatWidgetOptions(
        gitUntracked({ raw: true, hideWhenZero: true, icon: "? ", text: "none" }),
      ),
    ).toBe("raw • icon='? ' • hide-zero • text='none'");
    expect(formatWidgetColorOptions(gitUntracked({ fg: "green", bold: true }))).toBe(
      "fg=Green • bold",
    );
  });

  it("normalizes config through metadata", () => {
    expect(
      normalizeConfig({
        lines: [[{ type: "git-untracked", options: { hideWhenZero: true, text: "none" } }]],
      }).lines[0]?.[0]?.options,
    ).toMatchObject({
      hideWhenZero: true,
      text: "none",
    });
    expect(
      normalizeConfig({
        lines: [
          [
            {
              type: "git-untracked",
              options: { hideWhenZero: "yes", hideWhenEmpty: true, text: 0, fg: "nope" },
            },
          ],
        ],
      }).lines[0]?.[0]?.options,
    ).toEqual({
      raw: false,
      hideWhenZero: false,
      icon: "",
      text: "",
      bg: "default",
      bold: false,
    });
  });
});
