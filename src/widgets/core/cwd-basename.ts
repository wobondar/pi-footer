import { basename } from "node:path";

import { defineWidget } from "../types.js";

export const CwdBasenameWidget = defineWidget({
  type: "cwd-basename",
  label: "Working Dir Name",
  category: "Core",
  description: "Current directory name",
  dependencies: ["cwd"],
  baseOptions: ["raw", "hideWhenEmpty", "icon", "text"],
  baseOptionDefaults: { text: "" },
  properties: [],
  icons: { emoji: "📂", nerd: "", text: "dir" },
  defaultStyle: { fg: "blue", bg: "default", bold: false },
  render({ ctx, renderWidget }) {
    return renderWidget(basename(ctx.cwd));
  },
});
