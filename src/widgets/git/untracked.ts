import { defineWidget } from "../types.js";

export const GitUntrackedWidget = defineWidget({
  type: "git-untracked",
  label: "Git Untracked Files",
  category: "Git",
  description: "Untracked file count",
  dependencies: ["git"],
  baseOptions: ["raw", "hideWhenZero", "icon", "text"],
  baseOptionDefaults: { text: "" },
  properties: [],
  icons: { emoji: "❓", nerd: "?", text: "untracked" },
  defaultStyle: { fg: "red", bg: "default", bold: false },
  render({ ctx, renderWidget }) {
    return renderWidget(`${ctx.git.untracked}`);
  },
});
