import { describe, expect, it } from "vitest";

import { normalizeConfig } from "../../../src/config.js";
import type { WidgetOptions } from "../../../src/types.js";
import {
  fieldsForWidget,
  formatWidgetColorOptions,
  formatWidgetOptions,
  getTextField,
} from "../../../src/ui/fields.js";
import { GitBranchWidget } from "../../../src/widgets/git/branch.js";
import { WidgetInstance } from "../../../src/widgets/instance.js";
import { registry } from "../../../src/widgets/registry.js";
import type { WidgetContext } from "../../../src/widgets/types.js";
import { GIT_INFO as git } from "./fixtures.js";

function gitBranch(options: WidgetOptions = {}) {
  return registry.createWidget("git-branch", options);
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

describe("GitBranchWidget", () => {
  it("owns metadata and default options", () => {
    const widget = gitBranch();
    expect(widget).toBeInstanceOf(WidgetInstance);
    expect(registry.spec(widget.type)).toBe(GitBranchWidget);
    expect(GitBranchWidget.dependencies).toEqual(["git"]);
    expect(GitBranchWidget.icons).toEqual({ emoji: "🌿", nerd: "", text: "git" });
    expect(GitBranchWidget.defaultStyle).toEqual({ fg: "magenta", bg: "default", bold: false });
    expect(GitBranchWidget.baseOptionDefaults).toEqual({ text: "" });
    expect(registry.createEntry("git-branch").options).toEqual({
      raw: false,
      hideWhenEmpty: false,
      icon: "",
      text: "",
      gitBranchDisplayStyle: "default",
      surroundLeft: "",
      surroundRight: "",
      fg: "magenta",
      bg: "default",
      bold: false,
    });
  });

  it("renders labels, custom icons, raw values, display styles, and missing branches", () => {
    expect(gitBranch().render(ctx())).toBe("git main");
    expect(gitBranch({ icon: "branch=" }).render(ctx())).toBe("branch=main");
    expect(gitBranch({ raw: true }).render(ctx())).toBe("main");
    expect(gitBranch({ raw: true, gitBranchDisplayStyle: "round-brackets" }).render(ctx())).toBe(
      "(main)",
    );
    expect(
      gitBranch({
        raw: true,
        gitBranchDisplayStyle: "custom",
        surroundLeft: "[",
        surroundRight: "]",
      }).render(ctx()),
    ).toBe("[main]");
    expect(
      gitBranch({ raw: true, gitBranchDisplayStyle: "round-brackets" }).render(
        ctx({ git: { ...git, branch: null } }),
      ),
    ).toBe("");
    expect(gitBranch({ hideWhenEmpty: true }).render(ctx({ git: { ...git, branch: null } }))).toBe(
      undefined,
    );
  });

  it("exposes metadata fields and summaries", () => {
    expect(fieldsForWidget(gitBranch()).map((field) => field.id)).toEqual([
      "enabled",
      "raw",
      "hideWhenEmpty",
      "icon",
      "text",
      "gitBranchDisplayStyle",
    ]);
    expect(
      fieldsForWidget(gitBranch({ gitBranchDisplayStyle: "custom" })).map((field) => field.id),
    ).toEqual([
      "enabled",
      "raw",
      "hideWhenEmpty",
      "icon",
      "text",
      "gitBranchDisplayStyle",
      "surroundLeft",
      "surroundRight",
    ]);
    const customBranch = gitBranch({
      gitBranchDisplayStyle: "custom",
      surroundLeft: "[",
      surroundRight: "]",
    });
    expect(getTextField(customBranch, "surroundLeft")).toBe("[");
    expect(getTextField(customBranch, "surroundRight")).toBe("]");
    expect(formatWidgetOptions(gitBranch())).toBe("");
    expect(formatWidgetOptions(gitBranch({ gitBranchDisplayStyle: "round-brackets" }))).toContain(
      "display=brackets",
    );

    const customSummary = formatWidgetOptions(
      gitBranch({
        raw: true,
        hideWhenEmpty: true,
        gitBranchDisplayStyle: "custom",
        surroundLeft: "[",
        surroundRight: "]",
      }),
    );
    expect(customSummary).toContain("display=custom");
    expect(customSummary).not.toContain("left='['");
    expect(customSummary).not.toContain("right=']'");
    expect(formatWidgetColorOptions(gitBranch({ fg: "red", bold: true }))).toBe("fg=Red • bold");
  });

  it("normalizes config through metadata", () => {
    expect(
      normalizeConfig({
        lines: [
          [
            {
              type: "git-branch",
              options: {
                gitBranchDisplayStyle: "custom",
                surroundLeft: "[",
                surroundRight: "]",
              },
            },
          ],
        ],
      }).lines[0]?.[0]?.options,
    ).toMatchObject({
      gitBranchDisplayStyle: "custom",
      surroundLeft: "[",
      surroundRight: "]",
    });
    expect(
      normalizeConfig({
        lines: [
          [
            {
              type: "git-branch",
              options: { gitBranchDisplayStyle: "wide", showProvider: true, hideWhenZero: true },
            },
          ],
        ],
      }).lines[0]?.[0]?.options,
    ).toEqual({
      raw: false,
      hideWhenEmpty: false,
      icon: "",
      text: "",
      fg: "magenta",
      bg: "default",
      bold: false,
      gitBranchDisplayStyle: "default",
      surroundLeft: "",
      surroundRight: "",
    });
  });
});
