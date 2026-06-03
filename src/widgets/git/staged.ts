import { defineWidget } from "../types.js";

export const GitStagedWidget = defineWidget({
  type: "git-staged",
  label: "Git Staged Files",
  category: "Git",
  description: "Staged file count",
  dependencies: ["git"],
  baseOptions: ["raw", "hideWhenZero", "icon", "text"],
  baseOptionDefaults: { text: "" },
  properties: [],
  icons: { emoji: "➕", nerd: "+", text: "staged" },
  defaultStyle: { fg: "green", bg: "default", bold: false },
  render({ ctx, renderWidget }) {
    return renderWidget(`${ctx.git.staged}`);
  },
});
