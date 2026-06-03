import { defineWidget } from "../types.js";

export const SpacerWidget = defineWidget({
  type: "spacer",
  label: "Spacer",
  category: "Custom/Layout",
  description: "Fixed-width blank spacer",
  dependencies: [],
  baseOptions: [],
  baseOptionDefaults: {},
  properties: [
    {
      id: "width",
      label: "Width",
      kind: "number",
      description: "Spacer width",
      default: 2,
      options: {
        min: 1,
        max: 40,
        listProperty: "width",
        showInColors: true,
      },
    },
  ],
  icons: { emoji: "", nerd: "", text: "" },
  defaultStyle: { fg: "default", bg: "default", bold: false },
  render({ options, renderWidget }) {
    return renderWidget(" ".repeat(options.width));
  },
});
