import { defineWidget } from "../types.js";

export const GitInsertionsWidget = defineWidget({
  type: "git-insertions",
  label: "Git Insertions",
  category: "Git",
  description: "Uncommitted insertion count",
  dependencies: ["git"],
  baseOptions: ["raw", "hideWhenZero", "icon", "text"],
  baseOptionDefaults: { text: "" },
  properties: [],
  icons: { emoji: "➕", nerd: "+", text: "ins" },
  defaultStyle: { fg: "green", bg: "default", bold: false },
  render({ ctx, renderWidget }) {
    return renderWidget(`${ctx.git.insertions}`);
  },
});
