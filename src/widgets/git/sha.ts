import { defineWidget } from "../types.js";

export const GitShaWidget = defineWidget({
  type: "git-sha",
  label: "Git SHA",
  category: "Git",
  description: "Short HEAD commit SHA",
  dependencies: ["git"],
  baseOptions: ["raw", "hideWhenEmpty", "icon", "text"],
  baseOptionDefaults: { text: "" },
  properties: [],
  icons: { emoji: "🔖", nerd: "", text: "sha" },
  defaultStyle: { fg: "brightBlack", bg: "default", bold: false },
  render({ ctx, renderWidget }) {
    return renderWidget(ctx.git.sha ?? "");
  },
});
