import { defineWidget } from "../types.js";

export const GitUnstagedWidget = defineWidget({
  type: "git-unstaged",
  label: "Git Unstaged Files",
  category: "Git",
  description: "Unstaged file count",
  dependencies: ["git"],
  baseOptions: ["raw", "hideWhenZero", "icon", "text"],
  baseOptionDefaults: { text: "" },
  properties: [],
  icons: { emoji: "📝", nerd: "±", text: "unstaged" },
  defaultStyle: { fg: "yellow", bg: "default", bold: false },
  render({ ctx, renderWidget }) {
    return renderWidget(`${ctx.git.unstaged}`);
  },
});
