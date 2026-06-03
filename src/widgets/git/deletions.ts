import { defineWidget } from "../types.js";

export const GitDeletionsWidget = defineWidget({
  type: "git-deletions",
  label: "Git Deletions",
  category: "Git",
  description: "Uncommitted deletion count",
  dependencies: ["git"],
  baseOptions: ["raw", "hideWhenZero", "icon", "text"],
  baseOptionDefaults: { text: "" },
  properties: [],
  icons: { emoji: "➖", nerd: "-", text: "del" },
  defaultStyle: { fg: "red", bg: "default", bold: false },
  render({ ctx, renderWidget }) {
    return renderWidget(`${ctx.git.deletions}`);
  },
});
