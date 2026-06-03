import { describe, expect, it } from "vitest";

import { normalizeConfig } from "../../../src/config.js";
import type { WidgetOptions } from "../../../src/types.js";
import {
  fieldsForWidget,
  formatWidgetColorOptions,
  formatWidgetOptions,
} from "../../../src/ui/fields.js";
import { GitRemoteWidget } from "../../../src/widgets/git/remote.js";
import { WidgetInstance } from "../../../src/widgets/instance.js";
import { registry } from "../../../src/widgets/registry.js";
import { WidgetStore } from "../../../src/widgets/store.js";
import type { WidgetContext } from "../../../src/widgets/types.js";
import { GIT_INFO as git } from "./fixtures.js";

function gitRemote(options: WidgetOptions = {}) {
  return registry.createWidget("git-remote", options);
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

describe("GitRemoteWidget", () => {
  it("owns metadata and default options", () => {
    const widget = gitRemote();
    expect(widget).toBeInstanceOf(WidgetInstance);
    expect(registry.spec(widget.type)).toBe(GitRemoteWidget);
    expect(GitRemoteWidget.dependencies).toEqual(["git"]);
    expect(GitRemoteWidget.icons).toEqual({ emoji: "🌐", nerd: "󰊢", text: "remote" });
    expect(GitRemoteWidget.defaultStyle).toEqual({ fg: "cyan", bg: "default", bold: false });
    expect(GitRemoteWidget.baseOptions).toEqual(["raw", "hideWhenEmpty", "icon", "text"]);
    expect(GitRemoteWidget.baseOptionDefaults).toEqual({ text: "" });
    expect(registry.createEntry("git-remote").options).toEqual({
      raw: false,
      hideWhenEmpty: false,
      icon: "",
      text: "",
      fg: "cyan",
      bg: "default",
      bold: false,
    });
  });

  it("renders labels, custom icons, raw values, fallback text, and missing remotes", () => {
    expect(gitRemote().render(ctx())).toBe("remote git@github.com:example/pi-footer.git");
    expect(gitRemote({ icon: "remote=" }).render(ctx())).toBe(
      "remote=git@github.com:example/pi-footer.git",
    );
    expect(gitRemote({ raw: true }).render(ctx())).toBe("git@github.com:example/pi-footer.git");
    expect(gitRemote().render(ctx({ git: { ...git, remote: null } }))).toBe("remote ");
    expect(gitRemote({ text: "no-remote" }).render(ctx({ git: { ...git, remote: null } }))).toBe(
      "remote no-remote",
    );
    expect(gitRemote({ raw: true }).render(ctx({ git: { ...git, remote: null } }))).toBe("");
    expect(gitRemote({ hideWhenEmpty: true }).render(ctx({ git: { ...git, remote: null } }))).toBe(
      undefined,
    );
    expect(gitRemote({ hideWhenZero: true }).render(ctx({ git: { ...git, remote: "0" } }))).toBe(
      "remote 0",
    );
  });

  it("exposes metadata fields and summaries", () => {
    expect(fieldsForWidget(gitRemote()).map((field) => field.id)).toEqual([
      "enabled",
      "raw",
      "hideWhenEmpty",
      "icon",
      "text",
    ]);
    expect(fieldsForWidget(gitRemote({ hideWhenEmpty: true })).map((field) => field.id)).toEqual([
      "enabled",
      "raw",
      "hideWhenEmpty",
      "icon",
    ]);
    expect(formatWidgetOptions(gitRemote())).toBe("");
    expect(formatWidgetOptions(gitRemote({ hideWhenEmpty: true }))).toBe("hide-empty");
    expect(formatWidgetOptions(gitRemote({ raw: true, icon: "remote=", text: "missing" }))).toBe(
      "raw • icon='remote=' • text='missing'",
    );
    expect(formatWidgetOptions(gitRemote({ hideWhenZero: true }))).toBe("");
    expect(formatWidgetColorOptions(gitRemote({ fg: "red", bold: true }))).toBe("fg=Red • bold");
  });

  it("normalizes config and hydrates store entries through metadata", () => {
    expect(
      normalizeConfig({
        lines: [[{ type: "git-remote", options: { raw: true, text: "no-remote" } }]],
      }).lines[0]?.[0]?.options,
    ).toMatchObject({
      raw: true,
      text: "no-remote",
    });
    expect(
      normalizeConfig({
        lines: [[{ type: "git-remote", options: { hideWhenZero: true, showProvider: true } }]],
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
      normalizeConfig({ lines: [[{ type: "git-remote", options: { icon: "remote=" } }]] }),
    );
    expect(store.lines[0]?.[0]).toBeInstanceOf(WidgetInstance);
    expect(store.lines[0]?.[0]?.type).toBe(GitRemoteWidget.type);
  });
});
