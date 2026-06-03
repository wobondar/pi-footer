import { defineWidget } from "../types.js";

export const GitStatusWidget = defineWidget({
  type: "git-status",
  label: "Git Status",
  category: "Git",
  description: "Staged/unstaged/untracked counts",
  dependencies: ["git"],
  baseOptions: ["raw", "hideWhenEmpty", "icon", "text"],
  baseOptionDefaults: { text: "" },
  properties: [],
  icons: { emoji: "🔀", nerd: "", text: "git" },
  defaultStyle: { fg: "yellow", bg: "default", bold: false },
  render({ ctx, renderWidget }) {
    return renderWidget(
      ctx.git.isRepo ? `+${ctx.git.staged} ±${ctx.git.unstaged} ?${ctx.git.untracked}` : "",
    );
  },
});
