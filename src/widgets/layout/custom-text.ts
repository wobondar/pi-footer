import { defineWidget } from "../types.js";

export const CustomTextWidget = defineWidget({
  type: "custom-text",
  label: "Custom Text",
  category: "Custom/Layout",
  description: "User-defined text segment",
  dependencies: [],
  baseOptions: ["text"],
  // Custom text only exposes the shared `text` field, with a widget-specific default.
  baseOptionDefaults: { text: "custom" },
  properties: [],
  icons: { emoji: "", nerd: "", text: "" },
  defaultStyle: { fg: "default", bg: "default", bold: false },
  render({ options, renderWidget }) {
    return renderWidget(options.text);
  },
});
