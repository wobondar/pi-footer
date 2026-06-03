import { defineWidget } from "../types.js";

export const GitAheadBehindWidget = defineWidget({
  type: "git-ahead-behind",
  label: "Git Ahead/Behind",
  category: "Git",
  description: "Ahead/behind upstream counts",
  dependencies: ["git"],
  baseOptions: ["raw", "hideWhenEmpty", "icon", "text"],
  baseOptionDefaults: { text: "" },
  properties: [],
  icons: { emoji: "↕️", nerd: "󰦻", text: "upstream" },
  defaultStyle: { fg: "cyan", bg: "default", bold: false },
  render({ ctx, renderWidget }) {
    return renderWidget(ctx.git.isRepo ? `↑${ctx.git.ahead} ↓${ctx.git.behind}` : "");
  },
});
