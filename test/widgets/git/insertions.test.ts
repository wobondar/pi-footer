import { describe, expect, it } from "vitest";

import { normalizeConfig } from "../../../src/config.js";
import type { WidgetOptions } from "../../../src/types.js";
import {
  fieldsForWidget,
  formatWidgetColorOptions,
  formatWidgetOptions,
} from "../../../src/ui/fields.js";
import { GitInsertionsWidget } from "../../../src/widgets/git/insertions.js";
import { WidgetInstance } from "../../../src/widgets/instance.js";
import { registry } from "../../../src/widgets/registry.js";
import type { WidgetContext } from "../../../src/widgets/types.js";
import { GIT_INFO as git } from "./fixtures.js";

function gitInsertions(options: WidgetOptions = {}) {
  return registry.createWidget("git-insertions", options);
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

describe("GitInsertionsWidget", () => {
  it("owns metadata and default options", () => {
    expect(GitInsertionsWidget.dependencies).toEqual(["git"]);
    expect(GitInsertionsWidget.icons).toEqual({ emoji: "➕", nerd: "+", text: "ins" });
    expect(GitInsertionsWidget.defaultStyle).toEqual({ fg: "green", bg: "default", bold: false });
    expect(GitInsertionsWidget.baseOptions).toEqual(["raw", "hideWhenZero", "icon", "text"]);
    expect(GitInsertionsWidget.baseOptionDefaults).toEqual({ text: "" });
    expect(registry.createEntry("git-insertions").options).toEqual({
      raw: false,
      hideWhenZero: false,
      icon: "",
      text: "",
      fg: "green",
      bg: "default",
      bold: false,
    });
    const widget = gitInsertions();
    expect(widget).toBeInstanceOf(WidgetInstance);
    expect(registry.spec(widget.type)).toBe(GitInsertionsWidget);
  });

  it("renders labels, custom icons, raw values, zero counts, and hide-when-zero", () => {
    expect(gitInsertions().render(ctx())).toBe("ins 10");
    expect(gitInsertions({ icon: "I=" }).render(ctx())).toBe("I=10");
    expect(gitInsertions({ raw: true }).render(ctx())).toBe("10");
    expect(gitInsertions().render(ctx({ git: { ...git, insertions: 12, isRepo: false } }))).toBe(
      "ins 12",
    );
    expect(gitInsertions().render(ctx({ git: { ...git, insertions: 0 } }))).toBe("ins 0");
    expect(
      gitInsertions({ hideWhenZero: true }).render(ctx({ git: { ...git, insertions: 0 } })),
    ).toBe(undefined);
    expect(gitInsertions({ text: "none" }).render(ctx())).toBe("ins 10");
  });

  it("exposes metadata fields and summaries", () => {
    expect(fieldsForWidget(gitInsertions()).map((field) => field.id)).toEqual([
      "enabled",
      "raw",
      "hideWhenZero",
      "icon",
      "text",
    ]);
    expect(formatWidgetOptions(gitInsertions())).toBe("");
    expect(formatWidgetOptions(gitInsertions({ raw: true }))).toBe("raw");
    expect(formatWidgetOptions(gitInsertions({ hideWhenZero: true }))).toBe("hide-zero");
    expect(formatWidgetOptions(gitInsertions({ icon: "I=" }))).toBe("icon='I='");
    expect(formatWidgetOptions(gitInsertions({ text: "none" }))).toBe("text='none'");
    expect(
      formatWidgetOptions(
        gitInsertions({ raw: true, hideWhenZero: true, icon: "I=", text: "none" }),
      ),
    ).toBe("raw • icon='I=' • hide-zero • text='none'");
    expect(formatWidgetColorOptions(gitInsertions({ fg: "red", bold: true }))).toBe(
      "fg=Red • bold",
    );
  });

  it("normalizes config and hydrates store entries through metadata", () => {
    expect(
      normalizeConfig({
        lines: [
          [{ type: "git-insertions", options: { raw: true, hideWhenZero: true, icon: "I=" } }],
        ],
      }).lines[0]?.[0]?.options,
    ).toMatchObject({
      raw: true,
      hideWhenZero: true,
      icon: "I=",
    });
    expect(
      normalizeConfig({
        lines: [
          [
            {
              type: "git-insertions",
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
