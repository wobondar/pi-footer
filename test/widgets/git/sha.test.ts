import { describe, expect, it } from "vitest";

import { normalizeConfig } from "../../../src/config.js";
import type { WidgetOptions } from "../../../src/types.js";
import {
  fieldsForWidget,
  formatWidgetColorOptions,
  formatWidgetOptions,
} from "../../../src/ui/fields.js";
import { GitShaWidget } from "../../../src/widgets/git/sha.js";
import { WidgetInstance } from "../../../src/widgets/instance.js";
import { registry } from "../../../src/widgets/registry.js";
import { WidgetStore } from "../../../src/widgets/store.js";
import type { WidgetContext } from "../../../src/widgets/types.js";
import { GIT_INFO as git } from "./fixtures.js";

function gitSha(options: WidgetOptions = {}) {
  return registry.createWidget("git-sha", options);
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

describe("GitShaWidget", () => {
  it("owns metadata and default options", () => {
    const widget = gitSha();
    expect(widget).toBeInstanceOf(WidgetInstance);
    expect(registry.spec(widget.type)).toBe(GitShaWidget);
    expect(GitShaWidget.dependencies).toEqual(["git"]);
    expect(GitShaWidget.icons).toEqual({ emoji: "🔖", nerd: "", text: "sha" });
    expect(GitShaWidget.defaultStyle).toEqual({
      fg: "brightBlack",
      bg: "default",
      bold: false,
    });
    expect(GitShaWidget.baseOptions).toEqual(["raw", "hideWhenEmpty", "icon", "text"]);
    expect(GitShaWidget.baseOptionDefaults).toEqual({ text: "" });
    expect(registry.createEntry("git-sha").options).toEqual({
      raw: false,
      hideWhenEmpty: false,
      icon: "",
      text: "",
      fg: "brightBlack",
      bg: "default",
      bold: false,
    });
  });

  it("renders labels, custom icons, raw values, fallback text, and missing shas", () => {
    expect(gitSha().render(ctx())).toBe("sha abc1234");
    expect(gitSha({ icon: "commit=" }).render(ctx())).toBe("commit=abc1234");
    expect(gitSha({ raw: true }).render(ctx())).toBe("abc1234");
    expect(gitSha({ text: "no-sha" }).render(ctx({ git: { ...git, sha: null } }))).toBe(
      "sha no-sha",
    );
    expect(gitSha({ raw: true }).render(ctx({ git: { ...git, sha: null } }))).toBe("");
    expect(gitSha({ hideWhenEmpty: true }).render(ctx({ git: { ...git, sha: null } }))).toBe(
      undefined,
    );
  });

  it("exposes metadata fields and summaries", () => {
    expect(fieldsForWidget(gitSha()).map((field) => field.id)).toEqual([
      "enabled",
      "raw",
      "hideWhenEmpty",
      "icon",
      "text",
    ]);
    expect(fieldsForWidget(gitSha({ hideWhenEmpty: true })).map((field) => field.id)).toEqual([
      "enabled",
      "raw",
      "hideWhenEmpty",
      "icon",
    ]);
    expect(formatWidgetOptions(gitSha())).toBe("");
    expect(formatWidgetOptions(gitSha({ hideWhenEmpty: true }))).toBe("hide-empty");
    expect(formatWidgetOptions(gitSha({ raw: true, icon: "commit=", text: "no-sha" }))).toBe(
      "raw • icon='commit=' • text='no-sha'",
    );
    expect(formatWidgetColorOptions(gitSha({ fg: "red", bold: true }))).toBe("fg=Red • bold");
  });

  it("normalizes config and hydrates store entries through metadata", () => {
    expect(
      normalizeConfig({
        lines: [[{ type: "git-sha", options: { raw: true, text: "no-sha" } }]],
      }).lines[0]?.[0]?.options,
    ).toMatchObject({
      raw: true,
      text: "no-sha",
    });
    expect(
      normalizeConfig({
        lines: [[{ type: "git-sha", options: { hideWhenZero: true, showProvider: true } }]],
      }).lines[0]?.[0]?.options,
    ).toEqual({
      raw: false,
      hideWhenEmpty: false,
      icon: "",
      text: "",
      fg: "brightBlack",
      bg: "default",
      bold: false,
    });

    const store = WidgetStore.fromConfig(
      normalizeConfig({ lines: [[{ type: "git-sha", options: { icon: "commit=" } }]] }),
    );
    expect(store.lines[0]?.[0]).toBeInstanceOf(WidgetInstance);
    expect(store.lines[0]?.[0]?.type).toBe(GitShaWidget.type);
  });
});
