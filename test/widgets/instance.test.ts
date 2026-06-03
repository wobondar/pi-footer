import { describe, expect, it } from "vitest";

import { WidgetInstance } from "../../src/widgets/instance.js";
import type { WidgetSpecUnion } from "../../src/widgets/registry.js";
import type { WidgetContext } from "../../src/widgets/types.js";
import { defineWidget } from "../../src/widgets/types.js";

const TEST_ICONS = { emoji: "🧪", nerd: "T", text: "test" };

const spec = defineWidget({
  type: "model",
  label: "Spec Test",
  category: "Core",
  description: "Spec-backed test widget",
  dependencies: [],
  baseOptions: [],
  baseOptionDefaults: {},
  properties: [],
  icons: TEST_ICONS,
  defaultStyle: { fg: "default", bg: "default", bold: false },
  render({ options, renderWidget }) {
    const value = typeof options.text === "string" ? options.text : "value";
    return renderWidget(value);
  },
});

// TODO(widget-spec): replace this cast once WidgetInstance has a public test-spec path or registry-owned test fixture.
const widgetSpec = spec as unknown as WidgetSpecUnion;

const ctx = {
  iconMode: "text",
  minimalist: false,
  colorLevel: "none",
} satisfies WidgetContext;

describe("WidgetInstance", () => {
  it("uses WidgetInstance mutation and serialization behavior", () => {
    const widget = new WidgetInstance(widgetSpec, {
      id: "spec-1",
      type: "model",
      enabled: true,
      options: { text: "hello" },
    });

    widget.toggle(false);
    widget.update({ text: "updated" });

    expect(widget.id).toBe("spec-1");
    expect(widget.type).toBe("model");
    expect(widget.enabled).toBe(false);
    expect(widget.options.text).toBe("updated");
    expect(widget.toEntry()).toEqual({
      id: "spec-1",
      type: "model",
      enabled: false,
      options: { text: "updated" },
    });
  });

  it("renders through the shared widget render policy", () => {
    const widget = new WidgetInstance(widgetSpec, {
      id: "spec-1",
      type: "model",
      enabled: true,
      options: { text: "hello" },
    });

    expect(widget.render(ctx)).toBe("test hello");
    widget.update({ icon: "!" });
    expect(widget.render(ctx)).toBe("!hello");
    widget.update({ raw: true });
    expect(widget.render(ctx)).toBe("hello");
    widget.toggle(false);
    expect(widget.render(ctx)).toBeUndefined();
  });

  it("allows render options to override spec icons", () => {
    const overrideSpec = defineWidget({
      ...spec,
      render({ options, renderWidget }) {
        const value = typeof options.text === "string" ? options.text : "value";
        return renderWidget(value, { icons: { emoji: "O", nerd: "O", text: "override" } });
      },
    });
    const widget = new WidgetInstance(overrideSpec as unknown as WidgetSpecUnion, {
      id: "spec-override",
      type: "model",
      enabled: true,
      options: { text: "hello" },
    });

    expect(widget.render(ctx)).toBe("override hello");
  });

  it("preserves hidden empty behavior from WidgetInstance", () => {
    const hiddenSpec = defineWidget({
      ...spec,
      render({ renderWidget }) {
        return renderWidget(undefined);
      },
    });
    const widget = new WidgetInstance(hiddenSpec as unknown as WidgetSpecUnion, {
      id: "spec-2",
      type: "model",
      enabled: true,
      options: { hideWhenEmpty: true, text: "fallback" },
    });

    expect(widget.render(ctx)).toBeUndefined();
    widget.update({ hideWhenEmpty: false });
    expect(widget.render(ctx)).toBe("test fallback");
  });
});
