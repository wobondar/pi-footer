import { defineWidget } from "../types.js";

export const GitRootDirWidget = defineWidget({
  type: "git-root",
  label: "Git Root Dir",
  category: "Git",
  description: "Repository root directory name",
  dependencies: ["git"],
  baseOptions: ["raw", "hideWhenEmpty", "icon", "text"],
  baseOptionDefaults: { text: "" },
  properties: [],
  icons: { emoji: "📦", nerd: "", text: "repo" },
  defaultStyle: { fg: "cyan", bg: "default", bold: false },
  render({ ctx, renderWidget }) {
    return renderWidget(ctx.git.root ?? "");
  },
});
