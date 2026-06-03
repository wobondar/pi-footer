import { describe, expect, it } from "vitest";

import { createHydratedWidgetForTest } from "./helpers/widgets.js";
import { applyOptionField } from "../src/ui/option-edit.js";
import type { OptionField } from "../src/ui/model.js";

const field = (id: OptionField["id"], kind: OptionField["kind"], extra = {}): OptionField => ({
  id,
  label: id,
  kind,
  ...extra,
});

describe("option field editing", () => {
  it("toggles widget enabled state", () => {
    const widget = createHydratedWidgetForTest("model");

    expect(applyOptionField(widget, field("enabled", "boolean"), 1)).toBe("changed");
    expect(widget.enabled).toBe(false);
  });

  it("toggles boolean options", () => {
    const widget = createHydratedWidgetForTest("model");
    const sessionName = createHydratedWidgetForTest("session-name", { hideWhenEmpty: false });
    const context = createHydratedWidgetForTest("context");
    const cached = createHydratedWidgetForTest("cache-read");

    applyOptionField(widget, field("raw", "boolean"), 1);
    applyOptionField(sessionName, field("hideWhenEmpty", "boolean"), 1);
    applyOptionField(widget, field("showProvider", "boolean"), 1);
    applyOptionField(cached, field("hideWhenZero", "boolean"), 1);
    applyOptionField(context, field("contextConditionalColors", "boolean"), 1);

    expect(widget.options.raw).toBe(true);
    expect(sessionName.options.hideWhenEmpty).toBe(true);
    expect(widget.options.showProvider).toBe(true);
    expect(cached.options.hideWhenZero).toBe(true);
    expect(context.options.contextConditionalColors).toBe(true);
  });

  it("clamps number options", () => {
    const widget = createHydratedWidgetForTest("cwd", { segments: 2 });
    const context = createHydratedWidgetForTest("context", {
      contextWarningPercent: 70,
      contextDangerPercent: 90,
    });
    const spacer = createHydratedWidgetForTest("spacer", { width: 2 });

    applyOptionField(widget, field("segments", "number", { min: 1, max: 3 }), 10);
    applyOptionField(context, field("contextWarningPercent", "number", { min: 0, max: 100 }), 40);

    applyOptionField(spacer, field("width", "number", { min: 1, max: 3 }), -10);
    applyOptionField(context, field("contextDangerPercent", "number", { min: 0, max: 100 }), -100);

    expect(widget.options.segments).toBe(3);
    expect(spacer.options.width).toBe(1);
    expect(context.options.contextWarningPercent).toBe(100);
    expect(context.options.contextDangerPercent).toBe(0);
  });

  it("cycles separator options", () => {
    const widget = createHydratedWidgetForTest("separator", { separator: "pipe" });

    applyOptionField(widget, field("separator", "choice"), 1);

    expect(widget.options.separator).toBe("space");
  });

  it("cycles cwd display styles", () => {
    const widget = createHydratedWidgetForTest("cwd");

    applyOptionField(widget, field("cwdDisplayStyle", "choice"), 1);

    expect(widget.options.cwdDisplayStyle).toBe("full-home");
  });

  it("cycles context bar display modes", () => {
    const widget = createHydratedWidgetForTest("context-bar");

    applyOptionField(widget, field("contextBarMode", "choice"), 1);

    expect(widget.options.contextBarMode).toBe("short");
  });

  it("cycles git branch display styles", () => {
    const widget = createHydratedWidgetForTest("git-branch");

    applyOptionField(widget, field("gitBranchDisplayStyle", "choice"), 1);

    expect(widget.options.gitBranchDisplayStyle).toBe("round-brackets");
  });

  it("cycles token format styles", () => {
    const tokens = createHydratedWidgetForTest("tokens");

    applyOptionField(tokens, field("tokenFormatStyle", "choice"), 1);

    expect(tokens.options.tokenFormatStyle).toBe("compact");
  });

  it("edits runtime metadata options generically", () => {
    const widget = createHydratedWidgetForTest("runtime");

    applyOptionField(widget, field("style", "choice"), 1);
    applyOptionField(widget, field("displayVersion", "boolean"), 1);

    expect(widget.options.style).toBe("default");
    expect(widget.options.displayVersion).toBe(false);
  });

  it("cycles git diff display modes", () => {
    const widget = createHydratedWidgetForTest("git-diff");

    applyOptionField(widget, field("gitDiffMode", "choice"), 1);

    expect(widget.options.gitDiffMode).toBe("compact");
  });

  it("returns unchanged for fields without simple handling", () => {
    expect(applyOptionField(createHydratedWidgetForTest("model"), field("icon", "text"), 1)).toBe(
      "unchanged",
    );
  });
});
