import { defineWidget } from "../types.js";

export const FlexSeparatorWidget = defineWidget({
  type: "flex-separator",
  label: "Flex Separator",
  category: "Custom/Layout",
  description: "Push following widgets to the right",
  dependencies: [],
  baseOptions: [],
  baseOptionDefaults: {},
  properties: [
    {
      id: "hideWhenEmpty",
      label: "Hide when empty",
      kind: "boolean",
      description: "Hide empty flex separator output",
      default: true,
      options: {
        // Hidden implementation detail: flex separators are structural and should not render text,
        // while the visible UI remains only Enabled as it was before migration.
        showInFields: false,
        showInWidgets: false,
        showInColors: false,
      },
    },
  ],
  icons: { emoji: "", nerd: "", text: "" },
  defaultStyle: { fg: "default", bg: "default", bold: false },
  render({ renderWidget }) {
    return renderWidget("");
  },
});
