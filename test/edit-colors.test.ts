import { describe, expect, it } from "vitest";

import { createHydratedWidgetForTest } from "./helpers/widgets.js";
import { editColorsFieldRows, editColorsTitle } from "../src/ui/edit-colors.js";

describe("edit colors UI", () => {
  it("formats title", () => {
    expect(editColorsTitle(createHydratedWidgetForTest("model"))).toBe("Colors / Model");
  });

  it("formats color field rows", () => {
    expect(
      editColorsFieldRows(createHydratedWidgetForTest("model", { fg: "blue", bold: true })),
    ).toContain("Foreground: Blue");
    expect(
      editColorsFieldRows(createHydratedWidgetForTest("runtime", { fg: "pi:accent" })),
    ).toEqual(expect.arrayContaining(["Foreground: Pi Accent", "Background: Default"]));
  });
});
