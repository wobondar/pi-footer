import { WIDGET_SEPARATOR_VALUES, widgetSeparatorText } from "../../separators.js";
import { defineWidget } from "../types.js";

export const SeparatorWidget = defineWidget({
  type: "separator",
  label: "Separator",
  category: "Custom/Layout",
  description: "Predefined or custom separator segment",
  dependencies: [],
  baseOptions: [],
  baseOptionDefaults: {},
  properties: [
    {
      id: "hideWhenEmpty",
      label: "Hide when empty",
      kind: "boolean",
      description: "Hide empty separator output",
      default: true,
      options: {
        // Hidden implementation detail: `separator=none` and empty custom text must render no segment,
        // while the visible UI remains only Enabled/Separator/Text as it was before migration.
        showInFields: false,
        showInWidgets: false,
        showInColors: false,
      },
    },
    {
      id: "separator",
      label: "Separator",
      kind: "choice",
      description: "Separator style",
      default: "pipe",
      options: {
        choices: WIDGET_SEPARATOR_VALUES.map((id) => ({ id, label: id, list: id })),
        listProperty: "separator",
        showInColors: true,
      },
    },
    {
      id: "text",
      label: "Text",
      kind: "text",
      description: "Custom separator text",
      default: "|",
      showWhen: { property: "separator", equals: "custom" },
      options: {
        quoteValue: true,
        showInColors: true,
      },
    },
  ],
  icons: { emoji: "", nerd: "", text: "" },
  defaultStyle: { fg: "default", bg: "default", bold: false },
  render({ options, renderWidget }) {
    return renderWidget(widgetSeparatorText(options.separator, options.text));
  },
});
