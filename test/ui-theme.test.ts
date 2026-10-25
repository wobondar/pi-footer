import type { Theme } from "@earendil-works/pi-coding-agent";
import { describe, expect, it } from "vitest";

import { createUiTheme } from "../src/ui/theme.ts";

function taggedTheme(name: string): Theme {
  return {
    fg: (color: string, text: string) => `<${name}:fg:${color}>${text}</${name}:fg:${color}>`,
    bg: (color: string, text: string) => `<${name}:bg:${color}>${text}</${name}:bg:${color}>`,
    bold: (text: string) => `<${name}:bold>${text}</${name}:bold>`,
  } as unknown as Theme;
}

describe("UiTheme", () => {
  it("styles semantic colors through the current theme", () => {
    let currentTheme = taggedTheme("one");
    const uiTheme = createUiTheme(() => currentTheme);

    expect(uiTheme.accent("Hi")).toBe("<one:fg:accent>Hi</one:fg:accent>");

    currentTheme = taggedTheme("two");
    expect(uiTheme.accent("Hi")).toBe("<two:fg:accent>Hi</two:fg:accent>");
  });

  it("styles selected text with accent foreground and selected background", () => {
    const uiTheme = createUiTheme(() => taggedTheme("theme"));

    expect(uiTheme.selected("Item")).toBe(
      "<theme:bg:selectedBg><theme:fg:accent>Item</theme:fg:accent></theme:bg:selectedBg>",
    );
  });

  it("styles preview titles as bold accent", () => {
    const uiTheme = createUiTheme(() => taggedTheme("theme"));

    expect(uiTheme.previewTitle("Title")).toBe(
      "<theme:fg:accent><theme:bold>Title</theme:bold></theme:fg:accent>",
    );
  });

  it("styles config state labels", () => {
    const uiTheme = createUiTheme(() => taggedTheme("theme"));

    expect(uiTheme.configStateLabel("saved", "Saved")).toBe(
      "<theme:fg:accent>Saved</theme:fg:accent>",
    );
    expect(uiTheme.configStateLabel("dirty", "Unsaved")).toBe(
      "<theme:bold><theme:fg:warning>Unsaved</theme:fg:warning></theme:bold>",
    );
    expect(uiTheme.configStateLabel("saving", "Saving…")).toBe(
      "<theme:fg:dim>Saving…</theme:fg:dim>",
    );
    expect(uiTheme.configStateLabel("error", "Save failed")).toBe(
      "<theme:bold><theme:fg:error>Save failed</theme:fg:error></theme:bold>",
    );
    expect(uiTheme.configStateLabel("clean", "")).toBe("");
  });

  it("styles borders through the requested theme color", () => {
    const uiTheme = createUiTheme(() => taggedTheme("theme"));

    expect(uiTheme.border("─")).toBe("<theme:fg:border>─</theme:fg:border>");
    expect(uiTheme.border("─", "accent")).toBe("<theme:fg:accent>─</theme:fg:accent>");
  });
});
