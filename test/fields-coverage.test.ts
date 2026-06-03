import { describe, expect, it } from "vitest";

import { createHydratedWidgetForTest } from "./helpers/widgets.js";
import {
  colorFieldValue,
  colorFields,
  fieldValue,
  fieldsForWidget,
  formatWidgetColorOptions,
  formatWidgetOptions,
  getTextField,
  isMetadataPropertyVisible,
} from "../src/ui/fields.js";
import type { ColorOptionField, OptionField } from "../src/ui/model.js";
import { registry } from "../src/widgets/registry.js";
import type { WidgetProperty } from "../src/widgets/types.js";

const optionField = (id: string, kind: OptionField["kind"] = "text"): OptionField => ({
  id,
  label: id,
  kind,
});
const colorField = (id: ColorOptionField["id"]): ColorOptionField => ({
  id,
  label: id,
  kind: "color",
});

describe("field helpers coverage", () => {
  it("builds fields for special widget families", () => {
    expect(
      fieldsForWidget(createHydratedWidgetForTest("custom-text")).map((field) => field.id),
    ).toEqual(["enabled", "text"]);
    expect(fieldsForWidget(createHydratedWidgetForTest("spacer")).map((field) => field.id)).toEqual(
      ["enabled", "width"],
    );
  });

  it("honors metadata showWhen conditions", () => {
    const conditionalProperty = {
      id: "detail",
      label: "Detail",
      kind: "text",
      description: "Only visible in detailed mode",
      default: "",
      showWhen: { property: "mode", equals: "detailed" },
    } satisfies WidgetProperty;

    expect(isMetadataPropertyVisible(conditionalProperty, { mode: "detailed" })).toBe(true);
    expect(isMetadataPropertyVisible(conditionalProperty, { mode: "compact" })).toBe(false);
    expect(isMetadataPropertyVisible(conditionalProperty, {})).toBe(false);
    expect(
      isMetadataPropertyVisible(
        {
          id: "always",
          label: "Always",
          kind: "boolean",
          description: "Always visible",
          default: false,
        },
        { mode: "compact" },
      ),
    ).toBe(true);
  });

  it("formats option, text, number, boolean, and color values", () => {
    const widget = createHydratedWidgetForTest("context-length", {
      raw: true,
      hideWhenZero: true,
      contextConditionalColors: true,
      contextWarningPercent: 75,
      contextDangerPercent: 95,
      warningFg: "ansi256:220",
      warningBg: "ansi256:230",
      dangerFg: "pi:error",
      dangerBg: "red",
      tokenFormatStyle: "compact",
      icon: "ctx=",
    });

    const tokenFormatField = fieldsForWidget(widget).find(
      (field) => field.id === "tokenFormatStyle",
    );

    expect(fieldValue(widget, optionField("enabled", "boolean"))).toBe("on");
    expect(fieldValue(widget, optionField("contextWarningPercent", "number"))).toBe("75");
    expect(tokenFormatField?.id).toBe("tokenFormatStyle");
    expect(fieldValue(widget, tokenFormatField ?? optionField("tokenFormatStyle", "choice"))).toBe(
      "Compact",
    );
    expect(colorFields(widget).map((field) => field.id)).toContain("dangerBgAnsi");
    expect(colorFieldValue(widget, colorField("bold"))).toBe("off");
    expect(colorFieldValue(widget, colorField("warningFg"))).toBe("ANSI256 220");
    expect(colorFieldValue(widget, colorField("warningFgAnsi"))).toBe("220");
    expect(colorFieldValue(widget, colorField("warningBgAnsi"))).toBe("230");
    expect(colorFieldValue(widget, colorField("dangerFg"))).toBe("Pi Error");
    expect(colorFieldValue(widget, colorField("dangerBgAnsi"))).toBe("0");
    expect(colorFieldValue(widget, colorField("fg"))).toBe("Bright Black");
    expect(colorFieldValue(widget, colorField("bg"))).toBe("Default");
    expect(colorFieldValue(widget, colorField("fgAnsi"))).toBe("0");
    expect(colorFieldValue(widget, colorField("bgAnsi"))).toBe("0");
    expect(colorFieldValue(widget, colorField("warningBg"))).toBe("ANSI256 230");
    expect(colorFieldValue(widget, colorField("dangerBg"))).toBe("Red");
    expect(colorFieldValue(widget, { id: "bold", label: "x", kind: "ansi" })).toBe("off");

    expect(fieldValue(widget, optionField("hideWhenZero", "boolean"))).toBe("on");
    expect(fieldValue(widget, optionField("showProvider", "boolean"))).toBe("off");
    expect(fieldValue(widget, optionField("contextConditionalColors", "boolean"))).toBe("on");
    expect(fieldValue(widget, optionField("width", "boolean"))).toBe("off");
    expect(fieldValue(widget, optionField("contextDangerPercent", "number"))).toBe("95");
    expect(
      fieldValue(
        createHydratedWidgetForTest("spacer", { width: 4 }),
        optionField("width", "number"),
      ),
    ).toBe("4");
    expect(getTextField(widget, "icon")).toBe("ctx=");
    expect(getTextField(widget, "width")).toBe("");
  });

  it("summarizes widget options", () => {
    expect(
      formatWidgetOptions(
        createHydratedWidgetForTest("context-length", { contextConditionalColors: true }),
      ),
    ).toContain("with-colors");
    expect(formatWidgetOptions(createHydratedWidgetForTest("spacer", { width: 3 }))).toContain(
      "width=3",
    );
    expect(
      formatWidgetColorOptions(
        createHydratedWidgetForTest("custom-text", { text: "hello", fg: "pi:success", bold: true }),
      ),
    ).toContain("text='hello'");
    expect(
      formatWidgetColorOptions(
        createHydratedWidgetForTest("separator", { separator: "custom", text: "/" }),
      ),
    ).toContain("text='/'");
  });

  it("uses the registry for widget definitions", () => {
    expect(registry.spec("model").label).toBe("Model");
    expect(registry.maybeSpec("missing")).toBeUndefined();
  });
});
