import { defineWidget } from "../types.js";

export const GitCleanStatusWidget = defineWidget({
  type: "git-clean",
  label: "Git Clean Status",
  category: "Git",
  description: "Clean/dirty state",
  dependencies: ["git"],
  baseOptions: ["raw", "hideWhenEmpty", "icon", "text"],
  baseOptionDefaults: { text: "" },
  properties: [],
  icons: { emoji: "✅", nerd: "󰄬", text: "git" },
  defaultStyle: { fg: "green", bg: "default", bold: false },
  render({ ctx, renderWidget }) {
    if (!ctx.git.isRepo) return renderWidget("");
    const changes = ctx.git.staged + ctx.git.unstaged + ctx.git.untracked;
    return renderWidget(changes === 0 ? "clean" : "dirty");
  },
});
